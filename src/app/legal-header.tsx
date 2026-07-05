import Image from "next/image";
import Link from "next/link";

export function LegalHeader() {
  return (
    <header className="mb-10">
      <Link href="/" className="inline-flex items-center gap-2.5">
        <Image
          src="/app-icon-new.png"
          alt=""
          width={28}
          height={28}
          className="rounded-lg"
        />
        <span
          className="text-lg font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          bamboo
        </span>
      </Link>
    </header>
  );
}
