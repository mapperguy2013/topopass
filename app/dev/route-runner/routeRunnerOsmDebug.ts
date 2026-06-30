import type {
  DirectedEdge,
  MapDefinition,
  MapGraph,
  MapNode,
  RouteExercise,
  RouteStop,
  Vec2
} from "../../../lib/map-engine/index.ts";

export type OsmDebugOverlayState = {
  visible: boolean;
  showIds: boolean;
};

export type OsmDebugStopRole = "start" | "checkpoint" | "finish";

export type OsmDebugStopSummary = {
  order: number;
  role: OsmDebugStopRole;
  nodeId: string | null;
  label: string;
  point: Vec2 | null;
};

export type OsmDebugSummary = {
  mapId: string;
  mapName: string;
  sourceFixtureName: string | null;
  nodeCount: number;
  roadSegmentCount: number;
  directedEdgeCount: number;
  oneWayRoadSegmentCount: number;
  twoWayRoadSegmentCount: number;
  oneWayDirectedEdgeCount: number;
  twoWayDirectedEdgeCount: number;
  selectedExerciseId: string | null;
  selectedExerciseTitle: string | null;
  stops: OsmDebugStopSummary[];
};

export type OsmDebugNodeVisual = {
  id: string;
  point: Vec2;
  label: string;
};

export type OsmDebugDirectedEdgeVisual = {
  id: string;
  roadId: string;
  roadName: string;
  fromNodeId: string;
  toNodeId: string;
  direction: DirectedEdge["direction"];
  isOneWayRoad: boolean;
  points: [Vec2, Vec2];
  midpoint: Vec2;
};

export type OsmDebugOverlayModel = {
  visible: boolean;
  showIds: boolean;
  summary: OsmDebugSummary;
  nodes: OsmDebugNodeVisual[];
  directedEdges: OsmDebugDirectedEdgeVisual[];
};

export function createDefaultOsmDebugOverlayState(): OsmDebugOverlayState {
  return {
    visible: false,
    showIds: false
  };
}

export function canOfferOsmDebugOverlay(mapSource: string): boolean {
  return mapSource === "converted-osm";
}

export function buildOsmDebugSummary(input: {
  map: MapDefinition;
  graph: MapGraph;
  exercise?: RouteExercise;
  sourceFixtureName?: string | null;
}): OsmDebugSummary {
  const oneWayRoadSegmentCount = input.map.roads.filter((road) => road.isOneWay).length;
  const oneWayDirectedEdgeCount = input.graph.edges.filter((edge) => input.graph.roadsById[edge.roadId]?.isOneWay).length;

  return {
    mapId: input.map.id,
    mapName: input.map.name,
    sourceFixtureName: input.sourceFixtureName ?? null,
    nodeCount: input.map.nodes.length,
    roadSegmentCount: input.map.roads.length,
    directedEdgeCount: input.graph.edges.length,
    oneWayRoadSegmentCount,
    twoWayRoadSegmentCount: input.map.roads.length - oneWayRoadSegmentCount,
    oneWayDirectedEdgeCount,
    twoWayDirectedEdgeCount: input.graph.edges.length - oneWayDirectedEdgeCount,
    selectedExerciseId: input.exercise?.id ?? null,
    selectedExerciseTitle: input.exercise?.title ?? null,
    stops: input.exercise ? buildStopSummaries(input.exercise, input.graph.nodesById) : []
  };
}

export function buildOsmDebugOverlayModel(input: {
  map: MapDefinition;
  graph: MapGraph;
  exercise?: RouteExercise;
  sourceFixtureName?: string | null;
  state?: OsmDebugOverlayState;
}): OsmDebugOverlayModel {
  const state = input.state ?? createDefaultOsmDebugOverlayState();
  const summary = buildOsmDebugSummary(input);

  if (!state.visible) {
    return {
      visible: false,
      showIds: state.showIds,
      summary,
      nodes: [],
      directedEdges: []
    };
  }

  return {
    visible: true,
    showIds: state.showIds,
    summary,
    nodes: input.map.nodes.map((node) => ({
      id: node.id,
      label: node.label ?? node.id,
      point: copyPoint(node)
    })),
    directedEdges: input.graph.edges.flatMap((edge) => {
      const from = input.graph.nodesById[edge.fromNodeId];
      const to = input.graph.nodesById[edge.toNodeId];
      const road = input.graph.roadsById[edge.roadId];

      if (!from || !to || !road) {
        return [];
      }

      return [
        {
          id: edge.id,
          roadId: edge.roadId,
          roadName: road.name ?? edge.roadId,
          fromNodeId: edge.fromNodeId,
          toNodeId: edge.toNodeId,
          direction: edge.direction,
          isOneWayRoad: road.isOneWay,
          points: [copyPoint(from), copyPoint(to)],
          midpoint: {
            x: (from.x + to.x) / 2,
            y: (from.y + to.y) / 2
          }
        }
      ];
    })
  };
}

function buildStopSummaries(exercise: RouteExercise, nodesById: Record<string, MapNode>): OsmDebugStopSummary[] {
  return exercise.stops.map((stop, index) => {
    const nodeId = stopNodeId(stop);
    const node = nodeId ? nodesById[nodeId] : null;

    return {
      order: index + 1,
      role: index === 0 ? "start" : index === exercise.stops.length - 1 ? "finish" : "checkpoint",
      nodeId,
      label: stop.label ?? node?.label ?? nodeId ?? "Unresolved stop",
      point: node ? copyPoint(node) : null
    };
  });
}

function stopNodeId(stop: RouteStop): string | null {
  return stop.type === "node" ? stop.nodeId : null;
}

function copyPoint(point: Vec2): Vec2 {
  return {
    x: point.x,
    y: point.y
  };
}
