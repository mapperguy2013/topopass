import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  validateRouteExercise,
  type MapDefinition,
  type MapGraph,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";

export const INVALID_EXERCISE_ROUTE_MESSAGE = "This exercise has no legal route and needs fixing.";

export type ExerciseRouteAvailabilityLeg = {
  fromStopIndex: number;
  toStopIndex: number;
  fromNodeId: string;
  toNodeId: string;
  isAvailable: boolean;
  distanceMeters: number | null;
  reason: string | null;
};

export type ExerciseRouteAvailability = {
  exerciseId: string;
  isValid: boolean;
  reason: string | null;
  errors: string[];
  stopNodeIds: string[];
  legs: ExerciseRouteAvailabilityLeg[];
  missingLegs: ExerciseRouteAvailabilityLeg[];
  shortestRouteDistanceMeters: number | null;
  startToFinishAvailable: boolean | null;
  startToCheckpointAvailable: boolean | null;
  checkpointToFinishAvailable: boolean | null;
};

export function validateExerciseReachability(input: {
  map: MapDefinition;
  exercise: RouteExercise;
  graph?: MapGraph;
}): ExerciseRouteAvailability {
  const structuralValidation = validateRouteExercise(input.exercise, input.map);
  const graph = input.graph ?? buildMapGraph(input.map);
  const stopNodeIds = input.exercise.stops
    .map((stop) => {
      if (stop.type === "node") {
        return graph.nodesById[stop.nodeId] ? stop.nodeId : null;
      }

      const landmark = input.map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

      return landmark?.nearestNodeId && graph.nodesById[landmark.nearestNodeId] ? landmark.nearestNodeId : null;
    })
    .filter((nodeId): nodeId is string => Boolean(nodeId));
  const legs: ExerciseRouteAvailabilityLeg[] = [];
  const reachabilityErrors = [...structuralValidation.errors];

  if (structuralValidation.valid && stopNodeIds.length !== input.exercise.stops.length) {
    reachabilityErrors.push(`Route exercise ${input.exercise.id} cannot resolve all required stops to routable nodes`);
  }

  for (let index = 0; index < stopNodeIds.length - 1; index += 1) {
    const fromNodeId = stopNodeIds[index];
    const toNodeId = stopNodeIds[index + 1];
    const legRoute = findShortestLegalRouteThroughStops({
      graph,
      stopNodeIds: [fromNodeId, toNodeId],
      restrictions: input.map.restrictions
    });

    legs.push({
      fromStopIndex: index,
      toStopIndex: index + 1,
      fromNodeId,
      toNodeId,
      isAvailable: legRoute.found,
      distanceMeters: legRoute.found ? legRoute.distanceMeters : null,
      reason: legRoute.found ? null : `No legal route from ${fromNodeId} to ${toNodeId}.`
    });
  }

  const overallRoute =
    stopNodeIds.length >= 2
      ? findShortestLegalRouteThroughStops({
          graph,
          stopNodeIds,
          restrictions: input.map.restrictions
        })
      : null;
  const missingLegs = legs.filter((leg) => !leg.isAvailable);
  const errors = uniqueStrings([
    ...reachabilityErrors,
    ...missingLegs.map((leg) => leg.reason).filter((reason): reason is string => Boolean(reason)),
    ...(overallRoute && !overallRoute.found
      ? [
          `Route exercise ${input.exercise.id} has no valid legal route through required stops ${stopNodeIds.join(
            " -> "
          )}`
        ]
      : [])
  ]);
  const isValid = structuralValidation.valid && stopNodeIds.length === input.exercise.stops.length && Boolean(overallRoute?.found);
  const checkpointLegs = legs.slice(1);

  return {
    exerciseId: input.exercise.id,
    isValid,
    reason: isValid ? null : INVALID_EXERCISE_ROUTE_MESSAGE,
    errors,
    stopNodeIds,
    legs,
    missingLegs,
    shortestRouteDistanceMeters: overallRoute?.found ? overallRoute.distanceMeters : null,
    startToFinishAvailable: stopNodeIds.length === 2 ? legs[0]?.isAvailable ?? null : null,
    startToCheckpointAvailable: stopNodeIds.length > 2 ? legs[0]?.isAvailable ?? null : null,
    checkpointToFinishAvailable:
      stopNodeIds.length > 2 ? checkpointLegs.length > 0 && checkpointLegs.every((leg) => leg.isAvailable) : null
  };
}

export function validateExerciseReachabilityList(input: {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  graph?: MapGraph;
}): ExerciseRouteAvailability[] {
  const graph = input.graph ?? buildMapGraph(input.map);

  return input.exercises.map((exercise) =>
    validateExerciseReachability({
      map: input.map,
      exercise,
      graph
    })
  );
}

export function formatExerciseAvailabilityOptionLabel(exercise: RouteExercise, availability: ExerciseRouteAvailability): string {
  return availability.isValid ? exercise.title : `${exercise.title} (Invalid - no legal route)`;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
