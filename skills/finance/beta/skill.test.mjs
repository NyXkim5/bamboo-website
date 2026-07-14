import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

function approx(actual, expected, tol = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${actual} to be within ${tol} of ${expected}`
  );
}

test("meta contract", () => {
  assert.equal(meta.id, "finance/beta");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.1");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("asset exactly half the market: beta 0.5, correlation 1", () => {
  // asset = 0.5 * market elementwise -> cov = 0.5*var(m), beta = 0.5, corr = 1
  const out = run({
    asset: [0.01, 0.02, 0.03, 0.04],
    market: [0.02, 0.04, 0.06, 0.08],
  });
  approx(out.beta, 0.5);
  approx(out.correlation, 1);
});

test("hand-computed mixed series", () => {
  // asset = [0.1, 0.2, 0.15, 0.05], market = [0.05, 0.1, 0.08, 0.02]
  // means: a=0.125, m=0.0625
  // cov = 0.00675/3 = 0.00225 = 9/4000
  // var(m) = 0.003675/3 = 0.001225 = 49/40000
  // beta = (9/4000)/(49/40000) = 90/49 = 1.8367346938775510...
  // var(a) = 0.0125/3 = 1/240
  // corr = cov/sqrt(var_a*var_m) = (9/28000)*sqrt(9600000) = 0.9959100003...
  const out = run({
    asset: [0.1, 0.2, 0.15, 0.05],
    market: [0.05, 0.1, 0.08, 0.02],
  });
  approx(out.beta, 90 / 49, 1e-12);
  approx(out.correlation, (9 / 28000) * Math.sqrt(9600000), 1e-12);
  approx(out.beta, 1.836734693877551, 1e-9);
  approx(out.correlation, 0.99591, 1e-5);
});

test("perfectly inverse asset: beta -1, correlation -1", () => {
  // asset = [1,2,3], market = [3,2,1]
  // means 2 and 2; cov = ((-1)(1)+(0)(0)+(1)(-1))/2 = -1; var(m) = 1
  const out = run({ asset: [1, 2, 3], market: [3, 2, 1] });
  approx(out.beta, -1);
  approx(out.correlation, -1);
});

test("constant asset: beta 0, correlation 0", () => {
  const out = run({ asset: [2, 2, 2], market: [1, 2, 3] });
  approx(out.beta, 0);
  approx(out.correlation, 0);
});

test("throws on mismatched lengths", () => {
  assert.throws(
    () => run({ asset: [1, 2, 3], market: [1, 2] }),
    /same length/
  );
});

test("throws on fewer than 2 observations", () => {
  assert.throws(() => run({ asset: [1], market: [1] }), /at least 2/);
});

test("throws on zero market variance", () => {
  assert.throws(
    () => run({ asset: [1, 2, 3], market: [5, 5, 5] }),
    /variance is zero/
  );
});

test("throws on invalid input types", () => {
  assert.throws(() => run(null), /must be an object/);
  assert.throws(() => run({ asset: "abc", market: [1, 2] }), /array/);
  assert.throws(() => run({ asset: [1, 2], market: [1, "x"] }), /finite number/);
  assert.throws(() => run({ asset: [1, NaN], market: [1, 2] }), /finite number/);
  assert.throws(() => run({ asset: [1, Infinity], market: [1, 2] }), /finite number/);
  assert.throws(() => run({ asset: [1, 2], market: [1, -Infinity] }), /finite number/);
});

test("throws on empty arrays", () => {
  assert.throws(() => run({ asset: [], market: [] }), /at least 2/);
});

test("two-point series: beta is the slope, correlation is sign of slope", () => {
  // Two points always lie on a line: beta = (a2-a1)/(m2-m1), |corr| = 1.
  const out = run({ asset: [3, 1], market: [1, 2] });
  approx(out.beta, -2);
  approx(out.correlation, -1);
  assert.ok(Math.abs(out.correlation) <= 1, "correlation must stay in [-1, 1]");
});

test("correlation is clamped to [-1, 1] for exactly proportional series", () => {
  // Without clamping, float rounding yields |corr| = 1.0000000000000002 for
  // many exactly-scaled series (e.g. asset = k * market + c).
  for (let s = 1; s < 200; s++) {
    const market = Array.from({ length: 8 }, (_, i) => Math.sin(s * 7 + i) * 0.13);
    const asset = market.map((x) => x * (s * 0.317) + 0.003);
    const out = run({ asset, market });
    assert.ok(
      Math.abs(out.correlation) <= 1,
      `|correlation| ${out.correlation} exceeds 1 at s=${s}`
    );
    approx(out.correlation, 1, 1e-9);
    approx(out.beta, s * 0.317, 1e-9);
  }
});

test("-0 inputs are accepted and outputs are never -0", () => {
  const scaled = run({ asset: [-0, 1, 2], market: [0, 1, 2] });
  approx(scaled.beta, 1);
  approx(scaled.correlation, 1);
  const flat = run({ asset: [-0, -0, -0], market: [3, 1, 2] });
  assert.ok(Object.is(flat.beta, 0), `beta must be +0, got ${flat.beta}`);
  assert.ok(
    Object.is(flat.correlation, 0),
    `correlation must be +0, got ${flat.correlation}`
  );
});
