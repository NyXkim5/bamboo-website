export const meta = {
  id: "design/tints-shades",
  name: "Tints & Shades",
  domain: "design",
  version: "0.1.0",
  description:
    "Generate evenly spaced tints (mixed toward white) and shades (mixed toward black) of a base hex color. Returns base-first arrays; the mix fraction never reaches 1, though 8-bit rounding can land on pure white/black for bases within half a rounding step of an extreme (e.g. #fefefe).",
  tags: ["color", "hex", "tints", "shades", "palette", "design"],
  license: "MIT",
  inputs: {
    base: "string — hex color (#RGB, #RRGGBB, with or without leading #), required",
    steps: "integer — number of swatches per ramp including the base (default 5, min 1, max 100)",
  },
  outputs:
    "{ base: string, steps: number, tints: string[], shades: string[] } — lowercase #rrggbb hex arrays, each starting with the base color",
  source:
    "Original implementation of standard tint/shade color mixing (linear RGB interpolation toward white/black).",
};

function parseHex(base) {
  if (typeof base !== "string") {
    throw new Error("base must be a hex color string");
  }
  let s = base.trim();
  if (s.startsWith("#")) s = s.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) {
    throw new Error(
      "base must be a 3- or 6-digit hex color like #f00 or #3498db"
    );
  }
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

function toHex(r, g, b) {
  const h = (n) => n.toString(16).padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}

function mix(rgb, target, t) {
  return toHex(
    Math.round(rgb[0] + (target - rgb[0]) * t),
    Math.round(rgb[1] + (target - rgb[1]) * t),
    Math.round(rgb[2] + (target - rgb[2]) * t)
  );
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object with a base hex color");
  }
  const { base, steps = 5 } = input;
  const rgb = parseHex(base);

  if (
    typeof steps !== "number" ||
    !Number.isInteger(steps) ||
    steps < 1 ||
    steps > 100
  ) {
    throw new Error("steps must be an integer between 1 and 100");
  }

  const tints = [];
  const shades = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps; // evenly spaced, base-first; t < 1, but rounding may still hit the extreme for near-white/near-black bases
    tints.push(mix(rgb, 255, t));
    shades.push(mix(rgb, 0, t));
  }

  return { base: toHex(rgb[0], rgb[1], rgb[2]), steps, tints, shades };
}
