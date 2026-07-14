// Skill: finance/atr
// Average True Range (ATR) — Wilder's volatility measure over OHLC bars.
// Pure + deterministic — no network, no deps.

export const meta = {
  id: "finance/atr",
  name: "Average True Range (ATR)",
  domain: "finance",
  version: "0.1.0",
  description:
    "Compute Wilder's Average True Range from OHLC bars — a volatility measure used for stops and position sizing.",
  tags: ["finance", "atr", "indicator", "volatility", "quant", "stocks"],
  inputs: { bars: "[{ high, low, close }] oldest→newest", period: "int (14)" },
  outputs: "{ atr: number[], latest, latestPct }",
  license: "MIT",
  source: "Original implementation of Wilder's ATR (New Concepts in Technical Trading Systems, 1978).",
};

export function run(input = {}) {
  const { bars = [], period = 14 } = input;
  if (!Array.isArray(bars) || bars.length < period + 1) {
    throw new Error(`need at least ${period + 1} bars, got ${bars.length}`);
  }
  const round = (x) => Math.round(x * 10000) / 10000;

  // True Range for each bar (from bar 1 onward — needs a previous close).
  const tr = [];
  for (let i = 1; i < bars.length; i++) {
    const { high, low } = bars[i];
    const prevClose = bars[i - 1].close;
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  // Seed ATR = simple average of the first `period` TRs, then Wilder-smooth.
  let atrVal = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const atr = [round(atrVal)];
  for (let i = period; i < tr.length; i++) {
    atrVal = (atrVal * (period - 1) + tr[i]) / period;
    atr.push(round(atrVal));
  }

  const latest = atr[atr.length - 1];
  const lastClose = bars[bars.length - 1].close;
  const latestPct = lastClose === 0 ? 0 : round((latest / lastClose) * 100);
  return { atr, latest, latestPct, period };
}
