import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyRouteDraft,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  mapToScreenPoint,
  screenToMapPoint,
  startRouteStroke,
  type ScreenMapViewport,
  type Vec2
} from "../../../lib/map-engine/index.ts";
import {
  buildFastestRouteOverlay,
  createHiddenFastestRouteRevealState,
  toggleFastestRouteReveal
} from "./fastestRouteOverlay.ts";
import {
  applyPanToMapView,
  applyWheelZoomToMapView,
  buildZoomedMapViewport,
  canDrawInMapInteractionMode,
  canPanInMapInteractionMode,
  canStartDrawingWithMapPointer,
  canZoomInMapView,
  canZoomOutMapView,
  clampMapPan,
  createDefaultMapScrollLockState,
  createDefaultMapViewportState,
  enterMapScrollLockState,
  getMapPanLimitsForZoom,
  isMiddleButtonMapPanActive,
  isMiddleButtonMapPanPointer,
  leaveMapScrollLockState,
  resetMapViewport,
  ROUTE_RUNNER_MAP_ZOOM_LIMITS,
  setMapInteractionMode,
  setMapPanMode,
  shouldPreventWheelPageScrollOverMap,
  shouldPreventMapWheelDefault,
  toggleMapPanMode,
  updateMapScrollLockForOutsidePointerDown,
  zoomMapViewAroundPoint,
  zoomInMapView,
  zoomOutMapView,
  type MapScrollLockState,
  type MapViewportState,
  type MapZoomLimits
} from "./mapViewport.ts";
import { buildRoadRestrictionOverlays } from "./routeRunnerDisplay.ts";

const testLimits: MapZoomLimits = {
  defaultZoom: 1,
  minZoom: 0.75,
  maxZoom: 2,
  step: 0.25,
  panMargin: 10
};

const baseViewport: ScreenMapViewport = {
  width: 200,
  height: 100,
  mapBounds: {
    minX: 0,
    minY: 0,
    maxX: 200,
    maxY: 100
  }
};

const defaultViewportState: MapViewportState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  interactionMode: "draw"
};

function assertClose(actual: number, expected: number, message: string): void {
  assert(Math.abs(actual - expected) < 0.000001, `${message}: expected ${actual} to be close to ${expected}`);
}

function assertPointsRoundTrip(points: readonly Vec2[], viewport: ScreenMapViewport): void {
  for (const point of points) {
    const actual = screenToMapPoint(mapToScreenPoint(point, viewport), viewport);

    assert(Math.abs(actual.x - point.x) < 0.000001, `Expected x ${actual.x} to round-trip to ${point.x}`);
    assert(Math.abs(actual.y - point.y) < 0.000001, `Expected y ${actual.y} to round-trip to ${point.y}`);
  }
}

function viewportForPoints(points: readonly Vec2[], width = 1000, height = 720): ScreenMapViewport {
  return {
    width,
    height,
    mapBounds: {
      minX: Math.min(...points.map((point) => point.x)),
      minY: Math.min(...points.map((point) => point.y)),
      maxX: Math.max(...points.map((point) => point.x)),
      maxY: Math.max(...points.map((point) => point.y))
    }
  };
}

test("zoom in increases zoom level", () => {
  const zoomed = zoomInMapView(createDefaultMapViewportState(testLimits), testLimits, baseViewport);

  assert.equal(zoomed.zoom, 1.25);
  assert.equal(zoomed.panX, 0);
  assert.equal(zoomed.panY, 0);
});

test("zoom out decreases zoom level", () => {
  const zoomed = zoomOutMapView({ ...defaultViewportState, zoom: 1.25 }, testLimits, baseViewport);

  assert.equal(zoomed.zoom, 1);
});

test("zoom is clamped at minimum and maximum values", () => {
  const minZoom = zoomOutMapView({ ...defaultViewportState, zoom: 0.75 }, testLimits, baseViewport);
  const maxZoom = zoomInMapView({ ...defaultViewportState, zoom: 2 }, testLimits, baseViewport);

  assert.equal(minZoom.zoom, 0.75);
  assert.equal(maxZoom.zoom, 2);
  assert.equal(canZoomOutMapView(minZoom, testLimits), false);
  assert.equal(canZoomInMapView(maxZoom, testLimits), false);
});

test("default route-runner zoom limits allow 1000 percent maximum zoom", () => {
  const zoomed = zoomInMapView({ ...defaultViewportState, zoom: 9.9 }, undefined, baseViewport);

  assert.equal(ROUTE_RUNNER_MAP_ZOOM_LIMITS.minZoom, 0.75);
  assert.equal(ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom, 10);
  assert.equal(zoomed.zoom, 10);
  assert.equal(canZoomInMapView(zoomed), false);
});

test("zoom clamp prevents route-runner viewport going above 1000 percent or below minimum", () => {
  const tooHigh = zoomInMapView({ ...defaultViewportState, zoom: 10 }, undefined, baseViewport);
  const tooLow = zoomOutMapView({ ...defaultViewportState, zoom: 0.75 }, undefined, baseViewport);

  assert.equal(tooHigh.zoom, 10);
  assert.equal(tooLow.zoom, 0.75);
  assert.equal(canZoomOutMapView(tooLow), false);
});

test("wheel zoom changes zoom and clamps within route-runner limits", () => {
  const focusPoint = { x: 150, y: 70 };
  const zoomedIn = applyWheelZoomToMapView(defaultViewportState, -100, focusPoint, baseViewport);
  const zoomedOut = applyWheelZoomToMapView(zoomedIn, 100, focusPoint, baseViewport);
  const maxZoom = applyWheelZoomToMapView({ ...defaultViewportState, zoom: 10 }, -100, focusPoint, baseViewport);
  const minZoom = applyWheelZoomToMapView({ ...defaultViewportState, zoom: 0.75 }, 100, focusPoint, baseViewport);

  assert.equal(zoomedIn.zoom, 1.25);
  assert.equal(zoomedOut.zoom, 1);
  assert.equal(maxZoom.zoom, 10);
  assert.equal(minZoom.zoom, 0.75);
});

test("wheel zoom preserves the map point under the cursor when possible", () => {
  const focusPoint = { x: 150, y: 75 };
  const beforeViewport = buildZoomedMapViewport(baseViewport, defaultViewportState, testLimits);
  const beforeMapPoint = screenToMapPoint(focusPoint, beforeViewport);
  const zoomed = zoomMapViewAroundPoint(defaultViewportState, 1.25, focusPoint, baseViewport, testLimits);
  const afterViewport = buildZoomedMapViewport(baseViewport, zoomed, testLimits);
  const afterMapPoint = screenToMapPoint(focusPoint, afterViewport);

  assert.equal(zoomed.zoom, 1.25);
  assertClose(afterMapPoint.x, beforeMapPoint.x, "cursor-focused wheel zoom should preserve x");
  assertClose(afterMapPoint.y, beforeMapPoint.y, "cursor-focused wheel zoom should preserve y");
});

test("wheel default prevention is limited to real wheel zoom deltas", () => {
  assert.equal(shouldPreventMapWheelDefault(-1), true);
  assert.equal(shouldPreventMapWheelDefault(1), true);
  assert.equal(shouldPreventMapWheelDefault(0), false);
  assert.equal(shouldPreventMapWheelDefault(Number.NaN), false);
});

test("wheel over the map prevents page scroll and still applies map zoom", () => {
  const hovered = enterMapScrollLockState(createDefaultMapScrollLockState());
  const focusPoint = { x: 150, y: 70 };
  const zoomed = applyWheelZoomToMapView(defaultViewportState, -100, focusPoint, baseViewport);

  assert.equal(shouldPreventWheelPageScrollOverMap(-100, hovered), true);
  assert.equal(shouldPreventWheelPageScrollOverMap({ deltaX: 36, deltaY: 0 }, hovered), true);
  assert.equal(zoomed.zoom, 1.25);
});

test("wheel outside the map does not prevent default page scrolling", () => {
  const notHovered = createDefaultMapScrollLockState();

  assert.equal(shouldPreventWheelPageScrollOverMap(-100, notHovered), false);
  assert.equal(shouldPreventWheelPageScrollOverMap(100, notHovered), false);
});

test("pointer leave restores normal page scroll behaviour", () => {
  const hovered = enterMapScrollLockState(createDefaultMapScrollLockState());
  const left = leaveMapScrollLockState(hovered);

  assert.deepEqual(left, {
    pointerInsideMap: false
  } satisfies MapScrollLockState);
  assert.equal(shouldPreventWheelPageScrollOverMap(-100, left), false);
});

test("clicking outside the map clears scroll lock state", () => {
  const hovered = enterMapScrollLockState(createDefaultMapScrollLockState());
  const stillHovered = updateMapScrollLockForOutsidePointerDown(hovered, true);
  const cleared = updateMapScrollLockForOutsidePointerDown(hovered, false);

  assert.equal(stillHovered.pointerInsideMap, true);
  assert.equal(cleared.pointerInsideMap, false);
  assert.equal(shouldPreventWheelPageScrollOverMap(-100, cleared), false);
});

test("interaction mode defaults to draw and can switch between draw and pan", () => {
  const panning = setMapInteractionMode(defaultViewportState, "pan");
  const drawing = setMapInteractionMode(panning, "draw");

  assert.equal(createDefaultMapViewportState(testLimits).interactionMode, "draw");
  assert.equal(panning.interactionMode, "pan");
  assert.equal(drawing.interactionMode, "draw");
});

test("interaction mode gates drawing and panning gestures", () => {
  const drawState = setMapInteractionMode(defaultViewportState, "draw");
  const panState = setMapInteractionMode(defaultViewportState, "pan");

  assert.equal(canDrawInMapInteractionMode(drawState), true);
  assert.equal(canPanInMapInteractionMode(drawState), false);
  assert.equal(canDrawInMapInteractionMode(panState), false);
  assert.equal(canPanInMapInteractionMode(panState), true);
});

test("middle mouse enters map pan behavior without creating drawing input", () => {
  assert.equal(isMiddleButtonMapPanPointer({ button: 1, pointerType: "mouse" }), true);
  assert.equal(isMiddleButtonMapPanActive({ buttons: 4, pointerType: "mouse" }), true);
  assert.equal(canStartDrawingWithMapPointer({ button: 1, pointerType: "mouse" }), false);
  assert.equal(
    shouldPreventWheelPageScrollOverMap(0, enterMapScrollLockState(createDefaultMapScrollLockState())),
    false
  );
});

test("left mouse and touch can still start route drawing", () => {
  assert.equal(canStartDrawingWithMapPointer({ button: 0, pointerType: "mouse" }), true);
  assert.equal(canStartDrawingWithMapPointer({ button: 0, pointerType: "touch" }), true);
  assert.equal(isMiddleButtonMapPanPointer({ button: 0, pointerType: "mouse" }), false);
});

test("legacy pan helpers map onto explicit interaction modes", () => {
  const enabled = setMapPanMode(defaultViewportState, true);

  assert.equal(enabled.interactionMode, "pan");
  assert.equal(setMapPanMode(enabled, false).interactionMode, "draw");
  assert.equal(toggleMapPanMode(defaultViewportState).interactionMode, "pan");
});

test("dragging in pan mode changes pan offset", () => {
  const panned = applyPanToMapView({ ...defaultViewportState, zoom: 2, interactionMode: "pan" }, {
    deltaX: 24,
    deltaY: -16
  }, baseViewport, testLimits);

  assert.deepEqual(panned, {
    zoom: 2,
    panX: 24,
    panY: -16,
    interactionMode: "pan"
  });
});

test("middle mouse movement uses normal pan offset updates and release can reset pan state", () => {
  const middlePanState = { ...defaultViewportState, zoom: 2, interactionMode: "draw" as const };
  const panned = applyPanToMapView(middlePanState, {
    deltaX: 18,
    deltaY: 12
  }, baseViewport, testLimits);
  const reset = resetMapViewport(testLimits);

  assert.equal(isMiddleButtonMapPanActive({ buttons: 4, pointerType: "mouse" }), true);
  assert.equal(isMiddleButtonMapPanActive({ buttons: 0, pointerType: "mouse" }), false);
  assert.equal(panned.panX, 18);
  assert.equal(panned.panY, 12);
  assert.deepEqual(reset, defaultViewportState);
});

test("pan is clamped at zoom-dependent limits", () => {
  const panned = applyPanToMapView({ ...defaultViewportState, zoom: 2 }, {
    deltaX: 999,
    deltaY: -999
  }, baseViewport, testLimits);
  const unzoomed = clampMapPan({ ...defaultViewportState, panX: 40, panY: 20 }, baseViewport, testLimits);

  assert.equal(panned.panX, 110);
  assert.equal(panned.panY, -60);
  assert.equal(unzoomed.panX, 0);
  assert.equal(unzoomed.panY, 0);
});

test("pan limits are symmetrical at higher zoom levels", () => {
  const positive = applyPanToMapView({ ...defaultViewportState, zoom: 2 }, {
    deltaX: 999,
    deltaY: 999
  }, baseViewport, testLimits);
  const negative = applyPanToMapView({ ...defaultViewportState, zoom: 2 }, {
    deltaX: -999,
    deltaY: -999
  }, baseViewport, testLimits);

  assert.equal(positive.panX, -negative.panX);
  assert.equal(positive.panY, -negative.panY);
});

test("zooming out clamps an existing pan offset back into valid range", () => {
  const zoomedOut = zoomOutMapView({ ...defaultViewportState, zoom: 2, panX: 110, panY: -60 }, testLimits, baseViewport);

  assert.equal(zoomedOut.zoom, 1.75);
  assert.equal(zoomedOut.panX, 85);
  assert.equal(zoomedOut.panY, -47.5);
});

test("pan bounds behave safely when viewport dimensions are zero or invalid", () => {
  const zeroBounds = { width: 0, height: 0 };
  const invalidBounds = { width: Number.NaN, height: Number.POSITIVE_INFINITY };
  const zeroPanned = clampMapPan({ ...defaultViewportState, zoom: 2, panX: 200, panY: -200 }, zeroBounds, testLimits);
  const invalidPanned = clampMapPan({ ...defaultViewportState, zoom: 2, panX: 200, panY: -200 }, invalidBounds, testLimits);

  assert.deepEqual(getMapPanLimitsForZoom(2, zeroBounds, testLimits), {
    maxPanX: 0,
    maxPanY: 0
  });
  assert.equal(zeroPanned.panX, 0);
  assert.equal(zeroPanned.panY, 0);
  assert.equal(invalidPanned.panX, 0);
  assert.equal(invalidPanned.panY, 0);
});

test("zoomed viewport builder handles zero viewport and map sizes without infinities", () => {
  const zeroViewport = buildZoomedMapViewport(
    {
      width: 0,
      height: 0,
      mapBounds: {
        minX: 4,
        minY: 8,
        maxX: 4,
        maxY: 8
      }
    },
    { ...defaultViewportState, zoom: 2, panX: 100, panY: -100 },
    testLimits
  );

  assert.deepEqual(zeroViewport, {
    width: 0,
    height: 0,
    mapBounds: {
      minX: 4,
      minY: 8,
      maxX: 4,
      maxY: 8
    }
  });
});

test("pan margin is bounded by viewport size to avoid large empty gaps", () => {
  assert.deepEqual(
    getMapPanLimitsForZoom(2, { width: 50, height: 20 }, { ...testLimits, panMargin: 80 }),
    {
      maxPanX: 30,
      maxPanY: 12
    }
  );
});

test("reset view restores default zoom, pan, and draw mode", () => {
  assert.deepEqual(resetMapViewport(testLimits), defaultViewportState);
});

test("reset view does not clear the draft route", () => {
  const draft = startRouteStroke(createEmptyRouteDraft(), { x: 12, y: 34 });
  const before = structuredClone(draft);

  resetMapViewport(testLimits);

  assert.deepEqual(draft, before);
});

test("switching interaction modes does not clear the draft route", () => {
  const draft = startRouteStroke(createEmptyRouteDraft(), { x: 12, y: 34 });
  const before = structuredClone(draft);

  setMapInteractionMode(defaultViewportState, "pan");
  setMapInteractionMode({ ...defaultViewportState, interactionMode: "pan" }, "draw");

  assert.deepEqual(draft, before);
});

test("reset view does not mutate revealed fastest route state", () => {
  const revealState = toggleFastestRouteReveal(createHiddenFastestRouteRevealState());
  const before = structuredClone(revealState);

  resetMapViewport(testLimits);

  assert.deepEqual(revealState, before);
});

test("switching exercise can reset zoom pan and pan mode to default without changing helper semantics", () => {
  const currentViewport = { ...defaultViewportState, zoom: 1.75, panX: 40, panY: -30, interactionMode: "pan" as const };
  const resetViewport = resetMapViewport(testLimits);

  assert.equal(currentViewport.zoom, 1.75);
  assert.deepEqual(resetViewport, defaultViewportState);
});

test("zoomed viewport keeps drawing coordinates aligned", () => {
  const zoomedViewport = buildZoomedMapViewport(baseViewport, { ...defaultViewportState, zoom: 2 }, testLimits);
  const mapPoint = { x: 125, y: 50 };
  const screenPoint = mapToScreenPoint(mapPoint, zoomedViewport);

  assert.deepEqual(zoomedViewport.mapBounds, {
    minX: 50,
    minY: 25,
    maxX: 150,
    maxY: 75
  });
  assert.deepEqual(screenPoint, { x: 150, y: 50 });
  assert.deepEqual(screenToMapPoint(screenPoint, zoomedViewport), mapPoint);
});

test("panned and zoomed viewport keeps drawing coordinates aligned", () => {
  const pannedViewport = buildZoomedMapViewport(
    baseViewport,
    { ...defaultViewportState, zoom: 2, panX: 20, panY: -10 },
    testLimits
  );
  const mapPoint = { x: 100, y: 50 };
  const screenPoint = mapToScreenPoint(mapPoint, pannedViewport);

  assert.deepEqual(pannedViewport.mapBounds, {
    minX: 40,
    minY: 30,
    maxX: 140,
    maxY: 80
  });
  assert.deepEqual(screenPoint, { x: 120, y: 40 });
  assert.deepEqual(screenToMapPoint(screenPoint, pannedViewport), mapPoint);
});

test("fastest route overlay points remain aligned after pan and zoom", () => {
  const pannedViewport = buildZoomedMapViewport(
    baseViewport,
    { ...defaultViewportState, zoom: 2, panX: -30, panY: 20 },
    testLimits
  );
  const fastestRouteMapPoints = [
    { x: 80, y: 30 },
    { x: 120, y: 70 }
  ];
  const fastestRouteScreenPoints = fastestRouteMapPoints.map((point) => mapToScreenPoint(point, pannedViewport));

  assert.deepEqual(
    fastestRouteScreenPoints.map((point) => screenToMapPoint(point, pannedViewport)),
    fastestRouteMapPoints
  );
});

test("drawn route road points remain aligned after zooming and panning", () => {
  const pannedViewport = buildZoomedMapViewport(
    baseViewport,
    { ...defaultViewportState, zoom: 1.75, panX: 45, panY: -20 },
    testLimits
  );
  const roadAlignedDraftPoints = [
    { x: 20, y: 20 },
    { x: 100, y: 20 },
    { x: 180, y: 20 }
  ];

  assertPointsRoundTrip(roadAlignedDraftPoints, pannedViewport);
});

test("required stop markers remain aligned after zooming and panning", () => {
  const exercise = marloweDistrictRouteExercises[0];
  const nodesById = Object.fromEntries(marloweDistrictMap.nodes.map((node) => [node.id, node]));
  const landmarksById = Object.fromEntries(marloweDistrictMap.landmarks.map((landmark) => [landmark.id, landmark]));
  const stopPoints = exercise.stops.flatMap((stop): Vec2[] => {
    if (stop.type === "node") {
      const node = nodesById[stop.nodeId];

      return node ? [{ x: node.x, y: node.y }] : [];
    }

    const landmark = landmarksById[stop.landmarkId];

    return landmark ? [{ x: landmark.x, y: landmark.y }] : [];
  });
  const pannedViewport = buildZoomedMapViewport(
    viewportForPoints(marloweDistrictMap.nodes),
    { ...defaultViewportState, zoom: 1.8, panX: 120, panY: -90 },
    testLimits
  );

  assert(stopPoints.length >= 2);
  assertPointsRoundTrip(stopPoints, pannedViewport);
});

test("road restriction icons remain aligned after zooming and panning", () => {
  const overlays = buildRoadRestrictionOverlays(marloweDistrictMap);
  const overlayPoints = overlays.flatMap((overlay) => [
    overlay.midpoint,
    ...overlay.points,
    ...(overlay.direction ? [overlay.direction.from, overlay.direction.to] : [])
  ]);
  const pannedViewport = buildZoomedMapViewport(
    viewportForPoints(marloweDistrictMap.nodes),
    { ...defaultViewportState, zoom: 2, panX: -140, panY: 95 },
    testLimits
  );

  assert(overlayPoints.length > 0);
  assertPointsRoundTrip(overlayPoints, pannedViewport);
});

test("revealed fastest route remains aligned after zooming and panning", () => {
  const exercise = marloweDistrictRouteExercises.find((candidate) => candidate.id === "ex-crown-market-gardens");

  assert.ok(exercise);

  const overlay = buildFastestRouteOverlay({
    map: marloweDistrictMap,
    exercise,
    revealState: { visible: true }
  });
  const pannedViewport = buildZoomedMapViewport(
    viewportForPoints(marloweDistrictMap.nodes),
    { ...defaultViewportState, zoom: 1.65, panX: 85, panY: 60 },
    testLimits
  );

  assert.equal(overlay.status, "available");
  assertPointsRoundTrip(overlay.points, pannedViewport);
});
