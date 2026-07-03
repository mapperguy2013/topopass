import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  createDrawnRouteTrace,
  findShortestLegalRouteThroughStops,
  runDrawnRoutePipeline,
  type MapDefinition,
  type MapGraph,
  type MapRoad,
  type RouteExercise,
  type Vec2
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
  waterlooBridgeOsmRouteExercises,
  waterlooBridgeOsmRoutePreflight
} from "./curatedRealLondonRouteRunnerMaps.ts";
import {
  buildCuratedFixtureConnectivityDiagnostics,
  buildCuratedFixtureRoutableExercise
} from "./curatedFixtureRoutabilityGate.ts";
import {
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap
} from "./routeRunnerMaps.ts";

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

test("Stage 161.4 curated and real pilot generated routes submit through drawn-route matching and scoring", () => {
  const realPilotExercise = requireExercise(realLondonOsmPilotRouteExercises, "osm-real-pilot-checkpoint-route");
  const realPilotGraph = buildMapGraph(realLondonOsmPilotRouteMap);
  const realPilotRoute = findShortestLegalRouteThroughStops({
    graph: realPilotGraph,
    stopNodeIds: nodeStopIds(realPilotExercise),
    restrictions: realLondonOsmPilotRouteMap.restrictions
  });

  assert.equal(realPilotRoute.found, true, realPilotExercise.id);

  const cases = [
    ...CURATED_PREFLIGHT_CASES.map((fixtureCase) => ({
      id: fixtureCase.id,
      map: fixtureCase.map,
      exercises: [fixtureCase.preflight.exercise],
      exercise: fixtureCase.preflight.exercise,
      routeNodeIds: fixtureCase.preflight.routeNodeIds
    })),
    {
      id: "real-london-pilot",
      map: realLondonOsmPilotRouteMap,
      exercises: realLondonOsmPilotRouteExercises,
      exercise: realPilotExercise,
      routeNodeIds: realPilotRoute.nodeIds
    }
  ];

  for (const fixtureCase of cases) {
    assert.ok(fixtureCase.exercise, fixtureCase.id);

    const graph = buildMapGraph(fixtureCase.map);
    const result = runDrawnRoutePipeline({
      map: fixtureCase.map,
      exercises: fixtureCase.exercises.filter((exercise): exercise is RouteExercise => Boolean(exercise)),
      exerciseId: fixtureCase.exercise.id,
      drawnTrace: createDrawnRouteTrace(pointsForNodeIds(graph, fixtureCase.routeNodeIds)),
      options: {
        maximumSnapDistance: 24
      }
    });

    assert.equal(result.status, "scored", `${fixtureCase.id}: ${result.warnings.map((warning) => warning.code).join(",")}`);
    assert.equal(result.matchResult?.status, "matched", fixtureCase.id);
    assert.equal(result.exerciseResult?.score.passed, true, fixtureCase.id);
    assert.equal(result.exerciseResult?.score.scorePercent, 100, fixtureCase.id);
    assert.deepEqual(result.exerciseResult?.score.failureReasons, [], fixtureCase.id);

    for (const stopNodeId of nodeStopIds(fixtureCase.exercise)) {
      assert.ok(result.exerciseResult.normalisedAttempt.selectedNodeIds.includes(stopNodeId), `${fixtureCase.id}: ${stopNodeId}`);
    }
  }
});

test("Stage 161.4 curated Waterloo matching tolerates normal drawn-route wobble", () => {
  const exercise = waterlooBridgeOsmRoutePreflight.exercise;

  assert.ok(exercise);

  const graph = buildMapGraph(waterlooBridgeOsmRouteMap);
  const wobbledPoints = pointsForNodeIds(graph, waterlooBridgeOsmRoutePreflight.routeNodeIds).map((point, index) => ({
    x: point.x + (index % 2 === 0 ? 1.4 : -1.1),
    y: point.y + (index % 3 === 0 ? 1.2 : -0.9)
  }));
  const result = runDrawnRoutePipeline({
    map: waterlooBridgeOsmRouteMap,
    exercises: waterlooBridgeOsmRouteExercises,
    exerciseId: exercise.id,
    drawnTrace: createDrawnRouteTrace(wobbledPoints),
    options: {
      maximumSnapDistance: 24
    }
  });

  assert.equal(result.status, "scored", result.warnings.map((warning) => warning.message).join("\n"));
  assert.equal(result.matchResult?.status, "matched");
  assert.equal(result.exerciseResult?.score.passed, true);
  assert.equal(result.exerciseResult?.score.scorePercent, 100);
  assert.ok(result.warnings.some((warning) => warning.code === "osm_simplification_retry"));
});

test("Stage 161.4 curated one-way matching still rejects genuinely wrong-way submit attempts", () => {
  const graph = buildMapGraph(oneWaySystemAreaOsmRouteMap);
  const oneWayRoad = findLongestOneWayRoad(oneWaySystemAreaOsmRouteMap);
  const exercise: RouteExercise = {
    id: "stage-161-4-wrong-way-submit",
    title: "Stage 161.4 wrong-way submit",
    mapId: oneWaySystemAreaOsmRouteMap.id,
    stops: [
      { type: "node", nodeId: oneWayRoad.toNodeId },
      { type: "node", nodeId: oneWayRoad.fromNodeId }
    ]
  };
  const result = runDrawnRoutePipeline({
    map: oneWaySystemAreaOsmRouteMap,
    exercises: [exercise],
    exerciseId: exercise.id,
    drawnTrace: createDrawnRouteTrace(reverseRoadPoints(graph, oneWayRoad)),
    options: {
      maximumSnapDistance: 8,
      simplifyTolerance: 0
    }
  });

  assert.equal(result.status, "scored");
  assert.equal(result.matchResult?.status, "matched");
  assert.equal(result.exerciseResult?.score.passed, false);
  assert.deepEqual(result.exerciseResult?.score.failureReasons, ["illegal_route"]);
  assert.ok(
    result.exerciseResult?.score.legality.illegalMovements.some(
      (movement) => movement.type === "wrong_way_one_way"
    )
  );
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

function requireExercise(exercises: readonly RouteExercise[], exerciseId: string): RouteExercise {
  const exercise = exercises.find((candidate) => candidate.id === exerciseId);

  assert.ok(exercise, exerciseId);

  return exercise;
}

function nodeStopIds(exercise: RouteExercise): string[] {
  return exercise.stops.map((stop) => {
    assert.equal(stop.type, "node", `${exercise.id} should use node stops`);

    return stop.nodeId;
  });
}

function pointsForNodeIds(graph: MapGraph, nodeIds: readonly string[]): Vec2[] {
  return nodeIds.map((nodeId) => {
    const node = graph.nodesById[nodeId];

    assert.ok(node, nodeId);

    return { x: node.x, y: node.y };
  });
}

function findLongestOneWayRoad(map: MapDefinition): MapRoad {
  const road = [...map.roads]
    .filter((candidate) => candidate.isOneWay)
    .sort((left, right) => right.distanceMeters - left.distanceMeters || left.id.localeCompare(right.id))[0];

  assert.ok(road, `${map.id} should include a one-way road`);

  return road;
}

function reverseRoadPoints(graph: MapGraph, road: MapRoad): Vec2[] {
  const fromNode = graph.nodesById[road.fromNodeId];
  const toNode = graph.nodesById[road.toNodeId];

  assert.ok(fromNode);
  assert.ok(toNode);

  return [0.88, 0.5, 0.12].map((ratio) => ({
    x: fromNode.x + (toNode.x - fromNode.x) * ratio,
    y: fromNode.y + (toNode.y - fromNode.y) * ratio
  }));
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
