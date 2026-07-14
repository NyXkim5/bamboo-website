export const meta = {
  id: "finance/pivot-points",
  name: "Pivot Points (Classic)",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes classic floor-trader pivot points (pivot plus three resistance and three support levels) from the prior period's high, low, and close.",
  tags: ["finance", "trading", "technical-analysis", "pivot-points", "support-resistance"],
  license: "MIT",
  inputs: {
    high: "number — prior period high (finite, >= low)",
    low: "number — prior period low (finite)",
    close: "number — prior period close (finite)",
  },
  outputs:
    "{ pivot, r1, r2, r3, s1, s2, s3 } — classic pivot levels, each rounded to 4 decimal places",
  source:
    "Standard floor-trader (classic) pivot point formulas: P=(H+L+C)/3; R1=2P-L; S1=2P-H; R2=P+(H-L); S2=P-(H-L); R3=H+2(P-L); S3=L-2(H-P). Original implementation.",
};

function round4(x) {
  // At this magnitude the value has no fractional part representable in a
  // double, so 4dp rounding is a no-op; scaling by 1e4 could overflow to
  // Infinity, so return the value untouched instead.
  if (Math.abs(x) >= 2 ** 52) return x;
  const r = Math.round((x + Number.EPSILON) * 10000) / 10000;
  return r === 0 ? 0 : r; // normalize -0 to +0
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object { high, low, close }");
  }
  const { high, low, close } = input;
  for (const [key, value] of Object.entries({ high, low, close })) {
    // Object.hasOwn rejects values inherited via the prototype chain
    // (e.g. Object.create({...}) or a polluted Object.prototype).
    if (!Object.hasOwn(input, key) || typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`${key} must be a finite number (own property)`);
    }
  }
  if (high < low) {
    throw new Error("high must be greater than or equal to low");
  }

  const pivot = (high + low + close) / 3;
  const range = high - low;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + range;
  const s2 = pivot - range;
  const r3 = high + 2 * (pivot - low);
  const s3 = low - 2 * (high - pivot);

  // Finite inputs near the double limit can still overflow intermediate
  // sums/differences (e.g. high=1e308, low=-1e308). Fail loudly rather than
  // returning Infinity/NaN levels.
  const levels = { pivot, r1, r2, r3, s1, s2, s3 };
  for (const [key, value] of Object.entries(levels)) {
    if (!Number.isFinite(value)) {
      throw new Error(`${key} overflowed to a non-finite value; inputs are too large`);
    }
  }

  return {
    pivot: round4(pivot),
    r1: round4(r1),
    r2: round4(r2),
    r3: round4(r3),
    s1: round4(s1),
    s2: round4(s2),
    s3: round4(s3),
  };
}
