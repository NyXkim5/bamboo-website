// research/tf-idf — TF-IDF scoring across a small corpus.
// tf(t, d)  = count(t in d) / |d|            (|d| = token count of the doc)
// idf(t)    = ln(N / (1 + df(t))) + 1        (df = number of docs containing t)
// tfidf     = tf * idf
// Tokenization: /[a-z0-9]+/gi, lowercased, tokens shorter than 2 chars dropped.
// Given a `term`, returns per-doc tf-idf for that term; otherwise returns the
// top `topK` (default 5) terms per doc, sorted by tf-idf desc (ties: alphabetical).

export const meta = {
  id: "research/tf-idf",
  name: "TF-IDF",
  domain: "research",
  version: "0.1.0",
  description:
    "Compute TF-IDF scores across a corpus of documents: per-doc scores for a given term, or the top-scoring terms of each document.",
  tags: ["tf-idf", "text", "information-retrieval", "nlp", "ranking"],
  license: "MIT",
  inputs: {
    docs: "string[] — the corpus; one string per document (required, non-empty)",
    term: "string — optional term; if given, score this term in every doc",
    topK: "number — optional, top terms per doc when no term is given (default 5)",
  },
  outputs:
    "{ N, scores } — N is the corpus size; with a term, scores is [{ doc, tf, tfidf }]; without, scores is per-doc arrays of [{ term, tfidf }]",
  source:
    "Standard TF-IDF weighting (Sparck Jones, 1972; Salton & Buckley, 1988) with smoothed idf = ln(N/(1+df))+1; original implementation, no copied code.",
};

const TOKEN_RE = /[a-z0-9]+/gi;

function tokenize(text) {
  const matches = text.toLowerCase().match(TOKEN_RE) || [];
  return matches.filter((t) => t.length >= 2);
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object like { docs, term?, topK? }");
  }
  const { docs, term, topK } = input;

  if (!Array.isArray(docs) || docs.length === 0) {
    throw new Error("docs must be a non-empty array of strings");
  }
  // Index-based check: `some`/`map` skip holes in sparse arrays, which would
  // silently produce holey output; this catches holes (undefined) too.
  for (let i = 0; i < docs.length; i++) {
    if (typeof docs[i] !== "string") {
      throw new Error("every entry in docs must be a string");
    }
  }
  if (topK !== undefined && (!Number.isInteger(topK) || topK < 1)) {
    throw new Error("topK must be a positive integer");
  }

  const N = docs.length;
  const tokenized = docs.map(tokenize);

  // Document frequency: number of docs containing each term.
  const df = new Map();
  for (const tokens of tokenized) {
    for (const t of new Set(tokens)) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = (t) => Math.log(N / (1 + (df.get(t) || 0))) + 1;

  if (term !== undefined) {
    if (typeof term !== "string") throw new Error("term must be a string");
    const termTokens = tokenize(term);
    if (termTokens.length !== 1) {
      throw new Error("term must tokenize to exactly one word of length >= 2");
    }
    const t = termTokens[0];
    const termIdf = idf(t);
    const scores = tokenized.map((tokens, doc) => {
      const count = tokens.reduce((n, w) => n + (w === t ? 1 : 0), 0);
      const tf = tokens.length === 0 ? 0 : count / tokens.length;
      return { doc, tf, tfidf: tf * termIdf };
    });
    return { N, scores };
  }

  const k = topK === undefined ? 5 : topK;
  const scores = tokenized.map((tokens) => {
    const counts = new Map();
    for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
    const ranked = [...counts.entries()]
      .map(([t, count]) => ({ term: t, tfidf: (count / tokens.length) * idf(t) }))
      .sort((a, b) => b.tfidf - a.tfidf || (a.term < b.term ? -1 : 1));
    return ranked.slice(0, k);
  });
  return { N, scores };
}
