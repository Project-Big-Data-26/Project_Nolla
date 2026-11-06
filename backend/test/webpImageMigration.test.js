const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const {
  parseCloudinaryImageUrl,
  sourceUrlFor,
} = require("../scripts/convertCloudinaryImagesToWebp");
const { rewriteReferences } = require("../scripts/convertImagesToWebp");

test("Cloudinary image URL parsing preserves its public ID path", () => {
  assert.deepEqual(
    parseCloudinaryImageUrl(
      "https://res.cloudinary.com/nolla-math/image/upload/nolla/soal/images/question.png",
      "nolla-math",
    ),
    { publicId: "nolla/soal/images/question", ext: ".png" },
  );
});

test("Cloudinary image URL parsing skips delivery transformations and versions", () => {
  assert.deepEqual(
    parseCloudinaryImageUrl(
      "https://res.cloudinary.com/nolla-math/image/upload/f_auto,q_auto/v123/nolla/soal/images/question.jpg",
      "nolla-math",
    ),
    { publicId: "nolla/soal/images/question", ext: ".jpg" },
  );
});

test("Cloudinary image URL parsing rejects unrelated hosts and unsupported formats", () => {
  assert.equal(
    parseCloudinaryImageUrl("https://example.test/image.png", "nolla-math"),
    null,
  );
  assert.equal(
    parseCloudinaryImageUrl(
      "https://res.cloudinary.com/nolla-math/image/upload/nolla/soal/document.pdf",
      "nolla-math",
    ),
    null,
  );
});

test("relative MongoDB paths resolve to their existing Cloudinary asset", () => {
  assert.equal(
    sourceUrlFor("images/question.png", "nolla-math"),
    "https://res.cloudinary.com/nolla-math/image/upload/nolla/soal/images/question.png",
  );
});

test("static source references are rewritten only when the corresponding asset is in the conversion map", () => {
  const fixtureRoot = path.resolve("test-project", "frontend", "src");
  const sourceFile = path.join(fixtureRoot, "pages", "Home.jsx");
  const assetPath = path.join(fixtureRoot, "assets", "hero.png");
  const source = 'import hero from "../assets/hero.png";\nconst label = "not-an-image.png";';

  assert.equal(
    rewriteReferences(
      source,
      sourceFile,
      new Map([
        [
          path.normalize(assetPath),
          path.join(fixtureRoot, "assets", "hero.webp"),
        ],
      ]),
    ),
    'import hero from "../assets/hero.webp";\nconst label = "not-an-image.png";',
  );
});
