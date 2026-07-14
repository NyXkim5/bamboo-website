export const meta = {
  id: "design/hsl-convert",
  name: "HSL Color Converter",
  domain: "design",
  version: "0.1.0",
  description:
    "Convert colors between hex, RGB, and HSL representations. Accepts { hex } or { rgb: {r,g,b} } or { hsl: {h,s,l} } and returns all three forms.",
  tags: ["color", "hex", "rgb", "hsl", "conversion", "design"],
  license: "MIT",
  inputs: {
    hex: "string — hex color like '#ff8000' or '#f80' (leading '#' optional)",
    rgb: "object — { r, g, b } each 0..255",
    hsl: "object — { h: 0..360, s: 0..100, l: 0..100 }",
  },
  outputs:
    "{ hex: string ('#rrggbb'), rgb: { r, g, b } integers 0..255, hsl: { h, s, l } rounded to 1 decimal place }",
  source:
    "Standard HSL/RGB conversion formulas per CSS Color Module Level 3 (W3C) — original implementation, no copied code.",
};

function round1(n) {
  // `+ 0` normalizes -0 to +0 so outputs never contain negative zero.
  return Math.round(n * 10) / 10 + 0;
}

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function parseHex(hex) {
  if (typeof hex !== "string") throw new Error("hex must be a string");
  let s = hex.trim();
  if (s.startsWith("#")) s = s.slice(1);
  if (!/^[0-9a-fA-F]+$/.test(s) || (s.length !== 3 && s.length !== 6)) {
    throw new Error("hex must be 3 or 6 hexadecimal digits, e.g. '#ff8000'");
  }
  if (s.length === 3) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  }
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}

function validateRgb(rgb) {
  if (rgb === null || typeof rgb !== "object") {
    throw new Error("rgb must be an object { r, g, b }");
  }
  const { r, g, b } = rgb;
  for (const [key, v] of [["r", r], ["g", g], ["b", b]]) {
    if (!isFiniteNumber(v) || v < 0 || v > 255) {
      throw new Error(`rgb.${key} must be a number in range 0..255`);
    }
  }
  // `+ 0` normalizes -0 (a valid in-range input) to +0 in the output.
  return { r: Math.round(r) + 0, g: Math.round(g) + 0, b: Math.round(b) + 0 };
}

function validateHsl(hsl) {
  if (hsl === null || typeof hsl !== "object") {
    throw new Error("hsl must be an object { h, s, l }");
  }
  const { h, s, l } = hsl;
  if (!isFiniteNumber(h) || h < 0 || h > 360) {
    throw new Error("hsl.h must be a number in range 0..360");
  }
  if (!isFiniteNumber(s) || s < 0 || s > 100) {
    throw new Error("hsl.s must be a number in range 0..100");
  }
  if (!isFiniteNumber(l) || l < 0 || l > 100) {
    throw new Error("hsl.l must be a number in range 0..100");
  }
  return { h, s, l };
}

function rgbToHex({ r, g, b }) {
  const to2 = (n) => n.toString(16).padStart(2, "0");
  return "#" + to2(r) + to2(g) + to2(b);
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) {
      h = ((gn - bn) / d) % 6;
    } else if (max === gn) {
      h = (bn - rn) / d + 2;
    } else {
      h = (rn - gn) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: round1(h), s: round1(s * 100), l: round1(l * 100) };
}

function hslToRgb({ h, s, l }) {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hp >= 0 && hp < 1) [rp, gp, bp] = [c, x, 0];
  else if (hp < 2) [rp, gp, bp] = [x, c, 0];
  else if (hp < 3) [rp, gp, bp] = [0, c, x];
  else if (hp < 4) [rp, gp, bp] = [0, x, c];
  else if (hp < 5) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  const m = ln - c / 2;
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("input must be an object with one of: hex, rgb, hsl");
  }
  // Only own properties count as provided — prototype-inherited keys
  // (e.g. Object.create({ hex: "#fff" }) or polluted Object.prototype)
  // must not be treated as input.
  const provided = ["hex", "rgb", "hsl"].filter(
    (k) => Object.prototype.hasOwnProperty.call(input, k) && input[k] !== undefined,
  );
  if (provided.length === 0) {
    throw new Error("input must include one of: hex, rgb, hsl");
  }
  if (provided.length > 1) {
    throw new Error("input must include exactly one of: hex, rgb, hsl");
  }

  let rgb;
  let hsl;
  if (provided[0] === "hex") {
    rgb = parseHex(input.hex);
    hsl = rgbToHsl(rgb);
  } else if (provided[0] === "rgb") {
    rgb = validateRgb(input.rgb);
    hsl = rgbToHsl(rgb);
  } else {
    const norm = validateHsl(input.hsl);
    rgb = hslToRgb(norm);
    hsl = { h: round1(norm.h % 360), s: round1(norm.s), l: round1(norm.l) };
  }
  return { hex: rgbToHex(rgb), rgb, hsl };
}
