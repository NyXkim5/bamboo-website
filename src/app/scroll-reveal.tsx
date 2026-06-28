"use client";

import { type ReactNode } from "react";
import { useScrollReveal } from "./use-scroll-reveal";

export function ScrollReveal({ children }: { children: ReactNode }) {
  const ref = useScrollReveal();

  return (
    <main ref={ref} className="flex flex-col items-center">
      {children}
    </main>
  );
}
