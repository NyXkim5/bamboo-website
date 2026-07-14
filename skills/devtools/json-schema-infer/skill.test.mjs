// Tests for devtools/json-schema-infer
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has required contract fields", () => {
  assert.equal(meta.id, "devtools/json-schema-infer");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.source, "string");
});

test("happy path: nested object with mixed types", () => {
  const { schema } = run({
    value: {
      name: "Ada",
      age: 36,
      score: 4.5,
      active: true,
      nickname: null,
      pets: [{ kind: "cat", legs: 4 }],
    },
  });
  assert.deepEqual(schema, {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "integer" },
      score: { type: "number" },
      active: { type: "boolean" },
      nickname: { type: "null" },
      pets: {
        type: "array",
        items: {
          type: "object",
          properties: {
            kind: { type: "string" },
            legs: { type: "integer" },
          },
          required: ["kind", "legs"],
        },
      },
    },
    required: ["name", "age", "score", "active", "nickname", "pets"],
  });
});

test("scalar types: string, integer, number, boolean, null", () => {
  assert.deepEqual(run({ value: "hi" }).schema, { type: "string" });
  assert.deepEqual(run({ value: 42 }).schema, { type: "integer" });
  assert.deepEqual(run({ value: 3.14 }).schema, { type: "number" });
  assert.deepEqual(run({ value: false }).schema, { type: "boolean" });
  assert.deepEqual(run({ value: null }).schema, { type: "null" });
});

test("array items inferred from first element", () => {
  assert.deepEqual(run({ value: [1, "two", 3] }).schema, {
    type: "array",
    items: { type: "integer" },
  });
});

test("edge case: empty array and empty object", () => {
  assert.deepEqual(run({ value: [] }).schema, { type: "array" });
  assert.deepEqual(run({ value: {} }).schema, {
    type: "object",
    properties: {},
    required: [],
  });
});

test("edge case: deep nesting of arrays of arrays", () => {
  assert.deepEqual(run({ value: [[["x"]]] }).schema, {
    type: "array",
    items: { type: "array", items: { type: "array", items: { type: "string" } } },
  });
});

test("input validation: missing value key and non-object input throw", () => {
  assert.throws(() => run({}), /Missing required input "value"/);
  assert.throws(() => run(null), /Input must be an object/);
  assert.throws(() => run("nope"), /Input must be an object/);
  assert.throws(() => run([1, 2]), /Input must be an object/);
});

test("input validation: non-JSON values rejected", () => {
  assert.throws(() => run({ value: () => {} }), /not a JSON value/);
  assert.throws(() => run({ value: undefined }), /not a JSON value/);
  assert.throws(() => run({ value: { bad: NaN } }), /non-finite number/);
  assert.throws(() => run({ value: Infinity }), /non-finite number/);
});

test("input validation: circular references rejected", () => {
  const a = { self: null };
  a.self = a;
  assert.throws(() => run({ value: a }), /circular reference/);
});

test('hardening: own "__proto__" key becomes a real property, no prototype pollution', () => {
  const value = JSON.parse('{"__proto__": {"x": 1}, "a": true}');
  const { schema } = run({ value });
  const desc = Object.getOwnPropertyDescriptor(schema.properties, "__proto__");
  assert.ok(desc, "__proto__ must be an own property of schema.properties");
  assert.deepEqual(desc.value, {
    type: "object",
    properties: { x: { type: "integer" } },
    required: ["x"],
  });
  assert.equal(Object.getPrototypeOf(schema.properties), Object.prototype);
  assert.deepEqual(schema.required, ["__proto__", "a"]);
  assert.deepEqual(schema.properties.a, { type: "boolean" });
});

test("hardening: sparse array holes rejected with a clear error", () => {
  // eslint-disable-next-line no-sparse-arrays
  assert.throws(() => run({ value: [, 1] }), /not a JSON value/);
  assert.throws(() => run({ value: new Array(3) }), /not a JSON value/);
  assert.throws(() => run({ value: [undefined] }), /not a JSON value/);
});

test("hardening: non-plain objects (Date, Map, class instances) rejected", () => {
  assert.throws(() => run({ value: new Date(0) }), /only plain objects/);
  assert.throws(() => run({ value: { d: new Map() } }), /only plain objects/);
  class Point {}
  assert.throws(() => run({ value: [new Point()] }), /only plain objects/);
  // Null-prototype objects are still fine (plain data).
  const bare = Object.create(null);
  bare.k = "v";
  const { schema } = run({ value: { bare } });
  assert.deepEqual(schema.properties.bare, {
    type: "object",
    properties: { k: { type: "string" } },
    required: ["k"],
  });
});

test("edge case: negative numbers and negative zero", () => {
  assert.deepEqual(run({ value: -7 }).schema, { type: "integer" });
  assert.deepEqual(run({ value: -2.5 }).schema, { type: "number" });
  assert.deepEqual(run({ value: -0 }).schema, { type: "integer" });
  assert.deepEqual(run({ value: [-1.5, 2] }).schema, {
    type: "array",
    items: { type: "number" },
  });
});

test("determinism: same input yields identical schema", () => {
  const value = { a: [1, 2], b: { c: "x" } };
  assert.deepEqual(run({ value }), run({ value }));
});
