import type { MapDefinition, RouteStop, Vec2 } from "../../../lib/map-engine/index.ts";
import {
  EXERCISE_DIFFICULTIES,
  EXERCISE_TYPES,
  EXPERIMENTAL_GENERATED_ROUTE_LABEL,
  NO_CURATED_ROUTE_AVAILABLE_MESSAGE,
  buildCuratedTrainingRouteCards,
  curatedTrainingRouteToGeneratedLearnerExercise,
  generateLearnerAttemptFeedback,
  generateLearnerExercise,
  generateLearnerHint,
  selectCuratedTrainingRoute,
  type CuratedTrainingRouteCardModel,
  type CuratedTrainingRouteExport,
  scoreLearnerAttempt,
  type DrivingFaultCategory,
  type DrivingFaultSeverity,
  type ExerciseDifficulty,
  type ExerciseObjective,
  type ExerciseType,
  type GeneratedLearnerExercise,
  type Hint,
  type LearnerAttemptFeedbackMessage,
  type LearnerAttemptFeedbackResult,
  type LearnerAttemptRouteSegmentAnnotation,
  type LearnerAttemptScoringResult,
  type LearnerAttemptSegmentFeedback,
  type LearnerExerciseGenerationResult,
  type LearnerHintGenerationResult,
  type LearnerTrainingAttemptProgressRecord,
  type LearnerTrainingProgressMistakeSummary,
  type LearnerTrainingProgressState,
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
  cacheStatus: "hit" | "miss" | "disabled";
  attemptLimit: number | null;
  routeSignature: string | null;
  recentRouteSignatures: string[];
  routeSource: "idle" | "curated-route-pack" | "experimental-generator";
  curatedRouteId: string | null;
  recentCuratedRouteIds: string[];
  generationRequestCount: number;
};

export type LearnerTrainingModeReview = {
  scoring: LearnerAttemptScoringResult;
  feedback: LearnerAttemptFeedbackResult;
  attemptedRouteSegments: LearnerRouteValidationSegment[];
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
  | "complete-review"
  | "retry-exercise"
  | "next-exercise"
  | "experimental-generate-exercise"
  | "reset-progress";

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
  reviewStatus?: "completed" | "missed";
};

export type LearnerTrainingRouteLineOverlay = {
  points: Vec2[];
  segmentIds: string[];
  roadIds: string[];
};

export type LearnerTrainingReviewMarkerKind =
  | "wrong-turn"
  | "illegal-segment"
  | "missed-checkpoint"
  | "hint-used"
  | "minor-fault"
  | "serious-fault"
  | "dangerous-fault";

export type LearnerTrainingReviewMarker = {
  id: string;
  kind: LearnerTrainingReviewMarkerKind;
  label: string;
  detail: string;
  point: Vec2;
  severity: DrivingFaultSeverity | "hint";
  faultIds: string[];
  feedbackMessageIds: string[];
  routeSegmentIds: string[];
  roadIds: string[];
  nodeIds: string[];
};

export type LearnerTrainingSegmentFeedbackOverlay = {
  id: string;
  routeSegmentId: string;
  roadId: string;
  point: Vec2;
  points: Vec2[];
  categoryLabels: string[];
  faultIds: string[];
  feedbackMessageIds: string[];
  severity: DrivingFaultSeverity | "positive";
  summary: string;
  improvementSuggestion?: string;
};

export type LearnerTrainingRouteOverlay = {
  visible: boolean;
  ariaLabel: string;
  route: LearnerTrainingRouteLineOverlay;
  attemptedRoute: LearnerTrainingRouteLineOverlay | null;
  checkpoints: LearnerTrainingCheckpointOverlay[];
  faultMarkers: LearnerTrainingReviewMarker[];
  hintMarkers: LearnerTrainingReviewMarker[];
  segmentFeedback: LearnerTrainingSegmentFeedbackOverlay[];
  readability: {
    preservesPhase6Labels: true;
    routeLineHalo: true;
    markerHalo: true;
    markerLabelMode: "token-with-text-panel";
  };
};

export type LearnerTrainingProgressPanelModel = {
  summary: {
    attemptCount: number;
    completedExerciseCount: number;
    averageScoreLabel: string;
    passRateLabel: string;
    recentTrendLabel: string;
  };
  recommendation: {
    kind: LearnerTrainingProgressState["summary"]["recommendation"]["kind"];
    difficulty: ExerciseDifficulty;
    difficultyLabel: string;
    exerciseType: ExerciseType;
    exerciseTypeLabel: string;
    reason: string;
    targetFaultLabel: string | null;
  };
  recentAttempts: Array<{
    id: string;
    title: string;
    difficultyLabel: string;
    scoreLabel: string;
    statusLabel: string;
    hintLabel: string;
    faultLabel: string;
  }>;
  commonMistakes: Array<{
    category: LearnerTrainingProgressMistakeSummary["category"];
    label: string;
    countLabel: string;
  }>;
  resetAction: LearnerTrainingModeAction;
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
    complexityScore: number;
    routeSignature: string;
  } | null;
  generationOptions: Array<{
    id: string;
    selected: boolean;
    routeSignature: string;
    distanceLabel: string;
    turnCount: number;
    decisionPointCount: number;
    complexityScore: number;
    skillTags: string[];
  }>;
  curatedRouteCards: CuratedTrainingRouteCardModel[];
  curatedRouteAvailability: {
    status: "not-configured" | "available" | "unavailable";
    message: string | null;
    experimentalFallbackLabel: typeof EXPERIMENTAL_GENERATED_ROUTE_LABEL;
  };
  experimentalFallbackAction: LearnerTrainingModeAction | null;
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
    plannedDistanceMeters: number;
    attemptedDistanceMeters: number;
    extraDistanceMeters: number;
    routeAdherencePercent: number;
    efficiencyPercent: number;
    completedCheckpointCount: number;
    totalCheckpointCount: number;
    minorFaultCount: number;
    seriousFaultCount: number;
    dangerousFaultCount: number;
    messages: Array<
      Pick<
        LearnerAttemptFeedbackMessage,
        | "id"
        | "categoryLabel"
        | "severity"
        | "location"
        | "whatHappened"
        | "whyItMatters"
        | "improvementSuggestion"
      >
    >;
    segmentFeedback: Array<
      LearnerAttemptSegmentFeedback & {
        severity: DrivingFaultSeverity | "positive";
        point: Vec2 | null;
      }
    >;
  } | null;
  reviewActions: LearnerTrainingModeAction[];
  progress: LearnerTrainingProgressPanelModel | null;
  overlay: LearnerTrainingRouteOverlay;
  phase6Controls: string[];
  accessibility: {
    panelRole: "region";
    panelAriaLabel: string;
    headingId: string;
    liveRegion: {
      id: string;
      politeness: "polite" | "assertive";
      atomic: true;
      message: string;
    };
    focusTargetId:
      | LearnerTrainingModeActionId
      | "learner-training-difficulty"
      | "learner-training-exercise-type"
      | "learner-training-current-objective"
      | "learner-training-feedback";
    keyboardNavigationOrder: Array<
      | LearnerTrainingModeActionId
      | "learner-training-difficulty"
      | "learner-training-exercise-type"
      | "learner-training-current-objective"
      | "learner-training-feedback"
    >;
  };
  performance: {
    generationCacheStatus: LearnerTrainingModeGeneration["cacheStatus"];
    generationAttemptLimit: number | null;
    overlayRenderKey: string;
    overlayPointCount: number;
    shouldRenderTrainingOverlay: boolean;
    mapRerenderScope: "training-overlay-only";
  };
  mobile: {
    primaryActionsSticky: boolean;
    minimumTouchTargetPx: number;
    panelPlacement: "below-map";
    maxPanelHeightVh: number;
    reservedStatusMinHeightPx: number;
    controlsAvoidMapOverlay: true;
    layoutShiftGuard: true;
    hiddenPrimaryActionIds: LearnerTrainingModeActionId[];
  };
};

export type LearnerTrainingExerciseGenerationCache = {
  get(key: string): LearnerExerciseGenerationResult | undefined;
  set(key: string, result: LearnerExerciseGenerationResult): void;
  clear(): void;
  size(): number;
};

export function createLearnerTrainingExerciseGenerationCache(
  maxEntries = 12
): LearnerTrainingExerciseGenerationCache {
  const entries = new Map<string, LearnerExerciseGenerationResult>();
  const capacity = Math.max(1, Math.floor(maxEntries));

  return {
    get(key) {
      const result = entries.get(key);

      if (result) {
        entries.delete(key);
        entries.set(key, result);
      }

      return result;
    },
    set(key, result) {
      if (entries.has(key)) {
        entries.delete(key);
      }

      entries.set(key, result);

      while (entries.size > capacity) {
        const firstKey = entries.keys().next().value;

        if (typeof firstKey !== "string") {
          break;
        }

        entries.delete(firstKey);
      }
    },
    clear() {
      entries.clear();
    },
    size() {
      return entries.size;
    }
  };
}

const defaultLearnerTrainingGenerationCache = createLearnerTrainingExerciseGenerationCache();

function idleGenerationState(): LearnerTrainingModeGeneration {
  return {
    status: "idle",
    explanation: null,
    reasonCodes: [],
    cacheStatus: "disabled",
    attemptLimit: null,
    routeSignature: null,
    recentRouteSignatures: [],
    routeSource: "idle",
    curatedRouteId: null,
    recentCuratedRouteIds: [],
    generationRequestCount: 0
  };
}

export function createLearnerTrainingModeState(input: Partial<LearnerTrainingModeState> = {}): LearnerTrainingModeState {
  return {
    isOpen: input.isOpen ?? false,
    selectedDifficulty: input.selectedDifficulty ?? "beginner",
    selectedExerciseType: input.selectedExerciseType ?? "follow-planned-route",
    activeExercise: input.activeExercise ?? null,
    generation: input.generation ?? idleGenerationState(),
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
    generation: idleGenerationState(),
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
    generation: idleGenerationState(),
    hints: [],
    review: null
  };
}

function learnerTrainingGenerationCacheKey(input: {
  state: LearnerTrainingModeState;
  map: MapDefinition;
  seed: string | number;
  maxAttempts?: number;
}): string {
  return [
    input.map.id,
    input.map.nodes.length,
    input.map.roads.length,
    input.map.restrictions.length,
    input.state.selectedDifficulty,
    input.state.selectedExerciseType,
    String(input.seed),
    input.maxAttempts ?? "default",
    input.state.generation.recentRouteSignatures.join(",")
  ].join("|");
}

function generationStateFromResult(input: {
  result: LearnerExerciseGenerationResult;
  cacheStatus: LearnerTrainingModeGeneration["cacheStatus"];
  attemptLimit: number | null;
  previousGeneration: LearnerTrainingModeGeneration;
}): LearnerTrainingModeGeneration {
  const routeSignature = input.result.exercise?.generationMetadata.routeSignature ?? null;
  const recentRouteSignatures = routeSignature
    ? [routeSignature, ...input.previousGeneration.recentRouteSignatures.filter((signature) => signature !== routeSignature)].slice(0, 6)
    : input.previousGeneration.recentRouteSignatures;

  return {
    status: input.result.status,
    explanation: input.result.explanation,
    reasonCodes: input.result.reasonCodes,
    cacheStatus: input.cacheStatus,
    attemptLimit: input.attemptLimit,
    routeSignature,
    recentRouteSignatures,
    routeSource: "experimental-generator",
    curatedRouteId: null,
    recentCuratedRouteIds: input.previousGeneration.recentCuratedRouteIds,
    generationRequestCount: input.previousGeneration.generationRequestCount + 1
  };
}

function generationStateFromCuratedRoute(input: {
  exercise: GeneratedLearnerExercise;
  route: CuratedTrainingRouteExport;
  previousGeneration: LearnerTrainingModeGeneration;
  availableRouteCount: number;
  repeatedRecentRoute: boolean;
}): LearnerTrainingModeGeneration {
  const routeSignature = input.exercise.generationMetadata.routeSignature;
  const recentRouteSignatures = [
    routeSignature,
    ...input.previousGeneration.recentRouteSignatures.filter((signature) => signature !== routeSignature)
  ].slice(0, 6);
  const recentCuratedRouteIds = [
    input.route.routeId,
    ...input.previousGeneration.recentCuratedRouteIds.filter((routeId) => routeId !== input.route.routeId)
  ].slice(0, 6);

  return {
    status: "generated",
    explanation:
      input.availableRouteCount > 1
        ? "Curated learner route selected from the beta route pack."
        : input.repeatedRecentRoute
          ? "Only one curated route matches this selection, so it may repeat."
          : "Curated learner route selected from the beta route pack.",
    reasonCodes: ["curated-route-selected"],
    cacheStatus: "disabled",
    attemptLimit: input.availableRouteCount,
    routeSignature,
    recentRouteSignatures,
    routeSource: "curated-route-pack",
    curatedRouteId: input.route.routeId,
    recentCuratedRouteIds,
    generationRequestCount: input.previousGeneration.generationRequestCount + 1
  };
}

function generationStateFromNoCuratedRoute(input: {
  previousGeneration: LearnerTrainingModeGeneration;
  message: string;
}): LearnerTrainingModeGeneration {
  return {
    status: "failed",
    explanation: input.message,
    reasonCodes: ["no-curated-route-available"],
    cacheStatus: "disabled",
    attemptLimit: 0,
    routeSignature: null,
    recentRouteSignatures: input.previousGeneration.recentRouteSignatures,
    routeSource: "curated-route-pack",
    curatedRouteId: null,
    recentCuratedRouteIds: input.previousGeneration.recentCuratedRouteIds,
    generationRequestCount: input.previousGeneration.generationRequestCount + 1
  };
}

function formatTrainingDistance(distanceMeters: number): string {
  return distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${Math.round(distanceMeters)} m`;
}

export function startLearnerTrainingExercise(input: {
  state: LearnerTrainingModeState;
  map: MapDefinition;
  seed?: string | number;
  maxAttempts?: number;
  generationCache?: LearnerTrainingExerciseGenerationCache | null;
  curatedRoutes?: readonly CuratedTrainingRouteExport[];
  allowExperimentalGenerationFallback?: boolean;
  preferExperimentalGeneration?: boolean;
}): LearnerTrainingModeState {
  const seed = input.seed ?? [
    "route-runner-training-ui",
    input.map.id,
    input.state.selectedDifficulty,
    input.state.selectedExerciseType,
    input.state.generation.generationRequestCount + 1
  ].join(":");

  if (input.curatedRoutes && !input.preferExperimentalGeneration) {
    const selection = selectCuratedTrainingRoute({
      routes: input.curatedRoutes,
      mapId: input.map.id,
      difficulty: input.state.selectedDifficulty,
      exerciseType: input.state.selectedExerciseType,
      recentRouteIds: input.state.generation.recentCuratedRouteIds,
      seed: `${seed}:${input.state.generation.generationRequestCount + 1}`
    });

    if (selection.route) {
      const exercise = curatedTrainingRouteToGeneratedLearnerExercise(selection.route);

      return {
        ...input.state,
        isOpen: true,
        activeExercise: exercise,
        hints: [],
        review: null,
        generation: generationStateFromCuratedRoute({
          exercise,
          route: selection.route,
          previousGeneration: input.state.generation,
          availableRouteCount: selection.availableRoutes.length,
          repeatedRecentRoute: selection.repeatedRecentRoute
        })
      };
    }

    if (input.allowExperimentalGenerationFallback !== true) {
      return {
        ...input.state,
        isOpen: true,
        activeExercise: null,
        hints: [],
        review: null,
        generation: generationStateFromNoCuratedRoute({
          previousGeneration: input.state.generation,
          message: selection.message ?? NO_CURATED_ROUTE_AVAILABLE_MESSAGE
        })
      };
    }
  }

  const cache = input.generationCache === undefined ? defaultLearnerTrainingGenerationCache : input.generationCache;
  const cacheKey = learnerTrainingGenerationCacheKey({
    state: input.state,
    map: input.map,
    seed,
    maxAttempts: input.maxAttempts
  });
  const cachedResult = cache?.get(cacheKey);
  const result =
    cachedResult ??
    generateLearnerExercise({
      map: input.map,
      difficulty: input.state.selectedDifficulty,
      exerciseType: input.state.selectedExerciseType,
      seed,
      maxAttempts: input.maxAttempts,
      avoidRouteSignatures: input.state.generation.recentRouteSignatures,
      candidateOptionCount: 3
    });
  const cacheStatus: LearnerTrainingModeGeneration["cacheStatus"] = cache
    ? cachedResult
      ? "hit"
      : "miss"
    : "disabled";

  if (cache && !cachedResult) {
    cache.set(cacheKey, result);
  }

  const generation = generationStateFromResult({
    result,
    cacheStatus,
    attemptLimit: input.maxAttempts ?? result.attempts.length,
    previousGeneration: input.state.generation
  });

  if (result.status === "failed") {
    return {
      ...input.state,
      isOpen: true,
      activeExercise: null,
      hints: [],
      review: null,
      generation
    };
  }

  return {
    ...input.state,
    isOpen: true,
    activeExercise: result.exercise,
    hints: [],
    review: null,
    generation
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

export function retryLearnerTrainingExercise(state: LearnerTrainingModeState): LearnerTrainingModeState {
  return {
    ...state,
    hints: [],
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
      feedback,
      attemptedRouteSegments: [...(input.attemptedRouteSegments ?? exercise.expectedRouteSegments)]
    }
  };
}

export function buildLearnerTrainingModePanelModel(input: {
  state: LearnerTrainingModeState;
  map: MapDefinition;
  viewport: "desktop" | "mobile";
  progress?: LearnerTrainingProgressState | null;
  curatedRoutes?: readonly CuratedTrainingRouteExport[];
}): LearnerTrainingModePanelModel {
  const exercise = input.state.activeExercise;
  const objective = exercise?.objectives.find((candidate) => candidate.required) ?? exercise?.objectives[0] ?? null;
  const instruction = exercise ? selectCurrentInstruction(exercise) : null;
  const latestHint = input.state.hints.at(-1) ?? null;
  const generatedHintModels = generatedHints(input.state.hints);
  const review = input.state.review ? reviewModel(input.state.review, input.map) : null;
  const overlay = exercise
    ? overlayForExercise({
        exercise,
        map: input.map,
        review: input.state.review,
        hints: generatedHintModels
      })
    : emptyTrainingOverlay();
  const routeSummary = exercise
    ? {
        exerciseId: exercise.id,
        title: exercise.title,
        difficulty: exercise.difficulty,
        estimatedDifficulty: exercise.estimatedDifficulty,
        estimatedMinutes: exercise.estimatedMinutes ?? null,
        distanceMeters: exercise.validation.metrics.routeDistanceMeters,
        segmentCount: exercise.expectedRouteSegments.length,
        checkpointCount: exercise.checkpoints.length,
        complexityScore: exercise.generationMetadata.complexity.score,
        routeSignature: exercise.generationMetadata.routeSignature
      }
    : null;
  const curatedRouteCards = input.curatedRoutes
    ? buildCuratedTrainingRouteCards({
        routes: input.curatedRoutes,
        mapId: input.map.id,
        difficulty: input.state.selectedDifficulty,
        exerciseType: input.state.selectedExerciseType,
        activeRouteId: input.state.generation.curatedRouteId
      })
    : [];
  const curatedRouteAvailability: LearnerTrainingModePanelModel["curatedRouteAvailability"] = input.curatedRoutes
    ? curatedRouteCards.length > 0
      ? {
          status: "available",
          message: null,
          experimentalFallbackLabel: EXPERIMENTAL_GENERATED_ROUTE_LABEL
        }
      : {
          status: "unavailable",
          message: NO_CURATED_ROUTE_AVAILABLE_MESSAGE,
          experimentalFallbackLabel: EXPERIMENTAL_GENERATED_ROUTE_LABEL
        }
    : {
        status: "not-configured",
        message: null,
        experimentalFallbackLabel: EXPERIMENTAL_GENERATED_ROUTE_LABEL
      };
  const experimentalFallbackAction: LearnerTrainingModeAction | null =
    input.curatedRoutes && curatedRouteCards.length === 0
      ? {
          id: "experimental-generate-exercise",
          label: EXPERIMENTAL_GENERATED_ROUTE_LABEL,
          ariaLabel: "Try an experimental generated learner route instead of a curated route",
          disabled: false
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
        label: exercise ? "Try another route" : "Generate exercise",
        ariaLabel: exercise ? "Generate another learner training route" : "Generate learner training exercise",
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
    generationOptions: exercise
      ? exercise.generationMetadata.candidateOptions.map((option) => ({
          id: option.id,
          selected: option.selected,
          routeSignature: option.routeSignature,
          distanceLabel: formatTrainingDistance(option.distanceMeters),
          turnCount: option.turnCount,
          decisionPointCount: option.decisionPointCount,
          complexityScore: option.complexityScore,
          skillTags: [...option.skillTags]
        }))
      : [],
    curatedRouteCards,
    curatedRouteAvailability,
    experimentalFallbackAction,
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
    review,
    reviewActions: [
      {
        id: "retry-exercise",
        label: "Retry exercise",
        ariaLabel: "Retry the current learner training exercise",
        disabled: !exercise
      },
      {
        id: "next-exercise",
        label: "Next exercise",
        ariaLabel: "Generate the next learner training exercise",
        disabled: false
      }
    ],
    progress: input.progress ? progressPanelModel(input.progress) : null,
    overlay,
    phase6Controls: [...LEARNER_TRAINING_PHASE6_CONTROL_LABELS],
    accessibility: accessibilityModel({
      state: input.state,
      exercise,
      review,
      latestHint: latestHint ? hintModel(latestHint, input.state.hints.length) : null
    }),
    performance: {
      generationCacheStatus: input.state.generation.cacheStatus,
      generationAttemptLimit: input.state.generation.attemptLimit,
      overlayRenderKey: overlayRenderKey({
        state: input.state,
        overlay,
        hintCount: generatedHintModels.length
      }),
      overlayPointCount: overlayPointCount(overlay),
      shouldRenderTrainingOverlay: overlay.visible,
      mapRerenderScope: "training-overlay-only"
    },
    mobile: {
      primaryActionsSticky: false,
      minimumTouchTargetPx: 44,
      panelPlacement: "below-map",
      maxPanelHeightVh: 72,
      reservedStatusMinHeightPx: 48,
      controlsAvoidMapOverlay: true,
      layoutShiftGuard: true,
      hiddenPrimaryActionIds: []
    }
  };
}

function liveRegionMessage(input: {
  state: LearnerTrainingModeState;
  exercise: GeneratedLearnerExercise | null;
  review: NonNullable<LearnerTrainingModePanelModel["review"]> | null;
  latestHint: LearnerTrainingModePanelModel["hint"];
}): string {
  if (!input.state.isOpen) {
    return "Training Mode is closed.";
  }

  if (input.state.generation.status === "failed") {
    return input.state.generation.explanation ?? "Exercise generation failed. Choose another setting and try again.";
  }

  if (input.review) {
    return `Learner attempt review ready. ${input.review.summary}`;
  }

  if (input.latestHint) {
    return `Hint ${input.latestHint.requestNumber}: ${input.latestHint.text}`;
  }

  if (input.exercise) {
    return `Exercise ready: ${input.exercise.title}.`;
  }

  return "Choose a difficulty and exercise type, then generate an exercise.";
}

function focusTargetId(input: {
  state: LearnerTrainingModeState;
  exercise: GeneratedLearnerExercise | null;
  review: NonNullable<LearnerTrainingModePanelModel["review"]> | null;
  latestHint: LearnerTrainingModePanelModel["hint"];
}): LearnerTrainingModePanelModel["accessibility"]["focusTargetId"] {
  if (!input.state.isOpen) {
    return "open-training-mode";
  }

  if (input.state.generation.status === "failed") {
    return "generate-exercise";
  }

  if (input.review) {
    return "learner-training-feedback";
  }

  if (input.latestHint) {
    return "request-hint";
  }

  if (input.exercise) {
    return "learner-training-current-objective";
  }

  return "generate-exercise";
}

function accessibilityModel(input: {
  state: LearnerTrainingModeState;
  exercise: GeneratedLearnerExercise | null;
  review: NonNullable<LearnerTrainingModePanelModel["review"]> | null;
  latestHint: LearnerTrainingModePanelModel["hint"];
}): LearnerTrainingModePanelModel["accessibility"] {
  const politeness = input.state.generation.status === "failed" ? "assertive" : "polite";

  return {
    panelRole: "region",
    panelAriaLabel: "Learner driver training mode",
    headingId: "learner-training-heading",
    liveRegion: {
      id: "learner-training-status",
      politeness,
      atomic: true,
      message: liveRegionMessage(input)
    },
    focusTargetId: focusTargetId(input),
    keyboardNavigationOrder: [
      "open-training-mode",
      "learner-training-difficulty",
      "learner-training-exercise-type",
      "generate-exercise",
      "request-hint",
      "complete-review",
      "learner-training-feedback",
      "retry-exercise",
      "next-exercise"
    ]
  };
}

function overlayPointCount(overlay: LearnerTrainingRouteOverlay): number {
  return (
    overlay.route.points.length +
    (overlay.attemptedRoute?.points.length ?? 0) +
    overlay.checkpoints.length +
    overlay.faultMarkers.length +
    overlay.hintMarkers.length +
    overlay.segmentFeedback.reduce((total, item) => total + item.points.length, 0)
  );
}

function overlayRenderKey(input: {
  state: LearnerTrainingModeState;
  overlay: LearnerTrainingRouteOverlay;
  hintCount: number;
}): string {
  return [
    input.state.activeExercise?.id ?? "none",
    input.state.review?.scoring.attemptId ?? "no-review",
    input.hintCount,
    input.overlay.route.segmentIds.length,
    input.overlay.attemptedRoute?.segmentIds.length ?? 0,
    input.overlay.faultMarkers.length,
    input.overlay.segmentFeedback.length
  ].join(":");
}

function percentLabel(value: number | null): string {
  return typeof value === "number" ? `${value.toFixed(1)}%` : "n/a";
}

function trendLabel(trend: LearnerTrainingProgressState["summary"]["recentTrend"]): string {
  if (trend === "improving") {
    return "Improving";
  }

  if (trend === "declining") {
    return "Declining";
  }

  if (trend === "stable") {
    return "Stable";
  }

  return "Building history";
}

function attemptStatusLabel(attempt: LearnerTrainingAttemptProgressRecord): string {
  if (attempt.status === "blocked") {
    return "Blocked";
  }

  if (attempt.status === "incomplete") {
    return "Incomplete";
  }

  return attempt.passed ? "Pass" : "Needs review";
}

function attemptHintLabel(attempt: LearnerTrainingAttemptProgressRecord): string {
  if (attempt.hintCount === 0) {
    return "No hints";
  }

  return `${attempt.hintCount} hint${attempt.hintCount === 1 ? "" : "s"}`;
}

function attemptFaultLabel(attempt: LearnerTrainingAttemptProgressRecord): string {
  const seriousCount = attempt.seriousFaultCount + attempt.dangerousFaultCount;

  if (attempt.faults.length === 0) {
    return "No faults";
  }

  if (seriousCount > 0) {
    return `${seriousCount} serious/blocking`;
  }

  return `${attempt.faults.length} minor/advisory`;
}

function progressPanelModel(progress: LearnerTrainingProgressState): LearnerTrainingProgressPanelModel {
  const recommendation = progress.summary.recommendation;
  const targetFault = recommendation.targetFaultCategory
    ? progress.summary.commonMistakes.find((mistake) => mistake.category === recommendation.targetFaultCategory)
    : null;

  return {
    summary: {
      attemptCount: progress.summary.attemptCount,
      completedExerciseCount: progress.summary.completedExerciseCount,
      averageScoreLabel: percentLabel(progress.summary.averageScorePercent),
      passRateLabel: percentLabel(progress.summary.passRatePercent),
      recentTrendLabel: trendLabel(progress.summary.recentTrend)
    },
    recommendation: {
      kind: recommendation.kind,
      difficulty: recommendation.recommendedDifficulty,
      difficultyLabel: LEARNER_TRAINING_DIFFICULTY_LABELS[recommendation.recommendedDifficulty],
      exerciseType: recommendation.recommendedExerciseType,
      exerciseTypeLabel: LEARNER_TRAINING_EXERCISE_TYPE_LABELS[recommendation.recommendedExerciseType],
      reason: recommendation.reason,
      targetFaultLabel: targetFault?.label ?? null
    },
    recentAttempts: progress.summary.recentAttempts.slice(0, 3).map((attempt) => ({
      id: attempt.id,
      title: attempt.exerciseTitle,
      difficultyLabel: LEARNER_TRAINING_DIFFICULTY_LABELS[attempt.difficulty],
      scoreLabel: `${attempt.scorePercent.toFixed(1)}%`,
      statusLabel: attemptStatusLabel(attempt),
      hintLabel: attemptHintLabel(attempt),
      faultLabel: attemptFaultLabel(attempt)
    })),
    commonMistakes: progress.summary.commonMistakes.slice(0, 3).map((mistake) => ({
      category: mistake.category,
      label: mistake.label,
      countLabel: `${mistake.count} fault${mistake.count === 1 ? "" : "s"} across ${mistake.attemptCount} attempt${
        mistake.attemptCount === 1 ? "" : "s"
      }`
    })),
    resetAction: {
      id: "reset-progress",
      label: "Reset progress",
      ariaLabel: "Reset learner training progress saved on this device",
      disabled: progress.summary.attemptCount === 0
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

function nodeById(map: MapDefinition, nodeId: string | undefined): Vec2 | null {
  if (!nodeId) {
    return null;
  }

  const node = map.nodes.find((candidate) => candidate.id === nodeId);

  return node ? { x: node.x, y: node.y } : null;
}

function roadMidpoint(map: MapDefinition, roadId: string | undefined): Vec2 | null {
  if (!roadId) {
    return null;
  }

  const road = map.roads.find((candidate) => candidate.id === roadId);
  const from = nodeById(map, road?.fromNodeId);
  const to = nodeById(map, road?.toNodeId);

  if (!from || !to) {
    return null;
  }

  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2
  };
}

function segmentPoints(segment: LearnerRouteValidationSegment, map: MapDefinition): Vec2[] {
  const from = nodeById(map, segment.fromNodeId);
  const to = nodeById(map, segment.toNodeId);

  return from && to ? [from, to] : [];
}

function segmentMidpoint(segment: LearnerRouteValidationSegment, map: MapDefinition): Vec2 | null {
  const points = segmentPoints(segment, map);

  if (points.length < 2) {
    return roadMidpoint(map, segment.roadId);
  }

  return {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2
  };
}

function routeLineForSegments(
  segments: readonly LearnerRouteValidationSegment[],
  map: MapDefinition
): LearnerTrainingRouteLineOverlay {
  const points: Vec2[] = [];

  for (const segment of segments) {
    const [from, to] = segmentPoints(segment, map);

    if (!from || !to) {
      continue;
    }

    const previous = points.at(-1);

    if (!previous || previous.x !== from.x || previous.y !== from.y) {
      points.push(from);
    }

    points.push(to);
  }

  return {
    points,
    segmentIds: segments.map((segment) => segment.id),
    roadIds: [...new Set(segments.map((segment) => segment.roadId))]
  };
}

function routeNodeSequence(routeSegments: readonly LearnerRouteValidationSegment[]): string[] {
  if (routeSegments.length === 0) {
    return [];
  }

  return [routeSegments[0].fromNodeId, ...routeSegments.map((segment) => segment.toNodeId)];
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

function checkpointReviewStatus(input: {
  checkpoint: LearnerTrainingCheckpointOverlay;
  attemptedRouteSegments: readonly LearnerRouteValidationSegment[];
  review: LearnerTrainingModeReview | null;
}): LearnerTrainingCheckpointOverlay["reviewStatus"] {
  if (!input.review || input.checkpoint.role !== "checkpoint" || !input.checkpoint.nodeId) {
    return undefined;
  }

  const missedNodeIds = new Set(
    input.review.scoring.faults
      .filter((fault) => fault.category === "missed-checkpoint" || fault.category === "wrong-checkpoint-order")
      .flatMap((fault) => fault.relatedNodeIds ?? [])
  );

  if (missedNodeIds.has(input.checkpoint.nodeId)) {
    return "missed";
  }

  return routeNodeSequence(input.attemptedRouteSegments).includes(input.checkpoint.nodeId) ? "completed" : "missed";
}

function overlayForExercise(input: {
  exercise: GeneratedLearnerExercise;
  map: MapDefinition;
  review: LearnerTrainingModeReview | null;
  hints: readonly Hint[];
}): LearnerTrainingRouteOverlay {
  const attemptedRouteSegments = input.review?.attemptedRouteSegments ?? [];
  const checkpoints = input.exercise.checkpoints
    .map((stop, index): LearnerTrainingCheckpointOverlay | null => {
      const point = pointForStop(stop, input.map);

      if (!point) {
        return null;
      }

      const role = index === 0 ? "start" : index === input.exercise.checkpoints.length - 1 ? "finish" : "checkpoint";
      const checkpoint: LearnerTrainingCheckpointOverlay = {
        id: `${input.exercise.id}-checkpoint-${index}`,
        sequence: index,
        role,
        label: checkpointLabel(stop, input.map, role),
        point,
        nodeId: stopNodeId(stop)
      };
      const reviewStatus = checkpointReviewStatus({
        checkpoint,
        attemptedRouteSegments,
        review: input.review
      });

      return {
        ...checkpoint,
        ...(reviewStatus ? { reviewStatus } : {})
      };
    })
    .filter((checkpoint): checkpoint is LearnerTrainingCheckpointOverlay => Boolean(checkpoint));
  const reviewOverlay = input.review
    ? reviewOverlayForAttempt({
        exercise: input.exercise,
        map: input.map,
        review: input.review,
        hints: input.hints,
        checkpoints
      })
    : {
        attemptedRoute: null,
        faultMarkers: [],
        hintMarkers: [],
        segmentFeedback: []
      };

  return {
    visible: input.exercise.routeGeometry.length >= 2 || checkpoints.length > 0,
    ariaLabel: input.review
      ? `${input.exercise.title} planned route, learner route, checkpoints, and review faults`
      : `${input.exercise.title} route and checkpoints`,
    route: {
      points: input.exercise.routeGeometry.map((point) => ({ x: point.x, y: point.y })),
      segmentIds: input.exercise.expectedRouteSegments.map((segment) => segment.id),
      roadIds: [...new Set(input.exercise.expectedRouteSegments.map((segment) => segment.roadId))]
    },
    attemptedRoute: reviewOverlay.attemptedRoute,
    checkpoints,
    faultMarkers: reviewOverlay.faultMarkers,
    hintMarkers: reviewOverlay.hintMarkers,
    segmentFeedback: reviewOverlay.segmentFeedback,
    readability: overlayReadability()
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
    attemptedRoute: null,
    checkpoints: [],
    faultMarkers: [],
    hintMarkers: [],
    segmentFeedback: [],
    readability: overlayReadability()
  };
}

function overlayReadability(): LearnerTrainingRouteOverlay["readability"] {
  return {
    preservesPhase6Labels: true,
    routeLineHalo: true,
    markerHalo: true,
    markerLabelMode: "token-with-text-panel"
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

function reviewModel(
  review: LearnerTrainingModeReview,
  map: MapDefinition
): NonNullable<LearnerTrainingModePanelModel["review"]> {
  return {
    status: review.scoring.status,
    scorePercent: review.scoring.scorePercent,
    passed: review.scoring.passed,
    summary: review.feedback.summary,
    plannedDistanceMeters: review.scoring.metrics.expectedDistanceMeters,
    attemptedDistanceMeters: review.scoring.metrics.attemptedDistanceMeters,
    extraDistanceMeters: review.scoring.metrics.extraDistanceMeters,
    routeAdherencePercent: review.scoring.metrics.routeAdherencePercent,
    efficiencyPercent: review.scoring.metrics.efficiencyPercent,
    completedCheckpointCount: review.scoring.metrics.completedCheckpointCount,
    totalCheckpointCount: review.scoring.metrics.totalCheckpointCount,
    minorFaultCount: review.scoring.minorFaults.length,
    seriousFaultCount: review.scoring.seriousFaults.length,
    dangerousFaultCount: review.scoring.dangerousFaults.length,
    messages: review.feedback.messages.map((message) => ({
      id: message.id,
      categoryLabel: message.categoryLabel,
      severity: message.severity,
      location: message.location,
      whatHappened: message.whatHappened,
      whyItMatters: message.whyItMatters,
      improvementSuggestion: message.improvementSuggestion
    })),
    segmentFeedback: review.feedback.segmentFeedback.map((item) => ({
      ...item,
      severity: severityForSegmentFeedback(item, review.scoring),
      point: pointForRouteSegmentId(item.routeSegmentId, review, map)
    }))
  };
}

function severityForSegmentFeedback(
  feedback: LearnerAttemptSegmentFeedback,
  scoring: LearnerAttemptScoringResult
): DrivingFaultSeverity | "positive" {
  const severities = feedback.faultIds
    .map((faultId) => scoring.faults.find((fault) => fault.id === faultId)?.severity)
    .filter((severity): severity is DrivingFaultSeverity => Boolean(severity));

  if (severities.includes("dangerous")) {
    return "dangerous";
  }

  if (severities.includes("serious")) {
    return "serious";
  }

  if (severities.includes("minor")) {
    return "minor";
  }

  if (severities.includes("observation")) {
    return "observation";
  }

  return "positive";
}

function pointForRouteSegmentId(
  routeSegmentId: string,
  review: LearnerTrainingModeReview,
  map: MapDefinition
): Vec2 | null {
  const allSegments = [
    ...review.attemptedRouteSegments,
    ...review.scoring.routeSegmentAnnotations
      .filter((annotation) => annotation.routeSegmentId === routeSegmentId)
      .flatMap((annotation) =>
        review.attemptedRouteSegments.filter((segment) => segment.roadId === annotation.roadId)
      )
  ];
  const segment = allSegments.find((candidate) => candidate.id === routeSegmentId) ?? allSegments[0];

  return segment ? segmentMidpoint(segment, map) : null;
}

function segmentForAnnotation(input: {
  annotation: LearnerAttemptRouteSegmentAnnotation;
  exercise: GeneratedLearnerExercise;
  review: LearnerTrainingModeReview;
}): LearnerRouteValidationSegment | null {
  return (
    input.review.attemptedRouteSegments.find((segment) => segment.id === input.annotation.routeSegmentId) ??
    input.exercise.expectedRouteSegments.find((segment) => segment.id === input.annotation.routeSegmentId) ??
    null
  );
}

function segmentFeedbackOverlay(input: {
  item: LearnerAttemptSegmentFeedback;
  exercise: GeneratedLearnerExercise;
  map: MapDefinition;
  review: LearnerTrainingModeReview;
}): LearnerTrainingSegmentFeedbackOverlay | null {
  const annotation = input.review.scoring.routeSegmentAnnotations.find(
    (candidate) => candidate.routeSegmentId === input.item.routeSegmentId
  );
  const segment = annotation ? segmentForAnnotation({ annotation, exercise: input.exercise, review: input.review }) : null;

  if (!segment) {
    return null;
  }

  const points = segmentPoints(segment, input.map);
  const point = segmentMidpoint(segment, input.map);

  if (!point || points.length < 2) {
    return null;
  }

  return {
    id: `${input.review.scoring.attemptId}-segment-feedback-${input.item.routeSegmentId}`,
    routeSegmentId: input.item.routeSegmentId,
    roadId: input.item.roadId,
    point,
    points,
    categoryLabels: [...input.item.categoryLabels],
    faultIds: [...input.item.faultIds],
    feedbackMessageIds: [...input.item.feedbackMessageIds],
    severity: severityForSegmentFeedback(input.item, input.review.scoring),
    summary: input.item.summary,
    ...(input.item.improvementSuggestion ? { improvementSuggestion: input.item.improvementSuggestion } : {})
  };
}

function feedbackMessagesForFault(
  faultId: string,
  feedback: LearnerAttemptFeedbackResult
): LearnerAttemptFeedbackMessage[] {
  return feedback.messages.filter((message) => message.faultIds.includes(faultId));
}

function markerKindForFault(category: DrivingFaultCategory, severity: DrivingFaultSeverity): LearnerTrainingReviewMarkerKind {
  if (category === "unsafe-junction-decision") {
    return "wrong-turn";
  }

  if (category === "missed-checkpoint" || category === "wrong-checkpoint-order") {
    return "missed-checkpoint";
  }

  if (category === "no-entry" || category === "one-way-direction" || category === "prohibited-turn" || category === "restricted-road") {
    return "illegal-segment";
  }

  if (severity === "dangerous") {
    return "dangerous-fault";
  }

  if (severity === "serious") {
    return "serious-fault";
  }

  return "minor-fault";
}

function pointForFault(input: {
  faultId: string;
  exercise: GeneratedLearnerExercise;
  map: MapDefinition;
  review: LearnerTrainingModeReview;
}): Vec2 | null {
  const fault = input.review.scoring.faults.find((candidate) => candidate.id === input.faultId);

  if (!fault) {
    return null;
  }

  if (fault.category === "missed-checkpoint" || fault.category === "wrong-checkpoint-order") {
    for (const nodeId of fault.relatedNodeIds ?? []) {
      const point = nodeById(input.map, nodeId);

      if (point) {
        return point;
      }
    }
  }

  const faultAnnotations = input.review.scoring.routeSegmentAnnotations
    .filter((annotation) => fault.routeSegmentIds.includes(annotation.routeSegmentId))
    .sort((left, right) => {
      const leftIndex = left.attemptedSegmentIndex ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = right.attemptedSegmentIndex ?? Number.MAX_SAFE_INTEGER;

      return leftIndex - rightIndex;
    });

  for (const annotation of faultAnnotations) {
    const segment = annotation ? segmentForAnnotation({ annotation, exercise: input.exercise, review: input.review }) : null;
    const point = segment ? segmentMidpoint(segment, input.map) : null;

    if (point) {
      return point;
    }
  }

  for (const nodeId of fault.relatedNodeIds ?? []) {
    const point = nodeById(input.map, nodeId);

    if (point) {
      return point;
    }
  }

  for (const roadId of fault.relatedRoadIds ?? []) {
    const point = roadMidpoint(input.map, roadId);

    if (point) {
      return point;
    }
  }

  return input.exercise.routeGeometry[Math.floor(input.exercise.routeGeometry.length / 2)] ?? null;
}

function faultMarkers(input: {
  exercise: GeneratedLearnerExercise;
  map: MapDefinition;
  review: LearnerTrainingModeReview;
}): LearnerTrainingReviewMarker[] {
  return input.review.scoring.faults
    .filter((fault) => fault.title !== "Hints used")
    .map((fault): LearnerTrainingReviewMarker | null => {
      const point = pointForFault({
        faultId: fault.id,
        exercise: input.exercise,
        map: input.map,
        review: input.review
      });

      if (!point) {
        return null;
      }

      const messages = feedbackMessagesForFault(fault.id, input.review.feedback);
      const primaryMessage = messages[0];

      return {
        id: `${fault.id}-marker`,
        kind: markerKindForFault(fault.category, fault.severity),
        label: fault.title,
        detail: primaryMessage?.whatHappened ?? fault.detail ?? fault.title,
        point,
        severity: fault.severity,
        faultIds: [fault.id],
        feedbackMessageIds: messages.map((message) => message.id),
        routeSegmentIds: [...fault.routeSegmentIds],
        roadIds: [...(fault.relatedRoadIds ?? [])],
        nodeIds: [...(fault.relatedNodeIds ?? [])]
      };
    })
    .filter((marker): marker is LearnerTrainingReviewMarker => Boolean(marker));
}

function pointForInstruction(
  exercise: GeneratedLearnerExercise,
  instruction: RouteInstruction | undefined,
  map: MapDefinition,
  fallbackIndex: number
): Vec2 | null {
  if (instruction?.mapPoint) {
    return { x: instruction.mapPoint.x, y: instruction.mapPoint.y };
  }

  const nodePoint = nodeById(map, instruction?.nodeId);

  if (nodePoint) {
    return nodePoint;
  }

  const roadPoint = roadMidpoint(map, instruction?.roadId);

  if (roadPoint) {
    return roadPoint;
  }

  return exercise.routeGeometry[Math.min(fallbackIndex, Math.max(0, exercise.routeGeometry.length - 1))] ?? null;
}

function hintMarkers(input: {
  exercise: GeneratedLearnerExercise;
  map: MapDefinition;
  hints: readonly Hint[];
}): LearnerTrainingReviewMarker[] {
  return input.hints
    .map((hint, index): LearnerTrainingReviewMarker | null => {
      const instruction = hint.instructionId
        ? input.exercise.routeInstructions.find((candidate) => candidate.id === hint.instructionId)
        : input.exercise.routeInstructions[index] ?? input.exercise.routeInstructions[0];
      const point = pointForInstruction(input.exercise, instruction, input.map, index);

      if (!point) {
        return null;
      }

      return {
        id: `${hint.id}-marker`,
        kind: "hint-used",
        label: hint.title,
        detail: hint.text,
        point,
        severity: "hint",
        faultIds: [],
        feedbackMessageIds: [],
        routeSegmentIds: [],
        roadIds: instruction?.roadId ? [instruction.roadId] : [],
        nodeIds: instruction?.nodeId ? [instruction.nodeId] : []
      };
    })
    .filter((marker): marker is LearnerTrainingReviewMarker => Boolean(marker));
}

function reviewOverlayForAttempt(input: {
  exercise: GeneratedLearnerExercise;
  map: MapDefinition;
  review: LearnerTrainingModeReview;
  hints: readonly Hint[];
  checkpoints: readonly LearnerTrainingCheckpointOverlay[];
}): Pick<LearnerTrainingRouteOverlay, "attemptedRoute" | "faultMarkers" | "hintMarkers" | "segmentFeedback"> {
  return {
    attemptedRoute: routeLineForSegments(input.review.attemptedRouteSegments, input.map),
    faultMarkers: faultMarkers(input),
    hintMarkers: hintMarkers({
      exercise: input.exercise,
      map: input.map,
      hints: input.hints
    }),
    segmentFeedback: input.review.feedback.segmentFeedback
      .map((item) =>
        segmentFeedbackOverlay({
          item,
          exercise: input.exercise,
          map: input.map,
          review: input.review
        })
      )
      .filter((item): item is LearnerTrainingSegmentFeedbackOverlay => Boolean(item))
  };
}
