import type { RouteStop } from "../map-engine/index.ts";
import type {
  AttemptEvent,
  DrivingFault,
  ExerciseDifficulty,
  ExerciseObjective,
  Hint,
  HintLevel,
  LearnerExercise,
  RouteInstruction
} from "./learnerDriverTraining.ts";
import type { GeneratedLearnerExercise } from "./learnerExerciseGeneration.ts";
import type { ScorableLearnerExercise } from "./learnerAttemptScoring.ts";
import type { LearnerRouteValidationSegment } from "./learnerRouteValidation.ts";

export const PROGRESSIVE_HINT_STAGES = [
  "general-nudge",
  "directional-clue",
  "road-junction-clue",
  "specific-next-action",
  "reveal-answer"
] as const;

export type ProgressiveHintStage = (typeof PROGRESSIVE_HINT_STAGES)[number];

export type LearnerProgressiveHint = Hint & {
  stage: ProgressiveHintStage;
  specificity: 1 | 2 | 3 | 4 | 5;
  targetInstructionId?: string;
  targetRouteSegmentId?: string;
  targetRoadId?: string;
  targetNodeId?: string;
  checkpointLabel?: string;
  generatedFrom: {
    objectiveId?: string;
    currentNodeId?: string;
    currentCheckpointIndex?: number;
    previousMistakeCategories: string[];
    hintRequestNumber: number;
    difficulty: ExerciseDifficulty;
  };
};

export type LearnerHintFallback = {
  title: string;
  text: string;
  reason: "missing-route-context" | "missing-objective-context";
};

export type GenerateLearnerHintInput = {
  exercise: LearnerExercise | ScorableLearnerExercise | GeneratedLearnerExercise;
  objectiveId?: string;
  currentNodeId?: string;
  currentCheckpointIndex?: number;
  currentInstructionId?: string;
  hintsAlreadyUsed?: readonly Hint[];
  previousHintLevels?: readonly HintLevel[];
  previousMistakes?: readonly DrivingFault[];
  attemptId?: string;
  occurredAt?: string;
};

export type LearnerHintGenerationResult =
  | {
      status: "generated";
      hint: LearnerProgressiveHint;
      fallback: null;
      attemptEvent?: AttemptEvent;
      explanation: string;
    }
  | {
      status: "fallback";
      hint: null;
      fallback: LearnerHintFallback;
      attemptEvent?: undefined;
      explanation: string;
    };

type HintTarget = {
  objective: ExerciseObjective;
  instruction: RouteInstruction;
  routeSegment?: LearnerRouteValidationSegment;
  checkpoint?: RouteStop;
};

const stageSpecificity: Record<ProgressiveHintStage, 1 | 2 | 3 | 4 | 5> = {
  "general-nudge": 1,
  "directional-clue": 2,
  "road-junction-clue": 3,
  "specific-next-action": 4,
  "reveal-answer": 5
};

const hintLevelByStage: Record<ProgressiveHintStage, HintLevel> = {
  "general-nudge": "nudge",
  "directional-clue": "guided",
  "road-junction-clue": "guided",
  "specific-next-action": "worked-example",
  "reveal-answer": "show-answer"
};

function isRouteActionInstruction(instruction: RouteInstruction): boolean {
  return instruction.kind !== "start" && instruction.kind !== "checkpoint" && instruction.kind !== "arrive";
}

function routeSegmentsForExercise(
  exercise: LearnerExercise | ScorableLearnerExercise | GeneratedLearnerExercise
): readonly LearnerRouteValidationSegment[] {
  const candidate = exercise as ScorableLearnerExercise | GeneratedLearnerExercise;

  return candidate.expectedRouteSegments ?? [];
}

function checkpointsForExercise(
  exercise: LearnerExercise | ScorableLearnerExercise | GeneratedLearnerExercise
): readonly RouteStop[] {
  const candidate = exercise as ScorableLearnerExercise | GeneratedLearnerExercise;

  return candidate.checkpoints ?? [];
}

function stopNodeId(stop: RouteStop): string | null {
  return stop.type === "node" ? stop.nodeId : null;
}

function objectiveForInput(
  exercise: LearnerExercise,
  objectiveId: string | undefined
): ExerciseObjective | undefined {
  return (
    exercise.objectives.find((objective) => objective.id === objectiveId) ??
    exercise.objectives.find((objective) => objective.required) ??
    exercise.objectives[0]
  );
}

function instructionByCurrentContext(
  exercise: LearnerExercise,
  input: GenerateLearnerHintInput
): RouteInstruction | undefined {
  const instructions = [...exercise.routeInstructions].sort((left, right) => left.sequence - right.sequence);

  if (input.currentInstructionId) {
    const current = instructions.find((instruction) => instruction.id === input.currentInstructionId);

    if (current && isRouteActionInstruction(current)) {
      return current;
    }

    if (current) {
      return instructions.find(
        (instruction) => instruction.sequence > current.sequence && isRouteActionInstruction(instruction)
      );
    }
  }

  if (input.currentNodeId) {
    const atNode = instructions.find(
      (instruction) => instruction.nodeId === input.currentNodeId && isRouteActionInstruction(instruction)
    );

    if (atNode) {
      return atNode;
    }
  }

  if (typeof input.currentCheckpointIndex === "number") {
    const checkpoints = checkpointsForExercise(exercise);
    const checkpoint = checkpoints[input.currentCheckpointIndex];
    const checkpointNodeId = checkpoint ? stopNodeId(checkpoint) : null;

    if (checkpointNodeId) {
      const checkpointInstruction = instructions.find((instruction) => instruction.nodeId === checkpointNodeId);
      const afterCheckpoint = checkpointInstruction
        ? instructions.find(
            (instruction) =>
              instruction.sequence > checkpointInstruction.sequence && isRouteActionInstruction(instruction)
          )
        : instructions.find(
            (instruction) => instruction.nodeId === checkpointNodeId && isRouteActionInstruction(instruction)
          );

      if (afterCheckpoint) {
        return afterCheckpoint;
      }
    }
  }

  return instructions.find(isRouteActionInstruction);
}

function routeSegmentForInstruction(
  exercise: LearnerExercise | ScorableLearnerExercise | GeneratedLearnerExercise,
  instruction: RouteInstruction
): LearnerRouteValidationSegment | undefined {
  const routeSegments = routeSegmentsForExercise(exercise);

  if (instruction.roadId) {
    return routeSegments.find((segment) => segment.roadId === instruction.roadId);
  }

  if (instruction.nodeId) {
    return routeSegments.find((segment) => segment.fromNodeId === instruction.nodeId);
  }

  return routeSegments[0];
}

function checkpointForInstruction(
  exercise: LearnerExercise | ScorableLearnerExercise | GeneratedLearnerExercise,
  instruction: RouteInstruction,
  currentCheckpointIndex: number | undefined
): RouteStop | undefined {
  const checkpoints = checkpointsForExercise(exercise);

  if (typeof currentCheckpointIndex === "number") {
    return checkpoints[currentCheckpointIndex + 1] ?? checkpoints[currentCheckpointIndex];
  }

  return checkpoints.find((checkpoint) => stopNodeId(checkpoint) === instruction.nodeId);
}

function selectHintTarget(input: GenerateLearnerHintInput): HintTarget | null {
  const objective = objectiveForInput(input.exercise, input.objectiveId);
  const instruction = instructionByCurrentContext(input.exercise, input);

  if (!objective || !instruction) {
    return null;
  }

  return {
    objective,
    instruction,
    routeSegment: routeSegmentForInstruction(input.exercise, instruction),
    checkpoint: checkpointForInstruction(input.exercise, instruction, input.currentCheckpointIndex)
  };
}

function hintRequestCount(input: GenerateLearnerHintInput): number {
  return (input.hintsAlreadyUsed?.length ?? 0) + (input.previousHintLevels?.length ?? 0);
}

function stageForDifficulty(difficulty: ExerciseDifficulty, requestCount: number): ProgressiveHintStage {
  const startSpecificity = difficulty === "beginner" ? 2 : 1;
  const specificity = Math.min(5, startSpecificity + requestCount);

  return PROGRESSIVE_HINT_STAGES[specificity - 1];
}

function directionLabel(instruction: RouteInstruction): string {
  if (instruction.kind === "turn-left") {
    return "left";
  }

  if (instruction.kind === "turn-right") {
    return "right";
  }

  if (instruction.kind === "straight-on") {
    return "straight ahead";
  }

  if (instruction.kind === "roundabout-exit") {
    return instruction.roundaboutExitNumber
      ? `towards exit ${instruction.roundaboutExitNumber}`
      : "through the roundabout";
  }

  if (instruction.kind === "junction-decision") {
    return "towards the legal outgoing road";
  }

  if (instruction.kind === "avoid-restriction") {
    return "away from the restricted movement";
  }

  return "along the next planned road";
}

function actionLabel(instruction: RouteInstruction): string {
  if (instruction.kind === "turn-left") {
    return "turn left";
  }

  if (instruction.kind === "turn-right") {
    return "turn right";
  }

  if (instruction.kind === "straight-on") {
    return "continue straight";
  }

  if (instruction.kind === "roundabout-exit") {
    return instruction.roundaboutExitNumber
      ? `take roundabout exit ${instruction.roundaboutExitNumber}`
      : "leave the roundabout on the planned exit";
  }

  if (instruction.kind === "junction-decision") {
    return "choose the legal outgoing road";
  }

  if (instruction.kind === "avoid-restriction") {
    return "avoid the restricted movement";
  }

  return "continue";
}

function roadOrJunctionLabel(instruction: RouteInstruction): string {
  if (instruction.roadName) {
    return instruction.roadName;
  }

  if (instruction.roadId) {
    return instruction.roadId;
  }

  if (instruction.nodeId) {
    return `junction ${instruction.nodeId}`;
  }

  return "the next planned road";
}

function checkpointLabel(checkpoint: RouteStop | undefined): string | null {
  if (!checkpoint) {
    return null;
  }

  return checkpoint.label ?? stopNodeId(checkpoint) ?? null;
}

function previousMistakePrompt(previousMistakes: readonly DrivingFault[] | undefined): string {
  const latest = previousMistakes?.[previousMistakes.length - 1];

  if (!latest) {
    return "";
  }

  if (latest.category === "unsafe-junction-decision") {
    return " Because your earlier mistake involved a junction decision, pause before committing to the next road.";
  }

  if (latest.category === "missed-checkpoint") {
    return " Because you previously missed a checkpoint, confirm the next checkpoint before choosing the road.";
  }

  if (latest.category === "route-efficiency") {
    return " Because your previous route added distance, prefer the shortest legal connection back to the planned route.";
  }

  if (
    latest.category === "no-entry" ||
    latest.category === "one-way-direction" ||
    latest.category === "prohibited-turn" ||
    latest.category === "restricted-road"
  ) {
    return " Because your earlier mistake was a legal-validity issue, check the available restriction information before acting.";
  }

  return "";
}

function objectivePrompt(objective: ExerciseObjective): string {
  if (objective.category === "route-legality" || objective.category === "restriction-awareness") {
    return "Focus on choosing a movement that remains legal in the available map data.";
  }

  if (objective.category === "checkpoint-ordering") {
    return "Focus on keeping the checkpoints in the planned order.";
  }

  if (objective.category === "junction-decision") {
    return "Focus on the next junction decision before you move.";
  }

  if (objective.category === "roundabout-control") {
    return "Focus on the roundabout approach and exit plan.";
  }

  if (objective.category === "route-efficiency") {
    return "Focus on staying close to the generated route without adding avoidable distance.";
  }

  return `Focus on the objective: ${objective.title}.`;
}

function shouldRevealConstraint(stage: ProgressiveHintStage): boolean {
  return stage === "specific-next-action" || stage === "reveal-answer";
}

function blockedRoadHint(instruction: RouteInstruction, stage: ProgressiveHintStage): string {
  const blockedRoadIds = instruction.decisionPoint?.blockedRoadIds ?? [];

  if (blockedRoadIds.length === 0 || !shouldRevealConstraint(stage)) {
    return "";
  }

  return ` Avoid blocked road id(s): ${blockedRoadIds.join(", ")}.`;
}

function revealText(input: {
  instruction: RouteInstruction;
  routeSegment?: LearnerRouteValidationSegment;
}): string {
  const segment = input.routeSegment;

  if (segment) {
    return `Reveal: ${input.instruction.text} Use route segment ${segment.id} on ${segment.roadId} from ${segment.fromNodeId} to ${segment.toNodeId}.`;
  }

  return `Reveal: ${input.instruction.text}`;
}

function hintTextForStage(input: {
  stage: ProgressiveHintStage;
  target: HintTarget;
  previousMistakes?: readonly DrivingFault[];
}): string {
  const { stage, target } = input;
  const checkpoint = checkpointLabel(target.checkpoint);
  const mistakePrompt = previousMistakePrompt(input.previousMistakes);
  const checkpointPrompt = checkpoint ? ` Keep ${checkpoint} in mind.` : "";
  const constraintPrompt = blockedRoadHint(target.instruction, stage);

  if (stage === "general-nudge") {
    return `${objectivePrompt(target.objective)} Look ahead to the next decision point before choosing a segment.${mistakePrompt}`;
  }

  if (stage === "directional-clue") {
    return `The next movement is ${directionLabel(target.instruction)}.${checkpointPrompt}${mistakePrompt}`;
  }

  if (stage === "road-junction-clue") {
    return `Look for ${roadOrJunctionLabel(target.instruction)} at this decision point.${checkpointPrompt}${mistakePrompt}`;
  }

  if (stage === "specific-next-action") {
    return `Next action: ${actionLabel(target.instruction)} onto ${roadOrJunctionLabel(target.instruction)}.${checkpointPrompt}${constraintPrompt}`;
  }

  return `${revealText({
    instruction: target.instruction,
    routeSegment: target.routeSegment
  })}${constraintPrompt}`;
}

function titleForStage(stage: ProgressiveHintStage): string {
  if (stage === "general-nudge") {
    return "Check the next decision";
  }

  if (stage === "directional-clue") {
    return "Direction clue";
  }

  if (stage === "road-junction-clue") {
    return "Road or junction clue";
  }

  if (stage === "specific-next-action") {
    return "Specific next action";
  }

  return "Reveal the next segment";
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function hintId(input: {
  exerciseId: string;
  stage: ProgressiveHintStage;
  instructionId: string;
  requestNumber: number;
}): string {
  return slug([
    "hint",
    input.exerciseId,
    input.stage,
    input.instructionId,
    String(input.requestNumber)
  ].join("-"));
}

function attemptEventForHint(input: {
  hint: LearnerProgressiveHint;
  attemptId?: string;
  occurredAt?: string;
}): AttemptEvent | undefined {
  if (!input.attemptId) {
    return undefined;
  }

  return {
    id: `${input.hint.id}-event`,
    attemptId: input.attemptId,
    type: "hint-requested",
    occurredAt: input.occurredAt ?? new Date(0).toISOString(),
    hintId: input.hint.id,
    hintLevel: input.hint.level
  };
}

function fallback(reason: LearnerHintFallback["reason"]): LearnerHintGenerationResult {
  return {
    status: "fallback",
    hint: null,
    fallback: {
      title: "Review the exercise plan",
      text: "There is not enough route context to generate a targeted hint yet. Reopen the exercise route, confirm your current checkpoint, and then request another hint.",
      reason
    },
    explanation: "No progressive hint was generated because the exercise did not include enough objective or route-instruction context."
  };
}

export function generateLearnerHint(input: GenerateLearnerHintInput): LearnerHintGenerationResult {
  const target = selectHintTarget(input);

  if (!target) {
    const reason = input.exercise.objectives.length === 0 ? "missing-objective-context" : "missing-route-context";

    return fallback(reason);
  }

  if (routeSegmentsForExercise(input.exercise).length === 0 && !target.instruction.roadId) {
    return fallback("missing-route-context");
  }

  const requestCount = hintRequestCount(input);
  const hintRequestNumber = requestCount + 1;
  const stage = stageForDifficulty(input.exercise.difficulty, requestCount);
  const specificity = stageSpecificity[stage];
  const hint: LearnerProgressiveHint = {
    id: hintId({
      exerciseId: input.exercise.id,
      stage,
      instructionId: target.instruction.id,
      requestNumber: hintRequestNumber
    }),
    exerciseId: input.exercise.id,
    level: hintLevelByStage[stage],
    title: titleForStage(stage),
    text: hintTextForStage({
      stage,
      target,
      previousMistakes: input.previousMistakes
    }),
    objectiveId: target.objective?.id,
    instructionId: target.instruction.id,
    routeLegId: target.instruction.legId,
    revealsAnswer: stage === "reveal-answer",
    stage,
    specificity,
    targetInstructionId: target.instruction.id,
    targetRouteSegmentId: target.routeSegment?.id,
    targetRoadId: target.instruction.roadId ?? target.routeSegment?.roadId,
    targetNodeId: target.instruction.nodeId ?? target.routeSegment?.fromNodeId,
    checkpointLabel: checkpointLabel(target.checkpoint) ?? undefined,
    generatedFrom: {
      objectiveId: target.objective?.id,
      currentNodeId: input.currentNodeId,
      currentCheckpointIndex: input.currentCheckpointIndex,
      previousMistakeCategories: [...new Set((input.previousMistakes ?? []).map((mistake) => mistake.category))].sort(),
      hintRequestNumber,
      difficulty: input.exercise.difficulty
    }
  };
  const attemptEvent = attemptEventForHint({
    hint,
    attemptId: input.attemptId,
    occurredAt: input.occurredAt
  });

  return {
    status: "generated",
    hint,
    fallback: null,
    attemptEvent,
    explanation: `Generated ${stage} hint ${hintRequestNumber} for ${input.exercise.difficulty} exercise ${input.exercise.id}.`
  };
}
