import {
  appendRouteDraftPoint,
  buildMapGraph,
  buildRoadSpatialIndex,
  createEmptyRouteDraft,
  findCandidateRoadsForPoint,
  findShortestLegalRoute,
  findShortestLegalRouteThroughStops,
  finishRouteStroke,
  matchSnappedRouteToSelection,
  routeDraftToDrawnRouteTrace,
  snapDrawnRouteToRoads,
  startRouteStroke,
  undoLastRouteStroke,
  validateDrawnRouteGesture,
  type DrawnRouteDraft,
  type MapDefinition,
  type MapGraph,
  type MapNode,
  type RouteExercise,
  type RouteStop,
  type ShortestLegalRouteResult,
  type ShortestLegalRouteThroughStopsResult,
  type Vec2
} from "../../../lib/map-engine/index.ts";
import {
  EXERCISE_TYPES,
  type ExerciseDifficulty
} from "../../../lib/training/learnerDriverTraining.ts";
import {
  type CuratedTrainingRouteComplexitySummary,
  type CuratedTrainingRouteCheckpointRequirement,
  type CuratedTrainingRouteExport,
  type CuratedTrainingRouteMetadata,
  type CuratedShortestRouteComparison,
  type CuratedShortestRouteComparisonDetail,
  type CuratedTrainingRouteStatus,
  type CuratedTrainingRouteStop
} from "../../../lib/training/curatedTrainingRoutes.ts";
import {
  CURATED_TRAINING_ROUTE_SAVE_MODE_DIRECTORIES,
  CURATED_TRAINING_ROUTE_SAVE_MODE_LABELS,
  curatedTrainingRouteFilename,
  curatedTrainingRouteRelativePath,
  effectiveCuratedTrainingRouteId,
  isGenericCuratedTrainingRouteId,
  lifecycleStageForCuratedTrainingRouteSaveMode,
  statusForCuratedTrainingRouteSaveMode,
  suggestCuratedTrainingRouteId,
  type CuratedTrainingRouteSaveMode
} from "../../../lib/training/curatedTrainingRouteSaveNaming.ts";
import {
  validateLearnerRoute,
  type LearnerRouteValidationIssue,
  type LearnerRouteValidationResult,
  type LearnerRouteValidationSegment
} from "../../../lib/training/learnerRouteValidation.ts";
import {
  ROUTE_RUNNER_MAP_OPTIONS,
  getRealLondonPilotExerciseMetadata,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  type RouteRunnerMapOption
} from "../route-runner/routeRunnerMaps.ts";

export type { CuratedShortestRouteComparisonDetail } from "../../../lib/training/curatedTrainingRoutes.ts";

export const DEV_TRAINING_ROUTE_AUTHOR_PATH = "/dev/training-route";
export const TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH = 1120;
export const TRAINING_ROUTE_AUTHOR_BASELINE_CANVAS_HEIGHT = 760;
export const TRAINING_ROUTE_AUTHOR_DESKTOP_HEIGHT_SCALE = 0.75;
export const TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT = Math.round(
  TRAINING_ROUTE_AUTHOR_BASELINE_CANVAS_HEIGHT * TRAINING_ROUTE_AUTHOR_DESKTOP_HEIGHT_SCALE
);
export const TRAINING_ROUTE_AUTHOR_SNAP_TOLERANCE = 24;

export type TrainingRouteAuthorMode =
  | "pan"
  | "set-start"
  | "draw-route"
  | "add-checkpoint"
  | "set-destination";

export type TrainingRouteAuthorMapWheelInput = {
  targetInsideMap: boolean;
  deltaX: number;
  deltaY: number;
};

export type TrainingRouteAuthorMapBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type TrainingRouteAuthorScreenPoint = {
  x: number;
  y: number;
};

export type TrainingRouteAuthorScreenSize = {
  width: number;
  height: number;
};

export type TrainingRouteAuthorClientPoint = {
  clientX: number;
  clientY: number;
};

export type TrainingRouteAuthorViewportRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type TrainingRouteAuthorViewportLayout = {
  screenSize: TrainingRouteAuthorScreenSize;
  mapBounds: TrainingRouteAuthorMapBounds;
  aspectRatio: number;
  contentRect: {
    left: 0;
    top: 0;
    width: number;
    height: number;
  };
  unusedViewportInsets: {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  };
};

export type TrainingRouteAuthorPointerMapConversion = {
  clientPoint: TrainingRouteAuthorClientPoint;
  localPoint: Vec2;
  screenPoint: TrainingRouteAuthorScreenPoint;
  screenSize: TrainingRouteAuthorScreenSize;
  mapPoint: Vec2;
  contentRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

export type TrainingRouteAuthorCursorZoomInput = {
  currentBounds: TrainingRouteAuthorMapBounds;
  initialBounds: TrainingRouteAuthorMapBounds;
  screenPoint: TrainingRouteAuthorScreenPoint;
  screenSize: TrainingRouteAuthorScreenSize;
  zoomFactor: number;
};

export type TrainingRouteAuthorPointerIsolationInput = {
  targetInsideMap: boolean;
  activeMode: TrainingRouteAuthorMode;
};

export type TrainingRouteAuthorPointerButtonInput = {
  button: number;
  buttons?: number;
  pointerType?: string;
  isPrimary?: boolean;
};

export type TrainingRouteAuthorToolbarActionId =
  | TrainingRouteAuthorMode
  | "undo"
  | "remove-last-checkpoint"
  | "clear-route"
  | "clear-checkpoints"
  | "reset-view"
  | "validate-route"
  | "compare-shortest-route"
  | "export-json";

export type TrainingRouteAuthorField = {
  id: keyof CuratedTrainingRouteMetadata;
  label: string;
  input: "text" | "textarea" | "select";
  value: string;
  options?: readonly string[];
  optionLabels?: Record<string, string>;
  helpText?: string;
};

export type TrainingRouteAuthorApprovalWarning = {
  blocking: boolean;
  message: string;
};

export type TrainingRouteAuthorToolbarAction = {
  id: TrainingRouteAuthorToolbarActionId;
  label: string;
  primary?: boolean;
  disabled?: boolean;
  pressed?: boolean;
};

export type TrainingRouteAuthorStep = {
  index: number;
  label: string;
  complete: boolean;
  current: boolean;
  optional?: boolean;
  instruction: string;
};

export type TrainingRouteAuthorStatusItem = {
  label: string;
  value: string;
  state: "complete" | "missing" | "warning" | "ready";
};

export type TrainingRouteAuthorMapMarker = {
  id: string;
  label: string;
  kind: "start" | "destination" | "checkpoint";
  point: Vec2;
};

export type TrainingRouteAuthorNodeSnapResult = {
  node: MapNode;
  roadId: string;
  roadName?: string;
  roadPoint: Vec2;
  nodePoint: Vec2;
  roadDistance: number;
  nodeDistance: number;
};

export type TrainingRouteAuthorMapModel = {
  authoredRoutePoints: Vec2[];
  matchedRoutePoints: Vec2[];
  snappedRoutePoints: Vec2[];
  shortestRoutePoints: Vec2[];
  markers: TrainingRouteAuthorMapMarker[];
  showShortestRouteComparison: boolean;
  validationIssueSegmentIds: string[];
  markerRadiusPixels: number;
};

export type TrainingRouteAuthorMapLegendItem = {
  id:
    | "raw-drawing"
    | "matched-route"
    | "shortest-overlay"
    | "one-way-arrows"
    | "start"
    | "destination"
    | "checkpoint";
  label: string;
  description: string;
};

export type TrainingRouteAuthorMapLegendModel = {
  controlLabel: "Map legend";
  presentation: "compact-collapsible-layer-control";
  placement: "map-viewport-bottom-left";
  collapsedByDefault: true;
  items: TrainingRouteAuthorMapLegendItem[];
};

export type TrainingRouteAuthorAreaOption = {
  areaId: string;
  areaName: string;
  label: string;
  practiceMapId: string;
  mapId: string;
  mapName: string;
  description: string;
  source: RouteRunnerMapOption["source"];
  sourceFixture?: string;
  exerciseCount: number;
  mapVersion?: string | number;
  readiness: "authoring-ready";
};

export type TrainingRouteAuthorExportReadiness = {
  ready: boolean;
  suggestedFilename: string;
  checklist: Array<{
    label: string;
    complete: boolean;
  }>;
};

export type TrainingRouteAuthorSaveTarget = {
  mode: CuratedTrainingRouteSaveMode;
  label: string;
  actionLabel: string;
  ready: boolean;
  unavailableMessage: string | null;
  jsonStatus: CuratedTrainingRouteStatus;
  lifecycleStage: ReturnType<typeof lifecycleStageForCuratedTrainingRouteSaveMode>;
  suggestedFilename: string;
  relativePath: string;
  directory: string;
  learnerFacingLater: boolean;
  checklist: Array<{
    label: string;
    complete: boolean;
  }>;
};

export type TrainingRouteAuthorDraftSaveReadiness = {
  ready: boolean;
  suggestedFilename: string;
  checklist: Array<{
    label: string;
    complete: boolean;
  }>;
};

export type TrainingRouteAuthorRouteMatchStatus =
  | "empty"
  | "insufficient"
  | "matched"
  | "snapping-failed"
  | "matching-failed";

export type TrainingRouteAuthorState = {
  activeMode: TrainingRouteAuthorMode;
  metadata: CuratedTrainingRouteMetadata;
  startNodeId: string | null;
  destinationNodeId: string | null;
  checkpointNodeIds: string[];
  routeDraft: DrawnRouteDraft;
  routeMatchStatus: TrainingRouteAuthorRouteMatchStatus;
  routeMatchMessage: string;
  routeNodeIds: string[];
  roadIds: string[];
  validationSegments: LearnerRouteValidationSegment[];
  snappedRoutePoints: Vec2[];
  validationHasRun: boolean;
  comparisonHasRun: boolean;
  sampleLoaded: boolean;
};

export type TrainingRouteAuthorModel = {
  path: typeof DEV_TRAINING_ROUTE_AUTHOR_PATH;
  title: "Curated Training Route Author";
  devOnlyNotice: string;
  sourceMapId: string;
  sourceMapName: string;
  sourceExerciseId: string;
  sampleLoaded: boolean;
  activeMode: TrainingRouteAuthorMode;
  toolbarActions: TrainingRouteAuthorToolbarAction[];
  authoringSteps: TrainingRouteAuthorStep[];
  routeStatusItems: TrainingRouteAuthorStatusItem[];
  mapModel: TrainingRouteAuthorMapModel;
  exportReadiness: TrainingRouteAuthorExportReadiness;
  draftSaveReadiness: TrainingRouteAuthorDraftSaveReadiness;
  validatedDraftSaveReadiness: TrainingRouteAuthorDraftSaveReadiness;
  saveTargets: TrainingRouteAuthorSaveTarget[];
  suggestedRouteId: string;
  effectiveRouteId: string;
  areaOptions: TrainingRouteAuthorAreaOption[];
  selectedArea: TrainingRouteAuthorAreaOption | null;
  metadataFields: TrainingRouteAuthorField[];
  validationRunStatus: "not-run" | LearnerRouteValidationResult["status"];
  comparisonRunStatus: "not-run" | CuratedShortestRouteComparisonDetail["comparisonStatus"];
  validation: LearnerRouteValidationResult;
  complexitySummary: CuratedTrainingRouteComplexitySummary;
  shortestRouteComparison: CuratedShortestRouteComparison;
  exportData: CuratedTrainingRouteExport;
  exportJson: string;
  approvalWarning: TrainingRouteAuthorApprovalWarning | null;
  authoringWorkflow: string[];
  routeMatchStatus: TrainingRouteAuthorRouteMatchStatus;
  routeMatchMessage: string;
};

const DEFAULT_ROUTE_EXERCISE =
  realLondonOsmPilotRouteExercises.find((exercise) => exercise.stops.length >= 2) ??
  realLondonOsmPilotRouteExercises[0];

const TRAINING_ROUTE_AUTHOR_SUPPORTED_MAP_IDS = new Set([realLondonOsmPilotRouteMap.id]);

export const TRAINING_ROUTE_AUTHOR_AREA_OPTIONS: TrainingRouteAuthorAreaOption[] = ROUTE_RUNNER_MAP_OPTIONS
  .filter((option) => TRAINING_ROUTE_AUTHOR_SUPPORTED_MAP_IDS.has(option.map.id))
  .map(routeRunnerMapOptionToTrainingRouteAuthorAreaOption);

const DEFAULT_TRAINING_ROUTE_AUTHOR_AREA =
  TRAINING_ROUTE_AUTHOR_AREA_OPTIONS.find((option) => option.mapId === realLondonOsmPilotRouteMap.id) ??
  routeRunnerMapOptionToTrainingRouteAuthorAreaOption({
    id: realLondonOsmPilotRouteMap.id,
    label: realLondonOsmPilotRouteMap.name,
    description: realLondonOsmPilotRouteMap.description ?? "Real London authoring map.",
    source: "converted-osm",
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    defaultExerciseId: realLondonOsmPilotRouteExercises[0]?.id ?? "",
    fixtureName: "realLondonPilotOverpass.json"
  });

const EMPTY_VALIDATION = validateLearnerRoute({
  map: realLondonOsmPilotRouteMap,
  routeSegments: [],
  difficulty: "beginner"
});

const ARRAY_METADATA_FIELDS = new Set<keyof CuratedTrainingRouteMetadata>([
  "skillsPractised",
  "expectedLearnerMistakes",
  "hintSequence",
  "scoringEmphasis"
]);
const TRAINING_ROUTE_AUTHOR_MIDDLE_MOUSE_BUTTON = 1;
const TRAINING_ROUTE_AUTHOR_MIDDLE_MOUSE_BUTTONS_MASK = 4;

export const TRAINING_ROUTE_AUTHOR_MAP_LEGEND_ITEMS: TrainingRouteAuthorMapLegendItem[] = [
  {
    id: "raw-drawing",
    label: "Raw drawing",
    description: "Orange line shows the route shape currently drawn by the author."
  },
  {
    id: "matched-route",
    label: "Matched route",
    description: "Purple line shows the snapped route matched to drivable road segments."
  },
  {
    id: "shortest-overlay",
    label: "Shortest overlay",
    description: "Blue line shows the shortest legal comparison route when the check has run."
  },
  {
    id: "one-way-arrows",
    label: "One-way arrows",
    description: "Blue arrows show the available one-way travel direction from map metadata."
  },
  {
    id: "start",
    label: "START",
    description: "Green marker identifies the authored learner route start."
  },
  {
    id: "destination",
    label: "DESTINATION",
    description: "Red marker identifies the authored learner route destination."
  },
  {
    id: "checkpoint",
    label: "Checkpoint",
    description: "Numbered marker identifies an ordered learner checkpoint."
  }
];

export function buildTrainingRouteAuthorMapLegendModel(input: {
  expanded?: boolean;
} = {}): TrainingRouteAuthorMapLegendModel {
  return {
    controlLabel: "Map legend",
    presentation: "compact-collapsible-layer-control",
    placement: "map-viewport-bottom-left",
    collapsedByDefault: true,
    items: input.expanded ? [...TRAINING_ROUTE_AUTHOR_MAP_LEGEND_ITEMS] : []
  };
}

function routeRunnerMapOptionToTrainingRouteAuthorAreaOption(
  option: RouteRunnerMapOption
): TrainingRouteAuthorAreaOption {
  const areaName = trainingRouteAuthorAreaNameForMapOption(option);

  return {
    areaId: option.id,
    areaName,
    label: option.label,
    practiceMapId: option.id,
    mapId: option.map.id,
    mapName: option.map.name,
    description: option.description,
    source: option.source,
    sourceFixture: option.fixtureName,
    exerciseCount: option.exercises.length,
    mapVersion: option.map.mapVersion ?? option.map.version,
    readiness: "authoring-ready"
  };
}

function trainingRouteAuthorAreaNameForMapOption(option: RouteRunnerMapOption): string {
  if (option.map.id === realLondonOsmPilotRouteMap.id) {
    return "Real London";
  }

  return option.map.name;
}

export function getTrainingRouteAuthorAreaOption(
  areaId: string | null | undefined
): TrainingRouteAuthorAreaOption | null {
  const trimmedAreaId = areaId?.trim();

  if (!trimmedAreaId) {
    return null;
  }

  return TRAINING_ROUTE_AUTHOR_AREA_OPTIONS.find((option) => option.areaId === trimmedAreaId) ?? null;
}

function metadataAreaFieldsForOption(option: TrainingRouteAuthorAreaOption): Pick<
  CuratedTrainingRouteMetadata,
  "area" | "practiceMapId" | "areaId" | "areaName" | "sourceFixture"
> {
  return {
    area: option.areaName,
    practiceMapId: option.practiceMapId,
    areaId: option.areaId,
    areaName: option.areaName,
    sourceFixture: option.sourceFixture
  };
}

function normaliseTrainingRouteAuthorMetadataArea(
  metadata: CuratedTrainingRouteMetadata
): CuratedTrainingRouteMetadata {
  const metadataRecord = metadata as CuratedTrainingRouteMetadata & Partial<CuratedTrainingRouteMetadata>;
  const areaIdWasProvided = Object.prototype.hasOwnProperty.call(metadataRecord, "areaId");
  const selectedOption = getTrainingRouteAuthorAreaOption(metadataRecord.areaId);

  if (selectedOption) {
    return {
      ...metadata,
      ...metadataAreaFieldsForOption(selectedOption)
    };
  }

  if (!areaIdWasProvided) {
    return {
      ...metadata,
      ...metadataAreaFieldsForOption(DEFAULT_TRAINING_ROUTE_AUTHOR_AREA)
    };
  }

  return {
    ...metadata,
    practiceMapId: metadataRecord.practiceMapId ?? "",
    areaId: metadataRecord.areaId ?? "",
    areaName: metadataRecord.areaName ?? "",
    area: metadataRecord.areaName ?? metadataRecord.area ?? "",
    sourceFixture: metadataRecord.sourceFixture
  };
}

function trainingRouteAuthorAreaSelectionIsValid(metadata: CuratedTrainingRouteMetadata): boolean {
  const selectedOption = getTrainingRouteAuthorAreaOption(metadata.areaId);

  return Boolean(
    selectedOption &&
      metadata.practiceMapId === selectedOption.practiceMapId &&
      metadata.areaName === selectedOption.areaName &&
      metadata.area === selectedOption.areaName
  );
}

function trainingRouteAuthorAreaHelpText(option: TrainingRouteAuthorAreaOption | null): string {
  if (!option) {
    return "Select a practice map or training area.";
  }

  const details = [
    `Map id: ${option.mapId}`,
    option.sourceFixture ? `Source fixture: ${option.sourceFixture}` : null,
    `Exercises: ${option.exerciseCount}`,
    option.mapVersion ? `Map version: ${option.mapVersion}` : null,
    "Readiness: authoring ready"
  ].filter((detail): detail is string => Boolean(detail));

  return details.join(" · ");
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function hasRequiredTrainingRouteTextMetadata(metadata: CuratedTrainingRouteMetadata): boolean {
  return Boolean(
    metadata.routeId.trim() &&
      metadata.title.trim() &&
      metadata.objective.trim()
  );
}

function hasRequiredTrainingRouteMetadata(metadata: CuratedTrainingRouteMetadata): boolean {
  return hasRequiredTrainingRouteTextMetadata(metadata) && trainingRouteAuthorAreaSelectionIsValid(metadata);
}

function trainingRouteAuthorCheckpointsRequired(metadata: CuratedTrainingRouteMetadata): boolean {
  const checkpointRequirementText = [
    metadata.objective,
    metadata.description,
    ...metadata.scoringEmphasis,
    ...metadata.skillsPractised,
    ...metadata.expectedLearnerMistakes,
    ...metadata.hintSequence,
    metadata.instructorFeedbackNotes
  ].join(" ");

  return /required checkpoint|checkpoint-ordering|checkpoint order|ordered checkpoint|checkpoint navigation|multi-stop|visit checkpoints in order|checkpoints in order/i.test(
    checkpointRequirementText
  );
}

function trainingRouteAuthorIssue(input: {
  code: LearnerRouteValidationIssue["code"];
  nodeIds?: readonly string[];
  routeSegmentIds?: readonly string[];
  roadIds?: readonly string[];
  explanation: string;
}): LearnerRouteValidationIssue {
  return {
    code: input.code,
    severity: "error",
    routeSegmentIds: uniqueSortedStrings(input.routeSegmentIds ?? []),
    roadIds: uniqueSortedStrings(input.roadIds ?? []),
    nodeIds: uniqueSortedStrings(input.nodeIds ?? []),
    explanation: input.explanation
  };
}

function routeNodeVisitIndexAfter(routeNodeIds: readonly string[], nodeId: string, afterIndex: number): number {
  for (let index = afterIndex + 1; index < routeNodeIds.length; index += 1) {
    if (routeNodeIds[index] === nodeId) {
      return index;
    }
  }

  return -1;
}

function routeNodeVisitIndexAtOrBefore(routeNodeIds: readonly string[], nodeId: string, beforeOrAtIndex: number): number {
  for (let index = 0; index <= beforeOrAtIndex && index < routeNodeIds.length; index += 1) {
    if (routeNodeIds[index] === nodeId) {
      return index;
    }
  }

  return -1;
}

function validationSegmentsForNode(
  validationSegments: readonly LearnerRouteValidationSegment[],
  nodeId: string
): LearnerRouteValidationSegment[] {
  return validationSegments.filter((segment) => segment.fromNodeId === nodeId || segment.toNodeId === nodeId);
}

function authoringCheckpointRouteIssues(state: TrainingRouteAuthorState): LearnerRouteValidationIssue[] {
  const issues: LearnerRouteValidationIssue[] = [];

  if (state.routeNodeIds.length === 0 || state.validationSegments.length === 0) {
    return issues;
  }

  const firstRouteNodeId = state.routeNodeIds[0];
  const lastRouteNodeId = state.routeNodeIds[state.routeNodeIds.length - 1];

  if (state.startNodeId && firstRouteNodeId !== state.startNodeId) {
    issues.push(
      trainingRouteAuthorIssue({
        code: "start-segment-invalid",
        nodeIds: [state.startNodeId],
        routeSegmentIds: state.validationSegments[0] ? [state.validationSegments[0].id] : [],
        roadIds: state.validationSegments[0] ? [state.validationSegments[0].roadId] : [],
        explanation: `The matched route starts at ${firstRouteNodeId}, but the selected start is ${state.startNodeId}.`
      })
    );
  }

  if (state.destinationNodeId && lastRouteNodeId !== state.destinationNodeId) {
    const lastSegment = state.validationSegments[state.validationSegments.length - 1];

    issues.push(
      trainingRouteAuthorIssue({
        code: "end-segment-invalid",
        nodeIds: [state.destinationNodeId],
        routeSegmentIds: lastSegment ? [lastSegment.id] : [],
        roadIds: lastSegment ? [lastSegment.roadId] : [],
        explanation: `The matched route ends at ${lastRouteNodeId}, but the selected destination is ${state.destinationNodeId}.`
      })
    );
  }

  let previousVisitIndex = state.startNodeId ? state.routeNodeIds.indexOf(state.startNodeId) : -1;

  if (previousVisitIndex < 0) {
    previousVisitIndex = -1;
  }

  state.checkpointNodeIds.forEach((checkpointNodeId, index) => {
    const visitIndex = routeNodeVisitIndexAfter(state.routeNodeIds, checkpointNodeId, previousVisitIndex);

    if (visitIndex >= 0) {
      previousVisitIndex = visitIndex;
      return;
    }

    const touchingSegments = validationSegmentsForNode(state.validationSegments, checkpointNodeId);
    const issueInput = {
      nodeIds: [checkpointNodeId],
      routeSegmentIds: touchingSegments.map((segment) => segment.id),
      roadIds: touchingSegments.map((segment) => segment.roadId)
    };
    const outOfOrderIndex = routeNodeVisitIndexAtOrBefore(state.routeNodeIds, checkpointNodeId, previousVisitIndex);

    if (outOfOrderIndex >= 0) {
      issues.push(
        trainingRouteAuthorIssue({
          ...issueInput,
          code: "author-checkpoint-out-of-order",
          explanation: `Checkpoint ${index + 1} (${checkpointNodeId}) is visited out of order. Visit checkpoints in numbered order before the destination.`
        })
      );
      return;
    }

    issues.push(
      trainingRouteAuthorIssue({
        ...issueInput,
        code: "author-checkpoint-missed",
        explanation: `Checkpoint ${index + 1} (${checkpointNodeId}) is not visited by the matched route.`
      })
    );
  });

  return issues;
}

function checkpointRequirementsForState(input: {
  metadata: CuratedTrainingRouteMetadata;
  startNodeId: string | null;
  checkpointNodeIds: readonly string[];
  destinationNodeId: string | null;
}): CuratedTrainingRouteCheckpointRequirement {
  const required = trainingRouteAuthorCheckpointsRequired(input.metadata);
  const requiredNodeIds = [
    input.startNodeId,
    ...input.checkpointNodeIds,
    input.destinationNodeId
  ].filter((nodeId): nodeId is string => Boolean(nodeId));
  const checkpointCount = input.checkpointNodeIds.length;

  return {
    required,
    ordered: true,
    checkpointCount,
    requiredNodeIds,
    instruction:
      checkpointCount > 0
        ? `Visit checkpoints in order: ${input.checkpointNodeIds.map((nodeId, index) => `Checkpoint ${index + 1} (${nodeId})`).join(", ")} before the destination.`
        : required
          ? "At least one ordered checkpoint is required before this route can be completed."
          : "No intermediate checkpoint is required unless the route author adds one."
  };
}

function hasUsableScrollDelta(delta: number): boolean {
  return Number.isFinite(delta) && delta !== 0;
}

function trainingRouteAuthorBoundsWidth(bounds: TrainingRouteAuthorMapBounds): number {
  return bounds.maxX - bounds.minX;
}

function trainingRouteAuthorBoundsHeight(bounds: TrainingRouteAuthorMapBounds): number {
  return bounds.maxY - bounds.minY;
}

function clampUnitInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return 0.5;
  }

  return Math.min(1, Math.max(0, value));
}

function hasPositiveFiniteSize(size: TrainingRouteAuthorScreenSize | TrainingRouteAuthorViewportRect): boolean {
  return Number.isFinite(size.width) && size.width > 0 && Number.isFinite(size.height) && size.height > 0;
}

function defaultTrainingRouteAuthorScreenSize(): TrainingRouteAuthorScreenSize {
  return {
    width: TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
    height: TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
  };
}

export function fitTrainingRouteAuthorBoundsToViewportAspect(
  bounds: TrainingRouteAuthorMapBounds,
  screenSize: TrainingRouteAuthorScreenSize = defaultTrainingRouteAuthorScreenSize()
): TrainingRouteAuthorMapBounds {
  const width = trainingRouteAuthorBoundsWidth(bounds);
  const height = trainingRouteAuthorBoundsHeight(bounds);

  if (width <= 0 || height <= 0 || !hasPositiveFiniteSize(screenSize)) {
    return { ...bounds };
  }

  const targetAspectRatio = screenSize.width / screenSize.height;
  const boundsAspectRatio = width / height;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  if (Math.abs(boundsAspectRatio - targetAspectRatio) < 0.000001) {
    return { ...bounds };
  }

  if (boundsAspectRatio < targetAspectRatio) {
    const nextWidth = height * targetAspectRatio;
    const halfWidth = nextWidth / 2;

    return {
      minX: centerX - halfWidth,
      maxX: centerX + halfWidth,
      minY: bounds.minY,
      maxY: bounds.maxY
    };
  }

  const nextHeight = width / targetAspectRatio;
  const halfHeight = nextHeight / 2;

  return {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minY: centerY - halfHeight,
    maxY: centerY + halfHeight
  };
}

export function buildTrainingRouteAuthorViewportLayout(input: {
  mapBounds: TrainingRouteAuthorMapBounds;
  screenSize?: TrainingRouteAuthorScreenSize;
}): TrainingRouteAuthorViewportLayout {
  const screenSize = input.screenSize ?? defaultTrainingRouteAuthorScreenSize();
  const safeScreenSize = hasPositiveFiniteSize(screenSize) ? screenSize : defaultTrainingRouteAuthorScreenSize();

  return {
    screenSize: safeScreenSize,
    mapBounds: fitTrainingRouteAuthorBoundsToViewportAspect(input.mapBounds, safeScreenSize),
    aspectRatio: safeScreenSize.width / safeScreenSize.height,
    contentRect: {
      left: 0,
      top: 0,
      width: safeScreenSize.width,
      height: safeScreenSize.height
    },
    unusedViewportInsets: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  };
}

export function trainingRouteAuthorViewportAspectRatioCss(
  layout: Pick<TrainingRouteAuthorViewportLayout, "screenSize">
): string {
  return `${layout.screenSize.width} / ${layout.screenSize.height}`;
}

function isMouseLikeTrainingRouteAuthorPointer(input: Pick<TrainingRouteAuthorPointerButtonInput, "pointerType">): boolean {
  return !input.pointerType || input.pointerType === "mouse";
}

export function shouldIsolateTrainingRouteAuthorMapWheel(input: TrainingRouteAuthorMapWheelInput): boolean {
  return input.targetInsideMap && (hasUsableScrollDelta(input.deltaX) || hasUsableScrollDelta(input.deltaY));
}

export function dominantTrainingRouteAuthorWheelDelta(input: Pick<TrainingRouteAuthorMapWheelInput, "deltaX" | "deltaY">): number {
  if (!hasUsableScrollDelta(input.deltaX) && !hasUsableScrollDelta(input.deltaY)) {
    return 0;
  }

  return Math.abs(input.deltaY) >= Math.abs(input.deltaX) ? input.deltaY : input.deltaX;
}

export function trainingRouteAuthorWheelZoomFactor(delta: number): number {
  return delta > 0 ? 1.15 : 0.87;
}

export function trainingRouteAuthorMapPointForScreenPoint(
  bounds: TrainingRouteAuthorMapBounds,
  screenPoint: TrainingRouteAuthorScreenPoint,
  screenSize: TrainingRouteAuthorScreenSize
): Vec2 | null {
  if (screenSize.width <= 0 || screenSize.height <= 0) {
    return null;
  }

  const xRatio = clampUnitInterval(screenPoint.x / screenSize.width);
  const yRatio = clampUnitInterval(screenPoint.y / screenSize.height);

  return {
    x: bounds.minX + xRatio * trainingRouteAuthorBoundsWidth(bounds),
    y: bounds.minY + yRatio * trainingRouteAuthorBoundsHeight(bounds)
  };
}

export function trainingRouteAuthorMapPointForClientPoint(input: {
  bounds: TrainingRouteAuthorMapBounds;
  clientPoint: TrainingRouteAuthorClientPoint;
  viewportRect: TrainingRouteAuthorViewportRect;
  screenSize?: TrainingRouteAuthorScreenSize;
}): TrainingRouteAuthorPointerMapConversion | null {
  const screenSize = input.screenSize ?? {
    width: TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
    height: TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
  };
  const boundsWidth = trainingRouteAuthorBoundsWidth(input.bounds);
  const boundsHeight = trainingRouteAuthorBoundsHeight(input.bounds);

  if (
    !hasPositiveFiniteSize(input.viewportRect) ||
    !hasPositiveFiniteSize(screenSize) ||
    boundsWidth <= 0 ||
    boundsHeight <= 0
  ) {
    return null;
  }

  const localPoint = {
    x: input.clientPoint.clientX - input.viewportRect.left,
    y: input.clientPoint.clientY - input.viewportRect.top
  };
  const scale = Math.min(input.viewportRect.width / boundsWidth, input.viewportRect.height / boundsHeight);

  if (!Number.isFinite(scale) || scale <= 0) {
    return null;
  }

  const contentRect = {
    left: (input.viewportRect.width - boundsWidth * scale) / 2,
    top: (input.viewportRect.height - boundsHeight * scale) / 2,
    width: boundsWidth * scale,
    height: boundsHeight * scale
  };
  const contentX = localPoint.x - contentRect.left;
  const contentY = localPoint.y - contentRect.top;
  const insideContent =
    contentX >= 0 &&
    contentY >= 0 &&
    contentX <= contentRect.width &&
    contentY <= contentRect.height;

  if (!insideContent) {
    return null;
  }

  const xRatio = clampUnitInterval(contentX / contentRect.width);
  const yRatio = clampUnitInterval(contentY / contentRect.height);
  const screenPoint = {
    x: xRatio * screenSize.width,
    y: yRatio * screenSize.height
  };
  const mapPoint = trainingRouteAuthorMapPointForScreenPoint(input.bounds, screenPoint, screenSize);

  if (!mapPoint) {
    return null;
  }

  return {
    clientPoint: input.clientPoint,
    localPoint,
    screenPoint,
    screenSize,
    mapPoint,
    contentRect
  };
}

export function zoomTrainingRouteAuthorBoundsAroundScreenPoint(
  input: TrainingRouteAuthorCursorZoomInput
): TrainingRouteAuthorMapBounds {
  const currentWidth = trainingRouteAuthorBoundsWidth(input.currentBounds);
  const currentHeight = trainingRouteAuthorBoundsHeight(input.currentBounds);
  const initialWidth = trainingRouteAuthorBoundsWidth(input.initialBounds);

  if (
    currentWidth <= 0 ||
    currentHeight <= 0 ||
    initialWidth <= 0 ||
    input.screenSize.width <= 0 ||
    input.screenSize.height <= 0 ||
    !Number.isFinite(input.zoomFactor) ||
    input.zoomFactor <= 0
  ) {
    return input.currentBounds;
  }

  const xRatio = clampUnitInterval(input.screenPoint.x / input.screenSize.width);
  const yRatio = clampUnitInterval(input.screenPoint.y / input.screenSize.height);
  const anchor = trainingRouteAuthorMapPointForScreenPoint(input.currentBounds, input.screenPoint, input.screenSize);

  if (!anchor) {
    return input.currentBounds;
  }

  const nextWidth = Math.min(initialWidth * 2.4, Math.max(initialWidth * 0.08, currentWidth * input.zoomFactor));
  const nextHeight = nextWidth * (currentHeight / currentWidth);

  return {
    minX: anchor.x - xRatio * nextWidth,
    maxX: anchor.x + (1 - xRatio) * nextWidth,
    minY: anchor.y - yRatio * nextHeight,
    maxY: anchor.y + (1 - yRatio) * nextHeight
  };
}

export function shouldIsolateTrainingRouteAuthorPointer(input: TrainingRouteAuthorPointerIsolationInput): boolean {
  return input.targetInsideMap;
}

export function canStartTrainingRouteAuthorPointer(input: TrainingRouteAuthorPointerButtonInput): boolean {
  if (input.isPrimary === false) {
    return false;
  }

  return !isMouseLikeTrainingRouteAuthorPointer(input) || input.button === 0;
}

export function isTrainingRouteAuthorMiddlePanPointer(input: TrainingRouteAuthorPointerButtonInput): boolean {
  return isMouseLikeTrainingRouteAuthorPointer(input) && input.button === TRAINING_ROUTE_AUTHOR_MIDDLE_MOUSE_BUTTON;
}

export function isTrainingRouteAuthorMiddlePanActive(
  input: Pick<TrainingRouteAuthorPointerButtonInput, "buttons" | "pointerType">
): boolean {
  return (
    isMouseLikeTrainingRouteAuthorPointer(input) &&
    Boolean((input.buttons ?? 0) & TRAINING_ROUTE_AUTHOR_MIDDLE_MOUSE_BUTTONS_MASK)
  );
}

export function canContinueTrainingRouteAuthorDrawPointer(input: TrainingRouteAuthorPointerButtonInput): boolean {
  if (input.isPrimary === false) {
    return false;
  }

  return !isMouseLikeTrainingRouteAuthorPointer(input) || Boolean((input.buttons ?? 0) & 1);
}

export function canContinueTrainingRouteAuthorPanPointer(
  input: TrainingRouteAuthorPointerButtonInput,
  panSource: "primary" | "middle"
): boolean {
  if (panSource === "middle") {
    return isTrainingRouteAuthorMiddlePanActive(input);
  }

  return canContinueTrainingRouteAuthorDrawPointer(input);
}

export function shouldPreventTrainingRouteAuthorAuxiliaryClick(input: TrainingRouteAuthorPointerButtonInput): boolean {
  return isMouseLikeTrainingRouteAuthorPointer(input) && input.button !== 0;
}

function stopNodeId(stop: RouteStop, map: MapDefinition): string | null {
  if (stop.type === "node") {
    return stop.nodeId;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  return landmark?.nearestNodeId ?? null;
}

function pointForNode(map: MapDefinition, nodeId: string | null): Vec2 | undefined {
  const node = nodeId ? map.nodes.find((candidate) => candidate.id === nodeId) : null;

  return node ? { x: node.x, y: node.y } : undefined;
}

function nodeLabel(map: MapDefinition, nodeId: string, fallback: string): string {
  const node = map.nodes.find((candidate) => candidate.id === nodeId);

  return node?.label?.trim() || fallback;
}

function selectedStopNodeIds(exercise: RouteExercise, map: MapDefinition): string[] {
  return exercise.stops.map((stop) => stopNodeId(stop, map)).filter((nodeId): nodeId is string => Boolean(nodeId));
}

function pointsForNodeIds(map: MapDefinition, nodeIds: readonly string[]): Vec2[] {
  return nodeIds.map((nodeId) => pointForNode(map, nodeId)).filter((point): point is Vec2 => Boolean(point));
}

function routeSegmentForStopNode(input: {
  nodeId: string;
  kind?: CuratedTrainingRouteStop["kind"];
  validationSegments: readonly LearnerRouteValidationSegment[];
}): LearnerRouteValidationSegment | null {
  if (input.kind === "start") {
    return input.validationSegments.find((segment) => segment.fromNodeId === input.nodeId) ?? null;
  }

  if (input.kind === "destination") {
    return input.validationSegments.find((segment) => segment.toNodeId === input.nodeId) ?? null;
  }

  return (
    input.validationSegments.find((segment) => segment.toNodeId === input.nodeId) ??
    input.validationSegments.find((segment) => segment.fromNodeId === input.nodeId) ??
    null
  );
}

function curatedStopForNode(input: {
  map: MapDefinition;
  nodeId: string | null;
  fallbackLabel: string;
  kind?: CuratedTrainingRouteStop["kind"];
  order?: number;
  required?: boolean;
  validationSegments?: readonly LearnerRouteValidationSegment[];
}): CuratedTrainingRouteStop {
  const nodeId = input.nodeId ?? "unselected";
  const matchedSegment = input.nodeId
    ? routeSegmentForStopNode({
        nodeId: input.nodeId,
        kind: input.kind,
        validationSegments: input.validationSegments ?? []
      })
    : null;
  const markerLabel =
    input.kind === "start"
      ? "START"
      : input.kind === "destination"
        ? "DESTINATION"
        : typeof input.order === "number"
          ? String(input.order)
          : input.fallbackLabel;

  return {
    id: input.kind === "checkpoint" ? `checkpoint-${input.order ?? "unknown"}` : input.kind,
    kind: input.kind,
    order: input.order,
    nodeId,
    label: input.nodeId ? nodeLabel(input.map, input.nodeId, input.fallbackLabel) : input.fallbackLabel,
    point: pointForNode(input.map, input.nodeId),
    roadId: matchedSegment?.roadId,
    routeSegmentId: matchedSegment?.id,
    required: input.required,
    display: input.kind
      ? {
          markerLabel,
          markerRole: input.kind,
          description:
            input.kind === "checkpoint"
              ? `Required checkpoint ${input.order ?? ""}`.trim()
              : input.kind === "start"
                ? "Required route start"
                : "Required route destination"
        }
      : undefined
  };
}

function metadataForNewRoute(): CuratedTrainingRouteMetadata {
  return {
    routeId: "curated-training-route-draft",
    title: "Untitled curated training route",
    ...metadataAreaFieldsForOption(DEFAULT_TRAINING_ROUTE_AUTHOR_AREA),
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    description: "Curated learner-driver route authored from the Real London map.",
    objective: "Complete the authored route legally from start to destination.",
    skillsPractised: ["route planning", "legal route choice", "junction observation"],
    expectedLearnerMistakes: ["wrong turn", "unnecessary detour"],
    hintSequence: [
      "Check the next junction before committing.",
      "Confirm whether the next road is legal for your direction."
    ],
    scoringEmphasis: ["legal route validity", "route adherence", "route efficiency"],
    instructorFeedbackNotes:
      "Explain the first major legal or planning issue, then give one concrete recovery suggestion.",
    routeChoiceJustification: "",
    status: "draft"
  };
}

function metadataForExercise(exercise: RouteExercise): CuratedTrainingRouteMetadata {
  const metadata = getRealLondonPilotExerciseMetadata(exercise);
  const routeType = metadata?.routeType ?? "direct";
  const hasIntermediateStops = selectedStopNodeIds(exercise, realLondonOsmPilotRouteMap).length > 2;

  return {
    routeId: `curated-${exercise.id}`,
    title: `${exercise.title} curated training route`,
    ...metadataAreaFieldsForOption(DEFAULT_TRAINING_ROUTE_AUTHOR_AREA),
    difficulty: metadata?.difficulty === "hard" ? "advanced" : metadata?.difficulty === "easy" ? "beginner" : "intermediate",
    exerciseType: routeType === "checkpoint" || routeType === "multi-stop"
      ? "follow-planned-route"
      : "choose-legal-route",
    description: exercise.description ?? "Curated learner-driver route prepared from existing Real London map data.",
    objective: hasIntermediateStops
      ? "Complete the route legally while visiting checkpoints in order before the destination."
      : "Complete the route legally while making practical learner-driver decisions.",
    skillsPractised: ["route planning", "legal route choice", "junction observation"],
    expectedLearnerMistakes: hasIntermediateStops
      ? ["wrong turn", "missed checkpoint", "checkpoint out of order", "unnecessary detour"]
      : ["wrong turn", "unnecessary detour"],
    hintSequence: hasIntermediateStops
      ? [
          "Check the next junction before committing.",
          "Confirm whether the next road is legal for your direction.",
          "Use the planned checkpoint order to recover if you miss a turn."
        ]
      : [
          "Check the next junction before committing.",
          "Confirm whether the next road is legal for your direction."
        ],
    scoringEmphasis: hasIntermediateStops
      ? ["legal route validity", "required checkpoint order", "route efficiency"]
      : ["legal route validity", "route adherence", "route efficiency"],
    instructorFeedbackNotes:
      "Explain the first major legal or planning issue, then give one concrete recovery suggestion.",
    routeChoiceJustification:
      "This sample follows the selected exercise stops. Replace this note if the authored route is intentionally longer than the shortest legal option.",
    status: "beta"
  };
}

function buildMetadataFields(input: {
  metadata: CuratedTrainingRouteMetadata;
  effectiveRouteId: string;
  suggestedRouteId: string;
}): TrainingRouteAuthorField[] {
  const metadata = input.metadata;
  const selectedArea = getTrainingRouteAuthorAreaOption(metadata.areaId);
  const areaOptionIds = TRAINING_ROUTE_AUTHOR_AREA_OPTIONS.map((option) => option.areaId);
  const areaOptions = selectedArea ? areaOptionIds : ["", ...areaOptionIds];
  const areaOptionLabels = Object.fromEntries(
    TRAINING_ROUTE_AUTHOR_AREA_OPTIONS.map((option) => [option.areaId, option.label])
  );

  return [
    {
      id: "routeId",
      label: "Route id",
      input: "text",
      value: input.effectiveRouteId,
      helpText: isGenericCuratedTrainingRouteId(metadata.routeId)
        ? `Auto-suggested from metadata: ${input.suggestedRouteId}`
        : "Editable route id used for saved JSON and route library naming."
    },
    { id: "title", label: "Title", input: "text", value: metadata.title },
    {
      id: "areaId",
      label: "Practice map / area",
      input: "select",
      value: metadata.areaId,
      options: areaOptions,
      optionLabels: {
        "": "Select a practice map or training area",
        ...areaOptionLabels
      },
      helpText: trainingRouteAuthorAreaHelpText(selectedArea)
    },
    {
      id: "difficulty",
      label: "Difficulty",
      input: "select",
      value: metadata.difficulty,
      options: ["beginner", "intermediate", "advanced"]
    },
    {
      id: "exerciseType",
      label: "Exercise type",
      input: "select",
      value: metadata.exerciseType,
      options: EXERCISE_TYPES
    },
    { id: "description", label: "Description", input: "textarea", value: metadata.description },
    { id: "objective", label: "Objective", input: "textarea", value: metadata.objective },
    { id: "skillsPractised", label: "Skills practised", input: "textarea", value: metadata.skillsPractised.join("\n") },
    {
      id: "expectedLearnerMistakes",
      label: "Expected learner mistakes",
      input: "textarea",
      value: metadata.expectedLearnerMistakes.join("\n")
    },
    { id: "hintSequence", label: "Hint sequence", input: "textarea", value: metadata.hintSequence.join("\n") },
    {
      id: "scoringEmphasis",
      label: "Scoring emphasis",
      input: "textarea",
      value: metadata.scoringEmphasis.join("\n")
    },
    {
      id: "instructorFeedbackNotes",
      label: "Instructor feedback notes",
      input: "textarea",
      value: metadata.instructorFeedbackNotes
    },
    {
      id: "routeChoiceJustification",
      label: "Route choice justification",
      input: "textarea",
      value: metadata.routeChoiceJustification
    },
    {
      id: "status",
      label: "Route lifecycle status",
      input: "select",
      value: metadata.status,
      options: ["draft", "beta", "approved"],
      optionLabels: {
        draft: "Draft - not learner-facing",
        beta: "Beta - learner-facing beta route",
        approved: "Approved - complete approved route"
      },
      helpText: "Review candidate is a save mode. JSON status remains draft until the route is beta or approved."
    }
  ];
}

function validationSegmentsFromRoadsAndNodes(input: {
  graph: MapGraph;
  roadIds: readonly string[];
  nodeIds: readonly string[];
}): LearnerRouteValidationSegment[] {
  return input.roadIds.flatMap((roadId, index): LearnerRouteValidationSegment[] => {
    const fromNodeId = input.nodeIds[index];
    const toNodeId = input.nodeIds[index + 1];
    const road = input.graph.roadsById[roadId];

    if (!fromNodeId || !toNodeId || !road) {
      return [];
    }

    const edge = input.graph.edges.find(
      (candidate) =>
        candidate.roadId === roadId &&
        candidate.fromNodeId === fromNodeId &&
        candidate.toNodeId === toNodeId
    );

    return [
      {
        id: edge?.id ?? `${roadId}:${fromNodeId}->${toNodeId}`,
        roadId,
        fromNodeId,
        toNodeId
      }
    ];
  });
}

function validationMetrics(input: {
  map: MapDefinition;
  routeSegments: readonly LearnerRouteValidationSegment[];
  difficulty: Exclude<ExerciseDifficulty, "easy">;
}): LearnerRouteValidationResult {
  return validateLearnerRoute({
    map: input.map,
    routeSegments: input.routeSegments,
    difficulty: input.difficulty
  });
}

function routeDraftHasUsablePoints(routeDraft: DrawnRouteDraft): boolean {
  return routeDraftToDrawnRouteTrace(routeDraft).points.length >= 2;
}

function authoringValidationIssues(input: {
  state: TrainingRouteAuthorState;
  metadata: CuratedTrainingRouteMetadata;
  hasMatchedRoute: boolean;
  hasUsableRoute: boolean;
  checkpointsRequired: boolean;
}): LearnerRouteValidationIssue[] {
  const issues: LearnerRouteValidationIssue[] = [];

  if (!input.state.startNodeId) {
    issues.push(
      trainingRouteAuthorIssue({
        code: "author-start-missing",
        explanation: "Start point is missing."
      })
    );
  }

  if (!input.state.destinationNodeId) {
    issues.push(
      trainingRouteAuthorIssue({
        code: "author-destination-missing",
        explanation: "Destination point is missing."
      })
    );
  }

  if (!input.hasUsableRoute) {
    issues.push(
      trainingRouteAuthorIssue({
        code: "author-route-missing",
        explanation: "Drawn route is missing."
      })
    );
  } else if (!input.hasMatchedRoute) {
    issues.push(
      trainingRouteAuthorIssue({
        code: "author-route-not-matched",
        explanation: "Route has not been snapped and matched to road segments."
      })
    );
  }

  if (!trainingRouteAuthorAreaSelectionIsValid(input.metadata)) {
    issues.push(
      trainingRouteAuthorIssue({
        code: "author-metadata-incomplete",
        explanation: "Select a practice map or training area."
      })
    );
  }

  if (!hasRequiredTrainingRouteTextMetadata(input.metadata)) {
    issues.push(
      trainingRouteAuthorIssue({
        code: "author-metadata-incomplete",
        explanation: "Required route metadata is incomplete."
      })
    );
  }

  if (input.checkpointsRequired && input.state.checkpointNodeIds.length === 0) {
    issues.push(
      trainingRouteAuthorIssue({
        code: "author-checkpoint-missing",
        explanation: "At least one checkpoint is required for this exercise type."
      })
    );
  }

  if (input.hasMatchedRoute) {
    issues.push(...authoringCheckpointRouteIssues(input.state));
  }

  return issues;
}

function validationWithAuthoringRequirements(input: {
  validation: LearnerRouteValidationResult;
  requirementIssues: readonly LearnerRouteValidationIssue[];
}): LearnerRouteValidationResult {
  if (input.requirementIssues.length === 0) {
    return input.validation;
  }

  const blockingErrors = [...input.requirementIssues, ...input.validation.blockingErrors];
  const allIssues = [...blockingErrors, ...input.validation.advisoryWarnings];

  return {
    ...input.validation,
    status: "invalid",
    valid: false,
    blockingErrors,
    affectedRouteSegmentIds: uniqueSortedStrings(allIssues.flatMap((issue) => issue.routeSegmentIds)),
    ruleCodes: uniqueSortedStrings(allIssues.map((issue) => issue.code)) as LearnerRouteValidationResult["ruleCodes"],
    explanation: `${input.requirementIssues[0]?.explanation ?? "Authoring requirements are incomplete."} Resolve blocking authoring requirements before exporting.`
  };
}

function inferDifficultyFromMetrics(
  validation: LearnerRouteValidationResult,
  selectedDifficulty: ExerciseDifficulty
): ExerciseDifficulty {
  if (validation.metrics.segmentCount > 14 || validation.metrics.junctionDecisionCount > 9) {
    return "advanced";
  }

  if (validation.metrics.segmentCount > 8 || validation.metrics.turnCount > 5) {
    return "intermediate";
  }

  return selectedDifficulty === "advanced" ? "intermediate" : selectedDifficulty;
}

function complexityWarnings(input: {
  validation: LearnerRouteValidationResult;
  selectedDifficulty: Exclude<ExerciseDifficulty, "easy">;
  estimatedDifficulty: ExerciseDifficulty;
}): string[] {
  const warnings = input.validation.advisoryWarnings.map((warning) => warning.explanation);

  if (input.validation.metrics.segmentCount === 0) {
    return [];
  }

  if (input.selectedDifficulty === "advanced" && input.validation.metrics.segmentCount < 6) {
    warnings.push("Advanced curated routes should normally include more than a very short simple segment sequence.");
  }

  if (
    input.selectedDifficulty === "beginner" &&
    (input.validation.metrics.segmentCount > 5 || input.validation.metrics.junctionDecisionCount > 3)
  ) {
    warnings.push("Beginner curated routes should avoid excessive segment and decision-point complexity.");
  }

  if (input.estimatedDifficulty !== input.selectedDifficulty) {
    warnings.push(`Route metrics currently estimate ${input.estimatedDifficulty} difficulty.`);
  }

  return [...new Set(warnings)];
}

function approvalWarning(input: {
  status: CuratedTrainingRouteStatus;
  validation: LearnerRouteValidationResult;
  validationHasRun: boolean;
}): TrainingRouteAuthorApprovalWarning | null {
  if (input.status !== "approved") {
    return null;
  }

  if (!input.validationHasRun) {
    return {
      blocking: true,
      message: "Approved routes must be validated before export."
    };
  }

  if (!input.validation.valid) {
    return {
      blocking: true,
      message: "Invalid routes cannot be marked approved. Fix blocking validation errors or keep this route in draft/beta."
    };
  }

  if (input.validation.status === "warning") {
    return {
      blocking: false,
      message: "This route can be approved only after an instructor reviews advisory warnings."
    };
  }

  return null;
}

function unknownComparison(explanation: string): CuratedShortestRouteComparisonDetail {
  return {
    comparisonStatus: "unknown",
    verdict: "unknown",
    explanation,
    authoredLengthMeters: null,
    shortestLengthMeters: null,
    lengthDeltaMeters: null,
    percentageLonger: null,
    authoredSegmentCount: null,
    shortestSegmentCount: null,
    segmentCountDelta: null,
    authoredTurnCount: null,
    shortestTurnCount: null,
    turnCountDelta: null,
    authoredDecisionPointCount: null,
    shortestDecisionPointCount: null,
    decisionPointDelta: null,
    shortestRouteSegmentIds: []
  };
}

function notApplicableComparison(explanation: string): CuratedShortestRouteComparisonDetail {
  return {
    ...unknownComparison(explanation),
    comparisonStatus: "not-applicable"
  };
}

export function classifyShortestRouteComparison(input: {
  authoredLengthMeters: number;
  shortestLengthMeters: number;
  authoredSegmentCount: number;
  shortestSegmentCount: number;
  authoredTurnCount: number;
  shortestTurnCount: number;
  authoredDecisionPointCount: number;
  shortestDecisionPointCount: number;
  shortestRouteSegmentIds?: readonly string[];
}): CuratedShortestRouteComparisonDetail {
  if (!Number.isFinite(input.authoredLengthMeters) || !Number.isFinite(input.shortestLengthMeters)) {
    return unknownComparison("Route length data is incomplete, so shortest-route efficiency is advisory only.");
  }

  if (input.shortestLengthMeters <= 0) {
    return unknownComparison("The shortest route length is zero or unavailable, so route efficiency cannot be compared.");
  }

  const lengthDeltaMeters = input.authoredLengthMeters - input.shortestLengthMeters;
  const percentageLonger = (lengthDeltaMeters / input.shortestLengthMeters) * 100;
  const roundedPercentage = Math.round(percentageLonger * 10) / 10;
  let verdict: CuratedShortestRouteComparisonDetail["verdict"] = "shortest-or-near-shortest";

  if (percentageLonger >= 50) {
    verdict = "major-detour-warning";
  } else if (percentageLonger >= 25) {
    verdict = "detour-warning";
  } else if (percentageLonger > 10) {
    verdict = "acceptable-training-variation";
  }

  const verdictText: Record<Exclude<CuratedShortestRouteComparisonDetail["verdict"], "unknown">, string> = {
    "shortest-or-near-shortest": "near-shortest",
    "acceptable-training-variation": "an acceptable training variation",
    "detour-warning": "a detour warning",
    "major-detour-warning": "a major detour warning"
  };

  return {
    comparisonStatus: "available",
    verdict,
    explanation: `The authored route is ${roundedPercentage}% longer than the shortest legal route, which is ${verdictText[verdict]}.`,
    authoredLengthMeters: Math.round(input.authoredLengthMeters),
    shortestLengthMeters: Math.round(input.shortestLengthMeters),
    lengthDeltaMeters: Math.round(lengthDeltaMeters),
    percentageLonger: roundedPercentage,
    authoredSegmentCount: input.authoredSegmentCount,
    shortestSegmentCount: input.shortestSegmentCount,
    segmentCountDelta: input.authoredSegmentCount - input.shortestSegmentCount,
    authoredTurnCount: input.authoredTurnCount,
    shortestTurnCount: input.shortestTurnCount,
    turnCountDelta: input.authoredTurnCount - input.shortestTurnCount,
    authoredDecisionPointCount: input.authoredDecisionPointCount,
    shortestDecisionPointCount: input.shortestDecisionPointCount,
    decisionPointDelta: input.authoredDecisionPointCount - input.shortestDecisionPointCount,
    shortestRouteSegmentIds: [...(input.shortestRouteSegmentIds ?? [])]
  };
}

function directShortestResult(input: {
  graph: MapGraph;
  stopNodeIds: readonly string[];
  restrictions: MapDefinition["restrictions"];
}): ShortestLegalRouteResult {
  const startNodeId = input.stopNodeIds[0];
  const endNodeId = input.stopNodeIds[input.stopNodeIds.length - 1];

  if (!startNodeId || !endNodeId) {
    return {
      found: false,
      startNodeId: startNodeId ?? "unknown-start",
      endNodeId: endNodeId ?? "unknown-destination",
      reason: "INVALID_START_NODE"
    };
  }

  return findShortestLegalRoute({
    graph: input.graph,
    startNodeId,
    endNodeId,
    restrictions: input.restrictions
  });
}

function comparisonFromShortestRoute(input: {
  map: MapDefinition;
  graph: MapGraph;
  authoredValidation: LearnerRouteValidationResult;
  authoredRouteIsValid: boolean;
  difficulty: Exclude<ExerciseDifficulty, "easy">;
  shortestRoute: ShortestLegalRouteResult | ShortestLegalRouteThroughStopsResult;
  missingRouteExplanation: string;
}): CuratedShortestRouteComparisonDetail {
  if (!input.authoredRouteIsValid) {
    return unknownComparison("The authored route is invalid or incomplete, so shortest-route comparison is advisory only.");
  }

  if (!input.shortestRoute.found) {
    return unknownComparison(input.missingRouteExplanation);
  }

  const shortestSegments = validationSegmentsFromRoadsAndNodes({
    graph: input.graph,
    roadIds: input.shortestRoute.roadIds,
    nodeIds: input.shortestRoute.nodeIds
  });
  const shortestValidation = validationMetrics({
    map: input.map,
    routeSegments: shortestSegments,
    difficulty: input.difficulty
  });

  return classifyShortestRouteComparison({
    authoredLengthMeters: input.authoredValidation.metrics.routeDistanceMeters,
    shortestLengthMeters: input.shortestRoute.distanceMeters,
    authoredSegmentCount: input.authoredValidation.metrics.segmentCount,
    shortestSegmentCount: shortestValidation.metrics.segmentCount,
    authoredTurnCount: input.authoredValidation.metrics.turnCount,
    shortestTurnCount: shortestValidation.metrics.turnCount,
    authoredDecisionPointCount: input.authoredValidation.metrics.junctionDecisionCount,
    shortestDecisionPointCount: shortestValidation.metrics.junctionDecisionCount,
    shortestRouteSegmentIds: input.shortestRoute.edgeIds
  });
}

function buildShortestRouteComparison(input: {
  map: MapDefinition;
  graph: MapGraph;
  stopNodeIds: readonly string[];
  authoredValidation: LearnerRouteValidationResult;
  authoredRouteIsValid: boolean;
  difficulty: Exclude<ExerciseDifficulty, "easy">;
  routeChoiceJustification: string;
  comparisonHasRun: boolean;
}): CuratedShortestRouteComparison {
  if (!input.comparisonHasRun) {
    const comparison = unknownComparison("Shortest route comparison has not been run for the current authored route.");

    return {
      directComparison: comparison,
      checkpointConstrainedComparison: notApplicableComparison("Checkpoint-constrained comparison has not been run."),
      routeChoiceJustification: input.routeChoiceJustification,
      requiresRouteChoiceJustification: false,
      guidance: [
        "Select start, draw a route, set destination, then run the shortest-route comparison before export."
      ]
    };
  }

  const directRoute = directShortestResult({
    graph: input.graph,
    stopNodeIds: input.stopNodeIds,
    restrictions: input.map.restrictions
  });
  const checkpointRoute =
    input.stopNodeIds.length > 2
      ? findShortestLegalRouteThroughStops({
          graph: input.graph,
          stopNodeIds: [...input.stopNodeIds],
          restrictions: input.map.restrictions
        })
      : null;
  const directComparison = comparisonFromShortestRoute({
    map: input.map,
    graph: input.graph,
    authoredValidation: input.authoredValidation,
    authoredRouteIsValid: input.authoredRouteIsValid,
    difficulty: input.difficulty,
    shortestRoute: directRoute,
    missingRouteExplanation: "No direct legal shortest route can be proven from the available map graph."
  });
  const checkpointConstrainedComparison = checkpointRoute
    ? comparisonFromShortestRoute({
        map: input.map,
        graph: input.graph,
        authoredValidation: input.authoredValidation,
        authoredRouteIsValid: input.authoredRouteIsValid,
        difficulty: input.difficulty,
        shortestRoute: checkpointRoute,
        missingRouteExplanation: "No checkpoint-constrained legal shortest route can be proven from the available map graph."
      })
    : notApplicableComparison("Checkpoint-constrained comparison is not needed because this route has no intermediate checkpoints.");
  const requiresRouteChoiceJustification =
    directComparison.verdict === "detour-warning" ||
    directComparison.verdict === "major-detour-warning" ||
    checkpointConstrainedComparison.verdict === "detour-warning" ||
    checkpointConstrainedComparison.verdict === "major-detour-warning";

  return {
    directComparison,
    checkpointConstrainedComparison,
    routeChoiceJustification: input.routeChoiceJustification,
    requiresRouteChoiceJustification,
    guidance: [
      "A training route does not need to be shortest if the objective justifies the route choice.",
      "Beginner routes should usually stay close to shortest unless they are teaching checkpoint navigation.",
      "Advanced routes may be longer when they deliberately practise complex junction or recovery decisions.",
      "Major detours should include an instructor route-choice note before beta or approved status."
    ]
  };
}

function shortestRoutePoints(input: {
  map: MapDefinition;
  graph: MapGraph;
  stopNodeIds: readonly string[];
  comparisonHasRun: boolean;
}): Vec2[] {
  if (!input.comparisonHasRun) {
    return [];
  }

  if (input.stopNodeIds.length > 2) {
    const checkpointRoute = findShortestLegalRouteThroughStops({
      graph: input.graph,
      stopNodeIds: [...input.stopNodeIds],
      restrictions: input.map.restrictions
    });

    return checkpointRoute.found ? pointsForNodeIds(input.map, checkpointRoute.nodeIds) : [];
  }

  const directRoute = directShortestResult({
    graph: input.graph,
    stopNodeIds: input.stopNodeIds,
    restrictions: input.map.restrictions
  });

  return directRoute.found ? pointsForNodeIds(input.map, directRoute.nodeIds) : [];
}

function invalidateReviewState(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return {
    ...state,
    validationHasRun: false,
    comparisonHasRun: false
  };
}

function refreshRouteMatch(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  const trace = routeDraftToDrawnRouteTrace(state.routeDraft);

  if (trace.points.length === 0) {
    return {
      ...invalidateReviewState(state),
      routeMatchStatus: "empty",
      routeMatchMessage: "No route has been drawn.",
      routeNodeIds: [],
      roadIds: [],
      validationSegments: [],
      snappedRoutePoints: []
    };
  }

  const gestureValidation = validateDrawnRouteGesture(trace, {
    minimumRawPointCount: 3,
    minimumTotalDistance: 10
  });

  if (!gestureValidation.isMeaningful) {
    return {
      ...invalidateReviewState(state),
      routeMatchStatus: "insufficient",
      routeMatchMessage:
        gestureValidation.failureReason === "not_enough_movement"
          ? "The drawn route is too short to snap to roads."
          : "Draw at least three route points before matching.",
      routeNodeIds: [],
      roadIds: [],
      validationSegments: [],
      snappedRoutePoints: []
    };
  }

  const map = realLondonOsmPilotRouteMap;
  const graph = buildMapGraph(map);
  const snappedRoute = snapDrawnRouteToRoads({
    map,
    points: trace.points,
    snapTolerance: TRAINING_ROUTE_AUTHOR_SNAP_TOLERANCE,
    maxCandidatesPerPoint: 5
  });

  if (!snappedRoute.isValidTrace || snappedRoute.hasOffRoadPoints) {
    return {
      ...invalidateReviewState(state),
      routeMatchStatus: "snapping-failed",
      routeMatchMessage: snappedRoute.diagnostics[0]?.message ?? "The drawn route could not be snapped to Real London roads.",
      routeNodeIds: [],
      roadIds: [],
      validationSegments: [],
      snappedRoutePoints: snappedRoute.snappedPoints.map((point) => point.snappedPoint)
    };
  }

  const matchResult = matchSnappedRouteToSelection({
    map,
    snappedRoute,
    options: {
      minimumSnappedPoints: 2
    }
  });

  if (matchResult.status !== "matched" || !matchResult.isReadyForRunRouteExercise) {
    return {
      ...invalidateReviewState(state),
      routeMatchStatus: "matching-failed",
      routeMatchMessage: matchResult.diagnostics[0]?.message ?? "The snapped road sequence is not a connected route.",
      routeNodeIds: matchResult.nodeIds,
      roadIds: matchResult.orderedRoadIds,
      validationSegments: [],
      snappedRoutePoints: snappedRoute.snappedPoints.map((point) => point.snappedPoint)
    };
  }

  return {
    ...invalidateReviewState(state),
    routeMatchStatus: "matched",
    routeMatchMessage: `Matched ${matchResult.orderedRoadIds.length} road segment(s) from the current drawing.`,
    routeNodeIds: matchResult.nodeIds,
    roadIds: matchResult.orderedRoadIds,
    validationSegments: validationSegmentsFromRoadsAndNodes({
      graph,
      roadIds: matchResult.orderedRoadIds,
      nodeIds: matchResult.nodeIds
    }),
    snappedRoutePoints: snappedRoute.snappedPoints.map((point) => point.snappedPoint)
  };
}

export function createEmptyTrainingRouteAuthorState(): TrainingRouteAuthorState {
  return {
    activeMode: "pan",
    metadata: metadataForNewRoute(),
    startNodeId: null,
    destinationNodeId: null,
    checkpointNodeIds: [],
    routeDraft: createEmptyRouteDraft(),
    routeMatchStatus: "empty",
    routeMatchMessage: "No route has been drawn.",
    routeNodeIds: [],
    roadIds: [],
    validationSegments: [],
    snappedRoutePoints: [],
    validationHasRun: false,
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function createSampleTrainingRouteAuthorState(): TrainingRouteAuthorState {
  if (!DEFAULT_ROUTE_EXERCISE) {
    return createEmptyTrainingRouteAuthorState();
  }

  const map = realLondonOsmPilotRouteMap;
  const graph = buildMapGraph(map);
  const stopNodeIds = selectedStopNodeIds(DEFAULT_ROUTE_EXERCISE, map);
  const shortestRoute = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds,
    restrictions: map.restrictions
  });
  const nodeIds = shortestRoute.found ? shortestRoute.nodeIds : stopNodeIds;
  const roadIds = shortestRoute.found ? shortestRoute.roadIds : [];
  const routePoints = pointsForNodeIds(map, nodeIds);
  const state: TrainingRouteAuthorState = {
    ...createEmptyTrainingRouteAuthorState(),
    metadata: metadataForExercise(DEFAULT_ROUTE_EXERCISE),
    startNodeId: stopNodeIds[0] ?? null,
    destinationNodeId: stopNodeIds.at(-1) ?? null,
    checkpointNodeIds: stopNodeIds.slice(1, -1),
    routeDraft: createEmptyRouteDraft(routePoints.length > 0 ? [routePoints] : []),
    routeMatchStatus: roadIds.length > 0 ? "matched" : "empty",
    routeMatchMessage:
      roadIds.length > 0
        ? "Loaded sample route from the Real London pilot exercise. Edit before export."
        : "Sample route could not be matched.",
    routeNodeIds: nodeIds,
    roadIds,
    validationSegments: validationSegmentsFromRoadsAndNodes({ graph, roadIds, nodeIds }),
    snappedRoutePoints: routePoints,
    sampleLoaded: true
  };

  return state;
}

export function getTrainingRouteAuthorMap(): MapDefinition {
  return realLondonOsmPilotRouteMap;
}

export function resolveNearestTrainingRouteAuthorNodeSnap(
  point: Vec2,
  tolerance = 80
): TrainingRouteAuthorNodeSnapResult | null {
  const map = realLondonOsmPilotRouteMap;
  const graph = buildMapGraph(map);
  const candidates = findCandidateRoadsForPoint({
    point,
    index: buildRoadSpatialIndex(map),
    tolerance,
    maxCandidates: 1
  });
  const candidate = candidates[0];
  const road = candidate ? graph.roadsById[candidate.roadId] : null;

  if (!candidate || !road) {
    return null;
  }

  const from = graph.nodesById[road.fromNodeId];
  const to = graph.nodesById[road.toNodeId];

  if (!from || !to) {
    return null;
  }

  const fromDistance = Math.hypot(point.x - from.x, point.y - from.y);
  const toDistance = Math.hypot(point.x - to.x, point.y - to.y);
  const node = fromDistance <= toDistance ? from : to;
  const nodeDistance = Math.min(fromDistance, toDistance);

  return {
    node,
    roadId: road.id,
    roadName: road.name,
    roadPoint: { ...candidate.projection.point },
    nodePoint: { x: node.x, y: node.y },
    roadDistance: candidate.distanceFromRoad,
    nodeDistance
  };
}

export function resolveNearestTrainingRouteAuthorNode(point: Vec2, tolerance = 80): MapNode | null {
  return resolveNearestTrainingRouteAuthorNodeSnap(point, tolerance)?.node ?? null;
}

export function setTrainingRouteAuthorMode(
  state: TrainingRouteAuthorState,
  activeMode: TrainingRouteAuthorMode
): TrainingRouteAuthorState {
  return {
    ...state,
    activeMode,
    routeDraft:
      state.routeDraft.activeStrokeIndex === null ? state.routeDraft : finishRouteStroke(state.routeDraft)
  };
}

export function setTrainingRouteAuthorStart(
  state: TrainingRouteAuthorState,
  nodeId: string
): TrainingRouteAuthorState {
  return {
    ...state,
    startNodeId: nodeId,
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function setTrainingRouteAuthorDestination(
  state: TrainingRouteAuthorState,
  nodeId: string
): TrainingRouteAuthorState {
  return {
    ...state,
    destinationNodeId: nodeId,
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function addTrainingRouteAuthorCheckpoint(
  state: TrainingRouteAuthorState,
  nodeId: string
): TrainingRouteAuthorState {
  return {
    ...state,
    checkpointNodeIds: [...state.checkpointNodeIds, nodeId],
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function removeLastTrainingRouteAuthorCheckpoint(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return {
    ...state,
    checkpointNodeIds: state.checkpointNodeIds.slice(0, -1),
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function clearTrainingRouteAuthorCheckpoints(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return {
    ...state,
    checkpointNodeIds: [],
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function startTrainingRouteAuthorStroke(
  state: TrainingRouteAuthorState,
  point: Vec2
): TrainingRouteAuthorState {
  return {
    ...state,
    routeDraft: startRouteStroke(state.routeDraft, point),
    sampleLoaded: false
  };
}

export function appendTrainingRouteAuthorStrokePoint(
  state: TrainingRouteAuthorState,
  point: Vec2
): TrainingRouteAuthorState {
  return {
    ...state,
    routeDraft: appendRouteDraftPoint(state.routeDraft, point, 3),
    sampleLoaded: false
  };
}

export function finishTrainingRouteAuthorStroke(
  state: TrainingRouteAuthorState,
  point?: Vec2
): TrainingRouteAuthorState {
  const draft = finishRouteStroke(point ? appendRouteDraftPoint(state.routeDraft, point, 3) : state.routeDraft);

  return refreshRouteMatch({
    ...state,
    routeDraft: draft,
    sampleLoaded: false
  });
}

export function undoTrainingRouteAuthorAction(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  if (state.routeDraft.strokes.length > 0) {
    return refreshRouteMatch({
      ...state,
      routeDraft: undoLastRouteStroke(state.routeDraft),
      sampleLoaded: false
    });
  }

  if (state.checkpointNodeIds.length > 0) {
    return removeLastTrainingRouteAuthorCheckpoint(state);
  }

  if (state.destinationNodeId) {
    return {
      ...state,
      destinationNodeId: null,
      comparisonHasRun: false,
      sampleLoaded: false
    };
  }

  return {
    ...state,
    startNodeId: null,
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function clearTrainingRouteAuthorRoute(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return refreshRouteMatch({
    ...state,
    routeDraft: createEmptyRouteDraft(),
    sampleLoaded: false
  });
}

export function validateTrainingRouteAuthorState(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return {
    ...state,
    validationHasRun: true
  };
}

export function compareTrainingRouteAuthorShortestRoute(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return {
    ...state,
    comparisonHasRun: true
  };
}

export function updateTrainingRouteAuthorMetadataField(
  state: TrainingRouteAuthorState,
  fieldId: keyof CuratedTrainingRouteMetadata,
  value: string
): TrainingRouteAuthorState {
  const metadata = { ...state.metadata };

  if (ARRAY_METADATA_FIELDS.has(fieldId)) {
    (metadata[fieldId] as string[]) = value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  } else if (fieldId === "areaId") {
    const selectedArea = getTrainingRouteAuthorAreaOption(value);

    if (selectedArea) {
      Object.assign(metadata, metadataAreaFieldsForOption(selectedArea));
    } else {
      metadata.areaId = value;
      metadata.practiceMapId = "";
      metadata.areaName = "";
      metadata.area = "";
      metadata.sourceFixture = undefined;
    }

    return {
      ...state,
      metadata,
      validationHasRun: false,
      comparisonHasRun: false
    };
  } else if (fieldId === "difficulty") {
    metadata.difficulty = value as CuratedTrainingRouteMetadata["difficulty"];
    return {
      ...state,
      metadata,
      validationHasRun: false,
      comparisonHasRun: false
    };
  } else if (fieldId === "exerciseType") {
    metadata.exerciseType = value as CuratedTrainingRouteMetadata["exerciseType"];
  } else if (fieldId === "status") {
    metadata.status = value as CuratedTrainingRouteMetadata["status"];
  } else {
    (metadata[fieldId] as string) = value;
  }

  return {
    ...state,
    metadata
  };
}

function buildToolbarActions(input: {
  activeMode: TrainingRouteAuthorMode;
  canUndo: boolean;
  canRemoveCheckpoint: boolean;
  canClearRoute: boolean;
  canClearCheckpoints: boolean;
  exportReady: boolean;
}): TrainingRouteAuthorToolbarAction[] {
  return [
    { id: "pan", label: "Pan", pressed: input.activeMode === "pan" },
    { id: "set-start", label: "Set start", primary: true, pressed: input.activeMode === "set-start" },
    { id: "draw-route", label: "Draw route", primary: true, pressed: input.activeMode === "draw-route" },
    { id: "add-checkpoint", label: "Add checkpoint", pressed: input.activeMode === "add-checkpoint" },
    { id: "set-destination", label: "Set destination", primary: true, pressed: input.activeMode === "set-destination" },
    { id: "undo", label: "Undo", disabled: !input.canUndo },
    { id: "remove-last-checkpoint", label: "Remove last checkpoint", disabled: !input.canRemoveCheckpoint },
    { id: "clear-route", label: "Clear route", disabled: !input.canClearRoute },
    { id: "clear-checkpoints", label: "Clear checkpoints", disabled: !input.canClearCheckpoints },
    { id: "reset-view", label: "Reset view" },
    { id: "validate-route", label: "Validate route", primary: true },
    { id: "compare-shortest-route", label: "Compare shortest route", primary: true },
    { id: "export-json", label: "Export JSON", primary: true, disabled: !input.exportReady }
  ];
}

function buildAuthoringSteps(input: {
  hasStart: boolean;
  hasUsableRoute: boolean;
  hasMatchedRoute: boolean;
  checkpointCount: number;
  checkpointsRequired: boolean;
  hasDestination: boolean;
  validationHasRun: boolean;
  validation: LearnerRouteValidationResult;
  comparisonHasRun: boolean;
  exportReady: boolean;
}): TrainingRouteAuthorStep[] {
  const steps = [
    {
      index: 1,
      label: "Set start",
      complete: input.hasStart,
      instruction: "Click Set start, then click a valid road/node on the Real London map."
    },
    {
      index: 2,
      label: "Draw route",
      complete: input.hasUsableRoute,
      instruction: "Switch to Draw route and trace the intended learner route on the roads."
    },
    {
      index: 3,
      label: "Add checkpoints if needed",
      complete: !input.checkpointsRequired || input.checkpointCount > 0,
      optional: !input.checkpointsRequired,
      instruction: input.checkpointsRequired
        ? `${input.checkpointCount} checkpoint(s) selected. Add at least one checkpoint for this exercise type.`
        : `${input.checkpointCount} checkpoint(s) selected. Add checkpoints only when the exercise needs them.`
    },
    {
      index: 4,
      label: "Set destination",
      complete: input.hasDestination,
      instruction: "Click Set destination, then click the final road/node for the route."
    },
    {
      index: 5,
      label: "Validate",
      complete: input.validationHasRun && input.validation.blockingErrors.length === 0,
      instruction: input.hasMatchedRoute
        ? "Validate the current authored route and resolve any blocking errors."
        : "Validate now to list missing or unmatched route requirements."
    },
    {
      index: 6,
      label: "Compare shortest route",
      complete: input.comparisonHasRun,
      instruction: "Compare with the shortest legal route between the selected route points."
    },
    {
      index: 7,
      label: "Export",
      complete: input.exportReady,
      instruction: "Export only when route data, metadata, validation, and comparison are ready."
    }
  ];
  const currentIndex = steps.findIndex((step) => !step.complete && !step.optional);

  return steps.map((step, index) => ({
    ...step,
    current: index === (currentIndex === -1 ? steps.length - 1 : currentIndex)
  }));
}

function buildExportReadiness(input: {
  metadata: CuratedTrainingRouteMetadata;
  hasStart: boolean;
  hasDestination: boolean;
  checkpointsRequired: boolean;
  checkpointCount: number;
  hasRoute: boolean;
  validation: LearnerRouteValidationResult;
  validationHasRun: boolean;
  comparisonHasRun: boolean;
  comparison: CuratedShortestRouteComparison;
  approvalWarning: TrainingRouteAuthorApprovalWarning | null;
}): TrainingRouteAuthorExportReadiness {
  const hasRequiredMetadata = hasRequiredTrainingRouteMetadata(input.metadata);
  const hasSelectedArea = trainingRouteAuthorAreaSelectionIsValid(input.metadata);
  const requiresRouteChoiceJustification =
    input.comparison.requiresRouteChoiceJustification ||
    input.comparison.directComparison.verdict === "major-detour-warning" ||
    input.comparison.checkpointConstrainedComparison.verdict === "major-detour-warning";
  const routeChoiceJustificationComplete =
    !requiresRouteChoiceJustification || Boolean(input.metadata.routeChoiceJustification.trim());
  const checklist = [
    { label: "Start selected", complete: input.hasStart },
    { label: "Destination selected", complete: input.hasDestination },
    { label: "Required checkpoints selected", complete: !input.checkpointsRequired || input.checkpointCount > 0 },
    { label: "Route drawn and matched", complete: input.hasRoute },
    { label: "Practice map or training area selected", complete: hasSelectedArea },
    { label: "Required metadata complete", complete: hasRequiredMetadata },
    { label: "Validation has run", complete: input.validationHasRun },
    {
      label: "Validation has no blocking errors",
      complete: input.validationHasRun && input.validation.valid && input.validation.blockingErrors.length === 0
    },
    { label: "Shortest-route comparison has run", complete: input.comparisonHasRun },
    { label: "Route choice justification complete when required", complete: routeChoiceJustificationComplete },
    { label: "Approved status is allowed", complete: !input.approvalWarning?.blocking }
  ];

  return {
    ready: checklist.every((item) => item.complete),
    suggestedFilename: curatedTrainingRouteFilename({
      metadata: input.metadata,
      saveMode: "complete-route"
    }),
    checklist
  };
}

function buildSaveTarget(input: {
  mode: CuratedTrainingRouteSaveMode;
  metadata: CuratedTrainingRouteMetadata;
  hasStart: boolean;
  hasDestination: boolean;
  checkpointsRequired: boolean;
  checkpointCount: number;
  hasRoute: boolean;
  validation: LearnerRouteValidationResult;
  validationHasRun: boolean;
  comparisonHasRun: boolean;
  comparison: CuratedShortestRouteComparison;
  approvalWarning: TrainingRouteAuthorApprovalWarning | null;
}): TrainingRouteAuthorSaveTarget {
  const hasRequiredMetadata = hasRequiredTrainingRouteMetadata(input.metadata);
  const hasSelectedArea = trainingRouteAuthorAreaSelectionIsValid(input.metadata);
  const requiresRouteChoiceJustification =
    input.comparison.requiresRouteChoiceJustification ||
    input.comparison.directComparison.verdict === "major-detour-warning" ||
    input.comparison.checkpointConstrainedComparison.verdict === "major-detour-warning";
  const routeChoiceJustificationComplete =
    !requiresRouteChoiceJustification || Boolean(input.metadata.routeChoiceJustification.trim());
  const baseChecklist = [
    { label: "Route id is safe and present", complete: Boolean(input.metadata.routeId.trim()) },
    { label: "Title is present", complete: Boolean(input.metadata.title.trim()) },
    { label: "Practice map or training area selected", complete: hasSelectedArea }
  ];
  const workingDraftChecklist = [
    ...baseChecklist,
    { label: "Approved routes use Save complete route", complete: input.metadata.status !== "approved" }
  ];
  const reviewChecklist = [
    ...baseChecklist,
    { label: "Start selected", complete: input.hasStart },
    { label: "Destination selected", complete: input.hasDestination },
    { label: "Required checkpoints selected", complete: !input.checkpointsRequired || input.checkpointCount > 0 },
    { label: "Route drawn and matched", complete: input.hasRoute },
    { label: "Required metadata complete", complete: hasRequiredMetadata },
    { label: "Validation has run", complete: input.validationHasRun }
  ];
  const completeChecklist = [
    ...reviewChecklist,
    {
      label: "Validation has no blocking errors",
      complete:
        input.validationHasRun &&
        input.validation.valid &&
        input.validation.status !== "invalid" &&
        input.validation.blockingErrors.length === 0
    },
    { label: "Shortest-route comparison has run", complete: input.comparisonHasRun },
    { label: "Route choice justification complete when required", complete: routeChoiceJustificationComplete },
    { label: "Status is beta or approved", complete: input.metadata.status === "beta" || input.metadata.status === "approved" },
    { label: "Approved status is allowed", complete: !input.approvalWarning?.blocking }
  ];
  const checklist =
    input.mode === "working-draft" ? workingDraftChecklist : input.mode === "review-candidate" ? reviewChecklist : completeChecklist;
  const suggestedFilename = curatedTrainingRouteFilename({
    metadata: input.metadata,
    saveMode: input.mode
  });
  const ready = checklist.every((item) => item.complete);

  return {
    mode: input.mode,
    label: CURATED_TRAINING_ROUTE_SAVE_MODE_LABELS[input.mode],
    actionLabel: CURATED_TRAINING_ROUTE_SAVE_MODE_LABELS[input.mode],
    ready,
    unavailableMessage: ready ? null : unavailableMessageForSaveMode(input.mode, checklist),
    jsonStatus: statusForCuratedTrainingRouteSaveMode({
      saveMode: input.mode,
      status: input.metadata.status
    }),
    lifecycleStage: lifecycleStageForCuratedTrainingRouteSaveMode(input.mode),
    suggestedFilename,
    relativePath: curatedTrainingRouteRelativePath({
      metadata: input.metadata,
      saveMode: input.mode
    }),
    directory: CURATED_TRAINING_ROUTE_SAVE_MODE_DIRECTORIES[input.mode],
    learnerFacingLater: input.mode === "complete-route" && (input.metadata.status === "beta" || input.metadata.status === "approved"),
    checklist
  };
}

function saveTargetToReadiness(target: TrainingRouteAuthorSaveTarget): TrainingRouteAuthorDraftSaveReadiness {
  return {
    ready: target.ready,
    suggestedFilename: target.suggestedFilename,
    checklist: target.checklist
  };
}

function unavailableMessageForSaveMode(
  mode: CuratedTrainingRouteSaveMode,
  checklist: readonly { label: string; complete: boolean }[]
): string | null {
  const missingItem = checklist.find((item) => !item.complete);

  if (!missingItem) {
    return null;
  }

  if (missingItem.label === "Practice map or training area selected") {
    return `${CURATED_TRAINING_ROUTE_SAVE_MODE_LABELS[mode]} unavailable: Select a practice map or training area.`;
  }

  return `${CURATED_TRAINING_ROUTE_SAVE_MODE_LABELS[mode]} unavailable: ${missingItem.label.charAt(0).toLowerCase()}${missingItem.label.slice(1)}.`;
}

function routeStatusSummary(input: {
  hasUsableRoute: boolean;
  hasMatchedRoute: boolean;
  routeMatchStatus: TrainingRouteAuthorRouteMatchStatus;
}): Pick<TrainingRouteAuthorStatusItem, "value" | "state"> {
  if (input.hasMatchedRoute) {
    return { value: "matched", state: "complete" };
  }

  if (!input.hasUsableRoute) {
    return { value: "missing", state: "missing" };
  }

  if (input.routeMatchStatus === "snapping-failed") {
    return { value: "drawn", state: "warning" };
  }

  if (input.routeMatchStatus === "matching-failed") {
    return { value: "snapped", state: "warning" };
  }

  return { value: "drawn", state: "ready" };
}

function buildRouteStatusItems(input: {
  hasStart: boolean;
  hasDestination: boolean;
  checkpointsRequired: boolean;
  checkpointCount: number;
  hasUsableRoute: boolean;
  hasMatchedRoute: boolean;
  routeMatchStatus: TrainingRouteAuthorRouteMatchStatus;
  validationHasRun: boolean;
  validation: LearnerRouteValidationResult;
  comparisonHasRun: boolean;
  comparison: CuratedShortestRouteComparison;
  exportReady: boolean;
}): TrainingRouteAuthorStatusItem[] {
  const comparisonValue = input.comparisonHasRun ? input.comparison.directComparison.verdict : "not run";
  const routeStatus = routeStatusSummary({
    hasUsableRoute: input.hasUsableRoute,
    hasMatchedRoute: input.hasMatchedRoute,
    routeMatchStatus: input.routeMatchStatus
  });

  return [
    { label: "Start", value: input.hasStart ? "selected" : "missing", state: input.hasStart ? "complete" : "missing" },
    {
      label: "Destination",
      value: input.hasDestination ? "selected" : "missing",
      state: input.hasDestination ? "complete" : "missing"
    },
    {
      label: "Route",
      value: routeStatus.value,
      state: routeStatus.state
    },
    {
      label: "Checkpoints",
      value: input.checkpointsRequired
        ? `${input.checkpointCount} required`
        : `${input.checkpointCount}`,
      state: input.checkpointCount > 0 ? "complete" : input.checkpointsRequired ? "missing" : "ready"
    },
    {
      label: "Validation",
      value: input.validationHasRun ? input.validation.status : "not run",
      state: input.validationHasRun
        ? input.validation.valid
          ? "complete"
          : input.validation.status === "warning"
            ? "warning"
            : "missing"
        : "missing"
    },
    {
      label: "Shortest comparison",
      value: comparisonValue,
      state: input.comparisonHasRun
        ? input.comparison.directComparison.verdict.includes("warning")
          ? "warning"
          : "complete"
        : "missing"
    },
    { label: "Export", value: input.exportReady ? "ready" : "not ready", state: input.exportReady ? "ready" : "missing" }
  ];
}

export function buildTrainingRouteAuthorModel(input?: {
  state?: TrainingRouteAuthorState;
  statusOverride?: CuratedTrainingRouteStatus;
  routeChoiceJustification?: string;
  difficultyOverride?: Exclude<ExerciseDifficulty, "easy">;
}): TrainingRouteAuthorModel {
  const sourceMap = realLondonOsmPilotRouteMap;
  const graph = buildMapGraph(sourceMap);
  const baseState = input?.state ?? createEmptyTrainingRouteAuthorState();
  const baseMetadata = normaliseTrainingRouteAuthorMetadataArea(baseState.metadata);
  const metadata: CuratedTrainingRouteMetadata = {
    ...baseMetadata,
    difficulty: input?.difficultyOverride ?? baseMetadata.difficulty,
    routeChoiceJustification: input?.routeChoiceJustification ?? baseMetadata.routeChoiceJustification,
    status: input?.statusOverride ?? baseMetadata.status
  };
  const selectedArea = getTrainingRouteAuthorAreaOption(metadata.areaId);
  const suggestedRouteId = suggestCuratedTrainingRouteId(metadata);
  const effectiveRouteId = effectiveCuratedTrainingRouteId(metadata);
  const exportMetadata: CuratedTrainingRouteMetadata = {
    ...metadata,
    routeId: effectiveRouteId
  };
  const hasStart = Boolean(baseState.startNodeId);
  const hasDestination = Boolean(baseState.destinationNodeId);
  const rawRoutePoints = routeDraftToDrawnRouteTrace(baseState.routeDraft).points;
  const hasUsableRoute = rawRoutePoints.length >= 2 || routeDraftHasUsablePoints(baseState.routeDraft);
  const hasMatchedRoute = baseState.validationSegments.length > 0 && baseState.routeMatchStatus === "matched";
  const checkpointsRequired = trainingRouteAuthorCheckpointsRequired(exportMetadata);
  const baseValidation = validationMetrics({
    map: sourceMap,
    routeSegments: baseState.validationSegments,
    difficulty: exportMetadata.difficulty
  });
  const validation = validationWithAuthoringRequirements({
    validation: baseValidation,
    requirementIssues: authoringValidationIssues({
      state: baseState,
      metadata: exportMetadata,
      hasMatchedRoute,
      hasUsableRoute,
      checkpointsRequired
    })
  });
  const validationForDisplay = baseState.validationHasRun ? validation : EMPTY_VALIDATION;
  const selectedStopNodeIds = [
    baseState.startNodeId,
    ...baseState.checkpointNodeIds,
    baseState.destinationNodeId
  ].filter((nodeId): nodeId is string => Boolean(nodeId));
  const shortestRouteComparison = buildShortestRouteComparison({
    map: sourceMap,
    graph,
    stopNodeIds: selectedStopNodeIds,
    authoredValidation: validation,
    authoredRouteIsValid: validation.valid && baseState.validationSegments.length > 0,
    difficulty: exportMetadata.difficulty,
    routeChoiceJustification: exportMetadata.routeChoiceJustification,
    comparisonHasRun: baseState.comparisonHasRun
  });
  const estimatedDifficulty = inferDifficultyFromMetrics(validation, exportMetadata.difficulty);
  const complexitySummary: CuratedTrainingRouteComplexitySummary = {
    approximateRouteLengthMeters: Math.round(validation.metrics.routeDistanceMeters),
    segmentCount: validation.metrics.segmentCount,
    turnCount: validation.metrics.turnCount,
    decisionPointCount: validation.metrics.junctionDecisionCount,
    checkpointCount: baseState.checkpointNodeIds.length,
    estimatedDifficulty,
    warnings: complexityWarnings({
      validation,
      selectedDifficulty: exportMetadata.difficulty,
      estimatedDifficulty
    })
  };
  const approval = approvalWarning({
    status: exportMetadata.status,
    validation,
    validationHasRun: baseState.validationHasRun
  });
  const exportReadiness = buildExportReadiness({
    metadata: exportMetadata,
    hasStart,
    hasDestination,
    checkpointsRequired,
    checkpointCount: baseState.checkpointNodeIds.length,
    hasRoute: hasMatchedRoute,
    validation,
    validationHasRun: baseState.validationHasRun,
    comparisonHasRun: baseState.comparisonHasRun,
    comparison: shortestRouteComparison,
    approvalWarning: approval
  });
  const saveTargets: TrainingRouteAuthorSaveTarget[] = ([
    "working-draft",
    "review-candidate",
    "complete-route"
  ] as const).map((mode) => buildSaveTarget({
    mode,
    metadata: exportMetadata,
    hasStart,
    hasDestination,
    checkpointsRequired,
    checkpointCount: baseState.checkpointNodeIds.length,
    hasRoute: hasMatchedRoute,
    validation,
    validationHasRun: baseState.validationHasRun,
    comparisonHasRun: baseState.comparisonHasRun,
    comparison: shortestRouteComparison,
    approvalWarning: approval
  }));
  const workingDraftTarget = saveTargets.find((target) => target.mode === "working-draft") ?? saveTargets[0];
  const reviewCandidateTarget = saveTargets.find((target) => target.mode === "review-candidate") ?? saveTargets[0];
  const draftSaveReadiness = saveTargetToReadiness(workingDraftTarget);
  const validatedDraftSaveReadiness = saveTargetToReadiness(reviewCandidateTarget);
  const routeGeometry = pointsForNodeIds(sourceMap, baseState.routeNodeIds);
  const markers: TrainingRouteAuthorMapMarker[] = [
    ...(baseState.startNodeId
      ? [
          {
            id: "start",
            label: "START",
            kind: "start" as const,
            point: pointForNode(sourceMap, baseState.startNodeId)
          }
        ]
      : []),
    ...baseState.checkpointNodeIds.map((nodeId, index) => ({
      id: `checkpoint-${index + 1}`,
      label: `${index + 1}`,
      kind: "checkpoint" as const,
      point: pointForNode(sourceMap, nodeId)
    })),
    ...(baseState.destinationNodeId
      ? [
          {
            id: "destination",
            label: "DESTINATION",
            kind: "destination" as const,
            point: pointForNode(sourceMap, baseState.destinationNodeId)
          }
        ]
      : [])
  ].filter((marker): marker is TrainingRouteAuthorMapMarker => Boolean(marker.point));
  const shortestPoints = shortestRoutePoints({
    map: sourceMap,
    graph,
    stopNodeIds: selectedStopNodeIds,
    comparisonHasRun: baseState.comparisonHasRun
  });
  const mapModel: TrainingRouteAuthorMapModel = {
    authoredRoutePoints: rawRoutePoints,
    matchedRoutePoints: routeGeometry,
    snappedRoutePoints: baseState.snappedRoutePoints,
    shortestRoutePoints: shortestPoints,
    markers,
    showShortestRouteComparison: baseState.comparisonHasRun,
    validationIssueSegmentIds: baseState.validationHasRun ? validation.affectedRouteSegmentIds : [],
    markerRadiusPixels: 9
  };
  const routeStatusItems = buildRouteStatusItems({
    hasStart,
    hasDestination,
    checkpointsRequired,
    checkpointCount: baseState.checkpointNodeIds.length,
    hasUsableRoute,
    hasMatchedRoute,
    routeMatchStatus: baseState.routeMatchStatus,
    validationHasRun: baseState.validationHasRun,
    validation: validationForDisplay,
    comparisonHasRun: baseState.comparisonHasRun,
    comparison: shortestRouteComparison,
    exportReady: exportReadiness.ready
  });
  const authoringSteps = buildAuthoringSteps({
    hasStart,
    hasUsableRoute,
    hasMatchedRoute,
    checkpointCount: baseState.checkpointNodeIds.length,
    checkpointsRequired,
    hasDestination,
    validationHasRun: baseState.validationHasRun,
    validation,
    comparisonHasRun: baseState.comparisonHasRun,
    exportReady: exportReadiness.ready
  });
  const checkpointRequirements = checkpointRequirementsForState({
    metadata: exportMetadata,
    startNodeId: baseState.startNodeId,
    checkpointNodeIds: baseState.checkpointNodeIds,
    destinationNodeId: baseState.destinationNodeId
  });
  const checkpoints = baseState.checkpointNodeIds.map((nodeId, index) =>
    curatedStopForNode({
      map: sourceMap,
      nodeId,
      fallbackLabel: `Checkpoint ${index + 1}`,
      kind: "checkpoint",
      order: index + 1,
      required: true,
      validationSegments: baseState.validationSegments
    })
  );
  const exportData: CuratedTrainingRouteExport = {
    schemaVersion: 1,
    routeId: exportMetadata.routeId,
    title: exportMetadata.title,
    area: exportMetadata.area,
    practiceMapId: exportMetadata.practiceMapId,
    areaId: exportMetadata.areaId,
    areaName: exportMetadata.areaName,
    sourceFixture: exportMetadata.sourceFixture,
    difficulty: exportMetadata.difficulty,
    exerciseType: exportMetadata.exerciseType,
    status: exportMetadata.status,
    lifecycleStage: "authoring",
    metadata: exportMetadata,
    mapId: sourceMap.id,
    mapVersion: sourceMap.mapVersion ?? sourceMap.version,
    sourceRouteExerciseId: baseState.sampleLoaded ? DEFAULT_ROUTE_EXERCISE?.id : undefined,
    sourceRouteExerciseVersion: baseState.sampleLoaded ? DEFAULT_ROUTE_EXERCISE?.exerciseVersion : undefined,
    start: curatedStopForNode({
      map: sourceMap,
      nodeId: baseState.startNodeId,
      fallbackLabel: "Start",
      kind: "start",
      order: 0,
      required: true,
      validationSegments: baseState.validationSegments
    }),
    destination: curatedStopForNode({
      map: sourceMap,
      nodeId: baseState.destinationNodeId,
      fallbackLabel: "Destination",
      kind: "destination",
      order: baseState.checkpointNodeIds.length + 1,
      required: true,
      validationSegments: baseState.validationSegments
    }),
    checkpoints,
    checkpointRequirements,
    routeSegmentIds: baseState.validationSegments.map((segment) => segment.id),
    roadIds: [...new Set(baseState.validationSegments.map((segment) => segment.roadId))],
    nodeIds: baseState.routeNodeIds,
    routeGeometry,
    validationSummary: {
      status: baseState.validationHasRun ? validation.status : "invalid",
      valid: baseState.validationHasRun ? validation.valid : false,
      blockingErrors: baseState.validationHasRun ? validation.blockingErrors : [],
      advisoryWarnings: baseState.validationHasRun ? validation.advisoryWarnings : [],
      affectedRouteSegmentIds: baseState.validationHasRun ? validation.affectedRouteSegmentIds : [],
      ruleCodes: baseState.validationHasRun ? validation.ruleCodes : [],
      explanation: baseState.validationHasRun
        ? validation.explanation
        : "Validation has not been run for the current authored route."
    },
    complexitySummary,
    shortestRouteComparison,
    validationSegments: baseState.validationSegments
  };

  return {
    path: DEV_TRAINING_ROUTE_AUTHOR_PATH,
    title: "Curated Training Route Author",
    devOnlyNotice:
      "Dev/admin only. Create, validate, compare, and export curated learner-driver training routes from real map interaction.",
    sourceMapId: sourceMap.id,
    sourceMapName: sourceMap.name,
    sourceExerciseId: baseState.sampleLoaded && DEFAULT_ROUTE_EXERCISE ? DEFAULT_ROUTE_EXERCISE.id : "none",
    sampleLoaded: baseState.sampleLoaded,
    activeMode: baseState.activeMode,
    toolbarActions: buildToolbarActions({
      activeMode: baseState.activeMode,
      canUndo: baseState.routeDraft.strokes.length > 0 || baseState.checkpointNodeIds.length > 0 || Boolean(baseState.destinationNodeId) || Boolean(baseState.startNodeId),
      canRemoveCheckpoint: baseState.checkpointNodeIds.length > 0,
      canClearRoute: baseState.routeDraft.strokes.length > 0,
      canClearCheckpoints: baseState.checkpointNodeIds.length > 0,
      exportReady: exportReadiness.ready
    }),
    authoringSteps,
    routeStatusItems,
    mapModel,
    exportReadiness,
    draftSaveReadiness,
    validatedDraftSaveReadiness,
    saveTargets,
    suggestedRouteId,
    effectiveRouteId,
    areaOptions: TRAINING_ROUTE_AUTHOR_AREA_OPTIONS,
    selectedArea,
    metadataFields: buildMetadataFields({
      metadata,
      effectiveRouteId,
      suggestedRouteId
    }),
    validationRunStatus: baseState.validationHasRun ? validation.status : "not-run",
    comparisonRunStatus: baseState.comparisonHasRun
      ? shortestRouteComparison.directComparison.comparisonStatus
      : "not-run",
    validation: validationForDisplay,
    complexitySummary,
    shortestRouteComparison,
    exportData,
    exportJson: `${JSON.stringify(exportData, null, 2)}\n`,
    approvalWarning: approval,
    routeMatchStatus: baseState.routeMatchStatus,
    routeMatchMessage: baseState.routeMatchMessage,
    authoringWorkflow: [
      "Open the Real London map.",
      "Set a start point by clicking a valid road/node.",
      "Draw the intended learner route on the roads.",
      "Add optional ordered checkpoints.",
      "Set the destination.",
      "Validate, compare with the shortest legal route, then export JSON."
    ]
  };
}
