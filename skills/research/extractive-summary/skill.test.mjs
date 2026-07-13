import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const DOC =
  "Solar power adoption is accelerating worldwide. Solar panels are cheaper than ever. " +
  "Governments offer subsidies for solar installation. Wind power also grows steadily. " +
  "Battery storage makes solar power reliable at night. Critics note grid upgrades are costly.";

test("meta is well-formed", () => {
  assert.equal(meta.id, "research/extractive-summary");
  assert.equal(meta.domain, "research");
});

test("empty text yields empty results", () => {
  const r = run({ text: "" });
  assert.deepEqual(r.summary, []);
  assert.deepEqual(r.keywords, []);
});

test("summary length respects the requested count", () => {
  const r = run({ text: DOC, sentences: 2 });
  assert.equal(r.summary.length, 2);
});

test("summary preserves document order", () => {
  const r = run({ text: DOC, sentences: 3 });
  const idxs = r.summary.map((s) => DOC.indexOf(s.slice(0, 10)));
  const sorted = [...idxs].sort((a, b) => a - b);
  assert.deepEqual(idxs, sorted);
});

test("'solar' surfaces as a top keyword", () => {
  const r = run({ text: DOC, keywords: 5 });
  assert.ok(r.keywords.some((k) => k.term === "solar"));
});

test("stop words are excluded from keywords", () => {
  const r = run({ text: DOC, keywords: 10 });
  assert.ok(!r.keywords.some((k) => ["the", "is", "are", "for"].includes(k.term)));
});
