// Tests for research/textrank-summary.
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has the required SkillForge fields", () => {
  assert.equal(meta.id, "research/textrank-summary");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(meta.source.includes("Mihalcea"));
  assert.ok(meta.source.includes("2004"));
});

test("happy path: two symmetric sentences both converge to score 1.0", () => {
  // S1 tokens: the, cat, sat, the, mat (len 5); S2 tokens: the, cat, ran, fast (len 4).
  // Common unique words {the, cat} -> w = 2/(ln6+ln5). Symmetric 2-node graph:
  // score = 0.15 + 0.85 * score, fixed point exactly 1.0 for both.
  const out = run({ text: "The cat sat on the mat. The cat ran fast.", sentences: 2 });
  assert.deepEqual(out.summary, ["The cat sat on the mat.", "The cat ran fast."]);
  assert.equal(out.scores.length, 2);
  assert.ok(Math.abs(out.scores[0] - 1.0) < 1e-9);
  assert.ok(Math.abs(out.scores[1] - 1.0) < 1e-9);
});

test("isolated sentence gets score 1-d = 0.15 and is excluded from top-2", () => {
  // S1/S2 share {are, fruit}; S3 shares nothing -> isolated node score 0.15.
  const text = "Apples are red fruit. Bananas are yellow fruit. Zebras gallop quickly.";
  const out = run({ text, sentences: 2 });
  assert.deepEqual(out.summary, ["Apples are red fruit.", "Bananas are yellow fruit."]);
  assert.equal(out.scores.length, 3);
  assert.ok(Math.abs(out.scores[0] - 1.0) < 1e-9);
  assert.ok(Math.abs(out.scores[1] - 1.0) < 1e-9);
  assert.ok(Math.abs(out.scores[2] - 0.15) < 1e-9);
});

test("hand-computed 3-node chain converges to expected PageRank fixed point", () => {
  // S1-S2 share {alpha, beta} (w_a = 2/(ln4+ln4)), S2-S3 share {delta}
  // (w_b = 1/(ln4+ln4)), S1-S3 share nothing. At the fixed point:
  //   s2 = 0.15 + 0.85*(s1 + s3), s1 = 0.15 + 0.85*(2/3)*s2,
  //   s3 = 0.15 + 0.85*(1/3)*s2
  // => s2 = 0.405/0.2775 = 1.459459..., s1 = 0.977027..., s3 = 0.563513...
  const text = "Alpha beta gamma. Alpha beta delta. Delta epsilon zeta.";
  const out = run({ text, sentences: 1 });
  assert.deepEqual(out.summary, ["Alpha beta delta."]);
  assert.ok(Math.abs(out.scores[1] - 1.4594594594594594) < 0.01);
  assert.ok(Math.abs(out.scores[0] - 0.9770270270270269) < 0.01);
  assert.ok(Math.abs(out.scores[2] - 0.5635135135135135) < 0.01);
  assert.ok(out.scores[1] > out.scores[0]);
  assert.ok(out.scores[0] > out.scores[2]);
});

test("summary preserves original document order even when a later sentence ranks high", () => {
  // Connected pair is sentences 0 and 2; isolated sentence 1 is skipped.
  const text = "Apples are red fruit. Zebras gallop quickly. Bananas are yellow fruit.";
  const out = run({ text, sentences: 2 });
  assert.deepEqual(out.summary, ["Apples are red fruit.", "Bananas are yellow fruit."]);
});

test("edge case: fewer sentences than requested returns all in order", () => {
  const out = run({ text: "One short sentence here. Another short sentence there." });
  assert.deepEqual(out.summary, [
    "One short sentence here.",
    "Another short sentence there.",
  ]);
  assert.equal(out.scores.length, 2);
});

test("edge case: single sentence and empty text", () => {
  const single = run({ text: "Just one lonely sentence" });
  assert.deepEqual(single.summary, ["Just one lonely sentence"]);
  assert.ok(Math.abs(single.scores[0] - 0.15) < 1e-9);

  const empty = run({ text: "   " });
  assert.deepEqual(empty, { summary: [], scores: [] });
});

test("edge case: bare punctuation fragments are not sentences", () => {
  // A spaced ellipsis used to yield bare "." sentences with score 0.15
  // that leaked into large summaries.
  const out = run({
    text: "Hmm . . . that was a strange result. Another strange result appeared.",
    sentences: 10,
  });
  assert.deepEqual(out.summary, [
    "Hmm .",
    "that was a strange result.",
    "Another strange result appeared.",
  ]);
  assert.equal(out.scores.length, 3);
  assert.ok(out.scores.every((s) => Number.isFinite(s)));
});

test("edge case: sentences whose words are all filtered (< 3 chars) do not divide by zero", () => {
  // Both sentences tokenize to []; the ln(0+1)+ln(0+1)=0 denominator must
  // be guarded, leaving two isolated nodes at exactly 1-d = 0.15.
  const out = run({ text: "A b c. D e f." });
  assert.deepEqual(out.summary, ["A b c.", "D e f."]);
  assert.ok(Math.abs(out.scores[0] - 0.15) < 1e-9);
  assert.ok(Math.abs(out.scores[1] - 0.15) < 1e-9);
  assert.ok(out.scores.every((s) => Number.isFinite(s)));
});

test("edge case: prototype-named tokens are handled safely", () => {
  // "constructor"/"prototype"/"hasownproperty" must behave as ordinary
  // words (Set-based overlap, no object-as-map pollution). Symmetric
  // pair -> both scores exactly 1.0.
  const out = run({
    text: "The constructor prototype hasOwnProperty works. The constructor prototype hasOwnProperty fails.",
    sentences: 2,
  });
  assert.equal(out.summary.length, 2);
  assert.ok(Math.abs(out.scores[0] - 1.0) < 1e-9);
  assert.ok(Math.abs(out.scores[1] - 1.0) < 1e-9);
});

test("edge case: non-finite sentence counts and non-plain-object inputs throw", () => {
  assert.throws(() => run({ text: "a. b.", sentences: NaN }), Error);
  assert.throws(() => run({ text: "a. b.", sentences: Infinity }), Error);
  assert.throws(() => run({ text: "a. b.", sentences: -3 }), Error);
  assert.throws(() => run([{ text: "a." }]), Error);
  assert.throws(() => run(() => "a."), Error);
});

test("invalid input throws", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("hello"), Error);
  assert.throws(() => run({}), Error);
  assert.throws(() => run({ text: 42 }), Error);
  assert.throws(() => run({ text: "a. b.", sentences: 0 }), Error);
  assert.throws(() => run({ text: "a. b.", sentences: 1.5 }), Error);
  assert.throws(() => run({ text: "a. b.", sentences: "3" }), Error);
});
