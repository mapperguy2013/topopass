import type { RouteMapPoint } from "@/src/data/maps/routeTypes";

export type RouteScoringBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type RouteScoringConfig = {
  maxScore: number;
  minDrawnPoints: number;
  mapUnitsToMeters: number;
  sampleSpacingMeters: number;
  startToleranceMeters: number;
  endToleranceMeters: number;
  routeMatchToleranceMeters: number;
  minimumCoveragePercent: number;
  minLengthRatio: number;
  maxLengthRatio: number;
  shortcutWarningRatio: number;
  shortcutMinimumCoveragePercent: number;
  boundsToleranceMeters: number;
  maximumOutsideBoundsPercent: number;
  maximumOffRoutePenalty: number;
  maximumDeviationPenaltyPoints: number;
  passPercentage: number;
  startPenaltyPoints: number;
  endPenaltyPoints: number;
  shortRoutePenaltyPoints: number;
  longRoutePenaltyPoints: number;
  boundsPenaltyPoints: number;
};

export type RouteScoringOptions = {
  bounds?: RouteScoringBounds;
  config?: Partial<RouteScoringConfig>;
};

export type RouteScoreResult = {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  coverageScore: number;
  startDistanceMeters: number;
  endDistanceMeters: number;
  drawnLengthMeters: number;
  acceptedLengthMeters: number;
  lengthRatio: number;
  offRoutePercent: number;
  outsideBoundsPercent: number;
  startPassed: boolean;
  endPassed: boolean;
  hasEnoughPoints: boolean;
  penalties: string[];
  warnings: string[];
  feedback: string[];
};

// The current 1600 x 1000 training map projects 0.02 degrees of latitude
// into 952 map units, which is approximately 2.33 metres per map unit.
export const DEFAULT_ROUTE_SCORING_CONFIG: RouteScoringConfig = {
  maxScore: 100,
  minDrawnPoints: 6,
  mapUnitsToMeters: 2.33,
  sampleSpacingMeters: 28,
  startToleranceMeters: 140,
  endToleranceMeters: 140,
  routeMatchToleranceMeters: 105,
  minimumCoveragePercent: 75,
  minLengthRatio: 0.6,
  maxLengthRatio: 1.8,
  shortcutWarningRatio: 0.75,
  shortcutMinimumCoveragePercent: 20,
  boundsToleranceMeters: 35,
  maximumOutsideBoundsPercent: 10,
  maximumOffRoutePenalty: 15,
  maximumDeviationPenaltyPoints: 25,
  passPercentage: 70,
  startPenaltyPoints: 10,
  endPenaltyPoints: 10,
  shortRoutePenaltyPoints: 25,
  longRoutePenaltyPoints: 18,
  boundsPenaltyPoints: 12
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundToOneDecimal(value: number) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : value;
}

function distanceBetween(a: RouteMapPoint, b: RouteMapPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function polylineLength(route: RouteMapPoint[]) {
  let length = 0;

  for (let index = 1; index < route.length; index += 1) {
    length += distanceBetween(route[index - 1], route[index]);
  }

  return length;
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
  if (route.length === 0) {
    return [];
  }

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

function isOutsideBounds(
  point: RouteMapPoint,
  bounds: RouteScoringBounds,
  tolerance: number
) {
  return (
    point.x < bounds.minX - tolerance ||
    point.x > bounds.maxX + tolerance ||
    point.y < bounds.minY - tolerance ||
    point.y > bounds.maxY + tolerance
  );
}

function emptyResult(
  acceptedLengthMeters: number,
  feedback: string,
  maxScore: number
) {
  return {
    score: 0,
    maxScore,
    percentage: 0,
    passed: false,
    coverageScore: 0,
    startDistanceMeters: Number.POSITIVE_INFINITY,
    endDistanceMeters: Number.POSITIVE_INFINITY,
    drawnLengthMeters: 0,
    acceptedLengthMeters: roundToOneDecimal(acceptedLengthMeters),
    lengthRatio: 0,
    offRoutePercent: 100,
    outsideBoundsPercent: 0,
    startPassed: false,
    endPassed: false,
    hasEnoughPoints: false,
    penalties: [feedback],
    warnings: [],
    feedback: [feedback]
  } satisfies RouteScoreResult;
}

export function scoreDrawnRoute(
  drawnRoute: RouteMapPoint[],
  acceptedRoute: RouteMapPoint[],
  options: RouteScoringOptions = {}
): RouteScoreResult {
  const config = {
    ...DEFAULT_ROUTE_SCORING_CONFIG,
    ...options.config
  };
  const acceptedLengthMeters =
    polylineLength(acceptedRoute) * config.mapUnitsToMeters;

  if (acceptedRoute.length < 2 || acceptedLengthMeters === 0) {
    return emptyResult(
      0,
      "The accepted route is not available for scoring.",
      config.maxScore
    );
  }

  if (drawnRoute.length < config.minDrawnPoints) {
    const result = emptyResult(
      acceptedLengthMeters,
      "Your route is too short to score.",
      config.maxScore
    );
    const drawnLengthMeters =
      polylineLength(drawnRoute) * config.mapUnitsToMeters;

    return {
      ...result,
      maxScore: config.maxScore,
      drawnLengthMeters: roundToOneDecimal(drawnLengthMeters),
      lengthRatio: roundToOneDecimal(
        acceptedLengthMeters > 0 ? drawnLengthMeters / acceptedLengthMeters : 0
      )
    };
  }

  const startDistanceMeters =
    distanceBetween(drawnRoute[0], acceptedRoute[0]) * config.mapUnitsToMeters;
  const endDistanceMeters =
    distanceBetween(
      drawnRoute[drawnRoute.length - 1],
      acceptedRoute[acceptedRoute.length - 1]
    ) * config.mapUnitsToMeters;
  const drawnLengthMeters =
    polylineLength(drawnRoute) * config.mapUnitsToMeters;
  const lengthRatio = drawnLengthMeters / acceptedLengthMeters;
  const sampleSpacing = config.sampleSpacingMeters / config.mapUnitsToMeters;
  const matchTolerance =
    config.routeMatchToleranceMeters / config.mapUnitsToMeters;
  const acceptedSamples = resamplePolyline(acceptedRoute, sampleSpacing);
  const drawnSamples = resamplePolyline(drawnRoute, sampleSpacing);
  const coveredSamples = acceptedSamples.filter(
    (point) => distanceToPolyline(point, drawnRoute) <= matchTolerance
  ).length;
  const coverageScore =
    acceptedSamples.length > 0
      ? (coveredSamples / acceptedSamples.length) * 100
      : 0;
  const offRouteSamples = drawnSamples.filter(
    (point) => distanceToPolyline(point, acceptedRoute) > matchTolerance
  );
  const offRoutePercent =
    drawnSamples.length > 0
      ? (offRouteSamples.length / drawnSamples.length) * 100
      : 100;
  const offRoutePenalty = clamp(
    (offRoutePercent / 100) * config.maximumDeviationPenaltyPoints,
    0,
    config.maximumDeviationPenaltyPoints
  );
  const boundsTolerance =
    config.boundsToleranceMeters / config.mapUnitsToMeters;
  const outsideBoundsSamples = options.bounds
    ? drawnSamples.filter((point) =>
        isOutsideBounds(point, options.bounds as RouteScoringBounds, boundsTolerance)
      )
    : [];
  const outsideBoundsPercent =
    options.bounds && drawnSamples.length > 0
      ? (outsideBoundsSamples.length / drawnSamples.length) * 100
      : 0;
  const startPassed = startDistanceMeters <= config.startToleranceMeters;
  const endPassed = endDistanceMeters <= config.endToleranceMeters;
  const coveragePassed = coverageScore >= config.minimumCoveragePercent;
  const lengthPassed =
    lengthRatio >= config.minLengthRatio &&
    lengthRatio <= config.maxLengthRatio;
  const boundsPassed =
    outsideBoundsPercent <= config.maximumOutsideBoundsPercent;
  const deviationPassed =
    offRoutePenalty <= config.maximumOffRoutePenalty;
  const penalties: string[] = [];
  const warnings: string[] = [];
  const feedback: string[] = [];
  let fixedPenaltyPoints = 0;

  if (!startPassed) {
    fixedPenaltyPoints += config.startPenaltyPoints;
    penalties.push(`Start accuracy: -${config.startPenaltyPoints} points.`);
    feedback.push(
      "This route does not start close enough to the start point."
    );
  }
  if (!endPassed) {
    fixedPenaltyPoints += config.endPenaltyPoints;
    penalties.push(`End accuracy: -${config.endPenaltyPoints} points.`);
    feedback.push(
      "This route does not end close enough to the destination."
    );
  }
  if (lengthRatio < config.minLengthRatio) {
    fixedPenaltyPoints += config.shortRoutePenaltyPoints;
    penalties.push(
      `Route length: -${config.shortRoutePenaltyPoints} points for a likely shortcut.`
    );
    feedback.push("This route may be too short.");
  } else if (lengthRatio > config.maxLengthRatio) {
    fixedPenaltyPoints += config.longRoutePenaltyPoints;
    penalties.push(
      `Route length: -${config.longRoutePenaltyPoints} points for an excessive detour.`
    );
    feedback.push("This route is much longer than the accepted route.");
  }
  if (
    lengthRatio < config.shortcutWarningRatio &&
    coverageScore > config.shortcutMinimumCoveragePercent
  ) {
    warnings.push(
      "This route is unusually short and may cut across non-road areas."
    );
  }
  if (!boundsPassed) {
    fixedPenaltyPoints += config.boundsPenaltyPoints;
    penalties.push(
      `Map area: -${config.boundsPenaltyPoints} points for leaving the expected area.`
    );
    warnings.push("This route may leave the expected map area.");
  }
  if (!coveragePassed) {
    feedback.push(
      `The route covers ${Math.round(coverageScore)}% of the accepted route. Aim for at least ${config.minimumCoveragePercent}%.`
    );
  }
  if (!deviationPassed) {
    feedback.push("Too much of the route runs away from the accepted route.");
  }

  const startPoints =
    15 *
    (1 -
      clamp(startDistanceMeters / config.startToleranceMeters, 0, 1));
  const endPoints =
    15 * (1 - clamp(endDistanceMeters / config.endToleranceMeters, 0, 1));
  const coveragePoints = (coverageScore / 100) * 70;
  const rawPercentage =
    clamp(
      startPoints +
        endPoints +
        coveragePoints -
        offRoutePenalty -
        fixedPenaltyPoints,
      0,
      100
    );
  const percentage = Math.round(rawPercentage);
  const score = Math.round((rawPercentage / 100) * config.maxScore);
  const passed =
    startPassed &&
    endPassed &&
    coveragePassed &&
    lengthPassed &&
    boundsPassed &&
    deviationPassed &&
    percentage >= config.passPercentage;

  if (offRoutePenalty > 0) {
    penalties.push(`Route deviation: -${roundToOneDecimal(offRoutePenalty)} points.`);
  }
  if (passed) {
    feedback.push("The route broadly matches the accepted driving route.");
  } else if (feedback.length === 0) {
    feedback.push("The route needs a more accurate line before it can pass.");
  }

  return {
    score,
    maxScore: config.maxScore,
    percentage,
    passed,
    coverageScore: roundToOneDecimal(coverageScore),
    startDistanceMeters: roundToOneDecimal(startDistanceMeters),
    endDistanceMeters: roundToOneDecimal(endDistanceMeters),
    drawnLengthMeters: roundToOneDecimal(drawnLengthMeters),
    acceptedLengthMeters: roundToOneDecimal(acceptedLengthMeters),
    lengthRatio: roundToOneDecimal(lengthRatio),
    offRoutePercent: roundToOneDecimal(offRoutePercent),
    outsideBoundsPercent: roundToOneDecimal(outsideBoundsPercent),
    startPassed,
    endPassed,
    hasEnoughPoints: true,
    penalties,
    warnings,
    feedback
  };
}
