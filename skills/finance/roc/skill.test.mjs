// Tests for finance/roc — Rate of Change momentum oscillator.
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

function assertCloseArray(actual, expected, eps = 1e-9) {
  assert.equal(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    assert.ok(
      Math.abs(actual[i] - expected[i]) < eps,
      `index ${i}: got ${actual[i]}, expected ${expected[i]}`
    );
  }
}

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/roc");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("happy path: hand-computed ROC with period=2, rising signal", () => {
  // prices:            100  110  120  121  132
  // roc[0] = (120-100)/100*100 = 20
  // roc[1] = (121-110)/110*100 = 10
  // roc[2] = (132-120)/120*100 = 10
  const out = run({ prices: [100, 110, 120, 121, 132], period: 2 });
  assertCloseArray(out.roc, [20, 10, 10]);
  assert.ok(Math.abs(out.latest - 10) < 1e-9);
  assert.equal(out.signal, "rising");
});

test("falling signal with period=1 and negative ROC", () => {
  // roc[0] = (90-100)/100*100 = -10
  // roc[1] = (81-90)/90*100 = -10
  const out = run({ prices: [100, 90, 81], period: 1 });
  assertCloseArray(out.roc, [-10, -10]);
  assert.equal(out.latest, -10);
  assert.equal(out.signal, "falling");
});

test("flat signal when latest ROC is zero", () => {
  // roc = [(105-100)/100*100 = 5, (105-105)/105*100 = 0]
  const out = run({ prices: [100, 105, 105], period: 1 });
  assertCloseArray(out.roc, [5, 0]);
  assert.equal(out.latest, 0);
  assert.equal(out.signal, "flat");
});

test("default period is 12", () => {
  // 13 prices -> exactly one ROC value: (p[12]-p[0])/p[0]*100
  const prices = [200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 250];
  const out = run({ prices });
  assertCloseArray(out.roc, [25]); // (250-200)/200*100
  assert.equal(out.latest, 25);
  assert.equal(out.signal, "rising");
});

test("edge case: length exactly period+1 yields single-element series", () => {
  const out = run({ prices: [50, 60, 66], period: 2 });
  assertCloseArray(out.roc, [32]); // (66-50)/50*100
  assert.equal(out.signal, "rising");
});

test("invalid input throws", () => {
  assert.throws(() => run(null), /object/);
  assert.throws(() => run({ prices: "nope" }), /array/);
  assert.throws(() => run({ prices: [1, 2, 3], period: 0 }), /period/);
  assert.throws(() => run({ prices: [1, 2, 3], period: 1.5 }), /period/);
  // length must be strictly greater than period
  assert.throws(() => run({ prices: [1, 2, 3], period: 3 }), /greater than/);
  assert.throws(() => run({ prices: [1, NaN, 3], period: 1 }), /finite/);
  assert.throws(() => run({ prices: [1, "2", 3], period: 1 }), /finite/);
  assert.throws(() => run({ prices: [0, 5, 10], period: 1 }), /division by zero/);
});

test("edge: negative-zero base is rejected like zero", () => {
  assert.throws(() => run({ prices: [-0, 5, 10], period: 1 }), /division by zero/);
});

test("edge: equal prices over a negative base normalize -0 to 0", () => {
  // (−10 − −10)/−10 * 100 = −0 in IEEE754; must come out as +0.
  const out = run({ prices: [-10, -10], period: 1 });
  assert.ok(Object.is(out.roc[0], 0), `expected +0, got ${out.roc[0]}`);
  assert.ok(Object.is(out.latest, 0));
  assert.equal(out.signal, "flat");
  assert.deepEqual(JSON.parse(JSON.stringify(out)), out);
});

test("edge: ROC overflow to Infinity throws instead of returning non-finite", () => {
  assert.throws(() => run({ prices: [1e-308, 1e308], period: 1 }), /not finite/);
});

test("edge: non-numeric period and array input are rejected", () => {
  assert.throws(() => run({ prices: [1, 2, 3], period: "2" }), /period/);
  assert.throws(() => run([1, 2, 3]), /object/);
  assert.throws(() => run({ prices: [1, 2, Infinity], period: 1 }), /finite/);
});

test("output is JSON-serializable and pure (no input mutation)", () => {
  const prices = [10, 20, 30, 15];
  const copy = prices.slice();
  const out = run({ prices, period: 1 });
  assert.deepEqual(prices, copy);
  const roundTrip = JSON.parse(JSON.stringify(out));
  assert.deepEqual(roundTrip, out);
  // determinism
  assert.deepEqual(run({ prices, period: 1 }), out);
});
