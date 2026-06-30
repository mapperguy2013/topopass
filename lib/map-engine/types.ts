export type MapNode = {
  id: string;
  x: number;
  y: number;
  label?: string;
};

export type MapRoad = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  isOneWay: boolean;
  name?: string;
};

export type DirectedEdgeDirection = "forward" | "reverse";

export type DirectedEdge = {
  id: string;
  roadId: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  direction: DirectedEdgeDirection;
  sourceFromDistanceMeters: number;
  sourceToDistanceMeters: number;
};

export type MapRestriction =
  | {
      id: string;
      type: "no_entry";
      roadId: string;
      fromNodeId?: string;
      toNodeId?: string;
      blockedFromDistanceMeters?: number;
      blockedToDistanceMeters?: number;
      reason?: string;
    }
  | {
      id: string;
      type: "prohibited_turn";
      fromRoadId: string;
      viaNodeId: string;
      toRoadId: string;
      reason?: string;
    }
  | {
      id: string;
      type: "road_closed";
      roadId: string;
      reason?: string;
    };

export type LandmarkType =
  | "station"
  | "school"
  | "hospital"
  | "park"
  | "shop"
  | "library"
  | "market"
  | "landmark"
  | "place_of_worship"
  | "civic"
  | "museum"
  | "entertainment"
  | "office"
  | "dock"
  | "custom";

export type Landmark = {
  id: string;
  name: string;
  type?: LandmarkType;
  x: number;
  y: number;
  nearestNodeId?: string;
};

export type RouteStop =
  | {
      type: "node";
      nodeId: string;
      label?: string;
    }
  | {
      type: "landmark";
      landmarkId: string;
      label?: string;
    };

export type RouteExerciseDifficulty = "easy" | "medium" | "hard";

export type RouteExercise = {
  id: string;
  title: string;
  mapId: string;
  stops: RouteStop[];
  difficulty?: RouteExerciseDifficulty;
};

export type RouteAttempt = {
  id: string;
  exerciseId: string;
  mapId: string;
  selectedEdgeIds: string[];
  createdAtIso: string;
  submittedAtIso?: string;
};

export type RouteScore = {
  attemptId: string;
  exerciseId: string;
  status: "not_scored" | "scored";
  legal?: boolean;
  routeDistanceMeters?: number;
  shortestLegalDistanceMeters?: number;
  efficiencyPercent?: number;
  violationCount?: number;
  notes?: string[];
};

export type MapDefinition = {
  id: string;
  name: string;
  version?: number;
  description?: string;
  nodes: MapNode[];
  roads: MapRoad[];
  restrictions: MapRestriction[];
  landmarks: Landmark[];
};

export type MapGraph = {
  mapId: string;
  nodesById: Record<string, MapNode>;
  roadsById: Record<string, MapRoad>;
  edges: DirectedEdge[];
  edgesById: Record<string, DirectedEdge>;
  outgoingEdgesByNodeId: Record<string, DirectedEdge[]>;
  incomingEdgesByNodeId: Record<string, DirectedEdge[]>;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};
