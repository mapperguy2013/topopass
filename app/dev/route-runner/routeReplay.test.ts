import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceRouteReplayProgress,
  buildRouteReplayMarkers,
  buildRouteReplayTracks,
  calculateRouteReplayDurationMs,
  calculateRouteReplayLength,
  calculateRouteReplayTrackLength,
  canReplayRouteGeometry,
  createRouteReplayState,
  interpolateRouteReplayPoint,
  normaliseRouteReplayGeometry,
  pauseRouteReplay,
  resetRouteReplayState,
  selectRouteReplayMode,
  setRouteReplaySpeed,
  startRouteReplay
} from "./routeReplay.ts";

const route = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 }
];

test("normaliseRouteReplayGeometry filters invalid points and returns defensive copies", () => {
  const source = [{ x: 0, y: 0 }, { x: Number.NaN, y: 10 }, { x: 20, y: 30 }];
  const normalised = normaliseRouteReplayGeometry(source);

  assert.deepEqual(normalised, [
    { x: 0, y: 0 },
    { x: 20, y: 30 }
  ]);

  normalised[0].x = 99;

  assert.equal(source[0].x, 0);
});

test("calculateRouteReplayLength sums polyline distance", () => {
  assert.equal(calculateRouteReplayLength(route), 200);
});

test("interpolateRouteReplayPoint returns start at progress zero", () => {
  assert.deepEqual(interpolateRouteReplayPoint(route, 0), { x: 0, y: 0 });
});

test("interpolateRouteReplayPoint returns end at progress one", () => {
  assert.deepEqual(interpolateRouteReplayPoint(route, 1), { x: 100, y: 100 });
});

test("interpolateRouteReplayPoint clamps progress below zero to start", () => {
  assert.deepEqual(interpolateRouteReplayPoint(route, -2), { x: 0, y: 0 });
});

test("interpolateRouteReplayPoint clamps progress above one to end", () => {
  assert.deepEqual(interpolateRouteReplayPoint(route, 2), { x: 100, y: 100 });
});

test("interpolateRouteReplayPoint handles middle progress across segments", () => {
  assert.deepEqual(interpolateRouteReplayPoint(route, 0.75), { x: 100, y: 50 });
});

test("empty route geometry is handled safely", () => {
  assert.equal(canReplayRouteGeometry([]), false);
  assert.equal(calculateRouteReplayLength([]), 0);
  assert.equal(interpolateRouteReplayPoint([], 0.5), null);
});

test("single-point route geometry returns that point but is not replayable", () => {
  const singlePoint = [{ x: 12, y: 34 }];

  assert.equal(canReplayRouteGeometry(singlePoint), false);
  assert.deepEqual(interpolateRouteReplayPoint(singlePoint, 0.5), { x: 12, y: 34 });
});

test("calculateRouteReplayDurationMs applies speed multipliers deterministically", () => {
  const normal = calculateRouteReplayDurationMs({ routeLength: 500, speedMultiplier: 1 });

  assert.equal(normal, 6000);
  assert.equal(calculateRouteReplayDurationMs({ routeLength: 500, speedMultiplier: 2 }), 3000);
  assert.equal(calculateRouteReplayDurationMs({ routeLength: 500, speedMultiplier: 0.5 }), 12000);
  assert.equal(calculateRouteReplayDurationMs({ routeLength: 0, speedMultiplier: 1 }), 0);
});

test("route replay state reset preserves selected mode and speed", () => {
  const state = startRouteReplay({
    state: { ...createRouteReplayState({ mode: "shortest", speedMultiplier: 2 }), progress: 0.4 },
    durationMs: 4000,
    nowMs: 1000
  });

  assert.deepEqual(resetRouteReplayState(state), {
    mode: "shortest",
    status: "idle",
    progress: 0,
    speedMultiplier: 2,
    durationMs: 0,
    startedAtMs: null
  });
});

test("selectRouteReplayMode resets playback while storing the selected mode", () => {
  const state = startRouteReplay({
    state: createRouteReplayState(),
    durationMs: 4000,
    nowMs: 1000
  });

  assert.equal(selectRouteReplayMode(state, "compare").mode, "compare");
  assert.equal(selectRouteReplayMode(state, "compare").status, "idle");
  assert.equal(selectRouteReplayMode(state, "compare").progress, 0);
});

test("setRouteReplaySpeed resets playback with the new speed", () => {
  const state = startRouteReplay({
    state: createRouteReplayState(),
    durationMs: 4000,
    nowMs: 1000
  });
  const next = setRouteReplaySpeed(state, 2);

  assert.equal(next.speedMultiplier, 2);
  assert.equal(next.status, "idle");
});

test("start pause and advance replay progress safely", () => {
  const started = startRouteReplay({
    state: createRouteReplayState(),
    durationMs: 4000,
    nowMs: 1000
  });

  assert.equal(started.status, "playing");
  assert.equal(advanceRouteReplayProgress(started, 2000).progress, 0.25);
  assert.equal(pauseRouteReplay(advanceRouteReplayProgress(started, 2000)).status, "paused");

  const finished = advanceRouteReplayProgress(started, 6000);

  assert.equal(finished.status, "paused");
  assert.equal(finished.progress, 1);
});

test("buildRouteReplayTracks returns mode-specific replay tracks", () => {
  assert.deepEqual(
    buildRouteReplayTracks({
      mode: "user",
      userRoutePoints: route,
      shortestRoutePoints: [{ x: 1, y: 1 }]
    }).map((track) => track.kind),
    ["user"]
  );
  assert.deepEqual(
    buildRouteReplayTracks({
      mode: "compare",
      userRoutePoints: route,
      shortestRoutePoints: [{ x: 1, y: 1 }, { x: 2, y: 2 }]
    }).map((track) => track.kind),
    ["user", "shortest"]
  );
});

test("compare replay markers are generated at the same progress for both routes", () => {
  const tracks = buildRouteReplayTracks({
    mode: "compare",
    userRoutePoints: route,
    shortestRoutePoints: [
      { x: 0, y: 0 },
      { x: 0, y: 200 }
    ]
  });
  const markers = buildRouteReplayMarkers({ tracks, progress: 0.5 });

  assert.equal(calculateRouteReplayTrackLength(tracks), 200);
  assert.deepEqual(
    markers.map((marker) => ({ kind: marker.kind, point: marker.point })),
    [
      { kind: "user", point: { x: 100, y: 0 } },
      { kind: "shortest", point: { x: 0, y: 100 } }
    ]
  );
});
