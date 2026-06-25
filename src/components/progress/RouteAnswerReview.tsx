import type { RouteMapPoint } from "@/src/data/maps/routeTypes";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";

export type RouteAnswerReviewProps = {
  userRoutePoints?: RouteMapPoint[] | null;
  acceptedRoutePoints?: RouteMapPoint[] | null;
  fromLabel?: string | null;
  toLabel?: string | null;
  routeScore?: {
    drawnLengthMeters?: number;
    acceptedLengthMeters?: number;
    penalties?: string[];
    warnings?: string[];
    feedback?: string[];
  } | null;
  suggestedSteps?: string[];
  scoreLabel: string;
  passed?: boolean | null;
  explanation?: string | null;
  tip?: string | null;
  idealRouteDescription?: string | null;
  showAnswer: boolean;
};

function pointsToPath(points: RouteMapPoint[]) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function formatMetres(value?: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)}m`
    : "Not available";
}

function viewBoxFor(points: RouteMapPoint[]) {
  const validPoints = points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y)
  );
  if (validPoints.length === 0) return "0 0 1600 1000";

  const minX = Math.max(0, Math.min(...validPoints.map((point) => point.x)) - 90);
  const minY = Math.max(0, Math.min(...validPoints.map((point) => point.y)) - 90);
  const maxX = Math.min(1600, Math.max(...validPoints.map((point) => point.x)) + 90);
  const maxY = Math.min(1000, Math.max(...validPoints.map((point) => point.y)) + 90);
  const width = Math.max(300, maxX - minX);
  const height = Math.max(220, maxY - minY);

  return `${Math.min(minX, 1600 - width)} ${Math.min(minY, 1000 - height)} ${width} ${height}`;
}

function routeAttemptDetail({
  hasUserRoute,
  pointCount,
  routeScore
}: {
  hasUserRoute: boolean;
  pointCount: number;
  routeScore: RouteAnswerReviewProps["routeScore"];
}) {
  const firstFeedback = routeScore?.feedback?.[0];
  const firstPenalty = routeScore?.penalties?.[0];

  if (firstFeedback) return firstFeedback;
  if (firstPenalty) return firstPenalty;
  if (hasUserRoute) return `${pointCount} route points were captured.`;
  return "Learner route geometry is not available for this older attempt.";
}

export function RouteAnswerReview({
  userRoutePoints,
  acceptedRoutePoints,
  fromLabel,
  toLabel,
  routeScore,
  suggestedSteps,
  scoreLabel,
  passed,
  explanation,
  tip,
  idealRouteDescription,
  showAnswer
}: RouteAnswerReviewProps) {
  const hasUserRoute = Boolean(userRoutePoints && userRoutePoints.length > 1);
  const hasAcceptedRoute = Boolean(
    acceptedRoutePoints && acceptedRoutePoints.length > 1
  );
  const startPoint = acceptedRoutePoints?.[0];
  const endPoint = acceptedRoutePoints?.[acceptedRoutePoints.length - 1];
  const viewPoints = [
    ...(userRoutePoints ?? []),
    ...(showAnswer ? (acceptedRoutePoints ?? []) : []),
    ...(startPoint ? [startPoint] : []),
    ...(endPoint ? [endPoint] : [])
  ];
  const attemptDetail = routeAttemptDetail({
    hasUserRoute,
    pointCount: userRoutePoints?.length ?? 0,
    routeScore
  });

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Score
          </dt>
          <dd
            className={`mt-1 text-2xl font-bold ${
              passed ? "text-green-700" : "text-red-700"
            }`}
          >
            {scoreLabel}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Result
          </dt>
          <dd className="mt-1 text-base font-bold text-slate-800">
            {passed ? "Passed" : "Below pass"}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Your length
          </dt>
          <dd className="mt-1 text-base font-bold text-slate-800">
            {formatMetres(routeScore?.drawnLengthMeters)}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Suggested
          </dt>
          <dd className="mt-1 text-base font-bold text-slate-800">
            {showAnswer ? formatMetres(routeScore?.acceptedLengthMeters) : "Hidden"}
          </dd>
        </div>
      </dl>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">
        <p className="font-semibold text-slate-500">Attempt detail</p>
        <p className="mt-1">{attemptDetail}</p>
      </div>

      <section>
        <p className="text-sm font-bold text-slate-800">
          {showAnswer ? "Suggested route visual" : "Learner route visual"}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {showAnswer
            ? "Your drawn route is shown against the accepted route."
            : "Your drawn route is shown on the training map. Reveal the accepted route when you are ready to compare."}
        </p>
        <div className="mt-3 overflow-hidden rounded-md border border-slate-300 bg-[#f6f1df]">
          <svg
            aria-label="Route answer preview"
            className="block h-[360px] w-full md:h-[520px]"
            role="img"
            viewBox={viewBoxFor(viewPoints)}
          >
            <image
              height="1000"
              href="/maps/kings-cross-euston/map.svg"
              preserveAspectRatio="none"
              width="1600"
              x="0"
              y="0"
            />
            {hasUserRoute && (
              <path
                d={pointsToPath(userRoutePoints as RouteMapPoint[])}
                fill="none"
                opacity="0.85"
                stroke="#dc2626"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="14"
              />
            )}
            {showAnswer && hasAcceptedRoute && (
              <path
                d={pointsToPath(acceptedRoutePoints as RouteMapPoint[])}
                fill="none"
                opacity="0.9"
                stroke="#15803d"
                strokeDasharray="18 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="12"
              />
            )}
            {startPoint && (
              <g>
                <circle cx={startPoint.x} cy={startPoint.y} fill="#15803d" r="24" />
                <text
                  fill="#ffffff"
                  fontSize="24"
                  fontWeight="700"
                  textAnchor="middle"
                  x={startPoint.x}
                  y={startPoint.y + 8}
                >
                  S
                </text>
              </g>
            )}
            {endPoint && (
              <g>
                <circle cx={endPoint.x} cy={endPoint.y} fill="#7f1d1d" r="24" />
                <text
                  fill="#ffffff"
                  fontSize="24"
                  fontWeight="700"
                  textAnchor="middle"
                  x={endPoint.x}
                  y={endPoint.y + 8}
                >
                  D
                </text>
              </g>
            )}
          </svg>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {hasUserRoute && (
            <span className="inline-flex items-center gap-2 text-red-800">
              <span className="h-1.5 w-6 rounded-full bg-red-600" />
              Solid red: your route
            </span>
          )}
          {showAnswer && hasAcceptedRoute && (
            <span className="inline-flex items-center gap-2 text-green-800">
              <span className="h-1.5 w-6 rounded-full border-t-2 border-dashed border-green-700" />
              Dashed green: accepted route
            </span>
          )}
          {showAnswer && startPoint && endPoint && (
            <span className="text-slate-600">
              S marks start. D marks destination.
            </span>
          )}
          {showAnswer && fromLabel && toLabel && (
            <span className="text-slate-600">
              Start: {fromLabel} - Destination: {toLabel}
            </span>
          )}
        </div>
        {showAnswer && suggestedSteps && suggestedSteps.length > 0 && (
          <div className="mt-4 rounded-md border border-green-100 bg-green-50 p-3 text-sm">
            <p className="font-bold text-green-900">Suggested route steps</p>
            <p className="mt-2 text-green-900">{suggestedSteps.join(" -> ")}</p>
          </div>
        )}
        {showAnswer && !hasAcceptedRoute && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Suggested route geometry is unavailable for this attempt.
          </div>
        )}
        {showAnswer ? (
          <div className="mt-4">
            <QuestionExplanation
              explanation={
                explanation ||
                "Compare your route with the suggested route and review any route penalties."
              }
              idealRouteDescription={idealRouteDescription}
              tip={tip}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            The suggested route is hidden. Show it when you are ready to review.
          </div>
        )}
        {showAnswer &&
          routeScore &&
          ((routeScore.penalties?.length ?? 0) > 0 ||
            (routeScore.warnings?.length ?? 0) > 0) && (
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {(routeScore.penalties?.length ?? 0) > 0 && (
                <div className="rounded-md border border-red-100 bg-red-50 p-3">
                  <p className="font-bold text-red-800">Penalties</p>
                  <ul className="mt-2 space-y-1 text-red-800">
                    {routeScore.penalties?.map((penalty) => (
                      <li key={penalty}>{penalty}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(routeScore.warnings?.length ?? 0) > 0 && (
                <div className="rounded-md border border-amber-100 bg-amber-50 p-3">
                  <p className="font-bold text-amber-900">Warnings</p>
                  <ul className="mt-2 space-y-1 text-amber-900">
                    {routeScore.warnings?.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
      </section>
    </div>
  );
}
