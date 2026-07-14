import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/bollinger");
  assert.ok(meta.tags.includes("bollinger"));
});

test("throws on too-short series", () => {
  assert.throws(() => run({ prices: [1, 2, 3], period: 20 }));
});

test("flat prices collapse the bands onto the middle", () => {
  const r = run({ prices: Array(25).fill(100), period: 20 });
  const n = r.middle.length - 1;
  assert.equal(r.middle[n], 100);
  assert.equal(r.upper[n], 100);
  assert.equal(r.lower[n], 100);
});

test("upper >= middle >= lower at every point", () => {
  const prices = Array.from({ length: 60 }, (_, i) => 100 + 8 * Math.sin(i / 4));
  const r = run({ prices, period: 20 });
  for (let i = 0; i < r.middle.length; i++) {
    assert.ok(r.upper[i] >= r.middle[i] && r.middle[i] >= r.lower[i]);
  }
});

test("percentB is ~1 when price sits on the upper band", () => {
  // Rising series pushes the last price toward/above the upper band.
  const prices = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
  const r = run({ prices, period: 20 });
  assert.ok(r.latest.percentB >= 0.9);
});

test("signal is one of the allowed values", () => {
  const prices = Array.from({ length: 40 }, (_, i) => 100 + 5 * Math.sin(i / 3));
  const r = run({ prices, period: 20 });
  assert.ok(["above-upper", "below-lower", "inside"].includes(r.latest.signal));
});
