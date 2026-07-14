import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/macd");
  assert.ok(meta.tags.includes("macd"));
});

test("throws on too-short series", () => {
  assert.throws(() => run({ prices: Array(10).fill(100) }));
});

test("output arrays align with the price series length", () => {
  const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
  const r = run({ prices });
  assert.equal(r.macd.length, prices.length);
  assert.equal(r.signal.length, prices.length);
  assert.equal(r.histogram.length, prices.length);
});

test("steady uptrend yields a positive MACD line", () => {
  const prices = Array.from({ length: 60 }, (_, i) => 100 + i * 2);
  const r = run({ prices });
  assert.ok(r.latest.macd > 0);
});

test("histogram equals macd minus signal at the latest bar (within rounding)", () => {
  const prices = Array.from({ length: 80 }, (_, i) => 100 + 10 * Math.sin(i / 5));
  const r = run({ prices });
  // Each series is independently rounded to 4dp, so allow one rounding-unit slack.
  const diff = Math.abs(r.latest.histogram - (r.latest.macd - r.latest.signal));
  assert.ok(diff < 1e-3, `diff ${diff} exceeds tolerance`);
});

test("cross is one of the allowed values", () => {
  const prices = Array.from({ length: 80 }, (_, i) => 100 + 10 * Math.sin(i / 4));
  const r = run({ prices });
  assert.ok(["bullish", "bearish", "none"].includes(r.cross));
});
