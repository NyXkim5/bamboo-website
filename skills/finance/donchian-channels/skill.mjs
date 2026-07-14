export const meta = {
  id: "finance/donchian-channels",
  name: "Donchian Channels",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes Donchian Channels over a rolling window: upper band = highest high, lower band = lowest low, middle band = (upper + lower) / 2.",
  tags: ["finance", "technical-analysis", "indicator", "donchian", "channels", "volatility"],
  license: "MIT",
  inputs: {
    bars: "Array of bar objects [{ high:number, low:number }], oldest first. Required.",
    period: "Rolling window length (positive integer). Default 20. bars.length must be >= period.",
  },
  outputs:
    "{ upper:number[], lower:number[], middle:number[], latest:{ upper:number, lower:number, middle:number } } — arrays have length bars.length - period + 1, one entry per completed window.",
  source:
    "Original implementation of Richard Donchian's channel indicator (public-domain formula).",
};

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("input must be an object: { bars, period? }");
  }

  const { bars, period = 20 } = input;

  if (!Array.isArray(bars)) {
    throw new TypeError("bars must be an array of { high, low } objects");
  }
  if (!Number.isInteger(period) || period < 1) {
    throw new RangeError("period must be a positive integer");
  }
  if (bars.length < period) {
    throw new RangeError(
      `bars.length (${bars.length}) must be >= period (${period})`
    );
  }

  const highs = new Array(bars.length);
  const lows = new Array(bars.length);
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (bar === null || typeof bar !== "object" || Array.isArray(bar)) {
      throw new TypeError(`bars[${i}] must be an object with high and low`);
    }
    // Read each property exactly once so impure getters cannot pass
    // validation and then leak a different (e.g. NaN) value into the output.
    const h = bar.high;
    const l = bar.low;
    if (!isFiniteNumber(h) || !isFiniteNumber(l)) {
      throw new TypeError(`bars[${i}].high and bars[${i}].low must be finite numbers`);
    }
    if (l > h) {
      throw new RangeError(`bars[${i}].low must be <= bars[${i}].high`);
    }
    // Normalize -0 to 0 so outputs stay JSON-round-trip stable.
    highs[i] = h === 0 ? 0 : h;
    lows[i] = l === 0 ? 0 : l;
  }

  const upper = [];
  const lower = [];
  const middle = [];

  for (let end = period - 1; end < bars.length; end++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = end - period + 1; j <= end; j++) {
      if (highs[j] > hi) hi = highs[j];
      if (lows[j] < lo) lo = lows[j];
    }
    // (hi + lo) / 2 can overflow to Infinity for large finite bounds;
    // fall back to the overflow-safe form. Normalize -0 to 0.
    let mid = (hi + lo) / 2;
    if (!Number.isFinite(mid)) mid = hi / 2 + lo / 2;
    if (mid === 0) mid = 0;
    upper.push(hi);
    lower.push(lo);
    middle.push(mid);
  }

  const last = upper.length - 1;
  return {
    upper,
    lower,
    middle,
    latest: {
      upper: upper[last],
      lower: lower[last],
      middle: middle[last],
    },
  };
}
