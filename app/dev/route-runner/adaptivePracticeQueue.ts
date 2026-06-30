import type {
  LearnerWeakAreaProfile,
  RouteAttemptHistoryItem,
  RouteAttemptHistoryState,
  RouteAttemptReview,
  RoutePracticeWeaknessType
} from "./routeAttemptReview.ts";
import type { SavedRouteAttemptListItem } from "./routeAttemptStorage.ts";
import type { AdaptivePracticeOutcomeFeedback } from "./adaptivePracticeLauncher.ts";

export type AdaptivePracticeQueueItemType =
  | "restriction-focus"
  | "efficiency-focus"
  | "checkpoint-focus"
  | "route-drawing-focus"
  | "review-prior-attempt"
  | "confidence-builder"
  | "mixed-practice";

export type AdaptivePracticeQueuePriority = "urgent" | "high" | "medium" | "low";
export type AdaptivePracticeConfidenceLevel = "low" | "medium" | "high";
export type AdaptivePracticeExerciseDifficulty = "easy" | "medium" | "hard";
export type AttemptHistoryTrend = "improving" | "declining" | "stable" | "insufficient";

export type AdaptivePracticeSourceSignals = {
  latestReview: boolean;
  weakAreaProfile: boolean;
  attemptHistory: boolean;
  savedAttempts: boolean;
  outcomeFeedback: boolean;
};

export type AdaptivePracticeExercise = {
  id: string;
  title: string;
  focusAreas: string[];
  difficulty: AdaptivePracticeExerciseDifficulty;
};

export type SavedRouteAttemptSummary = Partial<
  Pick<
    SavedRouteAttemptListItem,
    | "id"
    | "exerciseId"
    | "exerciseLabel"
    | "createdAt"
    | "scoreLabel"
    | "statusLabel"
    | "passed"
    | "failureReason"
    | "reviewPayload"
  >
>;

export type AttemptHistoryInsights = {
  attemptCount: number;
  failureCount: number;
  recentFailureCount: number;
  repeatedFailureCount: number;
  repeatedFailureReasons: string[];
  legalButInefficientCount: number;
  dominantWeakAreas: RoutePracticeWeaknessType[];
  trend: AttemptHistoryTrend;
  latestScores: number[];
};

export type AdaptivePracticeQueueItem = {
  id: string;
  type: AdaptivePracticeQueueItemType;
  title: string;
  explanation: string;
  practiceFocus: string;
  priority: AdaptivePracticeQueuePriority;
  score: number;
  reasons: string[];
  relatedWeakAreas: RoutePracticeWeaknessType[];
  relatedExerciseIds: string[];
  sourceSignals: AdaptivePracticeSourceSignals;
};

export type AdaptivePracticeQueueResult = {
  generatedAt: string;
  items: AdaptivePracticeQueueItem[];
  summary: {
    primaryFocus: string;
    reason: string;
    confidenceLevel: AdaptivePracticeConfidenceLevel;
  };
  signals: {
    latestAttemptUsed: boolean;
    weakAreaProfileUsed: boolean;
    attemptHistoryUsed: boolean;
    savedAttemptsUsed: boolean;
    outcomeFeedbackUsed: boolean;
    availableExerciseCount: number;
  };
};

export type BuildAdaptivePracticeQueueInput = {
  latestReview?: RouteAttemptReview | null;
  weakAreaProfile?: LearnerWeakAreaProfile | null;
  attemptHistoryInsights?: AttemptHistoryInsights | null;
  savedAttempts?: readonly (SavedRouteAttemptSummary | null | undefined)[];
  outcomeFeedbackHistory?: readonly (AdaptivePracticeOutcomeFeedback | null | undefined)[];
  availableExercises?: readonly AdaptivePracticeExercise[];
  now?: Date;
};

type QueueCandidate = Omit<AdaptivePracticeQueueItem, "priority" | "score"> & {
  score: number;
};

type QueueDefinition = {
  id: string;
  type: AdaptivePracticeQueueItemType;
  title: string;
  explanation: string;
  practiceFocus: string;
  legalityCritical?: boolean;
  efficiencyIssue?: boolean;
};

const priorityOrder: Record<AdaptivePracticeQueuePriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3
};

const weaknessDefinitions: Record<RoutePracticeWeaknessType, QueueDefinition> = {
  "prohibited-turn": {
    id: "adaptive-prohibited-turns",
    type: "restriction-focus",
    title: "Practise prohibited turns",
    explanation: "Recent route feedback shows a banned turn movement at a junction.",
    practiceFocus: "Slow down at junctions, check the turn signs, and plan the next legal road before drawing.",
    legalityCritical: true
  },
  "no-entry": {
    id: "adaptive-no-entry-roads",
    type: "restriction-focus",
    title: "Practise no-entry roads",
    explanation: "Recent route feedback shows entry into a road from a blocked direction.",
    practiceFocus: "Spot no-entry symbols early and approach destinations from an allowed direction.",
    legalityCritical: true
  },
  "one-way-direction": {
    id: "adaptive-one-way-direction",
    type: "restriction-focus",
    title: "Practise one-way direction",
    explanation: "Recent route feedback shows travel against a one-way road direction.",
    practiceFocus: "Follow one-way arrows and choose turns that keep the route with legal traffic flow.",
    legalityCritical: true
  },
  "restricted-road": {
    id: "adaptive-restricted-roads",
    type: "restriction-focus",
    title: "Practise restricted roads",
    explanation: "Recent route feedback shows use of a restricted or closed road movement.",
    practiceFocus: "Identify restricted-road symbols before drawing and choose the nearest legal alternative.",
    legalityCritical: true
  },
  "wrong-start": {
    id: "adaptive-correct-start",
    type: "checkpoint-focus",
    title: "Practise starting at the correct point",
    explanation: "Recent route feedback shows the attempt did not begin at the required start.",
    practiceFocus: "Check the start marker first, then begin the route from that exact node."
  },
  "wrong-destination": {
    id: "adaptive-correct-destination",
    type: "checkpoint-focus",
    title: "Practise finishing at the destination",
    explanation: "Recent route feedback shows the attempt did not finish at the required destination.",
    practiceFocus: "Trace the route all the way to the destination marker before releasing the pointer."
  },
  "missed-checkpoint": {
    id: "adaptive-required-checkpoints",
    type: "checkpoint-focus",
    title: "Practise ordered checkpoints",
    explanation: "Recent route feedback shows a checkpoint was missed or visited out of order.",
    practiceFocus: "Say each required stop in order before drawing, then route through each stop before the destination."
  },
  "disconnected-drawing": {
    id: "adaptive-continuous-drawing",
    type: "route-drawing-focus",
    title: "Practise continuous route drawing",
    explanation: "Recent route feedback shows matched roads that did not connect.",
    practiceFocus: "Draw one steady line through roads that meet at real junctions without jumping between roads."
  },
  "insufficient-drawing": {
    id: "adaptive-complete-drawing",
    type: "route-drawing-focus",
    title: "Practise complete route drawing",
    explanation: "Recent route feedback shows a tap, short trace, or incomplete drawing.",
    practiceFocus: "Start at the origin, keep drawing along the road shape, and stop only when you reach the destination."
  },
  "route-efficiency": {
    id: "adaptive-route-efficiency",
    type: "efficiency-focus",
    title: "Practise shorter legal routes",
    explanation: "Recent route feedback shows a legal route that was too long compared with the shortest legal route.",
    practiceFocus: "Look for avoidable detours and compare your route distance with the shortest legal distance.",
    efficiencyIssue: true
  },
  "advanced-route": {
    id: "adaptive-advanced-route",
    type: "mixed-practice",
    title: "Try a harder route",
    explanation: "Recent route feedback is clean enough to move on to a harder exercise.",
    practiceFocus: "Choose a route with more junctions or checkpoints and keep the same careful restriction checks."
  },
  "general-route-review": {
    id: "adaptive-general-review",
    type: "mixed-practice",
    title: "Review the latest route feedback",
    explanation: "The latest review has general next steps but no dominant weakness.",
    practiceFocus: "Retry the current exercise and compare your result with the previous review."
  }
};

function emptySignals(): AdaptivePracticeSourceSignals {
  return {
    latestReview: false,
    weakAreaProfile: false,
    attemptHistory: false,
    savedAttempts: false,
    outcomeFeedback: false
  };
}

function addUnique(values: string[], value: string): void {
  if (value && !values.includes(value)) {
    values.push(value);
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseScoreLabel(scoreLabel: string | null | undefined): number | null {
  if (!scoreLabel) {
    return null;
  }

  const match = /(-?\d+(?:\.\d+)?)/.exec(scoreLabel);

  if (!match) {
    return null;
  }

  const score = Number.parseFloat(match[1]);

  return Number.isFinite(score) ? score : null;
}

function textFromReviewItem(item: unknown): string {
  const candidate = objectValue(item);

  return [candidate.label, candidate.detail, candidate.reason, candidate.title, candidate.explanation]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

function weaknessFromText(text: string): RoutePracticeWeaknessType | null {
  const lower = text.toLowerCase();

  if (lower.includes("no-entry") || lower.includes("no entry")) {
    return "no-entry";
  }

  if (lower.includes("one-way") || lower.includes("one way") || lower.includes("wrong way")) {
    return "one-way-direction";
  }

  if (lower.includes("prohibited turn") || lower.includes("no left") || lower.includes("no right")) {
    return "prohibited-turn";
  }

  if (lower.includes("restricted road") || lower.includes("closed road") || lower.includes("restricted or closed")) {
    return "restricted-road";
  }

  if (lower.includes("wrong start") || lower.includes("required start")) {
    return "wrong-start";
  }

  if (lower.includes("wrong destination") || lower.includes("required destination")) {
    return "wrong-destination";
  }

  if (lower.includes("missed checkpoint") || lower.includes("missed required") || lower.includes("out of order")) {
    return "missed-checkpoint";
  }

  if (lower.includes("disconnected") || lower.includes("do not connect")) {
    return "disconnected-drawing";
  }

  if (lower.includes("insufficient drawing") || lower.includes("no route drawn") || lower.includes("too short")) {
    return "insufficient-drawing";
  }

  if (lower.includes("too long") || lower.includes("efficiency") || lower.includes("shortest legal")) {
    return "route-efficiency";
  }

  return null;
}

function weaknessFromRecommendationId(id: string): RoutePracticeWeaknessType | null {
  if (id.includes("prohibited-turn")) {
    return "prohibited-turn";
  }

  if (id.includes("no-entry")) {
    return "no-entry";
  }

  if (id.includes("one-way")) {
    return "one-way-direction";
  }

  if (id.includes("restricted-road")) {
    return "restricted-road";
  }

  if (id.includes("start")) {
    return "wrong-start";
  }

  if (id.includes("destination")) {
    return "wrong-destination";
  }

  if (id.includes("checkpoint")) {
    return "missed-checkpoint";
  }

  if (id.includes("continuous")) {
    return "disconnected-drawing";
  }

  if (id.includes("drawing")) {
    return "insufficient-drawing";
  }

  if (id.includes("efficiency") || id.includes("shorter-route")) {
    return "route-efficiency";
  }

  if (id.includes("harder-route")) {
    return "advanced-route";
  }

  return null;
}

function relatedWeaknessesFromReview(review: RouteAttemptReview): RoutePracticeWeaknessType[] {
  const weaknesses: RoutePracticeWeaknessType[] = [];

  for (const item of review.recommendedPracticeQueue) {
    addUnique(weaknesses, item.weaknessType);
  }

  for (const recommendation of review.practiceRecommendations) {
    const weakness = weaknessFromRecommendationId(recommendation.id) ?? weaknessFromText(recommendation.title);

    if (weakness) {
      addUnique(weaknesses, weakness);
    }
  }

  for (const item of [...review.illegalMovements, ...review.missedRestrictions]) {
    const weakness = weaknessFromText(`${item.label} ${item.detail ?? ""}`);

    if (weakness) {
      addUnique(weaknesses, weakness);
    }
  }

  if (review.suggestedFailureReason) {
    const weakness = weaknessFromText(review.suggestedFailureReason);

    if (weakness) {
      addUnique(weaknesses, weakness);
    }
  }

  return weaknesses;
}

function relatedWeaknessesFromSavedAttempt(attempt: SavedRouteAttemptSummary): RoutePracticeWeaknessType[] {
  const weaknesses: RoutePracticeWeaknessType[] = [];
  const reviewPayload = objectValue(attempt.reviewPayload);

  for (const item of arrayValue(reviewPayload.recommendedPracticeQueue)) {
    const candidate = objectValue(item);

    if (typeof candidate.weaknessType === "string" && candidate.weaknessType in weaknessDefinitions) {
      addUnique(weaknesses, candidate.weaknessType);
    }
  }

  for (const item of arrayValue(reviewPayload.practiceRecommendations)) {
    const candidate = objectValue(item);
    const recommendationId = typeof candidate.id === "string" ? candidate.id : "";
    const weakness =
      weaknessFromRecommendationId(recommendationId) ??
      weaknessFromText([candidate.title, candidate.explanation, candidate.practiceFocus].filter(Boolean).join(" "));

    if (weakness) {
      addUnique(weaknesses, weakness);
    }
  }

  for (const field of ["illegalMovements", "missedRestrictions"] as const) {
    for (const item of arrayValue(reviewPayload[field])) {
      const weakness = weaknessFromText(textFromReviewItem(item));

      if (weakness) {
        addUnique(weaknesses, weakness);
      }
    }
  }

  const savedText = [attempt.failureReason, reviewPayload.suggestedFailureReason, reviewPayload.title]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  const fallbackWeakness = weaknessFromText(savedText);

  if (fallbackWeakness) {
    addUnique(weaknesses, fallbackWeakness);
  }

  return weaknesses;
}

function isFailedSavedAttempt(attempt: SavedRouteAttemptSummary): boolean {
  const reviewPayload = objectValue(attempt.reviewPayload);
  const payloadStatus = typeof reviewPayload.status === "string" ? reviewPayload.status : "";

  return attempt.passed === false || attempt.statusLabel === "Fail" || attempt.statusLabel === "Blocked" || payloadStatus === "fail" || payloadStatus === "blocked";
}

function isLegalButInefficientHistoryItem(item: RouteAttemptHistoryItem): boolean {
  if (item.review.illegalMovements.length > 0) {
    return false;
  }

  return (
    weaknessFromText(item.primaryFailureReason ?? "") === "route-efficiency" ||
    item.review.missedRestrictions.some((missed) => weaknessFromText(`${missed.label} ${missed.detail ?? ""}`) === "route-efficiency")
  );
}

function isRouteAttemptHistoryState(
  input: RouteAttemptHistoryState | readonly RouteAttemptHistoryItem[]
): input is RouteAttemptHistoryState {
  return !Array.isArray(input) && Array.isArray((input as RouteAttemptHistoryState).items);
}

function extractHistoryItems(input?: RouteAttemptHistoryState | readonly RouteAttemptHistoryItem[] | null): RouteAttemptHistoryItem[] {
  if (!input) {
    return [];
  }

  return isRouteAttemptHistoryState(input) ? [...input.items] : [...input];
}

export function buildAttemptHistoryInsights(
  input?: RouteAttemptHistoryState | readonly RouteAttemptHistoryItem[] | null
): AttemptHistoryInsights {
  const items = extractHistoryItems(input);
  const scores = items
    .map((item) => parseScoreLabel(item.scoreLabel))
    .filter((score): score is number => score !== null);
  const recentScores = scores.slice(-4);
  const failureItems = items.filter((item) => item.status !== "pass");
  const recentFailureCount = items.slice(-3).filter((item) => item.status !== "pass").length;
  const failureReasonCounts = new Map<string, number>();
  const weaknessCounts = new Map<RoutePracticeWeaknessType, number>();

  for (const item of failureItems) {
    const reason = item.primaryFailureReason ?? item.title;
    failureReasonCounts.set(reason, (failureReasonCounts.get(reason) ?? 0) + 1);
  }

  for (const item of items) {
    for (const weakness of relatedWeaknessesFromReview(item.review)) {
      weaknessCounts.set(weakness, (weaknessCounts.get(weakness) ?? 0) + 1);
    }
  }

  let trend: AttemptHistoryTrend = "insufficient";

  if (recentScores.length >= 3) {
    const delta = recentScores[recentScores.length - 1] - recentScores[0];
    trend = delta >= 5 ? "improving" : delta <= -5 ? "declining" : "stable";
  }

  const repeatedFailureReasons = Array.from(failureReasonCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([reason]) => reason);

  const dominantWeakAreas = Array.from(weaknessCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([weakness]) => weakness);

  return {
    attemptCount: items.length,
    failureCount: failureItems.length,
    recentFailureCount,
    repeatedFailureCount: repeatedFailureReasons.length,
    repeatedFailureReasons,
    legalButInefficientCount: items.filter(isLegalButInefficientHistoryItem).length,
    dominantWeakAreas,
    trend,
    latestScores: recentScores
  };
}

function priorityFromScore(score: number): AdaptivePracticeQueuePriority {
  if (score >= 80) {
    return "urgent";
  }

  if (score >= 50) {
    return "high";
  }

  if (score >= 25) {
    return "medium";
  }

  return "low";
}

function addCandidate(
  candidates: Map<string, QueueCandidate>,
  definition: QueueDefinition,
  input: {
    score: number;
    reason: string;
    weakness?: RoutePracticeWeaknessType;
    source?: keyof AdaptivePracticeSourceSignals;
    relatedExerciseIds?: readonly string[];
  }
): void {
  const existing = candidates.get(definition.id);
  const candidate: QueueCandidate =
    existing ??
    {
      id: definition.id,
      type: definition.type,
      title: definition.title,
      explanation: definition.explanation,
      practiceFocus: definition.practiceFocus,
      score: 0,
      reasons: [],
      relatedWeakAreas: [],
      relatedExerciseIds: [],
      sourceSignals: emptySignals()
    };

  candidate.score += input.score;
  addUnique(candidate.reasons, input.reason);

  if (input.weakness) {
    addUnique(candidate.relatedWeakAreas, input.weakness);
  }

  if (input.source) {
    candidate.sourceSignals[input.source] = true;
  }

  for (const exerciseId of input.relatedExerciseIds ?? []) {
    addUnique(candidate.relatedExerciseIds, exerciseId);
  }

  candidates.set(candidate.id, candidate);
}

function addWeaknessCandidate(
  candidates: Map<string, QueueCandidate>,
  weakness: RoutePracticeWeaknessType,
  input: {
    source: keyof AdaptivePracticeSourceSignals;
    baseScore: number;
    reason: string;
    causedFailure?: boolean;
    count?: number;
  }
): void {
  const definition = weaknessDefinitions[weakness];
  let score = input.baseScore;

  if (input.causedFailure) {
    score += 20;
  }

  if (definition.legalityCritical) {
    score += 15;
  }

  if (definition.efficiencyIssue) {
    score += 10;
  }

  if (typeof input.count === "number" && input.count > 1) {
    score += Math.min(15, (input.count - 1) * 5);
  }

  addCandidate(candidates, definition, {
    score,
    reason: input.reason,
    weakness,
    source: input.source
  });
}

function applyOutcomeFeedback(
  candidates: Map<string, QueueCandidate>,
  feedbackHistory: readonly AdaptivePracticeOutcomeFeedback[]
): void {
  for (const feedback of feedbackHistory) {
    if (feedback.outcome === "unknown") {
      continue;
    }

    if (feedback.outcome === "resolved") {
      for (const weakness of feedback.deprioritizedWeakAreas) {
        const candidate = candidates.get(weaknessDefinitions[weakness]?.id);

        if (!candidate) {
          continue;
        }

        candidate.score -= 20;
        candidate.sourceSignals.outcomeFeedback = true;
        addUnique(candidate.reasons, "Lower priority because recent practice resolved this focus.");
      }

      continue;
    }

    if (feedback.outcome === "repeated-issue") {
      for (const weakness of feedback.reinforcedWeakAreas) {
        addWeaknessCandidate(candidates, weakness, {
          source: "outcomeFeedback",
          baseScore: 35,
          causedFailure: true,
          reason: "Boosted because this issue repeated after practice."
        });
      }

      continue;
    }

    if (feedback.outcome === "improved") {
      for (const weakness of feedback.reinforcedWeakAreas) {
        addWeaknessCandidate(candidates, weakness, {
          source: "outcomeFeedback",
          baseScore: 15,
          reason: "Still recommended because the last practice improved but did not fully resolve it."
        });
      }

      continue;
    }

    if (feedback.outcome === "mixed") {
      for (const weakness of feedback.reinforcedWeakAreas) {
        addWeaknessCandidate(candidates, weakness, {
          source: "outcomeFeedback",
          baseScore: 25,
          reason: "Boosted because the last practice had a mixed outcome on this focus."
        });
      }
    }
  }
}

function applyExerciseMatches(
  candidate: QueueCandidate,
  availableExercises: readonly AdaptivePracticeExercise[]
): void {
  const matches = availableExercises.filter((exercise) =>
    exercise.focusAreas.some(
      (focusArea) =>
        focusArea === candidate.type ||
        candidate.relatedWeakAreas.includes(focusArea as RoutePracticeWeaknessType)
    )
  );

  for (const exercise of matches) {
    addUnique(candidate.relatedExerciseIds, exercise.id);
  }

  if (matches.length > 0) {
    candidate.score += 5;
    addUnique(candidate.reasons, "Linked to an available development exercise.");
  }
}

function finaliseCandidates(
  candidates: Map<string, QueueCandidate>,
  availableExercises: readonly AdaptivePracticeExercise[]
): AdaptivePracticeQueueItem[] {
  return Array.from(candidates.values())
    .map((candidate) => {
      applyExerciseMatches(candidate, availableExercises);

      return {
        ...candidate,
        priority: priorityFromScore(candidate.score),
        relatedWeakAreas: [...candidate.relatedWeakAreas].sort(),
        relatedExerciseIds: [...candidate.relatedExerciseIds].sort()
      };
    })
    .sort((left, right) => {
      const priorityDifference = priorityOrder[left.priority] - priorityOrder[right.priority];

      return priorityDifference || right.score - left.score || left.id.localeCompare(right.id);
    });
}

function confidenceLevel(input: {
  topItem?: AdaptivePracticeQueueItem;
  signalsUsed: number;
  hasDefaultOnly: boolean;
}): AdaptivePracticeConfidenceLevel {
  if (input.hasDefaultOnly || !input.topItem) {
    return "low";
  }

  if (input.signalsUsed >= 2 || input.topItem.score >= 70) {
    return "high";
  }

  return "medium";
}

export function buildAdaptivePracticeQueue(input: BuildAdaptivePracticeQueueInput): AdaptivePracticeQueueResult {
  const generatedAt = (input.now ?? new Date()).toISOString();
  const candidates = new Map<string, QueueCandidate>();
  const latestReview = input.latestReview?.status === "pending" ? null : input.latestReview ?? null;
  const weakAreaProfile = input.weakAreaProfile ?? null;
  const attemptHistoryInsights = input.attemptHistoryInsights ?? null;
  const savedAttempts = (input.savedAttempts ?? []).filter((attempt): attempt is SavedRouteAttemptSummary =>
    Boolean(attempt && typeof attempt === "object")
  );
  const outcomeFeedbackHistory = (input.outcomeFeedbackHistory ?? []).filter(
    (feedback): feedback is AdaptivePracticeOutcomeFeedback => Boolean(feedback && typeof feedback === "object")
  );
  const availableExercises = input.availableExercises ?? [];

  if (latestReview) {
    const latestWeaknesses = relatedWeaknessesFromReview(latestReview);
    const causedFailure = latestReview.status === "fail" || latestReview.status === "blocked";

    for (const weakness of latestWeaknesses) {
      addWeaknessCandidate(candidates, weakness, {
        source: "latestReview",
        baseScore: 30,
        causedFailure,
        reason: `Latest review shows ${weakness.replaceAll("-", " ")}.`
      });
    }
  }

  if (weakAreaProfile?.weaknesses.length) {
    for (const weakness of weakAreaProfile.weaknesses) {
      addWeaknessCandidate(candidates, weakness.weaknessType, {
        source: "weakAreaProfile",
        baseScore: 25,
        count: weakness.count,
        reason: `${weakness.label} has appeared ${weakness.count} time${weakness.count === 1 ? "" : "s"} in the weak-area profile.`
      });
    }
  }

  if (attemptHistoryInsights && attemptHistoryInsights.attemptCount > 0) {
    for (const weakness of attemptHistoryInsights.dominantWeakAreas) {
      addWeaknessCandidate(candidates, weakness, {
        source: "attemptHistory",
        baseScore: 25,
        reason: `Attempt history repeatedly shows ${weakness.replaceAll("-", " ")}.`
      });
    }

    if (attemptHistoryInsights.legalButInefficientCount >= 2) {
      addWeaknessCandidate(candidates, "route-efficiency", {
        source: "attemptHistory",
        baseScore: 25,
        count: attemptHistoryInsights.legalButInefficientCount,
        reason: "Attempt history shows repeated legal but inefficient routes."
      });
    }

    if (attemptHistoryInsights.repeatedFailureReasons.length > 0) {
      addCandidate(candidates, {
        id: "adaptive-review-prior-failures",
        type: "review-prior-attempt",
        title: "Review prior failed attempts",
        explanation: "Repeated failure patterns are visible in the in-session attempt history.",
        practiceFocus: "Compare the last failed attempts, then retry the same route with one correction target."
      }, {
        score: 25 + Math.min(20, attemptHistoryInsights.repeatedFailureReasons.length * 5),
        reason: `Repeated failure reason: ${attemptHistoryInsights.repeatedFailureReasons[0]}.`,
        source: "attemptHistory"
      });
    }

    if (attemptHistoryInsights.trend === "declining") {
      addCandidate(candidates, {
        id: "adaptive-confidence-builder",
        type: "confidence-builder",
        title: "Rebuild confidence with a simpler route",
        explanation: "Recent attempt scores are declining.",
        practiceFocus: "Choose an easier focused route, aim for a legal finish, then increase difficulty again."
      }, {
        score: 30,
        reason: "Attempt history trend is declining.",
        source: "attemptHistory"
      });
    }

    if (attemptHistoryInsights.trend === "improving" && attemptHistoryInsights.recentFailureCount > 0) {
      addCandidate(candidates, {
        id: "adaptive-improving-mixed-practice",
        type: "mixed-practice",
        title: "Keep improving with mixed practice",
        explanation: "Recent attempt scores are improving, but there are still failed attempts.",
        practiceFocus: "Alternate one focused retry with one mixed route to consolidate the improvement."
      }, {
        score: 25,
        reason: "Attempt history is improving but still includes recent failures.",
        source: "attemptHistory"
      });
    }

    if (attemptHistoryInsights.recentFailureCount >= 2) {
      addCandidate(candidates, {
        id: "adaptive-confidence-builder",
        type: "confidence-builder",
        title: "Rebuild confidence with a simpler route",
        explanation: "Multiple recent failures suggest a simpler route will give better feedback.",
        practiceFocus: "Pick an easier route and focus on a clean legal attempt before trying harder routes."
      }, {
        score: 20,
        reason: `${attemptHistoryInsights.recentFailureCount} of the last 3 attempts failed.`,
        source: "attemptHistory"
      });
    }
  }

  if (savedAttempts.length > 0) {
    const failedExerciseCounts = new Map<string, number>();
    const savedWeaknessCounts = new Map<RoutePracticeWeaknessType, number>();

    for (const attempt of savedAttempts) {
      if (!isFailedSavedAttempt(attempt)) {
        continue;
      }

      if (typeof attempt.exerciseId === "string" && attempt.exerciseId) {
        failedExerciseCounts.set(attempt.exerciseId, (failedExerciseCounts.get(attempt.exerciseId) ?? 0) + 1);
      }

      for (const weakness of relatedWeaknessesFromSavedAttempt(attempt)) {
        savedWeaknessCounts.set(weakness, (savedWeaknessCounts.get(weakness) ?? 0) + 1);
      }
    }

    for (const [weakness, count] of savedWeaknessCounts.entries()) {
      addWeaknessCandidate(candidates, weakness, {
        source: "savedAttempts",
        baseScore: 20 + (count >= 2 ? 10 : 0),
        count,
        reason:
          count >= 2
            ? `Saved attempts repeatedly show ${weakness.replaceAll("-", " ")}.`
            : `Saved attempts include ${weakness.replaceAll("-", " ")}.`
      });
    }

    for (const [exerciseId, count] of failedExerciseCounts.entries()) {
      if (count < 2) {
        continue;
      }

      addCandidate(candidates, {
        id: `adaptive-review-${exerciseId}`,
        type: "review-prior-attempt",
        title: "Review a repeatedly failed exercise",
        explanation: "Saved attempts show repeated failures on the same exercise.",
        practiceFocus: "Open the saved review details, identify the repeated mistake, then retry that exercise deliberately."
      }, {
        score: 20 + Math.min(25, count * 10),
        reason: `${exerciseId} has ${count} saved failed attempts.`,
        source: "savedAttempts",
        relatedExerciseIds: [exerciseId]
      });
    }
  }

  if (latestReview?.status === "pass" && candidates.size > 0) {
    for (const candidate of candidates.values()) {
      if (!candidate.sourceSignals.latestReview) {
        candidate.score -= 15;
        addUnique(candidate.reasons, "Latest attempt passed, so this is less urgent.");
      }
    }
  }

  if (attemptHistoryInsights?.trend === "improving") {
    for (const candidate of candidates.values()) {
      if (candidate.sourceSignals.attemptHistory) {
        candidate.score -= 10;
        addUnique(candidate.reasons, "Recent scores are improving.");
      }
    }
  }

  if (outcomeFeedbackHistory.length > 0) {
    applyOutcomeFeedback(candidates, outcomeFeedbackHistory);
  }

  if (candidates.size === 0) {
    addCandidate(candidates, {
      id: "adaptive-mixed-practice",
      type: "mixed-practice",
      title: "Continue with mixed route practice",
      explanation: "No dominant route weakness is visible yet.",
      practiceFocus: "Try a mixed route and use the review panel to identify the next clear focus."
    }, {
      score: 10,
      reason: "No dominant weakness signal was available."
    });
  }

  const items = finaliseCandidates(candidates, availableExercises);
  const topItem = items[0];
  const signals = {
    latestAttemptUsed: Boolean(latestReview),
    weakAreaProfileUsed: Boolean(weakAreaProfile?.weaknesses.length),
    attemptHistoryUsed: Boolean(attemptHistoryInsights && attemptHistoryInsights.attemptCount > 0),
    savedAttemptsUsed: savedAttempts.length > 0,
    outcomeFeedbackUsed: outcomeFeedbackHistory.length > 0,
    availableExerciseCount: availableExercises.length
  };
  const signalsUsed = [
    signals.latestAttemptUsed,
    signals.weakAreaProfileUsed,
    signals.attemptHistoryUsed,
    signals.savedAttemptsUsed,
    signals.outcomeFeedbackUsed
  ].filter(Boolean).length;

  return {
    generatedAt,
    items,
    summary: {
      primaryFocus: topItem?.title ?? "Continue with mixed route practice",
      reason: topItem?.reasons[0] ?? "No dominant weakness signal was available.",
      confidenceLevel: confidenceLevel({
        topItem,
        signalsUsed,
        hasDefaultOnly: items.length === 1 && items[0]?.id === "adaptive-mixed-practice"
      })
    },
    signals
  };
}
