import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has required fields", () => {
  assert.equal(meta.id, "finance/obv");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("happy path: mixed up/down/equal closes", () => {
  const bars = [
    { close: 10, volume: 100 }, // start: 0
    { close: 11, volume: 200 }, // up:   +200 -> 200
    { close: 10, volume: 150 }, // down: -150 -> 50
    { close: 10, volume: 300 }, // equal:      50
    { close: 12, volume: 50 },  // up:   +50 -> 100
  ];
  const out = run({ bars });
  assert.deepEqual(out.obv, [0, 200, 50, 50, 100]);
  assert.equal(out.latest, 100);
  assert.equal(out.trend, "rising");
});

test("falling trend when cumulative OBV ends below start", () => {
  const bars = [
    { close: 20, volume: 100 },
    { close: 19, volume: 400 }, // -400
    { close: 20, volume: 100 }, // +100 -> -300
  ];
  const out = run({ bars });
  assert.deepEqual(out.obv, [0, -400, -300]);
  assert.equal(out.latest, -300);
  assert.equal(out.trend, "falling");
});

test("edge case: single bar yields flat trend with OBV 0", () => {
  const out = run({ bars: [{ close: 5, volume: 1000 }] });
  assert.deepEqual(out.obv, [0]);
  assert.equal(out.latest, 0);
  assert.equal(out.trend, "flat");
});

test("edge case: all equal closes stay flat at 0", () => {
  const bars = [
    { close: 7, volume: 10 },
    { close: 7, volume: 20 },
    { close: 7, volume: 30 },
  ];
  const out = run({ bars });
  assert.deepEqual(out.obv, [0, 0, 0]);
  assert.equal(out.trend, "flat");
});

test("invalid input: missing/empty bars throws", () => {
  assert.throws(() => run(null), /object/);
  assert.throws(() => run({}), /non-empty array/);
  assert.throws(() => run({ bars: [] }), /non-empty array/);
});

test("invalid input: bad close or volume throws with index", () => {
  assert.throws(
    () => run({ bars: [{ close: "10", volume: 5 }] }),
    /bars\[0\]\.close/
  );
  assert.throws(
    () => run({ bars: [{ close: 10, volume: 5 }, { close: 11, volume: -1 }] }),
    /bars\[1\]\.volume/
  );
  assert.throws(
    () => run({ bars: [{ close: NaN, volume: 5 }] }),
    /finite/
  );
});

test("edge case: zero-volume bars leave OBV unchanged", () => {
  const bars = [
    { close: 1, volume: 100 },
    { close: 2, volume: 0 }, // up, but zero volume -> +0
    { close: 1, volume: 0 }, // down, zero volume -> -0 (still 0)
    { close: 3, volume: 5 }, // up -> +5
  ];
  const out = run({ bars });
  assert.deepEqual(out.obv, [0, 0, 0, 5]);
  assert.equal(out.trend, "rising");
  // ensure no -0 leaks into the series
  assert.ok(out.obv.every((v) => !Object.is(v, -0)));
});

test("edge case: negative closes compare correctly", () => {
  const bars = [
    { close: -5, volume: 10 },
    { close: -4, volume: 20 }, // up: +20
    { close: -6, volume: 30 }, // down: -30 -> -10
  ];
  const out = run({ bars });
  assert.deepEqual(out.obv, [0, 20, -10]);
  assert.equal(out.trend, "falling");
});

test("invalid input: null bar entry and non-finite values throw", () => {
  assert.throws(
    () => run({ bars: [{ close: 1, volume: 1 }, null] }),
    /bars\[1\]/
  );
  assert.throws(
    () => run({ bars: [{ close: Infinity, volume: 1 }] }),
    /bars\[0\]\.close/
  );
  assert.throws(
    () => run({ bars: [{ close: 1, volume: NaN }] }),
    /bars\[0\]\.volume/
  );
  assert.throws(
    () => run({ bars: [{ close: 1 }] }),
    /bars\[0\]\.volume/
  );
});

test("purity: works on frozen input without throwing", () => {
  const bars = Object.freeze([
    Object.freeze({ close: 1, volume: 10 }),
    Object.freeze({ close: 2, volume: 20 }),
  ]);
  const out = run(Object.freeze({ bars }));
  assert.deepEqual(out.obv, [0, 20]);
});

test("run is pure: does not mutate input", () => {
  const bars = [
    { close: 1, volume: 10 },
    { close: 2, volume: 20 },
  ];
  const copy = JSON.parse(JSON.stringify(bars));
  run({ bars });
  assert.deepEqual(bars, copy);
});
