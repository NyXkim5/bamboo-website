// Tests for finance/cagr
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/cagr");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("happy path: doubling over 10 years", () => {
  // (200/100)^(1/10) - 1 = 2^0.1 - 1 = 0.07177... -> 0.0718
  const out = run({ begin: 100, end: 200, years: 10 });
  assert.deepEqual(out, { cagr: 0.0718, totalReturn: 1 });
});

test("happy path: exact round number over 2 years", () => {
  // sqrt(121/100) - 1 = 1.1 - 1 = 0.1; totalReturn = 0.21
  const out = run({ begin: 100, end: 121, years: 2 });
  assert.deepEqual(out, { cagr: 0.1, totalReturn: 0.21 });
});

test("one year: cagr equals totalReturn", () => {
  const out = run({ begin: 100, end: 150, years: 1 });
  assert.deepEqual(out, { cagr: 0.5, totalReturn: 0.5 });
});

test("decline: negative growth", () => {
  // (100/200)^(1/3) - 1 = 0.79370... - 1 = -0.20630 -> -0.2063
  const out = run({ begin: 200, end: 100, years: 3 });
  assert.deepEqual(out, { cagr: -0.2063, totalReturn: -0.5 });
});

test("edge case: flat value gives zero growth", () => {
  const out = run({ begin: 100, end: 100, years: 5 });
  assert.deepEqual(out, { cagr: 0, totalReturn: 0 });
});

test("edge case: total loss (end = 0) gives -1", () => {
  const out = run({ begin: 100, end: 0, years: 4 });
  assert.deepEqual(out, { cagr: -1, totalReturn: -1 });
});

test("edge case: fractional years", () => {
  // (110/100)^(1/0.5) - 1 = 1.1^2 - 1 = 0.21
  const out = run({ begin: 100, end: 110, years: 0.5 });
  assert.deepEqual(out, { cagr: 0.21, totalReturn: 0.1 });
});

test("validation: begin must be > 0", () => {
  assert.throws(() => run({ begin: 0, end: 100, years: 5 }), /begin must be > 0/);
  assert.throws(() => run({ begin: -10, end: 100, years: 5 }), /begin must be > 0/);
});

test("validation: years must be > 0", () => {
  assert.throws(() => run({ begin: 100, end: 200, years: 0 }), /years must be > 0/);
  assert.throws(() => run({ begin: 100, end: 200, years: -1 }), /years must be > 0/);
});

test("hardening: tiny negative growth never yields -0", () => {
  // cagr ~ -1e-10 and totalReturn = -1e-6 both round to 0, not -0.
  const out = run({ begin: 1000000, end: 999999, years: 1000 });
  assert.ok(Object.is(out.cagr, 0), `cagr should be +0, got ${Object.is(out.cagr, -0) ? "-0" : out.cagr}`);
  assert.ok(Object.is(out.totalReturn, 0), "totalReturn should be +0");
  assert.deepEqual(out, { cagr: 0, totalReturn: 0 });
});

test("hardening: array and primitive inputs are rejected as non-objects", () => {
  assert.throws(() => run([100, 200, 5]), /input must be an object/);
  assert.throws(() => run(undefined), /input must be an object/);
  assert.throws(() => run(42), /input must be an object/);
  assert.throws(() => run("cagr"), /input must be an object/);
});

test("hardening: Infinity inputs throw finite-number errors", () => {
  assert.throws(() => run({ begin: Infinity, end: 200, years: 5 }), /begin must be a finite number/);
  assert.throws(() => run({ begin: 100, end: Infinity, years: 5 }), /end must be a finite number/);
  assert.throws(() => run({ begin: 100, end: 200, years: -Infinity }), /years must be a finite number/);
});

test("hardening: total loss with fractional years is still -1", () => {
  // 0^(1/0.5) = 0^2 = 0 -> cagr = -1
  const out = run({ begin: 100, end: 0, years: 0.5 });
  assert.deepEqual(out, { cagr: -1, totalReturn: -1 });
});

test("validation: non-numeric and missing inputs throw", () => {
  assert.throws(() => run(null), /input must be an object/);
  assert.throws(() => run({ begin: "100", end: 200, years: 5 }), /begin must be a finite number/);
  assert.throws(() => run({ begin: 100, end: NaN, years: 5 }), /end must be a finite number/);
  assert.throws(() => run({ begin: 100, end: 200 }), /years must be a finite number/);
  assert.throws(() => run({ begin: 100, end: -5, years: 5 }), /end must be >= 0/);
});
