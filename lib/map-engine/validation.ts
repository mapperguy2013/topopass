import { buildMapGraph } from "./graph.ts";
import { findShortestLegalRouteThroughStops } from "./shortestRoute.ts";
import type { MapDefinition, MapRestriction, RouteExercise, RouteStop, ValidationResult } from "./types.ts";

export type RouteExerciseLegalReachabilityValidationResult = ValidationResult & {
  stopNodeIds: string[];
};

function duplicateIds(items: Array<{ id: string }>, label: string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) {
      duplicates.add(item.id);
    }
    seen.add(item.id);
  }

  return Array.from(duplicates).map((id) => `Duplicate ${label} id: ${id}`);
}

function restrictionReferenceErrors(
  restriction: MapRestriction,
  roadsById: Map<string, { fromNodeId: string; toNodeId: string }>,
  nodeIds: Set<string>
): string[] {
  if (restriction.type === "prohibited_turn") {
    const errors: string[] = [];
    const fromRoad = roadsById.get(restriction.fromRoadId);
    const toRoad = roadsById.get(restriction.toRoadId);

    if (!fromRoad) {
      errors.push(
        `Restriction ${restriction.id} references missing fromRoadId: ${restriction.fromRoadId}`
      );
    }

    if (!nodeIds.has(restriction.viaNodeId)) {
      errors.push(`Restriction ${restriction.id} references missing viaNodeId: ${restriction.viaNodeId}`);
    }

    if (!toRoad) {
      errors.push(`Restriction ${restriction.id} references missing toRoadId: ${restriction.toRoadId}`);
    }

    if (fromRoad && ![fromRoad.fromNodeId, fromRoad.toNodeId].includes(restriction.viaNodeId)) {
      errors.push(
        `Restriction ${restriction.id} viaNodeId ${restriction.viaNodeId} is not connected to fromRoadId: ${restriction.fromRoadId}`
      );
    }

    if (toRoad && ![toRoad.fromNodeId, toRoad.toNodeId].includes(restriction.viaNodeId)) {
      errors.push(
        `Restriction ${restriction.id} viaNodeId ${restriction.viaNodeId} is not connected to toRoadId: ${restriction.toRoadId}`
      );
    }

    return errors;
  }

  const road = roadsById.get(restriction.roadId);

  if (!road) {
    return [`Restriction ${restriction.id} references missing roadId: ${restriction.roadId}`];
  }

  const errors: string[] = [];

  if (restriction.type === "no_entry") {
    if (restriction.fromNodeId && !nodeIds.has(restriction.fromNodeId)) {
      errors.push(`Restriction ${restriction.id} references missing fromNodeId: ${restriction.fromNodeId}`);
    }

    if (restriction.toNodeId && !nodeIds.has(restriction.toNodeId)) {
      errors.push(`Restriction ${restriction.id} references missing toNodeId: ${restriction.toNodeId}`);
    }

    if (restriction.fromNodeId && ![road.fromNodeId, road.toNodeId].includes(restriction.fromNodeId)) {
      errors.push(
        `Restriction ${restriction.id} fromNodeId ${restriction.fromNodeId} is not an endpoint of roadId: ${restriction.roadId}`
      );
    }

    if (restriction.toNodeId && ![road.fromNodeId, road.toNodeId].includes(restriction.toNodeId)) {
      errors.push(
        `Restriction ${restriction.id} toNodeId ${restriction.toNodeId} is not an endpoint of roadId: ${restriction.roadId}`
      );
    }
  }

  return errors;
}

export function validateMapDefinition(map: MapDefinition): ValidationResult {
  const errors: string[] = [
    ...duplicateIds(map.nodes, "node"),
    ...duplicateIds(map.roads, "road"),
    ...duplicateIds(map.restrictions, "restriction"),
    ...duplicateIds(map.landmarks, "landmark")
  ];

  const nodeIds = new Set(map.nodes.map((node) => node.id));
  const roadsById = new Map(map.roads.map((road) => [road.id, road]));

  for (const road of map.roads) {
    if (road.distanceMeters <= 0) {
      errors.push(`Road ${road.id} distanceMeters must be positive`);
    }

    if (road.fromNodeId === road.toNodeId) {
      errors.push(`Road ${road.id} cannot start and end at the same node`);
    }

    if (!nodeIds.has(road.fromNodeId)) {
      errors.push(`Road ${road.id} references missing fromNodeId: ${road.fromNodeId}`);
    }

    if (!nodeIds.has(road.toNodeId)) {
      errors.push(`Road ${road.id} references missing toNodeId: ${road.toNodeId}`);
    }
  }

  for (const restriction of map.restrictions) {
    errors.push(...restrictionReferenceErrors(restriction, roadsById, nodeIds));
  }

  for (const landmark of map.landmarks) {
    if (landmark.nearestNodeId && !nodeIds.has(landmark.nearestNodeId)) {
      errors.push(`Landmark ${landmark.id} references missing nearestNodeId: ${landmark.nearestNodeId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateRouteExercise(exercise: RouteExercise, map: MapDefinition): ValidationResult {
  const errors: string[] = [];
  const nodeIds = new Set(map.nodes.map((node) => node.id));
  const landmarkIds = new Set(map.landmarks.map((landmark) => landmark.id));

  if (exercise.stops.length < 2) {
    errors.push(`Route exercise ${exercise.id} must contain at least 2 stops`);
  }

  for (const [index, stop] of exercise.stops.entries()) {
    if (stop.type === "node" && !nodeIds.has(stop.nodeId)) {
      errors.push(`Route exercise ${exercise.id} stop ${index + 1} references missing nodeId: ${stop.nodeId}`);
    }

    if (stop.type === "landmark" && !landmarkIds.has(stop.landmarkId)) {
      errors.push(
        `Route exercise ${exercise.id} stop ${index + 1} references missing landmarkId: ${stop.landmarkId}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function resolveRouteStopNodeId(stop: RouteStop, map: MapDefinition): string | null {
  if (stop.type === "node") {
    return map.nodes.some((node) => node.id === stop.nodeId) ? stop.nodeId : null;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  if (!landmark?.nearestNodeId || !map.nodes.some((node) => node.id === landmark.nearestNodeId)) {
    return null;
  }

  return landmark.nearestNodeId;
}

export function validateRouteExerciseLegalReachability(
  exercise: RouteExercise,
  map: MapDefinition
): RouteExerciseLegalReachabilityValidationResult {
  const structuralValidation = validateRouteExercise(exercise, map);
  const stopNodeIds = exercise.stops
    .map((stop) => resolveRouteStopNodeId(stop, map))
    .filter((nodeId): nodeId is string => Boolean(nodeId));
  const errors = [...structuralValidation.errors];

  if (!structuralValidation.valid) {
    return {
      valid: false,
      errors,
      stopNodeIds
    };
  }

  if (stopNodeIds.length !== exercise.stops.length || stopNodeIds.length < 2) {
    errors.push(`Route exercise ${exercise.id} cannot resolve all required stops to routable nodes`);
    return {
      valid: false,
      errors,
      stopNodeIds
    };
  }

  const graph = buildMapGraph(map);
  const route = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds,
    restrictions: map.restrictions
  });

  if (!route.found) {
    errors.push(
      `Route exercise ${exercise.id} has no valid legal route through required stops ${stopNodeIds.join(" -> ")}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    stopNodeIds
  };
}
