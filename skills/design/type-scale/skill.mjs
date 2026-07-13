// Skill: design/type-scale
// Generate a modular typographic scale (font sizes) from a base size + ratio,
// with rem values and ready-to-use CSS custom properties. Pure + deterministic.

export const meta = {
  id: "design/type-scale",
  name: "Modular Type Scale",
  domain: "design",
  version: "0.1.0",
  description:
    "Build a modular typographic scale from a base size and ratio (e.g. 1.25 major third), returning px + rem for each step and a CSS variables block.",
  tags: ["design", "typography", "scale", "design-tokens", "css"],
  inputs: { base: "px number (default 16)", ratio: "number (default 1.25)", steps: "int up (default 5)", down: "int down (default 2)" },
  outputs: "{ scale: [{ step, px, rem, name }], css: string }",
  license: "MIT",
  source: "Original implementation of the classic modular-scale technique.",
};

const NAMES = { "-2": "xs", "-1": "sm", "0": "base", "1": "md", "2": "lg", "3": "xl", "4": "2xl", "5": "3xl", "6": "4xl", "7": "5xl" };

export function run(input = {}) {
  const { base = 16, ratio = 1.25, steps = 5, down = 2 } = input;
  if (base <= 0) throw new Error("base must be > 0");
  if (ratio <= 1) throw new Error("ratio must be > 1");

  const round = (x) => Math.round(x * 1000) / 1000;
  const scale = [];
  for (let step = -down; step <= steps; step++) {
    const px = base * Math.pow(ratio, step);
    scale.push({
      step,
      px: round(px),
      rem: round(px / base),
      name: NAMES[String(step)] ?? `step${step}`,
    });
  }

  const css =
    ":root {\n" +
    scale.map((s) => `  --text-${s.name}: ${s.rem}rem;`).join("\n") +
    "\n}";

  return { base, ratio, scale, css };
}
