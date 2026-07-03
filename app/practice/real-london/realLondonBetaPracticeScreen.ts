import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  runRouteExercise,
  type MapDefinition,
  type RouteExercise,
  type RouteStop
} from "../../../lib/map-engine/index.ts";
import { TOPOPASS_STREET_ATLAS_STYLE } from "../../dev/route-runner/topopassCartographyStyle.ts";
import { ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON } from "../../dev/route-runner/curatedRealLondonRouteRunnerMaps.ts";
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
  getRealLondonBetaMapOptions,
  isRealLondonBetaAccessEnabled,
  resolveRealLondonBetaMapAccess,
  type RealLondonBetaAccessEnv,
  type RealLondonBetaUnavailableState
} from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";

export const REAL_LONDON_BETA_PRACTICE_PATH = "/practice/real-london";
export const REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL = "Real London Practice - Beta";
export const REAL_LONDON_BETA_DESKTOP_MAP_MAX_HEIGHT_CSS = "min(912px, calc(100dvh - 80px))";
export const REAL_LONDON_BETA_DESKTOP_MAP_WIDTH_CSS = "100%";
export const REAL_LONDON_BETA_DESKTOP_MAP_MAX_WIDTH_RULE = "viewport-height-bounded-wide-canvas";
export const REAL_LONDON_BETA_DESKTOP_CANVAS_WIDTH_PX = 1920;
export const REAL_LONDON_BETA_DESKTOP_CANVAS_HEIGHT_PX = 912;
export const REAL_LONDON_BETA_MAP_OPTIONS = ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON;

export type RealLondonBetaPracticeMapRow = {
  id: string;
  label: string;
  description: string;
  fixtureUse: "routableExercise" | "routeReviewFixture" | "visualQaOnly" | "legacyPilot";
  fixtureUseLabel: string;
  scoreable: boolean;
  selected: boolean;
};

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
      mapRows: RealLondonBetaPracticeMapRow[];
      selectedMap: RealLondonBetaPracticeMapRow;
      routeRunnerMode: "student-beta";
      exerciseSelectorTitle: "Practice Exercises";
      exerciseRows: RealLondonBetaPracticeExerciseRow[];
      selectedExercise: RealLondonBetaPracticeSelectedExercise | null;
      mapInteraction: {
        drawingEnabled: true;
        usesExistingRouteRunnerLogic: true;
        submitActionLabel: "Submit Attempt";
        clearActionLabel: "Erase route";
        retryActionLabel: "Try again";
        mapSwitchClearsAttemptState: true;
        eraseClearsDrawingAndResult: true;
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
        mapFirstLayout: true;
        taskSummaryVisible: true;
        combinedExerciseAndRecommendationPanel: true;
        duplicateRecommendedPracticePanel: false;
        compactMapControls: true;
        instructionsCollapsedByDefault: true;
        limitationsCollapsedByDefault: true;
        feedbackFormMobileSafe: true;
        feedbackMinTouchTargetPx: 44;
        routeRunnerMapMinHeightPx: 360;
        routeRunnerMapPreferredMinHeightPx: 420;
        routeRunnerTabletMapPreferredMinHeightPx: number;
        routeRunnerLandscapeMapPreferredMinHeightPx: number;
        routeRunnerMapTouchAction: "none";
        mapControlsMinTouchTargetPx: number;
        mapControlsAvoidPrimaryMarkers: true;
        mapLegendCollapsedByDefault: true;
        mapLegendMaxHeightPx: number;
        markerHitTargetMinPx: number;
        reviewIssueHitTargetMinPx: number;
        calloutMinHeightPx: number;
        restrictionSummaryFirst: true;
        restrictionDetailsCollapsedByDefault: true;
        restrictionDebugDetailsHidden: true;
        baseRestrictionOverlaysDefaultVisible: false;
        oneWayArrowMinSpacingMeters: typeof ONE_WAY_ARROW_MIN_SPACING_METERS;
        horizontalOverflowRisk: false;
      };
      desktopLayout: {
        fillsAvailablePracticePanelWidth: true;
        viewportBoundedMap: true;
        mapWidthCss: typeof REAL_LONDON_BETA_DESKTOP_MAP_WIDTH_CSS;
        mapMaxWidthRule: typeof REAL_LONDON_BETA_DESKTOP_MAP_MAX_WIDTH_RULE;
        mapMaxHeightCss: typeof REAL_LONDON_BETA_DESKTOP_MAP_MAX_HEIGHT_CSS;
        canvasWidthPx: typeof REAL_LONDON_BETA_DESKTOP_CANVAS_WIDTH_PX;
        canvasHeightPx: typeof REAL_LONDON_BETA_DESKTOP_CANVAS_HEIGHT_PX;
        canvasHeightIncreaseRatio: number;
        preservesCartographicProportions: true;
        artificiallyCappedSmallWidth: false;
        unnecessaryVerticalScrollRisk: false;
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
  mapOptions?: readonly RouteRunnerMapOption[];
} = {}): RealLondonBetaPracticeScreenModel {
  const betaEnabled = input.betaEnabled ?? isRealLondonBetaAccessEnabled(input.env);
  const mapOptions = input.mapOptions ?? REAL_LONDON_BETA_MAP_OPTIONS;
  const requestedMapId = input.requestedMapId ?? realLondonOsmPilotRouteMap.id;
  const access = resolveRealLondonBetaMapAccess({
    requestedMapId,
    betaEnabled,
    mapOptions
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
  const betaMapOptions = getRealLondonBetaMapOptions(mapOptions);
  const mapRows = betaMapOptions.map((option) => buildPracticeMapRow(option, option.map.id === mapOption.map.id));
  const selectedMap = mapRows.find((row) => row.id === mapOption.map.id) ?? buildPracticeMapRow(mapOption, true);
  const selectedExercise = selectedMap.scoreable
    ? mapOption.exercises.find((exercise) => exercise.id === input.selectedExerciseId) ??
      mapOption.exercises.find((exercise) => exercise.id === mapOption.defaultExerciseId) ??
      mapOption.exercises[0] ??
      null
    : null;

  const practicePanel = buildPracticeExercisesPanelModel({
    exercises: mapOption.exercises,
    selectedExerciseId: selectedExercise?.id ?? null
  });
  const exerciseRows = practicePanel.exerciseRows.map((row) =>
    buildPracticeExerciseRow({
      map: mapOption.map,
      exercise: requireExercise(mapOption, row.id),
      selected: row.selected
    })
  );
  const selectedExerciseModel = selectedExercise
    ? buildSelectedExerciseModel({
        map: mapOption.map,
        exercise: selectedExercise
      })
    : null;
  const routeFlow = selectedExercise
    ? buildRouteFlowSummary(mapOption, selectedExercise)
    : {
        shortestRouteFound: false,
        existingRunnerScorePassed: false,
        selectedEdgeCount: 0
      };

  return {
    state: "available",
    pagePath: REAL_LONDON_BETA_PRACTICE_PATH,
    label: REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL,
    betaFlagName: REAL_LONDON_BETA_ENV_FLAG,
    betaPanelLabel: REAL_LONDON_BETA_LABEL,
    mapId: mapOption.map.id,
    mapVersion: mapOption.map.mapVersion ?? "missing",
    mapRows,
    selectedMap,
    routeRunnerMode: "student-beta",
    exerciseSelectorTitle: practicePanel.title,
    exerciseRows,
    selectedExercise: selectedExerciseModel,
    mapInteraction: {
      drawingEnabled: true,
      usesExistingRouteRunnerLogic: true,
      submitActionLabel: "Submit Attempt",
      clearActionLabel: "Erase route",
      retryActionLabel: "Try again",
      mapSwitchClearsAttemptState: true,
      eraseClearsDrawingAndResult: true
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
        "restriction-overlays",
        "pipeline-debug-result",
        "manual-route-input",
        "osm-debug",
        "raw-debug-output",
        "raw-map-id",
        "converted-osm-qa"
      ]
    },
    mobileLayout: {
      compactSelector: true,
      compactHeader: true,
      mapFirstLayout: true,
      taskSummaryVisible: true,
      combinedExerciseAndRecommendationPanel: true,
      duplicateRecommendedPracticePanel: false,
      compactMapControls: true,
      instructionsCollapsedByDefault: true,
      limitationsCollapsedByDefault: true,
      feedbackFormMobileSafe: true,
      feedbackMinTouchTargetPx: 44,
      routeRunnerMapMinHeightPx: 360,
      routeRunnerMapPreferredMinHeightPx: 420,
      routeRunnerTabletMapPreferredMinHeightPx: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.mobileReadability.tabletMapMinHeightPx,
      routeRunnerLandscapeMapPreferredMinHeightPx: 360,
      routeRunnerMapTouchAction: "none",
      mapControlsMinTouchTargetPx: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.mobileReadability.compactControlMinHeightPx,
      mapControlsAvoidPrimaryMarkers: true,
      mapLegendCollapsedByDefault: true,
      mapLegendMaxHeightPx: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.mobileReadability.legendMaxHeightPx,
      markerHitTargetMinPx: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.touchTargets.minTapTargetPx,
      reviewIssueHitTargetMinPx: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.touchTargets.reviewIssueHitRadius * 2,
      calloutMinHeightPx: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.touchTargets.calloutMinHeight,
      restrictionSummaryFirst: true,
      restrictionDetailsCollapsedByDefault: true,
      restrictionDebugDetailsHidden: true,
      baseRestrictionOverlaysDefaultVisible: false,
      oneWayArrowMinSpacingMeters: ONE_WAY_ARROW_MIN_SPACING_METERS,
      horizontalOverflowRisk: false
    },
    desktopLayout: {
      fillsAvailablePracticePanelWidth: true,
      viewportBoundedMap: true,
      mapWidthCss: REAL_LONDON_BETA_DESKTOP_MAP_WIDTH_CSS,
      mapMaxWidthRule: REAL_LONDON_BETA_DESKTOP_MAP_MAX_WIDTH_RULE,
      mapMaxHeightCss: REAL_LONDON_BETA_DESKTOP_MAP_MAX_HEIGHT_CSS,
      canvasWidthPx: REAL_LONDON_BETA_DESKTOP_CANVAS_WIDTH_PX,
      canvasHeightPx: REAL_LONDON_BETA_DESKTOP_CANVAS_HEIGHT_PX,
      canvasHeightIncreaseRatio: REAL_LONDON_BETA_DESKTOP_CANVAS_HEIGHT_PX / 760,
      preservesCartographicProportions: true,
      artificiallyCappedSmallWidth: false,
      unnecessaryVerticalScrollRisk: false
    },
    routeFlow
  };
}

function fixtureUseForMapOption(option: RouteRunnerMapOption): RealLondonBetaPracticeMapRow["fixtureUse"] {
  return option.fixtureUse ?? "legacyPilot";
}

function fixtureUseLabel(fixtureUse: RealLondonBetaPracticeMapRow["fixtureUse"]): string {
  if (fixtureUse === "routableExercise") {
    return "Scored practice";
  }

  if (fixtureUse === "routeReviewFixture") {
    return "Route review fixture";
  }

  if (fixtureUse === "visualQaOnly") {
    return "Visual QA only";
  }

  return "Scored pilot";
}

function fixtureUseIsScoreable(fixtureUse: RealLondonBetaPracticeMapRow["fixtureUse"]): boolean {
  return fixtureUse === "legacyPilot" || fixtureUse === "routableExercise";
}

function buildPracticeMapRow(option: RouteRunnerMapOption, selected: boolean): RealLondonBetaPracticeMapRow {
  const fixtureUse = fixtureUseForMapOption(option);

  return {
    id: option.map.id,
    label: option.label,
    description: option.description,
    fixtureUse,
    fixtureUseLabel: fixtureUseLabel(fixtureUse),
    scoreable: fixtureUseIsScoreable(fixtureUse),
    selected
  };
}

function buildPracticeExerciseRow(input: {
  map: MapDefinition;
  exercise: RouteExercise;
  selected: boolean;
}): RealLondonBetaPracticeExerciseRow {
  const metadata = getRealLondonPilotExerciseMetadata(input.exercise);
  const estimatedDistanceMeters = metadata?.estimatedDistanceMeters ?? estimateExerciseDistance(input.map, input.exercise);

  return {
    id: input.exercise.id,
    title: input.exercise.title,
    description: input.exercise.description?.trim() || null,
    exerciseVersion: input.exercise.exerciseVersion ?? "missing",
    difficulty: metadata?.difficulty ?? input.exercise.difficulty ?? "medium",
    routeType: metadata?.routeType ?? inferredRouteType(input.exercise),
    estimatedDistanceMeters,
    estimatedDistanceLabel: formatDistance(estimatedDistanceMeters),
    selected: input.selected
  };
}

function buildSelectedExerciseModel(input: {
  map: MapDefinition;
  exercise: RouteExercise;
}): RealLondonBetaPracticeSelectedExercise {
  const row = buildPracticeExerciseRow({
    map: input.map,
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

function inferredRouteType(exercise: RouteExercise): string {
  if (exercise.stops.length > 3) {
    return "multi-stop";
  }

  if (exercise.stops.length === 3) {
    return "checkpoint";
  }

  return "direct";
}

function estimateExerciseDistance(map: MapDefinition, exercise: RouteExercise): number {
  const graph = buildMapGraph(map);
  const shortestRoute = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds: exercise.stops.map((stop) => resolveExerciseStopNodeId(stop, map)),
    restrictions: map.restrictions
  });

  return shortestRoute.found ? shortestRoute.distanceMeters : 0;
}

export function getRealLondonBetaPracticeDefaultMapOption(): RouteRunnerMapOption {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  if (!option) {
    throw new Error("Real London beta practice default map option is not registered.");
  }

  return option;
}
