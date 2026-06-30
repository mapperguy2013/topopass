import type { Vec2 } from "../../../lib/map-engine/index.ts";

export type RouteReplayMode = "user" | "shortest" | "compare";
export type RouteReplayPlaybackStatus = "idle" | "playing" | "paused";
export type RouteReplayTrackKind = "user" | "shortest";

export type RouteReplayTrack = {
  kind: RouteReplayTrackKind;
  label: string;
  points: Vec2[];
};

export type RouteReplayMarker = {
  kind: RouteReplayTrackKind;
  label: string;
  point: Vec2;
  progress: number;
};

export type RouteReplayState = {
  mode: RouteReplayMode;
  status: RouteReplayPlaybackStatus;
  progress: number;
  speedMultiplier: number;
  durationMs: number;
  startedAtMs: number | null;
};

export const ROUTE_REPLAY_SPEED_OPTIONS = [0.5, 1, 2] as const;
export const DEFAULT_ROUTE_REPLAY_SPEED = 1;
export const DEFAULT_ROUTE_REPLAY_MODE: RouteReplayMode = "user";

const MIN_REPLAY_DURATION_MS = 1_500;
const MAX_REPLAY_DURATION_MS = 14_000;
const REPLAY_MS_PER_MAP_UNIT = 12;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function isFinitePoint(point: Vec2): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function distanceBetweenPoints(from: Vec2, to: Vec2): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

export function normaliseRouteReplayGeometry(points: readonly Vec2[] | null | undefined): Vec2[] {
  if (!points) {
    return [];
  }

  return points.filter(isFinitePoint).map((point) => ({ x: point.x, y: point.y }));
}

export function calculateRouteReplayLength(points: readonly Vec2[] | null | undefined): number {
  const routePoints = normaliseRouteReplayGeometry(points);
  let length = 0;

  for (let index = 1; index < routePoints.length; index += 1) {
    length += distanceBetweenPoints(routePoints[index - 1], routePoints[index]);
  }

  return length;
}

export function canReplayRouteGeometry(points: readonly Vec2[] | null | undefined): boolean {
  return calculateRouteReplayLength(points) > 0;
}

export function interpolateRouteReplayPoint(
  points: readonly Vec2[] | null | undefined,
  progress: number
): Vec2 | null {
  const routePoints = normaliseRouteReplayGeometry(points);

  if (routePoints.length === 0) {
    return null;
  }

  if (routePoints.length === 1) {
    return { ...routePoints[0] };
  }

  const routeLength = calculateRouteReplayLength(routePoints);

  if (routeLength === 0) {
    return { ...routePoints[0] };
  }

  const clampedProgress = clamp(progress, 0, 1);
  const targetDistance = routeLength * clampedProgress;
  let travelledDistance = 0;

  for (let index = 1; index < routePoints.length; index += 1) {
    const from = routePoints[index - 1];
    const to = routePoints[index];
    const segmentLength = distanceBetweenPoints(from, to);

    if (segmentLength === 0) {
      continue;
    }

    if (travelledDistance + segmentLength >= targetDistance) {
      const segmentProgress = (targetDistance - travelledDistance) / segmentLength;

      return {
        x: from.x + (to.x - from.x) * segmentProgress,
        y: from.y + (to.y - from.y) * segmentProgress
      };
    }

    travelledDistance += segmentLength;
  }

  return { ...routePoints[routePoints.length - 1] };
}

export function calculateRouteReplayDurationMs(input: {
  routeLength: number;
  speedMultiplier: number;
}): number {
  if (!Number.isFinite(input.routeLength) || input.routeLength <= 0) {
    return 0;
  }

  const speedMultiplier = clamp(input.speedMultiplier, 0.25, 4);
  const baseDuration = clamp(input.routeLength * REPLAY_MS_PER_MAP_UNIT, MIN_REPLAY_DURATION_MS, MAX_REPLAY_DURATION_MS);

  return Math.round(baseDuration / speedMultiplier);
}

export function createRouteReplayState(input: Partial<Pick<RouteReplayState, "mode" | "speedMultiplier">> = {}): RouteReplayState {
  return {
    mode: input.mode ?? DEFAULT_ROUTE_REPLAY_MODE,
    status: "idle",
    progress: 0,
    speedMultiplier: input.speedMultiplier ?? DEFAULT_ROUTE_REPLAY_SPEED,
    durationMs: 0,
    startedAtMs: null
  };
}

export function resetRouteReplayState(state: RouteReplayState = createRouteReplayState()): RouteReplayState {
  return {
    ...createRouteReplayState({
      mode: state.mode,
      speedMultiplier: state.speedMultiplier
    })
  };
}

export function selectRouteReplayMode(state: RouteReplayState, mode: RouteReplayMode): RouteReplayState {
  return {
    ...resetRouteReplayState(state),
    mode
  };
}

export function setRouteReplaySpeed(state: RouteReplayState, speedMultiplier: number): RouteReplayState {
  return {
    ...resetRouteReplayState(state),
    speedMultiplier: clamp(speedMultiplier, 0.25, 4)
  };
}

export function startRouteReplay(input: {
  state: RouteReplayState;
  durationMs: number;
  nowMs: number;
}): RouteReplayState {
  if (!Number.isFinite(input.durationMs) || input.durationMs <= 0) {
    return resetRouteReplayState(input.state);
  }

  const progress = input.state.progress >= 1 ? 0 : clamp(input.state.progress, 0, 1);

  return {
    ...input.state,
    status: "playing",
    progress,
    durationMs: input.durationMs,
    startedAtMs: input.nowMs - progress * input.durationMs
  };
}

export function pauseRouteReplay(state: RouteReplayState): RouteReplayState {
  if (state.status !== "playing") {
    return state;
  }

  return {
    ...state,
    status: "paused",
    startedAtMs: null
  };
}

export function advanceRouteReplayProgress(state: RouteReplayState, nowMs: number): RouteReplayState {
  if (state.status !== "playing" || state.startedAtMs === null || state.durationMs <= 0) {
    return state;
  }

  const progress = clamp((nowMs - state.startedAtMs) / state.durationMs, 0, 1);

  if (progress >= 1) {
    return {
      ...state,
      status: "paused",
      progress: 1,
      startedAtMs: null
    };
  }

  return {
    ...state,
    progress
  };
}

export function buildRouteReplayTracks(input: {
  mode: RouteReplayMode;
  userRoutePoints?: readonly Vec2[] | null;
  shortestRoutePoints?: readonly Vec2[] | null;
}): RouteReplayTrack[] {
  const tracks: RouteReplayTrack[] = [];

  if (input.mode === "user" || input.mode === "compare") {
    tracks.push({
      kind: "user",
      label: "My route",
      points: normaliseRouteReplayGeometry(input.userRoutePoints)
    });
  }

  if (input.mode === "shortest" || input.mode === "compare") {
    tracks.push({
      kind: "shortest",
      label: "Shortest route",
      points: normaliseRouteReplayGeometry(input.shortestRoutePoints)
    });
  }

  return tracks;
}

export function calculateRouteReplayTrackLength(tracks: readonly RouteReplayTrack[]): number {
  return tracks.reduce((longestLength, track) => Math.max(longestLength, calculateRouteReplayLength(track.points)), 0);
}

export function buildRouteReplayMarkers(input: {
  tracks: readonly RouteReplayTrack[];
  progress: number;
}): RouteReplayMarker[] {
  return input.tracks.flatMap((track) => {
    const point = interpolateRouteReplayPoint(track.points, input.progress);

    if (!point || !canReplayRouteGeometry(track.points)) {
      return [];
    }

    return [
      {
        kind: track.kind,
        label: track.label,
        point,
        progress: clamp(input.progress, 0, 1)
      }
    ];
  });
}
