export const meta = {
  id: "finance/max-drawdown",
  name: "Max Drawdown",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the maximum drawdown of an equity/price series using a running-peak scan. Returns the worst (most negative) drawdown, the peak and trough indices/values, and the recovery index (first index after the trough where the series regains the peak), or null if never recovered.",
  tags: ["finance", "risk", "drawdown", "equity-curve", "time-series"],
  license: "MIT",
  inputs: {
    series:
      "number[] — equity or price values in chronological order; must be non-empty, finite, and strictly positive",
  },
  outputs:
    "{ maxDrawdown: number (<= 0, e.g. -0.25 for -25%), peakIndex: number, peakValue: number, troughIndex: number, troughValue: number, recoveryIndex: number|null, recovered: boolean }",
  source:
    "Standard running-peak maximum drawdown algorithm as commonly defined in quantitative finance literature (e.g. Magdon-Ismail & Atiya, 'Maximum Drawdown', Risk Magazine 2004). Original implementation; no code copied.",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object: { series: number[] }");
  }
  if (!Object.hasOwn(input, "series")) {
    // Reject prototype-injected keys: `series` must be the caller's own property.
    throw new Error("input must have an own 'series' property");
  }
  const { series } = input;
  if (!Array.isArray(series)) {
    throw new Error("series must be an array of numbers");
  }
  if (series.length === 0) {
    throw new Error("series must be non-empty");
  }
  for (let i = 0; i < series.length; i++) {
    const v = series[i];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`series[${i}] must be a finite number`);
    }
    if (v <= 0) {
      throw new Error(`series[${i}] must be strictly positive`);
    }
  }

  // Running-peak scan.
  let peakIndex = 0;
  let peakValue = series[0];

  let maxDrawdown = 0;
  let bestPeakIndex = 0;
  let bestPeakValue = series[0];
  let troughIndex = 0;
  let troughValue = series[0];

  for (let i = 1; i < series.length; i++) {
    const v = series[i];
    if (v > peakValue) {
      peakValue = v;
      peakIndex = i;
      continue;
    }
    const drawdown = v / peakValue - 1;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      bestPeakIndex = peakIndex;
      bestPeakValue = peakValue;
      troughIndex = i;
      troughValue = v;
    }
  }

  let recoveryIndex = null;
  let recovered;
  if (maxDrawdown === 0) {
    // No drawdown ever occurred; the series never fell below its running peak.
    recovered = true;
  } else {
    for (let i = troughIndex + 1; i < series.length; i++) {
      if (series[i] >= bestPeakValue) {
        recoveryIndex = i;
        break;
      }
    }
    recovered = recoveryIndex !== null;
  }

  return {
    maxDrawdown,
    peakIndex: bestPeakIndex,
    peakValue: bestPeakValue,
    troughIndex,
    troughValue,
    recoveryIndex,
    recovered,
  };
}
