import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "design/spacing-tokens");
  assert.ok(meta.tags.includes("spacing"));
});

test("linear scale is base * index", () => {
  const { tokens } = run({ base: 4, steps: 4, mode: "linear" });
  assert.equal(tokens[0].px, 0);
  assert.equal(tokens[1].px, 4);
  assert.equal(tokens[4].px, 16);
});

test("rem is px / 16", () => {
  const { tokens } = run({ base: 8, steps: 2 });
  assert.equal(tokens[2].px, 16);
  assert.equal(tokens[2].rem, 1);
});

test("geometric mode doubles each step", () => {
  const { tokens } = run({ base: 4, steps: 4, mode: "geometric", ratio: 2 });
  assert.equal(tokens[1].px, 4);
  assert.equal(tokens[2].px, 8);
  assert.equal(tokens[3].px, 16);
});

test("emits a CSS variables block with dots sanitized", () => {
  const { css } = run({ base: 4, steps: 3 });
  assert.match(css, /:root \{/);
  assert.match(css, /--space-0:/);
  assert.ok(!/--space-0\.5:/.test(css)); // dot replaced with underscore
});

test("invalid input throws", () => {
  assert.throws(() => run({ base: 0 }));
  assert.throws(() => run({ steps: 0 }));
});
