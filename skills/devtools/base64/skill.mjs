const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const REVERSE = (() => {
  const map = Object.create(null);
  for (let i = 0; i < ALPHABET.length; i++) map[ALPHABET[i]] = i;
  return map;
})();

export const meta = {
  id: "devtools/base64",
  name: "Base64 Encode/Decode",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Encode or decode Base64 (standard alphabet with '=' padding) without Buffer or atob/btoa, safe for both browsers and Node. Treats strings as Latin-1 bytes (char codes 0-255).",
  tags: ["base64", "encoding", "decoding", "devtools", "text"],
  license: "MIT",
  inputs: {
    encode: "string (optional) — Latin-1 text to encode to Base64; char codes above 255 throw",
    decode: "string (optional) — Base64 text to decode; must be valid standard Base64",
  },
  outputs: "{ result: string } — the encoded or decoded text",
  source:
    "Original implementation of the standard Base64 algorithm as specified in RFC 4648 section 4 (The Base 64 Alphabet).",
};

function encode(str) {
  let out = "";
  const len = str.length;
  for (let i = 0; i < len; i += 3) {
    const c1 = str.charCodeAt(i);
    if (c1 > 255) throw new Error(`Character code point ${c1} at index ${i} exceeds 255; only Latin-1 input is supported`);
    const has2 = i + 1 < len;
    const has3 = i + 2 < len;
    const c2 = has2 ? str.charCodeAt(i + 1) : 0;
    if (c2 > 255) throw new Error(`Character code point ${c2} at index ${i + 1} exceeds 255; only Latin-1 input is supported`);
    const c3 = has3 ? str.charCodeAt(i + 2) : 0;
    if (c3 > 255) throw new Error(`Character code point ${c3} at index ${i + 2} exceeds 255; only Latin-1 input is supported`);

    const triple = (c1 << 16) | (c2 << 8) | c3;
    out += ALPHABET[(triple >> 18) & 63];
    out += ALPHABET[(triple >> 12) & 63];
    out += has2 ? ALPHABET[(triple >> 6) & 63] : "=";
    out += has3 ? ALPHABET[triple & 63] : "=";
  }
  return out;
}

function decode(str) {
  if (str.length % 4 !== 0) {
    throw new Error("Invalid base64: length must be a multiple of 4");
  }
  if (str === "") return "";

  // Determine and validate padding.
  let padding = 0;
  if (str.endsWith("==")) padding = 2;
  else if (str.endsWith("=")) padding = 1;

  const body = str.slice(0, str.length - padding);
  if (body.includes("=")) {
    throw new Error("Invalid base64: '=' may only appear as trailing padding");
  }
  if (padding === 2 && body.length % 4 !== 2) {
    throw new Error("Invalid base64: malformed padding");
  }

  let out = "";
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    const val = REVERSE[ch];
    if (val === undefined) {
      throw new Error(`Invalid base64: unexpected character ${JSON.stringify(ch)} at index ${i}`);
    }
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 255);
    }
  }

  // Leftover bits (from padded groups) must be zero for canonical base64.
  if (bits > 0 && (buffer & ((1 << bits) - 1)) !== 0) {
    throw new Error("Invalid base64: non-zero trailing bits");
  }

  return out;
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Input must be an object with either an 'encode' or a 'decode' string property");
  }
  const hasEncode = Object.prototype.hasOwnProperty.call(input, "encode");
  const hasDecode = Object.prototype.hasOwnProperty.call(input, "decode");
  if (hasEncode === hasDecode) {
    throw new Error("Provide exactly one of 'encode' or 'decode'");
  }
  if (hasEncode) {
    if (typeof input.encode !== "string") throw new Error("'encode' must be a string");
    return { result: encode(input.encode) };
  }
  if (typeof input.decode !== "string") throw new Error("'decode' must be a string");
  return { result: decode(input.decode) };
}
