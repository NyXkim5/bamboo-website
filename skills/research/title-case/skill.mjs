/**
 * research/title-case — Smart title casing (AP-style-ish).
 * Plain Node ESM, zero dependencies.
 */

const DEFAULT_MINOR_WORDS = [
  "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor",
  "of", "on", "or", "per", "the", "to", "vs", "via",
];

export const meta = {
  id: "research/title-case",
  name: "Title Case",
  domain: "research",
  version: "0.1.0",
  description:
    "Converts text to smart AP-style-ish title case: capitalizes the first and last words and all major words, lowercases a configurable set of minor words when they appear mid-title, and preserves existing ALL-CAPS acronyms.",
  tags: ["text", "title-case", "capitalization", "formatting", "ap-style"],
  license: "MIT",
  inputs: {
    text: "string (required) — the text to convert to title case",
    minorWords:
      "string[] (optional) — override list of minor words kept lowercase when not first or last; defaults to a/an/and/as/at/but/by/for/in/nor/of/on/or/per/the/to/vs/via",
  },
  outputs: "{ result: string } — the title-cased text",
  source:
    "Original implementation of the widely documented AP/Chicago-style headline-capitalization convention (capitalize first/last and major words, lowercase short conjunctions/articles/prepositions); no code copied.",
};

function isAllCapsAcronym(core) {
  // Must contain at least two letters, all of them uppercase (digits, dots,
  // ampersands allowed inside), e.g. NASA, FBI, U.S.A., AT&T, HTML5.
  const letters = core.match(/[A-Za-z]/g);
  if (!letters || letters.length < 2) return false;
  return core === core.toUpperCase() && /^[A-Z0-9.&'-]+$/.test(core);
}

function capitalizeWord(core) {
  return core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object");
  }
  const { text, minorWords } = input;
  if (typeof text !== "string") {
    throw new Error("input.text must be a string");
  }
  let minorList = DEFAULT_MINOR_WORDS;
  if (minorWords !== undefined) {
    if (
      !Array.isArray(minorWords) ||
      minorWords.some((w) => typeof w !== "string")
    ) {
      throw new Error("input.minorWords must be an array of strings");
    }
    minorList = minorWords;
  }
  const minorSet = new Set(minorList.map((w) => w.toLowerCase()));

  // Split preserving whitespace so original spacing survives.
  const parts = text.split(/(\s+)/);
  const wordIndexes = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].length > 0 && !/^\s+$/.test(parts[i])) wordIndexes.push(i);
  }
  const firstIdx = wordIndexes[0];
  const lastIdx = wordIndexes[wordIndexes.length - 1];

  for (const i of wordIndexes) {
    const token = parts[i];
    // Separate leading/trailing punctuation from the word core.
    const m = token.match(/^([^A-Za-z0-9]*)([\s\S]*?)([^A-Za-z0-9]*)$/);
    const lead = m[1];
    const core = m[2];
    const trail = m[3];
    if (core.length === 0) continue; // pure punctuation token
    if (isAllCapsAcronym(core)) continue; // preserve acronyms as-is

    const isEdge = i === firstIdx || i === lastIdx;
    let newCore;
    if (!isEdge && minorSet.has(core.toLowerCase())) {
      newCore = core.toLowerCase();
    } else {
      newCore = capitalizeWord(core);
    }
    parts[i] = lead + newCore + trail;
  }

  return { result: parts.join("") };
}
