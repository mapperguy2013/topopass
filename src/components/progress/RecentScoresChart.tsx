type RecentScoresChartProps = {
  scores: number[];
};

const chartWidth = 360;
const chartHeight = 220;
const padding = {
  top: 18,
  right: 18,
  bottom: 38,
  left: 42
};
const gridValues = [100, 75, 50, 25, 0] as const;

function clampScore(score: number) {
  return Math.min(Math.max(score, 0), 100);
}

function pointForScore(score: number, index: number, total: number) {
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const x =
    total <= 1
      ? padding.left + plotWidth / 2
      : padding.left + (plotWidth * index) / (total - 1);
  const y = padding.top + ((100 - clampScore(score)) / 100) * plotHeight;

  return { x, y };
}

export function RecentScoresChart({ scores }: RecentScoresChartProps) {
  if (scores.length === 0) {
    return (
      <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
        Complete a scored practice attempt or mock exam to start building a
        recent score trend.
      </div>
    );
  }

  const points = scores.map((score, index) =>
    pointForScore(score, index, scores.length)
  );
  const linePath =
    points.length === 1
      ? ""
      : points
          .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
          )
          .join(" ");

  return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
      <svg
        aria-label="Recent score line chart"
        className="h-auto min-w-[320px] max-w-full"
        role="img"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        <title>Recent scores from oldest to newest</title>
        {gridValues.map((value) => {
          const y = pointForScore(value, 0, 1).y;

          return (
            <g key={value}>
              <line
                stroke="#dbe3ef"
                strokeDasharray={value === 0 ? undefined : "3 4"}
                x1={padding.left}
                x2={chartWidth - padding.right}
                y1={y}
                y2={y}
              />
              <text
                fill="#64748b"
                fontSize="11"
                textAnchor="end"
                x={padding.left - 8}
                y={y + 4}
              >
                {value}%
              </text>
            </g>
          );
        })}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        )}
        {points.map((point, index) => (
          <g key={`${index}-${scores[index]}`}>
            <circle
              cx={point.x}
              cy={point.y}
              fill="#ffffff"
              r="6"
              stroke="#2563eb"
              strokeWidth="4"
            />
            <text
              fill="#0f172a"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              x={point.x}
              y={Math.max(12, point.y - 12)}
            >
              {clampScore(scores[index])}%
            </text>
            <text
              fill="#64748b"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              x={point.x}
              y={chartHeight - 12}
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
