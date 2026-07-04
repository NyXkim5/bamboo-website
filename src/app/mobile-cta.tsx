"use client";

import { useEffect, useState } from "react";

export function MobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targets = [
      document.getElementById("get-early-access"),
      document.getElementById("final-cta"),
    ].filter((el): el is HTMLElement => el !== null);
    // Fail closed: if either anchor is missing, never show the bar.
    if (targets.length < 2) return;

    const inView = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) inView.add(entry.target);
        else inView.delete(entry.target);
      });
      setVisible(inView.size === 0);
    });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[var(--border)] px-6 py-3 transition-transform duration-300 motion-reduce:transition-none ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <a
        href="#get-early-access"
        className="block w-full text-center px-6 py-3 rounded-full bg-[var(--green)] text-white font-medium shadow-sm"
      >
        Get early access
      </a>
    </div>
  );
}
