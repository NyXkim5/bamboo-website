import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeader } from "../legal-header";
import { LegalSection } from "../legal-section";

export const metadata: Metadata = {
  title: "Terms of Service - Bamboo",
  description: "The terms that govern your use of the Bamboo nutrition app.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <LegalHeader />
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
            <Link href="/privacy" className="text-[var(--green-dark)] underline">
              Privacy Policy
            </Link>{" "}
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
          <Link href="/" className="text-sm text-[var(--green-dark)] hover:underline">
            &larr; Back to Bamboo
          </Link>
        </div>
      </div>
    </main>
  );
}
