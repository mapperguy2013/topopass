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
  | "one-way-restriction-declutter"
  | "complete-phase-6-stack-integration";

export type RealLondonFinalPhase6Layer =
  | "land-background"
  | "water"
  | "parks-open-spaces"
  | "rail"
  | "bridges-crossings"
  | "stations"
  | "landmarks"
  | "area-names"
  | "road-casings"
  | "road-fills"
  | "road-hierarchy"
  | "street-labels"
  | "one-way-arrows"
  | "restriction-symbols"
  | "correct-reference-route"
  | "accepted-alternative-route"
  | "attempted-route"
  | "illegal-warning-overlays"
  | "start-destination-markers"
  | "checkpoints"
  | "hints"
  | "review-callouts"
  | "selected-focused-overlays";

export type RealLondonLearnerOverlayState =
  | "start-marker"
  | "destination-marker"
  | "required-checkpoint"
  | "upcoming-checkpoint"
  | "active-checkpoint"
  | "completed-checkpoint"
  | "missed-checkpoint"
  | "focused-checkpoint"
  | "hint-available"
  | "hint-revealed"
  | "hint-callout"
  | "next-road-suggestion"
  | "wrong-turn-warning"
  | "restricted-manoeuvre-warning"
  | "illegal-segment-callout"
  | "inefficient-callout"
  | "backtrack-callout"
  | "accepted-alternative-callout"
  | "checkpoint-reached"
  | "route-completed"
  | "selected-focus";

export type RealLondonVisualViewport = {
  center: { x: number; y: number };
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  zoom: number;
  declutterTier: RealLondonReadabilityDeclutterTier;
};

export type RealLondonVisualExpectedCategories = {
  phase6Layers: RealLondonFinalPhase6Layer[];
  roadHierarchies: OsmRoadVisualHierarchy[];
  labelKinds: ("road" | SyntheticContextMapLabelKind | "start" | "checkpoint" | "finish")[];
  backgroundKinds: SyntheticBackgroundFeatureKind[];
  linearKinds: SyntheticLinearFeatureKind[];
  routeOverlayKinds: SyntheticRouteOverlayKind[];
  objectiveMarkers: ("start" | "required-via" | "checkpoint" | "destination")[];
  learnerOverlayStates: RealLondonLearnerOverlayState[];
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
const noLearnerOverlayStates: RealLondonVisualExpectedCategories["learnerOverlayStates"] = [];
const noRestrictionSymbols: RealLondonVisualExpectedCategories["restrictionSymbols"] = [];

export const FINAL_PHASE_6_REAL_LONDON_LAYER_STACK: RealLondonFinalPhase6Layer[] = [
  "land-background",
  "water",
  "parks-open-spaces",
  "rail",
  "bridges-crossings",
  "stations",
  "landmarks",
  "area-names",
  "road-casings",
  "road-fills",
  "road-hierarchy",
  "street-labels",
  "one-way-arrows",
  "restriction-symbols",
  "correct-reference-route",
  "accepted-alternative-route",
  "attempted-route",
  "illegal-warning-overlays",
  "start-destination-markers",
  "checkpoints",
  "hints",
  "review-callouts",
  "selected-focused-overlays"
];

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
      phase6Layers: ["land-background", "road-casings", "road-fills", "road-hierarchy", "street-labels", "area-names", "one-way-arrows"],
      roadHierarchies: ["primary", "secondary", "residential"],
      labelKinds: ["road", "area"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      learnerOverlayStates: noLearnerOverlayStates,
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
      phase6Layers: ["land-background", "road-casings", "road-fills", "road-hierarchy", "street-labels", "one-way-arrows"],
      roadHierarchies: ["primary", "secondary", "tertiary", "residential"],
      labelKinds: ["road"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      learnerOverlayStates: noLearnerOverlayStates,
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
      phase6Layers: [
        "land-background",
        "water",
        "parks-open-spaces",
        "rail",
        "stations",
        "road-casings",
        "road-fills",
        "road-hierarchy",
        "street-labels"
      ],
      roadHierarchies: ["primary", "secondary", "tertiary", "residential"],
      labelKinds: ["road", "water", "station"],
      backgroundKinds: ["park", "water"],
      linearKinds: ["rail", "waterway"],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      learnerOverlayStates: noLearnerOverlayStates,
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
      phase6Layers: [
        "land-background",
        "water",
        "bridges-crossings",
        "road-casings",
        "road-fills",
        "road-hierarchy",
        "street-labels",
        "restriction-symbols",
        "illegal-warning-overlays",
        "review-callouts"
      ],
      roadHierarchies: ["secondary", "residential"],
      labelKinds: ["road", "bridge", "water"],
      backgroundKinds: ["water"],
      linearKinds: ["bridge", "waterway"],
      routeOverlayKinds: ["illegal-movement"],
      objectiveMarkers: noObjectiveMarkers,
      learnerOverlayStates: ["restricted-manoeuvre-warning", "illegal-segment-callout"],
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
      phase6Layers: ["land-background", "landmarks", "area-names", "road-casings", "road-fills", "road-hierarchy", "street-labels"],
      roadHierarchies: ["secondary", "tertiary", "residential"],
      labelKinds: ["road", "landmark", "public_building", "area"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      learnerOverlayStates: noLearnerOverlayStates,
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
      phase6Layers: [
        "land-background",
        "water",
        "bridges-crossings",
        "road-casings",
        "road-fills",
        "road-hierarchy",
        "street-labels",
        "one-way-arrows",
        "restriction-symbols",
        "correct-reference-route",
        "accepted-alternative-route",
        "attempted-route",
        "illegal-warning-overlays",
        "start-destination-markers",
        "checkpoints",
        "hints",
        "review-callouts",
        "selected-focused-overlays"
      ],
      roadHierarchies: ["secondary", "tertiary", "residential"],
      labelKinds: ["road", "start", "checkpoint", "finish"],
      backgroundKinds: ["water", "pedestrian-area"],
      linearKinds: ["bridge", "waterway"],
      routeOverlayKinds: [
        "raw-route",
        "snapped-route",
        "matched-route",
        "shortest-legal-route",
        "accepted-alternative-route",
        "inefficient-section",
        "backtrack-section",
        "illegal-movement"
      ],
      objectiveMarkers: ["start", "required-via", "checkpoint", "destination"],
      learnerOverlayStates: [
        "start-marker",
        "destination-marker",
        "required-checkpoint",
        "upcoming-checkpoint",
        "active-checkpoint",
        "completed-checkpoint",
        "missed-checkpoint",
        "focused-checkpoint",
        "hint-available",
        "hint-revealed",
        "hint-callout",
        "next-road-suggestion",
        "wrong-turn-warning",
        "restricted-manoeuvre-warning",
        "illegal-segment-callout",
        "inefficient-callout",
        "backtrack-callout",
        "accepted-alternative-callout",
        "checkpoint-reached",
        "route-completed",
        "selected-focus"
      ],
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
      phase6Layers: [
        "land-background",
        "road-casings",
        "road-fills",
        "road-hierarchy",
        "street-labels",
        "area-names",
        "one-way-arrows",
        "restriction-symbols",
        "accepted-alternative-route",
        "illegal-warning-overlays",
        "checkpoints",
        "review-callouts"
      ],
      roadHierarchies: ["secondary", "residential"],
      labelKinds: ["road", "area"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: ["accepted-alternative-route", "inefficient-section", "backtrack-section", "illegal-movement"],
      objectiveMarkers: ["required-via"],
      learnerOverlayStates: [
        "required-checkpoint",
        "missed-checkpoint",
        "wrong-turn-warning",
        "restricted-manoeuvre-warning",
        "illegal-segment-callout",
        "inefficient-callout",
        "backtrack-callout"
      ],
      restrictionSymbols: ["one-way", "restricted-turn", "review-warning"],
      decluttering: ["overview", "learner"]
    }
  },
  {
    id: "complete-phase-6-stack-integration",
    label: "Complete Phase 6 stack integration",
    description:
      "Final Phase 6 QA viewport covering base context, hierarchy, labels, restrictions, learner route, review warnings, hints, callouts, and selected focus.",
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas", "learner-route-overlay", "route-review-readability"],
    viewport: {
      center: { x: 22, y: -46 },
      bounds: { minX: -210, minY: -255, maxX: 255, maxY: 165 },
      zoom: 1.8,
      declutterTier: "detail"
    },
    expected: {
      phase6Layers: FINAL_PHASE_6_REAL_LONDON_LAYER_STACK,
      roadHierarchies: ["primary", "secondary", "tertiary", "residential"],
      labelKinds: ["road", "start", "checkpoint", "finish", "station", "landmark", "public_building", "area", "bridge", "water"],
      backgroundKinds: ["park", "water", "pedestrian-area"],
      linearKinds: ["rail", "bridge", "waterway"],
      routeOverlayKinds: [
        "raw-route",
        "snapped-route",
        "matched-route",
        "shortest-legal-route",
        "accepted-alternative-route",
        "inefficient-section",
        "backtrack-section",
        "illegal-movement"
      ],
      objectiveMarkers: ["start", "required-via", "checkpoint", "destination"],
      learnerOverlayStates: [
        "start-marker",
        "destination-marker",
        "required-checkpoint",
        "upcoming-checkpoint",
        "active-checkpoint",
        "completed-checkpoint",
        "missed-checkpoint",
        "focused-checkpoint",
        "hint-available",
        "hint-revealed",
        "hint-callout",
        "next-road-suggestion",
        "wrong-turn-warning",
        "restricted-manoeuvre-warning",
        "illegal-segment-callout",
        "inefficient-callout",
        "backtrack-callout",
        "accepted-alternative-callout",
        "checkpoint-reached",
        "route-completed",
        "selected-focus"
      ],
      restrictionSymbols: ["one-way", "restricted-turn", "review-warning"],
      decluttering: ["overview", "learner", "detail"]
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
    finalPhase6LayerStack: FINAL_PHASE_6_REAL_LONDON_LAYER_STACK,
    exerciseId: qaExercise?.id ?? null,
    synthetic: true
  };
}
