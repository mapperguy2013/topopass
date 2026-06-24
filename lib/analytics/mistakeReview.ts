export type MistakeReviewType = "knowledge" | "map-click" | "route";

export type MistakeSortMode = "newest" | "weakest" | "most-repeated";

export type MistakeReviewFilter = {
  type?: MistakeReviewType | "all";
  reviewed?: "all" | "reviewed" | "unreviewed";
  search?: string;
};

export type MistakeAttemptView = {
  id: string;
  questionId: string;
  type: MistakeReviewType;
  title: string;
  category?: string | null;
  userAnswer: string;
  correctAnswer: string;
  score: string;
  date: string;
  percentage: number | null;
  explanation?: string | null;
  tip?: string | null;
};

export type AggregatedMistakeView<T extends MistakeAttemptView = MistakeAttemptView> =
  T & {
    reviewKey: string;
    missedCount: number;
    latestMissedDate: string;
    lowestPercentage: number | null;
    reviewed: boolean;
  };

export function mistakeReviewKey(type: MistakeReviewType, questionId: string) {
  return `${type}:${questionId}`;
}

function scoreValue(value: number | null) {
  return typeof value === "number" ? value : Number.POSITIVE_INFINITY;
}

export function aggregateMistakes<T extends MistakeAttemptView>(
  mistakes: T[],
  reviewedKeys: string[] = []
): AggregatedMistakeView<T>[] {
  const reviewed = new Set(reviewedKeys);
  const grouped = new Map<
    string,
    {
      latest: T;
      count: number;
      lowestPercentage: number | null;
      latestDate: string;
    }
  >();

  mistakes.forEach((mistake) => {
    const key = mistakeReviewKey(mistake.type, mistake.questionId);
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        latest: mistake,
        count: 1,
        lowestPercentage: mistake.percentage,
        latestDate: mistake.date
      });
      return;
    }

    const isNewer = mistake.date.localeCompare(existing.latestDate) > 0;
    grouped.set(key, {
      latest: isNewer ? mistake : existing.latest,
      count: existing.count + 1,
      lowestPercentage:
        scoreValue(mistake.percentage) < scoreValue(existing.lowestPercentage)
          ? mistake.percentage
          : existing.lowestPercentage,
      latestDate: isNewer ? mistake.date : existing.latestDate
    });
  });

  return [...grouped.entries()].map(([key, value]) => ({
    ...value.latest,
    reviewKey: key,
    missedCount: value.count,
    latestMissedDate: value.latestDate,
    lowestPercentage: value.lowestPercentage,
    reviewed: reviewed.has(key)
  }));
}

export function filterMistakes<T extends AggregatedMistakeView>(
  mistakes: T[],
  filter: MistakeReviewFilter = {}
) {
  const type = filter.type ?? "all";
  const reviewed = filter.reviewed ?? "all";
  const search = filter.search?.trim().toLowerCase() ?? "";

  return mistakes.filter((mistake) => {
    if (type !== "all" && mistake.type !== type) return false;
    if (reviewed === "reviewed" && !mistake.reviewed) return false;
    if (reviewed === "unreviewed" && mistake.reviewed) return false;
    if (!search) return true;

    const haystack = [
      mistake.title,
      mistake.category,
      mistake.userAnswer,
      mistake.correctAnswer,
      mistake.explanation,
      mistake.tip
    ]
      .filter((value): value is string => typeof value === "string")
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

export function sortMistakes<T extends AggregatedMistakeView>(
  mistakes: T[],
  mode: MistakeSortMode = "newest"
) {
  return [...mistakes].sort((a, b) => {
    if (mode === "weakest") {
      return scoreValue(a.lowestPercentage) - scoreValue(b.lowestPercentage);
    }

    if (mode === "most-repeated") {
      return (
        b.missedCount - a.missedCount ||
        b.latestMissedDate.localeCompare(a.latestMissedDate)
      );
    }

    return b.latestMissedDate.localeCompare(a.latestMissedDate);
  });
}

export function getMistakeTypeLabel(type: MistakeReviewType) {
  if (type === "map-click") return "Map-click";
  if (type === "route") return "Route";
  return "Knowledge";
}
