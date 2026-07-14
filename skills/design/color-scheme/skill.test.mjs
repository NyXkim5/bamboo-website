import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta contract", () => {
  assert.equal(meta.id, "design/color-scheme");
  assert.equal(meta.domain, "design");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("default scheme is complementary: red -> cyan", () => {
  // #ff0000 = hsl(0, 100%, 50%); +180 = hsl(180, 100%, 50%) = #00ffff
  const out = run({ base: "#ff0000" });
  assert.deepEqual(out, {
    base: "#ff0000",
    scheme: "complementary",
    colors: ["#ff0000", "#00ffff"],
  });
});

test("complementary of #336699 is #996633 (hand-computed)", () => {
  // #336699 = rgb(51,102,153) = hsl(210, 50%, 40%); +180 -> hsl(30, 50%, 40%)
  // C = 0.8*0.5 = 0.4, X = 0.2, m = 0.2 -> rgb(0.6,0.4,0.2)*255 = (153,102,51)
  const out = run({ base: "336699", scheme: "complementary" });
  assert.deepEqual(out.colors, ["#336699", "#996633"]);
  assert.equal(out.base, "#336699");
});

test("triadic of red is green and blue", () => {
  const out = run({ base: "#ff0000", scheme: "triadic" });
  assert.deepEqual(out.colors, ["#ff0000", "#00ff00", "#0000ff"]);
});

test("tetradic of red (hand-computed +90/+180/+270)", () => {
  // hsl(90,1,.5)=#80ff00, hsl(180,1,.5)=#00ffff, hsl(270,1,.5)=#8000ff
  const out = run({ base: "#f00", scheme: "tetradic" });
  assert.deepEqual(out.colors, ["#ff0000", "#80ff00", "#00ffff", "#8000ff"]);
});

test("analogous of red wraps negative hue: -30 -> 330", () => {
  // hsl(330,1,.5)=#ff0080, hsl(30,1,.5)=#ff8000
  const out = run({ base: "#FF0000", scheme: "analogous" });
  assert.deepEqual(out.colors, ["#ff0000", "#ff0080", "#ff8000"]);
});

test("splitComplementary of red (hand-computed +150/+210)", () => {
  // hsl(150,1,.5)=#00ff80, hsl(210,1,.5)=#0080ff
  const out = run({ base: "#ff0000", scheme: "splitComplementary" });
  assert.deepEqual(out.colors, ["#ff0000", "#00ff80", "#0080ff"]);
});

test("achromatic gray is unchanged by hue rotation", () => {
  const out = run({ base: "#808080", scheme: "triadic" });
  assert.deepEqual(out.colors, ["#808080", "#808080", "#808080"]);
});

test("3-digit hex expands and output is normalized lowercase", () => {
  const out = run({ base: "#ABC" });
  assert.equal(out.base, "#aabbcc");
  assert.equal(out.colors[0], "#aabbcc");
});

test("invalid inputs throw", () => {
  assert.throws(() => run({ base: "#12345" }), /invalid hex/);
  assert.throws(() => run({ base: "zzzzzz" }), /invalid hex/);
  assert.throws(() => run({ base: 123456 }), /hex color string/);
  assert.throws(() => run({ base: "#ff0000", scheme: "monochrome" }), /invalid scheme/);
  assert.throws(() => run(null), /object/);
  assert.throws(() => run({}), /hex color string/);
});

test("prototype keys are not valid schemes", () => {
  for (const s of ["constructor", "__proto__", "hasOwnProperty", "toString"]) {
    assert.throws(() => run({ base: "#ff0000", scheme: s }), /invalid scheme/);
  }
});

test("non-string schemes throw invalid scheme (no key coercion)", () => {
  // an array would otherwise coerce to the property key "complementary"
  assert.throws(
    () => run({ base: "#ff0000", scheme: ["complementary"] }),
    /invalid scheme/
  );
  assert.throws(() => run({ base: "#ff0000", scheme: Symbol("x") }), /invalid scheme/);
  assert.throws(() => run({ base: "#ff0000", scheme: 0 }), /invalid scheme/);
  assert.throws(() => run({ base: "#ff0000", scheme: null }), /invalid scheme/);
  assert.throws(() => run({ base: "#ff0000", scheme: "" }), /invalid scheme/);
});

test("black and white extremes are rotation-invariant and well-formed", () => {
  // l = 0 and l = 1 have zero chroma; every rotated color must equal the base
  const black = run({ base: "#000", scheme: "tetradic" });
  assert.deepEqual(black.colors, ["#000000", "#000000", "#000000", "#000000"]);
  const white = run({ base: "#FFFFFF", scheme: "analogous" });
  assert.deepEqual(white.colors, ["#ffffff", "#ffffff", "#ffffff"]);
});

test("whitespace-padded input and empty/blank base handling", () => {
  const out = run({ base: "  #AbC  " });
  assert.equal(out.base, "#aabbcc");
  assert.throws(() => run({ base: "" }), /invalid hex/);
  assert.throws(() => run({ base: "   " }), /invalid hex/);
  assert.throws(() => run({ base: "#-12345" }), /invalid hex/);
});

test("run is deterministic and pure", () => {
  const a = run({ base: "#3366cc", scheme: "tetradic" });
  const b = run({ base: "#3366cc", scheme: "tetradic" });
  assert.deepEqual(a, b);
  assert.equal(a.colors.length, 4);
  for (const c of a.colors) assert.match(c, /^#[0-9a-f]{6}$/);
});
