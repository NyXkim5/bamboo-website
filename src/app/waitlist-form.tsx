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

      const data = (await res
        .json()
        .catch(() => ({}))) as { error?: string; already?: boolean };
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
