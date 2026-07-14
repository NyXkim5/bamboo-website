// finance/cagr — Compound Annual Growth Rate.
// Computes CAGR = (end/begin)^(1/years) - 1 and totalReturn = end/begin - 1,
// both rounded to 4 decimal places. Pure, deterministic, zero dependencies.

export const meta = {
  id: "finance/cagr",
  name: "Compound Annual Growth Rate",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the Compound Annual Growth Rate (CAGR) and total return of an investment given its beginning value, ending value, and holding period in years. Results are rounded to 4 decimal places.",
  tags: ["finance", "cagr", "growth-rate", "return", "investment"],
  license: "MIT",
  inputs: {
    begin: "number — beginning value of the investment (must be > 0)",
    end: "number — ending value of the investment (must be >= 0)",
    years: "number — holding period in years (must be > 0)",
  },
  outputs:
    "{ cagr: number, totalReturn: number } — both as decimal fractions rounded to 4dp (e.g. 0.0718 = 7.18%)",
  source:
    "Standard CAGR formula: (end/begin)^(1/years) - 1. Textbook finance definition (public domain mathematics); no code copied.",
};

function round4(x) {
  const r = Math.round((x + Number.EPSILON) * 1e4) / 1e4;
  // Normalize -0 to 0 (tiny negative values round to -0 otherwise).
  return r === 0 ? 0 : r;
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object with { begin, end, years }");
  }
  const { begin, end, years } = input;

  if (typeof begin !== "number" || !Number.isFinite(begin)) {
    throw new Error("begin must be a finite number");
  }
  if (typeof end !== "number" || !Number.isFinite(end)) {
    throw new Error("end must be a finite number");
  }
  if (typeof years !== "number" || !Number.isFinite(years)) {
    throw new Error("years must be a finite number");
  }
  if (begin <= 0) {
    throw new Error("begin must be > 0");
  }
  if (years <= 0) {
    throw new Error("years must be > 0");
  }
  if (end < 0) {
    throw new Error("end must be >= 0");
  }

  const ratio = end / begin;
  const cagr = Math.pow(ratio, 1 / years) - 1;
  const totalReturn = ratio - 1;

  return {
    cagr: round4(cagr),
    totalReturn: round4(totalReturn),
  };
}
