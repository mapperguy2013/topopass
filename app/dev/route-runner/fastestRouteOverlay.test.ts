import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  buildBlockedDirectedEdgeKeys,
  checkRouteLegality,
  createEmptyRouteDraft,
  buildLegalMovementGraph,
  findShortestLegalRoute,
  findShortestLegalRouteThroughStops,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  startRouteStroke,
  type LegalMovementGraph,
  type MapDefinition,
  type MapGraph,
  type RouteExercise,
  type ShortestLegalRouteThroughStopsResult,
  validateDirectedEdgePath
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

function routeDebugMessage(input: {
  graph: MapGraph;
  route: ShortestLegalRouteThroughStopsResult;
  blockedEdgeKeys: Set<string>;
  exerciseId?: string;
  stopNodeIds?: readonly string[];
}): string {
  const routeEdgeIds = input.route.found ? input.route.edgeIds : [];
  const routeNodeIds = input.route.found ? input.route.nodeIds : [];
  const routeEdgeKeys = routeEdgeIds.map((edgeId) => {
    const edge = input.graph.edgesById[edgeId];

    return edge ? `${edge.fromNodeId}->${edge.toNodeId}` : `missing edge ${edgeId}`;
  });
  const splitNodeIds = Object.keys(input.graph.nodesById)
    .filter((nodeId) => nodeId.includes("__split_"))
    .sort();
  const firstIllegalEdgeKey = routeEdgeKeys.find((edgeKey) => input.blockedEdgeKeys.has(edgeKey)) ?? null;
  const stopNodeIds = [...(input.stopNodeIds ?? input.route.stopNodeIds)];

  return JSON.stringify(
    {
      exerciseId: input.exerciseId ?? null,
      startNodeId: stopNodeIds[0] ?? null,
      finishNodeId: stopNodeIds[stopNodeIds.length - 1] ?? null,
      requiredStopNodeIds: stopNodeIds,
      routeNodeSequence: routeNodeIds,
      routeDirectedEdgeSequence: routeEdgeKeys,
      blockedEdgeKeys: [...input.blockedEdgeKeys].sort(),
      syntheticSplitNodes: splitNodeIds,
      firstIllegalEdgeKey
    },
    null,
    2
  );
}

function resolveExerciseStopNodeIds(map: MapDefinition, exercise: RouteExercise): string[] {
  return exercise.stops.map((stop) => {
    if (stop.type === "node") {
      return stop.nodeId;
    }

    const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

    assert(landmark?.nearestNodeId, `Route exercise ${exercise.id} references unresolved landmark ${stop.landmarkId}`);

    return landmark.nearestNodeId;
  });
}

function directedEdgeKeysForRoute(graph: MapGraph, route: Extract<ShortestLegalRouteThroughStopsResult, { found: true }>): string[] {
  return route.edgeIds.map((edgeId) => {
    const edge = graph.edgesById[edgeId];

    assert(edge, `Route referenced unknown edge ${edgeId}`);

    return `${edge.fromNodeId}->${edge.toNodeId}`;
  });
}

function assertRouteUsesLegalMovementGraph(input: {
  route: Extract<ShortestLegalRouteThroughStopsResult, { found: true }>;
  legalMovementGraph: LegalMovementGraph;
  debugMessage: string;
}): void {
  for (const edgeId of input.route.edgeIds) {
    assert(input.legalMovementGraph.edgesById[edgeId], input.debugMessage);
  }

  if (input.route.edgeIds.length === 0) {
    return;
  }

  const firstEdgeId = input.route.edgeIds[0];
  const firstEdge = input.legalMovementGraph.edgesById[firstEdgeId];

  assert(firstEdge, input.debugMessage);
  assert(
    input.legalMovementGraph.outgoingEdgeIdsByNodeId[firstEdge.fromNodeId]?.includes(firstEdgeId),
    input.debugMessage
  );

  for (let index = 1; index < input.route.edgeIds.length; index += 1) {
    const previousEdgeId = input.route.edgeIds[index - 1];
    const edgeId = input.route.edgeIds[index];
    const transitions = input.legalMovementGraph.transitionsByEdgeId[previousEdgeId] ?? [];

    assert(transitions.some((transition) => transition.toEdgeId === edgeId), input.debugMessage);
  }
}

function assertOverlayRendersValidatedRoute(input: {
  map: MapDefinition;
  exercise: RouteExercise;
  graph: MapGraph;
  route: Extract<ShortestLegalRouteThroughStopsResult, { found: true }>;
  debugMessage: string;
}): void {
  const overlay = buildFastestRouteOverlay({
    map: input.map,
    exercise: input.exercise,
    revealState: { visible: true },
    graph: input.graph
  });

  assert.equal(overlay.status, "available", input.debugMessage);

  if (overlay.status !== "available") {
    return;
  }

  assert.deepEqual(overlay.edgeIds, input.route.edgeIds, input.debugMessage);
  assert.deepEqual(overlay.nodeIds, input.route.nodeIds, input.debugMessage);
  assert.deepEqual(
    overlay.points,
    input.route.nodeIds.map((nodeId) => {
      const node = input.graph.nodesById[nodeId];

      assert(node, input.debugMessage);

      return { x: node.x, y: node.y };
    }),
    input.debugMessage
  );
}

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

test("Marlowe Civic Museum and Dock Road fastest route never renders blocked directed edges", () => {
  const graph = buildMapGraph(marloweDistrictMap);
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, marloweDistrictMap.restrictions);
  const exercise = marloweDistrictRouteExercises.find((candidate) => candidate.id === "ex-checkpoint-order-library-dock");

  assert.ok(exercise);
  assert(
    marloweDistrictMap.landmarks.some((landmark) => landmark.name === "Royal Oak Gardens"),
    "Marlowe fixture should include Royal Oak Gardens"
  );
  assert(
    marloweDistrictMap.nodes.some((node) => node.label === "Civic Museum"),
    "Marlowe fixture should include Civic Museum"
  );
  assert(
    marloweDistrictMap.roads.some((road) => road.name === "Theatre Street") &&
      marloweDistrictMap.roads.some((road) => road.name === "Dock Road West") &&
      marloweDistrictMap.roads.some((road) => road.name === "Dock Road East") &&
      marloweDistrictMap.roads.some((road) => road.name === "Brewery Lane"),
    "Marlowe fixture should include the screenshot-area roads"
  );

  const stopNodeIds = ["n02", "n12", "n17", "n22", "n24"];
  const route = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds,
    restrictions: marloweDistrictMap.restrictions
  });

  if (!route.found) {
    assert.equal(route.reason, "NO_ROUTE");
    return;
  }

  const debugMessage = routeDebugMessage({ graph, route, blockedEdgeKeys });
  const routeEdgeKeys = route.edgeIds.map((edgeId) => {
    const edge = graph.edgesById[edgeId];

    return `${edge.fromNodeId}->${edge.toNodeId}`;
  });

  for (const edgeKey of routeEdgeKeys) {
    assert.equal(blockedEdgeKeys.has(edgeKey), false, debugMessage);
  }

  assert.equal(
    validateDirectedEdgePath({
      graph,
      edgeIds: route.edgeIds,
      restrictions: marloweDistrictMap.restrictions
    }).valid,
    true,
    debugMessage
  );

  const overlay = buildFastestRouteOverlay({
    map: marloweDistrictMap,
    exercise,
    revealState: { visible: true },
    graph
  });

  assert.equal(overlay.status, "available", debugMessage);

  if (overlay.status === "available") {
    assert.deepEqual(overlay.edgeIds, route.edgeIds);
    assert.deepEqual(overlay.nodeIds, route.nodeIds);
    assert.deepEqual(
      overlay.points,
      route.nodeIds.map((nodeId) => {
        const node = graph.nodesById[nodeId];

        return { x: node.x, y: node.y };
      })
    );
  }
});

test("all route-runner fastest routes either return no route or render only validated legal edges", () => {
  const exerciseSuites = [
    {
      map: marloweDistrictMap,
      exercises: marloweDistrictRouteExercises
    }
  ];
  let unreachableRouteCount = 0;
  let renderableRouteCount = 0;

  for (const suite of exerciseSuites) {
    const graph = buildMapGraph(suite.map);
    const legalMovementGraph = buildLegalMovementGraph(suite.map);
    const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, suite.map.restrictions);

    for (const exercise of suite.exercises) {
      const stopNodeIds = resolveExerciseStopNodeIds(suite.map, exercise);
      const route = findShortestLegalRouteThroughStops({
        graph,
        stopNodeIds,
        restrictions: suite.map.restrictions
      });
      const debugMessage = routeDebugMessage({
        graph,
        route,
        blockedEdgeKeys,
        exerciseId: exercise.id,
        stopNodeIds
      });

      if (!route.found) {
        assert.equal(route.reason, "NO_ROUTE", debugMessage);
        unreachableRouteCount += 1;
        continue;
      }

      renderableRouteCount += 1;

      for (const edgeKey of directedEdgeKeysForRoute(graph, route)) {
        assert.equal(blockedEdgeKeys.has(edgeKey), false, debugMessage);
      }

      assert.equal(
        validateDirectedEdgePath({
          graph,
          edgeIds: route.edgeIds,
          restrictions: suite.map.restrictions
        }).valid,
        true,
        debugMessage
      );

      assertRouteUsesLegalMovementGraph({
        route,
        legalMovementGraph,
        debugMessage
      });
      assertOverlayRendersValidatedRoute({
        map: suite.map,
        exercise,
        graph,
        route,
        debugMessage
      });
    }
  }

  assert(renderableRouteCount > 0, "Expected at least one route exercise to produce a renderable legal route");
  assert(
    unreachableRouteCount > 0,
    "Expected at least one route exercise to return NO_ROUTE so unreachable exercises stay supported"
  );
});

test("fastest route overlay renders from validated split graph nodes instead of unsplit road geometry", () => {
  const splitMap: MapDefinition = {
    id: "split-render-map",
    name: "Split render map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 }
    ],
    roads: [{ id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false }],
    restrictions: [
      {
        id: "no-entry-ab-halfway",
        type: "no_entry",
        roadId: "road-ab",
        fromNodeId: "a",
        toNodeId: "b",
        blockedFromDistanceMeters: 50,
        blockedToDistanceMeters: 100
      }
    ],
    landmarks: []
  };
  const splitExercise: RouteExercise = {
    id: "split-render",
    title: "Split render",
    mapId: splitMap.id,
    stops: [
      { type: "node", nodeId: "b" },
      { type: "node", nodeId: "a" }
    ]
  };
  const graph = buildMapGraph(splitMap);
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, splitMap.restrictions);
  const route = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds: ["b", "a"],
    restrictions: splitMap.restrictions
  });
  const debugMessage = routeDebugMessage({ graph, route, blockedEdgeKeys });

  assert.equal(route.found, true, debugMessage);

  if (route.found) {
    assert.deepEqual(route.nodeIds, ["b", "road-ab__split_50", "a"], debugMessage);
    assert.equal(validateDirectedEdgePath({ graph, edgeIds: route.edgeIds, restrictions: splitMap.restrictions }).valid, true);
  }

  const overlay = buildFastestRouteOverlay({
    map: splitMap,
    exercise: splitExercise,
    revealState: { visible: true },
    graph
  });

  assert.equal(overlay.status, "available", debugMessage);

  if (overlay.status === "available") {
    assert.deepEqual(overlay.nodeIds, ["b", "road-ab__split_50", "a"]);
    assert.deepEqual(overlay.points, [
      { x: 100, y: 0 },
      { x: 50, y: 0 },
      { x: 0, y: 0 }
    ]);
  }
});
