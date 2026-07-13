// Skill: research/extractive-summary
// Frequency-based extractive summarization + keyword extraction. Pure +
// deterministic; no network, no deps, no ML model — a fast baseline the
// research pipeline can call before reaching for an LLM.

export const meta = {
  id: "research/extractive-summary",
  name: "Extractive Summary & Keywords",
  domain: "research",
  version: "0.1.0",
  description:
    "Rank a document's sentences by term-frequency salience and return the top-N as a summary, plus the most significant keywords. Deterministic baseline for news/research pipelines.",
  tags: ["research", "summarization", "nlp", "news", "keywords"],
  inputs: { text: "document string", sentences: "int, summary length (default 3)", keywords: "int (default 6)" },
  outputs: "{ summary: string[], keywords: [{ term, weight }] }",
  license: "MIT",
  source: "Original implementation of classic TF-based extractive summarization.",
};

const STOP = new Set(
  ("a an and are as at be but by for from has have he in is it its of on or that the to was were will with this these those i you we they " +
   "their our your his her not no do does did can could would should may might so if then than them us me my")
    .split(" ")
);

function sentences(text) {
  return text
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]*/g)
    ?.map((s) => s.trim())
    .filter((s) => s.length > 0) ?? [];
}

function words(s) {
  return (s.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter((w) => !STOP.has(w) && w.length > 2);
}

export function run(input = {}) {
  const { text = "", sentences: nSent = 3, keywords: nKw = 6 } = input;
  const sents = sentences(text);
  if (sents.length === 0) return { summary: [], keywords: [] };

  // Term frequencies across the whole document.
  const freq = new Map();
  for (const s of sents) for (const w of words(s)) freq.set(w, (freq.get(w) ?? 0) + 1);

  const maxF = Math.max(1, ...freq.values());

  // Score each sentence by summed normalized term frequency, length-normalized.
  const scored = sents.map((s, idx) => {
    const ws = words(s);
    const raw = ws.reduce((sum, w) => sum + (freq.get(w) ?? 0) / maxF, 0);
    return { idx, s, score: ws.length ? raw / Math.sqrt(ws.length) : 0 };
  });

  const top = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(nSent, sents.length))
    .sort((a, b) => a.idx - b.idx) // restore document order
    .map((x) => x.s);

  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, nKw)
    .map(([term, count]) => ({ term, weight: Math.round((count / maxF) * 100) / 100 }));

  return { summary: top, keywords, sentenceCount: sents.length };
}
