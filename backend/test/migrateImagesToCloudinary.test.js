const assert = require("node:assert/strict");
const test = require("node:test");
const { parseCheckpointContents } = require("../scripts/migrateImagesToCloudinary");

test("Cloudinary migration checkpoint restores completed uploads", () => {
  const contents = [
    JSON.stringify({
      type: "metadata",
      version: 1,
      neededFiles: ["first.png", "second.png"],
    }),
    JSON.stringify({ type: "uploaded", file: "first.png", url: "https://cloudinary.test/first.webp" }),
    "",
  ].join("\n");

  const checkpoint = parseCheckpointContents(contents);

  assert.deepEqual([...checkpoint.uploaded], [
    ["first.png", "https://cloudinary.test/first.webp"],
  ]);
  assert.equal(checkpoint.hasPartialLine, false);
});

test("Cloudinary migration checkpoint identifies an interrupted final entry", () => {
  const contents = [
    JSON.stringify({ type: "metadata", version: 1 }),
    JSON.stringify({ type: "uploaded", file: "first.png", url: "https://cloudinary.test/first.webp" }),
    '{"type":"uploaded","file":"second.png"',
  ].join("\n");

  const checkpoint = parseCheckpointContents(contents);

  assert.deepEqual([...checkpoint.uploaded], [
    ["first.png", "https://cloudinary.test/first.webp"],
  ]);
  assert.equal(checkpoint.hasPartialLine, true);
});
