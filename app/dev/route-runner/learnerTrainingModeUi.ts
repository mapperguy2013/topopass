import type { MapDefinition, RouteStop, Vec2 } from "../../../lib/map-engine/index.ts";
import {
  EXERCISE_DIFFICULTIES,
  EXERCISE_TYPES,
  generateLearnerAttemptFeedback,
  generateLearnerExercise,
  generateLearnerHint,
  scoreLearnerAttempt,
  type ExerciseDifficulty,
  type ExerciseObjective,
  type ExerciseType,
  type GeneratedLearnerExercise,
  type Hint,
  type LearnerAttemptFeedbackResult,
  type LearnerAttemptScoringResult,
  type LearnerExerciseGenerationResult,
  type LearnerHintGenerationResult,
  type LearnerRouteValidationSegment,
  type RouteInstruction
} from "../../../lib/training/index.ts";

export const LEARNER_TRAINING_MODE_LABEL = "Training Mode";

export const LEARNER_TRAINING_PHASE6_CONTROL_LABELS = [
  "Practice map",
  "Pan",
  "Draw",
  "Zoom in",
  "Zoom out",
  "Reset view",
  "Submit"
] as const;

export const LEARNER_TRAINING_DIFFICULTY_LABELS: Record<ExerciseDifficulty, string> = {
  beginner: "Beginner",
  easy: "Easy",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

export const LEARNER_TRAINING_EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  "follow-planned-route": "Follow a planned route",
  "choose-legal-route": "Choose a legal route",
  "identify-next-safe-turn": "Identify the next safe turn",
  "practise-roundabouts": "Practise roundabouts",
  "practise-junction-decision-making": "Practise junction decisions",
  "route-review-mistake-correction": "Route review and correction"
};

export type LearnerTrainingModeGeneration = {
  status: LearnerExerciseGenerationResult["status"] | "idle";
  explanation: string | null;
  reasonCodes: string[];
};

export type LearnerTrainingModeReview = {
  scoring: LearnerAttemptScoringResult;
  feedback: LearnerAttemptFeedbackResult;
};

export type LearnerTrainingModeState = {
  isOpen: boolean;
  selectedDifficulty: ExerciseDifficulty;
  selectedExerciseType: ExerciseType;
  activeExercise: GeneratedLearnerExercise | null;
  generation: LearnerTrainingModeGeneration;
  hints: LearnerHintGenerationResult[];
  review: LearnerTrainingModeReview | null;
};

export type LearnerTrainingModeActionId =
  | "open-training-mode"
  | "generate-exercise"
  | "request-hint"
  | "complete-review";

export type LearnerTrainingModeAction = {
  id: LearnerTrainingModeActionId;
  label: string;
  ariaLabel: string;
  disabled: boolean;
};

export type LearnerTrainingOption<TValue extends string> = {
  value: TValue;
  label: string;
  selected: boolean;
};

export type LearnerTrainingCheckpointOverlay = {
  id: string;
  sequence: number;
  role: "start" | "checkpoint" | "finish";
  label: string;
  point: Vec2;
  nodeId?: string;
};

export type LearnerTrainingRouteOverlay = {
  visible: boolean;
  ariaLabel: string;
  route: {
    points: Vec2[];
    segmentIds: string[];
    roadIds: string[];
  };
  checkpoints: LearnerTrainingCheckpointOverlay[];
};

export type LearnerTrainingModePanelModel = {
  label: typeof LEARNER_TRAINING_MODE_LABEL;
  isOpen: boolean;
  difficultyOptions: Array<LearnerTrainingOption<ExerciseDifficulty>>;
  exerciseTypeOptions: Array<LearnerTrainingOption<ExerciseType>>;
  primaryActions: LearnerTrainingModeAction[];
  currentObjective: Pick<ExerciseObjective, "id" | "title" | "category" | "successCriteria"> | null;
  currentInstruction: Pick<RouteInstruction, "id" | "sequence" | "kind" | "text" | "roadName"> | null;
  routeSummary: {
    exerciseId: string;
    title: string;
    difficulty: ExerciseDifficulty;
    estimatedDifficulty: ExerciseDifficulty;
    estimatedMinutes: number | null;
    distanceMeters: number;
    segmentCount: number;
    checkpointCount: number;
  } | null;
  validation: {
    status: GeneratedLearnerExercise["validation"]["status"];
    explanation: string;
    blockingErrorCount: number;
    warningCount: number;
    ruleCodes: string[];
  } | null;
  hint: {
    title: string;
    text: string;
    level: Hint["level"] | "fallback";
    specificity: number | null;
    requestNumber: number;
    revealsAnswer: boolean;
  } | null;
  review: {
    status: LearnerAttemptScoringResult["status"];
    scorePercent: number;
    passed: boolean;
    summary: string;
  } | null;
  overlay: LearnerTrainingRouteOverlay;
  phase6Controls: string[];
  mobile: {
    primaryActionsSticky: boolean;
    minimumTouchTargetPx: number;
    controlsAvoidMapOverlay: true;
    hiddenPrimaryActionIds: LearnerTrainingModeActionId[];
  };
};

export function createLearnerTrainingModeState(input: Partial<LearnerTrainingModeState> = {}): LearnerTrainingModeState {
  return {
    isOpen: input.isOpen ?? false,
    selectedDifficulty: input.selectedDifficulty ?? "beginner",
    selectedExerciseType: input.selectedExerciseType ?? "follow-planned-route",
    activeExercise: input.activeExercise ?? null,
    generation: input.generation ?? {
      status: "idle",
      explanation: null,
      reasonCodes: []
    },
    hints: input.hints ? [...input.hints] : [],
    review: input.review ?? null
  };
}

export function openLearnerTrainingMode(state: LearnerTrainingModeState): LearnerTrainingModeState {
  return {
    ...state,
    isOpen: true
  };
}

export function selectLearnerTrainingDifficulty(
  state: LearnerTrainingModeState,
  selectedDifficulty: ExerciseDifficulty
): LearnerTrainingModeState {
  return {
    ...state,
    selectedDifficulty,
    activeExercise: null,
    generation: {
      status: "idle",
      explanation: null,
      reasonCodes: []
    },
    hints: [],
    review: null
  };
}

export function selectLearnerTrainingExerciseType(
  state: LearnerTrainingModeState,
  selectedExerciseType: ExerciseType
): LearnerTrainingModeState {
  return {
    ...state,
    selectedExerciseType,
    activeExercise: null,
    generation: {
      status: "idle",
      explanation: null,
      reasonCodes: []
    },
    hints: [],
    review: null
  };
}

export function startLearnerTrainingExercise(input: {
  state: LearnerTrainingModeState;
  map: MapDefinition;
  seed?: string | number;
  maxAttempts?: number;
}): LearnerTrainingModeState {
  const seed = input.seed ?? [
    "route-runner-training-ui",
    input.map.id,
    input.state.selectedDifficulty,
    input.state.selectedExerciseType
  ].join(":");
  const result = generateLearnerExercise({
    map: input.map,
    difficulty: input.state.selectedDifficulty,
    exerciseType: input.state.selectedExerciseType,
    seed,
    maxAttempts: input.maxAttempts
  });

  if (result.status === "failed") {
    return {
      ...input.state,
      isOpen: true,
      activeExercise: null,
      hints: [],
      review: null,
      generation: {
        status: result.status,
        explanation: result.explanation,
        reasonCodes: result.reasonCodes
      }
    };
  }

  return {
    ...input.state,
    isOpen: true,
    activeExercise: result.exercise,
    hints: [],
    review: null,
    generation: {
      status: result.status,
      explanation: result.explanation,
      reasonCodes: result.reasonCodes
    }
  };
}

export function requestLearnerTrainingHint(input: {
  state: LearnerTrainingModeState;
  objectiveId?: string;
  currentInstructionId?: string;
  currentCheckpointIndex?: number;
  attemptId?: string;
}): LearnerTrainingModeState {
  const exercise = input.state.activeExercise;

  if (!exercise) {
    return input.state;
  }

  const instruction = selectCurrentInstruction(exercise, input.currentInstructionId);
  const hintsAlreadyUsed = generatedHints(input.state.hints);
  const result = generateLearnerHint({
    exercise,
    objectiveId: input.objectiveId,
    currentInstructionId: instruction?.id,
    currentNodeId: instruction?.nodeId ?? exercise.expectedRouteSegments[0]?.fromNodeId,
    currentCheckpointIndex: input.currentCheckpointIndex,
    hintsAlreadyUsed,
    attemptId: input.attemptId
  });

  return {
    ...input.state,
    hints: [...input.state.hints, result],
    review: null
  };
}

export function reviewLearnerTrainingAttempt(input: {
  state: LearnerTrainingModeState;
  map: MapDefinition;
  attemptedRouteSegments?: readonly LearnerRouteValidationSegment[];
  attemptId?: string;
}): LearnerTrainingModeState {
  const exercise = input.state.activeExercise;

  if (!exercise) {
    return input.state;
  }

  const scoring = scoreLearnerAttempt({
    map: input.map,
    exercise,
    attemptedRouteSegments: input.attemptedRouteSegments ?? exercise.expectedRouteSegments,
    hintsUsed: generatedHints(input.state.hints),
    attemptId: input.attemptId ?? `${exercise.id}-ui-attempt`
  });
  const feedback = generateLearnerAttemptFeedback({
    map: input.map,
    exercise,
    scoring
  });

  return {
    ...input.state,
    review: {
      scoring,
      feedback
    }
  };
}

export function buildLearnerTrainingModePanelModel(input: {
  state: LearnerTrainingModeState;
  map: MapDefinition;
  viewport: "desktop" | "mobile";
}): LearnerTrainingModePanelModel {
  const exercise = input.state.activeExercise;
  const objective = exercise?.objectives.find((candidate) => candidate.required) ?? exercise?.objectives[0] ?? null;
  const instruction = exercise ? selectCurrentInstruction(exercise) : null;
  const latestHint = input.state.hints.at(-1) ?? null;
  const routeSummary = exercise
    ? {
        exerciseId: exercise.id,
        title: exercise.title,
        difficulty: exercise.difficulty,
        estimatedDifficulty: exercise.estimatedDifficulty,
        estimatedMinutes: exercise.estimatedMinutes ?? null,
        distanceMeters: exercise.validation.metrics.routeDistanceMeters,
        segmentCount: exercise.expectedRouteSegments.length,
        checkpointCount: exercise.checkpoints.length
      }
    : null;

  return {
    label: LEARNER_TRAINING_MODE_LABEL,
    isOpen: input.state.isOpen,
    difficultyOptions: EXERCISE_DIFFICULTIES.map((difficulty) => ({
      value: difficulty,
      label: LEARNER_TRAINING_DIFFICULTY_LABELS[difficulty],
      selected: difficulty === input.state.selectedDifficulty
    })),
    exerciseTypeOptions: EXERCISE_TYPES.map((type) => ({
      value: type,
      label: LEARNER_TRAINING_EXERCISE_TYPE_LABELS[type],
      selected: type === input.state.selectedExerciseType
    })),
    primaryActions: [
      {
        id: "open-training-mode",
        label: input.state.isOpen ? "Training mode open" : "Open Training Mode",
        ariaLabel: input.state.isOpen ? "Training Mode is open" : "Open Training Mode",
        disabled: input.state.isOpen
      },
      {
        id: "generate-exercise",
        label: exercise ? "Generate new exercise" : "Generate exercise",
        ariaLabel: "Generate learner training exercise",
        disabled: false
      },
      {
        id: "request-hint",
        label: "Hint",
        ariaLabel: "Request the next learner training hint",
        disabled: !exercise
      },
      {
        id: "complete-review",
        label: "Complete and review",
        ariaLabel: "Complete learner training attempt and review feedback",
        disabled: !exercise
      }
    ],
    currentObjective: objective
      ? {
          id: objective.id,
          title: objective.title,
          category: objective.category,
          successCriteria: objective.successCriteria
        }
      : null,
    currentInstruction: instruction
      ? {
          id: instruction.id,
          sequence: instruction.sequence,
          kind: instruction.kind,
          text: instruction.text,
          roadName: instruction.roadName
        }
      : null,
    routeSummary,
    validation: exercise
      ? {
          status: exercise.validation.status,
          explanation: exercise.validation.explanation,
          blockingErrorCount: exercise.validation.blockingErrors.length,
          warningCount: exercise.validation.advisoryWarnings.length,
          ruleCodes: exercise.validation.ruleCodes
        }
      : null,
    hint: latestHint ? hintModel(latestHint, input.state.hints.length) : null,
    review: input.state.review
      ? {
          status: input.state.review.scoring.status,
          scorePercent: input.state.review.scoring.scorePercent,
          passed: input.state.review.scoring.passed,
          summary: input.state.review.feedback.summary
        }
      : null,
    overlay: exercise ? overlayForExercise(exercise, input.map) : emptyTrainingOverlay(),
    phase6Controls: [...LEARNER_TRAINING_PHASE6_CONTROL_LABELS],
    mobile: {
      primaryActionsSticky: false,
      minimumTouchTargetPx: 44,
      controlsAvoidMapOverlay: true,
      hiddenPrimaryActionIds: []
    }
  };
}

function generatedHints(results: readonly LearnerHintGenerationResult[]): Hint[] {
  const hints: Hint[] = [];

  for (const result of results) {
    if (result.status === "generated") {
      hints.push(result.hint);
    }
  }

  return hints;
}

function selectCurrentInstruction(
  exercise: GeneratedLearnerExercise,
  instructionId?: string
): RouteInstruction | undefined {
  return (
    (instructionId ? exercise.routeInstructions.find((instruction) => instruction.id === instructionId) : undefined) ??
    exercise.routeInstructions.find((instruction) => instruction.kind !== "start" && instruction.kind !== "arrive") ??
    exercise.routeInstructions[0]
  );
}

function stopNodeId(stop: RouteStop): string | undefined {
  return stop.type === "node" ? stop.nodeId : undefined;
}

function pointForStop(stop: RouteStop, map: MapDefinition): Vec2 | null {
  if (stop.type === "node") {
    const node = map.nodes.find((candidate) => candidate.id === stop.nodeId);

    return node ? { x: node.x, y: node.y } : null;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  if (!landmark) {
    return null;
  }

  return { x: landmark.x, y: landmark.y };
}

function checkpointLabel(stop: RouteStop, map: MapDefinition, fallback: string): string {
  if (stop.label) {
    return stop.label;
  }

  if (stop.type === "node") {
    const node = map.nodes.find((candidate) => candidate.id === stop.nodeId);

    return node?.label ?? fallback;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  return landmark?.name ?? fallback;
}

function overlayForExercise(exercise: GeneratedLearnerExercise, map: MapDefinition): LearnerTrainingRouteOverlay {
  const checkpoints = exercise.checkpoints
    .map((stop, index): LearnerTrainingCheckpointOverlay | null => {
      const point = pointForStop(stop, map);

      if (!point) {
        return null;
      }

      const role = index === 0 ? "start" : index === exercise.checkpoints.length - 1 ? "finish" : "checkpoint";

      return {
        id: `${exercise.id}-checkpoint-${index}`,
        sequence: index,
        role,
        label: checkpointLabel(stop, map, role),
        point,
        nodeId: stopNodeId(stop)
      };
    })
    .filter((checkpoint): checkpoint is LearnerTrainingCheckpointOverlay => Boolean(checkpoint));

  return {
    visible: exercise.routeGeometry.length >= 2 || checkpoints.length > 0,
    ariaLabel: `${exercise.title} route and checkpoints`,
    route: {
      points: exercise.routeGeometry.map((point) => ({ x: point.x, y: point.y })),
      segmentIds: exercise.expectedRouteSegments.map((segment) => segment.id),
      roadIds: [...new Set(exercise.expectedRouteSegments.map((segment) => segment.roadId))]
    },
    checkpoints
  };
}

function emptyTrainingOverlay(): LearnerTrainingRouteOverlay {
  return {
    visible: false,
    ariaLabel: "No active learner training route",
    route: {
      points: [],
      segmentIds: [],
      roadIds: []
    },
    checkpoints: []
  };
}

function hintModel(result: LearnerHintGenerationResult, requestNumber: number): LearnerTrainingModePanelModel["hint"] {
  if (result.status === "fallback") {
    return {
      title: result.fallback.title,
      text: result.fallback.text,
      level: "fallback",
      specificity: null,
      requestNumber,
      revealsAnswer: false
    };
  }

  return {
    title: result.hint.title,
    text: result.hint.text,
    level: result.hint.level,
    specificity: result.hint.specificity,
    requestNumber,
    revealsAnswer: result.hint.revealsAnswer
  };
}
