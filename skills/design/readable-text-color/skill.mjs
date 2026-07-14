export const meta = {
  id: "design/readable-text-color",
  name: "Readable Text Color",
  domain: "design",
  version: "0.1.0",
  description:
    "Given a background hex color, picks black or white text (whichever has the higher WCAG 2.x contrast ratio) and returns both contrast ratios, computed via sRGB relative luminance and (L1+0.05)/(L2+0.05).",
  tags: ["color", "contrast", "wcag", "accessibility", "a11y", "design"],
  license: "MIT",
  inputs: {
    bg: "Background color as a hex string: #RGB, #RRGGBB (leading '#' optional).",
  },
  outputs:
    "{ textColor: '#000000' | '#ffffff', contrastBlack: number, contrastWhite: number } — ratios rounded to 2 decimals.",
  source:
    "Original implementation of the WCAG 2.x relative-luminance and contrast-ratio formulas (W3C WCAG 2.1, sections on relative luminance and contrast ratio).",
};

function parseHex(bg) {
  if (typeof bg !== "string") {
    throw new Error("bg must be a hex color string");
  }
  let hex = bg.trim();
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(
      "bg must be a 3- or 6-digit hex color (e.g. #1a2b3c or #abc)"
    );
  }
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

function channelToLinear(c255) {
  const c = c255 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]) {
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("input must be an object like { bg: '#336699' }");
  }
  // Own-property check: never read `bg` off the prototype chain
  // (guards against Object.prototype pollution / inherited keys).
  if (!Object.prototype.hasOwnProperty.call(input, "bg")) {
    throw new Error("input must have an own 'bg' property");
  }
  const L = relativeLuminance(parseHex(input.bg));
  const contrastBlack = contrastRatio(L, 0); // black text: luminance 0
  const contrastWhite = contrastRatio(L, 1); // white text: luminance 1
  return {
    textColor: contrastBlack >= contrastWhite ? "#000000" : "#ffffff",
    contrastBlack: round2(contrastBlack),
    contrastWhite: round2(contrastWhite),
  };
}
