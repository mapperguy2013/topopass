import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBlockedDirectedEdgeKeys,
  buildMapGraph,
  directedEdgeKey,
  mapToScreenPoint,
  snapDrawnRouteToRoads,
  validateDirectedEdgePath,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import { buildFastestRouteOverlay, createHiddenFastestRouteRevealState, toggleFastestRouteReveal } from "./fastestRouteOverlay.ts";
import { validateExerciseReachability, validateExerciseReachabilityList } from "./exerciseValidation.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRouteRunnerMapBounds,
  getRouteRunnerMapFitBounds,
  getRouteRunnerMapFitPadding,
  getRouteRunnerMapViewportBounds,
  getRouteRunnerMapOption,
  isConvertedOsmRouteRunnerMap,
  largeLondonOsmRouteExercises,
  largeLondonOsmRouteMap,
  mediumLondonOsmRouteExercises,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  routeRunnerMapCenter,
  tinyLondonOsmRouteExercises,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import {
  buildSyntheticBackgroundFeatures,
  buildSyntheticLinearFeatures,
  buildSyntheticMapLabels,
  buildSyntheticRoadVisuals,
  deriveSyntheticRoadClass
} from "./syntheticStreetMapRenderer.ts";

const TEST_CANVAS_WIDTH = 1120;
const TEST_CANVAS_HEIGHT = 760;

function boundsWidth(bounds: { minX: number; maxX: number }): number {
  return bounds.maxX - bounds.minX;
}

function boundsHeight(bounds: { minY: number; maxY: number }): number {
  return bounds.maxY - bounds.minY;
}

function assertClose(actual: number, expected: number, epsilon = 0.000001): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be within ${epsilon} of ${expected}`);
}

function assertScreenPointInsideViewport(point: { x: number; y: number }, message: string): void {
  assert.ok(point.x >= -0.000001 && point.x <= TEST_CANVAS_WIDTH + 0.000001, `${message} x=${point.x}`);
  assert.ok(point.y >= -0.000001 && point.y <= TEST_CANVAS_HEIGHT + 0.000001, `${message} y=${point.y}`);
}

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
  const convertedOptions = ROUTE_RUNNER_MAP_OPTIONS.filter((option) => option.source === "converted-osm");
  const tinyOption = getRouteRunnerMapOption(tinyLondonOsmRouteMap.id);
  const mediumOption = getRouteRunnerMapOption(mediumLondonOsmRouteMap.id);
  const largeOption = getRouteRunnerMapOption(largeLondonOsmRouteMap.id);

  assert.ok(syntheticOption);
  assert.ok(tinyOption);
  assert.ok(mediumOption);
  assert.ok(largeOption);
  assert.ok(getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id));
  assert.equal(syntheticOption.source, "synthetic-dev");
  assert.equal(tinyOption.source, "converted-osm");
  assert.equal(mediumOption.source, "converted-osm");
  assert.equal(largeOption.source, "converted-osm");
  assert.equal(convertedOptions.length, 4);
  assert.ok(syntheticOption.exercises.every((exercise) => !exercise.id.startsWith("osm-")));
  assert.deepEqual(
    tinyOption.exercises.map((exercise) => exercise.id),
    tinyLondonOsmRouteExercises.map((exercise) => exercise.id)
  );
  assert.deepEqual(
    mediumOption.exercises.map((exercise) => exercise.id),
    mediumLondonOsmRouteExercises.map((exercise) => exercise.id)
  );
  assert.deepEqual(
    getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id)?.exercises.map((exercise) => exercise.id),
    realLondonOsmPilotRouteExercises.map((exercise) => exercise.id)
  );
  assert.deepEqual(
    largeOption.exercises.map((exercise) => exercise.id),
    largeLondonOsmRouteExercises.map((exercise) => exercise.id)
  );
  assert.ok(tinyOption.exercises.every((exercise) => exercise.id.startsWith("osm-tiny-")));
  assert.ok(mediumOption.exercises.every((exercise) => exercise.id.startsWith("osm-medium-")));
  assert.ok(
    getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id)?.exercises.every((exercise) =>
      exercise.id.startsWith("osm-real-")
    )
  );
  assert.ok(largeOption.exercises.every((exercise) => exercise.id.startsWith("osm-large-")));
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
  const center = routeRunnerMapCenter(tinyLondonOsmRouteMap);

  assert.deepEqual(getRouteRunnerMapBounds(tinyLondonOsmRouteMap), {
    minX: -406.316141,
    minY: -286.319882,
    maxX: 406.316141,
    maxY: 286.309819
  });
  assert.equal(center.x, 0);
  assertClose(center.y, -0.0050315);
});

test("larger converted OSM maps use a more comfortable first-load fit", () => {
  assert.equal(getRouteRunnerMapFitPadding(tinyLondonOsmRouteMap), 45);
  assert.equal(getRouteRunnerMapFitPadding(mediumLondonOsmRouteMap), 156.73784324000002);
  assert.deepEqual(getRouteRunnerMapFitBounds(mediumLondonOsmRouteMap), {
    minX: -512.96021424,
    minY: -478.84346524,
    maxX: 512.96021424,
    maxY: 478.83072924000004
  });
  assert.equal(getRouteRunnerMapFitPadding(realLondonOsmPilotRouteMap), 192.03839732000003);
  assert.deepEqual(getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap), {
    minX: -605.96322632,
    minY: -628.50099032,
    maxX: 605.96322632,
    maxY: 628.47761032
  });
  assert.equal(getRouteRunnerMapFitPadding(largeLondonOsmRouteMap), 440.82518347999996);
  assert.deepEqual(getRouteRunnerMapFitBounds(largeLondonOsmRouteMap), {
    minX: -1442.70060048,
    minY: -1156.5667154799999,
    maxX: 1442.70060048,
    maxY: 1156.50383848
  });
});

test("converted OSM viewport fit preserves aspect ratio with a uniform scale", () => {
  const viewportBounds = getRouteRunnerMapViewportBounds(
    realLondonOsmPilotRouteMap,
    TEST_CANVAS_WIDTH,
    TEST_CANVAS_HEIGHT
  );
  const viewportAspectRatio = TEST_CANVAS_WIDTH / TEST_CANVAS_HEIGHT;
  const mapAspectRatio = boundsWidth(viewportBounds) / boundsHeight(viewportBounds);
  const scaleX = TEST_CANVAS_WIDTH / boundsWidth(viewportBounds);
  const scaleY = TEST_CANVAS_HEIGHT / boundsHeight(viewportBounds);

  assertClose(mapAspectRatio, viewportAspectRatio);
  assertClose(scaleX, scaleY);
  assert.equal(boundsHeight(viewportBounds), boundsHeight(getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap)));
  assert.ok(boundsWidth(viewportBounds) > boundsWidth(getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap)));
});

test("synthetic default map keeps its existing first-load fit bounds", () => {
  const syntheticOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.ok(syntheticOption);
  assert.deepEqual(
    getRouteRunnerMapViewportBounds(syntheticOption.map, TEST_CANVAS_WIDTH, TEST_CANVAS_HEIGHT),
    getRouteRunnerMapFitBounds(syntheticOption.map)
  );
});

test("all route-runner maps render nodes inside sane first-load viewport bounds", () => {
  const maps = [
    tinyLondonOsmRouteMap,
    mediumLondonOsmRouteMap,
    realLondonOsmPilotRouteMap,
    largeLondonOsmRouteMap
  ];

  for (const map of maps) {
    const viewport = {
      width: TEST_CANVAS_WIDTH,
      height: TEST_CANVAS_HEIGHT,
      mapBounds: getRouteRunnerMapViewportBounds(map, TEST_CANVAS_WIDTH, TEST_CANVAS_HEIGHT)
    };

    for (const node of map.nodes) {
      assertScreenPointInsideViewport(mapToScreenPoint(node, viewport), `${map.id}:${node.id}`);
    }
  }
});

test("converted OSM labels and road classes use preserved OSM metadata", () => {
  const visuals = buildSyntheticRoadVisuals(tinyLondonOsmRouteMap);
  const labels = buildSyntheticMapLabels(tinyLondonOsmRouteMap, tinyLondonOsmRouteExercises[0], {
    includeOsmRoadLabels: true
  });
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

test("medium converted OSM fixture is selectable without replacing existing maps", () => {
  const mediumOption = getRouteRunnerMapOption(mediumLondonOsmRouteMap.id);
  const tinyOption = getRouteRunnerMapOption(tinyLondonOsmRouteMap.id);
  const realOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);
  const syntheticOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.ok(mediumOption);
  assert.ok(tinyOption);
  assert.ok(realOption);
  assert.ok(syntheticOption);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.equal(mediumOption.source, "converted-osm");
  assert.ok(isConvertedOsmRouteRunnerMap(mediumOption));
  assert.equal(mediumOption.defaultExerciseId, mediumLondonOsmRouteExercises[0].id);
  assert.equal(mediumOption.map.id, mediumLondonOsmRouteMap.id);
  assert.equal(tinyOption.map.id, tinyLondonOsmRouteMap.id);
  assert.equal(realOption.map.id, realLondonOsmPilotRouteMap.id);
  assert.equal(realOption.defaultExerciseId, realLondonOsmPilotRouteExercises[0].id);
  assert.equal(realOption.fixtureName, "realLondonPilotOverpass.json");
});

test("medium converted OSM fixture is larger than tiny but compact for dev tests", () => {
  assert.ok(mediumLondonOsmRouteMap.nodes.length > tinyLondonOsmRouteMap.nodes.length);
  assert.ok(mediumLondonOsmRouteMap.roads.length > tinyLondonOsmRouteMap.roads.length);
  assert.equal(mediumLondonOsmRouteMap.nodes.length, 25);
  assert.equal(mediumLondonOsmRouteMap.roads.length, 48);
  assert.ok(mediumLondonOsmRouteMap.nodes.length <= 60);
  assert.ok(mediumLondonOsmRouteMap.roads.length <= 120);
});

test("large converted OSM fixture is larger than medium while staying test-sized", () => {
  assert.ok(largeLondonOsmRouteMap.nodes.length > mediumLondonOsmRouteMap.nodes.length);
  assert.ok(largeLondonOsmRouteMap.roads.length > mediumLondonOsmRouteMap.roads.length);
  assert.equal(largeLondonOsmRouteMap.nodes.length, 63);
  assert.equal(largeLondonOsmRouteMap.roads.length, 122);
  assert.ok(largeLondonOsmRouteMap.nodes.length <= 150);
  assert.ok(largeLondonOsmRouteMap.roads.length <= 250);
});

test("medium converted OSM map exposes drawable and snappable road geometry", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const eustonRoad = mediumLondonOsmRouteMap.roads.find((road) => road.name === "Euston Road");
  const tavistockRoad = mediumLondonOsmRouteMap.roads.find((road) => road.name === "Tavistock Place");

  assert.ok(eustonRoad);
  assert.ok(tavistockRoad);
  assert.ok(graph.roadsById[eustonRoad.id]);
  assert.ok(graph.nodesById[eustonRoad.fromNodeId]);
  assert.ok(graph.nodesById[eustonRoad.toNodeId]);
  assert.equal(tavistockRoad.isOneWay, true);
  assert.ok(graph.edges.some((edge) => edge.roadId === eustonRoad.id));
});

test("medium converted OSM labels and road classes use preserved OSM metadata", () => {
  const visuals = buildSyntheticRoadVisuals(mediumLondonOsmRouteMap);
  const labels = buildSyntheticMapLabels(mediumLondonOsmRouteMap, mediumLondonOsmRouteExercises[0], {
    includeOsmRoadLabels: true
  });
  const eustonRoad = mediumLondonOsmRouteMap.roads.find((road) => road.name === "Euston Road");
  const storeStreet = mediumLondonOsmRouteMap.roads.find((road) => road.name === "Store Street");

  assert.ok(eustonRoad);
  assert.ok(storeStreet);
  assert.equal(deriveSyntheticRoadClass(mediumLondonOsmRouteMap, eustonRoad), "major");
  assert.equal(deriveSyntheticRoadClass(mediumLondonOsmRouteMap, storeStreet), "service");
  assert.ok(visuals.some((visual) => visual.name === "Euston Road"));
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Euston Road"));
});

test("real London OSM pilot fixture is selectable from the real export", () => {
  const realOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(realOption);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.equal(realOption.source, "converted-osm");
  assert.ok(isConvertedOsmRouteRunnerMap(realOption));
  assert.equal(realOption.id, "osm-real-london-pilot");
  assert.equal(realOption.label, "OSM Real London Pilot");
  assert.equal(realOption.attribution, "OpenStreetMap contributors");
  assert.equal(realOption.map.nodes.length, 390);
  assert.equal(realOption.map.roads.length, 395);
  assert.equal(realOption.exercises.length, 3);
});

test("real London OSM pilot labels and road classes use preserved OSM metadata", () => {
  const visuals = buildSyntheticRoadVisuals(realLondonOsmPilotRouteMap);
  const defaultLabels = buildSyntheticMapLabels(realLondonOsmPilotRouteMap, realLondonOsmPilotRouteExercises[0]);
  const labels = buildSyntheticMapLabels(realLondonOsmPilotRouteMap, realLondonOsmPilotRouteExercises[0], {
    includeOsmRoadLabels: true
  });
  const cheniesStreet = realLondonOsmPilotRouteMap.roads.find((road) => road.name === "Chenies Street");
  const maletStreet = realLondonOsmPilotRouteMap.roads.find((road) => road.name === "Malet Street");
  const torringtonPlace = realLondonOsmPilotRouteMap.roads.find((road) => road.name === "Torrington Place");

  assert.ok(cheniesStreet);
  assert.ok(maletStreet);
  assert.ok(torringtonPlace);
  assert.equal(deriveSyntheticRoadClass(realLondonOsmPilotRouteMap, cheniesStreet), "major");
  assert.equal(deriveSyntheticRoadClass(realLondonOsmPilotRouteMap, maletStreet), "local");
  assert.equal(torringtonPlace.isOneWay, true);
  assert.ok(visuals.some((visual) => visual.name === "Keppel Street"));
  assert.equal(defaultLabels.some((label) => label.kind === "road" && label.text === "Keppel Street"), false);
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Torrington Place"));
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Keppel Street"));
  assert.deepEqual(buildSyntheticBackgroundFeatures(realLondonOsmPilotRouteMap), []);
  assert.deepEqual(buildSyntheticLinearFeatures(realLondonOsmPilotRouteMap), []);
  assert.equal(defaultLabels.some((label) => label.kind === "area"), false);
  assert.equal(defaultLabels.some((label) => label.text === "Marlowe Canal" || label.text === "Civic Quarter"), false);
});

test("large London OSM fixture is selectable and exposes hierarchy labels", () => {
  const largeOption = getRouteRunnerMapOption(largeLondonOsmRouteMap.id);
  const visuals = buildSyntheticRoadVisuals(largeLondonOsmRouteMap);
  const labels = buildSyntheticMapLabels(largeLondonOsmRouteMap, largeLondonOsmRouteExercises[0], {
    includeOsmRoadLabels: true
  });
  const eustonRoad = largeLondonOsmRouteMap.roads.find((road) => road.name === "Euston Road");
  const storeStreet = largeLondonOsmRouteMap.roads.find((road) => road.name === "Store Street");

  assert.ok(largeOption);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.equal(largeOption.source, "converted-osm");
  assert.equal(largeOption.label, "OSM Large London");
  assert.equal(largeOption.fixtureName, "largeLondonOverpass.json");
  assert.equal(largeOption.defaultExerciseId, largeLondonOsmRouteExercises[0].id);
  assert.ok(eustonRoad);
  assert.ok(storeStreet);
  assert.equal(deriveSyntheticRoadClass(largeLondonOsmRouteMap, eustonRoad), "major");
  assert.equal(deriveSyntheticRoadClass(largeLondonOsmRouteMap, storeStreet), "service");
  assert.ok(visuals.some((visual) => visual.name === "Euston Road"));
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Euston Road"));
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Gower Street"));
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

test("every medium converted OSM exercise uses valid converted graph nodes", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);

  for (const exercise of mediumLondonOsmRouteExercises) {
    assert.equal(exercise.mapId, mediumLondonOsmRouteMap.id, exercise.id);
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

test("every real London OSM pilot exercise uses valid converted graph nodes", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);

  for (const exercise of realLondonOsmPilotRouteExercises) {
    assert.equal(exercise.mapId, realLondonOsmPilotRouteMap.id, exercise.id);
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

test("every large London OSM exercise uses valid converted graph nodes", () => {
  const graph = buildMapGraph(largeLondonOsmRouteMap);

  for (const exercise of largeLondonOsmRouteExercises) {
    assert.equal(exercise.mapId, largeLondonOsmRouteMap.id, exercise.id);
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

test("every medium converted OSM exercise is legally solvable through its required stops", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const availabilities = validateExerciseReachabilityList({
    map: mediumLondonOsmRouteMap,
    exercises: mediumLondonOsmRouteExercises,
    graph
  });

  assert.equal(availabilities.length, mediumLondonOsmRouteExercises.length);

  for (const availability of availabilities) {
    assert.equal(availability.isValid, true, `${availability.exerciseId}: ${availability.errors.join("; ")}`);
    assert.ok(availability.shortestRouteDistanceMeters && availability.shortestRouteDistanceMeters > 0);
    assert.equal(availability.missingLegs.length, 0, availability.exerciseId);
  }
});

test("every real London OSM pilot exercise is legally solvable through its required stops", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const availabilities = validateExerciseReachabilityList({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    graph
  });

  assert.equal(availabilities.length, realLondonOsmPilotRouteExercises.length);

  for (const availability of availabilities) {
    assert.equal(availability.isValid, true, `${availability.exerciseId}: ${availability.errors.join("; ")}`);
    assert.ok(availability.shortestRouteDistanceMeters && availability.shortestRouteDistanceMeters > 0);
    assert.equal(availability.missingLegs.length, 0, availability.exerciseId);
  }
});

test("every large London OSM exercise is legally solvable through its required stops", () => {
  const graph = buildMapGraph(largeLondonOsmRouteMap);
  const availabilities = validateExerciseReachabilityList({
    map: largeLondonOsmRouteMap,
    exercises: largeLondonOsmRouteExercises,
    graph
  });

  assert.equal(availabilities.length, largeLondonOsmRouteExercises.length);

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

test("reveal fastest route returns a validated legal route for every medium converted OSM exercise", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, mediumLondonOsmRouteMap.restrictions);

  for (const exercise of mediumLondonOsmRouteExercises) {
    const overlay = buildFastestRouteOverlay({
      map: mediumLondonOsmRouteMap,
      exercise,
      revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
      graph
    });

    assert.equal(overlay.status, "available", `${exercise.id}: ${overlay.message ?? "no route"}`);
    assert.ok(overlay.edgeIds.length > 0, exercise.id);

    const routeValidation = validateDirectedEdgePath({
      graph,
      edgeIds: overlay.edgeIds,
      restrictions: mediumLondonOsmRouteMap.restrictions
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

test("reveal fastest route returns a validated legal route for every real London OSM pilot exercise", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, realLondonOsmPilotRouteMap.restrictions);

  for (const exercise of realLondonOsmPilotRouteExercises) {
    const overlay = buildFastestRouteOverlay({
      map: realLondonOsmPilotRouteMap,
      exercise,
      revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
      graph
    });

    assert.equal(overlay.status, "available", `${exercise.id}: ${overlay.message ?? "no route"}`);
    assert.ok(overlay.edgeIds.length > 0, exercise.id);

    const routeValidation = validateDirectedEdgePath({
      graph,
      edgeIds: overlay.edgeIds,
      restrictions: realLondonOsmPilotRouteMap.restrictions
    });

    assert.equal(routeValidation.valid, true, `${exercise.id}: ${routeValidation.invalidEdgeKeys.join(", ")}`);

    for (const edgeId of overlay.edgeIds) {
      const edge = graph.edgesById[edgeId];

      assert.ok(edge, `${exercise.id} returned unknown edge ${edgeId}`);
      assert.equal(blockedEdgeKeys.has(directedEdgeKey(edge)), false, `${exercise.id} used blocked edge ${edgeId}`);
    }
  }
});

test("reveal fastest route returns a validated legal route for every large London OSM exercise", () => {
  const graph = buildMapGraph(largeLondonOsmRouteMap);
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, largeLondonOsmRouteMap.restrictions);

  for (const exercise of largeLondonOsmRouteExercises) {
    const overlay = buildFastestRouteOverlay({
      map: largeLondonOsmRouteMap,
      exercise,
      revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
      graph
    });

    assert.equal(overlay.status, "available", `${exercise.id}: ${overlay.message ?? "no route"}`);
    assert.ok(overlay.edgeIds.length > 0, exercise.id);

    const routeValidation = validateDirectedEdgePath({
      graph,
      edgeIds: overlay.edgeIds,
      restrictions: largeLondonOsmRouteMap.restrictions
    });

    assert.equal(routeValidation.valid, true, `${exercise.id}: ${routeValidation.invalidEdgeKeys.join(", ")}`);

    for (const edgeId of overlay.edgeIds) {
      const edge = graph.edgesById[edgeId];

      assert.ok(edge, `${exercise.id} returned unknown edge ${edgeId}`);
      assert.equal(blockedEdgeKeys.has(directedEdgeKey(edge)), false, `${exercise.id} used blocked edge ${edgeId}`);
    }
  }
});

test("medium converted OSM one-way detour does not use illegal reverse one-way travel", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const exercise = mediumLondonOsmRouteExercises.find(
    (candidate) => candidate.id === "osm-medium-one-way-detour"
  );

  assert.ok(exercise);

  const overlay = buildFastestRouteOverlay({
    map: mediumLondonOsmRouteMap,
    exercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });

  assert.equal(overlay.status, "available");
  assert.equal(overlay.roadIds.some((roadId) => roadId.startsWith("osm-way-6005-")), false);
  assert.equal(overlay.nodeIds[0], "osm-node-5015");
  assert.equal(overlay.nodeIds.at(-1), "osm-node-5011");
  assert.ok(overlay.nodeIds.length > 2);
});

test("real London OSM pilot one-way exercise uses real Store Street edges", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const exercise = realLondonOsmPilotRouteExercises.find(
    (candidate) => candidate.id === "osm-real-store-street"
  );

  assert.ok(exercise);

  const overlay = buildFastestRouteOverlay({
    map: realLondonOsmPilotRouteMap,
    exercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });

  assert.equal(overlay.status, "available");
  assert.ok(overlay.roadIds.every((roadId) => roadId.startsWith("osm-way-2644236-")));
  assert.deepEqual(overlay.nodeIds, [
    "osm-node-333719180",
    "osm-node-9523025798",
    "osm-node-6355365946",
    "osm-node-25472045"
  ]);
});

test("real London OSM pilot snapping and reveal remain aligned after projection fit", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const exercise = realLondonOsmPilotRouteExercises.find(
    (candidate) => candidate.id === "osm-real-store-street"
  );
  const storeStreetNodeIds = [
    "osm-node-333719180",
    "osm-node-9523025798",
    "osm-node-6355365946",
    "osm-node-25472045"
  ];
  const storeStreetPoints = storeStreetNodeIds.map((nodeId) => {
    const node = graph.nodesById[nodeId];

    assert.ok(node);

    return node;
  });

  assert.ok(exercise);

  const snappedRoute = snapDrawnRouteToRoads({
    map: realLondonOsmPilotRouteMap,
    points: storeStreetPoints,
    snapTolerance: 1
  });

  assert.equal(snappedRoute.isValidTrace, true);
  assert.equal(snappedRoute.hasOffRoadPoints, false);
  assert.ok(snappedRoute.snappedPoints.every((point) => point.roadId?.startsWith("osm-way-2644236-")));

  const overlay = buildFastestRouteOverlay({
    map: realLondonOsmPilotRouteMap,
    exercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });
  const viewport = {
    width: TEST_CANVAS_WIDTH,
    height: TEST_CANVAS_HEIGHT,
    mapBounds: getRouteRunnerMapViewportBounds(realLondonOsmPilotRouteMap, TEST_CANVAS_WIDTH, TEST_CANVAS_HEIGHT)
  };

  assert.equal(overlay.status, "available");

  if (overlay.status === "available") {
    for (const point of overlay.points) {
      assertScreenPointInsideViewport(mapToScreenPoint(point, viewport), "real-pilot-reveal");
    }
  }
});

test("large London OSM one-way detour avoids illegal reverse one-way travel", () => {
  const graph = buildMapGraph(largeLondonOsmRouteMap);
  const exercise = largeLondonOsmRouteExercises.find(
    (candidate) => candidate.id === "osm-large-one-way-detour"
  );

  assert.ok(exercise);

  const overlay = buildFastestRouteOverlay({
    map: largeLondonOsmRouteMap,
    exercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });

  assert.equal(overlay.status, "available");
  assert.equal(overlay.roadIds.some((roadId) => roadId.startsWith("osm-way-11003-")), false);
  assert.deepEqual(overlay.nodeIds, [
    "osm-node-10026",
    "osm-node-10036",
    "osm-node-10035",
    "osm-node-10034",
    "osm-node-10033",
    "osm-node-10032",
    "osm-node-10031",
    "osm-node-10030",
    "osm-node-10020"
  ]);
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
