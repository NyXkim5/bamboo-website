import Image from "next/image";

const BENEFITS = [
  {
    heading: "Track your day in seconds",
    body: "Snap a photo and Bamboo logs the meal, the macros, and the calories. Every log earns XP toward your next level.",
    screen: "/screens/dashboard.png",
    screenAlt: "Bamboo dashboard with calorie ring, macro bars, and streak",
    mascot: "/panda/cooking.png",
    mascotAlt: "Bao cooking a meal",
  },
  {
    heading: "Understand your stats at a glance",
    body: "Weekly rings show protein, carbs, and fat without spreadsheets. Your clean food percentage tells you how the week really went.",
    screen: "/screens/macros.png",
    screenAlt: "Weekly macro rings and breakdown bars",
    mascot: "/panda/writing.png",
    mascotAlt: "Bao taking notes",
  },
  {
    heading: "Improve your gut, feel the difference",
    body: "Fiber, fermented foods, and plant diversity roll into one gut score. Watch it climb as your plate gets more colorful.",
    screen: "/screens/gut-forecast.png",
    screenAlt: "Gut forecast score with fiber and fermented food factors",
    mascot: "/panda/broccoli.png",
    mascotAlt: "Bao holding broccoli",
  },
] as const;

export function Benefits() {
  return (
    <section className="w-full py-20 bg-[var(--bg-warm)]">
      <div className="reveal max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-center text-[var(--ink)] mb-12">
          Your daily dashboard with Bao
        </h2>
      </div>
      <div className="flex flex-col gap-16 max-w-4xl mx-auto px-6">
        {BENEFITS.map((benefit, i) => (
          <div
            key={benefit.heading}
            className={`reveal flex flex-col items-center gap-8 md:gap-14 ${
              i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
            }`}
          >
            <div className="phone-frame w-[200px] md:w-[220px] flex-shrink-0">
              <Image
                src={benefit.screen}
                alt={benefit.screenAlt}
                width={220}
                height={476}
                sizes="220px"
                className="w-full h-auto block"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <Image
                src={benefit.mascot}
                alt={benefit.mascotAlt}
                width={72}
                height={72}
                sizes="72px"
                className="object-contain mb-4 mx-auto md:mx-0"
              />
              <h3 className="text-xl md:text-2xl font-semibold text-[var(--ink)] mb-3">
                {benefit.heading}
              </h3>
              <p className="text-[var(--ink-soft)] leading-relaxed max-w-md mx-auto md:mx-0">
                {benefit.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
