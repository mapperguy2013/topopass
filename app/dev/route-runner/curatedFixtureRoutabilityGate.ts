import {
  buildMapGraph,
  findShortestLegalRoute,
  findShortestLegalRouteThroughStops,
  type DirectedEdge,
  type MapDefinition,
  type MapGraph,
  type MapRoad,
  type RouteExercise,
  type RouteExerciseDifficulty
} from "../../../lib/map-engine/index.ts";
import {
  buildBlockedDirectedEdgeKeys,
  directedEdgeKey
} from "../../../lib/map-engine/directedEdgeRestrictions.ts";

export type CuratedFixtureUse = "visualQaOnly" | "routableExercise" | "routeReviewFixture";

export type CuratedFixtureConnectivityDiagnostics = {
  mapId: string;
  routableNodeCount: number;
  routableEdgeCount: number;
  connectedComponentCount: number;
  largestConnectedComponentSize: number;
  highwayClassCounts: Record<string, number>;
  namedRoadSegmentCount: number;
  namedRoadCount: number;
  sourceTurnRestrictionRelationCount: number;
  oneWayEdgeCount: number;
  turnRestrictionCount: number;
  noEntryRestrictionCount: number;
  roadClosedRestrictionCount: number;
  blockedDirectedEdgeCount: number;
  accessRestrictedRoadCount: number;
  vehicleRestrictedWayCount: number;
  motorVehicleRestrictedWayCount: number;
  selectedStopNodeIds: string[];
  selectedStopsOnSameRoutableComponent: boolean | null;
  selectedRouteHasLegalPath: boolean | null;
  selectedRouteFailureReason: CuratedFixtureRoutePreflightFailureReason | null;
  diagnosticMessages: string[];
};

export type CuratedFixtureRoutePreflightFailureReason =
  | "no-routable-component"
  | "no-routable-anchor"
  | "missing-stop-node"
  | "stops-on-different-components"
  | "one-way-or-restriction-blocked-route"
  | "clipped-fixture-boundary"
  | "unknown";

export type CuratedFixtureRoutePreflight = {
  ok: boolean;
  fixtureUse: CuratedFixtureUse;
  exercise: RouteExercise | null;
  shortestRouteDistanceMeters: number | null;
  routeNodeIds: string[];
  routeRoadIds: string[];
  failureReason: CuratedFixtureRoutePreflightFailureReason | null;
  messages: string[];
  diagnostics: CuratedFixtureConnectivityDiagnostics;
};

export type CuratedFixtureRouteDiversityInput = {
  avoidRouteRoadIds?: readonly (readonly string[])[];
  avoidStartNodeIds?: readonly string[];
  avoidDestinationNodeIds?: readonly string[];
  maxRouteOverlapRatio?: number;
  minStartDistanceMeters?: number;
  minDestinationDistanceMeters?: number;
};

type RoadWithOsmMetadata = MapRoad & {
  metadata?: {
    source?: string;
    highway?: string;
    rawTags?: Record<string, string>;
  };
};

type CandidateAnchor = {
  nodeId: string;
  label: string;
  point: { x: number; y: number };
  highway: string;
  roadId: string;
  score: number;
};

type ComponentModel = {
  componentIdByNodeId: Map<string, number>;
  componentSizes: number[];
  largestComponentId: number | null;
  routableNodeIds: Set<string>;
  unblockedEdges: DirectedEdge[];
};

const PREFERRED_HIGHWAY_RANK: Record<string, number> = {
  primary: 1,
  primary_link: 1,
  secondary: 2,
  secondary_link: 2,
  tertiary: 3,
  tertiary_link: 3,
  residential: 4,
  living_street: 4,
  unclassified: 5
};

const EXCLUDED_ANCHOR_HIGHWAYS = new Set([
  "service",
  "track",
  "footway",
  "cycleway",
  "path",
  "pedestrian",
  "steps",
  "platform",
  "construction",
  "proposed"
]);

function roadMetadata(road: MapRoad): RoadWithOsmMetadata["metadata"] | null {
  const metadata = (road as RoadWithOsmMetadata).metadata;

  return metadata?.source === "osm" ? metadata : null;
}

function highwayForRoad(road: MapRoad): string {
  return roadMetadata(road)?.highway ?? "unknown";
}

function roadName(road: MapRoad): string {
  return road.name?.trim() || road.id;
}

function tagValue(tags: Record<string, string> | undefined, key: string): string | null {
  const value = tags?.[key]?.trim().toLowerCase();

  return value ? value : null;
}

function graphComponents(input: {
  graph: MapGraph;
  restrictions: MapDefinition["restrictions"];
}): ComponentModel {
  const blockedDirectedEdgeKeys = buildBlockedDirectedEdgeKeys(input.graph, input.restrictions);
  const unblockedEdges = input.graph.edges.filter((edge) => !blockedDirectedEdgeKeys.has(directedEdgeKey(edge)));
  const adjacency = new Map<string, Set<string>>();
  const routableNodeIds = new Set<string>();

  for (const edge of unblockedEdges) {
    routableNodeIds.add(edge.fromNodeId);
    routableNodeIds.add(edge.toNodeId);

    const fromNeighbours = adjacency.get(edge.fromNodeId) ?? new Set<string>();
    const toNeighbours = adjacency.get(edge.toNodeId) ?? new Set<string>();

    fromNeighbours.add(edge.toNodeId);
    toNeighbours.add(edge.fromNodeId);
    adjacency.set(edge.fromNodeId, fromNeighbours);
    adjacency.set(edge.toNodeId, toNeighbours);
  }

  const componentIdByNodeId = new Map<string, number>();
  const componentSizes: number[] = [];

  for (const nodeId of [...routableNodeIds].sort()) {
    if (componentIdByNodeId.has(nodeId)) {
      continue;
    }

    const componentId = componentSizes.length;
    const queue = [nodeId];
    let size = 0;

    componentIdByNodeId.set(nodeId, componentId);

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      size += 1;

      for (const neighbourId of adjacency.get(currentNodeId) ?? []) {
        if (componentIdByNodeId.has(neighbourId)) {
          continue;
        }

        componentIdByNodeId.set(neighbourId, componentId);
        queue.push(neighbourId);
      }
    }

    componentSizes.push(size);
  }

  const largestComponentId =
    componentSizes.length === 0
      ? null
      : componentSizes.reduce(
          (largestIndex, size, index) => (size > componentSizes[largestIndex] ? index : largestIndex),
          0
        );

  return {
    componentIdByNodeId,
    componentSizes,
    largestComponentId,
    routableNodeIds,
    unblockedEdges
  };
}

function countFixtureVehicleRestrictionTags(sourceOverpassFixture: unknown): {
  sourceTurnRestrictionRelationCount: number;
  accessRestrictedRoadCount: number;
  vehicleRestrictedWayCount: number;
  motorVehicleRestrictedWayCount: number;
} {
  const elements = (sourceOverpassFixture as { elements?: unknown })?.elements;

  if (!Array.isArray(elements)) {
    return {
      sourceTurnRestrictionRelationCount: 0,
      accessRestrictedRoadCount: 0,
      vehicleRestrictedWayCount: 0,
      motorVehicleRestrictedWayCount: 0
    };
  }

  let sourceTurnRestrictionRelationCount = 0;
  let accessRestrictedRoadCount = 0;
  let vehicleRestrictedWayCount = 0;
  let motorVehicleRestrictedWayCount = 0;

  for (const element of elements) {
    const item = element as { type?: unknown; tags?: Record<string, string> };

    if (item.type === "relation" && tagValue(item.tags, "type") === "restriction") {
      sourceTurnRestrictionRelationCount += 1;
    }

    if (item.type !== "way") {
      continue;
    }

    if (tagValue(item.tags, "access") === "no") {
      accessRestrictedRoadCount += 1;
    }

    if (tagValue(item.tags, "vehicle") === "no") {
      vehicleRestrictedWayCount += 1;
    }

    if (tagValue(item.tags, "motor_vehicle") === "no") {
      motorVehicleRestrictedWayCount += 1;
    }
  }

  return {
    sourceTurnRestrictionRelationCount,
    accessRestrictedRoadCount,
    vehicleRestrictedWayCount,
    motorVehicleRestrictedWayCount
  };
}

function selectedStopNodeIdsForExercise(map: MapDefinition, graph: MapGraph, exercise?: RouteExercise): string[] {
  if (!exercise) {
    return [];
  }

  return exercise.stops.flatMap((stop) => {
    if (stop.type === "node") {
      return graph.nodesById[stop.nodeId] ? [stop.nodeId] : [];
    }

    const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

    return landmark?.nearestNodeId && graph.nodesById[landmark.nearestNodeId] ? [landmark.nearestNodeId] : [];
  });
}

function sameComponent(
  stopNodeIds: readonly string[],
  componentIdByNodeId: ReadonlyMap<string, number>
): boolean | null {
  if (stopNodeIds.length < 2) {
    return null;
  }

  const firstComponent = componentIdByNodeId.get(stopNodeIds[0]);

  return firstComponent !== undefined && stopNodeIds.every((nodeId) => componentIdByNodeId.get(nodeId) === firstComponent);
}

function preflightExistingRoute(input: {
  map: MapDefinition;
  graph: MapGraph;
  components: ComponentModel;
  exercise?: RouteExercise;
}): {
  selectedStopNodeIds: string[];
  selectedStopsOnSameRoutableComponent: boolean | null;
  selectedRouteHasLegalPath: boolean | null;
  selectedRouteFailureReason: CuratedFixtureRoutePreflightFailureReason | null;
} {
  const selectedStopNodeIds = selectedStopNodeIdsForExercise(input.map, input.graph, input.exercise);
  const selectedStopsOnSameRoutableComponent = sameComponent(
    selectedStopNodeIds,
    input.components.componentIdByNodeId
  );

  if (!input.exercise || selectedStopNodeIds.length < 2) {
    return {
      selectedStopNodeIds,
      selectedStopsOnSameRoutableComponent,
      selectedRouteHasLegalPath: null,
      selectedRouteFailureReason: null
    };
  }

  if (selectedStopNodeIds.length !== input.exercise.stops.length) {
    return {
      selectedStopNodeIds,
      selectedStopsOnSameRoutableComponent,
      selectedRouteHasLegalPath: false,
      selectedRouteFailureReason: "missing-stop-node"
    };
  }

  if (!selectedStopsOnSameRoutableComponent) {
    return {
      selectedStopNodeIds,
      selectedStopsOnSameRoutableComponent,
      selectedRouteHasLegalPath: false,
      selectedRouteFailureReason: "stops-on-different-components"
    };
  }

  const route = findShortestLegalRouteThroughStops({
    graph: input.graph,
    stopNodeIds: selectedStopNodeIds,
    restrictions: input.map.restrictions
  });

  return {
    selectedStopNodeIds,
    selectedStopsOnSameRoutableComponent,
    selectedRouteHasLegalPath: route.found,
    selectedRouteFailureReason: route.found ? null : "one-way-or-restriction-blocked-route"
  };
}

export function buildCuratedFixtureConnectivityDiagnostics(input: {
  map: MapDefinition;
  sourceOverpassFixture?: unknown;
  selectedExercise?: RouteExercise;
  graph?: MapGraph;
}): CuratedFixtureConnectivityDiagnostics {
  const graph = input.graph ?? buildMapGraph(input.map);
  const components = graphComponents({ graph, restrictions: input.map.restrictions });
  const roadIdsWithUnblockedEdges = new Set(components.unblockedEdges.map((edge) => edge.roadId));
  const highwayClassCounts = new Map<string, number>();
  const namedRoadNames = new Set<string>();
  const vehicleRestrictionCounts = countFixtureVehicleRestrictionTags(input.sourceOverpassFixture);

  for (const road of input.map.roads) {
    if (!roadIdsWithUnblockedEdges.has(road.id)) {
      continue;
    }

    const highway = highwayForRoad(road);

    highwayClassCounts.set(highway, (highwayClassCounts.get(highway) ?? 0) + 1);

    if (road.name) {
      namedRoadNames.add(road.name);
    }
  }

  const existingRoutePreflight = preflightExistingRoute({
    map: input.map,
    graph,
    components,
    exercise: input.selectedExercise
  });
  const diagnosticMessages: string[] = [];

  if (components.componentSizes.length === 0) {
    diagnosticMessages.push("No routable driving component was produced from this fixture.");
  }

  if (components.componentSizes.length > 1) {
    diagnosticMessages.push(
      `Fixture has ${components.componentSizes.length} routable components; largest component contains ${
        components.largestComponentId === null ? 0 : components.componentSizes[components.largestComponentId]
      } nodes.`
    );
  }

  if (existingRoutePreflight.selectedRouteHasLegalPath === false) {
    diagnosticMessages.push(
      `Selected route preflight failed: ${existingRoutePreflight.selectedRouteFailureReason ?? "unknown"}.`
    );
  }

  return {
    mapId: input.map.id,
    routableNodeCount: components.routableNodeIds.size,
    routableEdgeCount: components.unblockedEdges.length,
    connectedComponentCount: components.componentSizes.length,
    largestConnectedComponentSize:
      components.largestComponentId === null ? 0 : components.componentSizes[components.largestComponentId],
    highwayClassCounts: Object.fromEntries([...highwayClassCounts.entries()].sort(([left], [right]) => left.localeCompare(right))),
    namedRoadSegmentCount: input.map.roads.filter((road) => road.name).length,
    namedRoadCount: namedRoadNames.size,
    oneWayEdgeCount: components.unblockedEdges.filter((edge) => graph.roadsById[edge.roadId]?.isOneWay).length,
    turnRestrictionCount: input.map.restrictions.filter((restriction) => restriction.type === "prohibited_turn").length,
    noEntryRestrictionCount: input.map.restrictions.filter((restriction) => restriction.type === "no_entry").length,
    roadClosedRestrictionCount: input.map.restrictions.filter((restriction) => restriction.type === "road_closed").length,
    blockedDirectedEdgeCount: buildBlockedDirectedEdgeKeys(graph, input.map.restrictions).size,
    ...vehicleRestrictionCounts,
    ...existingRoutePreflight,
    diagnosticMessages
  };
}

function nodePoint(graph: MapGraph, nodeId: string): { x: number; y: number } {
  const node = graph.nodesById[nodeId];

  return {
    x: node?.x ?? 0,
    y: node?.y ?? 0
  };
}

function anchorScore(road: MapRoad): number {
  const highway = highwayForRoad(road);
  const namedBonus = road.name ? 0 : 20;

  return (PREFERRED_HIGHWAY_RANK[highway] ?? 12) + namedBonus;
}

function labelForNode(input: {
  graph: MapGraph;
  nodeId: string;
  fallback: string;
}): string {
  const incidentEdge = [
    ...(input.graph.outgoingEdgesByNodeId[input.nodeId] ?? []),
    ...(input.graph.incomingEdgesByNodeId[input.nodeId] ?? [])
  ]
    .map((edge) => input.graph.roadsById[edge.roadId])
    .filter((road): road is MapRoad => Boolean(road))
    .sort((left, right) => anchorScore(left) - anchorScore(right) || roadName(left).localeCompare(roadName(right)))[0];

  return incidentEdge ? roadName(incidentEdge) : input.fallback;
}

function buildCandidateAnchors(input: {
  graph: MapGraph;
  components: ComponentModel;
}): CandidateAnchor[] {
  if (input.components.largestComponentId === null) {
    return [];
  }

  const candidatesByNodeId = new Map<string, CandidateAnchor>();

  for (const edge of input.components.unblockedEdges) {
    const road = input.graph.roadsById[edge.roadId];
    const highway = road ? highwayForRoad(road) : "unknown";

    if (!road || EXCLUDED_ANCHOR_HIGHWAYS.has(highway)) {
      continue;
    }

    for (const nodeId of [edge.fromNodeId, edge.toNodeId]) {
      if (input.components.componentIdByNodeId.get(nodeId) !== input.components.largestComponentId) {
        continue;
      }

      const score = anchorScore(road);
      const previousCandidate = candidatesByNodeId.get(nodeId);

      if (previousCandidate && previousCandidate.score <= score) {
        continue;
      }

      candidatesByNodeId.set(nodeId, {
        nodeId,
        label: roadName(road),
        point: nodePoint(input.graph, nodeId),
        highway,
        roadId: road.id,
        score
      });
    }
  }

  return [...candidatesByNodeId.values()].sort(
    (left, right) =>
      left.score - right.score ||
      left.label.localeCompare(right.label) ||
      left.highway.localeCompare(right.highway) ||
      left.nodeId.localeCompare(right.nodeId)
  );
}

function pointDistance(left: { x: number; y: number }, right: { x: number; y: number }): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function candidatePairs(candidates: readonly CandidateAnchor[]): Array<{
  start: CandidateAnchor;
  destination: CandidateAnchor;
  distanceMeters: number;
}> {
  const limitedCandidates = candidates.slice(0, 140);
  const pairs: Array<{ start: CandidateAnchor; destination: CandidateAnchor; distanceMeters: number }> = [];

  for (let leftIndex = 0; leftIndex < limitedCandidates.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < limitedCandidates.length; rightIndex += 1) {
      const left = limitedCandidates[leftIndex];
      const right = limitedCandidates[rightIndex];

      if (left.roadId === right.roadId) {
        continue;
      }

      pairs.push({
        start: left,
        destination: right,
        distanceMeters: pointDistance(left.point, right.point)
      });
    }
  }

  return pairs.sort(
    (left, right) =>
      right.distanceMeters - left.distanceMeters ||
      left.start.nodeId.localeCompare(right.start.nodeId) ||
      left.destination.nodeId.localeCompare(right.destination.nodeId)
  );
}

function checkpointNodeFromRoute(routeNodeIds: readonly string[]): string | null {
  if (routeNodeIds.length < 3) {
    return null;
  }

  return routeNodeIds[Math.floor(routeNodeIds.length / 2)] ?? null;
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

function nodeDistance(graph: MapGraph, leftNodeId: string, rightNodeId: string): number {
  const left = graph.nodesById[leftNodeId];
  const right = graph.nodesById[rightNodeId];

  if (!left || !right) {
    return Number.POSITIVE_INFINITY;
  }

  return pointDistance(left, right);
}

function passesRouteDiversity(input: {
  graph: MapGraph;
  startNodeId: string;
  destinationNodeId: string;
  routeRoadIds: readonly string[];
  diversity?: CuratedFixtureRouteDiversityInput;
}): boolean {
  const diversity = input.diversity;

  if (!diversity) {
    return true;
  }

  const maxRouteOverlapRatio = diversity.maxRouteOverlapRatio ?? 0.68;

  for (const avoidedRoadIds of diversity.avoidRouteRoadIds ?? []) {
    if (routeOverlapRatio(input.routeRoadIds, avoidedRoadIds) > maxRouteOverlapRatio) {
      return false;
    }
  }

  const minStartDistanceMeters = diversity.minStartDistanceMeters ?? 70;

  for (const avoidedStartNodeId of diversity.avoidStartNodeIds ?? []) {
    if (nodeDistance(input.graph, input.startNodeId, avoidedStartNodeId) < minStartDistanceMeters) {
      return false;
    }
  }

  const minDestinationDistanceMeters = diversity.minDestinationDistanceMeters ?? 70;

  for (const avoidedDestinationNodeId of diversity.avoidDestinationNodeIds ?? []) {
    if (nodeDistance(input.graph, input.destinationNodeId, avoidedDestinationNodeId) < minDestinationDistanceMeters) {
      return false;
    }
  }

  return true;
}

export function buildCuratedFixtureRoutableExercise(input: {
  map: MapDefinition;
  sourceOverpassFixture?: unknown;
  id: string;
  title: string;
  description: string;
  difficulty: RouteExerciseDifficulty;
  exerciseVersion?: string;
  minimumStraightLineDistanceMeters?: number;
  routeOrdinal?: number;
  includeCheckpoint?: boolean;
  diversity?: CuratedFixtureRouteDiversityInput;
}): CuratedFixtureRoutePreflight {
  const graph = buildMapGraph(input.map);
  const components = graphComponents({ graph, restrictions: input.map.restrictions });
  const diagnostics = buildCuratedFixtureConnectivityDiagnostics({
    map: input.map,
    sourceOverpassFixture: input.sourceOverpassFixture,
    graph
  });

  if (components.largestComponentId === null) {
    return {
      ok: false,
      fixtureUse: "visualQaOnly",
      exercise: null,
      shortestRouteDistanceMeters: null,
      routeNodeIds: [],
      routeRoadIds: [],
      failureReason: "no-routable-component",
      messages: ["Fixture has no routable driving component; keep it as visual QA only."],
      diagnostics
    };
  }

  const candidates = buildCandidateAnchors({ graph, components });

  if (candidates.length < 2) {
    return {
      ok: false,
      fixtureUse: "visualQaOnly",
      exercise: null,
      shortestRouteDistanceMeters: null,
      routeNodeIds: [],
      routeRoadIds: [],
      failureReason: "no-routable-anchor",
      messages: ["Fixture does not have two suitable named drivable anchors on the largest component."],
      diagnostics
    };
  }

  const minimumDistance = input.minimumStraightLineDistanceMeters ?? 220;
  const targetRouteOrdinal = input.routeOrdinal ?? 0;
  let acceptedRouteOrdinal = 0;

  for (const pair of candidatePairs(candidates)) {
    if (pair.distanceMeters < minimumDistance) {
      continue;
    }

    const route = findShortestLegalRoute({
      graph,
      startNodeId: pair.start.nodeId,
      endNodeId: pair.destination.nodeId,
      restrictions: input.map.restrictions
    });

    if (!route.found) {
      continue;
    }

    const checkpointNodeId = input.includeCheckpoint === false ? null : checkpointNodeFromRoute(route.nodeIds);
    const stopNodeIds = checkpointNodeId
      ? [pair.start.nodeId, checkpointNodeId, pair.destination.nodeId]
      : [pair.start.nodeId, pair.destination.nodeId];
    const confirmedRoute = findShortestLegalRouteThroughStops({
      graph,
      stopNodeIds,
      restrictions: input.map.restrictions
    });

    if (!confirmedRoute.found) {
      continue;
    }

    if (
      !passesRouteDiversity({
        graph,
        startNodeId: pair.start.nodeId,
        destinationNodeId: pair.destination.nodeId,
        routeRoadIds: confirmedRoute.roadIds,
        diversity: input.diversity
      })
    ) {
      continue;
    }

    if (acceptedRouteOrdinal < targetRouteOrdinal) {
      acceptedRouteOrdinal += 1;
      continue;
    }

    const exercise: RouteExercise = {
      id: input.id,
      title: input.title,
      description: input.description,
      mapId: input.map.id,
      exerciseVersion: input.exerciseVersion ?? "1.0.0",
      difficulty: input.difficulty,
      stops: stopNodeIds.map((nodeId, index) => ({
        type: "node" as const,
        nodeId,
        label:
          index === 0
            ? pair.start.label
            : index === stopNodeIds.length - 1
              ? pair.destination.label
              : labelForNode({ graph, nodeId, fallback: "Checkpoint" })
      }))
    };
    const confirmedDiagnostics = buildCuratedFixtureConnectivityDiagnostics({
      map: input.map,
      sourceOverpassFixture: input.sourceOverpassFixture,
      selectedExercise: exercise,
      graph
    });

    return {
      ok: true,
      fixtureUse: "routableExercise",
      exercise,
      shortestRouteDistanceMeters: confirmedRoute.distanceMeters,
      routeNodeIds: confirmedRoute.nodeIds,
      routeRoadIds: confirmedRoute.roadIds,
      failureReason: null,
      messages: [
        `Selected routable anchors on largest component: ${pair.start.nodeId} -> ${pair.destination.nodeId}.`,
        `Confirmed legal path through ${stopNodeIds.length} required stop(s), ${Math.round(
          confirmedRoute.distanceMeters
        )}m.`
      ],
      diagnostics: confirmedDiagnostics
    };
  }

  return {
    ok: false,
    fixtureUse: "visualQaOnly",
    exercise: null,
    shortestRouteDistanceMeters: null,
    routeNodeIds: [],
    routeRoadIds: [],
    failureReason:
      diagnostics.connectedComponentCount > 1
        ? "clipped-fixture-boundary"
        : "one-way-or-restriction-blocked-route",
    messages: [
      "No legal route was found between suitable anchors on the largest drivable component.",
      "Keep this fixture visual QA only until the clipped boundary or graph connectivity is improved."
    ],
    diagnostics
  };
}
