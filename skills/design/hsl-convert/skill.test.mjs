import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta shape is valid", () => {
  assert.equal(meta.id, "design/hsl-convert");
  assert.equal(meta.domain, "design");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("hex input: #ff8000 (hand-computed hsl 30.1, 100, 50)", () => {
  // r=255, g=128, b=0 -> max=1, min=0, d=1, l=0.5, s=1
  // h = 60 * (128/255) = 30.1176... -> 30.1
  const out = run({ hex: "#ff8000" });
  assert.deepEqual(out.rgb, { r: 255, g: 128, b: 0 });
  assert.equal(out.hex, "#ff8000");
  assert.deepEqual(out.hsl, { h: 30.1, s: 100, l: 50 });
});

test("hex shorthand input: #0f0 expands to pure green", () => {
  const out = run({ hex: "#0f0" });
  assert.equal(out.hex, "#00ff00");
  assert.deepEqual(out.rgb, { r: 0, g: 255, b: 0 });
  assert.deepEqual(out.hsl, { h: 120, s: 100, l: 50 });
});

test("hex without leading # works", () => {
  const out = run({ hex: "0000ff" });
  assert.equal(out.hex, "#0000ff");
  assert.deepEqual(out.rgb, { r: 0, g: 0, b: 255 });
  assert.deepEqual(out.hsl, { h: 240, s: 100, l: 50 });
});

test("rgb input: pure blue (hand-computed hsl 240, 100, 50)", () => {
  const out = run({ rgb: { r: 0, g: 0, b: 255 } });
  assert.equal(out.hex, "#0000ff");
  assert.deepEqual(out.rgb, { r: 0, g: 0, b: 255 });
  assert.deepEqual(out.hsl, { h: 240, s: 100, l: 50 });
});

test("rgb input: mid gray (hand-computed l = 128/255*100 = 50.196 -> 50.2)", () => {
  const out = run({ rgb: { r: 128, g: 128, b: 128 } });
  assert.equal(out.hex, "#808080");
  assert.deepEqual(out.hsl, { h: 0, s: 0, l: 50.2 });
});

test("hsl input: h=120, s=100, l=25 -> rgb (0,128,0) hex #008000", () => {
  // c = (1 - |2*0.25 - 1|) * 1 = 0.5; hp = 2, x = 0; m = 0.25 - 0.25 = 0
  // (r,g,b) = (0, 0.5, 0) * 255 = (0, 127.5, 0) -> rounds to (0, 128, 0)
  const out = run({ hsl: { h: 120, s: 100, l: 25 } });
  assert.deepEqual(out.rgb, { r: 0, g: 128, b: 0 });
  assert.equal(out.hex, "#008000");
  assert.deepEqual(out.hsl, { h: 120, s: 100, l: 25 });
});

test("hsl input rounds to 1 decimal place", () => {
  const out = run({ hsl: { h: 30.1176, s: 99.99, l: 50.04 } });
  assert.deepEqual(out.hsl, { h: 30.1, s: 100, l: 50 });
});

test("round trip: hex -> rgb -> hsl are mutually consistent", () => {
  const first = run({ hex: "#1e90ff" }); // dodger blue
  const viaRgb = run({ rgb: first.rgb });
  assert.equal(viaRgb.hex, "#1e90ff");
  assert.deepEqual(viaRgb.hsl, first.hsl);
});

test("edge: negative zero inputs are normalized to +0 in outputs", () => {
  const viaRgb = run({ rgb: { r: -0, g: 0, b: 0 } });
  assert.ok(Object.is(viaRgb.rgb.r, 0), "rgb.r must be +0, not -0");
  assert.ok(Object.is(viaRgb.hsl.h, 0), "hsl.h must be +0, not -0");
  assert.equal(viaRgb.hex, "#000000");
  const viaHsl = run({ hsl: { h: -0, s: 0, l: 0 } });
  assert.ok(Object.is(viaHsl.hsl.h, 0), "hsl.h must be +0, not -0");
  assert.ok(Object.is(viaHsl.rgb.r, 0), "rgb.r must be +0, not -0");
});

test("edge: prototype-inherited keys are not treated as input", () => {
  assert.throws(() => run(Object.create({ hex: "#fff" })), Error);
  // own property on an object with a polluted-looking prototype still works
  const out = run(Object.assign(Object.create({ rgb: { r: 9, g: 9, b: 9 } }), { hex: "#fff" }));
  assert.equal(out.hex, "#ffffff");
});

test("edge: h=360 boundary is accepted and wraps to red (h=0)", () => {
  const out = run({ hsl: { h: 360, s: 100, l: 50 } });
  assert.deepEqual(out.rgb, { r: 255, g: 0, b: 0 });
  assert.equal(out.hex, "#ff0000");
  assert.deepEqual(out.hsl, { h: 0, s: 100, l: 50 });
});

test("edge: non-finite and non-number components throw", () => {
  assert.throws(() => run({ rgb: { r: NaN, g: 0, b: 0 } }), Error);
  assert.throws(() => run({ rgb: { r: Infinity, g: 0, b: 0 } }), Error);
  assert.throws(() => run({ hsl: { h: NaN, s: 50, l: 50 } }), Error);
  assert.throws(() => run({ hsl: { h: 10, s: -Infinity, l: 50 } }), Error);
  assert.throws(() => run({ rgb: { r: "255", g: 0, b: 0 } }), Error);
  assert.throws(() => run({ hex: "" }), Error);
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run({}), Error);
  assert.throws(() => run({ hex: "xyz" }), Error);
  assert.throws(() => run({ hex: "#12345" }), Error);
  assert.throws(() => run({ rgb: { r: 300, g: 0, b: 0 } }), Error);
  assert.throws(() => run({ rgb: { r: -1, g: 0, b: 0 } }), Error);
  assert.throws(() => run({ rgb: { r: 10, g: 10 } }), Error);
  assert.throws(() => run({ hsl: { h: 400, s: 50, l: 50 } }), Error);
  assert.throws(() => run({ hsl: { h: 100, s: 101, l: 50 } }), Error);
  assert.throws(() => run({ hsl: { h: 100, s: 50, l: -0.1 } }), Error);
  assert.throws(() => run({ hex: "#fff", rgb: { r: 0, g: 0, b: 0 } }), Error);
});
