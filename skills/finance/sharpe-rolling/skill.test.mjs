// Tests for finance/sharpe-rolling — rolling annualized Sharpe ratio.
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

function approx(actual, expected, eps = 1e-12) {
  assert.ok(
    Math.abs(actual - expected) < eps,
    `expected ${actual} to be within ${eps} of ${expected}`
  );
}

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/sharpe-rolling");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("happy path: window=2, hand-computed values", () => {
  // returns [0.01,0.02,0.03,0.04], window 2, rf 0, ppy 252.
  // Each window has sample stddev 0.005*sqrt(2); means 0.015, 0.025, 0.035.
  // sharpe_k = mean_k / (0.005*sqrt(2)) * sqrt(252) = (mean_k*200)*sqrt(126)
  //          = 3*sqrt(126), 5*sqrt(126), 7*sqrt(126).
  const { sharpe, latest } = run({
    returns: [0.01, 0.02, 0.03, 0.04],
    window: 2,
  });
  assert.equal(sharpe.length, 3);
  approx(sharpe[0], 3 * Math.sqrt(126)); // 33.67491648...
  approx(sharpe[1], 5 * Math.sqrt(126)); // 56.12486080...
  approx(sharpe[2], 7 * Math.sqrt(126)); // 78.57480512...
  approx(latest, 7 * Math.sqrt(126));
});

test("window=3 with monthly annualization, hand-computed exact value", () => {
  // returns [0.02,-0.01,0.03], window 3, ppy 12, rf 0.
  // mean = 1/75; deviations 2/300, -7/300, 5/300; ssq = 78/90000;
  // sample var = 13/30000; sharpe = (1/75)/sqrt(13/30000)*sqrt(12) = 8/sqrt(13).
  const out = run({ returns: [0.02, -0.01, 0.03], window: 3, periodsPerYear: 12 });
  assert.equal(out.sharpe.length, 1);
  approx(out.sharpe[0], 8 / Math.sqrt(13)); // 2.21880078...
  approx(out.latest, 8 / Math.sqrt(13));
});

test("risk-free rate shifts excess returns", () => {
  // rf = 0.252 annual over 252 periods => 0.001 per period.
  // returns [0.011,0.021] -> excess [0.01,0.02], same window stats as
  // [0.01,0.02] with rf=0: sharpe = 3*sqrt(126).
  const withRf = run({ returns: [0.011, 0.021], window: 2, riskFree: 0.252 });
  const noRf = run({ returns: [0.01, 0.02], window: 2 });
  approx(withRf.sharpe[0], 3 * Math.sqrt(126));
  approx(withRf.latest, noRf.latest);
});

test("edge case: zero-dispersion window yields null", () => {
  const out = run({ returns: [0.01, 0.01, 0.01], window: 2 });
  assert.deepEqual(out.sharpe, [null, null]);
  assert.equal(out.latest, null);
});

test("defaults: window 20, periodsPerYear 252, riskFree 0", () => {
  const returns = Array.from({ length: 21 }, (_, i) => (i % 2 === 0 ? 0.01 : -0.005));
  const out = run({ returns });
  assert.equal(out.sharpe.length, 2); // 21 - 20 + 1
  for (const s of out.sharpe) assert.ok(Number.isFinite(s));
  assert.equal(out.latest, out.sharpe[1]);
});

test("edge: negative returns yield negative Sharpe; mixed null/finite windows", () => {
  // [-0.01,-0.02]: mean -0.015, sample stddev 0.005*sqrt(2) => -3*sqrt(126).
  const neg = run({ returns: [-0.01, -0.02], window: 2 });
  approx(neg.sharpe[0], -3 * Math.sqrt(126));
  // [0.01,0.01,0.03] window 2: first window flat => null;
  // second: mean 0.02, stddev 0.01*sqrt(2) => sqrt(2)*sqrt(252) = 6*sqrt(14).
  const mixed = run({ returns: [0.01, 0.01, 0.03], window: 2 });
  assert.equal(mixed.sharpe[0], null);
  approx(mixed.sharpe[1], 6 * Math.sqrt(14));
  approx(mixed.latest, 6 * Math.sqrt(14));
});

test("edge: constant returns stay null even with nonzero riskFree", () => {
  // Excess returns are constant (nonzero mean, zero dispersion) => Sharpe undefined.
  const out = run({ returns: [0.01, 0.01, 0.01], window: 3, riskFree: 0.252 });
  assert.deepEqual(out.sharpe, [null]);
  assert.equal(out.latest, null);
});

test("edge: extreme finite inputs that overflow internally yield null, not NaN", () => {
  // sum = 1e308 + 1e308 overflows to Infinity => mean/stddev would be NaN.
  const out = run({ returns: [1e308, 1e308], window: 2 });
  assert.deepEqual(out.sharpe, [null]);
  assert.equal(out.latest, null);
  assert.doesNotThrow(() => JSON.stringify(out));
});

test("edge: prototype-carried keys cannot bypass validation; JSON __proto__ key is inert", () => {
  // Inherited bogus window is still read by destructuring — and rejected.
  const sneaky = Object.assign(Object.create({ window: 1 }), {
    returns: [0.01, 0.02],
  });
  assert.throws(() => run(sneaky), /window/);
  // A literal "__proto__" own key from JSON.parse must not pollute defaults.
  const jsonInput = JSON.parse(
    '{"returns":[0.01,0.02],"window":2,"__proto__":{"periodsPerYear":-5}}'
  );
  const out = run(jsonInput);
  approx(out.sharpe[0], 3 * Math.sqrt(126)); // defaults (ppy=252) still in effect
  assert.equal(Object.prototype.periodsPerYear, undefined);
});

test("invalid inputs throw", () => {
  assert.throws(() => run([]), Error); // array is not a plain object
  assert.throws(() => run({ returns: [] }), Error); // empty: length < window
  assert.throws(() => run(null), Error);
  assert.throws(() => run({ returns: "not an array" }), Error);
  assert.throws(() => run({ returns: [0.01, NaN, 0.02], window: 2 }), Error);
  assert.throws(() => run({ returns: [0.01, 0.02], window: 1 }), Error); // window < 2
  assert.throws(() => run({ returns: [0.01, 0.02], window: 2.5 }), Error); // non-integer
  assert.throws(() => run({ returns: [0.01, 0.02], window: 3 }), Error); // length < window
  assert.throws(() => run({ returns: [0.01, 0.02], window: 2, periodsPerYear: 0 }), Error);
  assert.throws(() => run({ returns: [0.01, 0.02], window: 2, riskFree: Infinity }), Error);
});
