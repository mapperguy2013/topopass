"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import {
  appendRouteDraftPoint,
  buildMapGraph,
  buildIllegalDrawnMovementHighlights,
  clearRouteDraft,
  createDrawnRouteTrace,
  createEmptyRouteDraft,
  createInsufficientDrawnGesturePipelineResult,
  finishRouteStroke,
  getTurnRestrictionVisuals,
  hasUndoableRouteStroke,
  mapToScreenPoint,
  routeDraftToDrawnRouteTrace,
  runDrawnRoutePipeline,
  runRouteExercise,
  screenToMapPoint,
  startRouteStroke,
  undoLastRouteStroke,
  validateDrawnRouteGesture,
  type DrawnRouteDraft,
  type DrawnRoutePipelineResult,
  type DrawnRouteTrace,
  type MapDefinition,
  type MapNode,
  type MapRoad,
  type RouteExercise,
  type RouteScoringLegResult,
  type RouteStop,
  type RunRouteExerciseResult,
  type ScreenMapViewport,
  type SnappedRouteTraceResult,
  type TurnRestrictionVisual,
  type Vec2
} from "@/lib/map-engine";
import { parseCommaSeparatedIds } from "./routeRunnerInput";
import {
  buildAdaptivePracticeQueue,
  buildAttemptHistoryInsights,
  type AdaptivePracticeExercise,
  type AdaptivePracticeExerciseDifficulty,
  type AdaptivePracticeQueueItem,
  type AdaptivePracticeQueuePriority,
  type AdaptivePracticeSourceSignals
} from "./adaptivePracticeQueue";
import {
  buildCompactAdaptiveRecommendationDisplay
} from "./adaptiveRecommendationDisplay";
import {
  MARLOWE_DISTRICT_EXERCISE_METADATA,
  MARLOWE_DISTRICT_METADATA_CATALOGUE,
  exerciseMetadataCatalogueToAdaptivePracticeExercises,
  getExerciseMetadata,
  getMapMetadataForExercise
} from "./exerciseMapMetadata";
import {
  ADAPTIVE_PRACTICE_LAUNCHER_STORAGE_KEY,
  appendAdaptivePracticeOutcomeFeedback,
  buildAdaptivePracticeOutcomeFeedback,
  completeAdaptivePracticeItem,
  createEmptyAdaptivePracticeLauncherState,
  dismissAdaptivePracticeItem,
  getAdaptivePracticeItemStatus,
  getLatestAdaptivePracticeOutcomeFeedback,
  parseStoredAdaptivePracticeLauncherState,
  serialiseAdaptivePracticeLauncherState,
  skipAdaptivePracticeItem,
  startAdaptivePracticeItem,
  summarizeAdaptivePracticeOutcomeFeedback,
  undoAdaptivePracticeItemStatus,
  type AdaptivePracticeOutcome,
  type AdaptivePracticeLauncherItemStatus,
  type AdaptivePracticeLauncherState
} from "./adaptivePracticeLauncher";
import {
  buildRoadRestrictionOverlays,
  buildRouteIssueOverlays,
  getDrawnPipelineDisplayStatus,
  getDrawnRouteScoreDisplay,
  getPipelineIssueGroups,
  getPipelineStageBadges,
  getRouteIssueLineStyle,
  getRequiredStopVisitStatuses,
  type DrawnPipelineDisplayStatus,
  type DrawnRouteScoreDisplayState,
  type PipelineStageState,
  type RoadRestrictionOverlay,
  type RouteIssueOverlay
} from "./routeRunnerDisplay";
import {
  appendRouteAttemptToHistory,
  buildRouteAttemptReview,
  createEmptyLearnerWeakAreaProfile,
  createRouteAttemptHistoryState,
  getLearnerWeakAreaPracticeFocus,
  getSelectedRouteAttemptHistoryItem,
  getStrongestWeakAreas,
  selectRouteAttemptHistoryItem,
  updateLearnerWeakAreaProfile,
  type LearnerWeakAreaProfile,
  type LearnerWeakAreaProfileEntry,
  type RouteAttemptHistoryState,
  type RouteAttemptReview,
  type RouteAttemptReviewItemSeverity
} from "./routeAttemptReview";
import {
  buildSavedAttemptHistoryReviewList,
  buildSavedAttemptReview
} from "./routeAttemptHistoryReview";
import {
  buildRouteWeakAreaAnalytics,
  type RouteWeakAreaAnalyticsPriority
} from "./weakAreaAnalytics";
import { listRouteAttempts, saveRouteAttempt, type SavedRouteAttemptListItem } from "./routeAttemptStorage";
import {
  createRouteAttemptVersionSnapshot,
  formatRouteAttemptVersionSnapshot
} from "./routeAttemptVersionSnapshot";
import {
  createActiveDrawingPipelineResult,
  prepareTraceForRoutePipeline
} from "./routeRunnerPerformance";
import {
  buildSyntheticBackgroundFeatures,
  buildSyntheticLandmarkVisuals,
  buildSyntheticLinearFeatures,
  buildSyntheticMapLabels,
  buildSyntheticRoadVisuals,
  type SyntheticBackgroundFeature,
  type SyntheticLandmarkVisual,
  type SyntheticLinearFeature,
  type SyntheticMapLabel,
  type SyntheticRoadVisual,
  type SyntheticStreetMapLegendItem
} from "./syntheticStreetMapRenderer";
import {
  buildRestrictionLegendItems,
  buildRestrictionMapVisualItems,
  buildSelectedRestrictionHighlight,
  resolveRestrictionFocusTarget,
  type RestrictionFocusReviewItem,
  type RestrictionMapVisualItem,
  type SelectedRestrictionHighlight
} from "./restrictionMapVisuals";
import { getRealisticSyntheticScenarioForExercise } from "./realisticSyntheticExercises";
import {
  buildFastestRouteOverlay,
  createHiddenFastestRouteRevealState,
  hideFastestRouteReveal,
  toggleFastestRouteReveal,
  type FastestRouteRevealState
} from "./fastestRouteOverlay";
import {
  INVALID_EXERCISE_ROUTE_MESSAGE,
  formatExerciseAvailabilityOptionLabel,
  validateExerciseReachabilityList,
  type ExerciseRouteAvailability
} from "./exerciseValidation";
import {
  buildRouteExerciseDisplayModel,
  formatRouteExerciseSelectorLabel
} from "./routeRunnerExerciseDisplay";
import {
  applyPanToMapView,
  applyWheelZoomToMapView,
  buildZoomedMapViewport,
  canStartDrawingWithMapPointer,
  canZoomInMapView,
  canZoomOutMapView,
  createDefaultMapScrollLockState,
  createDefaultMapViewportState,
  enterMapScrollLockState,
  isMiddleButtonMapPanActive,
  isMiddleButtonMapPanPointer,
  leaveMapScrollLockState,
  resetMapViewport,
  setMapInteractionMode,
  shouldPreventWheelPageScrollOverMap,
  updateMapScrollLockForOutsidePointerDown,
  zoomInMapView,
  zoomOutMapView,
  type MapInteractionMode,
  type MapScrollLockState,
  type MapViewportState
} from "./mapViewport";
import {
  ROUTE_REPLAY_SPEED_OPTIONS,
  advanceRouteReplayProgress,
  buildRouteReplayMarkers,
  buildRouteReplayTracks,
  calculateRouteReplayDurationMs,
  calculateRouteReplayTrackLength,
  canReplayRouteGeometry,
  createRouteReplayState,
  normaliseRouteReplayGeometry,
  pauseRouteReplay,
  resetRouteReplayState,
  selectRouteReplayMode,
  setRouteReplaySpeed,
  startRouteReplay,
  type RouteReplayMarker,
  type RouteReplayMode,
  type RouteReplayState
} from "./routeReplay";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRouteRunnerMapViewportBounds,
  getRouteRunnerMapOption,
  isConvertedOsmRouteRunnerMap
} from "./routeRunnerMaps";
import {
  buildOsmDebugOverlayModel,
  canOfferOsmDebugOverlay,
  createDefaultOsmDebugOverlayState,
  type OsmDebugDirectedEdgeVisual,
  type OsmDebugOverlayModel,
  type OsmDebugOverlayStyle,
  type OsmDebugOverlayState
} from "./routeRunnerOsmDebug";
import {
  buildOsmQaStatusPanelModel,
  type OsmQaStatusPanelModel,
  type OsmQaStatusState
} from "./routeRunnerOsmQaStatus";
import { buildRealLondonPilotReadinessReport } from "./routeRunnerOsmRealPilotReadinessReport";
import {
  buildRealLondonPilotQaPanelModel,
  shouldShowRealLondonPilotQaPanel
} from "./routeRunnerRealLondonPilotQaPanel";
import {
  buildRealLondonPilotPlaythroughPanelModel,
  type RealLondonPilotPlaythroughTone
} from "./routeRunnerRealLondonPilotPlaythroughPanel";
import {
  buildOsmExerciseDebugOverlayModel,
  canOfferOsmExerciseDebugOverlay,
  createDefaultOsmExerciseDebugOverlayState,
  type OsmExerciseDebugBlockedEdge,
  type OsmExerciseDebugOverlayModel,
  type OsmExerciseDebugOverlayState,
  type OsmExerciseDebugStopMarker
} from "./routeRunnerOsmExerciseDebugOverlay";

const CANVAS_WIDTH = 1120;
const CANVAS_HEIGHT = 760;
const SNAP_TOLERANCE = 24;
const MIN_DRAWN_GESTURE_POINT_COUNT = 3;
const MIN_DRAWN_GESTURE_DISTANCE = 10;
const MAX_PIPELINE_TRACE_POINTS = 1200;
const RESTRICTION_MAP_LEGEND_ITEMS = buildRestrictionLegendItems();
const WEAK_AREA_PROFILE_STORAGE_KEY = "topopass.devRouteRunner.weakAreaProfile";
const ADAPTIVE_PRACTICE_EXERCISES: AdaptivePracticeExercise[] =
  exerciseMetadataCatalogueToAdaptivePracticeExercises(MARLOWE_DISTRICT_EXERCISE_METADATA);
const DEFAULT_ROUTE_RUNNER_MAP_OPTION =
  getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID) ?? ROUTE_RUNNER_MAP_OPTIONS[0];

type RouteAttemptSaveStatus = {
  state: "idle" | "saving" | "saved" | "failed";
  message: string | null;
  id?: string;
};

type SavedAttemptHistoryState = {
  state: "loading" | "loaded" | "error";
  attempts: SavedRouteAttemptListItem[];
  message: string | null;
  selectedAttemptId: string | null;
};

function emptySnapPreview(): SnappedRouteTraceResult {
  return {
    isValidTrace: false,
    hasOffRoadPoints: false,
    snapTolerance: SNAP_TOLERANCE,
    snappedPoints: [],
    connectivity: {
      selectedCandidateRoadIds: [],
      collapsedRoadIds: [],
      isContinuous: true,
      disconnectedTransitions: [],
      diagnostics: {
        candidateCountsByPoint: [],
        candidates: [],
        selectedCandidates: [],
        totalCost: 0,
        usedDisconnectedPenalty: false
      }
    },
    diagnostics: []
  };
}

function invalidExercisePipelineResult(
  drawnTrace: DrawnRouteTrace,
  availability: ExerciseRouteAvailability
): DrawnRoutePipelineResult {
  return {
    status: "exercise_failed",
    simplifiedTrace: createDrawnRouteTrace(drawnTrace.points),
    snappedRoute: null,
    snappedPoints: [],
    matchResult: null,
    exerciseResult: null,
    warnings: [
      {
        source: "exercise",
        code: "invalid_exercise",
        severity: "error",
        message: availability.reason ?? INVALID_EXERCISE_ROUTE_MESSAGE
      },
      ...availability.errors.map((error) => ({
        source: "exercise" as const,
        code: "invalid_exercise_detail",
        severity: "error" as const,
        message: error
      }))
    ]
  };
}

function stopLabel(stop: RouteStop, map: MapDefinition): string {
  if (stop.type === "node") {
    const node = map.nodes.find((candidate) => candidate.id === stop.nodeId);

    return `${node?.label ?? stop.nodeId} (${stop.nodeId})`;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);
  const nearestNode = landmark?.nearestNodeId ? `, nearest node ${landmark.nearestNodeId}` : "";

  return `${landmark?.name ?? stop.landmarkId} (${stop.landmarkId}${nearestNode})`;
}

function resolveStopNode(stop: RouteStop, map: MapDefinition): MapNode | undefined {
  const nodeId =
    stop.type === "node"
      ? stop.nodeId
      : map.landmarks.find((landmark) => landmark.id === stop.landmarkId)?.nearestNodeId;

  return map.nodes.find((node) => node.id === nodeId);
}

function resultSummary(result: RunRouteExerciseResult): string {
  const score = result.score.scorePercent.toFixed(1);
  const status = result.score.passed ? "Pass" : "Fail";
  const reasons = result.score.failureReasons.length > 0 ? `: ${result.score.failureReasons.join(", ")}` : "";

  return `${status} - ${score}%${reasons}`;
}

function legStatusLabel(leg: RouteScoringLegResult): string {
  if (leg.automaticFail) {
    return "Automatic fail";
  }

  return leg.passed ? "Pass" : "Fail";
}

function legIssueSummary(leg: RouteScoringLegResult): string {
  if (leg.violations.length > 0) {
    return leg.violations.map((violation) => violation.type).join(", ");
  }

  if (leg.failureReasons.length > 0) {
    return leg.failureReasons.join(", ");
  }

  return "None";
}

function formatDistance(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters)) {
    return "n/a";
  }

  return `${Math.round(distanceMeters)}m`;
}

function uniqueOrdered(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function selectedRoadNames(roadIds: readonly string[], map: MapDefinition): string {
  if (roadIds.length === 0) {
    return "None";
  }

  return roadIds
    .map((roadId) => {
      const road = map.roads.find((candidate) => candidate.id === roadId);

      return road?.name ? `${roadId} (${road.name})` : roadId;
    })
    .join(", ");
}

function idList(values: readonly string[]): string {
  return values.length > 0 ? values.join(" -> ") : "None";
}

function nullableIdList(values: ReadonlyArray<string | null>): string {
  return values.length > 0 ? values.map((value) => value ?? "unresolved").join(" -> ") : "None";
}

function pipelineStatusClass(status: DrawnPipelineDisplayStatus): string {
  if (status === "scored") {
    return "bg-green-100 text-green-800";
  }

  if (status === "no drawing") {
    return "bg-slate-100 text-slate-700";
  }

  if (status === "insufficient drawing") {
    return "bg-amber-100 text-amber-900";
  }

  if (status === "drawing") {
    return "bg-blue-100 text-blue-800";
  }

  if (status === "snapped" || status === "matched") {
    return "bg-amber-100 text-amber-900";
  }

  return "bg-red-100 text-red-800";
}

function stageBadgeClass(state: PipelineStageState): string {
  if (state === "complete") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (state === "active") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (state === "failed") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-500";
}

function scoreStateClass(state: DrawnRouteScoreDisplayState): string {
  if (state === "pass") {
    return "border-green-200 bg-green-50 text-green-900";
  }

  if (state === "fail") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (state === "blocked") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function reviewStateClass(status: RouteAttemptReview["status"]): string {
  if (status === "pass") {
    return "border-green-200 bg-green-50 text-green-950";
  }

  if (status === "fail") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  if (status === "blocked") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-800";
}

function realLondonPlaythroughToneClass(tone: RealLondonPilotPlaythroughTone): string {
  if (tone === "pass") {
    return "border-green-200 bg-green-50 text-green-950";
  }

  if (tone === "fail") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  if (tone === "active") {
    return "border-blue-200 bg-blue-50 text-blue-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-800";
}

function saveStatusClass(state: RouteAttemptSaveStatus["state"]): string {
  if (state === "saved") {
    return "border-green-200 bg-green-50 text-green-950";
  }

  if (state === "failed") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  if (state === "saving") {
    return "border-blue-200 bg-blue-50 text-blue-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function savedAttemptStatusClass(status: SavedRouteAttemptListItem["statusLabel"]): string {
  if (status === "Pass") {
    return "border-green-200 bg-green-50 text-green-950";
  }

  if (status === "Fail") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  if (status === "Blocked") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-800";
}

function osmQaStatusClass(state: OsmQaStatusState): string {
  if (state === "pass") {
    return "border-green-200 bg-green-50 text-green-950";
  }

  if (state === "fail") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function osmQaStatusLabel(state: OsmQaStatusState): string {
  if (state === "pass") {
    return "Pass";
  }

  if (state === "fail") {
    return "Fail";
  }

  return "Not run";
}

function osmQaDistanceLabel(distanceMeters: number | null): string {
  return distanceMeters === null ? "n/a" : `${distanceMeters.toFixed(0)} m`;
}

function osmQaSelectedSummaryLabel(selectedExercise: NonNullable<OsmQaStatusPanelModel["selectedExercise"]>): string {
  return `${selectedExercise.routeEdgeCount} edge${selectedExercise.routeEdgeCount === 1 ? "" : "s"} | ${osmQaDistanceLabel(
    selectedExercise.routeDistanceMeters
  )}`;
}

function weakAreaAnalyticsPriorityClass(priority: RouteWeakAreaAnalyticsPriority): string {
  if (priority === "high") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  if (priority === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-800";
}

function weakAreaLastSeenLabel(lastSeenAt: string | null): string {
  if (!lastSeenAt) {
    return "date unavailable";
  }

  const timestamp = Date.parse(lastSeenAt);

  if (!Number.isFinite(timestamp)) {
    return "date unavailable";
  }

  return new Date(timestamp).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function adaptivePriorityClass(priority: AdaptivePracticeQueuePriority): string {
  if (priority === "urgent") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  if (priority === "high") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  if (priority === "medium") {
    return "border-blue-200 bg-blue-50 text-blue-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-800";
}

function adaptiveSourceSignalLabels(signals: AdaptivePracticeSourceSignals): string[] {
  const labels: string[] = [];

  if (signals.latestReview) {
    labels.push("latest review");
  }

  if (signals.weakAreaProfile) {
    labels.push("weak-area profile");
  }

  if (signals.attemptHistory) {
    labels.push("attempt history");
  }

  if (signals.savedAttempts) {
    labels.push("saved attempts");
  }

  if (signals.outcomeFeedback) {
    labels.push("outcome feedback");
  }

  return labels;
}

function adaptiveOutcomeClass(outcome: AdaptivePracticeOutcome): string {
  if (outcome === "resolved") {
    return "border-green-200 bg-green-50 text-green-950";
  }

  if (outcome === "improved") {
    return "border-blue-200 bg-blue-50 text-blue-950";
  }

  if (outcome === "repeated-issue") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  if (outcome === "mixed") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function adaptiveLauncherStatusLabel(status: AdaptivePracticeLauncherItemStatus): string {
  if (status === "recommended") {
    return "recommended";
  }

  return status;
}

function adaptiveLauncherStatusClass(status: AdaptivePracticeLauncherItemStatus): string {
  if (status === "active") {
    return "border-blue-200 bg-blue-50 text-blue-950";
  }

  if (status === "completed") {
    return "border-green-200 bg-green-50 text-green-950";
  }

  if (status === "dismissed") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  if (status === "skipped") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-slate-200 bg-white text-slate-800";
}

function adaptiveDifficultyClass(difficulty: AdaptivePracticeExerciseDifficulty | null): string {
  if (difficulty === "hard") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  if (difficulty === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  if (difficulty === "easy") {
    return "border-green-200 bg-green-50 text-green-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function syntheticLegendToneClass(tone: SyntheticStreetMapLegendItem["tone"]): string {
  if (tone === "route") {
    return "border-purple-200 bg-purple-50 text-purple-950";
  }

  if (tone === "shortest" || tone === "one-way" || tone === "start") {
    return "border-blue-200 bg-blue-50 text-blue-950";
  }

  if (tone === "illegal" || tone === "restriction" || tone === "turn") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  if (tone === "restricted" || tone === "checkpoint") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  if (tone === "finish") {
    return "border-slate-300 bg-slate-100 text-slate-950";
  }

  if (tone === "background") {
    return "border-green-200 bg-green-50 text-green-950";
  }

  return "border-slate-200 bg-white text-slate-800";
}

function linkedAdaptiveExercise(item: AdaptivePracticeQueueItem): AdaptivePracticeExercise | null {
  for (const exerciseId of item.relatedExerciseIds) {
    const exercise = ADAPTIVE_PRACTICE_EXERCISES.find((candidate) => candidate.id === exerciseId);

    if (exercise) {
      return exercise;
    }
  }

  return null;
}

function launchableRouteExerciseId(item: AdaptivePracticeQueueItem): string | null {
  for (const exerciseId of item.relatedExerciseIds) {
    if (ROUTE_RUNNER_MAP_OPTIONS.some((option) => option.exercises.some((exercise) => exercise.id === exerciseId))) {
      return exerciseId;
    }
  }

  return null;
}

function adaptiveWeakAreaLabel(item: AdaptivePracticeQueueItem): string {
  return item.relatedWeakAreas.length > 0 ? item.relatedWeakAreas.map((weakArea) => weakArea.replaceAll("-", " ")).join(", ") : "Mixed practice";
}

function reviewItemClass(severity: RouteAttemptReviewItemSeverity): string {
  if (severity === "error") {
    return "border-red-100 bg-white text-red-950";
  }

  if (severity === "warning") {
    return "border-amber-100 bg-white text-amber-950";
  }

  return "border-blue-100 bg-white text-blue-950";
}

function routeReplayModeButtonClass(active: boolean): string {
  return active
    ? "border-blue-300 bg-blue-700 text-white"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
}

function routeReplayStatusLabel(state: RouteReplayState): string {
  if (state.status === "playing") {
    return "Playing";
  }

  if (state.status === "paused" && state.progress >= 1) {
    return "Finished";
  }

  if (state.status === "paused") {
    return "Paused";
  }

  return "Ready";
}

function matchedRoutePayloadForStorage(result: DrawnRoutePipelineResult) {
  const match = result.matchResult;

  if (!match) {
    return null;
  }

  return {
    status: match.status,
    isReadyForRunRouteExercise: match.isReadyForRunRouteExercise,
    orderedRoadIds: match.orderedRoadIds,
    selectedRoadIds: match.selection.roadIds ?? [],
    selectedNodeIds: match.selection.nodeIds ?? [],
    directedEdgeIds: match.directedEdgeIds,
    requiredNodeIds: result.exerciseResult?.normalisedAttempt.requiredNodeIds ?? [],
    normalisedAttempt: result.exerciseResult
      ? {
          exerciseId: result.exerciseResult.normalisedAttempt.exerciseId,
          requiredNodeIds: result.exerciseResult.normalisedAttempt.requiredNodeIds,
          selectedNodeIds: result.exerciseResult.normalisedAttempt.selectedNodeIds,
          selectedRoadIds: result.exerciseResult.normalisedAttempt.selectedRoadIds,
          selectedDirectedEdgeIds: result.exerciseResult.normalisedAttempt.selectedDirectedEdgeIds
        }
      : null
  };
}

function normaliseStoredWeakAreaEntry(value: unknown): LearnerWeakAreaProfileEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Partial<LearnerWeakAreaProfileEntry>;

  if (
    typeof entry.weaknessType !== "string" ||
    typeof entry.label !== "string" ||
    typeof entry.count !== "number" ||
    typeof entry.priority !== "string" ||
    typeof entry.lastSeenAttemptNumber !== "number"
  ) {
    return null;
  }

  if (!["high", "medium", "low"].includes(entry.priority)) {
    return null;
  }

  return {
    weaknessType: entry.weaknessType,
    label: entry.label,
    count: entry.count,
    priority: entry.priority,
    lastSeenAttemptNumber: entry.lastSeenAttemptNumber
  } as LearnerWeakAreaProfileEntry;
}

function readStoredWeakAreaProfile(): LearnerWeakAreaProfile {
  if (typeof window === "undefined") {
    return createEmptyLearnerWeakAreaProfile();
  }

  try {
    const rawProfile = window.localStorage.getItem(WEAK_AREA_PROFILE_STORAGE_KEY);

    if (!rawProfile) {
      return createEmptyLearnerWeakAreaProfile();
    }

    const parsedProfile = JSON.parse(rawProfile) as Partial<LearnerWeakAreaProfile>;

    if (
      typeof parsedProfile.attemptsReviewed !== "number" ||
      typeof parsedProfile.totalWeaknessCount !== "number" ||
      !Array.isArray(parsedProfile.weaknesses)
    ) {
      return createEmptyLearnerWeakAreaProfile();
    }

    return {
      attemptsReviewed: parsedProfile.attemptsReviewed,
      totalWeaknessCount: parsedProfile.totalWeaknessCount,
      weaknesses: parsedProfile.weaknesses
        .map((entry) => normaliseStoredWeakAreaEntry(entry))
        .filter((entry): entry is LearnerWeakAreaProfileEntry => Boolean(entry))
    };
  } catch {
    return createEmptyLearnerWeakAreaProfile();
  }
}

function writeStoredWeakAreaProfile(profile: LearnerWeakAreaProfile): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WEAK_AREA_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function readStoredAdaptivePracticeLauncherState(): AdaptivePracticeLauncherState {
  if (typeof window === "undefined") {
    return createEmptyAdaptivePracticeLauncherState();
  }

  try {
    return parseStoredAdaptivePracticeLauncherState(
      window.localStorage.getItem(ADAPTIVE_PRACTICE_LAUNCHER_STORAGE_KEY)
    );
  } catch {
    return createEmptyAdaptivePracticeLauncherState();
  }
}

function writeStoredAdaptivePracticeLauncherState(state: AdaptivePracticeLauncherState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ADAPTIVE_PRACTICE_LAUNCHER_STORAGE_KEY,
      serialiseAdaptivePracticeLauncherState(state)
    );
  } catch {
    // Browser storage can be disabled in dev environments. The launcher remains usable in memory.
  }
}

function stopVisitClass(visited: boolean): string {
  return visited ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900";
}

function displayStatusText(status: DrawnPipelineDisplayStatus): string {
  return status[0].toUpperCase() + status.slice(1);
}

function nodeById(nodeId: string, map: MapDefinition): MapNode | undefined {
  return map.nodes.find((node) => node.id === nodeId);
}

function nodeLabel(nodeId: string, map: MapDefinition): string {
  const node = nodeById(nodeId, map);

  return node?.label ? `${node.label} (${nodeId})` : nodeId;
}

function drawArrowHead(context: CanvasRenderingContext2D, fromPoint: Vec2, toPoint: Vec2): void {
  const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);
  const arrowLength = 10;

  context.beginPath();
  context.moveTo(toPoint.x, toPoint.y);
  context.lineTo(
    toPoint.x - arrowLength * Math.cos(angle - Math.PI / 6),
    toPoint.y - arrowLength * Math.sin(angle - Math.PI / 6)
  );
  context.lineTo(
    toPoint.x - arrowLength * Math.cos(angle + Math.PI / 6),
    toPoint.y - arrowLength * Math.sin(angle + Math.PI / 6)
  );
  context.closePath();
  context.fill();
}

function drawNodeMarker(input: {
  context: CanvasRenderingContext2D;
  point: Vec2;
  fillStyle: string;
  radius: number;
}): void {
  input.context.fillStyle = input.fillStyle;
  input.context.beginPath();
  input.context.arc(input.point.x, input.point.y, input.radius, 0, Math.PI * 2);
  input.context.fill();
}

function drawExerciseStopMarker(input: {
  context: CanvasRenderingContext2D;
  point: Vec2;
  role: "start" | "checkpoint" | "finish";
  index: number;
}): void {
  const fillStyle =
    input.role === "start" ? "#15803d" : input.role === "finish" ? "#6d28d9" : "#f97316";
  const markerText = input.role === "start" ? "S" : input.role === "finish" ? "F" : `CP${input.index}`;
  const radius = input.role === "checkpoint" ? 12 : 14;

  input.context.save();
  input.context.shadowColor = "rgba(15,23,42,0.24)";
  input.context.shadowBlur = 10;
  input.context.shadowOffsetY = 2;
  input.context.fillStyle = "rgba(255,255,255,0.96)";
  input.context.strokeStyle = fillStyle;
  input.context.lineWidth = 3;
  input.context.beginPath();
  input.context.arc(input.point.x, input.point.y, radius + 5, 0, Math.PI * 2);
  input.context.fill();
  input.context.stroke();
  input.context.shadowColor = "transparent";

  input.context.fillStyle = fillStyle;
  input.context.beginPath();
  input.context.arc(input.point.x, input.point.y, radius, 0, Math.PI * 2);
  input.context.fill();

  input.context.fillStyle = "#ffffff";
  input.context.font = markerText.length > 1 ? "800 9px Arial, sans-serif" : "800 12px Arial, sans-serif";
  input.context.textAlign = "center";
  input.context.textBaseline = "middle";
  input.context.fillText(markerText, input.point.x, input.point.y + 0.5);
  input.context.restore();
}

function drawSyntheticBackgroundFeature(
  context: CanvasRenderingContext2D,
  feature: SyntheticBackgroundFeature,
  viewport: ScreenMapViewport
): void {
  if (feature.points.length < 3) {
    return;
  }

  const screenPoints = feature.points.map((point) => mapToScreenPoint(point, viewport));

  context.save();
  context.fillStyle = feature.fillColor;
  context.strokeStyle = feature.strokeColor;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(screenPoints[0].x, screenPoints[0].y);

  for (const point of screenPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

function drawSyntheticLinearFeature(
  context: CanvasRenderingContext2D,
  feature: SyntheticLinearFeature,
  viewport: ScreenMapViewport
): void {
  if (feature.points.length < 2) {
    return;
  }

  const screenPoints = feature.points.map((point) => mapToScreenPoint(point, viewport));

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.setLineDash([]);
  context.strokeStyle = feature.casingColor;
  context.lineWidth = feature.casingWidth;
  context.beginPath();
  context.moveTo(screenPoints[0].x, screenPoints[0].y);

  for (const point of screenPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.setLineDash(feature.dash ?? []);
  context.strokeStyle = feature.strokeColor;
  context.lineWidth = feature.strokeWidth;
  context.beginPath();
  context.moveTo(screenPoints[0].x, screenPoints[0].y);

  for (const point of screenPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawSyntheticRoadVisual(
  context: CanvasRenderingContext2D,
  visual: SyntheticRoadVisual,
  viewport: ScreenMapViewport
): void {
  if (visual.points.length < 2) {
    return;
  }

  const screenPoints = visual.points.map((point) => mapToScreenPoint(point, viewport));

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.setLineDash([]);
  context.strokeStyle = visual.style.casingColor;
  context.lineWidth = visual.style.casingWidth;
  context.beginPath();
  context.moveTo(screenPoints[0].x, screenPoints[0].y);

  for (const point of screenPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.setLineDash(visual.style.dash ?? []);
  context.strokeStyle = visual.style.strokeColor;
  context.lineWidth = visual.style.strokeWidth;
  context.beginPath();
  context.moveTo(screenPoints[0].x, screenPoints[0].y);

  for (const point of screenPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawSyntheticLandmarkVisual(
  context: CanvasRenderingContext2D,
  visual: SyntheticLandmarkVisual,
  viewport: ScreenMapViewport
): void {
  const point = mapToScreenPoint(visual.point, viewport);

  context.save();
  context.fillStyle = visual.haloColor;
  context.beginPath();
  context.arc(point.x, point.y, visual.radius + 8, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = visual.fillColor;
  context.strokeStyle = visual.strokeColor;
  context.lineWidth = visual.kind === "station" ? 3.5 : 2.5;
  context.beginPath();
  context.arc(point.x, point.y, visual.radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  if (visual.kind === "station") {
    context.strokeStyle = "#1d4ed8";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(point.x - visual.radius - 4, point.y);
    context.lineTo(point.x + visual.radius + 4, point.y);
    context.stroke();
  } else if (visual.kind === "hospital") {
    context.strokeStyle = "#2563eb";
    context.lineWidth = 2.4;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(point.x - 4, point.y);
    context.lineTo(point.x + 4, point.y);
    context.moveTo(point.x, point.y - 4);
    context.lineTo(point.x, point.y + 4);
    context.stroke();
  } else if (visual.kind === "park") {
    context.fillStyle = "#16a34a";
    context.beginPath();
    context.arc(point.x, point.y, 3, 0, Math.PI * 2);
    context.fill();
  } else if (visual.kind === "market" || visual.kind === "dock") {
    context.strokeStyle = visual.strokeColor;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(point.x - 4, point.y + 3);
    context.lineTo(point.x, point.y - 4);
    context.lineTo(point.x + 4, point.y + 3);
    context.stroke();
  }

  context.restore();
}

function readableRoadLabelAngle(angleRadians: number): number {
  if (angleRadians > Math.PI / 2 || angleRadians < -Math.PI / 2) {
    return angleRadians + Math.PI;
  }

  return angleRadians;
}

function drawSyntheticMapLabel(
  context: CanvasRenderingContext2D,
  label: SyntheticMapLabel,
  viewport: ScreenMapViewport
): void {
  const point = mapToScreenPoint(label.point, viewport);
  const isRoadLabel = label.kind === "road";
  const isAreaLabel = label.kind === "area";
  const isLandmarkLabel = label.kind === "landmark";
  const isStopLabel = label.kind === "start" || label.kind === "checkpoint" || label.kind === "finish";

  context.save();
  context.translate(point.x, point.y);

  if (isRoadLabel && typeof label.angleRadians === "number") {
    context.rotate(readableRoadLabelAngle(label.angleRadians));
  }

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = isAreaLabel
    ? "600 13px Arial, sans-serif"
    : isStopLabel
      ? "700 11px Arial, sans-serif"
      : isLandmarkLabel
        ? "700 11px Arial, sans-serif"
        : "600 11px Arial, sans-serif";
  context.lineWidth = isStopLabel ? 4 : 3;
  context.strokeStyle = isAreaLabel ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.94)";
  context.fillStyle = isAreaLabel
    ? "rgba(71,85,105,0.56)"
    : isStopLabel
      ? "#0f172a"
      : isLandmarkLabel
        ? "rgba(15,23,42,0.78)"
        : "rgba(51,65,85,0.78)";
  context.strokeText(label.text, 0, isStopLabel ? -18 : 0);
  context.fillText(label.text, 0, isStopLabel ? -18 : 0);
  context.restore();
}

function drawSyntheticStreetMapBase(input: {
  context: CanvasRenderingContext2D;
  map: MapDefinition;
  viewport: ScreenMapViewport;
  backgroundFeatures: SyntheticBackgroundFeature[];
  linearFeatures: SyntheticLinearFeature[];
  roadVisuals: SyntheticRoadVisual[];
  showOsmRoadLabels: boolean;
  selectedExercise?: RouteExercise;
}): void {
  for (const feature of input.backgroundFeatures) {
    drawSyntheticBackgroundFeature(input.context, feature, input.viewport);
  }

  for (const feature of input.linearFeatures) {
    drawSyntheticLinearFeature(input.context, feature, input.viewport);
  }

  for (const visual of input.roadVisuals) {
    drawSyntheticRoadVisual(input.context, visual, input.viewport);
  }

  for (const visual of buildSyntheticLandmarkVisuals(input.map, input.selectedExercise)) {
    drawSyntheticLandmarkVisual(input.context, visual, input.viewport);
  }

  const labels = buildSyntheticMapLabels(input.map, input.selectedExercise, {
    includeOsmRoadLabels: input.showOsmRoadLabels
  });

  for (const label of labels) {
    if (label.kind === "start" || label.kind === "checkpoint" || label.kind === "finish") {
      continue;
    }

    drawSyntheticMapLabel(input.context, label, input.viewport);
  }
}

function drawSyntheticStopLabels(input: {
  context: CanvasRenderingContext2D;
  map: MapDefinition;
  viewport: ScreenMapViewport;
  selectedExercise?: RouteExercise;
}): void {
  if (!input.selectedExercise) {
    return;
  }

  const labels = buildSyntheticMapLabels(input.map, input.selectedExercise).filter(
    (label) => label.kind === "start" || label.kind === "checkpoint" || label.kind === "finish"
  );

  for (const label of labels) {
    drawSyntheticMapLabel(input.context, label, input.viewport);
  }
}

function scoreSummary(result: RunRouteExerciseResult | null): string {
  if (!result) {
    return "n/a";
  }

  return `${result.score.scorePercent.toFixed(1)}%`;
}

function safeExtraDistance(result: RunRouteExerciseResult | null): number {
  return result ? result.score.userRouteDistanceMeters - result.score.shortestLegalRouteDistanceMeters : 0;
}

function warningSeverityClass(severity: string): string {
  if (severity === "error") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (severity === "info") {
    return "border-blue-200 bg-blue-50 text-blue-900";
  }

  return "border-amber-200 bg-amber-50 text-amber-900";
}

function roadEndpoints(road: MapRoad, map: MapDefinition): { from?: MapNode; to?: MapNode } {
  return {
    from: nodeById(road.fromNodeId, map),
    to: nodeById(road.toNodeId, map)
  };
}

function restrictionOverlayColour(kind: RoadRestrictionOverlay["kind"]): string {
  if (kind === "no-entry") {
    return "#ef4444";
  }

  if (kind === "restricted") {
    return "#f59e0b";
  }

  return "#3b82f6";
}

function drawRoadRestrictionOverlay(
  context: CanvasRenderingContext2D,
  overlay: RoadRestrictionOverlay,
  viewport: ScreenMapViewport
): void {
  if (overlay.points.length < 2) {
    return;
  }

  const colour = restrictionOverlayColour(overlay.kind);
  const screenPoints = overlay.points.map((point) => mapToScreenPoint(point, viewport));

  context.save();
  context.strokeStyle = colour;
  context.fillStyle = colour;
  context.globalAlpha = overlay.kind === "one-way" ? 0.32 : 0.38;
  context.lineWidth = overlay.kind === "one-way" ? 3 : overlay.kind === "restricted" ? 7 : 6;
  context.setLineDash(overlay.kind === "restricted" ? [10, 7] : []);
  context.beginPath();
  context.moveTo(screenPoints[0].x, screenPoints[0].y);

  for (const point of screenPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawTurnArrowSymbol(context: CanvasRenderingContext2D, turnKind: TurnRestrictionVisual["turnKind"]): void {
  context.strokeStyle = "#111827";
  context.lineWidth = 2.5;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (turnKind === "no-u-turn") {
    context.beginPath();
    context.arc(0, 2, 7, Math.PI * 0.1, Math.PI * 1.35, true);
    context.stroke();
    context.beginPath();
    context.moveTo(-8, -1);
    context.lineTo(-3, -3);
    context.lineTo(-4, 3);
    context.stroke();
    return;
  }

  const direction = turnKind === "no-left-turn" ? -1 : 1;

  context.beginPath();
  context.moveTo(-6 * direction, 6);
  context.lineTo(-6 * direction, 0);
  context.quadraticCurveTo(-6 * direction, -6, 0, -6);
  context.lineTo(7 * direction, -6);
  context.stroke();
  context.beginPath();
  context.moveTo(4 * direction, -10);
  context.lineTo(8 * direction, -6);
  context.lineTo(4 * direction, -2);
  context.stroke();
}

function drawNoEntryMapSymbol(context: CanvasRenderingContext2D, point: Vec2, radius = 14): void {
  context.save();
  context.fillStyle = "rgba(255,255,255,0.96)";
  context.strokeStyle = "#dc2626";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = "#dc2626";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(point.x - radius * 0.58, point.y);
  context.lineTo(point.x + radius * 0.58, point.y);
  context.stroke();
  context.restore();
}

function drawOneWayMapSymbol(
  context: CanvasRenderingContext2D,
  point: Vec2,
  direction: RestrictionMapVisualItem["direction"]
): void {
  if (!direction) {
    return;
  }

  const angle = Math.atan2(direction.to.y - direction.from.y, direction.to.x - direction.from.x);
  const tip = {
    x: point.x + 13 * Math.cos(angle),
    y: point.y + 13 * Math.sin(angle)
  };
  const tail = {
    x: point.x - 11 * Math.cos(angle),
    y: point.y - 11 * Math.sin(angle)
  };

  context.save();
  context.strokeStyle = "#1d4ed8";
  context.fillStyle = "#1d4ed8";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(tail.x, tail.y);
  context.lineTo(tip.x, tip.y);
  context.stroke();
  drawArrowHead(context, tail, tip);
  context.restore();
}

function drawRestrictedRoadMapSymbol(context: CanvasRenderingContext2D, point: Vec2): void {
  context.save();
  context.fillStyle = "#fffbeb";
  context.strokeStyle = "#d97706";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(point.x, point.y - 14);
  context.lineTo(point.x + 14, point.y);
  context.lineTo(point.x, point.y + 14);
  context.lineTo(point.x - 14, point.y);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = "#92400e";
  context.lineWidth = 3;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(point.x, point.y - 7);
  context.lineTo(point.x, point.y + 2);
  context.stroke();
  context.fillStyle = "#92400e";
  context.beginPath();
  context.arc(point.x, point.y + 7, 2, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawTurnBanMapSymbol(
  context: CanvasRenderingContext2D,
  point: Vec2,
  turnKind: TurnRestrictionVisual["turnKind"] | undefined
): void {
  context.save();
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#be123c";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(point.x, point.y, 14, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.translate(point.x, point.y);
  drawTurnArrowSymbol(context, turnKind ?? "no-left-turn");
  context.strokeStyle = "#be123c";
  context.lineWidth = 3;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-9, 9);
  context.lineTo(9, -9);
  context.stroke();
  context.restore();
}

function drawRouteIssueMapSymbol(context: CanvasRenderingContext2D, item: RestrictionMapVisualItem, point: Vec2): void {
  if (item.symbol === "disconnected-gap") {
    context.save();
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#dc2626";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(point.x, point.y, 15, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.setLineDash([4, 3]);
    context.beginPath();
    context.moveTo(point.x - 9, point.y);
    context.lineTo(point.x + 9, point.y);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#dc2626";
    context.beginPath();
    context.arc(point.x - 9, point.y, 3, 0, Math.PI * 2);
    context.arc(point.x + 9, point.y, 3, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  context.save();
  context.fillStyle = "#fee2e2";
  context.strokeStyle = "#b91c1c";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(point.x, point.y, 16, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  if (item.label.toLowerCase().includes("no entry")) {
    context.strokeStyle = "#b91c1c";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(point.x - 9, point.y);
    context.lineTo(point.x + 9, point.y);
    context.stroke();
  } else {
    context.strokeStyle = "#b91c1c";
    context.lineWidth = 4;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(point.x - 7, point.y - 7);
    context.lineTo(point.x + 7, point.y + 7);
    context.moveTo(point.x + 7, point.y - 7);
    context.lineTo(point.x - 7, point.y + 7);
    context.stroke();
  }

  context.restore();
}

function drawRestrictionMapVisualItem(
  context: CanvasRenderingContext2D,
  item: RestrictionMapVisualItem,
  viewport: ScreenMapViewport
): void {
  const point = mapToScreenPoint(item.point, viewport);
  const direction = item.direction
    ? {
        from: mapToScreenPoint(item.direction.from, viewport),
        to: mapToScreenPoint(item.direction.to, viewport)
      }
    : undefined;

  if (item.symbol === "one-way-arrow") {
    drawOneWayMapSymbol(context, point, direction);
    return;
  }

  if (item.symbol === "no-entry-sign") {
    drawNoEntryMapSymbol(context, point);
    return;
  }

  if (item.symbol === "restricted-road-sign") {
    drawRestrictedRoadMapSymbol(context, point);
    return;
  }

  if (item.symbol === "turn-ban-sign") {
    drawTurnBanMapSymbol(context, point, item.turnKind);
    return;
  }

  drawRouteIssueMapSymbol(context, item, point);
}

function drawSelectedRestrictionHighlight(
  context: CanvasRenderingContext2D,
  highlight: SelectedRestrictionHighlight,
  viewport: ScreenMapViewport
): void {
  const point = mapToScreenPoint(highlight.point, viewport);

  context.save();
  context.strokeStyle = "#0284c7";
  context.fillStyle = "rgba(14,165,233,0.12)";
  context.lineWidth = 4;
  context.setLineDash([]);

  if (highlight.points.length >= 2) {
    const screenPoints = highlight.points.map((candidate) => mapToScreenPoint(candidate, viewport));

    context.globalAlpha = 0.86;
    context.lineWidth = 9;
    context.beginPath();
    context.moveTo(screenPoints[0].x, screenPoints[0].y);

    for (const screenPoint of screenPoints.slice(1)) {
      context.lineTo(screenPoint.x, screenPoint.y);
    }

    context.stroke();
  }

  context.globalAlpha = 1;
  context.beginPath();
  context.arc(point.x, point.y, 24, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.beginPath();
  context.arc(point.x, point.y, 31, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function routeIssueOverlayColour(kind: RouteIssueOverlay["kind"]): string {
  if (kind === "prohibited-turn" || kind === "no-u-turn") {
    return "#be123c";
  }

  return "#dc2626";
}

function drawRouteIssueOverlay(
  context: CanvasRenderingContext2D,
  overlay: RouteIssueOverlay,
  viewport: ScreenMapViewport,
  map: MapDefinition
): void {
  const colour = routeIssueOverlayColour(overlay.kind);
  const lineStyle = getRouteIssueLineStyle(overlay.kind);

  context.save();
  context.strokeStyle = colour;
  context.fillStyle = colour;
  context.lineWidth = overlay.kind === "disconnected" ? 4 : 8;
  context.globalAlpha = 0.82;
  context.setLineDash(lineStyle === "dashed-red" ? [8, 6] : []);

  if (overlay.kind !== "prohibited-turn" && overlay.kind !== "no-u-turn") {
    for (const roadId of overlay.roadIds) {
      const road = map.roads.find((candidate) => candidate.id === roadId);

      if (!road) {
        continue;
      }

      const { from, to } = roadEndpoints(road, map);

      if (!from || !to) {
        continue;
      }

      const fromPoint = mapToScreenPoint(from, viewport);
      const toPoint = mapToScreenPoint(to, viewport);

      context.beginPath();
      context.moveTo(fromPoint.x, fromPoint.y);
      context.lineTo(toPoint.x, toPoint.y);
      context.stroke();
    }
  }

  if (overlay.points.length >= 2) {
    const screenPoints = overlay.points.map((point) => mapToScreenPoint(point, viewport));

    context.lineWidth = overlay.kind === "disconnected" ? 3 : 5;
    context.beginPath();
    context.moveTo(screenPoints[0].x, screenPoints[0].y);

    for (const point of screenPoints.slice(1)) {
      context.lineTo(point.x, point.y);
    }

    context.stroke();
  }

  context.setLineDash([]);
  context.globalAlpha = 1;

  if (overlay.direction) {
    drawArrowHead(
      context,
      mapToScreenPoint(overlay.direction.from, viewport),
      mapToScreenPoint(overlay.direction.to, viewport)
    );
  }

  context.restore();
}

function drawFastestRouteOverlay(
  context: CanvasRenderingContext2D,
  routePoints: readonly Vec2[],
  viewport: ScreenMapViewport
): void {
  if (routePoints.length < 2) {
    return;
  }

  const screenPoints = routePoints.map((point) => mapToScreenPoint(point, viewport));

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "rgba(255,255,255,0.94)";
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(screenPoints[0].x, screenPoints[0].y);

  for (const point of screenPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.strokeStyle = "#0284c7";
  context.lineWidth = 5;
  context.setLineDash([14, 8]);
  context.beginPath();
  context.moveTo(screenPoints[0].x, screenPoints[0].y);

  for (const point of screenPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawOsmExerciseDebugRouteOverlay(
  context: CanvasRenderingContext2D,
  overlay: OsmExerciseDebugOverlayModel,
  viewport: ScreenMapViewport
): void {
  if (overlay.route.points.length < 2) {
    return;
  }

  const screenPoints = overlay.route.points.map((point) => mapToScreenPoint(point, viewport));

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "rgba(255,255,255,0.94)";
  context.lineWidth = 13;
  context.beginPath();
  context.moveTo(screenPoints[0].x, screenPoints[0].y);

  for (const point of screenPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.strokeStyle = overlay.qa.status === "pass" ? "#7c3aed" : "#be123c";
  context.lineWidth = 6;
  context.setLineDash([16, 7]);
  context.beginPath();
  context.moveTo(screenPoints[0].x, screenPoints[0].y);

  for (const point of screenPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawOsmExerciseDebugBlockedEdge(
  context: CanvasRenderingContext2D,
  edge: OsmExerciseDebugBlockedEdge,
  viewport: ScreenMapViewport
): void {
  const fromPoint = mapToScreenPoint(edge.points[0], viewport);
  const toPoint = mapToScreenPoint(edge.points[1], viewport);
  const midPoint = mapToScreenPoint(edge.midpoint, viewport);

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.globalAlpha = edge.relevant ? 0.9 : 0.68;
  context.strokeStyle = "rgba(255,255,255,0.92)";
  context.lineWidth = edge.relevant ? 11 : 8;
  context.beginPath();
  context.moveTo(fromPoint.x, fromPoint.y);
  context.lineTo(toPoint.x, toPoint.y);
  context.stroke();

  context.strokeStyle = edge.usedByRoute ? "#7f1d1d" : "#dc2626";
  context.fillStyle = edge.usedByRoute ? "#7f1d1d" : "#dc2626";
  context.lineWidth = edge.relevant ? 6 : 4;
  context.setLineDash(edge.restrictionType === "blocked_access" ? [8, 6] : [4, 4]);
  context.beginPath();
  context.moveTo(fromPoint.x, fromPoint.y);
  context.lineTo(toPoint.x, toPoint.y);
  context.stroke();
  context.setLineDash([]);

  if (edge.directedEdgeKey) {
    drawArrowHead(
      context,
      {
        x: fromPoint.x + (toPoint.x - fromPoint.x) * 0.48,
        y: fromPoint.y + (toPoint.y - fromPoint.y) * 0.48
      },
      {
        x: fromPoint.x + (toPoint.x - fromPoint.x) * 0.68,
        y: fromPoint.y + (toPoint.y - fromPoint.y) * 0.68
      }
    );
  }

  context.restore();
  drawOsmDebugLabel(context, edge.osmWayId ? `${edge.label} ${edge.osmWayId}` : edge.label, midPoint);
}

function drawOsmExerciseDebugStopMarker(
  context: CanvasRenderingContext2D,
  marker: OsmExerciseDebugStopMarker,
  viewport: ScreenMapViewport
): void {
  if (!marker.point) {
    return;
  }

  const point = mapToScreenPoint(marker.point, viewport);
  const fillStyle =
    marker.role === "start" ? "#059669" : marker.role === "finish" ? "#7c3aed" : "#f59e0b";
  const labelWidth = Math.max(52, marker.label.length * 8 + 20);
  const labelHeight = 22;
  const labelX = point.x - labelWidth / 2;
  const labelY = point.y - 42;

  context.save();
  context.fillStyle = "rgba(255,255,255,0.94)";
  context.strokeStyle = fillStyle;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(point.x, point.y, 18, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = fillStyle;
  context.beginPath();
  context.arc(point.x, point.y, 10, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(255,255,255,0.96)";
  context.strokeStyle = fillStyle;
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(labelX, labelY, labelWidth, labelHeight, 6);
  context.fill();
  context.stroke();

  context.fillStyle = "#111827";
  context.font = "700 11px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(marker.label, point.x, labelY + labelHeight / 2 + 0.5);
  context.restore();
}

function drawOsmExerciseDebugOverlay(
  context: CanvasRenderingContext2D,
  overlay: OsmExerciseDebugOverlayModel | null,
  viewport: ScreenMapViewport
): void {
  if (!overlay?.visible) {
    return;
  }

  for (const edge of overlay.blockedEdges) {
    drawOsmExerciseDebugBlockedEdge(context, edge, viewport);
  }

  drawOsmExerciseDebugRouteOverlay(context, overlay, viewport);

  for (const marker of overlay.stopMarkers) {
    drawOsmExerciseDebugStopMarker(context, marker, viewport);
  }
}

function replayMarkerColour(kind: RouteReplayMarker["kind"]): string {
  return kind === "user" ? "#ea580c" : "#0284c7";
}

function drawRouteReplayMarker(
  context: CanvasRenderingContext2D,
  marker: RouteReplayMarker,
  viewport: ScreenMapViewport
): void {
  const point = mapToScreenPoint(marker.point, viewport);
  const colour = replayMarkerColour(marker.kind);

  context.save();
  context.fillStyle = "rgba(255,255,255,0.96)";
  context.strokeStyle = colour;
  context.lineWidth = 4;
  context.beginPath();
  context.arc(point.x, point.y, 15, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = colour;
  context.beginPath();
  context.arc(point.x, point.y, 8, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(15,23,42,0.28)";
  context.lineWidth = 1;
  context.beginPath();
  context.arc(point.x, point.y, 21, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawOsmDebugLabel(context: CanvasRenderingContext2D, text: string, point: Vec2): void {
  context.save();
  context.font = "600 10px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = 3;
  context.strokeStyle = "rgba(255,255,255,0.92)";
  context.fillStyle = "rgba(15,23,42,0.76)";
  context.strokeText(text, point.x, point.y);
  context.fillText(text, point.x, point.y);
  context.restore();
}

function shiftedDebugEdgePoints(edge: OsmDebugDirectedEdgeVisual, viewport: ScreenMapViewport): [Vec2, Vec2] {
  const from = mapToScreenPoint(edge.points[0], viewport);
  const to = mapToScreenPoint(edge.points[1], viewport);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  if (length === 0 || edge.isOneWayRoad) {
    return [from, to];
  }

  const offset = edge.direction === "forward" ? 2.5 : -2.5;
  const normal = {
    x: (-dy / length) * offset,
    y: (dx / length) * offset
  };

  return [
    { x: from.x + normal.x, y: from.y + normal.y },
    { x: to.x + normal.x, y: to.y + normal.y }
  ];
}

function drawOsmDebugDirectedEdge(
  context: CanvasRenderingContext2D,
  edge: OsmDebugDirectedEdgeVisual,
  viewport: ScreenMapViewport,
  showIds: boolean,
  style: OsmDebugOverlayStyle
): void {
  const [from, to] = shiftedDebugEdgePoints(edge, viewport);
  const colour = edge.isOneWayRoad ? (edge.originalDirection === "reverse" ? "#be123c" : "#db2777") : "#0891b2";
  const arrowStart = {
    x: from.x + (to.x - from.x) * 0.58,
    y: from.y + (to.y - from.y) * 0.58
  };
  const arrowEnd = {
    x: from.x + (to.x - from.x) * 0.74,
    y: from.y + (to.y - from.y) * 0.74
  };

  context.save();
  context.globalAlpha = edge.isOneWayRoad ? style.oneWayEdgeAlpha : style.twoWayEdgeAlpha;
  context.strokeStyle = colour;
  context.fillStyle = colour;
  context.lineWidth = edge.isOneWayRoad ? style.oneWayEdgeLineWidth : style.twoWayEdgeLineWidth;
  context.setLineDash(edge.isOneWayRoad ? [] : style.twoWayEdgeDash);
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.setLineDash([]);

  if (edge.isOneWayRoad || style.showTwoWayDirectionArrows) {
    drawArrowHead(context, arrowStart, arrowEnd);
  }

  context.restore();

  if (showIds) {
    drawOsmDebugLabel(context, edge.roadId, mapToScreenPoint(edge.midpoint, viewport));
  }
}

function drawOsmDebugOverlay(
  context: CanvasRenderingContext2D,
  overlay: OsmDebugOverlayModel | null,
  viewport: ScreenMapViewport
): void {
  if (!overlay?.visible) {
    return;
  }

  for (const edge of overlay.directedEdges) {
    drawOsmDebugDirectedEdge(context, edge, viewport, overlay.showIds, overlay.style);
  }

  context.save();
  for (const node of overlay.nodes) {
    const point = mapToScreenPoint(node.point, viewport);

    context.fillStyle = "rgba(255,255,255,0.84)";
    context.strokeStyle = "#0891b2";
    context.lineWidth = overlay.style.nodeStrokeWidth;
    context.beginPath();
    context.arc(point.x, point.y, overlay.style.nodeRadius, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#0e7490";
    context.beginPath();
    context.arc(point.x, point.y, overlay.style.nodeInnerRadius, 0, Math.PI * 2);
    context.fill();

    if (overlay.showIds) {
      drawOsmDebugLabel(context, node.id, { x: point.x, y: point.y - overlay.style.labelOffset });
    }
  }
  context.restore();
}

function drawRouteCanvas(input: {
  canvas: HTMLCanvasElement;
  map: MapDefinition;
  viewport: ScreenMapViewport;
  backgroundFeatures: SyntheticBackgroundFeature[];
  linearFeatures: SyntheticLinearFeature[];
  roadVisuals: SyntheticRoadVisual[];
  showOsmRoadLabels: boolean;
  selectedExercise?: RouteExercise;
  trace: DrawnRouteTrace;
  routeDraft: DrawnRouteDraft;
  fastestRoutePoints: readonly Vec2[];
  routeReplayMarkers: readonly RouteReplayMarker[];
  snapPreview: SnappedRouteTraceResult;
  pipelineResult: DrawnRoutePipelineResult;
  roadRestrictionOverlays: RoadRestrictionOverlay[];
  routeIssueOverlays: RouteIssueOverlay[];
  restrictionMapVisualItems: RestrictionMapVisualItem[];
  selectedRestrictionHighlight: SelectedRestrictionHighlight | null;
  osmDebugOverlay: OsmDebugOverlayModel | null;
  osmExerciseDebugOverlay: OsmExerciseDebugOverlayModel | null;
}) {
  const context = input.canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, input.canvas.width, input.canvas.height);
  context.fillStyle = "#eef3f8";
  context.fillRect(0, 0, input.canvas.width, input.canvas.height);

  context.lineCap = "round";
  context.lineJoin = "round";
  drawSyntheticStreetMapBase({
    context,
    map: input.map,
    viewport: input.viewport,
    backgroundFeatures: input.backgroundFeatures,
    linearFeatures: input.linearFeatures,
    roadVisuals: input.roadVisuals,
    showOsmRoadLabels: input.showOsmRoadLabels,
    selectedExercise: input.selectedExercise
  });

  for (const overlay of input.roadRestrictionOverlays) {
    drawRoadRestrictionOverlay(context, overlay, input.viewport);
  }

  drawOsmDebugOverlay(context, input.osmDebugOverlay, input.viewport);

  drawFastestRouteOverlay(context, input.fastestRoutePoints, input.viewport);
  drawOsmExerciseDebugOverlay(context, input.osmExerciseDebugOverlay, input.viewport);

  input.pipelineResult.matchResult?.attemptedMovements.forEach((movement) => {
    const from = nodeById(movement.fromNodeId, input.map);
    const to = nodeById(movement.toNodeId, input.map);

    if (!from || !to) {
      return;
    }

    const fromPoint = mapToScreenPoint(from, input.viewport);
    const toPoint = mapToScreenPoint(to, input.viewport);
    const midPoint = {
      x: (fromPoint.x + toPoint.x) / 2,
      y: (fromPoint.y + toPoint.y) / 2
    };

    context.strokeStyle = "rgba(255,255,255,0.88)";
    context.lineWidth = 11;
    context.globalAlpha = 0.84;
    context.beginPath();
    context.moveTo(fromPoint.x, fromPoint.y);
    context.lineTo(toPoint.x, toPoint.y);
    context.stroke();

    context.strokeStyle = movement.directedEdgeId ? "#7c3aed" : "#ef4444";
    context.fillStyle = movement.directedEdgeId ? "#7c3aed" : "#ef4444";
    context.lineWidth = 6;
    context.globalAlpha = 0.7;
    context.beginPath();
    context.moveTo(fromPoint.x, fromPoint.y);
    context.lineTo(toPoint.x, toPoint.y);
    context.stroke();
    context.globalAlpha = 1;
    drawArrowHead(context, fromPoint, toPoint);

    context.fillStyle = "#ffffff";
    context.strokeStyle = movement.directedEdgeId ? "#6d28d9" : "#dc2626";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(midPoint.x, midPoint.y, 9, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  });

  for (const overlay of input.routeIssueOverlays) {
    drawRouteIssueOverlay(context, overlay, input.viewport, input.map);
  }

  for (const item of input.restrictionMapVisualItems) {
    drawRestrictionMapVisualItem(context, item, input.viewport);
  }

  if (input.selectedRestrictionHighlight) {
    drawSelectedRestrictionHighlight(context, input.selectedRestrictionHighlight, input.viewport);
  }

  for (const node of input.map.nodes) {
    const point = mapToScreenPoint(node, input.viewport);

    context.fillStyle = "rgba(255,255,255,0.72)";
    context.strokeStyle = "rgba(100,116,139,0.28)";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(point.x, point.y, 2.25, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  input.pipelineResult.matchResult?.nodeIds.forEach((nodeId, index) => {
    const node = nodeById(nodeId, input.map);

    if (!node) {
      return;
    }

    drawNodeMarker({
      context,
      point: mapToScreenPoint(node, input.viewport),
      fillStyle: index === 0 ? "#2563eb" : "#7c3aed",
      radius: 7
    });
  });

  const selectedExercise = input.selectedExercise;

  if (selectedExercise) {
    selectedExercise.stops.forEach((stop, index) => {
      const node = resolveStopNode(stop, input.map);

      if (!node) {
        return;
      }

      const point = mapToScreenPoint(node, input.viewport);
      const role =
        index === 0 ? "start" : index === selectedExercise.stops.length - 1 ? "finish" : "checkpoint";

      drawExerciseStopMarker({
        context,
        point,
        role,
        index
      });
    });
  }

  drawSyntheticStopLabels({
    context,
    map: input.map,
    viewport: input.viewport,
    selectedExercise: input.selectedExercise
  });

  if (input.snapPreview.snappedPoints.length > 0) {
    context.strokeStyle = "#22c55e";
    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    input.snapPreview.snappedPoints.forEach((point, index) => {
      const screenPoint = mapToScreenPoint(point.snappedPoint, input.viewport);

      if (index === 0) {
        context.beginPath();
        context.moveTo(screenPoint.x, screenPoint.y);
      } else {
        context.lineTo(screenPoint.x, screenPoint.y);
      }
    });
    context.stroke();
    context.setLineDash([]);
  }

  const visibleRawStrokes =
    input.routeDraft.strokes.length > 0
      ? input.routeDraft.strokes
      : input.trace.points.length > 0
        ? [{ points: input.trace.points }]
        : [];

  if (visibleRawStrokes.length > 0) {
    context.strokeStyle = "#ea580c";
    context.lineWidth = 4;

    visibleRawStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) {
        return;
      }

      context.beginPath();
      stroke.points.forEach((point, index) => {
        const screenPoint = mapToScreenPoint(point, input.viewport);

        if (index === 0) {
          context.moveTo(screenPoint.x, screenPoint.y);
        } else {
          context.lineTo(screenPoint.x, screenPoint.y);
        }
      });
      context.stroke();
    });
  }

  input.snapPreview.snappedPoints.forEach((point) => {
    const screenPoint = mapToScreenPoint(point.originalPoint, input.viewport);

    context.fillStyle = point.roadId ? "#16a34a" : "#dc2626";
    context.beginPath();
    context.arc(screenPoint.x, screenPoint.y, 3, 0, Math.PI * 2);
    context.fill();
  });

  for (const marker of input.routeReplayMarkers) {
    drawRouteReplayMarker(context, marker, input.viewport);
  }
}

function createViewport(map: MapDefinition): ScreenMapViewport {
  return {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    mapBounds: getRouteRunnerMapViewportBounds(map, CANVAS_WIDTH, CANVAS_HEIGHT)
  };
}

function readableError(caughtError: unknown): string {
  return caughtError instanceof Error ? caughtError.message : "Route runner failed with an unknown error.";
}

export function RouteRunnerClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSaveAttemptKeyRef = useRef<string | null>(null);
  const panDragPointRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const mapScrollLockStateRef = useRef<MapScrollLockState>(createDefaultMapScrollLockState());
  const routeReplayAnimationFrameRef = useRef<number | null>(null);
  const routeReplayStateRef = useRef<RouteReplayState>(createRouteReplayState());
  const [mapOptionId, setMapOptionId] = useState(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const [exerciseId, setExerciseId] = useState(DEFAULT_ROUTE_RUNNER_MAP_OPTION.defaultExerciseId);
  const [nodeIdsText, setNodeIdsText] = useState("");
  const [roadIdsText, setRoadIdsText] = useState("");
  const [result, setResult] = useState<RunRouteExerciseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawnRouteDraft, setDrawnRouteDraft] = useState<DrawnRouteDraft>(() => createEmptyRouteDraft());
  const [isDrawing, setIsDrawing] = useState(false);
  const [showRoadRestrictions, setShowRoadRestrictions] = useState(true);
  const [showTurnRestrictions, setShowTurnRestrictions] = useState(true);
  const [osmDebugOverlayState, setOsmDebugOverlayState] = useState<OsmDebugOverlayState>(() =>
    createDefaultOsmDebugOverlayState()
  );
  const [osmExerciseDebugOverlayState, setOsmExerciseDebugOverlayState] = useState<OsmExerciseDebugOverlayState>(() =>
    createDefaultOsmExerciseDebugOverlayState()
  );
  const [fastestRouteRevealState, setFastestRouteRevealState] = useState<FastestRouteRevealState>(() =>
    createHiddenFastestRouteRevealState()
  );
  const [mapViewportState, setMapViewportState] = useState<MapViewportState>(() => createDefaultMapViewportState());
  const [isPanningMap, setIsPanningMap] = useState(false);
  const [routeReplayState, setRouteReplayState] = useState<RouteReplayState>(() => createRouteReplayState());
  const [routeReplayRunId, setRouteReplayRunId] = useState(0);
  const [selectedRestrictionReviewItemId, setSelectedRestrictionReviewItemId] = useState<string | null>(null);
  const [weakAreaProfile, setWeakAreaProfile] = useState<LearnerWeakAreaProfile>(() => readStoredWeakAreaProfile());
  const [lastProfileAttemptKey, setLastProfileAttemptKey] = useState<string | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<RouteAttemptHistoryState>(() => createRouteAttemptHistoryState());
  const [lastHistoryAttemptKey, setLastHistoryAttemptKey] = useState<string | null>(null);
  const [attemptSaveStatus, setAttemptSaveStatus] = useState<RouteAttemptSaveStatus>({
    state: "idle",
    message: null
  });
  const [savedHistoryRefreshKey, setSavedHistoryRefreshKey] = useState(0);
  const [savedAttemptHistory, setSavedAttemptHistory] = useState<SavedAttemptHistoryState>({
    state: "loading",
    attempts: [],
    message: "Loading saved attempts...",
    selectedAttemptId: null
  });
  const [adaptiveLauncherState, setAdaptiveLauncherState] = useState<AdaptivePracticeLauncherState>(() =>
    readStoredAdaptivePracticeLauncherState()
  );
  const [adaptiveLauncherMessage, setAdaptiveLauncherMessage] = useState<string | null>(null);
  const [selectedAdaptiveRecommendationId, setSelectedAdaptiveRecommendationId] = useState<string | null>(null);
  const [showDismissedAdaptiveItems, setShowDismissedAdaptiveItems] = useState(false);

  const selectedMapOption = useMemo(
    () => getRouteRunnerMapOption(mapOptionId) ?? DEFAULT_ROUTE_RUNNER_MAP_OPTION,
    [mapOptionId]
  );
  const activeMap = selectedMapOption.map;
  const activeExercises = selectedMapOption.exercises;
  const isConvertedOsmMap = isConvertedOsmRouteRunnerMap(selectedMapOption);
  const osmDebugOverlayAvailable = canOfferOsmDebugOverlay(selectedMapOption.source);
  const osmExerciseDebugOverlayAvailable = canOfferOsmExerciseDebugOverlay(selectedMapOption.source);

  useEffect(() => {
    setShowRoadRestrictions(!isConvertedOsmMap);
    setShowTurnRestrictions(!isConvertedOsmMap);
  }, [activeMap.id, isConvertedOsmMap]);

  const baseViewport = useMemo(() => createViewport(activeMap), [activeMap]);
  const viewport = useMemo(() => buildZoomedMapViewport(baseViewport, mapViewportState), [baseViewport, mapViewportState]);
  const activeMapGraph = useMemo(() => buildMapGraph(activeMap), [activeMap]);
  const canZoomIn = canZoomInMapView(mapViewportState);
  const canZoomOut = canZoomOutMapView(mapViewportState);
  const mapInteractionMode = mapViewportState.interactionMode;
  const isPanMode = mapInteractionMode === "pan";
  const exerciseAvailabilityById = useMemo(
    () =>
      Object.fromEntries(
        validateExerciseReachabilityList({
          map: activeMap,
          exercises: activeExercises,
          graph: activeMapGraph
        }).map((availability) => [availability.exerciseId, availability])
      ) as Record<string, ExerciseRouteAvailability>,
    [activeExercises, activeMap, activeMapGraph]
  );
  const drawnTrace = useMemo(() => routeDraftToDrawnRouteTrace(drawnRouteDraft), [drawnRouteDraft]);
  const hasUndoableDrawnStroke = hasUndoableRouteStroke(drawnRouteDraft);
  const exerciseTitleById = useMemo(
    () =>
      Object.fromEntries(
        activeExercises.map((exercise) => [exercise.id, exercise.title])
      ) as Record<string, string>,
    [activeExercises]
  );
  const roadRestrictionOverlays = useMemo(() => buildRoadRestrictionOverlays(activeMap), [activeMap]);
  const turnRestrictionVisuals = useMemo(() => getTurnRestrictionVisuals(activeMap), [activeMap]);
  const syntheticBackgroundFeatures = useMemo(
    () => (isConvertedOsmMap ? [] : buildSyntheticBackgroundFeatures(activeMap)),
    [activeMap, isConvertedOsmMap]
  );
  const syntheticLinearFeatures = useMemo(
    () => (isConvertedOsmMap ? [] : buildSyntheticLinearFeatures(activeMap)),
    [activeMap, isConvertedOsmMap]
  );
  const syntheticRoadVisuals = useMemo(() => buildSyntheticRoadVisuals(activeMap), [activeMap]);
  const visibleRoadRestrictionOverlays = useMemo(
    () => (showRoadRestrictions ? roadRestrictionOverlays : []),
    [roadRestrictionOverlays, showRoadRestrictions]
  );
  const visibleTurnRestrictionVisuals = useMemo(
    () => (showTurnRestrictions ? turnRestrictionVisuals : []),
    [showTurnRestrictions, turnRestrictionVisuals]
  );
  const selectedExercise = useMemo<RouteExercise | undefined>(
    () => activeExercises.find((exercise) => exercise.id === exerciseId),
    [activeExercises, exerciseId]
  );
  const selectedExerciseDisplay = useMemo(
    () => (selectedExercise ? buildRouteExerciseDisplayModel(selectedExercise) : null),
    [selectedExercise]
  );
  const osmDebugOverlay = useMemo(
    () =>
      buildOsmDebugOverlayModel({
        map: activeMap,
        graph: activeMapGraph,
        exercise: selectedExercise,
        sourceFixtureName: selectedMapOption.fixtureName,
        state: {
          visible: osmDebugOverlayAvailable && osmDebugOverlayState.visible,
          showIds: osmDebugOverlayAvailable && osmDebugOverlayState.showIds
        }
      }),
    [
      activeMap,
      activeMapGraph,
      osmDebugOverlayAvailable,
      osmDebugOverlayState.showIds,
      osmDebugOverlayState.visible,
      selectedExercise,
      selectedMapOption.fixtureName
    ]
  );
  const osmExerciseDebugOverlay = useMemo(
    () =>
      buildOsmExerciseDebugOverlayModel({
        map: activeMap,
        graph: activeMapGraph,
        exercise: selectedExercise,
        enabled: osmExerciseDebugOverlayAvailable && osmExerciseDebugOverlayState.visible,
        isConvertedOsmMap,
        renderBounds: baseViewport.mapBounds,
        sourceOverpassFixture: selectedMapOption.sourceOverpassFixture
      }),
    [
      activeMap,
      activeMapGraph,
      baseViewport.mapBounds,
      isConvertedOsmMap,
      osmExerciseDebugOverlayAvailable,
      osmExerciseDebugOverlayState.visible,
      selectedExercise,
      selectedMapOption.sourceOverpassFixture
    ]
  );
  const osmQaStatusPanel = useMemo(
    () =>
      buildOsmQaStatusPanelModel({
        map: activeMap,
        graph: activeMapGraph,
        exercises: activeExercises,
        selectedExercise,
        enabled:
          osmDebugOverlayAvailable && (osmDebugOverlayState.visible || osmExerciseDebugOverlayState.visible),
        isConvertedOsmMap
      }),
    [
      activeExercises,
      activeMap,
      activeMapGraph,
      isConvertedOsmMap,
      osmDebugOverlayAvailable,
      osmExerciseDebugOverlayState.visible,
      osmDebugOverlayState.visible,
      selectedExercise
    ]
  );
  const realLondonPilotQaPanel = useMemo(
    () =>
      shouldShowRealLondonPilotQaPanel(activeMap.id)
        ? buildRealLondonPilotQaPanelModel(buildRealLondonPilotReadinessReport())
        : null,
    [activeMap.id]
  );
  const selectedExerciseAvailability = selectedExercise ? exerciseAvailabilityById[selectedExercise.id] ?? null : null;
  const selectedExerciseIsInvalid = selectedExerciseAvailability ? !selectedExerciseAvailability.isValid : false;
  const fastestRouteOverlay = useMemo(
    () =>
      buildFastestRouteOverlay({
        map: activeMap,
        exercise: selectedExercise,
        revealState: fastestRouteRevealState,
        graph: activeMapGraph,
        availability: selectedExerciseAvailability
      }),
    [activeMap, activeMapGraph, fastestRouteRevealState, selectedExercise, selectedExerciseAvailability]
  );
  const shortestRouteReplayOverlay = useMemo(
    () =>
      buildFastestRouteOverlay({
        map: activeMap,
        exercise: selectedExercise,
        revealState: { visible: true },
        graph: activeMapGraph,
        availability: selectedExerciseAvailability
      }),
    [activeMap, activeMapGraph, selectedExercise, selectedExerciseAvailability]
  );
  const selectedExerciseMetadata = useMemo(
    () => (isConvertedOsmMap ? null : getExerciseMetadata(MARLOWE_DISTRICT_EXERCISE_METADATA, exerciseId)),
    [exerciseId, isConvertedOsmMap]
  );
  const selectedMapMetadata = useMemo(
    () => (isConvertedOsmMap ? null : getMapMetadataForExercise(MARLOWE_DISTRICT_METADATA_CATALOGUE, exerciseId)),
    [exerciseId, isConvertedOsmMap]
  );
  const selectedSyntheticScenario = useMemo(
    () => (isConvertedOsmMap ? null : getRealisticSyntheticScenarioForExercise(exerciseId)),
    [exerciseId, isConvertedOsmMap]
  );
  const selectedExerciseIndex = useMemo(
    () => activeExercises.findIndex((exercise) => exercise.id === exerciseId),
    [activeExercises, exerciseId]
  );
  const selectedStartStop = selectedExercise?.stops[0] ?? null;
  const selectedCheckpointStops = selectedExercise ? selectedExercise.stops.slice(1, -1) : [];
  const selectedFinishStop = selectedExercise ? selectedExercise.stops[selectedExercise.stops.length - 1] : null;
  const exercisePositionLabel =
    selectedExerciseIndex >= 0
      ? `Exercise ${selectedExerciseIndex + 1} of ${activeExercises.length}`
      : "Exercise not selected";
  const drawnPipelineResult = useMemo(() => {
    if (isDrawing) {
      // Keep pointer drawing responsive by deferring snap/match/score work until the stroke is finished.
      return createActiveDrawingPipelineResult(drawnTrace);
    }

    const performanceTrace = prepareTraceForRoutePipeline(drawnTrace, {
      maxPointCount: MAX_PIPELINE_TRACE_POINTS
    });
    const pipelineTrace = performanceTrace.trace;
    const gestureValidation = validateDrawnRouteGesture(drawnTrace, {
      minimumRawPointCount: MIN_DRAWN_GESTURE_POINT_COUNT,
      minimumTotalDistance: MIN_DRAWN_GESTURE_DISTANCE
    });

    if (drawnTrace.points.length > 0 && !gestureValidation.isMeaningful) {
      return createInsufficientDrawnGesturePipelineResult({
        drawnTrace: pipelineTrace,
        validation: gestureValidation
      });
    }

    if (selectedExerciseAvailability && !selectedExerciseAvailability.isValid && drawnTrace.points.length > 0) {
      return invalidExercisePipelineResult(pipelineTrace, selectedExerciseAvailability);
    }

    return runDrawnRoutePipeline({
      map: activeMap,
      exercises: activeExercises,
      exerciseId,
      drawnTrace: pipelineTrace,
      options: {
        minimumGesturePointCount: MIN_DRAWN_GESTURE_POINT_COUNT,
        minimumGestureDistance: MIN_DRAWN_GESTURE_DISTANCE,
        maximumSnapDistance: SNAP_TOLERANCE
      }
    });
  }, [activeExercises, activeMap, drawnTrace, exerciseId, isDrawing, selectedExerciseAvailability]);
  const snapPreview = drawnPipelineResult.snappedRoute ?? emptySnapPreview();
  const drawnDisplayStatus = getDrawnPipelineDisplayStatus(drawnPipelineResult, isDrawing);
  const pipelineStageBadges = getPipelineStageBadges(drawnPipelineResult, isDrawing);
  const pipelineIssueGroups = getPipelineIssueGroups(drawnPipelineResult, isDrawing);
  const visibleDrawnExerciseResult = isDrawing ? null : drawnPipelineResult.exerciseResult;
  const visibleDrawnPipelineResult = isDrawing
    ? {
        ...drawnPipelineResult,
        exerciseResult: null
      }
    : drawnPipelineResult;
  const routeIssueOverlays = useMemo(
    () => (isDrawing ? [] : buildRouteIssueOverlays(activeMap, drawnPipelineResult)),
    [activeMap, drawnPipelineResult, isDrawing]
  );
  const restrictionMapVisualItems = useMemo(
    () =>
      buildRestrictionMapVisualItems({
        roadRestrictionOverlays: visibleRoadRestrictionOverlays,
        turnRestrictionVisuals: visibleTurnRestrictionVisuals,
        routeIssueOverlays
      }),
    [routeIssueOverlays, visibleRoadRestrictionOverlays, visibleTurnRestrictionVisuals]
  );
  const illegalDrawnMovements = useMemo(
    () =>
      isDrawing
        ? []
        : buildIllegalDrawnMovementHighlights({
            map: activeMap,
            illegalMovements: drawnPipelineResult.exerciseResult?.score.legality.illegalMovements ?? [],
            scored: Boolean(drawnPipelineResult.exerciseResult)
          }),
    [activeMap, drawnPipelineResult, isDrawing]
  );
  const drawnAttemptReview = useMemo(
    () =>
      buildRouteAttemptReview({
        pipelineResult: drawnPipelineResult,
        illegalMovements: illegalDrawnMovements,
        isDrawing,
        versionSnapshot: selectedExercise
          ? createRouteAttemptVersionSnapshot({
              map: activeMap,
              exercise: selectedExercise
            })
          : null
      }),
    [activeMap, drawnPipelineResult, illegalDrawnMovements, isDrawing, selectedExercise]
  );
  const realLondonPilotPlaythroughPanel = buildRealLondonPilotPlaythroughPanelModel({
    mapId: activeMap.id,
    selectedExerciseId: selectedExercise?.id ?? null,
    startLabel: selectedStartStop ? stopLabel(selectedStartStop, activeMap) : null,
    destinationLabel: selectedFinishStop ? stopLabel(selectedFinishStop, activeMap) : null,
    checkpointLabels: selectedCheckpointStops.map((stop) => stopLabel(stop, activeMap)),
    hasLegalRevealRoute: Boolean(selectedExerciseAvailability?.isValid),
    isRevealRouteVisible: fastestRouteOverlay.status === "available",
    isDrawing,
    drawnPointCount: drawnTrace.points.length,
    drawnReviewStatus: drawnAttemptReview.status,
    manualRunStatus: result ? (result.score.passed ? "accepted" : "rejected") : null,
    illegalHighlightCount: illegalDrawnMovements.length
  });
  const userRouteReplayPoints = useMemo(
    () => normaliseRouteReplayGeometry(snapPreview.snappedPoints.map((point) => point.snappedPoint)),
    [snapPreview.snappedPoints]
  );
  const shortestRouteReplayPoints = useMemo(
    () =>
      shortestRouteReplayOverlay.status === "available"
        ? normaliseRouteReplayGeometry(shortestRouteReplayOverlay.points)
        : [],
    [shortestRouteReplayOverlay]
  );
  const routeReplayTracks = useMemo(
    () =>
      buildRouteReplayTracks({
        mode: routeReplayState.mode,
        userRoutePoints: userRouteReplayPoints,
        shortestRoutePoints: shortestRouteReplayPoints
      }),
    [routeReplayState.mode, shortestRouteReplayPoints, userRouteReplayPoints]
  );
  const routeReplayTrackLength = useMemo(
    () => calculateRouteReplayTrackLength(routeReplayTracks),
    [routeReplayTracks]
  );
  const routeReplayDurationMs = useMemo(
    () =>
      calculateRouteReplayDurationMs({
        routeLength: routeReplayTrackLength,
        speedMultiplier: routeReplayState.speedMultiplier
      }),
    [routeReplayState.speedMultiplier, routeReplayTrackLength]
  );
  const canReplayUserRoute = canReplayRouteGeometry(userRouteReplayPoints);
  const canReplayShortestRoute = canReplayRouteGeometry(shortestRouteReplayPoints);
  const hasSubmittedReplayAttempt = drawnAttemptReview.status !== "pending";
  const canPlayRouteReplay =
    hasSubmittedReplayAttempt &&
    routeReplayDurationMs > 0 &&
    routeReplayTracks.some((track) => canReplayRouteGeometry(track.points));
  const routeReplayMessage = !hasSubmittedReplayAttempt
    ? "Submit a drawn route to enable replay."
    : !canReplayUserRoute && !canReplayShortestRoute
      ? "No replayable route geometry is available for this attempt."
      : routeReplayState.mode === "user" && !canReplayUserRoute
        ? "My route replay is unavailable because no snapped user route geometry was captured."
        : routeReplayState.mode === "shortest" && !canReplayShortestRoute
          ? "Shortest route replay is unavailable because no legal shortest route is available."
          : routeReplayState.mode === "compare" && (!canReplayUserRoute || !canReplayShortestRoute)
            ? "Compare replay needs both snapped user route geometry and a legal shortest route."
            : "Replay uses the current map view, so markers stay aligned while zooming and panning.";
  const routeReplayMarkers = useMemo(
    () =>
      hasSubmittedReplayAttempt && (routeReplayState.status !== "idle" || routeReplayState.progress > 0)
        ? buildRouteReplayMarkers({
            tracks: routeReplayTracks,
            progress: routeReplayState.progress
          })
        : [],
    [hasSubmittedReplayAttempt, routeReplayState.progress, routeReplayState.status, routeReplayTracks]
  );
  const selectedRestrictionReviewItem = useMemo<RestrictionFocusReviewItem | null>(() => {
    if (!selectedRestrictionReviewItemId) {
      return null;
    }

    return (
      [...drawnAttemptReview.illegalMovements, ...drawnAttemptReview.missedRestrictions].find(
        (item) => item.id === selectedRestrictionReviewItemId
      ) ?? null
    );
  }, [drawnAttemptReview.illegalMovements, drawnAttemptReview.missedRestrictions, selectedRestrictionReviewItemId]);
  const selectedRestrictionFocusTarget = useMemo(
    () =>
      resolveRestrictionFocusTarget({
        reviewItem: selectedRestrictionReviewItem,
        visualItems: restrictionMapVisualItems
      }),
    [restrictionMapVisualItems, selectedRestrictionReviewItem]
  );
  const selectedRestrictionHighlight = useMemo(
    () => buildSelectedRestrictionHighlight(selectedRestrictionFocusTarget),
    [selectedRestrictionFocusTarget]
  );
  const weakAreaAttemptKey = useMemo(() => {
    if (isDrawing || drawnTrace.points.length === 0 || drawnAttemptReview.status === "pending") {
      return null;
    }

    const firstPoint = drawnTrace.points[0];
    const lastPoint = drawnTrace.points[drawnTrace.points.length - 1];

    return [
      exerciseId,
      drawnPipelineResult.status,
      drawnAttemptReview.status,
      drawnAttemptReview.scoreLabel,
      drawnTrace.points.length,
      `${firstPoint.x.toFixed(1)},${firstPoint.y.toFixed(1)}`,
      `${lastPoint.x.toFixed(1)},${lastPoint.y.toFixed(1)}`,
      drawnAttemptReview.recommendedPracticeQueue.map((item) => item.id).join("|"),
      drawnPipelineResult.warnings.map((warning) => warning.code).join("|")
    ].join("::");
  }, [drawnAttemptReview, drawnPipelineResult.status, drawnPipelineResult.warnings, drawnTrace.points, exerciseId, isDrawing]);
  const strongestWeakAreas = useMemo(() => getStrongestWeakAreas(weakAreaProfile, 4), [weakAreaProfile]);
  const weakAreaPracticeFocus = useMemo(() => getLearnerWeakAreaPracticeFocus(weakAreaProfile), [weakAreaProfile]);
  const attemptHistoryInsights = useMemo(() => buildAttemptHistoryInsights(attemptHistory), [attemptHistory]);
  const selectedHistoryItem = useMemo(
    () => getSelectedRouteAttemptHistoryItem(attemptHistory),
    [attemptHistory]
  );
  const selectedSavedAttempt = useMemo(
    () => savedAttemptHistory.attempts.find((attempt) => attempt.id === savedAttemptHistory.selectedAttemptId) ?? null,
    [savedAttemptHistory]
  );
  const savedAttemptReviewList = useMemo(
    () => buildSavedAttemptHistoryReviewList(savedAttemptHistory.attempts),
    [savedAttemptHistory.attempts]
  );
  const savedWeakAreaAnalytics = useMemo(
    () => buildRouteWeakAreaAnalytics(savedAttemptHistory.attempts),
    [savedAttemptHistory.attempts]
  );
  const selectedSavedAttemptReview = useMemo(
    () => buildSavedAttemptReview(selectedSavedAttempt),
    [selectedSavedAttempt]
  );
  const adaptivePracticeQueue = useMemo(
    () =>
      buildAdaptivePracticeQueue({
        latestReview: drawnAttemptReview,
        weakAreaProfile,
        attemptHistoryInsights,
        savedAttempts: savedAttemptHistory.attempts,
        outcomeFeedbackHistory: adaptiveLauncherState.outcomeFeedbackHistory,
        availableExercises: ADAPTIVE_PRACTICE_EXERCISES
      }),
    [
      adaptiveLauncherState.outcomeFeedbackHistory,
      attemptHistoryInsights,
      drawnAttemptReview,
      savedAttemptHistory.attempts,
      weakAreaProfile
    ]
  );
  const latestAdaptiveOutcomeFeedback = useMemo(
    () => getLatestAdaptivePracticeOutcomeFeedback(adaptiveLauncherState),
    [adaptiveLauncherState]
  );
  const latestAdaptiveOutcomePracticeItem = useMemo(
    () =>
      latestAdaptiveOutcomeFeedback
        ? adaptivePracticeQueue.items.find((item) => item.id === latestAdaptiveOutcomeFeedback.practiceItemId) ?? null
        : null,
    [adaptivePracticeQueue.items, latestAdaptiveOutcomeFeedback]
  );
  const activeAdaptivePracticeItem = useMemo(
    () =>
      adaptivePracticeQueue.items.find(
        (item) => item.id === adaptiveLauncherState.activeAdaptivePracticeItemId
      ) ?? null,
    [adaptiveLauncherState.activeAdaptivePracticeItemId, adaptivePracticeQueue.items]
  );
  const recommendedAdaptivePracticeItems = useMemo(
    () =>
      adaptivePracticeQueue.items.filter(
        (item) => getAdaptivePracticeItemStatus(adaptiveLauncherState, item.id) === "recommended"
      ),
    [adaptiveLauncherState, adaptivePracticeQueue.items]
  );
  const recommendedAdaptivePracticeStatusById = useMemo<Record<string, AdaptivePracticeLauncherItemStatus>>(
    () =>
      Object.fromEntries(
        recommendedAdaptivePracticeItems.map((item) => [
          item.id,
          getAdaptivePracticeItemStatus(adaptiveLauncherState, item.id)
        ])
      ),
    [adaptiveLauncherState, recommendedAdaptivePracticeItems]
  );
  const compactAdaptiveRecommendationDisplay = useMemo(
    () =>
      buildCompactAdaptiveRecommendationDisplay({
        items: recommendedAdaptivePracticeItems,
        selectedItemId: selectedAdaptiveRecommendationId,
        availableExercises: ADAPTIVE_PRACTICE_EXERCISES,
        itemStatuses: recommendedAdaptivePracticeStatusById
      }),
    [recommendedAdaptivePracticeItems, recommendedAdaptivePracticeStatusById, selectedAdaptiveRecommendationId]
  );
  const skippedAdaptivePracticeItems = useMemo(
    () =>
      adaptivePracticeQueue.items.filter((item) => getAdaptivePracticeItemStatus(adaptiveLauncherState, item.id) === "skipped"),
    [adaptiveLauncherState, adaptivePracticeQueue.items]
  );
  const completedAdaptivePracticeItems = useMemo(
    () =>
      adaptivePracticeQueue.items.filter((item) => {
        const status = getAdaptivePracticeItemStatus(adaptiveLauncherState, item.id);

        return status === "completed" || status === "dismissed";
      }),
    [adaptiveLauncherState, adaptivePracticeQueue.items]
  );
  const hasUsableDrawnMatch =
    drawnPipelineResult.matchResult?.status === "matched" &&
    drawnPipelineResult.matchResult.isReadyForRunRouteExercise;
  const drawnScoreDisplay = getDrawnRouteScoreDisplay(drawnPipelineResult, isDrawing);
  const requiredStopStatuses = getRequiredStopVisitStatuses(visibleDrawnExerciseResult);
  const extraDistanceMeters = result
    ? result.score.userRouteDistanceMeters - result.score.shortestLegalRouteDistanceMeters
    : 0;
  const drawnExtraDistanceMeters = safeExtraDistance(visibleDrawnExerciseResult);
  const snapPreviewRoadIds = uniqueOrdered(
    snapPreview.snappedPoints.map((point) => point.roadId).filter((roadId): roadId is string => Boolean(roadId))
  );

  useEffect(() => {
    if (selectedRestrictionReviewItemId && !selectedRestrictionReviewItem) {
      setSelectedRestrictionReviewItemId(null);
    }
  }, [selectedRestrictionReviewItem, selectedRestrictionReviewItemId]);

  useEffect(() => {
    if (!weakAreaAttemptKey || weakAreaAttemptKey === lastProfileAttemptKey) {
      return;
    }

    setWeakAreaProfile((currentProfile) => updateLearnerWeakAreaProfile(currentProfile, drawnAttemptReview));
    setLastProfileAttemptKey(weakAreaAttemptKey);
  }, [drawnAttemptReview, lastProfileAttemptKey, weakAreaAttemptKey]);

  useEffect(() => {
    if (!weakAreaAttemptKey || weakAreaAttemptKey === lastHistoryAttemptKey) {
      return;
    }

    setAttemptHistory((currentHistory) => appendRouteAttemptToHistory(currentHistory, drawnAttemptReview));
    setLastHistoryAttemptKey(weakAreaAttemptKey);
  }, [drawnAttemptReview, lastHistoryAttemptKey, weakAreaAttemptKey]);

  useEffect(() => {
    let cancelled = false;

    setSavedAttemptHistory((currentHistory) => ({
      ...currentHistory,
      state: "loading",
      message: "Loading saved attempts..."
    }));

    listRouteAttempts(
      {
        userId: null,
        limit: 10
      },
      {
        exerciseTitleById
      }
    )
      .then((historyResult) => {
        if (cancelled) {
          return;
        }

        if (historyResult.error) {
          setSavedAttemptHistory({
            state: "error",
            attempts: [],
            message: historyResult.reason ?? historyResult.error,
            selectedAttemptId: null
          });
          return;
        }

        setSavedAttemptHistory((currentHistory) => {
          const selectedAttemptStillExists = historyResult.attempts.some(
            (attempt) => attempt.id === currentHistory.selectedAttemptId
          );

          return {
            state: "loaded",
            attempts: historyResult.attempts,
            message: historyResult.reason ?? null,
            selectedAttemptId: selectedAttemptStillExists
              ? currentHistory.selectedAttemptId
              : historyResult.attempts[0]?.id ?? null
          };
        });
      })
      .catch((caughtError: unknown) => {
        if (cancelled) {
          return;
        }

        setSavedAttemptHistory({
          state: "error",
          attempts: [],
          message: readableError(caughtError),
          selectedAttemptId: null
        });
      });

    return () => {
      cancelled = true;
    };
  }, [exerciseTitleById, savedHistoryRefreshKey]);

  useEffect(() => {
    if (!weakAreaAttemptKey) {
      setAttemptSaveStatus((currentStatus) =>
        currentStatus.state === "idle"
          ? currentStatus
          : {
              state: "idle",
              message: null
            }
      );
      return;
    }

    if (weakAreaAttemptKey === lastSaveAttemptKeyRef.current) {
      return;
    }

    let cancelled = false;
    lastSaveAttemptKeyRef.current = weakAreaAttemptKey;

    setAttemptSaveStatus({
      state: "saving",
      message: "Saving route attempt..."
    });

    saveRouteAttempt({
      userId: null,
      exerciseId,
      mapId: activeMap.id,
      mapVersion: activeMap.mapVersion,
      exerciseVersion: selectedExercise?.exerciseVersion,
      review: drawnAttemptReview,
      score: drawnPipelineResult.exerciseResult?.score ?? null,
      matchedRoute: matchedRoutePayloadForStorage(drawnPipelineResult)
    })
      .then((saveResult) => {
        if (cancelled) {
          return;
        }

        if (saveResult.persisted) {
          setAttemptSaveStatus({
            state: "saved",
            message:
              saveResult.source === "local"
                ? "Attempt saved locally on this device."
                : "Attempt saved.",
            id: saveResult.id
          });
          setSavedHistoryRefreshKey((currentKey) => currentKey + 1);
          return;
        }

        setAttemptSaveStatus({
          state: "failed",
          message: saveResult.reason
            ? `Attempt reviewed, but could not be saved. ${saveResult.reason}`
            : "Attempt reviewed, but could not be saved."
        });
      })
      .catch((caughtError: unknown) => {
        if (cancelled) {
          return;
        }

        setAttemptSaveStatus({
          state: "failed",
          message: `Attempt reviewed, but could not be saved. ${readableError(caughtError)}`
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeMap.id,
    activeMap.mapVersion,
    drawnAttemptReview,
    drawnPipelineResult,
    exerciseId,
    selectedExercise?.exerciseVersion,
    weakAreaAttemptKey
  ]);

  useEffect(() => {
    routeReplayStateRef.current = routeReplayState;
  }, [routeReplayState]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const handleWheel = (event: globalThis.WheelEvent) => {
      mapScrollLockStateRef.current = enterMapScrollLockState(mapScrollLockStateRef.current);

      if (
        !shouldPreventWheelPageScrollOverMap(
          {
            deltaX: event.deltaX,
            deltaY: event.deltaY
          },
          mapScrollLockStateRef.current
        )
      ) {
        return;
      }

      event.preventDefault();

      const focusPoint = pointerToScreenPoint(canvas, event.clientX, event.clientY);

      if (!focusPoint) {
        return;
      }

      setMapViewportState((currentState) =>
        applyWheelZoomToMapView(currentState, event.deltaY, focusPoint, baseViewport)
      );
    };

    canvas.addEventListener("wheel", handleWheel, {
      passive: false
    });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [baseViewport]);

  useEffect(() => {
    const handleDocumentPointerDown = (event: globalThis.PointerEvent) => {
      const canvas = canvasRef.current;
      const target = event.target;
      const pointerDownInsideMap = Boolean(canvas && target instanceof Node && canvas.contains(target));

      mapScrollLockStateRef.current = updateMapScrollLockForOutsidePointerDown(
        mapScrollLockStateRef.current,
        pointerDownInsideMap
      );

      if (!pointerDownInsideMap) {
        panDragPointRef.current = null;
        setIsPanningMap(false);
      }
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
    };
  }, []);

  useEffect(() => {
    if (routeReplayState.status !== "playing") {
      return;
    }

    let cancelled = false;

    const tick = (nowMs: number) => {
      const nextState = advanceRouteReplayProgress(routeReplayStateRef.current, nowMs);

      routeReplayStateRef.current = nextState;
      setRouteReplayState(nextState);

      if (nextState.status === "playing" && !cancelled) {
        routeReplayAnimationFrameRef.current = window.requestAnimationFrame(tick);
      }
    };

    routeReplayAnimationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;

      if (routeReplayAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(routeReplayAnimationFrameRef.current);
        routeReplayAnimationFrameRef.current = null;
      }
    };
  }, [routeReplayRunId, routeReplayState.status]);

  useEffect(() => {
    writeStoredWeakAreaProfile(weakAreaProfile);
  }, [weakAreaProfile]);

  useEffect(() => {
    writeStoredAdaptivePracticeLauncherState(adaptiveLauncherState);
  }, [adaptiveLauncherState]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    drawRouteCanvas({
      canvas,
      map: activeMap,
      viewport,
      backgroundFeatures: syntheticBackgroundFeatures,
      linearFeatures: syntheticLinearFeatures,
      roadVisuals: syntheticRoadVisuals,
      showOsmRoadLabels: isConvertedOsmMap
        ? osmDebugOverlayState.visible || osmExerciseDebugOverlayState.visible
        : true,
      selectedExercise,
      trace: drawnTrace,
      routeDraft: drawnRouteDraft,
      fastestRoutePoints: fastestRouteOverlay.status === "available" ? fastestRouteOverlay.points : [],
      routeReplayMarkers,
      snapPreview,
      pipelineResult: drawnPipelineResult,
      roadRestrictionOverlays: visibleRoadRestrictionOverlays,
      routeIssueOverlays,
      restrictionMapVisualItems,
      selectedRestrictionHighlight,
      osmDebugOverlay: osmDebugOverlayAvailable ? osmDebugOverlay : null,
      osmExerciseDebugOverlay: osmExerciseDebugOverlayAvailable ? osmExerciseDebugOverlay : null
    });
  }, [
    activeMap,
    drawnPipelineResult,
    drawnRouteDraft,
    drawnTrace,
    fastestRouteOverlay,
    isConvertedOsmMap,
    osmDebugOverlay,
    osmDebugOverlayAvailable,
    osmExerciseDebugOverlay,
    osmExerciseDebugOverlayAvailable,
    osmExerciseDebugOverlayState.visible,
    osmDebugOverlayState.visible,
    restrictionMapVisualItems,
    routeReplayMarkers,
    routeIssueOverlays,
    selectedExercise,
    selectedRestrictionHighlight,
    snapPreview,
    syntheticBackgroundFeatures,
    syntheticLinearFeatures,
    syntheticRoadVisuals,
    viewport,
    visibleRoadRestrictionOverlays
  ]);

  function pointerToScreenPoint(canvas: HTMLCanvasElement | null, clientX: number, clientY: number): Vec2 | null {
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    };
  }

  function pointerToMapPoint(canvas: HTMLCanvasElement | null, clientX: number, clientY: number): Vec2 | null {
    const screenPoint = pointerToScreenPoint(canvas, clientX, clientY);

    if (!screenPoint) {
      return null;
    }

    return screenToMapPoint(screenPoint, viewport);
  }

  function cancelRouteReplayAnimation() {
    if (routeReplayAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(routeReplayAnimationFrameRef.current);
      routeReplayAnimationFrameRef.current = null;
    }
  }

  function updateRouteReplayState(updater: (currentState: RouteReplayState) => RouteReplayState) {
    const nextState = updater(routeReplayStateRef.current);

    routeReplayStateRef.current = nextState;
    setRouteReplayState(nextState);
  }

  function resetRouteReplay() {
    cancelRouteReplayAnimation();
    updateRouteReplayState((currentState) => resetRouteReplayState(currentState));
  }

  function changeRouteReplayMode(mode: RouteReplayMode) {
    cancelRouteReplayAnimation();
    updateRouteReplayState((currentState) => selectRouteReplayMode(currentState, mode));
  }

  function changeRouteReplaySpeed(speedMultiplier: number) {
    cancelRouteReplayAnimation();
    updateRouteReplayState((currentState) => setRouteReplaySpeed(currentState, speedMultiplier));
  }

  function playRouteReplay() {
    if (!canPlayRouteReplay) {
      return;
    }

    const nowMs = window.performance.now();
    const nextState = startRouteReplay({
      state: routeReplayStateRef.current,
      durationMs: routeReplayDurationMs,
      nowMs
    });

    routeReplayStateRef.current = nextState;
    setRouteReplayState(nextState);
    setRouteReplayRunId((currentId) => currentId + 1);
  }

  function pauseCurrentRouteReplay() {
    cancelRouteReplayAnimation();
    updateRouteReplayState((currentState) => pauseRouteReplay(currentState));
  }

  function restartRouteReplay() {
    resetRouteReplay();
  }

  function clearDrawnAttempt() {
    setIsDrawing(false);
    setDrawnRouteDraft(clearRouteDraft());
    setSelectedRestrictionReviewItemId(null);
    resetRouteReplay();
  }

  function toggleFastestRouteOverlay() {
    setFastestRouteRevealState((currentState) => toggleFastestRouteReveal(currentState));
  }

  function zoomInRouteMap() {
    setMapViewportState((currentState) => zoomInMapView(currentState, undefined, baseViewport));
  }

  function zoomOutRouteMap() {
    setMapViewportState((currentState) => zoomOutMapView(currentState, undefined, baseViewport));
  }

  function resetRouteMapView() {
    panDragPointRef.current = null;
    setIsPanningMap(false);
    setMapViewportState(resetMapViewport());
  }

  function setRouteMapInteractionMode(interactionMode: MapInteractionMode) {
    panDragPointRef.current = null;
    setIsPanningMap(false);
    setIsDrawing(false);
    setDrawnRouteDraft((currentDraft) =>
      currentDraft.activeStrokeIndex === null ? currentDraft : finishRouteStroke(currentDraft)
    );
    setMapViewportState((currentState) => setMapInteractionMode(currentState, interactionMode));
  }

  function undoLastDrawnStroke() {
    setIsDrawing(false);
    setDrawnRouteDraft((currentDraft) => undoLastRouteStroke(currentDraft));
    setSelectedRestrictionReviewItemId(null);
    resetRouteReplay();
  }

  function submitDrawnAttempt() {
    setIsDrawing(false);
  }

  function resetWeakAreaProfile() {
    setWeakAreaProfile(createEmptyLearnerWeakAreaProfile());
    setLastProfileAttemptKey(null);
  }

  function selectHistoryAttempt(attemptNumber: number) {
    setAttemptHistory((currentHistory) => selectRouteAttemptHistoryItem(currentHistory, attemptNumber));
  }

  function refreshSavedAttemptHistory() {
    setSavedHistoryRefreshKey((currentKey) => currentKey + 1);
  }

  function selectSavedAttempt(attemptId: string) {
    setSavedAttemptHistory((currentHistory) => ({
      ...currentHistory,
      selectedAttemptId: attemptId
    }));
  }

  function resetCurrentRouteAttemptState() {
    setNodeIdsText("");
    setRoadIdsText("");
    setResult(null);
    setError(null);
    setAttemptSaveStatus({
      state: "idle",
      message: null
    });
    lastSaveAttemptKeyRef.current = null;
    setFastestRouteRevealState(hideFastestRouteReveal());
    clearDrawnAttempt();
  }

  function handleStartAdaptivePractice(item: AdaptivePracticeQueueItem) {
    const nowIso = new Date().toISOString();
    const linkedExerciseId = launchableRouteExerciseId(item);
    const linkedMapOption = linkedExerciseId
      ? ROUTE_RUNNER_MAP_OPTIONS.find((option) => option.exercises.some((exercise) => exercise.id === linkedExerciseId))
      : null;
    const linkedExercise = linkedMapOption?.exercises.find((exercise) => exercise.id === linkedExerciseId) ?? null;

    setAdaptiveLauncherState((currentState) => startAdaptivePracticeItem(currentState, item, nowIso));
    resetCurrentRouteAttemptState();

    if (linkedExercise) {
      panDragPointRef.current = null;
      setIsPanningMap(false);
      setOsmDebugOverlayState(createDefaultOsmDebugOverlayState());
      setOsmExerciseDebugOverlayState(createDefaultOsmExerciseDebugOverlayState());
      setMapViewportState(resetMapViewport());
      setMapOptionId(linkedMapOption?.id ?? DEFAULT_ROUTE_RUNNER_MAP_ID);
      setExerciseId(linkedExercise.id);
      setAdaptiveLauncherMessage(
        `Starting: ${item.title}. Chosen because ${item.reasons[0] ?? item.explanation} Focus: ${item.practiceFocus}`
      );
      return;
    }

    setAdaptiveLauncherMessage(
      `Starting: ${item.title}. No linked exercise is available yet, so the current exercise stayed selected.`
    );
  }

  function handleSkipAdaptivePractice(itemId: string) {
    setAdaptiveLauncherState((currentState) => skipAdaptivePracticeItem(currentState, itemId));
    setAdaptiveLauncherMessage("Recommendation skipped. You can restart it from the skipped section.");
  }

  function handleDismissAdaptivePractice(itemId: string) {
    setAdaptiveLauncherState((currentState) => dismissAdaptivePracticeItem(currentState, itemId));
    setAdaptiveLauncherMessage("Recommendation marked as not useful.");
  }

  function handleCompleteAdaptivePractice(item: AdaptivePracticeQueueItem) {
    const completedAt = new Date().toISOString();
    const feedback = buildAdaptivePracticeOutcomeFeedback({
      practiceItem: item,
      exerciseId: launchableRouteExerciseId(item) ?? exerciseId,
      completedAt,
      review: drawnAttemptReview
    });

    setAdaptiveLauncherState((currentState) =>
      appendAdaptivePracticeOutcomeFeedback(completeAdaptivePracticeItem(currentState, item.id), feedback)
    );
    setAdaptiveLauncherMessage(summarizeAdaptivePracticeOutcomeFeedback(feedback));
  }

  function handleUndoAdaptivePracticeStatus(itemId: string) {
    setAdaptiveLauncherState((currentState) => undoAdaptivePracticeItemStatus(currentState, itemId));
    setAdaptiveLauncherMessage("Practice item status cleared.");
  }

  function resetAdaptivePracticeLauncher() {
    setAdaptiveLauncherState(createEmptyAdaptivePracticeLauncherState());
    setAdaptiveLauncherMessage("Adaptive practice launcher reset.");
  }

  function handleExerciseChange(nextExerciseId: string) {
    setExerciseId(nextExerciseId);
    setResult(null);
    setError(null);
    panDragPointRef.current = null;
    setIsPanningMap(false);
    setOsmDebugOverlayState(createDefaultOsmDebugOverlayState());
    setOsmExerciseDebugOverlayState(createDefaultOsmExerciseDebugOverlayState());
    setMapViewportState(resetMapViewport());
    setFastestRouteRevealState(hideFastestRouteReveal());
    clearDrawnAttempt();
  }

  function handleMapOptionChange(nextMapOptionId: string) {
    const nextMapOption = getRouteRunnerMapOption(nextMapOptionId) ?? DEFAULT_ROUTE_RUNNER_MAP_OPTION;

    setMapOptionId(nextMapOption.id);
    setExerciseId(nextMapOption.defaultExerciseId);
    setNodeIdsText("");
    setRoadIdsText("");
    setResult(null);
    setError(null);
    panDragPointRef.current = null;
    setIsPanningMap(false);
    setOsmDebugOverlayState(createDefaultOsmDebugOverlayState());
    setOsmExerciseDebugOverlayState(createDefaultOsmExerciseDebugOverlayState());
    setMapViewportState(resetMapViewport());
    setFastestRouteRevealState(hideFastestRouteReveal());
    clearDrawnAttempt();
  }

  function toggleRestrictionReviewFocus(item: RestrictionFocusReviewItem) {
    setSelectedRestrictionReviewItemId((currentId) => (currentId === item.id ? null : item.id));
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;

    if (!canvas) {
      return;
    }

    mapScrollLockStateRef.current = enterMapScrollLockState(mapScrollLockStateRef.current);

    const pointerInput = {
      button: event.button,
      buttons: event.buttons,
      pointerType: event.pointerType
    };
    const isMiddleButtonPan = isMiddleButtonMapPanPointer(pointerInput);

    if (isMiddleButtonPan) {
      event.preventDefault();
    }

    if (isPanMode || isMiddleButtonPan) {
      if (canvas.isConnected) {
        canvas.setPointerCapture(event.pointerId);
      }

      panDragPointRef.current = {
        clientX: event.clientX,
        clientY: event.clientY
      };
      setIsPanningMap(true);
      setIsDrawing(false);
      return;
    }

    if (!canStartDrawingWithMapPointer(pointerInput)) {
      return;
    }

    const point = pointerToMapPoint(canvas, event.clientX, event.clientY);

    if (!point) {
      return;
    }

    if (canvas.isConnected) {
      canvas.setPointerCapture(event.pointerId);
    }

    setIsDrawing(true);
    setSelectedRestrictionReviewItemId(null);
    resetRouteReplay();
    setDrawnRouteDraft((currentDraft) => startRouteStroke(currentDraft, point));
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (isPanningMap) {
      if (isMiddleButtonMapPanActive({ buttons: event.buttons, pointerType: event.pointerType })) {
        event.preventDefault();
      }

      const previousPoint = panDragPointRef.current;
      const currentPoint = {
        clientX: event.clientX,
        clientY: event.clientY
      };

      if (!previousPoint) {
        panDragPointRef.current = currentPoint;
        return;
      }

      panDragPointRef.current = currentPoint;

      setMapViewportState((currentState) =>
        applyPanToMapView(
          currentState,
          {
            deltaX: currentPoint.clientX - previousPoint.clientX,
            deltaY: currentPoint.clientY - previousPoint.clientY
          },
          baseViewport
        )
      );
      return;
    }

    if (!isDrawing) {
      return;
    }

    const canvas = event.currentTarget;

    if (!canvas) {
      return;
    }

    const point = pointerToMapPoint(canvas, event.clientX, event.clientY);

    if (!point) {
      return;
    }

    setDrawnRouteDraft((currentDraft) => appendRouteDraftPoint(currentDraft, point, 3));
  }

  function handlePointerEnter() {
    mapScrollLockStateRef.current = enterMapScrollLockState(mapScrollLockStateRef.current);
  }

  function handlePointerEnd(event: PointerEvent<HTMLCanvasElement>) {
    if (isPanningMap) {
      if (isMiddleButtonMapPanPointer({ button: event.button, pointerType: event.pointerType })) {
        event.preventDefault();
      }

      panDragPointRef.current = null;
      setIsPanningMap(false);

      const canvas = event.currentTarget;

      if (canvas?.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      return;
    }

    if (!isDrawing) {
      return;
    }

    const canvas = event.currentTarget;

    if (!canvas) {
      setDrawnRouteDraft((currentDraft) => finishRouteStroke(currentDraft));
      setIsDrawing(false);
      return;
    }

    const point = pointerToMapPoint(canvas, event.clientX, event.clientY);

    setDrawnRouteDraft((currentDraft) => {
      const nextDraft = point ? appendRouteDraftPoint(currentDraft, point, 3) : currentDraft;

      return finishRouteStroke(nextDraft);
    });

    setIsDrawing(false);

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function handleMapAuxClick(event: MouseEvent<HTMLCanvasElement>) {
    if (isMiddleButtonMapPanPointer({ button: event.button, pointerType: "mouse" })) {
      event.preventDefault();
    }
  }

  function handlePointerLeave(event: PointerEvent<HTMLCanvasElement>) {
    mapScrollLockStateRef.current = leaveMapScrollLockState(mapScrollLockStateRef.current);

    if (!isPanningMap) {
      return;
    }

    panDragPointRef.current = null;
    setIsPanningMap(false);

    const canvas = event.currentTarget;

    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function handleRunRoute() {
    setResult(null);
    setError(null);

    if (selectedExerciseAvailability && !selectedExerciseAvailability.isValid) {
      setError(
        [
          selectedExerciseAvailability.reason ?? INVALID_EXERCISE_ROUTE_MESSAGE,
          ...selectedExerciseAvailability.errors
        ].join(" ")
      );
      return;
    }

    try {
      const runResult = runRouteExercise({
        map: activeMap,
        exercises: activeExercises,
        exerciseId,
        userRoute: {
          nodeIds: parseCommaSeparatedIds(nodeIdsText),
          roadIds: parseCommaSeparatedIds(roadIdsText)
        }
      });

      setResult(runResult);
    } catch (caughtError) {
      setError(readableError(caughtError));
    }
  }

  function renderAdaptivePracticeLauncherItem(item: AdaptivePracticeQueueItem, label: string) {
    const status = getAdaptivePracticeItemStatus(adaptiveLauncherState, item.id);
    const sourceLabels = adaptiveSourceSignalLabels(item.sourceSignals);
    const linkedExercise = linkedAdaptiveExercise(item);
    const linkedExerciseId = launchableRouteExerciseId(item);
    const difficulty = linkedExercise?.difficulty ?? null;

    return (
      <li
        key={item.id}
        className={`rounded-md border bg-white/85 p-3 ${
          status === "active" ? "border-blue-300 ring-2 ring-blue-100" : "border-current/10"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{label}</p>
            <h5 className="mt-1 font-semibold">{item.title}</h5>
            <p className="mt-1 text-xs leading-5">{item.explanation}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${adaptivePriorityClass(
                item.priority
              )}`}
            >
              {item.priority} - {item.score}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${adaptiveLauncherStatusClass(
                status
              )}`}
            >
              {adaptiveLauncherStatusLabel(status)}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${adaptiveDifficultyClass(
                difficulty
              )}`}
            >
              {difficulty ?? "difficulty tbc"}
            </span>
          </div>
        </div>
        <dl className="mt-3 grid gap-2 text-xs leading-5 md:grid-cols-2">
          <div>
            <dt className="font-semibold">Practice focus</dt>
            <dd>{item.practiceFocus}</dd>
          </div>
          <div>
            <dt className="font-semibold">Weak areas targeted</dt>
            <dd>{adaptiveWeakAreaLabel(item)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Linked exercise</dt>
            <dd>{linkedExerciseId ? `${linkedExercise?.title ?? linkedExerciseId} (${linkedExerciseId})` : "No linked exercise yet"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Signals</dt>
            <dd>{sourceLabels.length > 0 ? sourceLabels.join(", ") : "default queue item"}</dd>
          </div>
        </dl>
        <div className="mt-3">
          <p className="text-xs font-semibold">Reasons</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-xs leading-5">
            {item.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleStartAdaptivePractice(item)}
            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-950"
          >
            {status === "active" ? "Restart practice" : "Start practice"}
          </button>
          <button
            type="button"
            onClick={() => handleSkipAdaptivePractice(item.id)}
            className="rounded-md border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-950"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => handleDismissAdaptivePractice(item.id)}
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
          >
            Mark as not useful
          </button>
          <button
            type="button"
            onClick={() => handleCompleteAdaptivePractice(item)}
            className="rounded-md border border-green-200 px-3 py-1 text-xs font-semibold text-green-950"
          >
            Mark completed
          </button>
          {status !== "recommended" ? (
            <button
              type="button"
              onClick={() => handleUndoAdaptivePracticeStatus(item.id)}
              className="rounded-md border border-current/20 px-3 py-1 text-xs font-semibold"
            >
              Undo status
            </button>
          ) : null}
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">TOPOPASS / Route Runner</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">
              {selectedExerciseDisplay?.title ?? `${selectedMapOption.label} route exercise runner`}
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {exercisePositionLabel}
              {selectedExerciseMetadata ? ` - ${selectedExerciseMetadata.difficulty} - ${selectedExerciseMetadata.estimatedMinutes} min` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
              Elapsed --:--
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={undoLastDrawnStroke}
                disabled={!hasUndoableDrawnStroke}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={clearDrawnAttempt}
                disabled={drawnTrace.points.length === 0 && !isDrawing}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={submitDrawnAttempt}
                disabled={drawnTrace.points.length === 0 || isDrawing}
                className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Submit Attempt
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 text-xs text-slate-600">
          <span className={`rounded-full px-3 py-1 font-semibold ${pipelineStatusClass(drawnDisplayStatus)}`}>
            {displayStatusText(drawnDisplayStatus)}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold">
            Map: {activeMap.name}
          </span>
          {isConvertedOsmMap ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-semibold text-sky-900">
              Converted OSM fixture
            </span>
          ) : null}
          {selectedMapOption.attribution ? (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold">
              Data: {selectedMapOption.attribution}
            </span>
          ) : null}
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold">
            Source: {selectedMapOption.source.replace("-", " ")}
          </span>
          {selectedMapMetadata ? (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold">
              {selectedMapMetadata.areaLabel ?? selectedMapMetadata.title}
            </span>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="order-3 grid gap-4 xl:grid-cols-[minmax(320px,0.95fr)_minmax(280px,0.65fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Exercise brief</p>
                <h2 className="mt-1 text-base font-semibold text-slate-950">Route assignment</h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {exercisePositionLabel}
              </span>
            </div>
            <label htmlFor="route-map-option" className="mt-4 block text-sm font-semibold text-slate-900">
              Dev map
            </label>
            <select
              id="route-map-option"
              value={selectedMapOption.id}
              onChange={(event) => handleMapOptionChange(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {ROUTE_RUNNER_MAP_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-600">{selectedMapOption.description}</p>
            {isConvertedOsmMap ? (
              <p className="mt-2 rounded-md border border-sky-100 bg-sky-50 p-2 text-xs leading-5 text-sky-950">
                This dev-only map is converted from the committed Stage 101 Overpass fixture and rendered through the
                existing TOPOPASS map engine. No live OSM data or external routing service is used.
              </p>
            ) : null}
            <label htmlFor="route-exercise" className="mt-4 block text-sm font-semibold text-slate-900">
              Route exercise
            </label>
            <select
              id="route-exercise"
              value={exerciseId}
              onChange={(event) => handleExerciseChange(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {activeExercises.map((exercise) => {
                const availability = exerciseAvailabilityById[exercise.id];

                return (
                  <option key={exercise.id} value={exercise.id}>
                    {availability
                      ? formatExerciseAvailabilityOptionLabel(exercise, availability)
                      : formatRouteExerciseSelectorLabel(exercise)}
                  </option>
                );
              })}
            </select>

            {selectedExerciseAvailability && !selectedExerciseAvailability.isValid ? (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <p className="font-semibold">{selectedExerciseAvailability.reason}</p>
                <p className="mt-1 leading-5">
                  This route is available for fixture debugging, but it is not treated as a normal scored practice
                  question until the required stops are legally reachable.
                </p>
                {selectedExerciseAvailability.errors.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
                    {selectedExerciseAvailability.errors.map((availabilityError) => (
                      <li key={availabilityError}>{availabilityError}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {selectedExercise ? (
              <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-semibold text-slate-950">{selectedExerciseDisplay?.title ?? selectedExercise.title}</h2>
                  {selectedExerciseDisplay?.difficultyLabel ? (
                    <span className="rounded-full border border-blue-100 bg-white px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {selectedExerciseDisplay.difficultyLabel}
                    </span>
                  ) : null}
                </div>
                {selectedExerciseDisplay?.description ? (
                  <p className="mt-2 leading-6 text-slate-700">{selectedExerciseDisplay.description}</p>
                ) : null}
                <dl className="mt-3 space-y-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exercise ID</dt>
                    <dd className="mt-1 font-mono text-xs text-slate-700">{selectedExercise.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Versions</dt>
                    <dd className="mt-1 font-mono text-xs text-slate-700">
                      map {activeMap.mapVersion ?? "none"} | exercise {selectedExercise.exerciseVersion ?? "none"}
                    </dd>
                  </div>
                  {selectedExerciseMetadata ? (
                    <>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata</dt>
                        <dd className="mt-1">
                          {selectedExerciseMetadata.difficulty} - {selectedExerciseMetadata.estimatedMinutes} min
                          {selectedMapMetadata ? ` - ${selectedMapMetadata.title}` : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skill focus</dt>
                        <dd className="mt-1 flex flex-wrap gap-1">
                          {selectedExerciseMetadata.skillTags.map((tag) => (
                            <span key={tag} className="rounded-full border border-blue-100 bg-white px-2 py-0.5 text-xs">
                              {tag.replaceAll("-", " ")}
                            </span>
                          ))}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weak-area tags</dt>
                        <dd className="mt-1 flex flex-wrap gap-1">
                          {selectedExerciseMetadata.weakAreaTags.map((tag) => (
                            <span key={tag} className="rounded-full border border-amber-100 bg-white px-2 py-0.5 text-xs">
                              {tag.replaceAll("-", " ")}
                            </span>
                          ))}
                        </dd>
                      </div>
                    </>
                  ) : null}
                  {selectedSyntheticScenario ? (
                    <>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scenario</dt>
                        <dd className="mt-1 space-y-2">
                          <p>
                            {selectedSyntheticScenario.title} - {selectedSyntheticScenario.areaLabel}
                            {selectedSyntheticScenario.estimatedShortestDistanceMeters
                              ? ` - shortest approx. ${selectedSyntheticScenario.estimatedShortestDistanceMeters}m`
                              : ""}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedSyntheticScenario.scenarioTags.map((tag) => (
                              <span key={tag} className="rounded-full border border-emerald-100 bg-white px-2 py-0.5 text-xs">
                                {tag.replaceAll("-", " ")}
                              </span>
                            ))}
                          </div>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Road focus</dt>
                        <dd className="mt-1">{selectedSyntheticScenario.featuredRoadNames.join(", ")}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Restriction summary</dt>
                        <dd className="mt-1">
                          <ul className="list-disc space-y-1 pl-5">
                            {selectedSyntheticScenario.restrictionSummary.map((summary) => (
                              <li key={summary}>{summary}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    </>
                  ) : null}
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</dt>
                    <dd className="mt-1">{selectedStartStop ? stopLabel(selectedStartStop, activeMap) : "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checkpoints</dt>
                    <dd className="mt-1">
                      {selectedCheckpointStops.length > 0 ? (
                        <ol className="list-decimal space-y-1 pl-5">
                          {selectedCheckpointStops.map((stop, index) => (
                            <li key={`${selectedExercise.id}-checkpoint-${index}`}>{stopLabel(stop, activeMap)}</li>
                          ))}
                        </ol>
                      ) : (
                        <span>No intermediate checkpoints.</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Finish</dt>
                    <dd className="mt-1">{selectedFinishStop ? stopLabel(selectedFinishStop, activeMap) : "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rules</dt>
                    <dd className="mt-1 space-y-1">
                      {selectedSyntheticScenario ? (
                        selectedSyntheticScenario.exerciseRules.map((rule) => <p key={rule}>{rule}</p>)
                      ) : (
                        <>
                          <p>Start at the first marker and finish at the destination marker.</p>
                          <p>Visit checkpoints in order and obey no-entry, one-way, restricted-road, and banned-turn signs.</p>
                        </>
                      )}
                      <p>Route efficiency must meet the existing pass mark.</p>
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Drawn attempt</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pipelineStatusClass(drawnDisplayStatus)}`}>
                    {displayStatusText(drawnDisplayStatus)}
                  </span>
                </div>
              </div>
            ) : null}

            {realLondonPilotPlaythroughPanel.shouldShowPanel ? (
              <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Real London Pilot Playthrough
                    </p>
                    <h3 className="mt-1 font-semibold">{realLondonPilotPlaythroughPanel.title}</h3>
                    <p className="mt-1 font-mono text-[11px] text-blue-800">
                      {realLondonPilotPlaythroughPanel.selectedExerciseId}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${realLondonPlaythroughToneClass(
                      realLondonPilotPlaythroughPanel.rows.find((row) => row.id === "attempt")?.tone ?? "neutral"
                    )}`}
                  >
                    {realLondonPilotPlaythroughPanel.attemptStatusText}
                  </span>
                </div>

                <dl className="mt-3 grid gap-2 text-xs lg:grid-cols-2">
                  {realLondonPilotPlaythroughPanel.rows
                    .filter((row) => row.id !== "next-action")
                    .map((row) => (
                      <div key={row.id} className={`rounded border p-2 ${realLondonPlaythroughToneClass(row.tone)}`}>
                        <dt className="font-semibold uppercase tracking-wide opacity-70">{row.label}</dt>
                        <dd className="mt-1 break-words font-semibold">{row.value}</dd>
                      </div>
                    ))}
                </dl>

                <div className="mt-3 rounded border border-blue-200 bg-white p-2 text-xs text-blue-950">
                  <p className="font-semibold uppercase tracking-wide text-blue-700">Next action</p>
                  <p className="mt-1 leading-5">{realLondonPilotPlaythroughPanel.nextAction}</p>
                </div>

                {realLondonPilotPlaythroughPanel.warnings.length > 0 ? (
                  <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
                    <p className="font-semibold uppercase tracking-wide">Warnings</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 leading-5">
                      {realLondonPilotPlaythroughPanel.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Manual route input</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Enter comma-separated fixture IDs. If both fields are supplied, each road must connect the matching pair
              of selected nodes.
            </p>

            <label htmlFor="node-ids" className="mt-4 block text-sm font-semibold text-slate-900">
              Node IDs
            </label>
            <textarea
              id="node-ids"
              value={nodeIdsText}
              onChange={(event) => setNodeIdsText(event.target.value)}
              rows={3}
              placeholder="n02, n03, n12, n17"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />

            <label htmlFor="road-ids" className="mt-4 block text-sm font-semibold text-slate-900">
              Road IDs
            </label>
            <textarea
              id="road-ids"
              value={roadIdsText}
              onChange={(event) => setRoadIdsText(event.target.value)}
              rows={3}
              placeholder="r02, r37, r24"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={handleRunRoute}
              className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Run route
            </button>
          </div>
        </div>

        <div className="contents">
          <section className="order-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Route map workspace</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Draw with mouse, touch, or stylus on the synthetic street-map renderer. The orange trace is raw
                  input; green preview points are snapped candidates. The panel below shows the dev-only pipeline result.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:max-w-md sm:items-end">
                <span
                  className={`min-w-[9.5rem] whitespace-nowrap rounded-full px-3 py-1 text-center text-xs font-semibold ${pipelineStatusClass(
                    drawnDisplayStatus
                  )}`}
                >
                  {displayStatusText(drawnDisplayStatus)}
                </span>
                <p className="text-xs leading-5 text-slate-500">
                  Draw in multiple strokes. Release and click again to continue. Switch to Pan when you want to move
                  the map instead of drawing.
                </p>
                {isPanMode ? (
                  <p className="text-xs font-medium leading-5 text-blue-700">
                    Pan mode is on. Drag the map to move the view; switch back to Draw to add route strokes.
                  </p>
                ) : null}
                {fastestRouteOverlay.status === "available" ? (
                  <p className="text-xs leading-5 text-sky-700">
                    Fastest route visible: {formatDistance(fastestRouteOverlay.distanceMeters)}. This overlay is
                    visual-only and does not affect scoring.
                  </p>
                ) : null}
                {fastestRouteOverlay.status === "unavailable" ? (
                  <div className="text-xs leading-5 text-amber-700">
                    <p>{fastestRouteOverlay.message}</p>
                    {fastestRouteOverlay.invalidReasons.length > 0 ? (
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {fastestRouteOverlay.invalidReasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex min-h-[76px] items-center rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
              {isDrawing ? (
                <p className="font-medium">Drawing active. Release the pointer to score the captured route.</p>
              ) : drawnDisplayStatus === "no drawing" ? (
                <p>
                  Draw from marker 1 through the ordered stop markers. The route runner will simplify, snap, match,
                  and score the captured route.
                </p>
              ) : (
                <p>
                  Trace captured for {selectedExerciseDisplay?.title ?? "the selected exercise"}. Press and drag again to
                  continue the same route, use Undo to remove the latest stroke, or clear it to reset everything.
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={showRoadRestrictions}
                  onChange={(event) => setShowRoadRestrictions(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
                />
                Show road restrictions
              </label>
              <label className="inline-flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={showTurnRestrictions}
                  onChange={(event) => setShowTurnRestrictions(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
                />
                Show turn restrictions
              </label>
            </div>

            <div
              className="relative mt-4 min-h-[540px] overflow-hidden rounded-lg border border-slate-200 bg-[#eef3f8] xl:min-h-[680px] 2xl:min-h-[780px]"
              style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
            >
              <div className="pointer-events-none absolute right-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap justify-end gap-2">
                <div className="pointer-events-auto inline-flex overflow-hidden rounded-md border border-slate-300 bg-white/95 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setRouteMapInteractionMode("draw")}
                    aria-pressed={mapInteractionMode === "draw"}
                    className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                      mapInteractionMode === "draw"
                        ? "bg-blue-700 text-white"
                        : "bg-white/95 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Draw
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteMapInteractionMode("pan")}
                    aria-pressed={mapInteractionMode === "pan"}
                    className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap border-l border-slate-300 px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                      mapInteractionMode === "pan"
                        ? "bg-blue-700 text-white"
                        : "bg-white/95 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Pan
                  </button>
                </div>
                <button
                  type="button"
                  onClick={undoLastDrawnStroke}
                  disabled={!hasUndoableDrawnStroke}
                  className="pointer-events-auto inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white/95 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={clearDrawnAttempt}
                  disabled={drawnTrace.points.length === 0 && !isDrawing}
                  className="pointer-events-auto inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white/95 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  Clear drawing
                </button>
                <button
                  type="button"
                  onClick={toggleFastestRouteOverlay}
                  disabled={selectedExerciseIsInvalid}
                  aria-pressed={fastestRouteRevealState.visible}
                  className="pointer-events-auto inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-sky-300 bg-white/95 px-3 py-2 text-sm font-semibold text-sky-900 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-sky-100"
                >
                  {selectedExerciseIsInvalid
                    ? "Fastest route unavailable"
                    : fastestRouteRevealState.visible
                      ? "Hide fastest route"
                      : "Reveal fastest route"}
                </button>
                {osmDebugOverlayAvailable ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOsmDebugOverlayState((currentState) => ({
                        ...currentState,
                        visible: !currentState.visible
                      }))
                    }
                    aria-pressed={osmDebugOverlayState.visible}
                    className={`pointer-events-auto inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border px-3 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-100 ${
                      osmDebugOverlayState.visible
                        ? "border-cyan-500 bg-cyan-700 text-white hover:bg-cyan-800"
                        : "border-cyan-300 bg-white/95 text-cyan-900 hover:bg-cyan-50"
                    }`}
                  >
                    {osmDebugOverlayState.visible ? "Hide OSM QA" : "OSM QA"}
                  </button>
                ) : null}
                {osmExerciseDebugOverlayAvailable ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOsmExerciseDebugOverlayState((currentState) => ({
                        visible: !currentState.visible
                      }))
                    }
                    aria-pressed={osmExerciseDebugOverlayState.visible}
                    className={`pointer-events-auto inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border px-3 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-violet-100 ${
                      osmExerciseDebugOverlayState.visible
                        ? "border-violet-500 bg-violet-700 text-white hover:bg-violet-800"
                        : "border-violet-300 bg-white/95 text-violet-900 hover:bg-violet-50"
                    }`}
                  >
                    {osmExerciseDebugOverlayState.visible ? "Hide exercise QA" : "Exercise QA"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={resetRouteMapView}
                  className="pointer-events-auto inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white/95 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  Reset view
                </button>
              </div>
              <div className="pointer-events-auto absolute right-4 top-24 z-20 flex flex-col overflow-hidden rounded-lg border border-slate-300 bg-white/95 shadow-md">
                <button
                  type="button"
                  onClick={zoomInRouteMap}
                  disabled={!canZoomIn}
                  aria-label="Zoom in"
                  title="Zoom in"
                  className="inline-flex h-10 w-10 items-center justify-center text-lg font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={zoomOutRouteMap}
                  disabled={!canZoomOut}
                  aria-label="Zoom out"
                  title="Zoom out"
                  className="inline-flex h-10 w-10 items-center justify-center border-t border-slate-200 text-lg font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  -
                </button>
              </div>
              <div className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                {Math.round(mapViewportState.zoom * 100)}%
              </div>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onPointerDown={handlePointerDown}
                onPointerEnter={handlePointerEnter}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onPointerLeave={handlePointerLeave}
                onAuxClick={handleMapAuxClick}
                className={`block h-full w-full touch-none ${
                  isPanningMap ? "cursor-grabbing" : isPanMode ? "cursor-grab" : "cursor-crosshair"
                }`}
                aria-label={`${activeMap.name} drawing capture canvas`}
              />
            </div>

            {osmDebugOverlayAvailable ? (
              <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Converted OSM QA</p>
                    <h3 className="mt-1 font-semibold text-cyan-950">{osmDebugOverlay.summary.mapName}</h3>
                    <p className="mt-1 text-xs leading-5 text-cyan-800">
                      {osmDebugOverlay.summary.sourceFixtureName ?? "Converted fixture"} | {osmDebugOverlay.summary.mapId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-950 shadow-sm">
                      <input
                        type="checkbox"
                        checked={osmDebugOverlayState.visible}
                        onChange={(event) =>
                          setOsmDebugOverlayState((currentState) => ({
                            ...currentState,
                            visible: event.target.checked
                          }))
                        }
                        className="h-4 w-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-200"
                      />
                      Show graph overlay
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-md border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-950 shadow-sm">
                      <input
                        type="checkbox"
                        checked={osmExerciseDebugOverlayState.visible}
                        onChange={(event) =>
                          setOsmExerciseDebugOverlayState({
                            visible: event.target.checked
                          })
                        }
                        className="h-4 w-4 rounded border-violet-300 text-violet-700 focus:ring-violet-200"
                      />
                      Exercise QA overlay
                    </label>
                    <label
                      className={`inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-semibold shadow-sm ${
                        osmDebugOverlayState.visible
                          ? "border-cyan-200 text-cyan-950"
                          : "border-slate-200 text-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={osmDebugOverlayState.showIds}
                        disabled={!osmDebugOverlayState.visible}
                        onChange={(event) =>
                          setOsmDebugOverlayState((currentState) => ({
                            ...currentState,
                            showIds: event.target.checked
                          }))
                        }
                        className="h-4 w-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-200 disabled:opacity-50"
                      />
                      Show node / segment IDs
                    </label>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-xs text-cyan-950 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                  <div className="rounded-md border border-cyan-100 bg-white p-3">
                    <dt className="font-semibold uppercase tracking-wide text-cyan-700">Source</dt>
                    <dd className="mt-1 text-base font-bold uppercase">{osmDebugOverlay.summary.sourceKind}</dd>
                  </div>
                  <div className="rounded-md border border-cyan-100 bg-white p-3">
                    <dt className="font-semibold uppercase tracking-wide text-cyan-700">Nodes</dt>
                    <dd className="mt-1 text-base font-bold">{osmDebugOverlay.summary.nodeCount}</dd>
                  </div>
                  <div className="rounded-md border border-cyan-100 bg-white p-3">
                    <dt className="font-semibold uppercase tracking-wide text-cyan-700">Road segments</dt>
                    <dd className="mt-1 text-base font-bold">{osmDebugOverlay.summary.roadSegmentCount}</dd>
                  </div>
                  <div className="rounded-md border border-cyan-100 bg-white p-3">
                    <dt className="font-semibold uppercase tracking-wide text-cyan-700">Directed edges</dt>
                    <dd className="mt-1 text-base font-bold">{osmDebugOverlay.summary.directedEdgeCount}</dd>
                  </div>
                  <div className="rounded-md border border-cyan-100 bg-white p-3">
                    <dt className="font-semibold uppercase tracking-wide text-cyan-700">One-way segments</dt>
                    <dd className="mt-1 text-base font-bold">{osmDebugOverlay.summary.oneWayRoadSegmentCount}</dd>
                  </div>
                  <div className="rounded-md border border-cyan-100 bg-white p-3">
                    <dt className="font-semibold uppercase tracking-wide text-cyan-700">Two-way segments</dt>
                    <dd className="mt-1 text-base font-bold">{osmDebugOverlay.summary.twoWayRoadSegmentCount}</dd>
                  </div>
                  <div className="rounded-md border border-cyan-100 bg-white p-3">
                    <dt className="font-semibold uppercase tracking-wide text-cyan-700">Blocked ways</dt>
                    <dd className="mt-1 text-base font-bold">{osmDebugOverlay.summary.blockedOsmWayCount}</dd>
                  </div>
                  <div className="rounded-md border border-cyan-100 bg-white p-3">
                    <dt className="font-semibold uppercase tracking-wide text-cyan-700">Extent</dt>
                    <dd className="mt-1 text-sm font-bold">
                      {osmDebugOverlay.summary.extent.width.toFixed(0)} x {osmDebugOverlay.summary.extent.height.toFixed(0)}
                    </dd>
                  </div>
                  <div className="rounded-md border border-cyan-100 bg-white p-3">
                    <dt className="font-semibold uppercase tracking-wide text-cyan-700">Bounds centre</dt>
                    <dd className="mt-1 text-sm font-bold">
                      {osmDebugOverlay.summary.extent.centerX.toFixed(0)}, {osmDebugOverlay.summary.extent.centerY.toFixed(0)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-3 rounded-md border border-cyan-100 bg-white/80 p-3 text-xs leading-5 text-cyan-800">
                  Graph IDs stay hidden unless enabled. The overlay draws below route, restriction focus, replay, and
                  start/checkpoint/finish markers so exercise markers remain visible while inspecting the graph.
                  {osmDebugOverlay.summary.blockedOsmWayIds.length > 0
                    ? ` Blocked OSM way IDs: ${osmDebugOverlay.summary.blockedOsmWayIds.join(", ")}.`
                    : ""}
                </p>

                {realLondonPilotQaPanel ? (
                  <div
                    className={`mt-4 rounded-md border p-3 text-sm ${
                      realLondonPilotQaPanel.statusTone === "pass"
                        ? "border-green-200 bg-green-50 text-green-950"
                        : "border-red-200 bg-red-50 text-red-950"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide">Real London Pilot QA</p>
                        <h3 className="mt-1 font-semibold">{realLondonPilotQaPanel.title}</h3>
                        <p className="mt-1 text-xs leading-5">
                          Status: {realLondonPilotQaPanel.statusLabel} | Exercises:{" "}
                          {realLondonPilotQaPanel.exerciseProgressText}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${osmQaStatusClass(
                          realLondonPilotQaPanel.statusTone
                        )}`}
                      >
                        {realLondonPilotQaPanel.statusLabel}
                      </span>
                    </div>

                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                      {realLondonPilotQaPanel.metricRows.map((row) => (
                        <div key={row.id} className="rounded border border-white/80 bg-white p-2">
                          <dt className="font-semibold uppercase tracking-wide text-slate-500">{row.label}</dt>
                          <dd className="mt-1 break-words font-semibold text-slate-950">{row.value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-3 rounded border border-white/80 bg-white p-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exercises</p>
                      {realLondonPilotQaPanel.exerciseRows.length > 0 ? (
                        <ul className="mt-2 grid gap-2 lg:grid-cols-2">
                          {realLondonPilotQaPanel.exerciseRows.map((row) => (
                            <li key={row.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-slate-800">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[11px] font-semibold">{row.id}</span>
                                <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold">
                                  v{row.exerciseVersion}
                                </span>
                                <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold">
                                  {row.difficulty}
                                </span>
                                <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold">
                                  {row.routeTypeLabel}
                                </span>
                                <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold">
                                  {row.estimatedDistanceText}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] leading-5 text-slate-600">{row.expectedComplexity}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {realLondonPilotQaPanel.exerciseIds.map((exerciseId) => (
                            <li
                              key={exerciseId}
                              className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-800"
                            >
                              {exerciseId}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <ul className="mt-3 grid gap-2 text-xs lg:grid-cols-3">
                      {realLondonPilotQaPanel.summaryRows.map((row) => (
                        <li key={row.id} className="rounded border border-white/80 bg-white p-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-950">{row.label}</p>
                            <span
                              className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${osmQaStatusClass(
                                row.status
                              )}`}
                            >
                              {row.value}
                            </span>
                          </div>
                          <p className="mt-1 leading-5 text-slate-700">{row.detail}</p>
                        </li>
                      ))}
                    </ul>

                    <div
                      className={`mt-3 rounded border p-2 text-xs ${
                        realLondonPilotQaPanel.statusTone === "pass"
                          ? "border-green-100 bg-white text-green-950"
                          : "border-red-100 bg-white text-red-950"
                      }`}
                    >
                      <p className="font-semibold uppercase tracking-wide">Failures</p>
                      <ul className="mt-2 grid gap-1 font-mono text-[11px] leading-5">
                        {realLondonPilotQaPanel.failureReasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {osmExerciseDebugOverlay ? (
                  <div className="mt-4 rounded-md border border-violet-200 bg-white p-3 text-sm text-violet-950">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                          Exercise QA overlay
                        </p>
                        <p className="mt-1 font-semibold">{osmExerciseDebugOverlay.exerciseTitle}</p>
                        <p className="mt-1 font-mono text-[11px] text-violet-800">
                          {osmExerciseDebugOverlay.exerciseId}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${osmQaStatusClass(
                          osmExerciseDebugOverlay.qa.status
                        )}`}
                      >
                        {osmQaStatusLabel(osmExerciseDebugOverlay.qa.status)}
                      </span>
                    </div>

                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded border border-violet-100 bg-violet-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-violet-700">Map</dt>
                        <dd className="mt-1 font-semibold">{osmExerciseDebugOverlay.mapId}</dd>
                      </div>
                      <div className="rounded border border-violet-100 bg-violet-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-violet-700">Fastest route</dt>
                        <dd className="mt-1 font-semibold">
                          {osmExerciseDebugOverlay.route.status} | {osmExerciseDebugOverlay.route.segmentCount} segment
                          {osmExerciseDebugOverlay.route.segmentCount === 1 ? "" : "s"}
                        </dd>
                      </div>
                      <div className="rounded border border-violet-100 bg-violet-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-violet-700">Route length</dt>
                        <dd className="mt-1 font-semibold">
                          {osmExerciseDebugOverlay.route.distanceMeters !== null
                            ? formatDistance(osmExerciseDebugOverlay.route.distanceMeters)
                            : "Unavailable"}
                        </dd>
                      </div>
                      <div className="rounded border border-violet-100 bg-violet-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-violet-700">Blocked visuals</dt>
                        <dd className="mt-1 font-semibold">
                          {osmExerciseDebugOverlay.metadata.blockedEdgeCount} total |{" "}
                          {osmExerciseDebugOverlay.metadata.relevantBlockedEdgeCount} relevant
                        </dd>
                      </div>
                      <div className="rounded border border-violet-100 bg-violet-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-violet-700">Start</dt>
                        <dd className="mt-1 font-mono text-[11px]">
                          {osmExerciseDebugOverlay.metadata.startNodeId ?? "Missing"}
                        </dd>
                      </div>
                      <div className="rounded border border-violet-100 bg-violet-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-violet-700">Checkpoints</dt>
                        <dd className="mt-1 font-mono text-[11px]">
                          {osmExerciseDebugOverlay.metadata.checkpointNodeIds.length > 0
                            ? osmExerciseDebugOverlay.metadata.checkpointNodeIds.join(" -> ")
                            : "None"}
                        </dd>
                      </div>
                      <div className="rounded border border-violet-100 bg-violet-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-violet-700">Destination</dt>
                        <dd className="mt-1 font-mono text-[11px]">
                          {osmExerciseDebugOverlay.metadata.destinationNodeId ?? "Missing"}
                        </dd>
                      </div>
                      <div className="rounded border border-violet-100 bg-violet-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-violet-700">Route edge status</dt>
                        <dd className="mt-1 font-semibold">
                          {osmExerciseDebugOverlay.qa.hasUnknownRouteEdges ? "Unknown edge" : "Known edges"} |{" "}
                          {osmExerciseDebugOverlay.qa.hasBlockedRouteEdges ? "Blocked edge" : "No blocked edges"}
                        </dd>
                      </div>
                    </dl>

                    <p className="mt-3 rounded border border-violet-100 bg-violet-50 p-2 font-mono text-[11px] leading-5 text-violet-900">
                      Bounds x {osmExerciseDebugOverlay.renderBounds.minX.toFixed(0)} to{" "}
                      {osmExerciseDebugOverlay.renderBounds.maxX.toFixed(0)}, y{" "}
                      {osmExerciseDebugOverlay.renderBounds.minY.toFixed(0)} to{" "}
                      {osmExerciseDebugOverlay.renderBounds.maxY.toFixed(0)}.{" "}
                      {osmExerciseDebugOverlay.qa.allNodesInsideRenderBounds
                        ? "All route nodes are inside render bounds."
                        : "At least one route node is outside render bounds."}
                    </p>

                    {osmExerciseDebugOverlay.qa.failureMessages.length > 0 ? (
                      <div className="mt-3 rounded border border-red-100 bg-red-50 p-2 text-xs text-red-950">
                        <p className="font-semibold uppercase tracking-wide">Overlay QA failures</p>
                        <ul className="mt-2 grid gap-1 font-mono text-[11px] leading-5">
                          {osmExerciseDebugOverlay.qa.failureMessages.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="mt-3 rounded border border-green-100 bg-green-50 p-2 text-xs font-semibold text-green-950">
                        No QA failures for the selected exercise overlay.
                      </p>
                    )}
                  </div>
                ) : null}

                {osmQaStatusPanel ? (
                  <div className="mt-4 rounded-md border border-cyan-100 bg-white p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Exercise QA status</p>
                        <p className="mt-1 text-sm leading-5 text-cyan-900">
                          Uses the Stage 108 harness to check stop nodes, ordered reachability, legal reveal route,
                          directed edges, and render bounds.
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${osmQaStatusClass(
                          osmQaStatusPanel.qaState
                        )}`}
                      >
                        {osmQaStatusLabel(osmQaStatusPanel.qaState)}
                      </span>
                    </div>

                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-5">
                      <div className="rounded border border-cyan-100 bg-cyan-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-cyan-700">Map</dt>
                        <dd className="mt-1 font-semibold">{osmQaStatusPanel.mapName}</dd>
                      </div>
                      <div className="rounded border border-cyan-100 bg-cyan-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-cyan-700">Nodes</dt>
                        <dd className="mt-1 font-semibold">{osmQaStatusPanel.nodeCount}</dd>
                      </div>
                      <div className="rounded border border-cyan-100 bg-cyan-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-cyan-700">Directed edges</dt>
                        <dd className="mt-1 font-semibold">{osmQaStatusPanel.directedEdgeCount}</dd>
                      </div>
                      <div className="rounded border border-cyan-100 bg-cyan-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-cyan-700">Exercises</dt>
                        <dd className="mt-1 font-semibold">{osmQaStatusPanel.exerciseCount}</dd>
                      </div>
                      <div className="rounded border border-cyan-100 bg-cyan-50 p-2">
                        <dt className="font-semibold uppercase tracking-wide text-cyan-700">Pass / fail</dt>
                        <dd className="mt-1 font-semibold">
                          {osmQaStatusPanel.passedExerciseCount} / {osmQaStatusPanel.failedExerciseCount}
                        </dd>
                      </div>
                    </dl>

                    {osmQaStatusPanel.selectedExercise ? (
                      <div className="mt-3 rounded border border-cyan-100 bg-cyan-50 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                              Selected exercise QA
                            </p>
                            <p className="mt-1 font-semibold">{osmQaStatusPanel.selectedExercise.title}</p>
                            <p className="mt-1 font-mono text-[11px] text-cyan-800">
                              {osmQaStatusPanel.selectedExercise.id}
                            </p>
                            <p className="mt-1 text-xs text-cyan-800">
                              {osmQaSelectedSummaryLabel(osmQaStatusPanel.selectedExercise)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${osmQaStatusClass(
                              osmQaStatusPanel.selectedExercise.qaState
                            )}`}
                          >
                            {osmQaStatusLabel(osmQaStatusPanel.selectedExercise.qaState)}
                          </span>
                        </div>

                        <ul className="mt-3 grid gap-2 text-xs md:grid-cols-2 xl:grid-cols-5">
                          {osmQaStatusPanel.selectedExercise.checks.map((check) => (
                            <li key={check.id} className="rounded border border-cyan-100 bg-white p-2">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-cyan-950">{check.label}</p>
                                <span
                                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${osmQaStatusClass(
                                    check.state
                                  )}`}
                                >
                                  {osmQaStatusLabel(check.state)}
                                </span>
                              </div>
                              <p className="mt-1 leading-5 text-cyan-800">{check.detail}</p>
                            </li>
                          ))}
                        </ul>

                        {osmQaStatusPanel.selectedExercise.failureMessages.length > 0 ? (
                          <div className="mt-3 rounded border border-red-100 bg-red-50 p-2 text-xs text-red-950">
                            <p className="font-semibold uppercase tracking-wide">QA failures</p>
                            <ul className="mt-2 grid gap-1 font-mono text-[11px] leading-5">
                              {osmQaStatusPanel.selectedExercise.failureMessages.map((message) => (
                                <li key={message}>{message}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="mt-3 rounded border border-green-100 bg-green-50 p-2 text-xs font-semibold text-green-950">
                            No QA failures for the selected exercise.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 rounded-md border border-cyan-100 bg-white/80 p-3 text-xs leading-5 text-cyan-800">
                    Enable the graph overlay or Exercise QA overlay to run legality, reachability, directed-edge, and
                    render-bounds checks for the selected converted map.
                  </p>
                )}

                <div className="mt-4 rounded-md border border-cyan-100 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Selected exercise</p>
                  <p className="mt-1 font-semibold">
                    {osmDebugOverlay.summary.selectedExerciseTitle ?? "No exercise selected"}
                  </p>
                  <p className="mt-1 font-mono text-xs text-cyan-800">
                    {osmDebugOverlay.summary.selectedExerciseId ?? "No exercise id"}
                  </p>
                  {osmDebugOverlay.summary.stops.length > 0 ? (
                    <ol className="mt-3 grid gap-2 text-xs md:grid-cols-3">
                      {osmDebugOverlay.summary.stops.map((stop) => (
                        <li key={`${stop.order}-${stop.nodeId ?? stop.label}`} className="rounded border border-cyan-100 bg-cyan-50 p-2">
                          <p className="font-semibold uppercase tracking-wide">{stop.role} {stop.order}</p>
                          <p className="mt-1">{stop.label}</p>
                          <p className="mt-1 font-mono text-[11px] text-cyan-800">{stop.nodeId ?? "unresolved"}</p>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-5">
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raw points</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{drawnTrace.points.length}</p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Simplified</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {drawnPipelineResult.simplifiedTrace.points.length}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Snapped</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{drawnPipelineResult.snappedPoints.length}</p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {hasUsableDrawnMatch ? "Matched roads" : "Road candidates"}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {drawnPipelineResult.matchResult?.orderedRoadIds.length ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Off-road points</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {snapPreview.diagnostics.filter((diagnostic) => diagnostic.code === "off_road_points").length}
                </p>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 text-sm text-slate-700 lg:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate roads</dt>
                <dd className="mt-1">{selectedRoadNames(snapPreviewRoadIds, activeMap)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Snap diagnostics</dt>
                <dd className="mt-1">
                  {snapPreview.diagnostics.length > 0
                    ? snapPreview.diagnostics.map((diagnostic) => diagnostic.code).join(", ")
                    : "None"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-950">
              <p className="font-semibold">Restriction overlays</p>
              <p className="mt-1 text-xs leading-5">
                Road-level no-entry, road-closed, one-way, junction-level banned-turn, and post-attempt route issue
                symbols are drawn from the existing map-engine and review data. The polished symbol layer is visual
                only; legality, scoring, matching, and review reasoning remain unchanged.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                {restrictionMapVisualItems.map((item) => (
                  <span
                    key={item.id}
                    className={`rounded-full border px-3 py-1 ${
                      selectedRestrictionFocusTarget?.visualItemId === item.id
                        ? "border-sky-300 bg-sky-50 text-sky-950"
                        : "border-red-200 bg-white text-red-900"
                    }`}
                  >
                    {item.label}
                  </span>
                ))}
                {restrictionMapVisualItems.length === 0 ? (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                    No restriction symbols visible
                  </span>
                ) : null}
                {selectedRestrictionFocusTarget ? (
                  <button
                    type="button"
                    onClick={() => setSelectedRestrictionReviewItemId(null)}
                    className="rounded-full border border-sky-300 bg-white px-3 py-1 text-sky-900 hover:bg-sky-50"
                  >
                    Clear map focus
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-xs leading-5 text-red-900">
                {showRoadRestrictions || showTurnRestrictions
                  ? "Use the review panel's Show on map buttons to emphasise a specific route issue or restriction."
                  : "Restriction toggles are off, so only post-attempt route issue symbols remain visible."}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-700">
              {RESTRICTION_MAP_LEGEND_ITEMS.map((item) => (
                <span
                  key={item.id}
                  title={item.description}
                  className={`rounded-full border px-3 py-1 ${syntheticLegendToneClass(item.tone)}`}
                >
                  {item.label}
                </span>
              ))}
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1">Green dots: snapped points</span>
            </div>
          </section>

          <section className="order-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Attempt review</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Raw drawing is simplified, snapped, matched to roads, and then passed to the route exercise runner
                  when the match is usable.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${pipelineStatusClass(
                  drawnDisplayStatus
                )}`}
              >
                {displayStatusText(drawnDisplayStatus)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {pipelineStageBadges.map((badge) => (
                <span
                  key={badge.id}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${stageBadgeClass(badge.state)}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            <div className={`mt-4 rounded-md border p-4 text-sm ${scoreStateClass(drawnScoreDisplay.state)}`}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold">{drawnScoreDisplay.label}</p>
                <p className="text-xs font-semibold uppercase tracking-wide">
                  {visibleDrawnExerciseResult ? resultSummary(visibleDrawnExerciseResult) : drawnDisplayStatus}
                </p>
              </div>
              <p className="mt-2">{drawnScoreDisplay.summary}</p>
            </div>

            {hasSubmittedReplayAttempt ? (
              <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-4 text-sm text-sky-950">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Route replay</p>
                    <h3 className="mt-1 text-base font-semibold">Replay this attempt</h3>
                    <p className="mt-1 text-xs leading-5">{routeReplayMessage}</p>
                  </div>
                  <span className="rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold">
                    {routeReplayStatusLabel(routeReplayState)} - {Math.round(routeReplayState.progress * 100)}%
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => changeRouteReplayMode("user")}
                    disabled={!canReplayUserRoute}
                    aria-pressed={routeReplayState.mode === "user"}
                    className={`rounded-md border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${routeReplayModeButtonClass(
                      routeReplayState.mode === "user"
                    )}`}
                  >
                    Replay my route
                  </button>
                  <button
                    type="button"
                    onClick={() => changeRouteReplayMode("shortest")}
                    disabled={!canReplayShortestRoute}
                    aria-pressed={routeReplayState.mode === "shortest"}
                    className={`rounded-md border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${routeReplayModeButtonClass(
                      routeReplayState.mode === "shortest"
                    )}`}
                  >
                    Replay shortest route
                  </button>
                  <button
                    type="button"
                    onClick={() => changeRouteReplayMode("compare")}
                    disabled={!canReplayUserRoute || !canReplayShortestRoute}
                    aria-pressed={routeReplayState.mode === "compare"}
                    className={`rounded-md border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${routeReplayModeButtonClass(
                      routeReplayState.mode === "compare"
                    )}`}
                  >
                    Compare both
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={playRouteReplay}
                    disabled={!canPlayRouteReplay || routeReplayState.status === "playing"}
                    className="rounded-md border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-950 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    onClick={pauseCurrentRouteReplay}
                    disabled={routeReplayState.status !== "playing"}
                    className="rounded-md border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-950 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={restartRouteReplay}
                    disabled={routeReplayState.status === "idle" && routeReplayState.progress === 0}
                    className="rounded-md border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-950 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Restart
                  </button>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-sky-950">
                    Speed
                    <select
                      value={routeReplayState.speedMultiplier}
                      onChange={(event) => changeRouteReplaySpeed(Number(event.target.value))}
                      disabled={routeReplayState.status === "playing"}
                      className="rounded-md border border-sky-200 bg-white px-2 py-2 text-xs font-semibold text-sky-950 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ROUTE_REPLAY_SPEED_OPTIONS.map((speed) => (
                        <option key={speed} value={speed}>
                          {speed}x
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <dl className="mt-3 grid gap-2 text-xs leading-5 sm:grid-cols-3">
                  <div className="rounded-md border border-sky-100 bg-white/80 p-3">
                    <dt className="font-semibold">My route</dt>
                    <dd>{canReplayUserRoute ? `${userRouteReplayPoints.length} snapped points` : "Unavailable"}</dd>
                  </div>
                  <div className="rounded-md border border-sky-100 bg-white/80 p-3">
                    <dt className="font-semibold">Shortest route</dt>
                    <dd>{canReplayShortestRoute ? `${shortestRouteReplayPoints.length} route points` : "Unavailable"}</dd>
                  </div>
                  <div className="rounded-md border border-sky-100 bg-white/80 p-3">
                    <dt className="font-semibold">Duration</dt>
                    <dd>{routeReplayDurationMs > 0 ? `${(routeReplayDurationMs / 1000).toFixed(1)}s` : "n/a"}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            <div className={`mt-4 rounded-lg border p-4 text-sm ${reviewStateClass(drawnAttemptReview.status)}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Route attempt review</p>
                  <h3 className="mt-1 text-base font-semibold">{drawnAttemptReview.title}</h3>
                  <p className="mt-1 font-mono text-[11px] leading-5 opacity-75">
                    {formatRouteAttemptVersionSnapshot(drawnAttemptReview.versionSnapshot).compactLabel}
                  </p>
                </div>
                <span className="rounded-full border border-current/20 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {drawnAttemptReview.status}
                </span>
              </div>

              {attemptSaveStatus.state !== "idle" ? (
                <div className={`mt-3 rounded-md border p-3 text-xs leading-5 ${saveStatusClass(attemptSaveStatus.state)}`}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold">
                      {attemptSaveStatus.state === "saving"
                        ? "Saving attempt"
                        : attemptSaveStatus.state === "saved"
                          ? "Saved"
                          : "Save warning"}
                    </p>
                    {attemptSaveStatus.id ? <span className="font-mono opacity-75">{attemptSaveStatus.id}</span> : null}
                  </div>
                  {attemptSaveStatus.message ? <p className="mt-1">{attemptSaveStatus.message}</p> : null}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-current/10 bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Score</p>
                  <p className="mt-1 font-semibold">{drawnAttemptReview.scoreLabel}</p>
                </div>
                {drawnAttemptReview.distanceMetrics.length > 0 ? (
                  drawnAttemptReview.distanceMetrics.map((metric) => (
                    <div key={metric.id} className="rounded-md border border-current/10 bg-white/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{metric.label}</p>
                      <p className="mt-1 font-semibold">{metric.value}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-current/10 bg-white/70 p-3 sm:col-span-2 lg:col-span-3">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Distance</p>
                    <p className="mt-1 leading-5">{drawnAttemptReview.distanceLabel}</p>
                  </div>
                )}
              </div>

              {visibleDrawnExerciseResult ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-current/10 bg-white/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Grade</p>
                    <p className="mt-1 font-semibold">{visibleDrawnExerciseResult.score.gradeLabel}</p>
                  </div>
                  <div className="rounded-md border border-current/10 bg-white/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Scoring note</p>
                    <p className="mt-1 leading-5">{visibleDrawnExerciseResult.score.scoringExplanation}</p>
                  </div>
                </div>
              ) : null}

              {visibleDrawnExerciseResult?.score.legBreakdown.length ? (
                <div className="mt-3 rounded-md border border-current/10 bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Per-leg breakdown</p>
                  <ol className="mt-2 grid gap-2 text-xs leading-5 md:grid-cols-2 xl:grid-cols-3">
                    {visibleDrawnExerciseResult.score.legBreakdown.map((leg) => (
                      <li
                        key={`${leg.legIndex}-${leg.fromNodeId}-${leg.toNodeId}`}
                        className="rounded border border-current/10 bg-white/80 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">
                            Leg {leg.legIndex + 1}: {nodeLabel(leg.fromNodeId, activeMap)} to{" "}
                            {nodeLabel(leg.toNodeId, activeMap)}
                          </p>
                          <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase">
                            {legStatusLabel(leg)}
                          </span>
                        </div>
                        <dl className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <dt className="opacity-70">Score</dt>
                            <dd className="font-semibold">{leg.scorePercent.toFixed(1)}%</dd>
                          </div>
                          <div>
                            <dt className="opacity-70">Extra</dt>
                            <dd className="font-semibold">{formatDistance(leg.extraDistanceMeters)}</dd>
                          </div>
                          <div>
                            <dt className="opacity-70">Your route</dt>
                            <dd className="font-semibold">{formatDistance(leg.userRouteDistanceMeters)}</dd>
                          </div>
                          <div>
                            <dt className="opacity-70">Shortest</dt>
                            <dd className="font-semibold">{formatDistance(leg.shortestLegalRouteDistanceMeters)}</dd>
                          </div>
                        </dl>
                        <p className="mt-2 text-[11px] opacity-80">Issues: {legIssueSummary(leg)}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {drawnAttemptReview.suggestedFailureReason ? (
                <div className="mt-3 rounded-md border border-current/10 bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Suggested reason</p>
                  <p className="mt-1 leading-5">{drawnAttemptReview.suggestedFailureReason}</p>
                </div>
              ) : null}

              {drawnAttemptReview.correctionHints.length > 0 ? (
                <div className="mt-3 rounded-md border border-current/10 bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Try next</p>
                  <ul className="mt-2 space-y-2 text-xs leading-5">
                    {drawnAttemptReview.correctionHints.map((hint, index) => (
                      <li key={`${index}-${hint}`} className="flex gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current/20 text-[10px] font-semibold">
                          {index + 1}
                        </span>
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {drawnAttemptReview.status !== "pending" ? (
                <div className="mt-3 rounded-md border border-current/10 bg-white/70 p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Recommended next practice</p>
                    <span className="text-xs font-semibold opacity-75">
                      {drawnAttemptReview.recommendedPracticeQueue.length} focus area
                      {drawnAttemptReview.recommendedPracticeQueue.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {drawnAttemptReview.recommendedPracticeQueue.length > 0 ? (
                    <ul className="mt-3 grid gap-2 lg:grid-cols-2">
                      {drawnAttemptReview.recommendedPracticeQueue.map((recommendation) => (
                        <li key={recommendation.id} className="rounded-md border border-current/10 bg-white/80 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold">{recommendation.title}</p>
                            <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                              {recommendation.priority}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5">{recommendation.reason}</p>
                          <dl className="mt-2 grid gap-2 text-xs leading-5 sm:grid-cols-2">
                            <div>
                              <dt className="font-semibold">Weakness</dt>
                              <dd>{recommendation.weaknessType.replaceAll("-", " ")}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold">Suggested exercise</dt>
                              <dd>{recommendation.suggestedExerciseId ?? "Coming soon"}</dd>
                            </div>
                          </dl>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 rounded-md border border-current/10 bg-white/80 p-3 text-xs leading-5">
                      Great work - no targeted practice needed from this attempt.
                    </p>
                  )}
                </div>
              ) : null}

              <div className="mt-3 rounded-md border border-current/10 bg-white/70 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Adaptive practice launcher</p>
                    <h4 className="mt-1 text-sm font-semibold">{adaptivePracticeQueue.summary.primaryFocus}</h4>
                    <p className="mt-1 text-xs leading-5">{adaptivePracticeQueue.summary.reason}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <span className="rounded-full border border-current/20 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                      {adaptivePracticeQueue.summary.confidenceLevel} confidence
                    </span>
                    <button
                      type="button"
                      onClick={resetAdaptivePracticeLauncher}
                      className="rounded-md border border-current/20 px-3 py-1 text-xs font-semibold"
                    >
                      Reset launcher
                    </button>
                  </div>
                </div>

                {adaptiveLauncherMessage ? (
                  <p className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-950">
                    {adaptiveLauncherMessage}
                  </p>
                ) : null}

                <dl className="mt-3 grid gap-2 text-xs leading-5 sm:grid-cols-2 lg:grid-cols-6">
                  <div className="rounded-md border border-current/10 bg-white/80 p-3">
                    <dt className="font-semibold">Latest review</dt>
                    <dd>{adaptivePracticeQueue.signals.latestAttemptUsed ? "Used" : "Not ready"}</dd>
                  </div>
                  <div className="rounded-md border border-current/10 bg-white/80 p-3">
                    <dt className="font-semibold">Weak profile</dt>
                    <dd>{adaptivePracticeQueue.signals.weakAreaProfileUsed ? "Used" : "No repeated signals"}</dd>
                  </div>
                  <div className="rounded-md border border-current/10 bg-white/80 p-3">
                    <dt className="font-semibold">Attempt trend</dt>
                    <dd>{adaptivePracticeQueue.signals.attemptHistoryUsed ? attemptHistoryInsights.trend : "No attempts"}</dd>
                  </div>
                  <div className="rounded-md border border-current/10 bg-white/80 p-3">
                    <dt className="font-semibold">Saved attempts</dt>
                    <dd>{adaptivePracticeQueue.signals.savedAttemptsUsed ? "Used" : "No saved data"}</dd>
                  </div>
                  <div className="rounded-md border border-current/10 bg-white/80 p-3">
                    <dt className="font-semibold">Outcomes</dt>
                    <dd>{adaptivePracticeQueue.signals.outcomeFeedbackUsed ? "Used" : "No feedback yet"}</dd>
                  </div>
                  <div className="rounded-md border border-current/10 bg-white/80 p-3">
                    <dt className="font-semibold">Exercises</dt>
                    <dd>{adaptivePracticeQueue.signals.availableExerciseCount} available</dd>
                  </div>
                </dl>

                <div className="mt-3 rounded-md border border-current/10 bg-white/70 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Adaptive outcome feedback</p>
                      <p className="mt-1 text-xs leading-5">
                        Outcome feedback is created when you mark an active launcher item complete.
                      </p>
                    </div>
                    {latestAdaptiveOutcomeFeedback ? (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${adaptiveOutcomeClass(
                          latestAdaptiveOutcomeFeedback.outcome
                        )}`}
                      >
                        {latestAdaptiveOutcomeFeedback.outcome}
                      </span>
                    ) : null}
                  </div>

                  {latestAdaptiveOutcomeFeedback ? (
                    <div className="mt-3 rounded-md border border-current/10 bg-white/85 p-3 text-xs leading-5">
                      <p className="font-semibold">
                        {latestAdaptiveOutcomePracticeItem?.title ?? latestAdaptiveOutcomeFeedback.practiceItemId}
                      </p>
                      <p className="mt-1 opacity-75">Completed at {latestAdaptiveOutcomeFeedback.completedAt}</p>
                      <p className="mt-1">{latestAdaptiveOutcomeFeedback.summary}</p>
                      <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                          <dt className="font-semibold">Score</dt>
                          <dd>
                            {latestAdaptiveOutcomeFeedback.evidence.scorePercent === null
                              ? "n/a"
                              : `${latestAdaptiveOutcomeFeedback.evidence.scorePercent.toFixed(1)}%`}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Pass/fail</dt>
                          <dd>
                            {latestAdaptiveOutcomeFeedback.evidence.passed === null
                              ? "n/a"
                              : latestAdaptiveOutcomeFeedback.evidence.passed
                                ? "Pass"
                                : "Fail"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Illegal movements</dt>
                          <dd>{latestAdaptiveOutcomeFeedback.evidence.illegalMovementCount}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Missed restrictions</dt>
                          <dd>{latestAdaptiveOutcomeFeedback.evidence.missedRestrictionCount}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Extra distance</dt>
                          <dd>{latestAdaptiveOutcomeFeedback.evidence.extraDistance}</dd>
                        </div>
                      </dl>
                      <p className="mt-3">
                        <span className="font-semibold">Related weak areas: </span>
                        {latestAdaptiveOutcomeFeedback.evidence.strongestWeaknessCategories.length > 0
                          ? latestAdaptiveOutcomeFeedback.evidence.strongestWeaknessCategories
                              .map((weakness) => weakness.replaceAll("-", " "))
                              .join(", ")
                          : "None"}
                      </p>
                      <p className="mt-2">
                        <span className="font-semibold">Recommended next action: </span>
                        {latestAdaptiveOutcomeFeedback.recommendedNextAction}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 rounded-md border border-current/10 bg-white/80 p-3 text-xs leading-5">
                      No adaptive outcome has been recorded yet. Start a recommendation, complete an attempt, then mark
                      the item complete.
                    </p>
                  )}
                </div>

                <div className="mt-3 space-y-3">
                  <div className="rounded-md border border-current/10 bg-white/70 p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Active practice</p>
                      <span className="text-xs font-semibold opacity-70">
                        {adaptiveLauncherState.practiceSessionStartedAt ?? "No session started"}
                      </span>
                    </div>
                    {activeAdaptivePracticeItem ? (
                      <ol className="mt-3 space-y-2">
                        {renderAdaptivePracticeLauncherItem(activeAdaptivePracticeItem, "Active recommendation")}
                      </ol>
                    ) : (
                      <p className="mt-3 rounded-md border border-current/10 bg-white/80 p-3 text-xs leading-5">
                        Start a recommendation below to create a focused practice session.
                      </p>
                    )}
                  </div>

                  <div className="rounded-md border border-current/10 bg-white/70 p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Recommended next</p>
                      <span className="text-xs font-semibold opacity-70">
                        {compactAdaptiveRecommendationDisplay.rows.length} recommendation
                        {compactAdaptiveRecommendationDisplay.rows.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {compactAdaptiveRecommendationDisplay.rows.length > 0 ? (
                      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
                        <ol className="overflow-hidden rounded-md border border-current/10 bg-white/85">
                          {compactAdaptiveRecommendationDisplay.rows.map((row) => (
                            <li key={row.id} className="border-b border-current/10 last:border-b-0">
                              <button
                                type="button"
                                onClick={() => setSelectedAdaptiveRecommendationId(row.id)}
                                className={`flex w-full flex-col gap-2 px-3 py-2 text-left transition hover:bg-slate-50 ${
                                  row.isSelected ? "bg-blue-50/80 ring-1 ring-inset ring-blue-200" : "bg-white"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/20 bg-white text-[11px] font-semibold">
                                    {row.number}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{row.title}</p>
                                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 opacity-75">{row.summary}</p>
                                    <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wide opacity-60">
                                      Linked: {row.linkedExerciseLabel}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pl-9">
                                  <span className="rounded-full border border-current/15 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                    {row.weakAreaLabel}
                                  </span>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${adaptivePriorityClass(
                                      row.priority
                                    )}`}
                                  >
                                    {row.priority}
                                  </span>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${adaptiveLauncherStatusClass(
                                      row.status
                                    )}`}
                                  >
                                    {adaptiveLauncherStatusLabel(row.status)}
                                  </span>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${adaptiveDifficultyClass(
                                      row.difficulty
                                    )}`}
                                  >
                                    {row.difficulty ?? "difficulty tbc"}
                                  </span>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ol>

                        {compactAdaptiveRecommendationDisplay.detail && compactAdaptiveRecommendationDisplay.selectedItem ? (
                          <div className="rounded-md border border-current/10 bg-white/90 p-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
                                  Selected recommendation
                                </p>
                                <h5 className="mt-1 text-sm font-semibold">
                                  {compactAdaptiveRecommendationDisplay.detail.title}
                                </h5>
                                <p className="mt-1 text-xs leading-5 opacity-80">
                                  {compactAdaptiveRecommendationDisplay.detail.explanation}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${adaptivePriorityClass(
                                    compactAdaptiveRecommendationDisplay.detail.priority
                                  )}`}
                                >
                                  {compactAdaptiveRecommendationDisplay.detail.priority} -{" "}
                                  {compactAdaptiveRecommendationDisplay.detail.score}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${adaptiveLauncherStatusClass(
                                    compactAdaptiveRecommendationDisplay.detail.status
                                  )}`}
                                >
                                  {adaptiveLauncherStatusLabel(compactAdaptiveRecommendationDisplay.detail.status)}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${adaptiveDifficultyClass(
                                    compactAdaptiveRecommendationDisplay.detail.difficulty
                                  )}`}
                                >
                                  {compactAdaptiveRecommendationDisplay.detail.difficulty ?? "difficulty tbc"}
                                </span>
                              </div>
                            </div>

                            <dl className="mt-3 grid gap-2 text-xs leading-5 sm:grid-cols-2">
                              <div>
                                <dt className="font-semibold uppercase tracking-wide opacity-60">Practice focus</dt>
                                <dd>{compactAdaptiveRecommendationDisplay.detail.practiceFocus}</dd>
                              </div>
                              <div>
                                <dt className="font-semibold uppercase tracking-wide opacity-60">Linked exercise</dt>
                                <dd>{compactAdaptiveRecommendationDisplay.detail.linkedExerciseLabel}</dd>
                              </div>
                              <div>
                                <dt className="font-semibold uppercase tracking-wide opacity-60">Weak areas</dt>
                                <dd>{compactAdaptiveRecommendationDisplay.detail.weakAreaLabel}</dd>
                              </div>
                              <div>
                                <dt className="font-semibold uppercase tracking-wide opacity-60">Signals</dt>
                                <dd>{compactAdaptiveRecommendationDisplay.detail.signalLabel}</dd>
                              </div>
                            </dl>

                            <div className="mt-3 rounded-md border border-current/10 bg-slate-50/70 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Reasons</p>
                              <ul className="mt-1 list-inside list-disc space-y-1 text-xs leading-5">
                                {compactAdaptiveRecommendationDisplay.detail.reasons.map((reason) => (
                                  <li key={reason}>{reason}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleStartAdaptivePractice(compactAdaptiveRecommendationDisplay.selectedItem!)
                                }
                                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-950"
                              >
                                {compactAdaptiveRecommendationDisplay.detail.status === "active"
                                  ? "Restart practice"
                                  : "Start practice"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSkipAdaptivePractice(compactAdaptiveRecommendationDisplay.detail!.id)}
                                className="rounded-md border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-950"
                              >
                                Skip
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDismissAdaptivePractice(compactAdaptiveRecommendationDisplay.detail!.id)
                                }
                                className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                              >
                                Mark as not useful
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCompleteAdaptivePractice(compactAdaptiveRecommendationDisplay.selectedItem!)
                                }
                                className="rounded-md border border-green-200 px-3 py-1 text-xs font-semibold text-green-950"
                              >
                                Mark completed
                              </button>
                              {compactAdaptiveRecommendationDisplay.detail.status !== "recommended" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUndoAdaptivePracticeStatus(compactAdaptiveRecommendationDisplay.detail!.id)
                                  }
                                  className="rounded-md border border-current/20 px-3 py-1 text-xs font-semibold"
                                >
                                  Undo status
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 rounded-md border border-current/10 bg-white/80 p-3 text-xs leading-5">
                        No new recommendations are waiting. Check skipped or completed items below.
                      </p>
                    )}
                  </div>

                  {skippedAdaptivePracticeItems.length > 0 ? (
                    <div className="rounded-md border border-current/10 bg-white/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Skipped</p>
                      <ol className="mt-3 space-y-2">
                        {skippedAdaptivePracticeItems.map((item, index) =>
                          renderAdaptivePracticeLauncherItem(item, `Skipped item ${index + 1}`)
                        )}
                      </ol>
                    </div>
                  ) : null}

                  {completedAdaptivePracticeItems.length > 0 ? (
                    <div className="rounded-md border border-current/10 bg-white/70 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Completed / dismissed</p>
                        <button
                          type="button"
                          onClick={() => setShowDismissedAdaptiveItems((currentValue) => !currentValue)}
                          className="rounded-md border border-current/20 px-3 py-1 text-xs font-semibold"
                        >
                          {showDismissedAdaptiveItems ? "Hide" : "Show"}
                        </button>
                      </div>
                      {showDismissedAdaptiveItems ? (
                        <ol className="mt-3 space-y-2">
                          {completedAdaptivePracticeItems.map((item, index) =>
                            renderAdaptivePracticeLauncherItem(item, `Closed item ${index + 1}`)
                          )}
                        </ol>
                      ) : (
                        <p className="mt-3 rounded-md border border-current/10 bg-white/80 p-3 text-xs leading-5">
                          {completedAdaptivePracticeItems.length} completed or dismissed item
                          {completedAdaptivePracticeItems.length === 1 ? "" : "s"} hidden.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 rounded-md border border-current/10 bg-white/70 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Weak areas profile</p>
                    <p className="mt-1 text-xs leading-5">
                      {weakAreaProfile.attemptsReviewed} reviewed attempt
                      {weakAreaProfile.attemptsReviewed === 1 ? "" : "s"} - {weakAreaProfile.totalWeaknessCount} tracked
                      weak-area signal{weakAreaProfile.totalWeaknessCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetWeakAreaProfile}
                    className="rounded-md border border-current/20 px-3 py-1 text-xs font-semibold"
                  >
                    Reset profile
                  </button>
                </div>

                {strongestWeakAreas.length > 0 ? (
                  <ul className="mt-3 grid gap-2 lg:grid-cols-2">
                    {strongestWeakAreas.map((weakness) => (
                      <li key={weakness.weaknessType} className="rounded-md border border-current/10 bg-white/80 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold">{weakness.label}</p>
                          <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                            {weakness.priority}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5">
                          Seen {weakness.count} time{weakness.count === 1 ? "" : "s"} - last seen on attempt{" "}
                          {weakness.lastSeenAttemptNumber}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-md border border-current/10 bg-white/80 p-3 text-xs leading-5">
                    No repeated weak areas have been tracked yet.
                  </p>
                )}

                <p className="mt-3 rounded-md border border-current/10 bg-white/80 p-3 text-xs leading-5">
                  <span className="font-semibold">Recommended focus: </span>
                  {weakAreaPracticeFocus}
                </p>
              </div>

              <div className="mt-3 rounded-md border border-current/10 bg-white/70 p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Attempt history</p>
                  <span className="text-xs font-semibold opacity-75">
                    {attemptHistory.items.length} saved attempt
                    {attemptHistory.items.length === 1 ? "" : "s"}
                  </span>
                </div>

                {attemptHistory.items.length > 0 ? (
                  <>
                    <ul className="mt-3 space-y-2">
                      {attemptHistory.items.map((item) => {
                        const isSelected = item.attemptNumber === selectedHistoryItem?.attemptNumber;

                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => selectHistoryAttempt(item.attemptNumber)}
                              className={`w-full rounded-md border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                isSelected ? "border-blue-300 bg-blue-50" : "border-current/10 bg-white/80 hover:bg-white"
                              }`}
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-semibold">Attempt {item.attemptNumber}</p>
                                  <p className="mt-1 text-xs leading-5 opacity-80">{item.title}</p>
                                </div>
                                <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                  {item.status}
                                </span>
                              </div>
                              <dl className="mt-3 grid gap-2 text-xs leading-5 sm:grid-cols-2 lg:grid-cols-6">
                                <div>
                                  <dt className="font-semibold">Score</dt>
                                  <dd>{item.scoreLabel}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold">Your route</dt>
                                  <dd>{item.studentRouteDistanceLabel}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold">Extra</dt>
                                  <dd>{item.extraDistanceLabel}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold">Illegal</dt>
                                  <dd>{item.illegalMovementCount}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold">Missed</dt>
                                  <dd>{item.missedRestrictionCount}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold">Reason</dt>
                                  <dd>{item.primaryFailureReason ?? "None"}</dd>
                                </div>
                              </dl>
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    {selectedHistoryItem ? (
                      <div className="mt-3 rounded-md border border-current/10 bg-white/80 p-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-semibold">Selected attempt {selectedHistoryItem.attemptNumber}</p>
                          <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                            {selectedHistoryItem.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5">{selectedHistoryItem.review.distanceLabel}</p>
                        <p className="mt-2 font-mono text-[11px] leading-5 opacity-75">
                          {formatRouteAttemptVersionSnapshot(selectedHistoryItem.versionSnapshot).compactLabel}
                        </p>
                        {selectedHistoryItem.primaryFailureReason ? (
                          <p className="mt-2 text-xs leading-5">
                            <span className="font-semibold">Saved reason: </span>
                            {selectedHistoryItem.primaryFailureReason}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs leading-5">Saved summary: clean attempt with no primary failure reason.</p>
                        )}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-3 rounded-md border border-current/10 bg-white/80 p-3 text-xs leading-5">
                    Submit a drawn route to compare attempts in this session.
                  </p>
                )}
              </div>

              <div className="mt-3 rounded-md border border-current/10 bg-white/70 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Saved attempt history</p>
                    <p className="mt-1 text-xs leading-5">
                      Supabase-backed route attempt reviews ordered newest first.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshSavedAttemptHistory}
                    className="rounded-md border border-current/20 px-3 py-1 text-xs font-semibold"
                  >
                    Refresh
                  </button>
                </div>

                {savedAttemptHistory.state === "loading" ? (
                  <p className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-950">
                    Loading saved attempts...
                  </p>
                ) : null}

                {savedAttemptHistory.state === "error" ? (
                  <p className="mt-3 rounded-md border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
                    {savedAttemptHistory.message ?? "Saved attempts could not be loaded."}
                  </p>
                ) : null}

                {savedAttemptHistory.state === "loaded" && savedAttemptHistory.message ? (
                  <p className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                    {savedAttemptHistory.message}
                  </p>
                ) : null}

                {savedAttemptHistory.state === "loaded" && savedAttemptReviewList.isEmpty ? (
                  <p className="mt-3 rounded-md border border-current/10 bg-white/80 p-3 text-xs leading-5">
                    {savedAttemptReviewList.emptyMessage}
                  </p>
                ) : null}

                {savedAttemptHistory.state === "loaded" ? (
                  <div className="mt-3 rounded-md border border-current/10 bg-white/80 p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Weak-area analytics</p>
                        <p className="mt-1 text-xs leading-5">
                          {savedWeakAreaAnalytics.analysedAttempts} saved attempt
                          {savedWeakAreaAnalytics.analysedAttempts === 1 ? "" : "s"} analysed.{" "}
                          {savedWeakAreaAnalytics.trendMessage}
                        </p>
                      </div>
                      <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        {savedWeakAreaAnalytics.trend.replaceAll("_", " ")}
                      </span>
                    </div>

                    {savedWeakAreaAnalytics.emptyMessage ? (
                      <p className="mt-3 rounded-md border border-current/10 bg-white p-3 text-xs leading-5">
                        {savedWeakAreaAnalytics.emptyMessage}
                      </p>
                    ) : (
                      <ul className="mt-3 grid gap-2 lg:grid-cols-2">
                        {savedWeakAreaAnalytics.topWeakAreas.map((weakArea) => (
                          <li key={weakArea.id} className="rounded-md border border-current/10 bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold">{weakArea.title}</p>
                                <p className="mt-1 text-xs leading-5">{weakArea.message}</p>
                              </div>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${weakAreaAnalyticsPriorityClass(
                                  weakArea.priority
                                )}`}
                              >
                                {weakArea.priority}
                              </span>
                            </div>
                            <dl className="mt-3 grid gap-2 text-xs leading-5 sm:grid-cols-3">
                              <div>
                                <dt className="font-semibold">Frequency</dt>
                                <dd>
                                  {weakArea.count} attempt{weakArea.count === 1 ? "" : "s"}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-semibold">Recent</dt>
                                <dd>
                                  {weakArea.recentCount} of {savedWeakAreaAnalytics.recentAttemptCount}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-semibold">Last seen</dt>
                                <dd>{weakAreaLastSeenLabel(weakArea.lastSeenAt)}</dd>
                              </div>
                            </dl>
                            <p className="mt-2 text-xs leading-5">
                              <span className="font-semibold">Try next: </span>
                              {weakArea.practiceFocus}
                            </p>
                            {weakArea.relatedRoadIds.length > 0 || weakArea.relatedJunctionNodeIds.length > 0 ? (
                              <p className="mt-2 text-xs leading-5 opacity-75">
                                {weakArea.relatedRoadIds.length > 0 ? `Roads: ${weakArea.relatedRoadIds.join(", ")}` : ""}
                                {weakArea.relatedRoadIds.length > 0 && weakArea.relatedJunctionNodeIds.length > 0 ? " - " : ""}
                                {weakArea.relatedJunctionNodeIds.length > 0
                                  ? `Junctions: ${weakArea.relatedJunctionNodeIds.join(", ")}`
                                  : ""}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}

                {savedAttemptReviewList.attempts.length > 0 ? (
                  <>
                    <ul className="mt-3 space-y-2">
                      {savedAttemptReviewList.attempts.map((attempt) => {
                        const isSelected = attempt.id === savedAttemptHistory.selectedAttemptId;

                        return (
                          <li key={attempt.id}>
                            <button
                              type="button"
                              onClick={() => selectSavedAttempt(attempt.id)}
                              className={`w-full rounded-md border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                isSelected ? "border-blue-300 bg-blue-50" : "border-current/10 bg-white/80 hover:bg-white"
                              }`}
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="font-semibold">{attempt.exerciseLabel}</p>
                                <p className="mt-1 text-xs leading-5 opacity-80">
                                  {attempt.dateLabel}
                                  {attempt.exerciseLabel !== attempt.exerciseId ? (
                                    <span className="font-mono"> - {attempt.exerciseId}</span>
                                  ) : null}
                                </p>
                                <p className="mt-1 font-mono text-[11px] leading-5 opacity-70">
                                  {attempt.versionLabel}
                                </p>
                              </div>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${savedAttemptStatusClass(
                                    attempt.statusLabel
                                  )}`}
                                >
                                  {attempt.statusLabel}
                                </span>
                              </div>
                              <dl className="mt-3 grid gap-2 text-xs leading-5 sm:grid-cols-6">
                                <div>
                                  <dt className="font-semibold">Score</dt>
                                  <dd>{attempt.scoreLabel}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold">Legal state</dt>
                                  <dd>{attempt.legalLabel}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold">Your route</dt>
                                  <dd>{attempt.userDistanceLabel}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold">Shortest</dt>
                                  <dd>{attempt.shortestDistanceLabel}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold">Failure reason</dt>
                                  <dd>{attempt.failureReason}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold">Review</dt>
                                  <dd>{isSelected ? "Showing details" : "Select to review"}</dd>
                                </div>
                              </dl>
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    {selectedSavedAttemptReview ? (
                      <div className="mt-3 rounded-md border border-current/10 bg-white/80 p-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold">{selectedSavedAttemptReview.title}</p>
                            <p className="mt-1 text-xs leading-5">
                              {selectedSavedAttemptReview.subtitle}
                            </p>
                            <p className="mt-1 font-mono text-[11px] leading-5 opacity-70">
                              {selectedSavedAttemptReview.versionLabel}
                            </p>
                          </div>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${savedAttemptStatusClass(
                              selectedSavedAttemptReview.statusLabel
                            )}`}
                          >
                            {selectedSavedAttemptReview.statusLabel}
                          </span>
                        </div>

                        {selectedSavedAttemptReview.exerciseDataWarning ? (
                          <p className="mt-3 rounded-md border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
                            {selectedSavedAttemptReview.exerciseDataWarning}
                          </p>
                        ) : null}

                        <dl className="mt-3 grid gap-2 text-xs leading-5 sm:grid-cols-5">
                          <div>
                            <dt className="font-semibold">Score</dt>
                            <dd>{selectedSavedAttemptReview.scoreLabel}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">Legal state</dt>
                            <dd>{selectedSavedAttemptReview.legalLabel}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">Your route</dt>
                            <dd>{selectedSavedAttemptReview.userRouteSummary}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">Shortest route</dt>
                            <dd>{selectedSavedAttemptReview.shortestRouteSummary}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold">Failure reason</dt>
                            <dd>{selectedSavedAttemptReview.failureReason}</dd>
                          </div>
                        </dl>

                        <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-950">
                          <p className="font-semibold">Score explanation</p>
                          <p className="mt-1">{selectedSavedAttemptReview.scoreExplanation}</p>
                        </div>

                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Violations</p>
                            {selectedSavedAttemptReview.violations.length > 0 ? (
                              <ul className="mt-2 space-y-2">
                                {selectedSavedAttemptReview.violations.map((item) => (
                                  <li key={item.id} className={`rounded-md border p-3 text-xs leading-5 ${reviewItemClass(item.severity)}`}>
                                    <p className="font-semibold">{item.label}</p>
                                    {item.detail ? <p className="mt-1">{item.detail}</p> : null}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 rounded-md border border-current/10 bg-white/70 p-3 text-xs leading-5">
                                No saved violations were recorded.
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Missed restrictions</p>
                            {selectedSavedAttemptReview.missedRestrictions.length > 0 ? (
                              <ul className="mt-2 space-y-2">
                                {selectedSavedAttemptReview.missedRestrictions.map((item) => (
                                  <li key={item.id} className={`rounded-md border p-3 text-xs leading-5 ${reviewItemClass(item.severity)}`}>
                                    <p className="font-semibold">{item.label}</p>
                                    {item.detail ? <p className="mt-1">{item.detail}</p> : null}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 rounded-md border border-current/10 bg-white/70 p-3 text-xs leading-5">
                                No missed restrictions were recorded.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 rounded-md border border-current/10 bg-white/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Saved route summary</p>
                          <p className="mt-2 text-xs leading-5">{selectedSavedAttemptReview.matchedRouteSummary}</p>
                          <p className="mt-1 text-xs leading-5">
                            Visual replay is not available yet, so this review uses the compact saved route IDs and review payload.
                          </p>
                        </div>

                        {selectedSavedAttemptReview.legBreakdown.length > 0 ? (
                          <div className="mt-3 rounded-md border border-current/10 bg-white/70 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Per-leg breakdown</p>
                            <ul className="mt-2 grid gap-2 lg:grid-cols-2">
                              {selectedSavedAttemptReview.legBreakdown.map((leg) => (
                                <li key={leg.id} className="rounded-md border border-current/10 bg-white p-3 text-xs leading-5">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="font-semibold">{leg.label}</p>
                                    <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                      {leg.statusLabel}
                                    </span>
                                  </div>
                                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                                    <div>
                                      <dt className="font-semibold">Score</dt>
                                      <dd>{leg.scoreLabel}</dd>
                                    </div>
                                    <div>
                                      <dt className="font-semibold">Extra distance</dt>
                                      <dd>{leg.extraDistanceLabel}</dd>
                                    </div>
                                    <div>
                                      <dt className="font-semibold">Your route</dt>
                                      <dd>{leg.userDistanceLabel}</dd>
                                    </div>
                                    <div>
                                      <dt className="font-semibold">Shortest</dt>
                                      <dd>{leg.shortestDistanceLabel}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <dt className="font-semibold">Issues</dt>
                                      <dd>{leg.issueLabel}</dd>
                                    </div>
                                  </dl>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <details className="mt-3 rounded-md border border-current/10 bg-white/70 p-3 text-xs leading-5">
                          <summary className="cursor-pointer font-semibold">Raw saved review payload</summary>
                          <pre className="mt-3 max-h-64 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-50">
                            {JSON.stringify(selectedSavedAttemptReview.rawReviewPayload, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold">Illegal movements</h4>
                  {drawnAttemptReview.illegalMovements.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {drawnAttemptReview.illegalMovements.map((item) => {
                        const isFocused = selectedRestrictionReviewItemId === item.id;
                        const hasMapTarget = Boolean(
                          resolveRestrictionFocusTarget({
                            reviewItem: item,
                            visualItems: restrictionMapVisualItems
                          })
                        );

                        return (
                          <li key={item.id} className={`rounded-md border p-3 ${reviewItemClass(item.severity)}`}>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <p className="font-semibold">{item.label}</p>
                              <button
                                type="button"
                                onClick={() => toggleRestrictionReviewFocus(item)}
                                disabled={!hasMapTarget}
                                className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                                  isFocused
                                    ? "border-sky-300 bg-sky-50 text-sky-950"
                                    : hasMapTarget
                                      ? "border-red-200 bg-white text-red-900 hover:bg-red-50"
                                      : "border-slate-200 bg-slate-50 text-slate-400"
                                }`}
                              >
                                {isFocused ? "Hide map focus" : "Show on map"}
                              </button>
                            </div>
                            {item.detail ? <p className="mt-1 text-xs leading-5">{item.detail}</p> : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 rounded-md border border-current/10 bg-white/70 p-3 text-xs leading-5">
                      No illegal movement was reported for this attempt.
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold">Missed restrictions</h4>
                  {drawnAttemptReview.missedRestrictions.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {drawnAttemptReview.missedRestrictions.map((item) => {
                        const isFocused = selectedRestrictionReviewItemId === item.id;
                        const hasMapTarget = Boolean(
                          resolveRestrictionFocusTarget({
                            reviewItem: item,
                            visualItems: restrictionMapVisualItems
                          })
                        );

                        return (
                          <li key={item.id} className={`rounded-md border p-3 ${reviewItemClass(item.severity)}`}>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <p className="font-semibold">{item.label}</p>
                              <button
                                type="button"
                                onClick={() => toggleRestrictionReviewFocus(item)}
                                disabled={!hasMapTarget}
                                className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                                  isFocused
                                    ? "border-sky-300 bg-sky-50 text-sky-950"
                                    : hasMapTarget
                                      ? "border-amber-200 bg-white text-amber-900 hover:bg-amber-50"
                                      : "border-slate-200 bg-slate-50 text-slate-400"
                                }`}
                              >
                                {isFocused ? "Hide map focus" : "Show on map"}
                              </button>
                            </div>
                            {item.detail ? <p className="mt-1 text-xs leading-5">{item.detail}</p> : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 rounded-md border border-current/10 bg-white/70 p-3 text-xs leading-5">
                      No missed checkpoint, route requirement, or restriction issue is listed.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {routeIssueOverlays.length > 0 ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-950">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-semibold">Route issue overlay</h3>
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {routeIssueOverlays.length} visible marker{routeIssueOverlays.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5">
                  The highlighted red marker on the map points to the failed movement, illegal section, or disconnected
                  transition reported by the existing pipeline diagnostics.
                </p>
                <ul className="mt-3 space-y-2">
                  {routeIssueOverlays.map((overlay, index) => (
                    <li
                      key={`${overlay.kind}-${overlay.roadIds.join("-")}-${overlay.movementIndex ?? index}`}
                      className="rounded-md border border-red-100 bg-white p-3"
                    >
                      <p className="font-semibold">
                        {overlay.label}
                        {overlay.roadIds.length > 0 ? ` (${overlay.roadIds.join(" -> ")})` : ""}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-red-900">{overlay.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Simplified points</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {drawnPipelineResult.simplifiedTrace.points.length}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Snapped points</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{drawnPipelineResult.snappedPoints.length}</p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {hasUsableDrawnMatch ? "Matched roads" : "Road candidates"}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {drawnPipelineResult.matchResult?.orderedRoadIds.length ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{scoreSummary(visibleDrawnExerciseResult)}</p>
              </div>
            </div>

            {visibleDrawnExerciseResult ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-950">Drawn route score summary</h3>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-5">
                  <div className="rounded-md border border-slate-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {visibleDrawnExerciseResult.score.passed ? "Pass" : "Fail"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {visibleDrawnExerciseResult.score.gradeLabel}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {visibleDrawnExerciseResult.score.scorePercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shortest legal</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {formatDistance(visibleDrawnExerciseResult.score.shortestLegalRouteDistanceMeters)}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User route</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {formatDistance(visibleDrawnExerciseResult.score.userRouteDistanceMeters)}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Extra distance</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">{formatDistance(drawnExtraDistanceMeters)}</p>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm text-slate-700 lg:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scoring note</dt>
                    <dd className="mt-1">{visibleDrawnExerciseResult.score.scoringExplanation}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Failure reasons</dt>
                    <dd className="mt-1">
                      {visibleDrawnExerciseResult.score.failureReasons.length > 0
                        ? visibleDrawnExerciseResult.score.failureReasons.join(", ")
                        : "None"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Illegal movements</dt>
                    <dd className="mt-1">
                      {visibleDrawnExerciseResult.score.legality.illegalMovements.length > 0
                        ? visibleDrawnExerciseResult.score.legality.illegalMovements
                            .map((movement) => `${movement.type} on ${movement.roadId}`)
                            .join(", ")
                        : "None"}
                    </dd>
                  </div>
                </dl>

                {visibleDrawnExerciseResult.score.legBreakdown.length > 0 ? (
                  <div className="mt-4 rounded-md border border-slate-100 bg-white p-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Per-leg breakdown</h4>
                    <ol className="mt-3 grid gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-3">
                      {visibleDrawnExerciseResult.score.legBreakdown.map((leg) => (
                        <li
                          key={`${leg.legIndex}-${leg.fromNodeId}-${leg.toNodeId}`}
                          className="rounded-md border border-slate-100 bg-slate-50 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-950">
                              Leg {leg.legIndex + 1}: {nodeLabel(leg.fromNodeId, activeMap)} to{" "}
                              {nodeLabel(leg.toNodeId, activeMap)}
                            </p>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase">
                              {legStatusLabel(leg)}
                            </span>
                          </div>
                          <p className="mt-2">
                            Score {leg.scorePercent.toFixed(1)}% | Your route{" "}
                            {formatDistance(leg.userRouteDistanceMeters)} | Shortest{" "}
                            {formatDistance(leg.shortestLegalRouteDistanceMeters)} | Extra{" "}
                            {formatDistance(leg.extraDistanceMeters)}
                          </p>
                          <p className="mt-1">Issues: {legIssueSummary(leg)}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            ) : null}

            {requiredStopStatuses.length > 0 ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-950">Required stop progress</h3>
                <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  {requiredStopStatuses.map((stop) => (
                    <li
                      key={`${stop.order}-${stop.nodeId}`}
                      className={`rounded-md border p-3 ${stopVisitClass(stop.visited)}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide">
                        {stop.role} {stop.order}
                      </p>
                      <p className="mt-1 font-semibold">{nodeLabel(stop.nodeId, activeMap)}</p>
                      <p className="mt-1 text-xs">
                        {stop.visited
                          ? `Visited${typeof stop.visitedIndex === "number" ? ` at position ${stop.visitedIndex + 1}` : ""}`
                          : "Missing or out of order"}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <dl className="mt-4 grid gap-3 text-sm text-slate-700 lg:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {hasUsableDrawnMatch ? "Matched road IDs" : "Road candidate IDs"}
                </dt>
                <dd className="mt-1 font-mono text-xs">
                  {idList(drawnPipelineResult.matchResult?.orderedRoadIds ?? [])}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {hasUsableDrawnMatch ? "Matched node IDs" : "Node sequence IDs"}
                </dt>
                <dd className="mt-1 font-mono text-xs">{idList(drawnPipelineResult.matchResult?.nodeIds ?? [])}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Directed edge IDs</dt>
                <dd className="mt-1 font-mono text-xs">
                  {nullableIdList(drawnPipelineResult.matchResult?.directedEdgeSequence ?? [])}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline warnings</dt>
                <dd className="mt-1">
                  {drawnPipelineResult.warnings.length > 0
                    ? drawnPipelineResult.warnings
                        .map((warning) => `${warning.source}:${warning.code}`)
                        .join(", ")
                    : "None"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Drawn result</dt>
                <dd className="mt-1">
                  {visibleDrawnExerciseResult ? resultSummary(visibleDrawnExerciseResult) : "Not scored"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Extra distance</dt>
                <dd className="mt-1">{formatDistance(drawnExtraDistanceMeters)}</dd>
              </div>
            </dl>

            {pipelineIssueGroups.length > 0 ? (
              <div className="mt-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-950">Warnings and scoring notes</h3>
                {pipelineIssueGroups.map((group) => (
                  <div
                    key={group.label}
                    className={`rounded-md border p-3 text-sm ${warningSeverityClass(
                      group.label === "Exercise / scoring" ? "error" : "warning"
                    )}`}
                  >
                    <p className="font-semibold">{group.label}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {group.messages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-green-100 bg-green-50 p-3 text-sm text-green-900">
                No pipeline warnings for the current drawn attempt.
              </div>
            )}

            {visibleDrawnExerciseResult ? (
              <>
                <h3 className="mt-5 text-sm font-semibold text-slate-950">Drawn route score result</h3>
                <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                  {JSON.stringify(visibleDrawnExerciseResult.score, null, 2)}
                </pre>
              </>
            ) : null}

            <h3 className="mt-5 text-sm font-semibold text-slate-950">Pipeline debug result</h3>
            <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
              {JSON.stringify(visibleDrawnPipelineResult, null, 2)}
            </pre>
          </section>

          {error ? (
            <section className="order-4 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
              <h2 className="font-semibold">Runner error</h2>
              <p className="mt-2 font-mono text-xs">{error}</p>
            </section>
          ) : null}

          {result ? (
            <section className="order-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-slate-950">Manual run result</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    result.score.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {resultSummary(result)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-5">
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{result.score.scorePercent.toFixed(1)}%</p>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Grade</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{result.score.gradeLabel}</p>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User distance</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {formatDistance(result.score.userRouteDistanceMeters)}
                  </p>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shortest legal</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {formatDistance(result.score.shortestLegalRouteDistanceMeters)}
                  </p>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Extra distance</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{formatDistance(extraDistanceMeters)}</p>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm text-slate-700 lg:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scoring note</dt>
                  <dd className="mt-1">{result.score.scoringExplanation}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Failure reason</dt>
                  <dd className="mt-1">
                    {result.score.failureReasons.length > 0 ? result.score.failureReasons.join(", ") : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Violations</dt>
                  <dd className="mt-1">
                    {result.score.legality.illegalMovements.length > 0
                      ? result.score.legality.illegalMovements
                          .map((movement) => `${movement.type} on ${movement.roadId}`)
                          .join(", ")
                      : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Normalised nodes</dt>
                  <dd className="mt-1 font-mono text-xs">{result.normalisedAttempt.selectedNodeIds.join(" -> ")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Normalised roads</dt>
                  <dd className="mt-1 font-mono text-xs">{result.normalisedAttempt.selectedRoadIds.join(" -> ")}</dd>
                </div>
              </dl>

              {result.score.legBreakdown.length > 0 ? (
                <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Per-leg breakdown</h3>
                  <ol className="mt-3 grid gap-3 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-3">
                    {result.score.legBreakdown.map((leg) => (
                      <li
                        key={`${leg.legIndex}-${leg.fromNodeId}-${leg.toNodeId}`}
                        className="rounded-md border border-slate-100 bg-white p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-950">
                            Leg {leg.legIndex + 1}: {nodeLabel(leg.fromNodeId, activeMap)} to{" "}
                            {nodeLabel(leg.toNodeId, activeMap)}
                          </p>
                          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase">
                            {legStatusLabel(leg)}
                          </span>
                        </div>
                        <p className="mt-2">
                          Score {leg.scorePercent.toFixed(1)}% | Your route{" "}
                          {formatDistance(leg.userRouteDistanceMeters)} | Shortest{" "}
                          {formatDistance(leg.shortestLegalRouteDistanceMeters)} | Extra{" "}
                          {formatDistance(leg.extraDistanceMeters)}
                        </p>
                        <p className="mt-1">Issues: {legIssueSummary(leg)}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <h3 className="mt-5 text-sm font-semibold text-slate-950">Attempted movements</h3>
              <pre className="mt-2 max-h-52 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(result.normalisedAttempt.movements, null, 2)}
              </pre>

              <h3 className="mt-5 text-sm font-semibold text-slate-950">Normalised attempt</h3>
              <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(result.normalisedAttempt, null, 2)}
              </pre>

              <h3 className="mt-5 text-sm font-semibold text-slate-950">Score result</h3>
              <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(result.score, null, 2)}
              </pre>
            </section>
          ) : (
            <section className="order-5 rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Run a manual node/road route to see the normalised attempt and scoring result.
            </section>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Learning dashboard</p>
            <h2 className="mt-1 text-base font-semibold text-slate-950">Adaptive queue, weak areas, and recent attempts</h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            Dev session only
          </span>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adaptive practice queue</p>
                <h3 className="mt-1 font-semibold text-slate-950">{adaptivePracticeQueue.summary.primaryFocus}</h3>
              </div>
              <span className="rounded-full border border-blue-100 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-800">
                {adaptivePracticeQueue.items.length} item{adaptivePracticeQueue.items.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">{adaptivePracticeQueue.summary.reason}</p>
            {recommendedAdaptivePracticeItems.length > 0 ? (
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-700">
                {recommendedAdaptivePracticeItems.slice(0, 3).map((item) => (
                  <li key={`learning-${item.id}`} className="rounded-md border border-slate-200 bg-white p-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{item.title}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${adaptivePriorityClass(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="mt-1">{item.practiceFocus}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
                No adaptive recommendations are waiting.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weak areas</p>
                <h3 className="mt-1 font-semibold text-slate-950">{weakAreaPracticeFocus}</h3>
              </div>
              <span className="rounded-full border border-amber-100 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                {weakAreaProfile.totalWeaknessCount} signal{weakAreaProfile.totalWeaknessCount === 1 ? "" : "s"}
              </span>
            </div>
            {strongestWeakAreas.length > 0 ? (
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-700">
                {strongestWeakAreas.slice(0, 4).map((weakness) => (
                  <li key={`learning-${weakness.weaknessType}`} className="rounded-md border border-slate-200 bg-white p-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{weakness.label}</span>
                      <span>{weakness.count}x</span>
                    </div>
                    <p className="mt-1">Last seen on attempt {weakness.lastSeenAttemptNumber}.</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
                No repeated weak areas have been tracked yet.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent attempts</p>
                <h3 className="mt-1 font-semibold text-slate-950">Session and saved history</h3>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                {attemptHistory.items.length + savedAttemptHistory.attempts.length} total
              </span>
            </div>
            {attemptHistory.items.length > 0 ? (
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-700">
                {attemptHistory.items.slice(-3).map((item) => (
                  <li key={`learning-${item.id}`} className="rounded-md border border-slate-200 bg-white p-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">Attempt {item.attemptNumber}</span>
                      <span>{item.status}</span>
                    </div>
                    <p className="mt-1">
                      {item.scoreLabel} - {item.extraDistanceLabel}
                    </p>
                  </li>
                ))}
              </ul>
            ) : savedAttemptHistory.attempts.length > 0 ? (
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-700">
                {savedAttemptHistory.attempts.slice(0, 3).map((attempt) => (
                  <li key={`learning-${attempt.id}`} className="rounded-md border border-slate-200 bg-white p-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{attempt.exerciseLabel}</span>
                      <span>{attempt.statusLabel}</span>
                    </div>
                    <p className="mt-1">
                      {attempt.scoreLabel} - {attempt.dateLabel}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
                No route attempts have been submitted in this session yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
