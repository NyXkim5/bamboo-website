import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/max-drawdown");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.source, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
});

test("recovered drawdown: hand-computed values", () => {
  // series: [100, 120, 90, 80, 100, 130]
  // running peak: 100,120,120,120,120,130
  // drawdowns: idx2: 90/120-1=-0.25; idx3: 80/120-1=-1/3; idx4: 100/120-1=-1/6
  // worst = -1/3 at trough idx 3 (80), peak idx 1 (120)
  // recovery: first idx > 3 with value >= 120 -> idx 5 (130)
  const out = run({ series: [100, 120, 90, 80, 100, 130] });
  assert.equal(out.maxDrawdown, 80 / 120 - 1);
  assert.ok(Math.abs(out.maxDrawdown - -0.3333333333333333) < 1e-15);
  assert.equal(out.peakIndex, 1);
  assert.equal(out.peakValue, 120);
  assert.equal(out.troughIndex, 3);
  assert.equal(out.troughValue, 80);
  assert.equal(out.recoveryIndex, 5);
  assert.equal(out.recovered, true);
});

test("unrecovered drawdown: hand-computed values", () => {
  // series: [10, 20, 15, 5, 8]
  // peak 20 at idx1, worst trough 5 at idx3, dd = 5/20-1 = -0.75
  // no later value >= 20 -> never recovered
  const out = run({ series: [10, 20, 15, 5, 8] });
  assert.equal(out.maxDrawdown, -0.75);
  assert.equal(out.peakIndex, 1);
  assert.equal(out.peakValue, 20);
  assert.equal(out.troughIndex, 3);
  assert.equal(out.troughValue, 5);
  assert.equal(out.recoveryIndex, null);
  assert.equal(out.recovered, false);
});

test("later deeper drawdown beats earlier shallower one", () => {
  // series: [100, 90, 100, 200, 100]
  // first dd: 90/100-1 = -0.10 (recovers at idx2)
  // second dd: 100/200-1 = -0.50 at trough idx4, peak idx3 -> worst, unrecovered
  const out = run({ series: [100, 90, 100, 200, 100] });
  assert.equal(out.maxDrawdown, -0.5);
  assert.equal(out.peakIndex, 3);
  assert.equal(out.peakValue, 200);
  assert.equal(out.troughIndex, 4);
  assert.equal(out.troughValue, 100);
  assert.equal(out.recoveryIndex, null);
  assert.equal(out.recovered, false);
});

test("monotonically rising series has zero drawdown", () => {
  const out = run({ series: [1, 2, 3, 4] });
  assert.equal(out.maxDrawdown, 0);
  assert.equal(out.peakIndex, 0);
  assert.equal(out.peakValue, 1);
  assert.equal(out.troughIndex, 0);
  assert.equal(out.troughValue, 1);
  assert.equal(out.recoveryIndex, null);
  assert.equal(out.recovered, true);
});

test("single-element and flat series have zero drawdown", () => {
  const single = run({ series: [42] });
  assert.equal(single.maxDrawdown, 0);
  assert.equal(single.recovered, true);

  const flat = run({ series: [7, 7, 7] });
  assert.equal(flat.maxDrawdown, 0);
  assert.equal(flat.peakIndex, 0);
  assert.equal(flat.troughIndex, 0);
  assert.equal(flat.recovered, true);
});

test("simple two-point drop: exact fraction", () => {
  // 80/100 - 1 = -0.2 exactly representable check via closeness
  const out = run({ series: [100, 80] });
  assert.ok(Math.abs(out.maxDrawdown - -0.2) < 1e-15);
  assert.equal(out.peakIndex, 0);
  assert.equal(out.troughIndex, 1);
  assert.equal(out.recoveryIndex, null);
  assert.equal(out.recovered, false);
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("nope"), Error);
  assert.throws(() => run({}), Error);
  assert.throws(() => run({ series: "abc" }), Error);
  assert.throws(() => run({ series: [] }), Error);
  assert.throws(() => run({ series: [100, NaN] }), Error);
  assert.throws(() => run({ series: [100, Infinity] }), Error);
  assert.throws(() => run({ series: [100, "90"] }), Error);
  assert.throws(() => run({ series: [100, 0] }), Error);
  assert.throws(() => run({ series: [100, -5] }), Error);
});

test("edge: prototype-injected series is rejected (own-property required)", () => {
  // `series` living only on the prototype chain must not be picked up.
  assert.throws(() => run(Object.create({ series: [100, 50] })), /own 'series'/);
  // Same values as an own property still work.
  assert.equal(run({ series: [100, 50] }).maxDrawdown, -0.5);
});

test("edge: sparse arrays, -0, and boxed Numbers throw", () => {
  // Hole reads as undefined -> not a finite number.
  // eslint-disable-next-line no-sparse-arrays
  assert.throws(() => run({ series: [100, , 90] }), /finite number/);
  assert.throws(() => run({ series: [100, -0] }), /strictly positive/);
  assert.throws(() => run({ series: [new Number(100), 90] }), /finite number/);
});

test("edge: recovery boundary — exact regain of peak counts as recovered", () => {
  // series: [100, 50, 100] -> dd -0.5; idx2 equals (not exceeds) peak -> recovery.
  const out = run({ series: [100, 50, 100] });
  assert.equal(out.maxDrawdown, -0.5);
  assert.equal(out.peakIndex, 0);
  assert.equal(out.troughIndex, 1);
  assert.equal(out.recoveryIndex, 2);
  assert.equal(out.recovered, true);
});

test("edge: equal-depth drawdowns keep the earliest; zero drawdown is +0 not -0", () => {
  // [100,50,200,100]: dd1 = -0.5 (peak 0, trough 1), dd2 = -0.5 (peak 2, trough 3).
  // Strict `<` comparison keeps the first occurrence; it recovers at idx 2.
  const out = run({ series: [100, 50, 200, 100] });
  assert.equal(out.maxDrawdown, -0.5);
  assert.equal(out.peakIndex, 0);
  assert.equal(out.troughIndex, 1);
  assert.equal(out.recoveryIndex, 2);
  assert.equal(out.recovered, true);

  // Flat series must report positive zero (JSON-safe, Object.is-distinguishable).
  assert.ok(Object.is(run({ series: [5, 5, 5] }).maxDrawdown, 0));
});

test("run is pure: input not mutated, output JSON-serializable and deterministic", () => {
  const series = [100, 120, 90, 80, 100, 130];
  const copy = series.slice();
  const a = run({ series });
  const b = run({ series });
  assert.deepEqual(series, copy);
  assert.deepEqual(a, b);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
});
