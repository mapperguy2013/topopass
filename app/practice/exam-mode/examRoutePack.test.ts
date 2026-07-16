import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  runRouteExercise,
  validateRouteExerciseLegalReachability
} from "../../../lib/map-engine/index.ts";
import { REAL_LONDON_BETA_MAP_OPTIONS } from "../real-london/realLondonBetaPracticeScreen.ts";
import { resolveSubmittedExamReviewFeedback } from "./examReviewFeedback.ts";
import {
  EXAM_ROUTE_PACK_STAGE,
  EXAM_ROUTE_TAGS,
  EXAM_ROUTE_TASK_VERSION,
  buildExamRoutePackMapOptions,
  getExamRouteTaskMetadata,
  listExamRouteTasks
} from "./examRoutePack.ts";
import { buildExamModePracticePageModel } from "./examModePractice.ts";
import { resolveSubmittedExamScoringResult } from "./examScoringRubric.ts";

const EXPECTED_TASK_IDS = [
  "exam-9-4-mortimer-market-to-byng-place",
  "exam-9-4-regent-street-to-haymarket",
  "exam-9-4-lancaster-place-stamford-blackfriars",
  "exam-9-4-grays-inn-road-to-goodge-street",
  "exam-9-4-hendon-way-to-cricklewood-lane",
  "exam-9-4-fox-lane-station-to-crown-court",
  "exam-9-4-albion-square-to-northgate-hospital"
] as const;

test("Stage 9.4 exposes the deterministic exam route pack through exam mode", () => {
  const first = buildExamModePracticePageModel();
  const second = buildExamModePracticePageModel();
  const tasks = listExamRouteTasks(first.mapOptions);

  assert.equal(first.routePack.stage, EXAM_ROUTE_PACK_STAGE);
  assert.equal(first.routePack.taskCount, EXPECTED_TASK_IDS.length);
  assert.deepEqual(first.routePack.taskIds, second.routePack.taskIds);
  assert.deepEqual([...first.routePack.taskIds].sort(), [...EXPECTED_TASK_IDS].sort());
  assert.deepEqual(second.routePack, first.routePack);
  assert.deepEqual(
    tasks.map((task) => task.id),
    first.routePack.taskIds
  );
  assert.equal(new Set(first.routePack.taskIds).size, first.routePack.taskCount);
  assert.equal(first.routePack.usesExistingFixtureStopsOnly, true);
  assert.equal(first.routePack.leavesPracticeCatalogueUnchanged, true);
});

test("Stage 9.4 route metadata is complete, stable, and source-backed", () => {
  const firstTasks = listExamRouteTasks(buildExamRoutePackMapOptions(REAL_LONDON_BETA_MAP_OPTIONS));
  const secondTasks = listExamRouteTasks(buildExamRoutePackMapOptions(REAL_LONDON_BETA_MAP_OPTIONS));
  const allowedTags = new Set(EXAM_ROUTE_TAGS);

  assert.deepEqual(
    secondTasks.map((task) => task.examRouteMetadata),
    firstTasks.map((task) => task.examRouteMetadata)
  );

  for (const task of firstTasks) {
    const metadata = task.examRouteMetadata;
    const sourceOption = REAL_LONDON_BETA_MAP_OPTIONS.find(
      (option) => option.map.id === metadata.mapId
    );

    assert.ok(sourceOption, `Missing source map option for ${task.id}`);
    assert.equal(task.mapId, metadata.mapId);
    assert.equal(task.exerciseVersion, EXAM_ROUTE_TASK_VERSION);
    assert.equal(metadata.stage, EXAM_ROUTE_PACK_STAGE);
    assert.equal(metadata.taskVersion, EXAM_ROUTE_TASK_VERSION);
    assert.equal(metadata.source.kind, "existing-committed-fixture-stops");
    assert.equal(metadata.officialTfLTask, false);
    assert.ok(metadata.origin.label.length > 0);
    assert.ok(metadata.destination.label.length > 0);
    assert.notEqual(metadata.origin.stopId, metadata.destination.stopId);
    assert.ok(metadata.tags.length > 0);
    assert.equal(new Set(metadata.tags).size, metadata.tags.length);
    assert.ok(metadata.tags.every((tag) => allowedTags.has(tag)));

    const endpointMetadata = [metadata.origin, ...metadata.checkpoints, metadata.destination];
    assert.equal(endpointMetadata.length, task.stops.length);

    endpointMetadata.forEach((endpoint, index) => {
      const sourceExercise = sourceOption.exercises.find(
        (exercise) => exercise.id === endpoint.sourceExerciseId
      );
      const sourceStop = sourceExercise?.stops[endpoint.sourceStopIndex];
      const taskStop = task.stops[index];

      assert.ok(sourceExercise, `Missing source exercise ${endpoint.sourceExerciseId}`);
      assert.ok(sourceStop, `Missing source stop for ${task.id}`);
      assert.equal(taskStop.type, endpoint.stopType);
      assert.deepEqual(taskStop, sourceStop);
      assert.equal(
        endpoint.stopId,
        sourceStop.type === "node" ? sourceStop.nodeId : sourceStop.landmarkId
      );
    });
  }
});

test("Stage 9.4 covers the declared London planning skills without exposing task tags as guidance", () => {
  const model = buildExamModePracticePageModel();
  const coveredTags = new Set(model.routePack.tags);

  for (const tag of EXAM_ROUTE_TAGS) {
    assert.ok(coveredTags.has(tag), `Expected exam route coverage for ${tag}`);
  }

  assert.equal("routePack" in model.learnerRules, false);
  assert.equal(model.learnerRules.turnByTurnGuidance, false);
  assert.equal(model.suppressesHintsDuringAttempt, true);
});

test("Stage 9.4 leaves the existing practice catalogue unchanged", () => {
  const before = REAL_LONDON_BETA_MAP_OPTIONS.map((option) => ({
    mapId: option.map.id,
    exerciseIds: option.exercises.map((exercise) => exercise.id)
  }));

  buildExamModePracticePageModel();

  const after = REAL_LONDON_BETA_MAP_OPTIONS.map((option) => ({
    mapId: option.map.id,
    exerciseIds: option.exercises.map((exercise) => exercise.id)
  }));

  assert.deepEqual(after, before);
  assert.equal(listExamRouteTasks(REAL_LONDON_BETA_MAP_OPTIONS).length, 0);
  assert.ok(
    REAL_LONDON_BETA_MAP_OPTIONS.every((option) =>
      option.exercises.every((exercise) => getExamRouteTaskMetadata(exercise) === null)
    )
  );
});

test("Stage 9.4 tasks are legally reachable and compatible with scoring and review", () => {
  const mapOptions = buildExamRoutePackMapOptions(REAL_LONDON_BETA_MAP_OPTIONS);
  const tasks = listExamRouteTasks(mapOptions);

  for (const task of tasks) {
    const option = mapOptions.find((candidate) => candidate.map.id === task.mapId);
    assert.ok(option, `Missing exam map option for ${task.id}`);

    const validation = validateRouteExerciseLegalReachability(task, option.map);
    assert.equal(validation.valid, true, validation.errors.join("; "));

    const shortestRoute = findShortestLegalRouteThroughStops({
      graph: buildMapGraph(option.map),
      stopNodeIds: validation.stopNodeIds,
      restrictions: option.map.restrictions
    });
    assert.equal(shortestRoute.found, true, `No legal route found for ${task.id}`);

    if (!shortestRoute.found) {
      continue;
    }

    const exerciseResult = runRouteExercise({
      map: option.map,
      exercises: option.exercises,
      exerciseId: task.id,
      userRoute: {
        nodeIds: shortestRoute.nodeIds,
        roadIds: shortestRoute.roadIds
      }
    });
    assert.equal(exerciseResult.score.passed, true, `Shortest route did not pass for ${task.id}`);

    const scoringResult = resolveSubmittedExamScoringResult({
      mode: "student-exam",
      submitted: true,
      exerciseResult
    });
    assert.ok(scoringResult, `No submitted exam score for ${task.id}`);
    assert.equal(scoringResult.categories.length, 6);

    const review = resolveSubmittedExamReviewFeedback({
      mode: "student-exam",
      submitted: true,
      scoringResult,
      exerciseResult,
      attemptEvidence: { illegalMovements: [] }
    });
    assert.ok(review, `No submitted exam review for ${task.id}`);
    assert.equal(review.scorePercent, scoringResult.scorePercent);
  }
});
