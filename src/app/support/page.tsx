import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeader } from "../legal-header";

export const metadata: Metadata = {
  title: "Support - Bamboo",
  description: "Get help with the Bamboo nutrition app.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <LegalHeader />
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
                <p>Your logs are stored on your phone. Optional cloud backup stores an account-linked copy, including health and cycle entries, on our server. Consented AI features separately send submitted content or a derived summary to providers. See our Privacy Policy for details.</p>
              </div>
              <div>
                <p className="font-bold">How do I delete my account?</p>
                <p>Signed-in users can go to Profile, Account, Delete account. Without email or Apple sign-in, use Profile, Data, Manage data, Delete all data. These flows clear local app data and request deletion of the server account and associated active app records. Network access is required; if deletion fails, retry. Provider retention and routine backups are separate. Uninstalling alone does not delete your server account.</p>
              </div>
              <div>
                <p className="font-bold">How does photo meal logging work?</p>
                <p>After consent, Bamboo sends a compressed meal photo to DeepInfra, with Anthropic Claude configured as backup, for food and nutrition estimates. Review the results before saving. Bamboo does not intentionally persist the image in its analysis endpoint; provider retention is described in our Privacy Policy. You can revoke consent in Settings.</p>
              </div>
              <div>
                <p className="font-bold">Is my cycle data private?</p>
                <p>Cycle tracking is optional. Period dates, cycle lengths, and symptoms are stored locally and can be included in optional cloud backup. With daily-insight consent, current cycle phase, cycle day, and logged symptom labels can also be sent to our AI providers. The daily insight does not send period dates, cycle lengths, or free text. You can turn it off and delete your cloud backup in Settings.</p>
              </div>
              <div>
                <p className="font-bold">Can I export my data?</p>
                <p>Yes. Go to Profile, Data, Manage data, Export my data to export your app records as a JSON file.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-y-2">
          <Link href="/privacy" className="text-sm text-[var(--green-dark)] hover:underline block">
            Privacy Policy
          </Link>
          <Link href="/" className="text-sm text-[var(--green-dark)] hover:underline block">
            &larr; Back to Bamboo
          </Link>
        </div>
      </div>
    </main>
  );
}
