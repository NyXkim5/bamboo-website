// research/stopwords — Strip English stopwords from text.
// Tokenizes input into lowercase Unicode alphanumeric tokens, removes tokens that
// appear in a built-in list of ~60 common English stopwords (optionally
// extended via `extra`), and reports how many tokens were kept vs removed.

const STOPWORDS = [
  "a", "about", "an", "and", "are", "as", "at", "be", "been", "but",
  "by", "can", "could", "did", "do", "does", "for", "from", "had", "has",
  "have", "he", "her", "his", "how", "i", "if", "in", "is", "it",
  "its", "me", "my", "no", "not", "of", "on", "or", "our", "she",
  "so", "than", "that", "the", "their", "them", "then", "there", "they", "this",
  "to", "was", "we", "were", "what", "when", "which", "who", "will", "with",
  "would", "you", "your",
];

export const meta = {
  id: "research/stopwords",
  name: "English Stopword Filter",
  domain: "research",
  version: "0.1.0",
  description:
    "Tokenizes text into lowercase alphanumeric tokens and removes common English stopwords, with optional user-supplied additional stopwords.",
  tags: ["nlp", "stopwords", "tokenization", "text-processing", "preprocessing"],
  license: "MIT",
  inputs: {
    text: "string — the text to filter",
    extra: "string[] (optional) — additional stopwords to remove (case-insensitive)",
  },
  outputs:
    "{ tokens: string[] (tokens kept after stopword removal, in order), removed: number, kept: number }",
  source:
    "Standard stopword-filtering preprocessing step from information retrieval (cf. Manning, Raghavan & Schütze, 'Introduction to Information Retrieval'); stopword list based on common English function words.",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object with a 'text' string property");
  }
  const { text, extra } = input;
  if (typeof text !== "string") {
    throw new Error("'text' must be a string");
  }
  if (extra !== undefined) {
    if (!Array.isArray(extra)) {
      throw new Error("'extra' must be an array of strings");
    }
    for (const word of extra) {
      if (typeof word !== "string") {
        throw new Error("'extra' must contain only strings");
      }
    }
  }

  const stopset = new Set(STOPWORDS);
  if (extra !== undefined) {
    for (const word of extra) {
      stopset.add(word.toLowerCase());
    }
  }

  // Unicode-aware: letters and digits in any script form tokens, so words
  // like "café" or "naïve" stay intact instead of being split at accents.
  const allTokens = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const tokens = allTokens.filter((token) => !stopset.has(token));
  const removed = allTokens.length - tokens.length;

  return { tokens, removed, kept: tokens.length };
}
