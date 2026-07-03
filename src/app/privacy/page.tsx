import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection } from "../legal-section";

export const metadata: Metadata = {
  title: "Privacy Policy - Bamboo",
  description: "How Bamboo handles your nutrition and wellness data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl mb-1">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mb-8">Effective date: June 21, 2026</p>

        <p className="mb-4">
          Bamboo is a local-first nutrition app. Your food logs, profile, goals, and wellness data
          live on your phone. This policy explains what stays on the device, what leaves it, and
          how to remove your data.
        </p>

        <LegalSection title="The short version">
          <ul className="list-disc pl-5 space-y-2 text-[15px]">
            <li>Everything you log stays on your device. We do not store food, weight, cycle, or wellness data on any server.</li>
            <li>You get an anonymous account automatically. No name or email required.</li>
            <li>We run lightweight anonymous analytics (event names and counts, no food content) to understand how the app is used.</li>
            <li>We do not sell your data, and we do not use it to train AI models.</li>
            <li>Photo meal analysis sends a compressed image to Anthropic (Claude) via our secure server. The photo is not stored.</li>
            <li>Food search goes to USDA FoodData Central. Barcode scans go to Open Food Facts.</li>
            <li>You can delete your account and all associated data at any time from Settings.</li>
          </ul>
        </LegalSection>

        <LegalSection title="What we store and where">
          <h3 className="font-[family-name:var(--font-body)] font-bold text-base mt-4 mb-1">On your device only</h3>
          <p className="text-sm mb-2">
            All of the following is saved only in on-device storage. It never reaches our servers:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[15px]">
            <li><strong>Food logs:</strong> foods you add, amounts, meal types, and timestamps.</li>
            <li><strong>Profile and goals:</strong> name, body details, activity level, and goal.</li>
            <li><strong>Scores and trends:</strong> nutrition estimates computed on the device.</li>
            <li><strong>Wellness data:</strong> mood entries and any sleep, recovery, or activity numbers.</li>
            <li><strong>Water and weight:</strong> daily water count and weight entries.</li>
            <li><strong>Cycle and menstrual data:</strong> period dates, cycle lengths, and symptom entries.</li>
            <li><strong>Settings:</strong> theme choice, notification preferences, and feature flags.</li>
          </ul>

          <h3 className="font-[family-name:var(--font-body)] font-bold text-base mt-4 mb-1">On our server (Supabase)</h3>
          <ul className="list-disc pl-5 space-y-1 text-[15px]">
            <li><strong>Your anonymous account ID</strong> (a UUID), created automatically on first launch.</li>
            <li><strong>Behavioral analytics events:</strong> event names and non-PII metadata. No food names, calorie values, or free text leave the device.</li>
            <li><strong>Session metadata:</strong> app version, session ID, and timestamp.</li>
          </ul>
          <p className="text-sm mt-2">
            If you add email or Apple sign-in, your email is stored in Supabase Auth. Your app data remains on-device only.
          </p>
        </LegalSection>

        <LegalSection title="What leaves your device">
          <div className="space-y-4 text-[15px]">
            <div>
              <h3 className="font-bold">1. USDA FoodData Central</h3>
              <p>When you search for a food by name, the search text is sent to USDA. Nothing about your identity or logs is sent.</p>
            </div>
            <div>
              <h3 className="font-bold">2. Open Food Facts</h3>
              <p>When you scan a barcode, the barcode number is sent to retrieve nutrition facts.</p>
            </div>
            <div>
              <h3 className="font-bold">3. Anthropic Claude (via our server)</h3>
              <p>When you use camera meal analysis, the photo is compressed and sent to our server, which forwards it to Anthropic Claude for food identification. The photo is not stored. A consent prompt is shown before your first photo analysis.</p>
            </div>
            <div>
              <h3 className="font-bold">4. Supabase (analytics and auth)</h3>
              <p>Anonymous behavioral analytics and your anonymous account ID are sent to Supabase. No food content or health data is included.</p>
            </div>
            <div>
              <h3 className="font-bold">5. Sentry (crash reporting)</h3>
              <p>Crash reports include device type, OS version, app version, error message, and anonymous UUID. No food names or health values are included.</p>
            </div>
          </div>
        </LegalSection>

        <LegalSection title="What we do not do">
          <ul className="list-disc pl-5 space-y-1 text-[15px]">
            <li>We do not sell, rent, or share your personal data.</li>
            <li>We do not use your data to train AI or machine-learning models.</li>
            <li>We do not run advertising or third-party tracking.</li>
            <li>We do not build a profile of you linked to your real identity.</li>
            <li>We do not share HealthKit data with data brokers or third parties.</li>
          </ul>
        </LegalSection>

        <LegalSection title="Data deletion">
          <p className="text-[15px]">Every user gets an anonymous account automatically. You can:</p>
          <ul className="list-disc pl-5 space-y-1 text-[15px] mt-2">
            <li><strong>Export your data</strong> from Settings, Manage Data, Export.</li>
            <li><strong>Clear all on-device data</strong> from Settings, Manage Data, Delete all data.</li>
            <li><strong>Delete your account</strong> from Profile, Account, Delete account. This is permanent.</li>
            <li><strong>Uninstall the app</strong> to erase all on-device storage.</li>
          </ul>
        </LegalSection>

        <LegalSection title="Apple HealthKit">
          <p className="text-[15px]">
            Apple HealthKit integration is planned for a future release. When available, the app will read
            steps, sleep hours, and active calories locally to display recovery insights. HealthKit data will
            never be transmitted to us or any third party.
          </p>
        </LegalSection>

        <LegalSection title="Cycle and menstrual data">
          <p className="text-[15px]">
            All period dates, cycle lengths, and symptom entries are stored only on your device. This data never leaves your device.
          </p>
        </LegalSection>

        <LegalSection title="Children">
          <p className="text-[15px]">
            This app is not directed to children under 13. We do not knowingly collect data from children.
          </p>
        </LegalSection>

        <LegalSection title="Changes to this policy">
          <p className="text-[15px]">
            If we change how the app handles data, we will update this policy and the effective date.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p className="text-[15px]">
            Questions about privacy:{" "}
            <a href="mailto:privacy@bamboonutrition.app" className="text-[var(--green-dark)] underline">
              privacy@bamboonutrition.app
            </a>
          </p>
        </LegalSection>

        <div className="mt-12 pt-6 border-t border-[var(--border)]">
          <Link href="/" className="text-sm text-[var(--green-dark)] hover:underline">
            &larr; Back to Bamboo
          </Link>
        </div>
      </div>
    </main>
  );
}
