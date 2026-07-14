import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "research/keyword-density");
  assert.ok(meta.tags.includes("seo"));
});

test("empty text yields zero words and empty lists", () => {
  const r = run({ text: "" });
  assert.equal(r.totalWords, 0);
  assert.deepEqual(r.unigrams, []);
});

test("counts total words including stop words", () => {
  const r = run({ text: "the quick brown fox jumps" });
  assert.equal(r.totalWords, 5);
});

test("dominant content word surfaces as top unigram", () => {
  const r = run({ text: "shoes shoes shoes running shoes best shoes online" });
  assert.equal(r.unigrams[0].term, "shoes");
  assert.ok(r.unigrams[0].density > 0);
});

test("keyword stuffing is flagged above threshold", () => {
  const stuffed = "widgets " .repeat(20) + "and some other filler words here today";
  const r = run({ text: stuffed, stuffingThreshold: 10 });
  assert.ok(r.stuffing.some((s) => s.term === "widgets"));
});

test("produces bigrams from adjacent content words", () => {
  const r = run({ text: "machine learning machine learning models" });
  assert.ok(r.bigrams.some((b) => b.term === "machine learning"));
});
