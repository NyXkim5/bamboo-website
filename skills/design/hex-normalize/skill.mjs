export const meta = {
  id: "design/hex-normalize",
  name: "Hex Color Normalize",
  domain: "design",
  version: "0.1.0",
  description:
    "Normalize CSS hex colors: expand 3-digit shorthand (#abc -> #aabbcc), shorten 6-digit hex to shorthand when every channel is a doubled nibble (#aabbcc -> #abc), and lowercase. form 'long' always expands, 'short' requires a shortenable color (throws otherwise), 'auto' shortens when possible else expands.",
  tags: ["color", "hex", "css", "normalize", "design"],
  license: "MIT",
  inputs: {
    hex: "string - a 3- or 6-digit hex color, with or without leading '#' (e.g. '#AbC' or 'aabbcc')",
    form: "string (optional) - 'long' (default), 'short', or 'auto'",
  },
  outputs:
    "object { hex: string (normalized, lowercase, with leading '#'), canLong: boolean (always true for valid input), canShort: boolean (true when a 3-digit shorthand exists) }",
  source: "Original implementation for SkillForge; follows CSS Color hex notation rules.",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("input must be an object");
  }
  const { hex, form = "long" } = input;
  if (typeof hex !== "string") {
    throw new TypeError("hex must be a string");
  }
  if (form !== "long" && form !== "short" && form !== "auto") {
    throw new RangeError("form must be 'long', 'short', or 'auto'");
  }

  const raw = hex.startsWith("#") ? hex.slice(1) : hex;
  if (!/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
    throw new RangeError("hex must be a 3- or 6-digit hexadecimal color");
  }

  const lower = raw.toLowerCase();

  let short = null;
  let long;
  if (lower.length === 3) {
    short = lower;
    long = lower[0] + lower[0] + lower[1] + lower[1] + lower[2] + lower[2];
  } else {
    long = lower;
    if (
      lower[0] === lower[1] &&
      lower[2] === lower[3] &&
      lower[4] === lower[5]
    ) {
      short = lower[0] + lower[2] + lower[4];
    }
  }

  const canShort = short !== null;

  let out;
  if (form === "long") {
    out = long;
  } else if (form === "short") {
    if (!canShort) {
      throw new RangeError("color cannot be shortened to 3-digit form");
    }
    out = short;
  } else {
    out = canShort ? short : long;
  }

  return { hex: "#" + out, canLong: true, canShort };
}
