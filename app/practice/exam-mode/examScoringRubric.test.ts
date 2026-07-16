import assert from "node:assert/strict";
import test from "node:test";
import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  runRouteExercise
} from "../../../lib/map-engine/index.ts";
import {
  EXAM_SCORING_PASS_THRESHOLD_PERCENT,
  buildExamScoringResult,
  resolveSubmittedExamScoringResult
} from "./examScoringRubric.ts";

const passingResult = runRouteExercise({
  map: marloweDistrictMap,
  exercises: marloweDistrictRouteExercises,
  exerciseId: "ex-library-market-museum",
  userRoute: {
    nodeIds: ["n02", "n03", "n12", "n17"],
    roadIds: ["r02", "r37", "r24"]
  }
});

test("Stage 9.2 builds a deterministic passing exam score and category breakdown", () => {
  const first = buildExamScoringResult(passingResult);
  const second = buildExamScoringResult(passingResult);

  assert.deepEqual(first, second);
  assert.equal(first.status, "pass");
  assert.equal(first.statusLabel, "Pass");
  assert.equal(first.passThresholdPercent, EXAM_SCORING_PASS_THRESHOLD_PERCENT);
  assert.equal(first.scorePercent, 99.2);
  assert.deepEqual(
    first.categories.map((category) => category.id),
    [
      "legality",
      "destination-completion",
      "route-efficiency",
      "detour-backtracking",
      "road-suitability",
      "avoidable-mistakes"
    ]
  );
  assert.match(first.disclaimer, /not an official TfL assessment/i);
});

test("Stage 9.2 uses current legality and matching results for automatic failures", () => {
  const illegalResult = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-station-to-hospital",
    userRoute: {
      nodeIds: ["n14", "n13", "n14", "n18", "n17", "n12", "n04", "n05", "n09"],
      roadIds: ["r14", "r14", "r26", "r22", "r24", "r16", "r04", "r15"]
    }
  });
  const score = buildExamScoringResult(illegalResult);
  const legality = score.categories.find((category) => category.id === "legality");
  const efficiency = score.categories.find((category) => category.id === "route-efficiency");
  const backtracking = score.categories.find((category) => category.id === "detour-backtracking");

  assert.equal(score.status, "needs-practice");
  assert.equal(legality?.scorePercent, 0);
  assert.equal(legality?.assessment, "supported");
  assert.equal(efficiency?.scorePercent, null);
  assert.equal(efficiency?.assessment, "limited");
  assert.equal(backtracking?.scorePercent, 0);
  assert.match(backtracking?.evidence.join(" ") ?? "", /1 immediate road reversal/i);
});

test("Stage 9.2 reports destination failure from existing required-stop validation", () => {
  const incompleteResult = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-library-market-museum",
    userRoute: {
      nodeIds: ["n02", "n03", "n12"],
      roadIds: ["r02", "r37"]
    }
  });
  const score = buildExamScoringResult(incompleteResult);
  const destination = score.categories.find((category) => category.id === "destination-completion");

  assert.equal(score.status, "needs-practice");
  assert.equal(destination?.scorePercent, 0);
  assert.equal(destination?.outcome, "needs-practice");
  assert.match(score.summary, /required destination/i);
});

test("Stage 9.2 marks unsupported road suitability honestly and does not weight repeated mistake evidence", () => {
  const score = buildExamScoringResult(passingResult);
  const suitability = score.categories.find((category) => category.id === "road-suitability");
  const mistakes = score.categories.find((category) => category.id === "avoidable-mistakes");

  assert.equal(suitability?.assessment, "unavailable");
  assert.equal(suitability?.scorePercent, null);
  assert.equal(suitability?.weightPercent, 0);
  assert.equal(mistakes?.assessment, "limited");
  assert.equal(mistakes?.weightPercent, 0);
  assert.match(mistakes?.summary ?? "", /No avoidable mistake/i);
});

test("Stage 9.2 scoring resolves only for submitted exam attempts", () => {
  assert.equal(
    resolveSubmittedExamScoringResult({
      mode: "student-exam",
      submitted: false,
      exerciseResult: passingResult
    }),
    null
  );
  assert.equal(
    resolveSubmittedExamScoringResult({
      mode: "student-beta",
      submitted: true,
      exerciseResult: passingResult
    }),
    null
  );
  assert.equal(
    resolveSubmittedExamScoringResult({
      mode: "dev",
      submitted: true,
      exerciseResult: passingResult
    }),
    null
  );
  assert.equal(
    resolveSubmittedExamScoringResult({
      mode: "student-exam",
      submitted: true,
      exerciseResult: null
    }),
    null
  );

  const submitted = resolveSubmittedExamScoringResult({
    mode: "student-exam",
    submitted: true,
    exerciseResult: passingResult
  });

  assert.equal(submitted?.status, "pass");
});
