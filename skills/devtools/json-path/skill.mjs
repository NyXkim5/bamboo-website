export const meta = {
  id: "devtools/json-path",
  name: "JSON Path Getter",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Get the value at a dot/bracket path (e.g. \"a.b[0].c\") in a nested object/array. Returns { value, found } and never throws on missing paths; throws only on malformed or non-string paths. Prototype-polluting keys (__proto__, constructor, prototype) are treated as not found.",
  tags: ["json", "path", "object", "lookup", "devtools"],
  license: "MIT",
  inputs: {
    object: "The root value (object/array/any) to look into.",
    path: "String path using dot and bracket notation, e.g. \"a.b[0].c\", \"[1].x\", \"a['weird key']\". Empty string refers to the root.",
  },
  outputs:
    "{ value: any|null, found: boolean } — value is null when found is false.",
  source:
    "Original implementation of the standard dot/bracket property-path lookup convention popularized by lodash.get / JSONPath child-access syntax; no code copied.",
};

const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function malformed(path, index, reason) {
  return new Error(
    `Malformed path ${JSON.stringify(path)} at position ${index}: ${reason}`
  );
}

// Tokenize a path like `a.b[0].c` or `a['k.x'][2]` into an array of
// string keys / integer indices. Throws on malformed input.
function tokenize(path) {
  const tokens = [];
  const len = path.length;
  let i = 0;
  let expectKey = true; // at start (or right after a dot) a bare key or bracket may follow

  while (i < len) {
    const ch = path[i];

    if (ch === ".") {
      throw malformed(path, i, "unexpected '.'");
    }

    if (ch === "[") {
      i += 1;
      if (i >= len) throw malformed(path, i, "unterminated '['");
      const quote = path[i];
      if (quote === "'" || quote === '"') {
        // Quoted string key: ['key'] or ["key"]
        i += 1;
        let key = "";
        let closed = false;
        while (i < len) {
          const c = path[i];
          if (c === "\\" && i + 1 < len) {
            key += path[i + 1];
            i += 2;
            continue;
          }
          if (c === quote) {
            closed = true;
            i += 1;
            break;
          }
          key += c;
          i += 1;
        }
        if (!closed) throw malformed(path, i, "unterminated string in brackets");
        if (i >= len || path[i] !== "]") {
          throw malformed(path, i, "expected ']' after quoted key");
        }
        i += 1;
        tokens.push(key);
      } else {
        // Numeric index: [123]
        let digits = "";
        while (i < len && path[i] >= "0" && path[i] <= "9") {
          digits += path[i];
          i += 1;
        }
        if (digits.length === 0) {
          throw malformed(path, i, "expected a digit or quoted key inside brackets");
        }
        if (i >= len || path[i] !== "]") {
          throw malformed(path, i, "expected ']' after index");
        }
        i += 1;
        tokens.push(Number(digits));
      }
    } else {
      if (!expectKey) {
        // A bare key may only start at the beginning or right after a dot.
        throw malformed(path, i, "expected '.' or '[' before key");
      }
      let key = "";
      while (i < len && path[i] !== "." && path[i] !== "[") {
        key += path[i];
        i += 1;
      }
      if (key.length === 0) throw malformed(path, i, "empty key segment");
      tokens.push(key);
    }

    expectKey = false;

    // After a token: either end, a dot (which must be followed by a key), or a bracket.
    if (i < len && path[i] === ".") {
      i += 1;
      if (i >= len) throw malformed(path, i, "trailing '.'");
      if (path[i] === "." ) throw malformed(path, i, "empty key segment");
      if (path[i] === "[") throw malformed(path, i, "'.' before '[' is not allowed");
      expectKey = true;
    }
  }

  if (expectKey && len > 0) {
    // e.g. path ended right after a dot (already caught) — defensive.
    throw malformed(path, len, "dangling path segment");
  }

  return tokens;
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Input must be an object of shape { object, path }.");
  }
  const { object, path } = input;
  if (typeof path !== "string") {
    throw new Error("Input 'path' must be a string.");
  }

  const tokens = tokenize(path); // throws on malformed path

  let current = object;
  for (const token of tokens) {
    if (current === null || current === undefined) {
      return { value: null, found: false };
    }
    if (typeof token === "number") {
      if (!Array.isArray(current)) {
        return { value: null, found: false };
      }
      // Own-property check covers out-of-bounds indices AND sparse-array
      // holes, keeping numeric lookups consistent with string-key lookups.
      if (!Object.prototype.hasOwnProperty.call(current, token)) {
        return { value: null, found: false };
      }
      current = current[token];
      continue;
    }
    // String key: only own properties of plain objects; block prototype keys.
    if (typeof current !== "object") {
      return { value: null, found: false };
    }
    if (BLOCKED_KEYS.has(token)) {
      return { value: null, found: false };
    }
    if (!Object.prototype.hasOwnProperty.call(current, token)) {
      return { value: null, found: false };
    }
    current = current[token];
  }

  if (current === undefined) {
    // Normalize undefined to null so the result stays JSON-serializable.
    return { value: null, found: true };
  }
  return { value: current, found: true };
}
