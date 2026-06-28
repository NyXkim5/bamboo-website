import Image from "next/image";
import { WaitlistForm } from "./waitlist-form";
import { WaitlistCounter } from "./waitlist-counter";
import { ScrollReveal } from "./scroll-reveal";
import { ScreenShowcase } from "./screen-showcase";

const FEATURES = [
  {
    img: "/panda/cooking.png",
    title: "Log meals in 10 seconds",
    description:
      "Point your camera at any plate. Bamboo identifies every item, estimates portions, and logs the macros. Works with barcodes and manual search too.",
    color: "var(--green-light)",
    borderColor: "var(--green)",
  },
  {
    img: "/panda/broccoli.png",
    title: "A gut health score no other app gives you",
    description:
      "Bamboo tracks your daily fiber, fermented food intake, and plant diversity to generate a real gut health forecast. An actionable score you can improve today.",
    color: "#FFF3E0",
    borderColor: "var(--honey)",
  },
  {
    img: "/panda/proud.png",
    title: "The reason you will open this app tomorrow",
    description:
      "Every meal logged earns XP. Hit your protein goal and complete a daily quest. Keep your streak alive and unlock badges. It sounds silly until you are at level 12.",
    color: "#F3E8F4",
    borderColor: "var(--purple)",
  },
] as const;

const STEPS = [
  {
    num: "1",
    title: "Tell Bao your goals",
    desc: "A 60-second setup. Pick your targets. Bamboo calculates your calories and macros using real sports-science formulas.",
    img: "/panda/writing.png",
  },
  {
    num: "2",
    title: "Snap, scan, or search",
    desc: "Photo AI handles full plates. Barcodes handle packaged food. Your saved meals handle the rest. Most logs take under 10 seconds.",
    img: "/panda/cooking.png",
  },
  {
    num: "3",
    title: "Level up every day",
    desc: "Your gut score, feel score, XP, and streaks update in real time. Open the app and see exactly where you stand.",
    img: "/panda/sparkles.png",
  },
] as const;

const SCREENS = [
  { src: "/screens/dashboard.png", label: "Dashboard", alt: "Today view with 493 kcal ring, macro bars, streak, and food suggestions" },
  { src: "/screens/macros.png", label: "Stats", alt: "Weekly macro rings, breakdown bars, and clean food percentage" },
  { src: "/screens/gut-forecast.png", label: "Gut health", alt: "Gut forecast score 58 with fiber, fermented foods, and microbiome diversity" },
  { src: "/screens/quests-streaks.png", label: "Quests", alt: "Daily quests, water tracking, 14-day streak calendar, and cycle nudges" },
  { src: "/screens/cycle-tracking.png", label: "Cycle", alt: "Luteal phase ring, period logging, and symptom tracker" },
] as const;

export default function Home() {
  return (
    <ScrollReveal>
      {/* Nav */}
      <nav aria-label="Main navigation" className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/app-icon-new.png"
              alt="Bamboo app icon"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-lg font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-heading)" }}>
              bamboo
            </span>
          </div>
          <a
            href="#get-early-access"
            className="px-5 py-2 rounded-full bg-[var(--green)] text-white text-sm font-medium hover:bg-[var(--green-dark)] transition-colors shadow-sm"
          >
            Get early access
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--green-light)] text-[var(--green-dark)] text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
              Launching Summer 2026
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-[var(--ink)] leading-[1.1] tracking-tight mb-5">
              Tracking nutrition should feel like a game,{" "}
              <span className="gradient-text">not a chore</span>
            </h1>

            <p className="text-lg text-[var(--ink-soft)] max-w-lg mb-4 leading-relaxed mx-auto lg:mx-0">
              Bamboo is an iOS app that makes food tracking fast, fun, and actually rewarding. Snap a photo. Earn XP. Watch your gut health improve.
            </p>

            <p className="text-base text-[var(--ink)] font-medium max-w-lg mb-8 mx-auto lg:mx-0">
              Most calorie counters make you feel guilty for eating a cookie. Bamboo does the opposite.
            </p>

            <div id="get-early-access" className="flex justify-center lg:justify-start mb-3">
              <WaitlistForm id="hero-email" />
            </div>

            <p className="text-sm text-[var(--ink-muted)]">
              Early signups get free access to every feature on day one.
            </p>
            <WaitlistCounter />
          </div>

          {/* Hero phone */}
          <div className="relative flex-shrink-0">
            <div className="phone-frame w-[240px] md:w-[260px]">
              <Image
                src="/screens/dashboard.png"
                alt="Bamboo dashboard showing 493 kcal remaining, macro bars, and food suggestions"
                width={260}
                height={563}
                priority
                sizes="260px"
                className="w-full h-auto block"
              />
            </div>
            {/* Floating Bao */}
            <div className="mascot-bounce absolute -bottom-4 -right-8 md:-right-12">
              <Image
                src="/panda/sparkles.png"
                alt="Bao the panda"
                width={80}
                height={80}
                sizes="80px"
              />
            </div>
            {/* Floating stat badges */}
            <div className="absolute -left-8 top-16 bg-white rounded-2xl shadow-lg shadow-black/8 px-4 py-2.5 border border-[var(--border)] hidden md:flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-sm font-bold text-[var(--ink)]">14-day streak</p>
                <p className="text-xs text-[var(--ink-muted)]">Keep it green</p>
              </div>
            </div>
            <div className="absolute -right-12 top-1/2 bg-white rounded-2xl shadow-lg shadow-black/8 px-4 py-2.5 border border-[var(--border)] hidden lg:flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <div>
                <p className="text-sm font-bold text-[var(--green)]">Gut: 58</p>
                <p className="text-xs text-[var(--ink-muted)]">Trending up</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive screen showcase */}
      <section className="w-full py-20 bg-[var(--bg-warm)]">
        <div className="reveal max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-[var(--ink)] mb-3">
            See every screen
          </h2>
          <p className="text-center text-[var(--ink-soft)] mb-10 max-w-lg mx-auto">
            Tap to explore. Every screen designed to show you what matters.
          </p>
        </div>

        <div className="reveal max-w-5xl mx-auto px-6">
          <ScreenShowcase screens={SCREENS.map(s => ({ ...s }))} />
        </div>
      </section>

      {/* Feature cards */}
      <section className="w-full max-w-5xl mx-auto px-6 py-24">
        <div className="reveal">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-[var(--ink)] mb-4">
            Three things your current app can&apos;t do
          </h2>
          <p className="text-center text-[var(--ink-soft)] mb-16 max-w-md mx-auto">
            Bamboo is built different. Here is what makes it worth switching.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`reveal stagger-${i + 1} feature-card rounded-3xl p-7 border-2`}
              style={{
                backgroundColor: feature.color,
                borderColor: `color-mix(in srgb, ${feature.borderColor} 30%, transparent)`,
              }}
            >
              <Image
                src={feature.img}
                alt={`Bao illustrating ${feature.title.toLowerCase()}`}
                width={100}
                height={100}
                sizes="100px"
                className="object-contain mb-5"
              />
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-3 leading-snug">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Marketing cards */}
      <section className="w-full py-20 bg-[var(--bg-warm)]">
        <div className="reveal max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-[var(--ink)] mb-12">
            Your daily dashboard with Bao
          </h2>
        </div>

        <div className="flex flex-col gap-8 max-w-6xl mx-auto px-6">
          {[
            { src: "/panda/card-1.png", alt: "App screens with Bao showing daily tracking, stats, and gut health" },
            { src: "/panda/card-2.png", alt: "App screens with Bao showing food logging, macro insights, and streaks" },
            { src: "/panda/card-3.png", alt: "App screens with Bao showing quests, meal suggestions, and progress" },
          ].map((card, i) => (
            <div
              key={card.src}
              className={`reveal stagger-${i + 1} rounded-3xl overflow-hidden shadow-lg shadow-black/8 border border-[var(--border-hover)] feature-card`}
            >
              <Image
                src={card.src}
                alt={card.alt}
                width={1200}
                height={800}
                sizes="(max-width: 768px) 100vw, 900px"
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="reveal">
            <h2 className="text-3xl md:text-4xl font-semibold text-center text-[var(--ink)] mb-16">
              Start tracking in under 2 minutes
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-start justify-center">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`reveal stagger-${i + 1} flex flex-col items-center text-center flex-1 max-w-[260px] mx-auto`}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--green)] text-white flex items-center justify-center text-lg font-bold mb-5 shadow-md shadow-[var(--green)]/20">
                  {step.num}
                </div>
                <Image
                  src={step.img}
                  alt={`Step ${step.num}`}
                  width={90}
                  height={90}
                  sizes="90px"
                  className="mb-4 object-contain"
                />
                <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full py-20 bg-gradient-to-b from-[var(--bg-warm)] to-[var(--bg-accent)]">
        <div className="reveal max-w-2xl mx-auto px-6 text-center">
          <Image
            src="/panda/heart.png"
            alt="Bao holding a pink heart"
            width={120}
            height={120}
            sizes="120px"
            className="mx-auto mb-6 object-contain mascot-float"
          />
          <h2 className="text-3xl md:text-4xl font-semibold text-[var(--ink)] mb-4">
            Stop dreading your food tracker
          </h2>
          <p className="text-[var(--ink-soft)] mb-8 max-w-md mx-auto leading-relaxed">
            Bamboo launches this summer on iOS. Sign up now and we will let you in first. No spam. Just one email when it is time.
          </p>
          <div className="flex justify-center">
            <WaitlistForm id="cta-email" />
          </div>
          <WaitlistCounter />
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Image src="/app-icon-new.png" alt="" width={20} height={20} className="rounded-md" />
          <span className="text-sm text-[var(--ink-muted)]">
            &copy; 2026 Bamboo
          </span>
        </div>
        <div className="flex gap-6">
          <a href="/privacy" className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors px-2 py-2">
            Privacy
          </a>
          <a href="/terms" className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors px-2 py-2">
            Terms
          </a>
        </div>
      </footer>
    </ScrollReveal>
  );
}
