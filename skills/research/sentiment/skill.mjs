// Skill: research/sentiment
// Lexicon-based sentiment scoring with negation handling. Deterministic baseline
// for news/social text; no model, no network, no deps.

export const meta = {
  id: "research/sentiment",
  name: "Lexicon Sentiment Score",
  domain: "research",
  version: "0.1.0",
  description:
    "Score text sentiment from a compact polarity lexicon with negation flipping, returning a normalized score, label, and the matched terms.",
  tags: ["research", "sentiment", "nlp", "news", "social"],
  inputs: { text: "document string" },
  outputs: "{ score, label, positives: string[], negatives: string[], tokens }",
  license: "MIT",
  source: "Original implementation; compact hand-built polarity lexicon.",
};

const POS = new Set(
  "good great excellent amazing wonderful positive gain gains up rise rises rising boost strong growth profit win wins winning success happy love best improve improved beneficial bullish surge soar record".split(" ")
);
const NEG = new Set(
  "bad terrible awful poor negative loss losses down fall falls falling weak decline drop drops plunge crash fail fails failing crisis sad hate worst hurt harmful bearish slump risk fear concern".split(" ")
);
const NEGATORS = new Set("not no never n't without hardly barely".split(" "));

export function run(input = {}) {
  const { text = "" } = input;
  const tokens = (text.toLowerCase().match(/[a-z']+/g) ?? []);
  const positives = [], negatives = [];
  let score = 0;

  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i];
    const negated = i > 0 && NEGATORS.has(tokens[i - 1]);
    if (POS.has(w)) {
      if (negated) { score -= 1; negatives.push(`not ${w}`); }
      else { score += 1; positives.push(w); }
    } else if (NEG.has(w)) {
      if (negated) { score += 1; positives.push(`not ${w}`); }
      else { score -= 1; negatives.push(w); }
    }
  }

  const hits = positives.length + negatives.length;
  const normalized = hits === 0 ? 0 : Math.round((score / hits) * 1000) / 1000;
  const label = normalized > 0.1 ? "positive" : normalized < -0.1 ? "negative" : "neutral";

  return { score, normalized, label, positives, negatives, tokens: tokens.length };
}
