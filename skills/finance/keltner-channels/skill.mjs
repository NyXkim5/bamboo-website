export const meta = {
  id: "finance/keltner-channels",
  name: "Keltner Channels",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes Keltner Channels: middle line = EMA(close, period); band width = mult * ATR(period), where ATR uses Wilder-smoothed true range. Returns aligned middle/upper/lower arrays and the latest values.",
  tags: ["keltner", "channels", "ema", "atr", "volatility", "technical-analysis", "indicator"],
  license: "MIT",
  inputs: {
    bars: "Array of OHLC bars: [{ high:number, low:number, close:number }, ...]; length must be >= period + 1",
    period: "Lookback period for EMA and ATR (positive integer, default 20)",
    mult: "ATR multiplier for band width (finite number > 0, default 2)",
  },
  outputs:
    "{ middle:number[], upper:number[], lower:number[], atr:number[], latest:{ middle:number, upper:number, lower:number, atr:number } } — arrays aligned, element j corresponds to bars[period + j]",
  source:
    "Original implementation from the standard Keltner Channel definition (Chester Keltner, popularized by Linda Bradford Raschke): EMA midline with Wilder ATR bands.",
};

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object: { bars, period?, mult? }");
  }

  const { bars } = input;
  const period = input.period === undefined ? 20 : input.period;
  const mult = input.mult === undefined ? 2 : input.mult;

  if (!Number.isInteger(period) || period < 1) {
    throw new Error("period must be a positive integer");
  }
  if (!isFiniteNumber(mult) || mult <= 0) {
    throw new Error("mult must be a finite number > 0");
  }
  if (!Array.isArray(bars)) {
    throw new Error("bars must be an array of { high, low, close } objects");
  }
  if (bars.length < period + 1) {
    throw new Error(`bars length must be >= period + 1 (got ${bars.length}, need ${period + 1})`);
  }

  const n = bars.length;
  const highs = new Array(n);
  const lows = new Array(n);
  const closes = new Array(n);
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    if (b === null || typeof b !== "object") {
      throw new Error(`bars[${i}] must be an object with high, low, close`);
    }
    const { high, low, close } = b;
    if (!isFiniteNumber(high) || !isFiniteNumber(low) || !isFiniteNumber(close)) {
      throw new Error(`bars[${i}] must have finite numeric high, low, close`);
    }
    if (high < low) {
      throw new Error(`bars[${i}] has high < low`);
    }
    highs[i] = high;
    lows[i] = low;
    closes[i] = close;
  }

  // EMA(close, period): seeded with SMA of the first `period` closes,
  // defined for bar indices >= period - 1.
  const k = 2 / (period + 1);
  const emaByBar = new Array(n).fill(null);
  let seed = 0;
  for (let i = 0; i < period; i++) seed += closes[i];
  let ema = seed / period;
  emaByBar[period - 1] = ema;
  for (let i = period; i < n; i++) {
    ema = ema + (closes[i] - ema) * k;
    emaByBar[i] = ema;
  }

  // True range for bar i (i >= 1), then Wilder ATR:
  // first ATR = SMA of the first `period` true ranges (bars 1..period),
  // defined for bar indices >= period.
  const atrByBar = new Array(n).fill(null);
  let trSum = 0;
  for (let i = 1; i <= period; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trSum += tr;
  }
  let atr = trSum / period;
  atrByBar[period] = atr;
  for (let i = period + 1; i < n; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    atr = (atr * (period - 1) + tr) / period;
    atrByBar[i] = atr;
  }

  // Align output: both EMA and ATR are defined from bar index `period` onward.
  const middle = [];
  const upper = [];
  const lower = [];
  const atrOut = [];
  for (let i = period; i < n; i++) {
    const m = emaByBar[i];
    const a = atrByBar[i];
    if (!Number.isFinite(m) || !Number.isFinite(a)) {
      throw new Error(
        `numeric overflow computing EMA/ATR at bars[${i}]; input magnitudes too large`
      );
    }
    middle.push(m);
    atrOut.push(a);
    upper.push(m + mult * a);
    lower.push(m - mult * a);
  }

  const last = middle.length - 1;
  return {
    middle,
    upper,
    lower,
    atr: atrOut,
    latest: {
      middle: middle[last],
      upper: upper[last],
      lower: lower[last],
      atr: atrOut[last],
    },
  };
}
