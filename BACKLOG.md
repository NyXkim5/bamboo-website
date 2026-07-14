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
- [x] Zero-dep manifest validation in the registry loader (types, id/path/domain match, dup-id, semver) + tests
- [x] `core/new-skill.mjs` scaffolder (generates an already-green folder + stub + test)
- [x] Catalog: live-run a *pure* skill in-browser (blob-module import; verified in Chromium)
- [x] GitHub Action: run `node --test` on every push (CI green gate) + registry drift check
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
- [x] `finance/position-size` — risk-based position sizing from stop distance + account risk
- [ ] `finance/sharpe-rolling` — rolling Sharpe ratio over a window
- [ ] `finance/compound` — compound-interest / CAGR calculator

## devtools
- [x] `devtools/code-review` — heuristic static review
- [x] `devtools/conventional-commit` — validate/parse Conventional Commit messages
- [ ] `devtools/diff-summary` — summarize a unified git diff into a changelog line
- [x] `devtools/semver-bump` — compute the next version from commit types
- [x] `devtools/test-scaffold` — generate a test stub from a function signature
- [ ] `devtools/ci-pipeline-gen` — emit a CI YAML from a project description
- [x] `devtools/env-validate` — check a .env against a required-keys schema

## design
- [x] `design/palette-gen` — accessible palette generator
- [x] `design/contrast-check` — WCAG AA/AAA pass/fail for a fg/bg pair
- [x] `design/type-scale` — modular typographic scale from a base + ratio
- [x] `design/spacing-tokens` — generate a spacing scale + CSS variables
- [x] `design/gradient-gen` — perceptually-even multi-stop gradient from 2 colors
- [x] `design/shadow-scale` — layered elevation shadow tokens
- [x] `design/aspect-ratios` — common aspect-ratio helpers + CSS

## research
- [x] `research/extractive-summary` — TF summary + keywords
- [x] `research/readability` — Flesch reading-ease + grade level
- [x] `research/dedupe` — near-duplicate detection across a list of texts
- [x] `research/keyword-density` — term frequency / density report for SEO
- [ ] `research/feed-parse` — RSS/Atom parser (network; pure parser core)
- [x] `research/sentiment` — lexicon-based sentiment score

## Discovery-driven upgrades (see docs/DISCOVERY.md)
- [ ] Port Ottosson OKLab↔sRGB math (zero-dep) → upgrade `palette-gen` + `gradient-gen` to OKLCH
- [ ] `design/palette-gen`: emit a Radix-style 12-step semantic scale option
- [ ] `research/sentiment`: swap in afinn-165 coverage + VADER-style intensifier/caps rules (mind ODbL attribution)
- [ ] `research/extractive-summary`: add a TextRank (graph-centrality) mode alongside TF
- [ ] `research/dedupe`: add MinHash+LSH mode to scale beyond O(n²)
- [ ] `finance/*`: add a fixtures-based cross-check test vs. TA-Lib/technicalindicators reference values
- [ ] `devtools/semver-bump`: align type→bump table with semantic-release; hardcode types from @commitlint/config-conventional
- [x] Add `.github/workflows/ci.yml` (node --test matrix + registry drift check)
- [x] Manifest validation as a CI gate (zero-dep validator in registry loader; runs under node --test / CI)
- [ ] Align skill manifest naming/description with Anthropic Agent Skills conventions
- [ ] Publish path: JSR (ESM, no build) + serve registry.json over HTTP via esm.sh/unpkg

## Post-limit follow-ups (do after usage resets)
- [ ] Harden pass for the 3 un-reviewed batch-3 skills: research/cosine-similarity,
      research/jaccard, research/title-case (build passed my gate, but skipped the council 2nd pass).

## Needs human input
- Live in-browser execution vs. a small run server — decide before building the API.
- Allow ONE design dependency (culori, MIT) for OKLCH, or keep strict zero-dep and port the math? (DISCOVERY.md recommends porting Ottosson's math.)
- `finance/price-history` + `sector-screener` need network access + (for some providers) an API key. Which providers do you have keys for? Stooq needs none.

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
- 2026-07-13: Added finance/position-size, devtools/env-validate,
  design/aspect-ratios, research/sentiment. 24 skills, 147 tests green.
- 2026-07-13: Added DISCOVERY.md (OSS/resource map for every domain).
- 2026-07-13: Council batch 1 (12 Fable agents build + 12 harden): stochastic-oscillator,
  obv, cagr, vwap, slugify, gitignore-gen, json-schema-infer, nearest-css-color,
  tailwind-shades, tokenize, tf-idf, ngrams. 36 skills, 299 tests green.
- 2026-07-13: Council batch 2: ema, roc, williams-r, sharpe-rolling, diff-summary,
  case-convert, cron-describe, oklch-convert, color-mix, levenshtein, stopwords,
  textrank-summary. 48 skills, 446 tests green.
- 2026-07-13: Interactive catalog — per-skill drawer + live in-browser "Try it"
  (blob-module import, verified in Chromium, zero page errors).
- 2026-07-13: Council batch 3: returns, max-drawdown, beta, kelly, uuid-inspect,
  json-diff, duration, palette-oklch, wcag-suggest, cosine-similarity, jaccard,
  title-case. 60 skills, 582 tests green. (Session usage limit hit mid-batch —
  4 harden agents didn't run; wcag-suggest needed a manual syntax fix.)
