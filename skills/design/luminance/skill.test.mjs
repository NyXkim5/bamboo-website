import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

function approx(actual, expected, tol = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${actual} to be within ${tol} of ${expected}`
  );
}

test("meta is well-formed", () => {
  assert.equal(meta.id, "design/luminance");
  assert.equal(meta.domain, "design");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("white #ffffff: luminance 1, brightness 1, not dark", () => {
  const out = run({ hex: "#ffffff" });
  // 0.2126 + 0.7152 + 0.0722 = 1; sqrt(0.299 + 0.587 + 0.114) = 1
  approx(out.luminance, 1);
  approx(out.perceivedBrightness, 1);
  assert.equal(out.isDark, false);
});

test("black #000000: luminance 0, brightness 0, dark", () => {
  const out = run({ hex: "000000" });
  assert.equal(out.luminance, 0);
  assert.equal(out.perceivedBrightness, 0);
  assert.equal(out.isDark, true);
});

test("pure red #ff0000: hand-computed values", () => {
  const out = run({ hex: "#ff0000" });
  // Linearized red channel = 1, so luminance = 0.2126 exactly.
  approx(out.luminance, 0.2126);
  // perceivedBrightness = sqrt(0.299 * 255^2) / 255 = sqrt(0.299) = 0.54680892...
  approx(out.perceivedBrightness, Math.sqrt(0.299));
  approx(out.perceivedBrightness, 0.5468089246, 1e-9);
  assert.equal(out.isDark, true);
});

test("pure blue #0000ff: hand-computed values", () => {
  const out = run({ hex: "#0000FF" });
  approx(out.luminance, 0.0722);
  // sqrt(0.114) = 0.33763886...
  approx(out.perceivedBrightness, 0.3376388603, 1e-9);
  assert.equal(out.isDark, true);
});

test("mid gray #808080: hand-computed values", () => {
  const out = run({ hex: "#808080" });
  // c = 128/255 = 0.50196078...; ((c + 0.055)/1.055)^2.4 = 0.2158605...
  // luminance = (0.2126 + 0.7152 + 0.0722) * 0.2158605 = 0.2158605
  approx(out.luminance, 0.2158605, 1e-6);
  // gamma-encoded gray: sqrt((0.299 + 0.587 + 0.114) * 128^2)/255 = 128/255
  approx(out.perceivedBrightness, 128 / 255);
  assert.equal(out.isDark, true);
});

test("low channel uses linear segment: #0a0a0a", () => {
  const out = run({ hex: "#0a0a0a" });
  // c = 10/255 = 0.0392156... <= 0.04045, linear = c / 12.92 = 0.00303526...
  approx(out.luminance, 10 / 255 / 12.92, 1e-12);
  approx(out.perceivedBrightness, 10 / 255, 1e-12);
  assert.equal(out.isDark, true);
});

test("3-digit shorthand expands: #fff and #abc", () => {
  const short = run({ hex: "#fff" });
  const full = run({ hex: "#ffffff" });
  assert.deepEqual(short, full);

  const abcShort = run({ hex: "abc" });
  const abcFull = run({ hex: "#aabbcc" });
  assert.deepEqual(abcShort, abcFull);
});

test("output is JSON-serializable and deterministic", () => {
  const a = run({ hex: "#1a2b3c" });
  const b = run({ hex: "#1a2b3c" });
  assert.deepEqual(a, b);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
  assert.equal(typeof a.luminance, "number");
  assert.equal(typeof a.perceivedBrightness, "number");
  assert.equal(typeof a.isDark, "boolean");
});

test("edge: gamma segment boundary — #0a linear, #0b power, monotonic", () => {
  // 10/255 = 0.03922 <= 0.04045 (linear segment); 11/255 = 0.04314 > 0.04045 (power segment)
  const lo = run({ hex: "#0a0a0a" });
  const hi = run({ hex: "#0b0b0b" });
  approx(lo.luminance, 10 / 255 / 12.92, 1e-12);
  approx(hi.luminance, Math.pow((11 / 255 + 0.055) / 1.055, 2.4), 1e-12);
  assert.ok(hi.luminance > lo.luminance, "luminance must be monotonic across the segment boundary");
});

test("edge: isDark flips at luminance 0.5 (#bbbbbb dark, #bcbcbc not)", () => {
  const below = run({ hex: "#bbbbbb" }); // luminance ~0.49693
  const above = run({ hex: "#bcbcbc" }); // luminance ~0.50289
  assert.ok(below.luminance < 0.5 && below.isDark === true);
  assert.ok(above.luminance > 0.5 && above.isDark === false);
});

test("edge: black yields exact +0 (never -0) and finite outputs everywhere", () => {
  const out = run({ hex: "#000" });
  assert.ok(Object.is(out.luminance, 0), "luminance must be +0, not -0");
  assert.ok(Object.is(out.perceivedBrightness, 0), "perceivedBrightness must be +0, not -0");
  const mid = run({ hex: "#7f3fa0" });
  assert.ok(Number.isFinite(mid.luminance) && mid.luminance >= 0 && mid.luminance <= 1);
  assert.ok(Number.isFinite(mid.perceivedBrightness) && mid.perceivedBrightness >= 0 && mid.perceivedBrightness <= 1 + 1e-12);
});

test("edge: hostile inputs throw; lenient trim/case/inherited-property accepted", () => {
  assert.throws(() => run(["#fff"]), Error); // array as input object (hex undefined)
  assert.throws(() => run({ hex: ["f", "f", "f"] }), Error); // array hex
  assert.throws(() => run({ hex: new String("#fff") }), Error); // String object, not primitive
  assert.throws(() => run({ hex: "##fff" }), Error); // double hash
  assert.throws(() => run({ hex: "#ff f" }), Error); // interior whitespace
  assert.throws(() => run({ hex: "#ｆｆｆ" }), Error); // fullwidth 'f' digits
  assert.throws(() => run({ hex: "0x1122" }), Error); // 0x prefix is not hex-color syntax
  assert.throws(() => run({ hex: "Infinity" }), Error);
  // Lenient on the accepted side: surrounding whitespace, mixed case, and an
  // inherited 'hex' property (plain property access) all resolve identically.
  assert.deepEqual(run({ hex: "  #AbC \n" }), run({ hex: "#aabbcc" }));
  assert.deepEqual(run(Object.create({ hex: "#fff" })), run({ hex: "#ffffff" }));
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run({}), Error);
  assert.throws(() => run({ hex: 123 }), Error);
  assert.throws(() => run({ hex: "" }), Error);
  assert.throws(() => run({ hex: "#12345" }), Error); // 5 digits
  assert.throws(() => run({ hex: "#1234" }), Error); // 4 digits
  assert.throws(() => run({ hex: "zzzzzz" }), Error); // non-hex chars
  assert.throws(() => run({ hex: "#gg0000" }), Error);
});
