// Skill: design/spacing-tokens
// Generate a spacing scale (design tokens) from a base unit + ratio, with rem
// values and a CSS custom-properties block. Pure + deterministic.

export const meta = {
  id: "design/spacing-tokens",
  name: "Spacing Token Scale",
  domain: "design",
  version: "0.1.0",
  description:
    "Generate a consistent spacing scale from a base unit and step ratio, returning px + rem tokens and a CSS variables block (--space-*).",
  tags: ["design", "spacing", "design-tokens", "css", "layout"],
  inputs: { base: "px base unit (default 4)", steps: "int count (default 8)", mode: "'linear' | 'geometric' (default linear)", ratio: "geometric ratio (default 2)" },
  outputs: "{ tokens: [{ name, px, rem }], css: string }",
  license: "MIT",
  source: "Original implementation; common 4px/8px spacing-scale conventions.",
};

const NAMES = ["0", "px", "0.5", "1", "1.5", "2", "3", "4", "5", "6", "8", "10", "12", "16"];

export function run(input = {}) {
  const { base = 4, steps = 8, mode = "linear", ratio = 2 } = input;
  if (base <= 0) throw new Error("base must be > 0");
  if (steps < 1) throw new Error("steps must be >= 1");

  const round = (x) => Math.round(x * 1000) / 1000;
  const tokens = [];
  for (let i = 0; i <= steps; i++) {
    const px = mode === "geometric" ? (i === 0 ? 0 : base * Math.pow(ratio, i - 1)) : base * i;
    tokens.push({
      name: NAMES[i] ?? String(i),
      px: round(px),
      rem: round(px / 16),
    });
  }

  const css =
    ":root {\n" +
    tokens.map((t) => `  --space-${t.name.replace(".", "_")}: ${t.rem}rem;`).join("\n") +
    "\n}";

  return { base, mode, tokens, css };
}
