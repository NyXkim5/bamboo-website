// design/color-mix — Mix two hex colors by weight, in sRGB or linear-light space.
//
// ratio = 0 returns color `a`, ratio = 1 returns color `b`.
// space "srgb": linear interpolation of the raw 0..255 channel values.
// space "linear": gamma-decode each channel to linear light (IEC 61966-2-1
// sRGB transfer function), interpolate there, then re-encode — this is the
// more perceptually correct blend.

const HEX_RE = /^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Safe value display for error messages. JSON.stringify throws on BigInt and
// returns undefined for symbols/functions — fall back to String() in those cases.
function show(value) {
  try {
    const s = JSON.stringify(value);
    return s === undefined ? String(value) : s;
  } catch {
    return String(value);
  }
}

function parseHex(value, label) {
  if (typeof value !== "string" || !HEX_RE.test(value)) {
    throw new Error(
      `Invalid hex color for "${label}": expected #RGB or #RRGGBB, got ${show(value)}`
    );
  }
  let s = value.startsWith("#") ? value.slice(1) : value;
  if (s.length === 3) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  }
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

// sRGB electro-optical transfer function: encoded [0,1] -> linear light [0,1]
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// Inverse: linear light [0,1] -> encoded [0,1]
function linearToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function clampByte(n) {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function toHex([r, g, b]) {
  return (
    "#" +
    [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
  );
}

export const meta = {
  id: "design/color-mix",
  name: "Color Mix",
  domain: "design",
  version: "0.1.0",
  description:
    "Mix two hex colors by a weight ratio, interpolating either raw sRGB channel values or gamma-correct linear-light values.",
  tags: ["color", "hex", "blend", "interpolation", "srgb", "linear", "gamma"],
  license: "MIT",
  inputs: {
    a: "First hex color (#RGB or #RRGGBB). Returned when ratio = 0.",
    b: "Second hex color (#RGB or #RRGGBB). Returned when ratio = 1.",
    ratio:
      "Mix weight toward b, number in [0,1]. Optional, default 0.5.",
    space:
      'Interpolation space: "srgb" (raw channels) or "linear" (gamma-decoded). Optional, default "srgb".',
  },
  outputs: '{ hex } — the mixed color as a lowercase "#rrggbb" string.',
  source:
    "Standard linear interpolation of color channels; sRGB transfer function per IEC 61966-2-1 (as used by CSS Color 4 color-mix()). Original implementation.",
};

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("Input must be an object with { a, b, ratio?, space? }");
  }
  const { a, b, ratio = 0.5, space = "srgb" } = input;

  const rgbA = parseHex(a, "a");
  const rgbB = parseHex(b, "b");

  if (typeof ratio !== "number" || !Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
    throw new Error(`Invalid ratio: expected a number in [0,1], got ${show(ratio)}`);
  }
  if (space !== "srgb" && space !== "linear") {
    throw new Error(`Invalid space: expected "srgb" or "linear", got ${show(space)}`);
  }

  let mixed;
  if (space === "srgb") {
    mixed = rgbA.map((ca, i) => clampByte(ca * (1 - ratio) + rgbB[i] * ratio));
  } else {
    mixed = rgbA.map((ca, i) => {
      const la = srgbToLinear(ca / 255);
      const lb = srgbToLinear(rgbB[i] / 255);
      const lm = la * (1 - ratio) + lb * ratio;
      return clampByte(linearToSrgb(lm) * 255);
    });
  }

  return { hex: toHex(mixed) };
}
