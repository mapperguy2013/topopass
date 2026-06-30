import type {
  DrawnRoutePipelineResult,
  IllegalDrawnMovement,
  RouteScoringFailureReason
} from "../../../lib/map-engine/index.ts";

export type RouteAttemptReviewStatus = "pass" | "fail" | "blocked" | "pending";
export type RouteAttemptReviewItemSeverity = "info" | "warning" | "error";

export type RouteAttemptReviewItem = {
  id: string;
  label: string;
  detail?: string;
  severity: RouteAttemptReviewItemSeverity;
};

export type RouteAttemptReviewMetric = {
  id: "student-route-distance" | "shortest-legal-distance" | "extra-distance";
  label: string;
  value: string;
};

export type RoutePracticeRecommendationPriority = "high" | "medium" | "low";

export type RoutePracticeRecommendation = {
  id: string;
  title: string;
  explanation: string;
  practiceFocus: string;
  priority: RoutePracticeRecommendationPriority;
};

export type RoutePracticeWeaknessType =
  | "prohibited-turn"
  | "no-entry"
  | "one-way-direction"
  | "restricted-road"
  | "wrong-start"
  | "wrong-destination"
  | "missed-checkpoint"
  | "disconnected-drawing"
  | "insufficient-drawing"
  | "route-efficiency"
  | "advanced-route"
  | "general-route-review";

export type RecommendedPracticeQueueItem = {
  id: string;
  title: string;
  reason: string;
  weaknessType: RoutePracticeWeaknessType;
  priority: RoutePracticeRecommendationPriority;
  suggestedExerciseId?: string;
};

export type RouteWeaknessCounter = {
  weaknessType: RoutePracticeWeaknessType;
  label: string;
  count: number;
  priority: RoutePracticeRecommendationPriority;
};

export type LearnerWeakAreaProfileEntry = RouteWeaknessCounter & {
  lastSeenAttemptNumber: number;
};

export type LearnerWeakAreaProfile = {
  attemptsReviewed: number;
  totalWeaknessCount: number;
  weaknesses: LearnerWeakAreaProfileEntry[];
};

export type RouteAttemptReview = {
  status: RouteAttemptReviewStatus;
  title: string;
  scoreLabel: string;
  distanceLabel: string;
  distanceMetrics: RouteAttemptReviewMetric[];
  illegalMovements: RouteAttemptReviewItem[];
  missedRestrictions: RouteAttemptReviewItem[];
  suggestedFailureReason: string | null;
  correctionHints: string[];
  practiceRecommendations: RoutePracticeRecommendation[];
  recommendedPracticeQueue: RecommendedPracticeQueueItem[];
};

export type RouteAttemptHistoryItem = {
  id: string;
  attemptNumber: number;
  status: Exclude<RouteAttemptReviewStatus, "pending">;
  title: string;
  scoreLabel: string;
  studentRouteDistanceLabel: string;
  extraDistanceLabel: string;
  illegalMovementCount: number;
  missedRestrictionCount: number;
  primaryFailureReason: string | null;
  review: RouteAttemptReview;
};

export type RouteAttemptHistoryState = {
  items: RouteAttemptHistoryItem[];
  selectedAttemptNumber: number | null;
  nextAttemptNumber: number;
};

export type BuildRouteAttemptReviewInput = {
  pipelineResult: DrawnRoutePipelineResult;
  illegalMovements: readonly IllegalDrawnMovement[];
  isDrawing?: boolean;
};

function formatDistance(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters)) {
    return "n/a";
  }

  if (Math.abs(distanceMeters) >= 1000) {
    return `${(distanceMeters / 1000).toFixed(2)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}

function formatExtraDistance(distanceMeters: number): string {
  const distance = formatDistance(Math.max(0, distanceMeters));

  return distance === "n/a" ? distance : `+${distance}`;
}

function routeAttemptMetricValue(
  review: Pick<RouteAttemptReview, "distanceMetrics">,
  metricId: RouteAttemptReviewMetric["id"]
): string {
  return review.distanceMetrics.find((metric) => metric.id === metricId)?.value ?? "n/a";
}

function compactAttemptScoreLabel(scoreLabel: string): string {
  return scoreLabel.replace(/\s+\((?:pass|fail)\)$/i, "");
}

function illegalMovementLabel(movement: IllegalDrawnMovement): string {
  const roadId = movement.roadId ?? "";

  if (movement.kind === "prohibited-turn") {
    const roads =
      movement.incomingRoadId && movement.outgoingRoadId
        ? `: ${movement.incomingRoadId} -> ${movement.outgoingRoadId}`
        : "";

    return `Prohibited turn${roads}`;
  }

  if (movement.kind === "closed-road" || movement.kind === "restricted-road") {
    return roadId ? `Restricted road used on ${roadId}` : "Restricted road used";
  }

  if (movement.kind === "no-entry-road") {
    return roadId ? `No-entry road used on ${roadId}` : "No-entry road used";
  }

  if (movement.kind === "one-way-wrong-direction") {
    return roadId ? `Wrong way on one-way road ${roadId}` : "Wrong way on one-way road";
  }

  return "Illegal movement";
}

function itemForFailureReason(reason: RouteScoringFailureReason): RouteAttemptReviewItem | null {
  if (reason === "illegal_route") {
    return {
      id: "failure-illegal-route",
      label: "Illegal route",
      detail: "The route includes at least one movement that is not allowed.",
      severity: "error"
    };
  }

  if (reason === "wrong_start") {
    return {
      id: "failure-wrong-start",
      label: "Wrong start",
      detail: "The route does not begin at the required start point.",
      severity: "error"
    };
  }

  if (reason === "wrong_destination") {
    return {
      id: "failure-wrong-destination",
      label: "Wrong destination",
      detail: "The route does not finish at the required destination.",
      severity: "error"
    };
  }

  if (reason === "missed_required_stop") {
    return {
      id: "failure-missed-required-stop",
      label: "Missed required stop",
      detail: "A required checkpoint or destination was missed or visited out of order.",
      severity: "error"
    };
  }

  if (reason === "below_efficiency_threshold") {
    return {
      id: "failure-below-efficiency-threshold",
      label: "Route too long",
      detail: "The route is legal, but it is too far above the shortest legal route to pass.",
      severity: "warning"
    };
  }

  if (reason === "zero_distance_route") {
    return {
      id: "failure-zero-distance-route",
      label: "No usable route distance",
      detail: "The selected route has no measurable distance.",
      severity: "error"
    };
  }

  if (reason === "no_valid_shortest_route") {
    return {
      id: "failure-no-valid-shortest-route",
      label: "No shortest legal route",
      detail: "The exercise does not currently have a valid legal comparison route.",
      severity: "error"
    };
  }

  return null;
}

function itemForPipelineWarning(warning: DrawnRoutePipelineResult["warnings"][number]): RouteAttemptReviewItem | null {
  if (warning.code === "empty_trace") {
    return {
      id: "warning-empty-trace",
      label: "No route drawn",
      detail: "Draw a route before reading a scored review.",
      severity: "info"
    };
  }

  if (
    warning.code === "insufficient_points" ||
    warning.code === "insufficient_raw_points" ||
    warning.code === "insufficient_movement" ||
    warning.code === "insufficient_points_after_simplification"
  ) {
    return {
      id: `warning-${warning.code}`,
      label: "Insufficient drawing",
      detail: "The drawing is too short to become a route attempt.",
      severity: "info"
    };
  }

  if (warning.code === "off_road_points" || warning.code === "unmatched_point" || warning.code === "unknown_road") {
    return {
      id: `warning-${warning.code}`,
      label: "Could not snap to roads",
      detail: warning.message,
      severity: "warning"
    };
  }

  if (warning.code === "disconnected_roads" || warning.code === "disconnected_selected_roads") {
    return {
      id: `warning-${warning.code}-${warning.fromRoadId ?? "unknown"}-${warning.toRoadId ?? "unknown"}`,
      label: "Disconnected matched roads",
      detail:
        warning.fromRoadId && warning.toRoadId
          ? `The matched route breaks between ${warning.fromRoadId} and ${warning.toRoadId}.`
          : "The matched roads do not form one continuous route.",
      severity: "error"
    };
  }

  if (warning.code === "unresolved_direction") {
    return {
      id: `warning-${warning.code}-${warning.roadId ?? "unknown"}`,
      label: "Unresolved road direction",
      detail: warning.message,
      severity: "warning"
    };
  }

  if (warning.code === "exercise_failed") {
    return {
      id: "warning-exercise-failed",
      label: "Could not score route",
      detail: warning.message,
      severity: "error"
    };
  }

  return null;
}

function suggestedFailureReason(input: {
  result: DrawnRoutePipelineResult;
  illegalMovements: readonly IllegalDrawnMovement[];
  blocked: boolean;
}): string | null {
  const score = input.result.exerciseResult?.score;

  if (input.blocked) {
    if (input.result.warnings.some((warning) => warning.code === "disconnected_roads" || warning.code === "disconnected_selected_roads")) {
      return "The route could not be scored because the matched roads do not connect into one continuous route.";
    }

    return "The route was blocked before scoring because drawing, snapping, or matching did not produce a usable route.";
  }

  if (!score || score.passed) {
    return null;
  }

  if (input.illegalMovements.length > 0) {
    return input.illegalMovements[0].message;
  }

  if (score.failureReasons.includes("missed_required_stop")) {
    return "The route missed a required stop or visited required stops out of order.";
  }

  if (score.failureReasons.includes("wrong_start")) {
    return "The route starts from the wrong place.";
  }

  if (score.failureReasons.includes("wrong_destination")) {
    return "The route ends at the wrong destination.";
  }

  if (score.failureReasons.includes("below_efficiency_threshold")) {
    return "The route is legal, but it is too long compared with the shortest legal route.";
  }

  return "The route reached scoring but did not meet the current pass rules.";
}

function dedupeItems(items: RouteAttemptReviewItem[]): RouteAttemptReviewItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function reviewItemIncludes(item: RouteAttemptReviewItem, text: string): boolean {
  const haystack = `${item.label} ${item.detail ?? ""}`.toLowerCase();

  return haystack.includes(text.toLowerCase());
}

function hasReviewItem(items: readonly RouteAttemptReviewItem[], text: string): boolean {
  return items.some((item) => reviewItemIncludes(item, text));
}

function addHint(hints: string[], hint: string): void {
  if (!hints.includes(hint)) {
    hints.push(hint);
  }
}

type RouteAttemptReviewBase = Omit<RouteAttemptReview, "correctionHints" | "practiceRecommendations" | "recommendedPracticeQueue">;
type RouteAttemptReviewWithHints = RouteAttemptReviewBase & Pick<RouteAttemptReview, "correctionHints">;
type RouteAttemptReviewWithRecommendations = RouteAttemptReviewWithHints &
  Pick<RouteAttemptReview, "practiceRecommendations">;

export function buildStudentCorrectionHints(review: RouteAttemptReviewBase): string[] {
  const hints: string[] = [];

  if (review.status === "pending") {
    return ["Draw and score a route to see what to improve next."];
  }

  if (review.status === "blocked") {
    if (hasReviewItem(review.missedRestrictions, "Disconnected matched roads")) {
      addHint(hints, "Redraw the route as one continuous path, avoiding jumps between roads that do not meet.");
    }

    if (hasReviewItem(review.missedRestrictions, "Insufficient drawing") || hasReviewItem(review.missedRestrictions, "No route drawn")) {
      addHint(hints, "Draw a longer route that follows the roads from the start point to the destination.");
    }

    if (
      hasReviewItem(review.missedRestrictions, "Could not snap to roads") ||
      hasReviewItem(review.missedRestrictions, "Unresolved road direction")
    ) {
      addHint(hints, "Keep the drawn line close to road centrelines so it can snap and match cleanly.");
    }

    if (hints.length === 0) {
      addHint(hints, "Fix the drawing, snapping, or matching issue first, then try scoring the route again.");
    }

    return hints;
  }

  if (review.status === "pass") {
    return ["Good route. Keep those legal choices and look for any shorter legal alternative."];
  }

  if (hasReviewItem(review.illegalMovements, "Prohibited turn")) {
    addHint(hints, "Avoid the prohibited turn shown in the review; continue to the next legal junction before changing roads.");
  }

  if (hasReviewItem(review.illegalMovements, "No-entry road")) {
    addHint(hints, "Do not enter no-entry roads; approach the destination from a road direction that is allowed.");
  }

  if (hasReviewItem(review.illegalMovements, "Wrong way on one-way road")) {
    addHint(hints, "Follow the one-way arrows and choose roads that allow travel in your direction.");
  }

  if (hasReviewItem(review.illegalMovements, "Restricted road")) {
    addHint(hints, "Avoid restricted or closed roads and choose the nearest legal alternative.");
  }

  if (hasReviewItem(review.missedRestrictions, "Wrong start")) {
    addHint(hints, "Start from the required start point before drawing the route.");
  }

  if (hasReviewItem(review.missedRestrictions, "Missed required stop")) {
    addHint(hints, "Visit every required checkpoint in order before finishing at the destination.");
  }

  if (hasReviewItem(review.missedRestrictions, "Wrong destination")) {
    addHint(hints, "Finish at the required destination, not just near a connected road.");
  }

  if (hasReviewItem(review.missedRestrictions, "Route too long")) {
    addHint(hints, "Your route was legal but too long; compare it with the shortest legal route and remove unnecessary detours.");
  }

  if (hasReviewItem(review.missedRestrictions, "No shortest legal route")) {
    addHint(hints, "This exercise needs a valid legal comparison route before it can be scored fairly.");
  }

  if (hasReviewItem(review.missedRestrictions, "Illegal route") && review.illegalMovements.length === 0) {
    addHint(hints, "Use only legal road movements, then retry the same exercise.");
  }

  if (hints.length === 0) {
    addHint(hints, "Try the route again and compare each road choice with the shortest legal path.");
  }

  return hints;
}

function addPracticeRecommendation(
  recommendations: RoutePracticeRecommendation[],
  recommendation: RoutePracticeRecommendation
): void {
  if (!recommendations.some((current) => current.id === recommendation.id)) {
    recommendations.push(recommendation);
  }
}

function scorePercentFromLabel(scoreLabel: string): number | null {
  const match = /^(-?\d+(?:\.\d+)?)/.exec(scoreLabel);

  if (!match) {
    return null;
  }

  const score = Number.parseFloat(match[1]);

  return Number.isFinite(score) ? score : null;
}

export function buildAdaptivePracticeRecommendations(
  review: RouteAttemptReviewWithHints
): RoutePracticeRecommendation[] {
  const recommendations: RoutePracticeRecommendation[] = [];

  if (review.status === "pending") {
    addPracticeRecommendation(recommendations, {
      id: "draw-and-score-route",
      title: "Draw a route to unlock practice advice",
      explanation: "Practice recommendations appear after the route runner has a scored or blocked attempt to review.",
      practiceFocus: "Draw a complete route from the start point to the destination, then review the result.",
      priority: "low"
    });

    return recommendations;
  }

  if (review.status === "pass" && review.illegalMovements.length === 0 && review.missedRestrictions.length === 0) {
    addPracticeRecommendation(recommendations, {
      id: "try-harder-route",
      title: "Try a harder route",
      explanation: "This attempt was legal and efficient enough to pass.",
      practiceFocus: "Choose an exercise with more junctions or checkpoints to keep building route-planning confidence.",
      priority: "low"
    });

    return recommendations;
  }

  if (hasReviewItem(review.missedRestrictions, "Disconnected matched roads")) {
    addPracticeRecommendation(recommendations, {
      id: "practice-continuous-drawing",
      title: "Practise one continuous drawn route",
      explanation: "The matched roads did not connect, so the route could not be scored reliably.",
      practiceFocus: "Draw one steady line along roads that meet at real junctions, without jumping between separate roads.",
      priority: "high"
    });
  }

  if (hasReviewItem(review.missedRestrictions, "Insufficient drawing") || hasReviewItem(review.missedRestrictions, "No route drawn")) {
    addPracticeRecommendation(recommendations, {
      id: "practice-longer-drawn-route",
      title: "Practise drawing a complete route",
      explanation: "The drawn trace was too short to become a route attempt.",
      practiceFocus: "Start at the origin, follow the road shape, and keep drawing until you reach the destination.",
      priority: "high"
    });
  }

  if (hasReviewItem(review.illegalMovements, "Prohibited turn")) {
    addPracticeRecommendation(recommendations, {
      id: "practice-prohibited-turns",
      title: "Practise prohibited turns",
      explanation: "This attempt included a turn movement that is not allowed at a junction.",
      practiceFocus: "Pause at each junction, check the turn restriction sign, and continue to the next legal turn when needed.",
      priority: "high"
    });
  }

  if (hasReviewItem(review.illegalMovements, "No-entry road")) {
    addPracticeRecommendation(recommendations, {
      id: "practice-no-entry-roads",
      title: "Practise no-entry roads",
      explanation: "This attempt entered a road from a direction that is marked no entry.",
      practiceFocus: "Approach restricted roads from an allowed direction and use nearby legal alternatives.",
      priority: "high"
    });
  }

  if (hasReviewItem(review.illegalMovements, "Wrong way on one-way road")) {
    addPracticeRecommendation(recommendations, {
      id: "practice-one-way-direction",
      title: "Practise one-way direction",
      explanation: "This attempt travelled against a one-way road direction.",
      practiceFocus: "Follow the blue one-way arrows and plan turns that keep you moving with the legal traffic flow.",
      priority: "high"
    });
  }

  if (hasReviewItem(review.illegalMovements, "Restricted road")) {
    addPracticeRecommendation(recommendations, {
      id: "practice-restricted-roads",
      title: "Practise restricted roads",
      explanation: "This attempt used a restricted or closed road movement.",
      practiceFocus: "Identify restricted road symbols before drawing and choose the nearest open legal road instead.",
      priority: "high"
    });
  }

  if (hasReviewItem(review.missedRestrictions, "Wrong start")) {
    addPracticeRecommendation(recommendations, {
      id: "practice-required-start",
      title: "Practise starting from the correct point",
      explanation: "The route did not begin at the required start location.",
      practiceFocus: "Check the start marker first, then begin drawing from that exact road node.",
      priority: "high"
    });
  }

  if (hasReviewItem(review.missedRestrictions, "Wrong destination")) {
    addPracticeRecommendation(recommendations, {
      id: "practice-required-destination",
      title: "Practise finishing at the destination",
      explanation: "The route did not finish at the required destination.",
      practiceFocus: "Trace the final road all the way to the destination marker before releasing the pointer.",
      priority: "high"
    });
  }

  if (hasReviewItem(review.missedRestrictions, "Missed required stop")) {
    addPracticeRecommendation(recommendations, {
      id: "practice-required-checkpoints",
      title: "Practise ordered checkpoints",
      explanation: "A required checkpoint was missed or visited out of order.",
      practiceFocus: "Say the required stops in order before drawing, then route through each checkpoint before the destination.",
      priority: "high"
    });
  }

  if (hasReviewItem(review.missedRestrictions, "Route too long")) {
    const scorePercent = scorePercentFromLabel(review.scoreLabel);
    const priority: RoutePracticeRecommendationPriority = scorePercent === null || scorePercent < 70 ? "medium" : "low";

    addPracticeRecommendation(recommendations, {
      id: "practice-route-efficiency",
      title: "Practise shorter legal routes",
      explanation: "The route was legal, but it was too long compared with the shortest legal route.",
      practiceFocus: "Look for unnecessary detours and compare your path with the shortest legal route distance.",
      priority
    });
  }

  if (recommendations.length === 0 && review.correctionHints.length > 0) {
    addPracticeRecommendation(recommendations, {
      id: "review-correction-hints",
      title: "Review the correction hints",
      explanation: "The review has next-step hints but no specific practice category was matched.",
      practiceFocus: review.correctionHints[0],
      priority: "medium"
    });
  }

  return recommendations;
}

const prioritySortOrder: Record<RoutePracticeRecommendationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2
};

const weaknessTypeLabels: Record<RoutePracticeWeaknessType, string> = {
  "prohibited-turn": "Prohibited turns",
  "no-entry": "No-entry roads",
  "one-way-direction": "One-way direction",
  "restricted-road": "Restricted roads",
  "wrong-start": "Wrong start",
  "wrong-destination": "Wrong destination",
  "missed-checkpoint": "Missed checkpoints",
  "disconnected-drawing": "Disconnected route drawing",
  "insufficient-drawing": "Insufficient drawing",
  "route-efficiency": "Route efficiency",
  "advanced-route": "Advanced route practice",
  "general-route-review": "General route review"
};

const trackedWeaknessTypes = new Set<RoutePracticeWeaknessType>([
  "prohibited-turn",
  "no-entry",
  "one-way-direction",
  "restricted-road",
  "wrong-start",
  "wrong-destination",
  "missed-checkpoint",
  "disconnected-drawing",
  "insufficient-drawing",
  "route-efficiency"
]);

function weaknessTypeForRecommendation(id: string): RoutePracticeWeaknessType {
  if (id === "practice-prohibited-turns") {
    return "prohibited-turn";
  }

  if (id === "practice-no-entry-roads") {
    return "no-entry";
  }

  if (id === "practice-one-way-direction") {
    return "one-way-direction";
  }

  if (id === "practice-restricted-roads") {
    return "restricted-road";
  }

  if (id === "practice-required-start") {
    return "wrong-start";
  }

  if (id === "practice-required-destination") {
    return "wrong-destination";
  }

  if (id === "practice-required-checkpoints") {
    return "missed-checkpoint";
  }

  if (id === "practice-continuous-drawing") {
    return "disconnected-drawing";
  }

  if (id === "practice-longer-drawn-route") {
    return "insufficient-drawing";
  }

  if (id === "practice-route-efficiency") {
    return "route-efficiency";
  }

  if (id === "try-harder-route") {
    return "advanced-route";
  }

  return "general-route-review";
}

export function buildRecommendedPracticeQueue(
  review: Pick<RouteAttemptReview, "status" | "practiceRecommendations">
): RecommendedPracticeQueueItem[] {
  if (review.status === "pending") {
    return [];
  }

  return review.practiceRecommendations
    .map((recommendation) => ({
      id: `queue-${recommendation.id}`,
      title: recommendation.title,
      reason: recommendation.explanation,
      weaknessType: weaknessTypeForRecommendation(recommendation.id),
      priority: recommendation.priority,
      suggestedExerciseId: undefined
    }))
    .sort((left, right) => {
      const priorityDifference = prioritySortOrder[left.priority] - prioritySortOrder[right.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return left.id.localeCompare(right.id);
    });
}

function strongestPriority(
  left: RoutePracticeRecommendationPriority,
  right: RoutePracticeRecommendationPriority
): RoutePracticeRecommendationPriority {
  return prioritySortOrder[left] <= prioritySortOrder[right] ? left : right;
}

function compareProfileEntries(left: LearnerWeakAreaProfileEntry, right: LearnerWeakAreaProfileEntry): number {
  if (left.count !== right.count) {
    return right.count - left.count;
  }

  const priorityDifference = prioritySortOrder[left.priority] - prioritySortOrder[right.priority];

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  if (left.lastSeenAttemptNumber !== right.lastSeenAttemptNumber) {
    return right.lastSeenAttemptNumber - left.lastSeenAttemptNumber;
  }

  return left.label.localeCompare(right.label);
}

function practiceFocusForWeakness(weaknessType: RoutePracticeWeaknessType): string {
  if (weaknessType === "prohibited-turn") {
    return "Practise identifying turn restriction signs before choosing the next road at a junction.";
  }

  if (weaknessType === "no-entry") {
    return "Practise spotting no-entry roads and approaching destinations from an allowed direction.";
  }

  if (weaknessType === "one-way-direction") {
    return "Practise following one-way arrows and planning turns that stay with the legal traffic flow.";
  }

  if (weaknessType === "restricted-road") {
    return "Practise avoiding restricted or closed roads and choosing the nearest open route.";
  }

  if (weaknessType === "wrong-start") {
    return "Practise checking the required start point before drawing the first road.";
  }

  if (weaknessType === "wrong-destination") {
    return "Practise finishing exactly at the required destination marker.";
  }

  if (weaknessType === "missed-checkpoint") {
    return "Practise saying each required checkpoint in order before drawing the route.";
  }

  if (weaknessType === "disconnected-drawing") {
    return "Practise drawing one continuous line through roads that meet at real junctions.";
  }

  if (weaknessType === "insufficient-drawing") {
    return "Practise drawing complete route attempts instead of short taps or partial traces.";
  }

  if (weaknessType === "route-efficiency") {
    return "Practise comparing your route with the shortest legal route and removing detours.";
  }

  return "Review the latest route feedback and retry the exercise.";
}

export function createEmptyLearnerWeakAreaProfile(): LearnerWeakAreaProfile {
  return {
    attemptsReviewed: 0,
    totalWeaknessCount: 0,
    weaknesses: []
  };
}

export function extractWeaknessCountersFromReview(
  review: Pick<RouteAttemptReview, "recommendedPracticeQueue">
): RouteWeaknessCounter[] {
  const countersByType = new Map<RoutePracticeWeaknessType, RouteWeaknessCounter>();

  for (const recommendation of review.recommendedPracticeQueue) {
    if (!trackedWeaknessTypes.has(recommendation.weaknessType)) {
      continue;
    }

    const existing = countersByType.get(recommendation.weaknessType);

    if (existing) {
      countersByType.set(recommendation.weaknessType, {
        ...existing,
        count: existing.count + 1,
        priority: strongestPriority(existing.priority, recommendation.priority)
      });
    } else {
      countersByType.set(recommendation.weaknessType, {
        weaknessType: recommendation.weaknessType,
        label: weaknessTypeLabels[recommendation.weaknessType],
        count: 1,
        priority: recommendation.priority
      });
    }
  }

  return Array.from(countersByType.values()).sort((left, right) => {
    const priorityDifference = prioritySortOrder[left.priority] - prioritySortOrder[right.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return left.label.localeCompare(right.label);
  });
}

export function updateLearnerWeakAreaProfile(
  profile: LearnerWeakAreaProfile,
  review: Pick<RouteAttemptReview, "status" | "recommendedPracticeQueue">
): LearnerWeakAreaProfile {
  if (review.status === "pending") {
    return {
      attemptsReviewed: profile.attemptsReviewed,
      totalWeaknessCount: profile.totalWeaknessCount,
      weaknesses: [...profile.weaknesses].sort(compareProfileEntries)
    };
  }

  const attemptNumber = profile.attemptsReviewed + 1;
  const counters = extractWeaknessCountersFromReview(review);
  const entriesByType = new Map<RoutePracticeWeaknessType, LearnerWeakAreaProfileEntry>(
    profile.weaknesses.map((weakness) => [weakness.weaknessType, { ...weakness }])
  );

  for (const counter of counters) {
    const existing = entriesByType.get(counter.weaknessType);

    entriesByType.set(counter.weaknessType, {
      weaknessType: counter.weaknessType,
      label: counter.label,
      count: (existing?.count ?? 0) + counter.count,
      priority: existing ? strongestPriority(existing.priority, counter.priority) : counter.priority,
      lastSeenAttemptNumber: attemptNumber
    });
  }

  return {
    attemptsReviewed: attemptNumber,
    totalWeaknessCount: profile.totalWeaknessCount + counters.reduce((sum, counter) => sum + counter.count, 0),
    weaknesses: Array.from(entriesByType.values()).sort(compareProfileEntries)
  };
}

export function getStrongestWeakAreas(profile: LearnerWeakAreaProfile, limit = 3): LearnerWeakAreaProfileEntry[] {
  return [...profile.weaknesses].sort(compareProfileEntries).slice(0, Math.max(0, Math.floor(limit)));
}

export function getLearnerWeakAreaPracticeFocus(profile: LearnerWeakAreaProfile): string {
  const strongestWeakArea = getStrongestWeakAreas(profile, 1)[0];

  if (!strongestWeakArea) {
    return profile.attemptsReviewed > 0
      ? "No repeated weak areas yet. Try a harder route or a multi-stop exercise next."
      : "Complete a drawn route attempt to build a weak-area profile.";
  }

  return practiceFocusForWeakness(strongestWeakArea.weaknessType);
}

export function buildRouteAttemptHistoryItem(
  review: RouteAttemptReview,
  attemptNumber: number
): RouteAttemptHistoryItem {
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1) {
    throw new Error("Attempt number must be a positive integer.");
  }

  const status = review.status;

  if (status === "pending") {
    throw new Error("Cannot build history item for a pending route review.");
  }

  return {
    id: `attempt-${attemptNumber}`,
    attemptNumber,
    status,
    title: review.title,
    scoreLabel: compactAttemptScoreLabel(review.scoreLabel),
    studentRouteDistanceLabel: routeAttemptMetricValue(review, "student-route-distance"),
    extraDistanceLabel: routeAttemptMetricValue(review, "extra-distance"),
    illegalMovementCount: review.illegalMovements.length,
    missedRestrictionCount: review.missedRestrictions.length,
    primaryFailureReason: review.suggestedFailureReason,
    review
  };
}

export function createRouteAttemptHistoryState(): RouteAttemptHistoryState {
  return {
    items: [],
    selectedAttemptNumber: null,
    nextAttemptNumber: 1
  };
}

export function appendRouteAttemptToHistory(
  state: RouteAttemptHistoryState,
  review: RouteAttemptReview
): RouteAttemptHistoryState {
  const item = buildRouteAttemptHistoryItem(review, state.nextAttemptNumber);

  return {
    items: [...state.items, item],
    selectedAttemptNumber: item.attemptNumber,
    nextAttemptNumber: state.nextAttemptNumber + 1
  };
}

export function selectRouteAttemptHistoryItem(
  state: RouteAttemptHistoryState,
  attemptNumber: number
): RouteAttemptHistoryState {
  if (!state.items.some((item) => item.attemptNumber === attemptNumber)) {
    return state;
  }

  return {
    ...state,
    selectedAttemptNumber: attemptNumber
  };
}

export function getSelectedRouteAttemptHistoryItem(state: RouteAttemptHistoryState): RouteAttemptHistoryItem | null {
  return state.items.find((item) => item.attemptNumber === state.selectedAttemptNumber) ?? null;
}

function withReviewGuidance(review: RouteAttemptReviewBase): RouteAttemptReview {
  const reviewWithHints: RouteAttemptReviewWithHints = {
    ...review,
    correctionHints: buildStudentCorrectionHints(review)
  };
  const reviewWithRecommendations: RouteAttemptReviewWithRecommendations = {
    ...reviewWithHints,
    practiceRecommendations: buildAdaptivePracticeRecommendations(reviewWithHints)
  };

  return {
    ...reviewWithRecommendations,
    recommendedPracticeQueue: buildRecommendedPracticeQueue(reviewWithRecommendations)
  };
}

export function buildRouteAttemptReview(input: BuildRouteAttemptReviewInput): RouteAttemptReview {
  const result = input.pipelineResult;

  if (input.isDrawing) {
    return withReviewGuidance({
      status: "pending",
      title: "Finish drawing to review this route",
      scoreLabel: "n/a",
      distanceLabel: "Release the pointer to run snapping, matching, and scoring.",
      distanceMetrics: [],
      illegalMovements: [],
      missedRestrictions: [],
      suggestedFailureReason: null
    });
  }

  if (!result.exerciseResult) {
    const blocked = result.status !== "empty";
    const missedRestrictions = dedupeItems(
      result.warnings
        .map((warning) => itemForPipelineWarning(warning))
        .filter((item): item is RouteAttemptReviewItem => Boolean(item))
    );

    return withReviewGuidance({
      status: blocked ? "blocked" : "pending",
      title: blocked ? "Route was not scored" : "Draw a route to get feedback",
      scoreLabel: "n/a",
      distanceLabel: blocked ? "The route did not reach scoring." : "No drawn route has been scored yet.",
      distanceMetrics: [],
      illegalMovements: [],
      missedRestrictions,
      suggestedFailureReason: suggestedFailureReason({
        result,
        illegalMovements: input.illegalMovements,
        blocked
      })
    });
  }

  const score = result.exerciseResult.score;
  const extraDistanceMeters = score.userRouteDistanceMeters - score.shortestLegalRouteDistanceMeters;
  const distanceMetrics: RouteAttemptReviewMetric[] = [
    {
      id: "student-route-distance",
      label: "Your route",
      value: formatDistance(score.userRouteDistanceMeters)
    },
    {
      id: "shortest-legal-distance",
      label: "Shortest legal route",
      value: formatDistance(score.shortestLegalRouteDistanceMeters)
    },
    {
      id: "extra-distance",
      label: "Extra distance",
      value: formatExtraDistance(extraDistanceMeters)
    }
  ];
  const illegalMovements = input.illegalMovements.map((movement) => ({
    id: movement.id,
    label: illegalMovementLabel(movement),
    detail: movement.message,
    severity: "error" as const
  }));
  const missedRestrictions = dedupeItems(
    score.failureReasons
      .filter((reason) => reason !== "illegal_route" || illegalMovements.length === 0)
      .map((reason) => itemForFailureReason(reason))
      .filter((item): item is RouteAttemptReviewItem => Boolean(item))
  );

  return withReviewGuidance({
    status: score.passed ? "pass" : "fail",
    title: score.passed ? "Route passed" : "Route failed",
    scoreLabel: `${score.scorePercent.toFixed(1)}% (${score.passed ? "pass" : "fail"})`,
    distanceLabel: `${distanceMetrics[0].label}: ${distanceMetrics[0].value}. ${distanceMetrics[1].label}: ${
      distanceMetrics[1].value
    }. ${distanceMetrics[2].label}: ${distanceMetrics[2].value}.`,
    distanceMetrics,
    illegalMovements,
    missedRestrictions,
    suggestedFailureReason: suggestedFailureReason({
      result,
      illegalMovements: input.illegalMovements,
      blocked: false
    })
  });
}
