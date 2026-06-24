import Link from "next/link";
import type {
  PracticeRecommendation,
  RecommendationPriority
} from "@/lib/analytics/recommendationEngine";

type PracticeRecommendationsProps = {
  recommendations: PracticeRecommendation[];
};

const priorityStyles: Record<RecommendationPriority, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-blue-200 bg-blue-50 text-road",
  low: "border-slate-200 bg-slate-50 text-slate-600"
};

function priorityLabel(priority: RecommendationPriority) {
  if (priority === "high") return "High priority";
  if (priority === "medium") return "Recommended";
  return "Keep going";
}

function RecommendationCard({
  recommendation,
  featured = false
}: {
  recommendation: PracticeRecommendation;
  featured?: boolean;
}) {
  return (
    <article
      className={`rounded-lg border bg-white p-5 shadow-sm ${
        featured ? "border-road ring-1 ring-road/15" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
            priorityStyles[recommendation.priority]
          }`}
        >
          {priorityLabel(recommendation.priority)}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {recommendation.category}
        </span>
      </div>
      <h3
        className={`mt-3 font-bold text-ink ${
          featured ? "text-2xl" : "text-lg"
        }`}
      >
        {recommendation.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {recommendation.description}
      </p>
      <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
        <span className="font-semibold text-ink">Why:</span>{" "}
        {recommendation.reason}
      </p>
      <Link
        className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2 text-sm font-semibold ${
          featured
            ? "bg-road text-white hover:bg-blue-700"
            : "border border-slate-300 bg-white text-slate-700 hover:border-road hover:text-road"
        }`}
        href={recommendation.suggestedHref}
      >
        {recommendation.suggestedActionLabel}
      </Link>
    </article>
  );
}

export function PracticeRecommendations({
  recommendations
}: PracticeRecommendationsProps) {
  if (recommendations.length === 0) return null;

  const [topRecommendation, ...secondaryRecommendations] = recommendations;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-road">
          Recommended next steps
        </p>
        <h2 className="mt-1 text-2xl font-bold text-ink">
          What to practise next
        </h2>
      </div>

      <RecommendationCard featured recommendation={topRecommendation} />

      {secondaryRecommendations.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {secondaryRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
            />
          ))}
        </div>
      )}
    </section>
  );
}
