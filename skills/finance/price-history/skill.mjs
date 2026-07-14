// Skill: finance/price-history
// Parse OHLC price history from a Stooq/Yahoo-style CSV *string* into structured
// bars. Pure + deterministic: the network fetch (e.g. from Stooq, which needs no
// API key) is a separate concern, so this parser core stays offline-testable and
// browser-safe.
//
// Stooq daily CSV: https://stooq.com/q/d/l/?s=aapl.us&i=d
// Reference format: Date,Open,High,Low,Close,Volume (Yahoo adds Adj Close).
// Original zero-dependency implementation.

export const meta = {
  id: "finance/price-history",
  name: "OHLC Price History Parser",
  domain: "finance",
  version: "0.1.0",
  description:
    "Parse a Stooq/Yahoo-style OHLC CSV string into normalized bars [{date,open,high,low,close,volume}], oldest→newest, with basic sanity checks. Fetching is a separate, keyless concern (Stooq).",
  tags: ["finance", "ohlc", "csv", "prices", "parser", "network"],
  inputs: {
    csv: "CSV text with a header row (Date,Open,High,Low,Close,Volume[,Adj Close])",
    order: "'asc' | 'desc' output order by date (default 'asc')",
  },
  outputs: "{ count, bars: [{ date, open, high, low, close, volume }], closes: number[] }",
  license: "MIT",
  source: "Stooq / Yahoo Finance CSV column format; original zero-dep parser.",
};

function splitLine(line) {
  return line.split(",").map((c) => c.trim());
}

function num(v, label, lineNo) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`row ${lineNo}: ${label} is not a finite number: "${v}"`);
  return n;
}

export function run(input = {}) {
  const { csv, order = "asc" } = input;
  if (typeof csv !== "string" || csv.trim() === "") throw new Error("csv must be a non-empty string");
  if (order !== "asc" && order !== "desc") throw new Error("order must be 'asc' or 'desc'");

  const rows = csv.replace(/^﻿/, "").split(/\r?\n/).filter((r) => r.trim() !== "");
  if (rows.length < 2) throw new Error("csv must have a header row and at least one data row");

  // Map header names to column indexes (case-insensitive).
  const header = splitLine(rows[0]).map((h) => h.toLowerCase());
  const col = (name) => header.indexOf(name);
  const idx = { date: col("date"), open: col("open"), high: col("high"), low: col("low"), close: col("close"), volume: col("volume") };
  for (const key of ["date", "open", "high", "low", "close"]) {
    if (idx[key] === -1) throw new Error(`csv header is missing required column: ${key}`);
  }

  const bars = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = splitLine(rows[i]);
    const date = cells[idx.date];
    if (!date) throw new Error(`row ${i + 1}: missing date`);
    const open = num(cells[idx.open], "open", i + 1);
    const high = num(cells[idx.high], "high", i + 1);
    const low = num(cells[idx.low], "low", i + 1);
    const close = num(cells[idx.close], "close", i + 1);
    const volume = idx.volume === -1 ? null : num(cells[idx.volume], "volume", i + 1);
    if (high != null && low != null && high < low) throw new Error(`row ${i + 1}: high (${high}) < low (${low})`);
    bars.push({ date, open, high, low, close, volume });
  }

  // Stooq/Yahoo CSVs are ascending by date already; sort defensively by date string.
  bars.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (order === "desc") bars.reverse();

  return { count: bars.length, bars, closes: bars.map((b) => b.close) };
}
