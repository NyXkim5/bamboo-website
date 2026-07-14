import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const UNIVERSE = [
  { symbol: "LMT", sector: "Aerospace & Defense", marketCap: 110, peRatio: 17 },
  { symbol: "RTX", sector: "Aerospace & Defense", marketCap: 130, peRatio: 22 },
  { symbol: "NOC", sector: "Aerospace & Defense", marketCap: 70, peRatio: 16 },
  { symbol: "AAPL", sector: "Technology", marketCap: 3000, peRatio: 30 },
];

test("meta is well-formed", () => {
  assert.equal(meta.id, "finance/sector-screener");
  assert.ok(meta.tags.includes("defense"));
});

test("filters by sector (case-insensitive)", () => {
  const r = run({ tickers: UNIVERSE, sector: "aerospace & defense" });
  assert.equal(r.count, 3);
  assert.equal(r.universe, 4);
  assert.ok(r.matched.every((t) => t.sector.includes("Defense")));
});

test("applies min and max thresholds", () => {
  const r = run({ tickers: UNIVERSE, sector: "Aerospace & Defense", min: { marketCap: 100 }, max: { peRatio: 20 } });
  assert.deepEqual(r.matched.map((t) => t.symbol), ["LMT"]);
});

test("sorts by a metric and limits", () => {
  const r = run({ tickers: UNIVERSE, sortBy: "marketCap", order: "desc", limit: 2 });
  assert.deepEqual(r.matched.map((t) => t.symbol), ["AAPL", "RTX"]);
});

test("ascending sort works", () => {
  const r = run({ tickers: UNIVERSE, sector: "Aerospace & Defense", sortBy: "marketCap", order: "asc" });
  assert.deepEqual(r.matched.map((t) => t.symbol), ["NOC", "LMT", "RTX"]);
});

test("rows missing a filtered metric are excluded", () => {
  const r = run({ tickers: [{ symbol: "X", sector: "Tech" }, ...UNIVERSE], min: { marketCap: 1 } });
  assert.ok(!r.matched.some((t) => t.symbol === "X"));
});

test("empty universe yields no matches", () => {
  const r = run({ tickers: [] });
  assert.equal(r.count, 0);
  assert.equal(r.universe, 0);
});

test("invalid inputs throw", () => {
  assert.throws(() => run({ tickers: "nope" }));
  assert.throws(() => run({ tickers: [], order: "sideways" }));
  assert.throws(() => run({ tickers: [], limit: -1 }));
  assert.throws(() => run({ tickers: [], min: [] }));
});
