// Skill: finance/sector-screener
// Filter and rank a provided ticker universe by sector and numeric metric
// thresholds. Pure + deterministic — you pass the universe in, so it runs fully
// offline. Seed the universe from a free, authoritative source such as the
// iShares ITA / SPDR XAR "Aerospace & Defense" ETF holdings CSVs (no API key).
//
// Original zero-dependency implementation.

export const meta = {
  id: "finance/sector-screener",
  name: "Sector Stock Screener",
  domain: "finance",
  version: "0.1.0",
  description:
    "Filter a ticker universe by sector and min/max numeric thresholds (e.g. marketCap, peRatio), then sort and limit. Data-source-agnostic: seed the universe from ETF holdings (e.g. defense via ITA/XAR).",
  tags: ["finance", "screener", "stocks", "sector", "defense", "filter"],
  inputs: {
    tickers: "[{ symbol, sector, ...numericMetrics }]",
    sector: "optional sector name to match (case-insensitive)",
    min: "optional { field: number } lower bounds",
    max: "optional { field: number } upper bounds",
    sortBy: "optional metric field to sort by",
    order: "'asc' | 'desc' (default 'desc')",
    limit: "optional max results",
  },
  outputs: "{ count, matched: [...], universe: number }",
  license: "MIT",
  source: "Original implementation; universe seeded from ETF holdings (ITA/XAR) or any provider.",
};

function num(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function run(input = {}) {
  const { tickers, sector, min = {}, max = {}, sortBy, order = "desc", limit } = input;
  if (!Array.isArray(tickers)) throw new Error("tickers must be an array");
  if (order !== "asc" && order !== "desc") throw new Error("order must be 'asc' or 'desc'");
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 0)) throw new Error("limit must be a non-negative integer");
  for (const [obj, label] of [[min, "min"], [max, "max"]]) {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) throw new Error(`${label} must be an object`);
  }

  const wantSector = typeof sector === "string" ? sector.trim().toLowerCase() : null;

  let matched = tickers.filter((t) => {
    if (!t || typeof t !== "object") return false;
    if (wantSector && String(t.sector ?? "").toLowerCase() !== wantSector) return false;
    for (const [field, bound] of Object.entries(min)) {
      const v = num(t[field]);
      if (v === null || v < bound) return false;
    }
    for (const [field, bound] of Object.entries(max)) {
      const v = num(t[field]);
      if (v === null || v > bound) return false;
    }
    return true;
  });

  if (sortBy) {
    const dir = order === "asc" ? 1 : -1;
    matched = [...matched].sort((a, b) => {
      const av = num(a[sortBy]);
      const bv = num(b[sortBy]);
      // Missing metrics sort to the bottom regardless of direction.
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * dir;
    });
  }

  if (limit !== undefined) matched = matched.slice(0, limit);

  return { count: matched.length, matched, universe: tickers.length };
}
