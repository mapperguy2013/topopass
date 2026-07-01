import type { RouteExercise, ScreenMapViewport } from "../../../lib/map-engine/index.ts";
import {
  buildZoomedMapViewport,
  canStartDrawingWithMapPointer,
  canZoomInMapView,
  canZoomOutMapView,
  createDefaultMapScrollLockState,
  createDefaultMapViewportState,
  enterMapScrollLockState,
  leaveMapScrollLockState,
  shouldPreventWheelPageScrollOverMap
} from "./mapViewport.ts";
import { buildRouteExerciseDisplayModel } from "./routeRunnerExerciseDisplay.ts";
import {
  getRealLondonPilotExerciseMetadata,
  getRouteRunnerMapViewportBounds,
  isConvertedOsmRouteRunnerMap,
  type RouteRunnerMapOption
} from "./routeRunnerMaps.ts";
import { buildLondonPilotReadinessReportForMapId } from "./routeRunnerOsmRealPilotReadinessReport.ts";
import {
  buildRealLondonPilotPlaythroughPanelModel,
  shouldShowRealLondonPilotPlaythroughPanel
} from "./routeRunnerRealLondonPilotPlaythroughPanel.ts";
import {
  buildRealLondonPilotQaPanelModelForMap,
  shouldShowRealLondonPilotQaPanel
} from "./routeRunnerRealLondonPilotQaPanel.ts";

export type RouteRunnerMobileViewportCategory = "mobile" | "tablet" | "desktop";

export type RouteRunnerMobileQaControlId =
  | "map-selector"
  | "exercise-selector"
  | "selected-exercise-info"
  | "draw-mode"
  | "pan-mode"
  | "undo"
  | "clear-drawing"
  | "submit-attempt"
  | "reveal-route"
  | "reset-view"
  | "zoom-in"
  | "zoom-out";

export type RouteRunnerMobileQaPanelId =
  | "main-controls"
  | "selected-exercise"
  | "drawing-controls"
  | "zoom-controls"
  | "map-area"
  | "version-metadata"
  | "osm-qa-status"
  | "real-london-readiness-qa"
  | "real-london-playthrough"
  | "real-london-exercise-metadata";

export type RouteRunnerMobileQaFailureCode =
  | "viewport-invalid"
  | "missing-map-selector"
  | "missing-exercise-selector"
  | "missing-selected-exercise-info"
  | "missing-draw-control"
  | "missing-pan-control"
  | "missing-undo-control"
  | "missing-clear-control"
  | "missing-submit-control"
  | "missing-reveal-route-control"
  | "missing-reset-view-control"
  | "missing-zoom-in-control"
  | "missing-zoom-out-control"
  | "missing-selected-exercise"
  | "map-area-too-small"
  | "map-area-unbounded"
  | "page-scroll-inaccessible"
  | "touch-drawing-unavailable"
  | "zoom-controls-unavailable"
  | "missing-real-london-qa-panel"
  | "missing-real-london-playthrough-panel"
  | "missing-real-london-exercise-metadata"
  | "panel-horizontal-overflow-risk";

export type RouteRunnerMobileQaFailure = {
  code: RouteRunnerMobileQaFailureCode;
  message: string;
};

export type RouteRunnerMobileQaPanel = {
  id: RouteRunnerMobileQaPanelId;
  label: string;
  mobileSafe: boolean;
  horizontalOverflowRisk: boolean;
  detail: string;
};

export type RouteRunnerMobileQaMapArea = {
  width: number;
  height: number;
  bounded: boolean;
  visible: boolean;
};

export type RouteRunnerMobileQaReport = {
  scope: "layout-interaction-only";
  routeEngineChecks: "not-run";
  mapId: string;
  mapVersion: string;
  exerciseId: string | null;
  exerciseVersion: string | null;
  viewportWidth: number;
  viewportHeight: number;
  viewportCategory: RouteRunnerMobileViewportCategory;
  mapArea: RouteRunnerMobileQaMapArea;
  controlIds: RouteRunnerMobileQaControlId[];
  panelRows: RouteRunnerMobileQaPanel[];
  selectedExerciseVisible: boolean;
  selectedExerciseSummary: string;
  touchDrawingAvailable: boolean;
  zoomControlsReachable: boolean;
  pageScrollAccessible: boolean;
  horizontalOverflowRisk: boolean;
  failures: RouteRunnerMobileQaFailure[];
  isPassing: boolean;
};

export type BuildRouteRunnerMobileQaReportInput = {
  mapOption: RouteRunnerMapOption;
  selectedExerciseId?: string | null;
  viewportWidth: number;
  viewportHeight: number;
  controlAvailability?: Partial<Record<RouteRunnerMobileQaControlId, boolean>>;
  panelAvailability?: Partial<Record<RouteRunnerMobileQaPanelId, boolean>>;
};

const MOBILE_VIEWPORT_MAX_WIDTH = 640;
const TABLET_VIEWPORT_MAX_WIDTH = 1024;
const MOBILE_MIN_MAP_WIDTH = 280;
const MOBILE_MIN_MAP_HEIGHT = 240;
const ROUTE_RUNNER_DESKTOP_CANVAS_WIDTH = 1120;
const ROUTE_RUNNER_DESKTOP_CANVAS_HEIGHT = 760;

const CONTROL_ORDER: RouteRunnerMobileQaControlId[] = [
  "map-selector",
  "exercise-selector",
  "selected-exercise-info",
  "draw-mode",
  "pan-mode",
  "undo",
  "clear-drawing",
  "submit-attempt",
  "reveal-route",
  "reset-view",
  "zoom-in",
  "zoom-out"
];

const CONTROL_FAILURES: Record<RouteRunnerMobileQaControlId, RouteRunnerMobileQaFailure> = {
  "map-selector": {
    code: "missing-map-selector",
    message: "The map selector must remain reachable on mobile route-runner layouts."
  },
  "exercise-selector": {
    code: "missing-exercise-selector",
    message: "The exercise selector must remain reachable on mobile route-runner layouts."
  },
  "selected-exercise-info": {
    code: "missing-selected-exercise-info",
    message: "Selected exercise information must remain visible or accessible on mobile route-runner layouts."
  },
  "draw-mode": {
    code: "missing-draw-control",
    message: "The draw-mode control must remain reachable for touch route drawing."
  },
  "pan-mode": {
    code: "missing-pan-control",
    message: "The pan-mode control must remain reachable so map movement does not fight drawing."
  },
  undo: {
    code: "missing-undo-control",
    message: "The undo control must remain reachable on mobile route-runner layouts."
  },
  "clear-drawing": {
    code: "missing-clear-control",
    message: "The clear drawing control must remain reachable on mobile route-runner layouts."
  },
  "submit-attempt": {
    code: "missing-submit-control",
    message: "The submit attempt control must remain reachable on mobile route-runner layouts."
  },
  "reveal-route": {
    code: "missing-reveal-route-control",
    message: "The reveal route control must remain reachable on mobile route-runner layouts."
  },
  "reset-view": {
    code: "missing-reset-view-control",
    message: "The reset view control must remain reachable on mobile route-runner layouts."
  },
  "zoom-in": {
    code: "missing-zoom-in-control",
    message: "The zoom-in control must remain reachable on mobile route-runner layouts."
  },
  "zoom-out": {
    code: "missing-zoom-out-control",
    message: "The zoom-out control must remain reachable on mobile route-runner layouts."
  }
};

export function buildRouteRunnerMobileQaReport(
  input: BuildRouteRunnerMobileQaReportInput
): RouteRunnerMobileQaReport {
  const viewportWidth = normalizeDimension(input.viewportWidth);
  const viewportHeight = normalizeDimension(input.viewportHeight);
  const viewportCategory = categorizeRouteRunnerViewport(viewportWidth);
  const selectedExercise = selectRouteRunnerExercise(input.mapOption, input.selectedExerciseId);
  const mapArea = buildRouteRunnerMobileQaMapArea(input.mapOption, viewportWidth, viewportHeight, viewportCategory);
  const touchDrawingAvailable = canStartDrawingWithMapPointer({ button: 0, pointerType: "touch" });
  const defaultViewportState = createDefaultMapViewportState();
  const zoomControlsReachable = canZoomInMapView(defaultViewportState) && canZoomOutMapView(defaultViewportState);
  const pageScrollAccessible = checkPageScrollAccessibility();
  const panelRows = buildMobileQaPanelRows({
    mapOption: input.mapOption,
    selectedExercise,
    panelAvailability: input.panelAvailability
  });
  const missingControlFailures = buildMissingControlFailures(input.controlAvailability);
  const selectedExerciseVisible = Boolean(selectedExercise) && controlIsAvailable("selected-exercise-info", input.controlAvailability);
  const horizontalOverflowRisk = panelRows.some((panel) => panel.horizontalOverflowRisk);
  const failures = [
    ...validateViewport(viewportWidth, viewportHeight),
    ...missingControlFailures,
    ...validateSelectedExercise(selectedExercise),
    ...validateMapArea(mapArea),
    ...validateTouchDrawing(touchDrawingAvailable),
    ...validateZoomControls(zoomControlsReachable),
    ...validatePageScroll(pageScrollAccessible),
    ...validateRealLondonPanels(input.mapOption, panelRows),
    ...validatePanelOverflow(panelRows)
  ];

  return {
    scope: "layout-interaction-only",
    routeEngineChecks: "not-run",
    mapId: input.mapOption.map.id,
    mapVersion: input.mapOption.map.mapVersion ?? "none",
    exerciseId: selectedExercise?.id ?? null,
    exerciseVersion: selectedExercise?.exerciseVersion ?? null,
    viewportWidth,
    viewportHeight,
    viewportCategory,
    mapArea,
    controlIds: CONTROL_ORDER.filter((controlId) => controlIsAvailable(controlId, input.controlAvailability)),
    panelRows,
    selectedExerciseVisible,
    selectedExerciseSummary: selectedExercise ? buildRouteExerciseDisplayModel(selectedExercise).selectorLabel : "none",
    touchDrawingAvailable,
    zoomControlsReachable,
    pageScrollAccessible,
    horizontalOverflowRisk,
    failures,
    isPassing: failures.length === 0
  };
}

export function categorizeRouteRunnerViewport(width: number): RouteRunnerMobileViewportCategory {
  if (width <= MOBILE_VIEWPORT_MAX_WIDTH) {
    return "mobile";
  }

  if (width <= TABLET_VIEWPORT_MAX_WIDTH) {
    return "tablet";
  }

  return "desktop";
}

function normalizeDimension(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value * 100) / 100);
}

function selectRouteRunnerExercise(option: RouteRunnerMapOption, selectedExerciseId?: string | null): RouteExercise | null {
  const exerciseId = selectedExerciseId ?? option.defaultExerciseId;

  return option.exercises.find((exercise) => exercise.id === exerciseId) ?? option.exercises[0] ?? null;
}

function controlIsAvailable(
  controlId: RouteRunnerMobileQaControlId,
  availability: Partial<Record<RouteRunnerMobileQaControlId, boolean>> | undefined
): boolean {
  return availability?.[controlId] ?? true;
}

function panelIsAvailable(
  panelId: RouteRunnerMobileQaPanelId,
  availability: Partial<Record<RouteRunnerMobileQaPanelId, boolean>> | undefined
): boolean {
  return availability?.[panelId] ?? true;
}

function buildMissingControlFailures(
  availability: Partial<Record<RouteRunnerMobileQaControlId, boolean>> | undefined
): RouteRunnerMobileQaFailure[] {
  return CONTROL_ORDER.filter((controlId) => !controlIsAvailable(controlId, availability)).map(
    (controlId) => CONTROL_FAILURES[controlId]
  );
}

function buildRouteRunnerMobileQaMapArea(
  option: RouteRunnerMapOption,
  viewportWidth: number,
  viewportHeight: number,
  viewportCategory: RouteRunnerMobileViewportCategory
): RouteRunnerMobileQaMapArea {
  const horizontalPadding = viewportCategory === "mobile" ? 32 : viewportCategory === "tablet" ? 48 : 64;
  const width = Math.min(ROUTE_RUNNER_DESKTOP_CANVAS_WIDTH, Math.max(0, viewportWidth - horizontalPadding));
  const preferredHeight =
    viewportCategory === "mobile"
      ? Math.min(420, Math.max(MOBILE_MIN_MAP_HEIGHT, viewportHeight * 0.45))
      : Math.min(ROUTE_RUNNER_DESKTOP_CANVAS_HEIGHT, Math.max(420, viewportHeight * 0.62));
  const height = normalizeDimension(preferredHeight);
  const mapViewport = buildSemanticScreenMapViewport(option, width, height);
  const zoomedViewport = buildZoomedMapViewport(mapViewport, createDefaultMapViewportState());
  const bounded = width > 0 && height > 0 && finiteViewportBounds(zoomedViewport);

  return {
    width: normalizeDimension(width),
    height,
    bounded,
    visible: width >= MOBILE_MIN_MAP_WIDTH && height >= MOBILE_MIN_MAP_HEIGHT
  };
}

function buildSemanticScreenMapViewport(option: RouteRunnerMapOption, width: number, height: number): ScreenMapViewport {
  return {
    width,
    height,
    mapBounds: getRouteRunnerMapViewportBounds(option.map, width, height)
  };
}

function finiteViewportBounds(viewport: ScreenMapViewport): boolean {
  return (
    Number.isFinite(viewport.width) &&
    Number.isFinite(viewport.height) &&
    Number.isFinite(viewport.mapBounds.minX) &&
    Number.isFinite(viewport.mapBounds.minY) &&
    Number.isFinite(viewport.mapBounds.maxX) &&
    Number.isFinite(viewport.mapBounds.maxY) &&
    viewport.mapBounds.maxX >= viewport.mapBounds.minX &&
    viewport.mapBounds.maxY >= viewport.mapBounds.minY
  );
}

function checkPageScrollAccessibility(): boolean {
  const hovered = enterMapScrollLockState(createDefaultMapScrollLockState());
  const mapWheelLocked = shouldPreventWheelPageScrollOverMap({ deltaY: 48 }, hovered);
  const released = leaveMapScrollLockState(hovered);
  const pageWheelReleased = !shouldPreventWheelPageScrollOverMap({ deltaY: 48 }, released);

  return mapWheelLocked && pageWheelReleased;
}

function buildMobileQaPanelRows(input: {
  mapOption: RouteRunnerMapOption;
  selectedExercise: RouteExercise | null;
  panelAvailability: Partial<Record<RouteRunnerMobileQaPanelId, boolean>> | undefined;
}): RouteRunnerMobileQaPanel[] {
  const panels: RouteRunnerMobileQaPanel[] = [
    buildPanel("main-controls", "Main route-runner controls", "Map, exercise, drawing, and submit controls remain grouped."),
    buildPanel("selected-exercise", "Selected exercise information", "The selected exercise title and stop list remain visible."),
    buildPanel("drawing-controls", "Drawing controls", "Draw, pan, undo, clear, and reveal controls remain reachable."),
    buildPanel("zoom-controls", "Zoom controls", "Zoom in, zoom out, and reset view remain reachable."),
    buildPanel("map-area", "Map area", "The map area remains bounded inside the mobile viewport."),
    buildPanel("version-metadata", "Version metadata", "Map and exercise versions remain available for debug review.")
  ];

  if (isConvertedOsmRouteRunnerMap(input.mapOption)) {
    panels.push(buildPanel("osm-qa-status", "OSM QA status", "Converted OSM QA status remains mobile-safe."));
  }

  if (shouldShowRealLondonPilotQaPanel(input.mapOption.map.id)) {
    const readinessPanel = buildRealLondonPilotQaPanelModelForMap({
      mapId: input.mapOption.map.id,
      report: buildLondonPilotReadinessReportForMapId(input.mapOption.map.id)
    });

    panels.push(
      buildPanel(
        "real-london-readiness-qa",
        "Real London pilot QA",
        readinessPanel
          ? `${readinessPanel.exerciseProgressText}; ${readinessPanel.failureReasonText} failures.`
          : "Real London pilot QA panel is unavailable."
      )
    );
  }

  if (shouldShowRealLondonPilotPlaythroughPanel(input.mapOption.map.id)) {
    const playthroughPanel = buildRealLondonPilotPlaythroughPanelModel({
      mapId: input.mapOption.map.id,
      selectedExerciseId: input.selectedExercise?.id ?? null,
      startLabel: formatExerciseStopLabel(input.selectedExercise?.stops[0]),
      destinationLabel: formatExerciseStopLabel(input.selectedExercise?.stops.at(-1)),
      checkpointLabels: input.selectedExercise?.stops.slice(1, -1).map(formatExerciseStopLabel).filter(isString) ?? [],
      hasLegalRevealRoute: Boolean(input.selectedExercise),
      isRevealRouteVisible: false,
      isDrawing: false,
      drawnPointCount: 0,
      drawnReviewStatus: "pending",
      manualRunStatus: null,
      illegalHighlightCount: 0
    });

    panels.push(
      buildPanel(
        "real-london-playthrough",
        playthroughPanel.title,
        `${playthroughPanel.revealRouteText} ${playthroughPanel.illegalHighlightText}`
      )
    );
  }

  if (input.selectedExercise && getRealLondonPilotExerciseMetadata(input.selectedExercise)) {
    const metadata = getRealLondonPilotExerciseMetadata(input.selectedExercise);

    panels.push(
      buildPanel(
        "real-london-exercise-metadata",
        "Real London exercise metadata",
        metadata
          ? `${metadata.difficulty}; ${metadata.routeType}; ${metadata.estimatedDistanceMeters.toFixed(2)} m.`
          : "Real London metadata is unavailable."
      )
    );
  }

  return panels
    .filter((panel) => panelIsAvailable(panel.id, input.panelAvailability))
    .map((panel) => ({
      ...panel,
      horizontalOverflowRisk: panel.horizontalOverflowRisk || !panel.mobileSafe
    }));
}

function buildPanel(id: RouteRunnerMobileQaPanelId, label: string, detail: string): RouteRunnerMobileQaPanel {
  return {
    id,
    label,
    detail,
    mobileSafe: true,
    horizontalOverflowRisk: false
  };
}

function formatExerciseStopLabel(stop: RouteExercise["stops"][number] | undefined): string | null {
  const label = stop?.label?.trim();

  return label && label.length > 0 ? label : null;
}

function isString(value: string | null): value is string {
  return typeof value === "string";
}

function validateViewport(width: number, height: number): RouteRunnerMobileQaFailure[] {
  if (width > 0 && height > 0) {
    return [];
  }

  return [
    {
      code: "viewport-invalid",
      message: "Route-runner mobile QA requires a finite positive viewport width and height."
    }
  ];
}

function validateSelectedExercise(selectedExercise: RouteExercise | null): RouteRunnerMobileQaFailure[] {
  if (selectedExercise) {
    return [];
  }

  return [
    {
      code: "missing-selected-exercise",
      message: "A selected exercise is required so mobile QA can verify exercise information remains accessible."
    }
  ];
}

function validateMapArea(mapArea: RouteRunnerMobileQaMapArea): RouteRunnerMobileQaFailure[] {
  const failures: RouteRunnerMobileQaFailure[] = [];

  if (!mapArea.visible) {
    failures.push({
      code: "map-area-too-small",
      message: "The mobile map area must remain large enough for touch drawing."
    });
  }

  if (!mapArea.bounded) {
    failures.push({
      code: "map-area-unbounded",
      message: "The mobile map area must have finite bounded map coordinates."
    });
  }

  return failures;
}

function validateTouchDrawing(touchDrawingAvailable: boolean): RouteRunnerMobileQaFailure[] {
  if (touchDrawingAvailable) {
    return [];
  }

  return [
    {
      code: "touch-drawing-unavailable",
      message: "Touch pointer drawing must remain available on mobile route-runner layouts."
    }
  ];
}

function validateZoomControls(zoomControlsReachable: boolean): RouteRunnerMobileQaFailure[] {
  if (zoomControlsReachable) {
    return [];
  }

  return [
    {
      code: "zoom-controls-unavailable",
      message: "Zoom controls must be reachable and usable from the default map viewport state."
    }
  ];
}

function validatePageScroll(pageScrollAccessible: boolean): RouteRunnerMobileQaFailure[] {
  if (pageScrollAccessible) {
    return [];
  }

  return [
    {
      code: "page-scroll-inaccessible",
      message: "Page scroll must be released deterministically after the pointer leaves the map area."
    }
  ];
}

function validateRealLondonPanels(
  option: RouteRunnerMapOption,
  panels: readonly RouteRunnerMobileQaPanel[]
): RouteRunnerMobileQaFailure[] {
  if (!shouldShowRealLondonPilotQaPanel(option.map.id)) {
    return [];
  }

  const panelIds = new Set(panels.map((panel) => panel.id));
  const failures: RouteRunnerMobileQaFailure[] = [];

  if (!panelIds.has("real-london-readiness-qa")) {
    failures.push({
      code: "missing-real-london-qa-panel",
      message: "The real London pilot readiness QA panel must remain available on mobile layouts."
    });
  }

  if (!panelIds.has("real-london-playthrough")) {
    failures.push({
      code: "missing-real-london-playthrough-panel",
      message: "The real London pilot playthrough panel must remain available on mobile layouts."
    });
  }

  if (!panelIds.has("real-london-exercise-metadata")) {
    failures.push({
      code: "missing-real-london-exercise-metadata",
      message: "The real London pilot exercise metadata panel must remain available on mobile layouts."
    });
  }

  return failures;
}

function validatePanelOverflow(panels: readonly RouteRunnerMobileQaPanel[]): RouteRunnerMobileQaFailure[] {
  const riskyPanelIds = panels.filter((panel) => panel.horizontalOverflowRisk).map((panel) => panel.id);

  if (riskyPanelIds.length === 0) {
    return [];
  }

  return [
    {
      code: "panel-horizontal-overflow-risk",
      message: `Mobile route-runner panels must not introduce horizontal overflow risk: ${riskyPanelIds.join(", ")}.`
    }
  ];
}
