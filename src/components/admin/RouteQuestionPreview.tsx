import type { RouteQuestionValidationResult } from "@/lib/routeQuestionValidation";
import type { RouteQuestion } from "@/src/data/routeQuestions";
import { RouteDrawingQuestion } from "@/src/components/route/RouteDrawingQuestion";
import { kingsCrossEustonRouteGraph } from "@/src/data/maps/kings-cross-euston/routeGraph";

type RouteQuestionPreviewProps = {
  question: RouteQuestion;
  validation: RouteQuestionValidationResult;
};

function routePath(question: RouteQuestion) {
  return (question.acceptedRoute?.geometry ?? [])
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
}

export function RouteQuestionPreview({
  question,
  validation
}: RouteQuestionPreviewProps) {
  const bounds = question.mapBounds;
  const geometry = question.acceptedRoute?.geometry ?? [];
  const start = geometry[0];
  const end = geometry[geometry.length - 1];
  const canShowMap =
    question.mapArea === "kings-cross-euston" &&
    bounds &&
    bounds.minX < bounds.maxX &&
    bounds.minY < bounds.maxY;

  return (
    <section className="space-y-4 rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-road">
            Student preview
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            {question.title || "Untitled route question"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {question.prompt || "No question prompt has been added."}
          </p>
        </div>
        <span
          className={`w-fit rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
            validation.valid
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {validation.valid ? "Valid" : "Needs attention"}
        </span>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="border-l-4 border-green-700 bg-green-50 px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-green-800">
            Pickup / start
          </dt>
          <dd className="mt-1 font-bold text-ink">
            {question.fromLabel || "Not set"}
          </dd>
        </div>
        <div className="border-l-4 border-red-800 bg-red-50 px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-red-800">
            Destination / end
          </dt>
          <dd className="mt-1 font-bold text-ink">
            {question.toLabel || "Not set"}
          </dd>
        </div>
      </dl>

      {canShowMap ? (
        <div className="overflow-hidden rounded-md border border-slate-400 bg-[#f6f1df]">
          <svg
            aria-label={`Accepted route preview for ${question.title || question.id}`}
            className="block h-auto w-full"
            role="img"
            viewBox={`${bounds.minX} ${bounds.minY} ${bounds.maxX - bounds.minX} ${bounds.maxY - bounds.minY}`}
          >
            <image
              height={bounds.maxY - bounds.minY}
              href="/maps/kings-cross-euston/map.svg"
              preserveAspectRatio="none"
              width={bounds.maxX - bounds.minX}
              x={bounds.minX}
              y={bounds.minY}
            />
            {geometry.length > 1 && (
              <path
                d={routePath(question)}
                fill="none"
                stroke="#166534"
                strokeDasharray="12 8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="7"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {start && (
              <circle
                cx={start[0]}
                cy={start[1]}
                fill="#166534"
                r="10"
                stroke="white"
                strokeWidth="3"
              />
            )}
            {end && (
              <circle
                cx={end[0]}
                cy={end[1]}
                fill="#7f1d1d"
                r="10"
                stroke="white"
                strokeWidth="3"
              />
            )}
          </svg>
        </div>
      ) : (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          A map preview is not available until a supported map area and valid
          bounds are selected.
        </p>
      )}

      {validation.errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-800">Validation errors</p>
          <ul className="mt-2 space-y-1 text-sm text-red-800">
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {question.explanation && (
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-bold text-ink">Feedback explanation</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {question.explanation}
          </p>
        </div>
      )}

      {canShowMap && geometry.length > 1 && (
        <div className="border-t border-slate-200 pt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-road">
            Sample learner route scoring
          </p>
          <RouteDrawingQuestion
            acceptedRoutePoints={geometry.map(([x, y]) => ({ x, y }))}
            graph={kingsCrossEustonRouteGraph}
            mapImagePath="/maps/kings-cross-euston/map.svg"
            question={question}
            showDeveloperTools
          />
        </div>
      )}
    </section>
  );
}
