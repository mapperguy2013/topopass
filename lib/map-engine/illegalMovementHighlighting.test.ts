import assert from "node:assert/strict";
import test from "node:test";
import type { IllegalMovement, MapDefinition } from "./index.ts";
import { buildIllegalDrawnMovementHighlights } from "./illegalMovementHighlighting.ts";

const highlightMap: MapDefinition = {
  id: "illegal-highlight-map",
  name: "Illegal Highlight Map",
  nodes: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 100, y: 0 },
    { id: "c", x: 100, y: 100 },
    { id: "d", x: 0, y: 100 }
  ],
  roads: [
    { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false },
    { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 100, isOneWay: true },
    { id: "road-cd", fromNodeId: "c", toNodeId: "d", distanceMeters: 100, isOneWay: false },
    { id: "road-da", fromNodeId: "d", toNodeId: "a", distanceMeters: 100, isOneWay: false }
  ],
  restrictions: [],
  landmarks: []
};

function buildHighlights(illegalMovements: IllegalMovement[], scored = true) {
  return buildIllegalDrawnMovementHighlights({
    map: highlightMap,
    illegalMovements,
    scored
  });
}

test("buildIllegalDrawnMovementHighlights returns nothing before scoring", () => {
  assert.deepEqual(
    buildHighlights(
      [
        {
          type: "no_entry",
          movementIndex: 0,
          roadId: "road-bc",
          fromNodeId: "b",
          toNodeId: "c",
          message: "No entry."
        }
      ],
      false
    ),
    []
  );
});

test("buildIllegalDrawnMovementHighlights returns nothing for legal routes", () => {
  assert.deepEqual(buildHighlights([]), []);
});

test("buildIllegalDrawnMovementHighlights highlights no-entry road movements", () => {
  assert.deepEqual(
    buildHighlights([
      {
        type: "no_entry",
        movementIndex: 1,
        roadId: "road-bc",
        fromNodeId: "b",
        toNodeId: "c",
        restrictionId: "no-entry-bc",
        message: "Movement 1 uses no-entry road road-bc from b to c."
      }
    ]),
    [
      {
        id: "1:no-entry-road:road-bc:c",
        kind: "no-entry-road",
        movementIndex: 1,
        roadId: "road-bc",
        fromNodeId: "b",
        toNodeId: "c",
        message: "Movement 1 uses no-entry road road-bc from b to c."
      }
    ]
  );
});

test("buildIllegalDrawnMovementHighlights highlights wrong-way one-way movements", () => {
  assert.deepEqual(
    buildHighlights([
      {
        type: "wrong_way_one_way",
        movementIndex: 2,
        roadId: "road-bc",
        fromNodeId: "c",
        toNodeId: "b",
        message: "Movement 2 travels the wrong way on one-way road road-bc."
      }
    ]),
    [
      {
        id: "2:one-way-wrong-direction:road-bc:b",
        kind: "one-way-wrong-direction",
        movementIndex: 2,
        roadId: "road-bc",
        fromNodeId: "c",
        toNodeId: "b",
        message: "Movement 2 travels the wrong way on one-way road road-bc."
      }
    ]
  );
});

test("buildIllegalDrawnMovementHighlights highlights explicit prohibited turns", () => {
  assert.deepEqual(
    buildHighlights([
      {
        type: "prohibited_turn",
        movementIndex: 2,
        roadId: "road-cd",
        fromNodeId: "c",
        toNodeId: "d",
        previousRoadId: "road-bc",
        nextRoadId: "road-cd",
        viaNodeId: "c",
        restrictionId: "no-turn-bc-cd",
        message: "Movement 2 makes a prohibited turn from road road-bc to road road-cd at node c."
      }
    ]),
    [
      {
        id: "2:prohibited-turn:road-cd:road-cd",
        kind: "prohibited-turn",
        movementIndex: 2,
        roadId: "road-cd",
        fromNodeId: "c",
        toNodeId: "d",
        viaNodeId: "c",
        incomingRoadId: "road-bc",
        outgoingRoadId: "road-cd",
        message: "Movement 2 makes a prohibited turn from road road-bc to road road-cd at node c."
      }
    ]
  );
});

test("buildIllegalDrawnMovementHighlights prefers road-level no-entry over a redundant prohibited turn", () => {
  const highlights = buildHighlights([
    {
      type: "prohibited_turn",
      movementIndex: 1,
      roadId: "road-bc",
      fromNodeId: "b",
      toNodeId: "c",
      previousRoadId: "road-ab",
      nextRoadId: "road-bc",
      viaNodeId: "b",
      message: "Movement 1 makes a prohibited turn from road road-ab to road road-bc at node b."
    },
    {
      type: "no_entry",
      movementIndex: 1,
      roadId: "road-bc",
      fromNodeId: "b",
      toNodeId: "c",
      message: "Movement 1 uses no-entry road road-bc from b to c."
    }
  ]);

  assert.equal(highlights.length, 1);
  assert.equal(highlights[0].kind, "no-entry-road");
  assert.equal(highlights[0].roadId, "road-bc");
});

test("buildIllegalDrawnMovementHighlights returns highlights in movement order", () => {
  assert.deepEqual(
    buildHighlights([
      {
        type: "wrong_way_one_way",
        movementIndex: 4,
        roadId: "road-bc",
        fromNodeId: "c",
        toNodeId: "b",
        message: "Wrong way."
      },
      {
        type: "no_entry",
        movementIndex: 1,
        roadId: "road-cd",
        fromNodeId: "c",
        toNodeId: "d",
        message: "No entry."
      }
    ]).map((highlight) => highlight.movementIndex),
    [1, 4]
  );
});
