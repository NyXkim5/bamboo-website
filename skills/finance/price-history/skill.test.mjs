import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const CSV = `Date,Open,High,Low,Close,Volume
2026-07-10,100.0,102.5,99.5,101.0,1500000
2026-07-11,101.0,103.0,100.5,102.75,1200000
2026-07-12,102.75,104.0,102.0,103.5,900000`;

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/price-history");
  assert.ok(meta.tags.includes("network"));
});

test("parses a Stooq/Yahoo OHLC CSV into bars", () => {
  const r = run({ csv: CSV });
  assert.equal(r.count, 3);
  assert.deepEqual(r.bars[0], { date: "2026-07-10", open: 100, high: 102.5, low: 99.5, close: 101, volume: 1500000 });
  assert.deepEqual(r.closes, [101, 102.75, 103.5]);
});

test("desc order reverses by date", () => {
  const r = run({ csv: CSV, order: "desc" });
  assert.equal(r.bars[0].date, "2026-07-12");
  assert.equal(r.bars[2].date, "2026-07-10");
});

test("header column order is respected case-insensitively", () => {
  const csv = `close,date,high,low,open\n5,2026-01-01,6,4,4.5`;
  const r = run({ csv });
  assert.equal(r.bars[0].close, 5);
  assert.equal(r.bars[0].date, "2026-01-01");
  assert.equal(r.bars[0].volume, null); // no volume column
});

test("missing required column throws", () => {
  assert.throws(() => run({ csv: "date,open,high,low,volume\n2026-01-01,1,2,1,10" }), /close/);
});

test("high < low is rejected", () => {
  assert.throws(() => run({ csv: "Date,Open,High,Low,Close\n2026-01-01,10,5,9,8" }), /high/);
});

test("non-finite numeric cell throws", () => {
  assert.throws(() => run({ csv: "Date,Open,High,Low,Close\n2026-01-01,x,2,1,1.5" }), /finite/);
});

test("empty / header-only input throws", () => {
  assert.throws(() => run({ csv: "" }));
  assert.throws(() => run({ csv: "Date,Open,High,Low,Close" }));
  assert.throws(() => run({}));
});
