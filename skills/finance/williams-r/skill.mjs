// Williams %R (Williams Percent Range) — momentum oscillator developed by Larry Williams.
// %R = (HighestHigh_N - Close) / (HighestHigh_N - LowestLow_N) * -100, computed over a
// rolling window of `period` bars. Values range from -100 (close at the lowest low) to 0
// (close at the highest high). Readings above -20 are conventionally "overbought",
// readings below -80 are "oversold". When the window range is flat (HighestHigh ===
// LowestLow) the formula is 0/0; this implementation returns -50 (the neutral midpoint)
// for such windows to guard against divide-by-zero.

export const meta = {
  id: "finance/williams-r",
  name: "Williams %R",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the Williams %R momentum oscillator over OHLC bars with a rolling lookback period, returning the %R series, the latest value, and an overbought/oversold/neutral signal.",
  tags: ["finance", "technical-analysis", "indicator", "oscillator", "momentum", "williams-r"],
  license: "MIT",
  inputs: {
    bars:
      "Array of bar objects [{high, low, close}] in chronological order; finite numbers with low <= close <= high. Length must be >= period.",
    period:
      "Optional positive integer lookback window (default 14).",
  },
  outputs:
    "{ wr: number[] (%R per bar starting at index period-1, each in [-100, 0]), latest: number, signal: 'overbought' | 'oversold' | 'neutral' }",
  source:
    "Standard Williams %R formula as introduced by Larry Williams; reference definition per common technical-analysis literature (e.g. StockCharts / Wilder-era TA texts). Original implementation, no copied code.",
};

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object: { bars, period? }");
  }

  const { bars } = input;
  const period = input.period === undefined ? 14 : input.period;

  if (!Number.isInteger(period) || period < 1) {
    throw new Error("period must be a positive integer");
  }
  if (!Array.isArray(bars)) {
    throw new Error("bars must be an array of {high, low, close} objects");
  }
  if (bars.length < period) {
    throw new Error(`bars must contain at least ${period} bars (got ${bars.length})`);
  }

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    if (b === null || typeof b !== "object") {
      throw new Error(`bars[${i}] must be an object with high, low, close`);
    }
    if (!isFiniteNumber(b.high) || !isFiniteNumber(b.low) || !isFiniteNumber(b.close)) {
      throw new Error(`bars[${i}] must have finite numeric high, low, close`);
    }
    if (b.low > b.high) {
      throw new Error(`bars[${i}] has low > high`);
    }
    if (b.close < b.low || b.close > b.high) {
      // A valid OHLC bar's close must lie within its own [low, high] range;
      // otherwise %R can escape [-100, 0] and the signal becomes meaningless.
      throw new Error(`bars[${i}] has close outside [low, high]`);
    }
  }

  const wr = [];
  for (let i = period - 1; i < bars.length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (bars[j].high > highestHigh) highestHigh = bars[j].high;
      if (bars[j].low < lowestLow) lowestLow = bars[j].low;
    }
    const range = highestHigh - lowestLow;
    if (range === 0) {
      // Flat window: formula is 0/0; return the neutral midpoint.
      wr.push(-50);
    } else {
      wr.push(((highestHigh - bars[i].close) / range) * -100);
    }
  }

  const latest = wr[wr.length - 1];
  let signal = "neutral";
  if (latest > -20) signal = "overbought";
  else if (latest < -80) signal = "oversold";

  return { wr, latest, signal };
}
