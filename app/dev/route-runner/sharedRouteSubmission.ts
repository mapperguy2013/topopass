import type { RouteExercise, RouteMatchingResult } from "../../../lib/map-engine/index.ts";
import type { GeneratedLearnerExercise } from "../../../lib/training/learnerExerciseGeneration.ts";
import type { LearnerRouteValidationSegment } from "../../../lib/training/learnerRouteValidation.ts";
import type { LearnerTrainingModeReview } from "./learnerTrainingModeUi.ts";
import type { DrawnRouteSubmitBlockCode } from "./routeRunnerDisplay.ts";
import type { RouteAttemptReview, RouteAttemptReviewItem } from "./routeAttemptReview.ts";

export const SHARED_ROUTE_SUBMIT_LABEL = "Submit route";
export const SHARED_ROUTE_SUBMISSION_MINIMUM_FEEDBACK_MS = 120;

export type SharedRouteSubmissionState = {
  state: "idle" | "submitting" | "submitted" | "blocked" | "failed";
  requestId: number | null;
  attemptKey: string | null;
  code: DrawnRouteSubmitBlockCode | null;
  message: string | null;
  devMessage: string | null;
};

export type BeginSharedRouteSubmissionResult = {
  accepted: boolean;
  state: SharedRouteSubmissionState;
};

export function createIdleSharedRouteSubmissionState(): SharedRouteSubmissionState {
  return {
    state: "idle",
    requestId: null,
    attemptKey: null,
    code: null,
    message: null,
    devMessage: null
  };
}

export function beginSharedRouteSubmission(input: {
  current: SharedRouteSubmissionState;
  requestId: number;
  attemptKey: string;
}): BeginSharedRouteSubmissionResult {
  if (input.current.state === "submitting") {
    return { accepted: false, state: input.current };
  }

  return {
    accepted: true,
    state: {
      state: "submitting",
      requestId: input.requestId,
      attemptKey: input.attemptKey,
      code: null,
      message: "Checking your route...",
      devMessage: null
    }
  };
}

export function resolveSharedRouteSubmission(input: {
  current: SharedRouteSubmissionState;
  requestId: number;
  attemptKey: string;
  submitted: boolean;
  code: DrawnRouteSubmitBlockCode | null;
  learnerMessage: string | null;
  devMessage: string | null;
}): SharedRouteSubmissionState {
  if (
    input.current.state !== "submitting" ||
    input.current.requestId !== input.requestId ||
    input.current.attemptKey !== input.attemptKey
  ) {
    return input.current;
  }

  return {
    state: input.submitted ? "submitted" : "blocked",
    requestId: input.requestId,
    attemptKey: input.attemptKey,
    code: input.code,
    message: input.learnerMessage,
    devMessage: input.devMessage
  };
}

export function failSharedRouteSubmission(input: {
  current: SharedRouteSubmissionState;
  requestId: number;
  attemptKey: string;
  message: string;
}): SharedRouteSubmissionState {
  if (
    input.current.state !== "submitting" ||
    input.current.requestId !== input.requestId ||
    input.current.attemptKey !== input.attemptKey
  ) {
    return input.current;
  }

  return {
    state: "failed",
    requestId: input.requestId,
    attemptKey: input.attemptKey,
    code: null,
    message: "We could not check this route. Try submitting it again.",
    devMessage: input.message
  };
}

function routeExerciseDifficulty(
  difficulty: GeneratedLearnerExercise["difficulty"]
): RouteExercise["difficulty"] {
  if (difficulty === "beginner" || difficulty === "easy") {
    return "easy";
  }

  if (difficulty === "intermediate") {
    return "medium";
  }

  return "hard";
}

export function trainingExerciseToRouteExercise(exercise: GeneratedLearnerExercise): RouteExercise {
  return {
    id: exercise.id,
    title: exercise.title,
    mapId: exercise.mapId,
    exerciseVersion: exercise.mapVersion ? String(exercise.mapVersion) : undefined,
    stops: exercise.checkpoints.map((stop) => ({ ...stop })),
    description: exercise.objectives.find((objective) => objective.required)?.description,
    difficulty: routeExerciseDifficulty(exercise.difficulty)
  };
}

export function matchedRouteToLearnerSegments(
  matchResult: RouteMatchingResult | null
): LearnerRouteValidationSegment[] {
  if (!matchResult || matchResult.status !== "matched" || !matchResult.isReadyForRunRouteExercise) {
    return [];
  }

  return matchResult.attemptedMovements.map((movement, index) => ({
    id: `learner-attempt-segment-${index + 1}`,
    roadId: movement.roadId,
    fromNodeId: movement.fromNodeId,
    toNodeId: movement.toNodeId
  }));
}

function formatDistance(distanceMeters: number): string {
  return Number.isFinite(distanceMeters) ? `${Math.round(distanceMeters)} m` : "n/a";
}

function formatExtraDistance(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters)) {
    return "n/a";
  }

  return distanceMeters <= 0 ? "0 m" : `+${Math.round(distanceMeters)} m`;
}

const INTERNAL_ROUTE_IDENTIFIER_PATTERN =
  /\b(?:movement|node|road|segment)\s+(?:[a-z]*\d+(?:[-_:][a-z0-9]+)*|[a-z0-9]+(?:[-_:][a-z0-9]+)+)\b|\bosm-(?:way|node|relation)-[a-z0-9_-]+\b/i;

function learnerSafeFeedbackLabel(value: string): string {
  return INTERNAL_ROUTE_IDENTIFIER_PATTERN.test(value) ? "Route matching issue" : value;
}

function learnerSafeFeedbackDetail(value: string): string {
  return INTERNAL_ROUTE_IDENTIFIER_PATTERN.test(value)
    ? "The submitted line could not be matched to a continuous legal road sequence."
    : value;
}

function feedbackItem(
  message: LearnerTrainingModeReview["feedback"]["messages"][number],
  index: number
): RouteAttemptReviewItem {
  const whatHappened = message.whatHappened.toLowerCase();
  const label =
    message.issueType === "efficiency"
      ? "Route too long"
      : whatHappened.includes("begin") && whatHappened.includes("start")
        ? "Wrong start"
        : whatHappened.includes("destination") && (whatHappened.includes("miss") || whatHappened.includes("not"))
          ? "Wrong destination"
          : whatHappened.includes("checkpoint") && (whatHappened.includes("miss") || whatHappened.includes("not"))
            ? "Missed required stop"
            : learnerSafeFeedbackLabel(message.whatHappened);

  return {
    id: `training-feedback-${index + 1}`,
    label,
    detail: learnerSafeFeedbackDetail(message.whyItMatters),
    severity:
      message.severity === "dangerous" || message.severity === "serious"
        ? "error"
        : message.severity === "positive"
          ? "info"
          : "warning"
  };
}

function dedupeFeedbackItems(items: readonly RouteAttemptReviewItem[]): RouteAttemptReviewItem[] {
  const seenLabels = new Set<string>();

  return items.filter((item) => {
    const key = item.label.trim().toLowerCase();

    if (seenLabels.has(key)) {
      return false;
    }

    seenLabels.add(key);
    return true;
  });
}

export function dedupeSharedRouteFeedbackItems(
  items: readonly RouteAttemptReviewItem[]
): RouteAttemptReviewItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.label.trim().toLowerCase()}::${(item.detail ?? "").trim().toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function trainingReviewToRouteAttemptReview(
  review: LearnerTrainingModeReview,
  routeReview?: RouteAttemptReview
): RouteAttemptReview {
  const scoring = review.scoring;
  const feedback = review.feedback;
  const status: RouteAttemptReview["status"] =
    scoring.status === "passed"
      ? "pass"
      : scoring.status === "failed"
        ? "fail"
        : "blocked";
  const items = feedback.messages
    .filter((message) => message.severity !== "positive")
    .map((message, index) => ({ message, index }));
  const illegalMovements = dedupeFeedbackItems(
    items
      .filter(({ message }) => message.issueType === "legal" || message.issueType === "safety")
      .map(({ message, index }) => feedbackItem(message, index))
  );
  const missedRestrictions = dedupeFeedbackItems(
    items
      .filter(({ message }) => message.issueType !== "legal" && message.issueType !== "safety")
      .map(({ message, index }) => feedbackItem(message, index))
  );
  const correctionHints = [
    ...feedback.improvements,
    ...items.map(({ message }) => message.improvementSuggestion)
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

  const distanceMetrics = routeReview?.distanceMetrics.length
    ? routeReview.distanceMetrics.map((metric) => ({ ...metric }))
    : [
        {
          id: "student-route-distance" as const,
          label: "Your route",
          value: formatDistance(scoring.metrics.attemptedDistanceMeters)
        },
        {
          id: "shortest-legal-distance" as const,
          label: "Shortest legal route",
          value: formatDistance(scoring.metrics.expectedDistanceMeters)
        },
        {
          id: "extra-distance" as const,
          label: "Extra distance",
          value: formatExtraDistance(scoring.metrics.extraDistanceMeters)
        }
      ];

  return {
    status,
    versionSnapshot: null,
    title: status === "pass" ? "Route passed" : status === "fail" ? "Route failed" : "Route was not scored",
    scoreLabel: `${scoring.scorePercent.toFixed(1)}% (${scoring.passed ? "pass" : "fail"})`,
    distanceLabel:
      routeReview?.distanceLabel ??
      distanceMetrics.map((metric) => `${metric.label}: ${metric.value}`).join(". "),
    distanceMetrics,
    illegalMovements,
    missedRestrictions,
    suggestedFailureReason: status === "pass" ? null : feedback.summary,
    correctionHints,
    practiceRecommendations: [],
    recommendedPracticeQueue: []
  };
}
