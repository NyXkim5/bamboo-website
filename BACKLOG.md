# 24/7 Build Backlog

> ⛔ **LOOP PAUSED BY USER (2026-07-13).** The user said "pause all actions for now".
> If you are a cron loop iteration reading this: do **NOTHING** — no bamboo work, no
> SkillForge work, no commits. Just end the turn immediately. Do not resume until the
> user explicitly says to resume.

This file is the task queue for the autonomous build loop. An hourly cron trigger
wakes the session, which pulls the top unchecked task(s) from here, ships them, and
refills the queue. Keep tasks small (roughly one commit each) and always leave the
tree green (`pnpm test`, `pnpm type-check`, `pnpm lint`).

## Loop protocol (read every iteration)

1. **Sync**: `git fetch origin && git checkout claude/github-connection-fi25fl`.
   If its PR was already merged, rebase onto latest `main` (keep same branch name).
2. **Pick**: take the top 1–3 unchecked `[ ]` tasks. Prefer Track A and Track B
   alternately so both keep moving.
3. **Build**: implement. Read `node_modules/next/dist/docs/` before touching Next.js
   code — this Next.js has breaking changes vs. training data.
4. **Verify (green gate)**: `pnpm type-check && pnpm lint && pnpm test` must pass.
   For UI changes, capture a screenshot via `scripts/capture-screens.mjs` when useful.
5. **Commit + push**: one focused commit per task, descriptive message, push with
   `git push -u origin claude/github-connection-fi25fl` (retry w/ backoff on network).
6. **Refill**: check off `[x]` finished tasks. Add any new tasks discovered (esp.
   issues the Toolkit surfaced). The backlog should never be empty.
7. **End the turn.** The cron re-fires next hour. Do not busy-wait.

Guardrails: never touch secrets/`.env`; no destructive git; keep each change reviewable;
if a task is ambiguous or architectural, note it under "Needs human input" and skip it.

---

## Track A — Website (bamboonutrition.app)

### Now
- [x] Add canonical URLs to every route (found by `audit:meta`) — layout + 3 sub-pages
- [ ] Add per-page OpenGraph + Twitter card to /privacy, /terms, /support (audit: nice-to-have)
- [ ] Waitlist form: add `aria-invalid` on error + polite `aria-live` status for loading/success

Verified already shipped (audited 2026-07-13, no work needed):
- [x] ~~OpenGraph/Twitter card image + metadata~~ — present in `layout.tsx` + `/og-image.png`
- [x] ~~"How it works" 3-step section~~ — present in `page.tsx` (STEPS)
- [x] ~~`prefers-reduced-motion` guards~~ — covered in `globals.css` + confetti-burst
- [x] ~~Footer with Privacy/Terms/Support nav~~ — present in `page.tsx`
- [x] ~~Waitlist inline success/error states~~ — SuccessCard + `role="alert"` error

### Next
- [ ] Nutrition-focused hero copy A/B variants behind a simple config flag
- [ ] Add JSON-LD FAQPage structured data driven from the FAQ component data
- [ ] Skeleton/loading state for the waitlist counter
- [ ] Add a `/thanks` post-signup page with share buttons
- [ ] Dark mode support via CSS variables + `prefers-color-scheme`
- [ ] Add unit tests for `waitlist-form` validation edge cases

### Ideas (groom later)
- [ ] Blog/changelog route with MDX
- [ ] i18n scaffolding (en + ko, since audience skews bilingual)
- [ ] Analytics-free privacy-first event pings

## Track B — Toolkit (`tools/` workspace package)

The toolkit audits the website and files findings back into Track A.

### Bootstrap
- [x] Create `tools/` package (`@bamboo/tools`) with a zero-dep runner + README
- [x] `audit:meta` — assert every route has title, description, canonical, OG tags
      (writes findings to `docs/audits/meta.md`; wired to `pnpm audit:meta`)
- [ ] `audit:links` — crawl routes for dead internal links + missing public assets
- [ ] `audit:a11y` — puppeteer + axe-core scan of key pages, report violations
- [ ] `audit:perf` — flag oversized images, render-blocking hints, missing dimensions

### Next
- [ ] `check:content` — lint copy for TODO/placeholder/lorem, broken product claims
- [ ] Wire toolkit into a `pnpm audit:site` script that writes findings to `docs/audits/`
- [ ] Have the loop convert each audit finding into a checked-in Track A task
- [ ] Snapshot test: render each route, diff DOM structure to catch regressions

---

## Needs human input
- (none yet)

## Changelog
- 2026-07-13: Backlog created; loop engine (hourly cron) wired up.
- 2026-07-13: Bootstrapped `@bamboo/tools` + `audit:meta`. Audited Track A: most
  "Now" items were already shipped (checked off). Fixed the one real gap the audit
  found — canonical URLs on all 4 routes. Next audit target: per-page OG on legal pages.
