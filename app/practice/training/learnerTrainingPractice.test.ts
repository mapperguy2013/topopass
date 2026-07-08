import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildRealLondonBetaPracticeScreenModel } from "../real-london/realLondonBetaPracticeScreen.ts";
import {
  LEARNER_TRAINING_PRACTICE_CARD_CTA,
  LEARNER_TRAINING_PRACTICE_CARD_TITLE,
  LEARNER_TRAINING_PRACTICE_PATH,
  buildLearnerTrainingPracticeEntryModel,
  buildLearnerTrainingPracticePageModel
} from "./learnerTrainingPractice.ts";

test("Stage 15 practice page exposes a learner-facing Training Mode entry point", () => {
  const model = buildLearnerTrainingPracticeEntryModel({ betaEnabled: true });

  assert.equal(model.visible, true);
  assert.equal(model.title, LEARNER_TRAINING_PRACTICE_CARD_TITLE);
  assert.equal(model.label, "Training Mode");
  assert.equal(model.ctaLabel, LEARNER_TRAINING_PRACTICE_CARD_CTA);
  assert.equal(model.href, LEARNER_TRAINING_PRACTICE_PATH);
  assert.equal(model.betaStatus, "enabled");
  assert.equal(model.realLondonBetaHref, "/practice/real-london");
  assert.match(model.betaMessage, /Real London practice catalogue/);
});

test("Stage 15 Training Mode entry remains safe when Real London beta is disabled", () => {
  const model = buildLearnerTrainingPracticeEntryModel({ betaEnabled: false });

  assert.equal(model.visible, true);
  assert.equal(model.href, LEARNER_TRAINING_PRACTICE_PATH);
  assert.equal(model.betaStatus, "disabled");
  assert.equal(model.realLondonBetaHref, null);
  assert.match(model.betaMessage, /standard Marlowe practice map/i);
  assert.match(model.betaMessage, /beta flag is enabled/i);
});

test("Stage 15 learner training route reuses RouteRunnerClient with standard map access by default", () => {
  const model = buildLearnerTrainingPracticePageModel({ betaEnabled: false });

  assert.equal(model.path, LEARNER_TRAINING_PRACTICE_PATH);
  assert.equal(model.routeRunnerMode, "student-beta");
  assert.equal(model.usesExistingRouteRunnerClient, true);
  assert.equal(model.keepsDevRouteAvailable, true);
  assert.equal(model.dedicatedTrainingPage, true);
  assert.equal(model.routeRunnerTrainingModeOnly, true);
  assert.equal(model.trainingModeDefaultOpen, true);
  assert.equal(model.betaStatus, "disabled");
  assert.equal(model.mapOptions.length, 1);
  assert.equal(model.mapOptions[0].map.id, model.initialMapOptionId);
  assert.equal(model.trainingSurface.difficultySelectorLabel, "Difficulty");
  assert.equal(model.trainingSurface.exerciseTypeSelectorLabel, "Exercise type");
  assert.equal(model.trainingSurface.generateActionLabel, "Generate exercise");
  assert.equal(model.trainingSurface.hintActionLabel, "Get hint");
  assert.equal(model.trainingSurface.reviewActionLabel, "Complete and review");
  assert.equal(model.trainingSurface.mapPanDefault, true);
});

test("Stage 15 learner training route includes beta map choices when enabled", () => {
  const model = buildLearnerTrainingPracticePageModel({ betaEnabled: true });
  const mapIds = model.mapOptions.map((option) => option.map.id);

  assert.equal(model.betaStatus, "enabled");
  assert.ok(mapIds.includes(model.initialMapOptionId));
  assert.ok(mapIds.includes("osm-real-london-pilot"));
  assert.ok(mapIds.includes("osm-curated-kings-cross-euston"));
  assert.equal(mapIds.includes("osm-curated-centralLondon"), false);
});

test("Stage 15 Practice page links to the Training Mode surface", () => {
  const source = readFileSync("app/practice/page.tsx", "utf8");

  assert.ok(source.includes("buildLearnerTrainingPracticeEntryModel"));
  assert.ok(source.includes("trainingEntry.href"));
  assert.ok(source.includes("trainingEntry.ctaLabel"));
  assert.ok(source.includes('practice: "training-mode"'));
  assert.ok(source.includes("Learner-driver route training"));
});

test("Stage 15 Training Mode page does not duplicate Phase 7 engines", () => {
  const source = readFileSync("app/practice/training/page.tsx", "utf8");

  assert.ok(source.includes("RouteRunnerClient"));
  assert.ok(source.includes("allowDevQaToggle={false}"));
  assert.ok(source.includes("mode={model.routeRunnerMode}"));
  assert.ok(source.includes("trainingModeOnly"));
  assert.equal(source.includes("generateLearnerExercise"), false);
  assert.equal(source.includes("validateLearnerRoute"), false);
  assert.equal(source.includes("scoreLearnerAttempt"), false);
  assert.equal(source.includes("generateLearnerHint"), false);
  assert.equal(source.includes("generateLearnerAttemptFeedback"), false);
});

test("Stage 18 dedicated Training Mode page focuses the existing RouteRunnerClient surface", () => {
  const routeRunnerSource = readFileSync("app/dev/route-runner/RouteRunnerClient.tsx", "utf8");
  const pageSource = readFileSync("app/practice/training/page.tsx", "utf8");

  assert.ok(pageSource.includes("trainingModeOnly"));
  assert.ok(routeRunnerSource.includes("isTrainingModeOnly"));
  assert.ok(routeRunnerSource.includes("openLearnerTrainingMode(createLearnerTrainingModeState())"));
  assert.ok(routeRunnerSource.includes("showTrainingModePanel || isTrainingModeOnly"));
  assert.ok(routeRunnerSource.includes("Learner training setup"));
  assert.ok(routeRunnerSource.includes("Pan map"));
  assert.ok(routeRunnerSource.includes("selectedExercise && !isTrainingModeOnly"));
});

test("Stage 18 Real London Practice links to dedicated Training Mode instead of embedding the full panel", () => {
  const source = readFileSync("app/practice/real-london/page.tsx", "utf8");

  assert.ok(source.includes("LEARNER_TRAINING_PRACTICE_PATH"));
  assert.ok(source.includes("Generate routes, get hints, complete exercises"));
  assert.ok(source.includes("showTrainingModePanel={false}"));
});

test("Stage 18 Practice sidebar includes Training Mode in the Practice section", () => {
  const source = readFileSync("components/layout/Sidebar.tsx", "utf8");

  assert.ok(source.includes('href: "/practice/training"'));
  assert.ok(source.includes('label: "Training Mode"'));
});

test("Stage 15 existing dev route runner remains available", () => {
  const source = readFileSync("app/dev/route-runner/page.tsx", "utf8");

  assert.ok(source.includes("RouteRunnerClient"));
  assert.ok(source.includes("ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON"));
  assert.equal(source.includes("redirect("), false);
});

test("Stage 15 Real London practice route still works when beta is enabled", () => {
  const model = buildRealLondonBetaPracticeScreenModel({ betaEnabled: true });

  assert.equal(model.state, "available");

  if (model.state !== "available") {
    throw new Error("Expected Real London beta practice screen to be available.");
  }

  assert.equal(model.pagePath, "/practice/real-london");
  assert.equal(model.routeRunnerMode, "student-beta");
  assert.equal(model.mapInteraction.usesExistingRouteRunnerLogic, true);
  assert.equal(buildLearnerTrainingPracticePageModel({ betaEnabled: true }).realLondonPracticeKeepsTrainingLinkOnly, true);
});

test("Stage 15 learner-facing Training Mode entry carries mobile usability metadata", () => {
  const model = buildLearnerTrainingPracticePageModel({ betaEnabled: false });

  assert.equal(model.mobile.entryPointMinTouchTargetPx, 44);
  assert.equal(model.mobile.routeRunnerMode, "student-beta");
  assert.equal(model.mobile.keepsSiteHeaderNonStickyOnPhone, true);
  assert.equal(model.mobile.avoidsMapStretching, true);
});
