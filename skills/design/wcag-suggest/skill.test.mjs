import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta shape is valid", () => {
  assert.equal(meta.id, "design/wcag-suggest");
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

test("black on white already passes with exact ratio 21", () => {
  // Hand-computed: L(white)=1, L(black)=0 -> (1+0.05)/(0+0.05) = 21.
  const out = run({ fg: "#000000", bg: "#ffffff" });
  assert.deepEqual(out, {
    original: "#000000",
    suggested: "#000000",
    ratio: 21,
    passes: true,
  });
});

test("white on pure blue passes; ratio matches hand computation 8.5925", () => {
  // Hand-computed: L(#0000ff) = 0.0722 * 1 = 0.0722 (blue channel fully on),
  // ratio = (1 + 0.05) / (0.0722 + 0.05) = 1.05 / 0.1222 = 8.59247... -> 8.5925.
  const out = run({ fg: "#ffffff", bg: "#0000ff" });
  assert.equal(out.original, "#ffffff");
  assert.equal(out.suggested, "#ffffff");
  assert.equal(out.ratio, 8.5925);
  assert.equal(out.passes, true);
});

test("failing gray on white is darkened to pass 4.5:1", () => {
  // Hand-computed: #777777 -> s = 119/255 = 0.46667,
  // L = ((0.46667+0.055)/1.055)^2.4 = 0.18447,
  // ratio vs white = 1.05/0.23447 = 4.478 < 4.5 -> must be adjusted darker.
  // One 1% step toward black: round(119*0.99) = 118 -> #767676,
  // L(#767676) = 0.18115, ratio = 1.05/0.23115 = 4.542 -> passes.
  const out = run({ fg: "#777777", bg: "#ffffff" });
  assert.equal(out.original, "#777777");
  assert.equal(out.suggested, "#767676");
  assert.equal(out.passes, true);
  assert.ok(out.ratio >= 4.5, `ratio ${out.ratio} should be >= 4.5`);
  assert.ok(Math.abs(out.ratio - 4.5422) < 0.001);
});

test("3-digit hex shorthand is normalized and handled identically", () => {
  const short = run({ fg: "#777", bg: "#fff" });
  const long = run({ fg: "#777777", bg: "#ffffff" });
  assert.deepEqual(short, long);
  assert.equal(short.original, "#777777");
});

test("dark background favors lightening: white-on-white gets darkened, gray-on-black stays", () => {
  // #808080 on black: L(#808080) ~= 0.2159, ratio = (0.2159+0.05)/0.05 ~= 5.32 -> passes as-is.
  const onBlack = run({ fg: "#808080", bg: "#000000" });
  assert.equal(onBlack.suggested, "#808080");
  assert.equal(onBlack.passes, true);
  assert.ok(Math.abs(onBlack.ratio - 5.3172) < 0.01);

  // White on white (ratio 1) must move toward black; #757575 (117) is the
  // first 1% step value meeting 4.5 (channel must drop to <= 118).
  const onWhite = run({ fg: "#ffffff", bg: "#ffffff" });
  assert.equal(onWhite.original, "#ffffff");
  assert.equal(onWhite.suggested, "#757575");
  assert.equal(onWhite.passes, true);
  assert.ok(onWhite.ratio >= 4.5);
});

test("unreachable target exhausts steps and reports passes=false at the extreme", () => {
  // #777777 on itself with target 21: best achievable is pure black,
  // hand-computed ratio = (0.18447+0.05)/0.05 = 4.6894 -> still fails.
  const out = run({ fg: "#777777", bg: "#777777", target: 21 });
  assert.equal(out.suggested, "#000000");
  assert.equal(out.passes, false);
  assert.ok(Math.abs(out.ratio - 4.6895) < 0.001);
});

test("custom target is respected", () => {
  // #777777 on white has ratio 4.478, which passes a 3:1 target unchanged.
  const out = run({ fg: "#777777", bg: "#ffffff", target: 3 });
  assert.equal(out.suggested, "#777777");
  assert.equal(out.passes, true);
  assert.ok(Math.abs(out.ratio - 4.4781) < 0.001);
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), /input must be an object/);
  assert.throws(() => run({ bg: "#ffffff" }), /fg must be a hex color string/);
  assert.throws(() => run({ fg: "#ffffff" }), /bg must be a hex color string/);
  assert.throws(() => run({ fg: "not-a-color", bg: "#ffffff" }), /fg must be/);
  assert.throws(() => run({ fg: "#12345", bg: "#ffffff" }), /fg must be/);
  assert.throws(() => run({ fg: "#000", bg: "#fff", target: 0.5 }), /target/);
  assert.throws(() => run({ fg: "#000", bg: "#fff", target: 22 }), /target/);
  assert.throws(() => run({ fg: "#000", bg: "#fff", target: "4.5" }), /target/);
});

test("run is deterministic and pure", () => {
  const a = run({ fg: "#777777", bg: "#ffffff" });
  const b = run({ fg: "#777777", bg: "#ffffff" });
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(a), JSON.stringify(JSON.parse(JSON.stringify(a))));
});
