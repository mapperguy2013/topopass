type QuestionExplanationProps = {
  explanation?: string | null;
  tip?: string | null;
  acceptedAreaDescription?: string | null;
  idealRouteDescription?: string | null;
  title?: string;
};

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function QuestionExplanation({
  explanation,
  tip,
  acceptedAreaDescription,
  idealRouteDescription,
  title = "Explanation"
}: QuestionExplanationProps) {
  const hasExplanation = hasText(explanation);
  const hasTip = hasText(tip);
  const hasAcceptedArea = hasText(acceptedAreaDescription);
  const hasIdealRoute = hasText(idealRouteDescription);

  if (!hasExplanation && !hasTip && !hasAcceptedArea && !hasIdealRoute) {
    return null;
  }

  return (
    <section className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-800">
      <p className="text-base font-bold text-blue-950">{title}</p>
      <div className="mt-3 space-y-3">
        {hasExplanation && (
          <div className="rounded-md bg-white/70 p-3">
            <p className="font-semibold text-blue-950">Why this matters</p>
            <p className="mt-1">{explanation}</p>
          </div>
        )}
        {hasAcceptedArea && (
          <div className="rounded-md bg-white/70 p-3">
            <p className="font-semibold text-blue-950">Accepted area</p>
            <p className="mt-1">{acceptedAreaDescription}</p>
          </div>
        )}
        {hasIdealRoute && (
          <div className="rounded-md bg-white/70 p-3">
            <p className="font-semibold text-blue-950">Driver-focused route</p>
            <p className="mt-1">{idealRouteDescription}</p>
          </div>
        )}
      </div>
      {hasTip && (
        <p className="mt-3 rounded-md border border-blue-200 bg-white p-3">
          <span className="font-semibold">Learning tip:</span> {tip}
        </p>
      )}
    </section>
  );
}
