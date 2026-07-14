// Tests for design/color-mix
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "design/color-mix");
  assert.equal(meta.domain, "design");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("happy path: srgb midpoint of black and white is #808080", () => {
  // per channel: 0*(1-0.5) + 255*0.5 = 127.5 -> round -> 128 = 0x80
  assert.deepEqual(run({ a: "#000000", b: "#ffffff", ratio: 0.5, space: "srgb" }), {
    hex: "#808080",
  });
  // defaults: ratio 0.5, space srgb
  assert.deepEqual(run({ a: "#000000", b: "#ffffff" }), { hex: "#808080" });
});

test("srgb mix with uneven ratio, hand-computed", () => {
  // a=#336699 (51,102,153), b=#ff0000 (255,0,0), ratio=0.25
  // r: 51*0.75 + 255*0.25 = 38.25 + 63.75 = 102   -> 0x66
  // g: 102*0.75 + 0*0.25  = 76.5  -> round -> 77  -> 0x4d
  // b: 153*0.75 + 0*0.25  = 114.75 -> round -> 115 -> 0x73
  assert.deepEqual(run({ a: "#336699", b: "#ff0000", ratio: 0.25 }), {
    hex: "#664d73",
  });
  // red/blue midpoint
  assert.deepEqual(run({ a: "#ff0000", b: "#0000ff", ratio: 0.5 }), {
    hex: "#800080",
  });
});

test("linear space midpoint of black and white is #bcbcbc", () => {
  // linear light midpoint = 0.5; re-encode:
  // 1.055 * 0.5^(1/2.4) - 0.055 = 0.735357...; *255 = 187.516 -> 188 = 0xbc
  assert.deepEqual(run({ a: "#000000", b: "#ffffff", ratio: 0.5, space: "linear" }), {
    hex: "#bcbcbc",
  });
  // red + green in linear: each mixed channel is 0.5 linear -> 0xbc
  assert.deepEqual(run({ a: "#ff0000", b: "#00ff00", ratio: 0.5, space: "linear" }), {
    hex: "#bcbc00",
  });
});

test("ratio endpoints return the original colors exactly (both spaces)", () => {
  for (const space of ["srgb", "linear"]) {
    assert.deepEqual(run({ a: "#12ab7f", b: "#fedcba", ratio: 0, space }), {
      hex: "#12ab7f",
    });
    assert.deepEqual(run({ a: "#12ab7f", b: "#fedcba", ratio: 1, space }), {
      hex: "#fedcba",
    });
  }
});

test("edge case: 3-digit shorthand and missing # are accepted", () => {
  // #f00 expands to #ff0000; midpoint with black -> 0x80
  assert.deepEqual(run({ a: "#f00", b: "#000" }), { hex: "#800000" });
  assert.deepEqual(run({ a: "ff0000", b: "000000", ratio: 0.5 }), {
    hex: "#800000",
  });
});

test("invalid input throws", () => {
  assert.throws(() => run(null), /Input must be an object/);
  assert.throws(() => run({ a: "#12345", b: "#000000" }), /Invalid hex color for "a"/);
  assert.throws(() => run({ a: "#000000", b: "#gggggg" }), /Invalid hex color for "b"/);
  assert.throws(() => run({ a: 0xff0000, b: "#000000" }), /Invalid hex color for "a"/);
  assert.throws(() => run({ a: "#000000", b: "#ffffff", ratio: 1.5 }), /Invalid ratio/);
  assert.throws(() => run({ a: "#000000", b: "#ffffff", ratio: -0.1 }), /Invalid ratio/);
  assert.throws(() => run({ a: "#000000", b: "#ffffff", ratio: NaN }), /Invalid ratio/);
  assert.throws(
    () => run({ a: "#000000", b: "#ffffff", space: "oklab" }),
    /Invalid space/
  );
});

test("edge case: wrong-typed ratio throws Invalid ratio (not a serialization error)", () => {
  // BigInt used to crash JSON.stringify inside the error path with a TypeError
  assert.throws(() => run({ a: "#000000", b: "#ffffff", ratio: 1n }), /Invalid ratio/);
  assert.throws(() => run({ a: "#000000", b: "#ffffff", ratio: "0.5" }), /Invalid ratio/);
  assert.throws(() => run({ a: "#000000", b: "#ffffff", ratio: true }), /Invalid ratio/);
  assert.throws(() => run({ a: "#000000", b: "#ffffff", ratio: Infinity }), /Invalid ratio/);
});

test("edge case: uppercase hex and array input", () => {
  // uppercase accepted, output normalized to lowercase
  assert.deepEqual(run({ a: "#ABCDEF", b: "#ABCDEF", ratio: 0.3 }), { hex: "#abcdef" });
  assert.deepEqual(run({ a: "#F00", b: "000" }), { hex: "#800000" });
  // arrays are typeof "object" but have no a/b — must throw the hex error, not crash
  assert.throws(() => run([]), /Invalid hex color for "a"/);
});

test("edge case: mixing a color with itself is exact for any ratio, both spaces", () => {
  for (const space of ["srgb", "linear"]) {
    for (const ratio of [0, 0.123, 0.5, 0.999, 1]) {
      assert.deepEqual(run({ a: "#5a9bd4", b: "#5a9bd4", ratio, space }), {
        hex: "#5a9bd4",
      });
    }
  }
});

test("linear space: decode/encode roundtrip is exact for every byte (ratio 0 and 1)", () => {
  // Exercises both branches of the piecewise sRGB transfer function and its
  // inverse; any threshold or rounding inconsistency would shift some byte.
  for (let v = 0; v < 256; v++) {
    const h = "#" + v.toString(16).padStart(2, "0").repeat(3);
    assert.deepEqual(run({ a: h, b: "#000000", ratio: 0, space: "linear" }), { hex: h });
    assert.deepEqual(run({ a: "#ffffff", b: h, ratio: 1, space: "linear" }), { hex: h });
  }
});
