import type {
  OverpassElement,
  OverpassJsonResponse,
  OverpassNodeElement,
  OverpassRelationElement,
  OverpassTags,
  OverpassWayElement
} from "../../../lib/map-engine/osm/index.ts";
import { auditRealLondonContextCoverage } from "./realLondonContextData.ts";

export type CuratedLondonOsmZoneId =
  | "dense-central-streets"
  | "major-road-side-streets"
  | "high-street"
  | "suburban-estate"
  | "thames-bridge"
  | "park-edge"
  | "rail-station-heavy"
  | "awkward-junction"
  | "one-way-system"
  | "learner-route-review"
  | "mobile-viewport-stress";

export type CuratedLondonOsmZone = {
  id: CuratedLondonOsmZoneId;
  label: string;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  intendedUse: string;
};

export type CuratedRealLondonOverpassFixtureId =
  | "piccadilly-circus"
  | "waterloo-bridge"
  | "one-way-system-area"
  | "quiet-residential-roads";

export type CuratedRealLondonOverpassFixtureMetadata = {
  id: CuratedRealLondonOverpassFixtureId;
  fixtureName: string;
  label: string;
  source: "OpenStreetMap via Overpass export";
  importDate: string;
  areaPurpose: string;
  attribution: typeof CURATED_LONDON_OSM_ATTRIBUTION;
  knownLimitations: readonly string[];
};

export type CuratedLondonRenderCategory =
  | "majorRoad"
  | "secondaryRoad"
  | "localRoad"
  | "serviceRoad"
  | "nonDrivingPath"
  | "bridgeRoad"
  | "tunnelRoad"
  | "oneWaySegment"
  | "restrictedTurn"
  | "park"
  | "water"
  | "rail"
  | "station"
  | "landmark"
  | "areaLabel"
  | "learnerOverlay";

export type CuratedLondonFixtureCoverage = {
  elementCount: number;
  nodeCount: number;
  wayCount: number;
  relationCount: number;
  roadClassCount: number;
  namedRoadCount: number;
  oneWayTaggedWayCount: number;
  turnRestrictionRelationCount: number;
  accessRestrictionTaggedWayCount: number;
  bridgeTaggedWayCount: number;
  tunnelTaggedWayCount: number;
  railFeatureCount: number;
  stationFeatureCount: number;
  parkFeatureCount: number;
  waterFeatureCount: number;
  landmarkFeatureCount: number;
  areaNameFeatureCount: number;
  publicBuildingFeatureCount: number;
  crossingFeatureCount: number;
  trafficSignalFeatureCount: number;
};

export type CuratedLondonRenderCategorySummary = Record<CuratedLondonRenderCategory, number>;
export type CuratedLondonHighwayClassSummary = Record<string, number>;

export const CURATED_LONDON_OSM_ATTRIBUTION = {
  text: "(c) OpenStreetMap contributors",
  licence: "ODbL",
  url: "https://www.openstreetmap.org/copyright"
} as const;

export const CURATED_LONDON_OSM_TAG_WHITELIST = [
  "@id",
  "access",
  "amenity",
  "barrier",
  "bridge",
  "bridge:name",
  "building",
  "bus",
  "cycleway",
  "highway",
  "historic",
  "junction",
  "landmark",
  "landuse",
  "lanes",
  "layer",
  "leisure",
  "maxspeed",
  "motor_vehicle",
  "motorcar",
  "name",
  "natural",
  "oneway",
  "place",
  "public_transport",
  "railway",
  "ref",
  "restriction",
  "service",
  "subway",
  "taxi",
  "tourism",
  "tunnel",
  "type",
  "vehicle",
  "water",
  "waterway"
] as const;

export const CURATED_LONDON_RENDER_CATEGORIES: CuratedLondonRenderCategory[] = [
  "majorRoad",
  "secondaryRoad",
  "localRoad",
  "serviceRoad",
  "nonDrivingPath",
  "bridgeRoad",
  "tunnelRoad",
  "oneWaySegment",
  "restrictedTurn",
  "park",
  "water",
  "rail",
  "station",
  "landmark",
  "areaLabel",
  "learnerOverlay"
];

export const CURATED_LONDON_OSM_ZONES: CuratedLondonOsmZone[] = [
  {
    id: "dense-central-streets",
    label: "Dense central streets",
    bounds: { west: -0.143, south: 51.518, east: -0.118, north: 51.528 },
    intendedUse: "Dense central London grid, labels, one-way texture, and road hierarchy."
  },
  {
    id: "major-road-side-streets",
    label: "Major road plus side streets",
    bounds: { west: -0.146, south: 51.524, east: -0.115, north: 51.533 },
    intendedUse: "Major-road casing with secondary/local side-street structure."
  },
  {
    id: "high-street",
    label: "High street",
    bounds: { west: -0.14, south: 51.526, east: -0.11, north: 51.536 },
    intendedUse: "High-street labels, named roads, bus/taxi/cycle/access tags where available."
  },
  {
    id: "suburban-estate",
    label: "Suburban estate proxy",
    bounds: { west: -0.176, south: 51.508, east: -0.145, north: 51.523 },
    intendedUse: "Quieter residential/service-road blocks inside the current cached extract."
  },
  {
    id: "thames-bridge",
    label: "Thames bridge",
    bounds: { west: -0.128, south: 51.504, east: -0.111, north: 51.512 },
    intendedUse: "Small future Overpass zone for Thames bridge context; may be empty in the local cached extract."
  },
  {
    id: "park-edge",
    label: "Park edge",
    bounds: { west: -0.113, south: 51.522, east: -0.101, north: 51.529 },
    intendedUse: "Park/open-space edge, surrounding road labels, and learner orientation."
  },
  {
    id: "rail-station-heavy",
    label: "Rail and station-heavy area",
    bounds: { west: -0.134, south: 51.527, east: -0.116, north: 51.536 },
    intendedUse: "Rail, station, public transport, and nearby road hierarchy."
  },
  {
    id: "awkward-junction",
    label: "Awkward junction",
    bounds: { west: -0.137, south: 51.519, east: -0.124, north: 51.526 },
    intendedUse: "Junction geometry, crossings, one-way decisions, and restriction symbols."
  },
  {
    id: "one-way-system",
    label: "One-way system",
    bounds: { west: -0.135, south: 51.517, east: -0.122, north: 51.525 },
    intendedUse: "One-way-heavy local street pattern and decluttering checks."
  },
  {
    id: "learner-route-review",
    label: "Learner route review context",
    bounds: { west: -0.136, south: 51.518, east: -0.122, north: 51.528 },
    intendedUse: "Base-map context under attempted/correct route and review warning overlays."
  },
  {
    id: "mobile-viewport-stress",
    label: "Mobile viewport stress",
    bounds: { west: -0.132, south: 51.52, east: -0.123, north: 51.526 },
    intendedUse: "Narrow viewport road labels, one-way symbols, context labels, and touch targets."
  }
];

export const CURATED_REAL_LONDON_OVERPASS_FIXTURES: CuratedRealLondonOverpassFixtureMetadata[] = [
  {
    id: "piccadilly-circus",
    fixtureName: "piccadillyCircusOverpass.json",
    label: "Piccadilly Circus",
    source: "OpenStreetMap via Overpass export",
    importDate: "2026-07-03T00:09:45Z",
    areaPurpose: "Dense Central London / complex street readability.",
    attribution: CURATED_LONDON_OSM_ATTRIBUTION,
    knownLimitations: [
      "Small bounded extract, not full London coverage.",
      "OSM access, amenity, and landmark tags depend on local source completeness."
    ]
  },
  {
    id: "waterloo-bridge",
    fixtureName: "waterlooBridgeOverpass.json",
    label: "Waterloo Bridge",
    source: "OpenStreetMap via Overpass export",
    importDate: "2026-07-03T00:11:45Z",
    areaPurpose: "Thames, bridge, rail/station, and central context.",
    attribution: CURATED_LONDON_OSM_ATTRIBUTION,
    knownLimitations: [
      "Small bounded extract, not full London coverage.",
      "Bridge, rail, station, and water detail is limited to tags present in the export."
    ]
  },
  {
    id: "one-way-system-area",
    fixtureName: "oneWaySystemAreaOverpass.json",
    label: "One-way system area",
    source: "OpenStreetMap via Overpass export",
    importDate: "2026-07-03T00:13:44Z",
    areaPurpose: "One-way and restriction cartography.",
    attribution: CURATED_LONDON_OSM_ATTRIBUTION,
    knownLimitations: [
      "Small bounded extract, not full London coverage.",
      "Turn restrictions are only those explicitly present in OSM relation data."
    ]
  },
  {
    id: "quiet-residential-roads",
    fixtureName: "quietResidentialRoadsOverpass.json",
    label: "Quiet residential roads",
    source: "OpenStreetMap via Overpass export",
    importDate: "2026-07-03T00:14:43Z",
    areaPurpose: "Suburban learner-driver readability.",
    attribution: CURATED_LONDON_OSM_ATTRIBUTION,
    knownLimitations: [
      "Small bounded extract, not full London coverage.",
      "Rail/station context is not expected in this residential fixture."
    ]
  }
];

function emptyCoverage(): CuratedLondonFixtureCoverage {
  return {
    elementCount: 0,
    nodeCount: 0,
    wayCount: 0,
    relationCount: 0,
    roadClassCount: 0,
    namedRoadCount: 0,
    oneWayTaggedWayCount: 0,
    turnRestrictionRelationCount: 0,
    accessRestrictionTaggedWayCount: 0,
    bridgeTaggedWayCount: 0,
    tunnelTaggedWayCount: 0,
    railFeatureCount: 0,
    stationFeatureCount: 0,
    parkFeatureCount: 0,
    waterFeatureCount: 0,
    landmarkFeatureCount: 0,
    areaNameFeatureCount: 0,
    publicBuildingFeatureCount: 0,
    crossingFeatureCount: 0,
    trafficSignalFeatureCount: 0
  };
}

function emptyRenderSummary(): CuratedLondonRenderCategorySummary {
  return Object.fromEntries(
    CURATED_LONDON_RENDER_CATEGORIES.map((category) => [category, 0])
  ) as CuratedLondonRenderCategorySummary;
}

export function auditCuratedLondonOsmFixture(fixture: unknown): CuratedLondonFixtureCoverage {
  const elements = overpassElements(fixture);
  const coverage = emptyCoverage();

  coverage.elementCount = elements.length;

  for (const element of elements) {
    if (element.type === "node") {
      coverage.nodeCount += 1;
    } else if (element.type === "way") {
      coverage.wayCount += 1;
      applyWayCoverage(coverage, element.tags ?? {});
    } else if (element.type === "relation") {
      coverage.relationCount += 1;
      applyRelationCoverage(coverage, element.tags ?? {});
    }

    applySharedCoverage(coverage, element.tags ?? {});
  }

  return coverage;
}

export function summariseCuratedLondonRenderCategories(fixture: unknown): CuratedLondonRenderCategorySummary {
  const summary = emptyRenderSummary();

  for (const element of overpassElements(fixture)) {
    const tags = element.tags ?? {};

    if (element.type === "way") {
      for (const category of renderCategoriesForWay(tags)) {
        summary[category] += 1;
      }
    } else if (element.type === "node") {
      for (const category of renderCategoriesForNode(tags)) {
        summary[category] += 1;
      }
    } else if (element.type === "relation" && tagValue(tags, "type") === "restriction") {
      summary.restrictedTurn += 1;
    }
  }

  return summary;
}

export function summariseCuratedLondonHighwayClasses(fixture: unknown): CuratedLondonHighwayClassSummary {
  const summary = new Map<string, number>();

  for (const element of overpassElements(fixture)) {
    if (element.type !== "way") {
      continue;
    }

    const highway = tagValue(element.tags ?? {}, "highway");

    if (highway) {
      summary.set(highway, (summary.get(highway) ?? 0) + 1);
    }
  }

  return Object.fromEntries([...summary.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

export function auditCurrentRealLondonFixtureSet(fixtures: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(fixtures).map(([fixtureName, fixture]) => {
      const coverage = auditCuratedLondonOsmFixture(fixture);
      const contextCoverage = auditRealLondonContextCoverage(fixture).counts;

      return [
        fixtureName,
        {
          coverage,
          contextCoverage,
          renderCategories: summariseCuratedLondonRenderCategories(fixture)
        }
      ];
    })
  );
}

function applyWayCoverage(coverage: CuratedLondonFixtureCoverage, tags: OverpassTags): void {
  if (tagValue(tags, "highway")) {
    coverage.roadClassCount += 1;

    if (named(tags)) {
      coverage.namedRoadCount += 1;
    }

    if (tagValue(tags, "oneway")) {
      coverage.oneWayTaggedWayCount += 1;
    }

    if (hasAccessRestriction(tags)) {
      coverage.accessRestrictionTaggedWayCount += 1;
    }

    if (hasTruthyTag(tags, "bridge")) {
      coverage.bridgeTaggedWayCount += 1;
    }

    if (hasTruthyTag(tags, "tunnel")) {
      coverage.tunnelTaggedWayCount += 1;
    }
  }
}

function applyRelationCoverage(coverage: CuratedLondonFixtureCoverage, tags: OverpassTags): void {
  if (tagValue(tags, "type") === "restriction") {
    coverage.turnRestrictionRelationCount += 1;
  }
}

function applySharedCoverage(coverage: CuratedLondonFixtureCoverage, tags: OverpassTags): void {
  const railway = tagValue(tags, "railway");

  if (railway === "rail" || railway === "light_rail" || railway === "subway") {
    coverage.railFeatureCount += 1;
  }

  if (railway === "station" || tagValue(tags, "public_transport") === "station" || tagValue(tags, "station")) {
    coverage.stationFeatureCount += 1;
  }

  if (tagValue(tags, "leisure") === "park" || tagValue(tags, "leisure") === "garden" || tagValue(tags, "landuse") === "recreation_ground") {
    coverage.parkFeatureCount += 1;
  }

  if (tagValue(tags, "natural") === "water" || Boolean(tagValue(tags, "waterway"))) {
    coverage.waterFeatureCount += 1;
  }

  if (isLandmark(tags)) {
    coverage.landmarkFeatureCount += 1;
  }

  if (isAreaLabel(tags)) {
    coverage.areaNameFeatureCount += 1;
  }

  if (isPublicBuilding(tags)) {
    coverage.publicBuildingFeatureCount += 1;
  }

  if (tagValue(tags, "highway") === "crossing" || Boolean(tagValue(tags, "crossing"))) {
    coverage.crossingFeatureCount += 1;
  }

  if (tagValue(tags, "highway") === "traffic_signals") {
    coverage.trafficSignalFeatureCount += 1;
  }
}

function renderCategoriesForWay(tags: OverpassTags): CuratedLondonRenderCategory[] {
  const categories: CuratedLondonRenderCategory[] = [];
  const highway = tagValue(tags, "highway");

  if (highway === "primary" || highway === "primary_link") {
    categories.push("majorRoad");
  } else if (highway === "secondary" || highway === "secondary_link" || highway === "tertiary" || highway === "tertiary_link") {
    categories.push("secondaryRoad");
  } else if (highway === "residential" || highway === "unclassified" || highway === "living_street" || highway === "road") {
    categories.push("localRoad");
  } else if (highway === "service") {
    categories.push("serviceRoad");
  } else if (highway === "footway" || highway === "path" || highway === "cycleway" || highway === "pedestrian") {
    categories.push("nonDrivingPath");
  }

  if (hasTruthyTag(tags, "bridge")) {
    categories.push("bridgeRoad");
  }

  if (hasTruthyTag(tags, "tunnel")) {
    categories.push("tunnelRoad");
  }

  if (tagValue(tags, "oneway")) {
    categories.push("oneWaySegment");
  }

  if (tagValue(tags, "leisure") === "park" || tagValue(tags, "leisure") === "garden" || tagValue(tags, "landuse") === "recreation_ground") {
    categories.push("park");
  }

  if (tagValue(tags, "natural") === "water" || Boolean(tagValue(tags, "waterway"))) {
    categories.push("water");
  }

  if (tagValue(tags, "railway") === "rail" || tagValue(tags, "railway") === "light_rail" || tagValue(tags, "railway") === "subway") {
    categories.push("rail");
  }

  if (tagValue(tags, "railway") === "station" || tagValue(tags, "public_transport") === "station") {
    categories.push("station");
  }

  if (isLandmark(tags) || isPublicBuilding(tags)) {
    categories.push("landmark");
  }

  if (isAreaLabel(tags)) {
    categories.push("areaLabel");
  }

  return categories;
}

function renderCategoriesForNode(tags: OverpassTags): CuratedLondonRenderCategory[] {
  const categories: CuratedLondonRenderCategory[] = [];

  if (tagValue(tags, "railway") === "station" || tagValue(tags, "public_transport") === "station") {
    categories.push("station");
  }

  if (isLandmark(tags) || isPublicBuilding(tags)) {
    categories.push("landmark");
  }

  if (isAreaLabel(tags)) {
    categories.push("areaLabel");
  }

  if (tagValue(tags, "highway") === "crossing" || Boolean(tagValue(tags, "crossing"))) {
    categories.push("nonDrivingPath");
  }

  return categories;
}

function overpassElements(fixture: unknown): OverpassElement[] {
  if (!isOverpassJsonResponse(fixture)) {
    return [];
  }

  return fixture.elements;
}

function named(tags: OverpassTags): boolean {
  return Boolean(tags.name?.trim());
}

function hasAccessRestriction(tags: OverpassTags): boolean {
  return ["access", "motor_vehicle", "vehicle", "motorcar", "bus", "taxi", "cycleway"].some((key) => Boolean(tagValue(tags, key)));
}

function hasTruthyTag(tags: OverpassTags, key: string): boolean {
  const value = tagValue(tags, key);

  return Boolean(value) && value !== "no";
}

function isLandmark(tags: OverpassTags): boolean {
  return Boolean(tagValue(tags, "tourism")) || Boolean(tagValue(tags, "historic")) || tagValue(tags, "landmark") === "yes";
}

function isPublicBuilding(tags: OverpassTags): boolean {
  const amenity = tagValue(tags, "amenity");
  const building = tagValue(tags, "building");

  return (
    amenity === "school" ||
    amenity === "hospital" ||
    amenity === "place_of_worship" ||
    amenity === "library" ||
    amenity === "townhall" ||
    amenity === "courthouse" ||
    building === "public" ||
    building === "civic"
  );
}

function isAreaLabel(tags: OverpassTags): boolean {
  const place = tagValue(tags, "place");

  return Boolean(named(tags)) && (place === "neighbourhood" || place === "suburb" || place === "quarter" || place === "locality" || place === "square");
}

function tagValue(tags: OverpassTags, key: string): string {
  return tags[key]?.trim().toLowerCase() ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTagRecord(value: unknown): value is OverpassTags {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}

function isOverpassJsonResponse(value: unknown): value is OverpassJsonResponse {
  return isRecord(value) && Array.isArray(value.elements) && value.elements.every(isOverpassElement);
}

function isOverpassElement(value: unknown): value is OverpassElement {
  if (!isRecord(value) || typeof value.id !== "number" || typeof value.type !== "string") {
    return false;
  }

  if (value.tags !== undefined && !isTagRecord(value.tags)) {
    return false;
  }

  if (value.type === "node") {
    return typeof (value as OverpassNodeElement).lat === "number" && typeof (value as OverpassNodeElement).lon === "number";
  }

  if (value.type === "way") {
    return Array.isArray((value as OverpassWayElement).nodes);
  }

  if (value.type === "relation") {
    return Array.isArray((value as OverpassRelationElement).members) || (value as OverpassRelationElement).members === undefined;
  }

  return false;
}
