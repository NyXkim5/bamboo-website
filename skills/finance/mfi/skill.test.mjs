import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

// Helper: bar with high=low=close so typical price === close (easy hand math).
const flat = (c, v) => ({ high: c, low: c, close: c, volume: v });

test("meta contract", () => {
  assert.equal(meta.id, "finance/mfi");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.1");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("hand-computed MFI, period=3", () => {
  // typical prices: 10, 12, 11, 13, 12
  // signed raw flows: +12*200=+2400, -11*150=-1650, +13*100=+1300, -12*300=-3600
  const bars = [
    flat(10, 100),
    flat(12, 200),
    flat(11, 150),
    flat(13, 100),
    flat(12, 300),
  ];
  const out = run({ bars, period: 3 });
  assert.equal(out.mfi.length, 2); // bars.length - period

  // i=3: pos=2400+1300=3700, neg=1650
  // MFI = 100 - 100/(1 + 3700/1650) = 100*3700/5350 = 69.15887850467289...
  const expected0 = 100 - 100 / (1 + 3700 / 1650);
  assert.ok(Math.abs(out.mfi[0] - 69.15887850467289) < 1e-9);
  assert.ok(Math.abs(out.mfi[0] - expected0) < 1e-12);

  // i=4: pos=1300, neg=1650+3600=5250
  // MFI = 100 - 100/(1 + 1300/5250) = 100*1300/6550 = 19.84732824427481...
  assert.ok(Math.abs(out.mfi[1] - 19.84732824427481) < 1e-9);

  assert.equal(out.latest, out.mfi[1]);
  assert.equal(out.signal, "oversold"); // 19.85 < 20
});

test("mixed high/low/close typical price, period=2", () => {
  // typical: (12+8+10)/3=10, (15+9+12)/3=12, (14+10+11)/3=35/3
  const bars = [
    { high: 12, low: 8, close: 10, volume: 100 },
    { high: 15, low: 9, close: 12, volume: 50 },
    { high: 14, low: 10, close: 11, volume: 60 },
  ];
  const out = run({ bars, period: 2 });
  assert.equal(out.mfi.length, 1);
  // flows: i=1: typical 12 > 10 -> pos = 12*50 = 600
  //        i=2: typical 35/3 ≈ 11.6667 < 12 -> neg = (35/3)*60 = 700
  // MFI = 100 - 100/(1 + 600/700) = 100*600/1300 = 46.153846...
  assert.ok(Math.abs(out.mfi[0] - 46.153846153846153) < 1e-9);
  assert.equal(out.signal, "neutral");
});

test("zero negative flow yields 100 and overbought; zero flow both ways yields 50 neutral", () => {
  const rising = [flat(10, 100), flat(11, 100), flat(12, 100), flat(13, 100)];
  const up = run({ bars: rising, period: 3 });
  assert.deepEqual(up.mfi, [100]);
  assert.equal(up.latest, 100);
  assert.equal(up.signal, "overbought");

  // All typical prices equal: 0/0 money flow ratio -> midpoint 50, neutral
  // (a flat market must not signal an extreme).
  const still = [flat(10, 100), flat(10, 200), flat(10, 300), flat(10, 400)];
  const out = run({ bars: still, period: 3 });
  assert.deepEqual(out.mfi, [50]);
  assert.equal(out.signal, "neutral");

  // Zero volume everywhere: also 0/0 -> 50 neutral, even though prices move.
  const noVol = [flat(10, 0), flat(11, 0), flat(9, 0), flat(12, 0)];
  const nv = run({ bars: noVol, period: 3 });
  assert.deepEqual(nv.mfi, [50]);
  assert.equal(nv.signal, "neutral");
});

test("zero positive flow yields 0 and oversold", () => {
  const falling = [flat(13, 100), flat(12, 100), flat(11, 100), flat(10, 100)];
  const out = run({ bars: falling, period: 3 });
  assert.deepEqual(out.mfi, [0]);
  assert.equal(out.signal, "oversold");
});

test("default period is 14 and output is deterministic", () => {
  const bars = [];
  for (let i = 0; i < 16; i++) bars.push(flat(10 + i, 100 + i));
  const out = run({ bars });
  assert.equal(out.mfi.length, 2); // 16 - 14
  assert.deepEqual(out.mfi, [100, 100]); // strictly rising -> no negative flow
  assert.equal(out.signal, "overbought");

  const again = run({ bars });
  assert.deepEqual(again, out); // pure/deterministic
  assert.equal(JSON.stringify(out), JSON.stringify(JSON.parse(JSON.stringify(out)))); // JSON-serializable
});

test("invalid inputs throw", () => {
  const good = [flat(10, 1), flat(11, 1), flat(12, 1), flat(13, 1)];
  assert.throws(() => run(null), Error);
  assert.throws(() => run([]), Error);
  assert.throws(() => run({}), Error); // bars missing
  assert.throws(() => run({ bars: "nope", period: 3 }), Error);
  assert.throws(() => run({ bars: good, period: 0 }), Error);
  assert.throws(() => run({ bars: good, period: 2.5 }), Error);
  assert.throws(() => run({ bars: good, period: -3 }), Error);
  // Too few bars: need period+1
  assert.throws(() => run({ bars: good.slice(0, 3), period: 3 }), Error);
  // Malformed bar fields
  assert.throws(() => run({ bars: [...good.slice(1), { high: 1, low: 1, close: 1 }], period: 3 }), Error);
  assert.throws(
    () => run({ bars: [...good.slice(1), { high: NaN, low: 1, close: 1, volume: 1 }], period: 3 }),
    Error
  );
  assert.throws(
    () => run({ bars: [...good.slice(1), { high: 1, low: 1, close: 1, volume: -5 }], period: 3 }),
    Error
  );
  // Non-finite field values throw
  assert.throws(
    () => run({ bars: [...good.slice(1), { high: 1, low: 1, close: 1, volume: Infinity }], period: 3 }),
    Error
  );
  // Sparse array hole (undefined bar) throws
  const sparse = [flat(10, 1), , flat(11, 1), flat(12, 1)]; // eslint-disable-line no-sparse-arrays
  assert.throws(() => run({ bars: sparse, period: 3 }), /bars\[1\]/);
});

test("negative typical price is rejected (money flow must be non-negative)", () => {
  // Negative prices make raw money flow negative, pushing MFI outside [0,100].
  const bars = [flat(10, 100), flat(-9, 100), flat(11, 100), flat(12, 100)];
  assert.throws(() => run({ bars, period: 3 }), /typical price/);
});

test("finite inputs that overflow money flow throw instead of returning NaN", () => {
  const big = 1e308;
  // typical*volume = 1e308*1e308 = Infinity even though every field is finite.
  const bars = [flat(1, 1), flat(big, big), flat(1, 1), flat(2, 1)];
  assert.throws(() => run({ bars, period: 3 }), /non-finite/);

  // Individually finite raw flows whose window SUM overflows must also throw.
  const half = 1.6e308; // finite; half + half = Infinity
  const sumBars = [
    flat(1, 1),
    { high: 2, low: 2, close: 2, volume: half / 2 }, // pos raw = 1.6e308
    { high: 3, low: 3, close: 3, volume: half / 3 }, // pos raw = 1.6e308
    flat(4, 1),
  ];
  assert.throws(() => run({ bars: sumBars, period: 3 }), /overflows/);
});

test("negative zero volume and -0 prices behave as plain zero", () => {
  // -0 volume passes the non-negative check and contributes zero flow.
  const bars = [flat(10, 100), flat(11, -0), flat(12, 50)];
  const out = run({ bars, period: 2 });
  // Window flows: pos = 11*(-0) + 12*50 = 600, neg = 0 -> MFI 100.
  assert.deepEqual(out.mfi, [100]);
  assert.ok(!Object.is(out.mfi[0], -0));

  // Flat prices with -0 volume: 0/0 -> 50, and never a signed-zero result.
  const still = [flat(10, -0), flat(10, -0), flat(10, -0)];
  const s = run({ bars: still, period: 2 });
  assert.deepEqual(s.mfi, [50]);
  assert.equal(s.signal, "neutral");

  // A -0 price component is fine: typical price -0 is not "negative".
  const zeroPx = [
    { high: -0, low: -0, close: -0, volume: 10 },
    { high: 1, low: 1, close: 1, volume: 10 },
    { high: 2, low: 2, close: 2, volume: 10 },
  ];
  const z = run({ bars: zeroPx, period: 2 });
  assert.deepEqual(z.mfi, [100]); // strictly rising from 0 -> all positive flow
});

test("inherited (prototype) properties on the input object are honored, extra junk ignored", () => {
  const bars = [flat(10, 1), flat(11, 1), flat(12, 1)];
  const proto = { period: 2, junk: "ignored" };
  const input = Object.assign(Object.create(proto), { bars });
  const out = run(input);
  assert.deepEqual(out.mfi, [100]); // period 2 read from the prototype chain
});
