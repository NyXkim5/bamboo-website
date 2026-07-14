import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/pivot-points");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("hand-computed round numbers: H=110 L=90 C=100", () => {
  // P = (110+90+100)/3 = 100
  // R1 = 2*100-90 = 110, S1 = 2*100-110 = 90
  // R2 = 100+20 = 120,   S2 = 100-20 = 80
  // R3 = 110+2*(100-90) = 130, S3 = 90-2*(110-100) = 70
  assert.deepEqual(run({ high: 110, low: 90, close: 100 }), {
    pivot: 100,
    r1: 110,
    r2: 120,
    r3: 130,
    s1: 90,
    s2: 80,
    s3: 70,
  });
});

test("hand-computed decimals: H=105.5 L=101.25 C=103.75", () => {
  // P = 310.5/3 = 103.5
  // R1 = 207-101.25 = 105.75, S1 = 207-105.5 = 101.5
  // R2 = 103.5+4.25 = 107.75, S2 = 103.5-4.25 = 99.25
  // R3 = 105.5+2*2.25 = 110,  S3 = 101.25-2*2 = 97.25
  assert.deepEqual(run({ high: 105.5, low: 101.25, close: 103.75 }), {
    pivot: 103.5,
    r1: 105.75,
    r2: 107.75,
    r3: 110,
    s1: 101.5,
    s2: 99.25,
    s3: 97.25,
  });
});

test("rounds to 4 decimal places: H=100.10 L=99.85 C=100.00", () => {
  // P = 299.95/3 = 99.98333... -> 99.9833
  // R1 = 2P-99.85 = 100.116666... -> 100.1167
  // S1 = 2P-100.10 = 99.866666... -> 99.8667
  // R2 = P+0.25 = 100.233333... -> 100.2333
  // S2 = P-0.25 = 99.733333... -> 99.7333
  // R3 = 100.10+2*(P-99.85) = 100.366666... -> 100.3667
  // S3 = 99.85-2*(100.10-P) = 99.616666... -> 99.6167
  assert.deepEqual(run({ high: 100.1, low: 99.85, close: 100.0 }), {
    pivot: 99.9833,
    r1: 100.1167,
    r2: 100.2333,
    r3: 100.3667,
    s1: 99.8667,
    s2: 99.7333,
    s3: 99.6167,
  });
});

test("degenerate bar (H=L=C) yields all levels equal", () => {
  assert.deepEqual(run({ high: 50, low: 50, close: 50 }), {
    pivot: 50,
    r1: 50,
    r2: 50,
    r3: 50,
    s1: 50,
    s2: 50,
    s3: 50,
  });
});

test("negative prices are allowed (e.g. futures spreads): H=-1 L=-3 C=-2", () => {
  // P = -6/3 = -2
  // R1 = -4-(-3) = -1, S1 = -4-(-1) = -3
  // R2 = -2+2 = 0,     S2 = -2-2 = -4
  // R3 = -1+2*1 = 1,   S3 = -3-2*1 = -5
  assert.deepEqual(run({ high: -1, low: -3, close: -2 }), {
    pivot: -2,
    r1: -1,
    r2: 0,
    r3: 1,
    s1: -3,
    s2: -4,
    s3: -5,
  });
});

test("throws on invalid input", () => {
  assert.throws(() => run(null), /object/);
  assert.throws(() => run("nope"), /object/);
  assert.throws(() => run({ high: 10, low: 9 }), /close must be a finite number/);
  assert.throws(() => run({ high: NaN, low: 9, close: 9.5 }), /high must be a finite number/);
  assert.throws(() => run({ high: Infinity, low: 9, close: 9.5 }), /high must be a finite number/);
  assert.throws(() => run({ high: "10", low: 9, close: 9.5 }), /high must be a finite number/);
  assert.throws(() => run({ high: 8, low: 9, close: 8.5 }), /high must be greater than or equal to low/);
});

test("never returns -0 and accepts -0 inputs", () => {
  // pivot = (0 + -0.00015 + 0)/3 = -0.00005, which naive Math.round-based
  // 4dp rounding turns into -0.
  const res = run({ high: 0, low: -0.00015, close: 0 });
  assert.ok(Object.is(res.pivot, 0), `pivot must be +0, got ${res.pivot} (is -0: ${Object.is(res.pivot, -0)})`);
  const zeros = run({ high: -0, low: -0, close: -0 });
  for (const [key, value] of Object.entries(zeros)) {
    assert.ok(Object.is(value, 0), `${key} must be +0`);
  }
});

test("rejects inherited (prototype-chain) keys", () => {
  const inherited = Object.create({ high: 10, low: 9, close: 9.5 });
  assert.throws(() => run(inherited), /high must be a finite number/);
  const partlyOwn = Object.assign(Object.create({ close: 9.5 }), { high: 10, low: 9 });
  assert.throws(() => run(partlyOwn), /close must be a finite number/);
});

test("huge magnitudes: exact passthrough instead of Infinity", () => {
  // 1e305 * 10000 overflows a double; rounding must not manufacture Infinity.
  const res = run({ high: 1e305, low: 1e305, close: 1e305 });
  assert.deepEqual(res, {
    pivot: 1e305,
    r1: 1e305,
    r2: 1e305,
    r3: 1e305,
    s1: 1e305,
    s2: 1e305,
    s3: 1e305,
  });
});

test("throws when intermediate arithmetic overflows to non-finite", () => {
  // high + low + close and high - low both overflow here.
  assert.throws(() => run({ high: 1e308, low: -1e308, close: 0 }), /non-finite/);
  assert.throws(() => run({ high: 1.5e308, low: 1.4e308, close: 1.45e308 }), /non-finite/);
});

test("run is pure and deterministic", () => {
  const input = { high: 105.5, low: 101.25, close: 103.75 };
  const a = run(input);
  const b = run(input);
  assert.deepEqual(a, b);
  assert.deepEqual(input, { high: 105.5, low: 101.25, close: 103.75 });
});
