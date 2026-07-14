// Skill: research/keyword-density
// Term frequency / density report for a document — unigrams and bigrams, with
// an SEO over-optimization flag. Pure + deterministic; no network, no deps.

export const meta = {
  id: "research/keyword-density",
  name: "Keyword Density (SEO)",
  domain: "research",
  version: "0.1.0",
  description:
    "Report unigram and bigram keyword density for a document and flag terms above an over-optimization threshold (SEO keyword stuffing).",
  tags: ["research", "seo", "keywords", "nlp", "content"],
  inputs: { text: "document string", top: "int (default 10)", stuffingThreshold: "percent (default 4)" },
  outputs: "{ totalWords, unigrams, bigrams, stuffing: [{ term, density }] }",
  license: "MIT",
  source: "Original implementation of TF density with SEO stuffing heuristic.",
};

const STOP = new Set(
  "a an and are as at be but by for from has have in is it its of on or that the to was were will with this these those i you we they their our your".split(" ")
);

function tokens(text) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []);
}

function topGrams(list, top) {
  const freq = new Map();
  for (const g of list) freq.set(g, (freq.get(g) ?? 0) + 1);
  const total = list.length || 1;
  return [...freq.entries()]
    .map(([term, count]) => ({ term, count, density: Math.round((count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}

export function run(input = {}) {
  const { text = "", top = 10, stuffingThreshold = 4 } = input;
  const all = tokens(text);
  const contentWords = all.filter((w) => !STOP.has(w) && w.length > 2);

  const bigramList = [];
  for (let i = 0; i < contentWords.length - 1; i++) {
    bigramList.push(`${contentWords[i]} ${contentWords[i + 1]}`);
  }

  const unigrams = topGrams(contentWords, top);
  const bigrams = topGrams(bigramList, top);
  const stuffing = unigrams
    .filter((u) => u.density >= stuffingThreshold)
    .map((u) => ({ term: u.term, density: u.density }));

  return { totalWords: all.length, contentWords: contentWords.length, unigrams, bigrams, stuffing };
}
