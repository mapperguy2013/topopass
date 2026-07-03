import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CURATED_LONDON_OSM_ATTRIBUTION,
  CURATED_LONDON_OSM_TAG_WHITELIST,
  CURATED_LONDON_OSM_ZONES,
  auditCuratedLondonOsmFixture,
  summariseCuratedLondonRenderCategories
} from "../../app/dev/route-runner/curatedLondonOsmEnrichment.ts";

type GeoJsonFeature = {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry?: {
    type: string;
    coordinates: unknown;
  };
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  generator?: string;
  copyright?: string;
  timestamp?: string;
  features: GeoJsonFeature[];
};

type Bounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");
const defaultSourcePath = path.join(projectRoot, "public/maps/kings-cross-euston/osm-raw.geojson");
const defaultOutputPath = path.join(projectRoot, "lib/map-engine/osm/fixtures/curatedLondonStage1605Overpass.json");
const tagWhitelist = new Set<string>(CURATED_LONDON_OSM_TAG_WHITELIST);

const args = new Map(
  process.argv.slice(2).flatMap((arg): [string, string][] => {
    const match = /^--([^=]+)=(.*)$/.exec(arg);

    return match ? [[match[1], match[2]]] : [];
  })
);

const sourcePath = path.resolve(projectRoot, args.get("source") ?? defaultSourcePath);
const outputPath = path.resolve(projectRoot, args.get("output") ?? defaultOutputPath);
const maxFeaturesPerZone = Number(args.get("max-per-zone") ?? 240);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normaliseTagValue(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function normaliseTags(properties: Record<string, unknown> | undefined): Record<string, string> {
  if (!properties) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key]) => tagWhitelist.has(key))
      .map(([key, value]) => [key, normaliseTagValue(value)] as const)
      .filter((entry): entry is readonly [string, string] => entry[1] !== null)
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

function collectCoordinates(value: unknown, output: [number, number][] = []): [number, number][] {
  if (!Array.isArray(value)) {
    return output;
  }

  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    output.push([value[0], value[1]]);
    return output;
  }

  for (const child of value) {
    collectCoordinates(child, output);
  }

  return output;
}

function featureBounds(feature: GeoJsonFeature): Bounds | null {
  const coordinates = collectCoordinates(feature.geometry?.coordinates);

  if (coordinates.length === 0) {
    return null;
  }

  return coordinates.reduce(
    (bounds, [lon, lat]) => ({
      west: Math.min(bounds.west, lon),
      south: Math.min(bounds.south, lat),
      east: Math.max(bounds.east, lon),
      north: Math.max(bounds.north, lat)
    }),
    {
      west: Number.POSITIVE_INFINITY,
      south: Number.POSITIVE_INFINITY,
      east: Number.NEGATIVE_INFINITY,
      north: Number.NEGATIVE_INFINITY
    }
  );
}

function boundsIntersect(left: Bounds, right: Bounds): boolean {
  return !(left.east < right.west || left.west > right.east || left.north < right.south || left.south > right.north);
}

function featureIntersectsBounds(feature: GeoJsonFeature, bounds: Bounds): boolean {
  const currentBounds = featureBounds(feature);

  return Boolean(currentBounds) && boundsIntersect(currentBounds as Bounds, bounds);
}

function geometryLines(feature: GeoJsonFeature): [number, number][][] {
  const coordinates = feature.geometry?.coordinates;

  if (!Array.isArray(coordinates)) {
    return [];
  }

  if (feature.geometry?.type === "LineString") {
    return [coordinates as [number, number][]];
  }

  if (feature.geometry?.type === "MultiLineString" || feature.geometry?.type === "Polygon") {
    return coordinates as [number, number][][];
  }

  if (feature.geometry?.type === "MultiPolygon") {
    return (coordinates as [number, number][][][]).flat();
  }

  return [];
}

function pointCoordinates(feature: GeoJsonFeature): [number, number][] {
  const coordinates = feature.geometry?.coordinates;

  if (feature.geometry?.type === "Point" && Array.isArray(coordinates) && typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    return [coordinates as [number, number]];
  }

  if (feature.geometry?.type === "MultiPoint" && Array.isArray(coordinates)) {
    return coordinates.filter(
      (coordinate): coordinate is [number, number] =>
        Array.isArray(coordinate) && typeof coordinate[0] === "number" && typeof coordinate[1] === "number"
    );
  }

  return [];
}

function stableId(input: string, offset: number): number {
  let hash = 2166136261;

  for (const character of input) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return offset + (hash >>> 0);
}

function coordinateNodeId([lon, lat]: [number, number]): number {
  return stableId(`${lon.toFixed(7)},${lat.toFixed(7)}`, 1_000_000_000);
}

function featureWayId(feature: GeoJsonFeature, index: number): number {
  const sourceId = normaliseTagValue(feature.properties?.["@id"]);

  return stableId(`${sourceId ?? "feature"}:${index}`, 2_000_000_000);
}

function sortedElements(elements: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return elements.sort((left, right) => {
    const typeOrder = String(left.type).localeCompare(String(right.type));

    if (typeOrder !== 0) {
      return typeOrder;
    }

    return Number(left.id) - Number(right.id);
  });
}

function tagValue(properties: Record<string, unknown> | undefined, key: string): string {
  return normaliseTagValue(properties?.[key])?.trim().toLowerCase() ?? "";
}

function sourceFeatureId(feature: GeoJsonFeature): string {
  const sourceId = normaliseTagValue(feature.properties?.["@id"]);

  if (sourceId) {
    return sourceId;
  }

  const firstCoordinate = collectCoordinates(feature.geometry?.coordinates)[0];

  return firstCoordinate
    ? `${feature.geometry?.type ?? "Geometry"}:${firstCoordinate[0].toFixed(7)},${firstCoordinate[1].toFixed(7)}`
    : JSON.stringify(feature.properties ?? {});
}

function featurePriority(feature: GeoJsonFeature): number {
  const properties = feature.properties;
  const highway = tagValue(properties, "highway");
  const railway = tagValue(properties, "railway");
  let priority = 100;

  if (railway === "station" || tagValue(properties, "public_transport") === "station") {
    priority = 5;
  } else if (railway === "rail" || railway === "subway" || railway === "light_rail") {
    priority = 8;
  } else if (tagValue(properties, "natural") === "water" || tagValue(properties, "waterway")) {
    priority = 9;
  } else if (tagValue(properties, "leisure") === "park" || tagValue(properties, "leisure") === "garden") {
    priority = 10;
  } else if (highway === "primary" || highway === "primary_link") {
    priority = 12;
  } else if (highway === "secondary" || highway === "secondary_link") {
    priority = 14;
  } else if (highway === "tertiary" || highway === "tertiary_link") {
    priority = 16;
  } else if (highway === "residential" || highway === "unclassified" || highway === "living_street") {
    priority = 22;
  } else if (highway === "service") {
    priority = 30;
  } else if (highway === "pedestrian" || highway === "footway" || highway === "cycleway" || highway === "path") {
    priority = 34;
  }

  if (tagValue(properties, "bridge") && tagValue(properties, "bridge") !== "no") {
    priority -= 4;
  }

  if (tagValue(properties, "tunnel") && tagValue(properties, "tunnel") !== "no") {
    priority -= 3;
  }

  if (tagValue(properties, "oneway")) {
    priority -= 2;
  }

  if (tagValue(properties, "name")) {
    priority -= 1;
  }

  if (tagValue(properties, "amenity") || tagValue(properties, "tourism") || tagValue(properties, "historic") || tagValue(properties, "place")) {
    priority -= 1;
  }

  return priority;
}

function selectCuratedFeatures(source: GeoJsonFeatureCollection): GeoJsonFeature[] {
  const byId = new Map<string, GeoJsonFeature>();

  for (const zone of CURATED_LONDON_OSM_ZONES) {
    const zoneFeatures = source.features
      .filter((feature) => feature.type === "Feature" && featureIntersectsBounds(feature, zone.bounds))
      .sort((left, right) => featurePriority(left) - featurePriority(right) || sourceFeatureId(left).localeCompare(sourceFeatureId(right)))
      .slice(0, maxFeaturesPerZone);

    for (const feature of zoneFeatures) {
      byId.set(sourceFeatureId(feature), feature);
    }
  }

  return [...byId.values()].sort((left, right) => sourceFeatureId(left).localeCompare(sourceFeatureId(right)));
}

async function readSourceGeoJson(): Promise<GeoJsonFeatureCollection> {
  const parsed = JSON.parse(await readFile(sourcePath, "utf8")) as unknown;

  if (!isRecord(parsed) || parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
    throw new Error(`Curated London OSM enrichment source is not a FeatureCollection: ${sourcePath}`);
  }

  return parsed as GeoJsonFeatureCollection;
}

const source = await readSourceGeoJson();
const selectedFeatures = selectCuratedFeatures(source);

const nodesById = new Map<number, Record<string, unknown>>();
const ways: Array<Record<string, unknown>> = [];

for (const feature of selectedFeatures) {
  const tags = normaliseTags(feature.properties);

  for (const [pointIndex, [lon, lat]] of pointCoordinates(feature).entries()) {
    const id = stableId(`${tags["@id"] ?? "point"}:${pointIndex}:${lon.toFixed(7)},${lat.toFixed(7)}`, 3_000_000_000);
    nodesById.set(id, { type: "node", id, lat, lon, ...(Object.keys(tags).length > 0 ? { tags } : {}) });
  }

  geometryLines(feature).forEach((line, lineIndex) => {
    const cleanLine = line.filter(
      (coordinate): coordinate is [number, number] =>
        Array.isArray(coordinate) && typeof coordinate[0] === "number" && typeof coordinate[1] === "number"
    );

    if (cleanLine.length < 2) {
      return;
    }

    const nodeRefs = cleanLine.map((coordinate) => {
      const id = coordinateNodeId(coordinate);
      const [lon, lat] = coordinate;

      if (!nodesById.has(id)) {
        nodesById.set(id, { type: "node", id, lat, lon });
      }

      return id;
    });

    ways.push({
      type: "way",
      id: featureWayId(feature, lineIndex),
      nodes: nodeRefs,
      ...(Object.keys(tags).length > 0 ? { tags } : {})
    });
  });
}

const fixture = {
  version: 0.6,
  generator: "TopoPass curated London OSM enrichment script",
  osm3s: {
    timestamp_osm_base: source.timestamp ?? "unknown",
    copyright: source.copyright ?? "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."
  },
  topopass: {
    stage: "160.5",
    importDate: source.timestamp ?? "unknown",
    source: {
      type: "local-osm-geojson-cache",
      path: path.relative(projectRoot, sourcePath).replaceAll("\\", "/"),
      generator: source.generator ?? "unknown"
    },
    attribution: CURATED_LONDON_OSM_ATTRIBUTION,
    zones: CURATED_LONDON_OSM_ZONES,
    tagWhitelist: CURATED_LONDON_OSM_TAG_WHITELIST,
    maxFeaturesPerZone
  },
  elements: sortedElements([...nodesById.values(), ...ways])
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(`${outputPath}.tmp`, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
await rename(`${outputPath}.tmp`, outputPath);

const coverage = auditCuratedLondonOsmFixture(fixture);
const renderCategories = summariseCuratedLondonRenderCategories(fixture);

console.log(
  JSON.stringify(
    {
      output: path.relative(projectRoot, outputPath).replaceAll("\\", "/"),
      selectedFeatureCount: selectedFeatures.length,
      elementCount: fixture.elements.length,
      coverage,
      renderCategories
    },
    null,
    2
  )
);
