import assert from "node:assert/strict";
import test from "node:test";
import {
  marloweDistrictMap,
  matchSnappedRouteToSelection,
  snapDrawnRouteToRoads,
  type MapDefinition,
  type Vec2
} from "./index.ts";

const cleanTraceNearAlbionStreet: Vec2[] = [
  { x: 122, y: 190 },
  { x: 190, y: 184 },
  { x: 258, y: 170 }
];

const connectedCandidateMap: MapDefinition = {
  id: "connected-candidate-test",
  name: "Connected Candidate Test",
  nodes: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 100, y: 0 },
    { id: "c", x: 200, y: 0 },
    { id: "x", x: 95, y: 4 },
    { id: "y", x: 205, y: 4 },
    { id: "j", x: 0, y: 60 },
    { id: "k", x: 100, y: 60 }
  ],
  roads: [
    {
      id: "r1",
      fromNodeId: "a",
      toNodeId: "b",
      distanceMeters: 100,
      isOneWay: false,
      name: "First Connected Road"
    },
    {
      id: "r2",
      fromNodeId: "b",
      toNodeId: "c",
      distanceMeters: 100,
      isOneWay: false,
      name: "Second Connected Road"
    },
    {
      id: "rx",
      fromNodeId: "x",
      toNodeId: "y",
      distanceMeters: 110,
      isOneWay: false,
      name: "Nearby Disconnected Road"
    },
    {
      id: "rj",
      fromNodeId: "j",
      toNodeId: "k",
      distanceMeters: 100,
      isOneWay: false,
      name: "Jump Road"
    }
  ],
  restrictions: [],
  landmarks: []
};

const flickerRegressionMap: MapDefinition = {
  id: "flicker-regression-test",
  name: "Flicker Regression Test",
  nodes: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 200, y: 0 },
    { id: "x", x: 95, y: 4 },
    { id: "y", x: 205, y: 4 }
  ],
  roads: [
    {
      id: "r17",
      fromNodeId: "a",
      toNodeId: "b",
      distanceMeters: 200,
      isOneWay: false,
      name: "Connected Intended Road"
    },
    {
      id: "r04",
      fromNodeId: "x",
      toNodeId: "y",
      distanceMeters: 110,
      isOneWay: false,
      name: "Nearby Disconnected Flicker Road"
    }
  ],
  restrictions: [],
  landmarks: []
};

test("clean drawing close to roads snaps to expected Marlowe roads", () => {
  const result = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: cleanTraceNearAlbionStreet,
    snapTolerance: 18
  });

  assert.equal(result.isValidTrace, true);
  assert.equal(result.hasOffRoadPoints, false);
  assert.deepEqual(
    result.snappedPoints.map((point) => point.roadId),
    ["r02", "r02", "r02"]
  );
  assert.ok(result.snappedPoints.every((point) => point.confidence > 0));
  assert.equal(result.connectivity.isContinuous, true);
});

test("off-road drawing points are diagnosed", () => {
  const result = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: [
      { x: -200, y: -200 },
      { x: -180, y: -180 }
    ],
    snapTolerance: 18
  });

  assert.equal(result.isValidTrace, true);
  assert.equal(result.hasOffRoadPoints, true);
  assert.deepEqual(
    result.snappedPoints.map((point) => point.roadId),
    [null, null]
  );
  assert.equal(result.diagnostics[0]?.code, "off_road_points");
});

test("repeated points do not break snapping", () => {
  const result = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: [
      { x: 190, y: 184 },
      { x: 190, y: 184 },
      { x: 190, y: 184 }
    ],
    snapTolerance: 18
  });

  assert.equal(result.isValidTrace, true);
  assert.deepEqual(
    result.snappedPoints.map((point) => point.roadId),
    ["r02", "r02", "r02"]
  );
});

test("very short traces return a clear diagnostic", () => {
  const result = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: [{ x: 190, y: 184 }],
    snapTolerance: 18
  });

  assert.equal(result.isValidTrace, false);
  assert.deepEqual(result.snappedPoints, []);
  assert.deepEqual(result.connectivity.collapsedRoadIds, []);
  assert.equal(result.diagnostics[0]?.code, "trace_too_short");
});

test("snapping result is deterministic", () => {
  const firstResult = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: cleanTraceNearAlbionStreet,
    snapTolerance: 18
  });
  const secondResult = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: cleanTraceNearAlbionStreet,
    snapTolerance: 18
  });

  assert.deepEqual(secondResult, firstResult);
});

test("snapping prefers a connected candidate sequence over a closer disconnected road", () => {
  const result = snapDrawnRouteToRoads({
    map: connectedCandidateMap,
    points: [
      { x: 10, y: 0 },
      { x: 100, y: 3 },
      { x: 190, y: 0 }
    ],
    snapTolerance: 8
  });
  const selectedRoadIds = result.snappedPoints.map((point) => point.roadId);

  assert.equal(result.isValidTrace, true);
  assert.equal(result.hasOffRoadPoints, false);
  assert.deepEqual(selectedRoadIds, ["r1", "r1", "r2"]);
  assert.deepEqual(result.connectivity.selectedCandidateRoadIds, ["r1", "r1", "r2"]);
  assert.deepEqual(result.connectivity.collapsedRoadIds, ["r1", "r2"]);
  assert.equal(result.connectivity.isContinuous, true);
  assert.deepEqual(result.connectivity.disconnectedTransitions, []);
  assert.ok(result.connectivity.diagnostics.totalCost < 20);
  assert.equal(result.connectivity.diagnostics.usedDisconnectedPenalty, false);
  assert.ok(
    result.snappedPoints[1].candidates.some(
      (candidate) => candidate.roadId === "rx" && candidate.pointIndex === 1 && !candidate.selected
    )
  );
  assert.ok(result.snappedPoints[1].candidates.some((candidate) => candidate.roadId === "r1" && candidate.selected));
  assert.deepEqual(
    result.connectivity.diagnostics.selectedCandidates.map((candidate) => [
      candidate.pointIndex,
      candidate.roadId,
      candidate.selected
    ]),
    [
      [0, "r1", true],
      [1, "r1", true],
      [2, "r2", true]
    ]
  );

  const matchedRoute = matchSnappedRouteToSelection({
    map: connectedCandidateMap,
    snappedRoute: result
  });

  assert.equal(matchedRoute.status, "matched");
  assert.deepEqual(matchedRoute.orderedRoadIds, ["r1", "r2"]);
});

test("shaky slightly off-road drawing still snaps to connected roads", () => {
  const result = snapDrawnRouteToRoads({
    map: connectedCandidateMap,
    points: [
      { x: 8, y: -3 },
      { x: 55, y: 5 },
      { x: 100, y: -2 },
      { x: 150, y: 4 },
      { x: 194, y: -3 }
    ],
    snapTolerance: 10
  });

  assert.equal(result.isValidTrace, true);
  assert.equal(result.hasOffRoadPoints, false);
  assert.deepEqual(result.connectivity.collapsedRoadIds, ["r1", "r2"]);
  assert.equal(result.connectivity.isContinuous, true);
  assert(result.snappedPoints.every((point) => point.confidence >= 0.5));
});

test("drawing over a junction prefers a continuous transition", () => {
  const result = snapDrawnRouteToRoads({
    map: connectedCandidateMap,
    points: [
      { x: 50, y: 1 },
      { x: 100, y: 0 },
      { x: 150, y: 1 }
    ],
    snapTolerance: 8
  });

  assert.equal(result.isValidTrace, true);
  assert.equal(result.hasOffRoadPoints, false);
  assert.deepEqual(result.connectivity.collapsedRoadIds, ["r1", "r2"]);
  assert.equal(result.connectivity.isContinuous, true);
});

test("nearby parallel roads do not override the connected route when a connected path is available", () => {
  const result = snapDrawnRouteToRoads({
    map: connectedCandidateMap,
    points: [
      { x: 15, y: 0 },
      { x: 100, y: 3.5 },
      { x: 185, y: 0 }
    ],
    snapTolerance: 8
  });

  assert.deepEqual(result.connectivity.collapsedRoadIds, ["r1", "r2"]);
  assert.equal(result.connectivity.isContinuous, true);
  assert(result.snappedPoints[1].candidates.some((candidate) => candidate.roadId === "rx"));
  assert(result.snappedPoints[1].candidates.some((candidate) => candidate.roadId === "r1" && candidate.selected));
});

test("same-road stability avoids nearby disconnected r17 to r04 to r17 flicker", () => {
  const result = snapDrawnRouteToRoads({
    map: flickerRegressionMap,
    points: [
      { x: 10, y: 0 },
      { x: 100, y: 3 },
      { x: 190, y: 0 }
    ],
    snapTolerance: 8
  });

  assert.deepEqual(
    result.snappedPoints.map((point) => point.roadId),
    ["r17", "r17", "r17"]
  );
  assert.deepEqual(result.connectivity.collapsedRoadIds, ["r17"]);
  assert.equal(result.connectivity.isContinuous, true);
  assert.ok(result.snappedPoints[1].candidates.some((candidate) => candidate.roadId === "r04" && !candidate.selected));
  assert.ok(result.snappedPoints[1].candidates.some((candidate) => candidate.roadId === "r17" && candidate.selected));
});

test("genuine disconnected drawings still produce disconnected match diagnostics", () => {
  const result = snapDrawnRouteToRoads({
    map: connectedCandidateMap,
    points: [
      { x: 10, y: 0 },
      { x: 50, y: 60 },
      { x: 90, y: 60 }
    ],
    snapTolerance: 8
  });

  assert.equal(result.isValidTrace, true);
  assert.equal(result.hasOffRoadPoints, false);
  assert.deepEqual(
    result.snappedPoints.map((point) => point.roadId),
    ["r1", "rj", "rj"]
  );
  assert.equal(result.connectivity.isContinuous, false);
  assert.deepEqual(result.connectivity.collapsedRoadIds, ["r1", "rj"]);
  assert.deepEqual(result.connectivity.disconnectedTransitions, [
    {
      fromRoadId: "r1",
      toRoadId: "rj",
      pointIndex: 1
    }
  ]);
  assert.equal(result.connectivity.diagnostics.usedDisconnectedPenalty, true);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === "disconnected_selected_roads"), true);
  assert.deepEqual(
    result.diagnostics
      .filter((diagnostic) => diagnostic.code === "disconnected_selected_roads")
      .map((diagnostic) => [diagnostic.fromRoadId, diagnostic.toRoadId]),
    [["r1", "rj"]]
  );

  const matchedRoute = matchSnappedRouteToSelection({
    map: connectedCandidateMap,
    snappedRoute: result
  });

  assert.equal(matchedRoute.status, "disconnected");
  assert.equal(matchedRoute.diagnostics[0]?.code, "disconnected_roads");
  assert.equal(matchedRoute.diagnostics[0]?.fromRoadId, "r1");
  assert.equal(matchedRoute.diagnostics[0]?.toRoadId, "rj");
});
