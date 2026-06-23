import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMapProjection } from "./map-projection.mjs";
import {
  classifyRoadAccess,
  isPubliclyDrivable,
  roadAccessClasses
} from "./road-access.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");
const dataDirectory = path.join(
  projectRoot,
  "src/data/maps/kings-cross-euston"
);
const config = JSON.parse(
  await readFile(path.join(dataDirectory, "map-config.json"), "utf8")
);
const rawMap = JSON.parse(
  await readFile(
    path.join(projectRoot, "public/maps/kings-cross-euston/osm-raw.geojson"),
    "utf8"
  )
);

if (rawMap.type !== "FeatureCollection" || rawMap.features.length === 0) {
  throw new Error("Real map data not loaded yet: osm-raw.geojson is invalid or empty.");
}

const roads = rawMap.features.filter(
  (feature) =>
    feature.geometry?.type === "LineString" &&
    Boolean(feature.properties?.highway) &&
    isPubliclyDrivable(classifyRoadAccess(feature.properties))
);
const stations = rawMap.features.filter(
  (feature) =>
    feature.geometry?.type === "Point" &&
    feature.properties?.railway === "station"
);

function stationLocation(name) {
  const station = stations.find((feature) => feature.properties?.name === name);
  if (!station) {
    throw new Error(`Required OSM station point not found: ${name}.`);
  }
  return {
    label: name,
    coordinates: station.geometry.coordinates,
    osmId: station.properties["@id"]
  };
}

const routeDefinitions = [
  {
    id: "kings-cross-to-euston",
    start: stationLocation("King's Cross St Pancras"),
    end: stationLocation("Euston")
  },
  {
    id: "russell-square-to-warren-street",
    start: stationLocation("Russell Square"),
    end: stationLocation("Warren Street")
  },
  {
    id: "goodge-street-to-angel",
    start: stationLocation("Goodge Street"),
    end: stationLocation("Angel")
  },
  {
    id: "euston-to-holborn",
    start: stationLocation("Euston"),
    // Prototype endpoint from OSM station coordinates used by the earlier export.
    end: {
      label: "Holborn",
      coordinates: [-0.1200657, 51.5171149],
      osmId: "prototype/holborn"
    }
  },
  {
    id: "kings-cross-to-oxford-circus",
    start: stationLocation("King's Cross St Pancras"),
    // Prototype visible-map endpoint north of Oxford Circus. Replace after review.
    end: {
      label: "Oxford Circus",
      coordinates: [-0.1419, 51.5162],
      osmId: "prototype/oxford-circus"
    }
  }
];

function coordinateKey(coordinate) {
  return `${coordinate[0].toFixed(7)},${coordinate[1].toFixed(7)}`;
}

function distanceInMetres(a, b) {
  const latitude = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const x = (b[0] - a[0]) * Math.cos(latitude) * 111_320;
  const y = (b[1] - a[1]) * 110_540;
  return Math.hypot(x, y);
}

function roadPenalty(highway) {
  if (/^(motorway|trunk|primary)/.test(highway ?? "")) return 1;
  if (/^(secondary|tertiary)/.test(highway ?? "")) return 1.08;
  if (/^(residential|unclassified|living_street)/.test(highway ?? "")) {
    return 1.2;
  }
  return 1.65;
}

const coordinatesByKey = new Map();
const adjacency = new Map();

function addDirectedEdge(from, to, feature) {
  const fromKey = coordinateKey(from);
  const toKey = coordinateKey(to);
  coordinatesByKey.set(fromKey, from);
  coordinatesByKey.set(toKey, to);
  const outgoing = adjacency.get(fromKey) ?? [];
  outgoing.push({
    toKey,
    weight:
      distanceInMetres(from, to) * roadPenalty(feature.properties?.highway),
    name: feature.properties?.name ?? "Unnamed road",
    osmId: feature.properties?.["@id"],
    oneWay: [
      roadAccessClasses.driveOneWayForward,
      roadAccessClasses.driveOneWayReverse
    ].includes(classifyRoadAccess(feature.properties))
  });
  adjacency.set(fromKey, outgoing);
}

for (const feature of roads) {
  if (
    feature.geometry?.type !== "LineString" ||
    ["private", "no"].includes(feature.properties?.access) ||
    feature.properties?.highway === "service"
  ) {
    continue;
  }

  const coordinates = feature.geometry.coordinates;
  const accessClass = classifyRoadAccess(feature.properties);
  for (let index = 1; index < coordinates.length; index += 1) {
    const from = coordinates[index - 1];
    const to = coordinates[index];
    const isReverse = accessClass === roadAccessClasses.driveOneWayReverse;
    const isOneWay =
      isReverse || accessClass === roadAccessClasses.driveOneWayForward;

    addDirectedEdge(isReverse ? to : from, isReverse ? from : to, feature);
    if (!isOneWay) {
      addDirectedEdge(isReverse ? from : to, isReverse ? to : from, feature);
    }
  }
}

function nearestNetworkKey(coordinate) {
  let nearestKey = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const [key, candidate] of coordinatesByKey) {
    const candidateDistance = distanceInMetres(coordinate, candidate);
    if (candidateDistance < nearestDistance) {
      nearestKey = key;
      nearestDistance = candidateDistance;
    }
  }

  return { key: nearestKey, distance: nearestDistance };
}

function shortestPath(startKey, endKey) {
  const distances = new Map([[startKey, 0]]);
  const previous = new Map();
  const queue = [{ key: startKey, distance: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const current = queue.shift();
    if (current.distance !== distances.get(current.key)) continue;
    if (current.key === endKey) break;

    for (const edge of adjacency.get(current.key) ?? []) {
      const nextDistance = current.distance + edge.weight;
      if (nextDistance >= (distances.get(edge.toKey) ?? Number.POSITIVE_INFINITY)) {
        continue;
      }
      distances.set(edge.toKey, nextDistance);
      previous.set(edge.toKey, { fromKey: current.key, edge });
      queue.push({ key: edge.toKey, distance: nextDistance });
    }
  }

  if (!previous.has(endKey)) {
    throw new Error("No drivable OSM route was found between the selected stations.");
  }

  const path = [];
  let cursor = endKey;
  while (cursor !== startKey) {
    const step = previous.get(cursor);
    path.push({ fromKey: step.fromKey, toKey: cursor, ...step.edge });
    cursor = step.fromKey;
  }
  return path.reverse();
}

const project = createMapProjection(config);
const acceptedRoutes = routeDefinitions.map((definition) => {
  const startSnap = nearestNetworkKey(definition.start.coordinates);
  const endSnap = nearestNetworkKey(definition.end.coordinates);
  const steps = shortestPath(startSnap.key, endSnap.key);
  const keys = [steps[0].fromKey, ...steps.map((step) => step.toKey)];
  const points = keys.map((key) => {
    const [x, y] = project(coordinatesByKey.get(key));
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  });

  return {
    ...definition,
    startSnap,
    endSnap,
    steps,
    keys,
    points
  };
});
const primaryRoute = acceptedRoutes[0];
const routeNodes = primaryRoute.keys.map((key, index) => ({
  id: `route-node-${index}`,
  ...primaryRoute.points[index],
  label:
    index === 0
      ? `${primaryRoute.start.label} road access`
      : index === primaryRoute.keys.length - 1
        ? `${primaryRoute.end.label} road access`
        : primaryRoute.steps[Math.max(0, index - 1)].name
}));
const routeEdges = primaryRoute.steps.map((step, index) => ({
  id: `route-edge-${index}`,
  from: `route-node-${index}`,
  to: `route-node-${index + 1}`,
  name: step.name,
  oneWay: step.oneWay
}));
const acceptedEdgeIds = routeEdges.map((edge) => edge.id);
const acceptedRoutePointsById = Object.fromEntries(
  acceptedRoutes.map((route) => [route.id, route.points])
);

const output = `// Generated from real OpenStreetMap road geometry by
// scripts/maps/generate-kings-cross-euston-route-graph.mjs.
// Do not hand-edit coordinates; regenerate from the attributed GeoJSON inputs.
import type {
  DrawRouteQuestion,
  RouteGraph,
  RouteMapPoint
} from "@/src/data/maps/routeTypes";

export const kingsCrossEustonRouteGraph: RouteGraph = ${JSON.stringify(
  {
    mapId: config.mapId,
    mapWidth: config.width,
    mapHeight: config.height,
    nodes: routeNodes,
    edges: routeEdges
  },
  null,
  2
)};

export const kingsCrossEustonAcceptedRoutePoints: RouteMapPoint[] = ${JSON.stringify(
  primaryRoute.points,
  null,
  2
)};

export const acceptedRoutePointsById: Record<string, RouteMapPoint[]> = ${JSON.stringify(
  acceptedRoutePointsById,
  null,
  2
)};

export const kingsCrossEustonRouteQuestion: DrawRouteQuestion = ${JSON.stringify(
  {
    id: "real-data-kings-cross-to-euston",
    type: "draw-route",
    mapId: config.mapId,
    prompt: "Draw a driving route from King's Cross St Pancras to Euston.",
    startNodeId: routeNodes[0].id,
    endNodeId: routeNodes[routeNodes.length - 1].id,
    acceptedRoutes: [acceptedEdgeIds]
  },
  null,
  2
)};

export const kingsCrossEustonRouteSource = ${JSON.stringify(
  {
    source: config.source,
    attribution: config.attribution,
    startStationOsmId: primaryRoute.start.osmId,
    endStationOsmId: primaryRoute.end.osmId,
    sourceGeoJson: "public/maps/kings-cross-euston/osm-raw.geojson",
    startSnapDistanceMetres: Number(primaryRoute.startSnap.distance.toFixed(1)),
    endSnapDistanceMetres: Number(primaryRoute.endSnap.distance.toFixed(1)),
    prototypeRoutes: acceptedRoutes.map((route) => ({
      id: route.id,
      reviewed: false,
      pointCount: route.points.length,
      startSnapDistanceMetres: Number(route.startSnap.distance.toFixed(1)),
      endSnapDistanceMetres: Number(route.endSnap.distance.toFixed(1))
    }))
  },
  null,
  2
)} as const;
`;

await writeFile(path.join(dataDirectory, "routeGraph.ts"), output, "utf8");
console.log(
  `Generated ${acceptedRoutes.length} prototype routes from real OSM roads. ` +
    `Primary route contains ${routeEdges.length} graph edges.`
);
