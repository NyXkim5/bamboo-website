import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "design/type-scale");
  assert.ok(meta.tags.includes("typography"));
});

test("base step is exactly the base size (1rem)", () => {
  const { scale } = run({ base: 16, ratio: 1.25 });
  const baseStep = scale.find((s) => s.step === 0);
  assert.equal(baseStep.px, 16);
  assert.equal(baseStep.rem, 1);
  assert.equal(baseStep.name, "base");
});

test("each step up multiplies by the ratio", () => {
  const { scale } = run({ base: 16, ratio: 1.5, steps: 2, down: 0 });
  assert.equal(scale[0].px, 16);
  assert.equal(scale[1].px, 24);
  assert.equal(scale[2].px, 36);
});

test("includes down-steps below the base", () => {
  const { scale } = run({ base: 16, ratio: 1.25, down: 2 });
  assert.ok(scale.some((s) => s.step === -2));
  assert.ok(scale.find((s) => s.step === -1).px < 16);
});

test("emits a CSS variables block", () => {
  const { css } = run({ base: 16, ratio: 1.25 });
  assert.match(css, /:root \{/);
  assert.match(css, /--text-base: 1rem;/);
});

test("invalid ratio and base throw", () => {
  assert.throws(() => run({ ratio: 1 }));
  assert.throws(() => run({ base: 0 }));
});
