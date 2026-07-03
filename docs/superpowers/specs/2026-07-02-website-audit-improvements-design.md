# Bamboo Website Audit Fixes and Conversion Improvements

Date: 2026-07-02
Status: Approved by Jay

## Purpose

Fix defects found in the site audit and add three on-purpose improvements. The site has one job: convert visitors into waitlist signups and satisfy App Store review requirements. Every change below serves that job.

## Context

- Next.js 16.2.9, React 19, Tailwind v4, Resend SDK 6.16.0. Deployed at bamboonutrition.app.
- Key finding: the Resend SDK returns `{ data, error }` and never throws on API errors. The current waitlist route ignores `error`, so failed signups return "You're in!" while dropping the contact.
- Repo AGENTS.md requires reading `node_modules/next/dist/docs/` before writing Next code.

## Changes

### 1. Waitlist API hardening (`src/app/api/waitlist/route.ts`)

- Check `error` on every Resend call. Contact creation failure returns 500.
- Duplicate handling: call `contacts.get({ audienceId, email })` first. If the contact exists, return `{ success: true, already: true }` and skip the welcome email.
- Send the welcome email only after a confirmed new-contact creation.
- If the welcome email fails after the contact was created, log it and still return success. The contact is saved, which is what matters.
- Extract the pure decision logic (validate, dedupe, outcome) into a helper module so it can be unit tested without mocking fetch internals.

### 2. Count route caching (`src/app/api/waitlist/count/route.ts`)

- Add `export const revalidate = 60`. One Resend call per minute max. No per-visitor API hits. No counter flicker under load.
- Move `SEED_COUNT = 238` to `src/app/waitlist-constants.ts`. Both the route and the client fallback import it.

### 3. Terms page and footer

- New `src/app/terms/page.tsx`. Content adapted from `~/nutrition-app/docs/TERMS.md` (medical disclaimer, license, acceptable use, liability, California law, contact).
- Extract the `Section` component from `privacy/page.tsx` into `src/app/legal-section.tsx`. Both legal pages use it.
- Footer: add a Support link alongside Privacy and Terms.
- Add `/terms` to `sitemap.ts`.

### 4. FAQ section on the landing page

- New `src/app/faq.tsx`, rendered between "How it works" and the final CTA.
- One exported data array drives both the visible accordions and FAQPage JSON-LD. About 7 questions: launch timing, is it free, iOS or Android, how photo AI works (Anthropic, photo not stored), is my data private (local-first), what the gut score is (estimate, not medical advice), do I need an account.
- Native `<details>/<summary>` accordions. Zero JS. Styled to match the card aesthetic.

### 5. Share-after-signup (`src/app/waitlist-form.tsx`)

- Success card gains a "Tell a friend" button.
- `navigator.share` with text and link where available. Clipboard-copy fallback with a "Copied!" state elsewhere.
- Tailored success message when `already: true`: "You're already on the list. Bao remembers you."
- No referral tracking or waitlist positions. There is no backend for it.

### 6. SEO structured data

- `SoftwareApplication` JSON-LD on the landing page: name Bamboo, operating system iOS, category HealthApplication, free offer.
- FAQPage JSON-LD generated from the FAQ data array.

### 7. Small fixes

- `screen-showcase.tsx`: accept `readonly Screen[]`, drop the `.map(s => ({ ...s }))` workaround in `page.tsx`.
- Remove `priority` from the below-fold showcase image.
- Add `aria-pressed` to showcase tab and thumbnail buttons.

## Error handling

- API route: every Resend `error` is logged with `console.error("[waitlist]", ...)` (the Vercel logger) and mapped to a user-safe message. No PHI or emails in log lines beyond what Resend requires.
- Form: existing error display stays. New `already` state renders the tailored success card.
- Count route: any failure still falls back to the seed count.

## Testing

- Add Vitest (dev dependency) with tests for the extracted waitlist decision helper: email validation, duplicate path, create-failure path, welcome-email-failure path.
- UI components stay untested. They are thin and visual.
- Done means: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, and the new tests all pass, plus a local smoke check of `/`, `/terms`, `/privacy`, `/support`.

## Out of scope

- The in-memory rate limiter stays as is.
- The seeded counter stays as is.
- No referral tracking, no waitlist positions, no analytics changes.
