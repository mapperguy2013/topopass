import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  LEARNER_TRAINING_HINT_AUTO_DISMISS_MS,
  LEARNER_TRAINING_HINT_FADE_MS,
  LEARNER_TRAINING_HINT_VISIBLE_MS,
  advanceLearnerTrainingHintTimer,
  createLearnerTrainingHintPresentationState,
  dismissLearnerTrainingHint,
  isLearnerTrainingHintFading,
  keepLearnerTrainingHintOpen,
  presentLearnerTrainingHint,
  reopenLearnerTrainingHint,
  toggleLearnerTrainingHintTimer
} from "./learnerTrainingHintPresentation.ts";

test("new Training hints remain fully visible for 30 seconds and then fade for 2 seconds", () => {
  const state = presentLearnerTrainingHint(createLearnerTrainingHintPresentationState(), "hint-1");

  assert.equal(state.isOpen, true);
  assert.equal(LEARNER_TRAINING_HINT_VISIBLE_MS, 30_000);
  assert.equal(LEARNER_TRAINING_HINT_FADE_MS, 2_000);
  assert.equal(state.remainingMs, 32_000);

  const beforeFade = advanceLearnerTrainingHintTimer(state, LEARNER_TRAINING_HINT_VISIBLE_MS - 1);
  const fadeStart = advanceLearnerTrainingHintTimer(state, LEARNER_TRAINING_HINT_VISIBLE_MS);

  assert.equal(isLearnerTrainingHintFading(beforeFade), false);
  assert.equal(isLearnerTrainingHintFading(fadeStart), true);
  assert.equal(fadeStart.remainingMs, LEARNER_TRAINING_HINT_FADE_MS);
  assert.equal(advanceLearnerTrainingHintTimer(state, LEARNER_TRAINING_HINT_AUTO_DISMISS_MS).isOpen, false);
});

test("pause, interaction pause and Keep open prevent automatic dismissal", () => {
  const open = presentLearnerTrainingHint(createLearnerTrainingHintPresentationState(), "hint-1");
  const paused = toggleLearnerTrainingHintTimer(open);
  const interactionPaused = { ...open, pausedByUser: true };

  assert.equal(paused.pausedByUser, true);
  assert.deepEqual(advanceLearnerTrainingHintTimer(paused, LEARNER_TRAINING_HINT_AUTO_DISMISS_MS), paused);
  assert.deepEqual(
    advanceLearnerTrainingHintTimer(interactionPaused, LEARNER_TRAINING_HINT_AUTO_DISMISS_MS),
    interactionPaused
  );

  const keptOpen = keepLearnerTrainingHintOpen(open);
  assert.equal(keptOpen.keptOpen, true);
  assert.deepEqual(advanceLearnerTrainingHintTimer(keptOpen, LEARNER_TRAINING_HINT_AUTO_DISMISS_MS), keptOpen);
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

  assert.equal(
    presentLearnerTrainingHint(first, "hint-1").remainingMs,
    LEARNER_TRAINING_HINT_AUTO_DISMISS_MS - 5_000
  );
  assert.equal(
    presentLearnerTrainingHint(first, "hint-2").remainingMs,
    LEARNER_TRAINING_HINT_AUTO_DISMISS_MS
  );
});

test("stale or invalid timer ticks do not advance the hint timer", () => {
  const open = presentLearnerTrainingHint(createLearnerTrainingHintPresentationState(), "hint-1");

  assert.deepEqual(advanceLearnerTrainingHintTimer(open, 0), open);
  assert.deepEqual(advanceLearnerTrainingHintTimer(open, -250), open);
  assert.deepEqual(advanceLearnerTrainingHintTimer(dismissLearnerTrainingHint(open), 1_000), dismissLearnerTrainingHint(open));
});

test("RouteRunner renders compact desktop and responsive mobile hint presentations", () => {
  const client = readFileSync(new URL("./RouteRunnerClient.tsx", import.meta.url), "utf8");

  assert.match(client, /fixed right-4 top-4 z-50 aspect-square/);
  assert.match(client, /w-\[min\(21rem,calc\(100vw-2rem\),calc\(100dvh-2rem\)\)\]/);
  assert.match(client, /fixed inset-x-2 bottom-2 z-50 max-h-\[58dvh\]/);
  assert.doesNotMatch(client, /fixed bottom-4 right-4 top-4/);
  assert.match(client, /transition-opacity duration-\[2000ms\] ease-linear/);
  assert.match(client, /onPointerEnter=\{\(\) => setLearnerHintInteractionPaused\(true\)\}/);
  assert.match(client, /onFocusCapture=\{\(\) => setLearnerHintInteractionPaused\(true\)\}/);
  assert.match(client, /submitRouteButtonRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
});

test("Training hint panel avoids diagnostic identifiers and turn-by-turn instructions", () => {
  const client = readFileSync(new URL("./RouteRunnerClient.tsx", import.meta.url), "utf8");
  const panelStart = client.indexOf("{showLearnerTrainingHintPanel");
  const panelEnd = client.indexOf("{showMobileRouteFeedbackBanner", panelStart);
  const hintPanel = client.slice(panelStart, panelEnd);

  assert.match(hintPanel, /learnerTrainingModePanel\.hint\.title/);
  assert.match(hintPanel, /learnerTrainingModePanel\.hint\.text/);
  assert.doesNotMatch(hintPanel, /osmWay|osm-way|nodeId|roadId|segmentId|selectedRoadNames/);
  assert.doesNotMatch(hintPanel, /routeInstructions|currentInstruction|turn-by-turn|turn by turn/i);
});
