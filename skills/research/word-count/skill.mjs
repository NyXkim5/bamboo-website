export const meta = {
  id: "research/word-count",
  name: "Word Count & Text Statistics",
  domain: "research",
  version: "0.1.0",
  description:
    "Computes text statistics: character counts (with and without spaces), words, sentences, paragraphs, average word length, average words per sentence, and estimated reading time in minutes (ceil(words/200)).",
  tags: ["text", "statistics", "word-count", "reading-time", "research"],
  license: "MIT",
  inputs: {
    text: {
      type: "string",
      required: true,
      description: "The text to analyze. Empty text yields all-zero statistics.",
    },
  },
  outputs:
    "Object { characters, charactersNoSpaces, words, sentences, paragraphs, avgWordLength, avgWordsPerSentence, estimatedReadingTimeMin }",
  source:
    "Standard text-statistics conventions: whitespace-delimited word tokenization, terminal-punctuation sentence segmentation ([.!?] followed by whitespace or end-of-text, so decimals/URLs do not split sentences), blank-line paragraph segmentation, and the common 200-words-per-minute reading-speed heuristic. Original implementation.",
};

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function run(input) {
  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Input must be an object with a 'text' string property");
  }
  const { text } = input;
  if (typeof text !== "string") {
    throw new Error("'text' must be a string");
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;

  // Words: whitespace-delimited tokens.
  const wordTokens = text.split(/\s+/).filter((t) => t.length > 0);
  const words = wordTokens.length;

  // Sentences: segments ending in . ! or ? (runs collapse into one),
  // plus a trailing segment with content but no terminal punctuation.
  // The terminator must be followed by whitespace or end-of-text so that
  // decimals ("3.14"), versions ("v1.2"), and URLs do not split sentences.
  const sentences = text
    .split(/[.!?]+(?=\s|$)/)
    .filter((s) => s.trim().length > 0).length;

  // Paragraphs: blocks separated by one or more blank lines.
  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length;

  const totalWordChars = wordTokens.reduce((sum, w) => sum + w.length, 0);
  const avgWordLength = words > 0 ? round2(totalWordChars / words) : 0;
  const avgWordsPerSentence = sentences > 0 ? round2(words / sentences) : 0;
  const estimatedReadingTimeMin = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0;

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    avgWordLength,
    avgWordsPerSentence,
    estimatedReadingTimeMin,
  };
}
