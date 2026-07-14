import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const EPS = 1e-12;
const closeTo = (a, b) => assert.ok(Math.abs(a - b) < EPS, `${a} !~ ${b}`);

test("happy path: cumulative VWAP across three bars", () => {
  const bars = [
    { high: 10, low: 8, close: 9, volume: 100 }, // typical 9,  tpv 900
    { high: 12, low: 10, close: 11, volume: 200 }, // typical 11, tpv 2200
    { high: 11, low: 9, close: 10, volume: 100 }, // typical 10, tpv 1000
  ];
  const out = run({ bars });
  assert.equal(out.vwap.length, 3);
  closeTo(out.vwap[0], 9); // 900/100
  closeTo(out.vwap[1], 3100 / 300); // 10.333...
  closeTo(out.vwap[2], 4100 / 400); // 10.25
  closeTo(out.latest, 10.25);
  assert.equal(out.lastClose, 10);
  assert.equal(out.position, "below"); // 10 < 10.25
});

test("position is 'above' when last close exceeds VWAP", () => {
  const bars = [
    { high: 10, low: 8, close: 9, volume: 100 }, // typical 9
    { high: 14, low: 12, close: 13, volume: 100 }, // typical 13; vwap = 11
  ];
  const out = run({ bars });
  closeTo(out.latest, 11);
  assert.equal(out.position, "above"); // 13 > 11
});

test("edge case: single bar — VWAP equals typical price, position 'equal'", () => {
  const out = run({ bars: [{ high: 10, low: 8, close: 9, volume: 50 }] });
  assert.deepEqual(out.vwap, [9]);
  assert.equal(out.latest, 9);
  assert.equal(out.position, "equal"); // close 9 === typical 9
});

test("edge case: zero-volume bar carries previous VWAP forward", () => {
  const bars = [
    { high: 10, low: 8, close: 9, volume: 100 }, // vwap 9
    { high: 20, low: 18, close: 19, volume: 0 }, // no weight; vwap stays 9
  ];
  const out = run({ bars });
  closeTo(out.vwap[1], 9);
  assert.equal(out.position, "above"); // close 19 > 9
});

test("throws when cumulative volume is zero", () => {
  assert.throws(
    () => run({ bars: [{ high: 10, low: 8, close: 9, volume: 0 }] }),
    /cumulative volume is zero/
  );
});

test("input validation: bad shapes and values throw", () => {
  assert.throws(() => run(null), /input must be an object/);
  assert.throws(() => run({}), /non-empty array/);
  assert.throws(() => run({ bars: [] }), /non-empty array/);
  assert.throws(() => run({ bars: ["x"] }), /bars\[0\] must be an object/);
  assert.throws(
    () => run({ bars: [{ high: 10, low: 8, close: 9 }] }),
    /volume must be a finite number/
  );
  assert.throws(
    () => run({ bars: [{ high: 10, low: 8, close: NaN, volume: 1 }] }),
    /close must be a finite number/
  );
  assert.throws(
    () => run({ bars: [{ high: 10, low: 8, close: 9, volume: -5 }] }),
    /volume must be >= 0/
  );
  assert.throws(
    () => run({ bars: [{ high: 8, low: 10, close: 9, volume: 1 }] }),
    /high .* must be >= low/
  );
});

test("meta conforms to the SkillForge contract", () => {
  assert.equal(meta.id, "finance/vwap");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.inputs === "object" && meta.inputs !== null);
  assert.ok(typeof meta.outputs === "string" && meta.outputs.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("edge case: negative prices (e.g. negative futures) compute correctly", () => {
  const bars = [
    { high: -1, low: -3, close: -2, volume: 10 }, // typical -2, tpv -20
    { high: 0, low: -2, close: -1, volume: 10 }, // typical -1, tpv -10
  ];
  const out = run({ bars });
  closeTo(out.vwap[0], -2); // -20/10
  closeTo(out.vwap[1], -1.5); // -30/20
  assert.equal(out.lastClose, -1);
  assert.equal(out.position, "above"); // -1 > -1.5
});

test("edge case: leading zero-volume bar throws even if later bars trade", () => {
  // VWAP is undefined until volume trades; the skill deterministically rejects
  // rather than emitting NaN or breaking the number[] contract.
  assert.throws(
    () =>
      run({
        bars: [
          { high: 10, low: 8, close: 9, volume: 0 },
          { high: 10, low: 8, close: 9, volume: 100 },
        ],
      }),
    /cumulative volume is zero through bars\[0\]/
  );
});

test("purity: does not mutate input, works on frozen objects", () => {
  const bar = Object.freeze({ high: 10, low: 8, close: 9, volume: 100 });
  const bars = Object.freeze([bar]);
  const input = Object.freeze({ bars });
  const out = run(input); // would throw in strict mode ESM if run mutated input
  assert.deepEqual(out, { vwap: [9], latest: 9, lastClose: 9, position: "equal" });
  assert.deepEqual(bars, [{ high: 10, low: 8, close: 9, volume: 100 }]);
});

test("input validation: non-finite and non-object shapes are rejected", () => {
  assert.throws(
    () => run({ bars: [{ high: Infinity, low: 8, close: 9, volume: 1 }] }),
    /high must be a finite number/
  );
  assert.throws(
    () => run({ bars: [{ high: 10, low: -Infinity, close: 9, volume: 1 }] }),
    /low must be a finite number/
  );
  assert.throws(
    () => run({ bars: [{ high: 10, low: 8, close: 9, volume: "5" }] }),
    /volume must be a finite number/
  );
  assert.throws(() => run(42), /input must be an object/);
  assert.throws(() => run({ bars: {} }), /non-empty array/);
  assert.throws(() => run({ bars: [null] }), /bars\[0\] must be an object/);
});

test("determinism: same input yields identical output", () => {
  const bars = [
    { high: 10, low: 8, close: 9, volume: 100 },
    { high: 12, low: 10, close: 11, volume: 200 },
  ];
  assert.deepEqual(run({ bars }), run({ bars }));
});
