const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../../liquid-glass.js'), 'utf8');

function setup() {
  const classes = new Set(), calls = [], callbacks = [];
  const motion = {matches: false};
  const context = {setTransform() {}, fillRect() {}, drawImage(...args) {calls.push(args);}};
  const canvas = {setAttribute() {}, getContext: () => context};
  const panel = {classList: {add: c => classes.add(c), remove: c => classes.delete(c)},
    prepend() {}, getBoundingClientRect: () => ({width: 320, height: 54, left: 40, top: 24})};
  const pageClasses = new Set();
  const page = {querySelectorAll: () => [panel], classList: {contains: c => pageClasses.has(c)}};
  const source = {width: 800, height: 1200};
  const document = {hidden: false, querySelector: () => page, getElementById: () => source, createElement: () => canvas};
  vm.runInNewContext(code, {document, matchMedia: () => motion, devicePixelRatio: 2,
    innerWidth: 400, innerHeight: 600, performance: {now: () => 0},
    requestAnimationFrame: fn => callbacks.push(fn)});
  return {classes, calls, motion, document, pageClasses, context, canvas,
    tick: now => callbacks.shift()(now)};
}

test('glass samples live scene with non-identity edge mapping and capped DPR', () => {
  const e = setup(); e.tick(0);
  assert.ok(e.classes.has('has-refraction'));
  assert.equal(e.canvas.width, 480);
  assert.ok(e.calls.length > 0);
  assert.ok(e.calls.flatMap(c => c.slice(1)).every(Number.isFinite));
  assert.notEqual(e.calls[0][1], 80);
  const count = e.calls.length;
  e.tick(10); assert.equal(e.calls.length, count);
  e.tick(40); assert.ok(e.calls.length > count);
});

test('glass suspends on hidden pages, project/CV views and reduced transparency', () => {
  const e = setup(); e.tick(0);
  const count = e.calls.length;
  e.document.hidden = true; e.tick(40);
  assert.equal(e.calls.length, count);
  assert.ok(!e.classes.has('has-refraction'));
  e.document.hidden = false;
  for (const c of ['is-project', 'is-cv']) {
    e.pageClasses.add(c); e.tick(80); assert.equal(e.calls.length, count); e.pageClasses.delete(c);
  }
  e.motion.matches = true; e.tick(120); assert.equal(e.calls.length, count);
  e.motion.matches = false; e.tick(160); assert.ok(e.classes.has('has-refraction'));
});

test('sampling failure leaves CSS fallback and does not break the render loop', () => {
  const e = setup(); e.context.drawImage = () => {throw new Error('unavailable');};
  assert.doesNotThrow(() => e.tick(0));
  assert.ok(!e.classes.has('has-refraction'));
  assert.doesNotThrow(() => e.tick(50));
});

test('both entry pages load versioned glass assets', () => {
  for (const name of ['index.html', 'sphere-embed.html']) {
    const html = fs.readFileSync(path.join(__dirname, '../..', name), 'utf8');
    assert.match(html, /liquid-glass\.js\?v=20260920-2/);
    assert.match(html, /liquid-glass\.css\?v=20260920-2/);
  }
});
