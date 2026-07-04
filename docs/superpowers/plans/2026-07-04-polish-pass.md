# Bamboo Website Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the illegible collage section with a readable benefits strip, add on-brand motion (showcase auto-cycle, signup confetti, Bao in the success card), and add a mobile conversion path (sticky CTA, tighter hero).

**Architecture:** Each change is one focused component. `benefits.tsx` (server) replaces the collage section in `page.tsx`. `confetti-burst.tsx` and `mobile-cta.tsx` are small self-contained client components. Auto-cycle is a single effect added to the existing `screen-showcase.tsx`. All motion is CSS-driven and gated on `prefers-reduced-motion`.

**Tech Stack:** Next.js 16.2.9 (App Router), React 19, Tailwind v4, pnpm. NO new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-04-polish-pass-design.md`

## Global Constraints

- TypeScript strict mode. Never use `any`.
- Use `pnpm`, never npm or yarn.
- Functional components. Named exports (none of these are pages).
- Functions under 40 lines where feasible. JSX-heavy render bodies follow existing file patterns.
- NO new dependencies. Confetti is hand-rolled CSS.
- Every animation respects `prefers-reduced-motion: reduce` (via `matchMedia` in JS, the existing reduced-motion block in `globals.css`, or Tailwind `motion-reduce:` variants).
- `Math.random()` is allowed in client components but NOT needed — confetti uses deterministic index-based pseudo-random values (see Task 3 code).
- Prose copy: no em dashes, no semicolons, short active sentences.
- Internal page navigation uses `Link` from `next/link`; in-page anchors (`#get-early-access`) stay `<a>`.
- Commit messages: imperative present tense. No Co-Authored-By lines. No emoji.
- Work happens on branch `feature/polish-pass` (already created).
- Gate for every task: `pnpm run type-check && pnpm run lint` with zero errors (one pre-existing warning in `scripts/capture-screens.mjs` is acceptable).

---

### Task 1: Benefits strip replaces the collage section

**Files:**
- Create: `src/app/benefits.tsx`
- Modify: `src/app/page.tsx` (lines ~224-254, the `{/* Marketing cards */}` section)
- Delete: `public/panda/card-1.png`, `public/panda/card-2.png`, `public/panda/card-3.png`

**Interfaces:**
- Produces: `Benefits()` named export from `./benefits`, no props. Consumed only by `page.tsx`.

- [ ] **Step 1: Create the component**

Create `src/app/benefits.tsx`:

```tsx
import Image from "next/image";

const BENEFITS = [
  {
    heading: "Track your day in seconds",
    body: "Snap a photo and Bamboo logs the meal, the macros, and the calories. Every log earns XP toward your next level.",
    screen: "/screens/dashboard.png",
    screenAlt: "Bamboo dashboard with calorie ring, macro bars, and streak",
    mascot: "/panda/cooking.png",
    mascotAlt: "Bao cooking a meal",
  },
  {
    heading: "Understand your stats at a glance",
    body: "Weekly rings show protein, carbs, and fat without spreadsheets. Your clean food percentage tells you how the week really went.",
    screen: "/screens/macros.png",
    screenAlt: "Weekly macro rings and breakdown bars",
    mascot: "/panda/writing.png",
    mascotAlt: "Bao taking notes",
  },
  {
    heading: "Improve your gut, feel the difference",
    body: "Fiber, fermented foods, and plant diversity roll into one gut score. Watch it climb as your plate gets more colorful.",
    screen: "/screens/gut-forecast.png",
    screenAlt: "Gut forecast score with fiber and fermented food factors",
    mascot: "/panda/broccoli.png",
    mascotAlt: "Bao holding broccoli",
  },
] as const;

export function Benefits() {
  return (
    <section className="w-full py-20 bg-[var(--bg-warm)]">
      <div className="reveal max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-center text-[var(--ink)] mb-12">
          Your daily dashboard with Bao
        </h2>
      </div>
      <div className="flex flex-col gap-16 max-w-4xl mx-auto px-6">
        {BENEFITS.map((benefit, i) => (
          <div
            key={benefit.heading}
            className={`reveal flex flex-col items-center gap-8 md:gap-14 ${
              i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
            }`}
          >
            <div className="phone-frame w-[200px] md:w-[220px] flex-shrink-0">
              <Image
                src={benefit.screen}
                alt={benefit.screenAlt}
                width={220}
                height={476}
                sizes="220px"
                className="w-full h-auto block"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <Image
                src={benefit.mascot}
                alt={benefit.mascotAlt}
                width={72}
                height={72}
                sizes="72px"
                className="object-contain mb-4 mx-auto md:mx-0"
              />
              <h3 className="text-xl md:text-2xl font-semibold text-[var(--ink)] mb-3">
                {benefit.heading}
              </h3>
              <p className="text-[var(--ink-soft)] leading-relaxed max-w-md mx-auto md:mx-0">
                {benefit.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Swap it into page.tsx**

In `src/app/page.tsx`:
1. Add `import { Benefits } from "./benefits";` after the `ScreenShowcase` import.
2. Replace the ENTIRE `{/* Marketing cards */}` section (from the `{/* Marketing cards */}` comment through its closing `</section>`, currently lines ~224-254 — it contains the `card-1.png/card-2.png/card-3.png` map) with:

```tsx
      {/* Benefits */}
      <Benefits />
```

- [ ] **Step 3: Delete the collage assets**

```bash
cd ~/bamboo-website && git rm public/panda/card-1.png public/panda/card-2.png public/panda/card-3.png
```

Then confirm no remaining references: `grep -rn "card-1\|card-2\|card-3" src/` must return nothing.

- [ ] **Step 4: Verify**

Run: `cd ~/bamboo-website && pnpm run type-check && pnpm run lint`
Expected: PASS, zero errors.

- [ ] **Step 5: Commit**

```bash
cd ~/bamboo-website && git add src/app/benefits.tsx src/app/page.tsx
git commit -m "Replace collage section with readable benefits strip"
```

(The `git rm` files are already staged.)

---

### Task 2: Showcase auto-cycle

**Files:**
- Modify: `src/app/screen-showcase.tsx`

**Interfaces:**
- No interface changes. `ScreenShowcase({ screens }: { screens: readonly Screen[] })` keeps its signature.

- [ ] **Step 1: Add the auto-cycle effect**

In `src/app/screen-showcase.tsx`:

1. Change the react import to: `import { useEffect, useState } from "react";`
2. Inside the component, after the `active` state, add:

```tsx
  const [userInteracted, setUserInteracted] = useState(false);

  // Auto-advance every 4s until the user takes over. Skipped under reduced motion.
  useEffect(() => {
    if (userInteracted) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % screens.length);
    }, 4000);
    return () => clearInterval(id);
  }, [userInteracted, screens.length]);

  function handleSelect(i: number) {
    setUserInteracted(true);
    setActive(i);
  }
```

3. Change BOTH button `onClick` handlers (tab buttons and thumbnail buttons) from `onClick={() => setActive(i)}` to `onClick={() => handleSelect(i)}`.

- [ ] **Step 2: Verify**

Run: `cd ~/bamboo-website && pnpm run type-check && pnpm run lint`
Expected: PASS, zero errors.

- [ ] **Step 3: Commit**

```bash
cd ~/bamboo-website && git add src/app/screen-showcase.tsx
git commit -m "Auto-cycle showcase screens until user interacts"
```

---

### Task 3: Confetti burst and Bao in the success card

**Files:**
- Create: `src/app/confetti-burst.tsx`
- Modify: `src/app/globals.css` (append confetti styles, extend reduced-motion block)
- Modify: `src/app/waitlist-form.tsx` (SuccessCard only)

**Interfaces:**
- Produces: `ConfettiBurst()` named export from `./confetti-burst`, no props. Fires once on mount.
- Consumes: existing `mascot-bounce` CSS class from `globals.css`.

- [ ] **Step 1: Create the confetti component**

Create `src/app/confetti-burst.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "var(--green)",
  "var(--honey)",
  "var(--coral)",
  "var(--purple)",
] as const;
const PARTICLE_COUNT = 24;

type Particle = {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
};

// Deterministic index-based spread: no Math.random, stable between renders.
function buildParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    left: (i * 41) % 100,
    delay: ((i * 13) % 40) / 100,
    duration: 1 + ((i * 7) % 60) / 100,
    color: COLORS[i % COLORS.length],
    size: 6 + ((i * 5) % 6),
  }));
}

export function ConfettiBurst() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setParticles(buildParticles());
    const id = setTimeout(() => setParticles([]), 2500);
    return () => clearTimeout(id);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div aria-hidden="true" className="confetti-field">
      {particles.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add the styles**

Append to `src/app/globals.css` (after the `.gradient-text` block):

```css
/* Confetti burst on signup success */
.confetti-field {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  border-radius: inherit;
}

.confetti-piece {
  position: absolute;
  top: -10px;
  border-radius: 2px;
  animation-name: confetti-fall;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(140px) rotate(320deg);
    opacity: 0;
  }
}
```

AND add inside the existing `@media (prefers-reduced-motion: reduce)` block:

```css
  .confetti-piece {
    animation: none;
    opacity: 0;
  }
```

- [ ] **Step 3: Update the success card**

In `src/app/waitlist-form.tsx`:

1. Add imports after the existing `useState` import:

```tsx
import Image from "next/image";
import { ConfettiBurst } from "./confetti-burst";
```

2. Replace the entire `SuccessCard` function with:

```tsx
function SuccessCard({ already }: { already: boolean }) {
  return (
    <div className="relative max-w-md px-6 py-5 rounded-2xl bg-[var(--green-light)] border border-[var(--green)]">
      {!already && <ConfettiBurst />}
      <div className="flex items-start gap-4">
        <Image
          src="/panda/proud.png"
          alt="Bao celebrating"
          width={64}
          height={64}
          sizes="64px"
          className="mascot-bounce object-contain flex-shrink-0"
        />
        <div>
          <p className="text-lg font-semibold text-[var(--green-dark)]">
            {already ? "You're already on the list!" : "You're in!"}
          </p>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            {already
              ? "Bao remembers you. Your spot is safe."
              : "Check your inbox (or Promotions tab). Bao is doing a happy dance."}
          </p>
          <ShareButton />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `cd ~/bamboo-website && pnpm run type-check && pnpm run lint && pnpm test`
Expected: PASS, zero errors, 8/8 tests.

- [ ] **Step 5: Commit**

```bash
cd ~/bamboo-website && git add src/app/confetti-burst.tsx src/app/globals.css src/app/waitlist-form.tsx
git commit -m "Add confetti burst and Bao to the signup success card"
```

---

### Task 4: Sticky mobile CTA and hero tightening

**Files:**
- Create: `src/app/mobile-cta.tsx`
- Modify: `src/app/page.tsx` (imports, hero section padding, hero phone width, `id="final-cta"`, render `<MobileCta />`)

**Interfaces:**
- Produces: `MobileCta()` named export from `./mobile-cta`, no props.
- Consumes: DOM ids `get-early-access` (exists in the hero) and `final-cta` (added in this task).

- [ ] **Step 1: Create the component**

Create `src/app/mobile-cta.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

export function MobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targets = [
      document.getElementById("get-early-access"),
      document.getElementById("final-cta"),
    ].filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const inView = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) inView.add(entry.target);
        else inView.delete(entry.target);
      });
      setVisible(inView.size === 0);
    });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[var(--border)] px-6 py-3 transition-transform duration-300 motion-reduce:transition-none ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <a
        href="#get-early-access"
        className="block w-full text-center px-6 py-3 rounded-full bg-[var(--green)] text-white font-medium shadow-sm"
      >
        Get early access
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Wire into page.tsx**

In `src/app/page.tsx`:

1. Add `import { MobileCta } from "./mobile-cta";` after the `Benefits` import.
2. Hero section (line ~95): change `pt-16 md:pt-24` to `pt-10 md:pt-24`.
3. Hero phone frame (line ~128): change `w-[240px] md:w-[260px]` to `w-[200px] md:w-[260px]`.
4. Final CTA section (the `{/* Final CTA */}` one, line ~296): add `id="final-cta"` to its `<section>` element:

```tsx
      <section id="final-cta" className="w-full py-20 bg-gradient-to-b from-[var(--bg-warm)] to-[var(--bg-accent)]">
```

5. Render `<MobileCta />` immediately after the closing `</footer>` tag, before `</ScrollReveal>`.

- [ ] **Step 3: Verify**

Run: `cd ~/bamboo-website && pnpm run type-check && pnpm run lint`
Expected: PASS, zero errors.

- [ ] **Step 4: Commit**

```bash
cd ~/bamboo-website && git add src/app/mobile-cta.tsx src/app/page.tsx
git commit -m "Add sticky mobile CTA and tighten mobile hero"
```

---

### Task 5: Full verification, build, and visual capture

**Files:** none committed. Verification only. Screenshots land in the session scratchpad for controller review.

- [ ] **Step 1: Run the full gate**

```bash
cd ~/bamboo-website && pnpm run lint && pnpm run type-check && pnpm test && pnpm build
```

Expected: all PASS. Zero lint errors (one pre-existing warning in scripts/capture-screens.mjs acceptable), 8/8 tests.

- [ ] **Step 2: Serve the production build and capture screenshots**

Start `pnpm start` in the background (log to the scratchpad, record the PID). Wait for a 200 from `http://localhost:3000`. Then run the capture script the controller provides (it captures full-page desktop 1440px and mobile 390px screenshots plus console warnings and image weights).

Additional interaction captures with a small puppeteer script (reuse the controller's script as a base):
1. **Auto-cycle check:** load the page, scroll the showcase into view, screenshot the showcase area, wait 5 seconds, screenshot again. The active tab must differ between the two shots.
2. **Confetti + success card check:** intercept `POST /api/waitlist` via `page.setRequestInterception(true)` and fulfill with `{ "success": true, "already": false }` (so NO real API call happens), type `test@example.com` into the hero form, submit, wait 300ms, screenshot the card area, and assert `document.querySelectorAll('.confetti-piece').length > 0` plus the presence of the Bao image in the card.
3. **Mobile CTA check:** at 390px, screenshot at scroll position 0 (bar must NOT be visible), scroll to the middle of the page (bar visible: element has `translate-y-0`), scroll to the final CTA (bar hidden again: `translate-y-full`). Assert via `document.querySelector` on the bar's class list at each position.

Kill the server (and anything on port 3000) when done.

- [ ] **Step 3: Report**

Report each check's result with the screenshot paths. The controller reviews the images against the spec's six changes before the task is marked complete. Report any check that could not be automated honestly as NOT VERIFIED.
