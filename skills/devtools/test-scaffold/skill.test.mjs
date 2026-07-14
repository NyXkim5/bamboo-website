import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/test-scaffold");
  assert.ok(meta.tags.includes("testing"));
});

test("parses a function declaration", () => {
  const r = run({ signature: "export function addUser(name, email) {" });
  assert.equal(r.name, "addUser");
  assert.deepEqual(r.params, ["name", "email"]);
});

test("parses an arrow const with async", () => {
  const r = run({ signature: "export const fetchThing = async (id) =>" });
  assert.equal(r.name, "fetchThing");
  assert.deepEqual(r.params, ["id"]);
});

test("strips TS types and default values from params", () => {
  const r = run({ signature: "function f(a: string, b = 5, ...rest) {" });
  assert.deepEqual(r.params, ["a", "b", "rest"]);
});

test("generated test references the function and import path", () => {
  const r = run({ signature: "function calc(x) {}", importPath: "./calc.mjs" });
  assert.match(r.test, /import \{ calc \} from "\.\/calc\.mjs"/);
  assert.match(r.test, /happy path/);
  assert.match(r.test, /handles x/);
});

test("unparseable input throws", () => {
  assert.throws(() => run({ signature: "not a function at all ###" }));
});
