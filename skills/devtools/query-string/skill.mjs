export const meta = {
  id: "devtools/query-string",
  name: "Query String Parser/Stringifier",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Parse URL query strings into objects (repeated keys become arrays) and stringify objects back into query strings, with URL encoding/decoding and leading '?' handling.",
  tags: ["url", "query-string", "parse", "stringify", "encoding", "web"],
  license: "MIT",
  inputs: {
    parse: "string (optional) — a query string to parse, e.g. '?a=1&b=2&b=3'",
    stringify:
      "object (optional) — a flat object to serialize; array values become repeated keys",
  },
  outputs:
    "{ query: object } when parsing, or { string: string } when stringifying",
  source:
    "Implements the standard application/x-www-form-urlencoded query-string convention (WHATWG URL spec); original implementation, no copied code.",
};

function decodeComponent(value) {
  const withSpaces = value.replace(/\+/g, " ");
  try {
    return decodeURIComponent(withSpaces);
  } catch {
    throw new Error(`Malformed percent-encoding in query component: "${value}"`);
  }
}

// Assign as an own data property. A plain `query[key] = val` assignment is
// unsafe for keys like "__proto__": it triggers the Object.prototype accessor
// and silently drops the pair instead of storing it.
function setOwn(obj, key, value) {
  Object.defineProperty(obj, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

function parseQuery(raw) {
  let s = raw;
  if (s.startsWith("?")) s = s.slice(1);
  const query = {};
  if (s === "") return query;
  for (const pair of s.split("&")) {
    if (pair === "") continue;
    const eq = pair.indexOf("=");
    const rawKey = eq === -1 ? pair : pair.slice(0, eq);
    const rawVal = eq === -1 ? "" : pair.slice(eq + 1);
    const key = decodeComponent(rawKey);
    const val = decodeComponent(rawVal);
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      const existing = query[key];
      if (Array.isArray(existing)) {
        existing.push(val);
      } else {
        setOwn(query, key, [existing, val]);
      }
    } else {
      setOwn(query, key, val);
    }
  }
  return query;
}

function encodeValue(value, key) {
  const t = typeof value;
  if (t !== "string" && t !== "number" && t !== "boolean") {
    throw new Error(
      `Value for key "${key}" must be a string, number, or boolean (or an array of those)`
    );
  }
  if (t === "number" && !Number.isFinite(value)) {
    throw new Error(`Value for key "${key}" must be a finite number`);
  }
  return encodeURIComponent(String(value));
}

function stringifyQuery(obj) {
  const parts = [];
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const encodedKey = encodeURIComponent(key);
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === null || item === undefined) continue;
        parts.push(`${encodedKey}=${encodeValue(item, key)}`);
      }
    } else {
      parts.push(`${encodedKey}=${encodeValue(value, key)}`);
    }
  }
  return parts.join("&");
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Input must be an object with a 'parse' or 'stringify' key");
  }
  const hasParse = "parse" in input;
  const hasStringify = "stringify" in input;
  if (hasParse === hasStringify) {
    throw new Error(
      "Provide exactly one of 'parse' (string) or 'stringify' (object)"
    );
  }
  if (hasParse) {
    if (typeof input.parse !== "string") {
      throw new Error("'parse' must be a string");
    }
    return { query: parseQuery(input.parse) };
  }
  const obj = input.stringify;
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("'stringify' must be a plain object");
  }
  return { string: stringifyQuery(obj) };
}
