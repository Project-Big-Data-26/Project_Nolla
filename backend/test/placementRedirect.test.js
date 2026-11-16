const assert = require("node:assert/strict");
const { after, test } = require("node:test");
const express = require("express");
const { redirectToPlacement } = require("../controllers/placementRedirectController");
const placementRedirectRoutes = require("../routes/placementRedirectRoutes");
const http = require("node:http");

const previousPlacements = process.env.ATTRIBUTION_PLACEMENTS_JSON;
process.env.ATTRIBUTION_PLACEMENTS_JSON =
  '{"smpn_01_bandung":"SMPN 1 Bandung","smpn_02_bandung":"SMPN 2 Bandung"}';

after(() => {
  if (previousPlacements === undefined) {
    delete process.env.ATTRIBUTION_PLACEMENTS_JSON;
  } else {
    process.env.ATTRIBUTION_PLACEMENTS_JSON = previousPlacements;
  }
});

const response = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  redirect(code, location) {
    this.statusCode = code;
    this.location = location;
    return this;
  },
});

test("redirects each registered school code to its unique long UTM URL", () => {
  const res = response();
  redirectToPlacement({ params: { placement: "smpn_02_bandung" } }, res);

  assert.equal(res.statusCode, 302);
  const target = new URL(res.location, "https://nolla.id");
  assert.equal(target.pathname, "/");
  assert.deepEqual(Object.fromEntries(target.searchParams), {
    utm_source: "school_visit",
    utm_medium: "poster_qr",
    utm_campaign: "promosi_nolla",
    utm_content: "poster",
    placement_id: "smpn_02_bandung",
  });
});

test("does not redirect unknown or malformed placement identifiers", () => {
  for (const placement of ["smpn_99_bandung", "https://evil.example", "../admin"]) {
    const res = response();
    redirectToPlacement({ params: { placement } }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.location, undefined);
  }
});

test("serves the short link through the mounted /go/:placement route", async (t) => {
  const app = express();
  app.use("/go", placementRedirectRoutes);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { statusCode, location } = await new Promise((resolve, reject) => {
    http
      .get(
        {
          hostname: "127.0.0.1",
          port: server.address().port,
          path: "/go/smpn_01_bandung",
        },
        (res) => {
          res.resume();
          resolve({ statusCode: res.statusCode, location: res.headers.location });
        },
      )
      .on("error", reject);
  });
  assert.equal(statusCode, 302);
  assert.match(location, /^\/\?utm_source=school_visit&/);
  assert.match(location, /placement_id=smpn_01_bandung/);
});
