import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const TOL = 1e-12;
function close(actual, expected, msg) {
  assert.ok(
    Math.abs(actual - expected) <= TOL,
    `${msg ?? "value"}: expected ${expected}, got ${actual}`
  );
}

test("meta contract", () => {
  assert.equal(meta.id, "finance/keltner-channels");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("hand-computed: period=2, mult=1, steady uptrend", () => {
  // bars: (h,l,c) = (10,8,9), (11,9,10), (12,10,11), (13,11,12)
  // TR1 = max(2, |11-9|, |9-9|) = 2; TR2 = 2; TR3 = 2
  // ATR@bar2 = (2+2)/2 = 2; ATR@bar3 = (2*1 + 2)/2 = 2
  // EMA seed @bar1 = (9+10)/2 = 9.5, k = 2/3
  // EMA@bar2 = 9.5 + (11-9.5)*2/3 = 10.5; EMA@bar3 = 10.5 + (12-10.5)*2/3 = 11.5
  const bars = [
    { high: 10, low: 8, close: 9 },
    { high: 11, low: 9, close: 10 },
    { high: 12, low: 10, close: 11 },
    { high: 13, low: 11, close: 12 },
  ];
  const out = run({ bars, period: 2, mult: 1 });
  assert.equal(out.middle.length, 2);
  assert.equal(out.upper.length, 2);
  assert.equal(out.lower.length, 2);
  assert.equal(out.atr.length, 2);
  assert.deepEqual(out.middle, [10.5, 11.5]);
  assert.deepEqual(out.atr, [2, 2]);
  assert.deepEqual(out.upper, [12.5, 13.5]);
  assert.deepEqual(out.lower, [8.5, 9.5]);
  assert.deepEqual(out.latest, { middle: 11.5, upper: 13.5, lower: 9.5, atr: 2 });
});

test("hand-computed: period=2, mult=2, varying true range (gap cases)", () => {
  // bars: (10,9,9.5), (12,9,11), (11,10,10.5), (14,10,13)
  // TR1 = max(3, |12-9.5|=2.5, |9-9.5|=0.5) = 3
  // TR2 = max(1, |11-11|=0, |10-11|=1) = 1
  // TR3 = max(4, |14-10.5|=3.5, |10-10.5|=0.5) = 4
  // ATR@bar2 = (3+1)/2 = 2; ATR@bar3 = (2*1 + 4)/2 = 3
  // EMA seed @bar1 = (9.5+11)/2 = 10.25, k = 2/3
  // EMA@bar2 = 10.25 + (10.5-10.25)*2/3 = 125/12
  // EMA@bar3 = 125/12 + (13 - 125/12)*2/3 = 437/36
  const bars = [
    { high: 10, low: 9, close: 9.5 },
    { high: 12, low: 9, close: 11 },
    { high: 11, low: 10, close: 10.5 },
    { high: 14, low: 10, close: 13 },
  ];
  const out = run({ bars, period: 2, mult: 2 });
  close(out.middle[0], 125 / 12, "middle[0]");
  close(out.middle[1], 437 / 36, "middle[1]");
  assert.deepEqual(out.atr, [2, 3]);
  close(out.upper[0], 125 / 12 + 2 * 2, "upper[0]");
  close(out.lower[0], 125 / 12 - 2 * 2, "lower[0]");
  close(out.upper[1], 437 / 36 + 2 * 3, "upper[1]");
  close(out.lower[1], 437 / 36 - 2 * 3, "lower[1]");
  close(out.latest.middle, 437 / 36, "latest.middle");
  close(out.latest.upper, 653 / 36, "latest.upper");
  close(out.latest.lower, 221 / 36, "latest.lower");
  assert.equal(out.latest.atr, 3);
});

test("minimal length (period+1 bars) yields single aligned point", () => {
  // period=2, bars: (5,4,4.5), (6,4,5.5), (7,5,6)
  // TR1 = max(2, 1.5, 0.5) = 2; TR2 = max(2, 1.5, 0.5) = 2; ATR@bar2 = 2
  // EMA seed = (4.5+5.5)/2 = 5; EMA@bar2 = 5 + (6-5)*2/3 = 17/3
  const bars = [
    { high: 5, low: 4, close: 4.5 },
    { high: 6, low: 4, close: 5.5 },
    { high: 7, low: 5, close: 6 },
  ];
  const out = run({ bars, period: 2, mult: 1 });
  assert.equal(out.middle.length, 1);
  close(out.middle[0], 17 / 3, "middle[0]");
  assert.equal(out.atr[0], 2);
  close(out.upper[0], 23 / 3, "upper[0]");
  close(out.lower[0], 11 / 3, "lower[0]");
  close(out.latest.middle, 17 / 3, "latest.middle");
});

test("defaults: period=20, mult=2, arrays aligned to n - period", () => {
  const bars = [];
  for (let i = 0; i < 25; i++) {
    // deterministic wave, no randomness
    const base = 100 + 3 * Math.sin(i / 2) + 0.2 * i;
    bars.push({ high: base + 1, low: base - 1, close: base + 0.5 });
  }
  const withDefaults = run({ bars });
  const explicit = run({ bars, period: 20, mult: 2 });
  assert.deepEqual(withDefaults, explicit);
  assert.equal(withDefaults.middle.length, 5);
  assert.equal(withDefaults.upper.length, 5);
  assert.equal(withDefaults.lower.length, 5);
  for (let j = 0; j < 5; j++) {
    close(
      withDefaults.upper[j] - withDefaults.middle[j],
      withDefaults.middle[j] - withDefaults.lower[j],
      `band symmetry at ${j}`
    );
    assert.ok(withDefaults.upper[j] > withDefaults.lower[j]);
  }
  assert.equal(withDefaults.latest.middle, withDefaults.middle[4]);
});

test("edge: period=1 — EMA equals close (k=1), ATR equals per-bar TR", () => {
  // bars: (10,9,9.5), (12,9.5,11), (11.5,10,10.5)
  // k = 2/2 = 1 so EMA@i = close[i]; ATR seed = TR1/1, then Wilder with period-1=0 => ATR@i = TR_i
  // TR1 = max(2.5, |12-9.5|=2.5, |9.5-9.5|=0) = 2.5
  // TR2 = max(1.5, |11.5-11|=0.5, |10-11|=1) = 1.5
  const bars = [
    { high: 10, low: 9, close: 9.5 },
    { high: 12, low: 9.5, close: 11 },
    { high: 11.5, low: 10, close: 10.5 },
  ];
  const out = run({ bars, period: 1, mult: 1 });
  assert.deepEqual(out.middle, [11, 10.5]);
  assert.deepEqual(out.atr, [2.5, 1.5]);
  assert.deepEqual(out.upper, [13.5, 12]);
  assert.deepEqual(out.lower, [8.5, 9]);
  assert.deepEqual(out.latest, { middle: 10.5, upper: 12, lower: 9, atr: 1.5 });
});

test("edge: negative prices and zero-volatility (flat) bars", () => {
  // Negative price series (e.g. spreads), period=2, mult=1:
  // TRs all 2; ATR = 2 throughout. EMA seed = (-2 + -1)/2 = -1.5, k=2/3
  // EMA@2 = -1.5 + (0 - -1.5)*2/3 = -0.5; EMA@3 = -0.5 + (1 - -0.5)*2/3 = 0.5
  const neg = [
    { high: -1, low: -3, close: -2 },
    { high: 0, low: -2, close: -1 },
    { high: 1, low: -1, close: 0 },
    { high: 2, low: 0, close: 1 },
  ];
  const outNeg = run({ bars: neg, period: 2, mult: 1 });
  assert.deepEqual(outNeg.middle, [-0.5, 0.5]);
  assert.deepEqual(outNeg.atr, [2, 2]);
  assert.deepEqual(outNeg.upper, [1.5, 2.5]);
  assert.deepEqual(outNeg.lower, [-2.5, -1.5]);

  // Flat bars: ATR = 0, channel collapses onto the midline (no division anywhere, no NaN)
  const flat = Array.from({ length: 5 }, () => ({ high: 5, low: 5, close: 5 }));
  const outFlat = run({ bars: flat, period: 2, mult: 2 });
  assert.deepEqual(outFlat.atr, [0, 0, 0]);
  assert.deepEqual(outFlat.middle, [5, 5, 5]);
  assert.deepEqual(outFlat.upper, [5, 5, 5]);
  assert.deepEqual(outFlat.lower, [5, 5, 5]);
  assert.deepEqual(outFlat.latest, { middle: 5, upper: 5, lower: 5, atr: 0 });
});

test("edge: overflow to non-finite throws instead of returning Infinity", () => {
  // Finite inputs whose EMA seed sum overflows Number.MAX_VALUE
  const big = Array.from({ length: 3 }, () => ({
    high: 1.7e308,
    low: 1.6e308,
    close: 1.7e308,
  }));
  assert.throws(() => run({ bars: big, period: 2, mult: 1 }), /overflow/);
});

test("edge: purity, sparse holes, -0 mult, hostile bar shapes", () => {
  const bars = [
    { high: 10, low: 8, close: 9 },
    { high: 11, low: 9, close: 10 },
    { high: 12, low: 10, close: 11 },
  ];
  const snapshot = JSON.stringify(bars);
  const input = { bars, period: 2, mult: 1 };
  run(input);
  // pure: input and bars untouched
  assert.equal(JSON.stringify(bars), snapshot);
  assert.equal(input.period, 2);
  assert.equal(input.mult, 1);

  // sparse array hole -> bars[1] is undefined
  // eslint-disable-next-line no-sparse-arrays
  assert.throws(() => run({ bars: [bars[0], , bars[2]], period: 1 }), /bars\[1\]/);
  // -0 is not a valid multiplier
  assert.throws(() => run({ bars, period: 2, mult: -0 }), /mult/);
  assert.throws(() => run({ bars, period: 2, mult: Infinity }), /mult/);
  // an array is typeof "object" but has no high/low/close
  assert.throws(() => run({ bars: [bars[0], [11, 9, 10], bars[2]], period: 2 }), /finite numeric/);
  // string period / boolean period rejected
  assert.throws(() => run({ bars, period: "2" }), /period/);
  assert.throws(() => run({ bars, period: true }), /period/);
});

test("invalid inputs throw", () => {
  const good = [
    { high: 10, low: 8, close: 9 },
    { high: 11, low: 9, close: 10 },
    { high: 12, low: 10, close: 11 },
  ];
  // non-object input
  assert.throws(() => run(null), /object/);
  assert.throws(() => run([1, 2, 3]), /object/);
  // bars missing or wrong type
  assert.throws(() => run({}), /bars/);
  assert.throws(() => run({ bars: "nope", period: 2 }), /bars/);
  // too short: need period+1
  assert.throws(() => run({ bars: good.slice(0, 2), period: 2 }), /period \+ 1/);
  // bad period
  assert.throws(() => run({ bars: good, period: 0 }), /period/);
  assert.throws(() => run({ bars: good, period: 1.5 }), /period/);
  assert.throws(() => run({ bars: good, period: -2 }), /period/);
  // bad mult
  assert.throws(() => run({ bars: good, period: 2, mult: 0 }), /mult/);
  assert.throws(() => run({ bars: good, period: 2, mult: NaN }), /mult/);
  assert.throws(() => run({ bars: good, period: 2, mult: "2" }), /mult/);
  // malformed bars
  assert.throws(
    () => run({ bars: [good[0], { high: 11, low: 9 }, good[2]], period: 2 }),
    /finite numeric/
  );
  assert.throws(
    () => run({ bars: [good[0], { high: NaN, low: 9, close: 10 }, good[2]], period: 2 }),
    /finite numeric/
  );
  assert.throws(() => run({ bars: [good[0], null, good[2]], period: 2 }), /bars\[1\]/);
  assert.throws(
    () => run({ bars: [good[0], { high: 8, low: 9, close: 8.5 }, good[2]], period: 2 }),
    /high < low/
  );
});
