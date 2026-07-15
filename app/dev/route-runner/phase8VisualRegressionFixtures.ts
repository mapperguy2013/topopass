import {
  CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS,
  KINGS_CROSS_EUSTON_OSM_MAP_ID,
  VICTORIA_WESTMINSTER_VAUXHALL_OSM_MAP_ID
} from "./curatedRealLondonRouteRunnerMaps.ts";

export type Phase8VisualRegressionState =
  | "neutral"
  | "active-route"
  | "hint"
  | "correct-review"
  | "incorrect-review";

export type Phase8VisualRegressionRouteSeed = "none" | "shortest" | "incomplete-shortest";
export type Phase8VisualRegressionScrollTarget = "none" | "map" | "feedback";

export type Phase8VisualRegressionFixture = {
  id: string;
  description: string;
  mapId: string;
  exerciseId: string | null;
  state: Phase8VisualRegressionState;
  routeSeed: Phase8VisualRegressionRouteSeed;
  openFeedback: boolean;
  scrollTarget: Phase8VisualRegressionScrollTarget;
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: 1;
  };
  protects: readonly string[];
};

export const PHASE8_VISUAL_REGRESSION_BROWSER = {
  engine: "chromium",
  colorScheme: "light",
  reducedMotion: "reduce",
  locale: "en-GB",
  timezone: "Europe/London"
} as const;

function defaultExerciseId(mapId: string): string | null {
  return (
    CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS.find((option) => option.id === mapId)?.defaultExerciseId || null
  );
}

const PICCADILLY_CIRCUS_MAP_ID = "osm-curated-piccadilly-circus";
const WATERLOO_BRIDGE_MAP_ID = "osm-curated-waterloo-bridge";
const QUIET_RESIDENTIAL_MAP_ID = "osm-curated-quiet-residential-roads";

export const PHASE8_VISUAL_REGRESSION_FIXTURES: readonly Phase8VisualRegressionFixture[] = [
  {
    id: "victoria-neutral-desktop",
    description: "Dense Victoria, Westminster, Pimlico, Vauxhall, Lambeth and Thames context at the principal view.",
    mapId: VICTORIA_WESTMINSTER_VAUXHALL_OSM_MAP_ID,
    exerciseId: null,
    state: "neutral",
    routeSeed: "none",
    openFeedback: false,
    scrollTarget: "none",
    viewport: { width: 1440, height: 900, devicePixelRatio: 1 },
    protects: ["dense buildings", "local-road labels", "major-road hierarchy", "A/B references", "district context"]
  },
  {
    id: "kings-cross-correct-review-desktop",
    description: "King's Cross and Euston A501 corridor with a correctly submitted learner route and review.",
    mapId: KINGS_CROSS_EUSTON_OSM_MAP_ID,
    exerciseId: null,
    state: "correct-review",
    routeSeed: "shortest",
    openFeedback: true,
    scrollTarget: "none",
    viewport: { width: 1440, height: 900, devicePixelRatio: 1 },
    protects: ["A501 geometry", "road references", "learner route", "correct review", "coordinate alignment"]
  },
  {
    id: "piccadilly-active-route-desktop",
    description: "Dense Piccadilly junctions with an active learner route above the base map.",
    mapId: PICCADILLY_CIRCUS_MAP_ID,
    exerciseId: defaultExerciseId(PICCADILLY_CIRCUS_MAP_ID),
    state: "active-route",
    routeSeed: "shortest",
    openFeedback: false,
    scrollTarget: "none",
    viewport: { width: 1440, height: 900, devicePixelRatio: 1 },
    protects: ["dense junctions", "active learner route", "markers", "overlay ordering"]
  },
  {
    id: "waterloo-context-tablet",
    description: "Waterloo and Thames context at portrait-tablet dimensions.",
    mapId: WATERLOO_BRIDGE_MAP_ID,
    exerciseId: defaultExerciseId(WATERLOO_BRIDGE_MAP_ID),
    state: "neutral",
    routeSeed: "none",
    openFeedback: false,
    scrollTarget: "none",
    viewport: { width: 768, height: 1024, devicePixelRatio: 1 },
    protects: ["water", "bridges", "rail context", "tablet layout", "attribution"]
  },
  {
    id: "waterloo-incorrect-review-mobile",
    description: "Incomplete source-backed Waterloo route with needs-review feedback on mobile.",
    mapId: WATERLOO_BRIDGE_MAP_ID,
    exerciseId: defaultExerciseId(WATERLOO_BRIDGE_MAP_ID),
    state: "incorrect-review",
    routeSeed: "incomplete-shortest",
    openFeedback: true,
    scrollTarget: "feedback",
    viewport: { width: 390, height: 844, devicePixelRatio: 1 },
    protects: ["incorrect review", "mistake overlay", "mobile feedback", "map-first layout"]
  },
  {
    id: "piccadilly-hint-mobile",
    description: "Compact learner-training hint above the Piccadilly map on mobile.",
    mapId: PICCADILLY_CIRCUS_MAP_ID,
    exerciseId: defaultExerciseId(PICCADILLY_CIRCUS_MAP_ID),
    state: "hint",
    routeSeed: "none",
    openFeedback: false,
    scrollTarget: "none",
    viewport: { width: 390, height: 844, devicePixelRatio: 1 },
    protects: ["hint presentation", "mobile safe area", "map visibility", "responsive overlay hierarchy"]
  },
  {
    id: "quiet-residential-mobile",
    description: "Quiet residential local-road and building context on mobile.",
    mapId: QUIET_RESIDENTIAL_MAP_ID,
    exerciseId: defaultExerciseId(QUIET_RESIDENTIAL_MAP_ID),
    state: "neutral",
    routeSeed: "none",
    openFeedback: false,
    scrollTarget: "map",
    viewport: { width: 390, height: 844, devicePixelRatio: 1 },
    protects: ["local roads", "compact labels", "building context", "mobile density"]
  }
] as const;

export function getPhase8VisualRegressionFixture(
  fixtureId: string
): Phase8VisualRegressionFixture | null {
  return PHASE8_VISUAL_REGRESSION_FIXTURES.find((fixture) => fixture.id === fixtureId) ?? null;
}

export function phase8VisualRegressionHintText(): string {
  return "Use the map's road names and junction shape to plan the next legal movement.";
}
