export const meta = {
  id: "finance/kelly",
  name: "Kelly Criterion",
  domain: "finance",
  version: "0.1.0",
  description:
    "Computes the Kelly criterion optimal bet fraction f* = p - (1-p)/b from win probability p and win/loss ratio b, clamped to 0 when negative, plus the half-Kelly fraction.",
  tags: ["kelly", "betting", "bankroll", "position-sizing", "risk", "finance"],
  license: "MIT",
  inputs: {
    winProb: "number — probability of winning, in [0, 1]",
    winLossRatio: "number — average win divided by average loss (b), must be > 0",
  },
  outputs:
    "{ kelly: number, halfKelly: number } — optimal bet fraction (clamped at 0) and half of it",
  source:
    "Kelly criterion, J. L. Kelly Jr., 'A New Interpretation of Information Rate' (1956); standard formula f* = p - (1-p)/b. Original implementation, no copied code.",
};

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("input must be an object with winProb and winLossRatio");
  }
  const { winProb, winLossRatio } = input;
  if (typeof winProb !== "number" || !Number.isFinite(winProb)) {
    throw new Error("winProb must be a finite number");
  }
  if (winProb < 0 || winProb > 1) {
    throw new Error("winProb must be between 0 and 1 inclusive");
  }
  if (typeof winLossRatio !== "number" || !Number.isFinite(winLossRatio)) {
    throw new Error("winLossRatio must be a finite number");
  }
  if (winLossRatio <= 0) {
    throw new Error("winLossRatio must be greater than 0");
  }

  const raw = winProb - (1 - winProb) / winLossRatio;
  const kelly = raw > 0 ? raw : 0;
  return { kelly, halfKelly: kelly / 2 };
}
