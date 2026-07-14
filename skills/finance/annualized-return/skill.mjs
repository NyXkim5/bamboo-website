export const meta = {
  id: "finance/annualized-return",
  name: "Annualized Return",
  domain: "finance",
  version: "0.1.0",
  description:
    "Annualizes a total return over a number of periods using (1 + totalReturn)^(periodsPerYear / periods) - 1, rounded to 6 decimal places.",
  tags: ["finance", "return", "annualized", "cagr", "performance"],
  license: "MIT",
  inputs: {
    totalReturn: {
      type: "number",
      required: true,
      description:
        "Total return over the whole span as a decimal (e.g. 0.1 for +10%). Must satisfy 1 + totalReturn > 0.",
    },
    periods: {
      type: "number",
      required: true,
      description: "Number of periods the total return spans. Must be > 0.",
    },
    periodsPerYear: {
      type: "number",
      required: false,
      default: 252,
      description: "Periods per year (default 252 trading days). Must be > 0.",
    },
  },
  outputs:
    "{ annualized: number } — the annualized return as a decimal, rounded to 6 decimal places.",
  source:
    "Standard annualization formula: (1 + R)^(N/n) - 1. Original implementation.",
};

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new TypeError("input must be an object");
  }

  const { totalReturn, periods } = input;
  // Own-property check so an inherited/polluted prototype key can never
  // hijack the default.
  const periodsPerYear =
    Object.hasOwn(input, "periodsPerYear") &&
    input.periodsPerYear !== undefined
      ? input.periodsPerYear
      : 252;

  if (!isFiniteNumber(totalReturn)) {
    throw new TypeError("totalReturn must be a finite number");
  }
  if (!(1 + totalReturn > 0)) {
    throw new RangeError("1 + totalReturn must be > 0");
  }
  if (!isFiniteNumber(periods) || !(periods > 0)) {
    throw new RangeError("periods must be a finite number > 0");
  }
  if (!isFiniteNumber(periodsPerYear) || !(periodsPerYear > 0)) {
    throw new RangeError("periodsPerYear must be a finite number > 0");
  }

  const annualized =
    Math.pow(1 + totalReturn, periodsPerYear / periods) - 1;

  if (!Number.isFinite(annualized)) {
    throw new RangeError(
      "annualized return is not finite (inputs overflow the computation)"
    );
  }

  const rounded = Math.round(annualized * 1e6) / 1e6;
  // Normalize -0 (e.g. tiny negative returns that round to zero) to +0.
  return { annualized: rounded === 0 ? 0 : rounded };
}
