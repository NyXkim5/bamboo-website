import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "research/jaccard");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("hand-computed: 'the cat sat' vs 'the dog sat' => 2/4 = 0.5", () => {
  // A = {the, cat, sat}, B = {the, dog, sat}
  // intersection = {the, sat} = 2; union = {the, cat, sat, dog} = 4
  const out = run({ a: "the cat sat", b: "the dog sat" });
  assert.equal(out.intersection, 2);
  assert.equal(out.union, 4);
  assert.equal(out.similarity, 0.5);
});

test("identical texts => similarity 1", () => {
  const out = run({ a: "Hello world hello", b: "world HELLO" });
  // both token sets: {hello, world}
  assert.equal(out.intersection, 2);
  assert.equal(out.union, 2);
  assert.equal(out.similarity, 1);
});

test("disjoint texts => similarity 0", () => {
  const out = run({ a: "alpha beta", b: "gamma delta" });
  assert.equal(out.intersection, 0);
  assert.equal(out.union, 4);
  assert.equal(out.similarity, 0);
});

test("both empty => similarity 1, sizes 0", () => {
  const out = run({ a: "", b: "" });
  assert.deepEqual(out, { similarity: 1, intersection: 0, union: 0 });
});

test("single-char tokens are dropped (len >= 2 rule)", () => {
  // a: tokens {cc} ('a' and 'b' dropped); b: tokens {cc, dd}
  const out = run({ a: "a b cc", b: "cc dd x" });
  assert.equal(out.intersection, 1);
  assert.equal(out.union, 2);
  assert.equal(out.similarity, 0.5);
});

test("punctuation and case normalization; hand-computed 1/3", () => {
  // a: "Foo, bar!" => {foo, bar}; b: "BAR... baz?" => {bar, baz}
  // intersection = {bar} = 1; union = {foo, bar, baz} = 3
  const out = run({ a: "Foo, bar!", b: "BAR... baz?" });
  assert.equal(out.intersection, 1);
  assert.equal(out.union, 3);
  assert.ok(Math.abs(out.similarity - 1 / 3) < 1e-12);
});

test("one empty, one non-empty => similarity 0", () => {
  const out = run({ a: "", b: "hello world" });
  assert.deepEqual(out, { similarity: 0, intersection: 0, union: 2 });
});

test("invalid input throws", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("not an object"), Error);
  assert.throws(() => run({ a: 42, b: "ok" }), Error);
  assert.throws(() => run({ a: "ok", b: null }), Error);
  assert.throws(() => run({ a: "ok" }), Error);
});
