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
  REAL_LONDON_OSM_PILOT_MAP_ID,
  getRealLondonPilotExerciseMetadata,
  type RouteRunnerMapOption
} from "../../dev/route-runner/routeRunnerMapOptionUtils.ts";
import { buildPracticeExercisesPanelModel } from "../../dev/route-runner/routeRunnerCompactPracticePanels.ts";
import { resolveRouteRunnerExerciseSelection } from "../../dev/route-runner/routeRunnerInitialState.ts";
import {
  ONE_WAY_ARROW_MIN_SPACING_METERS,
  buildLearnerRestrictionLegendItems
} from "../../dev/route-runner/restrictionMapVisuals.ts";
import {
  REAL_LONDON_BETA_ENV_FLAG,
  REAL_LONDON_BETA_FEEDBACK_PLACEHOLDER,
  REAL_LONDON_BETA_KNOWN_LIMITATIONS,
  REAL_LONDON_BETA_LABEL,
  getRealLondonBetaMapOptions,
  isRealLondonBetaAccessEnabled,
  routeRunnerMapOptionBetaStatusLabel,
  routeRunnerMapOptionIsScoreable,
  routeRunnerMapOptionIsVisibleInBeta,
  resolveRealLondonBetaMapAccess,
  type RealLondonBetaAccessEnv,
  type RealLondonBetaUnavailableState
} from "../../dev/route-runner/routeRunnerBetaPracticeAccess.ts";

export const REAL_LONDON_BETA_PRACTICE_PATH = "/practice/real-london";
export const REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL = "Real London Practice - Beta";
export const REAL_LONDON_BETA_DESKTOP_MAP_MAX_HEIGHT_CSS = "min(912px, calc(100dvh - 80px))";
export const REAL_LONDON_BETA_DESKTOP_MAP_WIDTH_CSS = "100%";
export const REAL_LONDON_BETA_DESKTOP_MAP_MAX_WIDTH_RULE = "viewport-height-bounded-wide-canvas";
export const REAL_LONDON_BETA_DESKTOP_CANVAS_WIDTH_PX = 1920;
export const REAL_LONDON_BETA_DESKTOP_CANVAS_HEIGHT_PX = 912;
export const REAL_LONDON_BETA_COMPACT_LEGEND_MAX_HEIGHT_PX = 144;
export const REAL_LONDON_BETA_FEEDBACK_DRAWER_WIDTH_CSS = "min(26rem, calc(100vw - 2rem))";
export const REAL_LONDON_BETA_FEEDBACK_DRAWER_MOBILE_MAX_HEIGHT_CSS = "78dvh";
export const REAL_LONDON_BETA_DEFAULT_MAP_ID = DEFAULT_ROUTE_RUNNER_MAP_ID;
export const REAL_LONDON_BETA_PREFERRED_DEFAULT_EXERCISE_TITLE = "Fox Lane Station to Northgate Hospital";
export const REAL_LONDON_BETA_MAP_OPTIONS = getRealLondonBetaMapOptions(
  ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON
);

export type RealLondonBetaPracticeMapRow = {
  id: string;
  label: string;
  description: string;
  fixtureUse: "routableExercise" | "routeReviewFixture" | "visualQaOnly" | "legacyPilot";
  fixtureUseLabel: string;
  visibleInBeta: boolean;
  scoreable: boolean;
  visualQaOnly: boolean;
  routeReviewFixture: boolean;
  devOnlyStressTest: boolean;
  betaPracticeAllowed: boolean;
  selected: boolean;
  fixturePerformanceGate: RouteRunnerMapOption["fixturePerformanceGate"] | null;
  lazyLoadId: string | null;
  lazyLoadingLabel: string | null;
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
        submitActionLabel: "Submit";
        clearActionLabel: "Erase route";
        resetActionLabel: "Reset view";
        retryActionLabel: "Try again";
        mapSwitchClearsAttemptState: true;
        eraseClearsDrawingAndResult: true;
        eraseKeepsSelectedMapAndExercise: true;
        eraseKeepsCurrentMapView: true;
        resetClearsDrawingAndResult: false;
        resetResetsMapView: true;
        resetKeepsCurrentDrawing: true;
        resetKeepsSubmittedResult: true;
        resetKeepsSelectedMapAndExercise: true;
        resetReturnsToDrawMode: true;
        restrictionToggleLabel: "Show restrictions";
        restrictionLayerDefaultVisible: true;
      };
      learnerUi: {
        shell: {
          layoutPattern: "modern-map-app";
          mapIsPrimaryWorkspace: true;
          routeHeaderIsCompact: true;
          routeSetupPanelCollapsible: true;
          routeSetupPanelDefaultOpen: false;
          visualOrder: ["route-header", "route-setup", "map", "feedback-drawer"];
          feedbackPanelPlacement: "desktop-overlay-drawer-mobile-bottom-sheet";
        };
        routeHeaderCount: 1;
        visibleMapWorkspaceHeading: false;
        routeControls: {
          toolbarCount: 1;
          undoCount: 1;
          eraseRouteCount: 1;
          resetViewCount: 1;
          submitCount: 1;
          restrictionToggleCount: 1;
          submitPlacement: "route-header";
          mapToolbarActionLabels: ["Draw", "Pan", "Undo", "Erase route", "Reset view"];
          mapToolbarSubmitVisible: false;
          mapToolbarRestrictionToggleVisible: false;
          restrictionControlPlacement: "legend-control";
          duplicateControlGroupsVisible: false;
        };
        resultPanels: {
          learnerPanelTitle: "Route feedback";
          preSubmitFeedbackPanelVisible: false;
          postSubmitFeedbackPanelVisible: true;
          submittedResultPanelCount: 1;
          betaCoachingNoteCount: 1;
          drawnRouteScoreSummaryVisible: false;
          routeAttemptReviewAndDrawnScoreSummaryTogether: false;
          routeReplayVisibleByDefault: false;
          summaryHeaderFirst: true;
          metricLabels: ["Score", "Your route", "Shortest legal route", "Extra distance"];
          desktopPlacement: "right-overlay-drawer";
          mobilePlacement: "bottom-sheet";
          feedbackDrawer: {
            desktopPlacement: "right-overlay-drawer";
            mobilePlacement: "bottom-sheet";
            widthCss: typeof REAL_LONDON_BETA_FEEDBACK_DRAWER_WIDTH_CSS;
            mobileMaxHeightCss: typeof REAL_LONDON_BETA_FEEDBACK_DRAWER_MOBILE_MAX_HEIGHT_CSS;
            opensAfterSubmit: true;
            closeActionLabel: "Close";
            reopenActionLabel: "View feedback";
            overlaysMapWithoutResizing: true;
            duplicateBelowMapPanelVisible: false;
            preservesSubmittedResultWhenClosed: true;
            resetViewDoesNotClose: true;
          };
          resultBadgeLabels: ["PASS", "FAIL", "NEEDS REVIEW"];
          whatHappenedSectionVisible: true;
          issueCategories: ["Route efficiency", "Illegal movements", "Required stops", "Matching"];
          routeTooLongCategory: "Route efficiency";
          routeTooLongShowOnMapVisible: false;
          emptyIssueCategoriesHidden: true;
          requiredStopProgressUsesLearnerLabels: true;
          duplicateRequiredStopProgressPanelVisible: false;
          rawInternalIdsVisible: false;
          shortestLegalRouteComparisonAvailableAfterSubmit: true;
          shortestLegalRouteComparisonKeepsAttemptVisible: true;
          shortestLegalRouteComparisonActionLabel: "Show shortest legal route";
        };
        instructionArea: {
          visibleInstructionAreaCount: 1;
          mapWorkspaceInstructionVisible: false;
          instructionText: "Draw from the start marker to the destination marker. Visit checkpoints in order and follow road restrictions.";
          panModeText: "Pan mode is on. Drag the map to move the view. Switch back to Draw to add route strokes.";
        };
        routeStatus: {
          badgeCount: 1;
          labels: ["Not started", "Drawing", "Ready to submit", "Submitted"];
        };
        legendControl: {
          presentation: "compact-collapsible-layer-control";
          collapsedByDefault: true;
          scrollbarHeavyPanel: false;
          rawOsmTagsVisible: false;
          learnerRestrictionEntriesVisible: true;
          restrictionToggleVisible: true;
        };
        hiddenTechnicalDetails: {
          rawOsmNodeIds: true;
          rawGraphIds: true;
          rawRoadIds: true;
          localRouteAttemptIds: true;
          fixtureIds: true;
          technicalPerLegLabels: true;
          debugDiagnostics: true;
        };
        markerDesign: {
          start: {
            shape: "pin";
            colourRole: "green";
            label: "START";
            compactText: "S";
            whiteCentreDetail: true;
            labelBubble: true;
            assetSrc: "/map-icons/start-marker.svg";
            transparentBackground: true;
            anchor: "bottom-centre";
            haloAndShadow: true;
          };
          destination: {
            shape: "pin";
            colourRole: "red";
            label: "DESTINATION";
            compactText: "D";
            whiteCentreDetail: true;
            labelBubble: true;
            assetSrc: "/map-icons/destination-marker.svg";
            transparentBackground: true;
            anchor: "bottom-centre";
            haloAndShadow: true;
          };
          checkpoint: {
            shape: "checkpoint-pin";
            colourRole: "blue";
            assetSrc: "/map-icons/checkpoint-marker.svg";
            transparentBackground: true;
            anchor: "bottom-centre";
            labelBubble: true;
            learnerFriendly: true;
          };
          zoomAdaptiveSizing: {
            normalZoomScale: number;
            targetZoomScale: number;
            highZoomMaxScale: number;
            anchorPreserved: true;
          };
        };
        issueMarkerDesign: {
          mapPresentation: "icon-first";
          groupedMarkerPerIssue: true;
          repeatedTextLabelsVisible: false;
          textDetailsPlacement: "route-feedback-panel";
          showOnMapFocusesGroupedIcon: true;
          supportedIssueIcons: [
            "no-entry",
            "wrong-way-one-way",
            "no-left-turn",
            "no-right-turn",
            "no-u-turn",
            "restricted-movement",
            "disconnected-gap",
            "missed-checkpoint"
          ];
        };
        feedbackEntryPoints: 1;
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
        mapLegendMaxHeightPx: typeof REAL_LONDON_BETA_COMPACT_LEGEND_MAX_HEIGHT_PX;
        markerHitTargetMinPx: number;
        reviewIssueHitTargetMinPx: number;
        calloutMinHeightPx: number;
        restrictionSummaryFirst: true;
        restrictionDetailsCollapsedByDefault: true;
        restrictionDebugDetailsHidden: true;
        baseRestrictionOverlaysDefaultVisible: true;
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
  const requestedMapId =
    input.requestedMapId ?? (betaEnabled ? REAL_LONDON_BETA_DEFAULT_MAP_ID : REAL_LONDON_OSM_PILOT_MAP_ID);
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
  const practiceExercises = betaPracticeExercisesForMapOption(mapOption, selectedMap.scoreable);
  const selectedExerciseId = resolveRouteRunnerExerciseSelection({
    exercises: practiceExercises,
    requestedExerciseId: input.selectedExerciseId,
    defaultExerciseId: mapOption.defaultExerciseId,
    scoreable: selectedMap.scoreable
  });
  const selectedExercise = selectedExerciseId
    ? practiceExercises.find((exercise) => exercise.id === selectedExerciseId) ?? null
    : null;

  const practicePanel = buildPracticeExercisesPanelModel({
    exercises: practiceExercises,
    selectedExerciseId: selectedExercise?.id ?? null
  });
  const exerciseRows = practicePanel.exerciseRows.map((row) =>
    buildPracticeExerciseRow({
      map: mapOption.map,
      exercise: requirePracticeExercise(practiceExercises, row.id, mapOption.map.id),
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
      submitActionLabel: "Submit",
      clearActionLabel: "Erase route",
      resetActionLabel: "Reset view",
      retryActionLabel: "Try again",
      mapSwitchClearsAttemptState: true,
      eraseClearsDrawingAndResult: true,
      eraseKeepsSelectedMapAndExercise: true,
      eraseKeepsCurrentMapView: true,
      resetClearsDrawingAndResult: false,
      resetResetsMapView: true,
      resetKeepsCurrentDrawing: true,
      resetKeepsSubmittedResult: true,
      resetKeepsSelectedMapAndExercise: true,
      resetReturnsToDrawMode: true,
      restrictionToggleLabel: "Show restrictions",
      restrictionLayerDefaultVisible: true
    },
    learnerUi: {
      shell: {
        layoutPattern: "modern-map-app",
        mapIsPrimaryWorkspace: true,
        routeHeaderIsCompact: true,
        routeSetupPanelCollapsible: true,
        routeSetupPanelDefaultOpen: false,
        visualOrder: ["route-header", "route-setup", "map", "feedback-drawer"],
        feedbackPanelPlacement: "desktop-overlay-drawer-mobile-bottom-sheet"
      },
      routeHeaderCount: 1,
      visibleMapWorkspaceHeading: false,
      routeControls: {
        toolbarCount: 1,
        undoCount: 1,
        eraseRouteCount: 1,
        resetViewCount: 1,
        submitCount: 1,
        restrictionToggleCount: 1,
        submitPlacement: "route-header",
        mapToolbarActionLabels: ["Draw", "Pan", "Undo", "Erase route", "Reset view"],
        mapToolbarSubmitVisible: false,
        mapToolbarRestrictionToggleVisible: false,
        restrictionControlPlacement: "legend-control",
        duplicateControlGroupsVisible: false
      },
      resultPanels: {
        learnerPanelTitle: "Route feedback",
        preSubmitFeedbackPanelVisible: false,
        postSubmitFeedbackPanelVisible: true,
        submittedResultPanelCount: 1,
        betaCoachingNoteCount: 1,
        drawnRouteScoreSummaryVisible: false,
        routeAttemptReviewAndDrawnScoreSummaryTogether: false,
        routeReplayVisibleByDefault: false,
        summaryHeaderFirst: true,
        metricLabels: ["Score", "Your route", "Shortest legal route", "Extra distance"],
        desktopPlacement: "right-overlay-drawer",
        mobilePlacement: "bottom-sheet",
        feedbackDrawer: {
          desktopPlacement: "right-overlay-drawer",
          mobilePlacement: "bottom-sheet",
          widthCss: REAL_LONDON_BETA_FEEDBACK_DRAWER_WIDTH_CSS,
          mobileMaxHeightCss: REAL_LONDON_BETA_FEEDBACK_DRAWER_MOBILE_MAX_HEIGHT_CSS,
          opensAfterSubmit: true,
          closeActionLabel: "Close",
          reopenActionLabel: "View feedback",
          overlaysMapWithoutResizing: true,
          duplicateBelowMapPanelVisible: false,
          preservesSubmittedResultWhenClosed: true,
          resetViewDoesNotClose: true
        },
        resultBadgeLabels: ["PASS", "FAIL", "NEEDS REVIEW"],
        whatHappenedSectionVisible: true,
        issueCategories: ["Route efficiency", "Illegal movements", "Required stops", "Matching"],
        routeTooLongCategory: "Route efficiency",
        routeTooLongShowOnMapVisible: false,
        emptyIssueCategoriesHidden: true,
        requiredStopProgressUsesLearnerLabels: true,
        duplicateRequiredStopProgressPanelVisible: false,
        rawInternalIdsVisible: false,
        shortestLegalRouteComparisonAvailableAfterSubmit: true,
        shortestLegalRouteComparisonKeepsAttemptVisible: true,
        shortestLegalRouteComparisonActionLabel: "Show shortest legal route"
      },
      instructionArea: {
        visibleInstructionAreaCount: 1,
        mapWorkspaceInstructionVisible: false,
        instructionText:
          "Draw from the start marker to the destination marker. Visit checkpoints in order and follow road restrictions.",
        panModeText: "Pan mode is on. Drag the map to move the view. Switch back to Draw to add route strokes."
      },
      routeStatus: {
        badgeCount: 1,
        labels: ["Not started", "Drawing", "Ready to submit", "Submitted"]
      },
      legendControl: {
        presentation: "compact-collapsible-layer-control",
        collapsedByDefault: true,
        scrollbarHeavyPanel: false,
        rawOsmTagsVisible: false,
        learnerRestrictionEntriesVisible: true,
        restrictionToggleVisible: true
      },
      hiddenTechnicalDetails: {
        rawOsmNodeIds: true,
        rawGraphIds: true,
        rawRoadIds: true,
        localRouteAttemptIds: true,
        fixtureIds: true,
        technicalPerLegLabels: true,
        debugDiagnostics: true
      },
      markerDesign: {
        start: {
          shape: "pin",
          colourRole: "green",
          label: TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.start.text,
          compactText: TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.start.compactText,
          whiteCentreDetail: true,
          labelBubble: true,
          assetSrc: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.asset?.src ?? "/map-icons/start-marker.svg",
          transparentBackground: true,
          anchor: "bottom-centre",
          haloAndShadow: true
        },
        destination: {
          shape: "pin",
          colourRole: "red",
          label: TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.destination.text,
          compactText: TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.destination.compactText,
          whiteCentreDetail: true,
          labelBubble: true,
          assetSrc:
            TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.asset?.src ?? "/map-icons/destination-marker.svg",
          transparentBackground: true,
          anchor: "bottom-centre",
          haloAndShadow: true
        },
        checkpoint: {
          shape: "checkpoint-pin",
          colourRole: "blue",
          assetSrc:
            TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.checkpointBase.asset?.src ?? "/map-icons/checkpoint-marker.svg",
          transparentBackground: true,
          anchor: "bottom-centre",
          labelBubble: true,
          learnerFriendly: true
        },
        zoomAdaptiveSizing: {
          normalZoomScale: TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.assetZoomScale.lowScale,
          targetZoomScale: TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.assetZoomScale.baseScale,
          highZoomMaxScale: TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.assetZoomScale.maxScale,
          anchorPreserved: true
        }
      },
      issueMarkerDesign: {
        mapPresentation: "icon-first",
        groupedMarkerPerIssue: true,
        repeatedTextLabelsVisible: false,
        textDetailsPlacement: "route-feedback-panel",
        showOnMapFocusesGroupedIcon: true,
        supportedIssueIcons: [
          "no-entry",
          "wrong-way-one-way",
          "no-left-turn",
          "no-right-turn",
          "no-u-turn",
          "restricted-movement",
          "disconnected-gap",
          "missed-checkpoint"
        ]
      },
      feedbackEntryPoints: 1
    },
    feedback: {
      visible: true,
      placeholder: REAL_LONDON_BETA_FEEDBACK_PLACEHOLDER
    },
    knownLimitations: [...REAL_LONDON_BETA_KNOWN_LIMITATIONS],
    attribution: practiceMapAttributionLabel(mapOption),
    legendItems: buildLearnerRestrictionLegendItems().map((item) => ({
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
        "manual-run-result",
        "osm-qa-button",
        "exercise-qa-button",
        "graph-overlay-controls",
        "node-segment-id-controls",
        "road-node-edge-diagnostics",
        "blocked-way-ids",
        "raw-osm-node-ids",
        "raw-road-ids",
        "raw-route-graph-ids",
        "raw-graph-ids",
        "local-route-attempt-ids",
        "technical-per-leg-labels",
        "drawn-route-score-summary",
        "duplicate-route-controls",
        "duplicate-submit-status",
        "route-replay-panel",
        "real-london-pilot-qa",
        "real-london-pilot-playthrough",
        "adaptive-dev-dashboard",
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
      mapLegendMaxHeightPx: REAL_LONDON_BETA_COMPACT_LEGEND_MAX_HEIGHT_PX,
      markerHitTargetMinPx: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.touchTargets.minTapTargetPx,
      reviewIssueHitTargetMinPx: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.touchTargets.reviewIssueHitRadius * 2,
      calloutMinHeightPx: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.touchTargets.calloutMinHeight,
      restrictionSummaryFirst: true,
      restrictionDetailsCollapsedByDefault: true,
      restrictionDebugDetailsHidden: true,
      baseRestrictionOverlaysDefaultVisible: true,
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
  return fixtureUse === "routeReviewFixture"
    ? "Route review"
    : fixtureUse === "visualQaOnly"
      ? "Map preview only"
      : "Scored practice";
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
    fixtureUseLabel: routeRunnerMapOptionBetaStatusLabel(option) || fixtureUseLabel(fixtureUse),
    visibleInBeta: routeRunnerMapOptionIsVisibleInBeta(option),
    scoreable: routeRunnerMapOptionIsScoreable(option) && fixtureUseIsScoreable(fixtureUse),
    visualQaOnly: fixtureUse === "visualQaOnly",
    routeReviewFixture: fixtureUse === "routeReviewFixture",
    devOnlyStressTest: option.fixturePerformanceGate === "devOnlyStressTest",
    betaPracticeAllowed:
      option.fixturePerformanceGate === "betaPracticeAllowed" ||
      option.fixturePerformanceGate === "betaPracticeAllowedWithLoading" ||
      option.fixturePerformanceGate === undefined,
    fixturePerformanceGate: option.fixturePerformanceGate ?? null,
    lazyLoadId: option.lazyLoadId ?? null,
    lazyLoadingLabel: option.lazyLoadingLabel ?? null,
    selected
  };
}

function practiceMapAttributionLabel(option: RouteRunnerMapOption): string {
  if (option.attribution) {
    return option.attribution;
  }

  return option.source === "converted-osm" ? "OpenStreetMap contributors" : "Fictional practice map";
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

function requirePracticeExercise(exercises: readonly RouteExercise[], exerciseId: string, mapId: string): RouteExercise {
  const exercise = exercises.find((candidate) => candidate.id === exerciseId);

  if (!exercise) {
    throw new Error(`Unknown practice exercise ${exerciseId} for ${mapId}.`);
  }

  return exercise;
}

function betaPracticeExercisesForMapOption(option: RouteRunnerMapOption, scoreable: boolean): RouteExercise[] {
  if (!scoreable) {
    return [];
  }

  return option.exercises.filter((exercise) => exerciseHasLegalExpectedRoute(option.map, exercise));
}

function exerciseHasLegalExpectedRoute(map: MapDefinition, exercise: RouteExercise): boolean {
  const graph = buildMapGraph(map);
  let stopNodeIds: string[];

  try {
    stopNodeIds = exercise.stops.map((stop) => resolveExerciseStopNodeId(stop, map));
  } catch {
    return false;
  }

  if (stopNodeIds.length < 2) {
    return false;
  }

  return findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds,
    restrictions: map.restrictions
  }).found;
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
  const option = REAL_LONDON_BETA_MAP_OPTIONS.find((candidate) => candidate.map.id === REAL_LONDON_OSM_PILOT_MAP_ID);

  if (!option) {
    throw new Error("Real London beta practice default map option is not registered.");
  }

  return option;
}
