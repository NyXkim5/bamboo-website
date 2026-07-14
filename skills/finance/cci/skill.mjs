export const meta = {
  id: "finance/cci",
  name: "Commodity Channel Index (CCI)",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the Commodity Channel Index over OHLC bars: typical price = (high+low+close)/3; CCI = (typical - SMA(typical, period)) / (0.015 * mean absolute deviation of typical over period). Flat windows (zero mean deviation) yield 0.",
  tags: ["finance", "technical-analysis", "indicator", "cci", "momentum", "oscillator"],
  license: "MIT",
  inputs: {
    bars: "Array of bars: { high: number, low: number, close: number } (chronological order)",
    period: "Lookback period (positive integer, default 20)",
  },
  outputs:
    "{ cci: number[], latest: number|null } — one CCI value per completed window (length bars.length - period + 1, empty if fewer bars than period); latest is the last value or null",
  source:
    "Standard Commodity Channel Index formula as introduced by Donald Lambert (Commodities magazine, 1980); implemented from the published definition, no code copied.",
};

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

export function run(input) {
  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object like { bars, period? }");
  }

  const { bars } = input;
  if (!Array.isArray(bars)) {
    throw new Error("bars must be an array of { high, low, close } objects");
  }

  const period = input.period === undefined ? 20 : input.period;
  if (!isFiniteNumber(period) || !Number.isInteger(period) || period < 1) {
    throw new Error("period must be a positive integer");
  }

  const typical = new Array(bars.length);
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (bar == null || typeof bar !== "object") {
      throw new Error(`bars[${i}] must be an object with high, low, close`);
    }
    const { high, low, close } = bar;
    if (!isFiniteNumber(high) || !isFiniteNumber(low) || !isFiniteNumber(close)) {
      throw new Error(`bars[${i}] must have finite numeric high, low, close`);
    }
    if (low > high) {
      throw new Error(`bars[${i}] has low greater than high`);
    }
    typical[i] = (high + low + close) / 3;
  }

  const cci = [];
  for (let i = period - 1; i < typical.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += typical[j];
    const sma = sum / period;

    let devSum = 0;
    for (let j = i - period + 1; j <= i; j++) devSum += Math.abs(typical[j] - sma);
    const meanDev = devSum / period;

    // `+ 0` normalizes a -0 result (possible when typical[i] is -0 and sma is +0)
    // so output stays strict-equality- and JSON-round-trip-safe.
    cci.push(meanDev === 0 ? 0 : (typical[i] - sma) / (0.015 * meanDev) + 0);
  }

  return { cci, latest: cci.length > 0 ? cci[cci.length - 1] : null };
}
