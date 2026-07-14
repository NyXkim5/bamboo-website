import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/query-string");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("parse: repeated keys become arrays", () => {
  assert.deepEqual(run({ parse: "a=1&b=2&b=3" }), {
    query: { a: "1", b: ["2", "3"] },
  });
  assert.deepEqual(run({ parse: "x=1&x=2&x=3" }), {
    query: { x: ["1", "2", "3"] },
  });
});

test("parse: leading '?', empty string, and bare keys", () => {
  assert.deepEqual(run({ parse: "?a=1&b=2" }), {
    query: { a: "1", b: "2" },
  });
  assert.deepEqual(run({ parse: "" }), { query: {} });
  assert.deepEqual(run({ parse: "?" }), { query: {} });
  assert.deepEqual(run({ parse: "flag&a=" }), {
    query: { flag: "", a: "" },
  });
});

test("parse: URL-decodes percent-encoding and plus-as-space", () => {
  assert.deepEqual(run({ parse: "name=John%20Doe&city=New+York" }), {
    query: { name: "John Doe", city: "New York" },
  });
  assert.deepEqual(run({ parse: "q=a%26b%3Dc&sym=%E2%9C%93" }), {
    query: { q: "a&b=c", sym: "✓" },
  });
});

test("parse: value containing '=' is preserved after first split", () => {
  assert.deepEqual(run({ parse: "eq=a=b=c" }), { query: { eq: "a=b=c" } });
});

test("stringify: basic object and arrays as repeated keys", () => {
  assert.deepEqual(run({ stringify: { a: 1, b: 2 } }), {
    string: "a=1&b=2",
  });
  assert.deepEqual(run({ stringify: { a: "1", b: ["2", "3"] } }), {
    string: "a=1&b=2&b=3",
  });
});

test("stringify: URL-encodes keys and values, skips null/undefined", () => {
  assert.deepEqual(
    run({ stringify: { "my key": "a&b", city: "New York", skip: null, gone: undefined } }),
    { string: "my%20key=a%26b&city=New%20York" }
  );
  assert.deepEqual(run({ stringify: { ok: true, n: 0 } }), {
    string: "ok=true&n=0",
  });
});

test("round-trip: stringify then parse recovers the object", () => {
  const original = { a: "1", b: ["2", "3"], msg: "hello world & more" };
  const { string } = run({ stringify: original });
  assert.equal(string, "a=1&b=2&b=3&msg=hello%20world%20%26%20more");
  const { query } = run({ parse: string });
  assert.deepEqual(query, original);
});

test("parse: '__proto__' and other prototype keys become safe own properties", () => {
  const { query } = run({ parse: "__proto__=x&__proto__=y&constructor=c" });
  assert.ok(Object.prototype.hasOwnProperty.call(query, "__proto__"));
  assert.deepEqual(query["__proto__"], ["x", "y"]);
  assert.equal(query["constructor"], "c");
  assert.equal(Object.getPrototypeOf(query), Object.prototype); // no pollution
  assert.equal(Object.prototype.polluted, undefined);
  // percent-encoded form decodes to the same safe own property
  const enc = run({ parse: "%5F%5Fproto%5F%5F=z" }).query;
  assert.ok(Object.prototype.hasOwnProperty.call(enc, "__proto__"));
  assert.equal(enc["__proto__"], "z");
});

test("stringify: skips null/undefined items inside arrays", () => {
  assert.deepEqual(run({ stringify: { a: [1, null, 2, undefined, 3] } }), {
    string: "a=1&a=2&a=3",
  });
  assert.deepEqual(run({ stringify: { a: [null, undefined] } }), {
    string: "",
  });
});

test("stringify: non-finite numbers throw; -0 serializes as '0'", () => {
  assert.throws(() => run({ stringify: { a: NaN } }), Error);
  assert.throws(() => run({ stringify: { a: Infinity } }), Error);
  assert.throws(() => run({ stringify: { a: [1, -Infinity] } }), Error);
  assert.deepEqual(run({ stringify: { a: -0 } }), { string: "a=0" });
});

test("edge: empty object stringifies to '' and round-trips; '=v' yields empty key", () => {
  assert.deepEqual(run({ stringify: {} }), { string: "" });
  assert.deepEqual(run({ parse: "" }), { query: {} });
  assert.deepEqual(run({ parse: "=5&=6" }), { query: { "": ["5", "6"] } });
});

test("invalid input throws", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("a=1"), Error);
  assert.throws(() => run({}), Error);
  assert.throws(() => run({ parse: "a=1", stringify: { a: 1 } }), Error);
  assert.throws(() => run({ parse: 42 }), Error);
  assert.throws(() => run({ stringify: "a=1" }), Error);
  assert.throws(() => run({ stringify: [1, 2] }), Error);
  assert.throws(() => run({ stringify: { a: { nested: true } } }), Error);
  assert.throws(() => run({ parse: "a=%ZZ" }), Error);
});
