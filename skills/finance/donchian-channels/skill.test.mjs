import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is complete and well-formed", () => {
  assert.equal(meta.id, "finance/donchian-channels");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.equal(typeof meta.name, "string");
  assert.equal(typeof meta.description, "string");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("hand-computed 5 bars, period 3", () => {
  const bars = [
    { high: 10, low: 8 },
    { high: 12, low: 9 },
    { high: 11, low: 9 },
    { high: 13, low: 10 },
    { high: 12, low: 10 },
  ];
  const out = run({ bars, period: 3 });
  // window [10,12,11]/[8,9,9]  -> upper 12, lower 8, middle 10
  // window [12,11,13]/[9,9,10] -> upper 13, lower 9, middle 11
  // window [11,13,12]/[9,10,10]-> upper 13, lower 9, middle 11
  assert.deepEqual(out.upper, [12, 13, 13]);
  assert.deepEqual(out.lower, [8, 9, 9]);
  assert.deepEqual(out.middle, [10, 11, 11]);
  assert.deepEqual(out.latest, { upper: 13, lower: 9, middle: 11 });
});

test("period 1 tracks each bar exactly", () => {
  const bars = [
    { high: 5, low: 3 },
    { high: 7, low: 6 },
  ];
  const out = run({ bars, period: 1 });
  assert.deepEqual(out.upper, [5, 7]);
  assert.deepEqual(out.lower, [3, 6]);
  assert.deepEqual(out.middle, [4, 6.5]);
  assert.deepEqual(out.latest, { upper: 7, lower: 6, middle: 6.5 });
});

test("default period is 20", () => {
  // 20 monotonically rising bars: high = i + 1, low = i (i = 0..19)
  const bars = [];
  for (let i = 0; i < 20; i++) bars.push({ high: i + 1, low: i });
  const out = run({ bars });
  // single window: highest high = 20, lowest low = 0, middle = 10
  assert.equal(out.upper.length, 1);
  assert.deepEqual(out.upper, [20]);
  assert.deepEqual(out.lower, [0]);
  assert.deepEqual(out.middle, [10]);
  assert.deepEqual(out.latest, { upper: 20, lower: 0, middle: 10 });

  // 19 bars must fail against the default period of 20
  assert.throws(() => run({ bars: bars.slice(0, 19) }), RangeError);
});

test("throws when bars.length < period", () => {
  const bars = [
    { high: 10, low: 8 },
    { high: 12, low: 9 },
  ];
  assert.throws(() => run({ bars, period: 3 }), RangeError);
});

test("throws on invalid input shapes", () => {
  assert.throws(() => run(null), TypeError);
  assert.throws(() => run([]), TypeError);
  assert.throws(() => run({ bars: "nope", period: 2 }), TypeError);
  assert.throws(() => run({ bars: [{ high: 1, low: 0 }], period: 0 }), RangeError);
  assert.throws(() => run({ bars: [{ high: 1, low: 0 }], period: 1.5 }), RangeError);
  assert.throws(
    () => run({ bars: [{ high: NaN, low: 0 }], period: 1 }),
    TypeError
  );
  assert.throws(
    () => run({ bars: [{ high: 1 }], period: 1 }),
    TypeError
  );
  assert.throws(
    () => run({ bars: [{ high: 1, low: 2 }], period: 1 }),
    RangeError
  );
});

test("edge: empty bars and sparse-array holes are rejected", () => {
  assert.throws(() => run({ bars: [], period: 1 }), RangeError);
  assert.throws(() => run({ bars: [] }), RangeError); // default period 20
  // hole at index 0 -> bars[0] is undefined, not a bar object
  const sparse = new Array(2);
  sparse[1] = { high: 2, low: 1 };
  assert.throws(() => run({ bars: sparse, period: 2 }), TypeError);
});

test("edge: -0 inputs are normalized (no -0 in output, JSON round-trip safe)", () => {
  const out = run({ bars: [{ high: -0, low: -0 }], period: 1 });
  assert.ok(Object.is(out.upper[0], 0), "upper must be +0");
  assert.ok(Object.is(out.lower[0], 0), "lower must be +0");
  assert.ok(Object.is(out.middle[0], 0), "middle must be +0");
  assert.ok(Object.is(out.latest.middle, 0), "latest.middle must be +0");
  assert.deepEqual(JSON.parse(JSON.stringify(out)), out);
});

test("edge: middle band does not overflow for large finite bounds", () => {
  const M = Number.MAX_VALUE;
  const out = run({ bars: [{ high: M, low: M }], period: 1 });
  assert.equal(out.middle[0], M);
  assert.ok(Number.isFinite(out.middle[0]));
  // negative side and mixed extremes
  const out2 = run({ bars: [{ high: M, low: -M }], period: 1 });
  assert.equal(out2.middle[0], 0);
});

test("edge: impure getters cannot sneak NaN past validation; input is not mutated", () => {
  let highReads = 0;
  const trickBar = {
    get high() {
      highReads += 1;
      return highReads === 1 ? 10 : NaN; // valid on first read only
    },
    low: 5,
  };
  const out = run({ bars: [trickBar], period: 1 });
  assert.deepEqual(out.upper, [10]);
  assert.deepEqual(out.middle, [7.5]);
  assert.ok(out.upper.every(Number.isFinite));

  // purity: frozen input runs fine and is untouched
  const bars = Object.freeze([
    Object.freeze({ high: 4, low: 2 }),
    Object.freeze({ high: 6, low: 3 }),
  ]);
  const frozenOut = run({ bars, period: 2 });
  assert.deepEqual(frozenOut.latest, { upper: 6, lower: 2, middle: 4 });
  assert.deepEqual(bars, [{ high: 4, low: 2 }, { high: 6, low: 3 }]);
});

test("output is JSON-serializable and deterministic", () => {
  const bars = [
    { high: 3, low: 1 },
    { high: 4, low: 2 },
    { high: 2.5, low: 0.5 },
  ];
  const a = run({ bars, period: 2 });
  const b = run({ bars, period: 2 });
  assert.deepEqual(a, b);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
  // hand-computed: windows -> upper [4,4], lower [1,0.5], middle [2.5,2.25]
  assert.deepEqual(a.upper, [4, 4]);
  assert.deepEqual(a.lower, [1, 0.5]);
  assert.deepEqual(a.middle, [2.5, 2.25]);
});
