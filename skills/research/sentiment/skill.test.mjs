import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "research/sentiment");
  assert.ok(meta.tags.includes("sentiment"));
});

test("positive text scores positive", () => {
  const r = run({ text: "This is a great and excellent product, I love it." });
  assert.equal(r.label, "positive");
  assert.ok(r.score > 0);
});

test("negative text scores negative", () => {
  const r = run({ text: "A terrible, awful crash and a huge loss." });
  assert.equal(r.label, "negative");
  assert.ok(r.score < 0);
});

test("negation flips polarity", () => {
  const pos = run({ text: "this is good" }).score;
  const neg = run({ text: "this is not good" }).score;
  assert.ok(pos > 0 && neg < 0);
});

test("neutral text scores near zero", () => {
  const r = run({ text: "The meeting is scheduled for Tuesday at noon." });
  assert.equal(r.label, "neutral");
});

test("normalized score stays within -1..1", () => {
  const r = run({ text: "great great great bad" });
  assert.ok(r.normalized >= -1 && r.normalized <= 1);
});
