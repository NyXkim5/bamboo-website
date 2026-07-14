import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta contract", () => {
  assert.equal(meta.id, "devtools/json-diff");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("equal values produce empty diff and equal:true", () => {
  const a = { x: 1, y: [1, 2, { z: null }], s: "hi" };
  const b = { x: 1, y: [1, 2, { z: null }], s: "hi" };
  const res = run({ a, b });
  assert.deepEqual(res, { added: [], removed: [], changed: [], equal: true });
});

test("nested object: added, removed, changed with correct paths", () => {
  const a = { a: { b: 1, c: 2 }, keep: true };
  const b = { a: { b: 9, d: 3 }, keep: true };
  const res = run({ a, b });
  assert.deepEqual(res.changed, [{ path: "a.b", from: 1, to: 9 }]);
  assert.deepEqual(res.removed, [{ path: "a.c", value: 2 }]);
  assert.deepEqual(res.added, [{ path: "a.d", value: 3 }]);
  assert.equal(res.equal, false);
});

test("arrays: index-wise change, removal of trailing, addition of trailing", () => {
  // a=[1,2,3] vs b=[1,4]: index 1 changed 2->4, index 2 removed (3)
  const res1 = run({ a: { list: [1, 2, 3] }, b: { list: [1, 4] } });
  assert.deepEqual(res1.changed, [{ path: "list[1]", from: 2, to: 4 }]);
  assert.deepEqual(res1.removed, [{ path: "list[2]", value: 3 }]);
  assert.deepEqual(res1.added, []);
  assert.equal(res1.equal, false);

  // b longer: index 1 added
  const res2 = run({ a: ["x"], b: ["x", "y"] });
  assert.deepEqual(res2.added, [{ path: "[1]", value: "y" }]);
  assert.deepEqual(res2.removed, []);
  assert.deepEqual(res2.changed, []);
});

test("deeply nested array-of-objects path like a.b[0]", () => {
  const a = { a: { b: [{ v: 1 }, { v: 2 }] } };
  const b = { a: { b: [{ v: 5 }, { v: 2 }] } };
  const res = run({ a, b });
  assert.deepEqual(res.changed, [{ path: "a.b[0].v", from: 1, to: 5 }]);
  assert.deepEqual(res.added, []);
  assert.deepEqual(res.removed, []);
  assert.equal(res.equal, false);
});

test("type change reported as changed subtree", () => {
  const res = run({ a: { a: { x: 1 } }, b: { a: [1] } });
  assert.deepEqual(res.changed, [{ path: "a", from: { x: 1 }, to: [1] }]);
  assert.equal(res.equal, false);

  // null vs object is a type change too
  const res2 = run({ a: { n: null }, b: { n: {} } });
  assert.deepEqual(res2.changed, [{ path: "n", from: null, to: {} }]);
});

test("root-level primitive change uses empty path", () => {
  const res = run({ a: 1, b: 2 });
  assert.deepEqual(res.changed, [{ path: "", from: 1, to: 2 }]);
  assert.equal(res.equal, false);

  const same = run({ a: "s", b: "s" });
  assert.equal(same.equal, true);
});

test("non-plain objects (Date, Map, class instances) are rejected, not silently equal", () => {
  // Regression: Date has no enumerable own keys, so before the fix
  // run({a: new Date(0), b: new Date(1e12)}) returned equal:true.
  assert.throws(
    () => run({ a: new Date(0), b: new Date(1e12) }),
    /not a plain JSON object/
  );
  assert.throws(() => run({ a: { m: new Map() }, b: 1 }), /not a plain JSON object/);
  assert.throws(() => run({ a: 1, b: { r: /x/ } }), /not a plain JSON object/);
  class Point {}
  assert.throws(() => run({ a: { p: new Point() }, b: 1 }), /not a plain JSON object/);
  // Null-prototype objects ARE valid JSON objects.
  const np = Object.create(null);
  np.x = 1;
  assert.deepEqual(run({ a: np, b: { x: 1 } }), {
    added: [],
    removed: [],
    changed: [],
    equal: true,
  });
});

test("circular references throw a clean error instead of overflowing the stack", () => {
  const a = { x: 1 };
  a.self = a;
  assert.throws(() => run({ a, b: 1 }), /Circular reference at self/);
  const arr = [1];
  arr.push(arr);
  assert.throws(() => run({ a: 1, b: { list: arr } }), /Circular reference/);
  // Shared (non-cyclic) references are fine — a DAG is still valid JSON input.
  const shared = { v: 1 };
  const res = run({ a: { p: shared, q: shared }, b: { p: { v: 1 }, q: { v: 2 } } });
  assert.deepEqual(res.changed, [{ path: "q.v", from: 1, to: 2 }]);
});

test("-0 and 0 compare equal (JSON cannot represent -0)", () => {
  // JSON.stringify(-0) === "0", so === semantics (not Object.is) are correct here.
  assert.equal(run({ a: -0, b: 0 }).equal, true);
  assert.equal(run({ a: { n: [-0] }, b: { n: [0] } }).equal, true);
  // ...but 0 vs 0.5 and sign changes on nonzero numbers are real changes.
  assert.deepEqual(run({ a: { n: 2 }, b: { n: -2 } }).changed, [
    { path: "n", from: 2, to: -2 },
  ]);
});

test("__proto__ as a data key diffs safely without prototype pollution", () => {
  const a = JSON.parse('{"__proto__": {"polluted": 1}}');
  const res = run({ a, b: {} });
  assert.deepEqual(res.removed, [{ path: "__proto__", value: { polluted: 1 } }]);
  assert.equal(res.equal, false);
  assert.equal({}.polluted, undefined);
});

test("empty containers: {} vs {}, [] vs [], and {} vs [] type change", () => {
  assert.equal(run({ a: {}, b: {} }).equal, true);
  assert.equal(run({ a: [], b: [] }).equal, true);
  const res = run({ a: {}, b: [] });
  assert.deepEqual(res.changed, [{ path: "", from: {}, to: [] }]);
  assert.equal(res.equal, false);
});

test("invalid input throws", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("nope"), Error);
  assert.throws(() => run({ a: 1 }), /input\.b is required/);
  assert.throws(() => run({ b: 1 }), /input\.a is required/);
  assert.throws(() => run({ a: { f: () => 1 }, b: 1 }), /not JSON-serializable/);
  assert.throws(() => run({ a: 1, b: { n: NaN } }), /Non-JSON number/);
});
