"use client";

import { useEffect, useState } from "react";
import { SEED_COUNT } from "./waitlist-constants";

export function WaitlistCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/waitlist/count")
      .then((r) => r.json() as Promise<{ count: number }>)
      .then((d) => setCount(d.count))
      .catch(() => setCount(SEED_COUNT));
  }, []);

  if (count === null) return null;

  return (
    <p className="text-sm text-[var(--ink-soft)] mt-3">
      <span className="font-bold text-[var(--green)]">
        {count.toLocaleString()}+
      </span>{" "}
      people on the waitlist
    </p>
  );
}
