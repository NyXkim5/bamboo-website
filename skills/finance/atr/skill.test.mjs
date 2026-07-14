import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

function bars(n, spread = 2) {
  return Array.from({ length: n }, (_, i) => {
    const close = 100 + i;
    return { high: close + spread, low: close - spread, close };
  });
}

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/atr");
  assert.ok(meta.tags.includes("atr"));
});

test("throws on too-few bars", () => {
  assert.throws(() => run({ bars: bars(5), period: 14 }));
});

test("constant-range bars give a stable ATR near that range", () => {
  const r = run({ bars: bars(30, 3), period: 14 });
  // Range is 6 each bar with +1 drift ⇒ TR ~6..7; ATR should sit in that band.
  assert.ok(r.latest >= 6 && r.latest <= 8, `got ${r.latest}`);
});

test("ATR is always non-negative", () => {
  const r = run({ bars: bars(40), period: 14 });
  for (const v of r.atr) assert.ok(v >= 0);
});

test("latestPct is ATR relative to last close", () => {
  const r = run({ bars: bars(30, 3), period: 14 });
  const expected = Math.round((r.latest / 129) * 100 * 10000) / 10000;
  assert.equal(r.latestPct, expected);
});
