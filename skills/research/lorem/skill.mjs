const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
  "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore",
  "et", "dolore", "magna", "aliqua",
];

const WORDS_PER_SENTENCE = 8;
const SENTENCES_PER_PARAGRAPH = 4;

export const meta = {
  id: "research/lorem",
  name: "Lorem Ipsum Generator",
  domain: "research",
  version: "0.1.0",
  description:
    "Deterministic lorem-ipsum placeholder text generator. Cycles a fixed latin word list (no randomness) to produce a requested number of words, sentences, or paragraphs.",
  tags: ["lorem", "placeholder", "text", "generator", "deterministic"],
  license: "MIT",
  inputs: {
    words: "optional positive integer (max 100000) — number of words (single sentence). Default 20 when no key given.",
    sentences: "optional positive integer (max 100000) — number of 8-word sentences.",
    paragraphs: "optional positive integer (max 100000) — number of paragraphs (4 sentences of 8 words each), joined by blank lines.",
  },
  outputs: "{ text: string } — generated lorem-ipsum text.",
  source:
    "Original implementation; word list is the traditional public-domain 'Lorem ipsum' opening derived from Cicero's De finibus bonorum et malorum.",
};

// Upper bound on any count to keep generation bounded (prevents hangs on
// huge-but-valid integers like 2**53).
const MAX_COUNT = 100000;

function isValidCount(n) {
  return typeof n === "number" && Number.isSafeInteger(n) && n > 0 && n <= MAX_COUNT;
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Build one sentence of `count` words starting at word index `start`.
// Returns [sentence, nextIndex].
function buildSentence(start, count) {
  const parts = [];
  let idx = start;
  for (let i = 0; i < count; i++) {
    parts.push(WORDS[idx % WORDS.length]);
    idx++;
  }
  parts[0] = capitalize(parts[0]);
  return [parts.join(" ") + ".", idx];
}

export function run(input) {
  if (input === undefined || input === null) input = {};
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object");
  }

  // Own properties only — inherited keys (prototype chains, polluted
  // Object.prototype) must not silently change the mode.
  const keys = ["words", "sentences", "paragraphs"].filter(
    (k) => Object.hasOwn(input, k) && input[k] !== undefined
  );
  if (keys.length > 1) {
    throw new Error(
      "provide only one of: words, sentences, paragraphs"
    );
  }

  const mode = keys[0] || "words";
  const count = keys.length === 0 ? 20 : input[mode];
  if (!isValidCount(count)) {
    throw new Error(
      `"${mode}" must be a positive integer <= ${MAX_COUNT}`
    );
  }

  if (mode === "words") {
    const [sentence] = buildSentence(0, count);
    return { text: sentence };
  }

  if (mode === "sentences") {
    const sentences = [];
    let idx = 0;
    for (let s = 0; s < count; s++) {
      const [sentence, next] = buildSentence(idx, WORDS_PER_SENTENCE);
      sentences.push(sentence);
      idx = next;
    }
    return { text: sentences.join(" ") };
  }

  // paragraphs
  const paragraphs = [];
  let idx = 0;
  for (let p = 0; p < count; p++) {
    const sentences = [];
    for (let s = 0; s < SENTENCES_PER_PARAGRAPH; s++) {
      const [sentence, next] = buildSentence(idx, WORDS_PER_SENTENCE);
      sentences.push(sentence);
      idx = next;
    }
    paragraphs.push(sentences.join(" "));
  }
  return { text: paragraphs.join("\n\n") };
}
