// Skill: finance/macd
// Moving Average Convergence Divergence (MACD) over a close-price series.
// Pure + deterministic — no network, no deps.

export const meta = {
  id: "finance/macd",
  name: "MACD Indicator",
  domain: "finance",
  version: "0.1.0",
  description:
    "Compute MACD line, signal line, and histogram (default 12/26/9 EMAs) over a close-price series, and flag the latest bullish/bearish crossover.",
  tags: ["finance", "macd", "indicator", "momentum", "quant", "stocks"],
  inputs: { prices: "number[] closes (oldest→newest)", fast: "int (12)", slow: "int (26)", signal: "int (9)" },
  outputs: "{ macd: number[], signal: number[], histogram: number[], latest, cross }",
  license: "MIT",
  source: "Original implementation of Appel's MACD.",
};

function ema(values, period) {
  const k = 2 / (period + 1);
  const out = [];
  let prev;
  values.forEach((v, i) => {
    if (i === 0) prev = v;
    else prev = v * k + prev * (1 - k);
    out.push(prev);
  });
  return out;
}

export function run(input = {}) {
  const { prices = [], fast = 12, slow = 26, signal = 9 } = input;
  if (!Array.isArray(prices) || prices.length < slow + signal) {
    throw new Error(`need at least ${slow + signal} prices, got ${prices.length}`);
  }
  if (fast >= slow) throw new Error("fast must be < slow");

  const emaFast = ema(prices, fast);
  const emaSlow = ema(prices, slow);
  const macd = prices.map((_, i) => emaFast[i] - emaSlow[i]);
  const signalLine = ema(macd, signal);
  const histogram = macd.map((m, i) => m - signalLine[i]);

  const round = (x) => Math.round(x * 10000) / 10000;
  const n = prices.length - 1;
  const prevHist = histogram[n - 1];
  const nowHist = histogram[n];
  const cross =
    prevHist <= 0 && nowHist > 0 ? "bullish" :
    prevHist >= 0 && nowHist < 0 ? "bearish" : "none";

  return {
    macd: macd.map(round),
    signal: signalLine.map(round),
    histogram: histogram.map(round),
    latest: { macd: round(macd[n]), signal: round(signalLine[n]), histogram: round(nowHist) },
    cross,
  };
}
