import assert from "node:assert/strict";
import test from "node:test";
import type { MapDefinition } from "./types.ts";
import {
  classifyTurnRestrictionMovement,
  getTurnRestrictionVisuals,
  turnRestrictionIconRotationRadians,
  turnRestrictionSignedAngleDegrees
} from "./restrictionVisuals.ts";
import { marloweDistrictMap } from "./fixtures/marloweDistrictMap.ts";

const turnRestrictionMap: MapDefinition = {
  id: "turn-visual-map",
  name: "Turn Visual Map",
  nodes: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 100, y: 0 },
    { id: "c", x: 100, y: 100 },
    { id: "d", x: 200, y: 0 },
    { id: "e", x: 100, y: -100 }
  ],
  roads: [
    {
      id: "r-ab",
      fromNodeId: "a",
      toNodeId: "b",
      distanceMeters: 100,
      isOneWay: false
    },
    {
      id: "r-bc",
      fromNodeId: "b",
      toNodeId: "c",
      distanceMeters: 100,
      isOneWay: false
    },
    {
      id: "r-bd",
      fromNodeId: "b",
      toNodeId: "d",
      distanceMeters: 100,
      isOneWay: false
    },
    {
      id: "r-be",
      fromNodeId: "b",
      toNodeId: "e",
      distanceMeters: 100,
      isOneWay: false
    }
  ],
  restrictions: [
    {
      id: "no-turn-ab-bc",
      type: "prohibited_turn",
      fromRoadId: "r-ab",
      viaNodeId: "b",
      toRoadId: "r-bc",
      reason: "No right turn into C Street"
    }
  ],
  landmarks: []
};

function closeTo(actual: number, expected: number): void {
  assert.equal(Math.abs(actual - expected) < 0.000001, true);
}

test("getTurnRestrictionVisuals converts banned turn movements into visual markers", () => {
  const visuals = getTurnRestrictionVisuals(turnRestrictionMap);

  assert.equal(visuals.length, 1);
  assert.equal(visuals[0].id, "no-turn-ab-bc");
  assert.equal(visuals[0].reason, "prohibited_turn");
  assert.equal(visuals[0].turnKind, "no-right-turn");
  assert.equal(visuals[0].turnClass, "right");
  assert.equal(visuals[0].fromRoadId, "r-ab");
  assert.equal(visuals[0].toRoadId, "r-bc");
  assert.equal(visuals[0].viaNodeId, "b");
  assert.equal(visuals[0].label, "No right turn");
  assert.equal(visuals[0].message, "No right turn into C Street");
});

test("getTurnRestrictionVisuals does not create markers for allowed turns", () => {
  const visuals = getTurnRestrictionVisuals(turnRestrictionMap);

  assert.equal(
    visuals.some((visual) => visual.fromRoadId === "r-ab" && visual.toRoadId === "r-bd"),
    false
  );
});

test("getTurnRestrictionVisuals returns stable marker coordinates and angles", () => {
  const [visual] = getTurnRestrictionVisuals(turnRestrictionMap);

  assert.deepEqual(visual.junction, { x: 100, y: 0 });
  assert.deepEqual(visual.incomingRoadPoint, { x: 0, y: 0 });
  assert.deepEqual(visual.outgoingRoadPoint, { x: 100, y: 100 });
  assert.deepEqual(visual.signPosition, { x: 70, y: -12 });
  closeTo(visual.angleDegrees, 90);
  closeTo(visual.incomingAngleRadians, Math.PI);
  closeTo(visual.outgoingAngleRadians, Math.PI / 2);
  closeTo(visual.markerAngleRadians, (Math.PI * 3) / 4);
});

test("getTurnRestrictionVisuals places signs on the incoming road before the junction", () => {
  const [visual] = getTurnRestrictionVisuals(turnRestrictionMap);

  assert.notDeepEqual(visual.signPosition, visual.junction);
  closeTo(visual.signPosition.x, 70);
  closeTo(visual.signPosition.y, -12);
});

test("getTurnRestrictionVisuals offsets overlapping signs on the same approach", () => {
  const visuals = getTurnRestrictionVisuals({
    ...turnRestrictionMap,
    restrictions: [
      {
        id: "no-left-ab-bc",
        type: "prohibited_turn",
        fromRoadId: "r-ab",
        viaNodeId: "b",
        toRoadId: "r-bc",
        reason: "No right turn into C Street"
      },
      {
        id: "no-left-ab-be",
        type: "prohibited_turn",
        fromRoadId: "r-ab",
        viaNodeId: "b",
        toRoadId: "r-be",
        reason: "No left turn into E Street"
      }
    ]
  });

  assert.deepEqual(
    visuals.map((visual) => visual.signPosition),
    [
      { x: 70, y: -12 },
      { x: 70, y: -26 }
    ]
  );
});

test("getTurnRestrictionVisuals classifies left, right, and U-turn signs from geometry", () => {
  const visuals = getTurnRestrictionVisuals({
    ...turnRestrictionMap,
    restrictions: [
      {
        id: "no-right-ab-bc",
        type: "prohibited_turn",
        fromRoadId: "r-ab",
        viaNodeId: "b",
        toRoadId: "r-bc",
        reason: "No left turn text that conflicts with geometry"
      },
      {
        id: "no-left-ab-be",
        type: "prohibited_turn",
        fromRoadId: "r-ab",
        viaNodeId: "b",
        toRoadId: "r-be",
        reason: "No right turn text that conflicts with geometry"
      },
      {
        id: "no-u-ab-ab",
        type: "prohibited_turn",
        fromRoadId: "r-ab",
        viaNodeId: "b",
        toRoadId: "r-ab",
        reason: "No U-turn"
      }
    ]
  });

  assert.deepEqual(
    visuals.map((visual) => [visual.id, visual.turnClass, visual.turnKind, visual.label]),
    [
      ["no-right-ab-bc", "right", "no-right-turn", "No right turn"],
      ["no-left-ab-be", "left", "no-left-turn", "No left turn"],
      ["no-u-ab-ab", "u_turn", "no-u-turn", "No U-turn"]
    ]
  );
});

test("classifyTurnRestrictionMovement treats northbound approach turning east as right", () => {
  const input = {
    incomingStart: { x: 0, y: 100 },
    junction: { x: 0, y: 0 },
    outgoingEnd: { x: 100, y: 0 }
  };

  assert.equal(turnRestrictionSignedAngleDegrees(input), 90);
  assert.equal(classifyTurnRestrictionMovement(input), "right");
});

test("classifyTurnRestrictionMovement treats northbound approach turning west as left", () => {
  const input = {
    incomingStart: { x: 0, y: 100 },
    junction: { x: 0, y: 0 },
    outgoingEnd: { x: -100, y: 0 }
  };

  assert.equal(turnRestrictionSignedAngleDegrees(input), -90);
  assert.equal(classifyTurnRestrictionMovement(input), "left");
});

test("classifyTurnRestrictionMovement treats eastbound approach turning south as right", () => {
  const input = {
    incomingStart: { x: 0, y: 0 },
    junction: { x: 100, y: 0 },
    outgoingEnd: { x: 100, y: 100 }
  };

  assert.equal(turnRestrictionSignedAngleDegrees(input), 90);
  assert.equal(classifyTurnRestrictionMovement(input), "right");
});

test("classifyTurnRestrictionMovement treats eastbound approach turning north as left", () => {
  const input = {
    incomingStart: { x: 0, y: 0 },
    junction: { x: 100, y: 0 },
    outgoingEnd: { x: 100, y: -100 }
  };

  assert.equal(turnRestrictionSignedAngleDegrees(input), -90);
  assert.equal(classifyTurnRestrictionMovement(input), "left");
});

test("classifyTurnRestrictionMovement uses straight and U-turn thresholds", () => {
  assert.equal(
    classifyTurnRestrictionMovement({
      incomingStart: { x: 0, y: 0 },
      junction: { x: 100, y: 0 },
      outgoingEnd: { x: 200, y: 20 }
    }),
    "straight"
  );
  assert.equal(
    classifyTurnRestrictionMovement({
      incomingStart: { x: 0, y: 0 },
      junction: { x: 100, y: 0 },
      outgoingEnd: { x: 0, y: 0 }
    }),
    "u_turn"
  );
});

test("turnRestrictionIconRotationRadians keeps upbound arrow glyphs upright", () => {
  closeTo(
    turnRestrictionIconRotationRadians({
      incomingStart: { x: 0, y: 100 },
      junction: { x: 0, y: 0 }
    }),
    0
  );
});

test("turnRestrictionIconRotationRadians rotates eastbound arrow glyphs 90 degrees", () => {
  closeTo(
    turnRestrictionIconRotationRadians({
      incomingStart: { x: 0, y: 0 },
      junction: { x: 100, y: 0 }
    }),
    Math.PI / 2
  );
});

test("turnRestrictionIconRotationRadians rotates downbound arrow glyphs 180 degrees", () => {
  closeTo(
    turnRestrictionIconRotationRadians({
      incomingStart: { x: 0, y: -100 },
      junction: { x: 0, y: 0 }
    }),
    Math.PI
  );
});

test("turnRestrictionIconRotationRadians rotates westbound arrow glyphs 270 degrees", () => {
  closeTo(
    turnRestrictionIconRotationRadians({
      incomingStart: { x: 100, y: 0 },
      junction: { x: 0, y: 0 }
    }),
    (Math.PI * 3) / 2
  );
});

test("turnRestrictionIconRotationRadians orients no-left and no-right arrow glyphs by approach direction", () => {
  const cases = [
    {
      label: "northbound no-left",
      incomingStart: { x: 0, y: 100 },
      junction: { x: 0, y: 0 },
      outgoingEnd: { x: -100, y: 0 },
      expectedClass: "left",
      expectedRotation: 0
    },
    {
      label: "northbound no-right",
      incomingStart: { x: 0, y: 100 },
      junction: { x: 0, y: 0 },
      outgoingEnd: { x: 100, y: 0 },
      expectedClass: "right",
      expectedRotation: 0
    },
    {
      label: "southbound no-left",
      incomingStart: { x: 0, y: -100 },
      junction: { x: 0, y: 0 },
      outgoingEnd: { x: 100, y: 0 },
      expectedClass: "left",
      expectedRotation: Math.PI
    },
    {
      label: "southbound no-right",
      incomingStart: { x: 0, y: -100 },
      junction: { x: 0, y: 0 },
      outgoingEnd: { x: -100, y: 0 },
      expectedClass: "right",
      expectedRotation: Math.PI
    },
    {
      label: "eastbound no-left",
      incomingStart: { x: 0, y: 0 },
      junction: { x: 100, y: 0 },
      outgoingEnd: { x: 100, y: -100 },
      expectedClass: "left",
      expectedRotation: Math.PI / 2
    },
    {
      label: "eastbound no-right",
      incomingStart: { x: 0, y: 0 },
      junction: { x: 100, y: 0 },
      outgoingEnd: { x: 100, y: 100 },
      expectedClass: "right",
      expectedRotation: Math.PI / 2
    },
    {
      label: "westbound no-left",
      incomingStart: { x: 100, y: 0 },
      junction: { x: 0, y: 0 },
      outgoingEnd: { x: 0, y: 100 },
      expectedClass: "left",
      expectedRotation: (Math.PI * 3) / 2
    },
    {
      label: "westbound no-right",
      incomingStart: { x: 100, y: 0 },
      junction: { x: 0, y: 0 },
      outgoingEnd: { x: 0, y: -100 },
      expectedClass: "right",
      expectedRotation: (Math.PI * 3) / 2
    }
  ] as const;

  for (const testCase of cases) {
    assert.equal(
      classifyTurnRestrictionMovement({
        incomingStart: testCase.incomingStart,
        junction: testCase.junction,
        outgoingEnd: testCase.outgoingEnd
      }),
      testCase.expectedClass,
      testCase.label
    );
    closeTo(
      turnRestrictionIconRotationRadians({
        incomingStart: testCase.incomingStart,
        junction: testCase.junction
      }),
      testCase.expectedRotation
    );
  }
});

test("downbound turn classification remains left and right while arrow glyphs flip", () => {
  const noLeft = {
    incomingStart: { x: 0, y: -100 },
    junction: { x: 0, y: 0 },
    outgoingEnd: { x: 100, y: 0 }
  };
  const noRight = {
    incomingStart: { x: 0, y: -100 },
    junction: { x: 0, y: 0 },
    outgoingEnd: { x: -100, y: 0 }
  };

  assert.equal(classifyTurnRestrictionMovement(noLeft), "left");
  assert.equal(classifyTurnRestrictionMovement(noRight), "right");
  closeTo(turnRestrictionIconRotationRadians(noLeft), Math.PI);
  closeTo(turnRestrictionIconRotationRadians(noRight), Math.PI);
});

test("Marlowe no-left fixture arrow glyphs orient to their incoming approach", () => {
  const visuals = getTurnRestrictionVisuals(marloweDistrictMap);
  const fixtureIds = ["pt-baker-court-to-market-lane-east", "pt-museum-cut-to-theatre-street"];

  for (const fixtureId of fixtureIds) {
    const visual = visuals.find((candidate) => candidate.id === fixtureId);

    assert.ok(visual, `Expected ${fixtureId} to render a turn restriction visual`);
    assert.equal(visual.turnClass, "left");
    assert.equal(visual.turnKind, "no-left-turn");
    assert.notEqual(visual.iconRotationRadians, 0);
    assert.ok(
      visual.iconRotationRadians > Math.PI / 2 && visual.iconRotationRadians < (Math.PI * 3) / 2,
      `${fixtureId} should flip the arrow glyph for its downward approach`
    );
    closeTo(
      visual.iconRotationRadians,
      turnRestrictionIconRotationRadians({
        incomingStart: visual.incomingRoadPoint,
        junction: visual.junction
      })
    );
  }
});

test("getTurnRestrictionVisuals suppresses turn signs when the target movement is no-entry", () => {
  const visuals = getTurnRestrictionVisuals({
    ...turnRestrictionMap,
    restrictions: [
      {
        id: "no-entry-b-to-c",
        type: "no_entry",
        roadId: "r-bc",
        fromNodeId: "b",
        toNodeId: "c",
        reason: "No entry into C Street"
      },
      {
        id: "no-turn-ab-bc",
        type: "prohibited_turn",
        fromRoadId: "r-ab",
        viaNodeId: "b",
        toRoadId: "r-bc",
        reason: "No right turn into C Street"
      }
    ]
  });

  assert.equal(visuals.some((visual) => visual.id === "no-turn-ab-bc"), false);
});

test("getTurnRestrictionVisuals suppresses turn signs when the target movement is wrong-way one-way", () => {
  const visuals = getTurnRestrictionVisuals({
    ...turnRestrictionMap,
    roads: turnRestrictionMap.roads.map((road) =>
      road.id === "r-bc"
        ? {
            ...road,
            fromNodeId: "c",
            toNodeId: "b",
            isOneWay: true
          }
        : road
    ),
    restrictions: [
      {
        id: "no-turn-ab-bc",
        type: "prohibited_turn",
        fromRoadId: "r-ab",
        viaNodeId: "b",
        toRoadId: "r-bc",
        reason: "No right turn into C Street"
      }
    ]
  });

  assert.equal(visuals.some((visual) => visual.id === "no-turn-ab-bc"), false);
});

test("getTurnRestrictionVisuals does not render visually straight movements as left or right turn signs", () => {
  const visuals = getTurnRestrictionVisuals({
    ...turnRestrictionMap,
    restrictions: [
      {
        id: "no-turn-ab-bd",
        type: "prohibited_turn",
        fromRoadId: "r-ab",
        viaNodeId: "b",
        toRoadId: "r-bd",
        reason: "No turn into D Street"
      }
    ]
  });

  assert.deepEqual(visuals, []);
});

test("getTurnRestrictionVisuals suppresses Marlowe straight no-turn fixture restrictions", () => {
  const visuals = getTurnRestrictionVisuals(marloweDistrictMap);

  assert.equal(
    visuals.some((visual) => visual.id === "pt-queen-street-east-to-brewery-lane"),
    false
  );
});

test("getTurnRestrictionVisuals returns an empty array when no turn restrictions exist", () => {
  assert.deepEqual(
    getTurnRestrictionVisuals({
      ...turnRestrictionMap,
      restrictions: []
    }),
    []
  );
});
