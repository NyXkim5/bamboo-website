export const meta = {
  id: "devtools/json-diff",
  name: "JSON Diff",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Structural diff of two JSON values. Recursively walks both values and reports added, removed, and changed leaves/subtrees with dotted/bracketed paths like \"a.b[0]\".",
  tags: ["json", "diff", "compare", "structural", "devtools"],
  license: "MIT",
  inputs: {
    a: "any JSON value (object, array, string, number, boolean, or null) — the base value",
    b: "any JSON value (object, array, string, number, boolean, or null) — the value to compare against a",
  },
  outputs:
    "{ added: [{path, value}], removed: [{path, value}], changed: [{path, from, to}], equal: boolean }",
  source:
    "Original implementation of the standard recursive tree-walk structural diff technique (as popularized by tools like deep-diff and JSON Patch generators); no code copied. Path notation follows JavaScript property-access syntax.",
};

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function assertJsonValue(v, path, seen) {
  const t = typeof v;
  if (v === null || t === "string" || t === "boolean") return;
  if (t === "number") {
    if (!Number.isFinite(v)) {
      throw new Error(`Non-JSON number (NaN/Infinity) at ${path || "root"}`);
    }
    return;
  }
  if (t === "undefined" || t === "function" || t === "symbol" || t === "bigint") {
    throw new Error(`Value at ${path || "root"} is not JSON-serializable (${t})`);
  }
  // t === "object" from here on.
  if (seen.has(v)) {
    throw new Error(`Circular reference at ${path || "root"}`);
  }
  seen.add(v);
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) assertJsonValue(v[i], `${path}[${i}]`, seen);
    seen.delete(v);
    return;
  }
  // Only plain objects (Object.prototype or null prototype) are JSON objects.
  // Date, RegExp, Map, Set, class instances, etc. must be rejected — otherwise
  // they have no enumerable own keys and would silently diff as "equal".
  const proto = Object.getPrototypeOf(v);
  if (proto !== Object.prototype && proto !== null) {
    throw new Error(
      `Value at ${path || "root"} is not a plain JSON object (got ${
        v.constructor?.name || "exotic object"
      })`
    );
  }
  for (const k of Object.keys(v)) {
    assertJsonValue(v[k], path ? `${path}.${k}` : k, seen);
  }
  seen.delete(v);
}

function childPath(base, key) {
  return base ? `${base}.${key}` : key;
}

function indexPath(base, i) {
  return `${base}[${i}]`;
}

function walk(a, b, path, out) {
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    for (const k of aKeys) {
      const p = childPath(path, k);
      if (Object.prototype.hasOwnProperty.call(b, k)) {
        walk(a[k], b[k], p, out);
      } else {
        out.removed.push({ path: p, value: a[k] });
      }
    }
    for (const k of bKeys) {
      if (!Object.prototype.hasOwnProperty.call(a, k)) {
        out.added.push({ path: childPath(path, k), value: b[k] });
      }
    }
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const min = Math.min(a.length, b.length);
    for (let i = 0; i < min; i++) {
      walk(a[i], b[i], indexPath(path, i), out);
    }
    for (let i = min; i < a.length; i++) {
      out.removed.push({ path: indexPath(path, i), value: a[i] });
    }
    for (let i = min; i < b.length; i++) {
      out.added.push({ path: indexPath(path, i), value: b[i] });
    }
    return;
  }
  // Different types, or both primitives: leaf comparison.
  if (a !== b) {
    out.changed.push({ path, from: a, to: b });
  }
}

export function run(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("input must be an object with properties 'a' and 'b'");
  }
  if (!Object.prototype.hasOwnProperty.call(input, "a")) {
    throw new Error("input.a is required");
  }
  if (!Object.prototype.hasOwnProperty.call(input, "b")) {
    throw new Error("input.b is required");
  }
  const { a, b } = input;
  assertJsonValue(a, "", new Set());
  assertJsonValue(b, "", new Set());

  const out = { added: [], removed: [], changed: [] };
  walk(a, b, "", out);
  return {
    added: out.added,
    removed: out.removed,
    changed: out.changed,
    equal:
      out.added.length === 0 &&
      out.removed.length === 0 &&
      out.changed.length === 0,
  };
}
