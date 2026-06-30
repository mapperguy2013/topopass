import type { RouteExercise, RouteExerciseDifficulty } from "../../../lib/map-engine/index.ts";

const ROUTE_EXERCISE_DIFFICULTY_LABELS: Record<RouteExerciseDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard"
};

const ROUTE_EXERCISE_DIFFICULTIES = new Set<RouteExerciseDifficulty>(["easy", "medium", "hard"]);

export type RouteExerciseDisplayModel = {
  id: string;
  title: string;
  selectorLabel: string;
  description: string | null;
  difficulty: RouteExerciseDifficulty | null;
  difficultyLabel: string | null;
};

export function getRouteExerciseDisplayTitle(exercise: Pick<RouteExercise, "id" | "title">): string {
  const title = exercise.title.trim();

  return title.length > 0 ? title : exercise.id;
}

export function getRouteExerciseDescription(exercise: Pick<RouteExercise, "description">): string | null {
  const description = exercise.description?.trim();

  return description && description.length > 0 ? description : null;
}

export function getRouteExerciseDifficulty(
  exercise: Pick<RouteExercise, "difficulty">
): RouteExerciseDifficulty | null {
  const difficulty = exercise.difficulty;

  return difficulty && ROUTE_EXERCISE_DIFFICULTIES.has(difficulty) ? difficulty : null;
}

export function getRouteExerciseDifficultyLabel(exercise: Pick<RouteExercise, "difficulty">): string | null {
  const difficulty = getRouteExerciseDifficulty(exercise);

  return difficulty ? ROUTE_EXERCISE_DIFFICULTY_LABELS[difficulty] : null;
}

export function formatRouteExerciseSelectorLabel(exercise: RouteExercise, suffix?: string): string {
  const title = getRouteExerciseDisplayTitle(exercise);

  return suffix ? `${title} (${suffix})` : title;
}

export function buildRouteExerciseDisplayModel(exercise: RouteExercise): RouteExerciseDisplayModel {
  const difficulty = getRouteExerciseDifficulty(exercise);

  return {
    id: exercise.id,
    title: getRouteExerciseDisplayTitle(exercise),
    selectorLabel: formatRouteExerciseSelectorLabel(exercise),
    description: getRouteExerciseDescription(exercise),
    difficulty,
    difficultyLabel: difficulty ? ROUTE_EXERCISE_DIFFICULTY_LABELS[difficulty] : null
  };
}
