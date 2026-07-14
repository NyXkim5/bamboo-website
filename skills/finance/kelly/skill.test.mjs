import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const approx = (actual, expected, eps = 1e-12) => {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `expected ${actual} to be within ${eps} of ${expected}`
  );
};

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/kelly");
  assert.equal(meta.domain, "finance");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.source, "string");
});

test("classic case: p=0.6, b=2 -> kelly=0.4, halfKelly=0.2", () => {
  // hand-computed: 0.6 - (1-0.6)/2 = 0.6 - 0.2 = 0.4
  const out = run({ winProb: 0.6, winLossRatio: 2 });
  approx(out.kelly, 0.4);
  approx(out.halfKelly, 0.2);
});

test("even-money edge: p=0.55, b=1 -> kelly=0.1, halfKelly=0.05", () => {
  // hand-computed: 0.55 - 0.45/1 = 0.10
  const out = run({ winProb: 0.55, winLossRatio: 1 });
  approx(out.kelly, 0.1);
  approx(out.halfKelly, 0.05);
});

test("fair coin at even money: p=0.5, b=1 -> kelly=0", () => {
  // hand-computed: 0.5 - 0.5/1 = 0
  const out = run({ winProb: 0.5, winLossRatio: 1 });
  assert.equal(out.kelly, 0);
  assert.equal(out.halfKelly, 0);
});

test("negative edge is clamped to 0: p=0.4, b=1", () => {
  // hand-computed raw: 0.4 - 0.6/1 = -0.2 -> clamp to 0
  const out = run({ winProb: 0.4, winLossRatio: 1 });
  assert.equal(out.kelly, 0);
  assert.equal(out.halfKelly, 0);
});

test("boundary probabilities: p=1 bets everything, p=0 bets nothing", () => {
  // p=1, b=3: 1 - 0/3 = 1
  const sure = run({ winProb: 1, winLossRatio: 3 });
  assert.equal(sure.kelly, 1);
  assert.equal(sure.halfKelly, 0.5);
  // p=0, b=2: 0 - 1/2 = -0.5 -> 0
  const never = run({ winProb: 0, winLossRatio: 2 });
  assert.equal(never.kelly, 0);
  assert.equal(never.halfKelly, 0);
});

test("fractional b: p=0.7, b=0.5 -> kelly=0.1", () => {
  // hand-computed: 0.7 - 0.3/0.5 = 0.7 - 0.6 = 0.1
  const out = run({ winProb: 0.7, winLossRatio: 0.5 });
  approx(out.kelly, 0.1);
  approx(out.halfKelly, 0.05);
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run({}), Error);
  assert.throws(() => run({ winProb: 1.5, winLossRatio: 2 }), Error);
  assert.throws(() => run({ winProb: -0.1, winLossRatio: 2 }), Error);
  assert.throws(() => run({ winProb: 0.5, winLossRatio: 0 }), Error);
  assert.throws(() => run({ winProb: 0.5, winLossRatio: -1 }), Error);
  assert.throws(() => run({ winProb: "0.5", winLossRatio: 2 }), Error);
  assert.throws(() => run({ winProb: NaN, winLossRatio: 2 }), Error);
  assert.throws(() => run({ winProb: 0.5, winLossRatio: Infinity }), Error);
});

test("edge: -0 winProb is accepted and outputs are +0, never -0", () => {
  const out = run({ winProb: -0, winLossRatio: 2 });
  assert.ok(Object.is(out.kelly, 0), "kelly must be +0, not -0");
  assert.ok(Object.is(out.halfKelly, 0), "halfKelly must be +0, not -0");
  // break-even raw === 0 path must also yield +0
  const even = run({ winProb: 0.5, winLossRatio: 1 });
  assert.ok(Object.is(even.kelly, 0));
  assert.ok(Object.is(even.halfKelly, 0));
  // -0 winLossRatio is not > 0 -> rejected
  assert.throws(() => run({ winProb: 0.5, winLossRatio: -0 }), Error);
});

test("edge: extreme winLossRatio never yields NaN or negative output", () => {
  // subnormal b: (1-p)/b overflows to Infinity -> raw=-Infinity -> clamp 0
  const tiny = run({ winProb: 0.9, winLossRatio: 5e-324 });
  assert.equal(tiny.kelly, 0);
  assert.equal(tiny.halfKelly, 0);
  // huge b: kelly approaches p from below; hand-computed 0.5 - 0.5/1e9
  const huge = run({ winProb: 0.5, winLossRatio: 1e9 });
  approx(huge.kelly, 0.5 - 5e-10);
  assert.ok(huge.kelly < 0.5 && huge.kelly > 0);
  // p=1 with tiny b: 0/b = 0 -> kelly exactly 1, never above
  const sure = run({ winProb: 1, winLossRatio: 5e-324 });
  assert.equal(sure.kelly, 1);
});

test("edge: hostile input shapes throw", () => {
  assert.throws(() => run(undefined), Error);
  assert.throws(() => run([0.6, 2]), Error); // array
  assert.throws(() => run(() => {}), Error); // function
  assert.throws(() => run(Object.create(null)), Error); // no prototype
  assert.throws(
    () => run({ winProb: new Number(0.6), winLossRatio: 2 }),
    Error
  ); // boxed Number
  assert.throws(() => run({ winProb: true, winLossRatio: 2 }), Error);
  assert.throws(() => run({ winProb: 0.6, winLossRatio: "2" }), Error);
  assert.throws(() => run({ winProb: 0.6, winLossRatio: NaN }), Error);
  assert.throws(() => run({ winProb: -Infinity, winLossRatio: 2 }), Error);
});

test("edge: output has exactly the two documented own keys", () => {
  const out = run({ winProb: 0.6, winLossRatio: 2 });
  assert.deepEqual(Object.keys(out).sort(), ["halfKelly", "kelly"]);
  assert.equal(Object.getPrototypeOf(out), Object.prototype);
});

test("result is JSON-serializable and deterministic", () => {
  const a = run({ winProb: 0.6, winLossRatio: 2 });
  const b = run({ winProb: 0.6, winLossRatio: 2 });
  assert.deepEqual(a, b);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
});
