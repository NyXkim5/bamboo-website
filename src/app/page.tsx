"use client";

import { useState } from "react";
import Image from "next/image";
import { useScrollReveal } from "./use-scroll-reveal";

const FEATURES = [
  {
    img: "/mascot/panda-cook.png",
    title: "Smart food logging",
    description:
      "Snap a photo, scan a barcode, or search. AI identifies your meal instantly. Save combos for one-tap re-logging.",
  },
  {
    img: "/mascot/panda-lift.png",
    title: "Macros that make sense",
    description:
      "Personalized calorie and macro targets based on your body and goals. Track protein, carbs, fat, and fiber.",
  },
  {
    img: "/mascot/panda-zen.png",
    title: "Gut health forecast",
    description:
      "See how your food choices affect your gut. Fiber, fermented foods, and plant diversity scored daily.",
  },
  {
    img: "/mascot/panda-heart.png",
    title: "Cycle-aware nutrition",
    description:
      "For women: phase-specific food tips that no other app offers. Iron during menstrual, magnesium during luteal.",
  },
  {
    img: "/mascot/panda-tea.png",
    title: "Hydration tracking",
    description:
      "Tap to log water glasses. Daily goal with streak tracking. Stay hydrated without overthinking it.",
  },
  {
    img: "/mascot/panda-proud.png",
    title: "Gamified progress",
    description:
      "XP, streaks, daily quests, and badges. Level up from Seedling to Bamboo Master. Confetti on every log.",
  },
];

const SOCIAL_PROOF_COUNT = 2847;

function IPhoneFrame({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`iphone-frame ${className}`}>
      <div className="phone-gradient" />
      <Image src={src} alt={alt} width={320} height={654} className="object-cover" />
    </div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [count] = useState(SOCIAL_PROOF_COUNT);
  const scrollRef = useScrollReveal();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubmitted(true);
  }

  return (
    <main ref={scrollRef} className="flex flex-col items-center">
      {/* Hero */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left: text + form */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-block mb-6">
              <Image
                src="/app-icon.png"
                alt="Bamboo app icon"
                width={120}
                height={120}
                priority
                className="rounded-[28px] shadow-lg"
              />
            </div>

            <h1 className="text-5xl md:text-6xl font-semibold text-[var(--ink)] mb-4 leading-tight">
              bamboo
            </h1>

            <p className="text-lg md:text-xl text-[var(--ink-soft)] max-w-xl mb-8 leading-relaxed">
              Your gut, macros &amp; mood - tracked like a game you actually win.
              Meet Bao, your panda nutrition buddy.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="waitlist-input flex-1 px-5 py-4 rounded-2xl border-2 border-[var(--border)] bg-[var(--paper)] text-[var(--ink)] text-base placeholder:text-[var(--ink-soft)]"
                />
                <button
                  type="submit"
                  className="px-8 py-4 rounded-2xl bg-[var(--coral)] text-white font-semibold text-base border-b-4 border-[var(--coral-d)] hover:translate-y-[1px] hover:border-b-2 active:translate-y-[3px] active:border-b-0 transition-all cursor-pointer"
                >
                  Join waitlist
                </button>
              </form>
            ) : (
              <div className="max-w-md mb-4 px-6 py-5 rounded-2xl bg-[var(--paper)] border-2 border-[var(--coral)]">
                <p className="text-lg font-semibold text-[var(--coral-d)]">{"You're in! 🎋"}</p>
                <p className="text-sm text-[var(--ink-soft)] mt-1">
                  {"We'll let you know when bamboo is ready."}
                </p>
              </div>
            )}

            <p className="text-sm text-[var(--ink-soft)]">
              <span className="font-bold text-[var(--coral)]">{count.toLocaleString()}</span> people on the waitlist
            </p>
          </div>

          {/* Right: iPhone mockups */}
          <div className="flex gap-6 items-start">
            <div className="parallax-phone">
              <IPhoneFrame src="/screens/home.png" alt="Bamboo home screen" />
            </div>
            <div className="parallax-phone hidden md:block mt-16">
              <IPhoneFrame src="/screens/log.png" alt="Bamboo food log screen" />
            </div>
          </div>
        </div>
      </section>

      {/* App showcase: all screens */}
      <section className="w-full py-20 overflow-hidden">
        <div className="animate-on-scroll max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-[var(--ink)] mb-4">
            See it in action
          </h2>
          <p className="text-center text-[var(--ink-soft)] mb-12 max-w-lg mx-auto">
            Track meals, monitor gut health, and level up your nutrition - all in one beautifully gamified app.
          </p>
        </div>

        <div className="flex gap-6 px-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide justify-start md:justify-center">
          {[
            { src: "/screens/home.png", label: "Dashboard" },
            { src: "/screens/log.png", label: "Food log" },
            { src: "/screens/stats.png", label: "Stats" },
            { src: "/screens/gut.png", label: "Gut health" },
            { src: "/screens/cycle.png", label: "Cycle tracker" },
            { src: "/screens/profile.png", label: "Profile" },
          ].map((screen, i) => (
            <div key={screen.label} className={`animate-on-scroll stagger-${i + 1} snap-center flex-shrink-0 flex flex-col items-center gap-3`}>
              <IPhoneFrame src={screen.src} alt={screen.label} />
              <span className="text-sm font-medium text-[var(--ink-soft)]">{screen.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="w-full max-w-5xl mx-auto px-6 py-16">
        <div className="animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-[var(--ink)] mb-12">
            Everything in one app
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`animate-on-scroll stagger-${i + 1} bg-[var(--paper)] border-2 border-[var(--border)] rounded-3xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all`}
            >
              <div className="mb-4">
                <Image
                  src={feature.img}
                  alt=""
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="w-full max-w-4xl mx-auto px-6 py-16">
        <div className="animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-[var(--ink)] mb-12">
            How it works
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
          {[
            { step: "1", title: "Set your goals", desc: "Quick setup. Tell us your body and what you want to achieve.", mascot: "/mascot/panda-wave.png" },
            { step: "2", title: "Log your food", desc: "Photo, barcode, search, or tap a saved meal. 10 seconds max.", mascot: "/mascot/panda-cook.png" },
            { step: "3", title: "Watch your progress", desc: "XP, streaks, and insights. See your gut score and macros improve.", mascot: "/mascot/panda-proud.png" },
          ].map((item, i) => (
            <div key={item.step} className={`animate-on-scroll stagger-${i + 1} flex flex-col items-center text-center max-w-[240px]`}>
              <div className="w-16 h-16 rounded-full bg-[var(--coral)] text-white flex items-center justify-center text-2xl font-bold mb-4 border-b-4 border-[var(--coral-d)]">
                {item.step}
              </div>
              <Image src={item.mascot} alt="" width={80} height={80} className="mb-3 object-contain" />
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">{item.title}</h3>
              <p className="text-sm text-[var(--ink-soft)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlight with phone */}
      <section className="w-full max-w-5xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="animate-on-scroll stagger-1 parallax-phone">
            <IPhoneFrame src="/screens/gut.png" alt="Gut health forecast" />
          </div>
          <div className="animate-on-scroll stagger-2 flex-1">
            <h2 className="text-3xl font-semibold text-[var(--ink)] mb-4">
              Insights that actually help
            </h2>
            <p className="text-[var(--ink-soft)] mb-6 leading-relaxed">
              Your macros, gut score, cycle phase, and weight trends in one place.
              No more jumping between apps. No more guessing.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Macro rings", "Gut forecast", "Weight trends", "Cycle tracking"].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-full bg-[var(--paper)] border-2 border-[var(--border)] text-sm font-medium text-[var(--ink-soft)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Second CTA */}
      <section className="w-full max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="animate-on-scroll bg-[var(--paper)] border-2 border-[var(--border)] rounded-3xl p-10">
          <Image
            src="/mascot/panda-heart.png"
            alt="Bao the panda"
            width={100}
            height={100}
            className="mx-auto mb-4 object-contain"
          />
          <h2 className="text-3xl font-semibold text-[var(--ink)] mb-3">
            Ready to meet Bao?
          </h2>
          <p className="text-[var(--ink-soft)] mb-6 max-w-md mx-auto">
            Join the waitlist and be first to try bamboo when it launches.
            Your nutrition journey deserves a buddy who never judges.
          </p>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="waitlist-input flex-1 px-5 py-4 rounded-2xl border-2 border-[var(--border)] bg-white text-[var(--ink)] text-base placeholder:text-[var(--ink-soft)]"
              />
              <button
                type="submit"
                className="px-8 py-4 rounded-2xl bg-[var(--coral)] text-white font-semibold text-base border-b-4 border-[var(--coral-d)] hover:translate-y-[1px] hover:border-b-2 active:translate-y-[3px] active:border-b-0 transition-all cursor-pointer"
              >
                Join waitlist
              </button>
            </form>
          ) : (
            <p className="text-lg font-semibold text-[var(--coral-d)]">
              {"You're on the list! 🎋"}
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-8 text-center border-t border-[var(--border)]">
        <p className="text-sm text-[var(--ink-soft)]">
          &copy; 2026 Bamboo. Built with care for your gut, macros, and mood.
        </p>
        <div className="flex gap-6 justify-center mt-3">
          <a href="/privacy" className="text-sm text-[var(--ink-soft)] hover:text-[var(--coral)] transition-colors">
            Privacy
          </a>
          <a href="/terms" className="text-sm text-[var(--ink-soft)] hover:text-[var(--coral)] transition-colors">
            Terms
          </a>
        </div>
      </footer>
    </main>
  );
}
