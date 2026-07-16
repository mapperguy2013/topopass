import type {
  IllegalMovementType,
  RunRouteExerciseResult
} from "../../../lib/map-engine/index.ts";
import type {
  ExamScoringCategoryId,
  ExamScoringCategoryResult,
  ExamScoringResult
} from "./examScoringRubric.ts";

export type ExamReviewFeedbackItemTone = "strength" | "improvement" | "limitation";

export type ExamReviewFeedbackItem = {
  id: string;
  tone: ExamReviewFeedbackItemTone;
  principle: string;
  title: string;
  explanation: string;
  evidence: string[];
};

export type ExamReviewAttemptEvidence = {
  illegalMovements: readonly {
    id?: string;
    label: string;
    detail?: string;
  }[];
};

export type ExamReviewFeedback = {
  status: ExamScoringResult["status"];
  statusLabel: ExamScoringResult["statusLabel"];
  scorePercent: number;
  summary: string;
  strengths: ExamReviewFeedbackItem[];
  improvements: ExamReviewFeedbackItem[];
  limitations: ExamReviewFeedbackItem[];
  overlaySummary: string | null;
};

export type ResolveSubmittedExamReviewInput = {
  mode: "dev" | "student-beta" | "student-exam";
  submitted: boolean;
  scoringResult: ExamScoringResult | null;
  exerciseResult: RunRouteExerciseResult | null;
  attemptEvidence: ExamReviewAttemptEvidence | null;
};

type IllegalMovementFeedback = {
  principle: string;
  title: string;
  explanation: string;
};

const ILLEGAL_MOVEMENT_FEEDBACK: Record<IllegalMovementType, IllegalMovementFeedback> = {
  wrong_way_one_way: {
    principle: "One-way awareness",
    title: "Recheck the permitted direction",
    explanation:
      "A legal plan must follow the permitted direction on one-way streets. Check the map's direction symbols before committing to the next road."
  },
  no_entry: {
    principle: "Entry restrictions",
    title: "Choose a permitted approach",
    explanation:
      "Treat a no-entry restriction as a firm route boundary and plan an approach that enters the road legally."
  },
  road_closed: {
    principle: "Restricted roads",
    title: "Exclude the closed road",
    explanation:
      "A road rejected as closed cannot form part of the submitted plan. Replan around the marked restriction."
  },
  prohibited_turn: {
    principle: "Awkward junctions",
    title: "Check the junction movement",
    explanation:
      "A road can be legal to use while a particular turn is prohibited. Check the junction restriction before choosing the connecting road."
  },
  no_u_turn: {
    principle: "Turn restrictions",
    title: "Avoid the prohibited reversal",
    explanation:
      "A prohibited U-turn cannot be used to repair the route at the junction. Continue to a legal alternative instead."
  },
  disconnected_road_jump: {
    principle: "Route continuity",
    title: "Keep the route connected",
    explanation:
      "Every matched movement must connect to the previous road movement. Redraw the gap using connected mapped roads."
  },
  off_road: {
    principle: "Map matching",
    title: "Keep the line on mapped roads",
    explanation:
      "The submitted line must follow the available road graph closely enough to produce a dependable route assessment."
  }
};

const REVIEW_KIND_BY_ILLEGAL_MOVEMENT: Partial<Record<IllegalMovementType, string>> = {
  wrong_way_one_way: "one-way-wrong-direction",
  no_entry: "no-entry-road",
  road_closed: "closed-road",
  prohibited_turn: "prohibited-turn",
  no_u_turn: "prohibited-turn"
};

function category(
  scoringResult: ExamScoringResult,
  id: ExamScoringCategoryId
): ExamScoringCategoryResult {
  const result = scoringResult.categories.find((candidate) => candidate.id === id);

  if (!result) {
    throw new Error(`Exam scoring result is missing the ${id} category.`);
  }

  return result;
}

function categoryStrength(
  scoringResult: ExamScoringResult,
  id: ExamScoringCategoryId,
  principle: string,
  title: string,
  explanation: string
): ExamReviewFeedbackItem | null {
  const result = category(scoringResult, id);

  if (result.outcome !== "met") {
    return null;
  }

  return {
    id: `strength-${id}`,
    tone: "strength",
    principle,
    title,
    explanation,
    evidence: result.evidence
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function buildIllegalMovementImprovements(
  exerciseResult: RunRouteExerciseResult,
  attemptEvidence: ExamReviewAttemptEvidence
): ExamReviewFeedbackItem[] {
  const illegalMovements = exerciseResult.score.legality.illegalMovements;
  const movementTypes = uniqueStrings(illegalMovements.map((movement) => movement.type)) as IllegalMovementType[];

  return movementTypes.map((movementType) => {
    const feedback = ILLEGAL_MOVEMENT_FEEDBACK[movementType];
    const count = illegalMovements.filter((movement) => movement.type === movementType).length;
    const reviewKind = REVIEW_KIND_BY_ILLEGAL_MOVEMENT[movementType];
    const matchingReviewItems = reviewKind
      ? attemptEvidence.illegalMovements.filter((item) => item.id?.includes(reviewKind))
      : [];
    const reviewEvidence = uniqueStrings(
      matchingReviewItems.flatMap((item) =>
        item.detail ? [item.label, item.detail] : [item.label]
      )
    );

    return {
      id: `improvement-${movementType}`,
      tone: "improvement",
      principle: feedback.principle,
      title: feedback.title,
      explanation: feedback.explanation,
      evidence:
        reviewEvidence.length > 0
          ? reviewEvidence
          : [`${count} ${movementType.replaceAll("_", " ")} movement${count === 1 ? "" : "s"} identified.`]
    };
  });
}

function categoryImprovement(
  scoringResult: ExamScoringResult,
  id: ExamScoringCategoryId,
  principle: string,
  title: string,
  explanation: string
): ExamReviewFeedbackItem | null {
  const result = category(scoringResult, id);

  if (result.outcome === "met" || result.scorePercent === null) {
    return null;
  }

  return {
    id: `improvement-${id}`,
    tone: "improvement",
    principle,
    title,
    explanation,
    evidence: result.evidence
  };
}

function categoryLimitation(
  scoringResult: ExamScoringResult,
  id: ExamScoringCategoryId,
  principle: string
): ExamReviewFeedbackItem | null {
  const result = category(scoringResult, id);

  if (result.assessment === "supported") {
    return null;
  }

  return {
    id: `limitation-${id}`,
    tone: "limitation",
    principle,
    title:
      result.assessment === "unavailable"
        ? `${result.label} was not assessed`
        : `${result.label} has limited evidence`,
    explanation: result.summary,
    evidence: result.evidence
  };
}

export function buildExamReviewFeedback(input: {
  scoringResult: ExamScoringResult;
  exerciseResult: RunRouteExerciseResult;
  attemptEvidence: ExamReviewAttemptEvidence;
}): ExamReviewFeedback {
  const { scoringResult, exerciseResult, attemptEvidence } = input;
  const strengths = [
    categoryStrength(
      scoringResult,
      "legality",
      "Legal route planning",
      "Restrictions were respected",
      "The current restriction engine found no rejected movement in the matched route."
    ),
    categoryStrength(
      scoringResult,
      "destination-completion",
      "Task completion",
      "The route reached the required destination",
      "The matched route finished at the destination specified by the exercise."
    ),
    categoryStrength(
      scoringResult,
      "route-efficiency",
      "Practical route choice",
      "The route used distance efficiently",
      "The legal, completed route stayed within the current shortest-route allowance."
    ),
    categoryStrength(
      scoringResult,
      "detour-backtracking",
      "Controlled route shape",
      "No avoidable reversal was found",
      "The matched sequence avoided an immediate same-road reversal and earned a high efficiency grade."
    )
  ].filter((item): item is ExamReviewFeedbackItem => item !== null);

  const improvements = [
    ...buildIllegalMovementImprovements(exerciseResult, attemptEvidence),
    categoryImprovement(
      scoringResult,
      "destination-completion",
      "Task completion",
      "Finish at the stated destination",
      "Before submitting, confirm that the final matched point is the destination named in the task."
    ),
    categoryImprovement(
      scoringResult,
      "route-efficiency",
      "Route efficiency",
      "Reduce avoidable detour",
      "Compare the overall corridor choice with the shortest legal route and remove distance that does not help complete the task."
    ),
    categoryImprovement(
      scoringResult,
      "detour-backtracking",
      "Backtracking",
      "Plan forward through the route",
      "Avoid immediate reversals and repeated road use where a connected legal route can continue toward the destination."
    )
  ].filter((item): item is ExamReviewFeedbackItem => item !== null);
  const avoidableMistakes = category(scoringResult, "avoidable-mistakes");
  const additionalMistakes = avoidableMistakes.evidence.filter(
    (evidence) =>
      evidence !== "Illegal route movement" &&
      evidence !== "Excessive route distance" &&
      evidence !== "Wrong destination"
  );

  if (additionalMistakes.length > 0) {
    improvements.push({
      id: "improvement-task-checks",
      tone: "improvement",
      principle: "Pre-submit checks",
      title: "Check the complete route task",
      explanation:
        "Confirm the origin, destination, required stops, and continuity of the matched route before submitting the attempt.",
      evidence: additionalMistakes
    });
  }

  const limitations = [
    categoryLimitation(scoringResult, "route-efficiency", "Efficiency evidence"),
    categoryLimitation(scoringResult, "detour-backtracking", "Detour evidence"),
    categoryLimitation(scoringResult, "road-suitability", "Road hierarchy"),
    categoryLimitation(scoringResult, "avoidable-mistakes", "Validator coverage"),
    {
      id: "limitation-london-context",
      tone: "limitation" as const,
      principle: "London context",
      title: "Landmark, bridge, and junction quality are not scored",
      explanation:
        "The current exercise result does not provide dependable comparison evidence for landmark use, bridge choice, or the quality of a legal junction approach.",
      evidence: []
    }
  ].filter((item): item is ExamReviewFeedbackItem => item !== null);
  const illegalReviewCount = attemptEvidence.illegalMovements.length;

  return {
    status: scoringResult.status,
    statusLabel: scoringResult.statusLabel,
    scorePercent: scoringResult.scorePercent,
    summary: scoringResult.summary,
    strengths,
    improvements,
    limitations,
    overlaySummary:
      illegalReviewCount > 0
        ? `${illegalReviewCount} verified restriction issue${illegalReviewCount === 1 ? " is" : "s are"} available to inspect on the submitted-route overlay.`
        : null
  };
}

export function resolveSubmittedExamReviewFeedback(
  input: ResolveSubmittedExamReviewInput
): ExamReviewFeedback | null {
  if (
    input.mode !== "student-exam" ||
    !input.submitted ||
    !input.scoringResult ||
    !input.exerciseResult ||
    !input.attemptEvidence
  ) {
    return null;
  }

  return buildExamReviewFeedback({
    scoringResult: input.scoringResult,
    exerciseResult: input.exerciseResult,
    attemptEvidence: input.attemptEvidence
  });
}
