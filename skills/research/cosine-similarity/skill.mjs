export const meta = {
  id: "research/cosine-similarity",
  name: "Cosine Similarity",
  domain: "research",
  version: "0.1.0",
  description:
    "Computes cosine similarity between two texts using term-frequency bag-of-words vectors over the union vocabulary. Tokenization: lowercase alphanumeric runs of length >= 2.",
  tags: ["nlp", "similarity", "cosine", "bag-of-words", "text", "vector"],
  license: "MIT",
  inputs: {
    a: { type: "string", required: true, description: "First text" },
    b: { type: "string", required: true, description: "Second text" },
  },
  outputs:
    "{ similarity: number } — cosine similarity in [0, 1]; both empty = 1, exactly one empty = 0",
  source:
    "Standard cosine similarity measure (Salton & McGill, Introduction to Modern Information Retrieval, 1983) applied to term-frequency vectors; original implementation, no copied code.",
};

function tokenize(text) {
  const matches = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  return matches.filter((t) => t.length >= 2);
}

function termFreq(tokens) {
  const tf = Object.create(null);
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  return tf;
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object with string fields 'a' and 'b'");
  }
  const { a, b } = input;
  if (typeof a !== "string") throw new Error("input.a must be a string");
  if (typeof b !== "string") throw new Error("input.b must be a string");

  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

  if (tokensA.length === 0 && tokensB.length === 0) return { similarity: 1 };
  if (tokensA.length === 0 || tokensB.length === 0) return { similarity: 0 };

  const tfA = termFreq(tokensA);
  const tfB = termFreq(tokensB);

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const term of Object.keys(tfA)) {
    normA += tfA[term] * tfA[term];
    if (tfB[term]) dot += tfA[term] * tfB[term];
  }
  for (const term of Object.keys(tfB)) {
    normB += tfB[term] * tfB[term];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  const similarity = denom === 0 ? 0 : dot / denom;
  // Guard against non-finite results (e.g. norm overflow to Infinity on
  // pathologically large inputs yielding Infinity/Infinity = NaN), which
  // would otherwise slip through the min/max clamp.
  if (!Number.isFinite(similarity)) return { similarity: 0 };
  return { similarity: Math.min(1, Math.max(0, similarity)) };
}
