import assert from "node:assert/strict";
import test from "node:test";
import type { MapDefinition, MapRoad } from "../map-engine/index.ts";
import { validateLearnerRoute, type LearnerRouteValidationSegment } from "./learnerRouteValidation.ts";

type TestRoad = MapRoad & {
  metadata?: {
    highway?: string;
    junction?: string;
    rawTags?: Record<string, string>;
  };
};

function drivableRoad(input: {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters?: number;
  isOneWay?: boolean;
  junction?: string;
}): TestRoad {
  return {
    id: input.id,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    distanceMeters: input.distanceMeters ?? 120,
    isOneWay: input.isOneWay ?? false,
    metadata: {
      highway: "residential",
      junction: input.junction,
      rawTags: {
        highway: "residential",
        ...(input.isOneWay ? { oneway: "yes" } : {}),
        ...(input.junction ? { junction: input.junction } : {})
      }
    }
  };
}

function testMap(): MapDefinition {
  const roads: TestRoad[] = [
    drivableRoad({ id: "road-a-b", fromNodeId: "a", toNodeId: "b" }),
    drivableRoad({ id: "road-b-c", fromNodeId: "b", toNodeId: "c" }),
    drivableRoad({ id: "road-c-d-one-way", fromNodeId: "c", toNodeId: "d", isOneWay: true }),
    {
      id: "road-b-e-footway",
      fromNodeId: "b",
      toNodeId: "e",
      distanceMeters: 80,
      isOneWay: false,
      metadata: {
        highway: "footway",
        rawTags: {
          highway: "footway"
        }
      }
    },
    drivableRoad({ id: "road-c-f", fromNodeId: "c", toNodeId: "f", distanceMeters: 260 }),
    drivableRoad({ id: "road-f-g", fromNodeId: "f", toNodeId: "g", distanceMeters: 240 }),
    drivableRoad({ id: "road-g-h-roundabout", fromNodeId: "g", toNodeId: "h", distanceMeters: 160, junction: "roundabout" }),
    drivableRoad({ id: "road-h-i", fromNodeId: "h", toNodeId: "i", distanceMeters: 240 }),
    {
      id: "road-c-j-unknown-access",
      fromNodeId: "c",
      toNodeId: "j",
      distanceMeters: 90,
      isOneWay: false
    }
  ];

  return {
    id: "phase-7-validation-fixture",
    name: "Phase 7 validation fixture",
    nodes: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map((id, index) => ({
      id,
      x: index * 100,
      y: index % 2 === 0 ? 0 : 50
    })),
    roads,
    restrictions: [
      {
        id: "no-turn-bc-cd",
        type: "prohibited_turn",
        fromRoadId: "road-b-c",
        viaNodeId: "c",
        toRoadId: "road-c-d-one-way",
        reason: "No turn from road-b-c to road-c-d-one-way"
      }
    ],
    landmarks: []
  };
}

function segment(
  id: string,
  roadId: string,
  fromNodeId: string,
  toNodeId: string
): LearnerRouteValidationSegment {
  return {
    id,
    roadId,
    fromNodeId,
    toNodeId
  };
}

test("valid connected route passes available legal and practical checks", () => {
  const result = validateLearnerRoute({
    map: testMap(),
    difficulty: "beginner",
    routeSegments: [
      segment("seg-1", "road-a-b", "a", "b"),
      segment("seg-2", "road-b-c", "b", "c")
    ]
  });

  assert.equal(result.status, "valid");
  assert.equal(result.valid, true);
  assert.deepEqual(result.blockingErrors, []);
  assert.deepEqual(result.advisoryWarnings, []);
  assert.equal(result.metrics.routeDistanceMeters, 240);
});

test("disconnected route reports an impossible jump between road segments", () => {
  const result = validateLearnerRoute({
    map: testMap(),
    difficulty: "easy",
    routeSegments: [
      segment("seg-1", "road-a-b", "a", "b"),
      segment("seg-2", "road-c-d-one-way", "c", "d")
    ]
  });

  assert.equal(result.status, "invalid");
  assert.equal(result.valid, false);
  assert.ok(result.ruleCodes.includes("disconnected-route-jump"));
  assert.deepEqual(result.blockingErrors[0]?.routeSegmentIds, ["seg-1", "seg-2"]);
});

test("wrong-way one-way route is invalid when one-way data is available", () => {
  const result = validateLearnerRoute({
    map: testMap(),
    difficulty: "easy",
    routeSegments: [segment("seg-1", "road-c-d-one-way", "d", "c")]
  });

  assert.equal(result.status, "invalid");
  assert.ok(result.ruleCodes.includes("wrong-way-one-way"));
  assert.match(result.blockingErrors[0]?.explanation ?? "", /wrong way/);
});

test("restricted or non-drivable segment is invalid when access metadata is available", () => {
  const result = validateLearnerRoute({
    map: testMap(),
    difficulty: "easy",
    routeSegments: [segment("seg-1", "road-b-e-footway", "b", "e")]
  });

  assert.equal(result.status, "invalid");
  assert.ok(result.ruleCodes.includes("non-drivable-segment"));
  assert.deepEqual(result.blockingErrors[0]?.roadIds, ["road-b-e-footway"]);
});

test("overly complex beginner route returns practical learner warnings", () => {
  const result = validateLearnerRoute({
    map: testMap(),
    difficulty: "beginner",
    routeSegments: [
      segment("seg-1", "road-a-b", "a", "b"),
      segment("seg-2", "road-b-c", "b", "c"),
      segment("seg-3", "road-c-f", "c", "f"),
      segment("seg-4", "road-f-g", "f", "g"),
      segment("seg-5", "road-g-h-roundabout", "g", "h"),
      segment("seg-6", "road-h-i", "h", "i")
    ]
  });

  assert.equal(result.status, "warning");
  assert.equal(result.valid, true);
  assert.deepEqual(result.blockingErrors, []);
  assert.ok(result.ruleCodes.includes("excessive-route-complexity"));
  assert.ok(result.ruleCodes.includes("roundabout-complexity"));
  assert.equal(result.metrics.roundaboutSegmentCount, 1);
});

test("valid route with unverifiable access metadata returns warnings instead of invalidity", () => {
  const result = validateLearnerRoute({
    map: testMap(),
    difficulty: "easy",
    routeSegments: [
      segment("seg-1", "road-a-b", "a", "b"),
      segment("seg-2", "road-b-c", "b", "c"),
      segment("seg-3", "road-c-j-unknown-access", "c", "j")
    ]
  });

  assert.equal(result.status, "warning");
  assert.equal(result.valid, true);
  assert.deepEqual(result.blockingErrors, []);
  assert.ok(result.ruleCodes.includes("access-metadata-unavailable"));
  assert.deepEqual(result.advisoryWarnings[0]?.routeSegmentIds, ["seg-3"]);
});
