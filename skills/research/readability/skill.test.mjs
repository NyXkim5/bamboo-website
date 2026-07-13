import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "research/readability");
  assert.ok(meta.tags.includes("flesch"));
});

test("empty text is handled", () => {
  const r = run({ text: "" });
  assert.equal(r.words, 0);
  assert.equal(r.interpretation, "empty");
});

test("simple sentence scores as easy to read", () => {
  const r = run({ text: "The cat sat on the mat. The dog ran to the park." });
  assert.ok(r.words > 0 && r.sentences === 2);
  assert.ok(r.readingEase >= 60, `expected plain/easy, got ${r.readingEase}`);
});

test("dense academic prose scores harder than simple prose", () => {
  const simple = "I like to run. It is fun. The sun is out.";
  const complex =
    "The multifaceted epistemological ramifications necessitate comprehensive interdisciplinary reconceptualization.";
  const easy = run({ text: simple }).readingEase;
  const hard = run({ text: complex }).readingEase;
  assert.ok(hard < easy);
});

test("counts are positive integers for real text", () => {
  const r = run({ text: "Reading is fundamental. Practice makes perfect." });
  assert.ok(Number.isInteger(r.words) && r.words > 0);
  assert.ok(Number.isInteger(r.syllables) && r.syllables > 0);
});
