import { distanceInMetres, type Coordinates } from "./distance.ts";

export type MapClickTarget = {
  lat: number;
  lng: number;
};

export type MapClickScoreResult = {
  coordinates: Coordinates;
  distance: number;
  isCorrect: boolean;
};

export function hasSelectedMapClickPoint(
  coordinates?: Coordinates | null
): coordinates is Coordinates {
  return Boolean(
    coordinates &&
      Number.isFinite(coordinates.latitude) &&
      Number.isFinite(coordinates.longitude)
  );
}

export function canSubmitMapClickAnswer(coordinates?: Coordinates | null) {
  return hasSelectedMapClickPoint(coordinates);
}

export function scoreMapClickAnswer({
  selectedCoordinates,
  target,
  passRadiusMetres
}: {
  selectedCoordinates?: Coordinates | null;
  target: MapClickTarget;
  passRadiusMetres: number;
}): MapClickScoreResult | null {
  if (!hasSelectedMapClickPoint(selectedCoordinates)) {
    return null;
  }

  const distance = distanceInMetres(selectedCoordinates, {
    latitude: target.lat,
    longitude: target.lng
  });

  return {
    coordinates: selectedCoordinates,
    distance,
    isCorrect: distance <= passRadiusMetres
  };
}

export function mapClickSelectionMessage({
  selectedCoordinates,
  hasSubmittedResult
}: {
  selectedCoordinates?: Coordinates | null;
  hasSubmittedResult: boolean;
}) {
  if (!hasSelectedMapClickPoint(selectedCoordinates)) {
    return "Click or tap the map to choose your answer.";
  }

  if (hasSubmittedResult) {
    return "Answer submitted. Click or tap the map again to change it.";
  }

  return "Point selected. You can change it before submitting.";
}
