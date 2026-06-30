import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCompactAdaptiveRecommendationDisplay,
  selectCompactAdaptiveRecommendationId
} from "./adaptiveRecommendationDisplay.ts";
import type {
  AdaptivePracticeExercise,
  AdaptivePracticeQueueItem,
  AdaptivePracticeSourceSignals
} from "./adaptivePracticeQueue.ts";

const sourceSignals: AdaptivePracticeSourceSignals = {
  latestReview: true,
  weakAreaProfile: false,
  attemptHistory: true,
  savedAttempts: false,
  outcomeFeedback: false
};

const availableExercises: AdaptivePracticeExercise[] = [
  {
    id: "exercise-no-entry",
    title: "No-entry focus route",
    focusAreas: ["no-entry"],
    difficulty: "easy"
  },
  {
    id: "exercise-efficiency",
    title: "Efficient legal route",
    focusAreas: ["route-efficiency"],
    difficulty: "medium"
  }
];

const recommendations: AdaptivePracticeQueueItem[] = [
  {
    id: "adaptive-no-entry-roads",
    type: "restriction-focus",
    title: "Practise no-entry roads",
    explanation: "Recent feedback shows no-entry mistakes.",
    practiceFocus: "Check red no-entry symbols before choosing the next road.",
    priority: "high",
    score: 90,
    reasons: ["You entered a no-entry road.", "This is a legality-critical issue."],
    relatedWeakAreas: ["no-entry"],
    relatedExerciseIds: ["exercise-no-entry"],
    sourceSignals
  },
  {
    id: "adaptive-route-efficiency",
    type: "efficiency-focus",
    title: "Shorten legal routes",
    explanation: "Recent attempts were legal but too long.",
    practiceFocus: "Compare your route with the shortest legal route before submitting.",
    priority: "medium",
    score: 52,
    reasons: ["Your legal route was much longer than the shortest route."],
    relatedWeakAreas: ["inefficient-route"],
    relatedExerciseIds: ["exercise-efficiency"],
    sourceSignals: {
      latestReview: true,
      weakAreaProfile: true,
      attemptHistory: false,
      savedAttempts: true,
      outcomeFeedback: false
    }
  }
];

test("compact adaptive recommendations select the first item by default", () => {
  const model = buildCompactAdaptiveRecommendationDisplay({
    items: recommendations,
    availableExercises
  });

  assert.equal(model.selectedId, "adaptive-no-entry-roads");
  assert.equal(model.detail?.title, "Practise no-entry roads");
  assert.equal(model.rows[0].isSelected, true);
  assert.equal(model.rows[1].isSelected, false);
});

test("compact adaptive recommendation rows contain summary data without full detail reasons", () => {
  const model = buildCompactAdaptiveRecommendationDisplay({
    items: recommendations,
    availableExercises
  });

  assert.deepEqual(
    model.rows.map((row) => ({
      number: row.number,
      title: row.title,
      summary: row.summary,
      weakAreaLabel: row.weakAreaLabel,
      priority: row.priority,
      status: row.status,
      difficulty: row.difficulty,
      linkedExerciseLabel: row.linkedExerciseLabel
    })),
    [
      {
        number: 1,
        title: "Practise no-entry roads",
        summary: "Check red no-entry symbols before choosing the next road.",
        weakAreaLabel: "no entry",
        priority: "high",
        status: "recommended",
        difficulty: "easy",
        linkedExerciseLabel: "No-entry focus route (exercise-no-entry)"
      },
      {
        number: 2,
        title: "Shorten legal routes",
        summary: "Compare your route with the shortest legal route before submitting.",
        weakAreaLabel: "inefficient route",
        priority: "medium",
        status: "recommended",
        difficulty: "medium",
        linkedExerciseLabel: "Efficient legal route (exercise-efficiency)"
      }
    ]
  );
});

test("compact adaptive recommendation detail changes when another row is selected", () => {
  const model = buildCompactAdaptiveRecommendationDisplay({
    items: recommendations,
    selectedItemId: "adaptive-route-efficiency",
    availableExercises
  });

  assert.equal(model.selectedId, "adaptive-route-efficiency");
  assert.equal(model.detail?.title, "Shorten legal routes");
  assert.equal(model.detail?.practiceFocus, "Compare your route with the shortest legal route before submitting.");
  assert.equal(model.detail?.weakAreaLabel, "inefficient route");
  assert.deepEqual(model.detail?.reasons, ["Your legal route was much longer than the shortest route."]);
  assert.equal(model.rows[0].isSelected, false);
  assert.equal(model.rows[1].isSelected, true);
});

test("compact adaptive recommendation selection falls back safely when selected id disappears", () => {
  assert.equal(selectCompactAdaptiveRecommendationId(recommendations, "missing"), "adaptive-no-entry-roads");
  assert.equal(selectCompactAdaptiveRecommendationId([], "missing"), null);
});

test("compact adaptive recommendation model preserves statuses for detail actions", () => {
  const model = buildCompactAdaptiveRecommendationDisplay({
    items: recommendations,
    selectedItemId: "adaptive-no-entry-roads",
    availableExercises,
    itemStatuses: {
      "adaptive-no-entry-roads": "active"
    }
  });

  assert.equal(model.rows[0].status, "active");
  assert.equal(model.detail?.status, "active");
});
