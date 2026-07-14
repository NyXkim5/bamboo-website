export const meta = {
  id: "devtools/dotenv-parse",
  name: "Dotenv Parse",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Parse .env file text into an object of key/value pairs. Handles KEY=VALUE lines, blank lines, # comments, surrounding quotes, and 'export KEY=VALUE' syntax. Lines without '=' are skipped. Prototype-ish keys (e.g. __proto__) are assigned safely as own properties.",
  tags: ["dotenv", "env", "config", "parser", "devtools"],
  license: "MIT",
  inputs: {
    text: {
      type: "string",
      required: true,
      description: "Raw .env file contents to parse.",
    },
  },
  outputs:
    "{ env: object } — map of parsed environment variable names to string values.",
  source:
    "Original implementation for SkillForge, informed by the de-facto dotenv file format conventions (no code copied).",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("input must be an object like { text: string }");
  }
  const { text } = input;
  if (typeof text !== "string") {
    throw new TypeError("input.text must be a string");
  }

  const env = {};
  const lines = text.split(/\r\n|\r|\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Ignore blank lines and full-line comments.
    if (line === "" || line.startsWith("#")) continue;

    // Support "export KEY=VALUE".
    const body = line.replace(/^export\s+/, "");

    const eq = body.indexOf("=");
    if (eq === -1) continue; // skip lines without '='

    const key = body.slice(0, eq).trim();
    if (key === "") continue; // no key, nothing to assign

    let value = body.slice(eq + 1).trim();

    // Strip one pair of matching surrounding quotes (single or double).
    if (
      value.length >= 2 &&
      ((value[0] === '"' && value[value.length - 1] === '"') ||
        (value[0] === "'" && value[value.length - 1] === "'"))
    ) {
      value = value.slice(1, -1);
    }

    // Assign as an own, enumerable property even for keys like
    // "__proto__" or "constructor" — avoids prototype pollution.
    Object.defineProperty(env, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }

  return { env };
}
