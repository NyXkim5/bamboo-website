# SkillForge Backlog

The autonomous loop pulls from here. Keep tasks small (one skill or one core
feature each). Every skill ships with passing `node:test` cases. Alternate across
domains so the library grows broadly, not just deep in one place.

## Loop protocol
1. Sync the branch.
2. Pick the top 1–3 unchecked tasks (spread across domains).
3. Build each skill per `SKILL_SPEC.md`. Original code; attribute references in `meta.source`.
4. Green gate: `node --test` must pass.
5. Regenerate: `node core/registry.mjs && node core/build-catalog.mjs`.
6. Commit one skill per commit; push. Check off + refill this backlog.
7. End the turn.

Guardrails: no scraping of license-incompatible code; no secrets; network skills
keep a pure, testable core and tag `"network"`.

---

## Core platform
- [x] Skill contract + registry + SDK + CLI + browsable catalog
- [ ] JSON-schema validation of `meta` in the registry loader
- [ ] `core/new-skill.mjs` scaffolder (generates folder + stub + test)
- [ ] Catalog: live-run a *pure* skill in-browser (bundle pure skills to the page)
- [ ] GitHub Action: run `node --test` on every push (CI green gate)
- [ ] Publish `registry.json` so other repos can fetch the index over HTTP

## finance
- [x] `finance/sma-backtest` — SMA crossover backtest
- [ ] `finance/price-history` — fetch OHLC from a public API (network; pure parser core)
- [ ] `finance/rsi` — Relative Strength Index indicator
- [ ] `finance/portfolio-metrics` — Sharpe, volatility, max drawdown from returns
- [ ] `finance/sector-screener` — filter a ticker list by sector (e.g. defense) + metrics

## devtools
- [x] `devtools/code-review` — heuristic static review
- [ ] `devtools/diff-summary` — summarize a unified git diff into a changelog line
- [ ] `devtools/conventional-commit` — validate/generate Conventional Commit messages
- [ ] `devtools/ci-pipeline-gen` — emit a CI YAML from a project description
- [ ] `devtools/test-scaffold` — generate a test stub from a function signature

## design
- [x] `design/palette-gen` — accessible palette generator
- [ ] `design/contrast-check` — WCAG AA/AAA pass/fail for a fg/bg pair
- [ ] `design/type-scale` — modular typographic scale from a base + ratio
- [ ] `design/spacing-tokens` — generate a spacing scale + CSS variables

## research
- [x] `research/extractive-summary` — TF summary + keywords
- [ ] `research/dedupe` — near-duplicate detection across a list of texts
- [ ] `research/readability` — Flesch reading-ease + grade level
- [ ] `research/feed-parse` — RSS/Atom parser (network; pure parser core)

## Needs human input
- Live in-browser execution vs. a small run server — decide before building the API.

## Changelog
- 2026-07-13: Bootstrapped platform + 4 seed skills (one per domain), all tested.
