// Skill: research/readability
// Flesch Reading Ease + Flesch–Kincaid grade level for a block of text.
// Pure + deterministic; heuristic syllable counting (no dictionary).

export const meta = {
  id: "research/readability",
  name: "Readability (Flesch / Flesch–Kincaid)",
  domain: "research",
  version: "0.1.0",
  description:
    "Score text readability with Flesch Reading Ease and Flesch–Kincaid grade level, plus word/sentence/syllable counts.",
  tags: ["research", "readability", "nlp", "flesch", "writing"],
  inputs: { text: "document string" },
  outputs: "{ readingEase, gradeLevel, words, sentences, syllables, interpretation }",
  license: "MIT",
  source: "Original implementation of Flesch (1948) and Kincaid et al. (1975) formulas.",
};

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length === 0) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = word.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function run(input = {}) {
  const { text = "" } = input;
  const sentences = (text.match(/[^.!?]+[.!?]+|\S+$/g) ?? []).filter((s) => s.trim().length > 0);
  const wordTokens = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];

  const nWords = wordTokens.length;
  const nSentences = Math.max(1, sentences.length);
  if (nWords === 0) {
    return { readingEase: 0, gradeLevel: 0, words: 0, sentences: 0, syllables: 0, interpretation: "empty" };
  }
  const nSyll = wordTokens.reduce((s, w) => s + countSyllables(w), 0);

  const wpsentence = nWords / nSentences;
  const spword = nSyll / nWords;

  const readingEase = Math.round((206.835 - 1.015 * wpsentence - 84.6 * spword) * 10) / 10;
  const gradeLevel = Math.round((0.39 * wpsentence + 11.8 * spword - 15.59) * 10) / 10;

  const interpretation =
    readingEase >= 80 ? "very easy" :
    readingEase >= 60 ? "plain English" :
    readingEase >= 30 ? "difficult" : "very difficult";

  return { readingEase, gradeLevel, words: nWords, sentences: nSentences, syllables: nSyll, interpretation };
}
