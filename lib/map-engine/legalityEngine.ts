import { buildMapGraph } from "./graph.ts";
import type { MapDefinition, MapGraph, MapRestriction, MapRoad } from "./types.ts";

export const ILLEGAL_MOVEMENT_TYPES = [
  "wrong_way_one_way",
  "no_entry",
  "prohibited_turn",
  "no_u_turn",
  "disconnected_road_jump",
  "off_road"
] as const;

export type IllegalMovementType = (typeof ILLEGAL_MOVEMENT_TYPES)[number];

export type AttemptedRouteMovement = {
  roadId: string;
  fromNodeId: string;
  toNodeId: string;
};

export type IllegalMovement = {
  type: IllegalMovementType;
  movementIndex: number;
  roadId?: string;
  fromNodeId?: string;
  toNodeId?: string;
  viaNodeId?: string;
  previousRoadId?: string;
  nextRoadId?: string;
  restrictionId?: string;
  message: string;
};

export type LegalityCheckInput = {
  map: MapDefinition;
  movements: AttemptedRouteMovement[];
};

export type LegalityCheckResult = {
  isLegal: boolean;
  automaticFail: boolean;
  illegalMovements: IllegalMovement[];
};

type MovementContext = {
  movement: AttemptedRouteMovement;
  movementIndex: number;
  road: MapRoad | undefined;
  followsRoadEndpoints: boolean;
};

function isNoEntryRestriction(
  restriction: MapRestriction
): restriction is Extract<MapRestriction, { type: "no_entry" }> {
  return restriction.type === "no_entry";
}

function isProhibitedTurnRestriction(
  restriction: MapRestriction
): restriction is Extract<MapRestriction, { type: "prohibited_turn" }> {
  return restriction.type === "prohibited_turn";
}

function movementFollowsRoadEndpoints(movement: AttemptedRouteMovement, road: MapRoad): boolean {
  const followsForward = movement.fromNodeId === road.fromNodeId && movement.toNodeId === road.toNodeId;
  const followsReverse = movement.fromNodeId === road.toNodeId && movement.toNodeId === road.fromNodeId;

  return followsForward || followsReverse;
}

function movementIsWrongWayOnOneWay(movement: AttemptedRouteMovement, road: MapRoad): boolean {
  return road.isOneWay && movement.fromNodeId === road.toNodeId && movement.toNodeId === road.fromNodeId;
}

function noEntryBlocksMovement(
  restriction: Extract<MapRestriction, { type: "no_entry" }>,
  movement: AttemptedRouteMovement
): boolean {
  if (restriction.roadId !== movement.roadId) {
    return false;
  }

  if (!restriction.fromNodeId || !restriction.toNodeId) {
    return true;
  }

  return restriction.fromNodeId === movement.fromNodeId && restriction.toNodeId === movement.toNodeId;
}

function prohibitedTurnBlocksTransition(
  restriction: Extract<MapRestriction, { type: "prohibited_turn" }>,
  previousMovement: AttemptedRouteMovement,
  currentMovement: AttemptedRouteMovement
): boolean {
  return (
    restriction.fromRoadId === previousMovement.roadId &&
    restriction.viaNodeId === previousMovement.toNodeId &&
    restriction.toRoadId === currentMovement.roadId
  );
}

function movementIsImmediateUTurn(
  previousMovement: AttemptedRouteMovement,
  currentMovement: AttemptedRouteMovement
): boolean {
  return (
    previousMovement.roadId === currentMovement.roadId &&
    previousMovement.fromNodeId === currentMovement.toNodeId &&
    previousMovement.toNodeId === currentMovement.fromNodeId
  );
}

function unknownNodeIds(graph: MapGraph, movement: AttemptedRouteMovement): string[] {
  return [movement.fromNodeId, movement.toNodeId].filter((nodeId) => !graph.nodesById[nodeId]);
}

function movementIllegalBase(
  type: IllegalMovementType,
  context: MovementContext,
  message: string
): IllegalMovement {
  return {
    type,
    movementIndex: context.movementIndex,
    roadId: context.movement.roadId,
    fromNodeId: context.movement.fromNodeId,
    toNodeId: context.movement.toNodeId,
    message
  };
}

function movementContext(graph: MapGraph, movement: AttemptedRouteMovement, movementIndex: number): MovementContext {
  const road = graph.roadsById[movement.roadId];

  return {
    movement,
    movementIndex,
    road,
    followsRoadEndpoints: road ? movementFollowsRoadEndpoints(movement, road) : false
  };
}

function checkSingleMovement(
  graph: MapGraph,
  context: MovementContext,
  noEntryRestrictions: Array<Extract<MapRestriction, { type: "no_entry" }>>
): IllegalMovement[] {
  const illegalMovements: IllegalMovement[] = [];
  const { movement, road } = context;

  if (!road) {
    illegalMovements.push(
      movementIllegalBase(
        "disconnected_road_jump",
        context,
        `Movement ${context.movementIndex} references unknown road ${movement.roadId}.`
      )
    );
    return illegalMovements;
  }

  const missingNodes = unknownNodeIds(graph, movement);

  if (missingNodes.length > 0) {
    illegalMovements.push(
      movementIllegalBase(
        "disconnected_road_jump",
        context,
        `Movement ${context.movementIndex} references unknown node(s): ${missingNodes.join(", ")}.`
      )
    );
  }

  if (missingNodes.length === 0 && !context.followsRoadEndpoints) {
    illegalMovements.push(
      movementIllegalBase(
        "disconnected_road_jump",
        context,
        `Movement ${context.movementIndex} does not follow the endpoints of road ${movement.roadId}.`
      )
    );
  }

  if (context.followsRoadEndpoints && movementIsWrongWayOnOneWay(movement, road)) {
    illegalMovements.push(
      movementIllegalBase(
        "wrong_way_one_way",
        context,
        `Movement ${context.movementIndex} travels the wrong way on one-way road ${movement.roadId}.`
      )
    );
  }

  for (const restriction of noEntryRestrictions) {
    if (noEntryBlocksMovement(restriction, movement)) {
      illegalMovements.push({
        ...movementIllegalBase(
          "no_entry",
          context,
          `Movement ${context.movementIndex} uses no-entry road ${movement.roadId} from ${movement.fromNodeId} to ${movement.toNodeId}.`
        ),
        restrictionId: restriction.id
      });
    }
  }

  return illegalMovements;
}

function checkTransition(
  previousContext: MovementContext,
  currentContext: MovementContext,
  prohibitedTurnRestrictions: Array<Extract<MapRestriction, { type: "prohibited_turn" }>>
): IllegalMovement[] {
  const illegalMovements: IllegalMovement[] = [];
  const previousMovement = previousContext.movement;
  const currentMovement = currentContext.movement;

  if (previousMovement.toNodeId !== currentMovement.fromNodeId) {
    illegalMovements.push({
      ...movementIllegalBase(
        "disconnected_road_jump",
        currentContext,
        `Movement ${currentContext.movementIndex} starts at ${currentMovement.fromNodeId}, but the previous movement ended at ${previousMovement.toNodeId}.`
      ),
      previousRoadId: previousMovement.roadId,
      nextRoadId: currentMovement.roadId
    });
  }

  if (movementIsImmediateUTurn(previousMovement, currentMovement)) {
    illegalMovements.push({
      ...movementIllegalBase(
        "no_u_turn",
        currentContext,
        `Movement ${currentContext.movementIndex} immediately reverses on road ${currentMovement.roadId}.`
      ),
      previousRoadId: previousMovement.roadId,
      nextRoadId: currentMovement.roadId,
      viaNodeId: currentMovement.fromNodeId
    });
  }

  if (previousMovement.toNodeId === currentMovement.fromNodeId) {
    for (const restriction of prohibitedTurnRestrictions) {
      if (prohibitedTurnBlocksTransition(restriction, previousMovement, currentMovement)) {
        illegalMovements.push({
          ...movementIllegalBase(
            "prohibited_turn",
            currentContext,
            `Movement ${currentContext.movementIndex} makes a prohibited turn from road ${previousMovement.roadId} to road ${currentMovement.roadId} at node ${restriction.viaNodeId}.`
          ),
          previousRoadId: previousMovement.roadId,
          nextRoadId: currentMovement.roadId,
          viaNodeId: restriction.viaNodeId,
          restrictionId: restriction.id
        });
      }
    }
  }

  return illegalMovements;
}

export function checkRouteLegality(input: LegalityCheckInput): LegalityCheckResult {
  const graph = buildMapGraph(input.map);
  const noEntryRestrictions = input.map.restrictions.filter(isNoEntryRestriction);
  const prohibitedTurnRestrictions = input.map.restrictions.filter(isProhibitedTurnRestriction);
  const contexts = input.movements.map((movement, index) => movementContext(graph, movement, index));
  const illegalMovements: IllegalMovement[] = [];

  for (let index = 0; index < contexts.length; index += 1) {
    const context = contexts[index];

    illegalMovements.push(...checkSingleMovement(graph, context, noEntryRestrictions));

    if (index > 0) {
      illegalMovements.push(...checkTransition(contexts[index - 1], context, prohibitedTurnRestrictions));
    }
  }

  return {
    isLegal: illegalMovements.length === 0,
    automaticFail: illegalMovements.length > 0,
    illegalMovements
  };
}
