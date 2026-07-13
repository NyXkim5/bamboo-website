// Skill: finance/portfolio-metrics
// Risk/return metrics from a series of periodic returns. Pure + deterministic.

export const meta = {
  id: "finance/portfolio-metrics",
  name: "Portfolio Risk/Return Metrics",
  domain: "finance",
  version: "0.1.0",
  description:
    "From a series of periodic returns, compute annualized return, volatility, Sharpe ratio, and max drawdown.",
  tags: ["finance", "portfolio", "sharpe", "volatility", "drawdown", "quant"],
  inputs: { returns: "number[] periodic returns (e.g. 0.01 = +1%)", periodsPerYear: "int (default 252)", riskFree: "annual rate (default 0)" },
  outputs: "{ annualizedReturn, annualizedVol, sharpe, maxDrawdown }",
  license: "MIT",
  source: "Original implementation; standard portfolio-statistics formulas.",
};

function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stddev(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const variance = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

export function run(input = {}) {
  const { returns = [], periodsPerYear = 252, riskFree = 0 } = input;
  if (!Array.isArray(returns) || returns.length < 2) {
    throw new Error("need at least 2 returns");
  }
  const round = (x, n = 4) => Math.round(x * 10 ** n) / 10 ** n;

  // Geometric cumulative growth → annualized return.
  const growth = returns.reduce((acc, r) => acc * (1 + r), 1);
  const years = returns.length / periodsPerYear;
  const annualizedReturn = growth > 0 ? Math.pow(growth, 1 / years) - 1 : -1;

  const perPeriodVol = stddev(returns);
  const annualizedVol = perPeriodVol * Math.sqrt(periodsPerYear);

  const rfPerPeriod = riskFree / periodsPerYear;
  const excess = returns.map((r) => r - rfPerPeriod);
  const sharpe = perPeriodVol === 0 ? 0 : (mean(excess) / perPeriodVol) * Math.sqrt(periodsPerYear);

  // Max drawdown on the equity curve.
  let equity = 1, peak = 1, maxDD = 0;
  for (const r of returns) {
    equity *= 1 + r;
    if (equity > peak) peak = equity;
    maxDD = Math.min(maxDD, equity / peak - 1);
  }

  return {
    annualizedReturn: round(annualizedReturn),
    annualizedVol: round(annualizedVol),
    sharpe: round(sharpe, 3),
    maxDrawdown: round(maxDD),
    periods: returns.length,
  };
}
