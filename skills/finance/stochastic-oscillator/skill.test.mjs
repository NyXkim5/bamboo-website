// Tests for finance/stochastic-oscillator
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const bar = (high, low, close) => ({ high, low, close });

test("happy path: known %K/%D values with period=3, dPeriod=3", () => {
  // All windows span high=10, low=0 so %K = 10 * close.
  const bars = [
    bar(10, 0, 5),
    bar(10, 0, 10),
    bar(10, 0, 0), // %K = 0
    bar(10, 0, 10), // %K = 100
    bar(10, 0, 5), // %K = 50
  ];
  const out = run({ bars, period: 3, dPeriod: 3 });
  assert.deepEqual(out.kSeries, [0, 100, 50]);
  assert.deepEqual(out.dSeries, [50]);
  assert.equal(out.k, 50);
  assert.equal(out.d, 50);
  assert.equal(out.signal, "neutral");
  assert.equal(out.period, 3);
  assert.equal(out.dPeriod, 3);
});

test("defaults: period=14, dPeriod=3; steady uptrend pins %K at 100 (overbought)", () => {
  // bar i: high=i, low=i-1, close=i. Over any 14-bar window ending at i:
  // highestHigh=i, lowestLow=i-14, close=i => %K = 100.
  const bars = [];
  for (let i = 1; i <= 16; i++) bars.push(bar(i, i - 1, i));
  const out = run({ bars });
  assert.equal(out.period, 14);
  assert.equal(out.dPeriod, 3);
  assert.deepEqual(out.kSeries, [100, 100, 100]);
  assert.deepEqual(out.dSeries, [100]);
  assert.equal(out.k, 100);
  assert.equal(out.d, 100);
  assert.equal(out.signal, "overbought");
});

test("oversold signal when close sits at the lows", () => {
  const bars = [bar(10, 0, 5), bar(10, 0, 5), bar(10, 0, 1)]; // last %K = 10
  const out = run({ bars, period: 3, dPeriod: 1 });
  assert.equal(out.k, 10);
  assert.equal(out.signal, "oversold");
});

test("edge case: flat window (highestHigh === lowestLow) yields neutral %K of 50", () => {
  const bars = [bar(5, 5, 5), bar(5, 5, 5), bar(5, 5, 5)];
  const out = run({ bars, period: 3, dPeriod: 1 });
  assert.deepEqual(out.kSeries, [50]);
  assert.equal(out.k, 50);
  assert.equal(out.signal, "neutral");
});

test("edge case: %D is null when fewer than dPeriod %K values exist", () => {
  const bars = [bar(10, 0, 8), bar(10, 0, 8), bar(10, 0, 8)];
  const out = run({ bars, period: 3, dPeriod: 3 });
  assert.deepEqual(out.kSeries, [80]);
  assert.deepEqual(out.dSeries, []);
  assert.equal(out.d, null);
});

test("fractional %K computed correctly", () => {
  // Window: HH=12, LL=5, close=10 -> %K = 100*5/7 = 71.428571 (rounded to 6dp)
  const bars = [bar(10, 5, 8), bar(11, 6, 9), bar(12, 7, 10)];
  const out = run({ bars, period: 3, dPeriod: 1 });
  assert.equal(out.k, 71.428571);
  assert.equal(out.d, 71.428571);
});

test("input validation: bad inputs throw clear errors", () => {
  assert.throws(() => run(null), /input must be an object/);
  assert.throws(() => run({ bars: "nope" }), /bars must be an array/);
  assert.throws(() => run({ bars: [bar(1, 0, 1)], period: 3 }), /at least 3 bars/);
  assert.throws(
    () => run({ bars: [bar(1, 0, 1), bar(1, 0, 1)], period: 2, dPeriod: 0 }),
    /dPeriod must be a positive integer/
  );
  assert.throws(
    () => run({ bars: [bar(1, 0, 1), bar(1, 0, 1)], period: 1.5 }),
    /period must be a positive integer/
  );
  assert.throws(
    () => run({ bars: [bar(1, 0, 1), bar(0, 5, 2)], period: 2 }),
    /high \(0\) is less than low \(5\)/
  );
  assert.throws(
    () => run({ bars: [bar(1, 0, 1), { high: 2, low: 0, close: "x" }], period: 2 }),
    /finite numeric high, low, close/
  );
});

test("hardening: close outside [low, high] throws instead of producing %K outside [0, 100]", () => {
  // close above high would yield %K = 150 if unchecked
  assert.throws(
    () => run({ bars: [bar(10, 0, 5), bar(10, 0, 15)], period: 2 }),
    /close \(15\) is outside the \[low, high\] range \[0, 10\]/
  );
  // close below low would yield a negative %K if unchecked
  assert.throws(
    () => run({ bars: [bar(10, 2, 5), bar(10, 2, 1)], period: 2 }),
    /close \(1\) is outside the \[low, high\] range \[2, 10\]/
  );
});

test("hardening: minimal input — single bar with period=1 and dPeriod=1", () => {
  const out = run({ bars: [bar(10, 0, 7.5)], period: 1, dPeriod: 1 });
  assert.deepEqual(out.kSeries, [75]);
  assert.deepEqual(out.dSeries, [75]);
  assert.equal(out.k, 75);
  assert.equal(out.d, 75);
  assert.equal(out.signal, "neutral");
});

test("hardening: negative prices compute correctly and stay within [0, 100]", () => {
  // Window: HH = -5, LL = -20, close = -8 -> %K = 100 * 12 / 15 = 80
  const bars = [bar(-10, -20, -15), bar(-5, -12, -8)];
  const out = run({ bars, period: 2, dPeriod: 1 });
  assert.equal(out.k, 80);
  assert.equal(out.signal, "neutral");
  // close at the very bottom of a negative window -> %K = 0, oversold
  const out2 = run({ bars: [bar(-1, -3, -2), bar(-1, -3, -3)], period: 2, dPeriod: 1 });
  assert.equal(out2.k, 0);
  assert.equal(out2.signal, "oversold");
});

test("hardening: undefined, array, and empty-bars inputs throw clear errors", () => {
  assert.throws(() => run(undefined), /input must be an object/);
  assert.throws(() => run([bar(1, 0, 1)]), /bars must be an array/); // array input has no .bars
  assert.throws(() => run({ bars: [] }), /at least 14 bars \(period\), got 0/);
  assert.throws(() => run({ bars: [null, bar(1, 0, 1)], period: 2 }), /bars\[0\] must be an object/);
});

test("meta contract fields are present and correct", () => {
  assert.equal(meta.id, "finance/stochastic-oscillator");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.description === "string" && meta.description.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
  assert.ok(meta.inputs && typeof meta.inputs === "object");
  assert.ok(typeof meta.outputs === "string");
});

test("determinism: same input yields identical output", () => {
  const bars = [bar(10, 0, 3), bar(10, 0, 7), bar(10, 0, 6), bar(10, 0, 9)];
  const a = run({ bars, period: 3, dPeriod: 2 });
  const b = run({ bars, period: 3, dPeriod: 2 });
  assert.deepEqual(a, b);
});
