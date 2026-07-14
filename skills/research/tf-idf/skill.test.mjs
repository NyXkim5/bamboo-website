// Tests for research/tf-idf
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const close = (a, b, eps = 1e-12) =>
  assert.ok(Math.abs(a - b) < eps, `expected ${a} ~ ${b}`);

const DOCS = ["the cat sat", "the dog sat", "cat cat"];

test("meta is well-formed", () => {
  assert.equal(meta.id, "research/tf-idf");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("happy path: per-doc tf-idf for a given term", () => {
  // tokens: d0 [the,cat,sat], d1 [the,dog,sat], d2 [cat,cat]; N=3
  // df(cat)=2 -> idf = ln(3/3)+1 = 1
  const { N, scores } = run({ docs: DOCS, term: "cat" });
  assert.equal(N, 3);
  assert.equal(scores.length, 3);
  assert.deepEqual(scores.map((s) => s.doc), [0, 1, 2]);
  close(scores[0].tf, 1 / 3);
  close(scores[0].tfidf, 1 / 3);
  close(scores[1].tfidf, 0);
  close(scores[2].tf, 1);
  close(scores[2].tfidf, 1);
});

test("term with df=1 uses idf = ln(N/2)+1", () => {
  // df(dog)=1 -> idf = ln(3/2)+1; only doc 1 contains it, tf = 1/3
  const { scores } = run({ docs: DOCS, term: "dog" });
  const idf = Math.log(3 / 2) + 1;
  close(scores[1].tfidf, (1 / 3) * idf);
  close(scores[0].tfidf, 0);
  close(scores[2].tfidf, 0);
});

test("top terms per doc when no term is given, with topK and tie-breaking", () => {
  const { N, scores } = run({ docs: DOCS, topK: 2 });
  assert.equal(N, 3);
  // doc 1: dog=(1/3)(ln1.5+1) > sat=the=1/3; alphabetical tie-break -> sat before the
  assert.deepEqual(scores[1].map((s) => s.term), ["dog", "sat"]);
  close(scores[1][0].tfidf, (1 / 3) * (Math.log(3 / 2) + 1));
  close(scores[1][1].tfidf, 1 / 3);
  // doc 2 has a single distinct term
  assert.deepEqual(scores[2].map((s) => s.term), ["cat"]);
  close(scores[2][0].tfidf, 1);
});

test("tokenization: lowercase, /[a-z0-9]+/gi, drops words shorter than 2", () => {
  // "a I x" tokenizes to [] -> tf 0, no division-by-zero
  const { scores } = run({ docs: ["a I x", "Hi, HI!"], term: "hI" });
  close(scores[0].tf, 0);
  close(scores[0].tfidf, 0);
  // d1 tokens [hi,hi]: tf=1, idf = ln(2/2)+1 = 1
  close(scores[1].tf, 1);
  close(scores[1].tfidf, 1);
});

test("single-doc corpus uses smoothed idf = ln(1/2)+1", () => {
  const { N, scores } = run({ docs: ["hello hello world"], term: "hello" });
  assert.equal(N, 1);
  close(scores[0].tfidf, (2 / 3) * (Math.log(1 / 2) + 1));
});

test("input validation throws clear errors", () => {
  assert.throws(() => run(null), /object/);
  assert.throws(() => run({}), /docs must be a non-empty array/);
  assert.throws(() => run({ docs: [] }), /non-empty/);
  assert.throws(() => run({ docs: ["ok", 42] }), /string/);
  assert.throws(() => run({ docs: DOCS, term: 7 }), /term must be a string/);
  assert.throws(() => run({ docs: DOCS, term: "two words" }), /exactly one/);
  assert.throws(() => run({ docs: DOCS, term: "a" }), /length >= 2/);
  assert.throws(() => run({ docs: DOCS, topK: 0 }), /positive integer/);
});

test("sparse docs array (holes) is rejected, not silently skipped", () => {
  const sparse = ["the cat sat", , "cat cat"]; // hole at index 1
  assert.throws(() => run({ docs: sparse }), /must be a string/);
  assert.throws(() => run({ docs: ["ok", undefined] }), /must be a string/);
});

test("term absent from every doc scores 0 everywhere (df=0, no NaN)", () => {
  const { scores } = run({ docs: DOCS, term: "zebra" });
  assert.equal(scores.length, 3);
  for (const s of scores) {
    assert.equal(s.tf, 0);
    assert.equal(s.tfidf, 0);
    assert.ok(Number.isFinite(s.tfidf));
  }
});

test("top-K mode: doc with no valid tokens yields an empty list, no NaN", () => {
  const { N, scores } = run({ docs: ["a I x!", "hello world"] });
  assert.equal(N, 2);
  assert.deepEqual(scores[0], []);
  assert.equal(scores[1].length, 2);
  for (const s of scores[1]) assert.ok(Number.isFinite(s.tfidf));
});

test("topK larger than distinct term count returns all terms; idf never negative", () => {
  const { scores } = run({ docs: ["cat dog", "cat"], topK: 100 });
  assert.deepEqual(scores[0].map((s) => s.term).sort(), ["cat", "dog"]);
  // cat appears in all docs: idf = ln(2/3)+1 > 0, so tfidf stays positive
  for (const row of scores) for (const s of row) assert.ok(s.tfidf > 0);
  close(scores[1][0].tfidf, 1 * (Math.log(2 / 3) + 1));
});

test("determinism: same input gives identical output", () => {
  const a = run({ docs: DOCS });
  const b = run({ docs: DOCS });
  assert.deepEqual(a, b);
});
