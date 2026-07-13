import { createRequire } from "node:module";
import type { MapDefinition } from "../../../lib/map-engine/index.ts";
import {
  convertOverpassJsonToRouteMap,
  parseOverpassRoadExtract,
  type OverpassElement,
  type OverpassElementId,
  type OverpassJsonResponse,
  type OverpassTags,
  type OverpassWayElement
} from "../../../lib/map-engine/osm/index.ts";
import {
  buildRealLondonContextFeatures,
  type RealLondonContextFeature,
  type RealLondonContextFeatureKind
} from "./realLondonContextData.ts";
import {
  CURATED_LONDON_OSM_TAG_WHITELIST,
  CURATED_REAL_LONDON_OVERPASS_FIXTURES
} from "./curatedLondonOsmEnrichment.ts";
import {
  CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS,
  ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON
} from "./curatedRealLondonRouteRunnerMaps.ts";
import {
  atlasSymbolKindForVisual,
  buildSyntheticBackgroundFeatures,
  buildSyntheticLandmarkVisuals,
  buildSyntheticLinearFeatures,
  buildSyntheticMapLabels
} from "./syntheticStreetMapRenderer.ts";
import { ROUTE_RUNNER_MAP_OPTIONS, type RouteRunnerMapOption } from "./routeRunnerMaps.ts";

export type Phase8PipelineStage =
  | "sourceCoverage"
  | "retainedImportCoverage"
  | "routeGraphCoverage"
  | "contextAdapterCoverage"
  | "rendererConsumedCoverage"
  | "unsupportedOrDiscardedCoverage"
  | "sourceAbsence"
  | "manualUnverified";

export type Phase8CoverageState =
  | "source-absent"
  | "source-present-retained"
  | "source-present-not-whitelisted"
  | "source-present-geometry-discarded"
  | "route-metadata-only"
  | "point-landmark-only"
  | "context-ready-no-renderer-consumer"
  | "renderer-supported-no-source"
  | "render-ready"
  | "manual-unverified";

export type Phase8AuditCategoryId =
  | "road-network"
  | "road-references"
  | "buildings-built-fabric"
  | "land-use-institutions"
  | "places-area-labels"
  | "parks-open-space"
  | "water-river-context"
  | "rail-transport"
  | "landmarks-public-facilities";

export type Phase8FixtureClassification = "real-osm" | "synthetic-control";

export type Phase8ReferenceClass = "a-road" | "b-road" | "other";

export type Phase8EvidenceSample = {
  elementType: "node" | "way" | "relation" | "road";
  elementId: string;
  tags: Record<string, string>;
};

export type Phase8PipelineCategoryAudit = {
  id: Phase8AuditCategoryId;
  label: string;
  stage: Phase8PipelineStage;
  state: Phase8CoverageState;
  sourceCount: number;
  retainedCount: number;
  routeGraphCount: number;
  contextAdapterCount: number;
  rendererConsumedCount: number;
  blockerCount: number;
  notes: string[];
  evidence: Phase8EvidenceSample[];
};

export type Phase8ElementTotals = {
  elements: number;
  nodes: number;
  ways: number;
  relations: number;
};

export type Phase8SourceCoverageCounts = {
  highwayClasses: Record<string, number>;
  drivableMajorRoadWays: number;
  secondaryAndTertiaryRoadWays: number;
  residentialAndUnclassifiedRoadWays: number;
  serviceRoadWays: number;
  pedestrianPathCycleWays: number;
  namedRoadWays: number;
  unnamedRoadWays: number;
  oneWayTaggedWays: number;
  bridgeTaggedWays: number;
  tunnelTaggedWays: number;
  turnRestrictionRelations: number;
  accessRestrictionWays: number;
  sourceRoadRefWays: number;
  aRoadRefWays: number;
  bRoadRefWays: number;
  otherRoadRefWays: number;
  buildingTaggedWays: number;
  buildingTaggedRelations: number;
  usableClosedBuildingPolygons: number;
  namedBuildings: number;
  publicOrCivicBuildings: number;
  residentialLanduseFeatures: number;
  retailCommercialLanduseFeatures: number;
  industrialLanduseFeatures: number;
  civicInstitutionalSourceFeatures: number;
  schools: number;
  hospitals: number;
  placesOfWorship: number;
  libraries: number;
  townHalls: number;
  courthouses: number;
  otherRecognisedPublicBuildings: number;
  polygonCapableInstitutionalFeatures: number;
  neighbourhoods: number;
  suburbs: number;
  quarters: number;
  localities: number;
  squares: number;
  namedResidentialAreas: number;
  explicitEstateFeatures: number;
  ambiguousEstateCandidates: number;
  parks: number;
  gardens: number;
  recreationGrounds: number;
  otherOpenSpaces: number;
  namedOpenSpaces: number;
  unnamedOpenSpaces: number;
  waterPolygons: number;
  waterways: number;
  namedWaterFeatures: number;
  waterMultipolygonRelations: number;
  bridgesInWaterFixtures: number;
  pierLikeSourceFeatures: number;
  railWays: number;
  lightRailWays: number;
  subwayWays: number;
  railwayStations: number;
  publicTransportStations: number;
  namedStations: number;
  tourismFeatures: number;
  historicFeatures: number;
  marketOrShoppingFeatures: number;
  museumsAndGalleries: number;
  namedLandmarkCandidates: number;
  unnamedLandmarkCandidates: number;
};

export type Phase8RouteGraphCoverageCounts = {
  importedRoadWays: number;
  convertedRoadSegments: number;
  roadsWithRawRefTags: number;
  displayedRoadReferences: number;
  rawTaggedRoadSegments: number;
  ignoredRelations: number;
  blockedOsmWays: number;
};

export type Phase8ContextAdapterCoverageCounts = {
  totalFeatures: number;
  byKind: Record<RealLondonContextFeatureKind, number>;
  buildingSourcedPointLandmarks: number;
  institutionalPointLandmarks: number;
  institutionalPolygons: number;
  generalBuildingPolygons: number;
  landUsePolygons: number;
  pierFeatures: number;
  roadReferenceFeatures: number;
};

export type Phase8RendererConsumedCoverageCounts = {
  backgroundFeatures: Record<string, number>;
  linearFeatures: Record<string, number>;
  landmarkVisuals: Record<string, number>;
  labels: Record<string, number>;
  displayedRoadReferences: number;
  generalBuildingPolygons: number;
  institutionalPolygons: number;
  landUsePolygons: number;
  piers: number;
};

export type Phase8UnsupportedCoverageCounts = {
  sourceBuildingsDiscardedByRouteConversion: number;
  sourceBuildingsUsedOnlyAsPointLandmarks: number;
  sourceBuildingPolygonsWithoutRendererPath: number;
  institutionalPolygonsWithoutAdapter: number;
  landUsePolygonsWithoutAdapter: number;
  roadRefsMetadataOnly: number;
  pierLikeFeaturesMissingWhitelistOrAdapter: number;
  publicTransportStationsWithoutCurrentAdapter: number;
  missingWhitelistTags: Record<string, number>;
};

export type Phase8FixtureAuditReport = {
  fixtureName: string;
  mapId: string;
  label: string;
  purpose: string;
  classification: Phase8FixtureClassification;
  includedInRealGeographyAggregate: boolean;
  attribution: string;
  attributionStatus: "osm-attributed" | "synthetic-attributed" | "missing";
  fixtureUse: string;
  performanceGate: string;
  visibleInBeta: boolean;
  scoreable: boolean;
  elementTotals: Phase8ElementTotals;
  sourceCoverage: Phase8SourceCoverageCounts;
  routeGraphCoverage: Phase8RouteGraphCoverageCounts;
  contextAdapterCoverage: Phase8ContextAdapterCoverageCounts;
  rendererConsumedCoverage: Phase8RendererConsumedCoverageCounts;
  unsupportedCoverage: Phase8UnsupportedCoverageCounts;
  categoryAudits: Phase8PipelineCategoryAudit[];
  sourceAbsences: string[];
  stage83Requirements: string[];
};

export type Phase8AggregateAuditReport = {
  realFixtureCount: number;
  syntheticControlCount: number;
  auditedFixtureNames: string[];
  excludedSyntheticControls: string[];
  totals: {
    sourceRoadRefWays: number;
    routeGraphRefRoadSegments: number;
    displayedRoadReferences: number;
    usableClosedBuildingPolygons: number;
    generalBuildingPolygonsRendered: number;
    institutionalSourceFeatures: number;
    institutionalPolygonsRendered: number;
    landUseSourceFeatures: number;
    landUsePolygonsRendered: number;
    contextFeatures: number;
    rendererBackgroundFeatures: number;
    rendererLinearFeatures: number;
    rendererLandmarkVisuals: number;
    rendererLabels: number;
    pierLikeSourceFeatures: number;
    pierRendererFeatures: number;
  };
  conclusions: string[];
  stage83Requirements: string[];
};

export type Phase8GeographicRenderDataAuditReport = {
  reportVersion: "phase-8.2";
  generatedFrom: "committed-fixtures-current-code";
  fixtureReports: Phase8FixtureAuditReport[];
  aggregate: Phase8AggregateAuditReport;
};

type Phase8AuditFixtureInput = {
  option: RouteRunnerMapOption;
  classification: Phase8FixtureClassification;
  includeInRealAggregate: boolean;
};

export type Phase8AuditOptions = {
  includeStressFixtureSource?: boolean;
  includeLazyFixtureConversion?: boolean;
};

const CATEGORY_ORDER: Phase8AuditCategoryId[] = [
  "road-network",
  "road-references",
  "buildings-built-fabric",
  "land-use-institutions",
  "places-area-labels",
  "parks-open-space",
  "water-river-context",
  "rail-transport",
  "landmarks-public-facilities"
];

const CATEGORY_LABELS: Record<Phase8AuditCategoryId, string> = {
  "road-network": "Road network",
  "road-references": "Road references",
  "buildings-built-fabric": "Buildings and built-up fabric",
  "land-use-institutions": "Land use and institutional geography",
  "places-area-labels": "Places and area labels",
  "parks-open-space": "Parks and open space",
  "water-river-context": "Water and river context",
  "rail-transport": "Rail and transport",
  "landmarks-public-facilities": "Landmarks and public facilities"
};

const REAL_CURATED_FIXTURE_NAMES = new Set(CURATED_REAL_LONDON_OVERPASS_FIXTURES.map((fixture) => fixture.fixtureName));
const MAX_EVIDENCE_SAMPLES = 4;
const WHITELIST = new Set<string>(CURATED_LONDON_OSM_TAG_WHITELIST);
const requireJson = createRequire(import.meta.url);
const FUTURE_ATLAS_TAGS_REQUIRING_WHITELIST = [
  "addr:housename",
  "addr:housenumber",
  "addr:street",
  "government",
  "healthcare",
  "man_made",
  "office",
  "operator",
  "operator:type",
  "residential",
  "shop",
  "wikidata",
  "wikipedia"
];

export function classifyPhase8RoadReferenceValue(value: string): Phase8ReferenceClass {
  const tokens = value
    .split(/[;,]/)
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean);

  if (tokens.length === 0) {
    return "other";
  }

  if (tokens.some((token) => /^A\d{1,4}[A-Z]?(?:\([A-Z0-9]+\))?$/.test(token))) {
    return "a-road";
  }

  if (tokens.some((token) => /^B\d{1,4}[A-Z]?$/.test(token))) {
    return "b-road";
  }

  return "other";
}

export function buildPhase8GeographicRenderDataAuditReport(
  options: Phase8AuditOptions = {}
): Phase8GeographicRenderDataAuditReport {
  const fixtureReports = phase8AuditFixtures(options).map(auditFixture).sort(compareFixtureReports);

  return {
    reportVersion: "phase-8.2",
    generatedFrom: "committed-fixtures-current-code",
    fixtureReports,
    aggregate: buildAggregateReport(fixtureReports)
  };
}

export function formatPhase8GeographicRenderDataAuditSummary(
  report: Phase8GeographicRenderDataAuditReport = buildPhase8GeographicRenderDataAuditReport()
): string {
  const lines = [
    "Phase 8.2 geographic/render-data audit",
    `Real OSM fixtures audited: ${report.aggregate.realFixtureCount}`,
    `Synthetic controls excluded from real aggregate: ${report.aggregate.syntheticControlCount}`,
    `Fixtures: ${report.aggregate.auditedFixtureNames.join(", ")}`,
    "",
    "Aggregate findings:",
    `- Source road-ref ways: ${report.aggregate.totals.sourceRoadRefWays}; displayed road refs: ${report.aggregate.totals.displayedRoadReferences}`,
    `- Usable source building polygons: ${report.aggregate.totals.usableClosedBuildingPolygons}; rendered building polygons: ${report.aggregate.totals.generalBuildingPolygonsRendered}`,
    `- Institutional source features: ${report.aggregate.totals.institutionalSourceFeatures}; rendered institutional polygons: ${report.aggregate.totals.institutionalPolygonsRendered}`,
    `- Land-use source features: ${report.aggregate.totals.landUseSourceFeatures}; rendered land-use polygons: ${report.aggregate.totals.landUsePolygonsRendered}`,
    `- Context adapter features: ${report.aggregate.totals.contextFeatures}; renderer labels: ${report.aggregate.totals.rendererLabels}`,
    "",
    "Stage 8.3 handoff:",
    ...report.aggregate.stage83Requirements.map((requirement) => `- ${requirement}`)
  ];

  return lines.join("\n");
}

export function getPhase8AuditRealFixtureNames(): string[] {
  return phase8AuditFixtures({ includeStressFixtureSource: false })
    .filter((fixture) => fixture.includeInRealAggregate)
    .map((fixture) => fixture.option.fixtureName ?? fixture.option.id)
    .sort((left, right) => left.localeCompare(right));
}

function phase8AuditFixtures(options: Phase8AuditOptions): Phase8AuditFixtureInput[] {
  const byFixtureName = new Map<string, RouteRunnerMapOption>();
  const allOptions = [
    ...ROUTE_RUNNER_MAP_OPTIONS,
    ...ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON,
    ...CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS
  ];

  for (const option of allOptions) {
    if (option.source !== "converted-osm" || !option.fixtureName) {
      continue;
    }

    const hydratedOption = hydrateStressFixtureOption(option, options);
    const current = byFixtureName.get(option.fixtureName);
    if (!current || (!current.sourceOverpassFixture && hydratedOption.sourceOverpassFixture)) {
      byFixtureName.set(option.fixtureName, hydratedOption);
    }
  }

  return [...byFixtureName.values()]
    .map((option) => {
      const classification = classifyFixture(option);
      return {
        option,
        classification,
        includeInRealAggregate: classification === "real-osm"
      };
    })
    .sort((left, right) => {
      const realOrder = Number(right.includeInRealAggregate) - Number(left.includeInRealAggregate);
      return realOrder || String(left.option.fixtureName).localeCompare(String(right.option.fixtureName));
    });
}

function hydrateStressFixtureOption(option: RouteRunnerMapOption, options: Phase8AuditOptions): RouteRunnerMapOption {
  if (option.fixtureName === "kingsCrossEustonOverpass.json" && !option.sourceOverpassFixture) {
    const sourceOverpassFixture = loadKingsCrossEustonOverpassFixture();
    const baseOption = {
      ...option,
      sourceOverpassFixture
    };

    if (options.includeLazyFixtureConversion === false) {
      return baseOption;
    }

    const converted = convertOverpassJsonToRouteMap(sourceOverpassFixture, {
      mapId: option.map.id,
      name: option.map.name,
      description: option.map.description,
      version: 1
    });

    if (!converted.ok) {
      return baseOption;
    }

    return {
      ...baseOption,
      map: converted.map
    };
  }

  if (
    option.fixtureName === "centralLondonOverpass.json" &&
    !option.sourceOverpassFixture &&
    options.includeStressFixtureSource !== false
  ) {
    return {
      ...option,
      sourceOverpassFixture: loadCentralLondonOverpassFixture()
    };
  }

  if (option.fixtureName === "victoriaWestminsterVauxhallOverpass.json" && !option.sourceOverpassFixture) {
    const sourceOverpassFixture = loadVictoriaWestminsterVauxhallOverpassFixture();
    const baseOption = {
      ...option,
      sourceOverpassFixture
    };

    if (options.includeLazyFixtureConversion === false) {
      return baseOption;
    }

    const converted = convertOverpassJsonToRouteMap(sourceOverpassFixture, {
      mapId: option.map.id,
      name: option.map.name,
      description: option.map.description,
      version: 1
    });

    if (!converted.ok) {
      return baseOption;
    }

    return {
      ...baseOption,
      map: converted.map
    };
  }

  return option;
}

function loadCentralLondonOverpassFixture(): OverpassJsonResponse {
  return requireJson("../../../lib/map-engine/osm/fixtures/centralLondonOverpass.json") as OverpassJsonResponse;
}

function loadKingsCrossEustonOverpassFixture(): OverpassJsonResponse {
  return requireJson("../../../lib/map-engine/osm/fixtures/kingsCrossEustonOverpass.json") as OverpassJsonResponse;
}

function loadVictoriaWestminsterVauxhallOverpassFixture(): OverpassJsonResponse {
  return requireJson("../../../lib/map-engine/osm/fixtures/victoriaWestminsterVauxhallOverpass.json") as OverpassJsonResponse;
}

function classifyFixture(option: RouteRunnerMapOption): Phase8FixtureClassification {
  if (option.fixtureName && REAL_CURATED_FIXTURE_NAMES.has(option.fixtureName)) {
    return "real-osm";
  }

  const generator = overpassGenerator(option.sourceOverpassFixture);
  if (option.fixtureName === "realLondonPilotOverpass.json" && /overpass api/i.test(generator)) {
    return "real-osm";
  }

  return "synthetic-control";
}

function auditFixture(input: Phase8AuditFixtureInput): Phase8FixtureAuditReport {
  const { option, classification, includeInRealAggregate } = input;
  const fixture = option.sourceOverpassFixture;
  const elements = overpassElements(fixture);
  const sourceCoverage = countSourceCoverage(elements);
  const routeGraphCoverage = countRouteGraphCoverage(option, fixture);
  const contextFeatures = buildContextFeatures(option.map, fixture);
  const contextAdapterCoverage = countContextAdapterCoverage(contextFeatures);
  const rendererConsumedCoverage = countRendererConsumedCoverage(option, fixture);
  const unsupportedCoverage = countUnsupportedCoverage(elements, routeGraphCoverage, contextFeatures);
  const categoryAudits = buildCategoryAudits({
    sourceCoverage,
    routeGraphCoverage,
    contextAdapterCoverage,
    rendererConsumedCoverage,
    unsupportedCoverage,
    elements
  });

  return {
    fixtureName: option.fixtureName ?? option.id,
    mapId: option.map.id,
    label: option.label,
    purpose: option.description,
    classification,
    includedInRealGeographyAggregate: includeInRealAggregate,
    attribution: option.attribution ?? "",
    attributionStatus: attributionStatus(option, classification),
    fixtureUse: option.fixtureUse ?? "unspecified",
    performanceGate: option.fixturePerformanceGate ?? "unspecified",
    visibleInBeta: option.visibleInBeta === true,
    scoreable: option.scoreable !== false,
    elementTotals: countElementTotals(elements),
    sourceCoverage,
    routeGraphCoverage,
    contextAdapterCoverage,
    rendererConsumedCoverage,
    unsupportedCoverage,
    categoryAudits,
    sourceAbsences: sourceAbsences(sourceCoverage),
    stage83Requirements: stage83RequirementsForFixture(
      sourceCoverage,
      routeGraphCoverage,
      contextAdapterCoverage,
      unsupportedCoverage
    )
  };
}

function countSourceCoverage(elements: readonly OverpassElement[]): Phase8SourceCoverageCounts {
  const counts = emptySourceCoverage();

  for (const element of elements) {
    const tags = element.tags ?? {};

    if (element.type === "way") {
      applyWaySourceCounts(counts, element, tags);
    } else if (element.type === "relation") {
      applyRelationSourceCounts(counts, tags);
    }

    applySharedSourceCounts(counts, element, tags);
  }

  counts.bridgesInWaterFixtures = counts.waterPolygons + counts.waterways + counts.waterMultipolygonRelations > 0
    ? counts.bridgeTaggedWays
    : 0;

  counts.highwayClasses = sortedRecord(counts.highwayClasses);

  return counts;
}

function emptySourceCoverage(): Phase8SourceCoverageCounts {
  return {
    highwayClasses: {},
    drivableMajorRoadWays: 0,
    secondaryAndTertiaryRoadWays: 0,
    residentialAndUnclassifiedRoadWays: 0,
    serviceRoadWays: 0,
    pedestrianPathCycleWays: 0,
    namedRoadWays: 0,
    unnamedRoadWays: 0,
    oneWayTaggedWays: 0,
    bridgeTaggedWays: 0,
    tunnelTaggedWays: 0,
    turnRestrictionRelations: 0,
    accessRestrictionWays: 0,
    sourceRoadRefWays: 0,
    aRoadRefWays: 0,
    bRoadRefWays: 0,
    otherRoadRefWays: 0,
    buildingTaggedWays: 0,
    buildingTaggedRelations: 0,
    usableClosedBuildingPolygons: 0,
    namedBuildings: 0,
    publicOrCivicBuildings: 0,
    residentialLanduseFeatures: 0,
    retailCommercialLanduseFeatures: 0,
    industrialLanduseFeatures: 0,
    civicInstitutionalSourceFeatures: 0,
    schools: 0,
    hospitals: 0,
    placesOfWorship: 0,
    libraries: 0,
    townHalls: 0,
    courthouses: 0,
    otherRecognisedPublicBuildings: 0,
    polygonCapableInstitutionalFeatures: 0,
    neighbourhoods: 0,
    suburbs: 0,
    quarters: 0,
    localities: 0,
    squares: 0,
    namedResidentialAreas: 0,
    explicitEstateFeatures: 0,
    ambiguousEstateCandidates: 0,
    parks: 0,
    gardens: 0,
    recreationGrounds: 0,
    otherOpenSpaces: 0,
    namedOpenSpaces: 0,
    unnamedOpenSpaces: 0,
    waterPolygons: 0,
    waterways: 0,
    namedWaterFeatures: 0,
    waterMultipolygonRelations: 0,
    bridgesInWaterFixtures: 0,
    pierLikeSourceFeatures: 0,
    railWays: 0,
    lightRailWays: 0,
    subwayWays: 0,
    railwayStations: 0,
    publicTransportStations: 0,
    namedStations: 0,
    tourismFeatures: 0,
    historicFeatures: 0,
    marketOrShoppingFeatures: 0,
    museumsAndGalleries: 0,
    namedLandmarkCandidates: 0,
    unnamedLandmarkCandidates: 0
  };
}

function applyWaySourceCounts(
  counts: Phase8SourceCoverageCounts,
  way: OverpassWayElement,
  tags: OverpassTags
): void {
  const highway = tagValue(tags, "highway");
  const ref = tags.ref?.trim();

  if (highway) {
    increment(counts.highwayClasses, highway);

    if (highway === "primary" || highway === "primary_link" || highway === "trunk" || highway === "trunk_link") {
      counts.drivableMajorRoadWays += 1;
    } else if (["secondary", "secondary_link", "tertiary", "tertiary_link"].includes(highway)) {
      counts.secondaryAndTertiaryRoadWays += 1;
    } else if (["residential", "unclassified", "living_street", "road"].includes(highway)) {
      counts.residentialAndUnclassifiedRoadWays += 1;
    } else if (highway === "service") {
      counts.serviceRoadWays += 1;
    } else if (["pedestrian", "footway", "path", "cycleway"].includes(highway)) {
      counts.pedestrianPathCycleWays += 1;
    }

    if (named(tags)) {
      counts.namedRoadWays += 1;
    } else {
      counts.unnamedRoadWays += 1;
    }

    if (tagValue(tags, "oneway")) {
      counts.oneWayTaggedWays += 1;
    }

    if (hasAccessRestriction(tags)) {
      counts.accessRestrictionWays += 1;
    }

    if (ref) {
      counts.sourceRoadRefWays += 1;
      const referenceClass = classifyPhase8RoadReferenceValue(ref);

      if (referenceClass === "a-road") {
        counts.aRoadRefWays += 1;
      } else if (referenceClass === "b-road") {
        counts.bRoadRefWays += 1;
      } else {
        counts.otherRoadRefWays += 1;
      }
    }
  }

  if (hasTruthyTag(tags, "bridge")) {
    counts.bridgeTaggedWays += 1;
  }

  if (hasTruthyTag(tags, "tunnel")) {
    counts.tunnelTaggedWays += 1;
  }

  if (tagValue(tags, "building")) {
    counts.buildingTaggedWays += 1;

    if (isClosedWay(way)) {
      counts.usableClosedBuildingPolygons += 1;
    }

    if (named(tags)) {
      counts.namedBuildings += 1;
    }
  }
}

function applyRelationSourceCounts(counts: Phase8SourceCoverageCounts, tags: OverpassTags): void {
  if (tagValue(tags, "type") === "restriction") {
    counts.turnRestrictionRelations += 1;
  }

  if (tagValue(tags, "building")) {
    counts.buildingTaggedRelations += 1;
  }

  if (tagValue(tags, "type") === "multipolygon" && waterSource(tags)) {
    counts.waterMultipolygonRelations += 1;
  }
}

function applySharedSourceCounts(
  counts: Phase8SourceCoverageCounts,
  element: OverpassElement,
  tags: OverpassTags
): void {
  const amenity = tagValue(tags, "amenity");
  const building = tagValue(tags, "building");
  const landuse = tagValue(tags, "landuse");
  const leisure = tagValue(tags, "leisure");
  const railway = tagValue(tags, "railway");
  const place = tagValue(tags, "place");

  if (building === "public" || building === "civic" || recognisedInstitutionAmenity(amenity)) {
    counts.publicOrCivicBuildings += 1;
  }

  if (landuse === "residential") {
    counts.residentialLanduseFeatures += 1;

    if (named(tags)) {
      counts.namedResidentialAreas += 1;
      counts.ambiguousEstateCandidates += 1;
    }
  }

  if (landuse === "retail" || landuse === "commercial") {
    counts.retailCommercialLanduseFeatures += 1;
  }

  if (landuse === "industrial") {
    counts.industrialLanduseFeatures += 1;
  }

  if (recognisedInstitutionAmenity(amenity) || building === "public" || building === "civic" || tagValue(tags, "office") === "government") {
    counts.civicInstitutionalSourceFeatures += 1;

    if (element.type === "relation" || (element.type === "way" && isClosedWay(element))) {
      counts.polygonCapableInstitutionalFeatures += 1;
    }
  }

  if (amenity === "school" || amenity === "university" || amenity === "college") {
    counts.schools += 1;
  } else if (amenity === "hospital") {
    counts.hospitals += 1;
  } else if (amenity === "place_of_worship") {
    counts.placesOfWorship += 1;
  } else if (amenity === "library") {
    counts.libraries += 1;
  } else if (amenity === "townhall") {
    counts.townHalls += 1;
  } else if (amenity === "courthouse") {
    counts.courthouses += 1;
  } else if (["police", "fire_station"].includes(amenity) || building === "public" || building === "civic") {
    counts.otherRecognisedPublicBuildings += 1;
  }

  if (place === "neighbourhood") {
    counts.neighbourhoods += 1;
  } else if (place === "suburb") {
    counts.suburbs += 1;
  } else if (place === "quarter") {
    counts.quarters += 1;
  } else if (place === "locality") {
    counts.localities += 1;
  } else if (place === "square") {
    counts.squares += 1;
  } else if (place === "estate") {
    counts.explicitEstateFeatures += 1;
  }

  if (tagValue(tags, "residential").includes("estate") || tagValue(tags, "housing").includes("estate")) {
    counts.explicitEstateFeatures += 1;
  }

  if (leisure === "park") {
    counts.parks += 1;
  } else if (leisure === "garden") {
    counts.gardens += 1;
  } else if (leisure === "recreation_ground" || landuse === "recreation_ground") {
    counts.recreationGrounds += 1;
  } else if (["grass", "village_green", "meadow", "forest"].includes(landuse) || ["wood", "grassland"].includes(tagValue(tags, "natural"))) {
    counts.otherOpenSpaces += 1;
  }

  if (openSpaceSource(tags)) {
    if (named(tags)) {
      counts.namedOpenSpaces += 1;
    } else {
      counts.unnamedOpenSpaces += 1;
    }
  }

  if ((element.type === "way" || element.type === "relation") && waterSource(tags) && !tagValue(tags, "waterway")) {
    counts.waterPolygons += 1;
  }

  if (tagValue(tags, "waterway")) {
    counts.waterways += 1;
  }

  if (waterSource(tags) && named(tags)) {
    counts.namedWaterFeatures += 1;
  }

  if (pierLikeSource(tags)) {
    counts.pierLikeSourceFeatures += 1;
  }

  if (railway === "rail") {
    counts.railWays += 1;
  } else if (railway === "light_rail") {
    counts.lightRailWays += 1;
  } else if (railway === "subway") {
    counts.subwayWays += 1;
  } else if (railway === "station") {
    counts.railwayStations += 1;
  }

  if (tagValue(tags, "public_transport") === "station") {
    counts.publicTransportStations += 1;
  }

  if ((railway === "station" || tagValue(tags, "public_transport") === "station") && named(tags)) {
    counts.namedStations += 1;
  }

  if (tagValue(tags, "tourism")) {
    counts.tourismFeatures += 1;
  }

  if (tagValue(tags, "historic")) {
    counts.historicFeatures += 1;
  }

  if (amenity === "marketplace" || tagValue(tags, "shop") === "mall") {
    counts.marketOrShoppingFeatures += 1;
  }

  if (tagValue(tags, "tourism") === "museum" || tagValue(tags, "tourism") === "gallery") {
    counts.museumsAndGalleries += 1;
  }

  if (landmarkSource(tags)) {
    if (named(tags)) {
      counts.namedLandmarkCandidates += 1;
    } else {
      counts.unnamedLandmarkCandidates += 1;
    }
  }
}

function countRouteGraphCoverage(option: RouteRunnerMapOption, fixture: unknown): Phase8RouteGraphCoverageCounts {
  const imported = parseOverpassRoadExtract(fixture);
  const metadata = CURATED_REAL_LONDON_OVERPASS_FIXTURES.find((fixtureMetadata) => fixtureMetadata.fixtureName === option.fixtureName);

  if (option.fixturePerformanceGate === "devOnlyStressTest" || isUnconvertedLazyPlaceholder(option)) {
    const convertedRoadSegments = metadata?.fixtureBudget.roadSegments ?? 0;

    return {
      importedRoadWays: imported.roads.length,
      convertedRoadSegments,
      roadsWithRawRefTags: imported.roads.filter((road) => Boolean(road.rawTags.ref?.trim())).length,
      displayedRoadReferences: 0,
      rawTaggedRoadSegments: convertedRoadSegments,
      ignoredRelations: imported.ignoredRelationIds.length,
      blockedOsmWays: imported.excludedWays.filter((way) => way.reason === "blocked_access").length
    };
  }

  const roadRefWayIds = new Set<OverpassElementId>();
  const rawTaggedRoadSegments = option.map.roads.filter((road) => {
    const rawTags = (road as { metadata?: { rawTags?: OverpassTags; osmWayId?: OverpassElementId } }).metadata?.rawTags;
    return rawTags && Object.keys(rawTags).length > 0;
  });

  for (const road of option.map.roads) {
    const metadata = (road as { metadata?: { rawTags?: OverpassTags; osmWayId?: OverpassElementId } }).metadata;
    if (metadata?.rawTags?.ref && metadata.osmWayId !== undefined) {
      roadRefWayIds.add(metadata.osmWayId);
    }
  }

  return {
    importedRoadWays: imported.roads.length,
    convertedRoadSegments: option.map.roads.length,
    roadsWithRawRefTags: roadRefWayIds.size,
    displayedRoadReferences: 0,
    rawTaggedRoadSegments: rawTaggedRoadSegments.length,
    ignoredRelations: imported.ignoredRelationIds.length,
    blockedOsmWays: imported.excludedWays.filter((way) => way.reason === "blocked_access").length
  };
}

function buildContextFeatures(map: MapDefinition, fixture: unknown): RealLondonContextFeature[] {
  return buildRealLondonContextFeatures(map, fixture);
}

function countContextAdapterCoverage(features: readonly RealLondonContextFeature[]): Phase8ContextAdapterCoverageCounts {
  const byKind = sortedRecord(countBy(features, (feature) => feature.kind)) as Record<RealLondonContextFeatureKind, number>;

  return {
    totalFeatures: features.length,
    byKind,
    buildingSourcedPointLandmarks: features.filter(
      (feature) => feature.kind === "landmark" && Boolean(feature.sourceTags?.building)
    ).length,
    institutionalPointLandmarks: features.filter((feature) => feature.kind === "landmark" && isInstitutionalSource(feature.sourceTags ?? {})).length,
    institutionalPolygons: features.filter((feature) => feature.kind === "institution").length,
    generalBuildingPolygons: features.filter((feature) => feature.kind === "building").length,
    landUsePolygons: features.filter((feature) => feature.kind === "land-use").length,
    pierFeatures: features.filter((feature) => feature.kind === "landmark" && feature.symbolKind === "pier").length,
    roadReferenceFeatures: features.filter((feature) => feature.kind === "road-reference").length
  };
}

function countRendererConsumedCoverage(option: RouteRunnerMapOption, fixture: unknown): Phase8RendererConsumedCoverageCounts {
  if (option.fixturePerformanceGate === "devOnlyStressTest" || isUnconvertedLazyPlaceholder(option)) {
    return emptyRendererConsumedCoverage();
  }

  const map = option.map;
  const sourceOverpassFixture = fixture;
  const background = buildSyntheticBackgroundFeatures(map, { sourceOverpassFixture });
  const linear = buildSyntheticLinearFeatures(map, { sourceOverpassFixture });
  const landmarks = buildSyntheticLandmarkVisuals(map, undefined, { sourceOverpassFixture });
  const labels = buildSyntheticMapLabels(map, undefined, { sourceOverpassFixture });

  return {
    backgroundFeatures: sortedRecord(countBy(background, (feature) => feature.kind)),
    linearFeatures: sortedRecord(countBy(linear, (feature) => feature.kind)),
    landmarkVisuals: sortedRecord(countBy(landmarks, atlasSymbolKindForVisual)),
    labels: sortedRecord(countBy(labels, (label) => label.kind)),
    displayedRoadReferences: labels.filter((label) => label.kind === "road_reference").length,
    generalBuildingPolygons: background.filter((feature) => feature.kind === "building").length,
    institutionalPolygons: background.filter((feature) => feature.kind === "institution").length,
    landUsePolygons: background.filter((feature) => feature.kind === "land-use").length,
    piers: landmarks.filter((feature) => atlasSymbolKindForVisual(feature) === "pier").length
  };
}

function isUnconvertedLazyPlaceholder(option: RouteRunnerMapOption): boolean {
  return Boolean(option.lazyLoadId) && option.map.mapVersion?.startsWith("lazy-placeholder") === true;
}

function emptyRendererConsumedCoverage(): Phase8RendererConsumedCoverageCounts {
  return {
    backgroundFeatures: {},
    linearFeatures: {},
    landmarkVisuals: {},
    labels: {},
    displayedRoadReferences: 0,
    generalBuildingPolygons: 0,
    institutionalPolygons: 0,
    landUsePolygons: 0,
    piers: 0
  };
}

function countUnsupportedCoverage(
  elements: readonly OverpassElement[],
  routeGraphCoverage: Phase8RouteGraphCoverageCounts,
  contextFeatures: readonly RealLondonContextFeature[]
): Phase8UnsupportedCoverageCounts {
  const source = countSourceCoverage(elements);
  const adaptedPierIds = new Set(
    contextFeatures
      .filter((feature) => feature.kind === "landmark" && feature.symbolKind === "pier")
      .map((feature) => `${feature.sourceElementType}:${feature.sourceElementId}`)
  );
  const adaptedPublicTransportStationCount = contextFeatures.filter(
    (feature) => feature.kind === "station" && feature.sourceTags?.public_transport === "station"
  ).length;

  return {
    sourceBuildingsDiscardedByRouteConversion: source.buildingTaggedWays + source.buildingTaggedRelations,
    sourceBuildingsUsedOnlyAsPointLandmarks: contextFeatures.filter(
      (feature) => feature.kind === "landmark" && Boolean(feature.sourceTags?.building)
    ).length,
    sourceBuildingPolygonsWithoutRendererPath: Math.max(
      0,
      source.usableClosedBuildingPolygons - contextFeatures.filter((feature) => feature.kind === "building").length
    ),
    institutionalPolygonsWithoutAdapter: Math.max(
      0,
      source.polygonCapableInstitutionalFeatures - contextFeatures.filter((feature) => feature.kind === "institution").length
    ),
    landUsePolygonsWithoutAdapter: Math.max(
      0,
      source.residentialLanduseFeatures +
        source.retailCommercialLanduseFeatures +
        source.industrialLanduseFeatures -
        contextFeatures.filter((feature) => feature.kind === "land-use").length
    ),
    roadRefsMetadataOnly: Math.max(
      0,
      routeGraphCoverage.roadsWithRawRefTags -
        new Set(
          contextFeatures
            .filter((feature) => feature.kind === "road-reference")
            .map((feature) => feature.sourceElementId)
        ).size
    ),
    pierLikeFeaturesMissingWhitelistOrAdapter: Math.max(0, source.pierLikeSourceFeatures - adaptedPierIds.size),
    publicTransportStationsWithoutCurrentAdapter: Math.max(0, source.publicTransportStations - adaptedPublicTransportStationCount),
    missingWhitelistTags: missingWhitelistTags(elements)
  };
}

function buildCategoryAudits(input: {
  sourceCoverage: Phase8SourceCoverageCounts;
  routeGraphCoverage: Phase8RouteGraphCoverageCounts;
  contextAdapterCoverage: Phase8ContextAdapterCoverageCounts;
  rendererConsumedCoverage: Phase8RendererConsumedCoverageCounts;
  unsupportedCoverage: Phase8UnsupportedCoverageCounts;
  elements: readonly OverpassElement[];
}): Phase8PipelineCategoryAudit[] {
  const { sourceCoverage, routeGraphCoverage, contextAdapterCoverage, rendererConsumedCoverage, unsupportedCoverage, elements } = input;

  return CATEGORY_ORDER.map((id) => {
    if (id === "road-network") {
      return categoryAudit({
        id,
        state: routeGraphCoverage.convertedRoadSegments > 0 ? "render-ready" : "source-absent",
        sourceCount:
          sourceCoverage.drivableMajorRoadWays +
          sourceCoverage.secondaryAndTertiaryRoadWays +
          sourceCoverage.residentialAndUnclassifiedRoadWays +
          sourceCoverage.serviceRoadWays,
        retainedCount: routeGraphCoverage.importedRoadWays,
        routeGraphCount: routeGraphCoverage.convertedRoadSegments,
        contextAdapterCount: 0,
        rendererConsumedCount: routeGraphCoverage.convertedRoadSegments,
        notes: ["Drivable road ways are imported into route graph segments; pedestrian/path/cycle context is source-only unless the context adapter supports a separate polygon or line."],
        evidence: evidenceFor(elements, (tags) => Boolean(tagValue(tags, "highway")))
      });
    }

    if (id === "road-references") {
      return categoryAudit({
        id,
        state: sourceCoverage.sourceRoadRefWays > 0
          ? rendererConsumedCoverage.displayedRoadReferences > 0
            ? "render-ready"
            : contextAdapterCoverage.roadReferenceFeatures > 0
              ? "context-ready-no-renderer-consumer"
            : routeGraphCoverage.roadsWithRawRefTags > 0
              ? "route-metadata-only"
            : "source-present-geometry-discarded"
          : "source-absent",
        sourceCount: sourceCoverage.sourceRoadRefWays,
        retainedCount: routeGraphCoverage.roadsWithRawRefTags,
        routeGraphCount: routeGraphCoverage.roadsWithRawRefTags,
        contextAdapterCount: contextAdapterCoverage.roadReferenceFeatures,
        rendererConsumedCount: rendererConsumedCoverage.displayedRoadReferences,
        blockerCount: unsupportedCoverage.roadRefsMetadataOnly,
        notes: ["Source ref tags are counted only from OSM ref values; no A-road or B-road value is inferred from road names. Stage 8.5 consumes supported references as bounded label candidates."],
        evidence: evidenceFor(elements, (tags) => Boolean(tags.ref?.trim()) && Boolean(tagValue(tags, "highway")))
      });
    }

    if (id === "buildings-built-fabric") {
      return categoryAudit({
        id,
        state: rendererConsumedCoverage.generalBuildingPolygons > 0
          ? "render-ready"
          : contextAdapterCoverage.generalBuildingPolygons > 0
            ? "context-ready-no-renderer-consumer"
          : sourceCoverage.usableClosedBuildingPolygons > 0
            ? "source-present-geometry-discarded"
            : "source-absent",
        sourceCount: sourceCoverage.buildingTaggedWays + sourceCoverage.buildingTaggedRelations,
        retainedCount: sourceCoverage.buildingTaggedWays + sourceCoverage.buildingTaggedRelations,
        routeGraphCount: 0,
        contextAdapterCount: contextAdapterCoverage.generalBuildingPolygons,
        rendererConsumedCount: rendererConsumedCoverage.generalBuildingPolygons,
        blockerCount: unsupportedCoverage.sourceBuildingPolygonsWithoutRendererPath,
        notes: ["Closed building polygons are normalised as typed context features and consumed as source-backed built fabric where fixture and performance gates permit. Some building-tagged features also become point landmarks."],
        evidence: evidenceFor(elements, (tags) => Boolean(tagValue(tags, "building")))
      });
    }

    if (id === "land-use-institutions") {
      return categoryAudit({
        id,
        state: rendererConsumedCoverage.institutionalPolygons + rendererConsumedCoverage.landUsePolygons > 0
          ? "render-ready"
          : contextAdapterCoverage.institutionalPolygons + contextAdapterCoverage.landUsePolygons > 0
            ? "context-ready-no-renderer-consumer"
          : sourceCoverage.civicInstitutionalSourceFeatures > 0
            ? "point-landmark-only"
            : "source-absent",
        sourceCount:
          sourceCoverage.residentialLanduseFeatures +
          sourceCoverage.retailCommercialLanduseFeatures +
          sourceCoverage.industrialLanduseFeatures +
          sourceCoverage.civicInstitutionalSourceFeatures,
        retainedCount:
          sourceCoverage.residentialLanduseFeatures +
          sourceCoverage.retailCommercialLanduseFeatures +
          sourceCoverage.industrialLanduseFeatures +
          sourceCoverage.civicInstitutionalSourceFeatures,
        routeGraphCount: 0,
        contextAdapterCount:
          contextAdapterCoverage.institutionalPointLandmarks +
          contextAdapterCoverage.institutionalPolygons +
          contextAdapterCoverage.landUsePolygons,
        rendererConsumedCount:
          rendererConsumedCoverage.institutionalPolygons + rendererConsumedCoverage.landUsePolygons,
        blockerCount: unsupportedCoverage.institutionalPolygonsWithoutAdapter + unsupportedCoverage.landUsePolygonsWithoutAdapter,
        notes: ["Institutional and land-use polygons use the typed context adapter and render below buildings and roads where fixture and performance gates permit."],
        evidence: evidenceFor(elements, (tags) => Boolean(tagValue(tags, "landuse")) || isInstitutionalSource(tags))
      });
    }

    if (id === "places-area-labels") {
      const sourceCount =
        sourceCoverage.neighbourhoods +
        sourceCoverage.suburbs +
        sourceCoverage.quarters +
        sourceCoverage.localities +
        sourceCoverage.squares +
        sourceCoverage.namedResidentialAreas;
      return categoryAudit({
        id,
        state: contextAdapterCoverage.byKind.area > 0 ? "render-ready" : sourceCount > 0 ? "context-ready-no-renderer-consumer" : "source-absent",
        sourceCount,
        retainedCount: sourceCount,
        routeGraphCount: 0,
        contextAdapterCount: contextAdapterCoverage.byKind.area ?? 0,
        rendererConsumedCount: rendererConsumedCoverage.labels.area ?? 0,
        blockerCount: sourceCoverage.ambiguousEstateCandidates,
        notes: ["Place labels support selected place values. Named residential polygons are recorded as ambiguous and are not silently classified as estates."],
        evidence: evidenceFor(elements, (tags) => Boolean(tagValue(tags, "place")) || tagValue(tags, "landuse") === "residential")
      });
    }

    if (id === "parks-open-space") {
      const sourceCount = sourceCoverage.parks + sourceCoverage.gardens + sourceCoverage.recreationGrounds + sourceCoverage.otherOpenSpaces;
      return categoryAudit({
        id,
        state: (rendererConsumedCoverage.backgroundFeatures.park ?? 0) + (rendererConsumedCoverage.backgroundFeatures["open-space"] ?? 0) > 0
          ? "render-ready"
          : sourceCount > 0
            ? "context-ready-no-renderer-consumer"
            : "source-absent",
        sourceCount,
        retainedCount: sourceCount,
        routeGraphCount: 0,
        contextAdapterCount: contextAdapterCoverage.byKind.park ?? 0,
        rendererConsumedCount:
          (rendererConsumedCoverage.backgroundFeatures.park ?? 0) +
          (rendererConsumedCoverage.backgroundFeatures["open-space"] ?? 0),
        notes: ["Parks, gardens, recreation grounds, and supported open-space polygons can reach the background renderer when geometry is closed and supported."],
        evidence: evidenceFor(elements, openSpaceSource)
      });
    }

    if (id === "water-river-context") {
      const sourceCount = sourceCoverage.waterPolygons + sourceCoverage.waterways + sourceCoverage.waterMultipolygonRelations;
      return categoryAudit({
        id,
        state: (rendererConsumedCoverage.backgroundFeatures.water ?? 0) + (rendererConsumedCoverage.linearFeatures.waterway ?? 0) > 0
          ? "render-ready"
          : sourceCount > 0
            ? "context-ready-no-renderer-consumer"
            : "source-absent",
        sourceCount,
        retainedCount: sourceCount,
        routeGraphCount: 0,
        contextAdapterCount: contextAdapterCoverage.byKind.water ?? 0,
        rendererConsumedCount:
          (rendererConsumedCoverage.backgroundFeatures.water ?? 0) +
          (rendererConsumedCoverage.linearFeatures.waterway ?? 0),
        blockerCount: unsupportedCoverage.pierLikeFeaturesMissingWhitelistOrAdapter,
        notes: ["Water polygons, waterways, and multipolygon outer rings have current adapter coverage. Named pier geometry can also reach the compact symbol pipeline."],
        evidence: evidenceFor(elements, (tags) => waterSource(tags) || pierLikeSource(tags))
      });
    }

    if (id === "rail-transport") {
      const sourceCount =
        sourceCoverage.railWays +
        sourceCoverage.lightRailWays +
        sourceCoverage.subwayWays +
        sourceCoverage.railwayStations +
        sourceCoverage.publicTransportStations;
      return categoryAudit({
        id,
        state: (rendererConsumedCoverage.linearFeatures.rail ?? 0) + (rendererConsumedCoverage.landmarkVisuals.station ?? 0) > 0
          ? "render-ready"
          : sourceCount > 0
            ? "context-ready-no-renderer-consumer"
            : "source-absent",
        sourceCount,
        retainedCount: sourceCount,
        routeGraphCount: 0,
        contextAdapterCount: (contextAdapterCoverage.byKind.rail ?? 0) + (contextAdapterCoverage.byKind.station ?? 0),
        rendererConsumedCount: (rendererConsumedCoverage.linearFeatures.rail ?? 0) + (rendererConsumedCoverage.landmarkVisuals.station ?? 0),
        blockerCount: unsupportedCoverage.publicTransportStationsWithoutCurrentAdapter,
        notes: ["Rail lines plus named railway=station and public_transport=station features can reach the compact symbol pipeline."],
        evidence: evidenceFor(elements, (tags) => Boolean(tagValue(tags, "railway")) || tagValue(tags, "public_transport") === "station")
      });
    }

    return categoryAudit({
      id,
      state: Object.entries(rendererConsumedCoverage.landmarkVisuals)
        .filter(([kind]) => kind !== "station" && kind !== "open-space")
        .some(([, count]) => count > 0)
        ? "point-landmark-only"
        : sourceCoverage.namedLandmarkCandidates + sourceCoverage.unnamedLandmarkCandidates > 0
          ? "context-ready-no-renderer-consumer"
          : "source-absent",
      sourceCount: sourceCoverage.namedLandmarkCandidates + sourceCoverage.unnamedLandmarkCandidates,
      retainedCount: sourceCoverage.namedLandmarkCandidates,
      routeGraphCount: 0,
      contextAdapterCount: contextAdapterCoverage.byKind.landmark ?? 0,
      rendererConsumedCount: Object.entries(rendererConsumedCoverage.landmarkVisuals)
        .filter(([kind]) => kind !== "station" && kind !== "open-space")
        .reduce((sum, [, count]) => sum + count, 0),
      notes: ["Supported named public features render as compact source-backed symbols/labels only. They are not evidence of public-building or institutional polygons."],
      evidence: evidenceFor(elements, landmarkSource)
    });
  });
}

function categoryAudit(input: {
  id: Phase8AuditCategoryId;
  state: Phase8CoverageState;
  sourceCount: number;
  retainedCount?: number;
  routeGraphCount?: number;
  contextAdapterCount?: number;
  rendererConsumedCount?: number;
  blockerCount?: number;
  notes?: string[];
  evidence?: Phase8EvidenceSample[];
}): Phase8PipelineCategoryAudit {
  return {
    id: input.id,
    label: CATEGORY_LABELS[input.id],
    stage: stageForState(input.state),
    state: input.state,
    sourceCount: input.sourceCount,
    retainedCount: input.retainedCount ?? 0,
    routeGraphCount: input.routeGraphCount ?? 0,
    contextAdapterCount: input.contextAdapterCount ?? 0,
    rendererConsumedCount: input.rendererConsumedCount ?? 0,
    blockerCount: input.blockerCount ?? 0,
    notes: [...(input.notes ?? [])].sort((left, right) => left.localeCompare(right)),
    evidence: input.evidence ?? []
  };
}

function stageForState(state: Phase8CoverageState): Phase8PipelineStage {
  if (state === "source-absent" || state === "renderer-supported-no-source") {
    return "sourceAbsence";
  }

  if (state === "source-present-retained" || state === "source-present-not-whitelisted") {
    return "retainedImportCoverage";
  }

  if (state === "route-metadata-only") {
    return "routeGraphCoverage";
  }

  if (state === "point-landmark-only" || state === "context-ready-no-renderer-consumer") {
    return "contextAdapterCoverage";
  }

  if (state === "render-ready") {
    return "rendererConsumedCoverage";
  }

  if (state === "manual-unverified") {
    return "manualUnverified";
  }

  return "unsupportedOrDiscardedCoverage";
}

function buildAggregateReport(fixtureReports: readonly Phase8FixtureAuditReport[]): Phase8AggregateAuditReport {
  const realReports = fixtureReports.filter((report) => report.includedInRealGeographyAggregate);
  const syntheticReports = fixtureReports.filter((report) => !report.includedInRealGeographyAggregate);
  const totals = {
    sourceRoadRefWays: sum(realReports, (report) => report.sourceCoverage.sourceRoadRefWays),
    routeGraphRefRoadSegments: sum(realReports, (report) => report.routeGraphCoverage.roadsWithRawRefTags),
    displayedRoadReferences: sum(realReports, (report) => report.rendererConsumedCoverage.displayedRoadReferences),
    usableClosedBuildingPolygons: sum(realReports, (report) => report.sourceCoverage.usableClosedBuildingPolygons),
    generalBuildingPolygonsRendered: sum(realReports, (report) => report.rendererConsumedCoverage.generalBuildingPolygons),
    institutionalSourceFeatures: sum(realReports, (report) => report.sourceCoverage.civicInstitutionalSourceFeatures),
    institutionalPolygonsRendered: sum(realReports, (report) => report.rendererConsumedCoverage.institutionalPolygons),
    landUseSourceFeatures: sum(
      realReports,
      (report) =>
        report.sourceCoverage.residentialLanduseFeatures +
        report.sourceCoverage.retailCommercialLanduseFeatures +
        report.sourceCoverage.industrialLanduseFeatures
    ),
    landUsePolygonsRendered: sum(realReports, (report) => report.rendererConsumedCoverage.landUsePolygons),
    contextFeatures: sum(realReports, (report) => report.contextAdapterCoverage.totalFeatures),
    rendererBackgroundFeatures: sumRecords(realReports, (report) => report.rendererConsumedCoverage.backgroundFeatures),
    rendererLinearFeatures: sumRecords(realReports, (report) => report.rendererConsumedCoverage.linearFeatures),
    rendererLandmarkVisuals: sumRecords(realReports, (report) => report.rendererConsumedCoverage.landmarkVisuals),
    rendererLabels: sumRecords(realReports, (report) => report.rendererConsumedCoverage.labels),
    pierLikeSourceFeatures: sum(realReports, (report) => report.sourceCoverage.pierLikeSourceFeatures),
    pierRendererFeatures: sum(realReports, (report) => report.rendererConsumedCoverage.piers)
  };

  return {
    realFixtureCount: realReports.length,
    syntheticControlCount: syntheticReports.length,
    auditedFixtureNames: realReports.map((report) => report.fixtureName).sort((left, right) => left.localeCompare(right)),
    excludedSyntheticControls: syntheticReports.map((report) => report.fixtureName).sort((left, right) => left.localeCompare(right)),
    totals,
    conclusions: [
      "Committed real OSM fixtures provide road-network, park, water, rail, station, area-label, and point-landmark evidence for Phase 8.",
      "Valid A/B road refs now have typed context features, but there is no current displayed road-reference renderer path.",
      "Building, land-use, and institutional source polygons now have render-data adapter contracts but are not consumed by the renderer as atlas fabric.",
      "Public buildings and other landmarks still render only as point features; institutional area rendering remains a later stage.",
      "Synthetic fixtures are listed as controls and excluded from real-geography aggregate conclusions."
    ],
    stage83Requirements: aggregateStage83Requirements(realReports)
  };
}

function aggregateStage83Requirements(reports: readonly Phase8FixtureAuditReport[]): string[] {
  const requirements = new Set<string>();

  for (const report of reports) {
    for (const requirement of report.stage83Requirements) {
      requirements.add(requirement);
    }
  }

  return [...requirements].sort((left, right) => left.localeCompare(right));
}

function stage83RequirementsForFixture(
  source: Phase8SourceCoverageCounts,
  routeGraph: Phase8RouteGraphCoverageCounts,
  context: Phase8ContextAdapterCoverageCounts,
  unsupported: Phase8UnsupportedCoverageCounts
): string[] {
  const requirements: string[] = [];

  if (source.usableClosedBuildingPolygons > 0 && context.generalBuildingPolygons === 0) {
    requirements.push("Hydrate or performance-gate this fixture before verifying its typed building adapter output.");
  }

  if (
    source.residentialLanduseFeatures + source.retailCommercialLanduseFeatures + source.industrialLanduseFeatures > 0 &&
    context.landUsePolygons === 0
  ) {
    requirements.push("Hydrate or performance-gate this fixture before verifying its typed land-use adapter output.");
  }

  if (source.polygonCapableInstitutionalFeatures > 0 && context.institutionalPolygons === 0) {
    requirements.push("Hydrate or performance-gate this fixture before verifying its typed institutional-area adapter output.");
  }

  if (source.neighbourhoods + source.suburbs + source.quarters + source.localities + source.squares + source.namedResidentialAreas > 0) {
    requirements.push("Add place, neighbourhood, and ambiguous estate-candidate contracts without silently classifying named residential polygons as estates.");
  }

  if (routeGraph.roadsWithRawRefTags > 0 && context.roadReferenceFeatures === 0) {
    requirements.push("Hydrate or performance-gate this fixture before verifying its typed road-reference adapter output.");
  }

  if (source.railWays + source.lightRailWays + source.subwayWays + source.railwayStations + source.publicTransportStations > 0) {
    requirements.push("Review transport and public-feature candidate contracts for compact atlas symbols.");
  }

  if (source.pierLikeSourceFeatures > 0 && unsupported.pierLikeFeaturesMissingWhitelistOrAdapter > 0) {
    requirements.push("Keep unsupported pier-like source records out of the symbol pipeline until named geometry is retained by the adapter.");
  }

  if (Object.keys(unsupported.missingWhitelistTags).length > 0) {
    requirements.push("Update enrichment whitelist coverage for Stage 8 atlas tags before relying on regenerated fixtures.");
  }

  if (source.waterMultipolygonRelations > 0) {
    requirements.push("Keep multipolygon relation handling in the geometry adapter contract and performance tests.");
  }

  if (source.buildingTaggedWays + source.residentialLanduseFeatures + source.civicInstitutionalSourceFeatures > 5000) {
    requirements.push("Define Central London simplification, lazy-loading, or tiling limits before rendering dense atlas fabric.");
  }

  return requirements.sort((left, right) => left.localeCompare(right));
}

function sourceAbsences(source: Phase8SourceCoverageCounts): string[] {
  const absences: string[] = [];

  if (source.sourceRoadRefWays === 0) {
    absences.push("road references");
  }

  if (source.usableClosedBuildingPolygons === 0) {
    absences.push("usable closed building polygons");
  }

  if (source.pierLikeSourceFeatures === 0) {
    absences.push("pier-like source features");
  }

  if (source.explicitEstateFeatures === 0) {
    absences.push("explicit estate source features");
  }

  return absences.sort((left, right) => left.localeCompare(right));
}

function attributionStatus(option: RouteRunnerMapOption, classification: Phase8FixtureClassification): Phase8FixtureAuditReport["attributionStatus"] {
  if (!option.attribution) {
    return "missing";
  }

  return classification === "real-osm" && /openstreetmap/i.test(option.attribution) ? "osm-attributed" : "synthetic-attributed";
}

function countElementTotals(elements: readonly OverpassElement[]): Phase8ElementTotals {
  return {
    elements: elements.length,
    nodes: elements.filter((element) => element.type === "node").length,
    ways: elements.filter((element) => element.type === "way").length,
    relations: elements.filter((element) => element.type === "relation").length
  };
}

function missingWhitelistTags(elements: readonly OverpassElement[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const element of elements) {
    const tags = element.tags ?? {};
    for (const key of FUTURE_ATLAS_TAGS_REQUIRING_WHITELIST) {
      if (tags[key] !== undefined && !WHITELIST.has(key)) {
        increment(counts, key);
      }
    }
  }

  return sortedRecord(counts);
}

function evidenceFor(elements: readonly OverpassElement[], predicate: (tags: OverpassTags) => boolean): Phase8EvidenceSample[] {
  return elements
    .filter((element) => predicate(element.tags ?? {}))
    .sort(compareElements)
    .slice(0, MAX_EVIDENCE_SAMPLES)
    .map((element) => ({
      elementType: element.type,
      elementId: String(element.id),
      tags: sampleTags(element.tags ?? {})
    }));
}

function sampleTags(tags: OverpassTags): Record<string, string> {
  const preferredKeys = [
    "highway",
    "name",
    "ref",
    "building",
    "amenity",
    "landuse",
    "leisure",
    "natural",
    "water",
    "waterway",
    "railway",
    "public_transport",
    "place",
    "tourism",
    "historic",
    "man_made",
    "shop"
  ];

  return Object.fromEntries(
    preferredKeys
      .filter((key) => tags[key] !== undefined)
      .map((key) => [key, tags[key]])
      .slice(0, 8)
  );
}

function overpassElements(fixture: unknown): OverpassElement[] {
  return isOverpassJsonResponse(fixture) ? fixture.elements : [];
}

function overpassGenerator(fixture: unknown): string {
  return isRecord(fixture) && typeof fixture.generator === "string" ? fixture.generator : "";
}

function isOverpassJsonResponse(value: unknown): value is OverpassJsonResponse {
  return isRecord(value) && Array.isArray(value.elements);
}

function compareFixtureReports(left: Phase8FixtureAuditReport, right: Phase8FixtureAuditReport): number {
  return (
    Number(right.includedInRealGeographyAggregate) - Number(left.includedInRealGeographyAggregate) ||
    left.fixtureName.localeCompare(right.fixtureName)
  );
}

function compareElements(left: OverpassElement, right: OverpassElement): number {
  return elementTypeRank(left.type) - elementTypeRank(right.type) || left.id - right.id;
}

function elementTypeRank(type: OverpassElement["type"]): number {
  if (type === "node") {
    return 1;
  }

  if (type === "way") {
    return 2;
  }

  return 3;
}

function sortedRecord(record: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
}

function countBy<T>(items: readonly T[], keyForItem: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const item of items) {
    increment(counts, keyForItem(item));
  }

  return counts;
}

function increment(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}

function sum<T>(items: readonly T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}

function sumRecords<T>(items: readonly T[], value: (item: T) => Record<string, number>): number {
  return sum(items, (item) => Object.values(value(item)).reduce((total, count) => total + count, 0));
}

function tagValue(tags: OverpassTags, key: string): string {
  return tags[key]?.trim().toLowerCase() ?? "";
}

function named(tags: OverpassTags): boolean {
  return Boolean(tags.name?.trim());
}

function hasTruthyTag(tags: OverpassTags, key: string): boolean {
  const value = tagValue(tags, key);

  return Boolean(value) && value !== "no";
}

function hasAccessRestriction(tags: OverpassTags): boolean {
  return ["access", "motor_vehicle", "vehicle", "motorcar", "bus", "taxi", "cycleway"].some((key) => Boolean(tagValue(tags, key)));
}

function isClosedWay(way: OverpassWayElement): boolean {
  return way.nodes.length >= 4 && way.nodes[0] === way.nodes[way.nodes.length - 1];
}

function recognisedInstitutionAmenity(amenity: string): boolean {
  return [
    "school",
    "university",
    "college",
    "hospital",
    "place_of_worship",
    "library",
    "townhall",
    "courthouse",
    "police",
    "fire_station"
  ].includes(amenity);
}

function isInstitutionalSource(tags: OverpassTags): boolean {
  const building = tagValue(tags, "building");

  return recognisedInstitutionAmenity(tagValue(tags, "amenity")) || building === "public" || building === "civic";
}

function openSpaceSource(tags: OverpassTags): boolean {
  return Boolean(
    tagValue(tags, "leisure") === "park" ||
      tagValue(tags, "leisure") === "garden" ||
      tagValue(tags, "leisure") === "recreation_ground" ||
      tagValue(tags, "landuse") === "recreation_ground" ||
      ["grass", "village_green", "meadow", "forest"].includes(tagValue(tags, "landuse")) ||
      ["wood", "grassland"].includes(tagValue(tags, "natural"))
  );
}

function waterSource(tags: OverpassTags): boolean {
  return Boolean(tagValue(tags, "natural") === "water" || tagValue(tags, "water") || tagValue(tags, "waterway"));
}

function pierLikeSource(tags: OverpassTags): boolean {
  return tagValue(tags, "man_made") === "pier" || tagValue(tags, "amenity") === "ferry_terminal";
}

function landmarkSource(tags: OverpassTags): boolean {
  return Boolean(
    tagValue(tags, "tourism") ||
      tagValue(tags, "historic") ||
      tagValue(tags, "landmark") === "yes" ||
      tagValue(tags, "amenity") === "hospital" ||
      tagValue(tags, "amenity") === "marketplace" ||
      tagValue(tags, "shop") === "mall" ||
      isInstitutionalSource(tags)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function buildPhase8AuditReportForFixture(
  fixture: unknown,
  input: { mapId: string; name: string; description: string; fixtureName: string; attribution?: string }
): Phase8FixtureAuditReport {
  const converted = convertOverpassJsonToRouteMap(fixture, {
    mapId: input.mapId,
    name: input.name,
    description: input.description,
    version: 1
  });

  if (!converted.ok) {
    throw new Error(`Unable to build Phase 8 fixture audit map: ${converted.errors.join("; ")}`);
  }

  return auditFixture({
    option: {
      id: input.mapId,
      label: input.name,
      description: input.description,
      source: "converted-osm",
      map: converted.map,
      exercises: [],
      defaultExerciseId: "",
      fixtureName: input.fixtureName,
      sourceOverpassFixture: fixture,
      attribution: input.attribution ?? "OpenStreetMap contributors"
    },
    classification: "real-osm",
    includeInRealAggregate: true
  });
}
