const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("sphere.js", "utf8");
test("sphere loads a small initial image batch and schedules the rest", () => {
  assert.match(source, /initialCount=window\.innerWidth<768\?8:12/);
  assert.match(source, /requestIdleCallback/);
  assert.match(source, /slice\(cursor,cursor\+4\)/);
});
test("mobile canvas limits device pixel ratio", () => {
  assert.match(source, /mobileDpr=window\.innerWidth<768\?1\.35:2/);
});
