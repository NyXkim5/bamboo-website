import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

function flatBar(price) {
  return { high: price, low: price, close: price };
}

test("meta contract", () => {
  assert.equal(meta.id, "finance/cci");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("hand-computed: monotone rising typical prices, period 3", () => {
  // typical prices are exactly 1,2,3,4,5 (high=low=close)
  // window [1,2,3]: sma=2, meanDev=(1+0+1)/3=2/3, cci=(3-2)/(0.015*2/3)=1/0.01=100
  // window [2,3,4]: sma=3, meanDev=2/3, cci=(4-3)/0.01=100
  // window [3,4,5]: sma=4, meanDev=2/3, cci=100
  const bars = [1, 2, 3, 4, 5].map(flatBar);
  const { cci, latest } = run({ bars, period: 3 });
  assert.equal(cci.length, 3);
  for (const v of cci) assert.ok(Math.abs(v - 100) < 1e-9, `expected 100, got ${v}`);
  assert.ok(Math.abs(latest - 100) < 1e-9);
});

test("hand-computed: mixed high/low/close, period 2", () => {
  // bar1: tp=(3+1+2)/3=2; bar2: tp=(6+2+4)/3=4
  // sma=3, meanDev=(|2-3|+|4-3|)/2=1, cci=(4-3)/(0.015*1)=66.6666...
  const bars = [
    { high: 3, low: 1, close: 2 },
    { high: 6, low: 2, close: 4 },
  ];
  const { cci, latest } = run({ bars, period: 2 });
  assert.equal(cci.length, 1);
  assert.ok(Math.abs(cci[0] - 1 / 0.015) < 1e-9, `expected ${1 / 0.015}, got ${cci[0]}`);
  assert.equal(latest, cci[0]);
});

test("flat market yields 0 (zero mean-deviation guard)", () => {
  const bars = Array.from({ length: 25 }, () => flatBar(50));
  const { cci, latest } = run({ bars, period: 5 });
  assert.equal(cci.length, 21);
  for (const v of cci) assert.equal(v, 0);
  assert.equal(latest, 0);
});

test("default period is 20", () => {
  // 20 flat bars then one rising bar; with default period=20 we get 2 values
  const bars = Array.from({ length: 20 }, () => flatBar(10));
  bars.push(flatBar(30));
  const { cci, latest } = run({ bars });
  assert.equal(cci.length, 2);
  assert.equal(cci[0], 0); // fully flat first window
  // second window: 19 bars of tp=10, one of tp=30; sma=11
  // meanDev=(19*1 + 19)/20 = 38/20 = 1.9; cci=(30-11)/(0.015*1.9)=19/0.0285
  assert.ok(Math.abs(cci[1] - 19 / 0.0285) < 1e-9, `got ${cci[1]}`);
  assert.equal(latest, cci[1]);
});

test("fewer bars than period gives empty result", () => {
  const { cci, latest } = run({ bars: [flatBar(1), flatBar(2)], period: 5 });
  assert.deepEqual(cci, []);
  assert.equal(latest, null);
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run({}), Error); // bars missing
  assert.throws(() => run({ bars: "nope" }), Error);
  assert.throws(() => run({ bars: [flatBar(1)], period: 0 }), Error);
  assert.throws(() => run({ bars: [flatBar(1)], period: 2.5 }), Error);
  assert.throws(() => run({ bars: [flatBar(1)], period: -3 }), Error);
  assert.throws(() => run({ bars: [{ high: 1, low: 0 }], period: 1 }), Error); // missing close
  assert.throws(() => run({ bars: [{ high: NaN, low: 0, close: 1 }], period: 1 }), Error);
  assert.throws(() => run({ bars: [{ high: 1, low: 2, close: 1.5 }], period: 1 }), Error); // low > high
  assert.throws(() => run({ bars: [null], period: 1 }), Error);
  assert.throws(() => run({ bars: new Array(3), period: 1 }), Error); // sparse holes
  assert.throws(() => run({ bars: [flatBar(1), undefined], period: 1 }), Error);
});

test("edge: empty bars array gives empty result", () => {
  const { cci, latest } = run({ bars: [], period: 3 });
  assert.deepEqual(cci, []);
  assert.equal(latest, null);
});

test("edge: negative-zero typical price never emits -0", () => {
  // typical prices: 1, -1, -0 -> window sum is +0, sma = 0, meanDev = 2/3
  // numerator is (-0 - 0) = -0; unnormalized this yields -0, which breaks
  // Object.is-based deep equality and JSON round-tripping.
  const bars = [flatBar(1), flatBar(-1), flatBar(-0)];
  const { cci, latest } = run({ bars, period: 3 });
  assert.equal(cci.length, 1);
  assert.ok(Object.is(cci[0], 0), `expected +0, got ${Object.is(cci[0], -0) ? "-0" : cci[0]}`);
  assert.ok(Object.is(latest, 0));
  assert.deepEqual(JSON.parse(JSON.stringify({ cci, latest })), { cci, latest });
});

test("edge: period 1 always yields 0 (window deviation is zero)", () => {
  const bars = [flatBar(3), flatBar(7), flatBar(-2)];
  const { cci, latest } = run({ bars, period: 1 });
  assert.deepEqual(cci, [0, 0, 0]);
  assert.equal(latest, 0);
});

test("edge: negative prices are valid and hand-computed", () => {
  // typical prices: -2, -4, -6; sma = -4, meanDev = (2+0+2)/3 = 4/3
  // cci = (-6 - (-4)) / (0.015 * 4/3) = -2 / 0.02 = -100
  const bars = [flatBar(-2), flatBar(-4), flatBar(-6)];
  const { cci, latest } = run({ bars, period: 3 });
  assert.equal(cci.length, 1);
  assert.ok(Math.abs(cci[0] - -100) < 1e-9, `expected -100, got ${cci[0]}`);
  assert.equal(latest, cci[0]);
});

test("result is JSON-serializable and deterministic", () => {
  const bars = [
    { high: 10, low: 8, close: 9 },
    { high: 11, low: 9, close: 10 },
    { high: 12, low: 10, close: 11 },
    { high: 11, low: 9, close: 10 },
  ];
  const a = run({ bars, period: 3 });
  const b = run({ bars, period: 3 });
  assert.deepEqual(a, b);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
});
