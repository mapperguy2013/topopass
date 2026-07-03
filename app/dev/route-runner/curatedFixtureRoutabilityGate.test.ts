import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  type MapDefinition,
  type MapRoad,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import oneWaySystemAreaOverpassFixture from "../../../lib/map-engine/osm/fixtures/oneWaySystemAreaOverpass.json" with { type: "json" };
import piccadillyCircusOverpassFixture from "../../../lib/map-engine/osm/fixtures/piccadillyCircusOverpass.json" with { type: "json" };
import quietResidentialRoadsOverpassFixture from "../../../lib/map-engine/osm/fixtures/quietResidentialRoadsOverpass.json" with { type: "json" };
import waterlooBridgeOverpassFixture from "../../../lib/map-engine/osm/fixtures/waterlooBridgeOverpass.json" with { type: "json" };
import { validateExerciseReachability } from "./exerciseValidation.ts";
import {
  CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS,
  oneWaySystemAreaOsmRouteMap,
  oneWaySystemAreaOsmRoutePreflight,
  piccadillyCircusOsmRouteMap,
  piccadillyCircusOsmRoutePreflight,
  quietResidentialRoadsOsmRouteMap,
  quietResidentialRoadsOsmRoutePreflight,
  waterlooBridgeOsmRouteMap,
  waterlooBridgeOsmRoutePreflight
} from "./curatedRealLondonRouteRunnerMaps.ts";
import {
  buildCuratedFixtureConnectivityDiagnostics,
  buildCuratedFixtureRoutableExercise
} from "./curatedFixtureRoutabilityGate.ts";

type RoadWithOsmMetadata = MapRoad & {
  metadata?: {
    highway?: string;
  };
};

const CURATED_PREFLIGHT_CASES = [
  {
    id: "piccadilly-circus",
    map: piccadillyCircusOsmRouteMap,
    fixture: piccadillyCircusOverpassFixture,
    preflight: piccadillyCircusOsmRoutePreflight,
    minTurnRestrictions: 10,
    requiredHighways: ["primary", "secondary", "residential"]
  },
  {
    id: "waterloo-bridge",
    map: waterlooBridgeOsmRouteMap,
    fixture: waterlooBridgeOverpassFixture,
    preflight: waterlooBridgeOsmRoutePreflight,
    minTurnRestrictions: 40,
    requiredHighways: ["primary", "residential", "service"]
  },
  {
    id: "one-way-system-area",
    map: oneWaySystemAreaOsmRouteMap,
    fixture: oneWaySystemAreaOverpassFixture,
    preflight: oneWaySystemAreaOsmRoutePreflight,
    minTurnRestrictions: 50,
    requiredHighways: ["primary", "secondary", "tertiary", "residential"]
  },
  {
    id: "quiet-residential-roads",
    map: quietResidentialRoadsOsmRouteMap,
    fixture: quietResidentialRoadsOverpassFixture,
    preflight: quietResidentialRoadsOsmRoutePreflight,
    minTurnRestrictions: 10,
    requiredHighways: ["primary", "tertiary", "residential"]
  }
] as const;

const DRIVABLE_ANCHOR_HIGHWAYS = new Set(["primary", "secondary", "tertiary", "residential", "living_street", "unclassified"]);
const UNSAFE_ANCHOR_HIGHWAYS = new Set(["service", "track", "footway", "cycleway", "path", "pedestrian", "steps"]);

test("Stage 160.6 curated fixture preflight builds legal routable exercises for selected London fixtures", () => {
  for (const fixtureCase of CURATED_PREFLIGHT_CASES) {
    assert.equal(fixtureCase.preflight.ok, true, fixtureCase.id);
    assert.equal(fixtureCase.preflight.fixtureUse, "routableExercise", fixtureCase.id);
    assert.equal(fixtureCase.preflight.failureReason, null, fixtureCase.id);
    assert.ok(fixtureCase.preflight.exercise, fixtureCase.id);
    assert.ok(fixtureCase.preflight.shortestRouteDistanceMeters && fixtureCase.preflight.shortestRouteDistanceMeters > 0, fixtureCase.id);
    assert.ok(fixtureCase.preflight.routeNodeIds.length >= 2, fixtureCase.id);
    assert.ok(fixtureCase.preflight.routeRoadIds.length >= 1, fixtureCase.id);

    const availability = validateExerciseReachability({
      map: fixtureCase.map,
      exercise: fixtureCase.preflight.exercise
    });

    assert.equal(availability.isValid, true, `${fixtureCase.id}: ${availability.errors.join("; ")}`);
    assert.equal(availability.missingLegs.length, 0, fixtureCase.id);
  }
});

test("Stage 160.6 curated fixture diagnostics report graph coverage and selected route legality", () => {
  for (const fixtureCase of CURATED_PREFLIGHT_CASES) {
    const diagnostics = buildCuratedFixtureConnectivityDiagnostics({
      map: fixtureCase.map,
      sourceOverpassFixture: fixtureCase.fixture,
      selectedExercise: fixtureCase.preflight.exercise ?? undefined
    });

    assert.ok(diagnostics.routableNodeCount > 0, fixtureCase.id);
    assert.ok(diagnostics.routableEdgeCount > 0, fixtureCase.id);
    assert.ok(diagnostics.connectedComponentCount >= 1, fixtureCase.id);
    assert.ok(diagnostics.largestConnectedComponentSize > 0, fixtureCase.id);
    assert.ok(diagnostics.namedRoadCount > 0, fixtureCase.id);
    assert.ok(diagnostics.oneWayEdgeCount > 0, fixtureCase.id);
    assert.ok(diagnostics.sourceTurnRestrictionRelationCount >= fixtureCase.minTurnRestrictions, fixtureCase.id);
    assert.equal(
      diagnostics.turnRestrictionCount,
      fixtureCase.map.restrictions.filter((restriction) => restriction.type === "prohibited_turn").length,
      fixtureCase.id
    );
    assert.equal(diagnostics.blockedDirectedEdgeCount, 0, fixtureCase.id);
    assert.equal(diagnostics.selectedRouteHasLegalPath, true, fixtureCase.id);
    assert.equal(diagnostics.selectedStopsOnSameRoutableComponent, true, fixtureCase.id);
    assert.equal(diagnostics.selectedStopNodeIds.length, fixtureCase.preflight.exercise?.stops.length, fixtureCase.id);

    for (const highway of fixtureCase.requiredHighways) {
      assert.ok((diagnostics.highwayClassCounts[highway] ?? 0) > 0, `${fixtureCase.id} highway=${highway}`);
    }
  }
});

test("Stage 160.6 route-runner options expose fixture use without pulling curated fixtures into production maps", () => {
  assert.equal(CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS.length, CURATED_PREFLIGHT_CASES.length);

  for (const fixtureCase of CURATED_PREFLIGHT_CASES) {
    const option = CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS.find((candidate) => candidate.map.id === fixtureCase.map.id);

    assert.ok(option, fixtureCase.id);
    assert.equal(option.devOnly, true, fixtureCase.id);
    assert.equal(option.fixtureUse, fixtureCase.preflight.fixtureUse, fixtureCase.id);
    assert.equal(option.defaultExerciseId, fixtureCase.preflight.exercise?.id, fixtureCase.id);
    assert.deepEqual(
      option.exercises.map((exercise) => exercise.id),
      fixtureCase.preflight.exercise ? [fixtureCase.preflight.exercise.id] : [],
      fixtureCase.id
    );
  }
});

test("Stage 160.6 generated exercise anchors stay on preferred drivable roads", () => {
  for (const fixtureCase of CURATED_PREFLIGHT_CASES) {
    const exercise = fixtureCase.preflight.exercise;

    assert.ok(exercise, fixtureCase.id);

    const firstStop = exercise.stops[0];
    const lastStop = exercise.stops.at(-1);

    assert.ok(firstStop?.type === "node", fixtureCase.id);
    assert.ok(lastStop?.type === "node", fixtureCase.id);

    assertAnchorHighways(fixtureCase.map, firstStop.nodeId, fixtureCase.id);
    assertAnchorHighways(fixtureCase.map, lastStop.nodeId, fixtureCase.id);
  }
});

test("Stage 160.6 disconnected fixtures are kept visual QA only instead of inventing a route", () => {
  const result = buildCuratedFixtureRoutableExercise({
    map: disconnectedFixtureMap(),
    id: "disconnected-fixture-route",
    title: "Disconnected fixture route",
    description: "Should not be generated.",
    difficulty: "easy",
    minimumStraightLineDistanceMeters: 1
  });

  assert.equal(result.ok, false);
  assert.equal(result.fixtureUse, "visualQaOnly");
  assert.equal(result.exercise, null);
  assert.ok(result.failureReason === "clipped-fixture-boundary" || result.failureReason === "one-way-or-restriction-blocked-route");
});

test("Stage 160.6 route diagnostics flag selected stops on different routable components", () => {
  const map = disconnectedFixtureMap();
  const exercise: RouteExercise = {
    id: "cross-component-selected-route",
    title: "Cross component selected route",
    mapId: map.id,
    stops: [
      { type: "node", nodeId: "a" },
      { type: "node", nodeId: "d" }
    ]
  };
  const diagnostics = buildCuratedFixtureConnectivityDiagnostics({
    map,
    selectedExercise: exercise
  });

  assert.equal(diagnostics.connectedComponentCount, 2);
  assert.equal(diagnostics.selectedStopsOnSameRoutableComponent, false);
  assert.equal(diagnostics.selectedRouteHasLegalPath, false);
  assert.equal(diagnostics.selectedRouteFailureReason, "stops-on-different-components");
});

function assertAnchorHighways(map: MapDefinition, nodeId: string, message: string): void {
  const graph = buildMapGraph(map);
  const incidentHighways = [
    ...(graph.outgoingEdgesByNodeId[nodeId] ?? []),
    ...(graph.incomingEdgesByNodeId[nodeId] ?? [])
  ].flatMap((edge) => {
    const road = graph.roadsById[edge.roadId] as RoadWithOsmMetadata | undefined;
    const highway = road?.metadata?.highway;

    return highway ? [highway] : [];
  });

  assert.ok(incidentHighways.some((highway) => DRIVABLE_ANCHOR_HIGHWAYS.has(highway)), message);
  assert.equal(incidentHighways.every((highway) => !UNSAFE_ANCHOR_HIGHWAYS.has(highway)), true, message);
}

function disconnectedFixtureMap(): MapDefinition {
  return {
    id: "disconnected-stage-160-6-map",
    name: "Disconnected Stage 160.6 Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 },
      { id: "c", x: 400, y: 0 },
      { id: "d", x: 500, y: 0 }
    ],
    roads: [
      osmRoad("ab", "a", "b", "First Road"),
      osmRoad("cd", "c", "d", "Second Road")
    ],
    restrictions: [],
    landmarks: []
  };
}

function osmRoad(id: string, fromNodeId: string, toNodeId: string, name: string): MapRoad {
  return {
    id,
    fromNodeId,
    toNodeId,
    distanceMeters: 100,
    isOneWay: false,
    name,
    metadata: {
      source: "osm",
      highway: "residential",
      rawTags: { highway: "residential", name }
    }
  } as MapRoad;
}
