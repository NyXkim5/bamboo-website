// devtools/slugify — turn arbitrary text into a URL-safe slug.
// Lowercases, transliterates common accented Latin characters to ASCII via a
// small map, collapses runs of non-alphanumerics into a single separator,
// and trims leading/trailing separators. Supports a custom separator and an
// optional maxLength (truncation never leaves a dangling separator).

export const meta = {
  id: "devtools/slugify",
  name: "Slugify",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Convert a string into a URL slug: lowercase, ASCII-fold common accented Latin characters, collapse non-alphanumeric runs into a separator, and trim.",
  tags: ["slug", "url", "string", "transliterate", "devtools"],
  license: "MIT",
  inputs: {
    text: "string (required) — the text to slugify",
    options: {
      separator: "string (optional, default '-') — joiner between words",
      maxLength: "integer (optional) — maximum slug length; truncation never ends on a separator",
    },
  },
  outputs: "{ slug: string }",
  source:
    "Original implementation of the standard slugification algorithm (lowercase + ASCII folding + non-alphanumeric collapsing), as popularized by Django's slugify and the npm 'slugify' package. No code copied.",
};

// Small transliteration map for common accented Latin characters.
const ACCENTS = {
  à: "a", á: "a", â: "a", ã: "a", ä: "a", å: "a", ā: "a", ă: "a", ą: "a",
  æ: "ae",
  ç: "c", ć: "c", č: "c",
  đ: "d", ď: "d",
  è: "e", é: "e", ê: "e", ë: "e", ē: "e", ė: "e", ę: "e", ě: "e",
  ì: "i", í: "i", î: "i", ï: "i", ī: "i", į: "i",
  ł: "l",
  ñ: "n", ń: "n", ň: "n",
  ò: "o", ó: "o", ô: "o", õ: "o", ö: "o", ø: "o", ō: "o", ő: "o",
  œ: "oe",
  ř: "r",
  ś: "s", š: "s", ş: "s", ß: "ss",
  ť: "t", ţ: "t",
  ù: "u", ú: "u", û: "u", ü: "u", ū: "u", ů: "u", ű: "u", ų: "u",
  ý: "y", ÿ: "y",
  ź: "z", ż: "z", ž: "z",
  þ: "th", ð: "d",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object like { text, options? }");
  }
  const { text, options = {} } = input;

  if (typeof text !== "string") {
    throw new Error("text must be a string");
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("options must be an object");
  }

  const { separator = "-", maxLength } = options;
  if (typeof separator !== "string") {
    throw new Error("options.separator must be a string");
  }
  if (maxLength !== undefined) {
    if (!Number.isInteger(maxLength) || maxLength < 1) {
      throw new Error("options.maxLength must be a positive integer");
    }
  }

  // 1. Lowercase, then fold accented characters to ASCII.
  let folded = "";
  for (const ch of text.toLowerCase()) {
    folded += ACCENTS[ch] ?? ch;
  }

  // 2. Split on runs of non-alphanumerics; drop empties (this both collapses
  //    runs and trims leading/trailing separators). Join with the separator.
  const words = folded.split(/[^a-z0-9]+/).filter(Boolean);
  let slug = words.join(separator);

  // 3. Enforce maxLength without ending on a dangling (possibly partial)
  //    separator. The trim is computed positionally from the word layout, so
  //    it works even when the separator itself contains alphanumeric
  //    characters (a regex strip of trailing non-alphanumerics would not).
  //    A cut that lands inside a word keeps the partial word.
  if (maxLength !== undefined && slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    if (separator.length > 0) {
      let keep = 0; // length of the longest prefix ending in word characters
      let pos = 0;
      for (let i = 0; i < words.length; i++) {
        const wordStart = i === 0 ? 0 : pos + separator.length;
        if (wordStart >= slug.length) break; // cut fell at/inside the separator
        const wordEnd = wordStart + words[i].length;
        keep = Math.min(wordEnd, slug.length); // whole word, or partial word
        pos = wordEnd;
        if (wordEnd >= slug.length) break;
      }
      slug = slug.slice(0, keep);
    }
  }

  return { slug };
}
