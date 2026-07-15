import assert from "node:assert/strict";
import test from "node:test";
import {
  ROUTE_RUNNER_MAX_CANVAS_PIXEL_COUNT,
  assessRouteRunnerCanvasBudget,
  createActiveDrawingPipelineResult,
  createRouteRunnerMapGraphMemo,
  getRouteRunnerCanvasBackingStore,
  prepareTraceForRoutePipeline
} from "./routeRunnerPerformance.ts";
import { createDrawnRouteTrace, tinyMap, type MapDefinition, type MapGraph } from "../../../lib/map-engine/index.ts";

function fakeGraph(map: MapDefinition): MapGraph {
  return {
    mapId: map.id,
    nodesById: {},
    roadsById: {},
    edges: [],
    edgesById: {},
    outgoingEdgesByNodeId: {},
    incomingEdgesByNodeId: {}
  };
}

test("route-runner map graph memo reuses graph data for the same map reference", () => {
  const memo = createRouteRunnerMapGraphMemo(fakeGraph);
  const first = memo.getGraph(tinyMap);
  const second = memo.getGraph(tinyMap);

  assert.equal(first, second);
  assert.equal(memo.buildCount(), 1);
});

test("route-runner map graph memo rebuilds after clear or map reference change", () => {
  const memo = createRouteRunnerMapGraphMemo(fakeGraph);
  const copiedMap = {
    ...tinyMap,
    nodes: [...tinyMap.nodes],
    roads: [...tinyMap.roads],
    restrictions: [...tinyMap.restrictions],
    landmarks: [...tinyMap.landmarks]
  };

  memo.getGraph(tinyMap);
  memo.getGraph(copiedMap);

  assert.equal(memo.buildCount(), 2);

  memo.clear();
  memo.getGraph(tinyMap);

  assert.equal(memo.buildCount(), 1);
});

test("prepareTraceForRoutePipeline returns defensive copies for normal traces", () => {
  const trace = createDrawnRouteTrace([
    { x: 0, y: 0 },
    { x: 10, y: 0 }
  ]);
  const result = prepareTraceForRoutePipeline(trace, { maxPointCount: 10 });

  assert.equal(result.wasReduced, false);
  assert.equal(result.originalPointCount, 2);
  assert.equal(result.pointCount, 2);

  result.trace.points[0].x = 999;
  assert.equal(trace.points[0].x, 0);
});

test("prepareTraceForRoutePipeline caps very large route traces while preserving endpoints", () => {
  const trace = createDrawnRouteTrace(
    Array.from({ length: 100 }, (_, index) => ({
      x: index,
      y: index % 2
    }))
  );
  const result = prepareTraceForRoutePipeline(trace, {
    maxPointCount: 10,
    simplifyTolerance: 0
  });

  assert.equal(result.wasReduced, true);
  assert.equal(result.originalPointCount, 100);
  assert.equal(result.pointCount, 10);
  assert.deepEqual(result.trace.points[0], { x: 0, y: 0 });
  assert.deepEqual(result.trace.points[result.trace.points.length - 1], { x: 99, y: 1 });
});

test("prepareTraceForRoutePipeline handles empty traces safely", () => {
  const result = prepareTraceForRoutePipeline(createDrawnRouteTrace(), { maxPointCount: 10 });

  assert.equal(result.wasReduced, false);
  assert.equal(result.pointCount, 0);
  assert.deepEqual(result.trace.points, []);
});

test("createActiveDrawingPipelineResult avoids snapping matching and scoring while preserving points", () => {
  const trace = createDrawnRouteTrace([
    { x: 1, y: 2 },
    { x: 3, y: 4 }
  ]);
  const result = createActiveDrawingPipelineResult(trace);

  assert.equal(result.status, "empty");
  assert.deepEqual(result.simplifiedTrace.points, trace.points);
  assert.equal(result.snappedRoute, null);
  assert.equal(result.matchResult, null);
  assert.equal(result.exerciseResult, null);

  result.simplifiedTrace.points[0].x = 999;
  assert.equal(trace.points[0].x, 1);
});

test("Stage 8.10 canvas backing stores remain crisp and bounded across responsive profiles", () => {
  const development = getRouteRunnerCanvasBackingStore({ studentBeta: false, phone: false });
  const desktop = getRouteRunnerCanvasBackingStore({ studentBeta: true, phone: false });
  const phone = getRouteRunnerCanvasBackingStore({ studentBeta: true, phone: true });

  assert.deepEqual([development.width, development.height], [1120, 760]);
  assert.deepEqual([desktop.width, desktop.height], [1920, 912]);
  assert.deepEqual([phone.width, phone.height], [900, 2160]);

  for (const profile of [development, desktop, phone]) {
    assert.ok(profile.pixelCount <= ROUTE_RUNNER_MAX_CANVAS_PIXEL_COUNT);
    assert.equal(profile.estimatedRgbaBytes, profile.pixelCount * 4);
  }
});

test("Stage 8.10 high-DPR devices do not multiply the fixed canvas allocation", () => {
  const normal = assessRouteRunnerCanvasBudget({ studentBeta: true, phone: true, devicePixelRatio: 1 });
  const highDpr = assessRouteRunnerCanvasBudget({ studentBeta: true, phone: true, devicePixelRatio: 8 });

  assert.equal(highDpr.boundedDevicePixelRatio, 3);
  assert.equal(highDpr.allocationChangesWithDevicePixelRatio, false);
  assert.equal(highDpr.pixelCount, normal.pixelCount);
  assert.equal(highDpr.withinPixelBudget, true);
});
