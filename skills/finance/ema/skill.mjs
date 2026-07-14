// finance/ema — Exponential Moving Average (EMA).
// Seeds with the simple moving average (SMA) of the first `period` prices,
// then applies the standard recursive smoothing: ema = price * k + prevEma * (1 - k),
// where k = 2 / (period + 1). Pure, deterministic, dependency-free.

export const meta = {
  id: "finance/ema",
  name: "Exponential Moving Average",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the Exponential Moving Average of a price series. Uses smoothing factor k = 2/(period+1), seeded with the SMA of the first `period` prices.",
  tags: ["finance", "technical-analysis", "moving-average", "ema", "time-series"],
  license: "MIT",
  inputs: {
    prices: "number[] — price series (finite numbers), length must be >= period",
    period: "integer >= 1 — lookback period (default 12)",
  },
  outputs:
    "{ ema: number[], latest: number } — ema[0] is the SMA seed at index period-1; latest is the final EMA value",
  source:
    "Standard EMA formula as described in classical technical analysis literature (e.g. J. Welles Wilder / common TA references); original implementation, no copied code.",
};

export function run(input) {
  if (input == null || typeof input !== "object") {
    throw new Error("input must be an object with { prices, period? }");
  }

  const { prices, period = 12 } = input;

  if (!Array.isArray(prices)) {
    throw new Error("prices must be an array of numbers");
  }
  // Index-based loop (not .every) so sparse-array holes are seen as
  // `undefined` and rejected instead of being silently skipped.
  for (let i = 0; i < prices.length; i++) {
    const p = prices[i];
    if (typeof p !== "number" || !Number.isFinite(p)) {
      throw new Error("prices must contain only finite numbers (no holes)");
    }
  }
  if (!Number.isInteger(period) || period < 1) {
    throw new Error("period must be an integer >= 1");
  }
  if (prices.length < period) {
    throw new Error(
      `prices length (${prices.length}) must be >= period (${period})`
    );
  }

  const k = 2 / (period + 1);

  // Seed: SMA of the first `period` prices.
  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i];
  let prev = sum / period;

  const ema = [prev];
  for (let i = period; i < prices.length; i++) {
    prev = prices[i] * k + prev * (1 - k);
    ema.push(prev);
  }

  return { ema, latest: ema[ema.length - 1] };
}
