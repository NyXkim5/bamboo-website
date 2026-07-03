# Bamboo Website Audit Fixes and Conversion Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the waitlist API's silent failure handling, add the missing terms page, cache the counter, and add FAQ, share-after-signup, and JSON-LD structured data to the landing page.

**Architecture:** Pure signup decision logic moves into a dependency-injected helper (`waitlist-logic.ts`) so it can be unit tested without mocking the Resend SDK. The route builds real deps from the SDK. UI additions (FAQ, share button, terms page) are small focused files following existing patterns. One FAQ data array drives both visible accordions and FAQPage JSON-LD.

**Tech Stack:** Next.js 16.2.9 (App Router), React 19, Tailwind v4, Resend SDK 6.16.0, Vitest (new dev dependency), pnpm.

**Spec:** `docs/superpowers/specs/2026-07-02-website-audit-improvements-design.md`

## Global Constraints

- TypeScript strict mode. Never use `any`.
- Use `pnpm`, never npm or yarn.
- Functional React components only. No default exports except pages.
- Functions under 40 lines. One responsibility per function.
- No silent catches. Every catch either handles or logs with a comment explaining why.
- `console.error("[waitlist]", ...)` is the accepted logger in API routes (Vercel log drain).
- Prose copy (FAQ answers, terms text): no em dashes, no semicolons, short sentences, active voice.
- Commit messages: imperative present tense. No Co-Authored-By lines.
- Path alias `@/*` maps to `./src/*` (tsconfig). Use it for cross-directory imports.
- Resend SDK v6 NEVER throws on API errors. Every call returns `{ data, error }`. Always check `error`.
- Site purpose is fixed: convert visitors to waitlist signups and satisfy App Store review. No scope beyond that.
- Work happens on branch `feature/website-audit-improvements` (already created).

---

### Task 1: Vitest setup and waitlist decision logic (TDD)

**Files:**
- Create: `src/app/api/waitlist/waitlist-logic.ts`
- Create: `src/app/api/waitlist/waitlist-logic.test.ts`
- Modify: `package.json` (add vitest, `test` and `type-check` scripts)

**Interfaces:**
- Produces: `normalizeEmail(raw: unknown): string | null`
- Produces: `processSignup(email: string, deps: SignupDeps): Promise<SignupResult>`
- Produces: `type SignupDeps = { getContact, createContact, sendWelcome, logError }` (exact shape in code below)
- Produces: `type SignupResult = { ok: true; already: boolean } | { ok: false; error: string }`
- Task 2 consumes all of these.

- [ ] **Step 1: Install vitest and add scripts**

```bash
cd ~/bamboo-website && pnpm add -D vitest
```

Then edit `package.json` scripts block to:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "type-check": "tsc --noEmit"
}
```

- [ ] **Step 2: Write the failing tests**

Create `src/app/api/waitlist/waitlist-logic.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  normalizeEmail,
  processSignup,
  type ResendCallResult,
  type SignupDeps,
} from "./waitlist-logic";

function okResult(data: unknown = { id: "c_1" }): ResendCallResult {
  return { data, error: null };
}

function errResult(message: string, name = "application_error"): ResendCallResult {
  return { data: null, error: { message, name } };
}

function makeDeps(overrides: Partial<SignupDeps> = {}): SignupDeps {
  return {
    getContact: vi.fn(async () => errResult("Contact not found", "not_found")),
    createContact: vi.fn(async () => okResult()),
    sendWelcome: vi.fn(async () => okResult()),
    logError: vi.fn(),
    ...overrides,
  };
}

describe("normalizeEmail", () => {
  it("trims and lowercases a valid email", () => {
    expect(normalizeEmail("  Jay@Example.COM ")).toBe("jay@example.com");
  });

  it("rejects invalid formats", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail("a@b")).toBeNull();
    expect(normalizeEmail("")).toBeNull();
  });

  it("rejects non-strings", () => {
    expect(normalizeEmail(undefined)).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("processSignup", () => {
  it("returns already=true and skips create and welcome when contact exists", async () => {
    const deps = makeDeps({
      getContact: vi.fn(async () => okResult({ id: "c_1", email: "jay@example.com" })),
    });
    const result = await processSignup("jay@example.com", deps);
    expect(result).toEqual({ ok: true, already: true });
    expect(deps.createContact).not.toHaveBeenCalled();
    expect(deps.sendWelcome).not.toHaveBeenCalled();
  });

  it("creates the contact and sends the welcome email for a new signup", async () => {
    const deps = makeDeps();
    const result = await processSignup("jay@example.com", deps);
    expect(result).toEqual({ ok: true, already: false });
    expect(deps.createContact).toHaveBeenCalledWith("jay@example.com");
    expect(deps.sendWelcome).toHaveBeenCalledWith("jay@example.com");
  });

  it("returns ok=false and skips welcome when contact creation fails", async () => {
    const deps = makeDeps({
      createContact: vi.fn(async () => errResult("rate limit", "rate_limit_exceeded")),
    });
    const result = await processSignup("jay@example.com", deps);
    expect(result.ok).toBe(false);
    expect(deps.sendWelcome).not.toHaveBeenCalled();
    expect(deps.logError).toHaveBeenCalled();
  });

  it("treats a duplicate-contact create error as already on the list", async () => {
    const deps = makeDeps({
      createContact: vi.fn(async () => errResult("Contact already exists", "validation_error")),
    });
    const result = await processSignup("jay@example.com", deps);
    expect(result).toEqual({ ok: true, already: true });
    expect(deps.sendWelcome).not.toHaveBeenCalled();
  });

  it("still succeeds when the welcome email fails, but logs it", async () => {
    const deps = makeDeps({
      sendWelcome: vi.fn(async () => errResult("smtp down")),
    });
    const result = await processSignup("jay@example.com", deps);
    expect(result).toEqual({ ok: true, already: false });
    expect(deps.logError).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd ~/bamboo-website && pnpm test`
Expected: FAIL — cannot resolve `./waitlist-logic`.

- [ ] **Step 4: Write the implementation**

Create `src/app/api/waitlist/waitlist-logic.ts`:

```ts
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export type ResendCallResult = {
  data: unknown;
  error: { message: string; name: string } | null;
};

export type SignupDeps = {
  getContact: (email: string) => Promise<ResendCallResult>;
  createContact: (email: string) => Promise<ResendCallResult>;
  sendWelcome: (email: string) => Promise<ResendCallResult>;
  logError: (context: string, detail: unknown) => void;
};

export type SignupResult =
  | { ok: true; already: boolean }
  | { ok: false; error: string };

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

export async function processSignup(
  email: string,
  deps: SignupDeps
): Promise<SignupResult> {
  // A get error (including not_found) means "treat as new" and try to create.
  const existing = await deps.getContact(email);
  if (existing.data) return { ok: true, already: true };

  const created = await deps.createContact(email);
  if (created.error) {
    // Safety net: if the get missed a duplicate, Resend rejects the create.
    if (created.error.message.toLowerCase().includes("already")) {
      return { ok: true, already: true };
    }
    deps.logError("contact create failed", created.error);
    return { ok: false, error: "Could not save your spot. Please try again." };
  }

  const welcome = await deps.sendWelcome(email);
  if (welcome.error) {
    // Contact is saved, which is what matters. Log and move on.
    deps.logError("welcome email failed", welcome.error);
  }

  return { ok: true, already: false };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd ~/bamboo-website && pnpm test`
Expected: PASS — 8 tests.

- [ ] **Step 6: Commit**

```bash
cd ~/bamboo-website && git add src/app/api/waitlist/waitlist-logic.ts src/app/api/waitlist/waitlist-logic.test.ts package.json pnpm-lock.yaml
git commit -m "Add tested waitlist signup decision logic"
```

---

### Task 2: Rewire the waitlist POST route

**Files:**
- Modify: `src/app/api/waitlist/route.ts` (full rewrite below)

**Interfaces:**
- Consumes: `normalizeEmail`, `processSignup` from `./waitlist-logic` (Task 1).
- Produces: `POST /api/waitlist` response body `{ success: true, already: boolean }` on 200. Task 4's form consumes the `already` flag. Error statuses stay 400/429/500/503 with `{ error: string }`.

- [ ] **Step 1: Rewrite the route**

Replace the entire content of `src/app/api/waitlist/route.ts` with:

```ts
import { Resend } from "resend";
import { normalizeEmail, processSignup } from "./waitlist-logic";

const rateLimit = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

const WELCOME_SUBJECT = "You're on the list";
const WELCOME_TEXT = `You're in.\n\nYou just secured early access to Bamboo. When we launch this summer, you will be first in line. Every feature. No charge.\n\nThat is it for now. No spam. Just one more email when it is time.\n\n- The Bamboo team`;

function isRateLimited(ip: string): boolean {
  const last = rateLimit.get(ip);
  const now = Date.now();
  if (last && now - last < RATE_LIMIT_MS) return true;
  rateLimit.set(ip, now);
  // Clean old entries once the map grows
  if (rateLimit.size > 1000) {
    const cutoff = now - RATE_LIMIT_MS;
    for (const [key, ts] of rateLimit) {
      if (ts < cutoff) rateLimit.delete(key);
    }
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return Response.json(
        { error: "Too many requests. Try again in a minute." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as { email?: string };
    const email = normalizeEmail(body.email);
    if (!email) {
      return Response.json({ error: "Valid email required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (!apiKey || !audienceId) {
      return Response.json({ error: "Waitlist not configured" }, { status: 503 });
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.FROM_EMAIL;

    const result = await processSignup(email, {
      getContact: (e) => resend.contacts.get({ audienceId, email: e }),
      createContact: (e) => resend.contacts.create({ audienceId, email: e }),
      sendWelcome: (e) =>
        fromEmail
          ? resend.emails.send({
              from: fromEmail,
              to: e,
              subject: WELCOME_SUBJECT,
              text: WELCOME_TEXT,
            })
          : // No FROM_EMAIL configured: skip the welcome email without failing.
            Promise.resolve({ data: null, error: null }),
      logError: (context, detail) => console.error("[waitlist]", context, detail),
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({ success: true, already: result.already });
  } catch (err) {
    // JSON parse failures and unexpected runtime errors land here.
    console.error("[waitlist]", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify types and tests**

Run: `cd ~/bamboo-website && pnpm run type-check && pnpm test`
Expected: both PASS. If `contacts.get({ audienceId, email })` fails the type check, the SDK's `GetContactOptions` is `string | ({ audienceId?: string } & SelectingField)` where `SelectingField` allows `{ email: string }` — check the exact object shape rather than casting.

- [ ] **Step 3: Commit**

```bash
cd ~/bamboo-website && git add src/app/api/waitlist/route.ts
git commit -m "Check Resend errors and handle duplicate signups in waitlist route"
```

---

### Task 3: Shared seed count and cached count route

**Files:**
- Create: `src/app/waitlist-constants.ts`
- Modify: `src/app/api/waitlist/count/route.ts`
- Modify: `src/app/waitlist-counter.tsx`

**Interfaces:**
- Produces: `SEED_COUNT: number` from `@/app/waitlist-constants`.

- [ ] **Step 1: Create the constants module**

Create `src/app/waitlist-constants.ts`:

```ts
export const SEED_COUNT = 238;
```

- [ ] **Step 2: Cache the count route and import the seed**

Replace the entire content of `src/app/api/waitlist/count/route.ts` with:

```ts
import { Resend } from "resend";
import { SEED_COUNT } from "@/app/waitlist-constants";

// Serve a cached count and refresh from Resend at most once per minute.
export const revalidate = 60;

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_AUDIENCE_ID) {
      return Response.json({ count: SEED_COUNT });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data } = await resend.contacts.list({
      audienceId: process.env.RESEND_AUDIENCE_ID,
    });

    // list() returns one page. Fine here: the UI shows "N+" so an
    // undercount past the page size is acceptable for a vanity counter.
    const realCount = data?.data?.length ?? 0;
    return Response.json({ count: SEED_COUNT + realCount });
  } catch {
    // Any failure falls back to the seed so the counter never breaks the page.
    return Response.json({ count: SEED_COUNT });
  }
}
```

Note: `contacts.list({ audienceId })` matches the current code. If `type-check` rejects `audienceId` on `ListContactsOptions`, keep whatever option shape the current code compiled with.

- [ ] **Step 3: Import the seed in the client fallback**

In `src/app/waitlist-counter.tsx`, add the import and replace the hardcoded fallback:

```tsx
"use client";

import { useEffect, useState } from "react";
import { SEED_COUNT } from "./waitlist-constants";

export function WaitlistCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/waitlist/count")
      .then((r) => r.json() as Promise<{ count: number }>)
      .then((d) => setCount(d.count))
      .catch(() => setCount(SEED_COUNT));
  }, []);

  if (count === null) return null;

  return (
    <p className="text-sm text-[var(--ink-soft)] mt-3">
      <span className="font-bold text-[var(--green)]">
        {count.toLocaleString()}+
      </span>{" "}
      people on the waitlist
    </p>
  );
}
```

- [ ] **Step 4: Verify**

Run: `cd ~/bamboo-website && pnpm run type-check && pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/bamboo-website && git add src/app/waitlist-constants.ts src/app/api/waitlist/count/route.ts src/app/waitlist-counter.tsx
git commit -m "Cache waitlist count route and share the seed constant"
```

---

### Task 4: Already-on-list state and share-after-signup in the form

**Files:**
- Modify: `src/app/waitlist-form.tsx` (full rewrite below)

**Interfaces:**
- Consumes: `POST /api/waitlist` returning `{ success: true, already: boolean }` (Task 2).

- [ ] **Step 1: Rewrite the form component**

Replace the entire content of `src/app/waitlist-form.tsx` with:

```tsx
"use client";

import { useState } from "react";

const SHARE_TEXT =
  "I just joined the waitlist for Bamboo, a nutrition app that feels like a game. Come join me!";
const SHARE_URL = "https://bamboonutrition.app";

function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Bamboo", text: SHARE_TEXT, url: SHARE_URL });
      } catch {
        // User closed the share sheet. Nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${SHARE_URL}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[share] clipboard write failed", err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="mt-3 px-5 py-2 rounded-full bg-[var(--green)] text-white text-sm font-medium hover:bg-[var(--green-dark)] transition-colors cursor-pointer"
    >
      {copied ? "Link copied!" : "Tell a friend"}
    </button>
  );
}

function SuccessCard({ already }: { already: boolean }) {
  return (
    <div className="max-w-md px-6 py-5 rounded-2xl bg-[var(--green-light)] border border-[var(--green)]">
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
  );
}

export function WaitlistForm({ id }: { id: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [already, setAlready] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;

    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json()) as { error?: string; already?: boolean };
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setAlready(data.already === true);
      setState("success");
    } catch (err) {
      setState("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  }

  if (state === "success") {
    return <SuccessCard already={already} />;
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 max-w-md"
      >
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <input
          id={id}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          aria-describedby={`${id}-error`}
          className="waitlist-input flex-1 px-5 py-3.5 rounded-full border border-[var(--border)] bg-white text-[var(--ink)] text-base placeholder:text-[var(--ink-muted)] transition-colors"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="px-7 py-3.5 rounded-full bg-[var(--green)] text-white font-medium text-base hover:bg-[var(--green-dark)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 shadow-sm shadow-[var(--green)]/20"
        >
          {state === "loading" ? "Saving your spot..." : "Get early access"}
        </button>
      </form>
      {state === "error" && (
        <p id={`${id}-error`} className="text-sm text-red-500 mt-2" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd ~/bamboo-website && pnpm run type-check && pnpm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd ~/bamboo-website && git add src/app/waitlist-form.tsx
git commit -m "Add already-on-list state and share button to waitlist form"
```

---

### Task 5: Shared legal Section component

**Files:**
- Create: `src/app/legal-section.tsx`
- Modify: `src/app/privacy/page.tsx` (remove local `Section`, import shared one, fix undefined `--cream`)
- Modify: `src/app/support/page.tsx` (fix undefined `--cream` only)

**Interfaces:**
- Produces: `LegalSection({ title, children })` from `@/app/legal-section`. Task 6's terms page consumes it.

- [ ] **Step 1: Create the shared component**

Create `src/app/legal-section.tsx`:

```tsx
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-[var(--green-dark)] mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Use it in the privacy page**

In `src/app/privacy/page.tsx`:
1. Delete the local `Section` function (lines 8-17).
2. Add `import { LegalSection } from "../legal-section";` after the Metadata import.
3. Replace every `<Section ` with `<LegalSection ` and every `</Section>` with `</LegalSection>` (11 usages).
4. Replace `bg-[var(--cream)]` with `bg-[var(--bg)]` on the `<main>` element. `--cream` is not defined in `globals.css`, so this makes the intended white background explicit.

- [ ] **Step 3: Fix the same undefined var in the support page**

In `src/app/support/page.tsx`, replace `bg-[var(--cream)]` with `bg-[var(--bg)]` on the `<main>` element.

- [ ] **Step 4: Verify**

Run: `cd ~/bamboo-website && pnpm run type-check && pnpm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/bamboo-website && git add src/app/legal-section.tsx src/app/privacy/page.tsx src/app/support/page.tsx
git commit -m "Extract shared legal section component and fix undefined cream var"
```

---

### Task 6: Terms page, sitemap entry, footer links

**Files:**
- Create: `src/app/terms/page.tsx`
- Modify: `src/app/sitemap.ts` (add `/terms`)
- Modify: `src/app/page.tsx:321-328` (footer links)

**Interfaces:**
- Consumes: `LegalSection` from Task 5.
- Source content: `~/nutrition-app/docs/TERMS.md` (do not invent new legal claims — adapt that document only).

- [ ] **Step 1: Create the terms page**

Create `src/app/terms/page.tsx`:

```tsx
import type { Metadata } from "next";
import { LegalSection } from "../legal-section";

export const metadata: Metadata = {
  title: "Terms of Service - Bamboo",
  description: "The terms that govern your use of the Bamboo nutrition app.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl mb-1">
          Terms of Service
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mb-8">Effective date: June 20, 2026</p>

        <p className="mb-4">
          These terms are a binding agreement between you and the app&apos;s publisher
          (the &quot;Publisher&quot;, &quot;we&quot;, &quot;us&quot;). By installing or using the app, you accept
          these terms. If you do not agree, do not use the app.
        </p>

        <LegalSection title="Not medical advice. Not a medical device.">
          <p className="text-[15px] mb-2">
            <strong>This app does not provide medical advice and is not a medical device.</strong>{" "}
            It is a food-logging and self-tracking tool for general wellness and education only.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[15px]">
            <li>The clean, gut, and recomposition scores, the projections, the trends, and the wellness readouts are <strong>estimates</strong> produced by heuristics and simple models from the data you enter. They are not measurements, diagnoses, or clinical results. The gut score in particular is a heuristic and not a lab test.</li>
            <li>Nutrition values come from third-party databases (USDA FoodData Central and Open Food Facts) and may be incomplete or wrong.</li>
            <li>Do not use this app to diagnose, treat, cure, or prevent any disease or condition, and do not rely on it for medical decisions.</li>
            <li>Talk to a qualified healthcare professional before changing your diet, exercise, or health routine, especially if you are pregnant, nursing, under 18, have an eating disorder or a history of one, or have any medical condition. In an emergency, call your local emergency number.</li>
          </ul>
        </LegalSection>

        <LegalSection title="License to use the app">
          <p className="text-[15px]">
            We grant you a personal, non-exclusive, non-transferable, revocable license to
            use the app on devices you own or control, for your own non-commercial use,
            subject to these terms.
          </p>
        </LegalSection>

        <LegalSection title="Acceptable use">
          <p className="text-[15px] mb-2">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1 text-[15px]">
            <li>Use the app for any unlawful purpose or in violation of any applicable law.</li>
            <li>Reverse engineer, decompile, or attempt to extract source code, except where that restriction is prohibited by law.</li>
            <li>Copy, resell, sublicense, rent, or redistribute the app.</li>
            <li>Interfere with, disrupt, or overload the app or the third-party services it relies on (USDA FoodData Central and Open Food Facts), or use them in a way that breaks their terms.</li>
            <li>Use the app to provide medical, clinical, or professional health services to anyone else.</li>
          </ul>
        </LegalSection>

        <LegalSection title="Your data and your responsibility">
          <p className="text-[15px]">
            The app stores your data on your device. You are responsible for your device,
            for the accuracy of what you enter, and for keeping your own backups. See the{" "}
            <a href="/privacy" className="text-[var(--green-dark)] underline">
              Privacy Policy
            </a>{" "}
            for how data is handled. Inaccurate input produces inaccurate estimates.
          </p>
        </LegalSection>

        <LegalSection title="Third-party services">
          <p className="text-[15px]">
            The app fetches nutrition data from USDA FoodData Central and Open Food Facts.
            We do not control those services and are not responsible for their content,
            accuracy, or availability. Your use of data they return is at your own risk.
          </p>
        </LegalSection>

        <LegalSection title="No warranty">
          <p className="text-[15px]">
            The app is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any
            kind, whether express or implied, including but not limited to merchantability,
            fitness for a particular purpose, accuracy, and non-infringement. We do not
            warrant that the app will be uninterrupted, error-free, accurate, or that any
            estimate it produces is correct. To the maximum extent permitted by law, we
            disclaim all warranties.
          </p>
        </LegalSection>

        <LegalSection title="Limitation of liability">
          <p className="text-[15px] mb-2">
            To the maximum extent permitted by law, the Publisher and its officers,
            employees, and contributors will not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or for any loss of data, profits,
            or health outcomes, arising out of or related to your use of or inability to
            use the app, even if advised of the possibility of such damages. To the maximum
            extent permitted by law, our total liability for any claim relating to the app
            will not exceed the greater of the amount you paid for the app or ten US
            dollars (USD 10).
          </p>
          <p className="text-[15px]">
            Some jurisdictions do not allow certain warranty disclaimers or liability
            limits, so some of the above may not apply to you. In that case, our liability
            is limited to the smallest extent permitted by law.
          </p>
        </LegalSection>

        <LegalSection title="Changes to the app and these terms">
          <p className="text-[15px]">
            We may change, suspend, or discontinue the app, or update these terms, at any
            time. When we update these terms, we will change the effective date above.
            Continued use after an update means you accept the revised terms.
          </p>
        </LegalSection>

        <LegalSection title="Termination">
          <p className="text-[15px]">
            You may stop using the app and uninstall it at any time. We may suspend or end
            your license if you violate these terms. Sections that by their nature should
            survive termination, including the disclaimers and the limitation of liability,
            survive.
          </p>
        </LegalSection>

        <LegalSection title="Governing law">
          <p className="text-[15px]">
            These terms are governed by the laws of the State of California, United States,
            without regard to its conflict-of-laws rules. The courts located in that
            jurisdiction will have exclusive jurisdiction over any dispute, unless
            applicable law requires otherwise.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p className="text-[15px]">
            Questions about these terms:{" "}
            <a href="mailto:privacy@bamboonutrition.app" className="text-[var(--green-dark)] underline">
              privacy@bamboonutrition.app
            </a>
          </p>
        </LegalSection>

        <div className="mt-12 pt-6 border-t border-[var(--border)]">
          <a href="/" className="text-sm text-[var(--green-dark)] hover:underline">
            &larr; Back to Bamboo
          </a>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Add /terms to the sitemap**

In `src/app/sitemap.ts`, add after the `/support` entry:

```ts
    {
      url: "https://bamboonutrition.app/terms",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
```

- [ ] **Step 3: Add the Support link to the footer**

In `src/app/page.tsx`, in the footer's link `div` (currently Privacy and Terms), add between them:

```tsx
          <a href="/support" className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors px-2 py-2">
            Support
          </a>
```

- [ ] **Step 4: Verify**

Run: `cd ~/bamboo-website && pnpm run type-check && pnpm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/bamboo-website && git add src/app/terms/page.tsx src/app/sitemap.ts src/app/page.tsx
git commit -m "Add terms page, sitemap entry, and support footer link"
```

---

### Task 7: FAQ section and JSON-LD structured data

**Files:**
- Create: `src/app/faq.tsx`
- Create: `src/app/structured-data.tsx`
- Modify: `src/app/page.tsx` (render both)

**Interfaces:**
- Produces: `FAQ_ITEMS` (readonly array of `{ q, a }`) and `Faq()` from `./faq`.
- Produces: `StructuredData()` from `./structured-data` (renders both `SoftwareApplication` and `FAQPage` JSON-LD).

- [ ] **Step 1: Create the FAQ component**

Create `src/app/faq.tsx`:

```tsx
export const FAQ_ITEMS = [
  {
    q: "When does Bamboo launch?",
    a: "Summer 2026 on iOS. Waitlist members get access first.",
  },
  {
    q: "Is Bamboo free?",
    a: "Early signups get free access to every feature on day one. That is our thank-you for joining before launch.",
  },
  {
    q: "Is it iPhone only?",
    a: "Bamboo launches on iOS first. Android is on the roadmap but has no date yet.",
  },
  {
    q: "How does photo logging work?",
    a: "Point your camera at a meal. Bamboo sends a compressed photo to Anthropic Claude for food identification and logs the items and macros. The photo is not stored, and you can opt out in Settings.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Bamboo is local-first. Food logs, weight, cycle, and wellness data stay on your phone. We never sell your data or use it to train AI models.",
  },
  {
    q: "What is the gut health score?",
    a: "A daily estimate built from your fiber intake, fermented foods, and plant diversity. It is a wellness guide, not a medical test or diagnosis.",
  },
  {
    q: "Do I need an account?",
    a: "No email or password needed. You get an anonymous account automatically, and you can add sign-in later if you want.",
  },
] as const;

export function Faq() {
  return (
    <section className="w-full max-w-3xl mx-auto px-6 py-24" aria-labelledby="faq-heading">
      <div className="reveal">
        <h2
          id="faq-heading"
          className="text-3xl md:text-4xl font-semibold text-center text-[var(--ink)] mb-4"
        >
          Questions, answered
        </h2>
        <p className="text-center text-[var(--ink-soft)] mb-12 max-w-md mx-auto">
          Everything people ask before joining the waitlist.
        </p>
      </div>
      <div className="reveal flex flex-col gap-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-[var(--border)] bg-white px-6 py-4 open:border-[var(--green)] transition-colors"
          >
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-base font-semibold text-[var(--ink)]">
              {item.q}
              <span
                className="text-[var(--green)] text-xl transition-transform group-open:rotate-45"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the structured data component**

Create `src/app/structured-data.tsx`:

```tsx
import { FAQ_ITEMS } from "./faq";

const APP_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Bamboo",
  operatingSystem: "iOS",
  applicationCategory: "HealthApplication",
  description:
    "Gamified nutrition tracking. Snap a photo to log meals, earn XP, and watch your gut health improve.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  url: "https://bamboonutrition.app",
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
    </>
  );
}
```

- [ ] **Step 3: Render both on the landing page**

In `src/app/page.tsx`:
1. Add imports:

```tsx
import { Faq } from "./faq";
import { StructuredData } from "./structured-data";
```

2. Insert `<Faq />` between the closing tag of the "How it works" section and the "Final CTA" section comment.
3. Insert `<StructuredData />` immediately after the opening `<ScrollReveal>` tag, before the nav.

- [ ] **Step 4: Verify**

Run: `cd ~/bamboo-website && pnpm run type-check && pnpm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/bamboo-website && git add src/app/faq.tsx src/app/structured-data.tsx src/app/page.tsx
git commit -m "Add FAQ section with FAQPage and SoftwareApplication JSON-LD"
```

---

### Task 8: Screen showcase cleanups

**Files:**
- Modify: `src/app/screen-showcase.tsx`
- Modify: `src/app/page.tsx:176`

- [ ] **Step 1: Accept readonly screens, drop below-fold priority, add aria-pressed**

In `src/app/screen-showcase.tsx`:
1. Change the prop type: `export function ScreenShowcase({ screens }: { screens: readonly Screen[] })`.
2. Remove the `priority` prop from the large phone `Image` (it is below the fold and competes with the hero image).
3. Add `aria-pressed={active === i}` to both the tab buttons and the thumbnail buttons.

- [ ] **Step 2: Drop the spread workaround in page.tsx**

Change `src/app/page.tsx` line 176 from:

```tsx
          <ScreenShowcase screens={SCREENS.map(s => ({ ...s }))} />
```

to:

```tsx
          <ScreenShowcase screens={SCREENS} />
```

- [ ] **Step 3: Verify**

Run: `cd ~/bamboo-website && pnpm run type-check && pnpm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd ~/bamboo-website && git add src/app/screen-showcase.tsx src/app/page.tsx
git commit -m "Accept readonly screens, drop below-fold priority, add aria-pressed"
```

---

### Task 9: Full verification and smoke test

**Files:** none created. Verification only.

- [ ] **Step 1: Run the full gate**

```bash
cd ~/bamboo-website && pnpm run lint && pnpm run type-check && pnpm test && pnpm build
```

Expected: all four PASS. The build must list `/terms` in the route summary and show `/api/waitlist/count` as revalidating (ISR), not fully dynamic.

- [ ] **Step 2: Smoke test the pages**

```bash
cd ~/bamboo-website && pnpm dev &
sleep 8
for p in / /terms /privacy /support; do curl -s -o /dev/null -w "$p -> %{http_code}\n" "http://localhost:3000$p"; done
curl -s http://localhost:3000/api/waitlist/count
curl -s -X POST http://localhost:3000/api/waitlist -H "Content-Type: application/json" -d '{"email":"bad"}'
```

Expected: all four pages return 200, count returns JSON with a number, and the bad email returns `{"error":"Valid email required"}` with status 400. Kill the dev server afterward.

- [ ] **Step 3: Visual check**

Confirm on http://localhost:3000 while the dev server runs: FAQ accordions open and close, footer shows Privacy, Support, and Terms, and view-source contains two `application/ld+json` blocks. Do NOT submit a real email during smoke testing unless Jay asks — `.env.local` may hold live Resend credentials and a submit sends a real welcome email.

- [ ] **Step 4: Mark plan complete**

Update this plan's checkboxes and report results to Jay, including anything that failed.
