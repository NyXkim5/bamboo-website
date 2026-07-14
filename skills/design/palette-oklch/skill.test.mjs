import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const HEX_RE = /^#[0-9a-f]{6}$/;

test("meta contract", () => {
  assert.equal(meta.id, "design/palette-oklch");
  assert.equal(meta.domain, "design");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.description === "string" && meta.description.length > 0);
  assert.ok(meta.source.toLowerCase().includes("ottosson"));
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("nope"), Error);
  assert.throws(() => run({}), Error); // missing base
  assert.throws(() => run({ base: "not-a-color" }), Error);
  assert.throws(() => run({ base: "#12345" }), Error); // 5 digits
  assert.throws(() => run({ base: 0xff0000 }), Error); // non-string
  assert.throws(() => run({ base: "#3b82f6", steps: 0 }), Error);
  assert.throws(() => run({ base: "#3b82f6", steps: 2.5 }), Error);
  assert.throws(() => run({ base: "#3b82f6", steps: 1000 }), Error);
  assert.throws(() => run({ base: "#3b82f6", lMin: 0.9, lMax: 0.2 }), Error);
  assert.throws(() => run({ base: "#3b82f6", lMin: -1 }), Error);
});

test("white converts to OKLCH L ~ 1, C ~ 0 (hand-computed: all matrix rows sum to 1)", () => {
  const out = run({ base: "#ffffff", steps: 1 });
  assert.ok(Math.abs(out.base.oklch.l - 1) < 1e-3, `L=${out.base.oklch.l}`);
  assert.ok(out.base.oklch.c < 1e-3, `C=${out.base.oklch.c}`);
  assert.equal(out.swatches.length, 1);
  assert.equal(out.swatches[0].hex, "#ffffff");
});

test("mid grey #808080: hand-computed L (128/255 gamma-decodes to 0.215860, cbrt = 0.599870) and exact round-trip", () => {
  const out = run({ base: "#808080", steps: 1 });
  // hand computation: u = 128/255 = 0.501961
  // linear = ((0.501961 + 0.055) / 1.055)^2.4 = 0.527925^2.4 = 0.215860
  // l = m = s = 0.215860 (each LMS row sums to 1), cbrt = 0.599870
  // L = 0.599870 * (0.2104542553 + 0.7936177850 - 0.0040720468) = 0.599870
  assert.ok(Math.abs(out.base.oklch.l - 0.59987) < 1e-3, `L=${out.base.oklch.l}`);
  assert.ok(out.base.oklch.c < 1e-4, `C=${out.base.oklch.c}`);
  // steps=1 uses the base lightness, so the swatch must round-trip exactly
  assert.equal(out.swatches[0].hex, "#808080");
});

test("pure red #ff0000 matches Ottosson reference OKLab (0.627955, 0.224863, 0.125803) as OKLCH", () => {
  const { base } = run({ base: "#ff0000" });
  // C = sqrt(0.224863^2 + 0.125803^2) = sqrt(0.0663898) = 0.257662
  // h = atan2(0.125803, 0.224863) = 29.234 deg
  assert.ok(Math.abs(base.oklch.l - 0.627955) < 1e-3, `L=${base.oklch.l}`);
  assert.ok(Math.abs(base.oklch.c - 0.257662) < 1e-3, `C=${base.oklch.c}`);
  assert.ok(Math.abs(base.oklch.h - 29.234) < 0.1, `h=${base.oklch.h}`);
});

test("default ramp: 5 swatches, valid hex, strictly increasing L, constant C and h", () => {
  const out = run({ base: "#3b82f6" });
  assert.equal(out.swatches.length, 5);
  for (const sw of out.swatches) {
    assert.match(sw.hex, HEX_RE);
    assert.equal(sw.oklch.c, out.swatches[0].oklch.c);
    assert.equal(sw.oklch.h, out.swatches[0].oklch.h);
  }
  // default lMin=0.2, lMax=0.95 => L = 0.2, 0.3875, 0.575, 0.7625, 0.95 (hand-computed)
  const ls = out.swatches.map((s) => s.oklch.l);
  assert.deepEqual(ls, [0.2, 0.3875, 0.575, 0.7625, 0.95]);
  for (let i = 1; i < ls.length; i++) assert.ok(ls[i] > ls[i - 1]);
});

test("round-trips base within a couple of rgb units (steps=1)", () => {
  for (const base of ["#3b82f6", "#e11d48", "#10b981", "#f59e0b", "#123456"]) {
    const out = run({ base, steps: 1 });
    const want = base
      .slice(1)
      .match(/../g)
      .map((x) => parseInt(x, 16));
    const got = out.swatches[0].hex
      .slice(1)
      .match(/../g)
      .map((x) => parseInt(x, 16));
    for (let i = 0; i < 3; i++) {
      assert.ok(
        Math.abs(want[i] - got[i]) <= 2,
        `${base} channel ${i}: want ${want[i]} got ${got[i]}`
      );
    }
  }
});

test("accepts 3-digit and unprefixed hex, is deterministic and JSON-serializable", () => {
  const a = run({ base: "#abc", steps: 3 });
  const b = run({ base: "aabbcc", steps: 3 });
  assert.deepEqual(a, b);
  assert.deepEqual(a, JSON.parse(JSON.stringify(a)));
  assert.equal(a.base.hex, "#aabbcc");
});

test("black base: L=0, C=0, h=0 exactly, and steps=1 round-trips to #000000", () => {
  const out = run({ base: "#000", steps: 1 });
  assert.equal(out.base.oklch.l, 0);
  assert.equal(out.base.oklch.c, 0);
  assert.equal(out.base.oklch.h, 0);
  assert.equal(out.swatches[0].hex, "#000000");
});

test("inherited/prototype keys are ignored: only own properties configure the run", () => {
  const proto = { steps: 2, lMin: 0.4, lMax: 0.5 };
  const input = Object.assign(Object.create(proto), { base: "#3b82f6" });
  const out = run(input);
  assert.equal(out.swatches.length, 5); // default, not prototype's 2
  assert.equal(out.swatches[0].oklch.l, 0.2); // default lMin, not 0.4
  assert.equal(out.swatches[4].oklch.l, 0.95); // default lMax, not 0.5
  // explicit undefined falls back to defaults, like destructuring
  assert.equal(run({ base: "#3b82f6", steps: undefined }).swatches.length, 5);
});

test("non-finite and wrong-typed options throw", () => {
  assert.throws(() => run({ base: "#fff", steps: Infinity }), Error);
  assert.throws(() => run({ base: "#fff", steps: NaN }), Error);
  assert.throws(() => run({ base: "#fff", steps: "3" }), Error);
  assert.throws(() => run({ base: "#fff", lMin: NaN }), Error);
  assert.throws(() => run({ base: "#fff", lMax: Infinity }), Error);
  assert.throws(() => run({ base: "#fff", lMax: "0.9" }), Error);
});

test("extremes: frozen input, steps=2 hits exactly [lMin, lMax]=[0,1], no -0 in output", () => {
  const input = Object.freeze({ base: "#10b981", steps: 2, lMin: 0, lMax: 1 });
  const out = run(input); // must not mutate the (frozen) input
  assert.deepEqual(out.swatches.map((s) => s.oklch.l), [0, 1]);
  for (const sw of out.swatches) {
    assert.match(sw.hex, HEX_RE);
    for (const v of Object.values(sw.oklch)) {
      assert.ok(Number.isFinite(v) && !Object.is(v, -0), `bad value ${v}`);
    }
  }
  assert.deepEqual(run(input), out); // deterministic
  // lMin: -0 is a valid in-range lightness and must not throw
  assert.equal(run({ base: "#10b981", steps: 2, lMin: -0 }).swatches[0].oklch.l, 0);
});
