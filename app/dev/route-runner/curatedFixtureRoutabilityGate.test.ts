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
  oneWaySystemAreaOsmRoutePreflights,
  piccadillyCircusOsmRouteMap,
  piccadillyCircusOsmRoutePreflight,
  piccadillyCircusOsmRoutePreflights,
  quietResidentialRoadsOsmRouteMap,
  quietResidentialRoadsOsmRoutePreflight,
  quietResidentialRoadsOsmRoutePreflights,
  waterlooBridgeOsmRouteMap,
  waterlooBridgeOsmRouteExercises,
  waterlooBridgeOsmRoutePreflight,
  waterlooBridgeOsmRoutePreflights
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
    preflights: piccadillyCircusOsmRoutePreflights,
    minTurnRestrictions: 10,
    requiredHighways: ["primary", "secondary", "residential"]
  },
  {
    id: "waterloo-bridge",
    map: waterlooBridgeOsmRouteMap,
    fixture: waterlooBridgeOverpassFixture,
    preflight: waterlooBridgeOsmRoutePreflight,
    preflights: waterlooBridgeOsmRoutePreflights,
    minTurnRestrictions: 40,
    requiredHighways: ["primary", "residential", "service"]
  },
  {
    id: "one-way-system-area",
    map: oneWaySystemAreaOsmRouteMap,
    fixture: oneWaySystemAreaOverpassFixture,
    preflight: oneWaySystemAreaOsmRoutePreflight,
    preflights: oneWaySystemAreaOsmRoutePreflights,
    minTurnRestrictions: 50,
    requiredHighways: ["primary", "secondary", "tertiary", "residential"]
  },
  {
    id: "quiet-residential-roads",
    map: quietResidentialRoadsOsmRouteMap,
    fixture: quietResidentialRoadsOverpassFixture,
    preflight: quietResidentialRoadsOsmRoutePreflight,
    preflights: quietResidentialRoadsOsmRoutePreflights,
    minTurnRestrictions: 10,
    requiredHighways: ["primary", "tertiary", "residential"]
  }
] as const;

const DRIVABLE_ANCHOR_HIGHWAYS = new Set(["primary", "secondary", "tertiary", "residential", "living_street", "unclassified"]);
const UNSAFE_ANCHOR_HIGHWAYS = new Set(["service", "track", "footway", "cycleway", "path", "pedestrian", "steps"]);
const CRICKLEWOOD_REGRESSION_STOP_NODE_IDS = [
  "osm-node-5222445789",
  "osm-node-13120968904",
  "osm-node-623044867"
];
const CRICKLEWOOD_LISTED_ROUTE_ROAD_IDS = `
osm-way-50218080-segment-0 osm-way-50218080-segment-1 osm-way-50218080-segment-2
osm-way-50218080-segment-3 osm-way-50218080-segment-4 osm-way-50218080-segment-5
osm-way-50218080-segment-6 osm-way-50218080-segment-7 osm-way-50218080-segment-8
osm-way-50218080-segment-9 osm-way-50218080-segment-10 osm-way-50218080-segment-11
osm-way-50218080-segment-12 osm-way-50218080-segment-13 osm-way-50218080-segment-14
osm-way-50218080-segment-15 osm-way-115413465-segment-0 osm-way-50218080-segment-16
osm-way-50218080-segment-17 osm-way-50218080-segment-18 osm-way-50218080-segment-19
osm-way-1429930538-segment-0 osm-way-1429930538-segment-1 osm-way-1429930538-segment-2
osm-way-1429930538-segment-3 osm-way-1429930537-segment-0 osm-way-1429930536-segment-0
osm-way-1429930537-segment-1 osm-way-1429930537-segment-2 osm-way-1429930537-segment-3
osm-way-97667228-segment-0 osm-way-1429930537-segment-4 osm-way-4270165-segment-15
osm-way-1429930537-segment-5 osm-way-1315615233-segment-0 osm-way-1315615233-segment-1
osm-way-1315615233-segment-2 osm-way-368996212-segment-0 osm-way-1315615232-segment-0
osm-way-1315615232-segment-1 osm-way-1315615232-segment-2 osm-way-1315615232-segment-3
osm-way-1427274398-segment-0 osm-way-1427284617-segment-0 osm-way-4364748-segment-0
osm-way-1427284617-segment-1 osm-way-1427284617-segment-2 osm-way-1427284617-segment-3
osm-way-1427284617-segment-4 osm-way-1427284616-segment-0 osm-way-1427284616-segment-1
osm-way-1427284616-segment-2 osm-way-1427284616-segment-3 osm-way-1427284616-segment-4
osm-way-97715618-segment-0 osm-way-97715618-segment-1 osm-way-97715618-segment-2
osm-way-97715618-segment-3 osm-way-97715618-segment-4 osm-way-97715618-segment-5
osm-way-97715618-segment-6 osm-way-97715618-segment-7 osm-way-97715618-segment-8
osm-way-97715618-segment-9 osm-way-960868086-segment-0 osm-way-960868086-segment-1
osm-way-960868086-segment-2 osm-way-960868086-segment-3 osm-way-960974643-segment-0
osm-way-960974643-segment-1 osm-way-960974643-segment-2 osm-way-960974643-segment-3
osm-way-960974643-segment-4 osm-way-960974643-segment-5 osm-way-960974643-segment-6
osm-way-960974643-segment-7 osm-way-960974643-segment-8 osm-way-960974643-segment-9
osm-way-960974643-segment-10 osm-way-960974643-segment-11 osm-way-960974643-segment-12
osm-way-960974643-segment-13 osm-way-960974643-segment-14 osm-way-960974643-segment-15
osm-way-960974643-segment-16 osm-way-960974643-segment-17 osm-way-960974643-segment-18
osm-way-960974643-segment-19 osm-way-960974643-segment-20 osm-way-960974643-segment-21
osm-way-960974643-segment-22 osm-way-960974643-segment-23 osm-way-960974643-segment-24
osm-way-960974643-segment-25 osm-way-960974643-segment-26 osm-way-960974643-segment-27
osm-way-960974643-segment-28 osm-way-960974643-segment-29 osm-way-960974643-segment-30
osm-way-960974643-segment-31 osm-way-960974643-segment-32 osm-way-960974643-segment-33
osm-way-960974643-segment-34 osm-way-960974643-segment-35 osm-way-960974643-segment-36
osm-way-960974643-segment-37 osm-way-960974643-segment-38
`.match(/osm-way-\d+-segment-\d+/g) ?? [];

test("Stage 160.6 curated fixture preflight builds legal routable exercises for selected London fixtures", () => {
  for (const fixtureCase of CURATED_PREFLIGHT_CASES) {
    assert.equal(fixtureCase.preflights.length, 3, fixtureCase.id);

    for (const preflight of fixtureCase.preflights) {
      assert.equal(preflight.ok, true, `${fixtureCase.id}: ${preflight.exercise?.id ?? "missing"}`);
      assert.equal(preflight.fixtureUse, "routableExercise", fixtureCase.id);
      assert.equal(preflight.failureReason, null, fixtureCase.id);
      assert.ok(preflight.exercise, fixtureCase.id);
      assert.ok(preflight.shortestRouteDistanceMeters && preflight.shortestRouteDistanceMeters > 0, fixtureCase.id);
      assert.ok(preflight.routeNodeIds.length >= 2, fixtureCase.id);
      assert.ok(preflight.routeRoadIds.length >= 1, fixtureCase.id);

      const availability = validateExerciseReachability({
        map: fixtureCase.map,
        exercise: preflight.exercise
      });

      assert.equal(availability.isValid, true, `${fixtureCase.id}: ${availability.errors.join("; ")}`);
      assert.equal(availability.missingLegs.length, 0, fixtureCase.id);
    }
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
    ...CURATED_PREFLIGHT_CASES.flatMap((fixtureCase) =>
      fixtureCase.preflights.map((preflight) => ({
        id: `${fixtureCase.id}:${preflight.exercise?.id ?? "missing"}`,
        map: fixtureCase.map,
        exercises: fixtureCase.preflights.flatMap((candidate) => (candidate.exercise ? [candidate.exercise] : [])),
        exercise: preflight.exercise,
        routeNodeIds: preflight.routeNodeIds
      }))
    ),
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

test("Stage 161.4.1 Cricklewood sparse submit reaches scoring across split OSM ways", () => {
  const graph = buildMapGraph(quietResidentialRoadsOsmRouteMap);
  const route = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds: CRICKLEWOOD_REGRESSION_STOP_NODE_IDS,
    restrictions: quietResidentialRoadsOsmRouteMap.restrictions
  });

  assert.equal(route.found, true);
  if (!route.found) {
    return;
  }

  for (const roadId of CRICKLEWOOD_LISTED_ROUTE_ROAD_IDS) {
    assert.ok(graph.roadsById[roadId], roadId);
  }

  const exercise: RouteExercise = {
    id: "stage-161-4-1-cricklewood-submit-regression",
    title: "Stage 161.4.1 Cricklewood submit regression",
    mapId: quietResidentialRoadsOsmRouteMap.id,
    stops: CRICKLEWOOD_REGRESSION_STOP_NODE_IDS.map((nodeId) => ({ type: "node", nodeId }))
  };
  const result = runDrawnRoutePipeline({
    map: quietResidentialRoadsOsmRouteMap,
    exercises: [exercise],
    exerciseId: exercise.id,
    drawnTrace: createDrawnRouteTrace(
      sparsePointsForRouteNodeIds(graph, route.nodeIds, CRICKLEWOOD_REGRESSION_STOP_NODE_IDS, 8)
    ),
    options: {
      maximumSnapDistance: 24
    }
  });

  assert.equal(result.status, "scored", result.warnings.map((warning) => warning.message).join("\n"));
  assert.equal(result.matchResult?.status, "matched");
  assert.equal(result.exerciseResult?.score.passed, true);
  assert.equal(result.exerciseResult?.score.scorePercent, 100);
  assert.deepEqual(result.exerciseResult?.score.failureReasons, []);
  assert.ok(result.warnings.some((warning) => warning.code === "osm_sparse_connector_retry"));

  for (const stopNodeId of CRICKLEWOOD_REGRESSION_STOP_NODE_IDS) {
    assert.ok(result.exerciseResult.normalisedAttempt.selectedNodeIds.includes(stopNodeId), stopNodeId);
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
      fixtureCase.preflights.flatMap((preflight) => (preflight.exercise ? [preflight.exercise.id] : [])),
      fixtureCase.id
    );
    assert.equal(option.exercises.length, 3, fixtureCase.id);
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

function sparsePointsForRouteNodeIds(
  graph: MapGraph,
  routeNodeIds: readonly string[],
  requiredStopNodeIds: readonly string[],
  step: number
): Vec2[] {
  const routeIndexes = new Set<number>([0, routeNodeIds.length - 1]);

  for (const stopNodeId of requiredStopNodeIds) {
    const stopIndex = routeNodeIds.indexOf(stopNodeId);

    if (stopIndex >= 0) {
      routeIndexes.add(stopIndex);
    }
  }

  for (let index = 0; index < routeNodeIds.length; index += step) {
    routeIndexes.add(index);
  }

  return pointsForNodeIds(
    graph,
    [...routeIndexes].sort((left, right) => left - right).map((index) => routeNodeIds[index])
  );
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
