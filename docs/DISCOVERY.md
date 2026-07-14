# SkillForge — Discovery Report

Open-source prior-art, reference implementations, data sources, and learning
resources for every part of SkillForge, gathered via web research (2026-07).

**How to use this:** these are for *reference, correctness cross-checks, and
attribution* — SkillForge stays zero-dependency, so we learn from / verify
against these rather than taking a runtime dependency. When a permissive
(MIT/ISC/BSD/Apache-2.0) source informs a skill, record it in that skill's
`meta.source`. **Copyleft (GPL/LGPL/AGPL) and share-alike data (ODbL) are
flagged in bold — study the ideas, never copy the code/data into our tree.**

Links were live in search results at gather time; licenses are confirmed where
noted and flagged "verify" otherwise. Video quality was not vetted beyond
titles — treat as starting points.

---

## Top upgrades this surfaced (ranked)

1. **Design: move `palette-gen` + `gradient-gen` from HSL → OKLCH/OKLab.** HSL
   isn't perceptually uniform (equal-L colors look unequally bright), giving
   uneven ramps and muddy mid-gradients. OKLCH is where Tailwind v4, Radix, and
   culori all went. Port Björn Ottosson's compact OKLab↔sRGB math to stay
   zero-dep. **Highest quality-per-effort win.**
2. **Research: replace the hand-built sentiment lexicon with AFINN-165 + VADER
   rules.** Much better coverage and a proven negation/intensifier/caps rule
   layer that fits our existing design. ⚠️ AFINN data is **ODbL** (attribution +
   share-alike) — honor that if we vendor the wordlist.
3. **Platform: align our manifest with Anthropic's Agent Skills format.** A skill
   = folder + `SKILL.md`/frontmatter + progressive disclosure. Adopting the same
   `name`/`description` conventions makes our skills portable to the agent
   ecosystem.
4. **Devtools: base `semver-bump` on semantic-release's commit-analyzer mapping
   and hardcode types from `@commitlint/config-conventional`** (both MIT).
5. **Platform: add the CI green-gate** (`node --test` matrix workflow — canonical
   YAML below) and **JSON-Schema manifest validation** (Ajv in dev/CI, not the
   runtime SDK, to preserve zero-dep).
6. **Finance: cross-check indicator math against TA-Lib / Tulip / `@ixjb94/
   indicators`**, and wire `price-history` to **Stooq (no API key)** with Alpha
   Vantage / Tiingo as keyed fallbacks. Seed `sector-screener`'s defense universe
   from **ITA/XAR ETF holdings CSVs** (free) instead of licensing GICS.

---

## Finance

### Technical-analysis libraries (reference / verification)
| Name | URL | License | Use |
|---|---|---|---|
| @ixjb94/indicators | https://github.com/ixjb94/indicators | MIT | **Zero-dep TS, 100+ indicators, TradingView-tested — closest architectural match.** Best reference. |
| technicalindicators | https://github.com/anandanand84/technicalindicators | MIT | De-facto JS TA lib; match our RSI/MACD/Bollinger/ATR outputs against it. |
| TA-Lib | https://github.com/TA-Lib/ta-lib | BSD | Canonical reference for Wilder's RSI/ATR smoothing. Safe to consult. |
| Tulip Indicators | https://tulipindicators.org/ | **LGPL-3.0** | Precise ANSI-C formulas + docs. Reference only — do not copy source. |
| pandas-ta (classic fork) | https://github.com/xgboosted/pandas-ta-classic | MIT | 130+ indicators; edge-case cross-checks. |

### Backtesting frameworks (architecture study)
| Name | URL | License | Note |
|---|---|---|---|
| zipline-reloaded | https://github.com/stefan-jansen/zipline-reloaded | Apache-2.0 | **Most permissive full framework** — safe to borrow event-driven patterns. |
| vectorbt | https://github.com/polakowo/vectorbt | Apache-2.0 + **Commons Clause** | Vectorized equity-curve/metrics; reference (selling restricted). |
| backtrader | https://github.com/mementum/backtrader | **GPL-3.0** | Rich engine design (broker/slippage/orders). Learn architecture only. |
| backtesting.py | https://github.com/kernc/backtesting.py | **AGPL-3.0** | Elegant single-strategy API to study for `sma-backtest` ergonomics. Don't copy. |

### Free market-data APIs for `price-history`
| Provider | Auth | Free limits | Note |
|---|---|---|---|
| **Stooq** (CSV) | none | informal | `https://stooq.com/q/d/l/?s=aapl.us&i=d` — zero-friction default, no key. Undocumented/no SLA. |
| Alpha Vantage | free key | 5/min, 500/day | Clean JSON/CSV daily OHLC. |
| Tiingo | free token | ~1000/day | Good EOD quality. |
| Financial Modeling Prep | free key | ~250/day | Also useful for sector-screener fundamentals (US-only free). |
| Yahoo (yahoo-finance2) | none | best-effort | https://github.com/gadicc/node-yahoo-finance2 — rich but unofficial/fragile. |
| Polygon.io | key | no real free tier | Skip for a free library. |

**Recommendation:** `price-history` → Stooq default, Alpha Vantage/Tiingo fallbacks. Keep a pure parser core (tag `network`), so tests run offline on fixture CSVs.

### Defense-sector screening (for `sector-screener`)
- **GICS taxonomy** (Aerospace & Defense is a sub-industry under Industrials): https://www.msci.com/indexes/index-resources/gics — methodology public, ticker mapping proprietary.
- **iShares ITA holdings CSV** (free authoritative constituent list): https://www.ishares.com/us/products/239502/ishares-us-aerospace-defense-etf
- **SPDR XAR / S&P A&D Select Industry Index**: https://www.spglobal.com/spdji/en/indices/equity/sp-aerospace-defense-select-industry-index/
- **Practical path:** seed the "defense" universe from ITA/XAR published holdings rather than licensing GICS.

### Videos
- Backtesting.py walkthrough — https://www.youtube.com/watch?v=T3PT4eV8xFU
- Position-sizing formula — https://www.youtube.com/watch?v=LX8QNGzKKM4
- QuantInsti "best algo-trading videos" list — https://blog.quantinsti.com/best-algorithmic-trading-videos/

---

## Devtools

### Conventional Commits + release ecosystem
| Name | URL | License | Borrow for |
|---|---|---|---|
| commitlint | https://github.com/conventional-changelog/commitlint | MIT | Rule model (type/scope/subject enums) for `conventional-commit`. |
| @commitlint/config-conventional | (same repo) | MIT | Canonical allowed-type list to hardcode. |
| semantic-release | https://github.com/semantic-release/semantic-release | MIT | commit→release mapping (feat→minor, fix→patch, BREAKING→major) for `semver-bump`. |
| node-semver | https://github.com/npm/node-semver | ISC | Reference `inc()` semantics. |
| release-please | https://github.com/googleapis/release-please | Apache-2.0 | Grouping commits → changelog: reference for `diff-summary`. |

### Static analysis / lint ideas (for `code-review`)
| Name | URL | License | Note |
|---|---|---|---|
| ESLint custom-rules guide | https://eslint.org/docs/latest/extend/custom-rules | MIT (docs) | AST-visitor rule architecture if we go AST-based. |
| eslint-plugin-sonarjs | https://github.com/SonarSource/eslint-plugin-sonarjs | **LGPL-3.0** | Rich code-smell catalog — reimplement *ideas*, don't copy. |
| AST Explorer | https://astexplorer.net | tool | Prototype heuristics interactively. |

### Env validation (for `env-validate`)
| Name | URL | License | Borrow |
|---|---|---|---|
| envalid | https://github.com/af/envalid | MIT | Closest analog: str/bool/num/port/url validators + fail-fast. |
| znv | https://github.com/lostfictions/znv | MIT | Smart "true"/"1"/"yes"→bool coercion rules. |
| dotenv | https://github.com/motdotla/dotenv | BSD-2 | `.env` format reference. |

### Diff / changelog (for `diff-summary`)
| Name | URL | License | Note |
|---|---|---|---|
| parse-diff | https://github.com/sergeyt/parse-diff | MIT | Unified-diff parser (files/hunks/+/−). Primary reference. |
| git-cliff | https://github.com/orhun/git-cliff | MIT/Apache-2.0 | Regex commit-grouping config = design model for summaries. |

### CI generation (for `ci-pipeline-gen`)
- **actions/starter-workflows** (MIT) — https://github.com/actions/starter-workflows — ready-made YAML to emit/adapt.

### Videos
- Automated semantic releases — https://www.youtube.com/watch?v=mxPfbwJ0FiU
- GitHub Actions CI/CD (TechWorld with Nana) — https://www.youtube.com/watch?v=R8_veQiYBjI
- ESLint custom rules (Maxime Heckel) — https://blog.maximeheckel.com/posts/how-to-build-first-eslint-rule/

---

## Design

### Color libraries
| Name | URL | License | Best at |
|---|---|---|---|
| **culori** | https://github.com/Evercoder/culori | MIT | **OKLCH/OKLab/LAB + interpolation + ΔE.** Used by Tailwind v4 & Radix. The enabler if we allow one design dep. |
| chroma.js | https://github.com/gka/chroma.js | BSD (current) | LAB/LCH scales & gradients, ColorBrewer. (Pre-0.4 was GPL — use current.) |
| colord | https://github.com/omgovich/colord | MIT | Tiny zero-dep parse/manipulate core (LAB/LCH via plugins). |
| Color.js | https://colorjs.io/ | MIT | Reference-grade, huge color-space coverage (by CSS spec editors). |

**Recommendation:** adopt **OKLCH/OKLab** for `palette-gen` + `gradient-gen`. Port Ottosson's compact OKLab↔sRGB math to stay zero-dep, or use culori (MIT) if we relax the rule for design.

### Design-token systems
| Name | URL | License | Learn |
|---|---|---|---|
| Style Dictionary | https://styledictionary.com/ | Apache-2.0 | Token schema + transform pipeline (one source → CSS/JS/iOS). Model `spacing-tokens`/`type-scale` output. |
| Radix Colors | https://github.com/radix-ui/colors | MIT | **12-step semantic scale** with fixed roles per step — model `palette-gen` output on this for real usability. |
| Tailwind color | https://tailwindcss.com/docs/customizing-colors | MIT | v4 regenerated its palette in OKLCH — precedent for our move; 50–950 ramp convention. |

### WCAG contrast (authoritative — for `contrast-check`)
- Relative luminance: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
- Contrast ratio: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio (AA 4.5 / 3 large; AAA 7 / 4.5 large)
- **APCA** (WCAG 3 candidate): https://github.com/Myndex/apca-w3 — ⚠️ **non-standard license + "APCA™" trademark; audit before shipping.** Keep WCAG 2.1 as default, APCA as clearly-labeled optional mode.

### Type scale
- Modular Scale (original): https://www.modularscale.com/ · Typescale: https://typescale.io/ — `size = base · ratio^n`; named ratios (1.2/1.25/1.333/1.618).

### Videos
- "Why everyone is talking about OKLCH" — https://www.youtube.com/watch?v=kVi9Augt7HY
- CSS relative colors → palettes from one color — https://www.youtube.com/watch?v=w-AxZt9-hHg
- Evil Martians "OKLCH in CSS" (written) — https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl

---

## Research / NLP

### JS NLP libraries
| Name | URL | License | Borrow |
|---|---|---|---|
| natural | https://github.com/NaturalNode/natural | MIT | Stemmers, TF-IDF, n-grams — reference for summary/keyword skills. |
| wink-nlp | https://github.com/winkjs/wink-nlp | MIT | Fast tokenizer + sentence boundaries + negation — improve sentiment. |
| compromise | https://github.com/spencermountain/compromise | MIT | POS tagging for smarter phrase extraction. |
| franc | https://github.com/wooorm/franc | MIT | Trigram language detection — a language gate before NLP skills. |
| sbd | https://github.com/Tessmore/sbd | MIT | Robust sentence splitting (skips URLs/abbrev). |

### Sentiment (upgrade `sentiment`)
| Name | URL | License | Note |
|---|---|---|---|
| afinn-165 | https://github.com/words/afinn-165 | code MIT; **data ODbL** | 3,382-word valence JSON — drop-in replacement for our tiny lexicon. Honor ODbL attribution/share-alike. |
| VADER | https://github.com/cjhutto/vaderSentiment | MIT | Rule layer (negation/intensifier/caps/punct) to emulate. |
| sentiment (npm) | https://github.com/thisandagain/sentiment | MIT (bundles AFINN) | Architecture reference (AFINN + emoji + overrides). |

**Recommendation:** adopt afinn-165 coverage + VADER's rule layer; mind the ODbL obligation on the data.

### Summarization (upgrade `extractive-summary`)
- **TextRank** (Mihalcea & Tarau 2004): https://web.eecs.umich.edu/~mihalcea/papers/mihalcea.emnlp04.pdf — PageRank over sentence-similarity graph. Cheapest upgrade from raw TF.
- **LexRank** (Erkan & Radev): https://arxiv.org/pdf/1109.2128
- npm `textrank` (ISC) for reference.

### Readability (extend `readability`)
- **retext-readability** (MIT): https://github.com/retextjs/retext-readability — correct constants for Dale-Chall, ARI, Coleman-Liau, SMOG, Gunning-Fog.
- **text-readability** (verify): textstat JS port covering all formulas.

### RSS/Atom (for `feed-parse`)
- **fast-xml-parser** (MIT): https://github.com/NaturalIntelligence/fast-xml-parser — pure-JS base to hand-roll RSS/Atom mapping zero-dep.
- rss-parser (MIT) / node-feedparser (MIT) — correctness references for edge cases.

### Near-duplicate (scale `dedupe`)
- **Mining of Massive Datasets, Ch.3** (shingling → MinHash → LSH): https://web.stanford.edu/class/cs246/ (LSH slides: https://web.stanford.edu/class/cs246/slides/03-lsh.pdf) — upgrade O(n²) Jaccard to LSH buckets.
- Practical explainer: https://www.pinecone.io/learn/series/faiss/locality-sensitive-hashing/

### Videos
- Stanford MMDS (LSH lectures) — https://www.youtube.com/playlist?list=PLLssT5z_DsK9JDLcT8T62VtzwyW9LNepV
- TF-IDF intuition (Krish Naik) — https://www.youtube.com/watch?v=BEOn6RynAZQ
- TextRank + spaCy summarization — https://www.youtube.com/watch?v=qtLk2x59Va8

---

## Platform / architecture

### Skill/tool library prior-art
| Name | URL | License | Model |
|---|---|---|---|
| **Anthropic Agent Skills** | https://github.com/anthropics/skills | mixed (Apache-2.0 / source-available) | **Closest analog: skill = folder + `SKILL.md` (YAML frontmatter name+description) + progressive disclosure.** Align our manifest conventions. Spec: https://agentskills.io/specification |
| "Writing effective tools for agents" | https://www.anthropic.com/engineering/writing-tools-for-agents | article | How to write discoverable `description`s. |
| LangChain Tools | https://github.com/langchain-ai/langchain | MIT | name + description + args_schema (auto-inferred). |
| LlamaIndex Tools | https://github.com/run-llama/llama_index | MIT | `to_langchain_structured_tool()` — build export adapters so other ecosystems consume our skills. |
| OpenAI function calling | https://developers.openai.com/api/docs/guides/function-calling | docs | Manifest-as-JSON-Schema + `strict` conformance. |

### Registry / plugin patterns
| Name | URL | License | Borrow |
|---|---|---|---|
| Backstage catalog | https://backstage.io/docs/features/software-catalog/descriptor-format/ | Apache-2.0 | `apiVersion/kind/metadata/spec` descriptor + catalog graph — model for `registry.json`. |
| Vite Plugin API | https://vite.dev/guide/api-plugin | MIT | Factory-returns-object + `name`-prefix discovery convention. |
| ESLint plugins | https://eslint.org/docs/latest/extend/plugins | MIT | Convention-based discovery of hundreds of named units. |

### Manifest validation (backlog item)
- **Ajv** (MIT, JSON Schema 2020-12): https://ajv.js.org/ — validate manifests in **dev/CI** (has deps) to keep the runtime SDK zero-dep. `ajv-cli` for the CI gate.
- **Zod** (MIT, zero-dep) if we prefer code-defined schemas (but schema won't ship in `registry.json`).

### Static catalog site (optional upgrade from our hand-rolled HTML)
- **Eleventy** (MIT) — closest to "generate HTML from `registry.json`". **Astro/Starlight** (MIT) for a batteries-included browsable catalog. **Storybook** (MIT) as UX reference for presenting runnable units + autodocs.

### Distribution (so other repos import SkillForge)
- **JSR** (jsr.io) — ESM-only, no build step, cross-runtime. **Excellent fit for a zero-dep ESM lib.**
- **esm.sh / esm.unpkg.com** — serve skills as browser ESM by URL (enables in-browser live-run + serving `registry.json` over HTTP).
- **npm publish** with `--access public --provenance` from CI.

### CI green-gate (ready to drop in `.github/workflows/ci.yml`)
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ['20.x', '22.x']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: node --test
      - run: node core/registry.mjs   # fail if registry drifts
```

### Videos
- "Building tools for agents — with agents" (Anthropic) — https://www.youtube.com/watch?v=LjjaMduwzAg
- "So you think you understand JSON Schema?" (Ben Hutton) — https://www.youtube.com/watch?v=vMG0NCDifI0
- Ryan Dahl introduces JSR — https://www.youtube.com/watch?v=MFCn4ce5dVc

---

## License summary (what we may borrow vs. only study)

- **Safe to adapt with attribution** (MIT/ISC/BSD/Apache-2.0): @ixjb94/indicators, technicalindicators, TA-Lib, zipline-reloaded, all devtools ecosystem libs, culori/chroma.js(current)/colord, Style Dictionary, Radix Colors, Tailwind, natural/wink-nlp/compromise/franc/sbd, VADER, fast-xml-parser, retext-readability, Ajv, Zod, Backstage, Vite, ESLint, Eleventy/Astro/Storybook, actions/*.
- **Study ideas only — do NOT copy source** (copyleft): **Tulip (LGPL)**, **backtrader (GPL)**, **backtesting.py (AGPL)**, **eslint-plugin-sonarjs/SonarJS (LGPL)**, **vectorbt (Commons Clause)**.
- **Share-alike data** (attribution + keep-open if vendored): **AFINN / afinn-165 wordlist (ODbL)**.
- **Audit before shipping**: **APCA / apca-w3** (non-standard license + "APCA™" trademark).

*Uncertainty:* several licenses were inferred from strong public knowledge or npm listings rather than opening each LICENSE file (noted inline in the raw agent reports). Confirm the specific LICENSE before vendoring any code or data.
