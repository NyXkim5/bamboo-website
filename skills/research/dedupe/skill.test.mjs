import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "research/dedupe");
  assert.ok(meta.tags.includes("dedupe"));
});

test("distinct texts form their own groups", () => {
  const r = run({ texts: ["the cat sat on the mat", "quantum physics is hard", "i love pizza"] });
  assert.equal(r.groups.length, 3);
  assert.equal(r.duplicates, 0);
});

test("near-identical texts cluster together", () => {
  const texts = [
    "solar power adoption is accelerating worldwide",
    "solar power adoption is accelerating across the world",
    "the stock market fell sharply today",
  ];
  const r = run({ texts, threshold: 0.3 });
  assert.equal(r.groups.length, 2);
  assert.equal(r.duplicates, 1);
  assert.equal(r.unique.length, 2);
});

test("exact duplicates always cluster", () => {
  const r = run({ texts: ["hello world foo bar", "hello world foo bar"], threshold: 0.9 });
  assert.equal(r.groups.length, 1);
  assert.deepEqual(r.groups[0], [0, 1]);
});

test("empty input yields empty output", () => {
  const r = run({ texts: [] });
  assert.deepEqual(r.groups, []);
  assert.equal(r.total, 0);
});

test("non-array throws", () => {
  assert.throws(() => run({ texts: "not an array" }));
});
