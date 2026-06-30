import assert from "node:assert/strict";
import test from "node:test";
import {
  appendAdaptivePracticeOutcomeFeedback,
  buildAdaptivePracticeOutcomeFeedback,
  completeAdaptivePracticeItem,
  createEmptyAdaptivePracticeLauncherState,
  dismissAdaptivePracticeItem,
  getAdaptivePracticeItemStatus,
  getLatestAdaptivePracticeOutcomeFeedback,
  normaliseAdaptivePracticeLauncherState,
  parseStoredAdaptivePracticeLauncherState,
  serialiseAdaptivePracticeLauncherState,
  skipAdaptivePracticeItem,
  startAdaptivePracticeItem,
  summarizeAdaptivePracticeOutcomeFeedback,
  undoAdaptivePracticeItemStatus
} from "./adaptivePracticeLauncher.ts";
import type { RouteAttemptReview, RoutePracticeWeaknessType } from "./routeAttemptReview.ts";

const item = {
  id: "adaptive-no-entry-roads",
  title: "Practise no-entry roads",
  relatedWeakAreas: ["no-entry" as RoutePracticeWeaknessType],
  practiceFocus: "Spot no-entry symbols early."
};
const completedAt = "2026-06-25T10:00:00.000Z";

function review(value: Partial<RouteAttemptReview> = {}): RouteAttemptReview {
  return {
    status: "pass",
    title: "Route passed",
    scoreLabel: "100.0% (pass)",
    distanceLabel: "Your route: 100 m. Shortest legal route: 100 m. Extra distance: +0 m.",
    distanceMetrics: [
      {
        id: "student-route-distance",
        label: "Your route",
        value: "100 m"
      },
      {
        id: "shortest-legal-distance",
        label: "Shortest legal route",
        value: "100 m"
      },
      {
        id: "extra-distance",
        label: "Extra distance",
        value: "+0 m"
      }
    ],
    illegalMovements: [],
    missedRestrictions: [],
    suggestedFailureReason: null,
    correctionHints: [],
    practiceRecommendations: [],
    recommendedPracticeQueue: [],
    ...value
  };
}

function noEntryReview(value: Partial<RouteAttemptReview> = {}): RouteAttemptReview {
  return review({
    status: "fail",
    title: "Route failed",
    scoreLabel: "42.0% (fail)",
    illegalMovements: [
      {
        id: "no-entry",
        label: "No-entry road used on r09",
        severity: "error"
      }
    ],
    suggestedFailureReason: "The route entered a no-entry road.",
    recommendedPracticeQueue: [
      {
        id: "practice-no-entry-roads",
        title: "Practise no-entry roads",
        reason: "This attempt entered a road from a blocked direction.",
        weaknessType: "no-entry",
        priority: "high"
      }
    ],
    ...value
  });
}

test("createEmptyAdaptivePracticeLauncherState returns expected defaults", () => {
  assert.deepEqual(createEmptyAdaptivePracticeLauncherState(), {
    activeAdaptivePracticeItemId: null,
    skippedPracticeItemIds: [],
    dismissedPracticeItemIds: [],
    completedPracticeItemIds: [],
    lastStartedPracticeItemId: null,
    practiceSessionStartedAt: null,
    outcomeFeedbackHistory: []
  });
});

test("startAdaptivePracticeItem sets active item, last-started item, and timestamp", () => {
  const state = startAdaptivePracticeItem(createEmptyAdaptivePracticeLauncherState(), item, "2026-06-25T10:00:00.000Z");

  assert.equal(state.activeAdaptivePracticeItemId, item.id);
  assert.equal(state.lastStartedPracticeItemId, item.id);
  assert.equal(state.practiceSessionStartedAt, "2026-06-25T10:00:00.000Z");
});

test("startAdaptivePracticeItem removes the same item from skipped dismissed and completed arrays", () => {
  const state = startAdaptivePracticeItem(
    {
      activeAdaptivePracticeItemId: null,
      skippedPracticeItemIds: [item.id, "other-skipped"],
      dismissedPracticeItemIds: [item.id, "other-dismissed"],
      completedPracticeItemIds: [item.id, "other-completed"],
      lastStartedPracticeItemId: null,
      practiceSessionStartedAt: null,
      outcomeFeedbackHistory: []
    },
    item,
    "2026-06-25T10:00:00.000Z"
  );

  assert.deepEqual(state.skippedPracticeItemIds, ["other-skipped"]);
  assert.deepEqual(state.dismissedPracticeItemIds, ["other-dismissed"]);
  assert.deepEqual(state.completedPracticeItemIds, ["other-completed"]);
});

test("skipAdaptivePracticeItem clears an active item and keeps ids unique", () => {
  const started = startAdaptivePracticeItem(createEmptyAdaptivePracticeLauncherState(), item, "2026-06-25T10:00:00.000Z");
  const skippedOnce = skipAdaptivePracticeItem(started, item.id);
  const skippedTwice = skipAdaptivePracticeItem(skippedOnce, item.id);

  assert.equal(skippedTwice.activeAdaptivePracticeItemId, null);
  assert.equal(skippedTwice.practiceSessionStartedAt, null);
  assert.deepEqual(skippedTwice.skippedPracticeItemIds, [item.id]);
});

test("dismissAdaptivePracticeItem clears an active item and keeps ids unique", () => {
  const started = startAdaptivePracticeItem(createEmptyAdaptivePracticeLauncherState(), item, "2026-06-25T10:00:00.000Z");
  const dismissedOnce = dismissAdaptivePracticeItem(started, item.id);
  const dismissedTwice = dismissAdaptivePracticeItem(dismissedOnce, item.id);

  assert.equal(dismissedTwice.activeAdaptivePracticeItemId, null);
  assert.equal(dismissedTwice.practiceSessionStartedAt, null);
  assert.deepEqual(dismissedTwice.dismissedPracticeItemIds, [item.id]);
});

test("completeAdaptivePracticeItem clears an active item and keeps ids unique", () => {
  const started = startAdaptivePracticeItem(createEmptyAdaptivePracticeLauncherState(), item, "2026-06-25T10:00:00.000Z");
  const completedOnce = completeAdaptivePracticeItem(started, item.id);
  const completedTwice = completeAdaptivePracticeItem(completedOnce, item.id);

  assert.equal(completedTwice.activeAdaptivePracticeItemId, null);
  assert.equal(completedTwice.practiceSessionStartedAt, null);
  assert.deepEqual(completedTwice.completedPracticeItemIds, [item.id]);
});

test("getAdaptivePracticeItemStatus resolves active skipped dismissed completed and recommended states", () => {
  assert.equal(
    getAdaptivePracticeItemStatus(
      {
        activeAdaptivePracticeItemId: item.id,
        skippedPracticeItemIds: [item.id],
        dismissedPracticeItemIds: [item.id],
        completedPracticeItemIds: [item.id],
        lastStartedPracticeItemId: item.id,
        practiceSessionStartedAt: "2026-06-25T10:00:00.000Z",
        outcomeFeedbackHistory: []
      },
      item.id
    ),
    "active"
  );

  assert.equal(
    getAdaptivePracticeItemStatus(
      {
        ...createEmptyAdaptivePracticeLauncherState(),
        skippedPracticeItemIds: [item.id]
      },
      item.id
    ),
    "skipped"
  );
  assert.equal(
    getAdaptivePracticeItemStatus(
      {
        ...createEmptyAdaptivePracticeLauncherState(),
        dismissedPracticeItemIds: [item.id]
      },
      item.id
    ),
    "dismissed"
  );
  assert.equal(
    getAdaptivePracticeItemStatus(
      {
        ...createEmptyAdaptivePracticeLauncherState(),
        completedPracticeItemIds: [item.id]
      },
      item.id
    ),
    "completed"
  );
  assert.equal(getAdaptivePracticeItemStatus(createEmptyAdaptivePracticeLauncherState(), item.id), "recommended");
});

test("undoAdaptivePracticeItemStatus removes item status and clears active if relevant", () => {
  const state = undoAdaptivePracticeItemStatus(
    {
      activeAdaptivePracticeItemId: item.id,
      skippedPracticeItemIds: [item.id, "skipped"],
      dismissedPracticeItemIds: [item.id, "dismissed"],
      completedPracticeItemIds: [item.id, "completed"],
      lastStartedPracticeItemId: item.id,
      practiceSessionStartedAt: "2026-06-25T10:00:00.000Z",
      outcomeFeedbackHistory: []
    },
    item.id
  );

  assert.equal(state.activeAdaptivePracticeItemId, null);
  assert.equal(state.practiceSessionStartedAt, null);
  assert.deepEqual(state.skippedPracticeItemIds, ["skipped"]);
  assert.deepEqual(state.dismissedPracticeItemIds, ["dismissed"]);
  assert.deepEqual(state.completedPracticeItemIds, ["completed"]);
});

test("parseStoredAdaptivePracticeLauncherState falls back safely for malformed JSON", () => {
  assert.deepEqual(parseStoredAdaptivePracticeLauncherState("{"), createEmptyAdaptivePracticeLauncherState());
});

test("normaliseAdaptivePracticeLauncherState handles older partial objects and unique arrays", () => {
  assert.deepEqual(
    normaliseAdaptivePracticeLauncherState({
      skippedPracticeItemIds: [item.id, item.id, "", null, "other"],
      dismissedPracticeItemIds: "bad-value"
    }),
    {
      activeAdaptivePracticeItemId: null,
      skippedPracticeItemIds: [item.id, "other"],
      dismissedPracticeItemIds: [],
      completedPracticeItemIds: [],
      lastStartedPracticeItemId: null,
      practiceSessionStartedAt: null,
      outcomeFeedbackHistory: []
    }
  );
});

test("serialiseAdaptivePracticeLauncherState writes a normalised persisted shape", () => {
  const serialised = serialiseAdaptivePracticeLauncherState({
    activeAdaptivePracticeItemId: item.id,
    skippedPracticeItemIds: ["a", "a"],
    dismissedPracticeItemIds: [],
    completedPracticeItemIds: [],
    lastStartedPracticeItemId: item.id,
    practiceSessionStartedAt: "2026-06-25T10:00:00.000Z",
    outcomeFeedbackHistory: []
  });

  assert.deepEqual(JSON.parse(serialised), {
    activeAdaptivePracticeItemId: item.id,
    skippedPracticeItemIds: ["a"],
    dismissedPracticeItemIds: [],
    completedPracticeItemIds: [],
    lastStartedPracticeItemId: item.id,
    practiceSessionStartedAt: "2026-06-25T10:00:00.000Z",
    outcomeFeedbackHistory: []
  });
});

test("buildAdaptivePracticeOutcomeFeedback creates resolved feedback for passing focused practice", () => {
  const feedback = buildAdaptivePracticeOutcomeFeedback({
    practiceItem: item,
    exerciseId: "exercise-a",
    completedAt,
    review: review()
  });

  assert.equal(feedback.outcome, "resolved");
  assert.equal(feedback.practiceItemId, item.id);
  assert.equal(feedback.exerciseId, "exercise-a");
  assert.deepEqual(feedback.deprioritizedWeakAreas, ["no-entry"]);
  assert.deepEqual(feedback.reinforcedWeakAreas, []);
  assert.match(summarizeAdaptivePracticeOutcomeFeedback(feedback), /resolved/i);
});

test("buildAdaptivePracticeOutcomeFeedback creates improved feedback when score improves but related weakness remains", () => {
  const feedback = buildAdaptivePracticeOutcomeFeedback({
    practiceItem: item,
    exerciseId: "exercise-a",
    completedAt,
    review: noEntryReview({ scoreLabel: "65.0% (fail)" }),
    previousScorePercent: 42
  });

  assert.equal(feedback.outcome, "improved");
  assert.deepEqual(feedback.reinforcedWeakAreas, ["no-entry"]);
  assert.equal(feedback.evidence.scorePercent, 65);
});

test("buildAdaptivePracticeOutcomeFeedback creates repeated-issue feedback when same weak area appears again", () => {
  const feedback = buildAdaptivePracticeOutcomeFeedback({
    practiceItem: item,
    exerciseId: "exercise-a",
    completedAt,
    review: noEntryReview()
  });

  assert.equal(feedback.outcome, "repeated-issue");
  assert.deepEqual(feedback.reinforcedWeakAreas, ["no-entry"]);
  assert.equal(feedback.evidence.illegalMovementCount, 1);
});

test("buildAdaptivePracticeOutcomeFeedback creates mixed feedback when score improves but another weakness appears", () => {
  const feedback = buildAdaptivePracticeOutcomeFeedback({
    practiceItem: item,
    exerciseId: "exercise-a",
    completedAt,
    previousScorePercent: 25,
    review: noEntryReview({
      scoreLabel: "50.0% (fail)",
      recommendedPracticeQueue: [
        {
          id: "practice-no-entry-roads",
          title: "Practise no-entry roads",
          reason: "This attempt entered a road from a blocked direction.",
          weaknessType: "no-entry",
          priority: "high"
        },
        {
          id: "practice-required-checkpoints",
          title: "Practise ordered checkpoints",
          reason: "A checkpoint was missed.",
          weaknessType: "missed-checkpoint",
          priority: "high"
        }
      ]
    })
  });

  assert.equal(feedback.outcome, "mixed");
  assert.deepEqual(feedback.reinforcedWeakAreas, ["no-entry"]);
  assert.deepEqual(feedback.evidence.strongestWeaknessCategories, ["no-entry", "missed-checkpoint"]);
});

test("buildAdaptivePracticeOutcomeFeedback creates unknown feedback without usable review", () => {
  const feedback = buildAdaptivePracticeOutcomeFeedback({
    practiceItem: item,
    exerciseId: "exercise-a",
    completedAt,
    review: null
  });

  assert.equal(feedback.outcome, "unknown");
  assert.equal(feedback.evidence.scorePercent, null);
  assert.equal(feedback.evidence.passed, null);
});

test("appendAdaptivePracticeOutcomeFeedback keeps newest first and ignores duplicate practice items", () => {
  const firstFeedback = buildAdaptivePracticeOutcomeFeedback({
    practiceItem: item,
    exerciseId: "exercise-a",
    completedAt,
    review: noEntryReview()
  });
  const otherFeedback = buildAdaptivePracticeOutcomeFeedback({
    practiceItem: {
      ...item,
      id: "adaptive-one-way-direction",
      relatedWeakAreas: ["one-way-direction"]
    },
    exerciseId: "exercise-b",
    completedAt: "2026-06-25T11:00:00.000Z",
    review: review()
  });
  const duplicateFeedback = {
    ...firstFeedback,
    id: `${firstFeedback.practiceItemId}:duplicate`,
    completedAt: "2026-06-25T12:00:00.000Z"
  };

  let state = appendAdaptivePracticeOutcomeFeedback(createEmptyAdaptivePracticeLauncherState(), firstFeedback);
  state = appendAdaptivePracticeOutcomeFeedback(state, otherFeedback);
  state = appendAdaptivePracticeOutcomeFeedback(state, duplicateFeedback);

  assert.deepEqual(
    state.outcomeFeedbackHistory.map((feedback) => feedback.id),
    [otherFeedback.id, firstFeedback.id]
  );
  assert.equal(getLatestAdaptivePracticeOutcomeFeedback(state)?.id, otherFeedback.id);
});

test("old persisted launcher state without feedback history still parses", () => {
  const state = parseStoredAdaptivePracticeLauncherState(
    JSON.stringify({
      activeAdaptivePracticeItemId: item.id,
      skippedPracticeItemIds: [item.id],
      dismissedPracticeItemIds: [],
      completedPracticeItemIds: [],
      lastStartedPracticeItemId: item.id,
      practiceSessionStartedAt: completedAt
    })
  );

  assert.deepEqual(state.outcomeFeedbackHistory, []);
});

test("corrupt feedback history safely falls back to empty history", () => {
  const state = normaliseAdaptivePracticeLauncherState({
    outcomeFeedbackHistory: [
      {
        id: "bad-feedback"
      }
    ]
  });

  assert.deepEqual(state.outcomeFeedbackHistory, []);
});
