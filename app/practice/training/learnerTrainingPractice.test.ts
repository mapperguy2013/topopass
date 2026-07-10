import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildRealLondonBetaPracticeScreenModel } from "../real-london/realLondonBetaPracticeScreen.ts";
import {
  CURATED_LEARNER_ROUTE_PACK,
  createEmptyLearnerTrainingProgress,
  recordLearnerTrainingAttempt
} from "../../../lib/training/index.ts";
import {
  buildLearnerTrainingModePanelModel,
  createLearnerTrainingModeState,
  openLearnerTrainingMode,
  requestLearnerTrainingHint,
  reviewLearnerTrainingAttempt,
  selectLearnerTrainingDifficulty,
  selectLearnerTrainingExerciseType,
  startLearnerTrainingExercise
} from "../../dev/route-runner/learnerTrainingModeUi.ts";
import { buildRouteRunnerOverlayOwnership } from "../../dev/route-runner/routeRunnerOverlayOwnership.ts";
import { realLondonOsmPilotRouteMap } from "../../dev/route-runner/routeRunnerMaps.ts";
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

test("Stage 20 Training Mode uses curated learner routes before experimental generation", () => {
  const routeRunnerSource = readFileSync("app/dev/route-runner/RouteRunnerClient.tsx", "utf8");
  const trainingModeSource = readFileSync("app/dev/route-runner/learnerTrainingModeUi.ts", "utf8");

  assert.ok(routeRunnerSource.includes("CURATED_LEARNER_ROUTE_PACK"));
  assert.ok(routeRunnerSource.includes("curatedRoutes: CURATED_LEARNER_ROUTE_PACK"));
  assert.ok(routeRunnerSource.includes("handleGenerateExperimentalLearnerTrainingExercise"));
  assert.ok(routeRunnerSource.includes("curatedRouteCards"));
  assert.ok(routeRunnerSource.includes("LEARNER_TRAINING_DIFFICULTY_LABELS[routeCard.difficulty]"));
  assert.ok(routeRunnerSource.includes("LEARNER_TRAINING_EXERCISE_TYPE_LABELS[routeCard.exerciseType]"));
  assert.ok(trainingModeSource.includes("selectCuratedTrainingRoute"));
  assert.ok(trainingModeSource.includes("NO_CURATED_ROUTE_AVAILABLE_MESSAGE"));
  assert.ok(trainingModeSource.includes("EXPERIMENTAL_GENERATED_ROUTE_LABEL"));
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

test("Stage 19.6 /practice/training displays a complete curated route with learner details", () => {
  const pageModel = buildLearnerTrainingPracticePageModel({ betaEnabled: true });
  const state = selectLearnerTrainingExerciseType(
    openLearnerTrainingMode(createLearnerTrainingModeState()),
    "identify-next-safe-turn"
  );
  const panel = buildLearnerTrainingModePanelModel({
    state,
    map: realLondonOsmPilotRouteMap,
    viewport: "desktop",
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK
  });
  const card = panel.curatedRouteCards.find(
    (routeCard) => routeCard.routeId === "real-london-beginner-identify-next-safe-turn-store-street"
  );

  assert.equal(pageModel.path, "/practice/training");
  assert.ok(pageModel.mapOptions.some((option) => option.map.id === realLondonOsmPilotRouteMap.id));
  assert.equal(panel.curatedRouteAvailability.status, "available");
  assert.ok(card);
  assert.equal(card.title, "store-street");
  assert.equal(card.difficulty, "beginner");
  assert.equal(card.exerciseType, "identify-next-safe-turn");
  assert.equal(card.area, "Real London");
  assert.match(card.approximateLengthLabel, /m|km/);
  assert.equal(card.segmentCount > 0, true);
  assert.equal(card.checkpointCount, 0);
  assert.ok(card.skillsPractised.includes("route planning"));
  assert.equal(card.statusLabel, "Approved");
  assert.equal(panel.difficultyOptions.find((option) => option.value === "beginner")?.selected, true);
  assert.equal(
    panel.exerciseTypeOptions.find((option) => option.value === "identify-next-safe-turn")?.selected,
    true
  );
});

test("Stage 19.6 curated route filters expose matching routes and explain hidden selections", () => {
  const beginnerFollowPanel = buildLearnerTrainingModePanelModel({
    state: openLearnerTrainingMode(createLearnerTrainingModeState()),
    map: realLondonOsmPilotRouteMap,
    viewport: "desktop",
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK
  });
  const intermediateFollowPanel = buildLearnerTrainingModePanelModel({
    state: selectLearnerTrainingDifficulty(
      openLearnerTrainingMode(createLearnerTrainingModeState()),
      "intermediate"
    ),
    map: realLondonOsmPilotRouteMap,
    viewport: "desktop",
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK
  });
  const missingPanel = buildLearnerTrainingModePanelModel({
    state: selectLearnerTrainingExerciseType(
      selectLearnerTrainingDifficulty(openLearnerTrainingMode(createLearnerTrainingModeState()), "advanced"),
      "practise-roundabouts"
    ),
    map: realLondonOsmPilotRouteMap,
    viewport: "desktop",
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK
  });
  const mapMismatchPanel = buildLearnerTrainingModePanelModel({
    state: selectLearnerTrainingExerciseType(
      openLearnerTrainingMode(createLearnerTrainingModeState()),
      "identify-next-safe-turn"
    ),
    map: buildLearnerTrainingPracticePageModel({ betaEnabled: false }).mapOptions[0].map,
    viewport: "desktop",
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK
  });

  assert.equal(beginnerFollowPanel.curatedRouteCards.length, 3);
  assert.ok(intermediateFollowPanel.curatedRouteCards.some((routeCard) => routeCard.checkpointCount > 0));
  assert.equal(missingPanel.curatedRouteAvailability.status, "unavailable");
  assert.match(missingPanel.curatedRouteAvailability.message ?? "", /No approved curated route is available/);
  assert.match(missingPanel.curatedRouteAvailability.message ?? "", /hidden by the selected map, difficulty, or exercise type/);
  assert.equal(missingPanel.experimentalFallbackAction?.label, "Try experimental generated route");
  assert.equal(mapMismatchPanel.curatedRouteAvailability.status, "unavailable");
  assert.match(mapMismatchPanel.curatedRouteAvailability.message ?? "", /hidden by the selected map, difficulty, or exercise type/);
});

test("Stage 19.6 selecting a curated route starts the learner flow and owns map markers", () => {
  const state = selectLearnerTrainingExerciseType(
    openLearnerTrainingMode(createLearnerTrainingModeState()),
    "identify-next-safe-turn"
  );
  const started = startLearnerTrainingExercise({
    state,
    map: realLondonOsmPilotRouteMap,
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK,
    seed: "stage-19-6-start-saved-route"
  });
  const panel = buildLearnerTrainingModePanelModel({
    state: started,
    map: realLondonOsmPilotRouteMap,
    viewport: "desktop",
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK
  });
  const ownership = buildRouteRunnerOverlayOwnership({
    trainingOverlay: panel.overlay
  });
  const checkpointRoles = panel.overlay.checkpoints.map((checkpoint) => checkpoint.role);

  assert.equal(started.generation.routeSource, "curated-route-pack");
  assert.equal(started.generation.curatedRouteId, "real-london-beginner-identify-next-safe-turn-store-street");
  assert.equal(panel.routeSummary?.title, "store-street");
  assert.equal(panel.routeSummary?.difficulty, "beginner");
  assert.equal(panel.overlay.visible, true);
  assert.ok(panel.overlay.route.points.length >= 2);
  assert.ok(checkpointRoles.includes("start"));
  assert.ok(checkpointRoles.includes("finish"));
  assert.equal(ownership.activeOverlayMode, "training");
  assert.equal(ownership.renderNormalRouteEndpoints, false);
  assert.equal(ownership.renderNormalRouteEndpointLabels, false);
  assert.equal(ownership.renderTrainingRouteEndpoints, true);
});

test("Stage 19.6 curated checkpoints are preserved when a checkpoint route starts", () => {
  const checkpointRoute = CURATED_LEARNER_ROUTE_PACK.find(
    (route) => route.routeId === "real-london-intermediate-checkpoint-goodge-chenies"
  );

  assert.ok(checkpointRoute);

  const state = selectLearnerTrainingExerciseType(
    selectLearnerTrainingDifficulty(openLearnerTrainingMode(createLearnerTrainingModeState()), checkpointRoute.difficulty),
    checkpointRoute.exerciseType
  );
  const started = startLearnerTrainingExercise({
    state,
    map: realLondonOsmPilotRouteMap,
    curatedRoutes: [checkpointRoute],
    seed: "stage-19-6-checkpoint-route"
  });
  const panel = buildLearnerTrainingModePanelModel({
    state: started,
    map: realLondonOsmPilotRouteMap,
    viewport: "desktop",
    curatedRoutes: [checkpointRoute]
  });

  assert.equal(started.activeExercise?.id, checkpointRoute.routeId);
  assert.equal(checkpointRoute.checkpoints.length > 0, true);
  assert.equal(panel.overlay.checkpoints.filter((checkpoint) => checkpoint.role === "checkpoint").length, checkpointRoute.checkpoints.length);
  assert.equal(panel.routeSummary?.checkpointCount, checkpointRoute.checkpoints.length + 2);
});

test("Stage 19.6 curated route hints scoring review feedback and progress work end to end", () => {
  const state = selectLearnerTrainingExerciseType(
    openLearnerTrainingMode(createLearnerTrainingModeState()),
    "identify-next-safe-turn"
  );
  const started = startLearnerTrainingExercise({
    state,
    map: realLondonOsmPilotRouteMap,
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK,
    seed: "stage-19-6-flow"
  });
  const hinted = requestLearnerTrainingHint({
    state: started,
    attemptId: "stage-19-6-hint"
  });
  const reviewed = reviewLearnerTrainingAttempt({
    state: hinted,
    map: realLondonOsmPilotRouteMap,
    attemptedRouteSegments: hinted.activeExercise?.expectedRouteSegments ?? [],
    attemptId: "stage-19-6-reviewed"
  });
  const hintsUsed = hinted.hints.flatMap((hintResult) => (hintResult.status === "generated" ? [hintResult.hint] : []));

  assert.ok(reviewed.activeExercise);
  assert.ok(reviewed.review);

  const progress = recordLearnerTrainingAttempt({
    progress: createEmptyLearnerTrainingProgress({
      learnerId: "stage-19-6-pipeline",
      updatedAt: "2026-07-10T10:00:00.000Z"
    }),
    exercise: reviewed.activeExercise,
    scoring: reviewed.review.scoring,
    feedback: reviewed.review.feedback,
    hintsUsed,
    completedAt: "2026-07-10T10:05:00.000Z"
  });
  const panel = buildLearnerTrainingModePanelModel({
    state: reviewed,
    map: realLondonOsmPilotRouteMap,
    viewport: "desktop",
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK,
    progress
  });

  assert.equal(hinted.hints.at(-1)?.status, "generated");
  assert.equal(reviewed.review.scoring.passed, true);
  assert.equal(panel.review?.passed, true);
  assert.ok(panel.review?.summary);
  assert.ok(panel.review?.messages.length);
  assert.equal(panel.overlay.visible, true);
  assert.equal(panel.progress?.summary.attemptCount, 1);
  assert.equal(progress.attempts[0]?.exerciseId, "real-london-beginner-identify-next-safe-turn-store-street");
  assert.equal(progress.attempts[0]?.hintCount, 1);
});

test("Stage 19.6 dev training surfaces still render and stay out of learner navigation", () => {
  const devHomeSource = readFileSync("app/dev/page.tsx", "utf8");
  const devRouteRunnerSource = readFileSync("app/dev/route-runner/page.tsx", "utf8");
  const devTrainingRouteSource = readFileSync("app/dev/training-route/page.tsx", "utf8");
  const sidebarSource = readFileSync("components/layout/Sidebar.tsx", "utf8");
  const practiceSource = readFileSync("app/practice/page.tsx", "utf8");

  assert.ok(devHomeSource.includes("buildDevToolsHomeModel"));
  assert.ok(devRouteRunnerSource.includes("RouteRunnerClient"));
  assert.ok(devTrainingRouteSource.includes("TrainingRouteAuthorClient"));
  assert.ok(sidebarSource.includes('href: "/practice/training"'));
  assert.doesNotMatch(sidebarSource, /\/dev\/training-route|\/dev\/route-runner/);
  assert.doesNotMatch(practiceSource, /\/dev\/training-route|\/dev\/route-runner/);
});
