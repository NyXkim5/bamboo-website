export const meta = {
  id: "design/palette-oklch",
  name: "OKLCH Palette Generator",
  domain: "design",
  version: "0.1.0",
  description:
    "Generate a perceptually-even lightness ramp palette from a base hex color using the OKLCH color space. Converts sRGB -> OKLab -> OKLCH, varies lightness evenly at constant chroma and hue, then converts back to hex.",
  tags: ["color", "palette", "oklch", "oklab", "design", "accessibility"],
  license: "MIT",
  inputs: {
    base: "string (required) - base color as hex, e.g. '#3b82f6' or '3b82f6' or '#abc'",
    steps: "integer (optional, default 5, 1..64) - number of swatches. With steps=1 the base color's own lightness is used.",
    lMin: "number (optional, default 0.2) - lowest OKLCH lightness in the ramp (0..1)",
    lMax: "number (optional, default 0.95) - highest OKLCH lightness in the ramp (0..1)",
  },
  outputs:
    "{ base: { hex, oklch: { l, c, h } }, swatches: [{ hex, oklch: { l, c, h } }] } - swatches ordered from lMin to lMax",
  source:
    "OKLab/OKLCH color space and sRGB<->OKLab conversion matrices by Bjorn Ottosson, 'A perceptual color space for image processing' (bottosson.github.io/posts/oklab, public domain / MIT). Implementation written from the published math, no code copied.",
};

// ---- sRGB transfer functions ----
function srgbToLinear(u) {
  return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
}
function linearToSrgb(u) {
  return u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055;
}

// ---- hex parsing / formatting ----
function parseHex(hex) {
  if (typeof hex !== "string") {
    throw new Error("base must be a string hex color");
  }
  let s = hex.trim();
  if (s.startsWith("#")) s = s.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) {
    throw new Error(`invalid hex color: ${hex}`);
  }
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

function toHex(r, g, b) {
  const clamp = (v) => Math.min(255, Math.max(0, Math.round(v)));
  const h2 = (v) => clamp(v).toString(16).padStart(2, "0");
  return `#${h2(r)}${h2(g)}${h2(b)}`;
}

// ---- linear sRGB <-> OKLab (Ottosson matrices) ----
function linearRgbToOklab(r, g, b) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

function oklabToLinearRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function hexToOklch(hex) {
  const [r8, g8, b8] = parseHex(hex);
  const { L, a, b } = linearRgbToOklab(
    srgbToLinear(r8 / 255),
    srgbToLinear(g8 / 255),
    srgbToLinear(b8 / 255)
  );
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

function oklchToHex(l, c, h) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const { r, g, b: bl } = oklabToLinearRgb(l, a, b);
  return toHex(
    linearToSrgb(Math.min(1, Math.max(0, r))) * 255,
    linearToSrgb(Math.min(1, Math.max(0, g))) * 255,
    linearToSrgb(Math.min(1, Math.max(0, bl))) * 255
  );
}

const round6 = (v) => {
  const r = Math.round(v * 1e6) / 1e6;
  return Object.is(r, -0) ? 0 : r;
};

// Hue is periodic: a tiny negative OKLab b (e.g. near-greys) gives h = 360 - eps,
// which round6 can round up to exactly 360; report that as 0.
const roundHue = (h) => {
  const r = round6(h);
  return r === 360 ? 0 : r;
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object");
  }
  // Read own properties only, so inherited keys (incl. a polluted
  // Object.prototype) cannot change behavior. undefined falls back to default,
  // matching destructuring-default semantics.
  const own = (key, fallback) =>
    Object.hasOwn(input, key) && input[key] !== undefined
      ? input[key]
      : fallback;
  const base = own("base", undefined);
  const steps = own("steps", 5);
  const lMin = own("lMin", 0.2);
  const lMax = own("lMax", 0.95);

  const baseOklch = hexToOklch(base); // validates base

  if (!Number.isInteger(steps) || steps < 1 || steps > 64) {
    throw new Error("steps must be an integer between 1 and 64");
  }
  for (const [name, v] of [["lMin", lMin], ["lMax", lMax]]) {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1) {
      throw new Error(`${name} must be a finite number in [0, 1]`);
    }
  }
  if (lMin >= lMax) {
    throw new Error("lMin must be less than lMax");
  }

  const { c, h } = baseOklch;
  const swatches = [];
  for (let i = 0; i < steps; i++) {
    const l = steps === 1 ? baseOklch.l : lMin + (i / (steps - 1)) * (lMax - lMin);
    swatches.push({
      hex: oklchToHex(l, c, h),
      oklch: { l: round6(l), c: round6(c), h: roundHue(h) },
    });
  }

  return {
    base: {
      hex: toHex(...parseHex(base)),
      oklch: {
        l: round6(baseOklch.l),
        c: round6(baseOklch.c),
        h: roundHue(baseOklch.h),
      },
    },
    swatches,
  };
}
