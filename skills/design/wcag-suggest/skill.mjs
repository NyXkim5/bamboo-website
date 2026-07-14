/**
 * design/wcag-suggest
 * Suggest an adjusted foreground color that meets a WCAG contrast target
 * against a given background, using the WCAG 2.x relative luminance and
 * contrast ratio definitions.
 */

export const meta = Object.freeze({
  id: "design/wcag-suggest",
  name: "WCAG Contrast Suggestion",
  domain: "design",
  version: "0.1.0",
  description:
    "Given foreground and background hex colors, compute the WCAG contrast ratio and, if below the target (default 4.5:1 for AA normal text), suggest an adjusted foreground by stepping it toward black or white (whichever the background favors) until the target is met.",
  tags: ["wcag", "accessibility", "contrast", "color", "a11y", "design"],
  license: "MIT",
  inputs: {
    fg: "string (required) - foreground color as hex, e.g. '#777777' or '#777'",
    bg: "string (required) - background color as hex, e.g. '#ffffff' or '#fff'",
    target:
      "number (optional, default 4.5) - contrast ratio to reach, must be in (1, 21]",
  },
  outputs:
    "{ original: string, suggested: string, ratio: number, passes: boolean } - original normalized fg hex, suggested fg hex, contrast ratio of suggested vs bg (rounded to 4 decimals), and whether it meets the target",
  source:
    "WCAG 2.1 relative luminance and contrast ratio definitions (W3C, https://www.w3.org/TR/WCAG21/#dfn-relative-luminance and #dfn-contrast-ratio); original independent implementation, no code copied.",
});

function parseHex(value, label) {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a hex color string`);
  }
  let s = value.trim();
  if (s.startsWith("#")) s = s.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) {
    throw new Error(
      `${label} must be a 3- or 6-digit hex color (got ${JSON.stringify(value)})`
    );
  }
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

function toHex(rgb) {
  return (
    "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("")
  );
}

function channelLuminance(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb) {
  return (
    0.2126 * channelLuminance(rgb[0]) +
    0.7152 * channelLuminance(rgb[1]) +
    0.0722 * channelLuminance(rgb[2])
  );
}

function contrastRatio(rgbA, rgbB) {
  const la = relativeLuminance(rgbA);
  const lb = relativeLuminance(rgbB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function mixToward(rgb, extreme, t) {
  // Linear interpolation of each channel toward 0 (black) or 255 (white).
  return rgb.map((c) => Math.round(c + (extreme - c) * t));
}

const BLACK = [0, 0, 0];
const WHITE = [255, 255, 255];
const STEPS = 100;

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object with fg and bg hex strings");
  }
  const fg = parseHex(input.fg, "fg");
  const bg = parseHex(input.bg, "bg");

  let target = 4.5;
  if (input.target !== undefined) {
    if (
      typeof input.target !== "number" ||
      !Number.isFinite(input.target) ||
      input.target <= 1 ||
      input.target > 21
    ) {
      throw new Error("target must be a finite number in (1, 21]");
    }
    target = input.target;
  }

  const original = toHex(fg);
  const round4 = (x) => Math.round(x * 10000) / 10000;

  const originalRatio = contrastRatio(fg, bg);
  if (originalRatio >= target) {
    return {
      original,
      suggested: original,
      ratio: round4(originalRatio),
      passes: true,
    };
  }

  // Pick the direction the background favors: the extreme (black or white)
  // that yields the higher achievable contrast against the background.
  const blackRatio = contrastRatio(BLACK, bg);
  const whiteRatio = contrastRatio(WHITE, bg);
  const extreme = blackRatio >= whiteRatio ? 0 : 255;

  let best = fg;
  let bestRatio = originalRatio;
  for (let k = 1; k <= STEPS; k++) {
    const candidate = mixToward(fg, extreme, k / STEPS);
    const ratio = contrastRatio(candidate, bg);
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
    if (ratio >= target) {
      return {
        original,
        suggested: toHex(candidate),
        ratio: round4(ratio),
        passes: true,
      };
    }
  }

  // Exhausted: even the best step (typically the pure extreme) fails.
  return {
    original,
    suggested: toHex(best),
    ratio: round4(bestRatio),
    passes: false,
  };
}
