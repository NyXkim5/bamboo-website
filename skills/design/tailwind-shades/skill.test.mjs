// Tests for design/tailwind-shades — node:test + node:assert/strict only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const SHADE_KEYS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const HEX_RE = /^#[0-9a-f]{6}$/;

test("meta has required SkillForge fields", () => {
  assert.equal(meta.id, "design/tailwind-shades");
  assert.equal(meta.domain, "design");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.name, "string");
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("happy path: full ramp with all 11 valid hex shades, 500 equals the base", () => {
  const { shades } = run({ hex: "#ff0000" });
  assert.deepEqual(Object.keys(shades).sort((a, b) => a - b), SHADE_KEYS);
  for (const key of SHADE_KEYS) assert.match(shades[key], HEX_RE);
  assert.equal(shades["500"], "#ff0000"); // base color round-trips exactly
});

test("anchor lightness values: 50 is ~97% L, 950 is ~13% L", () => {
  const { shades } = run({ hex: "#ff0000" });
  // hsl(0, 100%, 97%) -> #fff0f0 ; hsl(0, 100%, 13%) -> #420000
  assert.equal(shades["50"], "#fff0f0");
  assert.equal(shades["950"], "#420000");

  const gray = run({ hex: "#808080" }).shades;
  // hsl(0, 0%, 97%) -> #f7f7f7 ; hsl(0, 0%, 13%) -> #212121
  assert.equal(gray["50"], "#f7f7f7");
  assert.equal(gray["950"], "#212121");
  assert.equal(gray["500"], "#808080");
});

test("lightness decreases strictly monotonically across the ramp (grayscale base)", () => {
  const { shades } = run({ hex: "#808080" });
  const levels = SHADE_KEYS.map((k) => parseInt(shades[k].slice(1, 3), 16));
  for (let i = 1; i < levels.length; i++) {
    assert.ok(levels[i] < levels[i - 1], `shade ${SHADE_KEYS[i]} must be darker than ${SHADE_KEYS[i - 1]}`);
  }
});

test("hue and saturation are preserved: every shade of pure red stays a pure red tint/shade", () => {
  const { shades } = run({ hex: "#ff0000" });
  for (const key of SHADE_KEYS) {
    const r = parseInt(shades[key].slice(1, 3), 16);
    const g = parseInt(shades[key].slice(3, 5), 16);
    const b = parseInt(shades[key].slice(5, 7), 16);
    assert.equal(g, b, `shade ${key}: green and blue channels must match for hue 0`);
    assert.ok(r >= g, `shade ${key}: red channel must dominate`);
  }
});

test("input normalization: shorthand, missing '#', and uppercase all match the canonical form", () => {
  const canonical = run({ hex: "#ff0000" });
  assert.deepEqual(run({ hex: "#f00" }), canonical);
  assert.deepEqual(run({ hex: "ff0000" }), canonical);
  assert.deepEqual(run({ hex: "#FF0000" }), canonical);
});

test("realistic base round-trips at 500 (#3b82f6, Tailwind blue-500)", () => {
  const { shades } = run({ hex: "#3b82f6" });
  assert.equal(shades["500"], "#3b82f6");
  for (const key of SHADE_KEYS) assert.match(shades[key], HEX_RE);
});

test("edge case: pure black and pure white bases still produce a full valid ramp", () => {
  const black = run({ hex: "#000000" }).shades;
  assert.equal(black["500"], "#000000");
  assert.equal(black["950"], "#212121"); // dark anchor 13% L is lighter than the base
  const white = run({ hex: "#ffffff" }).shades;
  assert.equal(white["500"], "#ffffff");
  assert.equal(white["50"], "#f7f7f7"); // light anchor 97% L is darker than the base
  for (const key of SHADE_KEYS) {
    assert.match(black[key], HEX_RE);
    assert.match(white[key], HEX_RE);
  }
});

test("hue sector boundaries round-trip exactly at 500 (yellow/cyan/magenta/green/blue)", () => {
  // These sit exactly on the 60-degree hue sector edges of the HSL<->RGB piecewise formula.
  for (const hex of ["#ffff00", "#00ffff", "#ff00ff", "#00ff00", "#0000ff"]) {
    const { shades } = run({ hex });
    assert.equal(shades["500"], hex, `${hex} must round-trip at shade 500`);
    for (const key of SHADE_KEYS) assert.match(shades[key], HEX_RE);
  }
});

test("surrounding whitespace is tolerated; shorthand without '#' works", () => {
  const canonical = run({ hex: "#ff0000" });
  assert.deepEqual(run({ hex: "  #ff0000  " }), canonical);
  assert.deepEqual(run({ hex: "f00" }), canonical);
});

test("deterministic and pure: repeated calls return identical, independent results", () => {
  const a = run({ hex: "#3b82f6" });
  const b = run({ hex: "#3b82f6" });
  assert.deepEqual(a, b);
  assert.notEqual(a.shades, b.shades); // fresh object each call, no shared mutable state
  a.shades["500"] = "mutated";
  assert.equal(run({ hex: "#3b82f6" }).shades["500"], "#3b82f6");
});

test("more invalid containers and lengths throw", () => {
  assert.throws(() => run([]), /must be a string/); // array passes the object guard but has no hex
  assert.throws(() => run("#ff0000"), /Input must be an object/); // bare string is not accepted
  assert.throws(() => run({ hex: null }), /must be a string/);
  assert.throws(() => run({ hex: "#ff00" }), /Invalid hex color/); // 4 digits (#rgba) rejected
  assert.throws(() => run({ hex: "#ff000000" }), /Invalid hex color/); // 8 digits (#rrggbbaa) rejected
  assert.throws(() => run({ hex: "#ff 000" }), /Invalid hex color/); // inner whitespace rejected
});

test("invalid input throws with a clear message", () => {
  assert.throws(() => run(), /Input must be an object/);
  assert.throws(() => run(null), /Input must be an object/);
  assert.throws(() => run({}), /must be a string/);
  assert.throws(() => run({ hex: 123 }), /must be a string/);
  assert.throws(() => run({ hex: "zzz" }), /Invalid hex color/);
  assert.throws(() => run({ hex: "#12345" }), /Invalid hex color/);
  assert.throws(() => run({ hex: "" }), /Invalid hex color/);
});
