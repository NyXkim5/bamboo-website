// Skill: research/dedupe
// Near-duplicate detection across a list of texts using Jaccard similarity over
// word shingles. Pure + deterministic; useful for de-duping news/search results.

export const meta = {
  id: "research/dedupe",
  name: "Near-Duplicate Detector",
  domain: "research",
  version: "0.1.0",
  description:
    "Cluster a list of texts by Jaccard similarity over word shingles, returning duplicate groups and a de-duplicated set of representatives.",
  tags: ["research", "dedupe", "nlp", "similarity", "news"],
  inputs: { texts: "string[]", threshold: "0..1 similarity (default 0.5)", shingle: "int word n-gram size (default 2)" },
  outputs: "{ groups: number[][], unique: number[], duplicates }",
  license: "MIT",
  source: "Original implementation of shingled Jaccard near-duplicate clustering.",
};

function shingles(text, n) {
  const words = (text.toLowerCase().match(/[a-z0-9']+/g) ?? []);
  if (words.length < n) return new Set(words);
  const out = new Set();
  for (let i = 0; i <= words.length - n; i++) out.add(words.slice(i, i + n).join(" "));
  return out;
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function run(input = {}) {
  const { texts = [], threshold = 0.5, shingle = 2 } = input;
  if (!Array.isArray(texts)) throw new Error("texts must be an array");
  const sets = texts.map((t) => shingles(String(t), shingle));

  const assigned = new Array(texts.length).fill(-1);
  const groups = [];
  for (let i = 0; i < texts.length; i++) {
    if (assigned[i] !== -1) continue;
    const group = [i];
    assigned[i] = groups.length;
    for (let j = i + 1; j < texts.length; j++) {
      if (assigned[j] === -1 && jaccard(sets[i], sets[j]) >= threshold) {
        assigned[j] = groups.length;
        group.push(j);
      }
    }
    groups.push(group);
  }

  const unique = groups.map((g) => g[0]); // first index of each group = representative
  return {
    groups,
    unique,
    duplicates: texts.length - groups.length,
    total: texts.length,
  };
}
