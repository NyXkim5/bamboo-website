// Tests for research/ngrams
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "research/ngrams");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("happy path: default bigrams with counts sorted desc", () => {
  // tokens: the quick brown fox the quick brown -> 6 bigrams
  const out = run({ text: "The quick brown fox. The quick brown!" });
  assert.equal(out.n, 2);
  assert.equal(out.total, 6);
  assert.deepEqual(out.grams, [
    { gram: "quick brown", count: 2 },
    { gram: "the quick", count: 2 },
    { gram: "brown fox", count: 1 },
    { gram: "fox the", count: 1 },
  ]);
});

test("unigrams (n=1) count lowercase alnum tokens", () => {
  const out = run({ text: "Hello, HELLO world 42 42 42!", n: 1 });
  assert.equal(out.n, 1);
  assert.equal(out.total, 6);
  assert.deepEqual(out.grams, [
    { gram: "42", count: 3 },
    { gram: "hello", count: 2 },
    { gram: "world", count: 1 },
  ]);
});

test("trigrams (n=3)", () => {
  // tokens: a b c a b c -> trigrams: "a b c", "b c a", "c a b", "a b c"
  const out = run({ text: "a b c a b c", n: 3 });
  assert.equal(out.total, 4);
  assert.deepEqual(out.grams, [
    { gram: "a b c", count: 2 },
    { gram: "b c a", count: 1 },
    { gram: "c a b", count: 1 },
  ]);
});

test("top limits the number of grams returned", () => {
  const out = run({ text: "one two three four five", n: 1, top: 2 });
  assert.equal(out.total, 5);
  assert.equal(out.grams.length, 2);
  // all counts are 1, so lexicographic tie-break applies
  assert.deepEqual(out.grams, [
    { gram: "five", count: 1 },
    { gram: "four", count: 1 },
  ]);
});

test("edge case: empty text and n larger than token count", () => {
  assert.deepEqual(run({ text: "" }), { n: 2, total: 0, grams: [] });
  assert.deepEqual(run({ text: "only two words here", n: 10 }), {
    n: 10,
    total: 0,
    grams: [],
  });
});

test("edge case: punctuation-only text yields no tokens", () => {
  const out = run({ text: "!!! ... ---", n: 1 });
  assert.deepEqual(out, { n: 1, total: 0, grams: [] });
});

test("edge case: top=0 returns empty grams but still reports total", () => {
  const out = run({ text: "a b c d", top: 0 });
  assert.deepEqual(out, { n: 2, total: 3, grams: [] });
});

test("edge case: n equal to token count yields exactly one gram", () => {
  const out = run({ text: "a b c", n: 3 });
  assert.deepEqual(out, {
    n: 3,
    total: 1,
    grams: [{ gram: "a b c", count: 1 }],
  });
});

test("tokenizer splits on underscores/apostrophes; top beyond distinct grams is safe", () => {
  const out = run({ text: "foo_bar don't", n: 1, top: 1000 });
  assert.equal(out.total, 4);
  assert.deepEqual(out.grams, [
    { gram: "bar", count: 1 },
    { gram: "don", count: 1 },
    { gram: "foo", count: 1 },
    { gram: "t", count: 1 },
  ]);
});

test("prototype-like tokens are counted safely and output is deterministic", () => {
  const text = "constructor __proto__ constructor toString";
  const a = run({ text, n: 1 });
  const b = run({ text, n: 1 });
  assert.deepEqual(a, b);
  assert.deepEqual(a.grams, [
    { gram: "constructor", count: 2 },
    { gram: "proto", count: 1 },
    { gram: "tostring", count: 1 },
  ]);
});

test("input validation throws clear errors", () => {
  assert.throws(() => run({ text: "abc", n: 0 }), /n must be an integer >= 1/);
  assert.throws(() => run({ text: "abc", n: 1.5 }), /n must be an integer >= 1/);
  assert.throws(() => run({ text: 42 }), /text must be a string/);
  assert.throws(() => run({ text: "abc", top: -1 }), /top must be an integer >= 0/);
  assert.throws(() => run(null), /input must be an object/);
});
