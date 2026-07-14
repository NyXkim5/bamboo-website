import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has required fields", () => {
  assert.equal(meta.id, "finance/momentum");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.equal(typeof meta.name, "string");
  assert.equal(typeof meta.description, "string");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("computes momentum with explicit period=1, upward trend", () => {
  // prices: [1, 2, 4, 7, 11]
  // momentum: [2-1, 4-2, 7-4, 11-7] = [1, 2, 3, 4]
  const out = run({ prices: [1, 2, 4, 7, 11], period: 1 });
  assert.deepEqual(out.momentum, [1, 2, 3, 4]);
  assert.equal(out.latest, 4);
  assert.equal(out.signal, "up");
});

test("computes momentum with period=2", () => {
  // prices: [10, 12, 11, 15, 9]
  // momentum: [11-10, 15-12, 9-11] = [1, 3, -2]
  const out = run({ prices: [10, 12, 11, 15, 9], period: 2 });
  assert.deepEqual(out.momentum, [1, 3, -2]);
  assert.equal(out.latest, -2);
  assert.equal(out.signal, "down");
});

test("flat signal when latest momentum is zero", () => {
  // prices: [5, 6, 5], period=2 -> momentum: [5-5] = [0]
  const out = run({ prices: [5, 6, 5], period: 2 });
  assert.deepEqual(out.momentum, [0]);
  assert.equal(out.latest, 0);
  assert.equal(out.signal, "flat");
});

test("default period is 10", () => {
  // 12 prices: 0..11 step 1 -> momentum with period 10: [10-0, 11-1] = [10, 10]
  const prices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const out = run({ prices });
  assert.deepEqual(out.momentum, [10, 10]);
  assert.equal(out.latest, 10);
  assert.equal(out.signal, "up");
});

test("handles negative and fractional prices", () => {
  // prices: [-1.5, 0.5, -0.25], period=1
  // momentum: [0.5 - (-1.5), -0.25 - 0.5] = [2, -0.75]
  const out = run({ prices: [-1.5, 0.5, -0.25], period: 1 });
  assert.deepEqual(out.momentum, [2, -0.75]);
  assert.equal(out.latest, -0.75);
  assert.equal(out.signal, "down");
});

test("throws when prices length is not greater than period", () => {
  assert.throws(() => run({ prices: [1, 2, 3], period: 3 }), RangeError);
  assert.throws(() => run({ prices: [], period: 1 }), RangeError);
});

test("throws on invalid inputs", () => {
  assert.throws(() => run(null), TypeError);
  assert.throws(() => run([1, 2, 3]), TypeError);
  assert.throws(() => run({ prices: "not an array" }), TypeError);
  assert.throws(() => run({ prices: [1, "2", 3], period: 1 }), TypeError);
  assert.throws(() => run({ prices: [1, NaN, 3], period: 1 }), TypeError);
  assert.throws(() => run({ prices: [1, 2, 3], period: 0 }), RangeError);
  assert.throws(() => run({ prices: [1, 2, 3], period: 1.5 }), RangeError);
  assert.throws(() => run({ prices: [1, 2, 3], period: -1 }), RangeError);
});

test("normalizes negative zero: -0 never appears in output", () => {
  // -0 - 0 = -0 in IEEE-754; output must be normalized to +0.
  const out = run({ prices: [0, -0], period: 1 });
  assert.ok(Object.is(out.momentum[0], 0), "momentum[0] must be +0, not -0");
  assert.ok(Object.is(out.latest, 0), "latest must be +0, not -0");
  assert.equal(out.signal, "flat");
});

test("ignores prototype-inherited keys (pollution-safe)", () => {
  // Inherited period: 0 must NOT shadow the default of 10.
  const input = Object.create({ period: 0 });
  input.prices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const out = run(input);
  assert.deepEqual(out.momentum, [10]);
  assert.equal(out.signal, "up");
  // Inherited prices must not be honored either.
  assert.throws(() => run(Object.create({ prices: [1, 2, 3] })), TypeError);
  // An object with no prototype at all still validates cleanly.
  assert.throws(() => run(Object.create(null)), TypeError);
});

test("rejects sparse arrays and non-finite prices", () => {
  // eslint-disable-next-line no-sparse-arrays
  assert.throws(() => run({ prices: [1, , 3], period: 1 }), TypeError);
  assert.throws(() => run({ prices: [1, Infinity, 3], period: 1 }), TypeError);
  assert.throws(() => run({ prices: [1, -Infinity, 3], period: 1 }), TypeError);
  assert.throws(() => run({ prices: [1, 2, 3], period: NaN }), RangeError);
  assert.throws(() => run({ prices: [1, 2, 3], period: Infinity }), RangeError);
  assert.throws(() => run({ prices: [1, 2, 3], period: -0 }), RangeError);
});

test("minimal boundary: prices.length === period + 1 yields one momentum value", () => {
  const out = run({ prices: [100, 97], period: 1 });
  assert.deepEqual(out.momentum, [-3]);
  assert.equal(out.latest, -3);
  assert.equal(out.signal, "down");
  // explicit undefined period falls back to the default of 10
  const prices = Array.from({ length: 11 }, (_, i) => i * 2);
  const out2 = run({ prices, period: undefined });
  assert.deepEqual(out2.momentum, [20]);
});

test("is pure: does not mutate input", () => {
  const prices = [3, 1, 4, 1, 5];
  const input = { prices, period: 2 };
  run(input);
  assert.deepEqual(prices, [3, 1, 4, 1, 5]);
  assert.equal(input.period, 2);
});
