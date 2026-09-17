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
        {/* Set the effective date to the actual publication date before deployment. */}
        <p className="text-sm text-[var(--ink-soft)] mb-8">Prepared September 16, 2026; effective on publication.</p>

        <LegalSection title="About Bamboo">
          <div className="space-y-4 text-[15px] leading-relaxed">
<p>{"Bamboo is a local-first nutrition and wellness app. This policy explains what is stored on your phone, what is sent to service providers, and your choices. The app's owner has identified the rights holder as ArchvAI."}</p>
<p>{"Your food logs, profile, goals, and wellness entries are stored on your device. Optional cloud backup stores a copy in your account. AI features also send the content or derived summary described below when you consent. Local-first does not mean that no data leaves your device."}</p>
          </div>
        </LegalSection>

        <LegalSection title="The short version">
          <div className="space-y-4 text-[15px] leading-relaxed">
<ul className="list-disc pl-5 space-y-2"><li>{"No email sign-up is required to start. Bamboo creates an anonymous backend account when available; email and Sign in with Apple are optional."}</li>
<li>{"We do not sell or rent personal data, show ads, or use your data for advertising or cross-app tracking."}</li>
<li>{"Bamboo does not use your photos, logs, or messages to train AI models. Our AI providers have their own processing and retention practices, described below."}</li>
<li>{"We share data with the service providers needed to deliver the features you use. We do not make a blanket promise that personal data is never shared."}</li>
<li>{"AI analysis, cloud backup, and Apple Health are optional. You can export data, delete a cloud backup, or delete your account and app data from inside the app."}</li></ul>
          </div>
        </LegalSection>

        <LegalSection title="Data stored on your device">
          <div className="space-y-4 text-[15px] leading-relaxed">
<p>{"On-device records include foods and amounts, meal names, nutrition estimates, profile and goals, water and weight, workouts and exercise sets, sleep and wellness entries, optional period dates and symptoms, achievements, and settings. AI results you save become ordinary food-log entries. Daily-insight responses may be cached on the device."}</p>
<p>{"These records can be included in an optional cloud backup. Separately, the AI features described below send submitted content or selected derived information through Bamboo's server. The daily insight does not send raw food entries, period dates, or free-text notes."}</p>
          </div>
        </LegalSection>

        <LegalSection title="Accounts, analytics, and cloud backup">
          <div className="space-y-4 text-[15px] leading-relaxed">
<p>{"Supabase hosts Bamboo's account services, backend, analytics, and optional cloud backups. An account identifier is used for authentication, usage limits, and account-linked records. If you add email or Sign in with Apple, the account and its records can be associated with your email or Apple identity. An identifier without an email is still an account identifier, not a guarantee that every record is unidentifiable."}</p>
<p>{"Usage analytics contain allowlisted event names and limited metadata, such as feature use, result categories, account/session identifiers, app version, and timestamps. They are designed not to contain food names, photos, meal descriptions, weight values, or cycle entries. Analytics help us understand and improve the app; you can opt out in Settings."}</p>
<p>{"Cloud backup is optional. Choosing Back up now or enabling automatic backup uploads a snapshot of your app records, including food logs, user-entered meal names, profile, water, weight, workouts, sleep, wellness, cycle and symptom entries, achievements, and settings. A snapshot may include saved AI results and cached insights. It is stored against your account, encrypted in transit and through our backend provider's encryption at rest, but it is not end-to-end encrypted. Account authorization controls access; this is not a promise that the service operator cannot process the data."}</p>
<p>{"You can delete the cloud copy separately in Settings > Cloud backup > Delete cloud backup. This leaves your local records and account in place and switches automatic backup off."}</p>
          </div>
        </LegalSection>

        <LegalSection title="AI features and your consent">
          <div className="space-y-4 text-[15px] leading-relaxed">
<p>{"Bamboo sends AI requests through its authenticated server to DeepInfra as the primary provider, with Anthropic Claude configured as a backup. Credentials stay on the server. Consent is requested before sending data for the relevant feature, and it can be declined or revoked in Settings. Turning a feature off prevents future requests from that feature; it does not retroactively erase data a provider has already received."}</p>
<ul className="list-disc pl-5 space-y-2"><li>{"Photo analysis sends a compressed meal photo for food identification and nutrition estimation. The current photo model is google/gemma-3-27b-it hosted through DeepInfra. Review foods and portions before saving."}</li>
<li>{"Describe sends the meal description you type to a text model to estimate foods and amounts. Photo and Describe share a daily analysis limit."}</li>
<li>{"Bao's daily insight sends calorie and protein progress relative to targets, logging streak, goal, and gut score. For cycle-tracking users it can also include current cycle phase, cycle day, and the fixed labels of that day's logged symptoms, such as cramps, discharge, or libido. It does not send raw food entries, period dates, cycle lengths, weight values, or free text."}</li></ul>
<p>{"Bamboo's analysis endpoints do not intentionally persist submitted photos, typed meal-analysis requests, or insight request bodies as server-side content records. This statement does not cover the results you save to your log, local caches, optional cloud backups, account/usage records, or provider-side retention."}</p>
<p>{"Provider practices are not the same as Bamboo's request handling. DeepInfra describes generally transient inference processing, with debugging/security and model-specific exceptions. Its documentation includes exceptions for requests routed to Google or Anthropic services; a model's author or name alone does not establish that such routing occurs. We do not claim a separately negotiated zero-retention arrangement. Anthropic's standard API policy generally retains inputs and outputs for up to 30 days, with exceptions for safety, legal requirements, and applicable agreements or services. Review the providers' current policies for details."}</p>
<p>{"Provider information: "}<a href="https://docs.deepinfra.com/account/data-privacy" className="text-[var(--green-dark)] underline">{"DeepInfra data privacy"}</a>{" and "}<a href="https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data" className="text-[var(--green-dark)] underline">{"Anthropic API retention"}</a>{". We do not promise that providers retain no request content under all circumstances."}</p>
          </div>
        </LegalSection>

        <LegalSection title="Apple Health and cycle information">
          <div className="space-y-4 text-[15px] leading-relaxed">
<p>{"If you connect Apple Health and grant permission, Bamboo reads steps, activity, workouts, and sleep to show your wellness. Access is read-only: Bamboo does not request authorization to write HealthKit records. You can revoke permission in Apple Health. Imported records are stored locally and can be included in cloud backup if you choose that feature. Manual logging remains available."}</p>
<p>{"Cycle tracking is optional. Period dates, cycle lengths, symptom labels and severity are stored locally and can be included in your cloud backup. Separately, the consented daily insight can send the derived phase, day, and symptom labels described above. These include intimate reproductive-health information. Do not interpret a local-first description as a promise that cycle information is never transmitted."}</p>
<p>{"We do not sell Apple Health data or use it for advertising. Cycle projections and nutrition scores are estimates, not medical measurements or contraception."}</p>
          </div>
        </LegalSection>

        <LegalSection title="Food lookup and diagnostics">
          <div className="space-y-4 text-[15px] leading-relaxed">
<p>{"When you search for a food, the search text is sent to USDA FoodData Central. Barcode lookup sends the barcode to Open Food Facts. Bamboo does not intentionally attach its account identifier or your food-log history to these lookups. Like other network services, the recipient may receive technical connection information; this is not a promise that a request contains no information about its sender."}</p>
<p>{"Sentry receives production crash and performance diagnostics, such as device/OS/app information, technical error data, and identifiers associated with app use. Bamboo uses filtering to remove sensitive food, health, and authentication content before reporting. Diagnostic identifiers are not described as guaranteed anonymous. Sentry is not used for advertising."}</p>
          </div>
        </LegalSection>

        <LegalSection title="Retention, deletion, and export">
          <div className="space-y-4 text-[15px] leading-relaxed">
<p>{"Local logs remain until you delete them. Account records and optional cloud backups are kept to provide the account and backup features until removed through the relevant deletion flow. Service metadata and diagnostics may be retained for reliability and security under applicable service policies. Routine backups and legal/security records may not disappear immediately when an active account record is deleted; we do not promise instantaneous erasure from every provider."}</p>
<ul className="list-disc pl-5 space-y-2"><li>{"Export your data from Profile > Data > Manage data > Export my data."}</li>
<li>{"Delete only your cloud backup from Settings > Cloud backup > Delete cloud backup."}</li>
<li>{"Users without email/Apple sign-in can use Profile > Data > Manage data > Delete all data to clear local app data and request removal of their server account and associated app records."}</li>
<li>{"Signed-in users can delete their account from Profile > Account > Delete account. This removes the account and associated active app records and clears local app data."}</li>
<li>{"Server deletion needs network access. If it fails, the app reports the problem; retry rather than assuming the remote deletion succeeded."}</li>
<li>{"Uninstalling is not a server-account deletion request and may leave credentials in platform secure storage. Use the in-app deletion flow to remove your account and associated data."}</li></ul>
<p>{"Deletion of Bamboo records does not itself override an AI or diagnostic provider's separate safety/legal retention. Contact us about access, correction, deletion, or portability requests; additional rights may apply depending on where you live."}</p>
          </div>
        </LegalSection>

        <LegalSection title="Security">
          <div className="space-y-4 text-[15px] leading-relaxed">
<p>{"We use TLS for network transport and our backend provider's encryption at rest. Cloud backup is not end-to-end encrypted. No system is perfectly secure, and we do not promise absolute security."}</p>
          </div>
        </LegalSection>

        <LegalSection title="Children and health disclaimer">
          <div className="space-y-4 text-[15px] leading-relaxed">
<p>{"Bamboo is not directed at children under 13, and we do not knowingly collect their data. If you believe a child has provided data, contact us so we can address it."}</p>
<p>{"Bamboo is a general-wellness tool, not a medical device, and does not provide medical advice. Food identification, nutrition estimates, scores, and cycle projections may be inaccurate. Consult a qualified professional for medical or dietary decisions."}</p>
          </div>
        </LegalSection>

        <LegalSection title="Changes and contact">
          <div className="space-y-4 text-[15px] leading-relaxed">
<p>{"We may update this policy and its effective date when our practices change. Significant changes will be highlighted in the app or by another reasonable method."}</p>
<p>{"Questions or requests: "}<a href="mailto:bamboobaoapp@gmail.com" className="text-[var(--green-dark)] underline">{"bamboobaoapp@gmail.com"}</a>{"."}</p>
          </div>
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
