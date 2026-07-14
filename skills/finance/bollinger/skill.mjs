// Skill: finance/bollinger
// Bollinger Bands: SMA middle band with upper/lower bands at k standard
// deviations. Pure + deterministic — no network, no deps.

export const meta = {
  id: "finance/bollinger",
  name: "Bollinger Bands",
  domain: "finance",
  version: "0.1.0",
  description:
    "Compute Bollinger Bands (SMA ± k·stddev) over a close-price series and report the latest bar's %B and band width.",
  tags: ["finance", "bollinger", "indicator", "volatility", "quant", "stocks"],
  inputs: { prices: "number[] closes (oldest→newest)", period: "int (20)", k: "stddev multiple (2)" },
  outputs: "{ middle, upper, lower, latest: { percentB, bandwidth, signal } }",
  license: "MIT",
  source: "Original implementation of Bollinger Bands (John Bollinger, 1980s).",
};

function stddev(slice, mean) {
  const v = slice.reduce((a, x) => a + (x - mean) ** 2, 0) / slice.length; // population stddev
  return Math.sqrt(v);
}

export function run(input = {}) {
  const { prices = [], period = 20, k = 2 } = input;
  if (!Array.isArray(prices) || prices.length < period) {
    throw new Error(`need at least ${period} prices, got ${prices.length}`);
  }
  const round = (x) => Math.round(x * 10000) / 10000;
  const middle = [], upper = [], lower = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const sd = stddev(slice, mean);
    middle.push(round(mean));
    upper.push(round(mean + k * sd));
    lower.push(round(mean - k * sd));
  }

  const n = middle.length - 1;
  const price = prices[prices.length - 1];
  const bandRange = upper[n] - lower[n];
  const percentB = bandRange === 0 ? 0.5 : round((price - lower[n]) / bandRange);
  const bandwidth = middle[n] === 0 ? 0 : round((upper[n] - lower[n]) / middle[n]);
  const signal = price > upper[n] ? "above-upper" : price < lower[n] ? "below-lower" : "inside";

  return { middle, upper, lower, latest: { price, percentB, bandwidth, signal } };
}
