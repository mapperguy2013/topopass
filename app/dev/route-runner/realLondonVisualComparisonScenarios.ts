import {
  PHASE_6_VISUAL_QA_FIXTURE_NAME,
  phase6RealLondonVisualQaRouteExercises,
  phase6RealLondonVisualQaRouteMap
} from "./realLondonVisualQaScenario.ts";
import type {
  OsmRoadVisualHierarchy,
  SyntheticBackgroundFeatureKind,
  SyntheticContextMapLabelKind,
  SyntheticLinearFeatureKind,
  SyntheticRouteOverlayKind
} from "./syntheticStreetMapRenderer.ts";

export type RealLondonVisualComparisonModeId =
  | "plain-route-graph"
  | "phase-6-street-atlas"
  | "learner-route-overlay"
  | "route-review-readability";

export type RealLondonReadabilityDeclutterTier = "overview" | "learner" | "detail";

export type RealLondonVisualComparisonLayer =
  | "raw-road-graph"
  | "road-hierarchy"
  | "street-labels"
  | "context-features"
  | "learner-route"
  | "objective-markers"
  | "hints"
  | "review-issues"
  | "restrictions"
  | "one-way-symbols";

export type RealLondonVisualReadabilityScenarioId =
  | "dense-central-readability"
  | "major-road-side-street-hierarchy"
  | "park-water-rail-station-context"
  | "bridge-crossing-context"
  | "landmark-area-orientation"
  | "learner-route-overlay-review"
  | "one-way-restriction-declutter";

export type RealLondonVisualViewport = {
  center: { x: number; y: number };
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  zoom: number;
  declutterTier: RealLondonReadabilityDeclutterTier;
};

export type RealLondonVisualExpectedCategories = {
  roadHierarchies: OsmRoadVisualHierarchy[];
  labelKinds: ("road" | SyntheticContextMapLabelKind | "start" | "checkpoint" | "finish")[];
  backgroundKinds: SyntheticBackgroundFeatureKind[];
  linearKinds: SyntheticLinearFeatureKind[];
  routeOverlayKinds: SyntheticRouteOverlayKind[];
  objectiveMarkers: ("start" | "required-via" | "checkpoint" | "destination")[];
  restrictionSymbols: ("one-way" | "restricted-turn" | "review-warning")[];
  decluttering: RealLondonReadabilityDeclutterTier[];
};

export type RealLondonVisualComparisonMode = {
  id: RealLondonVisualComparisonModeId;
  label: string;
  description: string;
  visibleLayers: RealLondonVisualComparisonLayer[];
};

export type RealLondonVisualReadabilityScenario = {
  id: RealLondonVisualReadabilityScenarioId;
  label: string;
  description: string;
  mapId: string;
  fixtureName: string;
  exerciseId?: string;
  comparisonModeIds: RealLondonVisualComparisonModeId[];
  viewport: RealLondonVisualViewport;
  expected: RealLondonVisualExpectedCategories;
};

export const REAL_LONDON_VISUAL_COMPARISON_MODES: RealLondonVisualComparisonMode[] = [
  {
    id: "plain-route-graph",
    label: "Plain route graph",
    description:
      "Road-node geometry only, used as a controlled comparison against the older backend-graph style.",
    visibleLayers: ["raw-road-graph"]
  },
  {
    id: "phase-6-street-atlas",
    label: "Phase 6 street atlas",
    description:
      "Current TOPOPASS street-atlas styling with road hierarchy, street labels, context features, one-way arrows, and base restrictions.",
    visibleLayers: [
      "road-hierarchy",
      "street-labels",
      "context-features",
      "restrictions",
      "one-way-symbols"
    ]
  },
  {
    id: "learner-route-overlay",
    label: "Learner route overlay",
    description:
      "Street-atlas styling with the learner route, objective stops, and hint overlays visible above the base map.",
    visibleLayers: [
      "road-hierarchy",
      "street-labels",
      "context-features",
      "learner-route",
      "objective-markers",
      "hints",
      "one-way-symbols"
    ]
  },
  {
    id: "route-review-readability",
    label: "Route review readability",
    description:
      "Street-atlas styling with review issue markers, restrictions, objective stops, and route-warning overlays preserved through decluttering.",
    visibleLayers: [
      "road-hierarchy",
      "street-labels",
      "context-features",
      "learner-route",
      "objective-markers",
      "review-issues",
      "restrictions",
      "one-way-symbols"
    ]
  }
];

const qaExercise = phase6RealLondonVisualQaRouteExercises[0];

const commonMapMetadata = {
  mapId: phase6RealLondonVisualQaRouteMap.id,
  fixtureName: PHASE_6_VISUAL_QA_FIXTURE_NAME,
  ...(qaExercise ? { exerciseId: qaExercise.id } : {})
};

const qaMapBounds = {
  minX: -267.166778,
  minY: -286.25386,
  maxX: 267.166778,
  maxY: 286.243803
};

const noRouteOverlays: SyntheticRouteOverlayKind[] = [];
const noObjectiveMarkers: RealLondonVisualExpectedCategories["objectiveMarkers"] = [];
const noRestrictionSymbols: RealLondonVisualExpectedCategories["restrictionSymbols"] = [];

export const REAL_LONDON_VISUAL_READABILITY_SCENARIOS: RealLondonVisualReadabilityScenario[] = [
  {
    id: "dense-central-readability",
    label: "Dense central readability",
    description:
      "Central London-like dense street grid for comparing raw graph readability against the Phase 6 street-atlas hierarchy.",
    ...commonMapMetadata,
    comparisonModeIds: ["plain-route-graph", "phase-6-street-atlas"],
    viewport: {
      center: { x: 0, y: -30 },
      bounds: { minX: -155, minY: -185, maxX: 155, maxY: 125 },
      zoom: 1.75,
      declutterTier: "learner"
    },
    expected: {
      roadHierarchies: ["primary", "secondary", "residential"],
      labelKinds: ["road", "area"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      restrictionSymbols: ["one-way"],
      decluttering: ["overview", "learner"]
    }
  },
  {
    id: "major-road-side-street-hierarchy",
    label: "Major road and side-street hierarchy",
    description:
      "Major east-west road with secondary and residential side-street network visible for hierarchy checks.",
    ...commonMapMetadata,
    comparisonModeIds: ["plain-route-graph", "phase-6-street-atlas"],
    viewport: {
      center: { x: 0, y: 80 },
      bounds: { minX: -267, minY: -60, maxX: 267, maxY: 210 },
      zoom: 1.35,
      declutterTier: "learner"
    },
    expected: {
      roadHierarchies: ["primary", "secondary", "tertiary", "residential"],
      labelKinds: ["road"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      restrictionSymbols: ["one-way"],
      decluttering: ["overview", "learner"]
    }
  },
  {
    id: "park-water-rail-station-context",
    label: "Park, water, rail, and station context",
    description:
      "Fixture-backed park, basin, canal, rail line, and station labels in one deterministic viewport.",
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas"],
    viewport: {
      center: { x: 92, y: 74 },
      bounds: { minX: -85, minY: -80, maxX: 267, maxY: 230 },
      zoom: 1.6,
      declutterTier: "detail"
    },
    expected: {
      roadHierarchies: ["primary", "secondary", "tertiary", "residential"],
      labelKinds: ["road", "water", "station"],
      backgroundKinds: ["park", "water"],
      linearKinds: ["rail", "waterway"],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      restrictionSymbols: noRestrictionSymbols,
      decluttering: ["learner", "detail"]
    }
  },
  {
    id: "bridge-crossing-context",
    label: "Bridge and crossing context",
    description:
      "Bridge road and canal crossing area for checking that crossing context remains readable with review restrictions nearby.",
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas", "route-review-readability"],
    viewport: {
      center: { x: 62, y: -126 },
      bounds: { minX: -180, minY: -260, maxX: 267, maxY: 20 },
      zoom: 1.55,
      declutterTier: "detail"
    },
    expected: {
      roadHierarchies: ["secondary", "residential"],
      labelKinds: ["road", "bridge", "water"],
      backgroundKinds: ["water"],
      linearKinds: ["bridge", "waterway"],
      routeOverlayKinds: ["illegal-movement"],
      objectiveMarkers: noObjectiveMarkers,
      restrictionSymbols: ["restricted-turn", "review-warning"],
      decluttering: ["learner", "detail"]
    }
  },
  {
    id: "landmark-area-orientation",
    label: "Landmark and area orientation",
    description:
      "Landmarks, public buildings, area names, and nearby street labels for orientation readability checks.",
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas"],
    viewport: {
      center: { x: 72, y: 10 },
      bounds: { minX: -70, minY: -135, maxX: 230, maxY: 140 },
      zoom: 1.85,
      declutterTier: "detail"
    },
    expected: {
      roadHierarchies: ["secondary", "tertiary", "residential"],
      labelKinds: ["road", "landmark", "public_building", "area"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      restrictionSymbols: noRestrictionSymbols,
      decluttering: ["detail"]
    }
  },
  {
    id: "learner-route-overlay-review",
    label: "Learner route overlay and review",
    description:
      "Objective route with start, destination, required via point, checkpoint, hint, and review-warning layers above the base map.",
    ...commonMapMetadata,
    comparisonModeIds: ["learner-route-overlay", "route-review-readability"],
    viewport: {
      center: { x: 24, y: -54 },
      bounds: { minX: -267, minY: -280, maxX: 267, maxY: 135 },
      zoom: 1.65,
      declutterTier: "learner"
    },
    expected: {
      roadHierarchies: ["secondary", "tertiary", "residential"],
      labelKinds: ["road", "start", "checkpoint", "finish"],
      backgroundKinds: ["water", "pedestrian-area"],
      linearKinds: ["bridge", "waterway"],
      routeOverlayKinds: ["raw-route", "snapped-route", "matched-route", "illegal-movement"],
      objectiveMarkers: ["start", "required-via", "checkpoint", "destination"],
      restrictionSymbols: ["one-way", "restricted-turn", "review-warning"],
      decluttering: ["learner", "detail"]
    }
  },
  {
    id: "one-way-restriction-declutter",
    label: "One-way and restriction declutter",
    description:
      "One-way-heavy local street pattern with the synthetic prohibited turn preserved as review-critical restriction data.",
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas", "route-review-readability"],
    viewport: {
      center: { x: -34, y: -6 },
      bounds: { minX: -235, minY: -220, maxX: 145, maxY: 170 },
      zoom: 1.25,
      declutterTier: "overview"
    },
    expected: {
      roadHierarchies: ["secondary", "residential"],
      labelKinds: ["road", "area"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: ["illegal-movement"],
      objectiveMarkers: ["required-via"],
      restrictionSymbols: ["one-way", "restricted-turn", "review-warning"],
      decluttering: ["overview", "learner"]
    }
  }
];

export function getRealLondonVisualReadabilityScenario(
  scenarioId: RealLondonVisualReadabilityScenarioId
): RealLondonVisualReadabilityScenario | undefined {
  return REAL_LONDON_VISUAL_READABILITY_SCENARIOS.find((scenario) => scenario.id === scenarioId);
}

export function buildRealLondonVisualComparisonScenarioSummary() {
  return {
    mapId: phase6RealLondonVisualQaRouteMap.id,
    fixtureName: PHASE_6_VISUAL_QA_FIXTURE_NAME,
    comparisonModeIds: REAL_LONDON_VISUAL_COMPARISON_MODES.map((mode) => mode.id),
    scenarioIds: REAL_LONDON_VISUAL_READABILITY_SCENARIOS.map((scenario) => scenario.id),
    viewportBounds: qaMapBounds,
    exerciseId: qaExercise?.id ?? null,
    synthetic: true
  };
}
