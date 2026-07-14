// Tests for research/levenshtein skill.
import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has required fields", () => {
  assert.equal(meta.id, "research/levenshtein");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("classic example: kitten -> sitting = 3", () => {
  const out = run({ a: "kitten", b: "sitting" });
  // Hand-computed: substitute k->s, substitute e->i, insert g => 3
  assert.equal(out.distance, 3);
  // similarity = 1 - 3/7
  assert.equal(out.similarity, 1 - 3 / 7);
});

test("classic example: flaw -> lawn = 2, symmetric", () => {
  const out = run({ a: "flaw", b: "lawn" });
  assert.equal(out.distance, 2);
  assert.equal(out.similarity, 1 - 2 / 4);
  const rev = run({ a: "lawn", b: "flaw" });
  assert.equal(rev.distance, 2);
});

test("identical strings: distance 0, similarity 1", () => {
  const out = run({ a: "bamboo", b: "bamboo" });
  assert.equal(out.distance, 0);
  assert.equal(out.similarity, 1);
});

test("empty string edge cases", () => {
  assert.deepEqual(run({ a: "", b: "" }), { distance: 0, similarity: 1 });
  assert.deepEqual(run({ a: "", b: "abc" }), { distance: 3, similarity: 0 });
  assert.deepEqual(run({ a: "xyz", b: "" }), { distance: 3, similarity: 0 });
});

test("completely different strings of equal length", () => {
  const out = run({ a: "abc", b: "xyz" });
  // 3 substitutions
  assert.equal(out.distance, 3);
  assert.equal(out.similarity, 0);
});

test("single-character operations", () => {
  assert.equal(run({ a: "cat", b: "cats" }).distance, 1); // insertion
  assert.equal(run({ a: "cats", b: "cat" }).distance, 1); // deletion
  assert.equal(run({ a: "cat", b: "cut" }).distance, 1); // substitution
});

test("invalid input throws", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("kitten"), Error);
  assert.throws(() => run({}), Error);
  assert.throws(() => run({ a: "abc" }), Error);
  assert.throws(() => run({ a: 123, b: "abc" }), Error);
  assert.throws(() => run({ a: "abc", b: ["x"] }), Error);
});

test("astral (non-BMP) characters count as single code points", () => {
  // U+1F600 is a surrogate pair in UTF-16 but one character.
  assert.deepEqual(run({ a: "\u{1F600}", b: "\u{1F600}" }), {
    distance: 0,
    similarity: 1,
  });
  // One substitution, maxLen 1 (not 2 code units).
  assert.deepEqual(run({ a: "\u{1F600}", b: "x" }), {
    distance: 1,
    similarity: 0,
  });
  // One deletion inside a mixed string; maxLen counted in code points (3).
  const out = run({ a: "a\u{1F600}b", b: "ab" });
  assert.equal(out.distance, 1);
  assert.equal(out.similarity, 1 - 1 / 3);
  // Symmetry still holds with surrogates.
  assert.equal(run({ a: "ab", b: "a\u{1F600}b" }).distance, 1);
});

test("null-prototype input objects are handled", () => {
  const good = Object.create(null);
  good.a = "cat";
  good.b = "cut";
  assert.equal(run(good).distance, 1);
  // Missing string props on a null-prototype object still throw.
  assert.throws(() => run(Object.create(null)), Error);
});

test("invariants: distance and similarity stay in bounds", () => {
  const pairs = [
    ["", "a"],
    ["abcdef", "azced"],
    ["book", "back"],
    ["\u{1F600}\u{1F601}", "\u{1F600}"],
    ["same", "same"],
  ];
  for (const [a, b] of pairs) {
    const { distance, similarity } = run({ a, b });
    const m = Array.from(a).length;
    const n = Array.from(b).length;
    assert.ok(Number.isInteger(distance), "distance is an integer");
    assert.ok(distance >= Math.abs(m - n), "distance >= length difference");
    assert.ok(distance <= Math.max(m, n), "distance <= max length");
    assert.ok(similarity >= 0 && similarity <= 1, "similarity in [0,1]");
    assert.ok(Number.isFinite(similarity), "similarity is finite");
  }
});

test("deterministic: repeated calls give identical results", () => {
  const first = run({ a: "saturday", b: "sunday" });
  const second = run({ a: "saturday", b: "sunday" });
  // Hand-computed: saturday -> sunday requires 3 edits (delete a, delete t, substitute r->n)
  assert.equal(first.distance, 3);
  assert.equal(first.similarity, 1 - 3 / 8);
  assert.deepEqual(first, second);
});
