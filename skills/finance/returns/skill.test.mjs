import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

function assertCloseArray(actual, expected, eps = 1e-12) {
  assert.equal(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    assert.ok(
      Math.abs(actual[i] - expected[i]) < eps,
      `index ${i}: got ${actual[i]}, want ${expected[i]}`
    );
  }
}

test("meta has required fields", () => {
  assert.equal(meta.id, "finance/returns");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("simple returns, hand-computed values (default mode)", () => {
  // 100 -> 110: 110/100 - 1 = 0.10
  // 110 -> 99:  99/110 - 1 = -0.10
  // 99 -> 99:   0
  const out = run({ prices: [100, 110, 99, 99] });
  assert.equal(out.mode, "simple");
  assertCloseArray(out.returns, [0.1, -0.1, 0]);
});

test("log returns, hand-computed values", () => {
  // ln(2/1) = 0.6931471805599453
  // ln(4/2) = 0.6931471805599453
  // ln(2/4) = -0.6931471805599453
  const out = run({ prices: [1, 2, 4, 2], mode: "log" });
  assert.equal(out.mode, "log");
  assertCloseArray(out.returns, [
    0.6931471805599453,
    0.6931471805599453,
    -0.6931471805599453,
  ]);
});

test("explicit simple mode matches hand-computed values", () => {
  // 50 -> 55: 0.10 ; 55 -> 44: 44/55 - 1 = -0.2
  const out = run({ prices: [50, 55, 44], mode: "simple" });
  assert.equal(out.mode, "simple");
  assertCloseArray(out.returns, [0.1, -0.2]);
});

test("output length is prices.length - 1 and two-price series works", () => {
  const out = run({ prices: [200, 210] });
  assert.equal(out.returns.length, 1);
  assertCloseArray(out.returns, [0.05]);
});

test("log return exponentiates back to simple return + 1", () => {
  const prices = [3, 7, 5, 11];
  const simple = run({ prices, mode: "simple" }).returns;
  const log = run({ prices, mode: "log" }).returns;
  for (let i = 0; i < simple.length; i++) {
    assert.ok(Math.abs(Math.exp(log[i]) - (1 + simple[i])) < 1e-12);
  }
});

test("throws on invalid inputs", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run({}), Error); // missing prices
  assert.throws(() => run({ prices: "abc" }), Error); // not an array
  assert.throws(() => run({ prices: [100] }), Error); // length < 2
  assert.throws(() => run({ prices: [100, 0, 110] }), Error); // zero price
  assert.throws(() => run({ prices: [100, -5] }), Error); // negative price
  assert.throws(() => run({ prices: [100, NaN] }), Error); // non-finite
  assert.throws(() => run({ prices: [100, "110"] }), Error); // non-number
  assert.throws(() => run({ prices: [100, 110], mode: "weird" }), Error); // bad mode
});

test("edge: -0 price is rejected", () => {
  assert.throws(() => run({ prices: [100, -0] }), /must be > 0/);
  assert.throws(() => run({ prices: [-0, 100] }), /must be > 0/);
});

test("edge: extreme magnitudes keep log returns finite despite ratio overflow/underflow", () => {
  // 1e300 / 1e-300 = 1e600 overflows to Infinity; true log return = 600*ln(10).
  const out = run({ prices: [1e-300, 1e300, 1e-300], mode: "log" });
  const expected = 600 * Math.LN10; // 1381.5510557964274
  assertCloseArray(out.returns, [expected, -expected], 1e-9);
  assert.ok(out.returns.every(Number.isFinite));
  // Simple mode saturates honestly: value truly exceeds Number.MAX_VALUE.
  const simple = run({ prices: [1e-300, 1e300], mode: "simple" }).returns;
  assert.equal(simple[0], Infinity);
});

test("edge: exotic array with unstable index getter cannot poison output", () => {
  // Getter returns a valid price on the first (validation) read and NaN on
  // subsequent reads. A pure implementation must use the validated snapshot.
  const evil = [100, 0];
  let reads = 0;
  Object.defineProperty(evil, 1, {
    get() {
      reads++;
      return reads === 1 ? 110 : NaN;
    },
  });
  const out = run({ prices: evil });
  assertCloseArray(out.returns, [0.1]);
});

test("edge: prototype-less input object and inherited keys", () => {
  const bare = Object.create(null);
  bare.prices = [100, 110];
  bare.mode = "log";
  const out = run(bare);
  assert.equal(out.mode, "log");
  assertCloseArray(out.returns, [Math.log(1.1)]);
  // Inherited garbage on Object.prototype-style chains must not leak in:
  const proto = { mode: "weird" };
  const child = Object.create(proto);
  child.prices = [100, 110];
  // mode is inherited "weird" -> must be rejected, not silently defaulted.
  assert.throws(() => run(child), /mode must be/);
});

test("determinism: same input gives identical output", () => {
  const a = run({ prices: [10, 12, 9], mode: "log" });
  const b = run({ prices: [10, 12, 9], mode: "log" });
  assert.deepEqual(a, b);
});
