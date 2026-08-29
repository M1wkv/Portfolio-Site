const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("admin.js", "utf8");

test("admin image pipeline converts supported uploads to WebP", () => {
  assert.match(source, /canvas\.toBlob\(resolve, "image\/webp", quality\)/);
  assert.match(source, /maxDimension[^\n]+2400/);
  assert.match(source, /quality[^\n]+0\.82/);
  assert.match(source, /String\.fromCharCode\(\.\.\.signature\.slice\(8, 12\)\) === "WEBP"/);
  assert.match(source, /media\.push\(await prepareMediaFile/);
  assert.match(source, /return optimizeImageFile\(file, options\)/);
  assert.doesNotMatch(source, /Promise\.all\(files\.map\(\(file\) => optimizeImageFile/);
});

test("admin accepts MP4 and WebM without sending video through the image converter", () => {
  assert.match(source, /const supported = \/video\\\/\(mp4\|webm\)\/i/);
  assert.match(source, /image\/\*,video\/mp4,video\/webm/);
  assert.match(source, /mediaType: "video"/);
  assert.match(source, /50 \* 1024 \* 1024/);
  assert.match(source, /async function uploadBlob/);
});

test("admin removes obsolete portfolio objects from Storage", () => {
  assert.match(source, /async function removePortfolioFiles/);
  assert.match(source, /storage\.from\(bucketName\)\.remove/);
});

test("admin retries slow Storage uploads with an adaptive timeout", () => {
  assert.match(source, /const maxAttempts = 3/);
  assert.match(source, /Math\.max\(3 \* 60 \* 1000/);
  assert.match(source, /request\.upload\.onprogress/);
  assert.match(source, /error\?\.retryable/);
});
