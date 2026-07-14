// Skill: design/gradient-gen
// Build an evenly-stepped multi-stop gradient between two hex colors by
// interpolating in HSL space, and emit a ready-to-use CSS linear-gradient.
// Pure + deterministic — no network, no deps.

export const meta = {
  id: "design/gradient-gen",
  name: "Gradient Generator",
  domain: "design",
  version: "0.1.0",
  description:
    "Interpolate N evenly-spaced stops between two hex colors (in HSL) and return the swatches plus a CSS linear-gradient string.",
  tags: ["design", "color", "gradient", "css", "design-tokens"],
  inputs: { from: "hex", to: "hex", stops: "int total stops incl. ends (default 5)", angle: "deg for CSS (default 90)" },
  outputs: "{ stops: hex[], css: string }",
  license: "MIT",
  source: "Original implementation; HSL linear interpolation.",
};

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
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
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0; const d = max - min;
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

// Interpolate hue along the shorter arc around the color wheel.
function lerpHue(a, b, t) {
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return a + d * t;
}

export function run(input = {}) {
  const { from = "#3B7A57", to = "#F2C14E", stops = 5, angle = 90 } = input;
  if (stops < 2) throw new Error("stops must be >= 2");
  const a = rgbToHsl(hexToRgb(from));
  const b = rgbToHsl(hexToRgb(to));

  const out = [];
  for (let i = 0; i < stops; i++) {
    const t = i / (stops - 1);
    const hsl = {
      h: lerpHue(a.h, b.h, t),
      s: a.s + (b.s - a.s) * t,
      l: a.l + (b.l - a.l) * t,
    };
    out.push(rgbToHex(hslToRgb(hsl)));
  }

  const cssStops = out.map((hex, i) => `${hex} ${Math.round((i / (stops - 1)) * 100)}%`).join(", ");
  return { from, to, stops: out, css: `linear-gradient(${angle}deg, ${cssStops})` };
}
