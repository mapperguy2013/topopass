import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBlockedDirectedEdgeKeys,
  buildMapGraph,
  directedEdgeKey,
  validateDirectedEdgePath,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import { buildFastestRouteOverlay, createHiddenFastestRouteRevealState, toggleFastestRouteReveal } from "./fastestRouteOverlay.ts";
import { validateExerciseReachability, validateExerciseReachabilityList } from "./exerciseValidation.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRouteRunnerMapBounds,
  getRouteRunnerMapOption,
  isConvertedOsmRouteRunnerMap,
  routeRunnerMapCenter,
  tinyLondonOsmRouteExercises,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import { buildSyntheticMapLabels, buildSyntheticRoadVisuals, deriveSyntheticRoadClass } from "./syntheticStreetMapRenderer.ts";

test("route runner map catalogue keeps the synthetic map as the default", () => {
  const defaultOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.ok(defaultOption);
  assert.equal(defaultOption.source, "synthetic-dev");
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.ok(defaultOption.exercises.length > 0);
});

test("converted OSM fixture loads as a selectable route-runner MapDefinition", () => {
  const osmOption = ROUTE_RUNNER_MAP_OPTIONS.find((option) => option.source === "converted-osm");

  assert.ok(osmOption);
  assert.equal(osmOption.map.id, tinyLondonOsmRouteMap.id);
  assert.equal(osmOption.defaultExerciseId, tinyLondonOsmRouteExercises[0].id);
  assert.ok(isConvertedOsmRouteRunnerMap(osmOption));
  assert.ok(osmOption.map.nodes.length > 0);
  assert.ok(osmOption.map.roads.length > 0);
  assert.ok(osmOption.exercises.every((exercise) => exercise.mapId === osmOption.map.id));
  assert.deepEqual(
    osmOption.exercises.map((exercise) => exercise.id),
    [
      "osm-tiny-kings-cross-to-argyle",
      "osm-tiny-kings-cross-via-junction",
      "osm-tiny-roundabout-loop",
      "osm-tiny-roundabout-to-argyle",
      "osm-tiny-stable-yard-lane"
    ]
  );
});

test("converted OSM exercises only appear when the converted OSM map is selected", () => {
  const syntheticOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const osmOption = ROUTE_RUNNER_MAP_OPTIONS.find((option) => option.source === "converted-osm");

  assert.ok(syntheticOption);
  assert.ok(osmOption);
  assert.equal(syntheticOption.source, "synthetic-dev");
  assert.equal(osmOption.source, "converted-osm");
  assert.ok(syntheticOption.exercises.every((exercise) => !exercise.id.startsWith("osm-")));
  assert.ok(osmOption.exercises.every((exercise) => exercise.id.startsWith("osm-")));
});

test("converted OSM map exposes drawable and snappable road geometry", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const firstRoad = tinyLondonOsmRouteMap.roads[0];

  assert.ok(firstRoad);
  assert.ok(graph.roadsById[firstRoad.id]);
  assert.ok(graph.nodesById[firstRoad.fromNodeId]);
  assert.ok(graph.nodesById[firstRoad.toNodeId]);
  assert.ok(graph.edges.some((edge) => edge.roadId === firstRoad.id));
});

test("converted OSM map bounds and centre are deterministic", () => {
  assert.deepEqual(getRouteRunnerMapBounds(tinyLondonOsmRouteMap), {
    minX: -252.762931,
    minY: -178.112,
    maxX: 252.762931,
    maxY: 178.112
  });
  assert.deepEqual(routeRunnerMapCenter(tinyLondonOsmRouteMap), {
    x: 0,
    y: 0
  });
});

test("converted OSM labels and road classes use preserved OSM metadata", () => {
  const visuals = buildSyntheticRoadVisuals(tinyLondonOsmRouteMap);
  const labels = buildSyntheticMapLabels(tinyLondonOsmRouteMap, tinyLondonOsmRouteExercises[0]);
  const primaryRoad = tinyLondonOsmRouteMap.roads.find((road) => road.name === "King's Cross Road");
  const serviceRoad = tinyLondonOsmRouteMap.roads.find((road) => road.name === "Stable Yard Lane");

  assert.ok(primaryRoad);
  assert.ok(serviceRoad);
  assert.equal(deriveSyntheticRoadClass(tinyLondonOsmRouteMap, primaryRoad), "major");
  assert.equal(deriveSyntheticRoadClass(tinyLondonOsmRouteMap, serviceRoad), "service");
  assert.ok(visuals.some((visual) => visual.name === "King's Cross Road"));
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "King's Cross Road"));
});

test("converted OSM fastest-route reveal uses existing legal shortest-route logic", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const revealState = toggleFastestRouteReveal(createHiddenFastestRouteRevealState());
  const overlay = buildFastestRouteOverlay({
    map: tinyLondonOsmRouteMap,
    exercise: tinyLondonOsmRouteExercises[0],
    revealState,
    graph
  });

  assert.equal(overlay.status, "available");
  assert.deepEqual(overlay.nodeIds, [
    "osm-node-1001",
    "osm-node-1002",
    "osm-node-1003",
    "osm-node-1004",
    "osm-node-1005"
  ]);
  assert.ok(overlay.roadIds.every((roadId) => roadId.startsWith("osm-way-")));
  assert.ok(overlay.points.length >= 2);
});

test("every converted OSM exercise uses valid converted graph nodes", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);

  for (const exercise of tinyLondonOsmRouteExercises) {
    assert.equal(exercise.mapId, tinyLondonOsmRouteMap.id, exercise.id);
    assert.ok(exercise.stops.length >= 2, exercise.id);

    for (const stop of exercise.stops) {
      assert.equal(stop.type, "node", `${exercise.id} should use stable converted OSM node stops`);
      assert.ok(graph.nodesById[stop.nodeId], `${exercise.id} references missing node ${stop.nodeId}`);
      assert.ok(
        (graph.outgoingEdgesByNodeId[stop.nodeId]?.length ?? 0) > 0 ||
          (graph.incomingEdgesByNodeId[stop.nodeId]?.length ?? 0) > 0,
        `${exercise.id} stop ${stop.nodeId} is not attached to a converted road edge`
      );
    }
  }
});

test("every converted OSM exercise is legally solvable through its required stops", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const availabilities = validateExerciseReachabilityList({
    map: tinyLondonOsmRouteMap,
    exercises: tinyLondonOsmRouteExercises,
    graph
  });

  assert.equal(availabilities.length, tinyLondonOsmRouteExercises.length);

  for (const availability of availabilities) {
    assert.equal(availability.isValid, true, `${availability.exerciseId}: ${availability.errors.join("; ")}`);
    assert.ok(availability.shortestRouteDistanceMeters && availability.shortestRouteDistanceMeters > 0);
    assert.equal(availability.missingLegs.length, 0, availability.exerciseId);
  }
});

test("reveal fastest route returns a validated legal route for every converted OSM exercise", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, tinyLondonOsmRouteMap.restrictions);

  for (const exercise of tinyLondonOsmRouteExercises) {
    const overlay = buildFastestRouteOverlay({
      map: tinyLondonOsmRouteMap,
      exercise,
      revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
      graph
    });

    assert.equal(overlay.status, "available", `${exercise.id}: ${overlay.message ?? "no route"}`);
    assert.ok(overlay.edgeIds.length > 0, exercise.id);

    const routeValidation = validateDirectedEdgePath({
      graph,
      edgeIds: overlay.edgeIds,
      restrictions: tinyLondonOsmRouteMap.restrictions
    });

    assert.equal(routeValidation.valid, true, `${exercise.id}: ${routeValidation.invalidEdgeKeys.join(", ")}`);

    for (const edgeId of overlay.edgeIds) {
      const edge = graph.edgesById[edgeId];

      assert.ok(edge, `${exercise.id} returned unknown edge ${edgeId}`);
      assert.equal(blockedEdgeKeys.has(directedEdgeKey(edge)), false, `${exercise.id} used blocked edge ${edgeId}`);

      const road = graph.roadsById[edge.roadId];

      if (road?.isOneWay) {
        assert.equal(edge.direction, "forward", `${exercise.id} used illegal reverse one-way edge ${edgeId}`);
      }
    }
  }
});

test("converted OSM one-way exercise is solvable only in the legal imported direction", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const exercise = tinyLondonOsmRouteExercises.find(
    (candidate) => candidate.id === "osm-tiny-roundabout-to-argyle"
  );

  assert.ok(exercise);

  const overlay = buildFastestRouteOverlay({
    map: tinyLondonOsmRouteMap,
    exercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });

  assert.equal(overlay.status, "available");
  assert.ok(overlay.roadIds.includes("osm-way-2004-segment-2"));
  assert.ok(overlay.roadIds.includes("osm-way-2003-segment-0"));
  assert.deepEqual(overlay.nodeIds, ["osm-node-1008", "osm-node-1006", "osm-node-1005"]);
});

test("converted OSM one-way restrictions prevent illegal reverse fastest-route reveal", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const reverseExercise: RouteExercise = {
    id: "osm-reverse-one-way-test",
    title: "Reverse one-way test",
    mapId: tinyLondonOsmRouteMap.id,
    stops: [
      { type: "node" as const, nodeId: "osm-node-1005" },
      { type: "node" as const, nodeId: "osm-node-1003" }
    ]
  };
  const overlay = buildFastestRouteOverlay({
    map: tinyLondonOsmRouteMap,
    exercise: reverseExercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });

  assert.equal(overlay.status, "unavailable");
  assert.match(overlay.message ?? "", /No legal fastest route/);
});

test("invalid converted OSM exercise fixtures fail solvability validation", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const invalidExercise: RouteExercise = {
    id: "osm-invalid-unreachable-test",
    title: "Invalid unreachable OSM test",
    mapId: tinyLondonOsmRouteMap.id,
    stops: [
      { type: "node", nodeId: "osm-node-1001" },
      { type: "node", nodeId: "osm-node-1010" }
    ]
  };
  const availability = validateExerciseReachability({
    map: tinyLondonOsmRouteMap,
    exercise: invalidExercise,
    graph
  });
  const overlay = buildFastestRouteOverlay({
    map: tinyLondonOsmRouteMap,
    exercise: invalidExercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph,
    availability
  });

  assert.equal(availability.isValid, false);
  assert.ok(availability.errors.some((error) => error.includes("No legal route")));
  assert.equal(overlay.status, "unavailable");
});
