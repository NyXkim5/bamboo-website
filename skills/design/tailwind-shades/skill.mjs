// tailwind-shades — generate a Tailwind-style numeric shade ramp (50..950) from a base hex.
// Converts the base color to HSL, keeps hue and saturation fixed, and scales lightness:
// shade 50 is very light (97% L), shade 500 is the base color, shade 950 is very dark (13% L).
// Lightness is linearly interpolated between those anchors on each side of 500.
// Zero dependencies; hex<->HSL helpers are inlined below.

export const meta = {
  id: "design/tailwind-shades",
  name: "Tailwind Shade Ramp Generator",
  domain: "design",
  version: "0.1.0",
  description:
    "Generate a Tailwind-style shade ramp (50,100,...,900,950) from a base hex color by holding hue/saturation and scaling HSL lightness (50 ≈ 97% L, 500 = base, 950 ≈ 13% L).",
  tags: ["color", "tailwind", "palette", "hsl", "design-tokens"],
  license: "MIT",
  inputs: {
    hex: "string — base color as hex, e.g. '#3b82f6', '3b82f6', or shorthand '#f00'",
  },
  outputs:
    "{ shades: { '50': hex, '100': hex, ..., '900': hex, '950': hex } } — 11 lowercase #rrggbb strings",
  source:
    "Standard RGB<->HSL conversion formulas (CSS Color Module Level 3, W3C; also Foley & van Dam, 'Computer Graphics: Principles and Practice'). Shade-scale convention modeled on Tailwind CSS's numeric palette naming. Original implementation, no copied code.",
};

const SHADE_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LIGHT_ANCHOR = 97; // % lightness at shade 50
const DARK_ANCHOR = 13; // % lightness at shade 950

/** Normalize and validate a hex string -> "rrggbb" (lowercase, 6 digits). Throws on bad input. */
function normalizeHex(hex) {
  if (typeof hex !== "string") {
    throw new Error("Input 'hex' must be a string like '#3b82f6'.");
  }
  let h = hex.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(h)) {
    h = h
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  if (!/^[0-9a-f]{6}$/.test(h)) {
    throw new Error(
      `Invalid hex color '${hex}': expected 3 or 6 hex digits, optionally prefixed with '#'.`
    );
  }
  return h;
}

/** "rrggbb" -> { h: 0..360, s: 0..100, l: 0..100 } (full precision, no rounding). */
function hexToHsl(hex6) {
  const r = parseInt(hex6.slice(0, 2), 16) / 255;
  const g = parseInt(hex6.slice(2, 4), 16) / 255;
  const b = parseInt(hex6.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

/** { h: 0..360, s: 0..100, l: 0..100 } -> "#rrggbb" (lowercase). */
function hslToHex({ h, s, l }) {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Lightness (%) for a given shade key, anchored at 50/500/950. */
function lightnessFor(shade, baseL) {
  if (shade === 500) return baseL;
  if (shade < 500) {
    // Interpolate from LIGHT_ANCHOR at shade 50 down to baseL at shade 500.
    const t = (shade - 50) / (500 - 50);
    return LIGHT_ANCHOR + (baseL - LIGHT_ANCHOR) * t;
  }
  // Interpolate from baseL at shade 500 down to DARK_ANCHOR at shade 950.
  const t = (shade - 500) / (950 - 500);
  return baseL + (DARK_ANCHOR - baseL) * t;
}

export function run(input) {
  if (input == null || typeof input !== "object") {
    throw new Error("Input must be an object like { hex: '#3b82f6' }.");
  }
  const hex6 = normalizeHex(input.hex);
  const { h, s, l } = hexToHsl(hex6);

  const shades = {};
  for (const key of SHADE_KEYS) {
    shades[key] = hslToHex({ h, s, l: lightnessFor(key, l) });
  }
  return { shades };
}
