import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/position-size");
  assert.ok(meta.tags.includes("risk"));
});

test("risks the target dollar amount at the stop", () => {
  // $10k account, 1% risk = $100. Entry 50, stop 45 → $5/share → 20 shares.
  const r = run({ account: 10000, entry: 50, stop: 45, riskPct: 1 });
  assert.equal(r.shares, 20);
  assert.equal(r.riskPerShare, 5);
  assert.equal(r.dollarRisk, 100);
  assert.equal(r.direction, "long");
});

test("max-position cap limits share count", () => {
  // Without cap risk would allow many shares; cap to 10% of 10k = $1000 → 20 shares at $50.
  const r = run({ account: 10000, entry: 50, stop: 49.9, riskPct: 5, maxPositionPct: 10 });
  assert.ok(r.capped);
  assert.equal(r.shares, 20);
});

test("short direction detected when stop is above entry", () => {
  const r = run({ account: 10000, entry: 50, stop: 55 });
  assert.equal(r.direction, "short");
});

test("invalid inputs throw", () => {
  assert.throws(() => run({ account: 0, entry: 10, stop: 9 }));
  assert.throws(() => run({ account: 100, entry: 10, stop: 10 }));
});
