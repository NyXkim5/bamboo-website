// Tests for research/stopwords
import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta shape", () => {
  assert.equal(meta.id, "research/stopwords");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("happy path: removes built-in stopwords, keeps content words", () => {
  // 9 tokens; "the" appears twice (stopword); "over" is not in the list.
  const out = run({ text: "The quick brown fox jumps over the lazy dog" });
  assert.deepEqual(out.tokens, ["quick", "brown", "fox", "jumps", "over", "lazy", "dog"]);
  assert.equal(out.removed, 2);
  assert.equal(out.kept, 7);
});

test("extra stopwords are applied case-insensitively", () => {
  const out = run({
    text: "The quick brown fox jumps over the lazy dog",
    extra: ["FOX", "over"],
  });
  assert.deepEqual(out.tokens, ["quick", "brown", "jumps", "lazy", "dog"]);
  assert.equal(out.removed, 4); // the, fox, over, the
  assert.equal(out.kept, 5);
});

test("tokenization is lowercase alphanumeric; numbers kept", () => {
  // tokens: it, has, 42, apples, and, 7, oranges -> stopwords: it, has, and
  const out = run({ text: "It has 42 apples, AND 7 oranges!" });
  assert.deepEqual(out.tokens, ["42", "apples", "7", "oranges"]);
  assert.equal(out.removed, 3);
  assert.equal(out.kept, 4);
});

test("edge: empty text and punctuation-only text", () => {
  assert.deepEqual(run({ text: "" }), { tokens: [], removed: 0, kept: 0 });
  assert.deepEqual(run({ text: "!!! ??? ---" }), { tokens: [], removed: 0, kept: 0 });
});

test("edge: all-stopword text yields zero kept", () => {
  const out = run({ text: "THE The the and OF" });
  assert.deepEqual(out.tokens, []);
  assert.equal(out.removed, 5);
  assert.equal(out.kept, 0);
});

test("kept + removed equals total token count", () => {
  const text = "She said that they would not go to the market because it was raining";
  const out = run({ text });
  const total = (text.toLowerCase().match(/[a-z0-9]+/g) || []).length;
  assert.equal(out.kept + out.removed, total);
  assert.equal(out.kept, out.tokens.length);
});

test("edge: Unicode words are kept as whole tokens, not split at accents", () => {
  const out = run({ text: "The naïve café is über cool" });
  assert.deepEqual(out.tokens, ["naïve", "café", "über", "cool"]);
  assert.equal(out.removed, 2); // the, is
  assert.equal(out.kept, 4);
  // extra stopwords match Unicode tokens case-insensitively too
  const out2 = run({ text: "CAFÉ café", extra: ["Café"] });
  assert.deepEqual(out2, { tokens: [], removed: 2, kept: 0 });
});

test("edge: prototype-like tokens are not falsely treated as stopwords", () => {
  const out = run({ text: "constructor hasOwnProperty toString __proto__" });
  // "__proto__" tokenizes to "proto" (underscores are not alphanumeric)
  assert.deepEqual(out.tokens, ["constructor", "hasownproperty", "tostring", "proto"]);
  assert.equal(out.removed, 0);
  const out2 = run({ text: "constructor beats proto", extra: ["constructor", "proto"] });
  assert.deepEqual(out2.tokens, ["beats"]);
  assert.equal(out2.removed, 2);
});

test("edge: empty extra array and null-prototype input object", () => {
  const out = run({ text: "the cat", extra: [] });
  assert.deepEqual(out, { tokens: ["cat"], removed: 1, kept: 1 });
  const bare = Object.create(null);
  bare.text = "the cat sat";
  assert.deepEqual(run(bare), { tokens: ["cat", "sat"], removed: 1, kept: 2 });
});

test("edge: missing argument and array input throw", () => {
  assert.throws(() => run(), Error);
  assert.throws(() => run(["the", "cat"]), Error);
});

test("invalid input throws", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("hello"), Error);
  assert.throws(() => run({}), Error);
  assert.throws(() => run({ text: 42 }), Error);
  assert.throws(() => run({ text: "ok", extra: "not-an-array" }), Error);
  assert.throws(() => run({ text: "ok", extra: ["fine", 7] }), Error);
});
