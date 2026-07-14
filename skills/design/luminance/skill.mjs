export const meta = {
  id: "design/luminance",
  name: "Relative Luminance & Perceived Brightness",
  domain: "design",
  version: "0.1.0",
  description:
    "Computes WCAG relative luminance (gamma-decoded 0.2126R + 0.7152G + 0.0722B) and perceived brightness (sqrt(0.299r^2 + 0.587g^2 + 0.114b^2)/255 on gamma-encoded channels) for a hex color, plus an isDark flag (luminance < 0.5).",
  tags: ["color", "luminance", "wcag", "accessibility", "brightness", "hex"],
  license: "MIT",
  inputs: {
    hex: "string — hex color, 3 or 6 digits, with or without leading '#' (e.g. '#1a2b3c', 'fff')",
  },
  outputs:
    "{ luminance: number (0..1, WCAG relative luminance), perceivedBrightness: number (0..1), isDark: boolean }",
  source:
    "WCAG 2.1 relative luminance definition (W3C, sRGB linearization); perceived brightness per the HSP color model weights (0.299/0.587/0.114). Implemented from the published formulas.",
};

function parseHex(hex) {
  if (typeof hex !== "string") {
    throw new Error("Input 'hex' must be a string");
  }
  let s = hex.trim();
  if (s.startsWith("#")) s = s.slice(1);
  if (!/^[0-9a-fA-F]+$/.test(s) || (s.length !== 3 && s.length !== 6)) {
    throw new Error(
      "Invalid hex color: expected 3 or 6 hex digits, optionally prefixed with '#'"
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

function linearize(channel255) {
  const c = channel255 / 255;
  // Threshold 0.04045 is the corrected sRGB (IEC 61966-2-1) value. The WCAG 2.x
  // prose uses 0.03928, but no 8-bit channel value v/255 falls in (0.03928, 0.04045],
  // so the two thresholds produce identical results for all hex inputs.
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("Input must be an object with a 'hex' string property");
  }
  const [r, g, b] = parseHex(input.hex);

  const luminance =
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);

  const perceivedBrightness =
    Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b) / 255;

  return {
    luminance,
    perceivedBrightness,
    isDark: luminance < 0.5,
  };
}
