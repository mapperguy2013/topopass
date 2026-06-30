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
  sourceKind: "osm" | "unknown";
  nodeCount: number;
  roadSegmentCount: number;
  directedEdgeCount: number;
  oneWayRoadSegmentCount: number;
  twoWayRoadSegmentCount: number;
  oneWayDirectedEdgeCount: number;
  twoWayDirectedEdgeCount: number;
  blockedOsmWayCount: number;
  blockedOsmWayIds: string[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  extent: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
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
  osmWayId: string | null;
  osmHighway: string | null;
  originalDirection: "both" | "forward" | "reverse" | "unknown";
  fromNodeId: string;
  toNodeId: string;
  direction: DirectedEdge["direction"];
  isOneWayRoad: boolean;
  points: [Vec2, Vec2];
  midpoint: Vec2;
};

export type OsmDebugOverlayStyle = {
  nodeRadius: number;
  nodeInnerRadius: number;
  nodeStrokeWidth: number;
  twoWayEdgeAlpha: number;
  oneWayEdgeAlpha: number;
  twoWayEdgeLineWidth: number;
  oneWayEdgeLineWidth: number;
  twoWayEdgeDash: number[];
  showTwoWayDirectionArrows: boolean;
  labelOffset: number;
};

export type OsmDebugOverlayModel = {
  visible: boolean;
  showIds: boolean;
  summary: OsmDebugSummary;
  style: OsmDebugOverlayStyle;
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
  const bounds = calculateMapBounds(input.map.nodes);
  const metadata = osmMapMetadata(input.map);
  const blockedOsmWayIds = metadata.blockedOsmWayIds.map((id) => String(id)).sort();

  return {
    mapId: input.map.id,
    mapName: input.map.name,
    sourceFixtureName: input.sourceFixtureName ?? null,
    sourceKind: metadata.source,
    nodeCount: input.map.nodes.length,
    roadSegmentCount: input.map.roads.length,
    directedEdgeCount: input.graph.edges.length,
    oneWayRoadSegmentCount,
    twoWayRoadSegmentCount: input.map.roads.length - oneWayRoadSegmentCount,
    oneWayDirectedEdgeCount,
    twoWayDirectedEdgeCount: input.graph.edges.length - oneWayDirectedEdgeCount,
    blockedOsmWayCount: blockedOsmWayIds.length,
    blockedOsmWayIds,
    bounds,
    extent: {
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      centerX: (bounds.minX + bounds.maxX) / 2,
      centerY: (bounds.minY + bounds.maxY) / 2
    },
    selectedExerciseId: input.exercise?.id ?? null,
    selectedExerciseTitle: input.exercise?.title ?? null,
    stops: input.exercise ? buildStopSummaries(input.exercise, input.graph.nodesById) : []
  };
}

export function buildOsmDebugOverlayStyle(summary: OsmDebugSummary): OsmDebugOverlayStyle {
  const isMediumFixture = summary.roadSegmentCount >= 40 || summary.nodeCount >= 20;

  return {
    nodeRadius: isMediumFixture ? 3.2 : 4.25,
    nodeInnerRadius: isMediumFixture ? 1.35 : 2,
    nodeStrokeWidth: isMediumFixture ? 1.25 : 1.8,
    twoWayEdgeAlpha: isMediumFixture ? 0.24 : 0.42,
    oneWayEdgeAlpha: isMediumFixture ? 0.68 : 0.72,
    twoWayEdgeLineWidth: isMediumFixture ? 1.15 : 1.7,
    oneWayEdgeLineWidth: isMediumFixture ? 2.15 : 2.5,
    twoWayEdgeDash: isMediumFixture ? [3, 5] : [4, 4],
    showTwoWayDirectionArrows: !isMediumFixture,
    labelOffset: isMediumFixture ? 9 : 11
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
      style: buildOsmDebugOverlayStyle(summary),
      nodes: [],
      directedEdges: []
    };
  }

  return {
    visible: true,
    showIds: state.showIds,
    summary,
    style: buildOsmDebugOverlayStyle(summary),
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
          osmWayId: osmRoadMetadata(road).osmWayId,
          osmHighway: osmRoadMetadata(road).highway,
          originalDirection: osmRoadMetadata(road).originalDirection,
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

function calculateMapBounds(nodes: readonly MapNode[]): OsmDebugSummary["bounds"] {
  if (nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0
    };
  }

  return nodes.reduce(
    (bounds, node) => ({
      minX: Math.min(bounds.minX, node.x),
      minY: Math.min(bounds.minY, node.y),
      maxX: Math.max(bounds.maxX, node.x),
      maxY: Math.max(bounds.maxY, node.y)
    }),
    {
      minX: nodes[0].x,
      minY: nodes[0].y,
      maxX: nodes[0].x,
      maxY: nodes[0].y
    }
  );
}

function osmMapMetadata(map: MapDefinition): {
  source: "osm" | "unknown";
  blockedOsmWayIds: unknown[];
} {
  const metadata = (map as { metadata?: { source?: unknown; blockedOsmWayIds?: unknown } }).metadata;

  return {
    source: metadata?.source === "osm" ? "osm" : "unknown",
    blockedOsmWayIds: Array.isArray(metadata?.blockedOsmWayIds) ? metadata.blockedOsmWayIds : []
  };
}

function osmRoadMetadata(road: unknown): {
  osmWayId: string | null;
  highway: string | null;
  originalDirection: "both" | "forward" | "reverse" | "unknown";
} {
  const metadata = (road as { metadata?: unknown }).metadata as
    | {
        osmWayId?: unknown;
        highway?: unknown;
        originalDirection?: unknown;
      }
    | undefined;
  const originalDirection =
    metadata?.originalDirection === "both" ||
    metadata?.originalDirection === "forward" ||
    metadata?.originalDirection === "reverse"
      ? metadata.originalDirection
      : "unknown";

  return {
    osmWayId: typeof metadata?.osmWayId === "string" || typeof metadata?.osmWayId === "number" ? String(metadata.osmWayId) : null,
    highway: typeof metadata?.highway === "string" ? metadata.highway : null,
    originalDirection
  };
}
