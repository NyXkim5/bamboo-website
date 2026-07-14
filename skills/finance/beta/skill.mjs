export const meta = {
  id: "finance/beta",
  name: "Asset Beta vs Market",
  domain: "finance",
  version: "0.1.1",
  description:
    "Computes the beta of an asset relative to the market as sample covariance(asset, market) divided by sample variance(market), plus the Pearson correlation, over aligned return arrays.",
  tags: ["finance", "beta", "capm", "covariance", "correlation", "risk"],
  license: "MIT",
  inputs: {
    asset: "number[] - asset return series (length >= 2, aligned with market)",
    market: "number[] - market return series (same length as asset)",
  },
  outputs:
    "{ beta: number, correlation: number } - beta = cov(asset,market)/var(market); correlation = cov/(std_asset*std_market), clamped to [-1, 1]; a constant asset series yields beta 0 and correlation 0 by convention",
  source:
    "Standard CAPM beta estimator (Sharpe, 1964) using sample covariance and variance (Bessel-corrected, n-1 denominator) and Pearson product-moment correlation. Implemented from the textbook formulas; no code copied.",
};

function assertNumberArray(value, name) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array of numbers`);
  }
  for (let i = 0; i < value.length; i++) {
    const v = value[i];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`${name}[${i}] must be a finite number`);
    }
  }
}

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("input must be an object with asset and market arrays");
  }
  const { asset, market } = input;
  assertNumberArray(asset, "asset");
  assertNumberArray(market, "market");
  if (asset.length !== market.length) {
    throw new Error("asset and market must have the same length");
  }
  const n = asset.length;
  if (n < 2) {
    throw new Error("asset and market must contain at least 2 observations");
  }

  let meanA = 0;
  let meanM = 0;
  for (let i = 0; i < n; i++) {
    meanA += asset[i];
    meanM += market[i];
  }
  meanA /= n;
  meanM /= n;

  let cov = 0;
  let varA = 0;
  let varM = 0;
  for (let i = 0; i < n; i++) {
    const da = asset[i] - meanA;
    const dm = market[i] - meanM;
    cov += da * dm;
    varA += da * da;
    varM += dm * dm;
  }
  cov /= n - 1;
  varA /= n - 1;
  varM /= n - 1;

  if (varM === 0) {
    throw new Error("market variance is zero; beta is undefined");
  }

  // `+ 0` normalizes a potential -0 (e.g. cov rounding to -0) to 0.
  const beta = cov / varM + 0;
  const stdA = Math.sqrt(varA);
  const stdM = Math.sqrt(varM);
  // Pearson correlation is undefined for a constant asset series (0/0);
  // return 0 by convention. Clamp to [-1, 1]: floating-point rounding can
  // otherwise produce values like 1.0000000000000002 for exactly
  // proportional series.
  const correlation =
    stdA === 0 ? 0 : Math.max(-1, Math.min(1, cov / (stdA * stdM))) + 0;

  return { beta, correlation };
}
