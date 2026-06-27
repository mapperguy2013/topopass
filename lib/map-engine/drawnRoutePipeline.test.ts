import assert from "node:assert/strict";
import test from "node:test";
import {
  createDrawnRouteTrace,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  runDrawnRoutePipeline,
  runRouteExercise,
  type MapDefinition,
  type RouteExercise,
  type Vec2
} from "./index.ts";

const cleanMarloweLibraryRoute: Vec2[] = [
  { x: 180, y: 181 },
  { x: 290, y: 242 },
  { x: 352, y: 380 }
];

function pipelineForMarlowe(points: Vec2[], exerciseId = "ex-library-market-museum") {
  return runDrawnRoutePipeline({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId,
    drawnTrace: createDrawnRouteTrace(points),
    options: {
      maximumSnapDistance: 18
    }
  });
}

test("empty drawn trace returns empty status", () => {
  const result = pipelineForMarlowe([]);

  assert.equal(result.status, "empty");
  assert.equal(result.snappedRoute, null);
  assert.equal(result.matchResult, null);
  assert.equal(result.exerciseResult, null);
  assert.equal(result.warnings[0]?.code, "empty_trace");
});

test("one-point drawn trace returns insufficient_points status", () => {
  const result = pipelineForMarlowe([{ x: 180, y: 181 }]);

  assert.equal(result.status, "insufficient_points");
  assert.equal(result.snappedRoute, null);
  assert.equal(result.matchResult, null);
  assert.equal(result.exerciseResult, null);
  assert.equal(result.warnings[0]?.code, "insufficient_raw_points");
});

test("tap-like two-point drawn trace is not scored", () => {
  const result = pipelineForMarlowe([
    { x: 180, y: 181 },
    { x: 352, y: 380 }
  ]);

  assert.equal(result.status, "insufficient_points");
  assert.equal(result.snappedRoute, null);
  assert.equal(result.matchResult, null);
  assert.equal(result.exerciseResult, null);
  assert.equal(result.warnings[0]?.code, "insufficient_raw_points");
  assert.equal(
    result.warnings.some((warning) => warning.message.includes("User route must include nodeIds or roadIds")),
    false
  );
});

test("tiny drawn movement below threshold is not scored", () => {
  const result = pipelineForMarlowe([
    { x: 180, y: 181 },
    { x: 183, y: 181 },
    { x: 186, y: 181 }
  ]);

  assert.equal(result.status, "insufficient_points");
  assert.equal(result.snappedRoute, null);
  assert.equal(result.matchResult, null);
  assert.equal(result.exerciseResult, null);
  assert.equal(result.warnings[0]?.code, "insufficient_movement");
  assert.equal(
    result.warnings.some((warning) => warning.message.includes("User route must include nodeIds or roadIds")),
    false
  );
});

test("clean drawn Marlowe route snaps, matches, and scores through the exercise runner", () => {
  const result = pipelineForMarlowe(cleanMarloweLibraryRoute);

  assert.equal(result.status, "scored");
  assert.equal(result.simplifiedTrace.points.length, 3);
  assert.equal(result.snappedPoints.length, 3);
  assert.deepEqual(result.matchResult?.orderedRoadIds, ["r02", "r37", "r24"]);
  assert.deepEqual(result.matchResult?.nodeIds, ["n02", "n03", "n12", "n17"]);
  assert.deepEqual(result.matchResult?.directedEdgeIds, ["r02:forward", "r37:forward", "r24:forward"]);
  assert.equal(result.exerciseResult?.score.passed, true);
  assert.deepEqual(result.exerciseResult?.normalisedAttempt.requiredNodeIds, ["n02", "n12", "n17"]);
  assert.deepEqual(result.exerciseResult?.normalisedAttempt.selectedRoadIds, ["r02", "r37", "r24"]);
});

test("long legal drawn Marlowe route reaches scoring and fails below the pass mark", () => {
  const result = pipelineForMarlowe([
    { x: 95, y: 125 },
    { x: 140, y: 58 },
    { x: 235, y: 112 },
    { x: 290, y: 242 },
    { x: 352, y: 380 }
  ]);

  assert.equal(result.status, "scored");
  assert.deepEqual(result.matchResult?.orderedRoadIds, ["r08", "r05", "r18", "r37", "r24"]);
  assert.deepEqual(result.matchResult?.nodeIds, ["n02", "n06", "n07", "n03", "n12", "n17"]);
  assert.equal(result.exerciseResult?.score.automaticFail, false);
  assert.equal(result.exerciseResult?.score.isLegal, true);
  assert.equal(result.exerciseResult?.score.passed, false);
  assert.deepEqual(result.exerciseResult?.score.failureReasons, ["below_efficiency_threshold"]);
  assert.equal(result.exerciseResult?.score.shortestLegalRouteDistanceMeters, 433);
  assert.equal(result.exerciseResult?.score.userRouteDistanceMeters, 706);
});

test("clean drawn pipeline remains compatible with manual route runner selection", () => {
  const pipelineResult = pipelineForMarlowe(cleanMarloweLibraryRoute);
  const manualResult = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-library-market-museum",
    userRoute: {
      nodeIds: ["n02", "n03", "n12", "n17"],
      roadIds: ["r02", "r37", "r24"]
    }
  });

  assert.deepEqual(pipelineResult.matchResult?.selection, {
    nodeIds: manualResult.normalisedAttempt.selectedNodeIds,
    roadIds: manualResult.normalisedAttempt.selectedRoadIds
  });
  assert.equal(pipelineResult.exerciseResult?.score.scorePercent, manualResult.score.scorePercent);
});

test("disconnected drawn route returns matching_failed without faking a connected route", () => {
  const result = pipelineForMarlowe([
    { x: 180, y: 181 },
    { x: 352, y: 380 },
    { x: 470, y: 437 }
  ]);

  assert.equal(result.status, "matching_failed");
  assert.equal(result.exerciseResult, null);
  assert.equal(result.matchResult?.status, "disconnected");
  assert.deepEqual(result.matchResult?.orderedRoadIds, ["r02", "r24", "r22"]);
  assert(result.warnings.some((warning) => warning.code === "disconnected_roads"));
});

test("off-road drawn route is blocked before scoring", () => {
  const result = pipelineForMarlowe([
    { x: -200, y: -200 },
    { x: -180, y: -180 },
    { x: -160, y: -160 }
  ]);

  assert.equal(result.status, "snapping_failed");
  assert.equal(result.matchResult, null);
  assert.equal(result.exerciseResult, null);
  assert(result.warnings.some((warning) => warning.source === "snapping" && warning.code === "off_road_points"));
});

test("wrong-way drawn route is matched and left for scoring to fail as illegal", () => {
  const map: MapDefinition = {
    id: "drawn-pipeline-one-way-map",
    name: "Drawn Pipeline One Way Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 }
    ],
    roads: [{ id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: true }],
    restrictions: [],
    landmarks: []
  };
  const exercises: RouteExercise[] = [
    {
      id: "wrong-way-exercise",
      title: "Wrong Way Exercise",
      mapId: map.id,
      stops: [
        { type: "node", nodeId: "b" },
        { type: "node", nodeId: "a" }
      ]
    }
  ];
  const result = runDrawnRoutePipeline({
    map,
    exercises,
    exerciseId: "wrong-way-exercise",
    drawnTrace: createDrawnRouteTrace([
      { x: 100, y: 0 },
      { x: 50, y: 0 },
      { x: 0, y: 0 }
    ]),
    options: {
      maximumSnapDistance: 4,
      simplifyTolerance: 0
    }
  });

  assert.equal(result.status, "scored");
  assert.deepEqual(result.matchResult?.nodeIds, ["b", "a"]);
  assert.deepEqual(result.matchResult?.directedEdgeSequence, [null]);
  assert(result.warnings.some((warning) => warning.code === "unresolved_direction"));
  assert.equal(result.exerciseResult?.score.automaticFail, true);
  assert.deepEqual(result.exerciseResult?.score.failureReasons, ["illegal_route"]);
  assert(
    result.exerciseResult?.score.legality.illegalMovements.some(
      (movement) => movement.type === "wrong_way_one_way"
    )
  );
});

test("prohibited-turn drawn route is scored by existing legality without pipeline override", () => {
  const exercises: RouteExercise[] = [
    {
      id: "market-to-theatre-prohibited",
      title: "Market Cross to Theatre Arcade",
      mapId: marloweDistrictMap.id,
      stops: [
        { type: "node", nodeId: "n12" },
        { type: "node", nodeId: "n18" }
      ]
    }
  ];
  const result = runDrawnRoutePipeline({
    map: marloweDistrictMap,
    exercises,
    exerciseId: "market-to-theatre-prohibited",
    drawnTrace: createDrawnRouteTrace([
      { x: 333, y: 341 },
      { x: 360, y: 395 },
      { x: 460, y: 438 },
      { x: 545, y: 430 }
    ]),
    options: {
      maximumSnapDistance: 18
    }
  });

  assert.equal(result.status, "scored");
  assert.deepEqual(result.matchResult?.orderedRoadIds, ["r24", "r22"]);
  assert.equal(result.exerciseResult?.score.automaticFail, true);
  assert.deepEqual(result.exerciseResult?.score.failureReasons, ["illegal_route"]);
  assert(
    result.exerciseResult?.score.legality.illegalMovements.some(
      (movement) => movement.type === "prohibited_turn"
    )
  );
});

test("consecutive duplicate road drawing collapses to one matched road", () => {
  const exercises: RouteExercise[] = [
    {
      id: "albion-street-west",
      title: "Albion Street West",
      mapId: marloweDistrictMap.id,
      stops: [
        { type: "node", nodeId: "n02" },
        { type: "node", nodeId: "n03" }
      ]
    }
  ];
  const result = runDrawnRoutePipeline({
    map: marloweDistrictMap,
    exercises,
    exerciseId: "albion-street-west",
    drawnTrace: createDrawnRouteTrace([
      { x: 122, y: 190 },
      { x: 150, y: 186 },
      { x: 190, y: 184 },
      { x: 230, y: 176 },
      { x: 258, y: 170 }
    ]),
    options: {
      maximumSnapDistance: 18,
      simplifyTolerance: 0
    }
  });

  assert.equal(result.status, "scored");
  assert.deepEqual(result.matchResult?.orderedRoadIds, ["r02"]);
  assert.deepEqual(result.matchResult?.nodeIds, ["n02", "n03"]);
  assert.equal(result.exerciseResult?.score.passed, true);
});
