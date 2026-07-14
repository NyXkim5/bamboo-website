import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has required fields", () => {
  assert.equal(meta.id, "research/lorem");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.name, "string");
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("words: 5 produces hand-computed sentence", () => {
  assert.deepEqual(run({ words: 5 }), {
    text: "Lorem ipsum dolor sit amet.",
  });
});

test("words: 1 capitalizes and ends with period", () => {
  assert.deepEqual(run({ words: 1 }), { text: "Lorem." });
});

test("default is 20 words, cycling past the 19-word list", () => {
  const expected =
    "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do " +
    "eiusmod tempor incididunt ut labore et dolore magna aliqua lorem.";
  assert.deepEqual(run(), { text: expected });
  assert.deepEqual(run({}), { text: expected });
  // 20 words exactly
  assert.equal(run().text.split(" ").length, 20);
});

test("sentences: 2 — 8 words each, capitalized, continuous cycling", () => {
  assert.deepEqual(run({ sentences: 2 }), {
    text:
      "Lorem ipsum dolor sit amet consectetur adipiscing elit. " +
      "Sed do eiusmod tempor incididunt ut labore et.",
  });
});

test("paragraphs: 1 — 4 sentences of 8 words, hand-computed", () => {
  assert.deepEqual(run({ paragraphs: 1 }), {
    text:
      "Lorem ipsum dolor sit amet consectetur adipiscing elit. " +
      "Sed do eiusmod tempor incididunt ut labore et. " +
      "Dolore magna aliqua lorem ipsum dolor sit amet. " +
      "Consectetur adipiscing elit sed do eiusmod tempor incididunt.",
  });
});

test("paragraphs: 3 — joined by blank lines, first equals paragraphs:1", () => {
  const one = run({ paragraphs: 1 }).text;
  const three = run({ paragraphs: 3 }).text;
  const parts = three.split("\n\n");
  assert.equal(parts.length, 3);
  assert.equal(parts[0], one);
  // every paragraph has 4 sentences (4 periods)
  for (const p of parts) {
    assert.equal(p.split(".").length - 1, 4);
    assert.match(p, /^[A-Z]/);
    assert.ok(p.endsWith("."));
  }
});

test("deterministic: repeated calls give identical output", () => {
  assert.equal(run({ sentences: 3 }).text, run({ sentences: 3 }).text);
  assert.equal(run({ words: 40 }).text, run({ words: 40 }).text);
});

test("invalid inputs throw", () => {
  assert.throws(() => run({ words: 0 }));
  assert.throws(() => run({ words: -3 }));
  assert.throws(() => run({ words: 1.5 }));
  assert.throws(() => run({ words: "5" }));
  assert.throws(() => run({ sentences: NaN }));
  assert.throws(() => run({ paragraphs: 0 }));
  assert.throws(() => run({ words: 2, sentences: 2 }));
  assert.throws(() => run("ten"));
  assert.throws(() => run([5]));
});

test("edge: -0 and non-finite counts throw", () => {
  assert.throws(() => run({ words: -0 }));
  assert.throws(() => run({ sentences: Infinity }));
  assert.throws(() => run({ paragraphs: -Infinity }));
});

test("edge: huge counts are rejected instead of hanging", () => {
  assert.throws(() => run({ words: 2 ** 53 })); // Number.isInteger(2**53) is true
  assert.throws(() => run({ words: 100001 }));
  assert.throws(() => run({ sentences: Number.MAX_SAFE_INTEGER }));
  // boundary value still works and is exact
  assert.equal(run({ words: 100000 }).text.split(" ").length, 100000);
});

test("edge: prototype-inherited mode keys are ignored", () => {
  const inherited = Object.create({ sentences: 2 });
  // must fall back to the default 20-word sentence, not sentences mode
  assert.deepEqual(run(inherited), run({}));
});

test("edge: null-prototype object with own key works", () => {
  const o = Object.create(null);
  o.words = 3;
  assert.deepEqual(run(o), { text: "Lorem ipsum dolor." });
});
