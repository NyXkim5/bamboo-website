// SDK: the stable surface other projects import to use SkillForge.
//
//   import { runSkill, listSkills } from "skillforge/core/sdk.mjs";
//   const res = await runSkill("finance/sma-backtest", { prices, fast: 10, slow: 30 });
//
// This indirection means callers depend on skill *ids*, not file paths.

import { loadSkills } from "./registry.mjs";

let _cache = null;
async function all() {
  if (!_cache) _cache = await loadSkills();
  return _cache;
}

export async function listSkills({ domain } = {}) {
  const skills = await all();
  return skills
    .filter((s) => !domain || s.meta.domain === domain)
    .map((s) => s.meta);
}

export async function getSkill(id) {
  const skills = await all();
  const found = skills.find((s) => s.meta.id === id);
  if (!found) throw new Error(`unknown skill: ${id}`);
  return found;
}

export async function runSkill(id, input = {}) {
  const skill = await getSkill(id);
  return skill.run(input);
}
