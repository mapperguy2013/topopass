import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildMapGraph, type DirectedEdge, type MapDefinition, type RouteExercise } from "../../../lib/map-engine/index.ts";
import {
  convertOverpassJsonToRouteMap,
  type OsmRouteGraphConversionResult,
  type OsmRouteGraphMapDefinition,
  type OsmRouteGraphRoad
} from "../../../lib/map-engine/osm/osmToRouteGraph.ts";
import { parseOverpassRoadExtract, type OverpassJsonResponse } from "../../../lib/map-engine/osm/overpassImport.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  mediumLondonOsmRouteExercises,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteExercises,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "../../..");
const osmFixtureDirectory = path.join(projectRoot, "lib", "map-engine", "osm", "fixtures");

type FixtureSpec = {
  fixtureName: string;
  mapId: string;
  name: string;
  expectedNodeCount: number;
  expectedRoadCount: number;
};

type NormalizedMap = {
  id: string;
  name: string;
  mapVersion: string | null;
  nodeIds: string[];
  roads: Array<{
    id: string;
    fromNodeId: string;
    toNodeId: string;
    distanceMeters: number;
    isOneWay: boolean;
    name: string | null;
    osmWayId: number;
    highway: string;
    originalDirection: string;
    segmentIndex: number;
    fromOsmNodeId: number;
    toOsmNodeId: number;
    rawTagEntries: Array<[string, string]>;
  }>;
  restrictions: Array<{
    id: string;
    type: string;
    roadId?: string;
  }>;
  metadata: {
    blockedOsmWayIds: number[];
    ignoredRelationIds: number[];
    sourceRoadCount: number;
    convertedRoadSegmentCount: number;
    projectedBounds: OsmRouteGraphMapDefinition["metadata"]["projection"]["projectedBounds"];
    latLonBounds: OsmRouteGraphMapDefinition["metadata"]["projection"]["latLonBounds"];
  };
};

const committedFixtureSpecs: FixtureSpec[] = [
  {
    fixtureName: "tinyLondonOverpass.json",
    mapId: "osm-tiny-london",
    name: "OSM Tiny London",
    expectedNodeCount: 10,
    expectedRoadCount: 9
  },
  {
    fixtureName: "mediumLondonOverpass.json",
    mapId: "osm-medium-london",
    name: "OSM Medium London",
    expectedNodeCount: 25,
    expectedRoadCount: 48
  },
  {
    fixtureName: "realLondonPilotOverpass.json",
    mapId: "osm-real-london-pilot",
    name: "Real London pilot map",
    expectedNodeCount: 390,
    expectedRoadCount: 395
  }
];

function readFixture(fixtureName: string): OverpassJsonResponse {
  return JSON.parse(readFileSync(path.join(osmFixtureDirectory, fixtureName), "utf8")) as OverpassJsonResponse;
}

function convertFixture(spec: FixtureSpec): {
  result: Extract<OsmRouteGraphConversionResult, { ok: true }>;
  map: OsmRouteGraphMapDefinition;
} {
  const result = convertOverpassJsonToRouteMap(readFixture(spec.fixtureName), {
    mapId: spec.mapId,
    name: spec.name
  });

  assert.equal(result.ok, true, result.ok ? undefined : result.errors.join("; "));

  return {
    result,
    map: result.map
  };
}

function assertFiniteCoordinate(value: { x: number; y: number }, label: string): void {
  assert.equal(Number.isFinite(value.x), true, `${label} x must be finite`);
  assert.equal(Number.isFinite(value.y), true, `${label} y must be finite`);
}

function assertFiniteProjectedBounds(
  bounds: OsmRouteGraphMapDefinition["metadata"]["projection"]["projectedBounds"],
  label: string
): void {
  for (const [key, value] of Object.entries(bounds)) {
    assert.equal(Number.isFinite(value), true, `${label}.${key} must be finite`);
  }

  assert.ok(bounds.minX <= bounds.maxX, `${label}.minX must not exceed maxX`);
  assert.ok(bounds.minY <= bounds.maxY, `${label}.minY must not exceed maxY`);
}

function assertFiniteLatLonBounds(
  bounds: OsmRouteGraphMapDefinition["metadata"]["projection"]["latLonBounds"],
  label: string
): void {
  for (const [key, value] of Object.entries(bounds)) {
    assert.equal(Number.isFinite(value), true, `${label}.${key} must be finite`);
  }

  assert.ok(bounds.minLat <= bounds.maxLat, `${label}.minLat must not exceed maxLat`);
  assert.ok(bounds.minLon <= bounds.maxLon, `${label}.minLon must not exceed maxLon`);
}

function normalizeMap(map: OsmRouteGraphMapDefinition): NormalizedMap {
  return {
    id: map.id,
    name: map.name,
    mapVersion: map.mapVersion ?? null,
    nodeIds: map.nodes.map((node) => node.id),
    roads: map.roads.map((road) => ({
      id: road.id,
      fromNodeId: road.fromNodeId,
      toNodeId: road.toNodeId,
      distanceMeters: Number(road.distanceMeters.toFixed(6)),
      isOneWay: road.isOneWay,
      name: road.name ?? null,
      osmWayId: road.metadata.osmWayId,
      highway: road.metadata.highway,
      originalDirection: road.metadata.originalDirection,
      segmentIndex: road.metadata.segmentIndex,
      fromOsmNodeId: road.metadata.fromOsmNodeId,
      toOsmNodeId: road.metadata.toOsmNodeId,
      rawTagEntries: Object.entries(road.metadata.rawTags).sort(([left], [right]) => left.localeCompare(right))
    })),
    restrictions: map.restrictions.map((restriction) => ({
      id: restriction.id,
      type: restriction.type,
      roadId: "roadId" in restriction ? restriction.roadId : undefined
    })),
    metadata: {
      blockedOsmWayIds: [...map.metadata.blockedOsmWayIds],
      ignoredRelationIds: [...map.metadata.ignoredRelationIds],
      sourceRoadCount: map.metadata.sourceRoadCount,
      convertedRoadSegmentCount: map.metadata.convertedRoadSegmentCount,
      projectedBounds: map.metadata.projection.projectedBounds,
      latLonBounds: map.metadata.projection.latLonBounds
    }
  };
}

function reorderFixtureElements(input: OverpassJsonResponse): OverpassJsonResponse {
  return {
    ...input,
    elements: [...input.elements].reverse()
  };
}

function edgeSummary(edge: DirectedEdge): [string, string, string, string, number] {
  return [edge.id, edge.roadId, edge.fromNodeId, edge.toNodeId, Number(edge.distanceMeters.toFixed(6))];
}

function assertConvertedReferencesAreValid(map: OsmRouteGraphMapDefinition): void {
  const nodeIds = new Set(map.nodes.map((node) => node.id));
  const roadIds = new Set(map.roads.map((road) => road.id));
  const graph = buildMapGraph(map);

  assert.equal(new Set(map.nodes.map((node) => node.id)).size, map.nodes.length, `${map.id} node ids must be unique`);
  assert.equal(new Set(map.roads.map((road) => road.id)).size, map.roads.length, `${map.id} road ids must be unique`);
  assert.equal(new Set(graph.edges.map((edge) => edge.id)).size, graph.edges.length, `${map.id} edge ids must be unique`);

  for (const node of map.nodes) {
    assertFiniteCoordinate(node, `${map.id}:${node.id}`);
    assert.equal(Number.isFinite(node.metadata.lat), true, `${map.id}:${node.id} lat must be finite`);
    assert.equal(Number.isFinite(node.metadata.lon), true, `${map.id}:${node.id} lon must be finite`);
  }

  for (const road of map.roads) {
    assert.ok(nodeIds.has(road.fromNodeId), `${map.id}:${road.id} has missing from node ${road.fromNodeId}`);
    assert.ok(nodeIds.has(road.toNodeId), `${map.id}:${road.id} has missing to node ${road.toNodeId}`);
    assert.equal(Number.isFinite(road.distanceMeters), true, `${map.id}:${road.id} distance must be finite`);
    assert.ok(road.distanceMeters > 0, `${map.id}:${road.id} distance must be positive`);
    assert.equal(road.fromNodeId, `osm-node-${road.metadata.fromOsmNodeId}`);
    assert.equal(road.toNodeId, `osm-node-${road.metadata.toOsmNodeId}`);
    assert.equal(road.id, `osm-way-${road.metadata.osmWayId}-segment-${road.metadata.segmentIndex}`);
  }

  for (const edge of graph.edges) {
    assert.ok(roadIds.has(edge.roadId), `${map.id}:${edge.id} has missing road ${edge.roadId}`);
    assert.ok(nodeIds.has(edge.fromNodeId), `${map.id}:${edge.id} has missing from node ${edge.fromNodeId}`);
    assert.ok(nodeIds.has(edge.toNodeId), `${map.id}:${edge.id} has missing to node ${edge.toNodeId}`);
    assert.equal(Number.isFinite(edge.distanceMeters), true, `${map.id}:${edge.id} distance must be finite`);
    assert.ok(edge.distanceMeters > 0, `${map.id}:${edge.id} distance must be positive`);
    assert.equal(graph.edgesById[edge.id], edge, `${map.id}:${edge.id} must be indexed by id`);
  }

  assertFiniteProjectedBounds(map.metadata.projection.projectedBounds, `${map.id}.projectedBounds`);
  assertFiniteLatLonBounds(map.metadata.projection.latLonBounds, `${map.id}.latLonBounds`);
}

function assertExerciseStopsAreFinite(input: {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
}): void {
  const nodesById = new Map(input.map.nodes.map((node) => [node.id, node]));
  const landmarksById = new Map(input.map.landmarks.map((landmark) => [landmark.id, landmark]));

  for (const exercise of input.exercises) {
    assert.equal(exercise.mapId, input.map.id, `${exercise.id} must target ${input.map.id}`);

    for (const stop of exercise.stops) {
      if (stop.type === "node") {
        const node = nodesById.get(stop.nodeId);

        assert.ok(node, `${exercise.id} references missing stop node ${stop.nodeId}`);
        assertFiniteCoordinate(node, `${exercise.id}:${stop.nodeId}`);
      } else {
        const landmark = landmarksById.get(stop.landmarkId);

        assert.ok(landmark, `${exercise.id} references missing stop landmark ${stop.landmarkId}`);
        assertFiniteCoordinate(landmark, `${exercise.id}:${stop.landmarkId}`);
      }
    }
  }
}

test("Stage 126 converting committed OSM fixtures twice produces equivalent normalized maps", () => {
  for (const spec of committedFixtureSpecs) {
    const first = convertFixture(spec).map;
    const second = convertFixture(spec).map;

    assert.equal(first.nodes.length, spec.expectedNodeCount, spec.fixtureName);
    assert.equal(first.roads.length, spec.expectedRoadCount, spec.fixtureName);
    assert.deepEqual(normalizeMap(first), normalizeMap(second), spec.fixtureName);
  }
});

test("Stage 126 reordering OSM input elements does not change normalized conversion output", () => {
  for (const spec of committedFixtureSpecs) {
    const fixture = readFixture(spec.fixtureName);
    const normal = convertOverpassJsonToRouteMap(fixture, {
      mapId: spec.mapId,
      name: spec.name
    });
    const reordered = convertOverpassJsonToRouteMap(reorderFixtureElements(fixture), {
      mapId: spec.mapId,
      name: spec.name
    });

    assert.equal(normal.ok, true, normal.ok ? undefined : normal.errors.join("; "));
    assert.equal(reordered.ok, true, reordered.ok ? undefined : reordered.errors.join("; "));

    if (normal.ok && reordered.ok) {
      assert.deepEqual(normalizeMap(normal.map), normalizeMap(reordered.map), spec.fixtureName);
      assert.deepEqual(normal.warnings, reordered.warnings, spec.fixtureName);
    }
  }
});

test("Stage 126 converted identifiers and graph references are stable and internally valid", () => {
  for (const spec of committedFixtureSpecs) {
    const map = convertFixture(spec).map;
    const graph = buildMapGraph(map);
    const graphAgain = buildMapGraph(convertFixture(spec).map);

    assertConvertedReferencesAreValid(map);
    assert.deepEqual(
      map.nodes.map((node) => node.metadata.osmNodeId),
      [...map.nodes.map((node) => node.metadata.osmNodeId)].sort((left, right) => left - right),
      `${spec.fixtureName} node order must follow numeric OSM ids`
    );
    assert.deepEqual(
      graph.edges.map(edgeSummary),
      graphAgain.edges.map(edgeSummary),
      `${spec.fixtureName} graph edges must be deterministic`
    );
  }
});

test("Stage 126 one-way and two-way expansion is deterministic", () => {
  const map = convertFixture(committedFixtureSpecs[0]).map;
  const graph = buildMapGraph(map);
  const oneWayRoad = map.roads.find((road) => road.id === "osm-way-2002-segment-0");
  const twoWayRoad = map.roads.find((road) => road.id === "osm-way-2001-segment-0");
  const reverseDirectionRoad = map.roads.find((road) => road.id === "osm-way-2003-segment-0");

  assert.ok(oneWayRoad);
  assert.ok(twoWayRoad);
  assert.ok(reverseDirectionRoad);
  assert.equal(oneWayRoad.isOneWay, true);
  assert.equal(twoWayRoad.isOneWay, false);
  assert.equal(reverseDirectionRoad.metadata.originalDirection, "reverse");
  assert.deepEqual(
    graph.edges.filter((edge) => edge.roadId === oneWayRoad.id).map(edgeSummary),
    [["osm-way-2002-segment-0:forward", oneWayRoad.id, "osm-node-1003", "osm-node-1004", 71.076812]]
  );
  assert.deepEqual(
    graph.edges.filter((edge) => edge.roadId === twoWayRoad.id).map(edgeSummary),
    [
      ["osm-way-2001-segment-0:forward", twoWayRoad.id, "osm-node-1001", "osm-node-1002", 70.708639],
      ["osm-way-2001-segment-0:reverse", twoWayRoad.id, "osm-node-1002", "osm-node-1001", 70.708639]
    ]
  );
  assert.deepEqual(
    graph.edges.filter((edge) => edge.roadId === reverseDirectionRoad.id).map(edgeSummary),
    [["osm-way-2003-segment-0:forward", reverseDirectionRoad.id, "osm-node-1006", "osm-node-1005", 65.82231]]
  );
});

test("Stage 126 road metadata required by the app is preserved consistently", () => {
  const map = convertFixture(committedFixtureSpecs[2]).map;
  const torringtonPlace = map.roads.find((road) => road.name === "Torrington Place");
  const goodgeStreet = map.roads.find((road) => road.name === "Goodge Street");
  const unnamedServiceRoad = map.roads.find((road) => road.metadata.osmWayId === 30275210);

  assert.ok(torringtonPlace);
  assert.ok(goodgeStreet);
  assert.ok(unnamedServiceRoad);
  assert.deepEqual(
    ([
      torringtonPlace,
      goodgeStreet,
      unnamedServiceRoad
    ] as OsmRouteGraphRoad[]).map((road) => ({
      id: road.id,
      name: road.name ?? null,
      highway: road.metadata.highway,
      isOneWay: road.isOneWay,
      originalDirection: road.metadata.originalDirection,
      osmWayId: road.metadata.osmWayId
    })),
    [
      {
        id: torringtonPlace.id,
        name: "Torrington Place",
        highway: "tertiary",
        isOneWay: true,
        originalDirection: "forward",
        osmWayId: torringtonPlace.metadata.osmWayId
      },
      {
        id: goodgeStreet.id,
        name: "Goodge Street",
        highway: "primary",
        isOneWay: true,
        originalDirection: "forward",
        osmWayId: goodgeStreet.metadata.osmWayId
      },
      {
        id: "osm-way-30275210-segment-0",
        name: null,
        highway: "service",
        isOneWay: false,
        originalDirection: "both",
        osmWayId: 30275210
      }
    ]
  );
});

test("Stage 126 route-runner converted OSM exercise stops reference finite converted coordinates", () => {
  assertExerciseStopsAreFinite({
    map: tinyLondonOsmRouteMap,
    exercises: tinyLondonOsmRouteExercises
  });
  assertExerciseStopsAreFinite({
    map: mediumLondonOsmRouteMap,
    exercises: mediumLondonOsmRouteExercises
  });
  assertExerciseStopsAreFinite({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises
  });
});

test("Stage 126 skipped invalid OSM data and conversion failures are deterministic", () => {
  const malformedFixture: OverpassJsonResponse = {
    elements: [
      { type: "way", id: 3, nodes: [1, 2], tags: { highway: "service", access: "no", name: "Blocked Yard" } },
      { type: "node", id: 1, lat: 51.5, lon: -0.12 },
      { type: "way", id: 4, nodes: [1, 2], tags: { highway: "footway", name: "Foot Path" } },
      { type: "way", id: 2, nodes: [1, 99], tags: { highway: "residential", name: "Broken Street" } },
      { type: "node", id: 2, lat: 51.5001, lon: -0.1199 },
      { type: "relation", id: 20, members: [], tags: { type: "route" } },
      { type: "way", id: 1, nodes: [1], tags: { highway: "residential", name: "Too Short Street" } }
    ]
  };
  const parsed = parseOverpassRoadExtract(malformedFixture);
  const parsedReordered = parseOverpassRoadExtract(reorderFixtureElements(malformedFixture));
  const conversion = convertOverpassJsonToRouteMap(malformedFixture);
  const conversionReordered = convertOverpassJsonToRouteMap(reorderFixtureElements(malformedFixture));

  assert.deepEqual(parsed, parsedReordered);
  assert.deepEqual(
    parsed.excludedWays.map((way) => [way.osmWayId, way.reason, way.missingNodeRefs]),
    [
      [1, "missing_node_reference", []],
      [2, "missing_node_reference", [99]],
      [3, "blocked_access", []],
      [4, "ignored_non_road", []]
    ]
  );
  assert.equal(conversion.ok, false);
  assert.equal(conversionReordered.ok, false);

  if (!conversion.ok && !conversionReordered.ok) {
    assert.deepEqual(conversion.errors, conversionReordered.errors);
    assert.deepEqual(conversion.warnings, conversionReordered.warnings);
    assert.deepEqual(conversion.errors, ["OSM route graph conversion requires at least one valid road coordinate."]);
  }
});

test("Stage 126 preserves Marlowe default and real London committed fixture source", () => {
  const realPilotOption = ROUTE_RUNNER_MAP_OPTIONS.find((option) => option.id === "osm-real-london-pilot");

  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, "marlowe-district-dev-map");
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.notEqual(DEFAULT_ROUTE_RUNNER_MAP_ID, realLondonOsmPilotRouteMap.id);
  assert.equal(realPilotOption?.fixtureName, "realLondonPilotOverpass.json");
  assert.ok(realPilotOption?.sourceOverpassFixture);
});
