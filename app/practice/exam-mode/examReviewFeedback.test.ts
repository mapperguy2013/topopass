import assert from "node:assert/strict";
import test from "node:test";
import {
  buildIllegalDrawnMovementHighlights,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  runRouteExercise,
  type MapDefinition,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import { buildExamReviewFeedback, resolveSubmittedExamReviewFeedback } from "./examReviewFeedback.ts";
import { buildExamScoringResult } from "./examScoringRubric.ts";

const passingResult = runRouteExercise({
  map: marloweDistrictMap,
  exercises: marloweDistrictRouteExercises,
  exerciseId: "ex-library-market-museum",
  userRoute: {
    nodeIds: ["n02", "n03", "n12", "n17"],
    roadIds: ["r02", "r37", "r24"]
  }
});

function attemptEvidenceFor(
  result: ReturnType<typeof runRouteExercise>,
  map: MapDefinition = marloweDistrictMap
) {
  const illegalMovements = buildIllegalDrawnMovementHighlights({
    map,
    illegalMovements: result.score.legality.illegalMovements,
    scored: true
  });

  return {
    illegalMovements: illegalMovements.map((movement) => ({
      id: movement.id,
      label: movement.message
    }))
  };
}

test("Stage 9.3 resolves review only after a submitted exam attempt", () => {
  const scoringResult = buildExamScoringResult(passingResult);
  const attemptEvidence = attemptEvidenceFor(passingResult);

  assert.equal(
    resolveSubmittedExamReviewFeedback({
      mode: "student-exam",
      submitted: false,
      scoringResult,
      exerciseResult: passingResult,
      attemptEvidence
    }),
    null
  );
  assert.equal(
    resolveSubmittedExamReviewFeedback({
      mode: "student-beta",
      submitted: true,
      scoringResult,
      exerciseResult: passingResult,
      attemptEvidence
    }),
    null
  );
  assert.equal(
    resolveSubmittedExamReviewFeedback({
      mode: "dev",
      submitted: true,
      scoringResult,
      exerciseResult: passingResult,
      attemptEvidence
    }),
    null
  );

  assert.equal(
    resolveSubmittedExamReviewFeedback({
      mode: "student-exam",
      submitted: true,
      scoringResult,
      exerciseResult: passingResult,
      attemptEvidence
    })?.status,
    "pass"
  );
});

test("Stage 9.3 gives deterministic learner strengths for a passing route", () => {
  const scoringResult = buildExamScoringResult(passingResult);
  const input = {
    scoringResult,
    exerciseResult: passingResult,
    attemptEvidence: attemptEvidenceFor(passingResult)
  };

  const first = buildExamReviewFeedback(input);
  const second = buildExamReviewFeedback(input);

  assert.deepEqual(first, second);
  assert.equal(first.statusLabel, "Pass");
  assert.ok(first.strengths.some((item) => item.principle === "Legal route planning"));
  assert.ok(first.strengths.some((item) => item.principle === "Task completion"));
  assert.equal(first.improvements.length, 0);
  assert.ok(first.limitations.some((item) => item.principle === "Road hierarchy"));
  assert.ok(first.limitations.some((item) => item.principle === "London context"));
});

test("Stage 9.3 explains legality and backtracking findings from current engine evidence", () => {
  const illegalResult = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-station-to-hospital",
    userRoute: {
      nodeIds: ["n14", "n13", "n14", "n18", "n17", "n12", "n04", "n05", "n09"],
      roadIds: ["r14", "r14", "r26", "r22", "r24", "r16", "r04", "r15"]
    }
  });
  const review = buildExamReviewFeedback({
    scoringResult: buildExamScoringResult(illegalResult),
    exerciseResult: illegalResult,
    attemptEvidence: attemptEvidenceFor(illegalResult)
  });

  assert.equal(review.status, "needs-practice");
  assert.ok(review.improvements.some((item) => item.principle === "Turn restrictions"));
  assert.ok(review.improvements.some((item) => item.principle === "Backtracking"));
  assert.match(review.overlaySummary ?? "", /restriction issue/i);
});

test("Stage 9.3 explains a verified wrong-way movement as one-way awareness", () => {
  const map: MapDefinition = {
    id: "exam-review-one-way",
    name: "Exam review one-way fixture",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 }
    ],
    roads: [
      {
        id: "road-ab",
        name: "Fixture Road",
        fromNodeId: "a",
        toNodeId: "b",
        distanceMeters: 100,
        isOneWay: true
      }
    ],
    restrictions: [],
    landmarks: []
  };
  const exercises: RouteExercise[] = [
    {
      id: "wrong-way-exam-review",
      title: "Wrong-way exam review",
      mapId: map.id,
      stops: [
        { type: "node", nodeId: "b" },
        { type: "node", nodeId: "a" }
      ]
    }
  ];
  const result = runRouteExercise({
    map,
    exercises,
    exerciseId: exercises[0].id,
    userRoute: {
      nodeIds: ["b", "a"],
      roadIds: ["road-ab"]
    }
  });
  const review = buildExamReviewFeedback({
    scoringResult: buildExamScoringResult(result),
    exerciseResult: result,
    attemptEvidence: attemptEvidenceFor(result, map)
  });
  const oneWayFeedback = review.improvements.find(
    (item) => item.principle === "One-way awareness"
  );

  assert.ok(oneWayFeedback);
  assert.match(oneWayFeedback.explanation, /permitted direction/i);
  assert.match(oneWayFeedback.evidence.join(" "), /wrong way/i);
});

test("Stage 9.3 explains missed destination completion without inventing map context", () => {
  const incompleteResult = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-library-market-museum",
    userRoute: {
      nodeIds: ["n02", "n03", "n12"],
      roadIds: ["r02", "r37"]
    }
  });
  const review = buildExamReviewFeedback({
    scoringResult: buildExamScoringResult(incompleteResult),
    exerciseResult: incompleteResult,
    attemptEvidence: attemptEvidenceFor(incompleteResult)
  });

  assert.ok(
    review.improvements.some(
      (item) => item.principle === "Task completion" && /stated destination/i.test(item.title)
    )
  );
  assert.ok(
    review.limitations.some(
      (item) => item.principle === "London context" && /not scored/i.test(item.title)
    )
  );
});
