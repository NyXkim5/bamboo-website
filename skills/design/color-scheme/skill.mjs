export const meta = {
  id: "design/color-scheme",
  name: "Color Scheme Generator",
  domain: "design",
  version: "0.1.0",
  description:
    "Generate a harmonic color scheme (complementary, triadic, tetradic, analogous, split-complementary) from a base hex color by rotating its hue in HSL space.",
  tags: ["color", "design", "palette", "hsl", "harmony", "hex"],
  license: "MIT",
  inputs: {
    base: "string — base color as hex, e.g. \"#3366cc\" or \"36c\" (leading # optional, 3 or 6 digits)",
    scheme:
      "string (optional, default \"complementary\") — one of: complementary, triadic, tetradic, analogous, splitComplementary",
  },
  outputs:
    "{ base: string, scheme: string, colors: string[] } — colors as lowercase 6-digit hex, base first followed by rotated hues",
  source:
    "Standard color harmony wheel rotations and the CSS Color Module Level 3 HSL<->RGB conversion algorithm (W3C); implemented from the published formulas, no code copied.",
};

const SCHEMES = {
  complementary: [180],
  triadic: [120, 240],
  tetradic: [90, 180, 270],
  analogous: [-30, 30],
  splitComplementary: [150, 210],
};

function parseHex(input) {
  if (typeof input !== "string") {
    throw new Error("base must be a hex color string");
  }
  let s = input.trim();
  if (s.startsWith("#")) s = s.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) {
    throw new Error(`invalid hex color: ${input}`);
  }
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) {
      h = 60 * (((gn - bn) / d) % 6);
    } else if (max === gn) {
      h = 60 * ((bn - rn) / d + 2);
    } else {
      h = 60 * ((rn - gn) / d + 4);
    }
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let rn = 0;
  let gn = 0;
  let bn = 0;
  if (hue < 60) {
    rn = c; gn = x; bn = 0;
  } else if (hue < 120) {
    rn = x; gn = c; bn = 0;
  } else if (hue < 180) {
    rn = 0; gn = c; bn = x;
  } else if (hue < 240) {
    rn = 0; gn = x; bn = c;
  } else if (hue < 300) {
    rn = x; gn = 0; bn = c;
  } else {
    rn = c; gn = 0; bn = x;
  }
  return [
    Math.round((rn + m) * 255),
    Math.round((gn + m) * 255),
    Math.round((bn + m) * 255),
  ];
}

function toHex(r, g, b) {
  const part = (v) => v.toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object like { base, scheme? }");
  }
  const { base, scheme = "complementary" } = input;
  // Own-key check: inherited keys like "constructor"/"__proto__"/"toString"
  // must not pass validation, and non-strings (arrays, symbols) must not
  // coerce into valid scheme names.
  if (
    typeof scheme !== "string" ||
    !Object.prototype.hasOwnProperty.call(SCHEMES, scheme)
  ) {
    throw new Error(
      `invalid scheme: ${String(scheme)} (expected one of ${Object.keys(SCHEMES).join(", ")})`
    );
  }
  const rotations = SCHEMES[scheme];
  const [r, g, b] = parseHex(base);
  const [h, s, l] = rgbToHsl(r, g, b);
  const baseHex = toHex(r, g, b);
  const colors = [baseHex];
  for (const delta of rotations) {
    const [nr, ng, nb] = hslToRgb(h + delta, s, l);
    colors.push(toHex(nr, ng, nb));
  }
  return { base: baseHex, scheme, colors };
}
