const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../button-feedback.js'), 'utf8');

function setup() {
  const handlers = {};
  const timers = new Map();
  let now = 0;
  let id = 0;
  const listen = (type, fn) => { handlers[type] = fn; };
  const motion = { matches: false, addEventListener: listen };
  const document = { hidden: false, addEventListener: listen };
  vm.runInNewContext(source, {
    document,
    window: { matchMedia: () => motion, addEventListener: listen },
    performance: { now: () => now },
    setTimeout: (fn, delay) => { timers.set(++id, { fn, time: now + delay }); return id; },
    clearTimeout: (key) => timers.delete(key),
  });
  function button({ disabled = false, link = false } = {}) {
    const classes = new Set();
    return {
      classes,
      classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) },
      setAttribute() {},
      closest(selector) { return selector === 'a' ? (link ? this : null) : this; },
      matches: () => disabled,
    };
  }
  return {
    button, motion, document,
    fire: (type, target, extra = {}) => handlers[type]({
      target, button: 0, isPrimary: true, pointerId: 1, clientX: 0, clientY: 0, ...extra,
    }),
    advance(ms) {
      now += ms;
      for (const [key, timer] of timers) {
        if (timer.time <= now) { timers.delete(key); timer.fn(); }
      }
    },
  };
}

test('quick touch remains visible for 140ms then releases', () => {
  const env = setup();
  const b = env.button();
  env.fire('pointerdown', b, { pointerType: 'touch' });
  env.advance(20);
  env.fire('pointerup', b);
  env.advance(119);
  assert.ok(b.classes.has('is-pressed'));
  env.advance(1);
  assert.ok(!b.classes.has('is-pressed'));
});

test('scroll gestures and cancelled touches clear feedback', () => {
  const env = setup();
  const b = env.button();
  env.fire('pointerdown', b);
  env.fire('pointermove', b, { clientY: 11 });
  assert.equal(b.classes.size, 0);
  env.fire('pointerdown', b);
  env.fire('pointercancel', b);
  assert.equal(b.classes.size, 0);
});

test('new taps and focus transfer do not inherit old release timers', () => {
  const env = setup();
  const a = env.button();
  const b = env.button();
  env.fire('pointerdown', a);
  env.fire('pointerup', a);
  env.advance(50);
  env.fire('pointerdown', b);
  env.fire('focusout', a);
  env.advance(100);
  assert.equal(a.classes.size, 0);
  assert.ok(b.classes.has('is-pressed'));
  env.fire('blur', b);
  assert.equal(b.classes.size, 0);
});

test('disabled controls, secondary pointers and reduced motion are excluded', () => {
  const env = setup();
  const disabled = env.button({ disabled: true });
  env.fire('pointerdown', disabled);
  assert.equal(disabled.classes.size, 0);
  const b = env.button();
  env.fire('pointerdown', b, { isPrimary: false });
  assert.equal(b.classes.size, 0);
  env.motion.matches = true;
  env.fire('pointerdown', b);
  assert.equal(b.classes.size, 0);
});

test('keyboard activation works and Space on links does not animate', () => {
  const env = setup();
  const b = env.button();
  env.fire('keydown', b, { key: 'Enter' });
  assert.ok(b.classes.has('is-pressed'));
  env.fire('keyup', b, { key: 'Enter' });
  env.advance(140);
  assert.equal(b.classes.size, 0);
  const link = env.button({ link: true });
  env.fire('keydown', link, { key: ' ' });
  assert.equal(link.classes.size, 0);
});
