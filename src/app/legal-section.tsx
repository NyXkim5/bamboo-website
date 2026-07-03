export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-[var(--green-dark)] mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}
