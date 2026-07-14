import type {
  MapDefinition,
  RouteExercise,
  RouteExerciseDifficulty,
  Vec2
} from "../../../lib/map-engine/index.ts";
import { projectOsmCoordinateToLocalMeters, type OsmLocalProjection } from "../../../lib/map-engine/osm/index.ts";
import { TOPOPASS_STREET_ATLAS_STYLE } from "./topopassCartographyStyle.ts";

export type RouteRunnerMapSource = "synthetic-dev" | "converted-osm";
export type RouteRunnerFixtureUse = "visualQaOnly" | "routableExercise" | "routeReviewFixture";
export type RouteRunnerFixturePerformanceGate =
  | "betaPracticeAllowed"
  | "betaPracticeAllowedWithLoading"
  | "devOnlyStressTest"
  | "visualQaOnly";

export type RouteRunnerMapOption = {
  id: string;
  label: string;
  description: string;
  source: RouteRunnerMapSource;
  map: MapDefinition;
  exercises: RouteExercise[];
  defaultExerciseId: string;
  attribution?: string;
  fixtureName?: string;
  sourceOverpassFixture?: unknown;
  devOnly?: boolean;
  fixtureUse?: RouteRunnerFixtureUse;
  fixturePerformanceGate?: RouteRunnerFixturePerformanceGate;
  visibleInBeta?: boolean;
  scoreable?: boolean;
  lazyLoadId?: string;
  lazyLoadingLabel?: string;
};

export type RouteRunnerMapBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type RealLondonPilotRouteType = "direct" | "checkpoint" | "multi-stop" | "one-way-awareness";

export type RealLondonPilotExerciseMetadata = {
  difficulty: RouteExerciseDifficulty;
  routeType: RealLondonPilotRouteType;
  estimatedDistanceMeters: number;
  expectedComplexity: string;
};

export type RealLondonPilotRouteExercise = RouteExercise & {
  realLondonPilotMetadata: RealLondonPilotExerciseMetadata;
};

type MaybeOsmRouteGraphMapDefinition = MapDefinition & {
  metadata?: {
    source?: string;
    projection?: OsmLocalProjection;
  };
};

export const DEFAULT_ROUTE_RUNNER_MAP_ID = "marlowe-district-dev-map";
export const REAL_LONDON_OSM_PILOT_MAP_ID = "osm-real-london-pilot";
export const REAL_LONDON_OSM_PILOT_TWO_MAP_ID = "osm-real-london-pilot-2";

const MEDIUM_OSM_FIXTURE_MAP_ID = "osm-medium-london-prototype";
const LARGE_LONDON_OSM_MAP_ID = "osm-large-london";
const DEFAULT_ROUTE_RUNNER_MAP_PADDING = 45;
const LARGE_OSM_ROUTE_RUNNER_PADDING_RATIO = 0.22;
const CURATED_OSM_ROUTE_RUNNER_PADDING_RATIO = 0.28;
const CURATED_OSM_MAP_ID_PREFIX = "osm-curated-";
const VICTORIA_WESTMINSTER_VAUXHALL_OSM_MAP_ID = "osm-curated-victoria-westminster-vauxhall";
const VICTORIA_WESTMINSTER_VAUXHALL_PRINCIPAL_VIEW_BOUNDS = {
  minLat: 51.4838,
  maxLat: 51.5047,
  minLon: -0.158,
  maxLon: -0.1115
} as const;

export function getRealLondonPilotExerciseMetadata(
  exercise: RouteExercise
): RealLondonPilotExerciseMetadata | null {
  const metadata = (exercise as Partial<RealLondonPilotRouteExercise>).realLondonPilotMetadata;

  return metadata ?? null;
}

export function isConvertedOsmRouteRunnerMap(option: RouteRunnerMapOption): boolean {
  return option.source === "converted-osm";
}

export function isDevOnlyRouteRunnerMapOption(option: RouteRunnerMapOption): boolean {
  return option.devOnly === true;
}

export function isConvertedOsmRouteRunnerMapDefinition(map: MapDefinition): boolean {
  return (map as MaybeOsmRouteGraphMapDefinition).metadata?.source === "osm";
}

export function getRouteRunnerMapBounds(map: MapDefinition): RouteRunnerMapBounds {
  if (map.nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0
    };
  }

  return map.nodes.reduce(
    (bounds, node) => ({
      minX: Math.min(bounds.minX, node.x),
      minY: Math.min(bounds.minY, node.y),
      maxX: Math.max(bounds.maxX, node.x),
      maxY: Math.max(bounds.maxY, node.y)
    }),
    {
      minX: map.nodes[0].x,
      minY: map.nodes[0].y,
      maxX: map.nodes[0].x,
      maxY: map.nodes[0].y
    }
  );
}

export function getRouteRunnerMapFitPadding(map: MapDefinition): number {
  const curatedPaddingRatio = map.id.startsWith(CURATED_OSM_MAP_ID_PREFIX)
    ? CURATED_OSM_ROUTE_RUNNER_PADDING_RATIO
    : null;

  if (
    curatedPaddingRatio === null &&
    map.id !== MEDIUM_OSM_FIXTURE_MAP_ID &&
    map.id !== REAL_LONDON_OSM_PILOT_MAP_ID &&
    map.id !== REAL_LONDON_OSM_PILOT_TWO_MAP_ID &&
    map.id !== LARGE_LONDON_OSM_MAP_ID
  ) {
    return DEFAULT_ROUTE_RUNNER_MAP_PADDING;
  }

  const bounds = getRouteRunnerMapBounds(map);
  const width = Math.max(0, bounds.maxX - bounds.minX);
  const height = Math.max(0, bounds.maxY - bounds.minY);
  const paddingRatio = curatedPaddingRatio ?? LARGE_OSM_ROUTE_RUNNER_PADDING_RATIO;

  return Math.max(DEFAULT_ROUTE_RUNNER_MAP_PADDING, Math.max(width, height) * paddingRatio);
}

export function getRouteRunnerMapFitBounds(map: MapDefinition): RouteRunnerMapBounds {
  const bounds = getRouteRunnerMapBounds(map);
  const padding = getRouteRunnerMapFitPadding(map);

  return {
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding
  };
}

function routeRunnerBoundsWidth(bounds: RouteRunnerMapBounds): number {
  return bounds.maxX - bounds.minX;
}

function routeRunnerBoundsHeight(bounds: RouteRunnerMapBounds): number {
  return bounds.maxY - bounds.minY;
}

function expandRouteRunnerMapBounds(bounds: RouteRunnerMapBounds, factor: number): RouteRunnerMapBounds {
  if (!Number.isFinite(factor) || factor <= 0) {
    return { ...bounds };
  }

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const halfWidth = routeRunnerBoundsWidth(bounds) * factor / 2;
  const halfHeight = routeRunnerBoundsHeight(bounds) * factor / 2;

  return {
    minX: centerX - halfWidth,
    minY: centerY - halfHeight,
    maxX: centerX + halfWidth,
    maxY: centerY + halfHeight
  };
}

function projectLatLonBoundsToRouteRunnerMapBounds(
  bounds: typeof VICTORIA_WESTMINSTER_VAUXHALL_PRINCIPAL_VIEW_BOUNDS,
  projection: OsmLocalProjection
): RouteRunnerMapBounds {
  const northWest = projectOsmCoordinateToLocalMeters({ lat: bounds.maxLat, lon: bounds.minLon }, projection);
  const southEast = projectOsmCoordinateToLocalMeters({ lat: bounds.minLat, lon: bounds.maxLon }, projection);

  return {
    minX: Math.min(northWest.x, southEast.x),
    minY: Math.min(northWest.y, southEast.y),
    maxX: Math.max(northWest.x, southEast.x),
    maxY: Math.max(northWest.y, southEast.y)
  };
}

function getFixturePrincipalResetBounds(map: MapDefinition): RouteRunnerMapBounds | null {
  if (map.id !== VICTORIA_WESTMINSTER_VAUXHALL_OSM_MAP_ID) {
    return null;
  }

  const projection = (map as MaybeOsmRouteGraphMapDefinition).metadata?.projection;

  if (!projection) {
    return null;
  }

  return expandRouteRunnerMapBounds(
    projectLatLonBoundsToRouteRunnerMapBounds(VICTORIA_WESTMINSTER_VAUXHALL_PRINCIPAL_VIEW_BOUNDS, projection),
    TOPOPASS_STREET_ATLAS_STYLE.zoom.thresholds.baselineZoomFactor *
      TOPOPASS_STREET_ATLAS_STYLE.zoom.thresholds.principalResetExtentFactor
  );
}

export function fitRouteRunnerMapBoundsToViewport(
  bounds: RouteRunnerMapBounds,
  viewportWidth: number,
  viewportHeight: number
): RouteRunnerMapBounds {
  const width = routeRunnerBoundsWidth(bounds);
  const height = routeRunnerBoundsHeight(bounds);

  if (width <= 0 || height <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return { ...bounds };
  }

  const targetAspectRatio = viewportWidth / viewportHeight;
  const boundsAspectRatio = width / height;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  if (boundsAspectRatio < targetAspectRatio) {
    const fittedWidth = height * targetAspectRatio;
    const halfWidth = fittedWidth / 2;

    return {
      minX: centerX - halfWidth,
      minY: bounds.minY,
      maxX: centerX + halfWidth,
      maxY: bounds.maxY
    };
  }

  const fittedHeight = width / targetAspectRatio;
  const halfHeight = fittedHeight / 2;

  return {
    minX: bounds.minX,
    minY: centerY - halfHeight,
    maxX: bounds.maxX,
    maxY: centerY + halfHeight
  };
}

export function getRouteRunnerMapViewportBounds(
  map: MapDefinition,
  viewportWidth: number,
  viewportHeight: number
): RouteRunnerMapBounds {
  const fixturePrincipalResetBounds = getFixturePrincipalResetBounds(map);

  if (fixturePrincipalResetBounds) {
    return fitRouteRunnerMapBoundsToViewport(fixturePrincipalResetBounds, viewportWidth, viewportHeight);
  }

  const fitBounds = getRouteRunnerMapFitBounds(map);

  if (!isConvertedOsmRouteRunnerMapDefinition(map)) {
    return fitBounds;
  }

  return fitRouteRunnerMapBoundsToViewport(fitBounds, viewportWidth, viewportHeight);
}

export function routeRunnerMapCenter(map: MapDefinition): Vec2 {
  const bounds = getRouteRunnerMapBounds(map);

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };
}
