# SkillForge

A growing library of **self-contained, runnable skills** — small, documented,
tested capabilities across many domains. Browse them in a frontend catalog, run
them from the CLI, or import them into any other project via the SDK.

The library grows over time (an autonomous loop adds skills), but every skill
follows the same contract, so the whole thing stays consistent and reviewable.

## Zero dependencies

Everything is plain Node ESM (Node ≥ 20). No install step, no build toolchain —
`git clone` and go. Tests use Node's built-in test runner.

```bash
node --test                 # run every skill's tests (the green gate)
node core/registry.mjs      # regenerate registry.json
node core/build-catalog.mjs # regenerate the browsable catalog/index.html
node core/cli.mjs list      # list all skills
node core/cli.mjs run design/palette-gen '{"base":"#3B7A57"}'
```

Open `catalog/index.html` in a browser to search and browse the catalog.

## Use from another project

```js
import { runSkill, listSkills } from "skillforge/core/sdk.mjs";

const res = await runSkill("finance/sma-backtest", { prices, fast: 10, slow: 30 });
```

Callers depend on skill **ids**, never file paths.

## Domains (seeded)

| Domain | Seed skill | What it does |
| --- | --- | --- |
| `design` | `design/palette-gen` | Accessible palette from one base color (WCAG contrast) |
| `devtools` | `devtools/code-review` | Heuristic static review of a code snippet |
| `finance` | `finance/sma-backtest` | SMA-crossover strategy backtest vs. buy-and-hold |
| `research` | `research/extractive-summary` | TF-based summary + keyword extraction |

More domains and skills are tracked in [`BACKLOG.md`](./BACKLOG.md).

## The skill contract

Each skill is a folder under `skills/<domain>/<name>/` with:

- `skill.mjs` — exports `meta` (manifest) and `run(input)` (pure where possible)
- `skill.test.mjs` — `node:test` cases; must pass for the skill to ship
- `README.md` — optional, for anything non-obvious

See [`SKILL_SPEC.md`](./SKILL_SPEC.md) for the manifest fields and rules.

## Sourcing & licensing

Skills are original implementations, optionally **informed** by permissively
licensed (MIT/Apache/BSD) references. Each `meta.source` records attribution.
No wholesale copying, no scraping of license-incompatible code.
