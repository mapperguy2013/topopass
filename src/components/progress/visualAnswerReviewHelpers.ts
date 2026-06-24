export type ReviewMistakeType = "knowledge" | "map-click" | "route";

export type SortableMistake = {
  date: string;
};

type MaybeCoordinate = {
  latitude?: unknown;
  longitude?: unknown;
  lat?: unknown;
  lng?: unknown;
} | null | undefined;

type MaybeRoutePoint = {
  x?: unknown;
  y?: unknown;
} | null | undefined;

export function getInitialAnswerVisibility() {
  return false;
}

export function toggleAnswerVisibility(current: boolean) {
  return !current;
}

export function retryHrefForMistakeType(type: ReviewMistakeType) {
  if (type === "knowledge") return "/practice/knowledge";
  if (type === "map-click") return "/practice/map-click";
  return "/practice/routes";
}

export function sortMistakesNewestFirst<T extends SortableMistake>(mistakes: T[]) {
  return [...mistakes].sort((a, b) => b.date.localeCompare(a.date));
}

export function hasUsableMapClickVisualData(
  userCoordinates?: MaybeCoordinate,
  correctCoordinates?: MaybeCoordinate
) {
  const hasUser =
    typeof userCoordinates?.latitude === "number" &&
    typeof userCoordinates?.longitude === "number";
  const hasCorrect =
    (typeof correctCoordinates?.lat === "number" &&
      typeof correctCoordinates?.lng === "number") ||
    (typeof correctCoordinates?.latitude === "number" &&
      typeof correctCoordinates?.longitude === "number");

  return hasUser || hasCorrect;
}

export function hasUsableRouteGeometry(points?: MaybeRoutePoint[] | null) {
  return (
    Array.isArray(points) &&
    points.filter(
      (point) => typeof point?.x === "number" && typeof point?.y === "number"
    ).length > 1
  );
}
