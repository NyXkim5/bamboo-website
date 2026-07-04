"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "var(--green)",
  "var(--honey)",
  "var(--coral)",
  "var(--purple)",
] as const;
const PARTICLE_COUNT = 24;

type Particle = {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
};

// Deterministic index-based spread: no Math.random, stable between renders.
function buildParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    left: (i * 41) % 100,
    delay: ((i * 13) % 40) / 100,
    duration: 1 + ((i * 7) % 60) / 100,
    color: COLORS[i % COLORS.length],
    size: 6 + ((i * 5) % 6),
  }));
}

export function ConfettiBurst() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Client-only init: particles cannot be built during SSR and reduced motion
    // must be checked first, so this effect is the earliest safe place to set state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(buildParticles());
    const id = setTimeout(() => setParticles([]), 2500);
    return () => clearTimeout(id);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div aria-hidden="true" className="confetti-field">
      {particles.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
