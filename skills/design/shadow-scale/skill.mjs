// Skill: design/shadow-scale
// Generate a layered elevation shadow scale (design tokens) with CSS variables.
// Pure + deterministic — no network, no deps.

export const meta = {
  id: "design/shadow-scale",
  name: "Elevation Shadow Scale",
  domain: "design",
  version: "0.1.0",
  description:
    "Generate a consistent elevation shadow scale (box-shadow tokens) from a base color and number of levels, emitting CSS custom properties.",
  tags: ["design", "shadow", "elevation", "design-tokens", "css"],
  inputs: { levels: "int (default 5)", hue: "'neutral' | hex tint (default neutral)", strength: "0..1 opacity scale (default 1)" },
  outputs: "{ shadows: [{ level, css }], css: string }",
  license: "MIT",
  source: "Original implementation; layered-shadow elevation convention.",
};

function shadowColor(hue, alpha) {
  const a = Math.round(alpha * 1000) / 1000;
  if (hue === "neutral" || !/^#?[0-9a-f]{6}$/i.test(hue)) return `rgba(15, 23, 42, ${a})`;
  const n = parseInt(hue.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function run(input = {}) {
  const { levels = 5, hue = "neutral", strength = 1 } = input;
  if (levels < 1) throw new Error("levels must be >= 1");

  const shadows = [];
  for (let lvl = 1; lvl <= levels; lvl++) {
    // Each level stacks a tight ambient shadow + a softer, larger cast shadow.
    const y1 = lvl;
    const blur1 = lvl * 2;
    const y2 = lvl * 2;
    const blur2 = lvl * 4 + 2;
    const a1 = Math.min(0.5, (0.04 + lvl * 0.012) * strength);
    const a2 = Math.min(0.5, (0.06 + lvl * 0.02) * strength);
    const css =
      `0 ${y1}px ${blur1}px ${shadowColor(hue, a1)}, ` +
      `0 ${y2}px ${blur2}px ${shadowColor(hue, a2)}`;
    shadows.push({ level: lvl, css });
  }

  const cssVars =
    ":root {\n" +
    shadows.map((s) => `  --shadow-${s.level}: ${s.css};`).join("\n") +
    "\n}";

  return { levels, shadows, css: cssVars };
}
