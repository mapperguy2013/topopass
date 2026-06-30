import assert from "node:assert/strict";
import test from "node:test";
import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  matchSnappedRouteToSelection,
  runRouteExercise,
  snapDrawnRouteToRoads,
  type MapDefinition,
  type SnappedRoutePoint,
  type Vec2
} from "./index.ts";

const matchingFixtureMap: MapDefinition = {
  id: "route-matching-test-map",
  name: "Route Matching Test Map",
  nodes: [
    { id: "A", x: 0, y: 0 },
    { id: "B", x: 100, y: 0 },
    { id: "C", x: 200, y: 0 },
    { id: "D", x: 300, y: 0 }
  ],
  roads: [
    { id: "r1", fromNodeId: "A", toNodeId: "B", distanceMeters: 100, isOneWay: false },
    { id: "r2", fromNodeId: "B", toNodeId: "C", distanceMeters: 100, isOneWay: false },
    { id: "r3", fromNodeId: "C", toNodeId: "A", distanceMeters: 200, isOneWay: false },
    { id: "r4", fromNodeId: "C", toNodeId: "D", distanceMeters: 100, isOneWay: false },
    { id: "r5", fromNodeId: "A", toNodeId: "D", distanceMeters: 300, isOneWay: true }
  ],
  restrictions: [],
  landmarks: []
};

function snappedPoint(
  roadId: string | null,
  point: Vec2,
  options: { confidence?: number; distanceFromRoad?: number } = {}
): SnappedRoutePoint {
  const distanceFromRoad = options.distanceFromRoad ?? (roadId ? 0 : Number.POSITIVE_INFINITY);
  const confidence = options.confidence ?? (roadId ? 1 : 0);

  return {
    originalPoint: { ...point },
    snappedPoint: { ...point },
    roadId,
    directedEdgeId: roadId ? `${roadId}:forward` : null,
    distanceFromRoad,
    confidence,
    candidates: []
  };
}

function snappedRoads(roadIds: Array<string | null>): SnappedRoutePoint[] {
  return roadIds.map((roadId, index) => snappedPoint(roadId, { x: index * 100, y: 0 }));
}

function marloweSnap(points: Vec2[]) {
  return snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points,
    snapTolerance: 18
  });
}

test("empty snapped route returns empty status", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: []
  });

  assert.equal(result.status, "empty");
  assert.equal(result.isReadyForRunRouteExercise, false);
  assert.equal(result.confidence, "failed");
  assert.equal(result.failureReason, "empty_input");
  assert.deepEqual(result.selection, { nodeIds: [], roadIds: [] });
  assert.equal(result.diagnostics[0]?.code, "empty_input");
});

test("one snapped point returns insufficient_points status", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: snappedRoads(["r1"])
  });

  assert.equal(result.status, "insufficient_points");
  assert.equal(result.isReadyForRunRouteExercise, false);
  assert.equal(result.confidence, "failed");
  assert.equal(result.failureReason, "insufficient_points");
  assert.equal(result.diagnostics[0]?.code, "insufficient_points");
});

test("consecutive duplicate roads are collapsed", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: snappedRoads(["r1", "r1", "r1", "r2", "r2", "r3"])
  });

  assert.equal(result.status, "matched");
  assert.deepEqual(result.orderedRoadIds, ["r1", "r2", "r3"]);
});

test("simple two-road route produces transition and node sequence", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: snappedRoads(["r1", "r2"])
  });

  assert.equal(result.status, "matched");
  assert.deepEqual(result.orderedRoadIds, ["r1", "r2"]);
  assert.deepEqual(result.transitionNodeIds, ["B"]);
  assert.deepEqual(result.nodeIds, ["A", "B", "C"]);
  assert.equal(result.confidence, "high");
  assert.equal(result.averageSnappedPointConfidence, 1);
  assert.equal(result.minimumSnappedPointConfidence, 1);
  assert.equal(result.routeDistanceMeters, 200);
});

test("multi-road route produces roads, nodes, directed edges, and attempted movements", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: snappedRoads(["r1", "r2", "r4"])
  });

  assert.equal(result.status, "matched");
  assert.deepEqual(result.orderedRoadIds, ["r1", "r2", "r4"]);
  assert.deepEqual(result.nodeIds, ["A", "B", "C", "D"]);
  assert.deepEqual(result.directedEdgeIds, ["r1:forward", "r2:forward", "r4:forward"]);
  assert.deepEqual(result.attemptedMovements, [
    { roadId: "r1", fromNodeId: "A", toNodeId: "B", directedEdgeId: "r1:forward" },
    { roadId: "r2", fromNodeId: "B", toNodeId: "C", directedEdgeId: "r2:forward" },
    { roadId: "r4", fromNodeId: "C", toNodeId: "D", directedEdgeId: "r4:forward" }
  ]);
  assert.deepEqual(result.selection, {
    nodeIds: ["A", "B", "C", "D"],
    roadIds: ["r1", "r2", "r4"]
  });
});

test("non-consecutive repeated roads are preserved", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: snappedRoads(["r1", "r2", "r3", "r1"])
  });

  assert.equal(result.status, "matched");
  assert.deepEqual(result.orderedRoadIds, ["r1", "r2", "r3", "r1"]);
  assert.deepEqual(result.nodeIds, ["A", "B", "C", "A", "B"]);
});

test("unknown snapped road returns unmatched status with warning", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: snappedRoads(["r1", "missing-road"])
  });

  assert.equal(result.status, "unmatched");
  assert.equal(result.isReadyForRunRouteExercise, false);
  assert.equal(result.confidence, "failed");
  assert.equal(result.failureReason, "unknown_road");
  assert.equal(result.diagnostics[0]?.code, "unknown_road");
});

test("unmatched snapped point returns unmatched status with warning", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: snappedRoads(["r1", null])
  });

  assert.equal(result.status, "unmatched");
  assert.equal(result.isReadyForRunRouteExercise, false);
  assert.equal(result.confidence, "failed");
  assert.equal(result.failureReason, "unmatched_point");
  assert.equal(result.diagnostics[0]?.code, "unmatched_point");
});

test("disconnected road sequence returns disconnected status without throwing", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: snappedRoads(["r1", "r4"])
  });

  assert.equal(result.status, "disconnected");
  assert.equal(result.isReadyForRunRouteExercise, false);
  assert.equal(result.confidence, "failed");
  assert.equal(result.failureReason, "disconnected_roads");
  assert.deepEqual(result.orderedRoadIds, ["r1", "r4"]);
  assert.equal(result.routeDistanceMeters, 200);
  assert.equal(result.diagnostics[0]?.code, "disconnected_roads");
});

test("slightly off-road matched routes expose medium confidence debug output", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: [
      snappedPoint("r1", { x: 0, y: 0 }, { confidence: 0.72, distanceFromRoad: 7 }),
      snappedPoint("r2", { x: 100, y: 0 }, { confidence: 0.68, distanceFromRoad: 8 })
    ]
  });

  assert.equal(result.status, "matched");
  assert.equal(result.confidence, "medium");
  assert.equal(result.averageSnappedPointConfidence, 0.7);
  assert.equal(result.minimumSnappedPointConfidence, 0.68);
});

test("dead-end turn-back preserves repeated road movements instead of collapsing the reversal", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: [
      snappedPoint("r1", { x: 0, y: 0 }),
      snappedPoint("r1", { x: 100, y: 0 }),
      snappedPoint("r2", { x: 120, y: 0 }),
      snappedPoint("r2", { x: 200, y: 0 }),
      snappedPoint("r2", { x: 140, y: 0 }),
      snappedPoint("r2", { x: 100, y: 0 }),
      snappedPoint("r1", { x: 80, y: 0 }),
      snappedPoint("r1", { x: 0, y: 0 })
    ]
  });

  assert.equal(result.status, "matched");
  assert.deepEqual(result.orderedRoadIds, ["r1", "r2", "r2", "r1"]);
  assert.deepEqual(result.transitionNodeIds, ["B", "C", "B"]);
  assert.deepEqual(result.nodeIds, ["A", "B", "C", "B", "A"]);
  assert.deepEqual(result.directedEdgeSequence, ["r1:forward", "r2:forward", "r2:reverse", "r1:reverse"]);
  assert.equal(result.routeDistanceMeters, 400);
});

test("legal one-way direction resolves a directed edge", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: [snappedPoint("r5", { x: 0, y: 0 }), snappedPoint("r5", { x: 300, y: 0 })]
  });

  assert.equal(result.status, "matched");
  assert.deepEqual(result.nodeIds, ["A", "D"]);
  assert.deepEqual(result.directedEdgeSequence, ["r5:forward"]);
  assert.deepEqual(result.diagnostics, []);
});

test("wrong-way one-way movement keeps attempted movement but warns about unresolved direction", () => {
  const result = matchSnappedRouteToSelection({
    map: matchingFixtureMap,
    snappedPoints: [snappedPoint("r5", { x: 300, y: 0 }), snappedPoint("r5", { x: 0, y: 0 })]
  });

  assert.equal(result.status, "matched");
  assert.equal(result.isReadyForRunRouteExercise, true);
  assert.deepEqual(result.nodeIds, ["D", "A"]);
  assert.deepEqual(result.directedEdgeSequence, [null]);
  assert.equal(result.diagnostics[0]?.code, "unresolved_direction");
  assert.deepEqual(result.selection, {
    nodeIds: ["D", "A"],
    roadIds: ["r5"]
  });
});

test("Marlowe snapped route can be matched and passed into runRouteExercise", () => {
  const snappedRoute = marloweSnap([
    { x: 180, y: 181 },
    { x: 290, y: 242 },
    { x: 352, y: 380 }
  ]);
  const matchedRoute = matchSnappedRouteToSelection({
    map: marloweDistrictMap,
    snappedRoute
  });

  assert.equal(matchedRoute.status, "matched");
  assert.deepEqual(matchedRoute.orderedRoadIds, ["r02", "r37", "r24"]);
  assert.deepEqual(matchedRoute.nodeIds, ["n02", "n03", "n12", "n17"]);

  const result = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-library-market-museum",
    userRoute: matchedRoute.selection
  });

  assert.equal(result.score.passed, true);
  assert.deepEqual(result.normalisedAttempt.selectedRoadIds, ["r02", "r37", "r24"]);
});
