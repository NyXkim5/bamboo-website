import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/duration");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("parse: spec examples with hand-computed seconds", () => {
  // 1h30m = 3600 + 30*60 = 5400
  assert.deepEqual(run({ parse: "1h30m" }), { seconds: 5400 });
  // 90m = 90*60 = 5400
  assert.deepEqual(run({ parse: "90m" }), { seconds: 5400 });
  // 2d4h = 2*86400 + 4*3600 = 172800 + 14400 = 187200
  assert.deepEqual(run({ parse: "2d4h" }), { seconds: 187200 });
  // 45s = 45
  assert.deepEqual(run({ parse: "45s" }), { seconds: 45 });
});

test("parse: full-unit combination and decimals", () => {
  // 1d2h3m4s = 86400 + 7200 + 180 + 4 = 93784
  assert.deepEqual(run({ parse: "1d2h3m4s" }), { seconds: 93784 });
  // 1.5h = 5400
  assert.deepEqual(run({ parse: "1.5h" }), { seconds: 5400 });
  // 0s = 0
  assert.deepEqual(run({ parse: "0s" }), { seconds: 0 });
});

test("format: hand-computed compact strings", () => {
  assert.deepEqual(run({ format: 5400 }), { text: "1h 30m" }); // 5400 = 3600 + 1800
  assert.deepEqual(run({ format: 187200 }), { text: "2d 4h" }); // 172800 + 14400
  assert.deepEqual(run({ format: 45 }), { text: "45s" });
  assert.deepEqual(run({ format: 93784 }), { text: "1d 2h 3m 4s" });
  assert.deepEqual(run({ format: 0 }), { text: "0s" });
  assert.deepEqual(run({ format: 3661 }), { text: "1h 1m 1s" });
});

test("round-trip: parse(format(x)) === x for whole seconds", () => {
  for (const x of [1, 59, 60, 3600, 5400, 86400, 187200, 90061]) {
    const { text } = run({ format: x });
    const { seconds } = run({ parse: text.replace(/ /g, "") });
    assert.equal(seconds, x);
  }
});

test("edge: format output round-trips through parse verbatim (whitespace tolerated)", () => {
  assert.deepEqual(run({ parse: "1h 30m" }), { seconds: 5400 });
  for (const x of [45, 5400, 90061, 187200]) {
    const { text } = run({ format: x });
    assert.deepEqual(run({ parse: text }), { seconds: x }); // no space-stripping
  }
});

test("edge: -0 and fractional format inputs", () => {
  assert.deepEqual(run({ format: -0 }), { text: "0s" }); // -0 < 0 is false; treated as zero
  assert.deepEqual(run({ format: 59.6 }), { text: "1m" }); // rounds to 60
  assert.deepEqual(run({ format: 0.4 }), { text: "0s" }); // rounds to 0
});

test("edge: fractional seconds parse exactly; overflow to Infinity rejected", () => {
  assert.deepEqual(run({ parse: "1.5s" }), { seconds: 1.5 });
  assert.deepEqual(run({ parse: "  45s  " }), { seconds: 45 }); // outer trim
  assert.throws(() => run({ parse: "9".repeat(400) + "d" }), Error); // Number(...) => Infinity
});

test("edge: inherited/prototype keys are not treated as input", () => {
  assert.throws(() => run(Object.create({ parse: "1h" })), Error); // own-property check
  assert.throws(() => run({ parse: undefined }), Error); // key present, wrong type
  assert.throws(() => run({ parse: " " }), Error); // whitespace-only trims to empty
});

test("invalid input throws", () => {
  assert.throws(() => run({ parse: "abc" }), Error);
  assert.throws(() => run({ parse: "" }), Error);
  assert.throws(() => run({ parse: "1x" }), Error);
  assert.throws(() => run({ parse: "1h30" }), Error); // trailing number without unit
  assert.throws(() => run({ parse: "-5m" }), Error); // negative not allowed
  assert.throws(() => run({ format: -1 }), Error); // negative seconds
  assert.throws(() => run({ format: NaN }), Error);
  assert.throws(() => run({ format: Infinity }), Error);
  assert.throws(() => run({ format: "5400" }), Error); // wrong type
  assert.throws(() => run({ parse: 90 }), Error); // wrong type
  assert.throws(() => run({}), Error); // neither key
  assert.throws(() => run({ parse: "1h", format: 60 }), Error); // both keys
  assert.throws(() => run(null), Error);
  assert.throws(() => run("1h30m"), Error);
});
