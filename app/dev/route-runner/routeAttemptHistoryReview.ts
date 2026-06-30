import type { SavedRouteAttemptListItem } from "./routeAttemptStorage.ts";

export type SavedAttemptReviewSeverity = "info" | "warning" | "error";

export type SavedAttemptReviewItem = {
  id: string;
  label: string;
  detail?: string;
  severity: SavedAttemptReviewSeverity;
};

export type SavedAttemptLegReview = {
  id: string;
  label: string;
  fromNodeId: string;
  toNodeId: string;
  statusLabel: string;
  scoreLabel: string;
  userDistanceLabel: string;
  shortestDistanceLabel: string;
  extraDistanceLabel: string;
  issueLabel: string;
};

export type SavedAttemptReviewModel = {
  id: string;
  title: string;
  subtitle: string;
  statusLabel: SavedRouteAttemptListItem["statusLabel"];
  scoreLabel: string;
  legalLabel: string;
  failureReason: string;
  exerciseDataWarning: string | null;
  userRouteSummary: string;
  shortestRouteSummary: string;
  scoreExplanation: string;
  violations: SavedAttemptReviewItem[];
  missedRestrictions: SavedAttemptReviewItem[];
  legBreakdown: SavedAttemptLegReview[];
  matchedRouteSummary: string;
  rawReviewPayload: SavedRouteAttemptListItem["reviewPayload"];
};

export type SavedAttemptHistoryReviewListItem = {
  id: string;
  dateLabel: string;
  exerciseLabel: string;
  exerciseId: string;
  scoreLabel: string;
  statusLabel: SavedRouteAttemptListItem["statusLabel"];
  legalLabel: string;
  userDistanceLabel: string;
  shortestDistanceLabel: string;
  failureReason: string;
};

export type SavedAttemptHistoryReviewList = {
  isEmpty: boolean;
  emptyMessage: string;
  attempts: SavedAttemptHistoryReviewListItem[];
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function formatDistance(distanceMeters: unknown): string {
  const distance = numberValue(distanceMeters);

  if (distance === null) {
    return "n/a";
  }

  if (Math.abs(distance) >= 1000) {
    return `${(distance / 1000).toFixed(2)} km`;
  }

  return `${Math.round(distance)} m`;
}

function formatExtraDistance(distanceMeters: unknown): string {
  const label = formatDistance(distanceMeters);

  return label === "n/a" ? label : `+${label}`;
}

function formatScore(scorePercent: unknown): string {
  const score = numberValue(scorePercent);

  return score === null ? "n/a" : `${score.toFixed(1)}%`;
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function legalLabel(isLegal: boolean | null): string {
  if (isLegal === true) {
    return "Legal";
  }

  if (isLegal === false) {
    return "Illegal";
  }

  return "Unknown";
}

function routeItems(value: unknown): SavedAttemptReviewItem[] {
  return arrayValue(value)
    .map((item, index): SavedAttemptReviewItem | null => {
      const source = objectValue(item);
      const label = stringValue(source.label);

      if (!label) {
        return null;
      }

      const severity = stringValue(source.severity, "warning");

      return {
        id: stringValue(source.id, `item-${index}`),
        label,
        detail: stringValue(source.detail) || undefined,
        severity: severity === "info" || severity === "warning" || severity === "error" ? severity : "warning"
      };
    })
    .filter((item): item is SavedAttemptReviewItem => Boolean(item));
}

function metricValue(
  reviewPayload: Record<string, unknown>,
  metricId: string,
  fallback: string
): string {
  const metric = arrayValue(reviewPayload.distanceMetrics)
    .map((item) => objectValue(item))
    .find((item) => item.id === metricId);

  return stringValue(metric?.value, fallback);
}

function routeIdArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

function matchedRouteSummary(matchedRoute: SavedRouteAttemptListItem["matchedRoute"]): string {
  const route = objectValue(matchedRoute);
  const roadIds = routeIdArray(route.selectedRoadIds).length > 0
    ? routeIdArray(route.selectedRoadIds)
    : routeIdArray(route.orderedRoadIds);
  const nodeIds = routeIdArray(route.selectedNodeIds);
  const edgeIds = routeIdArray(route.directedEdgeIds);

  if (roadIds.length === 0 && nodeIds.length === 0 && edgeIds.length === 0) {
    return "No compact matched route was saved for this attempt.";
  }

  return [
    roadIds.length > 0 ? pluralize(roadIds.length, "road") : null,
    nodeIds.length > 0 ? pluralize(nodeIds.length, "node") : null,
    edgeIds.length > 0 ? pluralize(edgeIds.length, "directed edge") : null
  ]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

function legStatusLabel(leg: Record<string, unknown>): string {
  if (leg.automaticFail === true) {
    return "Automatic fail";
  }

  if (leg.passed === true) {
    return "Pass";
  }

  if (leg.passed === false) {
    return "Fail";
  }

  return "Unknown";
}

function legIssueLabel(leg: Record<string, unknown>): string {
  const violationCount = arrayValue(leg.violations).length;

  if (violationCount > 0) {
    return pluralize(violationCount, "violation");
  }

  const failureReasons = routeIdArray(leg.failureReasons);

  return failureReasons.length > 0 ? failureReasons.join(", ") : "None";
}

function buildLegBreakdown(value: SavedRouteAttemptListItem["perLegBreakdown"]): SavedAttemptLegReview[] {
  return arrayValue(value).map((item, index) => {
    const leg = objectValue(item);
    const legIndex = numberValue(leg.legIndex) ?? index;
    const fromNodeId = stringValue(leg.fromNodeId, "unknown");
    const toNodeId = stringValue(leg.toNodeId, "unknown");

    return {
      id: `leg-${legIndex}`,
      label: `Leg ${legIndex + 1}: ${fromNodeId} to ${toNodeId}`,
      fromNodeId,
      toNodeId,
      statusLabel: legStatusLabel(leg),
      scoreLabel: formatScore(leg.scorePercent),
      userDistanceLabel: formatDistance(leg.userRouteDistanceMeters),
      shortestDistanceLabel: formatDistance(leg.shortestLegalRouteDistanceMeters),
      extraDistanceLabel: formatExtraDistance(leg.extraDistanceMeters),
      issueLabel: legIssueLabel(leg)
    };
  });
}

function scoreExplanation(input: {
  attempt: SavedRouteAttemptListItem;
  reviewPayload: Record<string, unknown>;
  violationCount: number;
  missedRestrictionCount: number;
}): string {
  const suggestedFailureReason = stringValue(input.reviewPayload.suggestedFailureReason);

  if (suggestedFailureReason) {
    return suggestedFailureReason;
  }

  if (input.attempt.statusLabel === "Pass") {
    return "This attempt met the route score requirement.";
  }

  if (input.violationCount > 0) {
    return "This attempt used at least one illegal movement.";
  }

  if (input.missedRestrictionCount > 0) {
    return "This attempt missed a route requirement or checkpoint.";
  }

  return input.attempt.failureReason;
}

export function buildSavedAttemptHistoryReviewList(
  attempts: readonly SavedRouteAttemptListItem[]
): SavedAttemptHistoryReviewList {
  return {
    isEmpty: attempts.length === 0,
    emptyMessage: "No saved route attempts yet. Submit a drawn route to save its review.",
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      dateLabel: attempt.dateLabel,
      exerciseLabel: attempt.exerciseLabel,
      exerciseId: attempt.exerciseId,
      scoreLabel: attempt.scoreLabel,
      statusLabel: attempt.statusLabel,
      legalLabel: legalLabel(attempt.isLegal),
      userDistanceLabel: attempt.userDistanceLabel,
      shortestDistanceLabel: attempt.shortestDistanceLabel,
      failureReason: attempt.failureReason
    }))
  };
}

export function buildSavedAttemptReview(
  attempt: SavedRouteAttemptListItem | null | undefined
): SavedAttemptReviewModel | null {
  if (!attempt) {
    return null;
  }

  const reviewPayload = objectValue(attempt.reviewPayload);
  const violations = routeItems(reviewPayload.illegalMovements);
  const missedRestrictions = routeItems(reviewPayload.missedRestrictions);
  const userRouteDistance = metricValue(reviewPayload, "student-route-distance", attempt.userDistanceLabel);
  const shortestRouteDistance = metricValue(reviewPayload, "shortest-legal-distance", attempt.shortestDistanceLabel);
  const exerciseDataWarning =
    attempt.exerciseLabel === attempt.exerciseId ? "Exercise title unavailable; showing the saved exercise id." : null;

  return {
    id: attempt.id,
    title: stringValue(reviewPayload.title, attempt.reviewTitle),
    subtitle: `${attempt.exerciseLabel} - ${attempt.dateLabel}`,
    statusLabel: attempt.statusLabel,
    scoreLabel: stringValue(reviewPayload.scoreLabel, attempt.scoreLabel),
    legalLabel: legalLabel(attempt.isLegal),
    failureReason: attempt.failureReason,
    exerciseDataWarning,
    userRouteSummary: `Your saved route distance was ${userRouteDistance}. ${matchedRouteSummary(attempt.matchedRoute)}`,
    shortestRouteSummary: `The saved shortest legal route distance was ${shortestRouteDistance}.`,
    scoreExplanation: scoreExplanation({
      attempt,
      reviewPayload,
      violationCount: violations.length,
      missedRestrictionCount: missedRestrictions.length
    }),
    violations,
    missedRestrictions,
    legBreakdown: buildLegBreakdown(attempt.perLegBreakdown),
    matchedRouteSummary: matchedRouteSummary(attempt.matchedRoute),
    rawReviewPayload: attempt.reviewPayload
  };
}
