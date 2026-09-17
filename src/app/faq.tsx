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
    a: "With your consent, Bamboo sends a compressed meal photo to DeepInfra, with Anthropic Claude configured as backup, to estimate foods and macros. Review the results before saving. Bamboo does not intentionally persist the submitted image in its analysis endpoint; provider retention is explained in our Privacy Policy. You can revoke consent in Settings.",
  },
  {
    q: "Is my data private?",
    a: "Bamboo stores your logs on your phone. Optional cloud backup saves an account-linked copy, including health and cycle entries. Consented AI features separately send submitted content or an explained summary to our providers. We do not sell your data or use it for advertising or Bamboo model training. See our Privacy Policy for provider processing and your choices.",
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
