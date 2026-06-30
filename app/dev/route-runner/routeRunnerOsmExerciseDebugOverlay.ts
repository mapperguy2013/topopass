import {
  buildBlockedDirectedEdgeKeys,
  directedEdgeKey,
  type DirectedEdge,
  type MapDefinition,
  type MapGraph,
  type MapNode,
  type MapRestriction,
  type RouteExercise,
  type RouteStop,
  type Vec2
} from "../../../lib/map-engine/index.ts";
import {
  projectOsmCoordinateToLocalMeters,
  type OsmLocalProjection,
  type OverpassNodeElement,
  type OverpassWayElement
} from "../../../lib/map-engine/osm/index.ts";
import { getRouteRunnerMapFitBounds, type RouteRunnerMapBounds } from "./routeRunnerMaps.ts";
import {
  formatOsmExerciseQaFailure,
  validateOsmRouteExerciseQa,
  type OsmExerciseQaFailureReason,
  type OsmExerciseQaResult
} from "./routeRunnerOsmExerciseQa.ts";

export type OsmExerciseDebugOverlayState = {
  visible: boolean;
};

export type OsmExerciseDebugStopRole = "start" | "checkpoint" | "finish";

export type OsmExerciseDebugStopMarker = {
  order: number;
  role: OsmExerciseDebugStopRole;
  label: "Start" | `CP ${number}` | "Finish";
  sourceLabel: string | null;
  nodeId: string | null;
  point: Vec2 | null;
  resolved: boolean;
};

export type OsmExerciseDebugRouteOverlay = {
  status: "found" | "missing";
  edgeIds: string[];
  roadIds: string[];
  nodeIds: string[];
  points: Vec2[];
  distanceMeters: number | null;
  segmentCount: number;
};

export type OsmExerciseDebugBlockedEdge = {
  id: string;
  edgeId: string | null;
  directedEdgeKey: string | null;
  osmWayId: string | null;
  fromNodeId: string;
  toNodeId: string;
  roadId: string | null;
  roadName: string;
  restrictionType: "no_entry" | "road_closed" | "blocked_access" | "blocked";
  label: string;
  points: [Vec2, Vec2];
  midpoint: Vec2;
  relevant: boolean;
  usedByRoute: boolean;
};

export type OsmExerciseDebugQaSummary = {
  status: "pass" | "fail";
  failureReasons: OsmExerciseQaFailureReason[];
  failureMessages: string[];
  allNodesInsideRenderBounds: boolean;
  hasUnknownRouteEdges: boolean;
  hasBlockedRouteEdges: boolean;
  blockedRouteDirectedEdgeKeys: string[];
};

export type OsmExerciseDebugOverlayModel = {
  visible: boolean;
  mapId: string;
  mapName: string;
  exerciseId: string;
  exerciseTitle: string;
  stopMarkers: OsmExerciseDebugStopMarker[];
  route: OsmExerciseDebugRouteOverlay;
  blockedEdges: OsmExerciseDebugBlockedEdge[];
  qa: OsmExerciseDebugQaSummary;
  renderBounds: RouteRunnerMapBounds;
  metadata: {
    startNodeId: string | null;
    checkpointNodeIds: Array<string | null>;
    destinationNodeId: string | null;
    checkpointCount: number;
    routeDistanceMeters: number | null;
    routeSegmentCount: number;
    blockedEdgeCount: number;
    relevantBlockedEdgeCount: number;
  };
};

export function createDefaultOsmExerciseDebugOverlayState(): OsmExerciseDebugOverlayState {
  return {
    visible: false
  };
}

export function canOfferOsmExerciseDebugOverlay(mapSource: string): boolean {
  return mapSource === "converted-osm";
}

export function buildOsmExerciseDebugOverlayModel(input: {
  map: MapDefinition;
  graph: MapGraph;
  exercise?: RouteExercise | null;
  enabled: boolean;
  isConvertedOsmMap: boolean;
  renderBounds?: RouteRunnerMapBounds;
  sourceOverpassFixture?: unknown;
}): OsmExerciseDebugOverlayModel | null {
  if (!input.enabled || !input.isConvertedOsmMap || !input.exercise) {
    return null;
  }

  const renderBounds = input.renderBounds ?? getRouteRunnerMapFitBounds(input.map);
  const qaResult = validateOsmRouteExerciseQa({
    map: input.map,
    graph: input.graph,
    exercise: input.exercise,
    renderBounds
  });
  const blockedDirectedEdgeKeys = buildBlockedDirectedEdgeKeys(input.graph, input.map.restrictions);
  const route = buildRouteOverlay(input.graph, qaResult);
  const routeDirectedEdgeKeys = route.edgeIds
    .map((edgeId) => input.graph.edgesById[edgeId])
    .filter((edge): edge is DirectedEdge => Boolean(edge))
    .map((edge) => directedEdgeKey(edge));
  const routeDirectedEdgeKeySet = new Set(routeDirectedEdgeKeys);
  const routeNodeIdSet = new Set(route.nodeIds);
  const blockedRouteDirectedEdgeKeys = routeDirectedEdgeKeys.filter((key) => blockedDirectedEdgeKeys.has(key));
  const stopMarkers = buildStopMarkers(input.exercise, input.graph);
  const blockedEdges = buildBlockedEdges({
    map: input.map,
    graph: input.graph,
    restrictions: input.map.restrictions,
    blockedDirectedEdgeKeys,
    routeDirectedEdgeKeySet,
    routeNodeIdSet,
    stopNodeIdSet: new Set(
      stopMarkers.map((marker) => marker.nodeId).filter((nodeId): nodeId is string => Boolean(nodeId))
    ),
    sourceOverpassFixture: input.sourceOverpassFixture
  });

  return {
    visible: true,
    mapId: input.map.id,
    mapName: input.map.name,
    exerciseId: input.exercise.id,
    exerciseTitle: input.exercise.title,
    stopMarkers,
    route,
    blockedEdges,
    qa: {
      status: qaResult.isValid ? "pass" : "fail",
      failureReasons: qaResult.failures.map((failure) => failure.reason),
      failureMessages: qaResult.failures.map(formatOsmExerciseQaFailure),
      allNodesInsideRenderBounds: !qaResult.failures.some((failure) => failure.reason === "outside-render-bounds"),
      hasUnknownRouteEdges: qaResult.failures.some((failure) => failure.reason === "unknown-route-edge"),
      hasBlockedRouteEdges: blockedRouteDirectedEdgeKeys.length > 0,
      blockedRouteDirectedEdgeKeys
    },
    renderBounds: { ...renderBounds },
    metadata: buildMetadata(stopMarkers, route, blockedEdges)
  };
}

function buildRouteOverlay(graph: MapGraph, qaResult: OsmExerciseQaResult): OsmExerciseDebugRouteOverlay {
  const edgeIds = [...qaResult.routeEdgeIds];
  const roadIds = edgeIds
    .map((edgeId) => graph.edgesById[edgeId]?.roadId)
    .filter((roadId): roadId is string => Boolean(roadId));
  const nodeIds = [...qaResult.routeNodeIds];
  const points = nodeIds
    .map((nodeId) => graph.nodesById[nodeId])
    .filter((node): node is MapNode => Boolean(node))
    .map(copyPoint);

  return {
    status: points.length >= 2 && edgeIds.length > 0 ? "found" : "missing",
    edgeIds,
    roadIds,
    nodeIds,
    points,
    distanceMeters: qaResult.routeDistanceMeters,
    segmentCount: edgeIds.length
  };
}

function buildStopMarkers(exercise: RouteExercise, graph: MapGraph): OsmExerciseDebugStopMarker[] {
  return exercise.stops.map((stop, index) => {
    const nodeId = stopNodeId(stop);
    const node = nodeId ? graph.nodesById[nodeId] : null;
    const role = stopRole(index, exercise.stops.length);

    return {
      order: index + 1,
      role,
      label: stopMarkerLabel(role, index),
      sourceLabel: stop.label ?? null,
      nodeId,
      point: node ? copyPoint(node) : null,
      resolved: Boolean(node)
    };
  });
}

function stopMarkerLabel(role: OsmExerciseDebugStopRole, index: number): OsmExerciseDebugStopMarker["label"] {
  if (role === "start") {
    return "Start";
  }

  if (role === "finish") {
    return "Finish";
  }

  return `CP ${index}` as `CP ${number}`;
}

function buildBlockedEdges(input: {
  map: MapDefinition;
  graph: MapGraph;
  restrictions: readonly MapRestriction[];
  blockedDirectedEdgeKeys: ReadonlySet<string>;
  routeDirectedEdgeKeySet: ReadonlySet<string>;
  routeNodeIdSet: ReadonlySet<string>;
  stopNodeIdSet: ReadonlySet<string>;
  sourceOverpassFixture?: unknown;
}): OsmExerciseDebugBlockedEdge[] {
  return [
    ...buildRestrictionBlockedEdges(input),
    ...buildExcludedOsmBlockedWayEdges({
      map: input.map,
      routeNodeIdSet: input.routeNodeIdSet,
      stopNodeIdSet: input.stopNodeIdSet,
      sourceOverpassFixture: input.sourceOverpassFixture
    })
  ];
}

function buildRestrictionBlockedEdges(input: {
  graph: MapGraph;
  restrictions: readonly MapRestriction[];
  blockedDirectedEdgeKeys: ReadonlySet<string>;
  routeDirectedEdgeKeySet: ReadonlySet<string>;
  routeNodeIdSet: ReadonlySet<string>;
  stopNodeIdSet: ReadonlySet<string>;
}): OsmExerciseDebugBlockedEdge[] {
  return input.graph.edges.flatMap((edge) => {
    const key = directedEdgeKey(edge);

    if (!input.blockedDirectedEdgeKeys.has(key)) {
      return [];
    }

    const from = input.graph.nodesById[edge.fromNodeId];
    const to = input.graph.nodesById[edge.toNodeId];
    const road = input.graph.roadsById[edge.roadId];

    if (!from || !to || !road) {
      return [];
    }

    const restrictionType = blockedRestrictionType(edge, input.restrictions);
    const usedByRoute = input.routeDirectedEdgeKeySet.has(key);
    const relevant =
      usedByRoute ||
      input.routeNodeIdSet.has(edge.fromNodeId) ||
      input.routeNodeIdSet.has(edge.toNodeId) ||
      input.stopNodeIdSet.has(edge.fromNodeId) ||
      input.stopNodeIdSet.has(edge.toNodeId);

    return [
      {
        id: `${edge.id}:${key}`,
        edgeId: edge.id,
        directedEdgeKey: key,
        osmWayId: osmWayIdForRoad(road),
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        roadId: edge.roadId,
        roadName: road.name ?? edge.roadId,
        restrictionType,
        label: blockedEdgeLabel(restrictionType),
        points: [copyPoint(from), copyPoint(to)],
        midpoint: {
          x: (from.x + to.x) / 2,
          y: (from.y + to.y) / 2
        },
        relevant,
        usedByRoute
      }
    ];
  });
}

function buildExcludedOsmBlockedWayEdges(input: {
  map: MapDefinition;
  routeNodeIdSet: ReadonlySet<string>;
  stopNodeIdSet: ReadonlySet<string>;
  sourceOverpassFixture?: unknown;
}): OsmExerciseDebugBlockedEdge[] {
  const projection = osmProjection(input.map);
  const blockedOsmWayIds = osmBlockedWayIdSet(input.map);
  const elements = overpassElements(input.sourceOverpassFixture);

  if (!projection || blockedOsmWayIds.size === 0 || elements.length === 0) {
    return [];
  }

  const nodesById = new Map(
    elements.filter((element): element is OverpassNodeElement => element.type === "node").map((node) => [node.id, node])
  );
  const ways = elements
    .filter((element): element is OverpassWayElement => element.type === "way")
    .filter((way) => blockedOsmWayIds.has(String(way.id)));

  return ways.flatMap((way) => {
    const wayName = way.tags?.name ?? `OSM way ${way.id}`;

    return way.nodes.flatMap((fromOsmNodeId, index) => {
      const toOsmNodeId = way.nodes[index + 1];

      if (!toOsmNodeId) {
        return [];
      }

      const fromNode = nodesById.get(fromOsmNodeId);
      const toNode = nodesById.get(toOsmNodeId);

      if (!fromNode || !toNode) {
        return [];
      }

      const fromNodeId = `osm-node-${fromOsmNodeId}`;
      const toNodeId = `osm-node-${toOsmNodeId}`;
      const fromPoint = projectOsmCoordinateToLocalMeters(
        { lat: fromNode.lat, lon: fromNode.lon },
        projection
      );
      const toPoint = projectOsmCoordinateToLocalMeters(
        { lat: toNode.lat, lon: toNode.lon },
        projection
      );
      const relevant =
        input.routeNodeIdSet.has(fromNodeId) ||
        input.routeNodeIdSet.has(toNodeId) ||
        input.stopNodeIdSet.has(fromNodeId) ||
        input.stopNodeIdSet.has(toNodeId);

      return [
        {
          id: `osm-way-${way.id}-blocked-segment-${index}`,
          edgeId: null,
          directedEdgeKey: null,
          osmWayId: String(way.id),
          fromNodeId,
          toNodeId,
          roadId: null,
          roadName: wayName,
          restrictionType: "blocked_access" as const,
          label: blockedEdgeLabel("blocked_access"),
          points: [fromPoint, toPoint],
          midpoint: midpoint(fromPoint, toPoint),
          relevant,
          usedByRoute: false
        }
      ];
    });
  });
}

function blockedRestrictionType(edge: DirectedEdge, restrictions: readonly MapRestriction[]): OsmExerciseDebugBlockedEdge["restrictionType"] {
  if (restrictions.some((restriction) => restriction.type === "road_closed" && restriction.roadId === edge.roadId)) {
    return "road_closed";
  }

  if (restrictions.some((restriction) => restriction.type === "no_entry" && restriction.roadId === edge.roadId)) {
    return "no_entry";
  }

  return "blocked";
}

function blockedEdgeLabel(restrictionType: OsmExerciseDebugBlockedEdge["restrictionType"]): string {
  if (restrictionType === "no_entry") {
    return "no entry";
  }

  if (restrictionType === "road_closed") {
    return "closed";
  }

  if (restrictionType === "blocked_access") {
    return "blocked access";
  }

  return "blocked";
}

function osmWayIdForRoad(road: unknown): string | null {
  const metadata = (road as { metadata?: { osmWayId?: unknown } }).metadata;

  return typeof metadata?.osmWayId === "string" || typeof metadata?.osmWayId === "number"
    ? String(metadata.osmWayId)
    : null;
}

function osmBlockedWayIdSet(map: MapDefinition): Set<string> {
  const metadata = (map as { metadata?: { blockedOsmWayIds?: unknown } }).metadata;
  const ids = Array.isArray(metadata?.blockedOsmWayIds) ? metadata.blockedOsmWayIds : [];

  return new Set(ids.map((id) => String(id)));
}

function osmProjection(map: MapDefinition): OsmLocalProjection | null {
  const projection = (map as { metadata?: { projection?: unknown } }).metadata?.projection;

  if (!projection || typeof projection !== "object") {
    return null;
  }

  return projection as OsmLocalProjection;
}

function overpassElements(input: unknown): Array<OverpassNodeElement | OverpassWayElement> {
  const elements = (input as { elements?: unknown } | null)?.elements;

  if (!Array.isArray(elements)) {
    return [];
  }

  return elements.filter(isOverpassNodeOrWay);
}

function isOverpassNodeOrWay(element: unknown): element is OverpassNodeElement | OverpassWayElement {
  if (!element || typeof element !== "object" || !("type" in element)) {
    return false;
  }

  if (element.type === "node") {
    return "id" in element && "lat" in element && "lon" in element;
  }

  return element.type === "way" && "id" in element && "nodes" in element && Array.isArray(element.nodes);
}

function buildMetadata(
  stopMarkers: readonly OsmExerciseDebugStopMarker[],
  route: OsmExerciseDebugRouteOverlay,
  blockedEdges: readonly OsmExerciseDebugBlockedEdge[]
): OsmExerciseDebugOverlayModel["metadata"] {
  const startMarker = stopMarkers[0] ?? null;
  const destinationMarker = stopMarkers[stopMarkers.length - 1] ?? null;
  const checkpointMarkers = stopMarkers.slice(1, -1);

  return {
    startNodeId: startMarker?.nodeId ?? null,
    checkpointNodeIds: checkpointMarkers.map((marker) => marker.nodeId),
    destinationNodeId: destinationMarker?.nodeId ?? null,
    checkpointCount: checkpointMarkers.length,
    routeDistanceMeters: route.distanceMeters,
    routeSegmentCount: route.segmentCount,
    blockedEdgeCount: blockedEdges.length,
    relevantBlockedEdgeCount: blockedEdges.filter((edge) => edge.relevant).length
  };
}

function stopNodeId(stop: RouteStop): string | null {
  return stop.type === "node" ? stop.nodeId : null;
}

function stopRole(index: number, stopCount: number): OsmExerciseDebugStopRole {
  if (index === 0) {
    return "start";
  }

  return index === stopCount - 1 ? "finish" : "checkpoint";
}

function copyPoint(point: Vec2): Vec2 {
  return {
    x: point.x,
    y: point.y
  };
}

function midpoint(from: Vec2, to: Vec2): Vec2 {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2
  };
}
