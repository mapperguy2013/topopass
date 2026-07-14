import assert from "node:assert/strict";
import test from "node:test";
import {
  LEARNER_TRAINING_HINT_AUTO_DISMISS_MS,
  advanceLearnerTrainingHintTimer,
  createLearnerTrainingHintPresentationState,
  dismissLearnerTrainingHint,
  keepLearnerTrainingHintOpen,
  presentLearnerTrainingHint,
  reopenLearnerTrainingHint,
  toggleLearnerTrainingHintTimer
} from "./learnerTrainingHintPresentation.ts";

test("new Training hints open with a 30-second timer", () => {
  const state = presentLearnerTrainingHint(createLearnerTrainingHintPresentationState(), "hint-1");

  assert.equal(state.isOpen, true);
  assert.equal(state.remainingMs, LEARNER_TRAINING_HINT_AUTO_DISMISS_MS);
  assert.equal(advanceLearnerTrainingHintTimer(state, 29_000).remainingMs, 1_000);
  assert.equal(advanceLearnerTrainingHintTimer(state, 30_000).isOpen, false);
});

test("pause and Keep open prevent automatic dismissal", () => {
  const open = presentLearnerTrainingHint(createLearnerTrainingHintPresentationState(), "hint-1");
  const paused = toggleLearnerTrainingHintTimer(open);

  assert.equal(paused.pausedByUser, true);
  assert.deepEqual(advanceLearnerTrainingHintTimer(paused, 30_000), paused);

  const keptOpen = keepLearnerTrainingHintOpen(open);
  assert.equal(keptOpen.keptOpen, true);
  assert.deepEqual(advanceLearnerTrainingHintTimer(keptOpen, 30_000), keptOpen);
});

test("closed hints reopen without generating a new hint or restarting an expired timer", () => {
  const open = presentLearnerTrainingHint(createLearnerTrainingHintPresentationState(), "hint-1");
  const manuallyClosed = dismissLearnerTrainingHint(open);
  const reopened = reopenLearnerTrainingHint(manuallyClosed);

  assert.equal(reopened.hintKey, "hint-1");
  assert.equal(reopened.isOpen, true);
  assert.equal(reopened.remainingMs, LEARNER_TRAINING_HINT_AUTO_DISMISS_MS);

  const expired = advanceLearnerTrainingHintTimer(open, LEARNER_TRAINING_HINT_AUTO_DISMISS_MS);
  const reopenedExpired = reopenLearnerTrainingHint(expired);

  assert.equal(reopenedExpired.isOpen, true);
  assert.equal(reopenedExpired.keptOpen, true);
});

test("a different hint gets a fresh timer while reopening the same hint preserves it", () => {
  const first = advanceLearnerTrainingHintTimer(
    presentLearnerTrainingHint(createLearnerTrainingHintPresentationState(), "hint-1"),
    5_000
  );

  assert.equal(presentLearnerTrainingHint(first, "hint-1").remainingMs, 25_000);
  assert.equal(presentLearnerTrainingHint(first, "hint-2").remainingMs, LEARNER_TRAINING_HINT_AUTO_DISMISS_MS);
});
