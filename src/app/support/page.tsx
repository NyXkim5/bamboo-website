import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support - Bamboo",
  description: "Get help with the Bamboo nutrition app.",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl mb-6">
          Support
        </h1>

        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm space-y-6">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[var(--green-dark)] mb-2">
              Need help?
            </h2>
            <p className="text-[15px]">
              We are a small team and we read every message. If something is broken, confusing,
              or you have an idea for how Bamboo can be better, reach out.
            </p>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[var(--green-dark)] mb-2">
              Email us
            </h2>
            <p className="text-[15px]">
              <a
                href="mailto:support@bamboonutrition.app"
                className="text-[var(--green-dark)] underline font-medium"
              >
                support@bamboonutrition.app
              </a>
            </p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              We aim to respond within 24 hours.
            </p>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[var(--green-dark)] mb-2">
              Common questions
            </h2>
            <div className="space-y-4 text-[15px]">
              <div>
                <p className="font-bold">Where is my data stored?</p>
                <p>All your food logs, weight, water, and cycle data stay on your phone. We do not store health data on our servers.</p>
              </div>
              <div>
                <p className="font-bold">How do I delete my account?</p>
                <p>Go to Profile, then Account, then Delete account. This removes your anonymous account from our server and clears all on-device data.</p>
              </div>
              <div>
                <p className="font-bold">How does photo meal logging work?</p>
                <p>Point your camera at a meal and Bamboo sends the photo to AI (Anthropic Claude) for food identification. The photo is not stored. You can opt in or out from Settings.</p>
              </div>
              <div>
                <p className="font-bold">Is my cycle data private?</p>
                <p>Yes. All period dates, cycle lengths, and symptoms are stored only on your device. This data never leaves your phone.</p>
              </div>
              <div>
                <p className="font-bold">Can I export my data?</p>
                <p>Yes. Go to Profile, then Manage Data, then Export. You will get a JSON file with all your logs.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-y-2">
          <a href="/privacy" className="text-sm text-[var(--green-dark)] hover:underline block">
            Privacy Policy
          </a>
          <a href="/" className="text-sm text-[var(--green-dark)] hover:underline block">
            &larr; Back to Bamboo
          </a>
        </div>
      </div>
    </main>
  );
}
