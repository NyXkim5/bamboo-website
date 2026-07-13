import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/sma-backtest");
  assert.ok(meta.tags.includes("backtest"));
});

test("throws when the series is too short", () => {
  assert.throws(() => run({ prices: [1, 2, 3], fast: 2, slow: 5 }));
});

test("throws when fast >= slow", () => {
  const prices = Array.from({ length: 40 }, (_, i) => 100 + i);
  assert.throws(() => run({ prices, fast: 30, slow: 30 }));
});

test("a dip-then-rally triggers an entry and a positive strategy return", () => {
  // Monotonic trends never produce a fresh crossover, so use a V-shape: the
  // fast SMA dips below the slow SMA, then crosses back up on the recovery.
  const down = Array.from({ length: 25 }, (_, i) => 120 - i * 1.2);
  const up = Array.from({ length: 45 }, (_, i) => 90 + i * 1.6);
  const prices = [...down, ...up];
  const r = run({ prices, fast: 5, slow: 20 });
  assert.ok(r.tradeCount >= 1, "expected at least one trade");
  assert.ok(r.strategyReturn > 0, `expected positive return, got ${r.strategyReturn}`);
});

test("returns a bounded win rate and non-positive drawdown", () => {
  const prices = Array.from({ length: 80 }, (_, i) => 100 + 10 * Math.sin(i / 4));
  const r = run({ prices, fast: 4, slow: 16 });
  assert.ok(r.winRate >= 0 && r.winRate <= 1);
  assert.ok(r.maxDrawdown <= 0);
});

test("trade objects carry entry, exit and return", () => {
  const prices = Array.from({ length: 60 }, (_, i) => 100 + 10 * Math.sin(i / 3));
  const r = run({ prices, fast: 3, slow: 12 });
  for (const t of r.trades) {
    assert.ok(typeof t.entry === "number" && typeof t.exit === "number");
    assert.ok(typeof t.return === "number");
  }
});
