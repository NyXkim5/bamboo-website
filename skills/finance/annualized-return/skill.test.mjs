import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has required fields", () => {
  assert.equal(meta.id, "finance/annualized-return");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.name, "string");
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("identity: full year of periods returns the total return", () => {
  // (1.1)^(252/252) - 1 = 0.1
  assert.deepEqual(
    run({ totalReturn: 0.1, periods: 252, periodsPerYear: 252 }),
    { annualized: 0.1 }
  );
});

test("two years of periods: sqrt(1.2) - 1 rounded to 6dp", () => {
  // (1.2)^(252/504) - 1 = sqrt(1.2) - 1 = 0.09544511501... -> 0.095445
  assert.deepEqual(
    run({ totalReturn: 0.2, periods: 504, periodsPerYear: 252 }),
    { annualized: 0.095445 }
  );
});

test("default periodsPerYear is 252", () => {
  // (1.05)^(252/126) - 1 = 1.05^2 - 1 = 0.1025
  assert.deepEqual(run({ totalReturn: 0.05, periods: 126 }), {
    annualized: 0.1025,
  });
});

test("monthly convention: half a year at +10% compounds to 21%", () => {
  // (1.1)^(12/6) - 1 = 1.1^2 - 1 = 0.21
  assert.deepEqual(run({ totalReturn: 0.1, periods: 6, periodsPerYear: 12 }), {
    annualized: 0.21,
  });
});

test("zero and negative returns", () => {
  assert.deepEqual(run({ totalReturn: 0, periods: 10 }), { annualized: 0 });
  // (0.9)^1 - 1 = -0.1
  assert.deepEqual(
    run({ totalReturn: -0.1, periods: 252, periodsPerYear: 252 }),
    { annualized: -0.1 }
  );
});

test("tiny negative return rounds to +0, never -0", () => {
  // (1 - 1e-9)^1 - 1 ~= -1e-9 -> rounds to 0; must be +0, not -0
  const { annualized } = run({
    totalReturn: -1e-9,
    periods: 252,
    periodsPerYear: 252,
  });
  assert.ok(Object.is(annualized, 0), "expected +0, got -0");
  // -0 as an input behaves like 0
  assert.deepEqual(run({ totalReturn: -0, periods: 10 }), { annualized: 0 });
});

test("overflow to a non-finite result throws instead of returning Infinity", () => {
  // (1e6 + 1)^252 overflows Number range -> Infinity
  assert.throws(
    () => run({ totalReturn: 1e6, periods: 1, periodsPerYear: 252 }),
    RangeError
  );
});

test("inherited periodsPerYear is ignored; own default 252 applies", () => {
  // A prototype-inherited key must not hijack the default.
  const input = Object.assign(Object.create({ periodsPerYear: 1 }), {
    totalReturn: 0.1,
    periods: 252,
  });
  // With default 252: (1.1)^(252/252) - 1 = 0.1 (with ppy=1 it would be ~0.000378)
  assert.deepEqual(run(input), { annualized: 0.1 });
});

test("negative-zero periods and non-number containers throw", () => {
  // -0 fails the periods > 0 check
  assert.throws(() => run({ totalReturn: 0.1, periods: -0 }), RangeError);
  // boxed Number and array inputs are rejected
  assert.throws(
    () => run({ totalReturn: new Number(0.1), periods: 252 }),
    TypeError
  );
  assert.throws(() => run([0.1, 252]), TypeError);
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), TypeError);
  assert.throws(() => run({ totalReturn: "0.1", periods: 252 }), TypeError);
  assert.throws(() => run({ totalReturn: NaN, periods: 252 }), TypeError);
  // 1 + totalReturn must be > 0
  assert.throws(() => run({ totalReturn: -1, periods: 252 }), RangeError);
  assert.throws(() => run({ totalReturn: -1.5, periods: 252 }), RangeError);
  // periods must be > 0
  assert.throws(() => run({ totalReturn: 0.1, periods: 0 }), RangeError);
  assert.throws(() => run({ totalReturn: 0.1, periods: -5 }), RangeError);
  // periodsPerYear must be a positive finite number
  assert.throws(
    () => run({ totalReturn: 0.1, periods: 10, periodsPerYear: 0 }),
    RangeError
  );
  assert.throws(
    () => run({ totalReturn: 0.1, periods: 10, periodsPerYear: Infinity }),
    RangeError
  );
});
