// TextRank extractive summarization skill.
//
// Splits a document into sentences, builds a weighted similarity graph
// between sentences (overlap of unique words, normalized by the log of
// sentence lengths), runs the PageRank iteration described by Mihalcea &
// Tarau, and returns the top-N highest-scoring sentences in their
// original document order.
//
// Pure, deterministic, zero dependencies.

export const meta = {
  id: "research/textrank-summary",
  name: "TextRank Summary",
  domain: "research",
  version: "0.1.0",
  description:
    "Extractive text summarization via TextRank: sentence similarity graph plus PageRank scoring, returning the top-N sentences in original document order.",
  tags: ["textrank", "summarization", "nlp", "pagerank", "extractive"],
  license: "MIT",
  inputs: {
    text: "string (required) — the document to summarize",
    sentences:
      "integer >= 1 (optional, default 3) — number of sentences to include in the summary",
  },
  outputs:
    "{ summary: string[] (top-N sentences in original document order), scores: number[] (TextRank score per sentence of the full document, in document order) }",
  source:
    "TextRank algorithm as described in Mihalcea & Tarau, 'TextRank: Bringing Order into Text', EMNLP 2004. Original implementation; no code copied.",
};

// Split text into sentences on ., ! and ? terminators; a trailing
// fragment without a terminator counts as a sentence too. Fragments
// consisting solely of whitespace/terminators (e.g. the bare "." pieces
// of a spaced ellipsis "Hmm . . .") are not sentences and are dropped.
function splitSentences(text) {
  const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return matches.map((s) => s.trim()).filter((s) => /[^\s.!?]/.test(s));
}

// Lowercase alphanumeric tokens, dropping words shorter than 3 chars.
function tokenize(sentence) {
  const words = sentence.toLowerCase().match(/[a-z0-9]+/g) || [];
  return words.filter((w) => w.length >= 3);
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object");
  }
  const { text } = input;
  if (typeof text !== "string") {
    throw new Error("text must be a string");
  }
  let count = 3;
  if (input.sentences !== undefined) {
    if (
      typeof input.sentences !== "number" ||
      !Number.isInteger(input.sentences) ||
      input.sentences < 1
    ) {
      throw new Error("sentences must be an integer >= 1");
    }
    count = input.sentences;
  }

  const sentences = splitSentences(text);
  const n = sentences.length;
  if (n === 0) {
    return { summary: [], scores: [] };
  }

  const tokens = sentences.map(tokenize);

  // Edge weight: |common unique words| / (ln(len_i + 1) + ln(len_j + 1)).
  const weights = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    const setI = new Set(tokens[i]);
    for (let j = i + 1; j < n; j++) {
      const setJ = new Set(tokens[j]);
      let common = 0;
      for (const w of setI) {
        if (setJ.has(w)) common++;
      }
      const denom =
        Math.log(tokens[i].length + 1) + Math.log(tokens[j].length + 1);
      const w = denom > 0 ? common / denom : 0;
      weights[i][j] = w;
      weights[j][i] = w;
    }
  }

  // Out-weight sums (graph is undirected, so this is each node's total).
  const outSum = weights.map((row) => row.reduce((a, b) => a + b, 0));

  // PageRank iteration: score_i = (1-d) + d * sum_j (w_ij / outSum_j) * score_j
  // Iterate to a fixed point (max-delta tolerance) with an iteration cap.
  const d = 0.85;
  const TOL = 1e-12;
  const MAX_ITER = 100;
  let scores = new Array(n).fill(1.0);
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const next = new Array(n);
    let delta = 0;
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (j === i || weights[i][j] === 0) continue;
        sum += (weights[i][j] / outSum[j]) * scores[j];
      }
      next[i] = 1 - d + d * sum;
      const diff = Math.abs(next[i] - scores[i]);
      if (diff > delta) delta = diff;
    }
    scores = next;
    if (delta < TOL) break;
  }

  // Pick top-N by score (earlier sentence wins ties), then restore
  // original document order.
  const indices = sentences.map((_, i) => i);
  indices.sort((a, b) => scores[b] - scores[a] || a - b);
  const selected = indices.slice(0, Math.min(count, n)).sort((a, b) => a - b);

  return {
    summary: selected.map((i) => sentences[i]),
    scores,
  };
}
