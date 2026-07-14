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
- [x] `finance/rsi` — Relative Strength Index indicator (Wilder's smoothing)
- [x] `finance/portfolio-metrics` — Sharpe, volatility, annualized return, max drawdown
- [ ] `finance/price-history` — fetch OHLC from a public API (network; pure parser core)
- [ ] `finance/sector-screener` — filter a ticker list by sector (e.g. defense) + metrics
- [x] `finance/macd` — MACD indicator (12/26/9)
- [x] `finance/bollinger` — Bollinger Bands (SMA ± k·stddev)
- [x] `finance/atr` — Average True Range volatility measure
- [ ] `finance/position-size` — risk-based position sizing from stop distance + account risk
- [ ] `finance/sharpe-rolling` — rolling Sharpe ratio over a window

## devtools
- [x] `devtools/code-review` — heuristic static review
- [x] `devtools/conventional-commit` — validate/parse Conventional Commit messages
- [ ] `devtools/diff-summary` — summarize a unified git diff into a changelog line
- [x] `devtools/semver-bump` — compute the next version from commit types
- [x] `devtools/test-scaffold` — generate a test stub from a function signature
- [ ] `devtools/ci-pipeline-gen` — emit a CI YAML from a project description
- [ ] `devtools/env-validate` — check a .env against a required-keys schema

## design
- [x] `design/palette-gen` — accessible palette generator
- [x] `design/contrast-check` — WCAG AA/AAA pass/fail for a fg/bg pair
- [x] `design/type-scale` — modular typographic scale from a base + ratio
- [x] `design/spacing-tokens` — generate a spacing scale + CSS variables
- [x] `design/gradient-gen` — perceptually-even multi-stop gradient from 2 colors
- [x] `design/shadow-scale` — layered elevation shadow tokens
- [ ] `design/aspect-ratios` — common aspect-ratio helpers + CSS

## research
- [x] `research/extractive-summary` — TF summary + keywords
- [x] `research/readability` — Flesch reading-ease + grade level
- [x] `research/dedupe` — near-duplicate detection across a list of texts
- [x] `research/keyword-density` — term frequency / density report for SEO
- [ ] `research/feed-parse` — RSS/Atom parser (network; pure parser core)
- [ ] `research/sentiment` — lexicon-based sentiment score

## Needs human input
- Live in-browser execution vs. a small run server — decide before building the API.

## Changelog
- 2026-07-13: Bootstrapped platform + 4 seed skills (one per domain), all tested.
- 2026-07-13: Added finance/rsi and design/contrast-check. 6 skills, 37 tests green.
- 2026-07-13: Added finance/portfolio-metrics, devtools/conventional-commit,
  design/type-scale, research/readability. 10 skills, 61 tests green.
- 2026-07-13: Added finance/macd, design/spacing-tokens, research/dedupe.
  13 skills, 79 tests green.
- 2026-07-13: Added finance/bollinger, devtools/semver-bump, design/gradient-gen.
  16 skills, 99 tests green.
- 2026-07-13: Added finance/atr, devtools/test-scaffold, design/shadow-scale,
  research/keyword-density. 20 skills, 122 tests green.
