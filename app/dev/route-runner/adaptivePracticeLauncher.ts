import type { AdaptivePracticeQueueItem } from "./adaptivePracticeQueue.ts";
import type { RouteAttemptReview, RoutePracticeWeaknessType } from "./routeAttemptReview.ts";

export const ADAPTIVE_PRACTICE_LAUNCHER_STORAGE_KEY =
  "topopass.dev.routeRunner.adaptivePracticeLauncher.v1";

export type AdaptivePracticeLauncherItemStatus =
  | "recommended"
  | "active"
  | "skipped"
  | "dismissed"
  | "completed";

export type AdaptivePracticeLauncherState = {
  activeAdaptivePracticeItemId: string | null;
  skippedPracticeItemIds: string[];
  dismissedPracticeItemIds: string[];
  completedPracticeItemIds: string[];
  lastStartedPracticeItemId: string | null;
  practiceSessionStartedAt: string | null;
  outcomeFeedbackHistory: AdaptivePracticeOutcomeFeedback[];
};

type AdaptivePracticeItemRef = Pick<AdaptivePracticeQueueItem, "id">;

export type AdaptivePracticeOutcome = "improved" | "resolved" | "repeated-issue" | "mixed" | "unknown";

export type AdaptivePracticeOutcomeEvidence = {
  scorePercent: number | null;
  passed: boolean | null;
  illegalMovementCount: number;
  missedRestrictionCount: number;
  extraDistance: string;
  strongestWeaknessCategories: RoutePracticeWeaknessType[];
};

export type AdaptivePracticeOutcomeFeedback = {
  id: string;
  practiceItemId: string;
  exerciseId: string | null;
  completedAt: string;
  outcome: AdaptivePracticeOutcome;
  summary: string;
  evidence: AdaptivePracticeOutcomeEvidence;
  reinforcedWeakAreas: RoutePracticeWeaknessType[];
  deprioritizedWeakAreas: RoutePracticeWeaknessType[];
  recommendedNextAction: string;
};

export type BuildAdaptivePracticeOutcomeFeedbackInput = {
  practiceItem: Pick<AdaptivePracticeQueueItem, "id" | "title" | "relatedWeakAreas" | "practiceFocus"> | null;
  exerciseId: string | null;
  completedAt: string;
  review?: RouteAttemptReview | null;
  previousScorePercent?: number | null;
};

export function createEmptyAdaptivePracticeLauncherState(): AdaptivePracticeLauncherState {
  return {
    activeAdaptivePracticeItemId: null,
    skippedPracticeItemIds: [],
    dismissedPracticeItemIds: [],
    completedPracticeItemIds: [],
    lastStartedPracticeItemId: null,
    practiceSessionStartedAt: null,
    outcomeFeedbackHistory: []
  };
}

export function startAdaptivePracticeItem(
  state: AdaptivePracticeLauncherState,
  item: AdaptivePracticeItemRef,
  nowIso: string
): AdaptivePracticeLauncherState {
  return {
    activeAdaptivePracticeItemId: item.id,
    skippedPracticeItemIds: removeId(state.skippedPracticeItemIds, item.id),
    dismissedPracticeItemIds: removeId(state.dismissedPracticeItemIds, item.id),
    completedPracticeItemIds: removeId(state.completedPracticeItemIds, item.id),
    lastStartedPracticeItemId: item.id,
    practiceSessionStartedAt: nowIso,
    outcomeFeedbackHistory: [...state.outcomeFeedbackHistory]
  };
}

export function skipAdaptivePracticeItem(
  state: AdaptivePracticeLauncherState,
  itemId: string
): AdaptivePracticeLauncherState {
  return {
    ...state,
    activeAdaptivePracticeItemId: state.activeAdaptivePracticeItemId === itemId ? null : state.activeAdaptivePracticeItemId,
    skippedPracticeItemIds: addUnique(state.skippedPracticeItemIds, itemId),
    dismissedPracticeItemIds: removeId(state.dismissedPracticeItemIds, itemId),
    completedPracticeItemIds: removeId(state.completedPracticeItemIds, itemId),
    practiceSessionStartedAt: state.activeAdaptivePracticeItemId === itemId ? null : state.practiceSessionStartedAt,
    outcomeFeedbackHistory: [...state.outcomeFeedbackHistory]
  };
}

export function dismissAdaptivePracticeItem(
  state: AdaptivePracticeLauncherState,
  itemId: string
): AdaptivePracticeLauncherState {
  return {
    ...state,
    activeAdaptivePracticeItemId: state.activeAdaptivePracticeItemId === itemId ? null : state.activeAdaptivePracticeItemId,
    skippedPracticeItemIds: removeId(state.skippedPracticeItemIds, itemId),
    dismissedPracticeItemIds: addUnique(state.dismissedPracticeItemIds, itemId),
    completedPracticeItemIds: removeId(state.completedPracticeItemIds, itemId),
    practiceSessionStartedAt: state.activeAdaptivePracticeItemId === itemId ? null : state.practiceSessionStartedAt,
    outcomeFeedbackHistory: [...state.outcomeFeedbackHistory]
  };
}

export function completeAdaptivePracticeItem(
  state: AdaptivePracticeLauncherState,
  itemId: string
): AdaptivePracticeLauncherState {
  return {
    ...state,
    activeAdaptivePracticeItemId: state.activeAdaptivePracticeItemId === itemId ? null : state.activeAdaptivePracticeItemId,
    skippedPracticeItemIds: removeId(state.skippedPracticeItemIds, itemId),
    dismissedPracticeItemIds: removeId(state.dismissedPracticeItemIds, itemId),
    completedPracticeItemIds: addUnique(state.completedPracticeItemIds, itemId),
    practiceSessionStartedAt: state.activeAdaptivePracticeItemId === itemId ? null : state.practiceSessionStartedAt,
    outcomeFeedbackHistory: [...state.outcomeFeedbackHistory]
  };
}

export function undoAdaptivePracticeItemStatus(
  state: AdaptivePracticeLauncherState,
  itemId: string
): AdaptivePracticeLauncherState {
  return {
    ...state,
    activeAdaptivePracticeItemId: state.activeAdaptivePracticeItemId === itemId ? null : state.activeAdaptivePracticeItemId,
    skippedPracticeItemIds: removeId(state.skippedPracticeItemIds, itemId),
    dismissedPracticeItemIds: removeId(state.dismissedPracticeItemIds, itemId),
    completedPracticeItemIds: removeId(state.completedPracticeItemIds, itemId),
    practiceSessionStartedAt: state.activeAdaptivePracticeItemId === itemId ? null : state.practiceSessionStartedAt,
    outcomeFeedbackHistory: [...state.outcomeFeedbackHistory]
  };
}

export function buildAdaptivePracticeOutcomeFeedback(
  input: BuildAdaptivePracticeOutcomeFeedbackInput
): AdaptivePracticeOutcomeFeedback {
  const practiceItemId = input.practiceItem?.id ?? "unknown-practice-item";
  const relatedWeakAreas = uniqueWeaknesses(input.practiceItem?.relatedWeakAreas ?? []);
  const reviewWeakAreas = input.review ? strongestWeaknessCategoriesFromReview(input.review) : [];
  const reinforcedWeakAreas = uniqueWeaknesses(reviewWeakAreas.filter((weakness) => relatedWeakAreas.includes(weakness)));
  const scorePercent = input.review ? scorePercentFromLabel(input.review.scoreLabel) : null;
  const passed = input.review?.status === "pass" ? true : input.review?.status === "fail" ? false : null;
  const improvedScore =
    typeof input.previousScorePercent === "number" &&
    typeof scorePercent === "number" &&
    scorePercent > input.previousScorePercent + 0.1;
  const hasCleanPass =
    input.review?.status === "pass" &&
    input.review.illegalMovements.length === 0 &&
    input.review.missedRestrictions.length === 0 &&
    reinforcedWeakAreas.length === 0;
  const hasAnyWorsening = reviewWeakAreas.some((weakness) => !relatedWeakAreas.includes(weakness));
  const outcome = classifyOutcome({
    hasUsableReview: Boolean(input.review && input.review.status !== "pending"),
    hasCleanPass,
    reinforcedWeakAreas,
    improvedScore,
    hasAnyWorsening
  });
  const evidence: AdaptivePracticeOutcomeEvidence = {
    scorePercent,
    passed,
    illegalMovementCount: input.review?.illegalMovements.length ?? 0,
    missedRestrictionCount: input.review?.missedRestrictions.length ?? 0,
    extraDistance: metricValue(input.review, "extra-distance"),
    strongestWeaknessCategories: reviewWeakAreas
  };
  const deprioritizedWeakAreas = outcome === "resolved" ? relatedWeakAreas : [];

  return {
    id: `${practiceItemId}:${input.completedAt}`,
    practiceItemId,
    exerciseId: input.exerciseId,
    completedAt: input.completedAt,
    outcome,
    summary: outcomeSummary(outcome, reinforcedWeakAreas),
    evidence,
    reinforcedWeakAreas,
    deprioritizedWeakAreas,
    recommendedNextAction: recommendedNextAction(outcome, input.practiceItem?.practiceFocus, reinforcedWeakAreas)
  };
}

export function appendAdaptivePracticeOutcomeFeedback(
  state: AdaptivePracticeLauncherState,
  feedback: AdaptivePracticeOutcomeFeedback
): AdaptivePracticeLauncherState {
  if (state.outcomeFeedbackHistory.some((existing) => existing.practiceItemId === feedback.practiceItemId)) {
    return {
      ...state,
      outcomeFeedbackHistory: [...state.outcomeFeedbackHistory]
    };
  }

  return {
    ...state,
    outcomeFeedbackHistory: [feedback, ...state.outcomeFeedbackHistory]
  };
}

export function getLatestAdaptivePracticeOutcomeFeedback(
  state: AdaptivePracticeLauncherState
): AdaptivePracticeOutcomeFeedback | null {
  return state.outcomeFeedbackHistory[0] ?? null;
}

export function summarizeAdaptivePracticeOutcomeFeedback(feedback: AdaptivePracticeOutcomeFeedback): string {
  return feedback.summary;
}

export function getAdaptivePracticeItemStatus(
  state: AdaptivePracticeLauncherState,
  itemId: string
): AdaptivePracticeLauncherItemStatus {
  if (state.activeAdaptivePracticeItemId === itemId) {
    return "active";
  }

  if (state.completedPracticeItemIds.includes(itemId)) {
    return "completed";
  }

  if (state.dismissedPracticeItemIds.includes(itemId)) {
    return "dismissed";
  }

  if (state.skippedPracticeItemIds.includes(itemId)) {
    return "skipped";
  }

  return "recommended";
}

export function normaliseAdaptivePracticeLauncherState(value: unknown): AdaptivePracticeLauncherState {
  const emptyState = createEmptyAdaptivePracticeLauncherState();

  if (!value || typeof value !== "object") {
    return emptyState;
  }

  const partial = value as Partial<AdaptivePracticeLauncherState>;

  return {
    activeAdaptivePracticeItemId: nullableString(partial.activeAdaptivePracticeItemId),
    skippedPracticeItemIds: normaliseIdArray(partial.skippedPracticeItemIds),
    dismissedPracticeItemIds: normaliseIdArray(partial.dismissedPracticeItemIds),
    completedPracticeItemIds: normaliseIdArray(partial.completedPracticeItemIds),
    lastStartedPracticeItemId: nullableString(partial.lastStartedPracticeItemId),
    practiceSessionStartedAt: nullableString(partial.practiceSessionStartedAt),
    outcomeFeedbackHistory: normaliseOutcomeFeedbackHistory(partial.outcomeFeedbackHistory)
  };
}

export function parseStoredAdaptivePracticeLauncherState(rawState: string | null): AdaptivePracticeLauncherState {
  if (!rawState) {
    return createEmptyAdaptivePracticeLauncherState();
  }

  try {
    return normaliseAdaptivePracticeLauncherState(JSON.parse(rawState));
  } catch {
    return createEmptyAdaptivePracticeLauncherState();
  }
}

export function serialiseAdaptivePracticeLauncherState(state: AdaptivePracticeLauncherState): string {
  return JSON.stringify(normaliseAdaptivePracticeLauncherState(state));
}

function addUnique(values: readonly string[], nextValue: string): string[] {
  return normaliseIdArray([...values, nextValue]);
}

function removeId(values: readonly string[], itemId: string): string[] {
  return values.filter((value) => value !== itemId);
}

function normaliseIdArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalisedValues: string[] = [];

  for (const value of values) {
    if (typeof value !== "string" || value.length === 0 || normalisedValues.includes(value)) {
      continue;
    }

    normalisedValues.push(value);
  }

  return normalisedValues;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function classifyOutcome(input: {
  hasUsableReview: boolean;
  hasCleanPass: boolean;
  reinforcedWeakAreas: readonly RoutePracticeWeaknessType[];
  improvedScore: boolean;
  hasAnyWorsening: boolean;
}): AdaptivePracticeOutcome {
  if (!input.hasUsableReview) {
    return "unknown";
  }

  if (input.hasCleanPass) {
    return "resolved";
  }

  if (input.improvedScore && input.reinforcedWeakAreas.length > 0 && input.hasAnyWorsening) {
    return "mixed";
  }

  if (input.improvedScore && input.reinforcedWeakAreas.length > 0) {
    return "improved";
  }

  if (input.reinforcedWeakAreas.length > 0) {
    return "repeated-issue";
  }

  if (input.improvedScore) {
    return "improved";
  }

  if (input.hasAnyWorsening) {
    return "mixed";
  }

  return "unknown";
}

function outcomeSummary(outcome: AdaptivePracticeOutcome, weaknesses: readonly RoutePracticeWeaknessType[]): string {
  if (outcome === "resolved") {
    return "Practice resolved: you passed this focus area without repeating the target issue.";
  }

  if (outcome === "improved") {
    return "This practice helped: your score improved, but the focus area still needs another attempt.";
  }

  if (outcome === "repeated-issue") {
    return `Same issue repeated: ${weaknessListLabel(weaknesses)} still appears in the review.`;
  }

  if (outcome === "mixed") {
    return "Mixed result: some signals improved, but another route weakness still needs attention.";
  }

  return "Outcome unknown: complete and score a route attempt to evaluate this practice item.";
}

function recommendedNextAction(
  outcome: AdaptivePracticeOutcome,
  practiceFocus: string | undefined,
  weaknesses: readonly RoutePracticeWeaknessType[]
): string {
  if (outcome === "resolved") {
    return "Move this focus lower in priority and try the next recommended route.";
  }

  if (outcome === "improved") {
    return practiceFocus ?? "Repeat the practice once more and aim to remove the remaining weakness.";
  }

  if (outcome === "repeated-issue") {
    return `Repeat this focus before moving on. Pay special attention to ${weaknessListLabel(weaknesses)}.`;
  }

  if (outcome === "mixed") {
    return "Review the latest route feedback, then try one focused correction before another mixed route.";
  }

  return "Draw and score a complete route attempt so the launcher can judge whether this practice helped.";
}

function strongestWeaknessCategoriesFromReview(review: RouteAttemptReview): RoutePracticeWeaknessType[] {
  const weaknesses: RoutePracticeWeaknessType[] = [];

  for (const item of review.recommendedPracticeQueue) {
    addWeakness(weaknesses, item.weaknessType);
  }

  return weaknesses;
}

function scorePercentFromLabel(scoreLabel: string): number | null {
  const match = /^(-?\d+(?:\.\d+)?)/.exec(scoreLabel);

  if (!match) {
    return null;
  }

  const score = Number.parseFloat(match[1]);

  return Number.isFinite(score) ? score : null;
}

function metricValue(review: RouteAttemptReview | null | undefined, metricId: "extra-distance"): string {
  return review?.distanceMetrics.find((metric) => metric.id === metricId)?.value ?? "n/a";
}

function uniqueWeaknesses(values: readonly RoutePracticeWeaknessType[]): RoutePracticeWeaknessType[] {
  const weaknesses: RoutePracticeWeaknessType[] = [];

  for (const value of values) {
    addWeakness(weaknesses, value);
  }

  return weaknesses;
}

function addWeakness(values: RoutePracticeWeaknessType[], value: RoutePracticeWeaknessType): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function weaknessListLabel(weaknesses: readonly RoutePracticeWeaknessType[]): string {
  return weaknesses.length > 0 ? weaknesses.map((weakness) => weakness.replaceAll("-", " ")).join(", ") : "the target issue";
}

function normaliseOutcomeFeedbackHistory(value: unknown): AdaptivePracticeOutcomeFeedback[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((feedback) => normaliseOutcomeFeedback(feedback))
    .filter((feedback): feedback is AdaptivePracticeOutcomeFeedback => Boolean(feedback));
}

function normaliseOutcomeFeedback(value: unknown): AdaptivePracticeOutcomeFeedback | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const feedback = value as Partial<AdaptivePracticeOutcomeFeedback>;

  if (
    typeof feedback.id !== "string" ||
    typeof feedback.practiceItemId !== "string" ||
    typeof feedback.completedAt !== "string" ||
    typeof feedback.outcome !== "string" ||
    !["improved", "resolved", "repeated-issue", "mixed", "unknown"].includes(feedback.outcome) ||
    typeof feedback.summary !== "string" ||
    typeof feedback.recommendedNextAction !== "string"
  ) {
    return null;
  }

  const evidence = normaliseOutcomeEvidence(feedback.evidence);

  if (!evidence) {
    return null;
  }

  return {
    id: feedback.id,
    practiceItemId: feedback.practiceItemId,
    exerciseId: nullableString(feedback.exerciseId),
    completedAt: feedback.completedAt,
    outcome: feedback.outcome,
    summary: feedback.summary,
    evidence,
    reinforcedWeakAreas: normaliseWeaknessArray(feedback.reinforcedWeakAreas),
    deprioritizedWeakAreas: normaliseWeaknessArray(feedback.deprioritizedWeakAreas),
    recommendedNextAction: feedback.recommendedNextAction
  };
}

function normaliseOutcomeEvidence(value: unknown): AdaptivePracticeOutcomeEvidence | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const evidence = value as Partial<AdaptivePracticeOutcomeEvidence>;

  if (
    typeof evidence.illegalMovementCount !== "number" ||
    typeof evidence.missedRestrictionCount !== "number" ||
    typeof evidence.extraDistance !== "string"
  ) {
    return null;
  }

  return {
    scorePercent: typeof evidence.scorePercent === "number" && Number.isFinite(evidence.scorePercent) ? evidence.scorePercent : null,
    passed: typeof evidence.passed === "boolean" ? evidence.passed : null,
    illegalMovementCount: evidence.illegalMovementCount,
    missedRestrictionCount: evidence.missedRestrictionCount,
    extraDistance: evidence.extraDistance,
    strongestWeaknessCategories: normaliseWeaknessArray(evidence.strongestWeaknessCategories)
  };
}

function normaliseWeaknessArray(value: unknown): RoutePracticeWeaknessType[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is RoutePracticeWeaknessType => typeof item === "string");
}
