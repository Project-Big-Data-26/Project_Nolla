const assert = require("node:assert/strict");
const test = require("node:test");
const {
  PlanConfigError,
  computePrice,
  isPremiumFeatureEnabled,
  loadPlanCatalog,
} = require("../config/premiumPlans");

const monthly = (extra = {}) => ({ PREMIUM_MONTHLY_PRICE: "49000", ...extra });

test("computePrice: tanpa diskon, flat, dan persentase dibulatkan ke rupiah terdekat", () => {
  assert.deepEqual(computePrice(49000, null), { price: 49000, discount: null, final_price: 49000 });
  assert.deepEqual(computePrice(49000, { type: "none", value: 0 }), {
    price: 49000,
    discount: null,
    final_price: 49000,
  });
  assert.deepEqual(computePrice(399000, { type: "flat", value: 100000 }), {
    price: 399000,
    discount: { type: "flat", value: 100000, amount: 100000 },
    final_price: 299000,
  });
  // 15% dari 49.900 = 7.485 (tepat); 12,5% dari 49.900 = 6.237,5 -> 6.238
  assert.equal(computePrice(49900, { type: "percentage", value: 15 }).final_price, 42415);
  assert.deepEqual(computePrice(49900, { type: "percentage", value: 12.5 }).discount, {
    type: "percentage",
    value: 12.5,
    amount: 6238,
  });
  assert.equal(computePrice(49900, { type: "percentage", value: 12.5 }).final_price, 43662);
});

test("katalog: urutan tetap, durasi hari, paket tanpa PRICE tidak ditawarkan", () => {
  assert.deepEqual(loadPlanCatalog({}), []);

  const catalog = loadPlanCatalog({
    PREMIUM_YEARLY_PRICE: "399000",
    PREMIUM_YEARLY_DISCOUNT_TYPE: "FLAT",
    PREMIUM_YEARLY_DISCOUNT_VALUE: " 100000 ",
    PREMIUM_WEEKLY_PRICE: "15000",
    PREMIUM_MONTHLY_PRICE: "49000",
    PREMIUM_MONTHLY_DISCOUNT_TYPE: "percentage",
    PREMIUM_MONTHLY_DISCOUNT_VALUE: "20",
  });
  assert.deepEqual(
    catalog.map((plan) => [plan.code, plan.duration_days, plan.price, plan.final_price]),
    [
      ["weekly", 7, 15000, 15000],
      ["monthly", 30, 49000, 39200],
      ["yearly", 365, 399000, 299000],
    ],
  );
  assert.equal(catalog[0].discount, null);
  assert.equal(catalog[0].name, "Premium Mingguan");

  assert.deepEqual(
    loadPlanCatalog(monthly({ PREMIUM_MONTHLY_DISCOUNT_TYPE: "none", PREMIUM_MONTHLY_DISCOUNT_VALUE: "0" }))
      .map((plan) => plan.final_price),
    [49000],
  );
});

const rejects = (env, pattern) =>
  assert.throws(() => loadPlanCatalog(env), (error) => {
    assert.ok(error instanceof PlanConfigError);
    assert.match(error.message, pattern);
    return true;
  });

test("env salah ditolak dengan nama variabel", () => {
  rejects({ PREMIUM_MONTHLY_PRICE: "0" }, /PREMIUM_MONTHLY_PRICE/);
  rejects({ PREMIUM_MONTHLY_PRICE: "49.000" }, /PREMIUM_MONTHLY_PRICE/);
  rejects({ PREMIUM_MONTHLY_PRICE: "-5" }, /PREMIUM_MONTHLY_PRICE/);
  rejects(monthly({ PREMIUM_MONTHLY_DISCOUNT_TYPE: "persen" }), /PREMIUM_MONTHLY_DISCOUNT_TYPE/);
  rejects(monthly({ PREMIUM_MONTHLY_DISCOUNT_TYPE: "percentage" }), /PREMIUM_MONTHLY_DISCOUNT_VALUE wajib/);
  rejects(monthly({ PREMIUM_MONTHLY_DISCOUNT_TYPE: "percentage", PREMIUM_MONTHLY_DISCOUNT_VALUE: "150" }), /percentage/);
  rejects(monthly({ PREMIUM_MONTHLY_DISCOUNT_TYPE: "percentage", PREMIUM_MONTHLY_DISCOUNT_VALUE: "100" }), /percentage/);
  rejects(monthly({ PREMIUM_MONTHLY_DISCOUNT_TYPE: "percentage", PREMIUM_MONTHLY_DISCOUNT_VALUE: "0" }), /percentage/);
  rejects(monthly({ PREMIUM_MONTHLY_DISCOUNT_TYPE: "percentage", PREMIUM_MONTHLY_DISCOUNT_VALUE: "12.345" }), /percentage/);
  rejects(monthly({ PREMIUM_MONTHLY_DISCOUNT_TYPE: "flat", PREMIUM_MONTHLY_DISCOUNT_VALUE: "49000" }), /flat/);
  rejects(monthly({ PREMIUM_MONTHLY_DISCOUNT_TYPE: "flat", PREMIUM_MONTHLY_DISCOUNT_VALUE: "1000.5" }), /flat/);
  rejects(monthly({ PREMIUM_MONTHLY_DISCOUNT_TYPE: "none", PREMIUM_MONTHLY_DISCOUNT_VALUE: "10" }), /=none/);
  rejects({ PREMIUM_WEEKLY_DISCOUNT_TYPE: "flat", PREMIUM_WEEKLY_DISCOUNT_VALUE: "1000" }, /PREMIUM_WEEKLY_PRICE kosong/);
  // Persentase yang membuat harga akhir 0 rupiah.
  rejects({ PREMIUM_WEEKLY_PRICE: "1", PREMIUM_WEEKLY_DISCOUNT_TYPE: "percentage", PREMIUM_WEEKLY_DISCOUNT_VALUE: "60" }, /kurang dari Rp1/);
});

test("semua kesalahan dilaporkan sekaligus tanpa mencetak nilai env", () => {
  assert.throws(
    () =>
      loadPlanCatalog({
        PREMIUM_WEEKLY_PRICE: "rahasia-123",
        PREMIUM_YEARLY_PRICE: "399000",
        PREMIUM_YEARLY_DISCOUNT_TYPE: "flat",
        PREMIUM_YEARLY_DISCOUNT_VALUE: "999999",
      }),
    (error) => {
      assert.match(error.message, /PREMIUM_WEEKLY_PRICE/);
      assert.match(error.message, /PREMIUM_YEARLY_DISCOUNT_VALUE/);
      assert.doesNotMatch(error.message, /rahasia-123|999999|399000/);
      return true;
    },
  );
});

test("saklar fitur paket: default aktif, nilai dikenal, nilai salah ditolak", () => {
  assert.equal(isPremiumFeatureEnabled({}), true);
  assert.equal(isPremiumFeatureEnabled({ PREMIUM_FEATURE_ENABLED: " " }), true);
  for (const value of ["true", "TRUE", "1", "on", " On "]) {
    assert.equal(isPremiumFeatureEnabled({ PREMIUM_FEATURE_ENABLED: value }), true, value);
  }
  for (const value of ["false", "False", "0", "off"]) {
    assert.equal(isPremiumFeatureEnabled({ PREMIUM_FEATURE_ENABLED: value }), false, value);
  }
  for (const value of ["yes", "nonaktif", "2"]) {
    assert.throws(() => isPremiumFeatureEnabled({ PREMIUM_FEATURE_ENABLED: value }), /PREMIUM_FEATURE_ENABLED/);
  }
});
