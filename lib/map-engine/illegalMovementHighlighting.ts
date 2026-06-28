import type { IllegalMovement } from "./legalityEngine.ts";
import type { MapDefinition } from "./types.ts";

export type IllegalDrawnMovementKind =
  | "closed-road"
  | "restricted-road"
  | "no-entry-road"
  | "one-way-wrong-direction"
  | "prohibited-turn";

export type IllegalDrawnMovement = {
  id: string;
  kind: IllegalDrawnMovementKind;
  movementIndex: number;
  roadId?: string;
  fromNodeId?: string;
  toNodeId?: string;
  viaNodeId?: string;
  incomingRoadId?: string;
  outgoingRoadId?: string;
  message: string;
};

export type BuildIllegalDrawnMovementHighlightsInput = {
  map: MapDefinition;
  illegalMovements: readonly IllegalMovement[];
  scored: boolean;
};

const ILLEGAL_DRAWN_MOVEMENT_PRIORITY: Record<IllegalDrawnMovementKind, number> = {
  "closed-road": 0,
  "restricted-road": 1,
  "no-entry-road": 2,
  "one-way-wrong-direction": 3,
  "prohibited-turn": 4
};

function highlightId(highlight: Omit<IllegalDrawnMovement, "id">): string {
  return [
    highlight.movementIndex,
    highlight.kind,
    highlight.roadId ?? highlight.incomingRoadId ?? "unknown",
    highlight.outgoingRoadId ?? highlight.toNodeId ?? "unknown"
  ].join(":");
}

function roadExists(map: MapDefinition, roadId: string | undefined): boolean {
  return Boolean(roadId && map.roads.some((road) => road.id === roadId));
}

function highlightForIllegalMovement(
  map: MapDefinition,
  movement: IllegalMovement
): IllegalDrawnMovement | null {
  if (movement.type === "no_entry" && roadExists(map, movement.roadId)) {
    const highlight = {
      kind: "no-entry-road" as const,
      movementIndex: movement.movementIndex,
      roadId: movement.roadId,
      fromNodeId: movement.fromNodeId,
      toNodeId: movement.toNodeId,
      message: movement.message
    };

    return {
      id: highlightId(highlight),
      ...highlight
    };
  }

  if (movement.type === "wrong_way_one_way" && roadExists(map, movement.roadId)) {
    const highlight = {
      kind: "one-way-wrong-direction" as const,
      movementIndex: movement.movementIndex,
      roadId: movement.roadId,
      fromNodeId: movement.fromNodeId,
      toNodeId: movement.toNodeId,
      message: movement.message
    };

    return {
      id: highlightId(highlight),
      ...highlight
    };
  }

  if (movement.type === "prohibited_turn" || movement.type === "no_u_turn") {
    const incomingRoadId = movement.previousRoadId ?? movement.roadId;
    const outgoingRoadId = movement.nextRoadId ?? movement.roadId;

    if (!roadExists(map, incomingRoadId) || !roadExists(map, outgoingRoadId)) {
      return null;
    }

    const highlight = {
      kind: "prohibited-turn" as const,
      movementIndex: movement.movementIndex,
      roadId: movement.roadId,
      fromNodeId: movement.fromNodeId,
      toNodeId: movement.toNodeId,
      viaNodeId: movement.viaNodeId,
      incomingRoadId,
      outgoingRoadId,
      message: movement.message
    };

    return {
      id: highlightId(highlight),
      ...highlight
    };
  }

  return null;
}

function shouldReplaceExistingHighlight(
  existing: IllegalDrawnMovement,
  candidate: IllegalDrawnMovement
): boolean {
  const existingPriority = ILLEGAL_DRAWN_MOVEMENT_PRIORITY[existing.kind];
  const candidatePriority = ILLEGAL_DRAWN_MOVEMENT_PRIORITY[candidate.kind];

  if (candidatePriority !== existingPriority) {
    return candidatePriority < existingPriority;
  }

  return candidate.id < existing.id;
}

export function buildIllegalDrawnMovementHighlights(
  input: BuildIllegalDrawnMovementHighlightsInput
): IllegalDrawnMovement[] {
  if (!input.scored) {
    return [];
  }

  const highlightsByMovementIndex = new Map<number, IllegalDrawnMovement>();

  for (const movement of input.illegalMovements) {
    const highlight = highlightForIllegalMovement(input.map, movement);

    if (!highlight) {
      continue;
    }

    const existing = highlightsByMovementIndex.get(highlight.movementIndex);

    if (!existing || shouldReplaceExistingHighlight(existing, highlight)) {
      highlightsByMovementIndex.set(highlight.movementIndex, highlight);
    }
  }

  return Array.from(highlightsByMovementIndex.values()).sort((first, second) => {
    if (first.movementIndex !== second.movementIndex) {
      return first.movementIndex - second.movementIndex;
    }

    return first.id.localeCompare(second.id);
  });
}
