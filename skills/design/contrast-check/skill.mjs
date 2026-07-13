// Skill: design/contrast-check
// WCAG 2.1 contrast ratio between a foreground and background color, with
// AA/AAA pass/fail for normal and large text. Pure + deterministic.

export const meta = {
  id: "design/contrast-check",
  name: "WCAG Contrast Checker",
  domain: "design",
  version: "0.1.0",
  description:
    "Compute the WCAG 2.1 contrast ratio for a foreground/background hex pair and report AA/AAA pass/fail for normal and large text.",
  tags: ["design", "color", "wcag", "accessibility", "contrast"],
  inputs: { fg: "hex string", bg: "hex string" },
  outputs: "{ ratio, pass: { aaNormal, aaLarge, aaaNormal, aaaLarge } }",
  license: "MIT",
  source: "Original implementation per WCAG 2.1 relative-luminance & contrast spec.",
};

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`invalid hex: ${hex}`);
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relLuminance({ r, g, b }) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function run(input = {}) {
  const { fg = "#000000", bg = "#ffffff" } = input;
  const l1 = relLuminance(hexToRgb(fg));
  const l2 = relLuminance(hexToRgb(bg));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  const ratio = Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
  return {
    fg,
    bg,
    ratio,
    pass: {
      aaLarge: ratio >= 3, // large text / UI components
      aaNormal: ratio >= 4.5,
      aaaLarge: ratio >= 4.5,
      aaaNormal: ratio >= 7,
    },
  };
}
