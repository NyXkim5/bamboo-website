export const meta = {
  id: "finance/mfi",
  name: "Money Flow Index (MFI)",
  domain: "finance",
  version: "0.1.1",
  description:
    "Computes the Money Flow Index, a volume-weighted momentum oscillator. Typical price = (high+low+close)/3; raw money flow = typical*volume; over the period, positive and negative flows are summed and MFI = 100 - 100/(1 + positiveFlow/negativeFlow). Edge rules: zero negative flow with some positive flow -> 100; zero flow in both directions (flat prices or zero volume) -> 50 (neutral). Returns the MFI series, latest value, and an overbought/oversold/neutral signal.",
  tags: ["finance", "technical-analysis", "indicator", "momentum", "volume", "oscillator"],
  license: "MIT",
  inputs: {
    bars:
      "Array of OHLCV bars: [{ high:number, low:number, close:number, volume:number }, ...]. Must contain at least period+1 bars.",
    period: "Lookback period (positive integer, default 14).",
  },
  outputs:
    "{ mfi: number[] (one value per bar starting at index `period`), latest: number, signal: 'overbought' | 'oversold' | 'neutral' }",
  source:
    "Standard Money Flow Index algorithm as introduced by Gene Quong and Avrum Soudack; implemented from the published formula (typical price money flow ratio), not from any copied code.",
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
    throw new Error("bars must be an array of { high, low, close, volume } objects");
  }
  if (bars.length < period + 1) {
    throw new Error(
      "bars must contain at least period+1 bars (" + (period + 1) + "), got " + bars.length
    );
  }

  const typical = new Array(bars.length);
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    if (
      b === null ||
      typeof b !== "object" ||
      !isFiniteNumber(b.high) ||
      !isFiniteNumber(b.low) ||
      !isFiniteNumber(b.close) ||
      !isFiniteNumber(b.volume)
    ) {
      throw new Error(
        "bars[" + i + "] must have finite numeric high, low, close, and volume"
      );
    }
    if (b.volume < 0) {
      throw new Error("bars[" + i + "].volume must be non-negative");
    }
    const t = (b.high + b.low + b.close) / 3;
    if (t < 0) {
      throw new Error(
        "bars[" + i + "] typical price (high+low+close)/3 must be non-negative for MFI"
      );
    }
    typical[i] = t;
  }

  // Signed raw money flow at each index >= 1 (compared to previous typical price).
  const posFlow = new Array(bars.length).fill(0);
  const negFlow = new Array(bars.length).fill(0);
  for (let i = 1; i < bars.length; i++) {
    const raw = typical[i] * bars[i].volume;
    if (!Number.isFinite(raw)) {
      throw new Error(
        "bars[" + i + "] raw money flow (typical*volume) overflows to a non-finite value"
      );
    }
    if (typical[i] > typical[i - 1]) posFlow[i] = raw;
    else if (typical[i] < typical[i - 1]) negFlow[i] = raw;
  }

  const mfi = [];
  for (let i = period; i < bars.length; i++) {
    let positive = 0;
    let negative = 0;
    for (let j = i - period + 1; j <= i; j++) {
      positive += posFlow[j];
      negative += negFlow[j];
    }
    if (!Number.isFinite(positive) || !Number.isFinite(negative)) {
      throw new Error(
        "money flow sum over the window ending at bar " + i + " overflows to a non-finite value"
      );
    }
    let value;
    if (positive === 0 && negative === 0) {
      // No money flow at all in the window (flat prices and/or zero volume):
      // the ratio is 0/0, so report the midpoint rather than a false extreme.
      value = 50;
    } else if (negative === 0) {
      value = 100;
    } else {
      value = 100 - 100 / (1 + positive / negative);
    }
    mfi.push(value);
  }

  const latest = mfi[mfi.length - 1];
  let signal = "neutral";
  if (latest > 80) signal = "overbought";
  else if (latest < 20) signal = "oversold";

  return { mfi, latest, signal };
}
