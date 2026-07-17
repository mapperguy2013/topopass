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

export type RealLondonResponsiveViewportId =
  | "small-mobile-portrait"
  | "large-mobile-portrait"
  | "mobile-landscape"
  | "tablet-portrait"
  | "tablet-landscape"
  | "narrow-embedded-map";

export type RealLondonResponsiveDeviceClass = "mobile" | "tablet";

export type RealLondonResponsiveVisualScenarioId =
  | "mobile-dense-central-readability"
  | "mobile-route-drawing"
  | "mobile-route-review"
  | "mobile-one-way-restriction-declutter"
  | "mobile-marker-hint-collision"
  | "tablet-portrait-learner-overlays"
  | "tablet-landscape-review-panels"
  | "tablet-context-orientation";

export type RealLondonVisualQaContext =
  | "dense-central-streets"
  | "major-road-side-street-hierarchy"
  | "bridges-river-crossings"
  | "parks-open-spaces"
  | "estates-residential-blocks"
  | "high-streets"
  | "awkward-complex-junctions"
  | "rail-station-context"
  | "landmark-area-name-context"
  | "learner-route-review-overlays"
  | "mobile-tablet-readability";

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
  | "high-zoom-road-scale-100"
  | "high-zoom-road-scale-1000"
  | "high-zoom-road-scale-5000"
  | "major-road-side-street-hierarchy"
  | "park-water-rail-station-context"
  | "bridge-crossing-context"
  | "landmark-area-orientation"
  | "learner-route-overlay-review"
  | "one-way-restriction-declutter"
  | "complete-phase-6-stack-integration"
  | "dense-central-low-zoom-overview"
  | "high-street-side-street-readability"
  | "estate-residential-blocks"
  | "park-open-space-edge"
  | "bridge-river-crossing-review"
  | "awkward-junction-restriction-review"
  | "rail-station-interchange-context"
  | "landmark-area-high-zoom"
  | "piccadilly-circus-dense-central-map"
  | "waterloo-bridge-thames-context-map"
  | "one-way-system-restriction-map"
  | "quiet-residential-learner-map";

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
  contextTags: RealLondonVisualQaContext[];
  mapId: string;
  fixtureName: string;
  exerciseId?: string;
  comparisonModeIds: RealLondonVisualComparisonModeId[];
  viewport: RealLondonVisualViewport;
  expected: RealLondonVisualExpectedCategories;
};

export type RealLondonResponsiveVisualViewport = RealLondonVisualViewport & {
  id: RealLondonResponsiveViewportId;
  label: string;
  width: number;
  height: number;
  deviceClass: RealLondonResponsiveDeviceClass;
  orientation: "portrait" | "landscape";
  expectedMapMinHeight: number;
};

export type RealLondonResponsiveScenarioExpected = {
  requiresMapFirstLayout: boolean;
  requiresTouchDrawing: boolean;
  requiresCollapsedPanels: boolean;
  requiresMinTapTargetPx: number;
  categories: (
    | "roads-by-hierarchy"
    | "street-labels"
    | "context-labels"
    | "route-overlays"
    | "start-destination-markers"
    | "checkpoints"
    | "hints"
    | "review-callouts"
    | "one-way-symbols"
    | "restriction-symbols"
    | "decluttering-tier"
    | "legend-attribution"
  )[];
};

export type RealLondonResponsiveVisualScenario = {
  id: RealLondonResponsiveVisualScenarioId;
  label: string;
  description: string;
  baseScenarioId: RealLondonVisualReadabilityScenarioId;
  viewportId: RealLondonResponsiveViewportId;
  comparisonModeIds: RealLondonVisualComparisonModeId[];
  expected: RealLondonResponsiveScenarioExpected;
};

export type RealLondonPhase6ReleaseCandidateGate = {
  id: "phase-6-final-visual-rc-gate";
  label: string;
  status: "ready-for-final-learner-review";
  validationCommands: readonly string[];
  requiredZoomTiers: RealLondonReadabilityDeclutterTier[];
  requiredContextTags: RealLondonVisualQaContext[];
  requiredScenarioIds: RealLondonVisualReadabilityScenarioId[];
  requiredResponsiveScenarioIds: RealLondonResponsiveVisualScenarioId[];
  finalLayerStack: RealLondonFinalPhase6Layer[];
  mustPreserve: readonly string[];
  mustNotChange: readonly string[];
};

export type Stage160AtlasIdentityFixtureCategory =
  | "dense-central"
  | "major-road-side-streets"
  | "high-street"
  | "suburban-estate"
  | "park-edge"
  | "thames-bridge-proxy"
  | "rail-station-heavy"
  | "awkward-junction"
  | "one-way-system"
  | "learner-review-mistakes"
  | "mobile-viewport";

export type Stage160AtlasIdentityFixture = {
  category: Stage160AtlasIdentityFixtureCategory;
  label: string;
  scenarioId: RealLondonVisualReadabilityScenarioId;
  responsiveScenarioId?: RealLondonResponsiveVisualScenarioId;
  designFocus: readonly string[];
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
      "Current PCO Ready street-atlas styling with road hierarchy, street labels, context features, one-way arrows, and base restrictions.",
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

export const REAL_LONDON_RESPONSIVE_VISUAL_VIEWPORTS: RealLondonResponsiveVisualViewport[] = [
  {
    id: "small-mobile-portrait",
    label: "Small mobile portrait",
    width: 360,
    height: 740,
    deviceClass: "mobile",
    orientation: "portrait",
    expectedMapMinHeight: 420,
    center: { x: 18, y: -52 },
    bounds: { minX: -210, minY: -260, maxX: 170, maxY: 145 },
    zoom: 1.65,
    declutterTier: "learner"
  },
  {
    id: "large-mobile-portrait",
    label: "Large mobile portrait",
    width: 430,
    height: 932,
    deviceClass: "mobile",
    orientation: "portrait",
    expectedMapMinHeight: 420,
    center: { x: 18, y: -52 },
    bounds: { minX: -230, minY: -270, maxX: 205, maxY: 160 },
    zoom: 1.7,
    declutterTier: "learner"
  },
  {
    id: "mobile-landscape",
    label: "Mobile landscape",
    width: 844,
    height: 390,
    deviceClass: "mobile",
    orientation: "landscape",
    expectedMapMinHeight: 360,
    center: { x: 0, y: -30 },
    bounds: { minX: -255, minY: -195, maxX: 255, maxY: 135 },
    zoom: 1.35,
    declutterTier: "overview"
  },
  {
    id: "tablet-portrait",
    label: "Tablet portrait",
    width: 768,
    height: 1024,
    deviceClass: "tablet",
    orientation: "portrait",
    expectedMapMinHeight: 560,
    center: { x: 24, y: -54 },
    bounds: { minX: -245, minY: -280, maxX: 245, maxY: 160 },
    zoom: 1.75,
    declutterTier: "learner"
  },
  {
    id: "tablet-landscape",
    label: "Tablet landscape",
    width: 1024,
    height: 768,
    deviceClass: "tablet",
    orientation: "landscape",
    expectedMapMinHeight: 560,
    center: { x: 22, y: -46 },
    bounds: { minX: -267, minY: -286, maxX: 267, maxY: 210 },
    zoom: 1.55,
    declutterTier: "detail"
  },
  {
    id: "narrow-embedded-map",
    label: "Narrow embedded map",
    width: 320,
    height: 640,
    deviceClass: "mobile",
    orientation: "portrait",
    expectedMapMinHeight: 420,
    center: { x: -34, y: -6 },
    bounds: { minX: -235, minY: -220, maxX: 145, maxY: 170 },
    zoom: 1.2,
    declutterTier: "overview"
  }
];

export const REAL_LONDON_VISUAL_READABILITY_SCENARIOS: RealLondonVisualReadabilityScenario[] = [
  {
    id: "dense-central-readability",
    label: "Dense central readability",
    description:
      "Central London-like dense street grid for comparing raw graph readability against the Phase 6 street-atlas hierarchy.",
    contextTags: ["dense-central-streets"],
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
      labelKinds: ["road", "district"],
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
    id: "high-zoom-road-scale-100",
    label: "High zoom road scale 100%",
    description:
      "Baseline 100% dense central view for comparing Stage 161.6.8.1 road, label, and drawing affordance scale.",
    contextTags: ["dense-central-streets"],
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas", "learner-route-overlay"],
    viewport: {
      center: { x: 0, y: -30 },
      bounds: { minX: -155, minY: -185, maxX: 155, maxY: 125 },
      zoom: 1,
      declutterTier: "learner"
    },
    expected: {
      phase6Layers: ["land-background", "road-casings", "road-fills", "road-hierarchy", "street-labels", "one-way-arrows", "hints"],
      roadHierarchies: ["primary", "secondary", "residential"],
      labelKinds: ["road"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: ["raw-route", "snapped-route"],
      objectiveMarkers: ["start", "required-via", "checkpoint", "destination"],
      learnerOverlayStates: ["start-marker", "destination-marker", "required-checkpoint", "hint-revealed"],
      restrictionSymbols: ["one-way"],
      decluttering: ["learner"]
    }
  },
  {
    id: "high-zoom-road-scale-1000",
    label: "High zoom road scale 1000%",
    description:
      "1000% dense central view where roads, labels, drawing affordances, and submitted-review warnings should be visibly larger without stretching.",
    contextTags: ["dense-central-streets"],
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas", "learner-route-overlay", "route-review-readability"],
    viewport: {
      center: { x: 0, y: -30 },
      bounds: { minX: -155, minY: -185, maxX: 155, maxY: 125 },
      zoom: 10,
      declutterTier: "detail"
    },
    expected: {
      phase6Layers: [
        "land-background",
        "road-casings",
        "road-fills",
        "road-hierarchy",
        "street-labels",
        "one-way-arrows",
        "hints",
        "illegal-warning-overlays",
        "review-callouts"
      ],
      roadHierarchies: ["primary", "secondary", "residential"],
      labelKinds: ["road"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: ["raw-route", "snapped-route", "illegal-movement"],
      objectiveMarkers: ["start", "required-via", "checkpoint", "destination"],
      learnerOverlayStates: ["start-marker", "destination-marker", "required-checkpoint", "hint-revealed", "illegal-segment-callout"],
      restrictionSymbols: ["one-way", "review-warning"],
      decluttering: ["detail"]
    }
  },
  {
    id: "high-zoom-road-scale-5000",
    label: "High zoom road scale 5000%",
    description:
      "5000% dense central view for checking large road corridors, capped drawn-route width, stronger mistake highlights, readable review text, and no X/Y stretch.",
    contextTags: ["dense-central-streets"],
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas", "learner-route-overlay", "route-review-readability"],
    viewport: {
      center: { x: 0, y: -30 },
      bounds: { minX: -155, minY: -185, maxX: 155, maxY: 125 },
      zoom: 50,
      declutterTier: "detail"
    },
    expected: {
      phase6Layers: [
        "land-background",
        "road-casings",
        "road-fills",
        "road-hierarchy",
        "street-labels",
        "one-way-arrows",
        "hints",
        "illegal-warning-overlays",
        "review-callouts"
      ],
      roadHierarchies: ["primary", "secondary", "residential"],
      labelKinds: ["road"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: ["raw-route", "snapped-route", "illegal-movement"],
      objectiveMarkers: ["start", "required-via", "checkpoint", "destination"],
      learnerOverlayStates: ["start-marker", "destination-marker", "required-checkpoint", "hint-revealed", "illegal-segment-callout"],
      restrictionSymbols: ["one-way", "review-warning"],
      decluttering: ["detail"]
    }
  },
  {
    id: "major-road-side-street-hierarchy",
    label: "Major road and side-street hierarchy",
    description:
      "Major east-west road with secondary and residential side-street network visible for hierarchy checks.",
    contextTags: ["major-road-side-street-hierarchy"],
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
    contextTags: ["parks-open-spaces", "rail-station-context"],
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
    contextTags: ["bridges-river-crossings"],
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
    contextTags: ["landmark-area-name-context"],
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
      labelKinds: ["road", "landmark", "public_building", "district"],
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
    contextTags: ["learner-route-review-overlays"],
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
    contextTags: ["awkward-complex-junctions"],
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
      labelKinds: ["road", "district"],
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
    contextTags: [
      "dense-central-streets",
      "major-road-side-street-hierarchy",
      "bridges-river-crossings",
      "parks-open-spaces",
      "rail-station-context",
      "landmark-area-name-context",
      "learner-route-review-overlays"
    ],
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
      labelKinds: ["road", "start", "checkpoint", "finish", "station", "landmark", "public_building", "district", "bridge", "water"],
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
  },
  {
    id: "dense-central-low-zoom-overview",
    label: "Dense central low-zoom overview",
    description:
      "Low-zoom release-candidate check that dense central streets stay uncluttered while major hierarchy and area context remain legible.",
    contextTags: ["dense-central-streets"],
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas"],
    viewport: {
      center: { x: 0, y: -24 },
      bounds: { minX: -267, minY: -286, maxX: 267, maxY: 210 },
      zoom: 0.95,
      declutterTier: "overview"
    },
    expected: {
      phase6Layers: ["land-background", "road-casings", "road-fills", "road-hierarchy", "area-names"],
      roadHierarchies: ["primary", "secondary", "residential"],
      labelKinds: ["road", "district"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      learnerOverlayStates: noLearnerOverlayStates,
      restrictionSymbols: noRestrictionSymbols,
      decluttering: ["overview"]
    }
  },
  {
    id: "high-street-side-street-readability",
    label: "High street and side-street readability",
    description:
      "Primary/secondary high-street corridor with side streets for checking hierarchy, casing/fill order, and medium-zoom label readability.",
    contextTags: ["high-streets", "major-road-side-street-hierarchy"],
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas"],
    viewport: {
      center: { x: 42, y: 62 },
      bounds: { minX: -145, minY: -95, maxX: 267, maxY: 220 },
      zoom: 1.45,
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
      decluttering: ["learner"]
    }
  },
  {
    id: "estate-residential-blocks",
    label: "Estate and residential blocks",
    description:
      "Residential block pattern for checking quieter roads, pedestrian areas, and local label decluttering.",
    contextTags: ["estates-residential-blocks"],
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas"],
    viewport: {
      center: { x: -74, y: -6 },
      bounds: { minX: -205, minY: -160, maxX: 110, maxY: 145 },
      zoom: 1.65,
      declutterTier: "learner"
    },
    expected: {
      phase6Layers: ["land-background", "road-casings", "road-fills", "road-hierarchy", "street-labels", "area-names"],
      roadHierarchies: ["residential"],
      labelKinds: ["road", "district"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      learnerOverlayStates: noLearnerOverlayStates,
      restrictionSymbols: noRestrictionSymbols,
      decluttering: ["learner", "detail"]
    }
  },
  {
    id: "park-open-space-edge",
    label: "Park and open-space edge",
    description:
      "Park, basin, canal, and adjacent streets for checking open-space context without overpowering the learner road network.",
    contextTags: ["parks-open-spaces"],
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas"],
    viewport: {
      center: { x: 126, y: 84 },
      bounds: { minX: -30, minY: -45, maxX: 267, maxY: 230 },
      zoom: 1.75,
      declutterTier: "detail"
    },
    expected: {
      phase6Layers: ["land-background", "water", "parks-open-spaces", "road-casings", "road-fills", "road-hierarchy", "street-labels"],
      roadHierarchies: ["primary", "tertiary", "residential"],
      labelKinds: ["road", "water"],
      backgroundKinds: ["park", "water"],
      linearKinds: ["waterway"],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      learnerOverlayStates: noLearnerOverlayStates,
      restrictionSymbols: noRestrictionSymbols,
      decluttering: ["detail"]
    }
  },
  {
    id: "bridge-river-crossing-review",
    label: "Bridge and river crossing review",
    description:
      "Water crossing review viewport for checking bridges, water labels, restrictions, and warning overlays after the performance pass.",
    contextTags: ["bridges-river-crossings", "learner-route-review-overlays"],
    ...commonMapMetadata,
    comparisonModeIds: ["route-review-readability"],
    viewport: {
      center: { x: 54, y: -122 },
      bounds: { minX: -185, minY: -270, maxX: 242, maxY: 45 },
      zoom: 1.7,
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
    id: "awkward-junction-restriction-review",
    label: "Awkward junction restriction review",
    description:
      "Complex junction and one-way/restriction viewport for checking review-critical symbols remain above decluttered base cartography.",
    contextTags: ["awkward-complex-junctions", "learner-route-review-overlays"],
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas", "route-review-readability"],
    viewport: {
      center: { x: -18, y: -38 },
      bounds: { minX: -198, minY: -218, maxX: 170, maxY: 135 },
      zoom: 1.55,
      declutterTier: "learner"
    },
    expected: {
      phase6Layers: [
        "land-background",
        "road-casings",
        "road-fills",
        "road-hierarchy",
        "street-labels",
        "one-way-arrows",
        "restriction-symbols",
        "accepted-alternative-route",
        "illegal-warning-overlays",
        "review-callouts"
      ],
      roadHierarchies: ["secondary", "residential"],
      labelKinds: ["road"],
      backgroundKinds: ["pedestrian-area"],
      linearKinds: [],
      routeOverlayKinds: ["accepted-alternative-route", "illegal-movement"],
      objectiveMarkers: ["required-via"],
      learnerOverlayStates: ["required-checkpoint", "restricted-manoeuvre-warning", "illegal-segment-callout"],
      restrictionSymbols: ["one-way", "restricted-turn", "review-warning"],
      decluttering: ["overview", "learner"]
    }
  },
  {
    id: "rail-station-interchange-context",
    label: "Rail and station interchange context",
    description:
      "Rail line, station marker, nearby park/water context, and high-street labels for orientation around transport landmarks.",
    contextTags: ["rail-station-context", "landmark-area-name-context"],
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas"],
    viewport: {
      center: { x: 76, y: 102 },
      bounds: { minX: -70, minY: -50, maxX: 267, maxY: 245 },
      zoom: 1.8,
      declutterTier: "detail"
    },
    expected: {
      phase6Layers: ["land-background", "water", "parks-open-spaces", "rail", "stations", "road-casings", "road-fills", "road-hierarchy", "street-labels"],
      roadHierarchies: ["primary", "secondary", "tertiary", "residential"],
      labelKinds: ["road", "station", "water"],
      backgroundKinds: ["park", "water"],
      linearKinds: ["rail", "waterway"],
      routeOverlayKinds: noRouteOverlays,
      objectiveMarkers: noObjectiveMarkers,
      learnerOverlayStates: noLearnerOverlayStates,
      restrictionSymbols: noRestrictionSymbols,
      decluttering: ["detail"]
    }
  },
  {
    id: "landmark-area-high-zoom",
    label: "Landmark and area high-zoom check",
    description:
      "High-zoom landmark, public-building, area-name, and street-label viewport for final label collision regression checks.",
    contextTags: ["landmark-area-name-context"],
    ...commonMapMetadata,
    comparisonModeIds: ["phase-6-street-atlas"],
    viewport: {
      center: { x: 78, y: -2 },
      bounds: { minX: -58, minY: -130, maxX: 214, maxY: 118 },
      zoom: 2,
      declutterTier: "detail"
    },
    expected: {
      phase6Layers: ["land-background", "landmarks", "area-names", "road-casings", "road-fills", "road-hierarchy", "street-labels"],
      roadHierarchies: ["secondary", "tertiary", "residential"],
      labelKinds: ["road", "landmark", "public_building", "district"],
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
    id: "piccadilly-circus-dense-central-map",
    label: "Piccadilly Circus dense central map",
    description:
      "Curated real Overpass fixture for dense Central London road hierarchy, labels, one-way texture, amenities, and mobile clutter checks.",
    contextTags: ["dense-central-streets", "awkward-complex-junctions", "landmark-area-name-context"],
    mapId: "osm-curated-piccadilly-circus",
    fixtureName: "piccadillyCircusOverpass.json",
    exerciseId: "osm-curated-piccadilly-circus-visual-qa-route",
    comparisonModeIds: ["plain-route-graph", "phase-6-street-atlas", "learner-route-overlay"],
    viewport: {
      center: { x: 0, y: 0 },
      bounds: { minX: -855.56821, minY: -505.644288, maxX: 855.56821, maxY: 505.612913 },
      zoom: 1.45,
      declutterTier: "learner"
    },
    expected: {
      phase6Layers: [
        "land-background",
        "parks-open-spaces",
        "rail",
        "stations",
        "landmarks",
        "road-casings",
        "road-fills",
        "road-hierarchy",
        "street-labels",
        "one-way-arrows",
        "restriction-symbols",
        "start-destination-markers",
        "checkpoints"
      ],
      roadHierarchies: ["primary", "secondary", "tertiary", "residential"],
      labelKinds: ["road", "station", "landmark", "public_building", "district", "start", "checkpoint", "finish"],
      backgroundKinds: ["park", "water", "pedestrian-area"],
      linearKinds: ["rail"],
      routeOverlayKinds: ["raw-route", "snapped-route"],
      objectiveMarkers: ["start", "checkpoint", "destination"],
      learnerOverlayStates: ["start-marker", "destination-marker", "upcoming-checkpoint"],
      restrictionSymbols: ["one-way", "restricted-turn"],
      decluttering: ["overview", "learner", "detail"]
    }
  },
  {
    id: "waterloo-bridge-thames-context-map",
    label: "Waterloo Bridge and Thames context map",
    description:
      "Curated real Overpass fixture for Thames water context, bridges, rail/stations, parks, labels, and learner overlay readability.",
    contextTags: ["bridges-river-crossings", "parks-open-spaces", "rail-station-context"],
    mapId: "osm-curated-waterloo-bridge",
    fixtureName: "waterlooBridgeOverpass.json",
    exerciseId: "osm-curated-waterloo-bridge-visual-qa-route",
    comparisonModeIds: ["phase-6-street-atlas", "learner-route-overlay", "route-review-readability"],
    viewport: {
      center: { x: 0, y: 0 },
      bounds: { minX: -1638.116401, minY: -869.647632, maxX: 1638.116401, maxY: 869.554833 },
      zoom: 1.3,
      declutterTier: "learner"
    },
    expected: {
      phase6Layers: [
        "land-background",
        "water",
        "parks-open-spaces",
        "rail",
        "bridges-crossings",
        "stations",
        "road-casings",
        "road-fills",
        "road-hierarchy",
        "street-labels",
        "one-way-arrows",
        "restriction-symbols",
        "start-destination-markers",
        "checkpoints"
      ],
      roadHierarchies: ["primary", "tertiary", "residential"],
      labelKinds: ["road", "water", "bridge", "station", "start", "checkpoint", "finish"],
      backgroundKinds: ["park", "water", "pedestrian-area"],
      linearKinds: ["rail", "waterway", "bridge"],
      routeOverlayKinds: ["raw-route", "snapped-route"],
      objectiveMarkers: ["start", "checkpoint", "destination"],
      learnerOverlayStates: ["start-marker", "destination-marker", "upcoming-checkpoint"],
      restrictionSymbols: ["one-way", "restricted-turn"],
      decluttering: ["overview", "learner", "detail"]
    }
  },
  {
    id: "one-way-system-restriction-map",
    label: "One-way system and restriction map",
    description:
      "Curated real Overpass fixture for one-way-heavy streets, turn-restriction relations, symbol decluttering, and review readability.",
    contextTags: ["awkward-complex-junctions", "learner-route-review-overlays"],
    mapId: "osm-curated-one-way-system-area",
    fixtureName: "oneWaySystemAreaOverpass.json",
    exerciseId: "osm-curated-one-way-system-area-visual-qa-route",
    comparisonModeIds: ["phase-6-street-atlas", "learner-route-overlay", "route-review-readability"],
    viewport: {
      center: { x: 0, y: 0 },
      bounds: { minX: -1520.429435, minY: -841.327998, maxX: 1520.429435, maxY: 841.241127 },
      zoom: 1.4,
      declutterTier: "learner"
    },
    expected: {
      phase6Layers: [
        "land-background",
        "parks-open-spaces",
        "rail",
        "stations",
        "road-casings",
        "road-fills",
        "road-hierarchy",
        "street-labels",
        "one-way-arrows",
        "restriction-symbols",
        "start-destination-markers",
        "checkpoints"
      ],
      roadHierarchies: ["primary", "secondary", "tertiary", "residential"],
      labelKinds: ["road", "station", "landmark", "start", "checkpoint", "finish"],
      backgroundKinds: ["park", "water", "pedestrian-area"],
      linearKinds: ["rail"],
      routeOverlayKinds: ["raw-route", "snapped-route"],
      objectiveMarkers: ["start", "checkpoint", "destination"],
      learnerOverlayStates: ["start-marker", "destination-marker", "upcoming-checkpoint", "restricted-manoeuvre-warning"],
      restrictionSymbols: ["one-way", "restricted-turn", "review-warning"],
      decluttering: ["overview", "learner", "detail"]
    }
  },
  {
    id: "quiet-residential-learner-map",
    label: "Quiet residential learner map",
    description:
      "Curated real Overpass fixture for quieter residential road hierarchy, suburban labels, parks/water, and phone readability.",
    contextTags: ["estates-residential-blocks", "mobile-tablet-readability"],
    mapId: "osm-curated-quiet-residential-roads",
    fixtureName: "quietResidentialRoadsOverpass.json",
    exerciseId: "osm-curated-quiet-residential-roads-visual-qa-route",
    comparisonModeIds: ["phase-6-street-atlas", "learner-route-overlay"],
    viewport: {
      center: { x: 0, y: -0.13505 },
      bounds: { minX: -1606.919113, minY: -1483.159211, maxX: 1606.919113, maxY: 1482.889111 },
      zoom: 1.25,
      declutterTier: "learner"
    },
    expected: {
      phase6Layers: [
        "land-background",
        "water",
        "parks-open-spaces",
        "road-casings",
        "road-fills",
        "road-hierarchy",
        "street-labels",
        "one-way-arrows",
        "start-destination-markers",
        "checkpoints"
      ],
      roadHierarchies: ["primary", "secondary", "tertiary", "residential"],
      labelKinds: ["road", "water", "landmark", "start", "checkpoint", "finish"],
      backgroundKinds: ["park", "water"],
      linearKinds: ["waterway"],
      routeOverlayKinds: ["raw-route", "snapped-route"],
      objectiveMarkers: ["start", "checkpoint", "destination"],
      learnerOverlayStates: ["start-marker", "destination-marker", "upcoming-checkpoint"],
      restrictionSymbols: ["one-way", "restricted-turn"],
      decluttering: ["overview", "learner", "detail"]
    }
  }
];

export const REAL_LONDON_RESPONSIVE_VISUAL_SCENARIOS: RealLondonResponsiveVisualScenario[] = [
  {
    id: "mobile-dense-central-readability",
    label: "Mobile dense central readability",
    description:
      "Small portrait viewport for checking dense roads, label thinning, and map-first readability without side panels.",
    baseScenarioId: "dense-central-readability",
    viewportId: "small-mobile-portrait",
    comparisonModeIds: ["plain-route-graph", "phase-6-street-atlas"],
    expected: {
      requiresMapFirstLayout: true,
      requiresTouchDrawing: true,
      requiresCollapsedPanels: true,
      requiresMinTapTargetPx: 44,
      categories: ["roads-by-hierarchy", "street-labels", "decluttering-tier", "legend-attribution"]
    }
  },
  {
    id: "mobile-route-drawing",
    label: "Mobile route drawing",
    description:
      "Large portrait phone viewport with route drawing controls, objective markers, checkpoints, and hints visible above the map.",
    baseScenarioId: "learner-route-overlay-review",
    viewportId: "large-mobile-portrait",
    comparisonModeIds: ["learner-route-overlay"],
    expected: {
      requiresMapFirstLayout: true,
      requiresTouchDrawing: true,
      requiresCollapsedPanels: true,
      requiresMinTapTargetPx: 44,
      categories: [
        "roads-by-hierarchy",
        "route-overlays",
        "start-destination-markers",
        "checkpoints",
        "hints",
        "decluttering-tier"
      ]
    }
  },
  {
    id: "mobile-route-review",
    label: "Mobile route review",
    description:
      "Portrait phone review state preserving warning callouts, route issues, checkpoints, and restrictions after submission.",
    baseScenarioId: "learner-route-overlay-review",
    viewportId: "small-mobile-portrait",
    comparisonModeIds: ["route-review-readability"],
    expected: {
      requiresMapFirstLayout: true,
      requiresTouchDrawing: true,
      requiresCollapsedPanels: true,
      requiresMinTapTargetPx: 44,
      categories: [
        "route-overlays",
        "review-callouts",
        "start-destination-markers",
        "checkpoints",
        "restriction-symbols",
        "decluttering-tier"
      ]
    }
  },
  {
    id: "mobile-one-way-restriction-declutter",
    label: "Mobile one-way and restriction declutter",
    description:
      "Narrow phone viewport for one-way-heavy local streets where normal restrictions thin out but review-critical symbols remain.",
    baseScenarioId: "one-way-restriction-declutter",
    viewportId: "narrow-embedded-map",
    comparisonModeIds: ["phase-6-street-atlas", "route-review-readability"],
    expected: {
      requiresMapFirstLayout: true,
      requiresTouchDrawing: true,
      requiresCollapsedPanels: true,
      requiresMinTapTargetPx: 44,
      categories: ["one-way-symbols", "restriction-symbols", "review-callouts", "decluttering-tier"]
    }
  },
  {
    id: "mobile-marker-hint-collision",
    label: "Mobile marker and hint collision",
    description:
      "Phone portrait fixture for checking that objective markers, hint dots, and review warnings reserve enough label space.",
    baseScenarioId: "learner-route-overlay-review",
    viewportId: "large-mobile-portrait",
    comparisonModeIds: ["learner-route-overlay", "route-review-readability"],
    expected: {
      requiresMapFirstLayout: true,
      requiresTouchDrawing: true,
      requiresCollapsedPanels: true,
      requiresMinTapTargetPx: 44,
      categories: [
        "street-labels",
        "start-destination-markers",
        "checkpoints",
        "hints",
        "review-callouts",
        "decluttering-tier"
      ]
    }
  },
  {
    id: "tablet-portrait-learner-overlays",
    label: "Tablet portrait learner overlays",
    description:
      "Tablet portrait viewport for checking larger map area, route overlays, objectives, hints, and context labels together.",
    baseScenarioId: "learner-route-overlay-review",
    viewportId: "tablet-portrait",
    comparisonModeIds: ["learner-route-overlay"],
    expected: {
      requiresMapFirstLayout: true,
      requiresTouchDrawing: true,
      requiresCollapsedPanels: true,
      requiresMinTapTargetPx: 44,
      categories: [
        "roads-by-hierarchy",
        "context-labels",
        "route-overlays",
        "start-destination-markers",
        "checkpoints",
        "hints",
        "decluttering-tier"
      ]
    }
  },
  {
    id: "tablet-landscape-review-panels",
    label: "Tablet landscape review panels",
    description:
      "Tablet landscape viewport for checking route review overlays with map controls and summary panels sharing horizontal space.",
    baseScenarioId: "complete-phase-6-stack-integration",
    viewportId: "tablet-landscape",
    comparisonModeIds: ["route-review-readability"],
    expected: {
      requiresMapFirstLayout: true,
      requiresTouchDrawing: true,
      requiresCollapsedPanels: false,
      requiresMinTapTargetPx: 44,
      categories: [
        "roads-by-hierarchy",
        "context-labels",
        "route-overlays",
        "review-callouts",
        "restriction-symbols",
        "legend-attribution",
        "decluttering-tier"
      ]
    }
  },
  {
    id: "tablet-context-orientation",
    label: "Tablet context orientation",
    description:
      "Tablet landscape context viewport for park, water, rail, station, landmark, and area-name readability.",
    baseScenarioId: "park-water-rail-station-context",
    viewportId: "tablet-landscape",
    comparisonModeIds: ["phase-6-street-atlas"],
    expected: {
      requiresMapFirstLayout: true,
      requiresTouchDrawing: true,
      requiresCollapsedPanels: false,
      requiresMinTapTargetPx: 44,
      categories: ["roads-by-hierarchy", "context-labels", "street-labels", "decluttering-tier", "legend-attribution"]
    }
  }
];

export const REAL_LONDON_PHASE_6_RELEASE_CANDIDATE_GATE: RealLondonPhase6ReleaseCandidateGate = {
  id: "phase-6-final-visual-rc-gate",
  label: "Phase 6 final visual regression and release-candidate gate",
  status: "ready-for-final-learner-review",
  validationCommands: ["npm.cmd run lint", "npm.cmd run test:map", "npm.cmd run build", "git diff --check"],
  requiredZoomTiers: ["overview", "learner", "detail"],
  requiredContextTags: [
    "dense-central-streets",
    "major-road-side-street-hierarchy",
    "bridges-river-crossings",
    "parks-open-spaces",
    "estates-residential-blocks",
    "high-streets",
    "awkward-complex-junctions",
    "rail-station-context",
    "landmark-area-name-context",
    "learner-route-review-overlays",
    "mobile-tablet-readability"
  ],
  requiredScenarioIds: [
    "dense-central-low-zoom-overview",
    "dense-central-readability",
    "high-street-side-street-readability",
    "estate-residential-blocks",
    "park-open-space-edge",
    "bridge-river-crossing-review",
    "awkward-junction-restriction-review",
    "rail-station-interchange-context",
    "landmark-area-high-zoom",
    "learner-route-overlay-review",
    "complete-phase-6-stack-integration"
  ],
  requiredResponsiveScenarioIds: [
    "mobile-dense-central-readability",
    "mobile-route-drawing",
    "mobile-route-review",
    "mobile-one-way-restriction-declutter",
    "mobile-marker-hint-collision",
    "tablet-portrait-learner-overlays",
    "tablet-landscape-review-panels",
    "tablet-context-orientation"
  ],
  finalLayerStack: FINAL_PHASE_6_REAL_LONDON_LAYER_STACK,
  mustPreserve: [
    "low, medium, and high zoom readability",
    "road hierarchy and street label decluttering",
    "parks, water, rail, station, bridge, landmark, and area context",
    "one-way and restriction cartography",
    "learner route overlays, markers, checkpoints, hints, warnings, and review callouts",
    "mobile and tablet readability"
  ],
  mustNotChange: [
    "route logic",
    "legality checks",
    "scoring",
    "exercise generation",
    "beta gates",
    "feedback tooling",
    "OSM conversion behaviour",
    "route engine behaviour"
  ]
};

export const STAGE_160_TOPOPASS_ATLAS_IDENTITY_FIXTURES: Stage160AtlasIdentityFixture[] = [
  {
    category: "dense-central",
    label: "Dense Central London atlas readability",
    scenarioId: "dense-central-readability",
    designFocus: ["low-contrast land", "major-road hierarchy", "street-label decluttering"]
  },
  {
    category: "major-road-side-streets",
    label: "Major road with side-street network",
    scenarioId: "major-road-side-street-hierarchy",
    designFocus: ["primary-road casing", "secondary-road separation", "quiet local streets"]
  },
  {
    category: "high-street",
    label: "High street typography and hierarchy",
    scenarioId: "high-street-side-street-readability",
    designFocus: ["high-street labels", "medium-zoom casing", "one-way subtlety"]
  },
  {
    category: "suburban-estate",
    label: "Suburban estate local-road quietness",
    scenarioId: "estate-residential-blocks",
    designFocus: ["local-road texture", "service-road quietness", "area-name context"]
  },
  {
    category: "park-edge",
    label: "Park edge and open-space context",
    scenarioId: "park-open-space-edge",
    designFocus: ["park wash", "water context", "roads above background polygons"]
  },
  {
    category: "thames-bridge-proxy",
    label: "Thames bridge-style crossing context",
    scenarioId: "bridge-river-crossing-review",
    designFocus: ["water crossing legibility", "bridge label hierarchy", "review restrictions above context"]
  },
  {
    category: "rail-station-heavy",
    label: "Rail and station-heavy orientation",
    scenarioId: "rail-station-interchange-context",
    designFocus: ["rail line restraint", "station marker clarity", "transport labels below learner overlays"]
  },
  {
    category: "awkward-junction",
    label: "Awkward junction decision readability",
    scenarioId: "awkward-junction-restriction-review",
    designFocus: ["junction casing clarity", "restriction marker priority", "review warning separation"]
  },
  {
    category: "one-way-system",
    label: "One-way system decluttering",
    scenarioId: "one-way-restriction-declutter",
    designFocus: ["one-way arrow spacing", "restriction collision filtering", "overview zoom quietness"]
  },
  {
    category: "learner-review-mistakes",
    label: "Learner route review with mistakes",
    scenarioId: "learner-route-overlay-review",
    designFocus: ["attempted route", "correct route", "illegal and missed-checkpoint callouts"]
  },
  {
    category: "mobile-viewport",
    label: "Mobile atlas readability",
    scenarioId: "dense-central-readability",
    responsiveScenarioId: "mobile-dense-central-readability",
    designFocus: ["mobile label thinning", "44 px touch targets", "map-first viewport"]
  }
];

export function getRealLondonVisualReadabilityScenario(
  scenarioId: RealLondonVisualReadabilityScenarioId
): RealLondonVisualReadabilityScenario | undefined {
  return REAL_LONDON_VISUAL_READABILITY_SCENARIOS.find((scenario) => scenario.id === scenarioId);
}

export function getRealLondonResponsiveVisualScenario(
  scenarioId: RealLondonResponsiveVisualScenarioId
): RealLondonResponsiveVisualScenario | undefined {
  return REAL_LONDON_RESPONSIVE_VISUAL_SCENARIOS.find((scenario) => scenario.id === scenarioId);
}

export function buildRealLondonVisualComparisonScenarioSummary() {
  return {
    mapId: phase6RealLondonVisualQaRouteMap.id,
    fixtureName: PHASE_6_VISUAL_QA_FIXTURE_NAME,
    comparisonModeIds: REAL_LONDON_VISUAL_COMPARISON_MODES.map((mode) => mode.id),
    scenarioIds: REAL_LONDON_VISUAL_READABILITY_SCENARIOS.map((scenario) => scenario.id),
    responsiveViewportIds: REAL_LONDON_RESPONSIVE_VISUAL_VIEWPORTS.map((viewport) => viewport.id),
    responsiveScenarioIds: REAL_LONDON_RESPONSIVE_VISUAL_SCENARIOS.map((scenario) => scenario.id),
    stage160AtlasIdentityFixtureCategories: STAGE_160_TOPOPASS_ATLAS_IDENTITY_FIXTURES.map((fixture) => fixture.category),
    stage160AtlasIdentityScenarioIds: STAGE_160_TOPOPASS_ATLAS_IDENTITY_FIXTURES.map((fixture) => fixture.scenarioId),
    viewportBounds: qaMapBounds,
    finalPhase6LayerStack: FINAL_PHASE_6_REAL_LONDON_LAYER_STACK,
    releaseCandidateGateId: REAL_LONDON_PHASE_6_RELEASE_CANDIDATE_GATE.id,
    releaseCandidateStatus: REAL_LONDON_PHASE_6_RELEASE_CANDIDATE_GATE.status,
    releaseCandidateRequiredContextTags: REAL_LONDON_PHASE_6_RELEASE_CANDIDATE_GATE.requiredContextTags,
    exerciseId: qaExercise?.id ?? null,
    synthetic: true
  };
}
