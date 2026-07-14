// Tests for design/oklch-convert
import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

function approx(actual, expected, eps, label) {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${label}: expected ${expected}, got ${actual} (eps ${eps})`
  );
}

function hexChannels(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

test("meta is well-formed", () => {
  assert.equal(meta.id, "design/oklch-convert");
  assert.equal(meta.domain, "design");
  assert.equal(meta.version, "0.1.1");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.match(meta.source, /Ottosson/);
});

test("happy path: sRGB red matches Ottosson reference OKLab/OKLCH values", () => {
  // Reference values for sRGB #ff0000 in OKLab (Björn Ottosson's post):
  // L = 0.6279554, a = 0.2248631, b = 0.1258463
  const out = run({ hex: "#ff0000" });
  approx(out.oklab.L, 0.6279554, 1e-4, "oklab.L");
  approx(out.oklab.a, 0.2248631, 1e-4, "oklab.a");
  approx(out.oklab.b, 0.1258463, 1e-4, "oklab.b");
  // OKLCH: C = hypot(a, b) = 0.2576833, h = atan2(b, a) in degrees = 29.23389
  approx(out.oklch.l, 0.6279554, 1e-4, "oklch.l");
  approx(out.oklch.c, 0.2576833, 1e-4, "oklch.c");
  approx(out.oklch.h, 29.23389, 1e-2, "oklch.h");
  assert.equal(out.hex, "#ff0000");
});

test("white and black are achromatic with L=1 and L=0", () => {
  const white = run({ hex: "#ffffff" });
  approx(white.oklab.L, 1, 1e-5, "white L");
  approx(white.oklab.a, 0, 1e-5, "white a");
  approx(white.oklab.b, 0, 1e-5, "white b");
  approx(white.oklch.c, 0, 1e-5, "white chroma");
  assert.equal(white.oklch.h, 0); // hue pinned to 0 at zero chroma
  assert.equal(white.hex, "#ffffff");

  const black = run({ hex: "#000000" });
  approx(black.oklab.L, 0, 1e-6, "black L");
  approx(black.oklch.c, 0, 1e-6, "black chroma");
  assert.equal(black.hex, "#000000");
});

test("blue hue lands in the correct quadrant (both a and b negative)", () => {
  // sRGB #0000ff -> OKLab L=0.4520137, a=-0.0324564, b=-0.3115281
  const out = run({ hex: "#0000ff" });
  approx(out.oklab.L, 0.4520137, 1e-4, "blue L");
  approx(out.oklab.a, -0.0324564, 1e-4, "blue a");
  approx(out.oklab.b, -0.3115281, 1e-4, "blue b");
  // atan2(-0.3115281, -0.0324564) = -1.6749... rad -> 264.052 deg after +360
  approx(out.oklch.h, 264.052, 1e-2, "blue hue");
  assert.ok(out.oklch.h >= 0 && out.oklch.h < 360, "hue normalized to [0,360)");
});

test("inverse: OKLCH input reproduces the source hex", () => {
  const fwd = run({ hex: "#ff0000" });
  const back = run({ l: fwd.oklch.l, c: fwd.oklch.c, h: fwd.oklch.h });
  assert.equal(back.hex, "#ff0000");
  approx(back.oklab.a, fwd.oklab.a, 1e-9, "a round-trips");
  approx(back.oklab.b, fwd.oklab.b, 1e-9, "b round-trips");
});

test("round-trip hex -> oklch -> hex within 1 rgb unit for several colors", () => {
  const colors = [
    "#ff8800",
    "#123456",
    "#00ff00",
    "#abcdef",
    "#7f7f7f",
    "#c81e50",
    "#010203",
    "#fefefe",
  ];
  for (const hex of colors) {
    const fwd = run({ hex });
    const back = run({ l: fwd.oklch.l, c: fwd.oklch.c, h: fwd.oklch.h });
    const orig = hexChannels(hex);
    const got = hexChannels(back.hex);
    for (let i = 0; i < 3; i++) {
      assert.ok(
        Math.abs(orig[i] - got[i]) <= 1,
        `${hex} channel ${i}: ${orig[i]} vs ${got[i]}`
      );
    }
  }
});

test("hex input variants: shorthand and missing #", () => {
  assert.equal(run({ hex: "f80" }).hex, "#ff8800");
  assert.equal(run({ hex: "FF8800" }).hex, "#ff8800");
  assert.equal(run({ hex: "#F80" }).hex, "#ff8800");
});

test("negative hue and hue > 360 are normalized", () => {
  const a = run({ l: 0.7, c: 0.1, h: -90 });
  const b = run({ l: 0.7, c: 0.1, h: 270 });
  const c = run({ l: 0.7, c: 0.1, h: 630 });
  assert.equal(a.hex, b.hex);
  assert.equal(b.hex, c.hex);
  approx(a.oklch.h, 270, 1e-6, "normalized hue");
});

test("hue stays in [0,360): h=360 and h=-0 inputs never leak 360 or -0", () => {
  // sin(2*PI) is a tiny negative double, so the recomputed angle was
  // -1.4e-14 deg; adding 360 rounds to exactly 360 without the guard.
  const wrap = run({ l: 0.7, c: 0.1, h: 360 });
  assert.ok(wrap.oklch.h >= 0 && wrap.oklch.h < 360, `h=${wrap.oklch.h} not in [0,360)`);
  approx(wrap.oklch.h, 0, 1e-9, "h=360 wraps to ~0");

  const negZero = run({ l: 0.7, c: 0.1, h: -0 });
  assert.ok(Object.is(negZero.oklch.h, 0), "hue must be +0, not -0");
});

test("extreme chroma is gamut-clamped to a valid hex, never NaN", () => {
  for (const c of [5, 1e6, 1e200, Number.MAX_VALUE]) {
    const out = run({ l: 0.5, c, h: 30 });
    assert.match(out.hex, /^#[0-9a-f]{6}$/, `c=${c} produced ${out.hex}`);
    // Reported coordinates still reflect the caller's (finite) input.
    assert.ok(Number.isFinite(out.oklab.a) && Number.isFinite(out.oklab.b));
    approx(out.oklch.c, c, c * 1e-12, `c=${c} preserved in oklch output`);
  }
  // Overflow used to yield the literal string "#NaNNaNNaN".
  assert.equal(run({ l: 0.5, c: 1e200, h: 30 }).hex.includes("N"), false);
});

test("only own properties are read: inherited keys are ignored", () => {
  // An inherited hex (e.g. via prototype pollution) must not select hex mode.
  assert.throws(() => run(Object.create({ hex: "#ff0000" })), /either/);
  // Inherited l/c/h must not conflict with an own hex property.
  const proto = { l: 0.5, c: 0.1, h: 0 };
  const withOwnHex = Object.assign(Object.create(proto), { hex: "#00ff00" });
  assert.equal(run(withOwnHex).hex, "#00ff00");
  // Null-prototype objects work.
  const bare = Object.create(null);
  bare.hex = "#123456";
  assert.equal(run(bare).hex, "#123456");
});

test("invalid input throws", () => {
  assert.throws(() => run(), /object/);
  assert.throws(() => run(null), /object/);
  assert.throws(() => run({}), /either/);
  assert.throws(() => run({ hex: "#12345" }), /invalid hex/);
  assert.throws(() => run({ hex: "#gggggg" }), /invalid hex/);
  assert.throws(() => run({ hex: 0xff0000 }), /string/);
  assert.throws(() => run({ l: 0.5, c: 0.1 }), /finite number/); // missing h
  assert.throws(() => run({ l: 1.5, c: 0.1, h: 0 }), /\[0, 1\]/);
  assert.throws(() => run({ l: 0.5, c: -0.1, h: 0 }), />= 0/);
  assert.throws(() => run({ l: 0.5, c: NaN, h: 0 }), /finite number/);
  assert.throws(() => run({ hex: "#ff0000", l: 0.5, c: 0.1, h: 0 }), /not both/);
});
