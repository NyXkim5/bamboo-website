export const meta = {
  id: "finance/sortino",
  name: "Sortino Ratio",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the annualized Sortino ratio and downside deviation of a periodic returns series against a target (minimum acceptable) return.",
  tags: ["finance", "risk", "sortino", "downside-deviation", "performance"],
  license: "MIT",
  inputs: {
    returns: "number[] - periodic returns as decimals (e.g. 0.01 = 1%), length >= 2",
    target: "number (optional, default 0) - per-period target / minimum acceptable return",
    periodsPerYear: "number (optional, default 252) - periods per year used for annualization",
  },
  outputs:
    "{ sortino: number|null, downsideDeviation: number } - sortino is null when the series has no downside deviation",
  source:
    "Standard Sortino ratio formulation (Sortino & Price, 1994): excess mean return over target divided by downside deviation, annualized by sqrt(periodsPerYear). Implemented from the published formula; no code copied.",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object");
  }

  // Read own properties only, so inherited keys (e.g. a polluted
  // Object.prototype.target) can never change behavior. An own key
  // explicitly set to undefined falls back to the default, matching
  // destructuring semantics.
  const own = (key, fallback) =>
    Object.hasOwn(input, key) && input[key] !== undefined
      ? input[key]
      : fallback;

  const returns = own("returns", undefined);
  const target = own("target", 0);
  const periodsPerYear = own("periodsPerYear", 252);

  if (!Array.isArray(returns)) {
    throw new Error("returns must be an array of numbers");
  }
  if (returns.length < 2) {
    throw new Error("returns must contain at least 2 values");
  }
  // Snapshot values while validating so an exotic index getter cannot
  // return a valid number during validation and a different value
  // (e.g. NaN) during computation.
  const vals = new Array(returns.length);
  for (let i = 0; i < returns.length; i++) {
    const r = returns[i];
    if (typeof r !== "number" || !Number.isFinite(r)) {
      throw new Error(`returns[${i}] must be a finite number`);
    }
    vals[i] = r;
  }
  if (typeof target !== "number" || !Number.isFinite(target)) {
    throw new Error("target must be a finite number");
  }
  if (
    typeof periodsPerYear !== "number" ||
    !Number.isFinite(periodsPerYear) ||
    periodsPerYear <= 0
  ) {
    throw new Error("periodsPerYear must be a positive finite number");
  }

  const n = vals.length;

  let sum = 0;
  let downsideSumSq = 0;
  for (let i = 0; i < n; i++) {
    sum += vals[i];
    const shortfall = Math.min(0, vals[i] - target);
    downsideSumSq += shortfall * shortfall;
  }

  const mean = sum / n;
  const downsideDeviation = Math.sqrt(downsideSumSq / n);

  // All inputs are finite, but sums/squares of extreme magnitudes can
  // still overflow to Infinity; without this guard that would surface
  // as a plausible-looking but wrong finite sortino (e.g. 0).
  if (!Number.isFinite(mean) || !Number.isFinite(downsideDeviation)) {
    throw new Error(
      "returns are too large in magnitude: intermediate computation overflowed"
    );
  }

  if (downsideDeviation === 0) {
    return { sortino: null, downsideDeviation: 0 };
  }

  const sortino =
    ((mean - target) / downsideDeviation) * Math.sqrt(periodsPerYear);

  if (!Number.isFinite(sortino)) {
    throw new Error(
      "sortino overflowed: returns/target magnitudes are too extreme"
    );
  }

  // Normalize a -0 produced by underflow of the quotient to +0.
  return { sortino: sortino === 0 ? 0 : sortino, downsideDeviation };
}
