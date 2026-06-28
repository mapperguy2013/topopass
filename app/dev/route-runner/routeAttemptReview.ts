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

export type RouteAttemptReview = {
  status: RouteAttemptReviewStatus;
  title: string;
  scoreLabel: string;
  distanceLabel: string;
  distanceMetrics: RouteAttemptReviewMetric[];
  illegalMovements: RouteAttemptReviewItem[];
  missedRestrictions: RouteAttemptReviewItem[];
  suggestedFailureReason: string | null;
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

export function buildRouteAttemptReview(input: BuildRouteAttemptReviewInput): RouteAttemptReview {
  const result = input.pipelineResult;

  if (input.isDrawing) {
    return {
      status: "pending",
      title: "Finish drawing to review this route",
      scoreLabel: "n/a",
      distanceLabel: "Release the pointer to run snapping, matching, and scoring.",
      distanceMetrics: [],
      illegalMovements: [],
      missedRestrictions: [],
      suggestedFailureReason: null
    };
  }

  if (!result.exerciseResult) {
    const blocked = result.status !== "empty";
    const missedRestrictions = dedupeItems(
      result.warnings
        .map((warning) => itemForPipelineWarning(warning))
        .filter((item): item is RouteAttemptReviewItem => Boolean(item))
    );

    return {
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
    };
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

  return {
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
  };
}
