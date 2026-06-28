import type { Vec2 } from "./geometry.ts";
import type { MapDefinition, MapRestriction, MapRoad } from "./types.ts";

export type TurnRestrictionVisualReason = "prohibited_turn";
export type TurnRestrictionVisualKind = "no-left-turn" | "no-right-turn" | "no-u-turn";
export type TurnRestrictionMovementClass = "left" | "right" | "u_turn" | "straight";

const STRAIGHT_TURN_THRESHOLD_DEGREES = 30;
const U_TURN_THRESHOLD_DEGREES = 150;
const APPROACH_SIGN_RATIO = 0.7;
const DRIVER_LEFT_SIGN_OFFSET = 12;
const OVERLAPPING_SIGN_OFFSET = 14;

export type TurnRestrictionVisual = {
  id: string;
  reason: TurnRestrictionVisualReason;
  turnKind: TurnRestrictionVisualKind;
  turnClass: Exclude<TurnRestrictionMovementClass, "straight">;
  fromRoadId: string;
  toRoadId: string;
  viaNodeId: string;
  label: string;
  message: string;
  junction: Vec2;
  incomingRoadPoint: Vec2;
  outgoingRoadPoint: Vec2;
  signPosition: Vec2;
  iconRotationRadians: number;
  angleDegrees: number;
  incomingAngleRadians: number;
  outgoingAngleRadians: number;
  markerAngleRadians: number;
  restrictionReason?: string;
};

function nodePoint(map: MapDefinition, nodeId: string): Vec2 | undefined {
  const node = map.nodes.find((candidate) => candidate.id === nodeId);

  return node ? { x: node.x, y: node.y } : undefined;
}

function roadById(map: MapDefinition, roadId: string): MapRoad | undefined {
  return map.roads.find((road) => road.id === roadId);
}

function otherRoadEndpoint(road: MapRoad, viaNodeId: string): string | null {
  if (road.fromNodeId === viaNodeId) {
    return road.toNodeId;
  }

  if (road.toNodeId === viaNodeId) {
    return road.fromNodeId;
  }

  return null;
}

function roadClosedBlocksMovement(
  restriction: Extract<MapRestriction, { type: "road_closed" }>,
  roadId: string
): boolean {
  return restriction.roadId === roadId;
}

function noEntryBlocksMovement(
  restriction: Extract<MapRestriction, { type: "no_entry" }>,
  roadId: string,
  fromNodeId: string,
  toNodeId: string
): boolean {
  if (restriction.roadId !== roadId) {
    return false;
  }

  if (!restriction.fromNodeId || !restriction.toNodeId) {
    return true;
  }

  return restriction.fromNodeId === fromNodeId && restriction.toNodeId === toNodeId;
}

function oneWayBlocksMovement(road: MapRoad, fromNodeId: string, toNodeId: string): boolean {
  return road.isOneWay && road.fromNodeId === toNodeId && road.toNodeId === fromNodeId;
}

function roadLevelRestrictionBlocksMovement(input: {
  map: MapDefinition;
  road: MapRoad;
  fromNodeId: string;
  toNodeId: string;
}): boolean {
  if (oneWayBlocksMovement(input.road, input.fromNodeId, input.toNodeId)) {
    return true;
  }

  return input.map.restrictions.some((restriction) => {
    if (restriction.type === "road_closed") {
      return roadClosedBlocksMovement(restriction, input.road.id);
    }

    if (restriction.type === "no_entry") {
      return noEntryBlocksMovement(restriction, input.road.id, input.fromNodeId, input.toNodeId);
    }

    return false;
  });
}

function angleFromJunction(junction: Vec2, point: Vec2): number {
  return Math.atan2(point.y - junction.y, point.x - junction.x);
}

function markerAngle(incomingAngle: number, outgoingAngle: number): number {
  return Math.atan2(
    Math.sin(incomingAngle) + Math.sin(outgoingAngle),
    Math.cos(incomingAngle) + Math.cos(outgoingAngle)
  );
}

function lerpPoint(from: Vec2, to: Vec2, ratio: number): Vec2 {
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio
  };
}

function signPositionOnApproachRoad(incomingRoadPoint: Vec2, junction: Vec2): Vec2 {
  const signBase = lerpPoint(incomingRoadPoint, junction, APPROACH_SIGN_RATIO);
  const incomingVector = {
    x: junction.x - incomingRoadPoint.x,
    y: junction.y - incomingRoadPoint.y
  };
  const length = Math.hypot(incomingVector.x, incomingVector.y);

  if (length === 0) {
    return signBase;
  }

  const direction = {
    x: incomingVector.x / length,
    y: incomingVector.y / length
  };
  const driverLeftNormal = {
    x: direction.y,
    y: -direction.x
  };

  return {
    x: signBase.x + driverLeftNormal.x * DRIVER_LEFT_SIGN_OFFSET,
    y: signBase.y + driverLeftNormal.y * DRIVER_LEFT_SIGN_OFFSET
  };
}

function offsetSignPosition(input: {
  signPosition: Vec2;
  incomingRoadPoint: Vec2;
  junction: Vec2;
  offsetIndex: number;
}): Vec2 {
  if (input.offsetIndex === 0) {
    return input.signPosition;
  }

  const approachVector = {
    x: input.junction.x - input.incomingRoadPoint.x,
    y: input.junction.y - input.incomingRoadPoint.y
  };
  const length = Math.hypot(approachVector.x, approachVector.y);

  if (length === 0) {
    return input.signPosition;
  }

  const direction = {
    x: approachVector.x / length,
    y: approachVector.y / length
  };
  const driverLeftNormal = {
    x: direction.y,
    y: -direction.x
  };
  const offsetDistance = input.offsetIndex * OVERLAPPING_SIGN_OFFSET;

  return {
    x: input.signPosition.x + driverLeftNormal.x * offsetDistance,
    y: input.signPosition.y + driverLeftNormal.y * offsetDistance
  };
}

export function turnRestrictionSignedAngleDegrees(input: {
  incomingStart: Vec2;
  junction: Vec2;
  outgoingEnd: Vec2;
}): number {
  const incomingVector = {
    x: input.junction.x - input.incomingStart.x,
    y: input.junction.y - input.incomingStart.y
  };
  const outgoingVector = {
    x: input.outgoingEnd.x - input.junction.x,
    y: input.outgoingEnd.y - input.junction.y
  };
  const cross = incomingVector.x * outgoingVector.y - incomingVector.y * outgoingVector.x;
  const dot = incomingVector.x * outgoingVector.x + incomingVector.y * outgoingVector.y;

  return (Math.atan2(cross, dot) * 180) / Math.PI;
}

export function turnRestrictionIconRotationRadians(input: { incomingStart: Vec2; junction: Vec2 }): number {
  const incomingVector = {
    x: input.junction.x - input.incomingStart.x,
    y: input.junction.y - input.incomingStart.y
  };
  const length = Math.hypot(incomingVector.x, incomingVector.y);

  if (length === 0) {
    return 0;
  }

  const direction = {
    x: incomingVector.x / length,
    y: incomingVector.y / length
  };

  return Math.atan2(direction.y, direction.x) + Math.PI / 2;
}

export function classifyTurnRestrictionMovement(input: {
  incomingStart: Vec2;
  junction: Vec2;
  outgoingEnd: Vec2;
}): TurnRestrictionMovementClass {
  const angleDegrees = turnRestrictionSignedAngleDegrees(input);
  const absoluteAngle = Math.abs(angleDegrees);

  if (absoluteAngle < STRAIGHT_TURN_THRESHOLD_DEGREES) {
    return "straight";
  }

  if (absoluteAngle >= U_TURN_THRESHOLD_DEGREES) {
    return "u_turn";
  }

  return angleDegrees > 0 ? "right" : "left";
}

function turnKindForClass(turnClass: Exclude<TurnRestrictionMovementClass, "straight">): TurnRestrictionVisualKind {
  if (turnClass === "left") {
    return "no-left-turn";
  }

  if (turnClass === "right") {
    return "no-right-turn";
  }

  return "no-u-turn";
}

function labelForTurnKind(kind: TurnRestrictionVisualKind): string {
  if (kind === "no-left-turn") {
    return "No left turn";
  }

  if (kind === "no-right-turn") {
    return "No right turn";
  }

  return "No U-turn";
}

function prohibitedTurnVisual(
  map: MapDefinition,
  restriction: Extract<MapRestriction, { type: "prohibited_turn" }>
): TurnRestrictionVisual | null {
  const fromRoad = roadById(map, restriction.fromRoadId);
  const toRoad = roadById(map, restriction.toRoadId);
  const junction = nodePoint(map, restriction.viaNodeId);

  if (!fromRoad || !toRoad || !junction) {
    return null;
  }

  const incomingNodeId = otherRoadEndpoint(fromRoad, restriction.viaNodeId);
  const outgoingNodeId = otherRoadEndpoint(toRoad, restriction.viaNodeId);

  if (!incomingNodeId || !outgoingNodeId) {
    return null;
  }

  const incomingRoadPoint = nodePoint(map, incomingNodeId);
  const outgoingRoadPoint = nodePoint(map, outgoingNodeId);

  if (!incomingRoadPoint || !outgoingRoadPoint) {
    return null;
  }

  if (
    roadLevelRestrictionBlocksMovement({
      map,
      road: fromRoad,
      fromNodeId: incomingNodeId,
      toNodeId: restriction.viaNodeId
    }) ||
    roadLevelRestrictionBlocksMovement({
      map,
      road: toRoad,
      fromNodeId: restriction.viaNodeId,
      toNodeId: outgoingNodeId
    })
  ) {
    return null;
  }

  const incomingAngleRadians = angleFromJunction(junction, incomingRoadPoint);
  const outgoingAngleRadians = angleFromJunction(junction, outgoingRoadPoint);
  const signPosition = signPositionOnApproachRoad(incomingRoadPoint, junction);
  const iconRotationRadians = turnRestrictionIconRotationRadians({
    incomingStart: incomingRoadPoint,
    junction
  });
  const angleDegrees = turnRestrictionSignedAngleDegrees({
    incomingStart: incomingRoadPoint,
    junction,
    outgoingEnd: outgoingRoadPoint
  });
  const turnClass = classifyTurnRestrictionMovement({
    incomingStart: incomingRoadPoint,
    junction,
    outgoingEnd: outgoingRoadPoint
  });

  if (turnClass === "straight") {
    return null;
  }

  const turnKind = turnKindForClass(turnClass);
  const label = labelForTurnKind(turnKind);

  return {
    id: restriction.id,
    reason: "prohibited_turn",
    turnKind,
    turnClass,
    fromRoadId: restriction.fromRoadId,
    toRoadId: restriction.toRoadId,
    viaNodeId: restriction.viaNodeId,
    label,
    message: restriction.reason ? restriction.reason : `${label} from ${restriction.fromRoadId} to ${restriction.toRoadId}`,
    junction,
    incomingRoadPoint,
    outgoingRoadPoint,
    signPosition,
    iconRotationRadians,
    angleDegrees,
    incomingAngleRadians,
    outgoingAngleRadians,
    markerAngleRadians: markerAngle(incomingAngleRadians, outgoingAngleRadians),
    ...(restriction.reason ? { restrictionReason: restriction.reason } : {})
  };
}

export function getTurnRestrictionVisuals(map: MapDefinition): TurnRestrictionVisual[] {
  const visuals = map.restrictions
    .filter((restriction): restriction is Extract<MapRestriction, { type: "prohibited_turn" }> => {
      return restriction.type === "prohibited_turn";
    })
    .map((restriction) => prohibitedTurnVisual(map, restriction))
    .filter((visual): visual is TurnRestrictionVisual => Boolean(visual));

  const groupSizes = new Map<string, number>();
  const groupIndexes = new Map<string, number>();

  for (const visual of visuals) {
    const key = `${visual.fromRoadId}:${visual.viaNodeId}`;
    groupSizes.set(key, (groupSizes.get(key) ?? 0) + 1);
  }

  return visuals.map((visual) => {
    const key = `${visual.fromRoadId}:${visual.viaNodeId}`;
    const groupSize = groupSizes.get(key) ?? 1;
    const groupIndex = groupIndexes.get(key) ?? 0;
    groupIndexes.set(key, groupIndex + 1);

    if (groupSize === 1) {
      return visual;
    }

    return {
      ...visual,
      signPosition: offsetSignPosition({
        signPosition: visual.signPosition,
        incomingRoadPoint: visual.incomingRoadPoint,
        junction: visual.junction,
        offsetIndex: groupIndex
      })
    };
  });
}
