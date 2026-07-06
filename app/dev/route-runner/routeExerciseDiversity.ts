import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  runRouteExercise,
  type MapDefinition,
  type MapGraph,
  type RouteExercise,
  type RouteStop
} from "../../../lib/map-engine/index.ts";
import type { RouteRunnerMapOption } from "./routeRunnerMaps.ts";

export const ROUTE_EXERCISE_DIVERSITY_MAX_OVERLAP_RATIO = 0.7;
export const ROUTE_EXERCISE_DIVERSITY_MIN_STOP_SEPARATION_METERS = 70;

export type RouteExerciseDiversitySummary = {
  id: string;
  title: string;
  startNodeId: string | null;
  destinationNodeId: string | null;
  checkpointNodeIds: string[];
  routeDistanceMeters: number | null;
  roadIds: string[];
  roadNames: string[];
  routeType: string;
  difficulty: string;
  syntheticPerfectAttemptScores: boolean;
};

export type RouteExerciseDiversityPair = {
  leftExerciseId: string;
  rightExerciseId: string;
  sharedRoadOverlapRatio: number;
  startSeparationMeters: number | null;
  destinationSeparationMeters: number | null;
  repeatedStartDestinationPair: boolean;
  teachingPurposeDiffers: boolean;
  tooSimilar: boolean;
};

export type RouteExerciseDiversityReport = {
  mapId: string;
  mapLabel: string;
  scoreable: boolean;
  exerciseCount: number;
  validExerciseCount: number;
  uniqueStartCount: number;
  uniqueDestinationCount: number;
  exercises: RouteExerciseDiversitySummary[];
  pairs: RouteExerciseDiversityPair[];
  tooSimilarPairs: RouteExerciseDiversityPair[];
  invalidExerciseIds: string[];
  isDiverse: boolean;
};

type ExerciseWithMetadata = RouteExercise & {
  realLondonPilotMetadata?: {
    routeType?: string;
    estimatedDistanceMeters?: number;
  };
};

type MapWithOptionalMetadata = MapDefinition & {
  metadata?: {
    metersPerPixel?: number;
  };
};

export function buildRouteExerciseDiversityReport(option: RouteRunnerMapOption): RouteExerciseDiversityReport {
  const graph = buildMapGraph(option.map);
  const scoreable = option.scoreable === true || (option.fixtureUse ?? "routableExercise") === "routableExercise";
  const summaries = option.exercises.map((exercise) => buildExerciseDiversitySummary(option.map, graph, exercise));
  const validExercises = summaries.filter((summary) => summary.routeDistanceMeters !== null && summary.syntheticPerfectAttemptScores);
  const pairs = buildDiversityPairs(option.map, graph, validExercises);
  const invalidExerciseIds = summaries
    .filter((summary) => summary.routeDistanceMeters === null || !summary.syntheticPerfectAttemptScores)
    .map((summary) => summary.id);

  return {
    mapId: option.map.id,
    mapLabel: option.label,
    scoreable,
    exerciseCount: option.exercises.length,
    validExerciseCount: validExercises.length,
    uniqueStartCount: new Set(validExercises.map((summary) => summary.startNodeId).filter(isString)).size,
    uniqueDestinationCount: new Set(validExercises.map((summary) => summary.destinationNodeId).filter(isString)).size,
    exercises: summaries,
    pairs,
    tooSimilarPairs: pairs.filter((pair) => pair.tooSimilar),
    invalidExerciseIds,
    isDiverse:
      !scoreable ||
      (validExercises.length >= Math.min(3, option.exercises.length) &&
        new Set(validExercises.map((summary) => summary.startNodeId).filter(isString)).size >= Math.min(3, validExercises.length) &&
        new Set(validExercises.map((summary) => summary.destinationNodeId).filter(isString)).size >=
          Math.min(3, validExercises.length) &&
        pairs.every((pair) => !pair.tooSimilar))
  };
}

function buildExerciseDiversitySummary(
  map: MapDefinition,
  graph: MapGraph,
  exercise: RouteExercise
): RouteExerciseDiversitySummary {
  const stopNodeIds = resolveExerciseStopNodeIds(map, exercise);
  const route =
    stopNodeIds.length >= 2
      ? findShortestLegalRouteThroughStops({
          graph,
          stopNodeIds,
          restrictions: map.restrictions
        })
      : { found: false as const };
  const roadIds = route.found ? route.roadIds : [];
  const routeType = routeTypeForExercise(exercise);

  return {
    id: exercise.id,
    title: exercise.title,
    startNodeId: stopNodeIds[0] ?? null,
    destinationNodeId: stopNodeIds.at(-1) ?? null,
    checkpointNodeIds: stopNodeIds.slice(1, -1),
    routeDistanceMeters: route.found ? route.distanceMeters : null,
    roadIds,
    roadNames: uniqueStrings(roadIds.map((roadId) => graph.roadsById[roadId]?.name?.trim() || roadId)),
    routeType,
    difficulty: exercise.difficulty ?? "unknown",
    syntheticPerfectAttemptScores: route.found
      ? runRouteExercise({
          map,
          exercises: [exercise],
          exerciseId: exercise.id,
          userRoute: {
            nodeIds: route.nodeIds,
            roadIds: route.roadIds
          }
        }).score.passed
      : false
  };
}

function buildDiversityPairs(
  map: MapDefinition,
  graph: MapGraph,
  summaries: readonly RouteExerciseDiversitySummary[]
): RouteExerciseDiversityPair[] {
  const pairs: RouteExerciseDiversityPair[] = [];

  for (let leftIndex = 0; leftIndex < summaries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < summaries.length; rightIndex += 1) {
      const left = summaries[leftIndex];
      const right = summaries[rightIndex];
      const sharedRoadOverlapRatio = routeOverlapRatio(left.roadIds, right.roadIds);
      const startSeparationMeters = nodeSeparation(map, graph, left.startNodeId, right.startNodeId);
      const destinationSeparationMeters = nodeSeparation(map, graph, left.destinationNodeId, right.destinationNodeId);
      const repeatedStartDestinationPair =
        left.startNodeId === right.startNodeId && left.destinationNodeId === right.destinationNodeId;
      const teachingPurposeDiffers =
        left.routeType !== right.routeType ||
        left.difficulty !== right.difficulty ||
        left.checkpointNodeIds.length !== right.checkpointNodeIds.length;
      const startsTooClose =
        startSeparationMeters !== null && startSeparationMeters < ROUTE_EXERCISE_DIVERSITY_MIN_STOP_SEPARATION_METERS;
      const destinationsTooClose =
        destinationSeparationMeters !== null &&
        destinationSeparationMeters < ROUTE_EXERCISE_DIVERSITY_MIN_STOP_SEPARATION_METERS;

      pairs.push({
        leftExerciseId: left.id,
        rightExerciseId: right.id,
        sharedRoadOverlapRatio,
        startSeparationMeters,
        destinationSeparationMeters,
        repeatedStartDestinationPair,
        teachingPurposeDiffers,
        tooSimilar:
          (repeatedStartDestinationPair && !teachingPurposeDiffers) ||
          (sharedRoadOverlapRatio > ROUTE_EXERCISE_DIVERSITY_MAX_OVERLAP_RATIO &&
            startsTooClose &&
            destinationsTooClose &&
            !teachingPurposeDiffers)
      });
    }
  }

  return pairs;
}

function routeOverlapRatio(leftRoadIds: readonly string[], rightRoadIds: readonly string[]): number {
  const left = new Set(leftRoadIds);
  const right = new Set(rightRoadIds);
  const smallerSize = Math.min(left.size, right.size);

  if (smallerSize === 0) {
    return 0;
  }

  let sharedCount = 0;

  for (const roadId of left) {
    if (right.has(roadId)) {
      sharedCount += 1;
    }
  }

  return sharedCount / smallerSize;
}

function nodeSeparation(
  map: MapDefinition,
  graph: MapGraph,
  leftNodeId: string | null,
  rightNodeId: string | null
): number | null {
  if (!leftNodeId || !rightNodeId) {
    return null;
  }

  const left = graph.nodesById[leftNodeId];
  const right = graph.nodesById[rightNodeId];

  if (!left || !right) {
    return null;
  }

  const pixelDistance = Math.hypot(right.x - left.x, right.y - left.y);
  const metersPerPixel = (map as MapWithOptionalMetadata).metadata?.metersPerPixel;

  return typeof metersPerPixel === "number" && Number.isFinite(metersPerPixel)
    ? pixelDistance * metersPerPixel
    : pixelDistance;
}

function resolveExerciseStopNodeIds(map: MapDefinition, exercise: RouteExercise): string[] {
  return exercise.stops.map((stop) => resolveExerciseStopNodeId(map, stop)).filter(isString);
}

function resolveExerciseStopNodeId(map: MapDefinition, stop: RouteStop): string | null {
  if (stop.type === "node") {
    return stop.nodeId;
  }

  return map.landmarks.find((landmark) => landmark.id === stop.landmarkId)?.nearestNodeId ?? null;
}

function routeTypeForExercise(exercise: RouteExercise): string {
  const metadataRouteType = (exercise as ExerciseWithMetadata).realLondonPilotMetadata?.routeType;

  if (metadataRouteType) {
    return metadataRouteType;
  }

  const title = exercise.title.toLowerCase();

  if (title.includes("one-way") || title.includes("no-entry") || title.includes("prohibited") || title.includes("restricted")) {
    return "restriction-awareness";
  }

  if (exercise.stops.length > 2) {
    return "checkpoint";
  }

  return "direct";
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function isString(value: string | null): value is string {
  return typeof value === "string";
}
