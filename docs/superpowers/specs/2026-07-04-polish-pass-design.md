# Bamboo Website Polish Pass

Date: 2026-07-04
Status: Approved by Jay (Approach A)

## Purpose

Make the site feel like the product it sells: playful, fast, and effortless to join. Three directions, all confirmed: playful delight, a proper replacement for the collage section, and mobile conversion. The site's job is unchanged: convert visitors into waitlist signups.

## Context

- Repo: `~/bamboo-website`, Next.js 16.2.9, React 19, Tailwind v4. All prior audit fixes are merged to main.
- Screenshot review found one clear defect: the "Your daily dashboard with Bao" section stacks three 1200px collage images (`public/panda/card-1/2/3.png`, ~5 MB of sources). On mobile they render illegibly at 390px. The section repeats content the interactive showcase already covers and adds ~a third of total page length.
- The site is otherwise static, which undercuts the "feels like a game" pitch.
- No new dependencies. Every animation respects `prefers-reduced-motion`.

## Changes

### 1. Benefits strip replaces the collage section

New `src/app/benefits.tsx` (server component). Replaces the "Your daily dashboard with Bao" section in `page.tsx`. Three alternating image/text rows, echoing the OG image narrative:

1. "Track your day in seconds" — `screens/dashboard.png` + `panda/cooking.png`. Copy: fast logging, XP for every meal.
2. "Understand your stats at a glance" — `screens/macros.png` + `panda/writing.png`. Copy: weekly rings, macro breakdowns, clean-food percentage.
3. "Improve your gut, feel the difference" — `screens/gut-forecast.png` + `panda/broccoli.png`. Copy: fiber, fermented foods, plant diversity as one score.

Each row: phone-frame screenshot (about 220px wide on desktop, 200px centered on mobile), heading, two short sentences, small Bao accent image. Rows alternate direction on desktop (`md:flex-row` / `md:flex-row-reverse`), stack on mobile. Copy follows the writing rules: no em dashes, no semicolons, short active sentences.

Delete `public/panda/card-1.png`, `card-2.png`, `card-3.png`.

### 2. Showcase auto-cycle

`src/app/screen-showcase.tsx`: advance the active screen every 4 seconds. Any manual tab or thumbnail click stops auto-cycling for the rest of the session. Disabled entirely when `prefers-reduced-motion: reduce`. Implementation: one `useEffect` interval gated on a `userInteracted` state flag and a reduced-motion `matchMedia` check.

### 3. Confetti on signup success

New `src/app/confetti-burst.tsx` (client component). About 24 absolutely positioned particles in brand colors (`--green`, `--honey`, `--coral`, `--purple`), CSS keyframe fall-and-fade over about 1.5 seconds, rendered once on mount, `aria-hidden="true"`, `pointer-events: none`. Skipped under reduced motion via `matchMedia`. Keyframes live in `globals.css`. Zero dependencies.

Used inside the success card in `waitlist-form.tsx` for NEW signups only. The `already` state gets no confetti.

### 4. Bao in the success card

`src/app/waitlist-form.tsx` SuccessCard: add `panda/proud.png` (about 64px) with the existing `mascot-bounce` animation beside the success text. Shown for both new and already states.

### 5. Sticky mobile CTA

New `src/app/mobile-cta.tsx` (client component), rendered from `page.tsx`. Fixed bottom bar, `md:hidden`, white background with top border, containing one full-width "Get early access" button that anchor-links to `#get-early-access` (global smooth scroll already exists). Visible only while BOTH signup forms are off-screen: IntersectionObserver watching `#get-early-access` and a new `id="final-cta"` on the final CTA section. Bar animates in with a slide-up transition, none under reduced motion.

### 6. Mobile hero tightening

`page.tsx` hero: phone frame `w-[200px]` on mobile (unchanged `md:w-[260px]`), reduce hero top padding on mobile (`pt-10 md:pt-24`). Goal: first scroll lands on "See every screen" sooner.

## Error handling

- All new client components are presentation-only. No fetches, no new error paths.
- IntersectionObserver and matchMedia exist in every browser the site supports. No polyfills.

## Testing and verification

- No unit-test infrastructure added. All changes are visual or timing UI, consistent with the prior spec's stance (logic stays tested, UI stays visual).
- Gate: `pnpm run lint`, `pnpm run type-check`, `pnpm test` (existing 8), `pnpm build` all pass.
- Visual acceptance: fresh full-page screenshots at 1440px and 390px, reviewed against each of the six changes. Auto-cycle and confetti verified in a headed check via script (screenshot after 5s shows a different active tab; screenshot after submit shows confetti nodes in DOM).

## Out of scope

- Hero redesign or in-phone animated carousel (Approach C, rejected).
- New dependencies (Lottie, canvas-confetti).
- Waitlist counter changes (Jay ruled: stays as-is).
- Any copy or structure changes beyond the sections named above.
