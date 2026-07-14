import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "design/shadow-scale");
  assert.ok(meta.tags.includes("elevation"));
});

test("produces one shadow per level", () => {
  const r = run({ levels: 5 });
  assert.equal(r.shadows.length, 5);
  assert.equal(r.shadows[0].level, 1);
});

test("each shadow layers two box-shadow parts", () => {
  const r = run({ levels: 3 });
  for (const s of r.shadows) {
    assert.equal(s.css.split("),").length, 2); // two rgba(...) layers
  }
});

test("emits CSS variables for every level", () => {
  const r = run({ levels: 4 });
  assert.match(r.css, /--shadow-1:/);
  assert.match(r.css, /--shadow-4:/);
});

test("hex tint changes the shadow color channel", () => {
  const neutral = run({ levels: 1 }).shadows[0].css;
  const tinted = run({ levels: 1, hue: "#3b7a57" }).shadows[0].css;
  assert.notEqual(neutral, tinted);
  assert.match(tinted, /rgba\(59, 122, 87/);
});

test("levels < 1 throws", () => {
  assert.throws(() => run({ levels: 0 }));
});
