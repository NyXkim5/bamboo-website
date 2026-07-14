// design/oklch-convert — Convert sRGB hex <-> OKLab <-> OKLCH.
//
// Implements the OKLab perceptual color space published by Björn Ottosson
// (https://bottosson.github.io/posts/oklab/). Given either an sRGB hex color
// or an OKLCH triple, computes the full trio: hex, OKLab {L,a,b}, OKLCH {l,c,h}.
// Pure, deterministic, zero dependencies.

export const meta = {
  id: "design/oklch-convert",
  name: "OKLCH Converter",
  domain: "design",
  version: "0.1.1",
  description:
    "Convert between sRGB hex, OKLab, and OKLCH color spaces using Björn Ottosson's OKLab math. Accepts {hex} or {l,c,h}; returns hex plus OKLab and OKLCH coordinates.",
  tags: ["color", "oklch", "oklab", "srgb", "hex", "conversion", "design-tokens"],
  license: "MIT",
  inputs: {
    hex: "string — sRGB hex color like '#ff8800', '#f80', 'ff8800' (mutually exclusive with l/c/h)",
    l: "number — OKLCH lightness in [0,1] (with c and h)",
    c: "number — OKLCH chroma, >= 0",
    h: "number — OKLCH hue in degrees (any finite number; normalized to [0,360))",
  },
  outputs:
    "{ hex: string ('#rrggbb', gamut-clamped), oklab: { L, a, b }, oklch: { l, c, h } }",
  source:
    "OKLab / OKLCH color space and matrices by Björn Ottosson, 'A perceptual color space for image processing' (bottosson.github.io/posts/oklab, public-domain reference math); sRGB transfer function per IEC 61966-2-1. Original implementation, no copied code.",
};

// --- sRGB transfer function ---

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// --- hex parsing / formatting ---

function parseHex(hex) {
  if (typeof hex !== "string") throw new Error("hex must be a string");
  let s = hex.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(s)) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  }
  if (!/^[0-9a-f]{6}$/.test(s)) {
    throw new Error(`invalid hex color: ${JSON.stringify(hex)}`);
  }
  return [
    parseInt(s.slice(0, 2), 16) / 255,
    parseInt(s.slice(2, 4), 16) / 255,
    parseInt(s.slice(4, 6), 16) / 255,
  ];
}

function toHex(rgb) {
  return (
    "#" +
    rgb
      .map((v) => {
        const clamped = Math.min(1, Math.max(0, v));
        return Math.round(clamped * 255)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

// --- OKLab core (Ottosson matrices) ---

function linearSrgbToOklab(r, g, b) {
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

function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// --- OKLab <-> OKLCH ---

function oklabToOklch({ L, a, b }) {
  const c = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  // Floating point edges: a tiny negative angle (e.g. from sin(2*PI)) plus 360
  // rounds to exactly 360, and atan2(-0, +a) yields -0. Both must land in [0, 360).
  if (h >= 360 || Object.is(h, -0)) h = 0;
  // Hue is meaningless at (near-)zero chroma; report 0 for stability.
  // Threshold absorbs ~1e-8 residuals from the published matrix rounding.
  if (c < 1e-6) h = 0;
  return { l: L, c, h };
}

function oklchToOklab({ l, c, h }) {
  const rad = (h * Math.PI) / 180;
  return { L: l, a: c * Math.cos(rad), b: c * Math.sin(rad) };
}

function assertFiniteNumber(v, name) {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`${name} must be a finite number`);
  }
}

/**
 * Convert a color between sRGB hex, OKLab, and OKLCH.
 * @param {object} input - Either { hex } or { l, c, h }.
 * @returns {{ hex: string, oklab: {L:number,a:number,b:number}, oklch: {l:number,c:number,h:number} }}
 */
export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("input must be an object with { hex } or { l, c, h }");
  }

  // Own properties only: a polluted or inherited prototype key must not
  // change which input form is selected.
  const hasHex = Object.hasOwn(input, "hex");
  const hasLch =
    Object.hasOwn(input, "l") || Object.hasOwn(input, "c") || Object.hasOwn(input, "h");

  if (hasHex && hasLch) {
    throw new Error("provide either { hex } or { l, c, h }, not both");
  }

  let oklab;
  let hex;

  if (hasHex) {
    const [r, g, b] = parseHex(input.hex);
    oklab = linearSrgbToOklab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
    // Re-serialize the parsed channels directly: exact by construction, and
    // immune to double-rounding through the forward/inverse matrices.
    hex = toHex([r, g, b]);
  } else if (hasLch) {
    assertFiniteNumber(input.l, "l");
    assertFiniteNumber(input.c, "c");
    assertFiniteNumber(input.h, "h");
    if (input.l < 0 || input.l > 1) throw new Error("l must be in [0, 1]");
    if (input.c < 0) throw new Error("c must be >= 0");
    oklab = oklchToOklab({ l: input.l, c: input.c, h: input.h });
    // For the hex projection only, cap chroma at 4 — far beyond any physical
    // gamut (sRGB tops out near 0.37). Astronomical chroma would overflow the
    // cubic in oklabToLinearSrgb to Infinity - Infinity = NaN and yield a
    // garbage "#NaNNaNNaN" string. Reported oklab/oklch keep the caller's value.
    const proj = input.c > 4 ? oklchToOklab({ l: input.l, c: 4, h: input.h }) : oklab;
    hex = toHex(oklabToLinearSrgb(proj.L, proj.a, proj.b).map(linearToSrgb));
  } else {
    throw new Error("input must contain either { hex } or { l, c, h }");
  }

  const oklch = oklabToOklch(oklab);
  return { hex, oklab, oklch };
}
