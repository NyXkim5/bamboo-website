// Skill: design/aspect-ratios
// Aspect-ratio helpers: simplify a width×height to its ratio, compute the
// missing dimension, and emit CSS. Pure + deterministic — no deps.

export const meta = {
  id: "design/aspect-ratios",
  name: "Aspect Ratio Helper",
  domain: "design",
  version: "0.1.0",
  description:
    "Reduce a width×height to its simplest aspect ratio, name common ratios (16:9, 4:3, 1:1…), compute a missing dimension, and emit CSS aspect-ratio.",
  tags: ["design", "aspect-ratio", "layout", "css", "responsive"],
  inputs: { width: "number", height: "number", target: "optional { width } or { height } to solve the other" },
  outputs: "{ ratio: 'w:h', decimal, name, css, solved }",
  license: "MIT",
  source: "Original implementation; Euclid GCD reduction.",
};

const NAMED = {
  "16:9": "widescreen", "4:3": "standard", "1:1": "square",
  "3:2": "classic photo", "21:9": "ultrawide", "9:16": "vertical/story", "2:3": "portrait photo",
};

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function run(input = {}) {
  const { width, height, target } = input;
  if (!(width > 0) || !(height > 0)) throw new Error("width and height must be > 0");

  const g = gcd(Math.round(width), Math.round(height));
  const w = Math.round(width) / g;
  const h = Math.round(height) / g;
  const ratioStr = `${w}:${h}`;
  const exact = width / height; // unrounded — used for solving
  const decimal = Math.round(exact * 10000) / 10000; // rounded — for display

  let solved = null;
  if (target && target.width > 0) solved = { width: target.width, height: Math.round((target.width / exact) * 100) / 100 };
  else if (target && target.height > 0) solved = { width: Math.round(target.height * exact * 100) / 100, height: target.height };

  return {
    ratio: ratioStr,
    decimal,
    name: NAMED[ratioStr] ?? "custom",
    css: `aspect-ratio: ${w} / ${h};`,
    solved,
  };
}
