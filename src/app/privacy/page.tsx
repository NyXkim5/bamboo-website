import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeader } from "../legal-header";
import { LegalSection } from "../legal-section";

export const metadata: Metadata = {
  title: "Privacy Policy - Bamboo",
  description: "How Bamboo handles your nutrition and wellness data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <LegalHeader />
        <h1 className="font-[family-name:var(--font-heading)] text-3xl mb-1">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mb-8">Effective date: July 23, 2026</p>

        <p className="mb-4">
          Bamboo is a local-first nutrition app. Your food logs, profile, goals, and wellness data
          live on your phone. This policy explains what stays on the device, what leaves it, and
          how to remove your data.
        </p>

        <LegalSection title="The short version">
          <ul className="list-disc pl-5 space-y-2 text-[15px]">
            <li>Everything you log is stored on your device. If you turn on optional cloud backup, a copy of your data (including food, weight, cycle, workouts, sleep, and wellness entries) is also stored on our server so you can restore it. You can delete that copy at any time.</li>
            <li>You get an anonymous account automatically. No name or email required. You can optionally add email or Sign in with Apple to back up your account.</li>
            <li>We run lightweight analytics (event names and counts, no food content) to understand how the app is used. Analytics are tied to your account ID. If you never add an email or Sign in with Apple, that ID is anonymous. Analytics never contain your name, email, or food content, and you can opt out in Settings.</li>
            <li>We do not sell your data, and we do not use it to train AI models.</li>
            <li>Photo meal analysis sends a compressed image, and the Describe feature sends your typed meal text, to DeepInfra via our secure server. Anthropic (Claude) may be used as a backup provider. Neither is stored on our end.</li>
            <li>Bao&apos;s optional daily insight sends a small derived summary of your day (calorie and protein progress, logging streak, goal, and gut score, and for cycle-tracking users the current cycle phase, cycle day, and the labels of that day&apos;s logged symptoms) to the same AI providers, only after you consent. No food names or raw entries are sent, and you can turn it off in Settings.</li>
            <li>Food search goes to USDA FoodData Central. Barcode scans go to Open Food Facts.</li>
            <li>You can delete your cloud backup, or your whole account and all associated data, at any time from Settings.</li>
          </ul>
        </LegalSection>

        <LegalSection title="What we store and where">
          <h3 className="font-[family-name:var(--font-body)] font-bold text-base mt-4 mb-1">On your device only</h3>
          <p className="text-sm mb-2">
            All of the following is saved in on-device storage. It reaches our server only if you turn on cloud backup (see below):
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[15px]">
            <li><strong>Food logs:</strong> foods you add, amounts, meal types, and timestamps.</li>
            <li><strong>Profile and goals:</strong> name, body details, activity level, and goal.</li>
            <li><strong>Scores and trends:</strong> nutrition estimates computed on the device.</li>
            <li><strong>Wellness data:</strong> mood entries and any sleep, recovery, or activity numbers you enter by hand or import from Apple Health.</li>
            <li><strong>Workouts:</strong> exercises you log by hand, including strength sets, reps, and the weight you lift.</li>
            <li><strong>Water and weight:</strong> daily water count and weight entries.</li>
            <li><strong>Cycle and menstrual data:</strong> period dates, cycle lengths, and symptom entries.</li>
            <li><strong>Settings:</strong> theme choice, notification preferences, and feature flags.</li>
          </ul>

          <h3 className="font-[family-name:var(--font-body)] font-bold text-base mt-4 mb-1">On our server (Supabase)</h3>
          <ul className="list-disc pl-5 space-y-1 text-[15px]">
            <li><strong>Your anonymous account ID</strong> (a UUID), created automatically on first launch.</li>
            <li><strong>Behavioral analytics events:</strong> event names and non-PII metadata. No food names, calorie values, or free text leave the device.</li>
            <li><strong>Session metadata:</strong> app version, session ID, and timestamp.</li>
            <li><strong>Your cloud backup, if you turn it on:</strong> a snapshot of your app data (food logs, profile and goals, water, weight, cycle and menstrual entries, workouts including strength sets, reps, and weight, sleep entries, wellness entries, and settings), keyed to your account. Backup is optional and user-initiated. It is encrypted in transit and at rest but is not end-to-end encrypted. Only your signed-in account can read its backup, enforced by database row-level security. You can delete the server copy at any time from Settings, Cloud backup, Delete cloud backup, without deleting your account.</li>
          </ul>
          <p className="text-sm mt-2">
            If you add email or Apple sign-in, your email is stored in Supabase Auth. Your app data stays on-device unless you turn on cloud backup.
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
              <h3 className="font-bold">3. DeepInfra and Anthropic (via our server)</h3>
              <p>DeepInfra is our primary AI provider, with Anthropic Claude as a backup. These are the only two AI providers we use. Three features send data to them through our secure server, each behind a one-time consent prompt. Processing is transient and we do not retain any of it. Both providers state they do not use API data to train models.</p>
              <p className="mt-2"><strong>Camera meal analysis:</strong> the photo is compressed and forwarded to DeepInfra&apos;s vision model for food identification. Only the photo is sent.</p>
              <p className="mt-2"><strong>Describe (text meal analysis):</strong> when you type what you ate, that description is forwarded to a DeepInfra text model to estimate foods and amounts. Only the text you typed is sent. Photo and Describe share a limit of 20 AI analyses per day.</p>
              <p className="mt-2"><strong>Bao&apos;s daily insight:</strong> a small derived summary of your day (calorie and protein progress, logging streak, goal, and gut score, and for cycle-tracking users the current cycle phase, the cycle day number, and the labels of that day&apos;s logged symptoms) is sent so the model can write one encouraging sentence. No food names, raw entries, or period dates are sent, and free text is never sent. A consent prompt appears before the first time this runs, and you can turn it off in Settings.</p>
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
            <li>We never write to Apple Health, and we do not use Apple Health data for advertising.</li>
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

        <LegalSection title="Apple Health">
          <p className="text-[15px]">
            If you connect Apple Health, Bamboo reads your steps, active minutes, workouts, and sleep to show
            your daily activity and wellness. Access is read-only: we request read permission only, and Bamboo
            never writes to Apple Health. This data is treated like your other wellness data, so it stays on
            your device and reaches our server only if you turn on cloud backup. We never use Apple Health data
            for advertising and we never sell it. Connecting is optional, and you can review or revoke access at
            any time in the Apple Health app. Activity, sleep, and workouts can also be entered by hand.
          </p>
        </LegalSection>

        <LegalSection title="Cycle and menstrual data">
          <p className="text-[15px]">
            Your period dates, cycle lengths, and symptom entries are stored on your device. This raw data
            stays on your device unless you turn on cloud backup, which uploads a copy to your own account so
            you can restore it. If you enable Bao&apos;s daily insight, the derived summary can include your
            current cycle phase (for example &quot;luteal&quot;), the cycle day number, and the labels of the
            symptoms you logged that day, only after you consent, and never the underlying dates or any free
            text. You can turn off the daily insight, and delete your cloud backup, at any time in Settings.
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
            <a href="mailto:bamboobaoapp@gmail.com" className="text-[var(--green-dark)] underline">
              bamboobaoapp@gmail.com
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
