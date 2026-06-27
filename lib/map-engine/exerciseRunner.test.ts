import assert from "node:assert/strict";
import test from "node:test";
import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  runRouteExercise,
  type MapDefinition,
  type RouteExercise
} from "./index.ts";

const libraryMarketMuseumRoute = {
  nodeIds: ["n02", "n03", "n12", "n17"],
  roadIds: ["r02", "r37", "r24"]
};

test("runRouteExercise runs a Marlowe District exercise end to end", () => {
  const result = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-library-market-museum",
    userRoute: libraryMarketMuseumRoute
  });

  assert.equal(result.exerciseId, "ex-library-market-museum");
  assert.equal(result.normalisedAttempt.exerciseId, "ex-library-market-museum");
  assert.equal(result.normalisedAttempt.startLandmarkId, "lm-westbourne-library");
  assert.deepEqual(result.normalisedAttempt.destinationLandmarkIds, ["lm-market-hall", "lm-civic-museum"]);
  assert.deepEqual(result.normalisedAttempt.requiredNodeIds, ["n02", "n12", "n17"]);
  assert.deepEqual(result.normalisedAttempt.selectedNodeIds, ["n02", "n03", "n12", "n17"]);
  assert.deepEqual(result.normalisedAttempt.selectedRoadIds, ["r02", "r37", "r24"]);
  assert.deepEqual(result.normalisedAttempt.selectedDirectedEdgeIds, ["r02:forward", "r37:forward", "r24:forward"]);
  assert.equal(result.score.passed, true);
  assert.equal(result.score.automaticFail, false);
  assert.equal(result.score.shortestLegalRouteDistanceMeters, 433);
  assert.equal(result.score.userRouteDistanceMeters, 443);
});

test("runRouteExercise throws a clear error for an unknown exercise id", () => {
  assert.throws(
    () =>
      runRouteExercise({
        map: marloweDistrictMap,
        exercises: marloweDistrictRouteExercises,
        exerciseId: "missing-exercise",
        userRoute: libraryMarketMuseumRoute
      }),
    /Unknown route exercise id: missing-exercise/
  );
});

test("runRouteExercise throws a clear error for an unknown landmark reference", () => {
  const exercises: RouteExercise[] = [
    {
      id: "bad-landmark-exercise",
      title: "Bad Landmark",
      mapId: marloweDistrictMap.id,
      stops: [
        { type: "landmark", landmarkId: "lm-westbourne-library" },
        { type: "landmark", landmarkId: "missing-landmark" }
      ]
    }
  ];

  assert.throws(
    () =>
      runRouteExercise({
        map: marloweDistrictMap,
        exercises,
        exerciseId: "bad-landmark-exercise",
        userRoute: libraryMarketMuseumRoute
      }),
    /Route exercise references unknown landmark id: missing-landmark/
  );
});

test("runRouteExercise throws a clear error for an unknown user route node id", () => {
  assert.throws(
    () =>
      runRouteExercise({
        map: marloweDistrictMap,
        exercises: marloweDistrictRouteExercises,
        exerciseId: "ex-library-market-museum",
        userRoute: {
          nodeIds: ["n02", "missing-node"]
        }
      }),
    /Unknown node id in user route: missing-node/
  );
});

test("runRouteExercise throws a clear error for an unknown user route road id", () => {
  assert.throws(
    () =>
      runRouteExercise({
        map: marloweDistrictMap,
        exercises: marloweDistrictRouteExercises,
        exerciseId: "ex-library-market-museum",
        userRoute: {
          roadIds: ["missing-road"]
        }
      }),
    /Unknown road id in user route: missing-road/
  );
});

test("runRouteExercise keeps empty manual route errors in the manual runner path", () => {
  assert.throws(
    () =>
      runRouteExercise({
        map: marloweDistrictMap,
        exercises: marloweDistrictRouteExercises,
        exerciseId: "ex-library-market-museum",
        userRoute: {
          nodeIds: [],
          roadIds: []
        }
      }),
    /User route must include nodeIds or roadIds/
  );
});

test("runRouteExercise throws a clear error for disconnected node sequences", () => {
  assert.throws(
    () =>
      runRouteExercise({
        map: marloweDistrictMap,
        exercises: marloweDistrictRouteExercises,
        exerciseId: "ex-library-market-museum",
        userRoute: {
          nodeIds: ["n02", "n05"]
        }
      }),
    /Disconnected node sequence: n02 is not connected to n05/
  );
});

test("runRouteExercise reports a wrong-start route through scoring", () => {
  const result = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-library-market-museum",
    userRoute: {
      nodeIds: ["n03", "n12", "n17"],
      roadIds: ["r37", "r24"]
    }
  });

  assert.equal(result.score.passed, false);
  assert.equal(result.score.automaticFail, false);
  assert(result.score.failureReasons.includes("wrong_start"));
});

test("runRouteExercise reports a missing destination through scoring", () => {
  const result = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-library-market-museum",
    userRoute: {
      nodeIds: ["n02", "n03", "n12"],
      roadIds: ["r02", "r37"]
    }
  });

  assert.equal(result.score.passed, false);
  assert(result.score.failureReasons.includes("wrong_destination"));
});

test("runRouteExercise reports missed required destinations through scoring", () => {
  const result = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-library-market-museum",
    userRoute: {
      nodeIds: ["n02", "n11", "n16", "n17"],
      roadIds: ["r09", "r25", "r21"]
    }
  });

  assert.equal(result.score.passed, false);
  assert(result.score.failureReasons.includes("missed_required_stop"));
});

test("runRouteExercise reports destinations visited out of order through scoring", () => {
  const map: MapDefinition = {
    id: "out-of-order-map",
    name: "Out Of Order Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 },
      { id: "c", x: 200, y: 0 },
      { id: "d", x: 300, y: 0 }
    ],
    roads: [
      { id: "road-ac", fromNodeId: "a", toNodeId: "c", distanceMeters: 100, isOneWay: false },
      { id: "road-cb", fromNodeId: "c", toNodeId: "b", distanceMeters: 100, isOneWay: false },
      { id: "road-bd", fromNodeId: "b", toNodeId: "d", distanceMeters: 100, isOneWay: false },
      { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false },
      { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 100, isOneWay: false },
      { id: "road-cd", fromNodeId: "c", toNodeId: "d", distanceMeters: 100, isOneWay: false }
    ],
    restrictions: [],
    landmarks: [
      { id: "lm-a", name: "A", x: 0, y: 0, nearestNodeId: "a" },
      { id: "lm-b", name: "B", x: 100, y: 0, nearestNodeId: "b" },
      { id: "lm-c", name: "C", x: 200, y: 0, nearestNodeId: "c" },
      { id: "lm-d", name: "D", x: 300, y: 0, nearestNodeId: "d" }
    ]
  };
  const exercises: RouteExercise[] = [
    {
      id: "ordered-exercise",
      title: "Ordered Exercise",
      mapId: map.id,
      stops: [
        { type: "landmark", landmarkId: "lm-a" },
        { type: "landmark", landmarkId: "lm-b" },
        { type: "landmark", landmarkId: "lm-c" },
        { type: "landmark", landmarkId: "lm-d" }
      ]
    }
  ];
  const result = runRouteExercise({
    map,
    exercises,
    exerciseId: "ordered-exercise",
    userRoute: {
      nodeIds: ["a", "c", "b", "d"],
      roadIds: ["road-ac", "road-cb", "road-bd"]
    }
  });

  assert.equal(result.score.passed, false);
  assert.deepEqual(result.score.failureReasons, ["missed_required_stop"]);
});

test("runRouteExercise passes illegal movement through legality and scoring", () => {
  const map: MapDefinition = {
    id: "illegal-runner-map",
    name: "Illegal Runner Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 }
    ],
    roads: [{ id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: true }],
    restrictions: [],
    landmarks: [
      { id: "lm-b", name: "B", x: 100, y: 0, nearestNodeId: "b" },
      { id: "lm-a", name: "A", x: 0, y: 0, nearestNodeId: "a" }
    ]
  };
  const exercises: RouteExercise[] = [
    {
      id: "illegal-exercise",
      title: "Illegal Exercise",
      mapId: map.id,
      stops: [
        { type: "landmark", landmarkId: "lm-b" },
        { type: "landmark", landmarkId: "lm-a" }
      ]
    }
  ];
  const result = runRouteExercise({
    map,
    exercises,
    exerciseId: "illegal-exercise",
    userRoute: {
      nodeIds: ["b", "a"],
      roadIds: ["road-ab"]
    }
  });

  assert.equal(result.score.passed, false);
  assert.equal(result.score.automaticFail, true);
  assert.deepEqual(result.score.failureReasons, ["illegal_route"]);
  assert(result.score.legality.illegalMovements.some((movement) => movement.type === "wrong_way_one_way"));
  assert.deepEqual(result.normalisedAttempt.selectedDirectedEdgeIds, []);
});

test("runRouteExercise scores legal routes that are longer than the shortest legal route", () => {
  const result = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-library-market-museum",
    userRoute: {
      nodeIds: ["n02", "n06", "n07", "n03", "n12", "n17"],
      roadIds: ["r08", "r05", "r18", "r37", "r24"]
    }
  });

  assert.equal(result.score.automaticFail, false);
  assert.equal(result.score.isLegal, true);
  assert.equal(result.score.shortestLegalRouteDistanceMeters, 433);
  assert.equal(result.score.userRouteDistanceMeters, 706);
  assert(result.score.scorePercent < 80);
  assert.deepEqual(result.score.failureReasons, ["below_efficiency_threshold"]);
});
