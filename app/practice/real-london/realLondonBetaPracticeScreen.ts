import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  runRouteExercise,
  type MapDefinition,
  type RouteExercise,
  type RouteStop
} from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRealLondonPilotExerciseMetadata,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap,
  type RouteRunnerMapOption
} from "../../dev/route-runner/routeRunnerMaps.ts";
import { buildPracticeExercisesPanelModel } from "../../dev/route-runner/routeRunnerCompactPracticePanels.ts";
import {
  ONE_WAY_ARROW_MIN_SPACING_METERS,
  buildRestrictionLegendItems
} from "../../dev/route-runner/restrictionMapVisuals.ts";
import {
  REAL_LONDON_BETA_ENV_FLAG,
  REAL_LONDON_BETA_FEEDBACK_PLACEHOLDER,
  REAL_LONDON_BETA_KNOWN_LIMITATIONS,
  REAL_LONDON_BETA_LABEL,
  isRealLondonBetaAccessEnabled,
  resolveRealLondonBetaMapAccess,
  type RealLondonBetaAccessEnv,
  type RealLondonBetaUnavailableState
} from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";

export const REAL_LONDON_BETA_PRACTICE_PATH = "/practice/real-london";
export const REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL = "Real London Practice - Beta";

export type RealLondonBetaPracticeExerciseRow = {
  id: string;
  title: string;
  description: string | null;
  exerciseVersion: string;
  difficulty: string;
  routeType: string;
  estimatedDistanceMeters: number;
  estimatedDistanceLabel: string;
  selected: boolean;
};

export type RealLondonBetaPracticeSelectedExercise = RealLondonBetaPracticeExerciseRow & {
  startLabel: string;
  destinationLabel: string;
  checkpointLabels: string[];
  compactStopSummary: string;
  mobileInstructionSummary: string;
  instructionLines: string[];
  routeFlowReady: boolean;
};

export type RealLondonBetaPracticeScreenModel =
  | {
      state: "unavailable";
      pagePath: typeof REAL_LONDON_BETA_PRACTICE_PATH;
      label: typeof REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL;
      betaFlagName: typeof REAL_LONDON_BETA_ENV_FLAG;
      unavailableState: RealLondonBetaUnavailableState;
      defaultMapId: typeof DEFAULT_ROUTE_RUNNER_MAP_ID;
    }
  | {
      state: "available";
      pagePath: typeof REAL_LONDON_BETA_PRACTICE_PATH;
      label: typeof REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL;
      betaFlagName: typeof REAL_LONDON_BETA_ENV_FLAG;
      betaPanelLabel: typeof REAL_LONDON_BETA_LABEL;
      mapId: string;
      mapVersion: string;
      routeRunnerMode: "student-beta";
      exerciseSelectorTitle: "Practice Exercises";
      exerciseRows: RealLondonBetaPracticeExerciseRow[];
      selectedExercise: RealLondonBetaPracticeSelectedExercise;
      mapInteraction: {
        drawingEnabled: true;
        usesExistingRouteRunnerLogic: true;
        submitActionLabel: "Submit Attempt";
        clearActionLabel: "Clear";
        retryActionLabel: "Try again";
      };
      feedback: {
        visible: true;
        placeholder: string;
      };
      knownLimitations: string[];
      attribution: string;
      legendItems: Array<{ id: string; label: string; description: string }>;
      devDiagnostics: {
        visible: false;
        hiddenPanelIds: string[];
      };
      mobileLayout: {
        compactSelector: true;
        compactHeader: true;
        taskSummaryVisible: true;
        combinedExerciseAndRecommendationPanel: true;
        duplicateRecommendedPracticePanel: false;
        instructionsCollapsedByDefault: true;
        limitationsCollapsedByDefault: true;
        feedbackFormMobileSafe: true;
        feedbackMinTouchTargetPx: 44;
        routeRunnerMapMinHeightPx: 360;
        routeRunnerMapTouchAction: "none";
        restrictionSummaryFirst: true;
        restrictionDetailsCollapsedByDefault: true;
        restrictionDebugDetailsHidden: true;
        oneWayArrowMinSpacingMeters: typeof ONE_WAY_ARROW_MIN_SPACING_METERS;
        horizontalOverflowRisk: false;
      };
      routeFlow: {
        shortestRouteFound: boolean;
        existingRunnerScorePassed: boolean;
        selectedEdgeCount: number;
      };
    };

export function buildRealLondonBetaPracticeScreenModel(input: {
  betaEnabled?: boolean;
  env?: RealLondonBetaAccessEnv;
  requestedMapId?: string;
  selectedExerciseId?: string;
} = {}): RealLondonBetaPracticeScreenModel {
  const betaEnabled = input.betaEnabled ?? isRealLondonBetaAccessEnabled(input.env);
  const requestedMapId = input.requestedMapId ?? realLondonOsmPilotRouteMap.id;
  const access = resolveRealLondonBetaMapAccess({
    requestedMapId,
    betaEnabled
  });

  if (access.state !== "available") {
    return {
      state: "unavailable",
      pagePath: REAL_LONDON_BETA_PRACTICE_PATH,
      label: REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL,
      betaFlagName: REAL_LONDON_BETA_ENV_FLAG,
      unavailableState:
        access.unavailableState ??
        {
          mapId: requestedMapId,
          title: "Real London practice unavailable",
          message: "Real London practice is not available for this beta screen.",
          reasonCode: "unknown-map"
        },
      defaultMapId: DEFAULT_ROUTE_RUNNER_MAP_ID
    };
  }

  const mapOption = access.selectedMapOption;
  const selectedExercise =
    mapOption.exercises.find((exercise) => exercise.id === input.selectedExerciseId) ??
    mapOption.exercises.find((exercise) => exercise.id === mapOption.defaultExerciseId) ??
    mapOption.exercises[0];

  if (!selectedExercise) {
    throw new Error(`Real London beta practice map ${mapOption.map.id} has no exercises.`);
  }

  const practicePanel = buildPracticeExercisesPanelModel({
    exercises: mapOption.exercises,
    selectedExerciseId: selectedExercise.id
  });
  const exerciseRows = practicePanel.exerciseRows.map((row) =>
    buildPracticeExerciseRow({
      exercise: requireExercise(mapOption, row.id),
      selected: row.selected
    })
  );
  const selectedExerciseModel = buildSelectedExerciseModel({
    map: mapOption.map,
    exercise: selectedExercise
  });
  const routeFlow = buildRouteFlowSummary(mapOption, selectedExercise);

  return {
    state: "available",
    pagePath: REAL_LONDON_BETA_PRACTICE_PATH,
    label: REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL,
    betaFlagName: REAL_LONDON_BETA_ENV_FLAG,
    betaPanelLabel: REAL_LONDON_BETA_LABEL,
    mapId: mapOption.map.id,
    mapVersion: mapOption.map.mapVersion ?? "missing",
    routeRunnerMode: "student-beta",
    exerciseSelectorTitle: practicePanel.title,
    exerciseRows,
    selectedExercise: selectedExerciseModel,
    mapInteraction: {
      drawingEnabled: true,
      usesExistingRouteRunnerLogic: true,
      submitActionLabel: "Submit Attempt",
      clearActionLabel: "Clear",
      retryActionLabel: "Try again"
    },
    feedback: {
      visible: true,
      placeholder: REAL_LONDON_BETA_FEEDBACK_PLACEHOLDER
    },
    knownLimitations: [...REAL_LONDON_BETA_KNOWN_LIMITATIONS],
    attribution: mapOption.attribution ?? "OpenStreetMap contributors",
    legendItems: buildRestrictionLegendItems().map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description
    })),
    devDiagnostics: {
      visible: false,
      hiddenPanelIds: [
        "real-london-readiness-qa",
        "fixture-filename",
        "qa-counts",
        "metadata-coverage-counts",
        "internal-readiness-diagnostics",
        "full-restriction-debug-details",
        "raw-map-id",
        "converted-osm-qa"
      ]
    },
    mobileLayout: {
      compactSelector: true,
      compactHeader: true,
      taskSummaryVisible: true,
      combinedExerciseAndRecommendationPanel: true,
      duplicateRecommendedPracticePanel: false,
      instructionsCollapsedByDefault: true,
      limitationsCollapsedByDefault: true,
      feedbackFormMobileSafe: true,
      feedbackMinTouchTargetPx: 44,
      routeRunnerMapMinHeightPx: 360,
      routeRunnerMapTouchAction: "none",
      restrictionSummaryFirst: true,
      restrictionDetailsCollapsedByDefault: true,
      restrictionDebugDetailsHidden: true,
      oneWayArrowMinSpacingMeters: ONE_WAY_ARROW_MIN_SPACING_METERS,
      horizontalOverflowRisk: false
    },
    routeFlow
  };
}

function buildPracticeExerciseRow(input: {
  exercise: RouteExercise;
  selected: boolean;
}): RealLondonBetaPracticeExerciseRow {
  const metadata = getRealLondonPilotExerciseMetadata(input.exercise);

  if (!metadata) {
    throw new Error(`Real London beta practice exercise ${input.exercise.id} is missing metadata.`);
  }

  return {
    id: input.exercise.id,
    title: input.exercise.title,
    description: input.exercise.description?.trim() || null,
    exerciseVersion: input.exercise.exerciseVersion ?? "missing",
    difficulty: metadata.difficulty,
    routeType: metadata.routeType,
    estimatedDistanceMeters: metadata.estimatedDistanceMeters,
    estimatedDistanceLabel: formatDistance(metadata.estimatedDistanceMeters),
    selected: input.selected
  };
}

function buildSelectedExerciseModel(input: {
  map: MapDefinition;
  exercise: RouteExercise;
}): RealLondonBetaPracticeSelectedExercise {
  const row = buildPracticeExerciseRow({
    exercise: input.exercise,
    selected: true
  });
  const stopLabels = input.exercise.stops.map((stop) => exerciseStopLabel(stop, input.map));
  const startLabel = stopLabels[0] ?? "Start";
  const destinationLabel = stopLabels.at(-1) ?? "Destination";
  const checkpointLabels = stopLabels.slice(1, -1);
  const compactStopSummary =
    checkpointLabels.length > 0
      ? `${startLabel} -> ${checkpointLabels.join(" -> ")} -> ${destinationLabel}`
      : `${startLabel} -> ${destinationLabel}`;

  return {
    ...row,
    startLabel,
    destinationLabel,
    checkpointLabels,
    compactStopSummary,
    mobileInstructionSummary:
      checkpointLabels.length > 0
        ? `Start at ${startLabel}, visit ${checkpointLabels.length} checkpoint${
            checkpointLabels.length === 1 ? "" : "s"
          }, then finish at ${destinationLabel}.`
        : `Start at ${startLabel} and finish at ${destinationLabel}.`,
    instructionLines: [
      `Start at ${startLabel}.`,
      ...(checkpointLabels.length > 0
        ? [`Visit checkpoints in order: ${checkpointLabels.join(", ")}.`]
        : ["No intermediate checkpoints for this exercise."]),
      `Finish at ${destinationLabel}.`,
      "Draw a legal route on the map and submit the attempt when ready."
    ],
    routeFlowReady: true
  };
}

function buildRouteFlowSummary(mapOption: RouteRunnerMapOption, exercise: RouteExercise) {
  const graph = buildMapGraph(mapOption.map);
  const stopNodeIds = exercise.stops.map((stop) => resolveExerciseStopNodeId(stop, mapOption.map));
  const shortestRoute = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds,
    restrictions: mapOption.map.restrictions
  });

  if (!shortestRoute.found) {
    return {
      shortestRouteFound: false,
      existingRunnerScorePassed: false,
      selectedEdgeCount: 0
    };
  }

  const result = runRouteExercise({
    map: mapOption.map,
    exercises: mapOption.exercises,
    exerciseId: exercise.id,
    userRoute: {
      nodeIds: shortestRoute.nodeIds,
      roadIds: shortestRoute.roadIds
    }
  });

  return {
    shortestRouteFound: true,
    existingRunnerScorePassed: result.score.passed,
    selectedEdgeCount: shortestRoute.edgeIds.length
  };
}

function requireExercise(mapOption: RouteRunnerMapOption, exerciseId: string): RouteExercise {
  const exercise = mapOption.exercises.find((candidate) => candidate.id === exerciseId);

  if (!exercise) {
    throw new Error(`Unknown exercise ${exerciseId} for ${mapOption.map.id}.`);
  }

  return exercise;
}

function resolveExerciseStopNodeId(stop: RouteStop, map: MapDefinition): string {
  if (stop.type === "node") {
    return stop.nodeId;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  if (!landmark?.nearestNodeId) {
    throw new Error(`Cannot resolve landmark stop ${stop.landmarkId} to a node.`);
  }

  return landmark.nearestNodeId;
}

function exerciseStopLabel(stop: RouteStop, map: MapDefinition): string {
  const explicitLabel = stop.label?.trim();

  if (explicitLabel) {
    return explicitLabel;
  }

  if (stop.type === "node") {
    const node = map.nodes.find((candidate) => candidate.id === stop.nodeId);

    return node?.label ?? stop.nodeId;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  return landmark?.name ?? stop.landmarkId;
}

function formatDistance(distanceMeters: number): string {
  return distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${Math.round(distanceMeters)} m`;
}

export function getRealLondonBetaPracticeDefaultMapOption(): RouteRunnerMapOption {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  if (!option) {
    throw new Error("Real London beta practice default map option is not registered.");
  }

  return option;
}
