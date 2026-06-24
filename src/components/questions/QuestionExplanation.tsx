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
      <p className="font-bold text-blue-950">{title}</p>
      {hasExplanation && <p className="mt-2">{explanation}</p>}
      {hasAcceptedArea && (
        <p className="mt-2">
          <span className="font-semibold">Accepted area:</span>{" "}
          {acceptedAreaDescription}
        </p>
      )}
      {hasIdealRoute && (
        <p className="mt-2">
          <span className="font-semibold">Ideal route:</span>{" "}
          {idealRouteDescription}
        </p>
      )}
      {hasTip && (
        <p className="mt-2 rounded-md border border-blue-200 bg-white/70 p-3">
          <span className="font-semibold">Learning tip:</span> {tip}
        </p>
      )}
    </section>
  );
}
