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

test("sphere click centers an image before opening its project", () => {
  assert.match(source, /function focusSphereItem\(item,index\)/);
  assert.match(source, /sphereProjectFocusSrc===hit\.item\.src&&sphereProjectFocusTarget>0/);
  assert.match(source, /else\{focusSphereItem\(hit\.item,hit\.index\);\}/);
});
