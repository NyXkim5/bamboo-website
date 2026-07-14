import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "research/word-count");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("empty text yields all zeros", () => {
  assert.deepEqual(run({ text: "" }), {
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    avgWordLength: 0,
    avgWordsPerSentence: 0,
    estimatedReadingTimeMin: 0,
  });
});

test("whitespace-only text yields all zeros except characters", () => {
  const r = run({ text: "   \n\n  " });
  assert.equal(r.characters, 7);
  assert.equal(r.charactersNoSpaces, 0);
  assert.equal(r.words, 0);
  assert.equal(r.sentences, 0);
  assert.equal(r.paragraphs, 0);
  assert.equal(r.avgWordLength, 0);
  assert.equal(r.avgWordsPerSentence, 0);
  assert.equal(r.estimatedReadingTimeMin, 0);
});

test("simple two-sentence text: hand-computed values", () => {
  // "Hello world. This is a test."
  // characters: 5+1+6+1+4+1+2+1+1+1+5 = 28; spaces = 5 -> 23 without spaces
  // words: 6 tokens; total token chars = 5+6+4+2+1+5 = 23 -> avg 23/6 = 3.83
  // sentences: 2 -> avg words/sentence = 3
  const r = run({ text: "Hello world. This is a test." });
  assert.deepEqual(r, {
    characters: 28,
    charactersNoSpaces: 23,
    words: 6,
    sentences: 2,
    paragraphs: 1,
    avgWordLength: 3.83,
    avgWordsPerSentence: 3,
    estimatedReadingTimeMin: 1,
  });
});

test("multi-paragraph text: hand-computed values", () => {
  // "One two three.\n\nFour five!\n\nSix?"
  // characters: 14 + 2 + 10 + 2 + 4 = 32; non-whitespace = 3+3+6+4+5+4 = 25
  // words = 6; token chars = 25 -> avg 25/6 = 4.17
  // sentences = 3 -> avg words/sentence = 2; paragraphs = 3
  const r = run({ text: "One two three.\n\nFour five!\n\nSix?" });
  assert.deepEqual(r, {
    characters: 32,
    charactersNoSpaces: 25,
    words: 6,
    sentences: 3,
    paragraphs: 3,
    avgWordLength: 4.17,
    avgWordsPerSentence: 2,
    estimatedReadingTimeMin: 1,
  });
});

test("text without terminal punctuation counts as one sentence", () => {
  const r = run({ text: "hello world" });
  assert.equal(r.words, 2);
  assert.equal(r.sentences, 1);
  assert.equal(r.paragraphs, 1);
  assert.equal(r.avgWordLength, 5); // (5+5)/2
  assert.equal(r.avgWordsPerSentence, 2);
});

test("reading time: ceil(words/200), min 1 when words > 0", () => {
  assert.equal(run({ text: "hi" }).estimatedReadingTimeMin, 1);
  assert.equal(run({ text: "word ".repeat(200).trim() }).estimatedReadingTimeMin, 1);
  assert.equal(run({ text: "word ".repeat(201).trim() }).estimatedReadingTimeMin, 2);
  assert.equal(run({ text: "word ".repeat(401).trim() }).estimatedReadingTimeMin, 3);
});

test("decimals, versions, and URLs do not split sentences", () => {
  assert.equal(run({ text: "Pi is 3.14 and e is 2.72." }).sentences, 1);
  assert.equal(run({ text: "Visit example.com for v1.2.3 details!" }).sentences, 1);
  assert.equal(run({ text: "It costs 3.50. That is cheap." }).sentences, 2);
});

test("punctuation-only text: one word token, zero sentences", () => {
  const r = run({ text: "!!!" });
  assert.equal(r.words, 1);
  assert.equal(r.sentences, 0);
  assert.equal(r.paragraphs, 1);
  assert.equal(r.avgWordLength, 3);
  assert.equal(r.avgWordsPerSentence, 0); // no divide-by-zero
  assert.equal(r.estimatedReadingTimeMin, 1);
});

test("CRLF blank lines separate paragraphs", () => {
  const r = run({ text: "alpha beta\r\n\r\ngamma" });
  assert.equal(r.paragraphs, 2);
  assert.equal(r.words, 3);
});

test("null-prototype input works and zero results are never -0", () => {
  const input = Object.create(null);
  input.text = "";
  const r = run(input);
  for (const [k, v] of Object.entries(r)) {
    assert.ok(Object.is(v, 0), `${k} should be +0, got ${Object.is(v, -0) ? "-0" : v}`);
  }
});

test("invalid input throws", () => {
  assert.throws(() => run(), /object/);
  assert.throws(() => run(null), /object/);
  assert.throws(() => run("hello"), /object/);
  assert.throws(() => run({}), /'text' must be a string/);
  assert.throws(() => run({ text: 42 }), /'text' must be a string/);
  assert.throws(() => run({ text: null }), /'text' must be a string/);
});
