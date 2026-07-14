import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta contract", () => {
  assert.equal(meta.id, "design/readable-text-color");
  assert.equal(meta.domain, "design");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("white background: black text, ratios 21 and 1", () => {
  // L(#ffffff) = 1. black: (1+0.05)/(0+0.05) = 21. white: (1+0.05)/(1+0.05) = 1.
  const out = run({ bg: "#ffffff" });
  assert.deepEqual(out, {
    textColor: "#000000",
    contrastBlack: 21,
    contrastWhite: 1,
  });
});

test("black background: white text, ratios 1 and 21", () => {
  // L(#000000) = 0. black: 1. white: (1+0.05)/(0+0.05) = 21.
  const out = run({ bg: "#000000" });
  assert.deepEqual(out, {
    textColor: "#ffffff",
    contrastBlack: 1,
    contrastWhite: 21,
  });
});

test("pure red #ff0000: black text, 5.25 vs 4", () => {
  // L = 0.2126 * 1 = 0.2126.
  // black: (0.2126+0.05)/0.05 = 0.2626/0.05 = 5.252 -> 5.25
  // white: 1.05/0.2626 = 3.99847... -> 4
  const out = run({ bg: "#ff0000" });
  assert.equal(out.textColor, "#000000");
  assert.equal(out.contrastBlack, 5.25);
  assert.equal(out.contrastWhite, 4);
});

test("pure blue #0000ff: white text, 2.44 vs 8.59", () => {
  // L = 0.0722 * 1 = 0.0722.
  // black: (0.0722+0.05)/0.05 = 0.1222/0.05 = 2.444 -> 2.44
  // white: 1.05/0.1222 = 8.59247... -> 8.59
  const out = run({ bg: "#0000ff" });
  assert.equal(out.textColor, "#ffffff");
  assert.equal(out.contrastBlack, 2.44);
  assert.equal(out.contrastWhite, 8.59);
});

test("shorthand and missing-# forms match the 6-digit form", () => {
  const full = run({ bg: "#0000ff" });
  assert.deepEqual(run({ bg: "#00f" }), full);
  assert.deepEqual(run({ bg: "0000ff" }), full);
  assert.deepEqual(run({ bg: "00f" }), full);
});

test("invalid input throws", () => {
  assert.throws(() => run({ bg: "#12345" })); // 5 digits
  assert.throws(() => run({ bg: "#zzzzzz" })); // non-hex chars
  assert.throws(() => run({ bg: 123 })); // not a string
  assert.throws(() => run({})); // missing bg
  assert.throws(() => run(null)); // not an object
  assert.throws(() => run({ bg: "" })); // empty string
});

test("deterministic: same input, same output", () => {
  assert.deepEqual(run({ bg: "#336699" }), run({ bg: "#336699" }));
});

test("crossover grays flip at L ~= 0.17913: #757575 -> white, #767676 -> black", () => {
  // #757575: L = 0.177888... (just below crossover) => white wins 4.61 vs 4.56
  const a = run({ bg: "#757575" });
  assert.equal(a.textColor, "#ffffff");
  assert.ok(a.contrastWhite > a.contrastBlack);
  assert.deepEqual([a.contrastBlack, a.contrastWhite], [4.56, 4.61]);
  // #767676: L = 0.181164... (just above crossover) => black wins 4.62 vs 4.54
  const b = run({ bg: "#767676" });
  assert.equal(b.textColor, "#000000");
  assert.ok(b.contrastBlack > b.contrastWhite);
  assert.deepEqual([b.contrastBlack, b.contrastWhite], [4.62, 4.54]);
});

test("bg inherited from the prototype chain is rejected (own keys only)", () => {
  assert.throws(() => run(Object.create({ bg: "#ffffff" })));
  assert.throws(() => run(Object.create(null))); // no own bg either
  // but an own bg on a null-prototype object is fine
  const nullProto = Object.create(null);
  nullProto.bg = "#ffffff";
  assert.deepEqual(run(nullProto), run({ bg: "#ffffff" }));
});

test("case-insensitive and whitespace-tolerant parsing", () => {
  const ref = run({ bg: "#ff0000" });
  assert.deepEqual(run({ bg: "#FF0000" }), ref);
  assert.deepEqual(run({ bg: "  #ff0000\n" }), ref);
  assert.deepEqual(run({ bg: "#F00" }), ref);
});

test("outputs are always finite ratios within [1, 21]", () => {
  for (const bg of ["#000", "#fff", "#0a0a0a", "#123456", "#ed0", "#804000"]) {
    const { contrastBlack, contrastWhite } = run({ bg });
    for (const r of [contrastBlack, contrastWhite]) {
      assert.ok(Number.isFinite(r) && r >= 1 && r <= 21, `${bg}: ${r}`);
      assert.ok(!Object.is(r, -0));
    }
  }
});
