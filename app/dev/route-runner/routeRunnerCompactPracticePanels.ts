import type { RouteExercise } from "../../../lib/map-engine/index.ts";
import { buildRouteExerciseDisplayModel } from "./routeRunnerExerciseDisplay.ts";
import { DEFAULT_ROUTE_RUNNER_MAP_ID } from "./routeRunnerMaps.ts";
import { isRealLondonBetaMapId } from "./routeRunnerRealLondonBetaGate.ts";
import type { RestrictionMapVisualItem } from "./restrictionMapVisuals.ts";

export type RouteRunnerPanelAudience = "dev-qa" | "beta-student";

export type RouteRunnerPanelVisibility = {
  audience: RouteRunnerPanelAudience;
  isRealLondonBetaPractice: boolean;
  showStudentBetaPracticePanel: boolean;
  showInternalQaPanels: boolean;
  showRealLondonQaReadinessPanel: boolean;
  showFixtureFilename: boolean;
  showQaCounts: boolean;
  showMetadataCoverageCounts: boolean;
  showFullRestrictionDebugDetails: boolean;
  visiblePanelIds: string[];
  hiddenInternalPanelIds: string[];
  devQaToggleLabel: string | null;
};

export type CompactPracticeExerciseRow = {
  id: string;
  title: string;
  description: string | null;
  exerciseVersion: string;
  selected: boolean;
  recommended: boolean;
};

export type PracticeExercisesPanelModel = {
  title: "Practice Exercises";
  selectionEnabled: boolean;
  selectedExerciseId: string | null;
  exerciseRows: CompactPracticeExerciseRow[];
  recommendedExerciseIds: string[];
  duplicateExerciseIds: string[];
};

export type CompactRestrictionOverlaySummaryRow = {
  id: "one-way" | "road-overlays" | "turn-overlays" | "visible-symbols";
  label: string;
  value: string;
};

export type CompactRestrictionOverlayDetailItem = {
  id: string;
  label: string;
  selected: boolean;
};

export type CompactRestrictionOverlayModel = {
  title: "Restriction overlays";
  isCompactByDefault: true;
  detailsExpandedByDefault: false;
  detailsAccessible: boolean;
  fullDebugDetailsHidden: boolean;
  summaryRows: CompactRestrictionOverlaySummaryRow[];
  detailItems: CompactRestrictionOverlayDetailItem[];
};

export function buildRouteRunnerPanelVisibility(input: {
  mapId: string;
  betaEnabled: boolean;
  devQaVisible: boolean;
}): RouteRunnerPanelVisibility {
  const isRealLondonBetaPractice = input.betaEnabled && isRealLondonBetaMapId(input.mapId);
  const audience: RouteRunnerPanelAudience =
    isRealLondonBetaPractice && !input.devQaVisible ? "beta-student" : "dev-qa";
  const showInternalQaPanels = audience === "dev-qa";
  const visiblePanelIds = [
    "practice-exercises",
    "selected-exercise",
    "map-workspace",
    "map-legend",
    ...(isRealLondonBetaPractice ? ["real-london-practice-beta"] : []),
    ...(showInternalQaPanels ? ["converted-osm-qa", "real-london-readiness-qa", "restriction-debug-details"] : [])
  ];
  const hiddenInternalPanelIds = showInternalQaPanels
    ? []
    : [
        "real-london-readiness-qa",
        "fixture-filename",
        "qa-counts",
        "metadata-coverage-counts",
        "internal-readiness-diagnostics",
        "full-restriction-debug-details",
        "raw-map-id"
      ];

  return {
    audience,
    isRealLondonBetaPractice,
    showStudentBetaPracticePanel: isRealLondonBetaPractice,
    showInternalQaPanels,
    showRealLondonQaReadinessPanel: showInternalQaPanels,
    showFixtureFilename: showInternalQaPanels,
    showQaCounts: showInternalQaPanels,
    showMetadataCoverageCounts: showInternalQaPanels,
    showFullRestrictionDebugDetails: showInternalQaPanels,
    visiblePanelIds,
    hiddenInternalPanelIds,
    devQaToggleLabel: isRealLondonBetaPractice
      ? showInternalQaPanels
        ? "Hide QA/debug panels"
        : "Show QA/debug panels"
      : null
  };
}

export function buildPracticeExercisesPanelModel(input: {
  exercises: readonly RouteExercise[];
  selectedExerciseId: string | null;
  recommendedExerciseIds?: readonly string[];
}): PracticeExercisesPanelModel {
  const recommendedIds = uniqueOrdered(input.recommendedExerciseIds ?? []);
  const duplicateExerciseIds = duplicateIds(input.exercises.map((exercise) => exercise.id));
  const recommendedIdSet = new Set(recommendedIds);

  return {
    title: "Practice Exercises",
    selectionEnabled: input.exercises.length > 0,
    selectedExerciseId: input.selectedExerciseId,
    recommendedExerciseIds: recommendedIds,
    duplicateExerciseIds,
    exerciseRows: input.exercises.map((exercise) => {
      const display = buildRouteExerciseDisplayModel(exercise);

      return {
        id: exercise.id,
        title: display.title,
        description: display.description,
        exerciseVersion: exercise.exerciseVersion ?? "none",
        selected: exercise.id === input.selectedExerciseId,
        recommended: recommendedIdSet.has(exercise.id)
      };
    })
  };
}

export function buildCompactRestrictionOverlayModel(input: {
  roadRestrictionOverlayCount: number;
  turnRestrictionVisualCount: number;
  visualItems: readonly RestrictionMapVisualItem[];
  showRoadRestrictions: boolean;
  showTurnRestrictions: boolean;
  detailsVisible: boolean;
  selectedVisualItemId?: string | null;
}): CompactRestrictionOverlayModel {
  return {
    title: "Restriction overlays",
    isCompactByDefault: true,
    detailsExpandedByDefault: false,
    detailsAccessible: input.detailsVisible,
    fullDebugDetailsHidden: !input.detailsVisible,
    summaryRows: [
      {
        id: "one-way",
        label: "One-way restrictions",
        value: input.roadRestrictionOverlayCount > 0 ? "available" : "none"
      },
      {
        id: "road-overlays",
        label: "Road restriction overlay",
        value: input.showRoadRestrictions ? "enabled" : "disabled"
      },
      {
        id: "turn-overlays",
        label: "Turn restriction overlay",
        value: input.showTurnRestrictions ? "enabled" : "disabled"
      },
      {
        id: "visible-symbols",
        label: "Visible restriction symbols",
        value: String(input.visualItems.length)
      }
    ],
    detailItems: input.visualItems.map((item) => ({
      id: item.id,
      label: item.label,
      selected: input.selectedVisualItemId === item.id
    }))
  };
}

export function isDefaultRouteRunnerMap(mapId: string): boolean {
  return mapId === DEFAULT_ROUTE_RUNNER_MAP_ID;
}

function duplicateIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const id of ids) {
    if (seen.has(id) && !duplicates.includes(id)) {
      duplicates.push(id);
    }

    seen.add(id);
  }

  return duplicates;
}

function uniqueOrdered(ids: readonly string[]): string[] {
  return ids.filter((id, index) => ids.indexOf(id) === index);
}
