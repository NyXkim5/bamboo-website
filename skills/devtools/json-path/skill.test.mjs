import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta contract", () => {
  assert.equal(meta.id, "devtools/json-path");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("simple dot path resolves hand-computed value", () => {
  const object = { a: { b: { c: 42 } } };
  assert.deepEqual(run({ object, path: "a.b.c" }), { value: 42, found: true });
  assert.deepEqual(run({ object, path: "a.b" }), {
    value: { c: 42 },
    found: true,
  });
});

test("bracket array indices, including mixed dot/bracket", () => {
  const object = {
    users: [
      { name: "ada", scores: [10, 20, 30] },
      { name: "grace", scores: [7] },
    ],
  };
  assert.deepEqual(run({ object, path: "users[0].name" }), {
    value: "ada",
    found: true,
  });
  assert.deepEqual(run({ object, path: "users[1].scores[0]" }), {
    value: 7,
    found: true,
  });
  // root-level array with leading bracket
  assert.deepEqual(run({ object: [[5, 6], [7]], path: "[0][1]" }), {
    value: 6,
    found: true,
  });
});

test("quoted bracket keys with special characters", () => {
  const object = { "weird key": { "a.b": 3 } };
  assert.deepEqual(run({ object, path: "['weird key'][\"a.b\"]" }), {
    value: 3,
    found: true,
  });
});

test("missing paths return found:false without throwing", () => {
  const object = { a: [{ b: 1 }], n: null };
  assert.deepEqual(run({ object, path: "a[0].c" }), {
    value: null,
    found: false,
  });
  assert.deepEqual(run({ object, path: "a[5]" }), {
    value: null,
    found: false,
  });
  assert.deepEqual(run({ object, path: "x.y.z" }), {
    value: null,
    found: false,
  });
  assert.deepEqual(run({ object, path: "n.anything" }), {
    value: null,
    found: false,
  });
  // numeric index on a non-array is not found
  assert.deepEqual(run({ object, path: "a[0].b[0]" }), {
    value: null,
    found: false,
  });
});

test("falsy and null values are still found; empty path is root", () => {
  const object = { a: { b: 0, c: false, d: null, e: "" } };
  assert.deepEqual(run({ object, path: "a.b" }), { value: 0, found: true });
  assert.deepEqual(run({ object, path: "a.c" }), { value: false, found: true });
  assert.deepEqual(run({ object, path: "a.d" }), { value: null, found: true });
  assert.deepEqual(run({ object, path: "a.e" }), { value: "", found: true });
  assert.deepEqual(run({ object, path: "" }), { value: object, found: true });
});

test("prototype keys are guarded (not found)", () => {
  const object = JSON.parse('{"__proto__": {"x": 1}, "a": 1}');
  assert.deepEqual(run({ object, path: "__proto__" }), {
    value: null,
    found: false,
  });
  assert.deepEqual(run({ object, path: "__proto__.x" }), {
    value: null,
    found: false,
  });
  assert.deepEqual(run({ object: {}, path: "constructor" }), {
    value: null,
    found: false,
  });
  assert.deepEqual(run({ object: {}, path: "a.prototype" }), {
    value: null,
    found: false,
  });
  // inherited (non-own) properties are not found either
  assert.deepEqual(run({ object: {}, path: "toString" }), {
    value: null,
    found: false,
  });
});

test("malformed or non-string path throws", () => {
  const object = { a: [1] };
  assert.throws(() => run({ object, path: 5 }), /must be a string/);
  assert.throws(() => run({ object, path: null }), /must be a string/);
  assert.throws(() => run({ object, path: "a[" }), /Malformed/);
  assert.throws(() => run({ object, path: "a[]" }), /Malformed/);
  assert.throws(() => run({ object, path: "a[1x]" }), /Malformed/);
  assert.throws(() => run({ object, path: "a." }), /Malformed/);
  assert.throws(() => run({ object, path: "a..b" }), /Malformed/);
  assert.throws(() => run({ object, path: ".a" }), /Malformed/);
  assert.throws(() => run({ object, path: "a['unterminated" }), /Malformed/);
  assert.throws(() => run({ object, path: "a.[0]" }), /Malformed/);
});

test("sparse-array holes are not found, real elements are", () => {
  // eslint-disable-next-line no-sparse-arrays
  const object = [, 1];
  assert.deepEqual(run({ object, path: "[0]" }), {
    value: null,
    found: false,
  });
  assert.deepEqual(run({ object, path: "[1]" }), { value: 1, found: true });
  // out-of-bounds and absurdly large indices stay not-found
  assert.deepEqual(run({ object, path: "[2]" }), {
    value: null,
    found: false,
  });
  assert.deepEqual(run({ object, path: "[99999999999999999999]" }), {
    value: null,
    found: false,
  });
});

test("negative and non-integer indices are malformed (throw, never crash-lookup)", () => {
  const object = [1, 2, 3];
  assert.throws(() => run({ object, path: "[-1]" }), /Malformed/);
  assert.throws(() => run({ object, path: "a[-0]" }), /Malformed/);
  assert.throws(() => run({ object, path: "[0.5]" }), /Malformed/);
  assert.throws(() => run({ object, path: "[ 0 ]" }), /Malformed/);
  // leading zeros are tolerated as plain base-10 indices
  assert.deepEqual(run({ object, path: "[01]" }), { value: 2, found: true });
});

test("-0 and NaN leaf values are found and returned as-is", () => {
  const negZero = run({ object: { a: -0 }, path: "a" });
  assert.equal(negZero.found, true);
  assert.ok(Object.is(negZero.value, -0));
  const nan = run({ object: { a: NaN }, path: "a" });
  assert.equal(nan.found, true);
  assert.ok(Number.isNaN(nan.value));
});

test("empty-string quoted key resolves; empty object/array roots behave", () => {
  assert.deepEqual(run({ object: { "": { "": 5 } }, path: "['']['']" }), {
    value: 5,
    found: true,
  });
  assert.deepEqual(run({ object: {}, path: "a" }), {
    value: null,
    found: false,
  });
  assert.deepEqual(run({ object: [], path: "[0]" }), {
    value: null,
    found: false,
  });
  assert.deepEqual(run({ object: {}, path: "" }), { value: {}, found: true });
});

test("invalid input shape throws", () => {
  assert.throws(() => run(null), /Input must be an object/);
  assert.throws(() => run("a.b"), /Input must be an object/);
  assert.throws(() => run([]), /Input must be an object/);
  assert.throws(() => run({ object: {} }), /must be a string/);
});
