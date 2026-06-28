import assert from "node:assert/strict";
import test from "node:test";
import {
  getTurnRestrictionVisuals,
  marloweDistrictMap,
  type DrawnRoutePipelineResult,
  type MapDefinition,
  type RunRouteExerciseResult,
  type TurnRestrictionVisual
} from "../../../lib/map-engine/index.ts";
import {
  buildRoadRestrictionOverlays,
  buildRouteIssueOverlays,
  getDefaultCanvasOverlayDisplayOptions,
  getDrawnPipelineDisplayStatus,
  getDrawnRouteScoreDisplay,
  getPipelineIssueGroups,
  getPipelineStageBadges,
  getRoadRestrictionDirectionAngleRadians,
  getRoadRestrictionSignFaceRotationRadians,
  getRouteIssueLineStyle,
  getRequiredStopVisitStatuses,
  getTurnRestrictionDisplayItems,
  getVisualTurnRestrictionTurnKind
} from "./routeRunnerDisplay.ts";

const restrictionOverlayMap: MapDefinition = {
  id: "restriction-overlay-map",
  name: "Restriction Overlay Map",
  nodes: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 100, y: 0 },
    { id: "c", x: 100, y: 100 },
    { id: "d", x: 0, y: 100 }
  ],
  roads: [
    {
      id: "one-way-road",
      fromNodeId: "a",
      toNodeId: "b",
      distanceMeters: 100,
      isOneWay: true
    },
    {
      id: "no-entry-road",
      fromNodeId: "b",
      toNodeId: "c",
      distanceMeters: 100,
      isOneWay: false
    },
    {
      id: "closed-road",
      fromNodeId: "c",
      toNodeId: "d",
      distanceMeters: 100,
      isOneWay: false
    },
    {
      id: "turn-only-road",
      fromNodeId: "d",
      toNodeId: "a",
      distanceMeters: 100,
      isOneWay: false
    }
  ],
  restrictions: [
    {
      id: "no-entry-bc",
      type: "no_entry",
      roadId: "no-entry-road",
      fromNodeId: "b",
      toNodeId: "c",
      reason: "Buses only"
    },
    {
      id: "closed-cd",
      type: "road_closed",
      roadId: "closed-road",
      reason: "Road closed"
    },
    {
      id: "turn-da-ab",
      type: "prohibited_turn",
      fromRoadId: "turn-only-road",
      viaNodeId: "a",
      toRoadId: "one-way-road",
      reason: "No right turn"
    }
  ],
  landmarks: []
};

function pipelineResult(value: Partial<DrawnRoutePipelineResult>): DrawnRoutePipelineResult {
  return {
    status: "empty",
    simplifiedTrace: { points: [] },
    snappedRoute: null,
    snappedPoints: [],
    matchResult: null,
    exerciseResult: null,
    warnings: [],
    ...value
  } as DrawnRoutePipelineResult;
}

function exerciseResult(value: Partial<RunRouteExerciseResult> = {}): RunRouteExerciseResult {
  return {
    exerciseId: "exercise",
    normalisedAttempt: {
      exerciseId: "exercise",
      destinationLandmarkIds: [],
      requiredNodeIds: ["a", "b", "d"],
      selectedNodeIds: ["a", "b", "c", "d"],
      selectedRoadIds: ["road-ab", "road-bc", "road-cd"],
      selectedDirectedEdgeIds: ["road-ab:forward", "road-bc:forward", "road-cd:forward"],
      movements: []
    },
    score: {
      passed: true,
      automaticFail: false,
      status: "pass",
      isLegal: true,
      scorePercent: 90,
      efficiencyRatio: 0.9,
      scoreRatio: 0.9,
      userRouteDistanceMeters: 120,
      shortestLegalRouteDistanceMeters: 108,
      userDistanceMeters: 120,
      shortestLegalDistanceMeters: 108,
      passThresholdPercent: 80,
      thresholdPercent: 80,
      failureReasons: [],
      legality: {
        isLegal: true,
        automaticFail: false,
        illegalMovements: []
      }
    },
    ...value
  };
}

function turnRestrictionVisual(value: Pick<TurnRestrictionVisual, "turnKind" | "incomingRoadPoint" | "junction">): TurnRestrictionVisual {
  return {
    id: "visual-turn",
    reason: "prohibited_turn",
    turnClass:
      value.turnKind === "no-left-turn" ? "left" : value.turnKind === "no-right-turn" ? "right" : "u_turn",
    fromRoadId: "from-road",
    toRoadId: "to-road",
    viaNodeId: "junction",
    label: "No turn",
    message: "No turn",
    outgoingRoadPoint: { x: value.junction.x + 100, y: value.junction.y },
    signPosition: { x: value.junction.x, y: value.junction.y },
    iconRotationRadians: 0,
    angleDegrees: 0,
    incomingAngleRadians: 0,
    outgoingAngleRadians: 0,
    markerAngleRadians: 0,
    ...value
  };
}

test("restriction overlays include one-way road direction", () => {
  const overlays = buildRoadRestrictionOverlays(restrictionOverlayMap);
  const oneWayOverlay = overlays.find((overlay) => overlay.roadId === "one-way-road" && overlay.kind === "one-way");

  assert.deepEqual(oneWayOverlay, {
    roadId: "one-way-road",
    kind: "one-way",
    label: "One-way",
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 }
    ],
    midpoint: { x: 50, y: 0 },
    direction: {
      from: { x: 0, y: 0 },
      to: { x: 100, y: 0 }
    }
  });
});

test("restriction overlays include no-entry and closed road overlays", () => {
  const overlays = buildRoadRestrictionOverlays(restrictionOverlayMap);
  const noEntryOverlay = overlays.find((overlay) => overlay.roadId === "no-entry-road");
  const closedOverlay = overlays.find((overlay) => overlay.roadId === "closed-road");

  assert.deepEqual(noEntryOverlay, {
    roadId: "no-entry-road",
    kind: "no-entry",
    label: "No entry: Buses only",
    points: [
      { x: 100, y: 0 },
      { x: 100, y: 100 }
    ],
    midpoint: { x: 100, y: 50 },
    direction: {
      from: { x: 100, y: 0 },
      to: { x: 100, y: 100 }
    }
  });
  assert.deepEqual(closedOverlay, {
    roadId: "closed-road",
    kind: "restricted",
    label: "Restricted: Road closed",
    points: [
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ],
    midpoint: { x: 50, y: 100 }
  });
});

test("road restriction sign faces stay screen upright while direction arrows follow roads", () => {
  const overlays = buildRoadRestrictionOverlays(restrictionOverlayMap);
  const oneWayOverlay = overlays.find((overlay) => overlay.roadId === "one-way-road" && overlay.kind === "one-way");
  const noEntryOverlay = overlays.find((overlay) => overlay.roadId === "no-entry-road");
  const closedOverlay = overlays.find((overlay) => overlay.roadId === "closed-road");

  assert.ok(oneWayOverlay);
  assert.ok(noEntryOverlay);
  assert.ok(closedOverlay);
  assert.equal(getRoadRestrictionSignFaceRotationRadians(oneWayOverlay), 0);
  assert.equal(getRoadRestrictionSignFaceRotationRadians(noEntryOverlay), 0);
  assert.equal(getRoadRestrictionSignFaceRotationRadians(closedOverlay), 0);
  assert.equal(getRoadRestrictionDirectionAngleRadians(oneWayOverlay), 0);
  assert.equal(getRoadRestrictionDirectionAngleRadians(noEntryOverlay), Math.PI / 2);
  assert.equal(getRoadRestrictionDirectionAngleRadians(closedOverlay), null);
});

test("restriction overlays do not draw turn-only restrictions as road overlays", () => {
  const overlays = buildRoadRestrictionOverlays(restrictionOverlayMap);

  assert.equal(overlays.some((overlay) => overlay.roadId === "turn-only-road"), false);
  assert.deepEqual(
    overlays.map((overlay) => `${overlay.kind}:${overlay.roadId}`),
    ["one-way:one-way-road", "no-entry:no-entry-road", "restricted:closed-road"]
  );
});

test("default canvas overlay display uses symbol-only markers without text labels", () => {
  assert.deepEqual(getDefaultCanvasOverlayDisplayOptions(), {
    showTextLabels: false
  });
});

test("route issue overlays are hidden for passing scored routes", () => {
  const overlays = buildRouteIssueOverlays(
    restrictionOverlayMap,
    pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult()
    })
  );

  assert.deepEqual(overlays, []);
});

test("route issue overlays highlight illegal no-entry movements", () => {
  const overlays = buildRouteIssueOverlays(
    restrictionOverlayMap,
    pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          passed: false,
          automaticFail: true,
          status: "fail",
          isLegal: false,
          scorePercent: 0,
          failureReasons: ["illegal_route"],
          legality: {
            isLegal: false,
            automaticFail: true,
            illegalMovements: [
              {
                type: "no_entry",
                movementIndex: 0,
                roadId: "no-entry-road",
                fromNodeId: "b",
                toNodeId: "c",
                message: "Movement 0 uses no-entry road no-entry-road from b to c."
              }
            ]
          }
        }
      })
    })
  );

  assert.deepEqual(overlays, [
    {
      kind: "no-entry",
      label: "No entry",
      message: "Movement 0 uses no-entry road no-entry-road from b to c.",
      points: [
        { x: 100, y: 0 },
        { x: 100, y: 100 }
      ],
      midpoint: { x: 100, y: 50 },
      roadIds: ["no-entry-road"],
      movementIndex: 0,
      direction: {
        from: { x: 100, y: 0 },
        to: { x: 100, y: 100 }
      }
    }
  ]);
});

test("route issue overlays highlight wrong-way one-way movements", () => {
  const overlays = buildRouteIssueOverlays(
    restrictionOverlayMap,
    pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          passed: false,
          automaticFail: true,
          status: "fail",
          isLegal: false,
          scorePercent: 0,
          failureReasons: ["illegal_route"],
          legality: {
            isLegal: false,
            automaticFail: true,
            illegalMovements: [
              {
                type: "wrong_way_one_way",
                movementIndex: 1,
                roadId: "one-way-road",
                fromNodeId: "b",
                toNodeId: "a",
                message: "Movement 1 travels the wrong way on one-way road one-way-road."
              }
            ]
          }
        }
      })
    })
  );

  assert.equal(overlays.length, 1);
  assert.equal(overlays[0].kind, "wrong-way");
  assert.equal(overlays[0].label, "Wrong way");
  assert.deepEqual(overlays[0].roadIds, ["one-way-road"]);
  assert.deepEqual(overlays[0].direction, {
    from: { x: 100, y: 0 },
    to: { x: 0, y: 0 }
  });
});

test("route issue overlays highlight disconnected matching transitions before scoring", () => {
  const overlays = buildRouteIssueOverlays(
    restrictionOverlayMap,
    pipelineResult({
      status: "matching_failed",
      warnings: [
        {
          source: "matching",
          code: "disconnected_roads",
          severity: "warning",
          message: "Road one-way-road does not share a node with closed-road.",
          fromRoadId: "one-way-road",
          toRoadId: "closed-road"
        }
      ]
    })
  );

  assert.deepEqual(overlays, [
    {
      kind: "disconnected",
      label: "Disconnected roads",
      message: "Disconnected between one-way-road and closed-road.",
      points: [
        { x: 50, y: 0 },
        { x: 50, y: 100 }
      ],
      midpoint: { x: 50, y: 50 },
      roadIds: ["one-way-road", "closed-road"]
    }
  ]);
});

test("route issue overlays highlight explicit prohibited turns after scoring", () => {
  const overlays = buildRouteIssueOverlays(
    restrictionOverlayMap,
    pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          passed: false,
          automaticFail: true,
          status: "fail",
          isLegal: false,
          scorePercent: 0,
          failureReasons: ["illegal_route"],
          legality: {
            isLegal: false,
            automaticFail: true,
            illegalMovements: [
              {
                type: "prohibited_turn",
                movementIndex: 1,
                roadId: "one-way-road",
                fromNodeId: "a",
                toNodeId: "b",
                previousRoadId: "turn-only-road",
                nextRoadId: "one-way-road",
                viaNodeId: "a",
                message: "Movement 1 makes a prohibited turn from road turn-only-road to road one-way-road at node a."
              }
            ]
          }
        }
      })
    })
  );

  assert.equal(overlays.length, 1);
  assert.equal(overlays[0].kind, "prohibited-turn");
  assert.equal(overlays[0].label, "Prohibited turn");
  assert.deepEqual(overlays[0].roadIds, ["turn-only-road", "one-way-road"]);
});

test("route issue overlays prefer no-entry over redundant prohibited turn on the same movement", () => {
  const overlays = buildRouteIssueOverlays(
    restrictionOverlayMap,
    pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          passed: false,
          automaticFail: true,
          status: "fail",
          isLegal: false,
          scorePercent: 0,
          failureReasons: ["illegal_route"],
          legality: {
            isLegal: false,
            automaticFail: true,
            illegalMovements: [
              {
                type: "prohibited_turn",
                movementIndex: 2,
                roadId: "no-entry-road",
                fromNodeId: "b",
                toNodeId: "c",
                previousRoadId: "one-way-road",
                nextRoadId: "no-entry-road",
                viaNodeId: "b",
                message: "Movement 2 makes a prohibited turn from road one-way-road to road no-entry-road at node b."
              },
              {
                type: "no_entry",
                movementIndex: 2,
                roadId: "no-entry-road",
                fromNodeId: "b",
                toNodeId: "c",
                message: "Movement 2 uses no-entry road no-entry-road from b to c."
              }
            ]
          }
        }
      })
    })
  );

  assert.equal(overlays.length, 1);
  assert.equal(overlays[0].kind, "no-entry");
  assert.equal(overlays[0].label, "No entry");
  assert.deepEqual(overlays[0].roadIds, ["no-entry-road"]);
});

test("route issue line styles keep red semantics stable", () => {
  assert.equal(getRouteIssueLineStyle("no-entry"), "solid-red");
  assert.equal(getRouteIssueLineStyle("wrong-way"), "solid-red");
  assert.equal(getRouteIssueLineStyle("prohibited-turn"), "solid-red");
  assert.equal(getRouteIssueLineStyle("disconnected"), "dashed-red");
});

test("turn restriction display items keep sign faces screen upright", () => {
  assert.deepEqual(
    getTurnRestrictionDisplayItems([
      {
        id: "no-turn-ab-bc",
        reason: "prohibited_turn",
        turnKind: "no-left-turn",
        turnClass: "left",
        fromRoadId: "r-ab",
        toRoadId: "r-bc",
        viaNodeId: "b",
        label: "No left turn",
        message: "No turn from A into C",
        junction: { x: 100, y: 0 },
        incomingRoadPoint: { x: 0, y: 0 },
        outgoingRoadPoint: { x: 100, y: 100 },
        signPosition: { x: 70, y: 0 },
        iconRotationRadians: Math.PI,
        angleDegrees: -90,
        incomingAngleRadians: Math.PI,
        outgoingAngleRadians: Math.PI / 2,
        markerAngleRadians: (Math.PI * 3) / 4
      }
    ]),
    [
      {
        id: "no-turn-ab-bc",
        label: "No left turn: r-ab -> r-bc at b",
        turnKind: "no-left-turn",
        visualTurnKind: "no-left-turn",
        fromRoadId: "r-ab",
        toRoadId: "r-bc",
        viaNodeId: "b",
        signFaceRotationRadians: 0
      }
    ]
  );
});

test("visual turn restriction glyph keeps semantic direction for upward approaches", () => {
  const upwardNoLeft = turnRestrictionVisual({
    turnKind: "no-left-turn",
    incomingRoadPoint: { x: 0, y: 100 },
    junction: { x: 0, y: 0 }
  });
  const upwardNoRight = turnRestrictionVisual({
    turnKind: "no-right-turn",
    incomingRoadPoint: { x: 0, y: 100 },
    junction: { x: 0, y: 0 }
  });

  assert.equal(getVisualTurnRestrictionTurnKind(upwardNoLeft), "no-left-turn");
  assert.equal(getVisualTurnRestrictionTurnKind(upwardNoRight), "no-right-turn");
});

test("visual turn restriction glyph swaps left and right for downward approaches", () => {
  const downwardNoLeft = turnRestrictionVisual({
    turnKind: "no-left-turn",
    incomingRoadPoint: { x: 0, y: -100 },
    junction: { x: 0, y: 0 }
  });
  const downwardNoRight = turnRestrictionVisual({
    turnKind: "no-right-turn",
    incomingRoadPoint: { x: 0, y: -100 },
    junction: { x: 0, y: 0 }
  });

  assert.equal(getVisualTurnRestrictionTurnKind(downwardNoLeft), "no-right-turn");
  assert.equal(getVisualTurnRestrictionTurnKind(downwardNoRight), "no-left-turn");
});

test("visual turn restriction glyph only swaps mostly vertical downward approaches", () => {
  assert.equal(
    getVisualTurnRestrictionTurnKind(
      turnRestrictionVisual({
        turnKind: "no-left-turn",
        incomingRoadPoint: { x: 0, y: 0 },
        junction: { x: 100, y: 20 }
      })
    ),
    "no-left-turn"
  );
  assert.equal(
    getVisualTurnRestrictionTurnKind(
      turnRestrictionVisual({
        turnKind: "no-left-turn",
        incomingRoadPoint: { x: 0, y: 0 },
        junction: { x: 20, y: 100 }
      })
    ),
    "no-right-turn"
  );
});

test("Marlowe downward no-left turn signs display opposite glyphs without changing semantics", () => {
  const visuals = getTurnRestrictionVisuals(marloweDistrictMap);
  const fixtureIds = ["pt-baker-court-to-market-lane-east", "pt-museum-cut-to-theatre-street"];

  for (const fixtureId of fixtureIds) {
    const visual = visuals.find((candidate) => candidate.id === fixtureId);

    assert.ok(visual, `Expected ${fixtureId} to render a turn restriction visual`);
    assert.equal(visual.turnKind, "no-left-turn");
    assert.equal(getVisualTurnRestrictionTurnKind(visual), "no-right-turn");
  }
});

test("drawn pipeline display status distinguishes no drawing, drawing, and scored states", () => {
  assert.equal(getDrawnPipelineDisplayStatus(pipelineResult({ status: "empty" }), false), "no drawing");
  assert.equal(getDrawnPipelineDisplayStatus(pipelineResult({ status: "insufficient_points" }), false), "insufficient drawing");
  assert.equal(getDrawnPipelineDisplayStatus(pipelineResult({ status: "scored" }), true), "drawing");
  assert.equal(getDrawnPipelineDisplayStatus(pipelineResult({ status: "scored" }), false), "scored");
  assert.equal(
    getDrawnPipelineDisplayStatus(
      pipelineResult({
        status: "matching_failed",
        matchResult: {
          status: "disconnected",
          isReadyForRunRouteExercise: false,
          orderedRoadIds: ["r26", "r14"],
          transitionNodeIds: [],
          nodeIds: [],
          directedEdgeIds: [],
          directedEdgeSequence: [],
          attemptedMovements: [],
          selection: { nodeIds: [], roadIds: [] },
          diagnostics: []
        }
      }),
      false
    ),
    "matching failed"
  );
});

test("stage badges mark failed matching without marking scoring complete", () => {
  const badges = getPipelineStageBadges(
    pipelineResult({
      status: "matching_failed",
      simplifiedTrace: { points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] },
      snappedPoints: [
        {
          originalPoint: { x: 0, y: 0 },
          snappedPoint: { x: 0, y: 0 },
          roadId: "r1",
          directedEdgeId: "r1:forward",
          distanceFromRoad: 0,
          confidence: 1,
          candidates: []
        }
      ],
      matchResult: {
        status: "disconnected",
        isReadyForRunRouteExercise: false,
        orderedRoadIds: ["r1", "r2"],
        transitionNodeIds: [],
        nodeIds: [],
        directedEdgeIds: [],
        directedEdgeSequence: [],
        attemptedMovements: [],
        selection: { nodeIds: [], roadIds: [] },
        diagnostics: []
      }
    }),
    false
  );

  assert.deepEqual(
    badges.map((badge) => [badge.id, badge.state]),
    [
      ["drawing", "complete"],
      ["simplification", "complete"],
      ["snapping", "complete"],
      ["matching", "failed"],
      ["scoring", "pending"]
    ]
  );
  assert.deepEqual(
    badges.map((badge) => [badge.id, badge.label]),
    [
      ["drawing", "Drawing"],
      ["simplification", "Simplified"],
      ["snapping", "Snapped"],
      ["matching", "Matching failed"],
      ["scoring", "Scored"]
    ]
  );
});

test("pipeline issue groups provide human-readable drawing and matching messages", () => {
  const groups = getPipelineIssueGroups(
    pipelineResult({
      status: "matching_failed",
      warnings: [
        {
          source: "pipeline",
          code: "insufficient_points",
          severity: "info",
          message: "At least two points are required."
        },
        {
          source: "matching",
          code: "disconnected_roads",
          severity: "warning",
          message: "Roads do not connect.",
          fromRoadId: "r26",
          toRoadId: "r14"
        }
      ]
    }),
    false
  );

  assert.deepEqual(groups, [
    {
      label: "Drawing",
      messages: ["Add more drawn points before the route can be processed."]
    },
    {
      label: "Matching",
      messages: [
        "Disconnected between r26 and r14. The matched roads do not connect into one continuous route."
      ]
    }
  ]);
});

test("pipeline issue groups explain insufficient drawing without manual runner errors", () => {
  const groups = getPipelineIssueGroups(
    pipelineResult({
      status: "insufficient_points",
      warnings: [
        {
          source: "pipeline",
          code: "insufficient_movement",
          severity: "info",
          message: "Tap ignored: not enough movement."
        }
      ]
    }),
    false
  );

  assert.deepEqual(groups, [
    {
      label: "Drawing",
      messages: ["Tap ignored: not enough movement. Draw a longer route before scoring."]
    }
  ]);
  assert.equal(
    groups.some((group) =>
      group.messages.some((message) => message.includes("User route must include nodeIds or roadIds"))
    ),
    false
  );
});

test("pipeline issue groups surface scoring failures and illegal movement explanations", () => {
  const groups = getPipelineIssueGroups(
    pipelineResult({
      status: "scored",
      exerciseResult: {
        exerciseId: "exercise",
        normalisedAttempt: {
          exerciseId: "exercise",
          destinationLandmarkIds: [],
          requiredNodeIds: ["a", "b"],
          selectedNodeIds: ["a", "c"],
          selectedRoadIds: ["road-ac"],
          selectedDirectedEdgeIds: [],
          movements: []
        },
        score: {
          passed: false,
          automaticFail: true,
          status: "fail",
          isLegal: false,
          scorePercent: 0,
          efficiencyRatio: 0,
          scoreRatio: 0,
          userRouteDistanceMeters: 100,
          shortestLegalRouteDistanceMeters: 0,
          userDistanceMeters: 100,
          shortestLegalDistanceMeters: 0,
          passThresholdPercent: 80,
          thresholdPercent: 80,
          failureReasons: ["illegal_route", "wrong_destination"],
          failureReason: "illegal_route",
          legality: {
            isLegal: false,
            automaticFail: true,
            illegalMovements: [
              {
                type: "prohibited_turn",
                movementIndex: 1,
                roadId: "road-ac",
                previousRoadId: "road-ab",
                nextRoadId: "road-ac",
                viaNodeId: "c",
                message: "No turn"
              }
            ]
          }
        }
      }
    }),
    false
  );

  assert.deepEqual(groups, [
    {
      label: "Exercise / scoring",
      messages: [
        "The existing scoring engine found an illegal route movement.",
        "The route does not finish at the required destination.",
        "The existing legality engine found a prohibited turn."
      ]
    }
  ]);
});

test("drawn route score display distinguishes blocked, pass, fail, and drawing states", () => {
  assert.deepEqual(getDrawnRouteScoreDisplay(pipelineResult({ status: "insufficient_points" }), false), {
    state: "blocked",
    label: "Not scored",
    summary: "Insufficient drawn route. Draw a longer route before scoring."
  });

  const matchingFailedDisplay = getDrawnRouteScoreDisplay(pipelineResult({ status: "matching_failed" }), false);

  assert.deepEqual(matchingFailedDisplay, {
    state: "blocked",
    label: "Blocked before scoring",
    summary: "The drawn route could not reach scoring because drawing, snapping, or matching failed."
  });
  assert.notEqual(matchingFailedDisplay.label, "Route scored: pass");
  assert.notEqual(matchingFailedDisplay.label, "Route scored: fail");
  assert.equal(/\d+(\.\d+)?%/.test(matchingFailedDisplay.summary), false);

  assert.deepEqual(
    getDrawnRouteScoreDisplay(
      pipelineResult({
        status: "scored",
        exerciseResult: exerciseResult()
      }),
      false
    ),
    {
      state: "pass",
      label: "Route scored: pass",
      summary: "The drawn route passed using the existing route exercise scoring engine."
    }
  );
  assert.deepEqual(
    getDrawnRouteScoreDisplay(
      pipelineResult({
        status: "scored",
        exerciseResult: exerciseResult({
          score: {
            ...exerciseResult().score,
            passed: false,
            status: "fail",
            scorePercent: 61.3,
            failureReasons: ["below_efficiency_threshold"],
            failureReason: "below_efficiency_threshold"
          }
        })
      }),
      false
    ),
    {
      state: "fail",
      label: "Route scored: fail",
      summary: "The drawn route reached scoring but did not meet the pass rules."
    }
  );
  assert.equal(
    getDrawnRouteScoreDisplay(
      pipelineResult({
        status: "scored",
        exerciseResult: exerciseResult()
      }),
      true
    ).state,
    "pending"
  );
});

test("required stop visit statuses follow required order and mark missing stops", () => {
  const statuses = getRequiredStopVisitStatuses(
    exerciseResult({
      normalisedAttempt: {
        ...exerciseResult().normalisedAttempt,
        requiredNodeIds: ["a", "b", "d"],
        selectedNodeIds: ["a", "c", "d", "b"],
        selectedRoadIds: ["road-ac", "road-cd", "road-db"]
      }
    })
  );

  assert.deepEqual(statuses, [
    {
      nodeId: "a",
      order: 1,
      role: "start",
      visited: true,
      visitedIndex: 0
    },
    {
      nodeId: "b",
      order: 2,
      role: "checkpoint",
      visited: true,
      visitedIndex: 3
    },
    {
      nodeId: "d",
      order: 3,
      role: "destination",
      visited: false
    }
  ]);
});
