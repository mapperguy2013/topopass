import type { RouteMapPoint } from "@/src/data/maps/routeTypes";

export type RouteScoringThresholds = {
  startTolerance: number;
  endTolerance: number;
  routeMatchTolerance: number;
  minimumCoveragePercent: number;
  maximumOffRoutePenalty: number;
};

export type RouteScoreResult = {
  passed: boolean;
  score: number;
  startPassed: boolean;
  endPassed: boolean;
  distanceFromStart: number;
  distanceFromEnd: number;
  routeCoveragePercent: number;
  offRoutePenalty: number;
  feedbackMessages: string[];
};

export const DEFAULT_ROUTE_SCORING_THRESHOLDS: RouteScoringThresholds = {
  startTolerance: 60,
  endTolerance: 60,
  routeMatchTolerance: 45,
  minimumCoveragePercent: 75,
  maximumOffRoutePenalty: 15
};

const SAMPLE_SPACING = 12;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function distanceBetween(a: RouteMapPoint, b: RouteMapPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(
  point: RouteMapPoint,
  start: RouteMapPoint,
  end: RouteMapPoint
) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (lengthSquared === 0) {
    return distanceBetween(point, start);
  }

  const progress = clamp(
    ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) /
      lengthSquared,
    0,
    1
  );

  return distanceBetween(point, {
    x: start.x + progress * deltaX,
    y: start.y + progress * deltaY
  });
}

function distanceToPolyline(point: RouteMapPoint, route: RouteMapPoint[]) {
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = 1; index < route.length; index += 1) {
    nearestDistance = Math.min(
      nearestDistance,
      distanceToSegment(point, route[index - 1], route[index])
    );
  }

  return nearestDistance;
}

function resamplePolyline(route: RouteMapPoint[], spacing: number) {
  const samples: RouteMapPoint[] = [route[0]];

  for (let index = 1; index < route.length; index += 1) {
    const start = route[index - 1];
    const end = route[index];
    const segmentLength = distanceBetween(start, end);
    const sampleCount = Math.max(1, Math.ceil(segmentLength / spacing));

    for (let sampleIndex = 1; sampleIndex <= sampleCount; sampleIndex += 1) {
      const progress = sampleIndex / sampleCount;
      samples.push({
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress
      });
    }
  }

  return samples;
}

export function scoreDrawnRoute(
  drawnRoute: RouteMapPoint[],
  acceptedRoute: RouteMapPoint[],
  thresholds: RouteScoringThresholds = DEFAULT_ROUTE_SCORING_THRESHOLDS
): RouteScoreResult {
  if (drawnRoute.length < 2 || acceptedRoute.length < 2) {
    return {
      passed: false,
      score: 0,
      startPassed: false,
      endPassed: false,
      distanceFromStart: Number.POSITIVE_INFINITY,
      distanceFromEnd: Number.POSITIVE_INFINITY,
      routeCoveragePercent: 0,
      offRoutePenalty: 25,
      feedbackMessages: ["Draw a complete route before submitting."]
    };
  }

  const distanceFromStart = distanceBetween(drawnRoute[0], acceptedRoute[0]);
  const distanceFromEnd = distanceBetween(
    drawnRoute[drawnRoute.length - 1],
    acceptedRoute[acceptedRoute.length - 1]
  );
  const acceptedSamples = resamplePolyline(acceptedRoute, SAMPLE_SPACING);
  const drawnSamples = resamplePolyline(drawnRoute, SAMPLE_SPACING);
  const coveredSamples = acceptedSamples.filter(
    (point) =>
      distanceToPolyline(point, drawnRoute) <= thresholds.routeMatchTolerance
  ).length;
  const routeCoveragePercent =
    (coveredSamples / acceptedSamples.length) * 100;
  const drawnDistances = drawnSamples.map((point) =>
    distanceToPolyline(point, acceptedRoute)
  );
  const offRouteSamples = drawnDistances.filter(
    (distance) => distance > thresholds.routeMatchTolerance
  );
  const offRouteRatio = offRouteSamples.length / drawnDistances.length;
  const averageExcess =
    offRouteSamples.length === 0
      ? 0
      : offRouteSamples.reduce(
          (sum, distance) =>
            sum + Math.max(0, distance - thresholds.routeMatchTolerance),
          0
        ) / offRouteSamples.length;
  const offRoutePenalty = clamp(
    offRouteRatio * 18 +
      (averageExcess / thresholds.routeMatchTolerance) * 7,
    0,
    25
  );

  const startPoints =
    15 * (1 - clamp(distanceFromStart / thresholds.startTolerance, 0, 1));
  const endPoints =
    15 * (1 - clamp(distanceFromEnd / thresholds.endTolerance, 0, 1));
  const coveragePoints = routeCoveragePercent * 0.7;
  const score = Math.round(
    clamp(startPoints + endPoints + coveragePoints - offRoutePenalty, 0, 100)
  );
  const startPassed = distanceFromStart <= thresholds.startTolerance;
  const endPassed = distanceFromEnd <= thresholds.endTolerance;
  const coveragePassed =
    routeCoveragePercent >= thresholds.minimumCoveragePercent;
  const deviationPassed =
    offRoutePenalty <= thresholds.maximumOffRoutePenalty;
  const passed =
    startPassed &&
    endPassed &&
    coveragePassed &&
    deviationPassed &&
    score >= 70;
  const feedbackMessages: string[] = [];

  if (!startPassed) {
    feedbackMessages.push("Start closer to the King's Cross route marker.");
  }
  if (!endPassed) {
    feedbackMessages.push("Finish closer to the Euston route marker.");
  }
  if (!coveragePassed) {
    feedbackMessages.push(
      `Only ${Math.round(routeCoveragePercent)}% of the accepted route was covered.`
    );
  }
  if (!deviationPassed) {
    feedbackMessages.push("Too much of the drawn line runs away from the accepted route.");
  }
  if (passed) {
    feedbackMessages.push("The route broadly matches the accepted driving route.");
  } else if (feedbackMessages.length === 0) {
    feedbackMessages.push("The route is close, but needs a more accurate line.");
  }

  return {
    passed,
    score,
    startPassed,
    endPassed,
    distanceFromStart: roundToOneDecimal(distanceFromStart),
    distanceFromEnd: roundToOneDecimal(distanceFromEnd),
    routeCoveragePercent: roundToOneDecimal(routeCoveragePercent),
    offRoutePenalty: roundToOneDecimal(offRoutePenalty),
    feedbackMessages
  };
}
