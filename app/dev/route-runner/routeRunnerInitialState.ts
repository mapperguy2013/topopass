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
  ROUTE_RUNNER_MAP_OPTIONS,
  type RouteRunnerMapOption
} from "./routeRunnerMaps.ts";

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

export function createRouteRunnerInitialHydrationState(
  input: RouteRunnerInitialSelectionInput = {}
): RouteRunnerInitialHydrationState {
  const mapOptions = input.mapOptions ?? ROUTE_RUNNER_MAP_OPTIONS;
  const initialMapOption =
    mapOptions.find((option) => option.id === (input.initialMapOptionId ?? DEFAULT_ROUTE_RUNNER_MAP_ID)) ??
    mapOptions[0] ??
    ROUTE_RUNNER_MAP_OPTIONS[0];
  const initialExerciseId =
    input.initialExerciseId && initialMapOption.exercises.some((exercise) => exercise.id === input.initialExerciseId)
      ? input.initialExerciseId
      : initialMapOption.defaultExerciseId;

  return {
    mapOptionId: initialMapOption.id,
    exerciseId: initialExerciseId,
    weakAreaProfile: createEmptyLearnerWeakAreaProfile(),
    adaptiveLauncherState: createEmptyAdaptivePracticeLauncherState()
  };
}
