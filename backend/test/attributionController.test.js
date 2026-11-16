const assert = require("node:assert/strict");
const { after, mock, test } = require("node:test");
const User = require("../models/User");
const { authorizeReport } = require("../controllers/attributionController");

const originalRoles = process.env.ATTRIBUTION_REPORT_ROLES;
let currentRole = "Siswa";
let lookups = 0;
mock.method(User, "findById", () => {
  lookups += 1;
  return {
    select() {
      return this;
    },
    lean: async () => ({ role: currentRole }),
  };
});

after(() => {
  mock.restoreAll();
  if (originalRoles === undefined) delete process.env.ATTRIBUTION_REPORT_ROLES;
  else process.env.ATTRIBUTION_REPORT_ROLES = originalRoles;
});

const callAuthorization = async () => {
  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let continued = false;
  await authorizeReport({ user: { id: "66a400000000000000000001" } }, response, () => {
    continued = true;
  });
  return { response, continued };
};

test("denies reports when developer/project-manager roles are not configured", async () => {
  delete process.env.ATTRIBUTION_REPORT_ROLES;
  lookups = 0;
  const { response, continued } = await callAuthorization();
  assert.equal(response.statusCode, 403);
  assert.equal(continued, false);
  assert.equal(lookups, 0);
});

test("allows only configured Developer or Project Manager database roles", async () => {
  process.env.ATTRIBUTION_REPORT_ROLES = "Developer, Project Manager";
  currentRole = "Admin";
  assert.equal((await callAuthorization()).continued, false);
  currentRole = "Developer";
  assert.equal((await callAuthorization()).continued, true);
  currentRole = "Project Manager";
  assert.equal((await callAuthorization()).continued, true);
  currentRole = "Siswa";
  assert.equal((await callAuthorization()).continued, false);
});

test("rejects attempts to configure an unrelated role for reports", async () => {
  process.env.ATTRIBUTION_REPORT_ROLES = "Admin";
  const { response, continued } = await callAuthorization();
  assert.equal(response.statusCode, 403);
  assert.equal(continued, false);
});
