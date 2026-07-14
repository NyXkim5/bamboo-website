export const meta = {
  id: "research/frequency",
  name: "Word Frequency Distribution",
  domain: "research",
  version: "0.1.0",
  description:
    "Computes a word frequency distribution over text: tokenizes into lowercase alphanumeric words, then returns total token count, unique word count, and the top-N most frequent words with counts and percentages.",
  tags: ["text", "frequency", "word-count", "nlp", "statistics", "tokenize"],
  license: "MIT",
  inputs: {
    text: { type: "string", required: true, description: "Input text to analyze." },
    top: {
      type: "number",
      required: false,
      default: 10,
      description: "Number of top entries to return (non-negative integer)."
    },
    minLength: {
      type: "number",
      required: false,
      default: 1,
      description: "Minimum token length to count (positive integer)."
    }
  },
  outputs:
    "{ total: number, unique: number, top: Array<{ word: string, count: number, pct: number }> } — top sorted by count descending (ties broken alphabetically), pct = count/total*100 rounded to 2 decimals.",
  source:
    "Standard bag-of-words frequency counting (term frequency), as described in classic information retrieval literature (e.g. Manning, Raghavan & Schutze, 'Introduction to Information Retrieval'). Original implementation; no code copied."
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object");
  }

  const { text } = input;
  if (typeof text !== "string") {
    throw new Error("text must be a string");
  }

  let top = input.top === undefined ? 10 : input.top;
  if (typeof top !== "number" || !Number.isInteger(top) || top < 0) {
    throw new Error("top must be a non-negative integer");
  }

  let minLength = input.minLength === undefined ? 1 : input.minLength;
  if (typeof minLength !== "number" || !Number.isInteger(minLength) || minLength < 1) {
    throw new Error("minLength must be a positive integer");
  }

  // Tokenize: lowercase alphanumeric runs.
  const tokens = (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (t) => t.length >= minLength
  );

  const counts = new Map();
  for (const t of tokens) {
    counts.set(t, (counts.get(t) || 0) + 1);
  }

  const total = tokens.length;
  const unique = counts.size;

  const sorted = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
  });

  const topList = sorted.slice(0, top).map(([word, count]) => ({
    word,
    count,
    pct: Math.round((count / total) * 100 * 100) / 100
  }));

  return { total, unique, top: topList };
}
