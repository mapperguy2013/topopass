import type { MapDefinition, RouteExercise } from "../../../lib/map-engine/index.ts";

export type RouteAttemptVersionSnapshot = {
  mapId: string;
  mapVersion: string | null;
  exerciseId: string;
  exerciseVersion: string | null;
};

export type RouteAttemptVersionSnapshotDisplay = {
  mapLabel: string;
  exerciseLabel: string;
  compactLabel: string;
};

function versionValue(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
}

export function createRouteAttemptVersionSnapshot(input: {
  map: Pick<MapDefinition, "id" | "mapVersion">;
  exercise: Pick<RouteExercise, "id" | "exerciseVersion">;
}): RouteAttemptVersionSnapshot {
  return {
    mapId: input.map.id,
    mapVersion: versionValue(input.map.mapVersion),
    exerciseId: input.exercise.id,
    exerciseVersion: versionValue(input.exercise.exerciseVersion)
  };
}

export function cloneRouteAttemptVersionSnapshot(
  snapshot: RouteAttemptVersionSnapshot | null | undefined
): RouteAttemptVersionSnapshot | null {
  return snapshot
    ? {
        mapId: snapshot.mapId,
        mapVersion: versionValue(snapshot.mapVersion),
        exerciseId: snapshot.exerciseId,
        exerciseVersion: versionValue(snapshot.exerciseVersion)
      }
    : null;
}

export function routeAttemptVersionSnapshotFromUnknown(value: unknown): RouteAttemptVersionSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const mapId = versionValue(source.mapId);
  const exerciseId = versionValue(source.exerciseId);

  if (!mapId || !exerciseId) {
    return null;
  }

  return {
    mapId,
    mapVersion: versionValue(source.mapVersion),
    exerciseId,
    exerciseVersion: versionValue(source.exerciseVersion)
  };
}

export function formatRouteAttemptVersionSnapshot(
  snapshot: RouteAttemptVersionSnapshot | null | undefined
): RouteAttemptVersionSnapshotDisplay {
  if (!snapshot) {
    return {
      mapLabel: "Map version unavailable",
      exerciseLabel: "Exercise version unavailable",
      compactLabel: "map version unavailable | exercise version unavailable"
    };
  }

  const mapVersion = snapshot.mapVersion ?? "unavailable";
  const exerciseVersion = snapshot.exerciseVersion ?? "unavailable";

  return {
    mapLabel: `${snapshot.mapId} @ ${mapVersion}`,
    exerciseLabel: `${snapshot.exerciseId} @ ${exerciseVersion}`,
    compactLabel: `map ${mapVersion} | exercise ${exerciseVersion}`
  };
}
