"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Screen {
  src: string;
  label: string;
  alt: string;
  bubble: string;
}

// Decorative garnish for sighted users. Hidden from assistive tech so the
// auto-cycle does not spam screen readers with changing text.
function ScreenBubble({ text, side }: { text: string; side: "left" | "right" }) {
  return (
    <div
      key={text}
      aria-hidden="true"
      className={`speech-bubble hidden lg:block absolute top-16 w-44 ${
        side === "left"
          ? "right-full mr-7 bubble-tail-right"
          : "left-full ml-7 bubble-tail-left"
      }`}
    >
      <p className="text-sm font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-heading)" }}>
        {text}
      </p>
    </div>
  );
}

export function ScreenShowcase({ screens }: { screens: readonly Screen[] }) {
  const [active, setActive] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);

  // Auto-advance every 4s until the user takes over. Skipped under reduced motion.
  useEffect(() => {
    if (userInteracted) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % screens.length);
    }, 4000);
    return () => clearInterval(id);
  }, [userInteracted, screens.length]);

  function handleSelect(i: number) {
    setUserInteracted(true);
    setActive(i);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Tab buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        {screens.map((screen, i) => (
          <button
            key={screen.label}
            onClick={() => handleSelect(i)}
            aria-pressed={active === i}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              active === i
                ? "bg-[var(--green-dark)] text-white shadow-md shadow-[var(--green)]/20"
                : "bg-white text-[var(--ink-soft)] border border-[var(--border)] hover:border-[var(--green)] hover:text-[var(--green)]"
            }`}
          >
            {screen.label}
          </button>
        ))}
      </div>

      {/* Mobile bubble sits between the tabs and the phone */}
      <div
        key={screens[active].bubble}
        aria-hidden="true"
        className="speech-bubble bubble-tail-bottom relative lg:hidden max-w-xs text-center -mb-2"
      >
        <p className="text-sm font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-heading)" }}>
          {screens[active].bubble}
        </p>
      </div>

      {/* Large phone display */}
      <div className="relative">
        <ScreenBubble
          text={screens[active].bubble}
          side={active % 2 === 0 ? "right" : "left"}
        />
        <div className="phone-frame w-[300px] md:w-[340px] mx-auto">
          <Image
            key={screens[active].src}
            src={screens[active].src}
            alt={screens[active].alt}
            width={340}
            height={736}
            sizes="340px"
            className="w-full h-auto block"
          />
        </div>
      </div>

      {/* Thumbnail row */}
      <div className="flex gap-3 justify-center">
        {screens.map((screen, i) => (
          <button
            key={screen.src}
            onClick={() => handleSelect(i)}
            aria-pressed={active === i}
            className={`rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
              active === i
                ? "border-[var(--green)] shadow-md shadow-[var(--green)]/15 scale-105"
                : "border-transparent opacity-50 hover:opacity-80"
            }`}
          >
            <Image
              src={screen.src}
              alt={screen.label}
              width={56}
              height={121}
              sizes="56px"
              className="w-14 h-auto block"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
