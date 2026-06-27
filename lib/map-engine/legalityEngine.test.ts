import assert from "node:assert/strict";
import test from "node:test";
import {
  checkRouteLegality,
  ILLEGAL_MOVEMENT_TYPES,
  type AttemptedRouteMovement,
  type IllegalMovementType,
  type MapDefinition
} from "./index.ts";

const baseMap: MapDefinition = {
  id: "legality-test-map",
  name: "Legality Test Map",
  nodes: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 100, y: 0 },
    { id: "c", x: 200, y: 0 },
    { id: "d", x: 100, y: 100 },
    { id: "e", x: 0, y: 100 }
  ],
  roads: [
    { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: true },
    { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 100, isOneWay: false },
    { id: "road-cd", fromNodeId: "c", toNodeId: "d", distanceMeters: 100, isOneWay: false },
    { id: "road-be", fromNodeId: "b", toNodeId: "e", distanceMeters: 120, isOneWay: false }
  ],
  restrictions: [],
  landmarks: []
};

function withRestrictions(restrictions: MapDefinition["restrictions"]): MapDefinition {
  return {
    ...baseMap,
    restrictions
  };
}

function illegalTypes(movements: AttemptedRouteMovement[], map: MapDefinition = baseMap): IllegalMovementType[] {
  return checkRouteLegality({ map, movements }).illegalMovements.map((movement) => movement.type);
}

test("checkRouteLegality returns legal result for connected legal movements", () => {
  const result = checkRouteLegality({
    map: baseMap,
    movements: [
      { roadId: "road-ab", fromNodeId: "a", toNodeId: "b" },
      { roadId: "road-bc", fromNodeId: "b", toNodeId: "c" }
    ]
  });

  assert.deepEqual(result, {
    isLegal: true,
    automaticFail: false,
    illegalMovements: []
  });
});

test("checkRouteLegality detects wrong-way one-way movement", () => {
  const result = checkRouteLegality({
    map: baseMap,
    movements: [{ roadId: "road-ab", fromNodeId: "b", toNodeId: "a" }]
  });

  assert.equal(result.isLegal, false);
  assert.equal(result.automaticFail, true);
  assert.equal(result.illegalMovements[0].type, "wrong_way_one_way");
  assert.equal(result.illegalMovements[0].roadId, "road-ab");
});

test("checkRouteLegality detects directional and whole-road no-entry restrictions", () => {
  const map = withRestrictions([
    {
      id: "no-entry-b-to-c",
      type: "no_entry",
      roadId: "road-bc",
      fromNodeId: "b",
      toNodeId: "c"
    },
    {
      id: "no-entry-any-cd",
      type: "no_entry",
      roadId: "road-cd"
    }
  ]);
  const result = checkRouteLegality({
    map,
    movements: [
      { roadId: "road-bc", fromNodeId: "b", toNodeId: "c" },
      { roadId: "road-cd", fromNodeId: "c", toNodeId: "d" }
    ]
  });

  assert.deepEqual(
    result.illegalMovements.map((movement) => movement.type),
    ["no_entry", "no_entry"]
  );
  assert.deepEqual(
    result.illegalMovements.map((movement) => movement.restrictionId),
    ["no-entry-b-to-c", "no-entry-any-cd"]
  );
});

test("checkRouteLegality detects prohibited turns", () => {
  const map = withRestrictions([
    {
      id: "no-turn-ab-to-bc",
      type: "prohibited_turn",
      fromRoadId: "road-ab",
      viaNodeId: "b",
      toRoadId: "road-bc"
    }
  ]);
  const result = checkRouteLegality({
    map,
    movements: [
      { roadId: "road-ab", fromNodeId: "a", toNodeId: "b" },
      { roadId: "road-bc", fromNodeId: "b", toNodeId: "c" }
    ]
  });

  assert.equal(result.automaticFail, true);
  assert.equal(result.illegalMovements[0].type, "prohibited_turn");
  assert.equal(result.illegalMovements[0].previousRoadId, "road-ab");
  assert.equal(result.illegalMovements[0].nextRoadId, "road-bc");
  assert.equal(result.illegalMovements[0].viaNodeId, "b");
});

test("checkRouteLegality detects immediate U-turns", () => {
  const result = checkRouteLegality({
    map: baseMap,
    movements: [
      { roadId: "road-bc", fromNodeId: "b", toNodeId: "c" },
      { roadId: "road-bc", fromNodeId: "c", toNodeId: "b" }
    ]
  });

  assert.equal(result.automaticFail, true);
  assert.equal(result.illegalMovements[0].type, "no_u_turn");
  assert.equal(result.illegalMovements[0].viaNodeId, "c");
});

test("checkRouteLegality detects disconnected road jumps and endpoint mismatches", () => {
  assert.deepEqual(
    illegalTypes([
      { roadId: "road-ab", fromNodeId: "a", toNodeId: "b" },
      { roadId: "road-cd", fromNodeId: "c", toNodeId: "d" }
    ]),
    ["disconnected_road_jump"]
  );

  assert.deepEqual(illegalTypes([{ roadId: "road-ab", fromNodeId: "a", toNodeId: "c" }]), [
    "disconnected_road_jump"
  ]);
});

test("checkRouteLegality reports multiple illegal movements in deterministic order", () => {
  const map = withRestrictions([
    {
      id: "no-entry-c-to-d",
      type: "no_entry",
      roadId: "road-cd",
      fromNodeId: "c",
      toNodeId: "d"
    }
  ]);
  const result = checkRouteLegality({
    map,
    movements: [
      { roadId: "road-ab", fromNodeId: "b", toNodeId: "a" },
      { roadId: "road-cd", fromNodeId: "c", toNodeId: "d" }
    ]
  });

  assert.equal(result.automaticFail, true);
  assert.deepEqual(
    result.illegalMovements.map((movement) => movement.type),
    ["wrong_way_one_way", "no_entry", "disconnected_road_jump"]
  );
  assert.deepEqual(
    result.illegalMovements.map((movement) => movement.movementIndex),
    [0, 1, 1]
  );
});

test("checkRouteLegality reports unknown roads and nodes as disconnected movement mistakes", () => {
  const result = checkRouteLegality({
    map: baseMap,
    movements: [
      { roadId: "missing-road", fromNodeId: "a", toNodeId: "b" },
      { roadId: "road-bc", fromNodeId: "b", toNodeId: "missing-node" }
    ]
  });

  assert.equal(result.automaticFail, true);
  assert.deepEqual(
    result.illegalMovements.map((movement) => movement.type),
    ["disconnected_road_jump", "disconnected_road_jump"]
  );
  assert.match(result.illegalMovements[0].message, /unknown road/);
  assert.match(result.illegalMovements[1].message, /unknown node/);
});

test("off-road illegal movement type is reserved for later snapped geometry checks", () => {
  assert(ILLEGAL_MOVEMENT_TYPES.includes("off_road"));
});
