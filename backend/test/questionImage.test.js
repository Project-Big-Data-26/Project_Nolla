const assert = require("node:assert/strict");
const test = require("node:test");
const { toCloudinaryUrl, toPublicImageUrls } = require("../utils/questionImage");

const request = {
  protocol: "https",
  get: () => "api.example.test",
};

test("legacy image paths map to the matching Cloudinary asset without changing MongoDB", () => {
  assert.deepEqual(
    toPublicImageUrls(
      [
        "images/a.png",
        "soal/images/b 2.jpg",
        "public/soal/nolla/soal/images/c.webp",
        "https://res.cloudinary.com/other/image/upload/custom/image.png",
      ],
      request,
      { CLOUDINARY_CLOUD_NAME: "nolla-math" },
    ),
    [
      "https://res.cloudinary.com/nolla-math/image/upload/f_auto,q_auto/nolla/soal/images/a.png",
      "https://res.cloudinary.com/nolla-math/image/upload/f_auto,q_auto/nolla/soal/images/b%202.jpg",
      "https://res.cloudinary.com/nolla-math/image/upload/f_auto,q_auto/nolla/soal/images/c.webp",
      "https://res.cloudinary.com/other/image/upload/custom/image.png",
    ],
  );
});

test("legacy image paths keep using the local image endpoint when Cloudinary is not configured", () => {
  const originalSecret = process.env.IMAGE_TOKEN_SECRET;
  process.env.IMAGE_TOKEN_SECRET = "test-secret";

  try {
    const urls = toPublicImageUrls(["images/a.png"], request, {});
    assert.equal(urls.length, 1);
    assert.match(urls[0], /^https:\/\/api\.example\.test\/image\/[a-f0-9]{32}$/);
  } finally {
    if (originalSecret === undefined) delete process.env.IMAGE_TOKEN_SECRET;
    else process.env.IMAGE_TOKEN_SECRET = originalSecret;
  }
});

test("invalid paths and public ids are rejected", () => {
  assert.equal(toCloudinaryUrl("nolla-math", "../private.png"), null);
  assert.equal(toCloudinaryUrl("nolla-math", "images/file.svg"), null);
  assert.equal(toCloudinaryUrl("invalid cloud", "images/a.png"), null);
  assert.deepEqual(toPublicImageUrls(["not-an-image"], request, { CLOUDINARY_CLOUD_NAME: "nolla-math" }), []);
});
