import type { MapDefinition, RouteExercise } from "../../../lib/map-engine/index.ts";
import type { RouteRunnerMapOption } from "./routeRunnerMaps.ts";

const SIMPLE_SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

export type VersionMetadataValidationError = {
  scope: "map" | "exercise";
  mapId: string;
  exerciseId?: string;
  field: "mapVersion" | "exerciseVersion";
  value: unknown;
  message: string;
};

export type VersionMetadataValidationResult = {
  isValid: boolean;
  errors: VersionMetadataValidationError[];
};

export function isSimpleSemverVersion(value: unknown): value is string {
  return typeof value === "string" && SIMPLE_SEMVER_PATTERN.test(value);
}

export function validateRegisteredRouteRunnerVersionMetadata(
  mapOptions: readonly RouteRunnerMapOption[]
): VersionMetadataValidationResult {
  const errors: VersionMetadataValidationError[] = [];

  for (const option of mapOptions) {
    errors.push(...validateMapVersionMetadata(option.map));

    for (const exercise of option.exercises) {
      errors.push(...validateExerciseVersionMetadata(option.map.id, exercise));
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateMapVersionMetadata(map: Pick<MapDefinition, "id" | "mapVersion">): VersionMetadataValidationError[] {
  if (isSimpleSemverVersion(map.mapVersion)) {
    return [];
  }

  return [
    {
      scope: "map",
      mapId: map.id,
      field: "mapVersion",
      value: map.mapVersion,
      message: `map-version:invalid | map=${map.id} | mapVersion must use major.minor.patch semver format.`
    }
  ];
}

export function validateExerciseVersionMetadata(
  mapId: string,
  exercise: Pick<RouteExercise, "id" | "exerciseVersion">
): VersionMetadataValidationError[] {
  if (isSimpleSemverVersion(exercise.exerciseVersion)) {
    return [];
  }

  return [
    {
      scope: "exercise",
      mapId,
      exerciseId: exercise.id,
      field: "exerciseVersion",
      value: exercise.exerciseVersion,
      message: [
        "exercise-version:invalid",
        `map=${mapId}`,
        `exercise=${exercise.id}`,
        "exerciseVersion must use major.minor.patch semver format."
      ].join(" | ")
    }
  ];
}
