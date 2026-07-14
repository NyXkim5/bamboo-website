// finance/vwap — Volume-Weighted Average Price.
// For each bar, typical price = (high + low + close) / 3. The cumulative VWAP at
// bar i is sum(typical * volume) / sum(volume) over bars 0..i. Returns the full
// VWAP series, the latest value, and whether the last close sits above, below,
// or equal to the latest VWAP.

export const meta = {
  id: "finance/vwap",
  name: "Volume-Weighted Average Price (VWAP)",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the cumulative VWAP series from OHLCV bars using the typical price (high+low+close)/3, plus the latest value and the last close's position relative to it.",
  tags: ["finance", "trading", "indicator", "vwap", "technical-analysis"],
  license: "MIT",
  inputs: {
    bars:
      "Array of bars, each {high:number, low:number, close:number, volume:number}. At least one bar; volume >= 0; high >= low.",
  },
  outputs:
    "{ vwap: number[], latest: number, lastClose: number, position: 'above'|'below'|'equal' }",
  source:
    "Standard VWAP definition (cumulative sum of typical price times volume over cumulative volume), as described in public technical-analysis references (e.g. Wikipedia: Volume-weighted average price). Original implementation, no copied code.",
};

function assertFiniteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number, got ${value}`);
  }
}

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("input must be an object with a 'bars' array");
  }
  const { bars } = input;
  if (!Array.isArray(bars) || bars.length === 0) {
    throw new Error("bars must be a non-empty array of {high, low, close, volume}");
  }

  const vwap = [];
  let cumTPV = 0; // cumulative typical-price * volume
  let cumVol = 0; // cumulative volume

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (bar === null || typeof bar !== "object") {
      throw new Error(`bars[${i}] must be an object with high, low, close, volume`);
    }
    assertFiniteNumber(bar.high, `bars[${i}].high`);
    assertFiniteNumber(bar.low, `bars[${i}].low`);
    assertFiniteNumber(bar.close, `bars[${i}].close`);
    assertFiniteNumber(bar.volume, `bars[${i}].volume`);
    if (bar.volume < 0) {
      throw new Error(`bars[${i}].volume must be >= 0, got ${bar.volume}`);
    }
    if (bar.high < bar.low) {
      throw new Error(`bars[${i}].high (${bar.high}) must be >= low (${bar.low})`);
    }

    const typical = (bar.high + bar.low + bar.close) / 3;
    cumTPV += typical * bar.volume;
    cumVol += bar.volume;
    if (cumVol === 0) {
      throw new Error(`cumulative volume is zero through bars[${i}]; VWAP is undefined`);
    }
    vwap.push(cumTPV / cumVol);
  }

  const latest = vwap[vwap.length - 1];
  const lastClose = bars[bars.length - 1].close;
  const position =
    lastClose > latest ? "above" : lastClose < latest ? "below" : "equal";

  return { vwap, latest, lastClose, position };
}
