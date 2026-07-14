// Skill: finance/position-size
// Risk-based position sizing: how many shares to buy so that a stop-loss caps
// the loss at a fixed fraction of the account. Pure + deterministic.

export const meta = {
  id: "finance/position-size",
  name: "Risk-Based Position Sizing",
  domain: "finance",
  version: "0.1.0",
  description:
    "Compute share quantity and capital allocation so a stop-loss risks only a fixed percent of the account, respecting an optional max-position cap.",
  tags: ["finance", "risk", "position-sizing", "trading", "quant", "stocks"],
  inputs: { account: "account equity", entry: "entry price", stop: "stop-loss price", riskPct: "percent of account to risk (default 1)", maxPositionPct: "cap on position size (default 100)" },
  outputs: "{ shares, riskPerShare, dollarRisk, positionValue, capped }",
  license: "MIT",
  source: "Original implementation; standard fixed-fractional position sizing.",
};

export function run(input = {}) {
  const { account = 0, entry = 0, stop = 0, riskPct = 1, maxPositionPct = 100 } = input;
  if (account <= 0) throw new Error("account must be > 0");
  if (entry <= 0) throw new Error("entry must be > 0");
  if (stop === entry) throw new Error("stop must differ from entry");

  const round2 = (x) => Math.round(x * 100) / 100;
  const riskPerShare = Math.abs(entry - stop);
  const dollarRisk = account * (riskPct / 100);

  let shares = Math.floor(dollarRisk / riskPerShare);

  // Respect the max-position cap (by capital deployed).
  const maxValue = account * (maxPositionPct / 100);
  const maxShares = Math.floor(maxValue / entry);
  let capped = false;
  if (shares > maxShares) {
    shares = maxShares;
    capped = true;
  }

  return {
    shares,
    riskPerShare: round2(riskPerShare),
    dollarRisk: round2(shares * riskPerShare),
    positionValue: round2(shares * entry),
    direction: stop < entry ? "long" : "short",
    capped,
  };
}
