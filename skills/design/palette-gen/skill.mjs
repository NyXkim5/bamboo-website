// Skill: design/palette-gen
// Generate an accessible color palette from a single base color.
// Pure + deterministic — no network, no deps.

export const meta = {
  id: "design/palette-gen",
  name: "Accessible Palette Generator",
  domain: "design",
  version: "0.1.0",
  description:
    "Turn one base hex color into a harmonious 5-swatch palette with WCAG contrast ratings against black and white text.",
  tags: ["color", "palette", "wcag", "accessibility", "design-tokens"],
  inputs: { base: "hex string, e.g. '#3B7A57'", scheme: "'analogous' | 'complementary' (default analogous)" },
  outputs: "{ swatches: [{ hex, hsl, contrastOnWhite, contrastOnBlack, readableOn }] }",
  license: "MIT",
  source: "Original implementation; contrast math per WCAG 2.1 relative-luminance spec.",
};

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`invalid hex: ${hex}`);
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  const h = (v) => Math.round(v).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function relLuminance({ r, g, b }) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(rgb1, rgb2) {
  const l1 = relLuminance(rgb1), l2 = relLuminance(rgb2);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

function swatch(rgb) {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  const onWhite = contrast(rgb, white);
  const onBlack = contrast(rgb, black);
  const hsl = rgbToHsl(rgb);
  return {
    hex: rgbToHex(rgb),
    hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
    contrastOnWhite: onWhite,
    contrastOnBlack: onBlack,
    // Which text color meets WCAG AA (>= 4.5) as a foreground on this swatch.
    readableOn: onBlack >= 4.5 ? "black-text" : onWhite >= 4.5 ? "white-text" : "neither-AA",
  };
}

export function run(input = {}) {
  const { base = "#3B7A57", scheme = "analogous" } = input;
  const hsl = rgbToHsl(hexToRgb(base));
  const offsets =
    scheme === "complementary" ? [-30, 0, 180, 210, 30] : [-40, -20, 0, 20, 40];
  const swatches = offsets.map((deg) =>
    swatch(hslToRgb({ h: hsl.h + deg, s: hsl.s, l: hsl.l }))
  );
  return { base, scheme, swatches };
}
