import Image from "next/image";

const TOP_PANELS = [
  {
    src: "/panda/step-1.png",
    alt: "Step 1, track your day. Bao logs meals on a phone next to a daily view with a 493 kcal ring.",
    width: 470,
    height: 890,
  },
  {
    src: "/panda/step-2.png",
    alt: "Step 2, understand your stats. Bao reviews weekly rings, macros, and easy insights.",
    width: 470,
    height: 890,
  },
  {
    src: "/panda/step-3.png",
    alt: "Step 3, improve your gut health. Gut forecast score 58 with fiber and fermented food factors.",
    width: 470,
    height: 890,
  },
] as const;

const BOTTOM_PANELS = [
  {
    src: "/panda/step-4.png",
    alt: "Step 4, build healthy habits that stick. Daily quests and a 14 day streak.",
    width: 712,
    height: 482,
  },
  {
    src: "/panda/step-5.png",
    alt: "Step 5, fuel your body, nourish your life. Chef Bao cooking beside food suggestions.",
    width: 712,
    height: 482,
  },
  {
    src: "/panda/step-6.png",
    alt: "Step 6, see your progress and celebrate wins. Bao lifts a trophy over weekly progress bars.",
    width: 712,
    height: 400,
  },
  {
    src: "/panda/step-7.png",
    alt: "Step 7, your health, all in one place. Food, water, activity, sleep, mood, and gut.",
    width: 712,
    height: 400,
  },
] as const;

const PANEL_CLASS =
  "rounded-3xl overflow-hidden shadow-lg shadow-black/8 border border-[var(--border-hover)] feature-card bg-white";

export function ComicStrip() {
  return (
    <section className="w-full py-20 bg-[var(--bg-warm)]">
      <div className="reveal max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-center text-[var(--ink)] mb-12">
          Your daily dashboard with Bao
        </h2>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {TOP_PANELS.map((panel, i) => (
            <div key={panel.src} className={`reveal stagger-${i + 1} ${PANEL_CLASS}`}>
              <Image
                src={panel.src}
                alt={panel.alt}
                width={panel.width}
                height={panel.height}
                sizes="(max-width: 768px) 100vw, 320px"
                className="w-full h-auto block"
              />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {BOTTOM_PANELS.map((panel, i) => (
            <div key={panel.src} className={`reveal stagger-${(i % 2) + 1} ${PANEL_CLASS}`}>
              <Image
                src={panel.src}
                alt={panel.alt}
                width={panel.width}
                height={panel.height}
                sizes="(max-width: 768px) 100vw, 480px"
                className="w-full h-auto block"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
