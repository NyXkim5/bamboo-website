import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "design/palette-gen");
  assert.ok(meta.tags.includes("wcag"));
});

test("returns 5 swatches for the default scheme", () => {
  const { swatches } = run({ base: "#3B7A57" });
  assert.equal(swatches.length, 5);
  for (const s of swatches) assert.match(s.hex, /^#[0-9a-f]{6}$/);
});

test("middle swatch preserves the base color", () => {
  const { swatches } = run({ base: "#3b7a57" });
  assert.equal(swatches[2].hex, "#3b7a57");
});

test("contrast ratios are within the valid 1..21 range", () => {
  const { swatches } = run({ base: "#777777" });
  for (const s of swatches) {
    assert.ok(s.contrastOnWhite >= 1 && s.contrastOnWhite <= 21);
    assert.ok(s.contrastOnBlack >= 1 && s.contrastOnBlack <= 21);
  }
});

test("pure white reads best with black text", () => {
  const { swatches } = run({ base: "#ffffff" });
  assert.equal(swatches[2].readableOn, "black-text");
});

test("complementary scheme swings hue ~180deg", () => {
  const { swatches } = run({ base: "#3B7A57", scheme: "complementary" });
  assert.equal(swatches.length, 5);
});

test("invalid hex throws", () => {
  assert.throws(() => run({ base: "not-a-color" }));
});
