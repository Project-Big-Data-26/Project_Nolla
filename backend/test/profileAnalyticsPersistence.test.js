const assert = require("node:assert/strict");
const { test, beforeEach, after, mock } = require("node:test");
const User = require("../models/User");
const AnalyticsIdentity = require("../models/AnalyticsIdentity");
const AnalyticsEvent = require("../models/AnalyticsEvent");

// Writer analytics sungguhan, dengan seluruh akses database diganti.
// File test dijalankan pada proses tersendiri oleh node --test.
const previousEnabled = process.env.ANALYTICS_ENABLED;
const previousEnvironment = process.env.ANALYTICS_ENVIRONMENT;
let user, saved, failStore, stored, attemptedWrites, identityLookups;

mock.method(User, "findById", async () => user);
mock.method(AnalyticsIdentity, "findOneAndUpdate", async () => {
  identityLookups++;
  return { analytics_user_id: "usr_profile_unit_test" };
});
mock.method(AnalyticsEvent.collection, "bulkWrite", async (operations) => {
  attemptedWrites++;
  if (failStore) throw new Error("Simulated event store failure");
  stored.push(...operations.map((operation) => operation.insertOne.document));
});
const { updateProfile } = require("../controllers/profileController");

beforeEach(() => {
  process.env.ANALYTICS_ENABLED = "true";
  process.env.ANALYTICS_ENVIRONMENT = "unit_test";
  saved = false;
  failStore = false;
  stored = [];
  attemptedWrites = 0;
  identityLookups = 0;
  user = {
    _id: "66a400000000000000000100",
    name: "Tester",
    allJenjang: false,
    jenjang_id: "66a400000000000000000003",
    async save() { saved = true; return this; },
    async populate() { return this; },
  };
});
after(() => {
  mock.restoreAll();
  if (previousEnabled === undefined) delete process.env.ANALYTICS_ENABLED;
  else process.env.ANALYTICS_ENABLED = previousEnabled;
  if (previousEnvironment === undefined) delete process.env.ANALYTICS_ENVIRONMENT;
  else process.env.ANALYTICS_ENVIRONMENT = previousEnvironment;
});

const saveAllLevels = async () => {
  const req = {
    user: { id: user._id }, body: { allJenjang: true },
    requestId: "request_profile_unit", learningSessionId: "session_profile_unit", pageInstanceId: "page_profile_unit",
  };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await updateProfile(req, res);
  return res;
};

test("PATCH profil: writer nyata membangun envelope server dengan properti yang dibatasi", async () => {
  assert.equal((await saveAllLevels()).statusCode, 200);
  assert.equal(saved, true);
  assert.equal(stored.length, 1);
  const event = stored[0];
  assert.equal(event.event_name, "personalization_saved");
  assert.equal(event.event_source, "server");
  assert.equal(event.analytics_user_id, "usr_profile_unit_test");
  assert.equal(event.environment, "unit_test");
  assert.equal(event.request_id, "request_profile_unit");
  assert.equal(event.learning_session_id, "session_profile_unit");
  assert.equal(event.page_instance_id, "page_profile_unit");
  assert.deepEqual(event.properties, { selected_jenjang: null, all_jenjang: true, entry_context: "profile" });
});

test("PATCH profil: analytics nonaktif tetap menyimpan profil tanpa akses event store", async () => {
  process.env.ANALYTICS_ENABLED = "false";
  assert.equal((await saveAllLevels()).statusCode, 200);
  assert.equal(saved, true);
  assert.equal(identityLookups, 0);
  assert.equal(attemptedWrites, 0);
  assert.equal(stored.length, 0);
});

test("PATCH profil: event store gagal tidak membatalkan penyimpanan profil", async () => {
  failStore = true;
  assert.equal((await saveAllLevels()).statusCode, 200);
  assert.equal(saved, true);
  assert.equal(user.allJenjang, true);
  assert.equal(attemptedWrites, 1);
  assert.equal(stored.length, 0);
});
