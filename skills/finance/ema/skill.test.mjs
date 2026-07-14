// Tests for finance/ema — hand-computed expected values.
import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

function assertClose(actual, expected, eps = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) < eps,
    `expected ${actual} to be within ${eps} of ${expected}`
  );
}

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/ema");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.source, "string");
});

test("happy path: prices [1..5], period 3", () => {
  // seed = SMA(1,2,3) = 2; k = 2/(3+1) = 0.5
  // i=3: 4*0.5 + 2*0.5 = 3
  // i=4: 5*0.5 + 3*0.5 = 4
  const { ema, latest } = run({ prices: [1, 2, 3, 4, 5], period: 3 });
  assert.deepEqual(ema, [2, 3, 4]);
  assert.equal(latest, 4);
});

test("hand-computed fractions: [10,20,30,40], period 2", () => {
  // seed = SMA(10,20) = 15; k = 2/3
  // i=2: 30*(2/3) + 15*(1/3) = 25
  // i=3: 40*(2/3) + 25*(1/3) = 105/3 = 35
  const { ema, latest } = run({ prices: [10, 20, 30, 40], period: 2 });
  assert.equal(ema.length, 3);
  assertClose(ema[0], 15);
  assertClose(ema[1], 25);
  assertClose(ema[2], 35);
  assertClose(latest, 35);
});

test("period 1: EMA equals the price series (k = 1)", () => {
  const prices = [3, 1, 4, 1, 5];
  const { ema, latest } = run({ prices, period: 1 });
  assert.deepEqual(ema, prices);
  assert.equal(latest, 5);
});

test("default period is 12", () => {
  // 12 constant prices -> single seed value equal to the constant.
  const twelve = Array(12).fill(5);
  const r1 = run({ prices: twelve });
  assert.deepEqual(r1.ema, [5]);
  assert.equal(r1.latest, 5);

  // Add a 13th price of 10: k = 2/13, next = 10*(2/13) + 5*(11/13) = 75/13
  const r2 = run({ prices: [...twelve, 10] });
  assert.equal(r2.ema.length, 2);
  assertClose(r2.ema[0], 5);
  assertClose(r2.ema[1], 75 / 13);
  assertClose(r2.latest, 75 / 13);
});

test("edge case: prices length exactly equals period -> single SMA seed", () => {
  const { ema, latest } = run({ prices: [2, 4, 6], period: 3 });
  assert.deepEqual(ema, [4]);
  assert.equal(latest, 4);
});

test("invalid inputs throw", () => {
  // too few prices
  assert.throws(() => run({ prices: [1, 2], period: 3 }), /length/);
  // bad period values
  assert.throws(() => run({ prices: [1, 2, 3], period: 0 }), /period/);
  assert.throws(() => run({ prices: [1, 2, 3], period: -2 }), /period/);
  assert.throws(() => run({ prices: [1, 2, 3], period: 1.5 }), /period/);
  // bad prices
  assert.throws(() => run({ prices: "not-an-array", period: 2 }), /array/);
  assert.throws(() => run({ prices: [1, NaN, 3], period: 2 }), /finite/);
  assert.throws(() => run({ prices: [1, "2", 3], period: 2 }), /finite/);
  // bad input container
  assert.throws(() => run(null), /object/);
  assert.throws(() => run(undefined), /object/);
});

test("sparse arrays (holes) are rejected, not silently NaN", () => {
  // .every skips holes, so a naive validator lets these through and the
  // output would be NaN. Must throw instead.
  assert.throws(() => run({ prices: [1, , 3], period: 2 }), /finite/);
  assert.throws(() => run({ prices: Array(3), period: 2 }), /finite/);
  assert.throws(() => run({ prices: [1, undefined, 3], period: 2 }), /finite/);
});

test("negative and zero prices compute correctly", () => {
  // seed = SMA(-1,-2,-3) = -2; k = 0.5
  // i=3: 0*0.5 + (-2)*0.5 = -1
  const { ema, latest } = run({ prices: [-1, -2, -3, 0], period: 3 });
  assert.deepEqual(ema, [-2, -1]);
  assert.equal(latest, -1);
});

test("hostile period values throw", () => {
  assert.throws(() => run({ prices: [1, 2, 3], period: Infinity }), /period/);
  assert.throws(() => run({ prices: [1, 2, 3], period: NaN }), /period/);
  assert.throws(() => run({ prices: [1, 2, 3], period: "2" }), /period/);
  assert.throws(() => run({ prices: [1, 2, 3], period: -0 }), /period/);
  // null period does NOT get the destructuring default -> must throw, not crash
  assert.throws(() => run({ prices: [1, 2, 3], period: null }), /period/);
});

test("non-object input containers throw", () => {
  assert.throws(() => run(42), /object/);
  assert.throws(() => run("prices"), /object/);
  // an array is typeof object but has no prices key
  assert.throws(() => run([1, 2, 3]), /array/);
});

test("determinism: same input yields identical output", () => {
  const input = { prices: [1, 2, 3, 4, 5, 6, 7, 8], period: 4 };
  assert.deepEqual(run(input), run(input));
});
