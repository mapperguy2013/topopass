import assert from "node:assert/strict";
import test from "node:test";
import { buildDirectedEdges, validateMapDefinition, validateRouteExercise } from "../index.ts";
import { marloweDistrictFixture, marloweDistrictMap, marloweDistrictRouteExercises } from "./index.ts";

function idsAreUnique(ids: string[]): boolean {
  return new Set(ids).size === ids.length;
}

test("Marlowe District fixture loads and validates", () => {
  assert.equal(marloweDistrictFixture.map.id, "marlowe-district-dev-map");
  assert.equal(marloweDistrictFixture.map.name, "Marlowe District");
  assert.deepEqual(validateMapDefinition(marloweDistrictMap), {
    valid: true,
    errors: []
  });
});

test("Marlowe District fixture has the expected development-map scale", () => {
  const noEntryRestrictions = marloweDistrictMap.restrictions.filter(
    (restriction) => restriction.type === "no_entry"
  );
  const prohibitedTurnRestrictions = marloweDistrictMap.restrictions.filter(
    (restriction) => restriction.type === "prohibited_turn"
  );

  assert.equal(marloweDistrictMap.nodes.length, 24);
  assert.equal(marloweDistrictMap.roads.length, 38);
  assert(marloweDistrictMap.nodes.length >= 15 && marloweDistrictMap.nodes.length <= 30);
  assert(marloweDistrictMap.roads.length >= 20 && marloweDistrictMap.roads.length <= 40);
  assert(marloweDistrictMap.roads.filter((road) => road.isOneWay).length >= 5);
  assert(noEntryRestrictions.length >= 3);
  assert(prohibitedTurnRestrictions.length >= 3);
  assert(marloweDistrictMap.landmarks.length >= 10);
  assert(marloweDistrictRouteExercises.length >= 5);
});

test("Marlowe District ids are unique", () => {
  assert.equal(
    idsAreUnique(marloweDistrictMap.nodes.map((node) => node.id)),
    true
  );
  assert.equal(
    idsAreUnique(marloweDistrictMap.roads.map((road) => road.id)),
    true
  );
  assert.equal(
    idsAreUnique(marloweDistrictMap.landmarks.map((landmark) => landmark.id)),
    true
  );
  assert.equal(
    idsAreUnique(marloweDistrictMap.restrictions.map((restriction) => restriction.id)),
    true
  );
});

test("Marlowe District roads are named, measured, and connected to existing nodes", () => {
  const nodeIds = new Set(marloweDistrictMap.nodes.map((node) => node.id));

  for (const road of marloweDistrictMap.roads) {
    assert(nodeIds.has(road.fromNodeId), `${road.id} fromNodeId should exist`);
    assert(nodeIds.has(road.toNodeId), `${road.id} toNodeId should exist`);
    assert(road.distanceMeters > 0, `${road.id} should have a positive distance`);
    assert(road.name && road.name.trim().length > 0, `${road.id} should have a non-empty name`);
  }
});

test("Marlowe District restrictions reference existing roads and nodes", () => {
  const nodeIds = new Set(marloweDistrictMap.nodes.map((node) => node.id));
  const roadsById = new Map(marloweDistrictMap.roads.map((road) => [road.id, road]));

  for (const restriction of marloweDistrictMap.restrictions) {
    if (restriction.type === "no_entry") {
      const road = roadsById.get(restriction.roadId);

      assert(road, `${restriction.id} roadId should exist`);
      assert(restriction.fromNodeId, `${restriction.id} should include fromNodeId`);
      assert(restriction.toNodeId, `${restriction.id} should include toNodeId`);
      assert(nodeIds.has(restriction.fromNodeId), `${restriction.id} fromNodeId should exist`);
      assert(nodeIds.has(restriction.toNodeId), `${restriction.id} toNodeId should exist`);
      assert(
        [road.fromNodeId, road.toNodeId].includes(restriction.fromNodeId) &&
          [road.fromNodeId, road.toNodeId].includes(restriction.toNodeId),
        `${restriction.id} no-entry nodes should be on the referenced road`
      );
    }

    if (restriction.type === "prohibited_turn") {
      assert(roadsById.has(restriction.fromRoadId), `${restriction.id} fromRoadId should exist`);
      assert(roadsById.has(restriction.toRoadId), `${restriction.id} toRoadId should exist`);
      assert(nodeIds.has(restriction.viaNodeId), `${restriction.id} viaNodeId should exist`);
    }
  }
});

test("Marlowe District landmarks and route exercises reference existing fixture data", () => {
  const nodeIds = new Set(marloweDistrictMap.nodes.map((node) => node.id));
  const landmarkIds = new Set(marloweDistrictMap.landmarks.map((landmark) => landmark.id));

  for (const landmark of marloweDistrictMap.landmarks) {
    assert(landmark.nearestNodeId, `${landmark.id} should reference a nearest node`);
    assert(nodeIds.has(landmark.nearestNodeId), `${landmark.id} nearestNodeId should exist`);
  }

  for (const exercise of marloweDistrictRouteExercises) {
    assert.equal(exercise.mapId, marloweDistrictMap.id);
    assert.deepEqual(validateRouteExercise(exercise, marloweDistrictMap), {
      valid: true,
      errors: []
    });

    for (const stop of exercise.stops) {
      assert.equal(stop.type, "landmark");
      assert(landmarkIds.has(stop.landmarkId), `${exercise.id} stop should reference an existing landmark`);
    }
  }
});

test("Marlowe District includes one-way movement, no-entry rules, and prohibited turns", () => {
  const oneWayEdges = buildDirectedEdges(marloweDistrictMap.roads).filter(
    (edge) => edge.direction === "forward" && marloweDistrictMap.roads.find((road) => road.id === edge.roadId)?.isOneWay
  );

  assert(oneWayEdges.length >= 5);
  assert(marloweDistrictMap.restrictions.some((restriction) => restriction.type === "no_entry"));
  assert(marloweDistrictMap.restrictions.some((restriction) => restriction.type === "prohibited_turn"));
});

test("Marlowe District known movement facts are stable", () => {
  const eastgateStreet = marloweDistrictMap.roads.find((road) => road.id === "r04");
  const marketLaneWest = marloweDistrictMap.roads.find((road) => road.id === "r12");
  const marketLaneNoEntry = marloweDistrictMap.restrictions.find(
    (restriction) => restriction.id === "ne-market-lane-westbound"
  );
  const bakerCourtTurn = marloweDistrictMap.restrictions.find(
    (restriction) => restriction.id === "pt-baker-court-to-market-lane-east"
  );

  assert.deepEqual(eastgateStreet, {
    id: "r04",
    fromNodeId: "n04",
    toNodeId: "n05",
    distanceMeters: 140,
    isOneWay: true,
    name: "Eastgate Street"
  });
  assert.equal(marketLaneWest?.isOneWay, false);
  assert.deepEqual(marketLaneNoEntry, {
    id: "ne-market-lane-westbound",
    type: "no_entry",
    roadId: "r12",
    fromNodeId: "n12",
    toNodeId: "n11",
    reason: "No entry westbound into Market Lane West from Market Cross"
  });
  assert.deepEqual(bakerCourtTurn, {
    id: "pt-baker-court-to-market-lane-east",
    type: "prohibited_turn",
    fromRoadId: "r16",
    viaNodeId: "n12",
    toRoadId: "r13",
    reason: "No right turn from Baker Court into Market Lane East"
  });
});
