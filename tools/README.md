# @bamboo/tools

Zero-dependency dev tools that **audit the website and file findings back into
`BACKLOG.md`**. This is Track B of the 24/7 build loop: each audit surfaces real
gaps, which become Track A tasks, which give the next audit more to check.

Run from the repo root:

```bash
pnpm audit:meta          # scan every route for SEO/social metadata coverage
pnpm audit:meta:strict   # same, but exit non-zero on missing required fields (CI)
```

Findings are written to `docs/audits/` for the loop to convert into tasks.

## Checks

| Command | What it does |
| --- | --- |
| `audit-meta.mjs` | Every App Router route has title, description, canonical, OG, Twitter card |

## Roadmap (see `BACKLOG.md` → Track B)

- `audit-links.mjs` — dead internal links + missing public assets
- `audit-a11y.mjs` — puppeteer + axe-core scan of key pages
- `audit-perf.mjs` — oversized images, missing dimensions, render-blocking hints
