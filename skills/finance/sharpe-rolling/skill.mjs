// Rolling annualized Sharpe ratio over a sliding window of a periodic returns series.
// For each window: sharpe = mean(excess) / sampleStddev(excess) * sqrt(periodsPerYear),
// where excess = r - riskFree / periodsPerYear and stddev uses the sample (n-1) form.
// Windows with zero dispersion yield null (Sharpe undefined there).

export const meta = {
  id: "finance/sharpe-rolling",
  name: "Rolling Annualized Sharpe Ratio",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the rolling annualized Sharpe ratio over a sliding window from a series of periodic returns. Each window's Sharpe is mean(excess)/sampleStddev(excess)*sqrt(periodsPerYear), with excess = return - riskFree/periodsPerYear. Windows with zero standard deviation produce null.",
  tags: ["finance", "sharpe", "risk", "rolling", "returns", "statistics"],
  license: "MIT",
  inputs: {
    returns: "number[] - periodic returns (e.g. daily), length >= window",
    window: "integer >= 2 - rolling window size (default 20)",
    periodsPerYear: "positive number - periods per year for annualization (default 252)",
    riskFree: "number - annual risk-free rate (default 0)",
  },
  outputs:
    "{ sharpe: (number|null)[], latest: number|null } - one entry per window (length = returns.length - window + 1); latest is the last entry",
  source:
    "Standard Sharpe ratio (W. F. Sharpe, 'Mutual Fund Performance', Journal of Business, 1966) with the conventional sqrt(periods-per-year) annualization; original implementation, no copied code.",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object");
  }
  const { returns, window = 20, periodsPerYear = 252, riskFree = 0 } = input;

  if (!Array.isArray(returns)) {
    throw new Error("returns must be an array of numbers");
  }
  for (let i = 0; i < returns.length; i++) {
    if (typeof returns[i] !== "number" || !Number.isFinite(returns[i])) {
      throw new Error(`returns[${i}] must be a finite number`);
    }
  }
  if (!Number.isInteger(window) || window < 2) {
    throw new Error("window must be an integer >= 2");
  }
  if (returns.length < window) {
    throw new Error("returns.length must be >= window");
  }
  if (typeof periodsPerYear !== "number" || !Number.isFinite(periodsPerYear) || periodsPerYear <= 0) {
    throw new Error("periodsPerYear must be a positive finite number");
  }
  if (typeof riskFree !== "number" || !Number.isFinite(riskFree)) {
    throw new Error("riskFree must be a finite number");
  }

  const rfPerPeriod = riskFree / periodsPerYear;
  const annualize = Math.sqrt(periodsPerYear);
  const sharpe = [];

  for (let end = window; end <= returns.length; end++) {
    const start = end - window;

    let sum = 0;
    for (let i = start; i < end; i++) sum += returns[i] - rfPerPeriod;
    const mean = sum / window;

    let ssq = 0;
    for (let i = start; i < end; i++) {
      const d = returns[i] - rfPerPeriod - mean;
      ssq += d * d;
    }
    const stddev = Math.sqrt(ssq / (window - 1));

    if (stddev === 0) {
      sharpe.push(null);
    } else {
      // Guard against intermediate overflow with extreme (but finite) inputs,
      // e.g. sums that overflow to Infinity yielding NaN; keep output JSON-safe.
      const s = (mean / stddev) * annualize;
      sharpe.push(Number.isFinite(s) ? s : null);
    }
  }

  return { sharpe, latest: sharpe[sharpe.length - 1] };
}
