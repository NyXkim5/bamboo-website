// research/ngrams — word n-gram extraction with counts.
// Tokenizes text to lowercase alphanumeric words, slides a window of size n
// over the token stream, counts each n-gram, and returns the top results
// sorted by count (descending), with lexicographic tie-breaking for
// deterministic output.

export const meta = {
  id: "research/ngrams",
  name: "Word N-grams",
  domain: "research",
  version: "0.1.0",
  description:
    "Extract word n-grams from text and count their frequencies, returning the top n-grams sorted by count descending.",
  tags: ["ngrams", "text", "nlp", "frequency", "tokenize"],
  license: "MIT",
  inputs: {
    text: "string — the input text to analyze (required)",
    n: "integer >= 1 — n-gram size (default 2)",
    top: "integer >= 0 — max number of grams to return (default 10)",
  },
  outputs:
    "{ n, total, grams: [{ gram, count }] } — total is the number of n-gram occurrences; grams sorted by count desc, then gram asc",
  source:
    "Standard sliding-window word n-gram counting algorithm (classic NLP technique; see Jurafsky & Martin, 'Speech and Language Processing', ch. on n-gram language models). Original implementation, no copied code.",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object");
  }
  const { text, n = 2, top = 10 } = input;

  if (typeof text !== "string") {
    throw new Error("text must be a string");
  }
  if (!Number.isInteger(n) || n < 1) {
    throw new Error("n must be an integer >= 1");
  }
  if (!Number.isInteger(top) || top < 0) {
    throw new Error("top must be an integer >= 0");
  }

  // Tokenize: lowercase, keep runs of alphanumeric characters as words.
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) || [];

  // Slide a window of size n and count each gram.
  const counts = new Map();
  for (let i = 0; i + n <= tokens.length; i++) {
    const gram = tokens.slice(i, i + n).join(" ");
    counts.set(gram, (counts.get(gram) || 0) + 1);
  }

  const total = tokens.length >= n ? tokens.length - n + 1 : 0;

  // Sort by count desc, then gram asc for determinism; take top.
  const grams = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .slice(0, top)
    .map(([gram, count]) => ({ gram, count }));

  return { n, total, grams };
}
