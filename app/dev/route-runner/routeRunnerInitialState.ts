import {
  createEmptyAdaptivePracticeLauncherState,
  type AdaptivePracticeLauncherState
} from "./adaptivePracticeLauncher.ts";
import {
  createEmptyLearnerWeakAreaProfile,
  type LearnerWeakAreaProfile
} from "./routeAttemptReview.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  type RouteRunnerMapOption
} from "./routeRunnerMapOptionUtils.ts";

export type RouteRunnerInitialSelectionInput = {
  initialMapOptionId?: string;
  initialExerciseId?: string;
  mapOptions?: readonly RouteRunnerMapOption[];
};

export type RouteRunnerInitialHydrationState = {
  mapOptionId: string;
  exerciseId: string;
  weakAreaProfile: LearnerWeakAreaProfile;
  adaptiveLauncherState: AdaptivePracticeLauncherState;
};

export function resolveRouteRunnerExerciseSelection(input: {
  exercises: readonly { id: string }[];
  requestedExerciseId?: string | null;
  defaultExerciseId?: string | null;
  scoreable?: boolean;
}): string {
  if (input.scoreable === false || input.exercises.length === 0) {
    return "";
  }

  const requestedExerciseId = input.requestedExerciseId?.trim();
  if (requestedExerciseId && input.exercises.some((exercise) => exercise.id === requestedExerciseId)) {
    return requestedExerciseId;
  }

  const defaultExerciseId = input.defaultExerciseId?.trim();
  if (defaultExerciseId && input.exercises.some((exercise) => exercise.id === defaultExerciseId)) {
    return defaultExerciseId;
  }

  return input.exercises[0]?.id ?? "";
}

export function createRouteRunnerInitialHydrationState(
  input: RouteRunnerInitialSelectionInput = {}
): RouteRunnerInitialHydrationState {
  const mapOptions = input.mapOptions ?? [];
  const initialMapOption =
    mapOptions.find((option) => option.id === (input.initialMapOptionId ?? DEFAULT_ROUTE_RUNNER_MAP_ID)) ??
    mapOptions[0];
  const initialExerciseId = resolveRouteRunnerExerciseSelection({
    exercises: initialMapOption?.exercises ?? [],
    requestedExerciseId: input.initialExerciseId,
    defaultExerciseId: initialMapOption?.defaultExerciseId
  });

  return {
    mapOptionId: initialMapOption?.id ?? input.initialMapOptionId ?? DEFAULT_ROUTE_RUNNER_MAP_ID,
    exerciseId: initialExerciseId,
    weakAreaProfile: createEmptyLearnerWeakAreaProfile(),
    adaptiveLauncherState: createEmptyAdaptivePracticeLauncherState()
  };
}
