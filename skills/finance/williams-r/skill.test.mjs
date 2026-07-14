// Tests for finance/williams-r
import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

function approx(actual, expected, eps = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) < eps,
    `expected ${actual} to be within ${eps} of ${expected}`
  );
}

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/williams-r");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("happy path: hand-computed %R with period=3", () => {
  const bars = [
    { high: 10, low: 8, close: 9 },
    { high: 11, low: 9, close: 10 },
    { high: 12, low: 10, close: 11 },
    { high: 13, low: 11, close: 12.5 },
  ];
  const out = run({ bars, period: 3 });
  // i=2: HH=12, LL=8  -> (12 - 11)   / 4 * -100 = -25
  // i=3: HH=13, LL=9  -> (13 - 12.5) / 4 * -100 = -12.5
  assert.equal(out.wr.length, 2);
  approx(out.wr[0], -25);
  approx(out.wr[1], -12.5);
  approx(out.latest, -12.5);
  assert.equal(out.signal, "overbought"); // -12.5 > -20
});

test("oversold signal when close is near the lowest low", () => {
  const bars = [
    { high: 10, low: 5, close: 6 },
    { high: 9, low: 5, close: 5.2 },
  ];
  const out = run({ bars, period: 2 });
  // HH=10, LL=5 -> (10 - 5.2) / 5 * -100 = -96
  assert.equal(out.wr.length, 1);
  approx(out.latest, -96);
  assert.equal(out.signal, "oversold"); // -96 < -80
});

test("neutral signal for mid-range close", () => {
  const bars = [
    { high: 10, low: 0, close: 5 },
    { high: 10, low: 0, close: 5 },
  ];
  const out = run({ bars, period: 2 });
  // HH=10, LL=0 -> (10 - 5) / 10 * -100 = -50
  approx(out.latest, -50);
  assert.equal(out.signal, "neutral");
});

test("flat range guard: divide-by-zero window yields -50 neutral", () => {
  const bars = [
    { high: 5, low: 5, close: 5 },
    { high: 5, low: 5, close: 5 },
    { high: 5, low: 5, close: 5 },
  ];
  const out = run({ bars, period: 2 });
  assert.deepEqual(out.wr, [-50, -50]);
  assert.equal(out.latest, -50);
  assert.equal(out.signal, "neutral");
});

test("default period is 14 and values stay within [-100, 0]", () => {
  const bars = [];
  for (let i = 0; i < 14; i++) {
    bars.push({ high: i + 2, low: i, close: i + 1 });
  }
  const out = run({ bars });
  // Exactly one window: HH = 15 (last bar high), LL = 0 (first bar low), close = 14
  // (15 - 14) / 15 * -100 = -6.666...
  assert.equal(out.wr.length, 1);
  approx(out.latest, -100 / 15);
  assert.equal(out.signal, "overbought");
  for (const v of out.wr) {
    assert.ok(v <= 0 && v >= -100, `value ${v} out of [-100, 0]`);
  }
});

test("boundary extremes: close at highest high -> 0, close at lowest low -> -100", () => {
  const top = run({
    bars: [
      { high: 8, low: 4, close: 5 },
      { high: 10, low: 6, close: 10 },
    ],
    period: 2,
  });
  approx(top.latest, 0); // (10 - 10) / (10 - 4) * -100
  assert.equal(top.signal, "overbought");

  const bottom = run({
    bars: [
      { high: 8, low: 4, close: 5 },
      { high: 10, low: 4, close: 4 },
    ],
    period: 2,
  });
  approx(bottom.latest, -100); // (10 - 4) / (10 - 4) * -100
  assert.equal(bottom.signal, "oversold");
});

test("close outside its bar's [low, high] range throws (keeps %R within [-100, 0])", () => {
  // close above high would yield %R = +40 without validation
  assert.throws(
    () =>
      run({
        bars: [
          { high: 10, low: 5, close: 7 },
          { high: 10, low: 5, close: 12 },
        ],
        period: 2,
      }),
    /close outside/
  );
  // close below low would yield %R < -100 without validation
  assert.throws(
    () =>
      run({
        bars: [
          { high: 10, low: 5, close: 7 },
          { high: 10, low: 5, close: 3 },
        ],
        period: 2,
      }),
    /close outside/
  );
});

test("period=1 computes per-bar %R and full-length output", () => {
  const bars = [
    { high: 10, low: 0, close: 7.5 }, // (10 - 7.5) / 10 * -100 = -25
    { high: 4, low: 2, close: 2 },    // (4 - 2)    / 2  * -100 = -100
    { high: 6, low: 6, close: 6 },    // flat bar -> -50 guard
  ];
  const out = run({ bars, period: 1 });
  assert.equal(out.wr.length, 3);
  approx(out.wr[0], -25);
  approx(out.wr[1], -100);
  approx(out.wr[2], -50);
  assert.equal(out.signal, "neutral");
});

test("purity: input bars are not mutated and wr length is bars.length - period + 1", () => {
  const bars = [
    { high: 10, low: 8, close: 9 },
    { high: 11, low: 9, close: 10 },
    { high: 12, low: 10, close: 11 },
    { high: 13, low: 11, close: 12 },
    { high: 14, low: 12, close: 13 },
  ];
  const snapshot = JSON.stringify(bars);
  const out = run({ bars, period: 2 });
  assert.equal(out.wr.length, bars.length - 2 + 1);
  assert.equal(JSON.stringify(bars), snapshot);
});

test("bars with inherited (prototype) OHLC properties are still read correctly", () => {
  const proto = { high: 10, low: 0, close: 5 };
  const bars = [Object.create(proto), { high: 10, low: 0, close: 5 }];
  const out = run({ bars, period: 2 });
  approx(out.latest, -50);
  assert.equal(out.signal, "neutral");
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run({}), Error); // bars missing
  assert.throws(() => run({ bars: "nope", period: 2 }), Error);
  assert.throws(() => run({ bars: [], period: 2 }), Error); // too few bars
  assert.throws(
    () => run({ bars: [{ high: 1, low: 0, close: 0.5 }], period: 2 }),
    Error
  ); // fewer bars than period
  assert.throws(
    () =>
      run({
        bars: [
          { high: 1, low: 0, close: 0.5 },
          { high: NaN, low: 0, close: 0.5 },
        ],
        period: 2,
      }),
    Error
  ); // non-finite field
  assert.throws(
    () =>
      run({
        bars: [
          { high: 1, low: 0, close: 0.5 },
          { high: 1, low: 2, close: 1 },
        ],
        period: 2,
      }),
    Error
  ); // low > high
  assert.throws(
    () => run({ bars: [{ high: 1, low: 0, close: 0.5 }], period: 0 }),
    Error
  ); // bad period
  assert.throws(
    () => run({ bars: [{ high: 1, low: 0, close: 0.5 }], period: 1.5 }),
    Error
  ); // non-integer period
});
