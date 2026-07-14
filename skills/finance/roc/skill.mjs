// finance/roc — Rate of Change (ROC) momentum oscillator.
// Computes the percentage change of a price series over a lookback period:
//   ROC[i] = (price[i] - price[i - period]) / price[i - period] * 100
// Returns the full ROC series, the latest value, and a simple momentum
// signal derived from the sign of the latest ROC.

export const meta = {
  id: "finance/roc",
  name: "Rate of Change (ROC)",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the Rate of Change momentum oscillator (percentage change over a lookback period) for a price series, with a rising/falling/flat signal from the latest value.",
  tags: ["finance", "momentum", "oscillator", "roc", "technical-analysis", "indicator"],
  license: "MIT",
  inputs: {
    prices: "number[] — price series in chronological order (length must be greater than period)",
    period: "integer >= 1 — lookback period (default 12)",
  },
  outputs:
    "{ roc: number[], latest: number, signal: 'rising'|'falling'|'flat' } — ROC%, the last ROC value, and a sign-based momentum signal",
  source:
    "Standard Rate of Change (ROC) momentum indicator as described in classical technical analysis literature (e.g. Murphy, 'Technical Analysis of the Financial Markets'); implemented from the mathematical definition, no copied code.",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object with { prices, period? }");
  }

  const { prices, period = 12 } = input;

  if (!Array.isArray(prices)) {
    throw new Error("prices must be an array of numbers");
  }
  if (!Number.isInteger(period) || period < 1) {
    throw new Error("period must be an integer >= 1");
  }
  if (prices.length <= period) {
    throw new Error(
      `prices length (${prices.length}) must be greater than period (${period})`
    );
  }
  for (let i = 0; i < prices.length; i++) {
    if (typeof prices[i] !== "number" || !Number.isFinite(prices[i])) {
      throw new Error(`prices[${i}] must be a finite number`);
    }
  }

  const roc = [];
  for (let i = period; i < prices.length; i++) {
    const base = prices[i - period];
    if (base === 0) {
      throw new Error(`prices[${i - period}] is 0; ROC is undefined (division by zero)`);
    }
    const value = ((prices[i] - base) / base) * 100;
    if (!Number.isFinite(value)) {
      throw new Error(
        `ROC at index ${i} is not finite (overflow); check the magnitude of the price series`
      );
    }
    // Normalize -0 (e.g. equal prices over a negative base) so output is
    // JSON-safe and strictly deterministic.
    roc.push(value === 0 ? 0 : value);
  }

  const latest = roc[roc.length - 1];
  const signal = latest > 0 ? "rising" : latest < 0 ? "falling" : "flat";

  return { roc, latest, signal };
}
