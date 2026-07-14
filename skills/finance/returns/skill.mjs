export const meta = {
  id: "finance/returns",
  name: "Periodic Returns",
  domain: "finance",
  version: "0.1.0",
  description:
    "Convert a price series to periodic returns, either simple (arithmetic) returns price[i]/price[i-1] - 1 or log (continuously compounded) returns ln(price[i]/price[i-1]).",
  tags: ["finance", "returns", "log-returns", "simple-returns", "time-series", "prices"],
  license: "MIT",
  inputs: {
    prices: "number[] - price series, length >= 2, all values > 0",
    mode: '"simple" | "log" (optional, default "simple") - return calculation mode',
  },
  outputs:
    '{ returns: number[], mode: "simple" | "log" } - returns has length prices.length - 1',
  source:
    "Standard financial return definitions: simple (arithmetic) and logarithmic (continuously compounded) returns, as described in standard quantitative finance texts (e.g. Tsay, Analysis of Financial Time Series). Original implementation.",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object");
  }

  const { prices, mode = "simple" } = input;

  if (!Array.isArray(prices)) {
    throw new Error("prices must be an array of numbers");
  }
  if (prices.length < 2) {
    throw new Error("prices must contain at least 2 values");
  }
  // Snapshot values while validating so exotic arrays (index getters that
  // change between reads, later mutation) cannot bypass validation — keeps
  // run() pure with respect to its observed input.
  const p = new Array(prices.length);
  for (let i = 0; i < prices.length; i++) {
    const v = prices[i];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`prices[${i}] must be a finite number`);
    }
    if (v <= 0) {
      // Rejects 0 and -0 as well as negatives.
      throw new Error(`prices[${i}] must be > 0`);
    }
    p[i] = v;
  }
  if (mode !== "simple" && mode !== "log") {
    throw new Error('mode must be "simple" or "log"');
  }

  const returns = new Array(p.length - 1);
  for (let i = 1; i < p.length; i++) {
    const ratio = p[i] / p[i - 1];
    if (mode === "log") {
      // p[i]/p[i-1] can overflow to Infinity or underflow to 0 for extreme
      // (but finite, positive) prices, even though the true log return is
      // representable. Fall back to ln(a) - ln(b) in that case.
      returns[i - 1] =
        ratio > 0 && Number.isFinite(ratio)
          ? Math.log(ratio)
          : Math.log(p[i]) - Math.log(p[i - 1]);
    } else {
      returns[i - 1] = ratio - 1;
    }
  }

  return { returns, mode };
}
