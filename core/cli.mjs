#!/usr/bin/env node
// CLI: browse and run skills from the terminal.
//
//   node core/cli.mjs list [domain]
//   node core/cli.mjs show <id>
//   node core/cli.mjs run  <id> '<json-input>'
//
import { listSkills, getSkill, runSkill } from "./sdk.mjs";

const [cmd, arg1, arg2] = process.argv.slice(2);

function die(msg) {
  console.error(msg);
  process.exit(1);
}

switch (cmd) {
  case "list": {
    const skills = await listSkills(arg1 ? { domain: arg1 } : {});
    const byDomain = {};
    for (const m of skills) (byDomain[m.domain] ??= []).push(m);
    for (const domain of Object.keys(byDomain).sort()) {
      console.log(`\n${domain}`);
      for (const m of byDomain[domain]) console.log(`  ${m.id.padEnd(32)} ${m.description.slice(0, 60)}`);
    }
    console.log(`\n${skills.length} skill(s).`);
    break;
  }
  case "show": {
    if (!arg1) die("usage: cli.mjs show <id>");
    const { meta } = await getSkill(arg1);
    console.log(JSON.stringify(meta, null, 2));
    break;
  }
  case "run": {
    if (!arg1) die("usage: cli.mjs run <id> '<json-input>'");
    let input = {};
    if (arg2) {
      try { input = JSON.parse(arg2); } catch { die(`invalid JSON input: ${arg2}`); }
    }
    const result = await runSkill(arg1, input);
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  default:
    console.log("SkillForge CLI\n  list [domain]\n  show <id>\n  run <id> '<json-input>'");
}
