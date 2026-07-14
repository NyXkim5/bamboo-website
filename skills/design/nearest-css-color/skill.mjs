// nearest-css-color: given a hex color, find the nearest CSS named color
// by squared Euclidean distance in RGB space against a built-in map of
// ~30 common CSS named colors. Pure and deterministic — no I/O, no randomness.

export const meta = {
  id: "design/nearest-css-color",
  name: "Nearest CSS Color",
  domain: "design",
  version: "0.1.0",
  description:
    "Finds the nearest CSS named color to a given hex color using squared RGB distance over a built-in map of ~30 common CSS colors.",
  tags: ["color", "css", "hex", "rgb", "design", "nearest-neighbor"],
  license: "MIT",
  inputs: {
    hex: "string — a hex color like '#1a2b3c', '1a2b3c', '#abc', or 'abc' (case-insensitive)",
  },
  outputs:
    "{ name: string, hex: string, distance: number } — the nearest CSS named color, its canonical hex value, and the squared RGB distance",
  source:
    "Standard nearest-neighbor search using squared Euclidean distance in RGB space; color values from the CSS Color Module Level 4 named-colors table (W3C). Original implementation, no copied code.",
};

// ~30 common CSS named colors (CSS Color Module Level 4 values).
const CSS_COLORS = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  navy: "#000080",
  teal: "#008080",
  olive: "#808000",
  maroon: "#800000",
  purple: "#800080",
  gray: "#808080",
  silver: "#c0c0c0",
  orange: "#ffa500",
  gold: "#ffd700",
  pink: "#ffc0cb",
  brown: "#a52a2a",
  yellow: "#ffff00",
  lime: "#00ff00",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  crimson: "#dc143c",
  coral: "#ff7f50",
  salmon: "#fa8072",
  khaki: "#f0e68c",
  indigo: "#4b0082",
  violet: "#ee82ee",
  turquoise: "#40e0d0",
  tan: "#d2b48c",
  beige: "#f5f5dc",
  skyblue: "#87ceeb",
  lavender: "#e6e6fa",
};

// Parse '#rgb', 'rgb', '#rrggbb', or 'rrggbb' into [r, g, b]. Throws on bad input.
function parseHex(hex) {
  if (typeof hex !== "string") {
    throw new Error("hex must be a string like '#1a2b3c'");
  }
  let s = hex.trim();
  if (s.startsWith("#")) s = s.slice(1);
  if (!/^[0-9a-fA-F]+$/.test(s) || (s.length !== 3 && s.length !== 6)) {
    throw new Error(
      `Invalid hex color '${hex}': expected 3 or 6 hex digits, optionally prefixed with '#'`
    );
  }
  if (s.length === 3) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  }
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

function squaredDistance([r1, g1, b1], [r2, g2, b2]) {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

// Parse the palette once at module load (validates every entry up front and
// avoids re-parsing on each run). Order matches declaration order, which is
// the deterministic tie-break: on equal distance, the first-declared color wins.
const PALETTE = Object.entries(CSS_COLORS).map(([name, hexValue]) => ({
  name,
  hex: hexValue,
  rgb: parseHex(hexValue),
}));

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object: { hex: string }");
  }
  const rgb = parseHex(input.hex);

  let best = null;
  for (const { name, hex, rgb: colorRgb } of PALETTE) {
    const d = squaredDistance(rgb, colorRgb);
    if (best === null || d < best.distance) {
      best = { name, hex, distance: d };
    }
  }
  return best;
}
