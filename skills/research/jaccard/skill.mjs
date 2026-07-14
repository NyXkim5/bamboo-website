export const meta = {
  id: "research/jaccard",
  name: "Jaccard Similarity",
  domain: "research",
  version: "0.1.0",
  description:
    "Computes the Jaccard similarity coefficient between two texts over token sets (lowercased alphanumeric tokens of length >= 2). Returns similarity = |intersection| / |union|, plus the intersection and union sizes. Two empty token sets yield similarity 1.",
  tags: ["jaccard", "similarity", "text", "set", "nlp", "tokens"],
  license: "MIT",
  inputs: {
    a: "string — first text",
    b: "string — second text",
  },
  outputs:
    "{ similarity: number, intersection: number, union: number }",
  source:
    "Jaccard index (Paul Jaccard, 1901): standard set-similarity measure |A ∩ B| / |A ∪ B|. Original implementation of the well-known formula; no code copied.",
};

function tokenize(text) {
  const matches = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  const set = new Set();
  for (const t of matches) {
    if (t.length >= 2) set.add(t);
  }
  return set;
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object with string fields 'a' and 'b'");
  }
  const { a, b } = input;
  if (typeof a !== "string") {
    throw new Error("input.a must be a string");
  }
  if (typeof b !== "string") {
    throw new Error("input.b must be a string");
  }

  const setA = tokenize(a);
  const setB = tokenize(b);

  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;

  const similarity = union === 0 ? 1 : intersection / union;

  return { similarity, intersection, union };
}
