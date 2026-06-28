"use client";

import { useState } from "react";
import Image from "next/image";

interface Screen {
  src: string;
  label: string;
  alt: string;
}

export function ScreenShowcase({ screens }: { screens: Screen[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Tab buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        {screens.map((screen, i) => (
          <button
            key={screen.label}
            onClick={() => setActive(i)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              active === i
                ? "bg-[var(--green)] text-white shadow-md shadow-[var(--green)]/20"
                : "bg-white text-[var(--ink-soft)] border border-[var(--border)] hover:border-[var(--green)] hover:text-[var(--green)]"
            }`}
          >
            {screen.label}
          </button>
        ))}
      </div>

      {/* Large phone display */}
      <div className="phone-frame w-[300px] md:w-[340px] mx-auto">
        <Image
          key={screens[active].src}
          src={screens[active].src}
          alt={screens[active].alt}
          width={340}
          height={736}
          sizes="340px"
          className="w-full h-auto block"
          priority
        />
      </div>

      {/* Thumbnail row */}
      <div className="flex gap-3 justify-center">
        {screens.map((screen, i) => (
          <button
            key={screen.src}
            onClick={() => setActive(i)}
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
