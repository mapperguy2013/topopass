import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  checkRouteLegality,
  createEmptyRouteDraft,
  findShortestLegalRoute,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  startRouteStroke,
  type MapDefinition,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import {
  buildFastestRouteOverlay,
  createHiddenFastestRouteRevealState,
  hideFastestRouteReveal,
  toggleFastestRouteReveal
} from "./fastestRouteOverlay.ts";

const fastestRouteTestMap: MapDefinition = {
  id: "fastest-route-test-map",
  name: "Fastest route test map",
  nodes: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 100, y: 0 },
    { id: "c", x: 50, y: 50 },
    { id: "d", x: 100, y: 100 }
  ],
  roads: [
    { id: "r-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 120, isOneWay: false },
    { id: "r-ac", fromNodeId: "a", toNodeId: "c", distanceMeters: 40, isOneWay: false },
    { id: "r-cb", fromNodeId: "c", toNodeId: "b", distanceMeters: 40, isOneWay: false },
    { id: "r-bd", fromNodeId: "b", toNodeId: "d", distanceMeters: 55, isOneWay: false },
    { id: "r-cd", fromNodeId: "c", toNodeId: "d", distanceMeters: 200, isOneWay: false }
  ],
  restrictions: [],
  landmarks: []
};

const pointToPointExercise: RouteExercise = {
  id: "point-to-point",
  title: "Point to point",
  mapId: fastestRouteTestMap.id,
  stops: [
    { type: "node", nodeId: "a" },
    { type: "node", nodeId: "b" }
  ]
};

const multiStopExercise: RouteExercise = {
  id: "multi-stop",
  title: "Multi stop",
  mapId: fastestRouteTestMap.id,
  stops: [
    { type: "node", nodeId: "a" },
    { type: "node", nodeId: "b" },
    { type: "node", nodeId: "d" }
  ]
};

test("fastest route reveal is hidden by default", () => {
  const state = createHiddenFastestRouteRevealState();
  const overlay = buildFastestRouteOverlay({
    map: fastestRouteTestMap,
    exercise: pointToPointExercise,
    revealState: state
  });

  assert.equal(state.visible, false);
  assert.equal(overlay.status, "hidden");
  assert.deepEqual(overlay.points, []);
});

test("fastest route reveal toggles and hides deterministically", () => {
  const shown = toggleFastestRouteReveal(createHiddenFastestRouteRevealState());
  const hidden = toggleFastestRouteReveal(shown);

  assert.equal(shown.visible, true);
  assert.equal(hidden.visible, false);
  assert.deepEqual(hideFastestRouteReveal(), { visible: false });
});

test("revealing fastest route does not mutate the user draft route", () => {
  const draft = startRouteStroke(createEmptyRouteDraft(), { x: 12, y: 34 });
  const before = structuredClone(draft);

  buildFastestRouteOverlay({
    map: fastestRouteTestMap,
    exercise: pointToPointExercise,
    revealState: { visible: true }
  });

  assert.deepEqual(draft, before);
});

test("hiding fastest route works after an exercise switch reset", () => {
  const visible = toggleFastestRouteReveal(createHiddenFastestRouteRevealState());
  const hidden = hideFastestRouteReveal();

  assert.equal(visible.visible, true);
  assert.equal(hidden.visible, false);
});

test("fastest route uses existing shortest-route output", () => {
  const graph = buildMapGraph(fastestRouteTestMap);
  const directShortest = findShortestLegalRoute({
    graph,
    startNodeId: "a",
    endNodeId: "b",
    restrictions: fastestRouteTestMap.restrictions
  });
  const overlay = buildFastestRouteOverlay({
    map: fastestRouteTestMap,
    exercise: pointToPointExercise,
    revealState: { visible: true }
  });

  assert.equal(directShortest.found, true);
  assert.equal(overlay.status, "available");
  assert.equal(overlay.distanceMeters, directShortest.found ? directShortest.distanceMeters : 0);
  assert.deepEqual(overlay.roadIds, directShortest.found ? directShortest.roadIds : []);
  assert.deepEqual(overlay.nodeIds, directShortest.found ? directShortest.nodeIds : []);
});

test("fastest route combines shortest legal legs for multi-stop exercises", () => {
  const overlay = buildFastestRouteOverlay({
    map: fastestRouteTestMap,
    exercise: multiStopExercise,
    revealState: { visible: true }
  });

  assert.equal(overlay.status, "available");
  assert.equal(overlay.distanceMeters, 135);
  assert.deepEqual(overlay.nodeIds, ["a", "c", "b", "d"]);
  assert.deepEqual(overlay.roadIds, ["r-ac", "r-cb", "r-bd"]);
});

test("fastest route returns a non-blocking unavailable result when no route exists", () => {
  const blockedMap: MapDefinition = {
    ...fastestRouteTestMap,
    restrictions: [
      {
        id: "block-r-ac",
        type: "no_entry",
        roadId: "r-ac"
      },
      {
        id: "block-r-ab",
        type: "no_entry",
        roadId: "r-ab"
      }
    ]
  };
  const overlay = buildFastestRouteOverlay({
    map: blockedMap,
    exercise: pointToPointExercise,
    revealState: { visible: true }
  });

  assert.equal(overlay.status, "unavailable");
  assert.equal(overlay.message, "No legal fastest route available for this exercise.");
  assert.deepEqual(overlay.points, []);
});

test("fastest route reveal does not render an illegal route", () => {
  const graph = buildMapGraph(marloweDistrictMap);
  const exercise = marloweDistrictRouteExercises.find((candidate) => candidate.id === "ex-crown-market-gardens");

  assert.ok(exercise);

  const overlay = buildFastestRouteOverlay({
    map: marloweDistrictMap,
    exercise,
    revealState: { visible: true }
  });

  assert.equal(overlay.status, "available");

  if (overlay.status === "available") {
    const movements = overlay.edgeIds.map((edgeId) => {
      const edge = graph.edgesById[edgeId];

      return {
        roadId: edge.roadId,
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId
      };
    });
    const legality = checkRouteLegality({
      map: marloweDistrictMap,
      movements
    });

    assert.equal(legality.isLegal, true);
    assert(!legality.illegalMovements.some((movement) => movement.type === "no_entry"));
    assert(!legality.illegalMovements.some((movement) => movement.type === "no_u_turn"));
  }
});

test("fastest route reveal marks an unreachable finish as invalid", () => {
  const blockedMap: MapDefinition = {
    ...fastestRouteTestMap,
    restrictions: [
      {
        id: "block-r-ab",
        type: "no_entry",
        roadId: "r-ab"
      },
      {
        id: "block-r-cb",
        type: "no_entry",
        roadId: "r-cb"
      },
      {
        id: "block-r-bd",
        type: "no_entry",
        roadId: "r-bd"
      },
      {
        id: "block-r-cd",
        type: "no_entry",
        roadId: "r-cd"
      }
    ]
  };
  const overlay = buildFastestRouteOverlay({
    map: blockedMap,
    exercise: pointToPointExercise,
    revealState: { visible: true }
  });

  assert.equal(overlay.status, "unavailable");
  assert.equal(overlay.message, "No legal fastest route available for this exercise.");
  assert(overlay.invalidReasons.some((reason) => reason.includes("no valid legal route")));
});

test("fastest route reveal marks the invalid Marlowe no-entry focus exercise unavailable", () => {
  const exercise = marloweDistrictRouteExercises.find((candidate) => candidate.id === "ex-no-entry-eastgate-market");

  assert.ok(exercise);

  const overlay = buildFastestRouteOverlay({
    map: marloweDistrictMap,
    exercise,
    revealState: { visible: true }
  });

  assert.equal(overlay.status, "unavailable");
  assert.equal(overlay.message, "No legal fastest route available for this exercise.");
  assert(overlay.invalidReasons.some((reason) => reason.includes(exercise.id)));
});
