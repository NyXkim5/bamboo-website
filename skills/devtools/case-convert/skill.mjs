// devtools/case-convert — Convert an identifier between naming cases.
// Splits the input into words on camelCase boundaries (including acronym
// runs like "HTTPServer" -> ["http", "server"]), underscores, hyphens, and
// spaces, then rejoins in the requested target case: camel, pascal, snake,
// kebab, or constant (SCREAMING_SNAKE).

export const meta = {
  id: "devtools/case-convert",
  name: "Case Convert",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Convert an identifier between camel, pascal, snake, kebab, and constant case by detecting word boundaries (camelCase transitions, underscores, hyphens, spaces).",
  tags: ["case", "identifier", "string", "camelCase", "snake_case", "kebab-case"],
  license: "MIT",
  inputs: {
    text: "string — the identifier to convert (any mix of cases/separators)",
    to: "string — target case: one of 'camel', 'pascal', 'snake', 'kebab', 'constant'",
  },
  outputs:
    "{ result: string, words: string[], to: string } — converted identifier, detected lowercase words, and the target case",
  source:
    "Standard identifier case-conversion conventions (camelCase/PascalCase/snake_case/kebab-case/CONSTANT_CASE) with regex word-boundary splitting; original implementation.",
};

const TARGETS = new Set(["camel", "pascal", "snake", "kebab", "constant"]);

function splitWords(text) {
  return text
    // acronym followed by a normal word: "HTTPServer" -> "HTTP Server"
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    // lower/digit to upper transition: "fooBar" -> "foo Bar", "v2Beta" -> "v2 Beta"
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[_\-\s]+/)
    .filter((w) => w.length > 0)
    .map((w) => w.toLowerCase());
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("input must be an object with { text, to }");
  }
  const { text, to } = input;
  if (typeof text !== "string") {
    throw new Error("text must be a string");
  }
  if (typeof to !== "string" || !TARGETS.has(to)) {
    throw new Error(
      `unknown target case: ${String(to)} (expected one of camel, pascal, snake, kebab, constant)`
    );
  }

  const words = splitWords(text);

  let result;
  switch (to) {
    case "camel":
      result = words
        .map((w, i) => (i === 0 ? w : capitalize(w)))
        .join("");
      break;
    case "pascal":
      result = words.map(capitalize).join("");
      break;
    case "snake":
      result = words.join("_");
      break;
    case "kebab":
      result = words.join("-");
      break;
    case "constant":
      result = words.map((w) => w.toUpperCase()).join("_");
      break;
  }

  return { result, words, to };
}
