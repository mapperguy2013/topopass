import type {
  RouteScoringFailureReason,
  RunRouteExerciseResult
} from "../../../lib/map-engine/index.ts";

export const EXAM_SCORING_PASS_THRESHOLD_PERCENT = 80;
export const EXAM_SCORING_DISCLAIMER =
  "This is a PCO Ready practice score based on the current route data and is not an official TfL assessment.";

export type ExamScoringCategoryId =
  | "legality"
  | "destination-completion"
  | "route-efficiency"
  | "detour-backtracking"
  | "road-suitability"
  | "avoidable-mistakes";

export type ExamScoringAssessment = "supported" | "limited" | "unavailable";
export type ExamScoringCategoryOutcome = "met" | "needs-practice" | "limited" | "unavailable";

export type ExamScoringCategoryResult = {
  id: ExamScoringCategoryId;
  label: string;
  assessment: ExamScoringAssessment;
  outcome: ExamScoringCategoryOutcome;
  scorePercent: number | null;
  weightPercent: number;
  weightedPoints: number;
  summary: string;
  evidence: string[];
};

export type ExamScoringResult = {
  scorePercent: number;
  status: "pass" | "needs-practice";
  statusLabel: "Pass" | "Needs practice";
  summary: string;
  passThresholdPercent: typeof EXAM_SCORING_PASS_THRESHOLD_PERCENT;
  categories: ExamScoringCategoryResult[];
  disclaimer: typeof EXAM_SCORING_DISCLAIMER;
};

export type ResolveSubmittedExamScoringInput = {
  mode: "dev" | "student-beta" | "student-exam";
  submitted: boolean;
  exerciseResult: RunRouteExerciseResult | null;
};

const CATEGORY_WEIGHTS = {
  legality: 30,
  destinationCompletion: 25,
  routeEfficiency: 35,
  detourBacktracking: 10
} as const;

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function weightedPoints(scorePercent: number, weightPercent: number): number {
  return roundToOneDecimal((scorePercent / 100) * weightPercent);
}

function immediateBacktrackingCount(result: RunRouteExerciseResult): number {
  const movements = result.normalisedAttempt.movements;
  let count = 0;

  for (let index = 1; index < movements.length; index += 1) {
    const previous = movements[index - 1];
    const current = movements[index];

    if (
      previous.roadId === current.roadId &&
      previous.fromNodeId === current.toNodeId &&
      previous.toNodeId === current.fromNodeId
    ) {
      count += 1;
    }
  }

  return count;
}

function destinationWasReached(result: RunRouteExerciseResult): boolean {
  const requiredNodeIds = result.normalisedAttempt.requiredNodeIds;
  const selectedNodeIds = result.normalisedAttempt.selectedNodeIds;
  const requiredDestinationId = requiredNodeIds.at(-1);

  return Boolean(
    requiredDestinationId &&
      selectedNodeIds.at(-1) === requiredDestinationId &&
      !result.score.failureReasons.includes("wrong_destination")
  );
}

function legalityCategory(result: RunRouteExerciseResult): ExamScoringCategoryResult {
  const isLegal = result.score.legality.isLegal;
  const violationCount = result.score.legality.illegalMovements.length;
  const scorePercent = isLegal ? 100 : 0;

  return {
    id: "legality",
    label: "Legality",
    assessment: "supported",
    outcome: isLegal ? "met" : "needs-practice",
    scorePercent,
    weightPercent: CATEGORY_WEIGHTS.legality,
    weightedPoints: weightedPoints(scorePercent, CATEGORY_WEIGHTS.legality),
    summary: isLegal
      ? "The matched route contains no movement rejected by the current restriction engine."
      : "The current restriction engine rejected at least one movement in the matched route.",
    evidence: [
      isLegal
        ? "No illegal movement was identified."
        : `${violationCount} illegal movement${violationCount === 1 ? "" : "s"} identified.`
    ]
  };
}

function destinationCategory(result: RunRouteExerciseResult): ExamScoringCategoryResult {
  const reached = destinationWasReached(result);
  const scorePercent = reached ? 100 : 0;

  return {
    id: "destination-completion",
    label: "Destination completion",
    assessment: "supported",
    outcome: reached ? "met" : "needs-practice",
    scorePercent,
    weightPercent: CATEGORY_WEIGHTS.destinationCompletion,
    weightedPoints: weightedPoints(scorePercent, CATEGORY_WEIGHTS.destinationCompletion),
    summary: reached
      ? "The matched route finishes at the required destination."
      : "The matched route does not finish at the required destination.",
    evidence: [reached ? "Required destination reached." : "Required destination not reached."]
  };
}

function efficiencyCategory(result: RunRouteExerciseResult): ExamScoringCategoryResult {
  const score = result.score;
  const comparisonAvailable =
    score.userRouteDistanceMeters > 0 &&
    score.shortestLegalRouteDistanceMeters > 0 &&
    !score.failureReasons.includes("no_valid_shortest_route");
  const canAssessIndependently = comparisonAvailable && score.isLegal && destinationWasReached(result);

  if (!canAssessIndependently) {
    const reason = !comparisonAvailable
      ? "No valid shortest legal route comparison is available."
      : !score.isLegal
        ? "Efficiency is not awarded separately when the route fails legality."
        : "Efficiency is not awarded when the route does not reach the required destination.";

    return {
      id: "route-efficiency",
      label: "Route efficiency",
      assessment: comparisonAvailable ? "limited" : "unavailable",
      outcome: comparisonAvailable ? "limited" : "unavailable",
      scorePercent: null,
      weightPercent: CATEGORY_WEIGHTS.routeEfficiency,
      weightedPoints: 0,
      summary: reason,
      evidence: []
    };
  }

  const scorePercent = score.scorePercent;

  return {
    id: "route-efficiency",
    label: "Route efficiency",
    assessment: "supported",
    outcome: scorePercent >= score.passThresholdPercent ? "met" : "needs-practice",
    scorePercent,
    weightPercent: CATEGORY_WEIGHTS.routeEfficiency,
    weightedPoints: weightedPoints(scorePercent, CATEGORY_WEIGHTS.routeEfficiency),
    summary:
      scorePercent >= score.passThresholdPercent
        ? "The route meets the current shortest-legal-route efficiency threshold."
        : "The route exceeds the current shortest-legal-route efficiency allowance.",
    evidence: [
      `${Math.round(score.userRouteDistanceMeters)} m drawn route.`,
      `${Math.round(score.shortestLegalRouteDistanceMeters)} m shortest legal comparison.`,
      `${score.passThresholdPercent}% current route-engine pass threshold.`
    ]
  };
}

function detourBacktrackingCategory(result: RunRouteExerciseResult): ExamScoringCategoryResult {
  const score = result.score;
  const backtrackingCount = immediateBacktrackingCount(result);
  const comparisonAvailable =
    score.userRouteDistanceMeters > 0 &&
    score.shortestLegalRouteDistanceMeters > 0 &&
    !score.failureReasons.includes("no_valid_shortest_route");

  if (!comparisonAvailable) {
    return {
      id: "detour-backtracking",
      label: "Detour and backtracking",
      assessment: "unavailable",
      outcome: "unavailable",
      scorePercent: null,
      weightPercent: CATEGORY_WEIGHTS.detourBacktracking,
      weightedPoints: 0,
      summary: "No valid shortest legal route comparison is available for a detour check.",
      evidence: []
    };
  }

  const scorePercent =
    backtrackingCount > 0
      ? 0
      : score.grade === "excellent" || score.grade === "very_good"
        ? 100
        : score.grade === "pass"
          ? 50
          : 0;

  return {
    id: "detour-backtracking",
    label: "Detour and backtracking",
    assessment: "limited",
    outcome: scorePercent === 100 ? "met" : scorePercent === 0 ? "needs-practice" : "limited",
    scorePercent,
    weightPercent: CATEGORY_WEIGHTS.detourBacktracking,
    weightedPoints: weightedPoints(scorePercent, CATEGORY_WEIGHTS.detourBacktracking),
    summary:
      backtrackingCount > 0
        ? "The matched movement sequence immediately reverses along the same road."
        : scorePercent === 100
          ? "No immediate road reversal was found and the route earned a high efficiency grade."
          : scorePercent === 50
            ? "No immediate road reversal was found, but the route has avoidable extra distance."
            : "The route has excessive extra distance under the current efficiency grade.",
    evidence: [
      `${backtrackingCount} immediate road reversal${backtrackingCount === 1 ? "" : "s"} identified.`,
      `Current route-engine efficiency grade: ${score.gradeLabel}.`
    ]
  };
}

const FAILURE_REASON_LABELS: Record<RouteScoringFailureReason, string> = {
  illegal_route: "Illegal route movement",
  below_efficiency_threshold: "Excessive route distance",
  wrong_start: "Wrong origin",
  wrong_destination: "Wrong destination",
  missed_required_stop: "Missed or out-of-order required stop",
  no_valid_shortest_route: "No valid shortest-route comparison",
  zero_distance_route: "No usable route distance"
};

function avoidableMistakesCategory(result: RunRouteExerciseResult): ExamScoringCategoryResult {
  const mistakes = result.score.failureReasons.map((reason) => FAILURE_REASON_LABELS[reason]);

  return {
    id: "avoidable-mistakes",
    label: "Avoidable mistakes",
    assessment: "limited",
    outcome: "limited",
    scorePercent: null,
    weightPercent: 0,
    weightedPoints: 0,
    summary:
      mistakes.length === 0
        ? "No avoidable mistake was identified by the current route validator."
        : `${mistakes.length} issue${mistakes.length === 1 ? "" : "s"} identified by the current route validator.`,
    evidence: mistakes
  };
}

function roadSuitabilityCategory(): ExamScoringCategoryResult {
  return {
    id: "road-suitability",
    label: "Road hierarchy and suitability",
    assessment: "unavailable",
    outcome: "unavailable",
    scorePercent: null,
    weightPercent: 0,
    weightedPoints: 0,
    summary: "The shared scored-road model does not yet provide dependable hierarchy or suitability evidence.",
    evidence: ["This category does not affect the Stage 9.2 score."]
  };
}

function resultSummary(result: RunRouteExerciseResult, status: ExamScoringResult["status"]): string {
  const failureReasons = result.score.failureReasons;

  if (status === "pass") {
    return "The route was legal, reached the destination, and met the current efficiency threshold.";
  }

  if (failureReasons.includes("illegal_route")) {
    return "The route needs practice because the current restriction engine identified an illegal movement.";
  }

  if (failureReasons.includes("wrong_destination")) {
    return "The route needs practice because it did not finish at the required destination.";
  }

  if (failureReasons.includes("wrong_start")) {
    return "The route needs practice because it did not begin at the required origin.";
  }

  if (failureReasons.includes("missed_required_stop")) {
    return "The route needs practice because a required stop was missed or visited out of order.";
  }

  if (failureReasons.includes("below_efficiency_threshold")) {
    return "The route was legal and complete, but it exceeded the current efficiency allowance.";
  }

  return "The current route data could not produce a passing exam-practice assessment.";
}

export function buildExamScoringResult(result: RunRouteExerciseResult): ExamScoringResult {
  const categories = [
    legalityCategory(result),
    destinationCategory(result),
    efficiencyCategory(result),
    detourBacktrackingCategory(result),
    roadSuitabilityCategory(),
    avoidableMistakesCategory(result)
  ];
  const scorePercent = roundToOneDecimal(
    categories.reduce((total, category) => total + category.weightedPoints, 0)
  );
  const status = result.score.passed && scorePercent >= EXAM_SCORING_PASS_THRESHOLD_PERCENT
    ? "pass"
    : "needs-practice";

  return {
    scorePercent,
    status,
    statusLabel: status === "pass" ? "Pass" : "Needs practice",
    summary: resultSummary(result, status),
    passThresholdPercent: EXAM_SCORING_PASS_THRESHOLD_PERCENT,
    categories,
    disclaimer: EXAM_SCORING_DISCLAIMER
  };
}

export function resolveSubmittedExamScoringResult(
  input: ResolveSubmittedExamScoringInput
): ExamScoringResult | null {
  if (input.mode !== "student-exam" || !input.submitted || !input.exerciseResult) {
    return null;
  }

  return buildExamScoringResult(input.exerciseResult);
}
