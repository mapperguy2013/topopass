import assert from "node:assert/strict";
import test from "node:test";
import {
  canSubmitDraftRoute,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  validateDraftRouteSelection,
  type DraftRouteValidationIssueCode,
  type MapDefinition,
  type RouteExercise
} from "./index.ts";

const exerciseId = "ex-library-market-museum";
const validDraft = {
  draftNodeIds: ["n02", "n03", "n12", "n17"],
  draftRoadIds: ["r02", "r37", "r24"]
};

function validateMarloweDraft(input: {
  exerciseId?: string;
  draftNodeIds?: string[];
  draftRoadIds?: string[];
}) {
  return validateDraftRouteSelection({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: input.exerciseId ?? exerciseId,
    draftNodeIds: input.draftNodeIds,
    draftRoadIds: input.draftRoadIds
  });
}

function issueCodes(result: ReturnType<typeof validateDraftRouteSelection>): DraftRouteValidationIssueCode[] {
  return result.issues.map((issue) => issue.code);
}

test("validateDraftRouteSelection reports an unknown exercise", () => {
  const result = validateMarloweDraft({
    exerciseId: "missing-exercise",
    draftNodeIds: validDraft.draftNodeIds,
    draftRoadIds: validDraft.draftRoadIds
  });

  assert.equal(result.isValidDraft, false);
  assert.equal(result.isReadyToSubmit, false);
  assert.deepEqual(issueCodes(result), ["unknown_exercise"]);
});

test("validateDraftRouteSelection reports an empty route with required-stop preview", () => {
  const result = validateMarloweDraft({});

  assert.equal(result.isValidDraft, true);
  assert.equal(result.isReadyToSubmit, false);
  assert.deepEqual(issueCodes(result), ["empty_route"]);
  assert.deepEqual(result.preview.requiredStopNodeIds, ["n02", "n12", "n17"]);
  assert.equal(result.preview.nextRequiredStopNodeId, "n02");
  assert.equal(result.preview.requiredStopsVisited, 0);
});

test("validateDraftRouteSelection reports unknown node IDs", () => {
  const result = validateMarloweDraft({
    draftNodeIds: ["n02", "missing-node"]
  });

  assert.equal(result.isValidDraft, false);
  assert(issueCodes(result).includes("unknown_node"));
  assert.equal(result.issues.find((issue) => issue.code === "unknown_node")?.nodeId, "missing-node");
});

test("validateDraftRouteSelection reports unknown road IDs", () => {
  const result = validateMarloweDraft({
    draftRoadIds: ["missing-road"]
  });

  assert.equal(result.isValidDraft, false);
  assert.deepEqual(issueCodes(result), ["unknown_road"]);
  assert.equal(result.issues[0].roadId, "missing-road");
});

test("validateDraftRouteSelection reports disconnected node sequences", () => {
  const result = validateMarloweDraft({
    draftNodeIds: ["n02", "n05"]
  });

  assert.equal(result.isValidDraft, false);
  assert(issueCodes(result).includes("disconnected_route"));
});

test("validateDraftRouteSelection reports roads that do not connect supplied node pairs", () => {
  const result = validateMarloweDraft({
    draftNodeIds: ["n02", "n03"],
    draftRoadIds: ["r24"]
  });

  assert.equal(result.isValidDraft, false);
  assert.deepEqual(issueCodes(result), ["disconnected_route"]);
  assert.equal(result.issues[0].roadId, "r24");
});

test("validateDraftRouteSelection reports wrong starts", () => {
  const result = validateMarloweDraft({
    draftNodeIds: ["n03", "n12", "n17"],
    draftRoadIds: ["r37", "r24"]
  });

  assert.equal(result.preview.hasCorrectStart, false);
  assert.equal(result.isReadyToSubmit, false);
  assert(issueCodes(result).includes("wrong_start"));
});

test("validateDraftRouteSelection previews progress and missing destination", () => {
  const result = validateMarloweDraft({
    draftNodeIds: ["n02", "n03", "n12"],
    draftRoadIds: ["r02", "r37"]
  });

  assert.equal(result.isValidDraft, true);
  assert.equal(result.isReadyToSubmit, false);
  assert.deepEqual(issueCodes(result), ["missing_destination"]);
  assert.equal(result.preview.currentNodeId, "n12");
  assert.equal(result.preview.hasCorrectStart, true);
  assert.equal(result.preview.hasReachedDestination, false);
  assert.equal(result.preview.requiredStopsVisited, 2);
  assert.equal(result.preview.requiredStopsTotal, 3);
  assert.equal(result.preview.nextRequiredStopNodeId, "n17");
});

test("validateDraftRouteSelection reports missing required intermediate stops", () => {
  const result = validateMarloweDraft({
    draftNodeIds: ["n02", "n11", "n16", "n17"],
    draftRoadIds: ["r09", "r25", "r21"]
  });

  assert.equal(result.preview.hasReachedDestination, true);
  assert.equal(result.isReadyToSubmit, false);
  assert(issueCodes(result).includes("missing_required_stop"));
});

test("validateDraftRouteSelection reports required stops visited out of order", () => {
  const map: MapDefinition = {
    id: "draft-order-map",
    name: "Draft Order Map",
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
    landmarks: []
  };
  const exercises: RouteExercise[] = [
    {
      id: "ordered-exercise",
      title: "Ordered Exercise",
      mapId: map.id,
      stops: [
        { type: "node", nodeId: "a" },
        { type: "node", nodeId: "b" },
        { type: "node", nodeId: "c" },
        { type: "node", nodeId: "d" }
      ]
    }
  ];
  const result = validateDraftRouteSelection({
    map,
    exercises,
    exerciseId: "ordered-exercise",
    draftNodeIds: ["a", "c", "b", "d"],
    draftRoadIds: ["road-ac", "road-cb", "road-bd"]
  });

  assert.equal(result.isValidDraft, false);
  assert(issueCodes(result).includes("out_of_order_stop"));
  assert.equal(result.issues.find((issue) => issue.code === "out_of_order_stop")?.expectedNodeId, "b");
});

test("validateDraftRouteSelection marks complete connected drafts ready to submit", () => {
  const result = validateMarloweDraft(validDraft);

  assert.equal(result.isValidDraft, true);
  assert.equal(result.isReadyToSubmit, true);
  assert.equal(canSubmitDraftRoute(result), true);
  assert.deepEqual(result.issues, []);
  assert.equal(result.preview.currentNodeId, "n17");
  assert.equal(result.preview.hasCorrectStart, true);
  assert.equal(result.preview.hasReachedDestination, true);
  assert.equal(result.preview.requiredStopsVisited, 3);
  assert.equal(result.preview.requiredStopsTotal, 3);
  assert.equal(result.preview.totalSelectedDistance, 443);
  assert.deepEqual(result.preview.selectedNodeIds, validDraft.draftNodeIds);
  assert.deepEqual(result.preview.selectedRoadIds, validDraft.draftRoadIds);
  assert.deepEqual(result.normalisedAttempt?.selectedDirectedEdgeIds, ["r02:forward", "r37:forward", "r24:forward"]);
});

test("validateDraftRouteSelection returns defensive preview array copies", () => {
  const result = validateMarloweDraft(validDraft);

  result.preview.selectedNodeIds.push("mutated-node");
  result.preview.selectedRoadIds.push("mutated-road");

  const nextResult = validateMarloweDraft(validDraft);
  assert.deepEqual(nextResult.preview.selectedNodeIds, validDraft.draftNodeIds);
  assert.deepEqual(nextResult.preview.selectedRoadIds, validDraft.draftRoadIds);
});

test("canSubmitDraftRoute mirrors ready-to-submit status", () => {
  assert.equal(canSubmitDraftRoute(validateMarloweDraft({})), false);
  assert.equal(canSubmitDraftRoute(validateMarloweDraft(validDraft)), true);
});
