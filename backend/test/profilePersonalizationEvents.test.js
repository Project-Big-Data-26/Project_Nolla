const assert = require("node:assert/strict");
const { test, beforeEach, after, mock } = require("node:test");
const User = require("../models/User");
const Jenjang = require("../models/Jenjang");
const analytics = require("../services/analyticsService");

// Seluruh akses model dan writer diganti sebelum controller dimuat.
// Test ini tidak membuka koneksi database atau mengirim event sebenarnya.
const levels = ["SD", "SMP", "SMA"].map((name, index) => ({
  _id: `66a40000000000000000000${index + 1}`,
  name,
}));
const levelById = (id) => levels.find((level) => level._id === String(id?._id ?? id));
let fixture;
let writes;

mock.method(User, "findById", () => ({
  then: (resolve, reject) => Promise.resolve(fixture.user).then(resolve, reject),
  select() { return this; },
  lean: async () => fixture.user && { isProfileComplete: fixture.user.isProfileComplete },
}));
mock.method(User, "findByIdAndUpdate", async (_id, update) => {
  if (!fixture.user) return null;
  Object.assign(fixture.user, update);
  fixture.saved = true;
  return fixture.user;
});
mock.method(Jenjang, "findById", async (id) => levelById(id) ?? null);
mock.method(Jenjang, "findOne", async ({ name }) => levels.find((level) => (
  typeof name === "string" ? level.name === name : name.$regex.test(level.name)
)) ?? null);
mock.method(analytics, "recordServerEvents", async (context, events) => {
  writes.push({ context, events, savedAtWrite: fixture.saved });
});

const { updateProfile } = require("../controllers/profileController");
const { setPersonalization } = require("../controllers/personalizationController");

beforeEach(() => {
  writes = [];
  fixture = { saved: false, saveError: null };
  fixture.user = {
    _id: "66a400000000000000000100",
    name: "Tester",
    isProfileComplete: true,
    allJenjang: false,
    jenjang_id: levels[2]._id,
    avatar: "avatar_1",
    async save() {
      if (fixture.saveError) throw fixture.saveError;
      fixture.saved = true;
      return this;
    },
    async populate() {
      this.jenjang_id = levelById(this.jenjang_id) ?? null;
      return this;
    },
  };
});
after(() => mock.restoreAll());

const call = async (controller, body) => {
  const req = {
    user: { id: "66a400000000000000000100" },
    requestId: "request_profile_test",
    learningSessionId: "session_profile_test",
    pageInstanceId: "page_profile_test",
    body,
  };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await controller(req, res);
  return res;
};

const expectPreferenceEvent = (selected, all, entry = "profile") => {
  assert.equal(writes.length, 1, "Satu perubahan preferensi harus menulis satu event");
  assert.equal(writes[0].savedAtWrite, true, "Event hanya boleh ditulis setelah penyimpanan sukses");
  assert.equal(writes[0].context.userId, fixture.user._id);
  assert.equal(writes[0].context.learningSessionId, "session_profile_test");
  assert.equal(writes[0].context.pageInstanceId, "page_profile_test");
  assert.equal(writes[0].context.requestId, "request_profile_test");
  assert.equal(writes[0].events.length, 1);
  assert.equal(writes[0].events[0].name, "personalization_saved");
  assert.deepEqual(writes[0].events[0].properties, {
    selected_jenjang: selected,
    all_jenjang: all,
    entry_context: entry,
  });
};

for (const scenario of [
  { name: "SMA ke SMP", body: { jenjang_id: "SMP", allJenjang: false }, selected: "SMP", all: false },
  { name: "SMA ke Semua", body: { allJenjang: true }, selected: null, all: true },
  { name: "Semua ke SMA", fromAll: true, body: { jenjang_id: levels[2]._id, allJenjang: false }, selected: "SMA", all: false },
]) {
  test(`PATCH profil: ${scenario.name} menghasilkan event setelah tersimpan`, async () => {
    if (scenario.fromAll) Object.assign(fixture.user, { allJenjang: true, jenjang_id: null });
    const res = await call(updateProfile, scenario.body);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.allJenjang, scenario.all);
    assert.equal(res.body.data.jenjang_id?.name ?? null, scenario.selected);
    expectPreferenceEvent(scenario.selected, scenario.all);
  });
}

test("PATCH profil: perubahan nama/avatar dengan jenjang sama tidak membuat event preferensi", async () => {
  const res = await call(updateProfile, {
    name: "Tester Baru", avatar: "avatar_2", jenjang_id: "SMA", allJenjang: false,
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.name, "Tester Baru");
  assert.equal(res.body.data.avatar, "avatar_2");
  assert.equal(writes.length, 0);
});

test("PATCH profil: menyimpan preferensi sama tidak membuat event baru", async () => {
  const res = await call(updateProfile, { jenjang_id: "SMA", allJenjang: false });
  assert.equal(res.statusCode, 200);
  assert.equal(writes.length, 0);
});

test("PATCH profil: retry payload berhasil tidak menggandakan event perubahan", async () => {
  const body = { jenjang_id: "SMP", allJenjang: false };
  assert.equal((await call(updateProfile, body)).statusCode, 200);
  assert.equal((await call(updateProfile, body)).statusCode, 200);
  expectPreferenceEvent("SMP", false);
});

test("PATCH profil: jenjang tidak ditemukan tidak menyimpan atau mencatat event sukses", async () => {
  const res = await call(updateProfile, { jenjang_id: "TIDAK_ADA" });
  assert.equal(res.statusCode, 400);
  assert.equal(fixture.saved, false);
  assert.equal(writes.length, 0);
});

test("PATCH profil: akun tidak ditemukan tidak mencatat event sukses", async () => {
  fixture.user = null;
  const res = await call(updateProfile, { allJenjang: true });
  assert.equal(res.statusCode, 404);
  assert.equal(writes.length, 0);
});

test("PATCH profil: penyimpanan gagal tidak mencatat event sukses", async () => {
  fixture.saveError = new Error("Simulated database write failure");
  const res = await call(updateProfile, { allJenjang: true });
  assert.equal(res.statusCode, 500);
  assert.equal(fixture.saved, false);
  assert.equal(writes.length, 0);
});

for (const complete of [false, true]) {
  test(`POST personalisasi tetap mencatat konteks ${complete ? "profile" : "onboarding"}`, async () => {
    fixture.user.isProfileComplete = complete;
    const res = await call(setPersonalization, { educationLevel: "SMP" });
    assert.equal(res.statusCode, 200);
    expectPreferenceEvent("SMP", false, complete ? "profile" : "onboarding");
  });
}

test("PATCH profil: nama jenjang dinormalisasi tanpa memakai pola regex", async () => {
  const res = await call(updateProfile, { jenjang_id: " smp " });
  assert.equal(res.statusCode, 200);
  expectPreferenceEvent("SMP", false);
});

test("PATCH profil: nama/avatar saja tidak menghasilkan event personalisasi", async () => {
  const res = await call(updateProfile, { name: "Tester Baru", avatar: "avatar_2" });
  assert.equal(res.statusCode, 200);
  assert.equal(writes.length, 0);
});

test("PATCH profil: kembali ke jenjang semula tetap merupakan perubahan baru", async () => {
  assert.equal((await call(updateProfile, { allJenjang: true })).statusCode, 200);
  assert.equal((await call(updateProfile, { jenjang_id: "SMA", allJenjang: false })).statusCode, 200);
  assert.deepEqual(writes.map((write) => write.events[0].properties), [
    { selected_jenjang: null, all_jenjang: true, entry_context: "profile" },
    { selected_jenjang: "SMA", all_jenjang: false, entry_context: "profile" },
  ]);
});

test("PATCH profil: konteks Edit Profil tetap profile meski onboarding belum selesai", async () => {
  fixture.user.isProfileComplete = false;
  assert.equal((await call(updateProfile, { allJenjang: true })).statusCode, 200);
  expectPreferenceEvent(null, true, "profile");
});

test("PATCH profil: retry pilihan Semua tidak menghasilkan event tambahan", async () => {
  assert.equal((await call(updateProfile, { allJenjang: true })).statusCode, 200);
  assert.equal((await call(updateProfile, { allJenjang: true })).statusCode, 200);
  expectPreferenceEvent(null, true);
});

test("PATCH profil: tipe payload salah dan pola jenjang ditolak sebelum save/event", async () => {
  for (const body of [
    null, [], "SMA", { name: 123 }, { allJenjang: "true" },
    { allJenjang: null }, { jenjang_id: 123 }, { jenjang_id: { name: "SMA" } },
    { jenjang_id: "SM.*" }, { jenjang_id: "(" }, { jenjang_id: "SMA".repeat(20) },
  ]) {
    assert.equal((await call(updateProfile, body)).statusCode, 400);
    assert.equal(fixture.saved, false);
    assert.equal(writes.length, 0);
  }
});

test("PATCH profil: kegagalan validasi saat save tidak mencatat event sukses", async () => {
  fixture.saveError = Object.assign(new Error("Simulated validation failure"), { name: "ValidationError" });
  assert.equal((await call(updateProfile, { allJenjang: true })).statusCode, 400);
  assert.equal(writes.length, 0);
});

test("POST personalisasi: pilihan Semua tetap menghasilkan schema dan konteks yang sama", async () => {
  fixture.user.isProfileComplete = false;
  assert.equal((await call(setPersonalization, { skipAllJenjang: true })).statusCode, 200);
  expectPreferenceEvent(null, true, "onboarding");
});

test("POST personalisasi: tipe skipAllJenjang yang salah tidak mengubah preferensi", async () => {
  const res = await call(setPersonalization, { skipAllJenjang: "true" });
  assert.equal(res.statusCode, 400);
  assert.equal(fixture.saved, false);
  assert.equal(writes.length, 0);
});
