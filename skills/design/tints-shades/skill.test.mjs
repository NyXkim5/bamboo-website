import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has required fields", () => {
  assert.equal(meta.id, "design/tints-shades");
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

test("default 5 steps for #3498db — hand-computed ramps, base-first", () => {
  const out = run({ base: "#3498db" });
  assert.equal(out.base, "#3498db");
  assert.equal(out.steps, 5);
  // tints: channel + (255-channel)*t, t = 0, 0.2, 0.4, 0.6, 0.8, rounded
  // t=0.2: r=52+203*0.2=92.6->93(0x5d), g=152+103*0.2=172.6->173(0xad), b=219+36*0.2=226.2->226(0xe2)
  assert.deepEqual(out.tints, [
    "#3498db",
    "#5dade2",
    "#85c1e9",
    "#aed6f1",
    "#d6eaf8",
  ]);
  // shades: channel*(1-t)
  // t=0.2: r=41.6->42(0x2a), g=121.6->122(0x7a), b=175.2->175(0xaf)
  assert.deepEqual(out.shades, [
    "#3498db",
    "#2a7aaf",
    "#1f5b83",
    "#153d58",
    "#0a1e2c",
  ]);
});

test("black base, steps 4 — tints climb by 25% toward white, shades stay black", () => {
  const out = run({ base: "000000", steps: 4 });
  // t = 0, 0.25, 0.5, 0.75; 255*0.25=63.75->64, 127.5->128, 191.25->191
  assert.deepEqual(out.tints, ["#000000", "#404040", "#808080", "#bfbfbf"]);
  assert.deepEqual(out.shades, [
    "#000000",
    "#000000",
    "#000000",
    "#000000",
  ]);
});

test("white base, steps 2 — tints stay white, shade at t=0.5 is #808080", () => {
  const out = run({ base: "#FFFFFF", steps: 2 });
  assert.deepEqual(out.tints, ["#ffffff", "#ffffff"]);
  // 255*0.5=127.5 -> Math.round -> 128 = 0x80
  assert.deepEqual(out.shades, ["#ffffff", "#808080"]);
});

test("3-digit shorthand expands; steps 1 returns just the base", () => {
  const out = run({ base: "#f0a", steps: 1 });
  assert.equal(out.base, "#ff00aa");
  assert.deepEqual(out.tints, ["#ff00aa"]);
  assert.deepEqual(out.shades, ["#ff00aa"]);
});

test("deterministic and JSON-serializable", () => {
  const a = run({ base: "#123456", steps: 3 });
  const b = run({ base: "#123456", steps: 3 });
  assert.deepEqual(a, b);
  assert.equal(typeof JSON.stringify(a), "string");
});

test("near-extreme bases: rounding may land on pure white/black (documented edge)", () => {
  // #fefefe tints: 254 + 1*t rounds to 255 once t >= 0.5 -> pure white appears
  const tints = run({ base: "#fefefe" }).tints;
  assert.deepEqual(tints, [
    "#fefefe",
    "#fefefe",
    "#fefefe",
    "#ffffff",
    "#ffffff",
  ]);
  // symmetric for shades of #010101: 1*(1-t) rounds to 0 once t >= 0.5
  const shades = run({ base: "#010101" }).shades;
  assert.deepEqual(shades, [
    "#010101",
    "#010101",
    "#010101",
    "#000000",
    "#000000",
  ]);
});

test("non-finite, -0, negative, null, and boolean steps throw", () => {
  for (const steps of [NaN, Infinity, -Infinity, -0, -3, null, true]) {
    assert.throws(
      () => run({ base: "#fff", steps }),
      /steps must be an integer/,
      `steps=${steps}`
    );
  }
});

test("null-prototype input without base throws; whitespace/uppercase normalize", () => {
  assert.throws(() => run(Object.create(null)), /base must be a hex color/);
  const out = run({ base: "  #ABC  ", steps: 1 });
  assert.equal(out.base, "#aabbcc");
  assert.deepEqual(out.tints, ["#aabbcc"]);
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null));
  assert.throws(() => run({}));
  assert.throws(() => run({ base: 123456 }));
  assert.throws(() => run({ base: "#12345" })); // 5 digits
  assert.throws(() => run({ base: "#gggggg" })); // non-hex chars
  assert.throws(() => run({ base: "#fff", steps: 0 }));
  assert.throws(() => run({ base: "#fff", steps: 2.5 }));
  assert.throws(() => run({ base: "#fff", steps: "5" }));
  assert.throws(() => run({ base: "#fff", steps: 101 }));
});
