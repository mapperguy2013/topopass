import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  auditSyntheticAtlasLabelCoverage,
  atlasSymbolSemanticScale,
  buildSyntheticBackgroundFeatures,
  buildSyntheticLandmarkVisuals,
  buildSyntheticLinearFeatures,
  buildSyntheticMapLabels,
  buildSyntheticRoadVisuals,
  buildSyntheticRouteOverlayVisuals,
  cartographicCorrectRouteScaleForZoom,
  cartographicCustomMarkerAssetScaleForZoom,
  cartographicDrawnAttemptScaleForZoom,
  cartographicLearnerMarkerScaleForZoom,
  cartographicMistakeOverlayScaleForZoom,
  cartographicReviewTextScaleForZoom,
  cartographicRouteOverlayScaleForZoom,
  buildSyntheticStreetMapLegendItems,
  buildRoadJunctionCaps,
  buildRoadRenderPasses,
  cartographicStyleScaleForZoom,
  deriveOsmRoadRenderMetadata,
  deriveOsmRoadVisualHierarchy,
  deriveRoadLabelPosition,
  deriveSyntheticRoadClass,
  filterSyntheticBackgroundFeaturesForViewport,
  filterSyntheticLandmarkVisualsForViewport,
  filterSyntheticMapLabelsForViewport,
  getZoomStyleScale,
  getSyntheticLabelMeasurementCacheStats,
  labelStyleForSyntheticMapLabel,
  isPhoneAtlasViewport,
  readableSyntheticLabelAngle,
  resetSyntheticLabelMeasurementCache,
  roadReferencePlacementCandidatesForViewport,
  roadInteractionStyleForState,
  roadJunctionRadiusForVisual,
  roadRenderRank,
  roadLabelTier,
  roadStyleForOsmHierarchy,
  roadStyleForViewport,
  roadStyleForSyntheticClass,
  shouldShowSyntheticLinearFeatureForViewport,
  syntheticLandmarkVisualAlphaForViewport,
  syntheticBackgroundFeatureStyleForViewport,
  syntheticLandmarkReservationBoxes,
  syntheticLinearFeatureAlphaForViewport,
  syntheticMapLabelSymbolOffsetX,
  sortSyntheticBackgroundFeaturesForRender,
  sortRoadVisualsForBaseRender,
  type SyntheticMapLabel,
  type SyntheticLandmarkVisual,
  type SyntheticRoadVisual
} from "./syntheticStreetMapRenderer.ts";
import {
  buildZoomedMapViewport,
  createDefaultMapViewportState,
  ROUTE_RUNNER_MAP_ZOOM_LIMITS,
  ROUTE_RUNNER_PHONE_MAP_CANVAS_HEIGHT,
  ROUTE_RUNNER_PHONE_MAP_CANVAS_WIDTH
} from "./mapViewport.ts";
import { ONE_WAY_ARROW_MIN_SPACING_METERS } from "./restrictionMapVisuals.ts";
import { TOPOPASS_STREET_ATLAS_STYLE } from "./topopassCartographyStyle.ts";
import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  getTurnRestrictionVisuals,
  mapToScreenPoint,
  type MapDefinition
} from "../../../lib/map-engine/index.ts";
import {
  convertOverpassJsonToRouteMap,
  projectOsmCoordinateToLocalMeters,
  type OverpassJsonResponse
} from "../../../lib/map-engine/osm/index.ts";
import { mediumLondonOsmRouteExercises, mediumLondonOsmRouteMap, getRouteRunnerMapViewportBounds, getRouteRunnerMapOption, realLondonOsmPilotRouteMap } from "./routeRunnerMaps.ts";
import { getRouteRunnerMapViewportBounds as getProductionRouteRunnerMapViewportBounds } from "./routeRunnerMapOptionUtils.ts";
import { CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS } from "./curatedRealLondonRouteRunnerMaps.ts";
import { kingsCrossEustonOsmRouteRunnerMapOption } from "./curatedKingsCrossEustonRouteRunnerMap.ts";
import { buildRoadRestrictionOverlays } from "./routeRunnerDisplay.ts";
import { buildRestrictionMapVisualItems, filterRestrictionMapVisualItemsForViewport } from "./restrictionMapVisuals.ts";
import { victoriaWestminsterVauxhallOsmRouteRunnerMapOption } from "./curatedVictoriaWestminsterVauxhallRouteRunnerMap.ts";

function assertClose(actual: number, expected: number, tolerance: number, message: string): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

function distanceToSegment(point: { x: number; y: number }, from: { x: number; y: number }, to: { x: number; y: number }): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  const ratio = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared));
  const projected = {
    x: from.x + dx * ratio,
    y: from.y + dy * ratio
  };

  return Math.hypot(point.x - projected.x, point.y - projected.y);
}

function distanceToVisualGeometry(point: { x: number; y: number }, visual: SyntheticRoadVisual): number {
  if (visual.points.length < 2) {
    return Number.POSITIVE_INFINITY;
  }

  return visual.points
    .slice(1)
    .reduce(
      (minimum, current, index) => Math.min(minimum, distanceToSegment(point, visual.points[index], current)),
      Number.POSITIVE_INFINITY
    );
}

function assertPrimitiveRenderValues(value: unknown, path = "style"): void {
  if (Array.isArray(value)) {
    assert.ok(value.length > 0, `${path} should not be an empty token array`);
    value.forEach((item, index) => assertPrimitiveRenderValues(item, `${path}[${index}]`));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => assertPrimitiveRenderValues(item, `${path}.${key}`));
    return;
  }

  assert.ok(
    typeof value === "string" || typeof value === "number" || typeof value === "boolean",
    `${path} should be a primitive render token`
  );

  if (typeof value === "number") {
    assert.ok(Number.isFinite(value), `${path} should be finite`);
  }
}

test("Stage 142 exposes a central TOPOPASS street-atlas style token object", () => {
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.roads.osm.primary.strokeColor, "#f3ce3f");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.roads.synthetic.major.strokeColor, "#f2ca3d");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.labels.road.font, "600 11px Arial, sans-serif");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.background.park.garden.fillColor, "#d4e4b9");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.rail.strokeColor, "#647184");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.station.strokeColor, "#26384c");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.start.fillColor, "#059669");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.destination.fillColor, "#dc2626");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.start.shape, "pin");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.destination.shape, "pin");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.asset?.src, "/map-icons/start-marker.svg");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.asset?.src, "/map-icons/destination-marker.svg");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.checkpointBase.asset?.src, "/map-icons/checkpoint-marker.svg");
  assert.ok(
    TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.start.pinTipLength >
      TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.start.radius
  );
  assert.ok(
    TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.destination.pinTipLength >
      TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.destination.radius
  );
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.checkpoint.fillColor, "#2563eb");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.requiredVia.fillColor, "#1d4ed8");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.hints.snapPreview.strokeColor, "#0d9488");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay.color, "#245da8");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.review.fastestRoute.route.strokeColor, "#0284c7");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.nodes.showBaseMapNodes, false);
});

test("Stage 142 road hierarchy route restriction and one-way token groups are complete", () => {
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.roads.osm), [
    "primary",
    "secondary",
    "tertiary",
    "residential",
    "service",
    "pedestrian",
    "restricted",
    "inactive",
    "unknown"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.roads.synthetic), [
    "major",
    "secondary",
    "oneWay",
    "noEntry",
    "restricted",
    "service",
    "local"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.routeOverlays), [
    "rawRoute",
    "snappedRoute",
    "matchedRoute",
    "shortestLegalRoute",
    "acceptedAlternativeRoute",
    "illegalMovement",
    "inefficientSection",
    "backtrackSection"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.roads.roadCasings), [
    "activeColor",
    "quietColor",
    "restrictedColor"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.roads.geometry), [
    "lineCap",
    "lineJoin",
    "miterLimit",
    "lowZoomViewportScale",
    "minorLowZoomWidthMultiplier",
    "minorLowZoomAlphaMultiplier",
    "serviceLowZoomWidthMultiplier",
    "serviceLowZoomAlphaMultiplier",
    "restrictedLowZoomAlphaMultiplier"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.roads.junctions), [
    "majorRadiusMultiplier",
    "secondaryRadiusMultiplier",
    "minorRadiusMultiplier",
    "quietRadiusMultiplier"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.roads.interaction), [
    "selected",
    "hovered"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.roads.zoomScaledWidths), [
    "referenceZoom",
    "minMultiplier",
    "maxMultiplier"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.labels.roadHierarchy), [
    "major",
    "secondary",
    "minor",
    "restricted",
    "service"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.labels.context), [
    "road_reference",
    "district",
    "institution",
    "land_use",
    "station",
    "landmark",
    "public_building",
    "open_space",
    "learner_reference",
    "park",
    "water",
    "bridge",
    "area"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.labels.collision), [
    "defaultPadding",
    "routePadding",
    "markerPadding",
    "viewportEdgePadding",
    "roadReferenceRepeatDistance",
    "roadReferenceMinimumVisibleSegmentLength",
    "roadReferenceRepeatMinimumVisibleSegmentLength",
    "roadReferenceMaxTextToSegmentRatio",
    "roadReferenceMaxPerText",
    "roadReferenceMaxPerViewport",
    "roadReferenceMaxPerClass",
    "roadReferenceZoomBudgets"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.labels.priorities), [
    "roadReference",
    "district",
    "majorRoad",
    "secondaryRoad",
    "restrictedRoad",
    "localRoad",
    "station",
    "landmark",
    "publicBuilding",
    "openSpace",
    "learnerReference",
    "park",
    "water",
    "bridge",
    "area",
    "institution",
    "contextualLandUse",
    "exerciseStop"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.contextFeatures), [
    "rail",
    "bridge",
    "stationMarker",
    "landmarkMarker",
    "importantLandmarkMarker",
    "publicBuildingMarker",
    "openSpaceMarker",
    "learnerReferenceMarker"
  ]);
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay.minSpacingMeters, 88);
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay.longRoadArrowThresholdMeters, 180);
});

test("Stage 161.6.23.2 learner marker SVG assets are present and bottom-centre anchored", () => {
  const markerAssets = [
    TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.asset,
    TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.asset,
    TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.checkpointBase.asset
  ];

  for (const asset of markerAssets) {
    assert.ok(asset);
    const svg = readFileSync(`public${asset.src}`, "utf8");

    assert.match(svg, /<svg\b/);
    assert.match(svg, /transparent background; anchor point is bottom-centre/i);
    assert.doesNotMatch(svg, /<text\b/);
    assert.doesNotMatch(svg, /START|DESTINATION|CHECKPOINT/);
    assert.equal(asset.anchorX, asset.sourceWidth / 2);
    assert.ok(asset.anchorY > asset.sourceHeight * 0.95);
    assert.ok(
      Math.abs(asset.displayWidth / asset.displayHeight - asset.sourceWidth / asset.sourceHeight) < 0.0001
    );
  }
});

test("Stage 161.6.23.3 custom marker SVG sizing adapts by zoom without anchor drift", () => {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.assetZoomScale;
  const startMarkerAsset = TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.asset;
  const checkpointMarkerAsset = TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.checkpointBase.asset;

  assert.ok(startMarkerAsset);
  assert.ok(checkpointMarkerAsset);
  assert.equal(cartographicCustomMarkerAssetScaleForZoom(1), 0.5);
  assert.equal(cartographicCustomMarkerAssetScaleForZoom(2.5), 0.75);
  assert.equal(cartographicCustomMarkerAssetScaleForZoom(5), 1);
  assert.equal(cartographicCustomMarkerAssetScaleForZoom(10), 1.1);
  assert.ok(Math.abs(cartographicCustomMarkerAssetScaleForZoom(25) - 1.2) < 0.0001);
  assert.equal(cartographicCustomMarkerAssetScaleForZoom(50), 1.3);
  assert.equal(cartographicCustomMarkerAssetScaleForZoom(100), scaleTokens.maxScale);

  for (const zoom of [1, 2.5, 5, 10, 25, 50]) {
    const markerScale = cartographicCustomMarkerAssetScaleForZoom(zoom);
    const width = startMarkerAsset.displayWidth * markerScale;
    const height = startMarkerAsset.displayHeight * markerScale;
    const anchorX = (startMarkerAsset.anchorX / startMarkerAsset.sourceWidth) * width;
    const anchorY = (startMarkerAsset.anchorY / startMarkerAsset.sourceHeight) * height;

    assert.equal(anchorX, width / 2);
    assert.ok(anchorY > height * 0.95);
  }
});

test("Stage 161.6.23.4 marker labels are separate screen-space canvas text", () => {
  const viewport = {
    width: 800,
    height: 500,
    mapBounds: {
      minX: 0,
      minY: 0,
      maxX: 800,
      maxY: 500
    }
  };
  const startLabel = {
    id: "start-label",
    kind: "start" as const,
    text: "START",
    point: { x: 100, y: 100 },
    priority: 0
  };
  const destinationLabel = {
    id: "destination-label",
    kind: "finish" as const,
    text: "DESTINATION",
    point: { x: 200, y: 100 },
    priority: 0
  };
  const checkpointLabel = {
    id: "checkpoint-label",
    kind: "checkpoint" as const,
    text: "CHECKPOINT 1",
    point: { x: 300, y: 100 },
    priority: 0
  };
  const startNormal = labelStyleForSyntheticMapLabel(startLabel, viewport, 1);
  const startHigh = labelStyleForSyntheticMapLabel(startLabel, viewport, 50);
  const destinationNormal = labelStyleForSyntheticMapLabel(destinationLabel, viewport, 1);
  const checkpointNormal = labelStyleForSyntheticMapLabel(checkpointLabel, viewport, 1);

  assert.match(startNormal.font, /13px/);
  assert.match(startHigh.font, /13px/);
  assert.match(destinationNormal.font, /13px/);
  assert.match(checkpointNormal.font, /12px/);
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale.labelGain.stop, 0);
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale.labelMaxMultiplier.stop, 1);
  assert.ok((startHigh.yOffset ?? 0) < (startNormal.yOffset ?? 0));
  assert.ok((checkpointNormal.yOffset ?? 0) < -35);
});

test("Stage 160 atlas identity tokens keep hierarchy calm and original", () => {
  const style = TOPOPASS_STREET_ATLAS_STYLE;

  assert.notEqual(style.canvas.backgroundColor, "#f5f0e5");
  assert.ok(style.roads.osm.primary.casingWidth > style.roads.osm.secondary.casingWidth);
  assert.ok(style.roads.osm.secondary.casingWidth > style.roads.osm.residential.casingWidth);
  assert.ok(style.roads.osm.residential.strokeWidth > style.roads.osm.service.strokeWidth);
  assert.notEqual(style.roads.osm.primary.strokeColor, style.routeOverlays.matchedRoute.strokeColor);
  assert.ok(style.roads.osm.primary.strokeColor !== style.routeOverlays.rawRoute.strokeColor);
  assert.ok((style.roads.osm.service.alpha ?? 1) < 0.75);
  assert.ok((style.roads.osm.pedestrian.alpha ?? 1) < (style.roads.osm.service.alpha ?? 1));
  assert.ok(style.labels.roadHierarchy.major.haloWidth > style.labels.roadHierarchy.minor.haloWidth);
  assert.ok(style.labels.roadHierarchy.major.repeatDistance > style.labels.roadHierarchy.secondary.repeatDistance);
  assert.ok(style.labels.roadHierarchy.service.minViewportScale > style.labels.roadHierarchy.minor.minViewportScale);
  assert.ok(style.contextFeatures.rail.highZoomAlpha < 0.8);
  assert.ok((style.background.water.linear.casingWidth ?? 0) < style.roads.osm.primary.casingWidth);
  assert.ok(style.background.water.linear.strokeWidth < style.roads.osm.primary.strokeWidth);
  assert.notEqual(style.station.strokeColor, style.restrictions.noEntryMarker.strokeColor);
});

test("Stage 152.5 route review overlay tokens are distinct and severity ordered", () => {
  const overlays = TOPOPASS_STREET_ATLAS_STYLE.routeOverlays;
  const checkpointStates = TOPOPASS_STREET_ATLAS_STYLE.review.checkpoints;

  assert.ok(overlays.rawRoute.casingWidth && overlays.rawRoute.casingWidth > overlays.rawRoute.strokeWidth);
  assert.ok(overlays.shortestLegalRoute.dash && overlays.shortestLegalRoute.dash.length > 0);
  assert.notEqual(overlays.rawRoute.strokeColor, overlays.shortestLegalRoute.strokeColor);
  assert.notEqual(overlays.acceptedAlternativeRoute.strokeColor, overlays.shortestLegalRoute.strokeColor);
  assert.notEqual(overlays.acceptedAlternativeRoute.strokeColor, overlays.rawRoute.strokeColor);
  assert.ok(overlays.illegalMovement.strokeWidth > overlays.inefficientSection.strokeWidth);
  assert.ok(overlays.illegalMovement.strokeWidth > overlays.backtrackSection.strokeWidth);
  assert.ok((overlays.illegalMovement.casingWidth ?? 0) > (overlays.inefficientSection.casingWidth ?? 0));
  assert.notEqual(overlays.inefficientSection.strokeColor, overlays.illegalMovement.strokeColor);
  assert.notEqual(overlays.backtrackSection.strokeColor, overlays.illegalMovement.strokeColor);
  assert.notEqual(checkpointStates.missed.strokeColor, checkpointStates.completed.strokeColor);
  assert.ok(checkpointStates.missed.outerRadiusPadding > checkpointStates.completed.outerRadiusPadding);
  assert.ok(checkpointStates.focused.outerRadiusPadding > checkpointStates.completed.outerRadiusPadding);
});

test("Stage 153 learner overlay marker hint and callout tokens are complete and distinct", () => {
  const learnerOverlays = TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays;

  assert.deepEqual(learnerOverlays.drawOrder, [
    "base-context",
    "roads",
    "base-labels",
    "correct-route",
    "accepted-alternative-route",
    "attempted-route",
    "hints-next-road",
    "route-warnings",
    "checkpoint-markers",
    "start-destination-markers",
    "review-callouts",
    "selected-focus"
  ]);
  assert.notEqual(learnerOverlays.markers.start.fillColor, learnerOverlays.markers.destination.fillColor);
  assert.ok(learnerOverlays.markers.start.radius > learnerOverlays.markers.checkpointBase.radius);
  assert.ok(learnerOverlays.markers.requiredCheckpoint.radius > learnerOverlays.markers.checkpointBase.radius);
  assert.notEqual(learnerOverlays.checkpointStates.missed.strokeColor, learnerOverlays.checkpointStates.completed.strokeColor);
  assert.ok(
    learnerOverlays.checkpointStates.missed.outerRadiusPadding >
      learnerOverlays.checkpointStates.completed.outerRadiusPadding
  );
  assert.ok(
    learnerOverlays.checkpointStates.focused.outerRadiusPadding >
      learnerOverlays.checkpointStates.completed.outerRadiusPadding
  );
  assert.ok(learnerOverlays.checkpointStates.reached.strokeWidth >= learnerOverlays.checkpointStates.completed.strokeWidth);
  assert.ok((learnerOverlays.hints.available.alpha ?? 1) < (learnerOverlays.hints.revealed.alpha ?? 0));
  assert.notEqual(learnerOverlays.hints.available.dash?.join(","), learnerOverlays.hints.revealed.dash?.join(","));
  assert.ok(learnerOverlays.hints.marker.radius < learnerOverlays.markers.checkpointBase.radius);
  assert.notEqual(
    learnerOverlays.hints.nextRoadSuggestion.strokeColor,
    TOPOPASS_STREET_ATLAS_STYLE.routeOverlays.shortestLegalRoute.strokeColor
  );
  assert.ok(
    (learnerOverlays.hints.nextRoadSuggestion.alpha ?? 1) <
      (TOPOPASS_STREET_ATLAS_STYLE.routeOverlays.shortestLegalRoute.alpha ?? 1)
  );
  assert.notEqual(learnerOverlays.reviewCallouts.wrongTurn.strokeColor, learnerOverlays.reviewCallouts.restrictedManoeuvre.strokeColor);
  assert.ok(learnerOverlays.reviewCallouts.illegal.strokeWidth > learnerOverlays.reviewCallouts.hint.strokeWidth);
  assert.ok(learnerOverlays.reviewCallouts.missedCheckpoint.strokeWidth > learnerOverlays.reviewCallouts.inefficient.strokeWidth);
  assert.notEqual(learnerOverlays.warnings.backtrack.strokeColor, learnerOverlays.warnings.inefficientSection.strokeColor);
  assert.ok(learnerOverlays.warnings.illegalSegment.strokeWidth > learnerOverlays.warnings.wrongTurn.strokeWidth);
  assert.ok(learnerOverlays.selectedFocus.routeLineWidth > learnerOverlays.warnings.illegalSegment.strokeWidth);
  assert.ok(learnerOverlays.selectedFocus.outerRadius > learnerOverlays.selectedFocus.innerRadius);
  assert.ok(learnerOverlays.selectedFocus.routeAlpha > 0.8);
});

test("Stage 156 mobile touch readability tokens are central and finger-safe", () => {
  const learnerOverlays = TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays;
  const touchTargets = learnerOverlays.touchTargets;
  const mobileReadability = learnerOverlays.mobileReadability;

  assert.equal(touchTargets.minTapTargetPx, 44);
  assert.ok(touchTargets.markerHitRadius * 2 >= touchTargets.minTapTargetPx);
  assert.ok(touchTargets.checkpointHitRadius * 2 >= touchTargets.minTapTargetPx);
  assert.ok(touchTargets.hintHitRadius * 2 >= touchTargets.minTapTargetPx);
  assert.ok(touchTargets.reviewIssueHitRadius * 2 > touchTargets.minTapTargetPx);
  assert.ok(touchTargets.restrictionHitRadius * 2 >= touchTargets.minTapTargetPx);
  assert.ok(touchTargets.calloutMinHeight >= 32);
  assert.ok(touchTargets.markerHitRadius > learnerOverlays.markers.checkpointBase.radius);
  assert.ok(touchTargets.hintHitRadius > learnerOverlays.hints.marker.radius);
  assert.ok(mobileReadability.compactControlMinHeightPx >= touchTargets.minTapTargetPx);
  assert.ok(mobileReadability.legendMaxHeightPx <= 220);
  assert.ok(mobileReadability.mapMinHeightPx >= 420);
  assert.ok(mobileReadability.tabletMapMinHeightPx > mobileReadability.mapMinHeightPx);
  assert.ok(mobileReadability.calloutViewportPaddingPx >= 6);
});

test("Stage 142 zoom and decluttering tokens are ordered finite and used by helpers", () => {
  const thresholds = TOPOPASS_STREET_ATLAS_STYLE.zoom.thresholds;
  const cartographicScale = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;

  assert.ok(thresholds.minZoom < thresholds.defaultZoom);
  assert.ok(thresholds.defaultZoom < thresholds.maxZoom);
  assert.ok(thresholds.stepRatio > 1);
  assert.ok(thresholds.wheelSensitivity > 0);
  assert.ok(thresholds.panMargin >= 0);
  assert.ok(cartographicScale.referenceViewportScale > 0);
  assert.ok(cartographicScale.roadGain.major > cartographicScale.roadGain.secondary);
  assert.ok(cartographicScale.roadGain.secondary > cartographicScale.roadGain.local);
  assert.ok(cartographicScale.roadGain.local > cartographicScale.roadGain.service);
  assert.ok(cartographicScale.roadMaxMultiplier.major > cartographicScale.roadMaxMultiplier.local);
  assert.ok(cartographicScale.roadMaxMultiplier.local >= 4);
  assert.ok(cartographicScale.roadMaxMultiplier.service < cartographicScale.roadMaxMultiplier.local);
  assert.ok(cartographicScale.labelGain.minor >= cartographicScale.labelGain.major);
  assert.ok(cartographicScale.labelMaxMultiplier.minor >= 6);
  assert.ok(cartographicScale.restrictionMaxMultiplier > 1);
  assert.deepEqual(ROUTE_RUNNER_MAP_ZOOM_LIMITS, thresholds);
  assert.equal(
    ONE_WAY_ARROW_MIN_SPACING_METERS,
    TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.oneWayArrowMinSpacingMeters
  );
  assert.equal(
    TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay.mediumSpacingMultiplier,
    TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.mediumOneWayArrowSpacingMultiplier
  );
});

test("Stage 142 style tokens are deterministic primitive render values", () => {
  assertPrimitiveRenderValues(TOPOPASS_STREET_ATLAS_STYLE);
  assert.deepEqual(TOPOPASS_STREET_ATLAS_STYLE, TOPOPASS_STREET_ATLAS_STYLE);
});

test("Stage 151 objective and hint overlays use learner-priority central tokens", () => {
  const markers = TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers;
  const hints = TOPOPASS_STREET_ATLAS_STYLE.hints;
  const selectedRoad = roadInteractionStyleForState("selected");

  assert.equal(markers.start.text, "START");
  assert.equal(markers.start.compactText, "S");
  assert.equal(markers.destination.text, "DESTINATION");
  assert.equal(markers.destination.compactText, "D");
  assert.equal(markers.start.shape, "pin");
  assert.equal(markers.destination.shape, "pin");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.shape, "pin");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.shape, "pin");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.innerFillColor, "#ffffff");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.innerFillColor, "#ffffff");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.labelBubble.fillColor, "rgba(255,255,255,0.97)");
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.labelBubble.minWidth >= 54);
  assert.deepEqual(
    {
      x: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.asset?.anchorX,
      y: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.asset?.anchorY
    },
    { x: 60, y: 174 }
  );
  assert.deepEqual(
    {
      x: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.asset?.anchorX,
      y: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.asset?.anchorY
    },
    { x: 60, y: 174 }
  );
  assert.deepEqual(
    {
      x: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.checkpointBase.asset?.anchorX,
      y: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.checkpointBase.asset?.anchorY
    },
    { x: 55, y: 154 }
  );
  const startMarkerAsset = TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.asset;

  assert.ok(startMarkerAsset);
  assert.ok(
    Math.abs(
      startMarkerAsset.displayWidth / startMarkerAsset.displayHeight -
        startMarkerAsset.sourceWidth / startMarkerAsset.sourceHeight
    ) < 0.0001
  );
  assert.ok(
    (TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.pinTipLength ?? 0) >
      TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.radius
  );
  assert.ok(
    (TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.pinTipLength ?? 0) >
      TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.radius
  );
  assert.ok((TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.innerRadiusRatio ?? 1) < 0.4);
  assert.ok((TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.innerRadiusRatio ?? 1) < 0.4);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.haloRadiusPadding < 7);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.haloRadiusPadding < 7);
  assert.equal(markers.requiredVia.textPrefix, "VIA");
  assert.ok(markers.start.radius > TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay.tipDistance);
  assert.ok(markers.destination.radius >= TOPOPASS_STREET_ATLAS_STYLE.restrictions.turnBanMarker.radius);
  assert.ok(markers.requiredVia.radius > markers.checkpoint.radius);
  assert.ok(markers.reservationPadding >= TOPOPASS_STREET_ATLAS_STYLE.labels.collision.defaultPadding);
  assert.ok(hints.snapPreview.strokeWidth < TOPOPASS_STREET_ATLAS_STYLE.routeOverlays.rawRoute.strokeWidth);
  assert.ok(hints.snappedPointRadius < markers.checkpoint.radius);
  assert.ok(selectedRoad.haloWidth > TOPOPASS_STREET_ATLAS_STYLE.roads.osm.primary.strokeWidth);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.nodes.matchedNodeHaloRadiusPadding > hints.snappedPointRadius);
});

test("Stage 161.6.21 route review issue symbols default to icon-only learner map feedback", () => {
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.review.routeIssue.iconOnlyDefault, true);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.review.routeIssue.markerRadius <= 14);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.review.routeIssue.markerHaloPadding > 0);
  assert.ok(
    TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.touchTargets.reviewIssueHitRadius >
      TOPOPASS_STREET_ATLAS_STYLE.review.routeIssue.markerRadius
  );
});

test("Stage 8.9 learner and review overlays preserve atlas geography through bounded hierarchy", () => {
  const overlays = TOPOPASS_STREET_ATLAS_STYLE.routeOverlays;
  const learner = TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays;
  const routeIssue = TOPOPASS_STREET_ATLAS_STYLE.review.routeIssue;

  assert.deepEqual(learner.drawOrder, [
    "base-context",
    "roads",
    "base-labels",
    "correct-route",
    "accepted-alternative-route",
    "attempted-route",
    "hints-next-road",
    "route-warnings",
    "checkpoint-markers",
    "start-destination-markers",
    "review-callouts",
    "selected-focus"
  ]);
  assert.ok(overlays.rawRoute.strokeWidth < 4);
  assert.ok((overlays.rawRoute.casingWidth ?? 0) <= 7);
  assert.ok((overlays.rawRoute.alpha ?? 1) < 0.9);
  assert.ok(overlays.shortestLegalRoute.strokeWidth < overlays.rawRoute.strokeWidth);
  assert.notEqual(overlays.shortestLegalRoute.strokeColor, overlays.rawRoute.strokeColor);
  assert.ok((overlays.shortestLegalRoute.dash?.length ?? 0) > 0);
  assert.ok(overlays.illegalMovement.strokeWidth > overlays.rawRoute.strokeWidth);
  assert.ok((overlays.illegalMovement.alpha ?? 0) > (overlays.rawRoute.alpha ?? 0));
  assert.notEqual(overlays.illegalMovement.strokeColor, overlays.inefficientSection.strokeColor);
  assert.ok(learner.hints.revealed.strokeWidth < overlays.rawRoute.strokeWidth);
  assert.ok((learner.hints.revealed.alpha ?? 1) <= (overlays.rawRoute.alpha ?? 1));
  assert.ok(routeIssue.markerRadius < learner.touchTargets.reviewIssueHitRadius);
  assert.ok(learner.markers.start.radius < learner.touchTargets.markerHitRadius);
  assert.ok(learner.markers.destination.radius < learner.touchTargets.markerHitRadius);
  assert.ok(learner.markers.requiredCheckpoint.radius < learner.touchTargets.checkpointHitRadius);
  assert.ok(learner.markers.start.asset!.displayWidth < learner.touchTargets.markerHitRadius * 2);
  assert.ok(learner.markers.destination.asset!.displayWidth < learner.touchTargets.markerHitRadius * 2);
});

test("Stage 142 tokenized renderer helpers preserve existing style values", () => {
  assert.deepEqual(roadStyleForOsmHierarchy("primary"), {
    casingColor: "#423d32",
    strokeColor: "#f3ce3f",
    casingWidth: 15.8,
    strokeWidth: 11.2
  });
  assert.deepEqual(roadStyleForSyntheticClass("restricted"), {
    casingColor: "#e2caa6",
    strokeColor: "#e9bd73",
    casingWidth: 9,
    strokeWidth: 4,
    dash: [9, 7],
    alpha: 0.72
  });
  assert.deepEqual(
    buildSyntheticRouteOverlayVisuals({
      rawRoutePoints: [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ],
      shortestLegalRoutePoints: [
        { x: 0, y: 4 },
        { x: 10, y: 4 }
      ]
    }),
    [
      {
        id: "raw-route",
        kind: "raw-route",
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ],
        strokeColor: "#f97316",
        strokeWidth: 3.5,
        casingColor: "rgba(255,255,255,0.68)",
        casingWidth: 7,
        alpha: 0.82
      },
      {
        id: "shortest-legal-route",
        kind: "shortest-legal-route",
        points: [
          { x: 0, y: 4 },
          { x: 10, y: 4 }
        ],
        strokeColor: "#0284c7",
        strokeWidth: 3.25,
        casingColor: "rgba(255,255,255,0.68)",
        casingWidth: 7,
        dash: [12, 8],
        alpha: 0.78
      }
    ]
  );
});

test("deriveSyntheticRoadClass applies hierarchy and restriction-safe classes", () => {
  const oneWayRoad = marloweDistrictMap.roads.find((road) => road.id === "r04");
  const noEntryRoad = marloweDistrictMap.roads.find((road) => road.id === "r12");
  const majorRoad = marloweDistrictMap.roads.find((road) => road.id === "r22");
  const serviceRoad = marloweDistrictMap.roads.find((road) => road.id === "r01");

  if (!oneWayRoad || !noEntryRoad || !majorRoad || !serviceRoad) {
    throw new Error("Expected Marlowe fixture roads.");
  }

  assert.equal(deriveSyntheticRoadClass(marloweDistrictMap, oneWayRoad), "one-way");
  assert.equal(deriveSyntheticRoadClass(marloweDistrictMap, noEntryRoad), "no-entry");
  assert.equal(deriveSyntheticRoadClass(marloweDistrictMap, majorRoad), "major");
  assert.equal(deriveSyntheticRoadClass(marloweDistrictMap, serviceRoad), "service");
});

test("deriveSyntheticRoadClass marks closed roads as renderer-only restricted roads", () => {
  const closedRoadMap: MapDefinition = {
    id: "closed-road-test",
    name: "Closed Road Test",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 10, y: 0 }
    ],
    roads: [
      {
        id: "closed-road",
        fromNodeId: "a",
        toNodeId: "b",
        distanceMeters: 10,
        isOneWay: false,
        name: "Closed Road"
      }
    ],
    restrictions: [{ id: "closed", type: "road_closed", roadId: "closed-road" }],
    landmarks: []
  };

  assert.equal(deriveSyntheticRoadClass(closedRoadMap, closedRoadMap.roads[0]), "restricted");
  assert.deepEqual(roadStyleForSyntheticClass("restricted").dash, [9, 7]);
});

test("buildSyntheticRoadVisuals creates deterministic road visual items", () => {
  const visuals = buildSyntheticRoadVisuals(marloweDistrictMap);
  const stationRow = visuals.find((visual) => visual.roadId === "r14");

  assert.equal(visuals.length, marloweDistrictMap.roads.length);
  assert.ok(stationRow);
  assert.equal(stationRow?.name, "Station Row");
  assert.equal(stationRow?.hasNoEntryRestriction, true);
  assert.equal(stationRow?.points.length, 2);
  assert.equal(typeof stationRow?.labelAngleRadians, "number");
});

test("deriveRoadLabelPosition returns road midpoint and angle", () => {
  const road = marloweDistrictMap.roads.find((candidate) => candidate.id === "r03");

  if (!road) {
    throw new Error("Expected road r03.");
  }

  const label = deriveRoadLabelPosition(marloweDistrictMap, road);

  assert.ok(label);
  assert.deepEqual(label?.point, { x: 320, y: 170 });
  assert.equal(label?.angleRadians, 0);
});

test("buildSyntheticMapLabels includes road area start checkpoint and finish labels", () => {
  const exercise = marloweDistrictRouteExercises.find((candidate) => candidate.id === "ex-library-market-museum");

  if (!exercise) {
    throw new Error("Expected checkpoint route exercise.");
  }

  const labels = buildSyntheticMapLabels(marloweDistrictMap, exercise);

  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Station Row"));
  assert.ok(labels.some((label) => label.kind === "area" && label.text === "Market Quarter"));
  assert.ok(labels.some((label) => label.kind === "station" && label.text === "Fox Lane Station"));
  assert.ok(labels.some((label) => label.kind === "start" && label.text === "START"));
  assert.ok(labels.some((label) => label.kind === "checkpoint" && label.text === "CHECKPOINT 1"));
  assert.ok(labels.some((label) => label.kind === "finish" && label.text === "DESTINATION"));
});

test("synthetic background features are visual only and do not overlap routable ids", () => {
  const features = buildSyntheticBackgroundFeatures(marloweDistrictMap);
  const routableIds = new Set([
    ...marloweDistrictMap.nodes.map((node) => node.id),
    ...marloweDistrictMap.roads.map((road) => road.id)
  ]);
  const labels = features.map((feature) => feature.label);

  assert.ok(features.length >= 7);
  assert.ok(features.some((feature) => feature.kind === "water"));
  assert.ok(features.some((feature) => feature.kind === "park"));
  assert.ok(labels.includes("Station Quarter"));
  assert.ok(labels.includes("Canal Basin"));
  assert.ok(labels.includes("Goods Yard"));
  assert.ok(labels.includes("Civic Quarter"));
  assert.ok(features.every((feature) => feature.routable === false));
  assert.ok(features.every((feature) => !routableIds.has(feature.id)));
});

test("Stage 8.6 consumes typed building institution land-use park and water polygons deterministically", () => {
  const fixture: OverpassJsonResponse = {
    elements: [
      { type: "node", id: 1, lat: 51.52, lon: -0.14 },
      { type: "node", id: 2, lat: 51.52, lon: -0.139 },
      { type: "node", id: 3, lat: 51.521, lon: -0.139 },
      { type: "node", id: 4, lat: 51.521, lon: -0.14 },
      { type: "node", id: 5, lat: 51.5204, lon: -0.1396 },
      { type: "node", id: 6, lat: 51.5204, lon: -0.1394 },
      { type: "node", id: 7, lat: 51.5206, lon: -0.1394 },
      { type: "node", id: 8, lat: 51.5206, lon: -0.1396 },
      { type: "way", id: 10, nodes: [1, 2], tags: { highway: "residential", name: "Atlas Road" } },
      { type: "way", id: 100, nodes: [1, 2, 3, 4, 1], tags: { building: "apartments" } },
      { type: "way", id: 101, nodes: [1, 2, 3, 4, 1], tags: { building: "office" } },
      { type: "way", id: 102, nodes: [1, 2, 3, 4, 1], tags: { building: "retail" } },
      { type: "way", id: 103, nodes: [1, 2, 3, 4, 1], tags: { building: "industrial" } },
      { type: "way", id: 104, nodes: [1, 2, 3, 4, 1], tags: { building: "school", amenity: "school" } },
      { type: "way", id: 105, nodes: [1, 2, 3, 4, 1], tags: { building: "hospital", healthcare: "hospital" } },
      { type: "way", id: 106, nodes: [1, 2, 3, 4, 1], tags: { building: "civic", amenity: "townhall" } },
      { type: "way", id: 107, nodes: [1, 2, 3, 4, 1], tags: { building: "church", amenity: "place_of_worship" } },
      { type: "way", id: 108, nodes: [1, 2, 3, 4, 1], tags: { building: "yes" } },
      { type: "way", id: 200, nodes: [1, 2, 3, 4, 1], tags: { landuse: "residential" } },
      { type: "way", id: 201, nodes: [1, 2, 3, 4, 1], tags: { landuse: "commercial" } },
      { type: "way", id: 202, nodes: [1, 2, 3, 4, 1], tags: { landuse: "retail" } },
      { type: "way", id: 203, nodes: [1, 2, 3, 4, 1], tags: { landuse: "industrial" } },
      { type: "way", id: 300, nodes: [1, 2, 3, 4, 1], tags: { leisure: "garden", name: "Atlas Garden" } },
      { type: "way", id: 301, nodes: [1, 2, 3, 4, 1], tags: { natural: "water", name: "Atlas Basin" } },
      { type: "way", id: 400, nodes: [1, 2, 3], tags: { building: "yes" } },
      { type: "way", id: 401, nodes: [1, 1, 1, 1], tags: { building: "yes" } },
      { type: "way", id: 500, nodes: [1, 2, 3, 4, 1] },
      { type: "way", id: 501, nodes: [5, 6, 7, 8, 5] },
      {
        type: "relation",
        id: 600,
        members: [
          { type: "way", ref: 500, role: "outer" },
          { type: "way", ref: 501, role: "inner" }
        ],
        tags: { type: "multipolygon", building: "apartments", name: "Courtyard Building" }
      }
    ]
  };
  const fixtureBefore = structuredClone(fixture);
  const converted = convertOverpassJsonToRouteMap(fixture, {
    mapId: "stage-8-6-context-test",
    name: "Stage 8.6 Context Test"
  });

  assert.equal(converted.ok, true);

  if (!converted.ok) {
    return;
  }

  const first = buildSyntheticBackgroundFeatures(converted.map, { sourceOverpassFixture: fixture });
  const second = buildSyntheticBackgroundFeatures(converted.map, { sourceOverpassFixture: fixture });
  const buildings = first.filter((feature) => feature.kind === "building");
  const institutions = first.filter((feature) => feature.kind === "institution");
  const landUse = first.filter((feature) => feature.kind === "land-use");
  const courtyard = buildings.find((feature) => feature.sourceMetadata?.sourceElementId === 600);

  assert.deepEqual(second, first);
  assert.deepEqual(fixture, fixtureBefore);
  assert.deepEqual(new Set(buildings.map((feature) => feature.subtype)), new Set([
    "residential",
    "commercial",
    "retail",
    "industrial",
    "education",
    "healthcare",
    "civic",
    "religious",
    "other"
  ]));
  assert.deepEqual(new Set(institutions.map((feature) => feature.subtype)), new Set([
    "education",
    "healthcare",
    "civic",
    "religious"
  ]));
  assert.deepEqual(new Set(landUse.map((feature) => feature.subtype)), new Set([
    "residential",
    "commercial",
    "retail",
    "industrial"
  ]));
  assert.ok(first.some((feature) => feature.kind === "park"));
  assert.ok(first.some((feature) => feature.kind === "water"));
  assert.equal(buildings.some((feature) => feature.sourceMetadata?.sourceElementId === 401), false);
  assert.equal(courtyard?.innerRings?.length, 1);
  assert.equal(courtyard?.sourceMetadata?.sourceFeatureId, "building-relation-600-ring-1");
  assert.equal(courtyard?.sourceMetadata?.sourceElementType, "relation");
  assert.deepEqual(courtyard?.sourceMetadata?.sourceTags, fixture.elements.at(-1)?.tags);
});

test("Stage 8.6 area styles layer order and semantic viewport filtering are bounded", () => {
  const background = TOPOPASS_STREET_ATLAS_STYLE.background;
  const records = [background.landUse, background.institution, background.building];

  assert.deepEqual(background.layerOrder, ["land-use", "parks-water", "institution", "building", "pedestrian-area"]);
  assert.equal(Object.keys(background.building).length, 9);
  assert.equal(Object.keys(background.institution).length, 4);
  assert.equal(Object.keys(background.landUse).length, 4);
  records.forEach((record) => Object.values(record).forEach((style) => assertPrimitiveRenderValues(style)));

  const features = sortSyntheticBackgroundFeaturesForRender([
    { id: "building", kind: "building", subtype: "other", renderLayer: "building", points: [], fillColor: "#fff", strokeColor: "#000", routable: false },
    { id: "park", kind: "park", renderLayer: "parks-water", points: [], fillColor: "#fff", strokeColor: "#000", routable: false },
    { id: "institution", kind: "institution", subtype: "civic", renderLayer: "institution", points: [], fillColor: "#fff", strokeColor: "#000", routable: false },
    { id: "land-use", kind: "land-use", subtype: "residential", renderLayer: "land-use", points: [], fillColor: "#fff", strokeColor: "#000", routable: false }
  ]);
  const lowViewport = { width: 300, height: 300, mapBounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 } };
  const highViewport = { width: 1000, height: 1000, mapBounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
  const styledBuilding = syntheticBackgroundFeatureStyleForViewport(features.at(-1)!, highViewport);
  const offscreenPark = {
    ...features[1],
    id: "offscreen-park",
    sourceBounds: { minX: 2000, minY: 2000, maxX: 2100, maxY: 2100 },
    sourceAreaSquareMeters: 10000
  };

  assert.deepEqual(features.map((feature) => feature.id), ["land-use", "park", "institution", "building"]);
  assert.deepEqual(
    filterSyntheticBackgroundFeaturesForViewport(features, lowViewport).map((feature) => feature.id),
    ["land-use", "park", "institution", "building"]
  );
  assert.ok(styledBuilding.alpha >= 0 && styledBuilding.alpha <= 1);
  assert.ok(styledBuilding.strokeWidth <= background.building.other.maxStrokeWidth);
  assert.deepEqual(filterSyntheticBackgroundFeaturesForViewport([offscreenPark], highViewport), []);
});

test("Stage 8.6 production draw stack keeps context fabric below roads labels restrictions and learner overlays", () => {
  const source = readFileSync("app/dev/route-runner/RouteRunnerClient.tsx", "utf8");
  const baseStart = source.indexOf("function drawSyntheticStreetMapBase");
  const canvasStart = source.indexOf("function drawRouteCanvas");
  const canvasEnd = source.indexOf("function createViewport", canvasStart);
  const baseSource = source.slice(baseStart, canvasStart);
  const canvasSource = source.slice(canvasStart, canvasEnd);

  assert.ok(baseStart >= 0 && canvasStart > baseStart);
  assert.ok(baseSource.indexOf("filterSyntheticBackgroundFeaturesForViewport") < baseSource.indexOf("input.linearFeatures"));
  assert.ok(baseSource.indexOf("input.linearFeatures") < baseSource.indexOf("drawSyntheticRoadVisualsByHierarchy"));
  assert.ok(baseSource.indexOf("drawSyntheticRoadVisualsByHierarchy") < baseSource.indexOf("filterSyntheticMapLabelsForViewport"));
  assert.ok(canvasSource.indexOf("drawSyntheticStreetMapBase") < canvasSource.indexOf("input.roadRestrictionOverlays"));
  assert.ok(
    canvasSource.indexOf("input.roadRestrictionOverlays") <
      canvasSource.indexOf("drawLearnerTrainingCorrectRouteOverlay")
  );
  assert.ok(baseSource.indexOf("input.linearFeatures") < baseSource.indexOf("filterSyntheticMapLabelsForViewport"));
});

test("Stage 8.6 does not fabricate context polygons when source area data is absent", () => {
  const fixture: OverpassJsonResponse = {
    elements: [
      { type: "node", id: 1, lat: 51.52, lon: -0.14 },
      { type: "node", id: 2, lat: 51.5201, lon: -0.1398 },
      { type: "way", id: 10, nodes: [1, 2], tags: { highway: "residential", name: "Only Road" } }
    ]
  };
  const converted = convertOverpassJsonToRouteMap(fixture, { mapId: "stage-8-6-no-context", name: "No Context" });

  assert.equal(converted.ok, true);
  assert.deepEqual(
    converted.ok ? buildSyntheticBackgroundFeatures(converted.map, { sourceOverpassFixture: fixture }) : [],
    []
  );
});

test("synthetic road styling keeps a clear London-inspired hierarchy", () => {
  const majorStyle = roadStyleForSyntheticClass("major");
  const localStyle = roadStyleForSyntheticClass("local");
  const serviceStyle = roadStyleForSyntheticClass("service");
  const oneWayStyle = roadStyleForSyntheticClass("one-way");

  assert.ok(majorStyle.casingWidth > localStyle.casingWidth);
  assert.ok(localStyle.strokeWidth > serviceStyle.strokeWidth);
  assert.equal(oneWayStyle.strokeColor, "#7fa9c6");
});

test("converted OSM road visuals expose deterministic hierarchy metadata", () => {
  const visuals = buildSyntheticRoadVisuals(mediumLondonOsmRouteMap);
  const eustonRoad = visuals.find((visual) => visual.name === "Euston Road");
  const storeStreet = visuals.find((visual) => visual.name === "Store Street");

  assert.ok(eustonRoad);
  assert.ok(storeStreet);
  assert.equal(eustonRoad.source, "osm");
  assert.equal(eustonRoad.osmHighway, "primary");
  assert.equal(eustonRoad.osmHierarchy, "primary");
  assert.equal(eustonRoad.roadClass, "major");
  assert.equal(storeStreet.osmHighway, "service");
  assert.equal(storeStreet.osmHierarchy, "service");
  assert.ok(eustonRoad.style.strokeWidth > storeStreet.style.strokeWidth);
});

test("converted OSM hierarchy maps to expected road style widths", () => {
  assert.ok(roadStyleForOsmHierarchy("primary").strokeWidth > roadStyleForOsmHierarchy("secondary").strokeWidth);
  assert.ok(roadStyleForOsmHierarchy("secondary").strokeWidth > roadStyleForOsmHierarchy("tertiary").strokeWidth);
  assert.ok(roadStyleForOsmHierarchy("tertiary").strokeWidth > roadStyleForOsmHierarchy("residential").strokeWidth);
  assert.ok(roadStyleForOsmHierarchy("residential").strokeWidth > roadStyleForOsmHierarchy("service").strokeWidth);
  assert.ok(roadStyleForOsmHierarchy("service").strokeWidth > roadStyleForOsmHierarchy("pedestrian").strokeWidth);
  assert.ok((roadStyleForOsmHierarchy("inactive").alpha ?? 1) < (roadStyleForOsmHierarchy("residential").alpha ?? 1));
});

test("Stage 8.4 printed-atlas tokens define dark-edged flat-yellow principal corridors", () => {
  const primary = roadStyleForOsmHierarchy("primary");
  const secondary = roadStyleForOsmHierarchy("secondary");
  const tertiary = roadStyleForOsmHierarchy("tertiary");
  const residential = roadStyleForOsmHierarchy("residential");
  const service = roadStyleForOsmHierarchy("service");

  assert.equal(primary.casingColor, "#423d32");
  assert.equal(primary.strokeColor, "#f3ce3f");
  assert.ok(primary.casingWidth > primary.strokeWidth);
  assert.ok((primary.casingWidth - primary.strokeWidth) / 2 >= 2);
  assert.ok(primary.strokeWidth > secondary.strokeWidth);
  assert.ok(secondary.strokeWidth > tertiary.strokeWidth);
  assert.ok(tertiary.strokeWidth > residential.strokeWidth);
  assert.ok(residential.strokeWidth > service.strokeWidth);
  assert.notEqual(residential.strokeColor, primary.strokeColor);
  assert.notEqual(service.strokeColor, primary.strokeColor);
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.roads.geometry.lineCap, "butt");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.roads.geometry.lineJoin, "round");
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.roads.geometry.miterLimit <= 2);
});

function mapNodeBounds(map: MapDefinition): { minX: number; minY: number; maxX: number; maxY: number } {
  return map.nodes.reduce(
    (bounds, node) => ({
      minX: Math.min(bounds.minX, node.x),
      minY: Math.min(bounds.minY, node.y),
      maxX: Math.max(bounds.maxX, node.x),
      maxY: Math.max(bounds.maxY, node.y)
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY
    }
  );
}

function insetViewportForMap(map: MapDefinition, fraction: number) {
  const bounds = mapNodeBounds(map);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const width = (bounds.maxX - bounds.minX) * fraction;
  const height = (bounds.maxY - bounds.minY) * fraction;

  return {
    width: 430,
    height: 620,
    mapBounds: {
      minX: centerX - width / 2,
      minY: centerY - height / 2,
      maxX: centerX + width / 2,
      maxY: centerY + height / 2
    }
  };
}

test("Stage 161 curated London fixtures expose atlas-style labels hierarchy and context at learner zoom", () => {
  const minimumVisibleRoadLabelsByMapId = new Map([
    ["osm-curated-piccadilly-circus", 2],
    ["osm-curated-waterloo-bridge", 1],
    ["osm-curated-one-way-system-area", 8],
    ["osm-curated-quiet-residential-roads", 13],
    ["osm-curated-kings-cross-euston", 1]
  ]);
  const minimumVisibleLandmarksByMapId = new Map([
    ["osm-curated-kings-cross-euston", 0]
  ]);
  const minimumVisibleContextLabelsByMapId = new Map([
    ["osm-curated-waterloo-bridge", 0]
  ]);

  const routableRenderOptions = [
    ...CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS.filter(
      (candidate) => candidate.fixtureUse === "routableExercise" && !candidate.lazyLoadId
    ),
    kingsCrossEustonOsmRouteRunnerMapOption
  ];

  for (const option of routableRenderOptions) {
    const roadVisuals = buildSyntheticRoadVisuals(option.map);
    const backgroundFeatures = buildSyntheticBackgroundFeatures(option.map, {
      sourceOverpassFixture: option.sourceOverpassFixture
    });
    const linearFeatures = buildSyntheticLinearFeatures(option.map, {
      sourceOverpassFixture: option.sourceOverpassFixture
    });
    const landmarkVisuals = buildSyntheticLandmarkVisuals(option.map, option.exercises[0], {
      sourceOverpassFixture: option.sourceOverpassFixture
    });
    const labels = buildSyntheticMapLabels(option.map, option.exercises[0], {
      includeOsmRoadLabels: true,
      backgroundFeatures,
      linearFeatures,
      sourceOverpassFixture: option.sourceOverpassFixture
    });
    const learnerViewport = insetViewportForMap(option.map, 0.18);
    const overviewViewport = {
      width: 390,
      height: 620,
      mapBounds: mapNodeBounds(option.map)
    };
    const learnerLabels = filterSyntheticMapLabelsForViewport({ labels, viewport: learnerViewport });
    const overviewLabels = filterSyntheticMapLabelsForViewport({ labels, viewport: overviewViewport });
    const visibleLandmarks = filterSyntheticLandmarkVisualsForViewport({
      visuals: landmarkVisuals,
      viewport: learnerViewport
    });

    assert.ok(roadVisuals.some((visual) => visual.osmHierarchy === "primary"), option.id);
    assert.ok(roadVisuals.some((visual) => visual.osmHierarchy === "residential"), option.id);
    assert.ok(backgroundFeatures.length > 0, option.id);
    assert.ok(linearFeatures.length > 0, option.id);
    assert.ok(visibleLandmarks.length >= (minimumVisibleLandmarksByMapId.get(option.id) ?? 1), option.id);
    assert.ok(
      learnerLabels.filter((label) => label.kind === "road").length >=
        (minimumVisibleRoadLabelsByMapId.get(option.id) ?? 1),
      option.id
    );
    assert.ok(
      learnerLabels.filter((label) => label.kind !== "road").length >=
        (minimumVisibleContextLabelsByMapId.get(option.id) ?? 1),
      option.id
    );
    const overviewRoadLabelCount = overviewLabels.filter((label) => label.kind === "road").length;
    assert.ok(overviewRoadLabelCount <= 18, `${option.id}: overview road labels=${overviewRoadLabelCount}`);
  }
});

test("Stage 161.6.26 beta default fit keeps sparse real maps readable without invented labels", () => {
  const expectedByMapId = new Map([
    ["osm-curated-piccadilly-circus", { roadLabels: 10, contextLabels: 1 }],
    ["osm-curated-waterloo-bridge", { roadLabels: 10, contextLabels: 3 }],
    ["osm-curated-one-way-system-area", { roadLabels: 9, contextLabels: 3 }],
    ["osm-curated-quiet-residential-roads", { roadLabels: 8, contextLabels: 3 }]
  ]);
  const contextKinds = new Set([
    "road_reference",
    "district",
    "institution",
    "land_use",
    "area",
    "park",
    "water",
    "station",
    "landmark",
    "public_building",
    "open_space",
    "learner_reference",
    "bridge"
  ]);

  for (const option of CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS.filter(
    (candidate) => candidate.fixtureUse === "routableExercise" && !candidate.lazyLoadId
  )) {
    const backgroundFeatures = buildSyntheticBackgroundFeatures(option.map, {
      sourceOverpassFixture: option.sourceOverpassFixture
    });
    const linearFeatures = buildSyntheticLinearFeatures(option.map, {
      sourceOverpassFixture: option.sourceOverpassFixture
    });
    const labels = buildSyntheticMapLabels(option.map, option.exercises[0], {
      includeOsmRoadLabels: true,
      backgroundFeatures,
      linearFeatures,
      sourceOverpassFixture: option.sourceOverpassFixture
    });
    const defaultBetaViewport = {
      width: 1920,
      height: 912,
      mapBounds: getRouteRunnerMapViewportBounds(option.map, 1920, 912)
    };
    const visibleLabels = filterSyntheticMapLabelsForViewport({
      labels,
      viewport: defaultBetaViewport,
      currentZoom: 1
    });
    const roadLabels = visibleLabels.filter((label) => label.kind === "road");
    const contextLabels = visibleLabels.filter((label) => contextKinds.has(label.kind));
    const expected = expectedByMapId.get(option.id);

    assert.ok(expected, option.id);
    assert.ok(roadLabels.length >= expected.roadLabels, `${option.id} road labels: ${roadLabels.length}`);
    assert.ok(contextLabels.length >= expected.contextLabels, `${option.id} context labels: ${contextLabels.length}`);
    assert.ok(roadLabels.every((label) => !/^osm-|^\\d+$/.test(label.text)), option.id);
    assert.ok(contextLabels.every((label) => !/^osm-|^\\d+$/.test(label.text)), option.id);
    assert.ok(backgroundFeatures.length > 0 || linearFeatures.length > 0, option.id);
  }

  const pilotOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(pilotOption);

  const pilotLabels = buildSyntheticMapLabels(pilotOption.map, pilotOption.exercises[0], {
    includeOsmRoadLabels: true,
    sourceOverpassFixture: pilotOption.sourceOverpassFixture
  });
  const pilotViewport = {
    width: 1920,
    height: 912,
    mapBounds: getRouteRunnerMapViewportBounds(pilotOption.map, 1920, 912)
  };
  const visiblePilotLabels = filterSyntheticMapLabelsForViewport({
    labels: pilotLabels,
    viewport: pilotViewport,
    currentZoom: 1
  });

  assert.ok(visiblePilotLabels.filter((label) => label.kind === "road").length >= 8);
  assert.equal(
    visiblePilotLabels.some((label) => contextKinds.has(label.kind)),
    true,
    "Real London pilot should expose its committed OSM road references"
  );
});

test("Stage 161.6.26 one-way fixture shows learner restriction symbols at default beta fit", () => {
  const option = CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS.find(
    (candidate) => candidate.id === "osm-curated-one-way-system-area"
  );

  assert.ok(option);

  const defaultBetaViewport = {
    width: 1920,
    height: 912,
    mapBounds: getRouteRunnerMapViewportBounds(option.map, 1920, 912)
  };
  const items = buildRestrictionMapVisualItems({
    roadRestrictionOverlays: buildRoadRestrictionOverlays(option.map),
    turnRestrictionVisuals: getTurnRestrictionVisuals(option.map),
    routeIssueOverlays: [],
    viewport: defaultBetaViewport
  });
  const visibleItems = filterRestrictionMapVisualItemsForViewport(items, defaultBetaViewport, { currentZoom: 1 });

  assert.ok(visibleItems.some((item) => item.kind === "one-way"), "Expected default-fit one-way arrows");
  assert.ok(items.every((item) => item.kind === "one-way"), "This fixture should not invent turn/no-entry symbols");
  assert.ok(visibleItems.length >= 3, `Expected several decluttered one-way arrows, got ${visibleItems.length}`);
  assert.ok(visibleItems.length <= 24, `Restriction budget exceeded: ${visibleItems.length}`);
});

test("Stage 161 Waterloo fixture keeps Thames bridge context and key road labels readable", () => {
  const option = CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS.find(
    (candidate) => candidate.id === "osm-curated-waterloo-bridge"
  );

  assert.ok(option);

  const backgroundFeatures = buildSyntheticBackgroundFeatures(option.map, {
    sourceOverpassFixture: option.sourceOverpassFixture
  });
  const linearFeatures = buildSyntheticLinearFeatures(option.map, {
    sourceOverpassFixture: option.sourceOverpassFixture
  });
  const labels = buildSyntheticMapLabels(option.map, option.exercises[0], {
    includeOsmRoadLabels: true,
    backgroundFeatures,
    linearFeatures,
    sourceOverpassFixture: option.sourceOverpassFixture
  });
  const roadLabels = new Set(labels.filter((label) => label.kind === "road").map((label) => label.text));
  const bridgeLabels = new Set(linearFeatures.filter((feature) => feature.kind === "bridge").map((feature) => feature.label));
  const contextLabels = new Set(labels.filter((label) => label.kind !== "road").map((label) => label.text));
  const waterFeatures = backgroundFeatures.filter((feature) => feature.kind === "water");
  const waterwayFeatures = linearFeatures.filter((feature) => feature.kind === "waterway");
  const thamesRelationWaterFeatures = waterFeatures.filter((feature) =>
    feature.id.startsWith("osm-context-water-relation-28934-ring-")
  );
  const thameslinkLabels = labels.filter((label) => label.text === "Thameslink");

  assert.ok(waterFeatures.length > 0, "Waterloo fixture should render Thames water polygons");
  assert.ok(thamesRelationWaterFeatures.length > 0, "Waterloo fixture should render the Thames multipolygon relation");
  assert.ok(
    waterwayFeatures.some((feature) => feature.strokeWidth >= 8),
    "Thames waterway corridor should remain visible without overpowering the filled river"
  );
  assert.notEqual(
    TOPOPASS_STREET_ATLAS_STYLE.background.water.river.fillColor,
    TOPOPASS_STREET_ATLAS_STYLE.background.water.basin.fillColor
  );
  assert.ok(contextLabels.has("River Thames"), "Waterloo fixture should label the Thames context");
  assert.ok(bridgeLabels.has("Waterloo Bridge"));
  assert.ok(bridgeLabels.has("Blackfriars Bridge"));
  assert.ok(thameslinkLabels.length <= 1, "Repeated rail labels should be deduplicated");
  assert.notEqual(
    TOPOPASS_STREET_ATLAS_STYLE.roads.osm.primary.strokeColor,
    TOPOPASS_STREET_ATLAS_STYLE.routeOverlays.matchedRoute.strokeColor
  );
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.roads.osm.residential.strokeWidth >= 4);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.roads.geometry.minorLowZoomAlphaMultiplier >= 0.9);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.rail.mediumZoomAlpha <= 0.3);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.haloRadiusPadding <= 5);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.haloRadiusPadding <= 5);

  for (const label of [
    "Victoria Embankment",
    "Strand",
    "Stamford Street",
    "Upper Thames Street",
    "Southwark Street",
    "Waterloo Bridge",
    "Blackfriars Bridge"
  ]) {
    assert.ok(roadLabels.has(label), label);
  }
});

test("Stage 144 road hierarchy ranks base roads below learner overlays", () => {
  assert.ok(roadRenderRank({ roadClass: "service", osmHierarchy: "service" }) < roadRenderRank({ roadClass: "local" }));
  assert.ok(roadRenderRank({ roadClass: "local", osmHierarchy: "residential" }) < roadRenderRank({ roadClass: "secondary", osmHierarchy: "tertiary" }));
  assert.ok(roadRenderRank({ roadClass: "secondary", osmHierarchy: "tertiary" }) < roadRenderRank({ roadClass: "secondary", osmHierarchy: "secondary" }));
  assert.ok(roadRenderRank({ roadClass: "secondary", osmHierarchy: "secondary" }) < roadRenderRank({ roadClass: "major", osmHierarchy: "primary" }));

  assert.deepEqual(
    buildSyntheticRouteOverlayVisuals({
      matchedRoutePoints: [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ]
    }).map((overlay) => overlay.kind),
    ["matched-route"]
  );
});

test("Stage 144 road visual sorting draws quieter roads before major roads", () => {
  const visuals = buildSyntheticRoadVisuals(mediumLondonOsmRouteMap);
  const ordered = sortRoadVisualsForBaseRender(visuals);
  const primaryIndex = ordered.findIndex((visual) => visual.osmHierarchy === "primary");
  const serviceIndex = ordered.findIndex((visual) => visual.osmHierarchy === "service");

  assert.ok(primaryIndex >= 0);
  assert.ok(serviceIndex >= 0);
  assert.ok(serviceIndex < primaryIndex);
});

function roadVisual(overrides: Partial<SyntheticRoadVisual>): SyntheticRoadVisual {
  return {
    roadId: "road",
    name: "Road",
    roadClass: "local",
    source: "osm",
    osmHighway: "residential",
    osmHierarchy: "residential",
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 }
    ],
    midpoint: { x: 50, y: 0 },
    labelAngleRadians: 0,
    isOneWay: false,
    hasNoEntryRestriction: false,
    hasRoadClosedRestriction: false,
    style: roadStyleForOsmHierarchy("residential"),
    ...overrides
  };
}

const lowZoomRoadViewport = {
  width: 160,
  height: 160,
  mapBounds: {
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 1000
  }
};

const highZoomRoadViewport = {
  width: 1200,
  height: 1200,
  mapBounds: {
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 1000
  }
};

const veryHighZoomRoadViewport = {
  width: 10000,
  height: 10000,
  mapBounds: {
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 1000
  }
};

test("Stage 145.5 road render passes keep all casings below all fills in hierarchy order", () => {
  const visuals = buildSyntheticRoadVisuals(mediumLondonOsmRouteMap);
  const ordered = sortRoadVisualsForBaseRender(visuals);
  const passes = buildRoadRenderPasses(visuals);

  assert.equal(passes.length, visuals.length * 2);
  assert.deepEqual(passes.slice(0, visuals.length).map((pass) => pass.layer), ordered.map(() => "casing"));
  assert.deepEqual(passes.slice(visuals.length).map((pass) => pass.layer), ordered.map(() => "fill"));
  assert.deepEqual(passes.slice(0, visuals.length).map((pass) => pass.visual.roadId), ordered.map((visual) => visual.roadId));
});

test("Stage 8.4 split OSM corridor segments retain shared hierarchy and continuity metadata", () => {
  const mapBefore = structuredClone(mediumLondonOsmRouteMap);
  const visuals = buildSyntheticRoadVisuals(mediumLondonOsmRouteMap);
  const segmentsByWay = new Map<string, SyntheticRoadVisual[]>();

  for (const visual of visuals) {
    if (!visual.osmWayId) {
      continue;
    }

    const segments = segmentsByWay.get(visual.osmWayId) ?? [];
    segments.push(visual);
    segmentsByWay.set(visual.osmWayId, segments);
  }

  const corridor = [...segmentsByWay.values()].find(
    (segments) => segments.length > 1 && segments.every((segment) => segment.osmHierarchy === "primary")
  );

  assert.ok(corridor);
  assert.ok(corridor.every((segment) => segment.roadClass === "major"));
  assert.ok(corridor.every((segment) => segment.osmWayId === corridor[0].osmWayId));
  assert.ok(corridor.every((segment) => JSON.stringify(segment.style) === JSON.stringify(corridor[0].style)));
  assert.deepEqual(mediumLondonOsmRouteMap, mapBefore);
});

test("Stage 145.5 low-zoom road styling thins minor roads without weakening major roads", () => {
  const primary = roadVisual({
    roadClass: "major",
    osmHighway: "primary",
    osmHierarchy: "primary",
    style: roadStyleForOsmHierarchy("primary")
  });
  const residential = roadVisual({
    roadClass: "local",
    osmHierarchy: "residential",
    style: roadStyleForOsmHierarchy("residential")
  });
  const service = roadVisual({
    roadClass: "service",
    osmHighway: "service",
    osmHierarchy: "service",
    style: roadStyleForOsmHierarchy("service")
  });

  assert.deepEqual(roadStyleForViewport(primary, lowZoomRoadViewport), primary.style);
  assert.ok(roadStyleForViewport(residential, lowZoomRoadViewport).strokeWidth < residential.style.strokeWidth);
  assert.ok((roadStyleForViewport(residential, lowZoomRoadViewport).alpha ?? 1) < (residential.style.alpha ?? 1));
  assert.ok(roadStyleForViewport(service, lowZoomRoadViewport).strokeWidth < roadStyleForViewport(residential, lowZoomRoadViewport).strokeWidth);
});

test("Stage 147 high zoom restores residential road detail", () => {
  const residential = roadVisual({
    roadClass: "local",
    osmHierarchy: "residential",
    style: roadStyleForOsmHierarchy("residential")
  });

  assert.ok(roadStyleForViewport(residential, lowZoomRoadViewport).strokeWidth < residential.style.strokeWidth);
  assert.ok(roadStyleForViewport(residential, highZoomRoadViewport).strokeWidth >= residential.style.strokeWidth);
});

test("Stage 161.6.9 road strokes scale with zoom while preserving base hierarchy", () => {
  const primary = roadVisual({
    roadClass: "major",
    osmHighway: "primary",
    osmHierarchy: "primary",
    style: roadStyleForOsmHierarchy("primary")
  });
  const residential = roadVisual({
    roadClass: "local",
    osmHierarchy: "residential",
    style: roadStyleForOsmHierarchy("residential")
  });
  const service = roadVisual({
    roadClass: "service",
    osmHighway: "service",
    osmHierarchy: "service",
    style: roadStyleForOsmHierarchy("service")
  });
  const primaryHigh = roadStyleForViewport(primary, veryHighZoomRoadViewport);
  const residentialHigh = roadStyleForViewport(residential, veryHighZoomRoadViewport);
  const serviceHigh = roadStyleForViewport(service, veryHighZoomRoadViewport);

  assert.equal(roadStyleForViewport(primary, lowZoomRoadViewport).strokeWidth, primary.style.strokeWidth);
  assert.ok(primaryHigh.strokeWidth > primary.style.strokeWidth * 3);
  assert.ok(residentialHigh.strokeWidth > residential.style.strokeWidth * 2.4);
  assert.ok(serviceHigh.strokeWidth > service.style.strokeWidth * 1.9);
  assert.ok(serviceHigh.strokeWidth < residentialHigh.strokeWidth);
  assert.ok(primaryHigh.strokeWidth > residentialHigh.strokeWidth);
  assert.ok(residentialHigh.casingWidth > residential.style.casingWidth);
});

test("Stage 161.6.8.2 explicit semantic zoom scales rendered roads strongly when viewport bounds are unchanged", () => {
  const primary = roadVisual({
    roadClass: "major",
    osmHighway: "primary",
    osmHierarchy: "primary",
    style: roadStyleForOsmHierarchy("primary")
  });
  const residential = roadVisual({
    roadClass: "local",
    osmHierarchy: "residential",
    style: roadStyleForOsmHierarchy("residential")
  });
  const service = roadVisual({
    roadClass: "service",
    osmHighway: "service",
    osmHierarchy: "service",
    style: roadStyleForOsmHierarchy("service")
  });
  const basePrimary = roadStyleForViewport(primary, labelTestViewport, 1);
  const highPrimary = roadStyleForViewport(primary, labelTestViewport, ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom);
  const baseResidential = roadStyleForViewport(residential, labelTestViewport, 1);
  const highResidential = roadStyleForViewport(residential, labelTestViewport, ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom);
  const baseService = roadStyleForViewport(service, labelTestViewport, 1);
  const highService = roadStyleForViewport(service, labelTestViewport, ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom);
  const maxedResidential = roadStyleForViewport(residential, labelTestViewport, ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom * 10);

  assertClose(highPrimary.strokeWidth / basePrimary.strokeWidth, 6.5, 0.000001, "primary road should render at the 6.5x cap");
  assertClose(
    highResidential.strokeWidth / baseResidential.strokeWidth,
    4.5,
    0.000001,
    "local road should render at the 4.5x cap"
  );
  assertClose(highResidential.casingWidth / baseResidential.casingWidth, 4.5, 0.000001, "local casing should follow stroke scale");
  assertClose(highService.strokeWidth / baseService.strokeWidth, 3.2, 0.000001, "service road should render at the lower 3.2x cap");
  assert.ok(highService.strokeWidth < highResidential.strokeWidth);
  assert.equal(maxedResidential.strokeWidth, highResidential.strokeWidth);
  assert.ok(highPrimary.strokeWidth / basePrimary.strokeWidth > highResidential.strokeWidth / baseResidential.strokeWidth);
});

test("Stage 161.6.8.2 zoom style scale follows stronger capped TOPOPASS cartography tokens", () => {
  const base = cartographicStyleScaleForZoom(1);
  const zoom250 = cartographicStyleScaleForZoom(2.5);
  const zoom500 = cartographicStyleScaleForZoom(5);
  const zoom1000 = cartographicStyleScaleForZoom(10);
  const zoom2500 = cartographicStyleScaleForZoom(25);
  const max = cartographicStyleScaleForZoom(ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom);
  const beyondMax = cartographicStyleScaleForZoom(ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom * 10);
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;

  assert.equal(base.localRoad, 1);
  assertClose(getZoomStyleScale(1, scaleTokens.roadGain.local, scaleTokens.roadMaxMultiplier.local), 1, 0.000001, "1x road scale");
  assertClose(zoom250.localRoad, 1.43, 0.04, "250 percent road scale");
  assertClose(zoom500.localRoad, 1.87, 0.05, "500 percent road scale");
  assertClose(zoom1000.localRoad, 2.45, 0.06, "1000 percent road scale");
  assertClose(zoom2500.localRoad, 3.51, 0.08, "2500 percent road scale");
  assert.equal(max.localRoad, scaleTokens.roadMaxMultiplier.local);
  assert.equal(max.majorRoad, scaleTokens.roadMaxMultiplier.major);
  assert.equal(beyondMax.localRoad, max.localRoad);
  assert.equal(max.serviceRoad, scaleTokens.roadMaxMultiplier.service);
  assert.ok(max.serviceRoad <= scaleTokens.roadMaxMultiplier.service);
  assert.ok(max.serviceRoad < max.localRoad);
  assert.equal(max.majorLabel, scaleTokens.labelMaxMultiplier.major);
  assert.equal(max.minorLabel, scaleTokens.labelMaxMultiplier.minor);
  assert.ok(max.majorLabel >= 8);
  assert.ok(max.majorLabel <= scaleTokens.labelMaxMultiplier.major);
  assert.ok(max.routeOverlay <= scaleTokens.correctRouteMaxMultiplier);
  assert.equal(max.routeOverlay, cartographicRouteOverlayScaleForZoom(ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom));
  assert.equal(max.drawnAttempt, scaleTokens.drawnAttemptMaxMultiplier);
  assert.ok(max.correctRoute <= scaleTokens.correctRouteMaxMultiplier);
  assert.ok(max.mistakeOverlay <= scaleTokens.mistakeOverlayMaxMultiplier);
  assert.ok(max.reviewText <= scaleTokens.reviewTextMaxMultiplier);
  assert.ok(max.learnerMarker <= scaleTokens.learnerMarkerMaxMultiplier);
  assert.ok(max.marker <= 2.5);
  assert.ok(max.marker <= scaleTokens.markerMaxMultiplier);
  assert.ok(max.restrictionSymbol <= scaleTokens.restrictionMaxMultiplier);
});

test("Stage 161.6.8.3 learner overlay scales are separated from high-zoom road scaling", () => {
  const maxZoom = ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom;
  const drawnAttempt = cartographicDrawnAttemptScaleForZoom(maxZoom);
  const correctRoute = cartographicCorrectRouteScaleForZoom(maxZoom);
  const mistakeOverlay = cartographicMistakeOverlayScaleForZoom(maxZoom);
  const reviewText = cartographicReviewTextScaleForZoom(maxZoom);
  const learnerMarker = cartographicLearnerMarkerScaleForZoom(maxZoom);
  const localRoad = cartographicStyleScaleForZoom(maxZoom).localRoad;
  const rawRoute = TOPOPASS_STREET_ATLAS_STYLE.routeOverlays.rawRoute;
  const illegalRoute = TOPOPASS_STREET_ATLAS_STYLE.routeOverlays.illegalMovement;

  assert.ok(drawnAttempt < localRoad);
  assert.ok(drawnAttempt <= 2);
  assert.ok(correctRoute > drawnAttempt);
  assert.ok(correctRoute <= 2.25);
  assert.ok(mistakeOverlay > correctRoute);
  assert.ok(reviewText > drawnAttempt);
  assert.ok(learnerMarker < correctRoute);
  assert.ok(rawRoute.strokeWidth * drawnAttempt < illegalRoute.strokeWidth * mistakeOverlay);
});

test("Stage 145.5 inactive and restricted roads stay quieter than active residential streets", () => {
  const residential = roadVisual({
    roadClass: "local",
    osmHierarchy: "residential",
    style: roadStyleForOsmHierarchy("residential")
  });
  const restricted = roadVisual({
    roadClass: "restricted",
    osmHierarchy: "restricted",
    style: roadStyleForOsmHierarchy("restricted")
  });
  const inactive = roadVisual({
    roadClass: "local",
    osmHierarchy: "inactive",
    style: roadStyleForOsmHierarchy("inactive")
  });

  const residentialAlpha = roadStyleForViewport(residential, lowZoomRoadViewport).alpha ?? 1;

  assert.ok((roadStyleForViewport(restricted, lowZoomRoadViewport).alpha ?? 1) < residentialAlpha);
  assert.ok((roadStyleForViewport(inactive, lowZoomRoadViewport).alpha ?? 1) < residentialAlpha);
});

test("Stage 145.5 junction and interaction tokens make major and selected roads visually stronger", () => {
  const primary = roadVisual({
    roadClass: "major",
    osmHighway: "primary",
    osmHierarchy: "primary",
    style: roadStyleForOsmHierarchy("primary")
  });
  const service = roadVisual({
    roadClass: "service",
    osmHighway: "service",
    osmHierarchy: "service",
    style: roadStyleForOsmHierarchy("service")
  });
  const selected = roadInteractionStyleForState("selected");
  const hovered = roadInteractionStyleForState("hovered");

  assert.ok(roadJunctionRadiusForVisual(primary, lowZoomRoadViewport, "casing") > roadJunctionRadiusForVisual(service, lowZoomRoadViewport, "casing"));
  assert.ok(selected.haloWidth > hovered.haloWidth);
  assert.notEqual(selected.strokeColor, hovered.strokeColor);
});

test("Stage 8.4 junction caps are emitted once for a shared split-way join, not terminal endpoints", () => {
  const first = roadVisual({
    roadId: "primary-a",
    osmWayId: "osm-way-42",
    roadClass: "major",
    osmHighway: "primary",
    osmHierarchy: "primary",
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 }
    ],
    style: roadStyleForOsmHierarchy("primary")
  });
  const second = roadVisual({
    roadId: "primary-b",
    osmWayId: "osm-way-42",
    roadClass: "major",
    osmHighway: "primary",
    osmHierarchy: "primary",
    points: [
      { x: 100, y: 0 },
      { x: 200, y: 20 }
    ],
    style: roadStyleForOsmHierarchy("primary")
  });
  const visuals = [second, first];
  const visualsBefore = structuredClone(visuals);
  const caps = buildRoadJunctionCaps(visuals);

  assert.equal(caps.length, 1);
  assert.deepEqual(caps[0].point, { x: 100, y: 0 });
  assert.deepEqual(caps[0].roadIds, ["primary-a", "primary-b"]);
  assert.equal(caps[0].osmWayId, "osm-way-42");
  assert.equal(caps[0].visual.roadId, "primary-b");
  assert.deepEqual(buildRoadJunctionCaps(visuals), caps);
  assert.deepEqual(visuals, visualsBefore);
});

test("Stage 8.4 terminal and hierarchy-transition endpoints do not receive junction caps", () => {
  const primary = roadVisual({
    roadId: "primary-terminal",
    osmWayId: "osm-way-primary",
    roadClass: "major",
    osmHighway: "primary",
    osmHierarchy: "primary",
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 }
    ],
    style: roadStyleForOsmHierarchy("primary")
  });
  const secondary = roadVisual({
    roadId: "secondary-transition",
    osmWayId: "osm-way-secondary",
    roadClass: "secondary",
    osmHighway: "secondary",
    osmHierarchy: "secondary",
    points: [
      { x: 100, y: 0 },
      { x: 180, y: 40 }
    ],
    style: roadStyleForOsmHierarchy("secondary")
  });

  assert.deepEqual(buildRoadJunctionCaps([primary]), []);
  assert.deepEqual(buildRoadJunctionCaps([primary, secondary]), []);
});

test("Stage 8.4 shared-junction discs never exceed the normal road pass width", () => {
  const first = roadVisual({
    roadId: "primary-a",
    osmWayId: "osm-way-42",
    roadClass: "major",
    osmHighway: "primary",
    osmHierarchy: "primary",
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 }
    ],
    style: roadStyleForOsmHierarchy("primary")
  });
  const second = roadVisual({
    roadId: "primary-b",
    osmWayId: "osm-way-42",
    roadClass: "major",
    osmHighway: "primary",
    osmHierarchy: "primary",
    points: [
      { x: 100, y: 0 },
      { x: 200, y: 20 }
    ],
    style: roadStyleForOsmHierarchy("primary")
  });
  const viewport = {
    width: 1000,
    height: 1000,
    mapBounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 }
  };
  const [cap] = buildRoadJunctionCaps([first, second]);
  const style = roadStyleForViewport(cap.visual, viewport, 1);

  assert.equal(roadJunctionRadiusForVisual(cap.visual, viewport, "casing", 1) * 2, style.casingWidth);
  assert.equal(roadJunctionRadiusForVisual(cap.visual, viewport, "fill", 1) * 2, style.strokeWidth);
});

test("Stage 8.4 maximum zoom caps preserve principal corridor dominance", () => {
  const primary = roadVisual({
    roadClass: "major",
    osmHighway: "primary",
    osmHierarchy: "primary",
    style: roadStyleForOsmHierarchy("primary")
  });
  const secondary = roadVisual({
    roadClass: "secondary",
    osmHighway: "secondary",
    osmHierarchy: "secondary",
    style: roadStyleForOsmHierarchy("secondary")
  });
  const residential = roadVisual({
    roadClass: "local",
    osmHighway: "residential",
    osmHierarchy: "residential",
    style: roadStyleForOsmHierarchy("residential")
  });
  const service = roadVisual({
    roadClass: "service",
    osmHighway: "service",
    osmHierarchy: "service",
    style: roadStyleForOsmHierarchy("service")
  });
  const atMaximum = [primary, secondary, residential, service].map((visual) =>
    roadStyleForViewport(visual, labelTestViewport, ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom)
  );

  assert.ok(atMaximum[0].strokeWidth > atMaximum[1].strokeWidth);
  assert.ok(atMaximum[1].strokeWidth > atMaximum[2].strokeWidth);
  assert.ok(atMaximum[2].strokeWidth > atMaximum[3].strokeWidth);
  assert.ok(atMaximum[0].strokeWidth / atMaximum[2].strokeWidth > 3);
});

test("Stage 145.5 dense road rendering helpers are deterministic", () => {
  const visuals = buildSyntheticRoadVisuals(mediumLondonOsmRouteMap);
  const passSignature = buildRoadRenderPasses(visuals).map((pass) => `${pass.layer}:${pass.visual.roadId}`);
  const styleSignature = visuals.map((visual) => [
    visual.roadId,
    roadStyleForViewport(visual, lowZoomRoadViewport).casingWidth,
    roadStyleForViewport(visual, lowZoomRoadViewport).strokeWidth,
    roadStyleForViewport(visual, lowZoomRoadViewport).alpha ?? 1
  ]);

  assert.deepEqual(buildRoadRenderPasses(visuals).map((pass) => `${pass.layer}:${pass.visual.roadId}`), passSignature);
  assert.deepEqual(
    visuals.map((visual) => [
      visual.roadId,
      roadStyleForViewport(visual, lowZoomRoadViewport).casingWidth,
      roadStyleForViewport(visual, lowZoomRoadViewport).strokeWidth,
      roadStyleForViewport(visual, lowZoomRoadViewport).alpha ?? 1
    ]),
    styleSignature
  );
});

function roadLabel(overrides: Partial<SyntheticMapLabel>): SyntheticMapLabel {
  return {
    id: "label",
    kind: "road",
    text: "Euston Road",
    point: { x: 50, y: 50 },
    angleRadians: 0,
    priority: 2,
    roadClass: "major",
    osmHierarchy: "primary",
    source: "osm",
    roadLengthMeters: 300,
    ...overrides
  };
}

const labelTestViewport = {
  width: 200,
  height: 100,
  mapBounds: {
    minX: 0,
    minY: 0,
    maxX: 200,
    maxY: 100
  }
};

test("Stage 145 label styles follow road hierarchy", () => {
  const majorLabel = roadLabel({ roadClass: "major", osmHierarchy: "primary" });
  const minorLabel = roadLabel({ roadClass: "local", osmHierarchy: "residential" });

  assert.equal(roadLabelTier(majorLabel), "major");
  assert.equal(roadLabelTier(minorLabel), "minor");
  assert.equal(labelStyleForSyntheticMapLabel(majorLabel).font, "800 11.5px 'Arial Narrow', Arial, sans-serif");
  assert.ok(
    TOPOPASS_STREET_ATLAS_STYLE.labels.roadHierarchy.major.fontSize >
      TOPOPASS_STREET_ATLAS_STYLE.labels.roadHierarchy.minor.fontSize
  );
});

test("Stage 161.6.9 street labels scale up strongly at high zoom", () => {
  const majorLabel = roadLabel({ roadClass: "major", osmHierarchy: "primary" });
  const minorLabel = roadLabel({ roadClass: "local", osmHierarchy: "residential" });
  const majorBase = labelStyleForSyntheticMapLabel(majorLabel);
  const minorBase = labelStyleForSyntheticMapLabel(minorLabel);
  const majorHigh = labelStyleForSyntheticMapLabel(majorLabel, veryHighZoomRoadViewport);
  const minorHigh = labelStyleForSyntheticMapLabel(minorLabel, veryHighZoomRoadViewport);

  assert.ok("fontSize" in majorBase);
  assert.ok("fontSize" in minorBase);
  assert.ok("fontSize" in majorHigh);
  assert.ok("fontSize" in minorHigh);
  assert.ok(majorHigh.fontSize > majorBase.fontSize);
  assert.ok(minorHigh.fontSize > minorBase.fontSize * 2.8);
  assertClose(
    minorHigh.fontSize / minorBase.fontSize,
    majorHigh.fontSize / majorBase.fontSize,
    0.000001,
    "major and local labels should share the high-zoom street-label scale"
  );
  assert.ok(minorHigh.haloWidth > minorBase.haloWidth);
  assert.ok(minorHigh.haloWidth <= minorBase.haloWidth * TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale.labelHaloMaxMultiplier);
});

test("Stage 161.6.8.2 explicit semantic zoom scales label text and halo strongly at fixed viewport size", () => {
  const majorLabel = roadLabel({ roadClass: "major", osmHierarchy: "primary" });
  const minorLabel = roadLabel({ roadClass: "local", osmHierarchy: "residential" });
  const majorBase = labelStyleForSyntheticMapLabel(majorLabel, labelTestViewport, 1);
  const minorBase = labelStyleForSyntheticMapLabel(minorLabel, labelTestViewport, 1);
  const majorHigh = labelStyleForSyntheticMapLabel(majorLabel, labelTestViewport, ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom);
  const minorHigh = labelStyleForSyntheticMapLabel(minorLabel, labelTestViewport, ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom);
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;

  assert.ok("fontSize" in majorBase);
  assert.ok("fontSize" in minorBase);
  assert.ok("fontSize" in majorHigh);
  assert.ok("fontSize" in minorHigh);
  assert.ok(majorHigh.fontSize >= majorBase.fontSize * 8);
  assert.ok(minorHigh.fontSize >= minorBase.fontSize * 8);
  assert.ok(majorHigh.fontSize <= majorBase.fontSize * scaleTokens.labelMaxMultiplier.major);
  assert.ok(minorHigh.fontSize <= minorBase.fontSize * scaleTokens.labelMaxMultiplier.minor);
  assert.ok(majorHigh.haloWidth > majorBase.haloWidth * 4);
  assert.ok(minorHigh.haloWidth <= minorBase.haloWidth * scaleTokens.labelHaloMaxMultiplier);
});

test("Stage 145 label visibility reduces minor roads at low zoom", () => {
  const lowZoomViewport = {
    width: 160,
    height: 160,
    mapBounds: {
      minX: 0,
      minY: 0,
      maxX: 1000,
      maxY: 1000
    }
  };
  const labels = [
    roadLabel({
      id: "major",
      text: "Euston Road",
      point: { x: 500, y: 500 },
      roadClass: "major",
      osmHierarchy: "primary",
      roadLengthMeters: 1000
    }),
    roadLabel({
      id: "minor",
      text: "Store Street",
      point: { x: 500, y: 500 },
      roadClass: "local",
      osmHierarchy: "residential",
      roadLengthMeters: 1000
    })
  ];

  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels, viewport: lowZoomViewport }).map((label) => label.id),
    ["major"]
  );
});

test("Stage 161.6.9 high zoom makes useful local-road labels available", () => {
  const labels = [
    roadLabel({
      id: "local-short",
      text: "Store Street",
      roadClass: "local",
      osmHierarchy: "residential",
      roadLengthMeters: 72
    })
  ];

  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels, viewport: lowZoomRoadViewport }).map((label) => label.id),
    []
  );
  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels, viewport: veryHighZoomRoadViewport }).map((label) => label.id),
    ["local-short"]
  );
});

test("Stage 145 label visibility rejects text that cannot fit its road segment", () => {
  const labels = [
    roadLabel({
      id: "too-short",
      text: "Very Long Street Name",
      roadClass: "secondary",
      osmHierarchy: "secondary",
      roadLengthMeters: 40
    }),
    roadLabel({
      id: "fits",
      text: "Euston Road",
      roadClass: "secondary",
      osmHierarchy: "secondary",
      roadLengthMeters: 180
    })
  ];

  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels, viewport: labelTestViewport }).map((label) => label.id),
    ["fits"]
  );
});

test("Stage 8.5 correction label filtering requires padded full-viewport fit", () => {
  const labels = [
    roadLabel({
      id: "edge-crossing",
      text: "Edge Street",
      point: { x: 12, y: 50 },
      roadLengthMeters: 500
    }),
    roadLabel({
      id: "inside",
      text: "Inside Street",
      point: { x: 108, y: 50 },
      roadLengthMeters: 500
    })
  ];

  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.labels.collision.viewportEdgePadding, 6);
  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels, viewport: labelTestViewport }).map((label) => label.id),
    ["inside"]
  );
});

test("Stage 145 label layout throttles repeated road names", () => {
  const labels = [
    roadLabel({ id: "first", text: "Euston Road", point: { x: 80, y: 50 }, roadLengthMeters: 300 }),
    roadLabel({ id: "near-repeat", text: "Euston Road", point: { x: 140, y: 50 }, roadLengthMeters: 300 })
  ];

  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels, viewport: labelTestViewport }).map((label) => label.id),
    ["first"]
  );
});

test("Stage 145 label layout avoids reserved route and marker areas", () => {
  const labels = [
    roadLabel({ id: "blocked", point: { x: 50, y: 50 }, roadLengthMeters: 300 }),
    roadLabel({ id: "clear", text: "Clear", point: { x: 150, y: 50 }, roadLengthMeters: 300 })
  ];

  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({
      labels,
      viewport: labelTestViewport,
      reservedBoxes: [{ id: "route", minX: 0, minY: 20, maxX: 110, maxY: 80 }]
    }).map((label) => label.id),
    ["clear"]
  );
});

test("Stage 157 label filtering reuses cached text measurements on repeated viewport passes", () => {
  const labels = [
    roadLabel({ id: "major", text: "Euston Road", roadClass: "major", osmHierarchy: "primary", roadLengthMeters: 300 }),
    roadLabel({
      id: "secondary",
      text: "Grafton Place",
      point: { x: 150, y: 80 },
      roadClass: "secondary",
      osmHierarchy: "secondary",
      roadLengthMeters: 300
    }),
    {
      id: "station-context",
      kind: "station" as const,
      text: "Euston Station",
      point: { x: 20, y: 20 },
      priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.station
    }
  ];

  resetSyntheticLabelMeasurementCache();

  const firstPass = filterSyntheticMapLabelsForViewport({ labels, viewport: labelTestViewport });
  const afterFirstPass = getSyntheticLabelMeasurementCacheStats();
  const secondPass = filterSyntheticMapLabelsForViewport({ labels, viewport: labelTestViewport });
  const afterSecondPass = getSyntheticLabelMeasurementCacheStats();

  assert.deepEqual(secondPass, firstPass);
  assert.ok(afterFirstPass.widthCacheMisses > 0);
  assert.equal(afterSecondPass.widthCacheMisses, afterFirstPass.widthCacheMisses);
  assert.ok(afterSecondPass.widthCacheHits > afterFirstPass.widthCacheHits);
  assert.equal(afterSecondPass.widthCacheSize, afterFirstPass.widthCacheSize);
});

test("Stage 146 repeated road labels are allowed when sufficiently separated", () => {
  const wideLabelViewport = {
    width: 400,
    height: 100,
    mapBounds: {
      minX: 0,
      minY: 0,
      maxX: 400,
      maxY: 100
    }
  };
  const labels = [
    roadLabel({
      id: "first",
      text: "Grafton Place",
      point: { x: 80, y: 50 },
      roadClass: "local",
      osmHierarchy: "residential",
      roadLengthMeters: 300
    }),
    roadLabel({
      id: "far-repeat",
      text: "Grafton Place",
      point: { x: 300, y: 50 },
      roadClass: "local",
      osmHierarchy: "residential",
      roadLengthMeters: 300
    })
  ];

  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({
      labels,
      viewport: wideLabelViewport
    }).map((label) => label.id),
    ["far-repeat", "first"]
  );
});

test("Stage 146 higher-priority road labels win collisions over lower-priority labels", () => {
  const labels = [
    roadLabel({
      id: "minor",
      text: "Store Street",
      point: { x: 70, y: 50 },
      roadClass: "local",
      osmHierarchy: "residential",
      roadLengthMeters: 300
    }),
    roadLabel({
      id: "major",
      text: "Euston Road",
      point: { x: 70, y: 50 },
      roadClass: "major",
      osmHierarchy: "primary",
      roadLengthMeters: 300
    })
  ];

  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels, viewport: labelTestViewport }).map((label) => label.id),
    ["major"]
  );
});

test("Stage 146 context labels use category styles and low-zoom decluttering", () => {
  const labels: SyntheticMapLabel[] = [
    {
      id: "station-label",
      kind: "station",
      text: "Euston Station",
      point: { x: 64, y: 36 },
      priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.station
    },
    {
      id: "park-label",
      kind: "open_space",
      text: "Gordon Square",
      point: { x: 140, y: 72 },
      priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.openSpace
    }
  ];
  const lowZoomViewport = {
    width: 160,
    height: 160,
    mapBounds: {
      minX: 0,
      minY: 0,
      maxX: 1000,
      maxY: 1000
    }
  };

  assert.equal(labelStyleForSyntheticMapLabel(labels[0]).font, "700 12px Arial, sans-serif");
  assert.equal(labelStyleForSyntheticMapLabel(labels[1]).font, "600 11px Arial, sans-serif");
  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels: labels.slice(0, 2), viewport: lowZoomViewport }).map((label) => label.id),
    []
  );
  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels, viewport: labelTestViewport }).map((label) => label.id),
    ["station-label", "park-label"]
  );
});

test("Stage 146 label candidate ordering is deterministic", () => {
  const labels = buildSyntheticMapLabels(marloweDistrictMap, marloweDistrictRouteExercises[0]);
  const repeatedLabels = buildSyntheticMapLabels(marloweDistrictMap, marloweDistrictRouteExercises[0]);

  assert.deepEqual(
    repeatedLabels.map((label) => [label.id, label.kind, label.text, label.priority]),
    labels.map((label) => [label.id, label.kind, label.text, label.priority])
  );
});

test("Stage 143 OSM context rendering uses raw fixture tags without adding routable graph features", () => {
  const contextFixture: OverpassJsonResponse = {
    elements: [
      { type: "node", id: 1, lat: 51.52, lon: -0.14 },
      { type: "node", id: 2, lat: 51.52, lon: -0.139 },
      { type: "node", id: 3, lat: 51.52008, lon: -0.1399 },
      { type: "node", id: 4, lat: 51.52008, lon: -0.1397 },
      { type: "node", id: 5, lat: 51.51992, lon: -0.1397 },
      { type: "node", id: 6, lat: 51.51992, lon: -0.1399 },
      { type: "node", id: 7, lat: 51.52006, lon: -0.13945 },
      { type: "node", id: 8, lat: 51.52006, lon: -0.13925 },
      { type: "node", id: 9, lat: 51.51994, lon: -0.13925 },
      { type: "node", id: 10, lat: 51.51994, lon: -0.13945 },
      { type: "node", id: 11, lat: 51.5199, lon: -0.13995 },
      { type: "node", id: 12, lat: 51.5201, lon: -0.13925 },
      { type: "node", id: 13, lat: 51.51986, lon: -0.1398 },
      { type: "node", id: 14, lat: 51.52012, lon: -0.1396 },
      { type: "node", id: 15, lat: 51.51972, lon: -0.1398 },
      { type: "node", id: 16, lat: 51.51972, lon: -0.13962 },
      { type: "node", id: 17, lat: 51.51958, lon: -0.13962 },
      { type: "node", id: 18, lat: 51.51958, lon: -0.1398 },
      { type: "way", id: 100, nodes: [1, 2], tags: { highway: "residential", name: "Context Road" } },
      { type: "way", id: 200, nodes: [3, 4, 5, 6, 3], tags: { leisure: "park", name: "Fitzroy Garden" } },
      { type: "way", id: 201, nodes: [7, 8, 9, 10, 7], tags: { natural: "water", name: "Pilot Basin" } },
      { type: "way", id: 202, nodes: [11, 12], tags: { railway: "rail", name: "Main Line" } },
      { type: "way", id: 203, nodes: [13, 14], tags: { waterway: "canal", name: "Pilot Cut" } },
      { type: "way", id: 204, nodes: [15, 16, 17, 18, 15], tags: { highway: "pedestrian", area: "yes", name: "Pilot Walk" } }
    ]
  };
  const converted = convertOverpassJsonToRouteMap(contextFixture, {
    mapId: "stage-143-context-map",
    name: "Stage 143 Context Map"
  });

  if (!converted.ok) {
    throw new Error(`Expected context fixture to convert: ${converted.errors.join("; ")}`);
  }

  const backgroundFeatures = buildSyntheticBackgroundFeatures(converted.map, {
    sourceOverpassFixture: contextFixture
  });
  const linearFeatures = buildSyntheticLinearFeatures(converted.map, {
    sourceOverpassFixture: contextFixture
  });
  const contextLabels = buildSyntheticMapLabels(converted.map, undefined, {
    backgroundFeatures,
    linearFeatures
  }).filter((label) => label.kind === "open_space" || label.kind === "water" || label.kind === "area");

  assert.equal(converted.map.roads.length, 1);
  assert.deepEqual(
    backgroundFeatures.map((feature) => [feature.kind, feature.label]),
    [
      ["park", "Fitzroy Garden"],
      ["water", "Pilot Basin"],
      ["pedestrian-area", "Pilot Walk"]
    ]
  );
  assert.deepEqual(
    linearFeatures.map((feature) => [feature.kind, feature.label, feature.routable]),
    [
      ["rail", "Main Line", false],
      ["waterway", "Pilot Cut", false]
    ]
  );
  assert.ok(contextLabels.some((label) => label.kind === "open_space" && label.text === "Fitzroy Garden"));
  assert.ok(contextLabels.some((label) => label.kind === "water" && label.text === "Pilot Basin"));
  assert.ok(contextLabels.some((label) => label.kind === "water" && label.text === "Pilot Cut"));
  assert.ok(contextLabels.some((label) => label.kind === "area" && label.text === "Main Line"));
  assert.ok(backgroundFeatures.every((feature) => feature.routable === false));
});

test("Stage 148 OSM rail bridge and crossing context is visual only and fixture backed", () => {
  const contextFixture: OverpassJsonResponse = {
    elements: [
      { type: "node", id: 1, lat: 51.52, lon: -0.14 },
      { type: "node", id: 2, lat: 51.52018, lon: -0.1397 },
      { type: "node", id: 3, lat: 51.5199, lon: -0.13995 },
      { type: "node", id: 4, lat: 51.5201, lon: -0.13925 },
      { type: "node", id: 5, lat: 51.5198, lon: -0.1397 },
      { type: "node", id: 6, lat: 51.5202, lon: -0.1394 },
      { type: "way", id: 100, nodes: [1, 2], tags: { highway: "primary", bridge: "yes", name: "Pilot Bridge" } },
      { type: "way", id: 101, nodes: [3, 4], tags: { railway: "subway", name: "Central Line" } },
      { type: "way", id: 102, nodes: [5, 6], tags: { highway: "secondary", bridge: "no", name: "Ground Road" } }
    ]
  };
  const converted = convertOverpassJsonToRouteMap(contextFixture, {
    mapId: "stage-148-context-map",
    name: "Stage 148 Context Map"
  });

  if (!converted.ok) {
    throw new Error(`Expected context fixture to convert: ${converted.errors.join("; ")}`);
  }

  const withoutFixture = buildSyntheticLinearFeatures(converted.map);
  const linearFeatures = buildSyntheticLinearFeatures(converted.map, {
    sourceOverpassFixture: contextFixture
  });
  const labels = buildSyntheticMapLabels(converted.map, undefined, { linearFeatures });

  assert.deepEqual(withoutFixture, []);
  assert.equal(converted.map.roads.length, 2);
  assert.deepEqual(
    linearFeatures.map((feature) => [feature.kind, feature.label, feature.routable]),
    [
      ["bridge", "Pilot Bridge", false],
      ["rail", "Central Line", false]
    ]
  );
  assert.ok(labels.some((label) => label.kind === "bridge" && label.text === "Pilot Bridge"));
  assert.ok(labels.some((label) => label.kind === "area" && label.text === "Central Line"));
});

test("Stage 148 context line visibility fades by zoom without overpowering route overlays", () => {
  const rail = buildSyntheticLinearFeatures(marloweDistrictMap)[0];
  const lowViewport = { width: 120, height: 120, mapBounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 } };
  const mediumViewport = { width: 650, height: 650, mapBounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 } };
  const highViewport = { width: 1200, height: 1200, mapBounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 } };

  assert.equal(shouldShowSyntheticLinearFeatureForViewport(rail, lowViewport), false);
  assert.equal(shouldShowSyntheticLinearFeatureForViewport(rail, mediumViewport), true);
  assert.equal(syntheticLinearFeatureAlphaForViewport(rail, mediumViewport), TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.rail.mediumZoomAlpha);
  assert.equal(syntheticLinearFeatureAlphaForViewport(rail, highViewport), TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.rail.highZoomAlpha);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.rail.highZoomAlpha < 1);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.routeOverlays.matchedRoute.strokeWidth > rail.strokeWidth);
});

test("Stage 148 station and landmark markers declutter against learner overlay reservations", () => {
  const station = buildSyntheticLandmarkVisuals(marloweDistrictMap).find((visual) => visual.kind === "station");

  if (!station) {
    throw new Error("Expected a station landmark visual.");
  }

  const highViewport = {
    width: 200,
    height: 200,
    mapBounds: {
      minX: station.point.x - 100,
      minY: station.point.y - 100,
      maxX: station.point.x + 100,
      maxY: station.point.y + 100
    }
  };
  const lowViewport = {
    width: 80,
    height: 80,
    mapBounds: {
      minX: station.point.x - 400,
      minY: station.point.y - 400,
      maxX: station.point.x + 400,
      maxY: station.point.y + 400
    }
  };
  const reservedBoxes = [{ id: "route-marker", minX: 78, minY: 78, maxX: 122, maxY: 122 }];

  assert.deepEqual(filterSyntheticLandmarkVisualsForViewport({ visuals: [station], viewport: lowViewport }), []);
  assert.deepEqual(
    filterSyntheticLandmarkVisualsForViewport({ visuals: [station], viewport: highViewport, reservedBoxes }),
    []
  );
  assert.deepEqual(
    filterSyntheticLandmarkVisualsForViewport({ visuals: [station], viewport: highViewport }).map((visual) => visual.id),
    [station.id]
  );
  assert.equal(
    syntheticLandmarkVisualAlphaForViewport(station, highViewport),
    TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.stationMarker.highZoomAlpha
  );
});

test("Stage 149 raw OSM area names and landmark categories are fixture-backed", () => {
  const contextFixture: OverpassJsonResponse = {
    elements: [
      { type: "node", id: 1, lat: 51.52, lon: -0.14 },
      { type: "node", id: 2, lat: 51.5201, lon: -0.1398 },
      { type: "node", id: 3, lat: 51.5202, lon: -0.1396 },
      { type: "node", id: 4, lat: 51.5203, lon: -0.1394 },
      { type: "node", id: 5, lat: 51.5199, lon: -0.1397 },
      { type: "node", id: 6, lat: 51.5198, lon: -0.1396 },
      { type: "node", id: 7, lat: 51.5197, lon: -0.1397 },
      { type: "node", id: 8, lat: 51.5198, lon: -0.1398 },
      { type: "node", id: 20, lat: 51.52004, lon: -0.1399, tags: { place: "neighbourhood", name: "Fitzrovia" } },
      { type: "node", id: 21, lat: 51.52008, lon: -0.13985, tags: { amenity: "library", name: "Pilot Library" } },
      { type: "node", id: 22, lat: 51.52012, lon: -0.13982, tags: { tourism: "attraction", name: "Pilot Monument" } },
      { type: "node", id: 23, lat: 51.52016, lon: -0.13978, tags: { amenity: "marketplace", name: "Pilot Market" } },
      { type: "node", id: 24, lat: 51.5202, lon: -0.13975, tags: { amenity: "bench", name: "Named Bench" } },
      { type: "way", id: 100, nodes: [1, 2], tags: { highway: "residential", name: "Context Road" } },
      { type: "way", id: 200, nodes: [5, 6, 7, 8, 5], tags: { leisure: "garden", name: "Pilot Garden" } }
    ]
  };
  const converted = convertOverpassJsonToRouteMap(contextFixture, {
    mapId: "stage-149-context-map",
    name: "Stage 149 Context Map"
  });

  if (!converted.ok) {
    throw new Error(`Expected context fixture to convert: ${converted.errors.join("; ")}`);
  }

  const labelsWithoutFixture = buildSyntheticMapLabels(converted.map, undefined);
  const labels = buildSyntheticMapLabels(converted.map, undefined, {
    sourceOverpassFixture: contextFixture
  });
  const visuals = buildSyntheticLandmarkVisuals(converted.map, undefined, {
    sourceOverpassFixture: contextFixture
  });

  assert.equal(labelsWithoutFixture.some((label) => label.text === "Fitzrovia"), false);
  assert.ok(labels.some((label) => label.kind === "district" && label.text === "Fitzrovia"));
  assert.ok(labels.some((label) => label.kind === "public_building" && label.text === "Pilot Library"));
  assert.ok(labels.some((label) => label.kind === "landmark" && label.text === "Pilot Monument"));
  assert.ok(labels.some((label) => label.kind === "learner_reference" && label.text === "Pilot Market"));
  assert.ok(labels.some((label) => label.kind === "park" && label.text === "Pilot Garden"));
  assert.equal(labels.some((label) => label.text === "Named Bench"), false);
  assert.deepEqual(
    visuals.map((visual) => [visual.kind, visual.label, visual.routable]),
    [
      ["civic", "Pilot Library", false],
      ["important-landmark", "Pilot Monument", false],
      ["market", "Pilot Market", false],
      ["open-space", "Pilot Garden", false]
    ]
  );
});

test("Stage 149 area and landmark labels respect zoom and learner overlay priority", () => {
  const labels: SyntheticMapLabel[] = [
    {
      id: "area-label",
      kind: "area",
      text: "Bloomsbury",
      point: { x: 100, y: 50 },
      priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.area
    },
    {
      id: "public-building-label",
      kind: "public_building",
      text: "Central Library",
      point: { x: 100, y: 50 },
      priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.publicBuilding
    },
    roadLabel({
      id: "road-label",
      text: "Euston Road",
      point: { x: 100, y: 50 },
      roadClass: "major",
      osmHierarchy: "primary",
      roadLengthMeters: 500
    })
  ];
  const lowZoomViewport = {
    width: 160,
    height: 160,
    mapBounds: {
      minX: -400,
      minY: -450,
      maxX: 600,
      maxY: 550
    }
  };
  const reservedBoxes = [{ id: "exercise-stop", minX: 72, minY: 28, maxX: 128, maxY: 72 }];

  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels, viewport: lowZoomViewport }).map((label) => label.id),
    ["road-label"]
  );
  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels, viewport: labelTestViewport }).map((label) => label.id),
    ["area-label"]
  );
  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels: labels.slice(0, 2), viewport: labelTestViewport, reservedBoxes }),
    []
  );
});

test("Stage 149 landmark marker roles have deterministic zoom and collision behaviour", () => {
  const visuals = buildSyntheticLandmarkVisuals(marloweDistrictMap);
  const publicBuilding = visuals.find((visual) => visual.kind === "public-building");
  const openSpace = visuals.find((visual) => visual.kind === "open-space");

  if (!publicBuilding || !openSpace) {
    throw new Error("Expected public-building and open-space landmark visuals.");
  }

  const lowViewport = { width: 120, height: 120, mapBounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 } };
  const highViewport = {
    width: 240,
    height: 240,
    mapBounds: {
      minX: publicBuilding.point.x - 120,
      minY: publicBuilding.point.y - 120,
      maxX: publicBuilding.point.x + 120,
      maxY: publicBuilding.point.y + 120
    }
  };
  const reservedBoxes = [{ id: "review-marker", minX: 112, minY: 112, maxX: 128, maxY: 128 }];

  assert.deepEqual(filterSyntheticLandmarkVisualsForViewport({ visuals: [publicBuilding], viewport: lowViewport }), []);
  assert.deepEqual(
    filterSyntheticLandmarkVisualsForViewport({ visuals: [publicBuilding], viewport: highViewport }).map((visual) => visual.id),
    [publicBuilding.id]
  );
  assert.deepEqual(
    filterSyntheticLandmarkVisualsForViewport({ visuals: [publicBuilding], viewport: highViewport, reservedBoxes }),
    []
  );
  assert.ok(syntheticLandmarkVisualAlphaForViewport(openSpace, highViewport) <= 1);
});

test("Stage 8.5 atlas candidates classify source-backed labels and preserve OSM metadata", () => {
  const fixture: OverpassJsonResponse = {
    elements: [
      { type: "node", id: 1, lat: 51.52, lon: -0.14 },
      { type: "node", id: 2, lat: 51.52, lon: -0.138 },
      { type: "node", id: 3, lat: 51.5204, lon: -0.1398 },
      { type: "node", id: 4, lat: 51.5204, lon: -0.1395 },
      { type: "node", id: 5, lat: 51.5201, lon: -0.1395 },
      { type: "node", id: 6, lat: 51.5201, lon: -0.1398 },
      { type: "node", id: 7, lat: 51.5199, lon: -0.1398 },
      { type: "node", id: 8, lat: 51.5199, lon: -0.1395 },
      { type: "node", id: 9, lat: 51.5196, lon: -0.1395 },
      { type: "node", id: 10, lat: 51.5196, lon: -0.1398 },
      { type: "node", id: 11, lat: 51.5204, lon: -0.1393 },
      { type: "node", id: 12, lat: 51.5204, lon: -0.139 },
      { type: "node", id: 13, lat: 51.5201, lon: -0.139 },
      { type: "node", id: 14, lat: 51.5201, lon: -0.1393 },
      { type: "node", id: 15, lat: 51.5199, lon: -0.1393 },
      { type: "node", id: 16, lat: 51.5199, lon: -0.139 },
      { type: "node", id: 17, lat: 51.5196, lon: -0.139 },
      { type: "node", id: 18, lat: 51.5196, lon: -0.1393 },
      { type: "node", id: 20, lat: 51.52025, lon: -0.1394, tags: { place: "neighbourhood", name: "Atlas Quarter" } },
      { type: "node", id: 21, lat: 51.5202, lon: -0.1392, tags: { railway: "station", name: "Atlas Station" } },
      { type: "node", id: 22, lat: 51.52, lon: -0.1392, tags: { amenity: "library", name: "Atlas Library" } },
      { type: "node", id: 23, lat: 51.5198, lon: -0.1392, tags: { amenity: "bench", name: "Unsupported Bench" } },
      { type: "way", id: 100, nodes: [1, 2], tags: { highway: "primary", name: "Atlas Road", ref: "A501" } },
      { type: "way", id: 200, nodes: [3, 4, 5, 6, 3], tags: { leisure: "park", name: "Atlas Gardens" } },
      { type: "way", id: 201, nodes: [7, 8, 9, 10, 7], tags: { amenity: "school", name: "Atlas School" } },
      { type: "way", id: 202, nodes: [11, 12, 13, 14, 11], tags: { landuse: "residential", name: "Atlas Estate" } },
      { type: "way", id: 203, nodes: [15, 16, 17, 18, 15], tags: { landuse: "commercial", name: "Atlas Works" } }
    ]
  };
  const converted = convertOverpassJsonToRouteMap(fixture, {
    mapId: "stage-8-5-label-map",
    name: "Stage 8.5 label map"
  });

  if (!converted.ok) {
    throw new Error(`Expected Stage 8.5 fixture to convert: ${converted.errors.join("; ")}`);
  }

  const labels = buildSyntheticMapLabels(converted.map, undefined, {
    includeOsmRoadLabels: true,
    sourceOverpassFixture: fixture
  });
  const repeatedLabels = buildSyntheticMapLabels(converted.map, undefined, {
    includeOsmRoadLabels: true,
    sourceOverpassFixture: fixture
  });
  const reference = labels.find((label) => label.kind === "road_reference" && label.text === "A501");
  const coverage = auditSyntheticAtlasLabelCoverage(labels);

  assert.ok(reference);
  assert.equal(reference.sourceMetadata?.elementType, "way");
  assert.equal(reference.sourceMetadata?.elementId, 100);
  assert.equal(reference.sourceMetadata?.tags?.ref, "A501");
  assert.ok(labels.some((label) => label.kind === "district" && label.text === "Atlas Quarter"));
  assert.ok(labels.some((label) => label.category === "major-road" && label.text === "Atlas Road"));
  assert.ok(labels.some((label) => label.category === "station" && label.text === "Atlas Station"));
  assert.ok(labels.some((label) => label.category === "landmark" && label.text === "Atlas Library"));
  assert.ok(labels.some((label) => label.category === "park" && label.text === "Atlas Gardens"));
  assert.ok(labels.some((label) => label.category === "institution" && label.text === "Atlas School"));
  assert.ok(labels.some((label) => label.category === "estate" && label.text === "Atlas Estate"));
  assert.ok(labels.some((label) => label.category === "contextual-land-use" && label.text === "Atlas Works"));
  assert.equal(labels.some((label) => label.text === "Unsupported Bench"), false);
  assert.ok(labels.every((label) => label.category && label.sourceMetadata));
  assert.deepEqual(repeatedLabels, labels);
  assert.equal(coverage.counts.roadReferenceLabels, 1);
  assert.equal(coverage.counts.districtLabels, 1);
  assert.equal(coverage.counts.majorRoadLabels, 1);
  assert.equal(coverage.counts.stationLabels, 1);
  assert.equal(coverage.counts.landmarkLabels, 2);
  assert.equal(coverage.counts.parkLabels, 1);
  assert.equal(coverage.counts.institutionLabels, 1);
  assert.equal(coverage.counts.estateLabels, 1);
  assert.equal(coverage.counts.contextualLandUseLabels, 1);
  assert.deepEqual(
    coverage.orderedCategories.map((category) => category.id),
    [
      "roadReferenceLabels",
      "districtLabels",
      "majorRoadLabels",
      "stationLabels",
      "landmarkLabels",
      "localRoadLabels",
      "parkLabels",
      "estateLabels",
      "waterLabels",
      "institutionLabels",
      "contextualLandUseLabels"
    ]
  );
});

test("Stage 8.5 label priorities, zoom gates, viewport clipping, and overlay reservations are deterministic", () => {
  const labels: SyntheticMapLabel[] = [
    {
      id: "reference",
      kind: "road_reference",
      text: "A501",
      point: { x: 100, y: 50 },
      angleRadians: 0,
      priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.roadReference
    },
    {
      id: "district",
      kind: "district",
      text: "Bloomsbury",
      point: { x: 100, y: 50 },
      priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.district
    },
    roadLabel({ id: "major", point: { x: 100, y: 50 }, roadLengthMeters: 500 }),
    roadLabel({
      id: "local",
      text: "Store Street",
      point: { x: 100, y: 50 },
      roadClass: "local",
      osmHierarchy: "residential",
      priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.localRoad,
      roadLengthMeters: 500
    }),
    roadLabel({ id: "outside", point: { x: 500, y: 500 }, roadLengthMeters: 500 })
  ];

  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels, viewport: labelTestViewport }).map((label) => label.id),
    ["reference"]
  );
  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({
      labels,
      viewport: labelTestViewport,
      reservedBoxes: [{ id: "learner-route", minX: 50, minY: 20, maxX: 150, maxY: 80 }]
    }),
    []
  );
  assert.ok(
    TOPOPASS_STREET_ATLAS_STYLE.labels.context.road_reference.minViewportScale <
      TOPOPASS_STREET_ATLAS_STYLE.labels.roadHierarchy.service.minViewportScale
  );
});

test("converted OSM road labels are optional and deterministic per source way", () => {
  const hiddenLabels = buildSyntheticMapLabels(mediumLondonOsmRouteMap, mediumLondonOsmRouteExercises[0]);
  const visibleLabels = buildSyntheticMapLabels(mediumLondonOsmRouteMap, mediumLondonOsmRouteExercises[0], {
    includeOsmRoadLabels: true
  });
  const eustonRoadLabels = visibleLabels.filter((label) => label.kind === "road" && label.text === "Euston Road");

  assert.equal(hiddenLabels.some((label) => label.kind === "road" && label.text === "Euston Road"), false);
  assert.ok(eustonRoadLabels.length > 1);
  assert.match(eustonRoadLabels[0].id, /^road-label-osm-osm-way-6001-segment-\d+-euston-road$/);
  assert.equal(eustonRoadLabels[0].kind, "road");
  assert.equal(eustonRoadLabels[0].text, "Euston Road");
  assert.ok(Number.isFinite(eustonRoadLabels[0].point.x));
  assert.ok(Number.isFinite(eustonRoadLabels[0].point.y));
  assert.ok(Number.isFinite(eustonRoadLabels[0].angleRadians));
  assert.equal(eustonRoadLabels[0].priority, 3);
  assert.equal(eustonRoadLabels[0].roadClass, "major");
  assert.equal(eustonRoadLabels[0].osmHierarchy, "primary");
  assert.equal(eustonRoadLabels[0].source, "osm");
  assert.equal(eustonRoadLabels[0].category, "major-road");
  assert.ok(eustonRoadLabels.every((label) => label.sourceMetadata?.elementId === 6001));
  assert.ok((eustonRoadLabels[0].roadLengthMeters ?? 0) > 0);
});

test("Stage 8.5 renders only source-backed A/B references with atlas-red styling", () => {
  const pilotOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(pilotOption);

  const sourceRefs = new Set(
    realLondonOsmPilotRouteMap.roads.flatMap((road) => {
      const ref = road.metadata.rawTags.ref?.trim().toUpperCase();

      return ref && /^[AB]\d/.test(ref) ? [ref] : [];
    })
  );
  const labels = buildSyntheticMapLabels(realLondonOsmPilotRouteMap, undefined, {
    includeOsmRoadLabels: true,
    sourceOverpassFixture: pilotOption.sourceOverpassFixture
  });
  const referenceLabels = labels.filter((label) => label.kind === "road_reference");

  assert.ok(sourceRefs.size > 0);
  assert.ok(referenceLabels.length > 0);
  assert.ok(referenceLabels.every((label) => sourceRefs.has(label.text.toUpperCase())));
  assert.ok(referenceLabels.every((label) => label.sourceMetadata?.provider === "openstreetmap"));
  assert.ok(referenceLabels.every((label) => label.sourceMetadata?.tags?.ref));
  assert.equal(labelStyleForSyntheticMapLabel(referenceLabels[0]).color, "#c8102e");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.labels.collision.roadReferenceMaxPerViewport, 6);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.labels.collision.roadReferenceRepeatDistance >= 360);
});

test("unnamed converted OSM roads do not crash label generation", () => {
  const unnamedOsmMap: MapDefinition = {
    id: "unnamed-osm-map",
    name: "Unnamed OSM map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 20, y: 0 }
    ],
    roads: [
      {
        id: "osm-way-1-segment-0",
        fromNodeId: "a",
        toNodeId: "b",
        distanceMeters: 20,
        isOneWay: false,
        metadata: {
          source: "osm",
          osmWayId: 1,
          highway: "residential"
        }
      }
    ],
    restrictions: [],
    landmarks: []
  } as MapDefinition;

  assert.equal(deriveOsmRoadVisualHierarchy(unnamedOsmMap.roads[0]), "residential");
  assert.deepEqual(deriveOsmRoadRenderMetadata(unnamedOsmMap.roads[0]), {
    source: "osm",
    highway: "residential",
    hierarchy: "residential",
    osmWayId: "1"
  });
  assert.deepEqual(
    buildSyntheticMapLabels(unnamedOsmMap, undefined, { includeOsmRoadLabels: true }).filter(
      (label) => label.kind === "road"
    ),
    []
  );
});

test("synthetic rail/context features are visual only and deterministic", () => {
  const features = buildSyntheticLinearFeatures(marloweDistrictMap);

  assert.deepEqual(
    features.map((feature) => feature.id),
    ["marlowe-rail-approach"]
  );
  assert.equal(features[0].kind, "rail");
  assert.equal(features[0].routable, false);
  assert.ok(features[0].points.length >= 4);
  assert.ok(features[0].casingWidth > features[0].strokeWidth);
});

test("synthetic landmark visuals classify useful London-style context markers", () => {
  const exercise = marloweDistrictRouteExercises.find((candidate) => candidate.id === "ex-station-to-hospital");

  if (!exercise) {
    throw new Error("Expected station-to-hospital exercise.");
  }

  const visuals = buildSyntheticLandmarkVisuals(marloweDistrictMap, exercise);
  const station = visuals.find((visual) => visual.id === "lm-fox-lane-station");
  const hospital = visuals.find((visual) => visual.id === "lm-northgate-hospital");
  const church = visuals.find((visual) => visual.id === "lm-st-anselm-church");

  assert.equal(station?.kind, "station");
  assert.equal(station?.isExerciseStop, true);
  assert.equal(station?.routable, false);
  assert.equal(hospital?.kind, "hospital");
  assert.equal(hospital?.isExerciseStop, true);
  assert.equal(church?.kind, "religious");
});

test("Stage 8.7 symbol candidates preserve source metadata, dedupe deterministically, and do not mutate input", () => {
  const fixture: OverpassJsonResponse = {
    elements: [
      { type: "node", id: 1, lat: 51.52, lon: -0.14 },
      { type: "node", id: 2, lat: 51.5203, lon: -0.1395 },
      { type: "node", id: 10, lat: 51.5201, lon: -0.1399, tags: { railway: "station", name: "London Atlas Station" } },
      { type: "node", id: 11, lat: 51.52011, lon: -0.13989, tags: { railway: "station", name: "Atlas Station" } },
      { type: "node", id: 12, lat: 51.52016, lon: -0.13982, tags: { amenity: "hospital", name: "Atlas Hospital" } },
      { type: "node", id: 13, lat: 51.52018, lon: -0.13978, tags: { amenity: "parking" } },
      { type: "way", id: 100, nodes: [1, 2], tags: { highway: "residential", name: "Atlas Road" } }
    ]
  };
  const fixtureBefore = structuredClone(fixture);
  const converted = convertOverpassJsonToRouteMap(fixture, { mapId: "stage-8-7-symbols", name: "Stage 8.7 symbols" });

  assert.equal(converted.ok, true);
  if (!converted.ok) return;

  const first = buildSyntheticLandmarkVisuals(converted.map, undefined, { sourceOverpassFixture: fixture });
  const second = buildSyntheticLandmarkVisuals(converted.map, undefined, { sourceOverpassFixture: fixture });
  const station = first.find((candidate) => candidate.symbolKind === "station");

  assert.deepEqual(second, first);
  assert.equal(first.filter((candidate) => candidate.symbolKind === "station").length, 1);
  assert.equal(first.filter((candidate) => candidate.symbolKind === "hospital").length, 1);
  assert.equal(first.some((candidate) => candidate.symbolKind === "parking"), false);
  assert.equal(station?.sourceMetadata?.provider, "openstreetmap");
  assert.equal(station?.sourceMetadata?.elementType, "node");
  assert.ok(station?.sourceMetadata?.tags?.railway === "station");
  assert.equal(station?.sourceGeometry?.length, 1);
  assert.deepEqual(fixture, fixtureBefore);
});

test("Stage 8.7 compact symbols obey bounded semantic sizes, viewport edges, mobile budgets, and label reservations", () => {
  const style = TOPOPASS_STREET_ATLAS_STYLE.atlasSymbols;
  const viewport = { width: 390, height: 844, mapBounds: { minX: 0, minY: 0, maxX: 390, maxY: 844 } };
  const visual = (id: string, kind: SyntheticLandmarkVisual["kind"], symbolKind: NonNullable<SyntheticLandmarkVisual["symbolKind"]>, x: number, y: number, priority: number): SyntheticLandmarkVisual => ({
    id,
    kind,
    symbolKind,
    label: id,
    point: { x, y },
    radius: style.styles[symbolKind].size,
    fillColor: style.styles[symbolKind].fillColor,
    strokeColor: style.styles[symbolKind].strokeColor,
    haloColor: "transparent",
    priority,
    isExerciseStop: false,
    routable: false
  });
  const crowded = Array.from({ length: 14 }, (_, index) => {
    const station = index < 8;
    const position = index % 7;
    return visual(
      `symbol-${index.toString().padStart(2, "0")}`,
      station ? "station" : "hospital",
      station ? "station" : "hospital",
      40 + position * 50,
      80 + Math.floor(index / 7) * 80,
      station ? 1 : 2
    );
  });
  const edge = visual("edge", "station", "station", 3, 100, 1);
  const roadLabel: SyntheticMapLabel = { id: "critical-road", kind: "road", text: "Atlas Road", point: { x: 200, y: 400 }, priority: 3, roadClass: "major", roadLengthMeters: 500 };
  const colliding = visual("colliding", "hospital", "hospital", 200, 400, 2);
  const stationLabel: SyntheticMapLabel = {
    id: "station-label",
    kind: "station",
    text: "Atlas Station",
    point: { x: 200, y: 400 },
    priority: 5,
    symbolKind: "station",
    category: "station"
  };
  const stationVisual = visual("station", "station", "station", 200, 400, 1);
  const stationReservations = syntheticLandmarkReservationBoxes([stationVisual], viewport, 1);
  const phoneCanvasViewport = { width: 900, height: 2160, mapBounds: viewport.mapBounds };

  assert.ok(Object.values(style.styles).every((symbolStyle) =>
    symbolStyle.size >= 6.9 &&
    symbolStyle.size <= 8.8 &&
    symbolStyle.strokeWidth >= 1.45 &&
    symbolStyle.strokeWidth <= 1.9 &&
    symbolStyle.haloWidth > 0 &&
    symbolStyle.haloColor.includes("rgba")
  ));
  assert.deepEqual([0.8, 1, 2, 4].map((zoom) => atlasSymbolSemanticScale(zoom, zoom)), [0.92, 1.04, 1.1, 1.14]);
  assert.ok(filterSyntheticLandmarkVisualsForViewport({ visuals: crowded, viewport, currentZoom: 1 }).length <= style.mobileMaxPerViewport);
  assert.equal(isPhoneAtlasViewport(phoneCanvasViewport), true);
  assert.ok(filterSyntheticLandmarkVisualsForViewport({ visuals: crowded, viewport: phoneCanvasViewport, currentZoom: 1 }).length <= style.mobileMaxPerViewport);
  assert.deepEqual(filterSyntheticLandmarkVisualsForViewport({ visuals: [edge], viewport, currentZoom: 1 }), []);
  assert.deepEqual(
    filterSyntheticLandmarkVisualsForViewport({ visuals: [colliding], viewport, currentZoom: 1, reservedLabels: [roadLabel] }),
    []
  );
  assert.deepEqual(
    filterSyntheticLandmarkVisualsForViewport({
      visuals: [colliding],
      viewport,
      currentZoom: 1,
      reservedBoxes: [{ id: "learner-marker", minX: 180, minY: 380, maxX: 220, maxY: 420 }]
    }),
    []
  );
  assert.ok(syntheticMapLabelSymbolOffsetX(stationLabel, viewport, 1, 78, 3) > style.styles.station.size);
  assert.deepEqual(
    filterSyntheticMapLabelsForViewport({ labels: [stationLabel], viewport, currentZoom: 1, reservedBoxes: stationReservations }),
    [stationLabel]
  );
});

test("Stage 8.7 road references validate source tags, separate multiple refs, and retain bounded A/B representation", () => {
  const fixture: OverpassJsonResponse = {
    elements: [
      { type: "node", id: 1, lat: 51.52, lon: -0.14 },
      { type: "node", id: 2, lat: 51.5202, lon: -0.1397 },
      { type: "node", id: 3, lat: 51.5204, lon: -0.1394 },
      { type: "way", id: 100, nodes: [1, 2, 3], tags: { highway: "primary", name: "Atlas Corridor", ref: "A10; B100" } },
      { type: "way", id: 101, nodes: [1, 2], tags: { highway: "primary", name: "Unsupported Ref", ref: "C7" } },
      { type: "way", id: 102, nodes: [2, 3], tags: { name: "No Highway Ref", ref: "A99" } }
    ]
  };
  const converted = convertOverpassJsonToRouteMap(fixture, { mapId: "stage-8-7-road-refs", name: "Stage 8.7 refs" });

  assert.equal(converted.ok, true);
  if (!converted.ok) return;

  const candidates = buildSyntheticMapLabels(converted.map, undefined, { sourceOverpassFixture: fixture })
    .filter((label) => label.kind === "road_reference");

  assert.deepEqual(candidates.map((label) => [label.text, label.roadReferenceClass]), [["A10", "a-road"], ["B100", "b-road"]]);
  assert.notDeepEqual(candidates[0].point, candidates[1].point);
  assert.ok(candidates.every((label) => label.sourceMetadata?.elementId === 100 && (label.roadLengthMeters ?? 0) > 0));
  assert.ok(candidates.every((label) => label.sourceGeometry?.length === 3));
  const referenceStyle = labelStyleForSyntheticMapLabel(candidates[0]);
  assert.equal(referenceStyle.color, "#c8102e");
  assert.ok(referenceStyle.font.startsWith("900 18.5px"));
  assert.ok(referenceStyle.haloColor.includes("255,246,222"));

  const viewport = { width: 6000, height: 900, mapBounds: { minX: 0, minY: 0, maxX: 6000, maxY: 900 } };
  const labels: SyntheticMapLabel[] = [
    ...Array.from({ length: 8 }, (_, index) => ({ id: `a-${index}`, kind: "road_reference" as const, text: `A${index + 1}`, point: { x: 250 + index * 450, y: 350 }, priority: 1, roadReferenceClass: "a-road" as const, roadLengthMeters: 1000 - index })),
    ...Array.from({ length: 3 }, (_, index) => ({ id: `z-b-${index}`, kind: "road_reference" as const, text: `B${index + 1}`, point: { x: 4100 + index * 450, y: 350 }, priority: 1, roadReferenceClass: "b-road" as const, roadLengthMeters: 700 - index }))
  ];
  const accepted = filterSyntheticMapLabelsForViewport({ labels, viewport, currentZoom: 1 });

  assert.equal(accepted.length, TOPOPASS_STREET_ATLAS_STYLE.labels.collision.roadReferenceZoomBudgets.principal);
  assert.equal(new Set(accepted.map((label) => label.text)).size, accepted.length);
  assert.ok(accepted.filter((label) => label.roadReferenceClass === "a-road").length <= 5);
  assert.ok(accepted.some((label) => label.roadReferenceClass === "b-road"));

  const split = filterSyntheticMapLabelsForViewport({
    labels: [
      { ...labels[0], id: "split-a", text: "A10", point: { x: 500, y: 600 } },
      { ...labels[0], id: "split-b", text: "A10", point: { x: 700, y: 600 } }
    ],
    viewport,
    currentZoom: 1
  });
  assert.equal(split.length, 1);
});

test("Stage 8.7 correction keeps genuine A501 source metadata and selects it at the King's Cross principal view", () => {
  const fixture = kingsCrossEustonOsmRouteRunnerMapOption.sourceOverpassFixture;
  const map = kingsCrossEustonOsmRouteRunnerMapOption.map;
  const baseViewport = {
    width: 1920,
    height: 912,
    mapBounds: getRouteRunnerMapViewportBounds(map, 1920, 912)
  };
  const viewport = buildZoomedMapViewport(
    baseViewport,
    createDefaultMapViewportState(ROUTE_RUNNER_MAP_ZOOM_LIMITS),
    ROUTE_RUNNER_MAP_ZOOM_LIMITS
  );
  const first = buildSyntheticMapLabels(map, kingsCrossEustonOsmRouteRunnerMapOption.exercises[0], {
    sourceOverpassFixture: fixture
  });
  const second = buildSyntheticMapLabels(map, kingsCrossEustonOsmRouteRunnerMapOption.exercises[0], {
    sourceOverpassFixture: fixture
  });
  const candidates = first.filter((label) => label.kind === "road_reference" && label.text === "A501");
  const accepted = filterSyntheticMapLabelsForViewport({ labels: first, viewport, currentZoom: 1 })
    .filter((label) => label.kind === "road_reference");
  const a501 = accepted.find((label) => label.text === "A501");

  assert.ok(candidates.length > 100);
  assert.ok(candidates.every((label) => label.sourceMetadata?.provider === "openstreetmap"));
  assert.ok(candidates.every((label) => label.sourceMetadata?.tags?.ref?.includes("A501")));
  assert.ok(candidates.every((label) => label.sourceGeometry && label.sourceGeometry.length >= 2));
  assert.ok(a501);
  assert.equal(a501.sourceMetadata?.elementId, 330341);
  assert.equal(a501.sourceMetadata?.tags?.name, "Penton Rise");
  assert.ok((a501.angleRadians ?? Math.PI) >= -Math.PI / 2 && (a501.angleRadians ?? -Math.PI) <= Math.PI / 2);
  assert.equal(new Set(accepted.map((label) => label.text)).size, accepted.length);
  assert.deepEqual(second, first);
});

test("Stage 8.7 correction renders displayed King's Cross A501 refs on matching major road geometry", () => {
  const fixture = kingsCrossEustonOsmRouteRunnerMapOption.sourceOverpassFixture;
  const map = kingsCrossEustonOsmRouteRunnerMapOption.map;
  const baseViewport = {
    width: 1920,
    height: 912,
    mapBounds: getRouteRunnerMapViewportBounds(map, 1920, 912)
  };
  const viewport = buildZoomedMapViewport(
    baseViewport,
    createDefaultMapViewportState(ROUTE_RUNNER_MAP_ZOOM_LIMITS),
    ROUTE_RUNNER_MAP_ZOOM_LIMITS
  );
  const labels = buildSyntheticMapLabels(map, kingsCrossEustonOsmRouteRunnerMapOption.exercises[0], {
    sourceOverpassFixture: fixture
  });
  const acceptedA501References = filterSyntheticMapLabelsForViewport({ labels, viewport, currentZoom: 1 })
    .filter((label) => label.kind === "road_reference" && label.text === "A501");
  const roadVisuals = buildSyntheticRoadVisuals(map);
  const passes = buildRoadRenderPasses(roadVisuals);
  const a501Visuals = roadVisuals.filter((visual) => visual.osmSourceTags?.ref?.split(/[;,]/).some((ref) => ref.trim() === "A501"));
  const tunnelA501 = a501Visuals.find((visual) => visual.osmSourceTags?.tunnel === "yes");

  assert.ok(a501Visuals.length > 200);
  assert.ok(acceptedA501References.length > 0);
  assert.ok(a501Visuals.every((visual) => visual.roadClass === "major"));
  assert.ok(a501Visuals.every((visual) => visual.osmHierarchy === "primary"));
  assert.ok(tunnelA501);

  if (tunnelA501) {
    const tunnelStyle = roadStyleForViewport(tunnelA501, viewport, 1);

    assert.equal(tunnelA501.osmHighway, "trunk");
    assert.ok(tunnelStyle.casingWidth >= TOPOPASS_STREET_ATLAS_STYLE.roads.osm.primary.casingWidth);
    assert.ok(tunnelStyle.strokeWidth >= TOPOPASS_STREET_ATLAS_STYLE.roads.osm.primary.strokeWidth);
    assert.equal(tunnelStyle.strokeColor, TOPOPASS_STREET_ATLAS_STYLE.roads.osm.primary.strokeColor);
  }

  for (const reference of acceptedA501References) {
    const sourceWayId = String(reference.sourceMetadata?.elementId);
    const matchingVisuals = a501Visuals.filter((visual) => visual.osmWayId === sourceWayId);
    const finalPasses = passes
      .filter((pass) => pass.visual.osmWayId === sourceWayId)
      .map((pass) => pass.layer);

    assert.ok(matchingVisuals.length > 0, `${reference.id} should have rendered road geometry for way ${sourceWayId}`);
    assert.ok(finalPasses.includes("casing"), `${reference.id} should reach the casing pass`);
    assert.ok(finalPasses.includes("fill"), `${reference.id} should reach the fill pass`);
    assert.ok(
      matchingVisuals.some((visual) => distanceToVisualGeometry(reference.point, visual) <= 0.001),
      `${reference.id} should sit on rendered geometry for way ${sourceWayId}`
    );
  }
});

test("Stage 8.7 correction repositions edge references, bounds repetition, and preserves road-name coexistence", () => {
  const viewport = { width: 1200, height: 600, mapBounds: { minX: 0, minY: 0, maxX: 1200, maxY: 600 } };
  const reference = (
    id: string,
    text: string,
    sourceGeometry: Array<{ x: number; y: number }>,
    point = sourceGeometry[0]
  ): SyntheticMapLabel => ({
    id,
    kind: "road_reference",
    text,
    point,
    angleRadians: Math.PI,
    priority: 1,
    roadReferenceClass: text.startsWith("B") ? "b-road" : "a-road",
    roadLengthMeters: 400,
    sourceGeometry
  });
  const nearEdge = reference("a10-edge", "A10", [{ x: -120, y: 120 }, { x: 520, y: 120 }], { x: 2, y: 120 });
  const tooShort = reference("a11-short", "A11", [{ x: 0, y: 70 }, { x: 40, y: 70 }]);
  const placements = roadReferencePlacementCandidatesForViewport(nearEdge, viewport, 1);

  assert.ok(placements.length >= 1);
  assert.ok(placements[0].label.point.x > 100);
  assert.ok(Math.abs(placements[0].label.angleRadians ?? Math.PI) <= Math.PI / 2);
  assert.deepEqual(filterSyntheticMapLabelsForViewport({ labels: [tooShort], viewport, currentZoom: 1 }), []);
  assert.equal(readableSyntheticLabelAngle(Math.PI * 0.8) < Math.PI / 2, true);
  assert.equal(readableSyntheticLabelAngle(-Math.PI * 0.8) > -Math.PI / 2, true);

  const labels: SyntheticMapLabel[] = [
    nearEdge,
    reference("a10-middle", "A10", [{ x: 610, y: 120 }, { x: 930, y: 120 }]),
    reference("a10-far", "A10", [{ x: 940, y: 120 }, { x: 1190, y: 120 }]),
    reference("b20", "B20", [{ x: 200, y: 300 }, { x: 520, y: 300 }]),
    {
      id: "road-name",
      kind: "road",
      text: "Atlas Corridor",
      point: { x: 750, y: 260 },
      angleRadians: 0,
      priority: 3,
      roadClass: "major",
      roadLengthMeters: 1000
    }
  ];
  const first = filterSyntheticMapLabelsForViewport({ labels, viewport, currentZoom: 1 });
  const second = filterSyntheticMapLabelsForViewport({ labels, viewport, currentZoom: 1 });

  assert.deepEqual(second, first);
  assert.ok(first.some((label) => label.text === "A10"));
  assert.ok(first.some((label) => label.text === "B20"));
  assert.ok(first.some((label) => label.text === "Atlas Corridor"));
  assert.ok(first.filter((label) => label.text === "A10").length <= 2);
  assert.ok(first.every((label) => label.kind !== "road_reference" || Math.abs(label.angleRadians ?? 0) <= Math.PI / 2));
});

test("Stage 8.8.1 benchmark renders principal atlas density on the production canvas", () => {
  const option = victoriaWestminsterVauxhallOsmRouteRunnerMapOption;
  const map = option.map;
  const fixture = option.sourceOverpassFixture;
  const backgroundFeatures = buildSyntheticBackgroundFeatures(map, {
    sourceOverpassFixture: fixture
  });
  const linearFeatures = buildSyntheticLinearFeatures(map, {
    sourceOverpassFixture: fixture
  });
  const labels = buildSyntheticMapLabels(map, undefined, {
    includeOsmRoadLabels: true,
    backgroundFeatures,
    linearFeatures,
    sourceOverpassFixture: fixture
  });
  const roadVisuals = buildSyntheticRoadVisuals(map);
  const roadPasses = buildRoadRenderPasses(roadVisuals);
  const productionCanvasWidth = 1120;
  const productionCanvasHeight = 760;
  const desktopBaseViewport = {
    width: productionCanvasWidth,
    height: productionCanvasHeight,
    mapBounds: getProductionRouteRunnerMapViewportBounds(map, productionCanvasWidth, productionCanvasHeight)
  };
  const mobileBaseViewport = {
    width: ROUTE_RUNNER_PHONE_MAP_CANVAS_WIDTH,
    height: ROUTE_RUNNER_PHONE_MAP_CANVAS_HEIGHT,
    mapBounds: getProductionRouteRunnerMapViewportBounds(
      map,
      ROUTE_RUNNER_PHONE_MAP_CANVAS_WIDTH,
      ROUTE_RUNNER_PHONE_MAP_CANVAS_HEIGHT
    )
  };
  const viewport = buildZoomedMapViewport(
    desktopBaseViewport,
    createDefaultMapViewportState(ROUTE_RUNNER_MAP_ZOOM_LIMITS),
    ROUTE_RUNNER_MAP_ZOOM_LIMITS
  );
  const mobileViewport = buildZoomedMapViewport(
    mobileBaseViewport,
    createDefaultMapViewportState(ROUTE_RUNNER_MAP_ZOOM_LIMITS),
    ROUTE_RUNNER_MAP_ZOOM_LIMITS
  );
  const placementDecisions: Array<{ accepted: boolean; reason?: string }> = [];
  const initiallyVisibleLabels = filterSyntheticMapLabelsForViewport({ labels, viewport, currentZoom: 1 });
  const visibleSymbols = filterSyntheticLandmarkVisualsForViewport({
    visuals: buildSyntheticLandmarkVisuals(map, undefined, { sourceOverpassFixture: fixture }),
    viewport,
    reservedLabels: initiallyVisibleLabels,
    currentZoom: 1
  });
  const visibleLabels = filterSyntheticMapLabelsForViewport({
    labels,
    viewport,
    reservedBoxes: syntheticLandmarkReservationBoxes(visibleSymbols, viewport, 1),
    currentZoom: 1,
    onPlacementDecision: (decision) => placementDecisions.push(decision)
  });
  const initiallyVisibleMobileLabels = filterSyntheticMapLabelsForViewport({
    labels,
    viewport: mobileViewport,
    currentZoom: 1
  });
  const visibleMobileSymbols = filterSyntheticLandmarkVisualsForViewport({
    visuals: buildSyntheticLandmarkVisuals(map, undefined, { sourceOverpassFixture: fixture }),
    viewport: mobileViewport,
    reservedLabels: initiallyVisibleMobileLabels,
    currentZoom: 1
  });
  const visibleMobileLabels = filterSyntheticMapLabelsForViewport({
    labels,
    viewport: mobileViewport,
    reservedBoxes: syntheticLandmarkReservationBoxes(visibleMobileSymbols, mobileViewport, 1),
    currentZoom: 1
  });
  const visibleBackgroundFeatures = filterSyntheticBackgroundFeaturesForViewport(backgroundFeatures, viewport);
  const roadLabels = visibleLabels.filter((label) => label.kind === "road");
  const roadReferences = visibleLabels.filter((label) => label.kind === "road_reference");
  const districtLabels = visibleLabels.filter((label) => label.kind === "district");
  const estateLabels = labels.filter((label) => label.text === "Tachbrook Estate" || label.text === "Peabody Estate");
  const squareLabel = labels.find((label) => label.text === "Orange Square");
  const roadVisualsByWay = new Map<string, SyntheticRoadVisual[]>();

  for (const visual of roadVisuals) {
    if (visual.osmWayId) {
      roadVisualsByWay.set(visual.osmWayId, [...(roadVisualsByWay.get(visual.osmWayId) ?? []), visual]);
    }
  }

  assert.equal(option.fixtureUse, "visualQaOnly");
  assert.equal(option.scoreable, false);
  assert.equal(map.roads.length, 8914, "building-only context geometry must not alter the route graph");
  assert.ok(backgroundFeatures.filter((feature) => feature.kind === "building").length >= 5600);
  assert.ok(visibleBackgroundFeatures.filter((feature) => feature.kind === "building").length >= 4000);
  assert.ok(backgroundFeatures.filter((feature) => feature.kind === "institution").length >= 10);
  assert.ok(backgroundFeatures.filter((feature) => feature.kind === "land-use").length >= 50);
  assert.ok(backgroundFeatures.some((feature) => feature.kind === "park"));
  assert.ok(backgroundFeatures.some((feature) => feature.kind === "water"));
  assert.ok(linearFeatures.some((feature) => feature.kind === "rail"));
  assert.ok(roadVisuals.filter((visual) => visual.roadClass === "major").length >= 700);
  assert.ok(roadLabels.length >= 80, `visible road labels=${roadLabels.length}`);
  assert.ok(roadReferences.length >= 4);
  assert.ok(roadReferences.length <= TOPOPASS_STREET_ATLAS_STYLE.labels.collision.roadReferenceZoomBudgets.principal);
  assert.ok(districtLabels.length >= 2);
  assert.ok(new Set(roadLabels.map((label) => label.text)).size >= 65);
  assert.ok(visibleSymbols.length >= 20, `visible symbols=${visibleSymbols.length}`);
  assert.ok(visibleMobileSymbols.length >= 10, `visible mobile symbols=${visibleMobileSymbols.length}`);
  assert.ok(
    visibleLabels.filter((label) => ["institution", "landmark", "public_building"].includes(label.kind)).length >= 35
  );
  assert.equal(
    placementDecisions.filter((decision) => decision.reason === "context-scale").length,
    0,
    "principal-scale context must not be suppressed by semantic scale gates"
  );
  assert.equal(placementDecisions.filter((decision) => decision.accepted).length, visibleLabels.length);
  assert.ok(placementDecisions.some((decision) => decision.reason === "collision"));
  assert.ok(placementDecisions.some((decision) => decision.reason === "viewport-edge"));
  assert.ok(visibleMobileLabels.filter((label) => label.kind === "road").length >= 50);
  assert.ok(visibleMobileLabels.every((label) => {
    const box = roadReferencePlacementCandidatesForViewport(label, mobileViewport, 1)[0]?.label ?? label;
    const point = mapToScreenPoint(box.point, mobileViewport);

    return point.x >= -1 && point.x <= mobileViewport.width + 1 && point.y >= -1 && point.y <= mobileViewport.height + 1;
  }));
  assert.ok(estateLabels.length > 0);
  assert.ok(estateLabels.every((label) => label.kind === "land_use" && label.category === "estate"));
  assert.equal(squareLabel?.kind, "land_use");
  assert.equal(squareLabel?.category, "contextual-land-use");
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.roads.osm.primary.casingWidth <= 16);
  assert.ok(
    TOPOPASS_STREET_ATLAS_STYLE.roads.osm.primary.casingWidth >
      TOPOPASS_STREET_ATLAS_STYLE.roads.osm.secondary.casingWidth
  );

  const pointVisibleAtReset = (lat: number, lon: number) => {
    const point = projectOsmCoordinateToLocalMeters({ lat, lon }, map.metadata.projection);
    const screenPoint = mapToScreenPoint(point, viewport);

    return screenPoint.x >= 0 && screenPoint.x <= viewport.width && screenPoint.y >= 0 && screenPoint.y <= viewport.height;
  };

  assert.equal(pointVisibleAtReset(51.4952, -0.1442), true, "Victoria should be visible at displayed 100%");
  assert.equal(pointVisibleAtReset(51.489, -0.1399), true, "Pimlico should be visible at displayed 100%");
  assert.equal(pointVisibleAtReset(51.5013, -0.125), true, "Westminster should be visible at displayed 100%");
  assert.equal(pointVisibleAtReset(51.4927, -0.1256), true, "Millbank should be visible at displayed 100%");
  assert.equal(pointVisibleAtReset(51.4861, -0.123), true, "Vauxhall should be visible at displayed 100%");
  assert.equal(pointVisibleAtReset(51.494, -0.1205), true, "the Thames corridor should be visible at displayed 100%");
  assert.equal(pointVisibleAtReset(51.5129, -0.1243), false, "Covent Garden should not be the reset focus");
  assert.equal(pointVisibleAtReset(51.5113, -0.1132), false, "Temple should not be the reset focus");
  assert.equal(pointVisibleAtReset(51.5116, -0.103), false, "Blackfriars should not be the reset focus");

  const requiredPrincipalLocations = [
    [51.4952, -0.1442, "Victoria"],
    [51.489, -0.1399, "Pimlico"],
    [51.5013, -0.125, "Westminster"],
    [51.4927, -0.1256, "Millbank"],
    [51.4861, -0.123, "Vauxhall"],
    [51.494, -0.1205, "the Thames corridor"]
  ] as const;

  for (const [width, height, viewportName] of [
    [1120, 760, "production"],
    [1024, 768, "tablet"],
    [390, 844, "mobile"]
  ] as const) {
    const responsiveViewport = buildZoomedMapViewport(
      { width, height, mapBounds: getProductionRouteRunnerMapViewportBounds(map, width, height) },
      createDefaultMapViewportState(ROUTE_RUNNER_MAP_ZOOM_LIMITS),
      ROUTE_RUNNER_MAP_ZOOM_LIMITS
    );

    for (const [lat, lon, locationName] of requiredPrincipalLocations) {
      const screenPoint = mapToScreenPoint(
        projectOsmCoordinateToLocalMeters({ lat, lon }, map.metadata.projection),
        responsiveViewport
      );
      assert.ok(
        screenPoint.x >= 0 && screenPoint.x <= width && screenPoint.y >= 0 && screenPoint.y <= height,
        `${locationName} should remain visible in the ${viewportName} displayed-100% reset`
      );
    }
  }

  for (const reference of roadReferences) {
    const sourceWayId = String(reference.sourceMetadata?.elementId);
    const matchingVisuals = roadVisualsByWay.get(sourceWayId) ?? [];
    const finalPasses = roadPasses
      .filter((pass) => pass.visual.osmWayId === sourceWayId)
      .map((pass) => pass.layer);

    assert.ok(matchingVisuals.length > 0, `${reference.id} should have matching rendered road geometry`);
    assert.ok(finalPasses.includes("casing"), `${reference.id} should render a casing`);
    assert.ok(finalPasses.includes("fill"), `${reference.id} should render a fill`);
    assert.ok(
      matchingVisuals.some((visual) => distanceToVisualGeometry(reference.point, visual) <= 0.001),
      `${reference.id} should sit on its own rendered road geometry`
    );
  }
});

test("buildSyntheticRouteOverlayVisuals creates route overlay visual models", () => {
  const overlays = buildSyntheticRouteOverlayVisuals({
    rawRoutePoints: [
      { x: 0, y: 0 },
      { x: 10, y: 0 }
    ],
    matchedRoutePoints: [
      { x: 0, y: 2 },
      { x: 10, y: 2 }
    ],
    shortestLegalRoutePoints: [
      { x: 0, y: 4 },
      { x: 10, y: 4 }
    ],
    acceptedAlternativeRoutePoints: [
      { x: 0, y: 6 },
      { x: 10, y: 6 }
    ],
    inefficientRoutePoints: [
      { x: 0, y: 8 },
      { x: 10, y: 8 }
    ],
    backtrackRoutePoints: [
      { x: 0, y: 10 },
      { x: 10, y: 10 }
    ],
    illegalRoutePoints: [
      { x: 0, y: 12 },
      { x: 10, y: 12 }
    ]
  });

  assert.deepEqual(
    overlays.map((overlay) => overlay.kind),
    [
      "raw-route",
      "matched-route",
      "shortest-legal-route",
      "accepted-alternative-route",
      "inefficient-section",
      "backtrack-section",
      "illegal-movement"
    ]
  );
  assert.equal(overlays.find((overlay) => overlay.kind === "shortest-legal-route")?.dash?.length, 2);
  assert.equal(
    overlays.find((overlay) => overlay.kind === "accepted-alternative-route")?.strokeColor,
    TOPOPASS_STREET_ATLAS_STYLE.routeOverlays.acceptedAlternativeRoute.strokeColor
  );
  assert.ok(
    (overlays.find((overlay) => overlay.kind === "illegal-movement")?.strokeWidth ?? 0) >
      (overlays.find((overlay) => overlay.kind === "inefficient-section")?.strokeWidth ?? 0)
  );
});

test("synthetic street map legend covers route restrictions stops and background", () => {
  const legendItems = buildSyntheticStreetMapLegendItems();
  const ids = legendItems.map((item) => item.id);

  assert.ok(ids.includes("major-road"));
  assert.ok(ids.includes("context-road"));
  assert.ok(ids.includes("your-route"));
  assert.ok(ids.includes("shortest-legal-route"));
  assert.ok(ids.includes("accepted-alternative-route"));
  assert.ok(ids.includes("illegal-movement"));
  assert.ok(ids.includes("inefficient-section"));
  assert.ok(ids.includes("no-entry"));
  assert.ok(ids.includes("one-way"));
  assert.ok(ids.includes("prohibited-turn"));
  assert.ok(ids.includes("restricted-road"));
  assert.ok(ids.includes("start"));
  assert.ok(ids.includes("checkpoint"));
  assert.ok(ids.includes("finish"));
  assert.ok(ids.includes("background"));
});
