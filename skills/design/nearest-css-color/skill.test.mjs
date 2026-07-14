// Tests for design/nearest-css-color
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has required fields", () => {
  assert.equal(meta.id, "design/nearest-css-color");
  assert.equal(meta.domain, "design");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("exact match returns distance 0", () => {
  assert.deepEqual(run({ hex: "#ff0000" }), {
    name: "red",
    hex: "#ff0000",
    distance: 0,
  });
});

test("near-black resolves to black with correct squared distance", () => {
  // (0-0)^2 + (0-0)^2 + (1-0)^2 = 1
  assert.deepEqual(run({ hex: "#000001" }), {
    name: "black",
    hex: "#000000",
    distance: 1,
  });
});

test("dark blue is closer to navy than to blue", () => {
  // #00008b vs navy #000080: (0x8b - 0x80)^2 = 11^2 = 121
  // vs blue #0000ff: (0x8b - 0xff)^2 = 116^2 = 13456
  assert.deepEqual(run({ hex: "#00008b" }), {
    name: "navy",
    hex: "#000080",
    distance: 121,
  });
});

test("near-white resolves to white with distance 3", () => {
  // (255-254)^2 * 3 = 3
  assert.deepEqual(run({ hex: "#fefefe" }), {
    name: "white",
    hex: "#ffffff",
    distance: 3,
  });
});

test("edge case: 3-digit shorthand and missing '#' are accepted", () => {
  assert.deepEqual(run({ hex: "#fff" }), {
    name: "white",
    hex: "#ffffff",
    distance: 0,
  });
  assert.deepEqual(run({ hex: "808080" }), {
    name: "gray",
    hex: "#808080",
    distance: 0,
  });
});

test("edge case: uppercase hex is accepted", () => {
  const out = run({ hex: "#FFA500" });
  assert.equal(out.name, "orange");
  assert.equal(out.distance, 0);
});

test("invalid input throws with a clear message", () => {
  assert.throws(() => run({ hex: "#12345" }), /Invalid hex color/);
  assert.throws(() => run({ hex: "zzz" }), /Invalid hex color/);
  assert.throws(() => run({ hex: 123456 }), /hex must be a string/);
  assert.throws(() => run({}), /hex must be a string/);
  assert.throws(() => run(null), /input must be an object/);
});

test("edge case: empty and bare-'#' strings throw, never return a color", () => {
  assert.throws(() => run({ hex: "" }), /Invalid hex color/);
  assert.throws(() => run({ hex: "#" }), /Invalid hex color/);
  assert.throws(() => run({ hex: "   " }), /Invalid hex color/);
});

test("edge case: surrounding whitespace is trimmed and accepted", () => {
  assert.deepEqual(run({ hex: "  #fff  " }), {
    name: "white",
    hex: "#ffffff",
    distance: 0,
  });
});

test("edge case: non-plain-object inputs throw", () => {
  assert.throws(() => run(undefined), /input must be an object/);
  assert.throws(() => run("ff0000"), /input must be an object/);
  assert.throws(() => run(true), /input must be an object/);
  assert.throws(() => run([]), /input must be an object/);
});

test("ties break deterministically to the first-declared color", () => {
  // #000040 is equidistant (squared distance 64^2 = 4096) from black
  // (#000000) and navy (#000080); every other palette color is farther
  // (next closest is indigo at 9981). The first-declared entry (black)
  // must win, and repeated calls must agree.
  const first = run({ hex: "#000040" });
  assert.deepEqual(first, { name: "black", hex: "#000000", distance: 4096 });
  assert.deepEqual(run({ hex: "000040" }), first);
});
