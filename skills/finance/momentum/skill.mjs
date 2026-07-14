export const meta = {
  id: "finance/momentum",
  name: "Momentum Indicator",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the momentum indicator over a price series: momentum[i] = price[i] - price[i-period]. Returns the momentum series, the latest value, and a simple up/down/flat signal.",
  tags: ["finance", "momentum", "technical-analysis", "indicator", "trading"],
  license: "MIT",
  inputs: {
    prices: {
      type: "number[]",
      required: true,
      description: "Price series in chronological order. Length must be greater than period.",
    },
    period: {
      type: "number",
      required: false,
      default: 10,
      description: "Lookback period (positive integer). Defaults to 10.",
    },
  },
  outputs:
    "{ momentum: number[] (length prices.length - period), latest: number, signal: 'up' | 'down' | 'flat' }",
  source:
    "Original implementation of the standard momentum indicator formula (price difference over a lookback period), a widely documented public-domain technical analysis concept.",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("input must be an object with a 'prices' array");
  }

  // Only honor own properties so prototype-inherited/polluted keys
  // (e.g. Object.prototype.period) cannot alter behavior.
  const prices = Object.hasOwn(input, "prices") ? input.prices : undefined;
  const period =
    Object.hasOwn(input, "period") && input.period !== undefined
      ? input.period
      : 10;

  if (!Array.isArray(prices)) {
    throw new TypeError("prices must be an array of numbers");
  }
  for (let i = 0; i < prices.length; i++) {
    if (typeof prices[i] !== "number" || !Number.isFinite(prices[i])) {
      throw new TypeError(`prices[${i}] must be a finite number`);
    }
  }
  if (!Number.isInteger(period) || period < 1) {
    throw new RangeError("period must be a positive integer");
  }
  if (prices.length <= period) {
    throw new RangeError(
      `prices length (${prices.length}) must be greater than period (${period})`
    );
  }

  const momentum = [];
  for (let i = period; i < prices.length; i++) {
    // "+ 0" normalizes IEEE-754 negative zero (-0) to +0 so the output
    // never contains -0 (which JSON and strict deep-equality treat oddly).
    momentum.push(prices[i] - prices[i - period] + 0);
  }

  const latest = momentum[momentum.length - 1];
  const signal = latest > 0 ? "up" : latest < 0 ? "down" : "flat";

  return { momentum, latest, signal };
}
