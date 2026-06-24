import {
  normalizeMockAttempts,
  normalizePracticeAttempts
} from "../db/progressMigration.ts";

export type WeakArea = {
  area: string;
  averageScore: number;
};

const areaLabels = {
  knowledge: "Knowledge",
  "map-click": "Map-click",
  "route-drawing": "Route"
} as const;

type AreaKey = keyof typeof areaLabels;

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length
  );
}

function collectAreaScores(practiceAttempts: unknown[], mockAttempts: unknown[]) {
  const scores: Record<AreaKey, number[]> = {
    knowledge: [],
    "map-click": [],
    "route-drawing": []
  };

  normalizePracticeAttempts(practiceAttempts).forEach((attempt) => {
    if (typeof attempt.percentage === "number") {
      scores[attempt.questionType].push(attempt.percentage);
    }
  });

  normalizeMockAttempts(mockAttempts).forEach((attempt) => {
    attempt.questionResults.forEach((result) => {
      scores[result.type].push(result.percentage);
    });
  });

  return scores;
}

export function getAreaBreakdown(
  practiceAttempts: unknown[],
  mockAttempts: unknown[]
): WeakArea[] {
  const scores = collectAreaScores(practiceAttempts, mockAttempts);

  return (Object.keys(scores) as AreaKey[])
    .filter((area) => scores[area].length > 0)
    .map((area) => ({
      area: areaLabels[area],
      averageScore: average(scores[area])
    }))
    .sort((a, b) => a.averageScore - b.averageScore);
}

export function getWeakestArea(
  practiceAttempts: unknown[],
  mockAttempts: unknown[]
) {
  return getAreaBreakdown(practiceAttempts, mockAttempts)[0] ?? null;
}

export function getStrongestArea(
  practiceAttempts: unknown[],
  mockAttempts: unknown[]
) {
  return getAreaBreakdown(practiceAttempts, mockAttempts).at(-1) ?? null;
}
