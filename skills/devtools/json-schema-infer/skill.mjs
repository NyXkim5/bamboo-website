// devtools/json-schema-infer — infer a minimal JSON Schema (draft-07 style)
// from an example JSON value. Detects string/number/integer/boolean/null/
// array/object; objects get `properties` + `required` (all present keys),
// arrays infer `items` from their first element. Fully recursive and pure.

export const meta = {
  id: "devtools/json-schema-infer",
  name: "JSON Schema Inferrer",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Infer a minimal draft-07-style JSON Schema from an example JSON value: " +
    "type detection (string/number/integer/boolean/null/array/object), object " +
    "properties + required keys, and array items from the first element.",
  tags: ["json", "json-schema", "schema", "inference", "draft-07", "devtools"],
  license: "MIT",
  inputs: {
    value:
      "Example JSON value to infer a schema from (any JSON-serializable value: " +
      "string, number, boolean, null, array, or plain object). Required.",
  },
  outputs:
    "{ schema: object } — a minimal draft-07-style JSON Schema describing the input value.",
  source:
    "Original implementation of the standard type-inference approach described by " +
    "the JSON Schema draft-07 specification (json-schema.org, IETF draft " +
    "handrews-json-schema-01). No code copied.",
};

// Check that a value is JSON-representable (and not cyclic in a way that
// would break serialization). Plain data only: no functions/undefined/symbols.
function assertJsonValue(value, path, seen) {
  const t = typeof value;
  if (value === null || t === "string" || t === "boolean") return;
  if (t === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid input at ${path}: non-finite number is not valid JSON`);
    }
    return;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error(`Invalid input at ${path}: circular reference`);
    seen.add(value);
    // Index loop (not forEach) so sparse-array holes are caught as undefined
    // instead of being silently skipped and crashing inference later.
    for (let i = 0; i < value.length; i++) {
      assertJsonValue(value[i], `${path}[${i}]`, seen);
    }
    seen.delete(value);
    return;
  }
  if (t === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      throw new Error(
        `Invalid input at ${path}: only plain objects are supported (got a non-plain object such as Date/Map/class instance)`
      );
    }
    if (seen.has(value)) throw new Error(`Invalid input at ${path}: circular reference`);
    seen.add(value);
    for (const key of Object.keys(value)) {
      assertJsonValue(value[key], `${path}.${key}`, seen);
    }
    seen.delete(value);
    return;
  }
  throw new Error(`Invalid input at ${path}: type "${t}" is not a JSON value`);
}

// Recursively infer a minimal schema for a (validated) JSON value.
function inferSchema(value) {
  if (value === null) return { type: "null" };

  switch (typeof value) {
    case "string":
      return { type: "string" };
    case "boolean":
      return { type: "boolean" };
    case "number":
      return { type: Number.isInteger(value) ? "integer" : "number" };
  }

  if (Array.isArray(value)) {
    const schema = { type: "array" };
    if (value.length > 0) schema.items = inferSchema(value[0]);
    return schema;
  }

  // Plain object
  const properties = {};
  const required = [];
  for (const key of Object.keys(value)) {
    // defineProperty (not plain assignment) so an own "__proto__" key becomes
    // a real property instead of mutating the prototype of `properties`.
    Object.defineProperty(properties, key, {
      value: inferSchema(value[key]),
      enumerable: true,
      writable: true,
      configurable: true,
    });
    required.push(key);
  }
  return { type: "object", properties, required };
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error('Input must be an object of the form { value: <json> }');
  }
  if (!Object.prototype.hasOwnProperty.call(input, "value")) {
    throw new Error('Missing required input "value"');
  }
  const { value } = input;
  assertJsonValue(value, "value", new Set());
  return { schema: inferSchema(value) };
}
