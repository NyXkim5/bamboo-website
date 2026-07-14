// research/tokenize — simple deterministic text tokenizer.
// Extracts words via /[a-z0-9']+/gi (lowercased), splits sentences on
// runs of [.!?], and reports word/sentence/unique-word counts.

export const meta = {
  id: "research/tokenize",
  name: "Tokenize",
  domain: "research",
  version: "0.1.0",
  description:
    "Tokenize text into words and sentences: returns words (lowercased, " +
    "matched by /[a-z0-9']+/gi and required to contain at least one " +
    "letter or digit), sentences (split on [.!?]+, trimmed, non-empty), " +
    "wordCount, sentenceCount, and uniqueWords.",
  tags: ["nlp", "tokenizer", "text", "words", "sentences"],
  license: "MIT",
  inputs: {
    text: "string — the text to tokenize",
  },
  outputs:
    "{ words: string[], sentences: string[], wordCount: number, " +
    "sentenceCount: number, uniqueWords: number }",
  source:
    "Standard regex-based word/sentence tokenization (word pattern " +
    "/[a-z0-9']+/gi, sentence boundary [.!?]+), a common-knowledge NLP " +
    "preprocessing technique. Original implementation; no copied code.",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object like { text: string }");
  }
  const { text } = input;
  if (typeof text !== "string") {
    throw new Error("input.text must be a string");
  }

  // Words: contiguous runs of letters, digits, or apostrophes, lowercased.
  // A token must contain at least one letter or digit, so runs of bare
  // apostrophes ("''") are not counted as words.
  const words = (text.match(/[a-z0-9']+/gi) ?? [])
    .filter((w) => /[a-z0-9]/i.test(w))
    .map((w) => w.toLowerCase());

  // Sentences: split on runs of terminal punctuation, keep trimmed non-empty.
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return {
    words,
    sentences,
    wordCount: words.length,
    sentenceCount: sentences.length,
    uniqueWords: new Set(words).size,
  };
}
