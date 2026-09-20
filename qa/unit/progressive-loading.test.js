const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("sphere.js", "utf8");
const styles = fs.readFileSync("sphere.css", "utf8");

test("sphere loads a small initial image batch and schedules the rest", () => {
  assert.match(source, /initialCount=window\.innerWidth<768\?8:12/);
  assert.match(source, /requestIdleCallback/);
  assert.match(source, /slice\(cursor,cursor\+4\)/);
});

test("mobile canvas limits device pixel ratio", () => {
  assert.match(source, /mobileDpr=window\.innerWidth<768\?1\.35:2/);
});

test("main sphere drag and inertia use inverted direction on both axes", () => {
  assert.match(source, /const sphereDragDirection=-1/);
  assert.match(source, /rotation\.y\+=dx\*0\.005\*sphereDragDirection/);
  assert.match(source, /rotation\.x\+=dy\*0\.005\*sphereDragDirection/);
  assert.match(source, /targetVelocity\.y\+=dx\*0\.000022\*sphereDragDirection/);
  assert.match(source, /targetVelocity\.x\+=dy\*0\.000022\*sphereDragDirection/);
});

test("sphere click centers an image before opening its project", () => {
  assert.match(source, /function focusSphereItem\(item,index\)/);
  assert.match(source, /sphereProjectFocusSrc===hit\.item\.src&&sphereProjectFocusTarget>0/);
  assert.match(source, /else\{focusSphereItem\(hit\.item,hit\.index\);\}/);
});

test("visible video cards autoplay muted", () => {
  assert.match(source, /document\.createElement\("video"\)/);
  assert.match(source, /img\.muted=true/);
  assert.match(source, /img\.loop=true/);
  assert.match(source, /img\.playsInline=true/);
  assert.match(source, /function syncVisibleVideoPlayback\(\)/);
  assert.match(source, /visibleVideoItems\.has\(item\)/);
});

test("opened project video restarts and plays with sound", () => {
  assert.match(source, /function openExpandedVideo\(item\)/);
  assert.match(source, /item\.img\.muted=false/);
  assert.match(source, /item\.img\.currentTime=0/);
  assert.match(source, /openExpandedVideo\(projectItems\[index\]\)/);
});

test("empty project timeline chips stay hidden", () => {
  assert.match(source, /projectTimeline\.hidden=!timeline\.period/);
  assert.match(source, /projectYear\.hidden=!timeline\.year/);
  assert.match(styles, /\.project-meta-time > \[hidden\][^}]+display: none !important/s);
});
