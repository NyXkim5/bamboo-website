// Tests for research/tokenize
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("happy path: words, sentences, and counts", () => {
  const out = run({ text: "Hello world. Hello again! Is this fine?" });
  assert.deepEqual(out.words, [
    "hello",
    "world",
    "hello",
    "again",
    "is",
    "this",
    "fine",
  ]);
  assert.deepEqual(out.sentences, ["Hello world", "Hello again", "Is this fine"]);
  assert.equal(out.wordCount, 7);
  assert.equal(out.sentenceCount, 3);
  assert.equal(out.uniqueWords, 6); // "hello" repeats
});

test("apostrophes and digits are kept in words", () => {
  const out = run({ text: "Don't stop at 42!" });
  assert.deepEqual(out.words, ["don't", "stop", "at", "42"]);
  assert.equal(out.uniqueWords, 4);
});

test("edge case: empty string yields empty results", () => {
  const out = run({ text: "" });
  assert.deepEqual(out.words, []);
  assert.deepEqual(out.sentences, []);
  assert.equal(out.wordCount, 0);
  assert.equal(out.sentenceCount, 0);
  assert.equal(out.uniqueWords, 0);
});

test("edge case: punctuation runs and no trailing terminator", () => {
  const out = run({ text: "Wow!!! Really?? yes" });
  assert.deepEqual(out.sentences, ["Wow", "Really", "yes"]);
  assert.deepEqual(out.words, ["wow", "really", "yes"]);
  assert.equal(out.sentenceCount, 3);
});

test("edge case: whitespace-only and punctuation-only text", () => {
  const out = run({ text: "   ...  !? " });
  assert.deepEqual(out.words, []);
  assert.deepEqual(out.sentences, []);
  assert.equal(out.uniqueWords, 0);
});

test("validation: non-string text throws", () => {
  assert.throws(() => run({ text: 123 }), /text must be a string/);
  assert.throws(() => run({}), /text must be a string/);
});

test("validation: bad input container throws", () => {
  assert.throws(() => run(null), /input must be an object/);
  assert.throws(() => run("hello"), /input must be an object/);
  assert.throws(() => run(["hello"]), /input must be an object/);
});

test("hardening: bare apostrophe runs are not counted as words", () => {
  const out = run({ text: "'' hello ''' world '" });
  assert.deepEqual(out.words, ["hello", "world"]);
  assert.equal(out.wordCount, 2);
  assert.equal(out.uniqueWords, 2);
});

test("hardening: single word with no terminator is one sentence", () => {
  const out = run({ text: "hello" });
  assert.deepEqual(out.words, ["hello"]);
  assert.deepEqual(out.sentences, ["hello"]);
  assert.equal(out.sentenceCount, 1);
});

test("hardening: newlines and tabs trim cleanly from sentences", () => {
  const out = run({ text: "One two.\n\tThree four!\n" });
  assert.deepEqual(out.sentences, ["One two", "Three four"]);
  assert.deepEqual(out.words, ["one", "two", "three", "four"]);
});

test("hardening: determinism — same input gives identical output", () => {
  const text = "Repeat me. Repeat ME!";
  assert.deepEqual(run({ text }), run({ text }));
});

test("meta contract fields", () => {
  assert.equal(meta.id, "research/tokenize");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});
