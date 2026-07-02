import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBlockedDirectedEdgeKeys,
  buildMapGraph,
  directedEdgeKey,
  getTurnRestrictionVisuals,
  mapToScreenPoint,
  snapDrawnRouteToRoads,
  validateDirectedEdgePath,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import { buildFastestRouteOverlay, createHiddenFastestRouteRevealState, toggleFastestRouteReveal } from "./fastestRouteOverlay.ts";
import { validateExerciseReachability, validateExerciseReachabilityList } from "./exerciseValidation.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRouteRunnerMapBounds,
  getRouteRunnerMapFitBounds,
  getRouteRunnerMapFitPadding,
  getRouteRunnerMapViewportBounds,
  getRouteRunnerMapOption,
  isConvertedOsmRouteRunnerMap,
  isDevOnlyRouteRunnerMapOption,
  largeLondonOsmRouteExercises,
  largeLondonOsmRouteMap,
  mediumLondonOsmRouteExercises,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  realLondonOsmPilotTwoRouteExercises,
  realLondonOsmPilotTwoRouteMap,
  routeRunnerMapCenter,
  tinyLondonOsmRouteExercises,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import { auditRealLondonContextCoverage } from "./realLondonContextData.ts";
import {
  buildPhase6VisualQaScenarioSummary,
  phase6RealLondonVisualQaRouteExercises,
  phase6RealLondonVisualQaRouteMap
} from "./realLondonVisualQaScenario.ts";
import {
  FINAL_PHASE_6_REAL_LONDON_LAYER_STACK,
  REAL_LONDON_RESPONSIVE_VISUAL_SCENARIOS,
  REAL_LONDON_RESPONSIVE_VISUAL_VIEWPORTS,
  REAL_LONDON_VISUAL_COMPARISON_MODES,
  REAL_LONDON_VISUAL_READABILITY_SCENARIOS,
  buildRealLondonVisualComparisonScenarioSummary,
  getRealLondonResponsiveVisualScenario,
  getRealLondonVisualReadabilityScenario
} from "./realLondonVisualComparisonScenarios.ts";
import {
  buildSyntheticBackgroundFeatures,
  buildSyntheticLinearFeatures,
  buildSyntheticMapLabels,
  buildSyntheticRouteOverlayVisuals,
  buildSyntheticRoadVisuals,
  deriveSyntheticRoadClass
} from "./syntheticStreetMapRenderer.ts";
import { TOPOPASS_STREET_ATLAS_STYLE } from "./topopassCartographyStyle.ts";
import { buildRoadRestrictionOverlays } from "./routeRunnerDisplay.ts";
import { buildRestrictionMapVisualItems } from "./restrictionMapVisuals.ts";

const TEST_CANVAS_WIDTH = 1120;
const TEST_CANVAS_HEIGHT = 760;

function boundsWidth(bounds: { minX: number; maxX: number }): number {
  return bounds.maxX - bounds.minX;
}

function boundsHeight(bounds: { minY: number; maxY: number }): number {
  return bounds.maxY - bounds.minY;
}

function assertClose(actual: number, expected: number, epsilon = 0.000001): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be within ${epsilon} of ${expected}`);
}

function assertScreenPointInsideViewport(point: { x: number; y: number }, message: string): void {
  assert.ok(point.x >= -0.000001 && point.x <= TEST_CANVAS_WIDTH + 0.000001, `${message} x=${point.x}`);
  assert.ok(point.y >= -0.000001 && point.y <= TEST_CANVAS_HEIGHT + 0.000001, `${message} y=${point.y}`);
}

function phase6VisualQaExerciseStopPoints(): { x: number; y: number }[] {
  const exercise = phase6RealLondonVisualQaRouteExercises[0];

  if (!exercise) {
    throw new Error("Phase 6 visual QA exercise is missing");
  }

  return exercise.stops.flatMap((stop) => {
    if (!("nodeId" in stop)) {
      return [];
    }

    const node = phase6RealLondonVisualQaRouteMap.nodes.find((candidate) => candidate.id === stop.nodeId);

    return node ? [{ x: node.x, y: node.y }] : [];
  });
}

test("route runner map catalogue keeps the synthetic map as the default", () => {
  const defaultOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.ok(defaultOption);
  assert.equal(defaultOption.source, "synthetic-dev");
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.ok(defaultOption.exercises.length > 0);
});

test("converted OSM fixture loads as a selectable route-runner MapDefinition", () => {
  const osmOption = ROUTE_RUNNER_MAP_OPTIONS.find((option) => option.source === "converted-osm");

  assert.ok(osmOption);
  assert.equal(osmOption.map.id, tinyLondonOsmRouteMap.id);
  assert.equal(osmOption.defaultExerciseId, tinyLondonOsmRouteExercises[0].id);
  assert.ok(isConvertedOsmRouteRunnerMap(osmOption));
  assert.ok(osmOption.map.nodes.length > 0);
  assert.ok(osmOption.map.roads.length > 0);
  assert.ok(osmOption.exercises.every((exercise) => exercise.mapId === osmOption.map.id));
  assert.deepEqual(
    osmOption.exercises.map((exercise) => exercise.id),
    [
      "osm-tiny-kings-cross-to-argyle",
      "osm-tiny-kings-cross-via-junction",
      "osm-tiny-roundabout-loop",
      "osm-tiny-roundabout-to-argyle",
      "osm-tiny-stable-yard-lane"
    ]
  );
});

test("converted OSM exercises only appear when the converted OSM map is selected", () => {
  const syntheticOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const convertedOptions = ROUTE_RUNNER_MAP_OPTIONS.filter((option) => option.source === "converted-osm");
  const tinyOption = getRouteRunnerMapOption(tinyLondonOsmRouteMap.id);
  const mediumOption = getRouteRunnerMapOption(mediumLondonOsmRouteMap.id);
  const realPilotOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);
  const largeOption = getRouteRunnerMapOption(largeLondonOsmRouteMap.id);
  const realPilotTwoOption = getRouteRunnerMapOption(realLondonOsmPilotTwoRouteMap.id);
  const phase6QaOption = getRouteRunnerMapOption(phase6RealLondonVisualQaRouteMap.id);

  assert.ok(syntheticOption);
  assert.ok(tinyOption);
  assert.ok(mediumOption);
  assert.ok(realPilotOption);
  assert.ok(largeOption);
  assert.ok(realPilotTwoOption);
  assert.ok(phase6QaOption);
  assert.equal(syntheticOption.source, "synthetic-dev");
  assert.equal(tinyOption.source, "converted-osm");
  assert.equal(mediumOption.source, "converted-osm");
  assert.equal(realPilotOption.source, "converted-osm");
  assert.equal(largeOption.source, "converted-osm");
  assert.equal(realPilotTwoOption.source, "converted-osm");
  assert.equal(phase6QaOption.source, "converted-osm");
  assert.equal(isDevOnlyRouteRunnerMapOption(phase6QaOption), true);
  assert.equal(convertedOptions.length, 6);
  assert.deepEqual(
    [realPilotOption.id, realPilotTwoOption.id, largeOption.id],
    ["osm-real-london-pilot", "osm-real-london-pilot-2", "osm-large-london"]
  );
  assert.equal(new Set([realPilotOption.id, realPilotTwoOption.id, largeOption.id]).size, 3);
  assert.deepEqual(
    [realPilotOption.fixtureName, realPilotTwoOption.fixtureName, largeOption.fixtureName],
    ["realLondonPilotOverpass.json", "realLondonPilotTwoOverpass.json", "largeLondonOverpass.json"]
  );
  assert.deepEqual(
    [realPilotOption.label, realPilotTwoOption.label, largeOption.label],
    ["Real London pilot map", "Real London pilot map 2", "OSM Large London"]
  );
  assert.ok(syntheticOption.exercises.every((exercise) => !exercise.id.startsWith("osm-")));
  assert.deepEqual(
    tinyOption.exercises.map((exercise) => exercise.id),
    tinyLondonOsmRouteExercises.map((exercise) => exercise.id)
  );
  assert.deepEqual(
    mediumOption.exercises.map((exercise) => exercise.id),
    mediumLondonOsmRouteExercises.map((exercise) => exercise.id)
  );
  assert.deepEqual(
    realPilotOption.exercises.map((exercise) => exercise.id),
    realLondonOsmPilotRouteExercises.map((exercise) => exercise.id)
  );
  assert.deepEqual(
    realPilotTwoOption.exercises.map((exercise) => exercise.id),
    realLondonOsmPilotTwoRouteExercises.map((exercise) => exercise.id)
  );
  assert.deepEqual(
    largeOption.exercises.map((exercise) => exercise.id),
    largeLondonOsmRouteExercises.map((exercise) => exercise.id)
  );
  assert.deepEqual(
    phase6QaOption.exercises.map((exercise) => exercise.id),
    phase6RealLondonVisualQaRouteExercises.map((exercise) => exercise.id)
  );
  assert.ok(tinyOption.exercises.every((exercise) => exercise.id.startsWith("osm-tiny-")));
  assert.ok(mediumOption.exercises.every((exercise) => exercise.id.startsWith("osm-medium-")));
  assert.ok(
    realPilotOption.exercises.every((exercise) => exercise.id.startsWith("osm-real-"))
  );
  assert.ok(realPilotTwoOption.exercises.every((exercise) => exercise.id.startsWith("osm-real-pilot-2-")));
  assert.ok(largeOption.exercises.every((exercise) => exercise.id.startsWith("osm-large-")));
  assert.ok(phase6QaOption.exercises.every((exercise) => exercise.id.startsWith("osm-phase-6-")));
});

test("Stage 151 visual QA scenario demonstrates combined Phase 6 map styling deterministically", () => {
  const option = getRouteRunnerMapOption(phase6RealLondonVisualQaRouteMap.id);

  assert.ok(option);
  assert.equal(option.devOnly, true);
  assert.equal(option.fixtureName, "syntheticPhase6VisualQaOverpassFixture");
  assert.match(option.attribution ?? "", /Synthetic TOPOPASS QA fixture/);
  assert.deepEqual(buildPhase6VisualQaScenarioSummary(), {
    mapId: "osm-phase-6-real-london-visual-qa",
    roadCount: 33,
    nodeCount: 24,
    restrictionCount: 1,
    exerciseCount: 1,
    fixtureName: "syntheticPhase6VisualQaOverpassFixture",
    synthetic: true
  });
  assert.deepEqual(
    option.exercises[0]?.stops.map((stop) => ("nodeId" in stop ? stop.nodeId : "")),
    ["osm-node-1011", "osm-node-1023", "osm-node-1034", "osm-node-1045"]
  );
  assert.ok(option.map.restrictions.some((restriction) => restriction.type === "prohibited_turn"));
});

test("Stage 151 visual QA scenario provides context features for visual inspection without live data", () => {
  const option = getRouteRunnerMapOption(phase6RealLondonVisualQaRouteMap.id);

  assert.ok(option);

  const audit = auditRealLondonContextCoverage(option.sourceOverpassFixture);
  const backgrounds = buildSyntheticBackgroundFeatures(option.map, {
    sourceOverpassFixture: option.sourceOverpassFixture
  });
  const linearFeatures = buildSyntheticLinearFeatures(option.map, {
    sourceOverpassFixture: option.sourceOverpassFixture
  });
  const labels = buildSyntheticMapLabels(option.map, option.exercises[0], {
    backgroundFeatures: backgrounds,
    linearFeatures,
    sourceOverpassFixture: option.sourceOverpassFixture
  });

  assert.deepEqual(audit.counts, {
    railFeatures: 1,
    subwayRailFeatures: 0,
    stationFeatures: 1,
    namedStationFeatures: 1,
    bridgeFeatures: 1,
    namedBridgeFeatures: 1,
    crossingFeatures: 0,
    landmarkLikeFeatures: 2,
    parkOpenSpaceFeatures: 1,
    waterFeatures: 2,
    namedWaterFeatures: 2,
    areaContextLabelFeatures: 1
  });
  assert.ok(backgrounds.some((feature) => feature.kind === "park" && feature.label === "QA Garden"));
  assert.ok(backgrounds.some((feature) => feature.kind === "water" && feature.label === "QA Basin"));
  assert.ok(backgrounds.some((feature) => feature.kind === "pedestrian-area" && feature.label === "QA Pedestrian Square"));
  assert.ok(linearFeatures.some((feature) => feature.kind === "rail" && feature.label === "QA North Line"));
  assert.ok(linearFeatures.some((feature) => feature.kind === "bridge" && feature.label === "QA Bridge Street"));
  assert.ok(linearFeatures.some((feature) => feature.kind === "waterway" && feature.label === "QA Cut"));
  assert.ok(labels.some((label) => label.kind === "station" && label.text === "QA Central Station"));
  assert.ok(labels.some((label) => label.kind === "public_building" && label.text === "QA Library"));
  assert.ok(labels.some((label) => label.kind === "landmark" && label.text === "QA Hospital"));
  assert.ok(labels.some((label) => label.kind === "area" && label.text === "QA Fitzrovia"));
  assert.deepEqual(
    option.exercises[0]?.stops.map((stop) => ("label" in stop ? stop.label : "")),
    ["QA start", "QA required via point", "QA checkpoint", "QA destination"]
  );
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.start.text, "START");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.requiredVia.textPrefix, "VIA");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.destination.text, "END");
});

test("Stage 152 visual comparison scenarios register deterministic readability modes and viewports", () => {
  const comparisonSummary = buildRealLondonVisualComparisonScenarioSummary();

  assert.deepEqual(
    REAL_LONDON_VISUAL_COMPARISON_MODES.map((mode) => mode.id),
    ["plain-route-graph", "phase-6-street-atlas", "learner-route-overlay", "route-review-readability"]
  );
  assert.deepEqual(comparisonSummary.scenarioIds, [
    "dense-central-readability",
    "major-road-side-street-hierarchy",
    "park-water-rail-station-context",
    "bridge-crossing-context",
    "landmark-area-orientation",
    "learner-route-overlay-review",
    "one-way-restriction-declutter",
    "complete-phase-6-stack-integration"
  ]);
  assert.deepEqual(comparisonSummary.finalPhase6LayerStack, FINAL_PHASE_6_REAL_LONDON_LAYER_STACK);
  assert.equal(comparisonSummary.mapId, phase6RealLondonVisualQaRouteMap.id);
  assert.equal(comparisonSummary.fixtureName, "syntheticPhase6VisualQaOverpassFixture");
  assert.equal(comparisonSummary.exerciseId, "osm-phase-6-visual-qa-checkpoint-route");
  assert.equal(comparisonSummary.synthetic, true);

  const comparisonModeIds = new Set(REAL_LONDON_VISUAL_COMPARISON_MODES.map((mode) => mode.id));

  for (const scenario of REAL_LONDON_VISUAL_READABILITY_SCENARIOS) {
    assert.equal(scenario.mapId, phase6RealLondonVisualQaRouteMap.id);
    assert.equal(scenario.fixtureName, "syntheticPhase6VisualQaOverpassFixture");
    assert.ok(scenario.label.length > 0);
    assert.ok(scenario.description.length > 0);
    assert.ok(getRealLondonVisualReadabilityScenario(scenario.id));
    assert.ok(scenario.comparisonModeIds.length > 0);
    assert.ok(scenario.comparisonModeIds.every((modeId) => comparisonModeIds.has(modeId)));
    assert.ok(scenario.viewport.zoom > 0);
    assert.ok(scenario.viewport.bounds.minX < scenario.viewport.bounds.maxX);
    assert.ok(scenario.viewport.bounds.minY < scenario.viewport.bounds.maxY);
    assert.ok(scenario.expected.decluttering.includes(scenario.viewport.declutterTier));
    assert.ok(scenario.viewport.bounds.minX >= comparisonSummary.viewportBounds.minX);
    assert.ok(scenario.viewport.bounds.maxX <= comparisonSummary.viewportBounds.maxX);
    assert.ok(scenario.viewport.bounds.minY >= comparisonSummary.viewportBounds.minY);
    assert.ok(scenario.viewport.bounds.maxY <= comparisonSummary.viewportBounds.maxY);
  }
});

test("Stage 156 responsive visual scenarios register deterministic mobile and tablet viewports", () => {
  const comparisonSummary = buildRealLondonVisualComparisonScenarioSummary();

  assert.deepEqual(comparisonSummary.responsiveViewportIds, [
    "small-mobile-portrait",
    "large-mobile-portrait",
    "mobile-landscape",
    "tablet-portrait",
    "tablet-landscape",
    "narrow-embedded-map"
  ]);
  assert.deepEqual(comparisonSummary.responsiveScenarioIds, [
    "mobile-dense-central-readability",
    "mobile-route-drawing",
    "mobile-route-review",
    "mobile-one-way-restriction-declutter",
    "mobile-marker-hint-collision",
    "tablet-portrait-learner-overlays",
    "tablet-landscape-review-panels",
    "tablet-context-orientation"
  ]);

  const viewportIds = new Set(REAL_LONDON_RESPONSIVE_VISUAL_VIEWPORTS.map((viewport) => viewport.id));
  const baseScenarioIds = new Set(REAL_LONDON_VISUAL_READABILITY_SCENARIOS.map((scenario) => scenario.id));
  const comparisonModeIds = new Set(REAL_LONDON_VISUAL_COMPARISON_MODES.map((mode) => mode.id));

  assert.ok(REAL_LONDON_RESPONSIVE_VISUAL_VIEWPORTS.some((viewport) => viewport.deviceClass === "mobile"));
  assert.ok(REAL_LONDON_RESPONSIVE_VISUAL_VIEWPORTS.some((viewport) => viewport.deviceClass === "tablet"));
  assert.ok(REAL_LONDON_RESPONSIVE_VISUAL_VIEWPORTS.some((viewport) => viewport.orientation === "portrait"));
  assert.ok(REAL_LONDON_RESPONSIVE_VISUAL_VIEWPORTS.some((viewport) => viewport.orientation === "landscape"));

  for (const viewport of REAL_LONDON_RESPONSIVE_VISUAL_VIEWPORTS) {
    assert.ok(viewport.width > 0, viewport.id);
    assert.ok(viewport.height > 0, viewport.id);
    assert.ok(viewport.expectedMapMinHeight >= 360, viewport.id);
    assert.ok(viewport.bounds.minX >= comparisonSummary.viewportBounds.minX, viewport.id);
    assert.ok(viewport.bounds.maxX <= comparisonSummary.viewportBounds.maxX, viewport.id);
    assert.ok(viewport.bounds.minY >= comparisonSummary.viewportBounds.minY, viewport.id);
    assert.ok(viewport.bounds.maxY <= comparisonSummary.viewportBounds.maxY, viewport.id);
  }

  for (const scenario of REAL_LONDON_RESPONSIVE_VISUAL_SCENARIOS) {
    assert.ok(getRealLondonResponsiveVisualScenario(scenario.id), scenario.id);
    assert.ok(baseScenarioIds.has(scenario.baseScenarioId), scenario.id);
    assert.ok(viewportIds.has(scenario.viewportId), scenario.id);
    assert.ok(scenario.comparisonModeIds.every((modeId) => comparisonModeIds.has(modeId)), scenario.id);
    assert.equal(scenario.expected.requiresMapFirstLayout, true, scenario.id);
    assert.equal(scenario.expected.requiresTouchDrawing, true, scenario.id);
    assert.ok(scenario.expected.requiresMinTapTargetPx >= 44, scenario.id);
    assert.ok(scenario.expected.categories.includes("decluttering-tier"), scenario.id);
  }
});

test("Stage 156 responsive visual scenarios cover learner mobile readability categories", () => {
  const categories = new Set(REAL_LONDON_RESPONSIVE_VISUAL_SCENARIOS.flatMap((scenario) => scenario.expected.categories));

  for (const category of [
    "roads-by-hierarchy",
    "street-labels",
    "context-labels",
    "route-overlays",
    "start-destination-markers",
    "checkpoints",
    "hints",
    "review-callouts",
    "one-way-symbols",
    "restriction-symbols",
    "decluttering-tier",
    "legend-attribution"
  ]) {
    assert.ok(categories.has(category), category);
  }

  assert.ok(
    REAL_LONDON_RESPONSIVE_VISUAL_SCENARIOS.some(
      (scenario) => scenario.id === "mobile-route-review" && scenario.expected.categories.includes("review-callouts")
    )
  );
  assert.ok(
    REAL_LONDON_RESPONSIVE_VISUAL_SCENARIOS.some(
      (scenario) =>
        scenario.id === "mobile-one-way-restriction-declutter" &&
        scenario.expected.categories.includes("one-way-symbols") &&
        scenario.expected.categories.includes("restriction-symbols")
    )
  );
});

test("Stage 152 visual comparison scenarios cover expected Real London readability categories", () => {
  const option = getRouteRunnerMapOption(phase6RealLondonVisualQaRouteMap.id);

  assert.ok(option);

  const backgrounds = buildSyntheticBackgroundFeatures(option.map, {
    sourceOverpassFixture: option.sourceOverpassFixture
  });
  const linearFeatures = buildSyntheticLinearFeatures(option.map, {
    sourceOverpassFixture: option.sourceOverpassFixture
  });
  const labels = buildSyntheticMapLabels(option.map, option.exercises[0], {
    includeOsmRoadLabels: true,
    backgroundFeatures: backgrounds,
    linearFeatures,
    sourceOverpassFixture: option.sourceOverpassFixture
  });
  const roadVisuals = buildSyntheticRoadVisuals(option.map);
  const stopPoints = phase6VisualQaExerciseStopPoints();
  const routeOverlays = buildSyntheticRouteOverlayVisuals({
    rawRoutePoints: stopPoints,
    snappedRoutePoints: stopPoints,
    matchedRoutePoints: stopPoints,
    shortestLegalRoutePoints: stopPoints.slice().reverse(),
    acceptedAlternativeRoutePoints: stopPoints.slice(0, 1).concat(stopPoints.slice(2, 4)),
    inefficientRoutePoints: stopPoints.slice(0, 3),
    backtrackRoutePoints: stopPoints.slice(0, 2).reverse().concat(stopPoints.slice(1, 2)),
    illegalRoutePoints: stopPoints.slice(1, 3)
  });
  const restrictionItems = buildRestrictionMapVisualItems({
    roadRestrictionOverlays: buildRoadRestrictionOverlays(option.map),
    turnRestrictionVisuals: getTurnRestrictionVisuals(option.map),
    routeIssueOverlays: [
      {
        kind: "prohibited-turn",
        label: "Review warning",
        message: "Synthetic review warning for the Phase 6 comparison fixture.",
        points: stopPoints.slice(1, 3),
        midpoint: stopPoints[1] ?? { x: 0, y: 0 },
        roadIds: ["osm-way-9005-segment-1", "osm-way-9002-segment-2"],
        movementIndex: 1
      }
    ]
  });

  const roadHierarchies = new Set(roadVisuals.map((visual) => visual.osmHierarchy).filter(Boolean));
  const labelKinds = new Set(labels.map((label) => label.kind));
  const backgroundKinds = new Set(backgrounds.map((feature) => feature.kind));
  const linearKinds = new Set(linearFeatures.map((feature) => feature.kind));
  const routeOverlayKinds = new Set(routeOverlays.map((overlay) => overlay.kind));
  const restrictionSymbols = new Set(
    restrictionItems.flatMap((item) => {
      if (item.kind === "one-way") {
        return ["one-way"];
      }

      if (item.kind === "prohibited-turn") {
        return ["restricted-turn"];
      }

      if (item.kind === "illegal-movement" || item.kind === "missed-restriction") {
        return ["review-warning"];
      }

      return [];
    })
  );
  const objectiveMarkers = new Set(["start", "required-via", "checkpoint", "destination"]);
  const finalPhase6Layers = new Set(FINAL_PHASE_6_REAL_LONDON_LAYER_STACK);
  const configuredLearnerOverlayStates = new Set([
    "start-marker",
    "destination-marker",
    "required-checkpoint",
    "upcoming-checkpoint",
    "active-checkpoint",
    "completed-checkpoint",
    "missed-checkpoint",
    "focused-checkpoint",
    "hint-available",
    "hint-revealed",
    "hint-callout",
    "next-road-suggestion",
    "wrong-turn-warning",
    "restricted-manoeuvre-warning",
    "illegal-segment-callout",
    "inefficient-callout",
    "backtrack-callout",
    "accepted-alternative-callout",
    "checkpoint-reached",
    "route-completed",
    "selected-focus"
  ]);

  assert.ok(restrictionItems.some((item) => item.symbol === "one-way-arrow"));
  assert.ok(restrictionItems.some((item) => item.symbol === "turn-ban-sign"));
  assert.ok(restrictionItems.some((item) => item.symbol === "illegal-route-section"));
  assert.deepEqual(
    getRealLondonVisualReadabilityScenario("learner-route-overlay-review")?.expected.learnerOverlayStates,
    [...configuredLearnerOverlayStates]
  );
  assert.deepEqual(
    getRealLondonVisualReadabilityScenario("complete-phase-6-stack-integration")?.expected.phase6Layers,
    FINAL_PHASE_6_REAL_LONDON_LAYER_STACK
  );

  for (const scenario of REAL_LONDON_VISUAL_READABILITY_SCENARIOS) {
    for (const phase6Layer of scenario.expected.phase6Layers) {
      assert.ok(finalPhase6Layers.has(phase6Layer), `${scenario.id} expected Phase 6 layer ${phase6Layer}`);
    }

    for (const hierarchy of scenario.expected.roadHierarchies) {
      assert.ok(roadHierarchies.has(hierarchy), `${scenario.id} expected road hierarchy ${hierarchy}`);
    }

    for (const labelKind of scenario.expected.labelKinds) {
      assert.ok(labelKinds.has(labelKind), `${scenario.id} expected label kind ${labelKind}`);
    }

    for (const backgroundKind of scenario.expected.backgroundKinds) {
      assert.ok(backgroundKinds.has(backgroundKind), `${scenario.id} expected background kind ${backgroundKind}`);
    }

    for (const linearKind of scenario.expected.linearKinds) {
      assert.ok(linearKinds.has(linearKind), `${scenario.id} expected linear context kind ${linearKind}`);
    }

    for (const overlayKind of scenario.expected.routeOverlayKinds) {
      assert.ok(routeOverlayKinds.has(overlayKind), `${scenario.id} expected route overlay ${overlayKind}`);
    }

    for (const marker of scenario.expected.objectiveMarkers) {
      assert.ok(objectiveMarkers.has(marker), `${scenario.id} expected objective marker ${marker}`);
    }

    for (const learnerOverlayState of scenario.expected.learnerOverlayStates) {
      assert.ok(
        configuredLearnerOverlayStates.has(learnerOverlayState),
        `${scenario.id} expected learner overlay state ${learnerOverlayState}`
      );
    }

    for (const restrictionSymbol of scenario.expected.restrictionSymbols) {
      assert.ok(
        restrictionSymbols.has(restrictionSymbol),
        `${scenario.id} expected restriction symbol ${restrictionSymbol}`
      );
    }
  }
});

test("converted OSM map exposes drawable and snappable road geometry", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const firstRoad = tinyLondonOsmRouteMap.roads[0];

  assert.ok(firstRoad);
  assert.ok(graph.roadsById[firstRoad.id]);
  assert.ok(graph.nodesById[firstRoad.fromNodeId]);
  assert.ok(graph.nodesById[firstRoad.toNodeId]);
  assert.ok(graph.edges.some((edge) => edge.roadId === firstRoad.id));
});

test("converted OSM map bounds and centre are deterministic", () => {
  const center = routeRunnerMapCenter(tinyLondonOsmRouteMap);

  assert.deepEqual(getRouteRunnerMapBounds(tinyLondonOsmRouteMap), {
    minX: -406.316141,
    minY: -286.319882,
    maxX: 406.316141,
    maxY: 286.309819
  });
  assert.equal(center.x, 0);
  assertClose(center.y, -0.0050315);
});

test("larger converted OSM maps use a more comfortable first-load fit", () => {
  assert.equal(getRouteRunnerMapFitPadding(tinyLondonOsmRouteMap), 45);
  assert.equal(getRouteRunnerMapFitPadding(mediumLondonOsmRouteMap), 156.73784324000002);
  assert.deepEqual(getRouteRunnerMapFitBounds(mediumLondonOsmRouteMap), {
    minX: -512.96021424,
    minY: -478.84346524,
    maxX: 512.96021424,
    maxY: 478.83072924000004
  });
  assert.equal(getRouteRunnerMapFitPadding(realLondonOsmPilotTwoRouteMap), 156.73784324000002);
  assert.deepEqual(getRouteRunnerMapFitBounds(realLondonOsmPilotTwoRouteMap), {
    minX: -512.96021424,
    minY: -478.84346524,
    maxX: 512.96021424,
    maxY: 478.83072924000004
  });
  assert.equal(getRouteRunnerMapFitPadding(realLondonOsmPilotRouteMap), 192.03839732000003);
  assert.deepEqual(getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap), {
    minX: -605.96322632,
    minY: -628.50099032,
    maxX: 605.96322632,
    maxY: 628.47761032
  });
  assert.equal(getRouteRunnerMapFitPadding(largeLondonOsmRouteMap), 440.82518347999996);
  assert.deepEqual(getRouteRunnerMapFitBounds(largeLondonOsmRouteMap), {
    minX: -1442.70060048,
    minY: -1156.5667154799999,
    maxX: 1442.70060048,
    maxY: 1156.50383848
  });
});

test("converted OSM viewport fit preserves aspect ratio with a uniform scale", () => {
  const viewportBounds = getRouteRunnerMapViewportBounds(
    realLondonOsmPilotRouteMap,
    TEST_CANVAS_WIDTH,
    TEST_CANVAS_HEIGHT
  );
  const viewportAspectRatio = TEST_CANVAS_WIDTH / TEST_CANVAS_HEIGHT;
  const mapAspectRatio = boundsWidth(viewportBounds) / boundsHeight(viewportBounds);
  const scaleX = TEST_CANVAS_WIDTH / boundsWidth(viewportBounds);
  const scaleY = TEST_CANVAS_HEIGHT / boundsHeight(viewportBounds);

  assertClose(mapAspectRatio, viewportAspectRatio);
  assertClose(scaleX, scaleY);
  assert.equal(boundsHeight(viewportBounds), boundsHeight(getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap)));
  assert.ok(boundsWidth(viewportBounds) > boundsWidth(getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap)));
});

test("synthetic default map keeps its existing first-load fit bounds", () => {
  const syntheticOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.ok(syntheticOption);
  assert.deepEqual(
    getRouteRunnerMapViewportBounds(syntheticOption.map, TEST_CANVAS_WIDTH, TEST_CANVAS_HEIGHT),
    getRouteRunnerMapFitBounds(syntheticOption.map)
  );
});

test("all route-runner maps render nodes inside sane first-load viewport bounds", () => {
  const maps = [
    tinyLondonOsmRouteMap,
    mediumLondonOsmRouteMap,
    realLondonOsmPilotRouteMap,
    realLondonOsmPilotTwoRouteMap,
    largeLondonOsmRouteMap
  ];

  for (const map of maps) {
    const viewport = {
      width: TEST_CANVAS_WIDTH,
      height: TEST_CANVAS_HEIGHT,
      mapBounds: getRouteRunnerMapViewportBounds(map, TEST_CANVAS_WIDTH, TEST_CANVAS_HEIGHT)
    };

    for (const node of map.nodes) {
      assertScreenPointInsideViewport(mapToScreenPoint(node, viewport), `${map.id}:${node.id}`);
    }
  }
});

test("converted OSM labels and road classes use preserved OSM metadata", () => {
  const visuals = buildSyntheticRoadVisuals(tinyLondonOsmRouteMap);
  const labels = buildSyntheticMapLabels(tinyLondonOsmRouteMap, tinyLondonOsmRouteExercises[0], {
    includeOsmRoadLabels: true
  });
  const primaryRoad = tinyLondonOsmRouteMap.roads.find((road) => road.name === "King's Cross Road");
  const serviceRoad = tinyLondonOsmRouteMap.roads.find((road) => road.name === "Stable Yard Lane");

  assert.ok(primaryRoad);
  assert.ok(serviceRoad);
  assert.equal(deriveSyntheticRoadClass(tinyLondonOsmRouteMap, primaryRoad), "major");
  assert.equal(deriveSyntheticRoadClass(tinyLondonOsmRouteMap, serviceRoad), "service");
  assert.ok(visuals.some((visual) => visual.name === "King's Cross Road"));
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "King's Cross Road"));
});

test("converted OSM fastest-route reveal uses existing legal shortest-route logic", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const revealState = toggleFastestRouteReveal(createHiddenFastestRouteRevealState());
  const overlay = buildFastestRouteOverlay({
    map: tinyLondonOsmRouteMap,
    exercise: tinyLondonOsmRouteExercises[0],
    revealState,
    graph
  });

  assert.equal(overlay.status, "available");
  assert.deepEqual(overlay.nodeIds, [
    "osm-node-1001",
    "osm-node-1002",
    "osm-node-1003",
    "osm-node-1004",
    "osm-node-1005"
  ]);
  assert.ok(overlay.roadIds.every((roadId) => roadId.startsWith("osm-way-")));
  assert.ok(overlay.points.length >= 2);
});

test("medium converted OSM fixture is selectable without replacing existing maps", () => {
  const mediumOption = getRouteRunnerMapOption(mediumLondonOsmRouteMap.id);
  const tinyOption = getRouteRunnerMapOption(tinyLondonOsmRouteMap.id);
  const realOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);
  const syntheticOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.ok(mediumOption);
  assert.ok(tinyOption);
  assert.ok(realOption);
  assert.ok(syntheticOption);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.equal(mediumOption.source, "converted-osm");
  assert.ok(isConvertedOsmRouteRunnerMap(mediumOption));
  assert.equal(mediumOption.defaultExerciseId, mediumLondonOsmRouteExercises[0].id);
  assert.equal(mediumOption.map.id, mediumLondonOsmRouteMap.id);
  assert.equal(tinyOption.map.id, tinyLondonOsmRouteMap.id);
  assert.equal(realOption.map.id, realLondonOsmPilotRouteMap.id);
  assert.equal(realOption.defaultExerciseId, realLondonOsmPilotRouteExercises[0].id);
  assert.equal(realOption.fixtureName, "realLondonPilotOverpass.json");
});

test("medium converted OSM fixture is larger than tiny but compact for dev tests", () => {
  assert.ok(mediumLondonOsmRouteMap.nodes.length > tinyLondonOsmRouteMap.nodes.length);
  assert.ok(mediumLondonOsmRouteMap.roads.length > tinyLondonOsmRouteMap.roads.length);
  assert.equal(mediumLondonOsmRouteMap.nodes.length, 25);
  assert.equal(mediumLondonOsmRouteMap.roads.length, 48);
  assert.ok(mediumLondonOsmRouteMap.nodes.length <= 60);
  assert.ok(mediumLondonOsmRouteMap.roads.length <= 120);
});

test("large converted OSM fixture is larger than medium while staying test-sized", () => {
  assert.ok(largeLondonOsmRouteMap.nodes.length > mediumLondonOsmRouteMap.nodes.length);
  assert.ok(largeLondonOsmRouteMap.roads.length > mediumLondonOsmRouteMap.roads.length);
  assert.equal(largeLondonOsmRouteMap.nodes.length, 63);
  assert.equal(largeLondonOsmRouteMap.roads.length, 122);
  assert.ok(largeLondonOsmRouteMap.nodes.length <= 150);
  assert.ok(largeLondonOsmRouteMap.roads.length <= 250);
});

test("medium converted OSM map exposes drawable and snappable road geometry", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const eustonRoad = mediumLondonOsmRouteMap.roads.find((road) => road.name === "Euston Road");
  const tavistockRoad = mediumLondonOsmRouteMap.roads.find((road) => road.name === "Tavistock Place");

  assert.ok(eustonRoad);
  assert.ok(tavistockRoad);
  assert.ok(graph.roadsById[eustonRoad.id]);
  assert.ok(graph.nodesById[eustonRoad.fromNodeId]);
  assert.ok(graph.nodesById[eustonRoad.toNodeId]);
  assert.equal(tavistockRoad.isOneWay, true);
  assert.ok(graph.edges.some((edge) => edge.roadId === eustonRoad.id));
});

test("medium converted OSM labels and road classes use preserved OSM metadata", () => {
  const visuals = buildSyntheticRoadVisuals(mediumLondonOsmRouteMap);
  const labels = buildSyntheticMapLabels(mediumLondonOsmRouteMap, mediumLondonOsmRouteExercises[0], {
    includeOsmRoadLabels: true
  });
  const eustonRoad = mediumLondonOsmRouteMap.roads.find((road) => road.name === "Euston Road");
  const storeStreet = mediumLondonOsmRouteMap.roads.find((road) => road.name === "Store Street");

  assert.ok(eustonRoad);
  assert.ok(storeStreet);
  assert.equal(deriveSyntheticRoadClass(mediumLondonOsmRouteMap, eustonRoad), "major");
  assert.equal(deriveSyntheticRoadClass(mediumLondonOsmRouteMap, storeStreet), "service");
  assert.ok(visuals.some((visual) => visual.name === "Euston Road"));
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Euston Road"));
});

test("real London OSM pilot fixture is selectable from the real export", () => {
  const realOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(realOption);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.equal(realOption.source, "converted-osm");
  assert.ok(isConvertedOsmRouteRunnerMap(realOption));
  assert.equal(realOption.id, "osm-real-london-pilot");
  assert.equal(realOption.label, "Real London pilot map");
  assert.equal(realOption.attribution, "OpenStreetMap contributors");
  assert.equal(realOption.map.nodes.length, 390);
  assert.equal(realOption.map.roads.length, 395);
  assert.deepEqual(
    realOption.exercises.map((exercise) => exercise.id),
    [
      "osm-real-pilot-short-crossing",
      "osm-real-pilot-one-way-detour",
      "osm-real-pilot-checkpoint-route",
      "osm-real-pilot-longer-route",
      "osm-real-pilot-turn-choice",
      "osm-real-pilot-store-street-short-hop",
      "osm-real-pilot-gower-to-torrington",
      "osm-real-pilot-goodge-chenies-ridgmount",
      "osm-real-pilot-torrington-byng",
      "osm-real-pilot-south-crescent-ridgmount-multistop",
      "osm-real-pilot-tottenham-to-gower-detour",
      "osm-real-pilot-torrington-reverse-loop",
      "osm-real-pilot-mortimer-goodge-options"
    ]
  );
});

test("real London OSM pilot labels and road classes use preserved OSM metadata", () => {
  const visuals = buildSyntheticRoadVisuals(realLondonOsmPilotRouteMap);
  const defaultLabels = buildSyntheticMapLabels(realLondonOsmPilotRouteMap, realLondonOsmPilotRouteExercises[0]);
  const labels = buildSyntheticMapLabels(realLondonOsmPilotRouteMap, realLondonOsmPilotRouteExercises[0], {
    includeOsmRoadLabels: true
  });
  const cheniesStreet = realLondonOsmPilotRouteMap.roads.find((road) => road.name === "Chenies Street");
  const maletStreet = realLondonOsmPilotRouteMap.roads.find((road) => road.name === "Malet Street");
  const torringtonPlace = realLondonOsmPilotRouteMap.roads.find((road) => road.name === "Torrington Place");

  assert.ok(cheniesStreet);
  assert.ok(maletStreet);
  assert.ok(torringtonPlace);
  assert.equal(deriveSyntheticRoadClass(realLondonOsmPilotRouteMap, cheniesStreet), "major");
  assert.equal(deriveSyntheticRoadClass(realLondonOsmPilotRouteMap, maletStreet), "local");
  assert.equal(torringtonPlace.isOneWay, true);
  assert.ok(visuals.some((visual) => visual.name === "Keppel Street"));
  assert.equal(defaultLabels.some((label) => label.kind === "road" && label.text === "Keppel Street"), false);
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Torrington Place"));
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Keppel Street"));
  assert.deepEqual(buildSyntheticBackgroundFeatures(realLondonOsmPilotRouteMap), []);
  assert.deepEqual(buildSyntheticLinearFeatures(realLondonOsmPilotRouteMap), []);
  assert.equal(defaultLabels.some((label) => label.kind === "area"), false);
  assert.equal(defaultLabels.some((label) => label.text === "Marlowe Canal" || label.text === "Civic Quarter"), false);
});

test("large London OSM fixture is selectable and exposes hierarchy labels", () => {
  const largeOption = getRouteRunnerMapOption(largeLondonOsmRouteMap.id);
  const visuals = buildSyntheticRoadVisuals(largeLondonOsmRouteMap);
  const labels = buildSyntheticMapLabels(largeLondonOsmRouteMap, largeLondonOsmRouteExercises[0], {
    includeOsmRoadLabels: true
  });
  const eustonRoad = largeLondonOsmRouteMap.roads.find((road) => road.name === "Euston Road");
  const storeStreet = largeLondonOsmRouteMap.roads.find((road) => road.name === "Store Street");

  assert.ok(largeOption);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.equal(largeOption.source, "converted-osm");
  assert.equal(largeOption.label, "OSM Large London");
  assert.equal(largeOption.fixtureName, "largeLondonOverpass.json");
  assert.equal(largeOption.defaultExerciseId, largeLondonOsmRouteExercises[0].id);
  assert.ok(eustonRoad);
  assert.ok(storeStreet);
  assert.equal(deriveSyntheticRoadClass(largeLondonOsmRouteMap, eustonRoad), "major");
  assert.equal(deriveSyntheticRoadClass(largeLondonOsmRouteMap, storeStreet), "service");
  assert.ok(visuals.some((visual) => visual.name === "Euston Road"));
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Euston Road"));
  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Gower Street"));
});

test("every converted OSM exercise uses valid converted graph nodes", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);

  for (const exercise of tinyLondonOsmRouteExercises) {
    assert.equal(exercise.mapId, tinyLondonOsmRouteMap.id, exercise.id);
    assert.ok(exercise.stops.length >= 2, exercise.id);

    for (const stop of exercise.stops) {
      assert.equal(stop.type, "node", `${exercise.id} should use stable converted OSM node stops`);
      assert.ok(graph.nodesById[stop.nodeId], `${exercise.id} references missing node ${stop.nodeId}`);
      assert.ok(
        (graph.outgoingEdgesByNodeId[stop.nodeId]?.length ?? 0) > 0 ||
          (graph.incomingEdgesByNodeId[stop.nodeId]?.length ?? 0) > 0,
        `${exercise.id} stop ${stop.nodeId} is not attached to a converted road edge`
      );
    }

    const firstStop = exercise.stops[0];
    const lastStop = exercise.stops.at(-1);

    assert.ok(firstStop && firstStop.type === "node", `${exercise.id} starts on a converted OSM node`);
    assert.ok(lastStop && lastStop.type === "node", `${exercise.id} finishes on a converted OSM node`);
    assert.notEqual(firstStop.nodeId, lastStop.nodeId, `${exercise.id} start and finish should differ`);
  }
});

test("every medium converted OSM exercise uses valid converted graph nodes", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);

  for (const exercise of mediumLondonOsmRouteExercises) {
    assert.equal(exercise.mapId, mediumLondonOsmRouteMap.id, exercise.id);
    assert.ok(exercise.stops.length >= 2, exercise.id);

    for (const stop of exercise.stops) {
      assert.equal(stop.type, "node", `${exercise.id} should use stable converted OSM node stops`);
      assert.ok(graph.nodesById[stop.nodeId], `${exercise.id} references missing node ${stop.nodeId}`);
      assert.ok(
        (graph.outgoingEdgesByNodeId[stop.nodeId]?.length ?? 0) > 0 ||
          (graph.incomingEdgesByNodeId[stop.nodeId]?.length ?? 0) > 0,
        `${exercise.id} stop ${stop.nodeId} is not attached to a converted road edge`
      );
    }

    const firstStop = exercise.stops[0];
    const lastStop = exercise.stops.at(-1);

    assert.ok(firstStop && firstStop.type === "node", `${exercise.id} starts on a medium OSM node`);
    assert.ok(lastStop && lastStop.type === "node", `${exercise.id} finishes on a medium OSM node`);
    assert.notEqual(firstStop.nodeId, lastStop.nodeId, `${exercise.id} start and finish should differ`);
  }
});

test("every real London OSM pilot exercise uses valid converted graph nodes", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);

  for (const exercise of realLondonOsmPilotRouteExercises) {
    assert.equal(exercise.mapId, realLondonOsmPilotRouteMap.id, exercise.id);
    assert.ok(exercise.stops.length >= 2, exercise.id);

    for (const stop of exercise.stops) {
      assert.equal(stop.type, "node", `${exercise.id} should use stable converted OSM node stops`);
      assert.ok(graph.nodesById[stop.nodeId], `${exercise.id} references missing node ${stop.nodeId}`);
      assert.ok(
        (graph.outgoingEdgesByNodeId[stop.nodeId]?.length ?? 0) > 0 ||
          (graph.incomingEdgesByNodeId[stop.nodeId]?.length ?? 0) > 0,
        `${exercise.id} stop ${stop.nodeId} is not attached to a converted road edge`
      );
    }

    const firstStop = exercise.stops[0];
    const lastStop = exercise.stops.at(-1);

    assert.ok(firstStop && firstStop.type === "node", `${exercise.id} starts on a real OSM node`);
    assert.ok(lastStop && lastStop.type === "node", `${exercise.id} finishes on a real OSM node`);
    assert.notEqual(firstStop.nodeId, lastStop.nodeId, `${exercise.id} start and finish should differ`);
  }
});

test("every large London OSM exercise uses valid converted graph nodes", () => {
  const graph = buildMapGraph(largeLondonOsmRouteMap);

  for (const exercise of largeLondonOsmRouteExercises) {
    assert.equal(exercise.mapId, largeLondonOsmRouteMap.id, exercise.id);
    assert.ok(exercise.stops.length >= 2, exercise.id);

    for (const stop of exercise.stops) {
      assert.equal(stop.type, "node", `${exercise.id} should use stable converted OSM node stops`);
      assert.ok(graph.nodesById[stop.nodeId], `${exercise.id} references missing node ${stop.nodeId}`);
      assert.ok(
        (graph.outgoingEdgesByNodeId[stop.nodeId]?.length ?? 0) > 0 ||
          (graph.incomingEdgesByNodeId[stop.nodeId]?.length ?? 0) > 0,
        `${exercise.id} stop ${stop.nodeId} is not attached to a converted road edge`
      );
    }
  }
});

test("every converted OSM exercise is legally solvable through its required stops", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const availabilities = validateExerciseReachabilityList({
    map: tinyLondonOsmRouteMap,
    exercises: tinyLondonOsmRouteExercises,
    graph
  });

  assert.equal(availabilities.length, tinyLondonOsmRouteExercises.length);

  for (const availability of availabilities) {
    assert.equal(availability.isValid, true, `${availability.exerciseId}: ${availability.errors.join("; ")}`);
    assert.ok(availability.shortestRouteDistanceMeters && availability.shortestRouteDistanceMeters > 0);
    assert.equal(availability.missingLegs.length, 0, availability.exerciseId);
  }
});

test("every medium converted OSM exercise is legally solvable through its required stops", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const availabilities = validateExerciseReachabilityList({
    map: mediumLondonOsmRouteMap,
    exercises: mediumLondonOsmRouteExercises,
    graph
  });

  assert.equal(availabilities.length, mediumLondonOsmRouteExercises.length);

  for (const availability of availabilities) {
    assert.equal(availability.isValid, true, `${availability.exerciseId}: ${availability.errors.join("; ")}`);
    assert.ok(availability.shortestRouteDistanceMeters && availability.shortestRouteDistanceMeters > 0);
    assert.equal(availability.missingLegs.length, 0, availability.exerciseId);
  }
});

test("every real London OSM pilot exercise is legally solvable through its required stops", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const availabilities = validateExerciseReachabilityList({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    graph
  });

  assert.equal(availabilities.length, realLondonOsmPilotRouteExercises.length);

  for (const availability of availabilities) {
    assert.equal(availability.isValid, true, `${availability.exerciseId}: ${availability.errors.join("; ")}`);
    assert.ok(availability.shortestRouteDistanceMeters && availability.shortestRouteDistanceMeters > 0);
    assert.equal(availability.missingLegs.length, 0, availability.exerciseId);
  }
});

test("every large London OSM exercise is legally solvable through its required stops", () => {
  const graph = buildMapGraph(largeLondonOsmRouteMap);
  const availabilities = validateExerciseReachabilityList({
    map: largeLondonOsmRouteMap,
    exercises: largeLondonOsmRouteExercises,
    graph
  });

  assert.equal(availabilities.length, largeLondonOsmRouteExercises.length);

  for (const availability of availabilities) {
    assert.equal(availability.isValid, true, `${availability.exerciseId}: ${availability.errors.join("; ")}`);
    assert.ok(availability.shortestRouteDistanceMeters && availability.shortestRouteDistanceMeters > 0);
    assert.equal(availability.missingLegs.length, 0, availability.exerciseId);
  }
});

test("reveal fastest route returns a validated legal route for every converted OSM exercise", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, tinyLondonOsmRouteMap.restrictions);

  for (const exercise of tinyLondonOsmRouteExercises) {
    const overlay = buildFastestRouteOverlay({
      map: tinyLondonOsmRouteMap,
      exercise,
      revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
      graph
    });

    assert.equal(overlay.status, "available", `${exercise.id}: ${overlay.message ?? "no route"}`);
    assert.ok(overlay.edgeIds.length > 0, exercise.id);

    const routeValidation = validateDirectedEdgePath({
      graph,
      edgeIds: overlay.edgeIds,
      restrictions: tinyLondonOsmRouteMap.restrictions
    });

    assert.equal(routeValidation.valid, true, `${exercise.id}: ${routeValidation.invalidEdgeKeys.join(", ")}`);

    for (const edgeId of overlay.edgeIds) {
      const edge = graph.edgesById[edgeId];

      assert.ok(edge, `${exercise.id} returned unknown edge ${edgeId}`);
      assert.equal(blockedEdgeKeys.has(directedEdgeKey(edge)), false, `${exercise.id} used blocked edge ${edgeId}`);

      const road = graph.roadsById[edge.roadId];

      if (road?.isOneWay) {
        assert.equal(edge.direction, "forward", `${exercise.id} used illegal reverse one-way edge ${edgeId}`);
      }
    }
  }
});

test("reveal fastest route returns a validated legal route for every medium converted OSM exercise", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, mediumLondonOsmRouteMap.restrictions);

  for (const exercise of mediumLondonOsmRouteExercises) {
    const overlay = buildFastestRouteOverlay({
      map: mediumLondonOsmRouteMap,
      exercise,
      revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
      graph
    });

    assert.equal(overlay.status, "available", `${exercise.id}: ${overlay.message ?? "no route"}`);
    assert.ok(overlay.edgeIds.length > 0, exercise.id);

    const routeValidation = validateDirectedEdgePath({
      graph,
      edgeIds: overlay.edgeIds,
      restrictions: mediumLondonOsmRouteMap.restrictions
    });

    assert.equal(routeValidation.valid, true, `${exercise.id}: ${routeValidation.invalidEdgeKeys.join(", ")}`);

    for (const edgeId of overlay.edgeIds) {
      const edge = graph.edgesById[edgeId];

      assert.ok(edge, `${exercise.id} returned unknown edge ${edgeId}`);
      assert.equal(blockedEdgeKeys.has(directedEdgeKey(edge)), false, `${exercise.id} used blocked edge ${edgeId}`);

      const road = graph.roadsById[edge.roadId];

      if (road?.isOneWay) {
        assert.equal(edge.direction, "forward", `${exercise.id} used illegal reverse one-way edge ${edgeId}`);
      }
    }
  }
});

test("reveal fastest route returns a validated legal route for every real London OSM pilot exercise", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, realLondonOsmPilotRouteMap.restrictions);

  for (const exercise of realLondonOsmPilotRouteExercises) {
    const overlay = buildFastestRouteOverlay({
      map: realLondonOsmPilotRouteMap,
      exercise,
      revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
      graph
    });

    assert.equal(overlay.status, "available", `${exercise.id}: ${overlay.message ?? "no route"}`);
    assert.ok(overlay.edgeIds.length > 0, exercise.id);

    const routeValidation = validateDirectedEdgePath({
      graph,
      edgeIds: overlay.edgeIds,
      restrictions: realLondonOsmPilotRouteMap.restrictions
    });

    assert.equal(routeValidation.valid, true, `${exercise.id}: ${routeValidation.invalidEdgeKeys.join(", ")}`);

    for (const edgeId of overlay.edgeIds) {
      const edge = graph.edgesById[edgeId];

      assert.ok(edge, `${exercise.id} returned unknown edge ${edgeId}`);
      assert.equal(blockedEdgeKeys.has(directedEdgeKey(edge)), false, `${exercise.id} used blocked edge ${edgeId}`);
    }
  }
});

test("reveal fastest route returns a validated legal route for every large London OSM exercise", () => {
  const graph = buildMapGraph(largeLondonOsmRouteMap);
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, largeLondonOsmRouteMap.restrictions);

  for (const exercise of largeLondonOsmRouteExercises) {
    const overlay = buildFastestRouteOverlay({
      map: largeLondonOsmRouteMap,
      exercise,
      revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
      graph
    });

    assert.equal(overlay.status, "available", `${exercise.id}: ${overlay.message ?? "no route"}`);
    assert.ok(overlay.edgeIds.length > 0, exercise.id);

    const routeValidation = validateDirectedEdgePath({
      graph,
      edgeIds: overlay.edgeIds,
      restrictions: largeLondonOsmRouteMap.restrictions
    });

    assert.equal(routeValidation.valid, true, `${exercise.id}: ${routeValidation.invalidEdgeKeys.join(", ")}`);

    for (const edgeId of overlay.edgeIds) {
      const edge = graph.edgesById[edgeId];

      assert.ok(edge, `${exercise.id} returned unknown edge ${edgeId}`);
      assert.equal(blockedEdgeKeys.has(directedEdgeKey(edge)), false, `${exercise.id} used blocked edge ${edgeId}`);
    }
  }
});

test("medium converted OSM one-way detour does not use illegal reverse one-way travel", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const exercise = mediumLondonOsmRouteExercises.find(
    (candidate) => candidate.id === "osm-medium-one-way-detour"
  );

  assert.ok(exercise);

  const overlay = buildFastestRouteOverlay({
    map: mediumLondonOsmRouteMap,
    exercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });

  assert.equal(overlay.status, "available");
  assert.equal(overlay.roadIds.some((roadId) => roadId.startsWith("osm-way-6005-")), false);
  assert.equal(overlay.nodeIds[0], "osm-node-5015");
  assert.equal(overlay.nodeIds.at(-1), "osm-node-5011");
  assert.ok(overlay.nodeIds.length > 2);
});

test("real London OSM pilot one-way exercise uses real Torrington Place edges", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const exercise = realLondonOsmPilotRouteExercises.find(
    (candidate) => candidate.id === "osm-real-pilot-one-way-detour"
  );

  assert.ok(exercise);

  const overlay = buildFastestRouteOverlay({
    map: realLondonOsmPilotRouteMap,
    exercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });

  assert.equal(overlay.status, "available");
  assert.ok(
    overlay.edgeIds.every((edgeId) => {
      const edge = graph.edgesById[edgeId];
      const road = edge ? graph.roadsById[edge.roadId] : null;

      return road?.name === "Torrington Place";
    })
  );
  assert.deepEqual(overlay.nodeIds, [
    "osm-node-108034",
    "osm-node-7083403297",
    "osm-node-1448876379",
    "osm-node-5739837615",
    "osm-node-11170905228",
    "osm-node-11170905227",
    "osm-node-108036",
    "osm-node-5610146044",
    "osm-node-6384542420",
    "osm-node-185620586",
    "osm-node-14725979",
    "osm-node-6384542422",
    "osm-node-6384542416",
    "osm-node-6384542424",
    "osm-node-11582793599",
    "osm-node-10185838287",
    "osm-node-11582793600",
    "osm-node-6384549780",
    "osm-node-9279437656",
    "osm-node-6384561968",
    "osm-node-11170905220",
    "osm-node-11170905219",
    "osm-node-5610161834",
    "osm-node-9279437653",
    "osm-node-8162935473",
    "osm-node-6010004323",
    "osm-node-108044"
  ]);
});

test("real London OSM pilot snapping and reveal remain aligned after projection fit", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const exercise = realLondonOsmPilotRouteExercises.find(
    (candidate) => candidate.id === "osm-real-pilot-short-crossing"
  );
  const goodgeStreetNodeIds = [
    "osm-node-107319",
    "osm-node-2440641461",
    "osm-node-10275895934",
    "osm-node-9791487",
    "osm-node-983839058",
    "osm-node-6571452366",
    "osm-node-5612180571",
    "osm-node-8474252670",
    "osm-node-1448894892",
    "osm-node-107320"
  ];
  const goodgeStreetPoints = goodgeStreetNodeIds.map((nodeId) => {
    const node = graph.nodesById[nodeId];

    assert.ok(node);

    return node;
  });

  assert.ok(exercise);

  const snappedRoute = snapDrawnRouteToRoads({
    map: realLondonOsmPilotRouteMap,
    points: goodgeStreetPoints,
    snapTolerance: 1
  });

  assert.equal(snappedRoute.isValidTrace, true);
  assert.equal(snappedRoute.hasOffRoadPoints, false);
  assert.ok(
    snappedRoute.snappedPoints.every((point) => {
      const road = point.roadId ? graph.roadsById[point.roadId] : null;

      return road?.name === "Goodge Street";
    })
  );

  const overlay = buildFastestRouteOverlay({
    map: realLondonOsmPilotRouteMap,
    exercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });
  const viewport = {
    width: TEST_CANVAS_WIDTH,
    height: TEST_CANVAS_HEIGHT,
    mapBounds: getRouteRunnerMapViewportBounds(realLondonOsmPilotRouteMap, TEST_CANVAS_WIDTH, TEST_CANVAS_HEIGHT)
  };

  assert.equal(overlay.status, "available");

  if (overlay.status === "available") {
    for (const point of overlay.points) {
      assertScreenPointInsideViewport(mapToScreenPoint(point, viewport), "real-pilot-reveal");
    }
  }
});

test("large London OSM one-way detour avoids illegal reverse one-way travel", () => {
  const graph = buildMapGraph(largeLondonOsmRouteMap);
  const exercise = largeLondonOsmRouteExercises.find(
    (candidate) => candidate.id === "osm-large-one-way-detour"
  );

  assert.ok(exercise);

  const overlay = buildFastestRouteOverlay({
    map: largeLondonOsmRouteMap,
    exercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });

  assert.equal(overlay.status, "available");
  assert.equal(overlay.roadIds.some((roadId) => roadId.startsWith("osm-way-11003-")), false);
  assert.deepEqual(overlay.nodeIds, [
    "osm-node-10026",
    "osm-node-10036",
    "osm-node-10035",
    "osm-node-10034",
    "osm-node-10033",
    "osm-node-10032",
    "osm-node-10031",
    "osm-node-10030",
    "osm-node-10020"
  ]);
});

test("converted OSM one-way exercise is solvable only in the legal imported direction", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const exercise = tinyLondonOsmRouteExercises.find(
    (candidate) => candidate.id === "osm-tiny-roundabout-to-argyle"
  );

  assert.ok(exercise);

  const overlay = buildFastestRouteOverlay({
    map: tinyLondonOsmRouteMap,
    exercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });

  assert.equal(overlay.status, "available");
  assert.ok(overlay.roadIds.includes("osm-way-2004-segment-2"));
  assert.ok(overlay.roadIds.includes("osm-way-2003-segment-0"));
  assert.deepEqual(overlay.nodeIds, ["osm-node-1008", "osm-node-1006", "osm-node-1005"]);
});

test("converted OSM one-way restrictions prevent illegal reverse fastest-route reveal", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const reverseExercise: RouteExercise = {
    id: "osm-reverse-one-way-test",
    title: "Reverse one-way test",
    mapId: tinyLondonOsmRouteMap.id,
    stops: [
      { type: "node" as const, nodeId: "osm-node-1005" },
      { type: "node" as const, nodeId: "osm-node-1003" }
    ]
  };
  const overlay = buildFastestRouteOverlay({
    map: tinyLondonOsmRouteMap,
    exercise: reverseExercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph
  });

  assert.equal(overlay.status, "unavailable");
  assert.match(overlay.message ?? "", /No legal fastest route/);
});

test("invalid converted OSM exercise fixtures fail solvability validation", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const invalidExercise: RouteExercise = {
    id: "osm-invalid-unreachable-test",
    title: "Invalid unreachable OSM test",
    mapId: tinyLondonOsmRouteMap.id,
    stops: [
      { type: "node", nodeId: "osm-node-1001" },
      { type: "node", nodeId: "osm-node-1010" }
    ]
  };
  const availability = validateExerciseReachability({
    map: tinyLondonOsmRouteMap,
    exercise: invalidExercise,
    graph
  });
  const overlay = buildFastestRouteOverlay({
    map: tinyLondonOsmRouteMap,
    exercise: invalidExercise,
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState()),
    graph,
    availability
  });

  assert.equal(availability.isValid, false);
  assert.ok(availability.errors.some((error) => error.includes("No legal route")));
  assert.equal(overlay.status, "unavailable");
});
