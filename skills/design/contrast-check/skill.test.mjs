import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "design/contrast-check");
  assert.ok(meta.tags.includes("contrast"));
});

test("black on white is the max 21:1 and passes everything", () => {
  const r = run({ fg: "#000000", bg: "#ffffff" });
  assert.equal(r.ratio, 21);
  assert.ok(r.pass.aaNormal && r.pass.aaaNormal && r.pass.aaLarge && r.pass.aaaLarge);
});

test("identical colors are 1:1 and fail everything", () => {
  const r = run({ fg: "#777777", bg: "#777777" });
  assert.equal(r.ratio, 1);
  assert.ok(!r.pass.aaNormal && !r.pass.aaLarge);
});

test("order of fg/bg does not change the ratio", () => {
  const a = run({ fg: "#3b7a57", bg: "#ffffff" });
  const b = run({ fg: "#ffffff", bg: "#3b7a57" });
  assert.equal(a.ratio, b.ratio);
});

test("a mid-gray on white passes AA-large but not AA-normal", () => {
  // #949494 ~ 3.0-4.4:1 on white → passes large, fails normal.
  const r = run({ fg: "#949494", bg: "#ffffff" });
  assert.ok(r.pass.aaLarge);
  assert.ok(!r.pass.aaNormal);
});

test("invalid hex throws", () => {
  assert.throws(() => run({ fg: "green", bg: "#fff" }));
});
