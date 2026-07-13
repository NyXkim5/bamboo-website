// Skill: finance/rsi
// Relative Strength Index (Wilder's smoothing) over a close-price series.
// Pure + deterministic — no network, no deps.

export const meta = {
  id: "finance/rsi",
  name: "Relative Strength Index (RSI)",
  domain: "finance",
  version: "0.1.0",
  description:
    "Compute Wilder's RSI over a close-price series and flag overbought (>70) / oversold (<30) conditions on the latest bar.",
  tags: ["finance", "rsi", "indicator", "momentum", "quant", "stocks"],
  inputs: { prices: "number[] of closes (oldest→newest)", period: "int (default 14)" },
  outputs: "{ rsi: number[], latest, signal: 'overbought'|'oversold'|'neutral' }",
  license: "MIT",
  source: "Original implementation of Wilder's RSI (New Concepts in Technical Trading Systems, 1978).",
};

export function run(input = {}) {
  const { prices = [], period = 14 } = input;
  if (!Array.isArray(prices) || prices.length < period + 1) {
    throw new Error(`need at least ${period + 1} prices, got ${prices.length}`);
  }
  if (period < 2) throw new Error("period must be >= 2");

  // Seed average gain/loss over the first `period` changes.
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = prices[i] - prices[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgGain = gain / period, avgLoss = loss / period;

  const rsiFor = (ag, al) => (al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  const rsi = [round(rsiFor(avgGain, avgLoss))];

  // Wilder's smoothing for the rest.
  for (let i = period + 1; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    const g = d >= 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    rsi.push(round(rsiFor(avgGain, avgLoss)));
  }

  const latest = rsi[rsi.length - 1];
  const signal = latest > 70 ? "overbought" : latest < 30 ? "oversold" : "neutral";
  return { rsi, latest, signal, period };
}

function round(x) {
  return Math.round(x * 100) / 100;
}
