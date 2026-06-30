import type { ExerciseDifficulty, ExerciseWeakAreaTag } from "./exerciseMapMetadata.ts";

export type RealisticSyntheticExerciseScenarioId =
  | "central-grid"
  | "one-way-heavy"
  | "no-entry-heavy"
  | "prohibited-turn"
  | "restricted-road"
  | "checkpoint-order"
  | "efficiency-trap"
  | "mixed-difficulty";

export type RealisticSyntheticExerciseScenarioTag =
  | "general-planning"
  | "no-entry-recognition"
  | "one-way-direction"
  | "prohibited-turns"
  | "restricted-roads"
  | "checkpoints"
  | "route-continuity"
  | "route-efficiency";

export type RealisticSyntheticMapBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type RealisticSyntheticExerciseScenario = {
  id: RealisticSyntheticExerciseScenarioId;
  exerciseId: string;
  title: string;
  areaLabel: string;
  difficulty: ExerciseDifficulty;
  scenarioTags: RealisticSyntheticExerciseScenarioTag[];
  weakAreaTags: ExerciseWeakAreaTag[];
  featuredRoadNames: string[];
  restrictionSummary: string[];
  exerciseRules: string[];
  estimatedShortestDistanceMeters?: number;
  renderer: {
    mapBounds: RealisticSyntheticMapBounds;
    visualBackground: "marlowe-district-soft-context";
    routeRunnerRenderer: "synthetic-street-map";
  };
};

export const MARLOWE_SYNTHETIC_MAP_BOUNDS: RealisticSyntheticMapBounds = {
  minX: 0,
  minY: 55,
  maxX: 755,
  maxY: 610
};

export const REALISTIC_SYNTHETIC_EXERCISE_SCENARIOS: RealisticSyntheticExerciseScenario[] = [
  {
    id: "central-grid",
    exerciseId: "ex-central-grid-library-clocktower",
    title: "Central grid planning",
    areaLabel: "Market Quarter",
    difficulty: "intro",
    scenarioTags: ["general-planning", "no-entry-recognition", "one-way-direction"],
    weakAreaTags: ["no-entry", "one-way", "inefficient-route"],
    featuredRoadNames: ["Library Mews", "Market Lane West", "Market Lane East"],
    restrictionSummary: [
      "Market Lane West blocks westbound no-entry movement.",
      "Library Mews and Market Lane East are one-way approaches."
    ],
    exerciseRules: ["Start at Westbourne Library.", "Visit Marlowe Market Hall.", "Finish at Marlowe Clocktower."],
    estimatedShortestDistanceMeters: 429,
    renderer: createMarloweRendererMetadata()
  },
  {
    id: "one-way-heavy",
    exerciseId: "ex-one-way-canal-station",
    title: "One-way direction discipline",
    areaLabel: "Canal and Clocktower approaches",
    difficulty: "medium",
    scenarioTags: ["one-way-direction", "route-continuity"],
    weakAreaTags: ["one-way", "wrong-destination", "inefficient-route"],
    featuredRoadNames: ["Canal Road East", "Clocktower Avenue", "Station Row"],
    restrictionSummary: [
      "Canal Road East is one-way toward Canal Bridge East.",
      "Clocktower Avenue carries one-way traffic toward Clocktower."
    ],
    exerciseRules: ["Start at Canal Bridge West.", "Follow legal one-way direction.", "Finish at Fox Lane Station."],
    estimatedShortestDistanceMeters: 542,
    renderer: createMarloweRendererMetadata()
  },
  {
    id: "no-entry-heavy",
    exerciseId: "ex-no-entry-eastgate-market",
    title: "No-entry recognition",
    areaLabel: "Eastgate and Station approaches",
    difficulty: "hard",
    scenarioTags: ["no-entry-recognition", "one-way-direction", "route-efficiency"],
    weakAreaTags: ["no-entry", "one-way", "inefficient-route"],
    featuredRoadNames: ["Station Row", "Market Lane West", "Eastgate Street", "Museum Cut"],
    restrictionSummary: [
      "Station Row blocks westbound no-entry movement from Station Approach.",
      "Market Lane West blocks westbound no-entry movement from Market Cross."
    ],
    exerciseRules: ["Start at Eastgate.", "Avoid no-entry shortcuts.", "Finish at Marlowe Market Hall."],
    renderer: createMarloweRendererMetadata()
  },
  {
    id: "prohibited-turn",
    exerciseId: "ex-prohibited-turn-albion-theatre",
    title: "Prohibited turn recognition",
    areaLabel: "Albion Square to Theatre quarter",
    difficulty: "hard",
    scenarioTags: ["prohibited-turns", "route-continuity", "route-efficiency"],
    weakAreaTags: ["prohibited-turn", "inefficient-route", "wrong-destination"],
    featuredRoadNames: ["Baker Court", "Museum Cut", "Theatre Street", "Crown Road East"],
    restrictionSummary: [
      "Baker Court into Market Lane East is a prohibited turn.",
      "Museum Cut into Theatre Street is a prohibited turn."
    ],
    exerciseRules: ["Start at Albion Square.", "Respect banned turns at Market Cross and Civic Museum.", "Finish at Theatre Arcade."],
    estimatedShortestDistanceMeters: 859,
    renderer: createMarloweRendererMetadata()
  },
  {
    id: "restricted-road",
    exerciseId: "ex-restricted-station-south-gate",
    title: "Restricted-road awareness",
    areaLabel: "Station and South Gate",
    difficulty: "medium",
    scenarioTags: ["restricted-roads", "general-planning"],
    weakAreaTags: ["restricted-road", "wrong-destination", "inefficient-route"],
    featuredRoadNames: ["East Dock Spur", "Station Cut", "South Gate Road"],
    restrictionSummary: ["East Dock Spur is marked as a restricted local-access road in the visual layer."],
    exerciseRules: ["Start at Fox Lane Station.", "Watch for the amber restricted-road symbol.", "Finish at South Gate."],
    estimatedShortestDistanceMeters: 271,
    renderer: createMarloweRendererMetadata()
  },
  {
    id: "checkpoint-order",
    exerciseId: "ex-checkpoint-order-library-dock",
    title: "Ordered checkpoint route",
    areaLabel: "Market, museum, and dock corridor",
    difficulty: "hard",
    scenarioTags: ["checkpoints", "route-continuity", "no-entry-recognition"],
    weakAreaTags: ["missed-checkpoint", "wrong-start", "wrong-destination", "inefficient-route"],
    featuredRoadNames: ["Market Lane West", "Museum Cut", "Museum Lane", "Dock Road East"],
    restrictionSummary: [
      "The route has three ordered intermediate checkpoints.",
      "East Dock blocks westbound no-entry movement on Dock Road East."
    ],
    exerciseRules: [
      "Start at Westbourne Library.",
      "Visit Market Hall, Civic Museum, and Exchange House in order.",
      "Finish at East Dock."
    ],
    estimatedShortestDistanceMeters: 868,
    renderer: createMarloweRendererMetadata()
  },
  {
    id: "efficiency-trap",
    exerciseId: "ex-efficiency-trap-gardens-hospital",
    title: "Legal efficiency trap",
    areaLabel: "Royal Oak Gardens to Northgate",
    difficulty: "medium",
    scenarioTags: ["route-efficiency", "general-planning", "one-way-direction"],
    weakAreaTags: ["inefficient-route", "one-way", "wrong-destination"],
    featuredRoadNames: ["Garden Crescent East", "Market Lane West", "Eastgate Street", "Hospital Road"],
    restrictionSummary: [
      "Several legal detours around the canal and station area are much longer than the shortest route.",
      "Eastgate Street is one-way toward Eastgate."
    ],
    exerciseRules: ["Start at Royal Oak Gardens.", "Choose an efficient legal route.", "Finish at Northgate Hospital."],
    estimatedShortestDistanceMeters: 683,
    renderer: createMarloweRendererMetadata()
  },
  {
    id: "mixed-difficulty",
    exerciseId: "ex-mixed-difficulty-church-market-theatre-dock",
    title: "Mixed exam-style restriction route",
    areaLabel: "South district to East Dock",
    difficulty: "exam-style",
    scenarioTags: [
      "no-entry-recognition",
      "one-way-direction",
      "prohibited-turns",
      "restricted-roads",
      "checkpoints",
      "route-efficiency"
    ],
    weakAreaTags: ["missed-checkpoint", "no-entry", "one-way", "prohibited-turn", "restricted-road", "inefficient-route"],
    featuredRoadNames: ["Church Street", "Market Lane West", "Theatre Street", "Arcade Passage", "Dock Road East"],
    restrictionSummary: [
      "Combines ordered stops, one-way roads, no-entry roads, prohibited turns, and restricted-road symbols.",
      "East Dock blocks westbound no-entry movement on Dock Road East."
    ],
    exerciseRules: [
      "Start at St Anselm Church.",
      "Visit Market Hall, Theatre Arcade, and Exchange House in order.",
      "Finish at East Dock."
    ],
    estimatedShortestDistanceMeters: 1864,
    renderer: createMarloweRendererMetadata()
  }
];

export function getRealisticSyntheticScenarioForExercise(
  exerciseId: string
): RealisticSyntheticExerciseScenario | null {
  const scenario = REALISTIC_SYNTHETIC_EXERCISE_SCENARIOS.find((candidate) => candidate.exerciseId === exerciseId);

  return scenario ? cloneScenario(scenario) : null;
}

function createMarloweRendererMetadata(): RealisticSyntheticExerciseScenario["renderer"] {
  return {
    mapBounds: { ...MARLOWE_SYNTHETIC_MAP_BOUNDS },
    visualBackground: "marlowe-district-soft-context",
    routeRunnerRenderer: "synthetic-street-map"
  };
}

function cloneScenario(scenario: RealisticSyntheticExerciseScenario): RealisticSyntheticExerciseScenario {
  return {
    ...scenario,
    scenarioTags: [...scenario.scenarioTags],
    weakAreaTags: [...scenario.weakAreaTags],
    featuredRoadNames: [...scenario.featuredRoadNames],
    restrictionSummary: [...scenario.restrictionSummary],
    exerciseRules: [...scenario.exerciseRules],
    renderer: {
      ...scenario.renderer,
      mapBounds: { ...scenario.renderer.mapBounds }
    }
  };
}
