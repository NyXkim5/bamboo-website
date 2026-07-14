// Stochastic Oscillator (%K / %D) — momentum indicator by George C. Lane.
// %K = 100 * (close - lowestLow_N) / (highestHigh_N - lowestLow_N) over `period` bars.
// %D = simple moving average of %K over `dPeriod`.
// Flat windows (highestHigh === lowestLow) yield a neutral %K of 50.
// Pure, deterministic, zero dependencies.

export const meta = {
  id: "finance/stochastic-oscillator",
  name: "Stochastic Oscillator",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the Stochastic Oscillator: %K over `period` bars (default 14) and %D as the SMA of %K over `dPeriod` (default 3). Returns latest values, full series, and an overbought (>80) / oversold (<20) signal.",
  tags: ["finance", "technical-analysis", "stochastic", "momentum", "indicator"],
  license: "MIT",
  inputs: {
    bars: "array of {high, low, close} numbers with low <= close <= high, ordered oldest -> newest; length >= period",
    period: "lookback window for %K (positive integer, default 14)",
    dPeriod: "SMA window for %D (positive integer, default 3)",
  },
  outputs:
    "{ period, dPeriod, k, d, kSeries, dSeries, signal } where k/d are the latest %K/%D (d is null if fewer than dPeriod %K values exist) and signal is 'overbought' | 'oversold' | 'neutral' based on the latest %K",
  source:
    "Standard Stochastic Oscillator formula by George C. Lane (1950s), as documented in public references (e.g. Wikipedia: Stochastic oscillator). Original implementation; no code copied.",
};

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function round6(x) {
  return Math.round(x * 1e6) / 1e6;
}

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("input must be an object: { bars, period?, dPeriod? }");
  }
  const { bars, period = 14, dPeriod = 3 } = input;

  if (!Array.isArray(bars)) {
    throw new Error("bars must be an array of {high, low, close} objects");
  }
  if (!Number.isInteger(period) || period < 1) {
    throw new Error("period must be a positive integer");
  }
  if (!Number.isInteger(dPeriod) || dPeriod < 1) {
    throw new Error("dPeriod must be a positive integer");
  }
  if (bars.length < period) {
    throw new Error(`bars must contain at least ${period} bars (period), got ${bars.length}`);
  }

  bars.forEach((bar, i) => {
    if (bar === null || typeof bar !== "object") {
      throw new Error(`bars[${i}] must be an object with numeric high, low, close`);
    }
    const { high, low, close } = bar;
    if (!isFiniteNumber(high) || !isFiniteNumber(low) || !isFiniteNumber(close)) {
      throw new Error(`bars[${i}] must have finite numeric high, low, close`);
    }
    if (high < low) {
      throw new Error(`bars[${i}] is invalid: high (${high}) is less than low (${low})`);
    }
    if (close < low || close > high) {
      throw new Error(
        `bars[${i}] is invalid: close (${close}) is outside the [low, high] range [${low}, ${high}]`
      );
    }
  });

  // %K series: one value per bar once a full lookback window is available.
  const kSeries = [];
  for (let i = period - 1; i < bars.length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (bars[j].high > highestHigh) highestHigh = bars[j].high;
      if (bars[j].low < lowestLow) lowestLow = bars[j].low;
    }
    const range = highestHigh - lowestLow;
    const k = range === 0 ? 50 : (100 * (bars[i].close - lowestLow)) / range;
    kSeries.push(round6(k));
  }

  // %D series: SMA of %K over dPeriod.
  const dSeries = [];
  for (let i = dPeriod - 1; i < kSeries.length; i++) {
    let sum = 0;
    for (let j = i - dPeriod + 1; j <= i; j++) sum += kSeries[j];
    dSeries.push(round6(sum / dPeriod));
  }

  const k = kSeries[kSeries.length - 1];
  const d = dSeries.length > 0 ? dSeries[dSeries.length - 1] : null;
  const signal = k > 80 ? "overbought" : k < 20 ? "oversold" : "neutral";

  return { period, dPeriod, k, d, kSeries, dSeries, signal };
}
