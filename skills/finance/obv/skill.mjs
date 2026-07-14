// finance/obv — On-Balance Volume (OBV) indicator.
// Computes the classic running cumulative volume series: starting at 0,
// each bar's volume is added when its close is above the previous close,
// subtracted when below, and left unchanged when equal. Returns the full
// OBV series, the latest value, and a simple trend classification
// (rising/falling/flat) comparing the last OBV value to the first.

export const meta = {
  id: "finance/obv",
  name: "On-Balance Volume",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the On-Balance Volume (OBV) series from price bars: cumulative volume added on up-closes, subtracted on down-closes, unchanged on equal closes.",
  tags: ["finance", "technical-analysis", "indicator", "volume", "obv"],
  license: "MIT",
  inputs: {
    bars: "Array<{close:number, volume:number}> — chronological price bars (oldest first); at least one bar",
  },
  outputs:
    "{ obv: number[], latest: number, trend: 'rising'|'falling'|'flat' }",
  source:
    "Original implementation of the standard On-Balance Volume algorithm introduced by Joseph Granville, 'Granville's New Key to Stock Market Profits' (1963). No code copied.",
};

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("input must be an object with a 'bars' array");
  }
  const { bars } = input;
  if (!Array.isArray(bars) || bars.length === 0) {
    throw new Error("bars must be a non-empty array of {close, volume} objects");
  }

  const obv = new Array(bars.length);
  let running = 0;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (bar === null || typeof bar !== "object") {
      throw new Error(`bars[${i}] must be an object with numeric close and volume`);
    }
    if (!isFiniteNumber(bar.close)) {
      throw new Error(`bars[${i}].close must be a finite number`);
    }
    if (!isFiniteNumber(bar.volume) || bar.volume < 0) {
      throw new Error(`bars[${i}].volume must be a finite non-negative number`);
    }

    if (i > 0) {
      const prevClose = bars[i - 1].close;
      if (bar.close > prevClose) running += bar.volume;
      else if (bar.close < prevClose) running -= bar.volume;
      // equal closes: OBV unchanged
    }
    obv[i] = running;
  }

  const first = obv[0];
  const latest = obv[obv.length - 1];
  const trend = latest > first ? "rising" : latest < first ? "falling" : "flat";

  return { obv, latest, trend };
}
