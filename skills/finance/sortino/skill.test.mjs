import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

function approx(actual, expected, eps = 1e-12) {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `expected ${actual} to be within ${eps} of ${expected}`
  );
}

test("meta contract", () => {
  assert.equal(meta.id, "finance/sortino");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("hand-computed: default target 0 and 252 periods", () => {
  // returns = [0.01, -0.02, 0.03, -0.01]
  // mean = 0.01/4 = 0.0025
  // downside terms: 0, (-0.02)^2=0.0004, 0, (-0.01)^2=0.0001
  // dd = sqrt(0.0005/4) = sqrt(0.000125) = 0.011180339887498949
  // sortino = 0.0025 / 0.011180339887498949 * sqrt(252)
  //         = 0.223606797749979 * 15.874507866387544 = 3.5496478698597693
  const out = run({ returns: [0.01, -0.02, 0.03, -0.01] });
  approx(out.downsideDeviation, 0.011180339887498949);
  approx(out.sortino, 3.5496478698597693, 1e-9);
});

test("hand-computed: custom target and periodsPerYear", () => {
  // returns = [0.05, -0.01], target = 0.01, ppy = 12
  // mean = 0.02, excess = 0.01
  // shortfalls vs target: 0.04 -> 0 ; -0.02 -> 0.0004
  // dd = sqrt(0.0004/2) = sqrt(0.0002) = 0.014142135623730951
  // sortino = 0.01/sqrt(0.0002) * sqrt(12) = sqrt(6) = 2.449489742783178
  const out = run({ returns: [0.05, -0.01], target: 0.01, periodsPerYear: 12 });
  approx(out.downsideDeviation, 0.014142135623730951);
  approx(out.sortino, Math.sqrt(6), 1e-12);
});

test("hand-computed: all losing periods", () => {
  // returns = [-0.01, -0.01], target 0
  // mean = -0.01, dd = sqrt(0.0001) = 0.01
  // sortino = -0.01/0.01 * sqrt(252) = -sqrt(252) = -15.874507866387544
  const out = run({ returns: [-0.01, -0.01] });
  approx(out.downsideDeviation, 0.01);
  approx(out.sortino, -Math.sqrt(252), 1e-12);
});

test("no downside returns sortino null with zero downside deviation", () => {
  const out = run({ returns: [0.01, 0.02, 0.0] });
  assert.equal(out.sortino, null);
  assert.equal(out.downsideDeviation, 0);
});

test("return at exactly the target contributes no downside", () => {
  // returns = [0.01, 0.03], target = 0.01: shortfalls are 0 and 0 -> no downside
  const out = run({ returns: [0.01, 0.03], target: 0.01 });
  assert.equal(out.sortino, null);
  assert.equal(out.downsideDeviation, 0);
});

test("deterministic: same input gives identical output", () => {
  const input = { returns: [0.02, -0.03, 0.01], target: 0.005, periodsPerYear: 52 };
  const a = run(input);
  const b = run(input);
  assert.deepEqual(a, b);
});

test("inherited/polluted prototype keys do not override defaults", () => {
  // Simulate prototype pollution: defaults must still apply because only
  // own properties of the input may configure the computation.
  Object.prototype.target = 0.05;
  Object.prototype.periodsPerYear = 1;
  try {
    const polluted = run({ returns: [0.01, -0.02, 0.03, -0.01] });
    const clean = run({
      returns: [0.01, -0.02, 0.03, -0.01],
      target: 0,
      periodsPerYear: 252,
    });
    assert.deepEqual(polluted, clean);
    // Inherited `returns` must not be honored either.
    Object.prototype.returns = [0.01, -0.02];
    assert.throws(() => run({}), Error);
  } finally {
    delete Object.prototype.target;
    delete Object.prototype.periodsPerYear;
    delete Object.prototype.returns;
  }
  // Own key explicitly set to undefined falls back to the default.
  const a = run({ returns: [0.05, -0.01], target: undefined });
  const b = run({ returns: [0.05, -0.01] });
  assert.deepEqual(a, b);
});

test("values are snapshotted: index getter cannot inject NaN after validation", () => {
  const arr = [0, -0.02];
  let reads = 0;
  Object.defineProperty(arr, 0, {
    get() {
      reads += 1;
      return reads === 1 ? 0.01 : NaN; // valid on first (validation) read only
    },
  });
  const out = run({ returns: arr });
  const expected = run({ returns: [0.01, -0.02] });
  assert.deepEqual(out, expected);
  assert.ok(Number.isFinite(out.sortino));
});

test("-0 in returns behaves exactly like 0", () => {
  const withNegZero = run({ returns: [-0, -0.02], periodsPerYear: 12 });
  const withZero = run({ returns: [0, -0.02], periodsPerYear: 12 });
  assert.deepEqual(withNegZero, withZero);
  // mean === target with downside present yields sortino of exactly +0.
  const zeroExcess = run({ returns: [0.02, 0], target: 0.01 });
  assert.ok(Object.is(zeroExcess.sortino, 0));
  // periodsPerYear of -0 is not positive.
  assert.throws(() => run({ returns: [0.01, -0.02], periodsPerYear: -0 }), Error);
});

test("finite-but-extreme inputs that overflow intermediates throw instead of returning wrong values", () => {
  // mean overflows to Infinity.
  assert.throws(() => run({ returns: [1e308, 1e308, -1] }), Error);
  // shortfall^2 overflows -> downside deviation would be Infinity and
  // sortino would silently compute to 0 without the guard.
  assert.throws(() => run({ returns: [1, -1e200, -0.5] }), Error);
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("nope"), Error);
  assert.throws(() => run({}), Error);
  assert.throws(() => run({ returns: "not-an-array" }), Error);
  assert.throws(() => run({ returns: [0.01] }), Error); // length < 2
  assert.throws(() => run({ returns: [0.01, "x"] }), Error);
  assert.throws(() => run({ returns: [0.01, NaN] }), Error);
  assert.throws(() => run({ returns: [0.01, Infinity] }), Error);
  assert.throws(() => run({ returns: [0.01, -0.02], target: NaN }), Error);
  assert.throws(() => run({ returns: [0.01, -0.02], target: "0" }), Error);
  assert.throws(() => run({ returns: [0.01, -0.02], periodsPerYear: 0 }), Error);
  assert.throws(() => run({ returns: [0.01, -0.02], periodsPerYear: -252 }), Error);
});
