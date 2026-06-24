import {
  normalizeMockAttempts,
  normalizePracticeAttempts,
  type NormalizedMockAttempt,
  type NormalizedPracticeAttempt,
  type NormalizedMockQuestionResult
} from "../db/progressMigration.ts";
import { getRecentTrendSummary } from "./progressTrends.ts";
import { calculateLearningStreak } from "./streakCalculator.ts";

export type RecommendationPriority = "high" | "medium" | "low";

export type RecommendationCategory =
  | "knowledge"
  | "map-click"
  | "route"
  | "mock-test"
  | "mistake-review"
  | "consistency"
  | "general";

export type PracticeRecommendation = {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  reason: string;
  suggestedActionLabel: string;
  suggestedHref: string;
  category: RecommendationCategory;
};

export type RecommendationEngineInput = {
  practiceAttempts?: unknown[];
  mockAttempts?: unknown[];
  limit?: number;
  referenceDate?: Date;
};

type AreaKey = "knowledge" | "map-click" | "route";

type AreaPerformance = {
  area: AreaKey;
  label: string;
  averageScore: number;
  attempts: number;
  failedAttempts: number;
};

const PASS_THRESHOLD = 70;
const RECENT_MISTAKE_DAYS = 30;

const areaLabels: Record<AreaKey, string> = {
  knowledge: "Knowledge",
  "map-click": "Map-click",
  route: "Route"
};

const areaPracticeLinks: Record<AreaKey, string> = {
  knowledge: "/practice/knowledge",
  "map-click": "/practice/map-click",
  route: "/practice/routes"
};

const areaActionLabels: Record<AreaKey, string> = {
  knowledge: "Practise knowledge",
  "map-click": "Practise map-click",
  route: "Practise routes"
};

function normalizeArea(value: string): AreaKey {
  return value === "route-drawing" || value === "route"
    ? "route"
    : value === "map-click"
      ? "map-click"
      : "knowledge";
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length
  );
}

function isPassed(value: boolean | null, percentage: number | null) {
  if (typeof value === "boolean") return value;
  if (typeof percentage === "number") return percentage >= PASS_THRESHOLD;
  return false;
}

function daysBetween(referenceDate: Date, value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor(
    (referenceDate.getTime() - date.getTime()) / 86_400_000
  );
}

function collectAreaPerformance(
  practiceAttempts: NormalizedPracticeAttempt[],
  mockAttempts: NormalizedMockAttempt[]
): AreaPerformance[] {
  const scores: Record<AreaKey, number[]> = {
    knowledge: [],
    "map-click": [],
    route: []
  };
  const failed: Record<AreaKey, number> = {
    knowledge: 0,
    "map-click": 0,
    route: 0
  };

  practiceAttempts.forEach((attempt) => {
    if (typeof attempt.percentage !== "number") return;
    const area = normalizeArea(attempt.questionType);
    scores[area].push(attempt.percentage);
    if (!isPassed(attempt.passed, attempt.percentage)) failed[area] += 1;
  });

  mockAttempts.forEach((attempt) => {
    attempt.questionResults.forEach((result) => {
      const area = normalizeArea(result.type);
      scores[area].push(result.percentage);
      if (!result.passed) failed[area] += 1;
    });
  });

  return (Object.keys(scores) as AreaKey[])
    .filter((area) => scores[area].length > 0)
    .map((area) => ({
      area,
      label: areaLabels[area],
      averageScore: average(scores[area]),
      attempts: scores[area].length,
      failedAttempts: failed[area]
    }))
    .sort((a, b) => a.averageScore - b.averageScore);
}

function weakAreaRecommendation(area: AreaPerformance): PracticeRecommendation {
  const labels: Record<AreaKey, { title: string; description: string }> = {
    knowledge: {
      title: "Strengthen knowledge questions",
      description:
        "Focus on TfL-style rules, directions, and location knowledge before your next mock exam."
    },
    "map-click": {
      title: "Practise map-click location questions",
      description:
        "Spend time identifying London places accurately on the map and checking your distance from the target."
    },
    route: {
      title: "Practise route drawing",
      description:
        "Route attempts are below the pass level, so prioritise point-to-point route planning exercises."
    }
  };

  return {
    id: `weak-${area.area}`,
    title: labels[area.area].title,
    description: labels[area.area].description,
    priority: area.averageScore < 60 ? "high" : "medium",
    reason: `${area.label} average is ${area.averageScore}% across ${area.attempts} attempt${area.attempts === 1 ? "" : "s"}.`,
    suggestedActionLabel: areaActionLabels[area.area],
    suggestedHref: areaPracticeLinks[area.area],
    category: area.area
  };
}

function hasRecentMistakes(
  practiceAttempts: NormalizedPracticeAttempt[],
  mockAttempts: NormalizedMockAttempt[],
  referenceDate: Date
) {
  const failedPractice = practiceAttempts.some(
    (attempt) =>
      !isPassed(attempt.passed, attempt.percentage) &&
      daysBetween(referenceDate, attempt.createdAt) <= RECENT_MISTAKE_DAYS
  );
  const failedMockQuestion = mockAttempts.some(
    (attempt) =>
      daysBetween(referenceDate, attempt.submittedAt) <= RECENT_MISTAKE_DAYS &&
      attempt.questionResults.some((result) => !result.passed)
  );

  return failedPractice || failedMockQuestion;
}

function latestMockAttempt(mockAttempts: NormalizedMockAttempt[]) {
  return [...mockAttempts].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt)
  )[0];
}

function isStrongOverall(
  practiceAttempts: NormalizedPracticeAttempt[],
  mockAttempts: NormalizedMockAttempt[]
) {
  const scores = [...practiceAttempts, ...mockAttempts]
    .map((attempt) => attempt.percentage)
    .filter((value): value is number => typeof value === "number");

  return scores.length >= 5 && average(scores) >= 80;
}

function beginnerRecommendations(): PracticeRecommendation[] {
  return [
    {
      id: "beginner-knowledge",
      title: "Start with knowledge practice",
      description:
        "Build confidence with the basic question format before moving into maps and routes.",
      priority: "high",
      reason: "No saved attempts were found yet.",
      suggestedActionLabel: "Start knowledge practice",
      suggestedHref: "/practice/knowledge",
      category: "knowledge"
    },
    {
      id: "beginner-map-click",
      title: "Try map-click practice",
      description:
        "Practise identifying London locations and checking how close your answer is.",
      priority: "medium",
      reason: "Map-click questions are part of the current practice set.",
      suggestedActionLabel: "Practise map-click",
      suggestedHref: "/practice/map-click",
      category: "map-click"
    },
    {
      id: "beginner-route",
      title: "Attempt route practice",
      description:
        "Draw point-to-point routes and review the score before taking a full mock exam.",
      priority: "medium",
      reason: "Route planning is a key skill for the mock exam flow.",
      suggestedActionLabel: "Practise routes",
      suggestedHref: "/practice/routes",
      category: "route"
    },
    {
      id: "beginner-mock-after-practice",
      title: "Take a mock exam after a few attempts",
      description:
        "Complete some practice first, then use the mock exam to check mixed-question readiness.",
      priority: "low",
      reason: "A mixed mock is most useful after some baseline practice data exists.",
      suggestedActionLabel: "Open mock exam",
      suggestedHref: "/mock-test",
      category: "mock-test"
    }
  ];
}

function dedupeRecommendations(
  recommendations: PracticeRecommendation[]
): PracticeRecommendation[] {
  const seen = new Set<string>();
  return recommendations.filter((recommendation) => {
    const key = recommendation.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rankPriority(priority: RecommendationPriority) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

function countFailedQuestions(
  practiceAttempts: NormalizedPracticeAttempt[],
  mockAttempts: NormalizedMockAttempt[]
) {
  const failedPractice = practiceAttempts.filter(
    (attempt) => !isPassed(attempt.passed, attempt.percentage)
  ).length;
  const failedMockQuestions = mockAttempts.reduce(
    (total, attempt) =>
      total +
      attempt.questionResults.filter(
        (result: NormalizedMockQuestionResult) => !result.passed
      ).length,
    0
  );

  return failedPractice + failedMockQuestions;
}

export function getPracticeRecommendations({
  practiceAttempts = [],
  mockAttempts = [],
  limit = 5,
  referenceDate = new Date()
}: RecommendationEngineInput = {}): PracticeRecommendation[] {
  const normalizedPracticeAttempts = normalizePracticeAttempts(practiceAttempts);
  const normalizedMockAttempts = normalizeMockAttempts(mockAttempts);
  const totalAttempts =
    normalizedPracticeAttempts.length + normalizedMockAttempts.length;

  if (totalAttempts === 0) {
    return beginnerRecommendations().slice(0, limit);
  }

  const recommendations: PracticeRecommendation[] = [];
  const areaPerformance = collectAreaPerformance(
    normalizedPracticeAttempts,
    normalizedMockAttempts
  );

  areaPerformance
    .filter((area) => area.averageScore < PASS_THRESHOLD)
    .forEach((area) => recommendations.push(weakAreaRecommendation(area)));

  const latestMock = latestMockAttempt(normalizedMockAttempts);
  if (latestMock && !isPassed(latestMock.passed, latestMock.percentage)) {
    recommendations.push({
      id: "failed-latest-mock",
      title: "Review weak areas before another mock",
      description:
        "Your latest mock exam did not pass. Use targeted practice before retrying the full timed exam.",
      priority: "high",
      reason: `Latest mock result was ${latestMock.percentage ?? 0}%.`,
      suggestedActionLabel: "Review mistakes",
      suggestedHref: "/progress/mistakes",
      category: "mock-test"
    });
  }

  const failedQuestions = countFailedQuestions(
    normalizedPracticeAttempts,
    normalizedMockAttempts
  );
  if (
    failedQuestions > 0 &&
    hasRecentMistakes(
      normalizedPracticeAttempts,
      normalizedMockAttempts,
      referenceDate
    )
  ) {
    recommendations.push({
      id: "review-recent-mistakes",
      title: "Review recent mistakes",
      description:
        "Go back through missed questions while the attempt is still fresh.",
      priority: "high",
      reason: `${failedQuestions} saved question result${failedQuestions === 1 ? "" : "s"} need review.`,
      suggestedActionLabel: "Open mistake review",
      suggestedHref: "/progress/mistakes",
      category: "mistake-review"
    });
  }

  if (normalizedMockAttempts.length === 0 && normalizedPracticeAttempts.length >= 4) {
    recommendations.push({
      id: "first-mock-exam",
      title: "Try a timed mock exam",
      description:
        "You have enough practice data to test mixed-question readiness under timed conditions.",
      priority: "medium",
      reason: `${normalizedPracticeAttempts.length} practice attempts are saved and no mock exam has been completed yet.`,
      suggestedActionLabel: "Start mock exam",
      suggestedHref: "/mock-test",
      category: "mock-test"
    });
  }

  const trend = getRecentTrendSummary(
    normalizedPracticeAttempts,
    normalizedMockAttempts
  );
  if (trend.direction === "improving") {
    recommendations.push({
      id: "continue-improving-trend",
      title: "Continue the improving trend",
      description:
        "Recent scores are moving in the right direction. Keep practising the same mix this session.",
      priority: "medium",
      reason: trend.message,
      suggestedActionLabel: "Continue practice",
      suggestedHref: "/practice",
      category: "consistency"
    });
  }

  if (isStrongOverall(normalizedPracticeAttempts, normalizedMockAttempts)) {
    recommendations.push({
      id: "strong-performance-mock",
      title: "Use a mock exam to confirm readiness",
      description:
        "Your recent saved scores are strong enough to make a full mixed mock useful.",
      priority: "medium",
      reason: "Overall average is at least 80% across saved attempts.",
      suggestedActionLabel: "Start mock exam",
      suggestedHref: "/mock-test",
      category: "mock-test"
    });
  }

  const streak = calculateLearningStreak(
    normalizedPracticeAttempts,
    normalizedMockAttempts,
    referenceDate
  );
  if (streak.current >= 3) {
    recommendations.push({
      id: "maintain-learning-streak",
      title: "Keep the current study streak",
      description:
        "A short focused practice session is enough to keep momentum without overloading the session.",
      priority: "low",
      reason: `Current streak is ${streak.current} day${streak.current === 1 ? "" : "s"}.`,
      suggestedActionLabel: "Open practice",
      suggestedHref: "/practice",
      category: "consistency"
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "balanced-practice",
      title: "Keep a balanced practice mix",
      description:
        "No clear weak area stands out yet, so rotate through knowledge, map-click, and route questions.",
      priority: "medium",
      reason: "Saved scores do not currently show a single priority area.",
      suggestedActionLabel: "Open practice",
      suggestedHref: "/practice",
      category: "general"
    });
  }

  return dedupeRecommendations(recommendations)
    .sort((a, b) => rankPriority(a.priority) - rankPriority(b.priority))
    .slice(0, limit);
}

export function getTopPracticeRecommendation(
  input: RecommendationEngineInput = {}
) {
  return getPracticeRecommendations({ ...input, limit: 1 })[0] ?? null;
}
