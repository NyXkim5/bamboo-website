import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/rsi");
  assert.ok(meta.tags.includes("momentum"));
});

test("throws on too-short series", () => {
  assert.throws(() => run({ prices: [1, 2, 3], period: 14 }));
});

test("a monotonic rise pins RSI at ~100 (overbought)", () => {
  const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
  const r = run({ prices, period: 14 });
  assert.equal(r.latest, 100);
  assert.equal(r.signal, "overbought");
});

test("a monotonic fall pins RSI at ~0 (oversold)", () => {
  const prices = Array.from({ length: 30 }, (_, i) => 200 - i);
  const r = run({ prices, period: 14 });
  assert.ok(r.latest < 30);
  assert.equal(r.signal, "oversold");
});

test("RSI values stay within 0..100", () => {
  const prices = Array.from({ length: 60 }, (_, i) => 100 + 8 * Math.sin(i / 3));
  const r = run({ prices, period: 14 });
  for (const v of r.rsi) assert.ok(v >= 0 && v <= 100);
});

test("output length matches prices - period", () => {
  const prices = Array.from({ length: 40 }, (_, i) => 100 + (i % 5));
  const r = run({ prices, period: 14 });
  assert.equal(r.rsi.length, prices.length - 14);
});
