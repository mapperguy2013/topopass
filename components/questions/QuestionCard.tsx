type QuestionCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function QuestionCard({
  title,
  description,
  children
}: QuestionCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}
