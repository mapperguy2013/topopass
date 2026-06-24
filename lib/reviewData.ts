import type { Coordinates } from "./distance.ts";
import type { RouteScoreResult } from "./routeScoring.ts";
import mapConfig from "../src/data/maps/kings-cross-euston/map-config.json";
import type { RouteMapPoint } from "../src/data/maps/routeTypes.ts";
import type { RouteQuestion } from "../src/data/routeQuestions.ts";

type LatLng = {
  lat: number;
  lng: number;
};

export type MapClickReviewData = {
  questionId: string;
  prompt?: string;
  userCoordinates?: LatLng;
  correctCoordinates?: LatLng;
  distanceMeters?: number;
  score?: number;
  isCorrect?: boolean;
  explanation?: string;
  tip?: string;
  acceptedAreaDescription?: string;
};

export type RouteReviewData = {
  questionId: string;
  title?: string;
  start?: LatLng & { label?: string };
  destination?: LatLng & { label?: string };
  userRoute?: LatLng[];
  referenceRoute?: LatLng[];
  userRouteMapPoints?: RouteMapPoint[];
  referenceRouteMapPoints?: RouteMapPoint[];
  routeSteps?: string[];
  score?: number;
  distanceMeters?: number;
  routeLengthMeters?: number;
  penalties?: string[];
  warnings?: string[];
  explanation?: string;
  tip?: string;
  idealRouteDescription?: string;
};

function validLatLng(point: LatLng) {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

export function coordinatesToLatLng(coordinates: Coordinates): LatLng {
  return {
    lat: coordinates.latitude,
    lng: coordinates.longitude
  };
}

export function mapPointToLatLng(point: RouteMapPoint): LatLng {
  const { width, height, padding, bounds } = mapConfig;
  const middleLatitude = (bounds.south + bounds.north) / 2;
  const longitudeScale = Math.cos((middleLatitude * Math.PI) / 180);
  const sourceWidth = (bounds.east - bounds.west) * longitudeScale;
  const sourceHeight = bounds.north - bounds.south;
  const scale = Math.min(
    (width - padding * 2) / sourceWidth,
    (height - padding * 2) / sourceHeight
  );
  const mapContentWidth = sourceWidth * scale;
  const mapContentHeight = sourceHeight * scale;
  const offsetX = (width - mapContentWidth) / 2;
  const offsetY = (height - mapContentHeight) / 2;

  return {
    lng: bounds.west + (point.x - offsetX) / (longitudeScale * scale),
    lat: bounds.north - (point.y - offsetY) / scale
  };
}

function mapRouteToLatLng(points: RouteMapPoint[]) {
  return points.map(mapPointToLatLng).filter(validLatLng);
}

export function createMapClickReviewData({
  questionId,
  prompt,
  userCoordinates,
  correctCoordinates,
  distanceMeters,
  score,
  isCorrect,
  explanation,
  tip,
  acceptedAreaDescription
}: {
  questionId: string;
  prompt?: string;
  userCoordinates?: Coordinates;
  correctCoordinates?: LatLng;
  distanceMeters?: number;
  score?: number;
  isCorrect?: boolean;
  explanation?: string;
  tip?: string;
  acceptedAreaDescription?: string;
}): MapClickReviewData {
  return {
    questionId,
    prompt,
    userCoordinates: userCoordinates
      ? coordinatesToLatLng(userCoordinates)
      : undefined,
    correctCoordinates,
    distanceMeters,
    score,
    isCorrect,
    explanation,
    tip,
    acceptedAreaDescription
  };
}

export function createRouteReviewData({
  question,
  userRoutePoints,
  routeScore
}: {
  question: RouteQuestion;
  userRoutePoints?: RouteMapPoint[];
  routeScore?: RouteScoreResult | null;
}): RouteReviewData {
  const referenceRouteMapPoints =
    question.acceptedRoute?.geometry.map(([x, y]) => ({ x, y })) ?? [];
  const userRoute = userRoutePoints ? mapRouteToLatLng(userRoutePoints) : [];
  const referenceRoute = mapRouteToLatLng(referenceRouteMapPoints);

  return {
    questionId: question.id,
    title: question.title,
    start: { ...question.from, label: question.fromLabel },
    destination: { ...question.to, label: question.toLabel },
    userRoute: userRoute.length > 1 ? userRoute : undefined,
    referenceRoute: referenceRoute.length > 1 ? referenceRoute : undefined,
    userRouteMapPoints:
      userRoutePoints && userRoutePoints.length > 1 ? userRoutePoints : undefined,
    referenceRouteMapPoints:
      referenceRouteMapPoints.length > 1 ? referenceRouteMapPoints : undefined,
    routeSteps: [question.fromLabel, "Suggested route", question.toLabel],
    score: routeScore?.percentage,
    distanceMeters: undefined,
    routeLengthMeters: routeScore?.drawnLengthMeters,
    penalties: routeScore?.penalties,
    warnings: routeScore?.warnings,
    explanation: question.explanation,
    tip: question.tip,
    idealRouteDescription: question.idealRouteDescription
  };
}
