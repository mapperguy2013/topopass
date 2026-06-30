import type { ImportedOsmRoadCoordinate } from "./overpassImport.ts";

export type OsmLatLonBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export type OsmProjectedBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type OsmLocalProjection = {
  method: "local-web-mercator";
  originLat: number;
  originLon: number;
  originMercatorX: number;
  originMercatorY: number;
  metersPerDegreeLat: number;
  metersPerDegreeLon: number;
  latLonBounds: OsmLatLonBounds;
  projectedBounds: OsmProjectedBounds;
};

export type OsmProjectedPoint = {
  x: number;
  y: number;
};

const METERS_PER_DEGREE_LATITUDE = 111_320;
const WEB_MERCATOR_EARTH_RADIUS_METERS = 6_378_137;
const MAX_WEB_MERCATOR_LATITUDE = 85.05112878;
const DEGREES_TO_RADIANS = Math.PI / 180;

function roundCoordinate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function finiteCoordinates(coordinates: readonly ImportedOsmRoadCoordinate[]): ImportedOsmRoadCoordinate[] {
  return coordinates.filter(
    (coordinate) =>
      Number.isFinite(coordinate.lat) &&
      Number.isFinite(coordinate.lon) &&
      Number.isFinite(coordinate.osmNodeId)
  );
}

export function calculateOsmLatLonBounds(
  coordinates: readonly ImportedOsmRoadCoordinate[]
): OsmLatLonBounds | null {
  const usableCoordinates = finiteCoordinates(coordinates);

  if (usableCoordinates.length === 0) {
    return null;
  }

  return {
    minLat: Math.min(...usableCoordinates.map((coordinate) => coordinate.lat)),
    maxLat: Math.max(...usableCoordinates.map((coordinate) => coordinate.lat)),
    minLon: Math.min(...usableCoordinates.map((coordinate) => coordinate.lon)),
    maxLon: Math.max(...usableCoordinates.map((coordinate) => coordinate.lon))
  };
}

function clampWebMercatorLatitude(latitude: number): number {
  return Math.max(-MAX_WEB_MERCATOR_LATITUDE, Math.min(MAX_WEB_MERCATOR_LATITUDE, latitude));
}

function lonToWebMercatorX(longitude: number): number {
  return WEB_MERCATOR_EARTH_RADIUS_METERS * longitude * DEGREES_TO_RADIANS;
}

function latToWebMercatorY(latitude: number): number {
  const clampedLatitude = clampWebMercatorLatitude(latitude);
  const latitudeRadians = clampedLatitude * DEGREES_TO_RADIANS;

  return WEB_MERCATOR_EARTH_RADIUS_METERS * Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2));
}

export function projectOsmCoordinateToLocalMeters(
  coordinate: Pick<ImportedOsmRoadCoordinate, "lat" | "lon">,
  projection: Pick<OsmLocalProjection, "originMercatorX" | "originMercatorY">
): OsmProjectedPoint {
  return {
    x: roundCoordinate(lonToWebMercatorX(coordinate.lon) - projection.originMercatorX),
    y: roundCoordinate(projection.originMercatorY - latToWebMercatorY(coordinate.lat))
  };
}

export function measureOsmCoordinateDistanceMeters(
  fromCoordinate: Pick<ImportedOsmRoadCoordinate, "lat" | "lon">,
  toCoordinate: Pick<ImportedOsmRoadCoordinate, "lat" | "lon">,
  projection: Pick<OsmLocalProjection, "metersPerDegreeLat" | "metersPerDegreeLon">
): number {
  return Math.hypot(
    roundCoordinate((toCoordinate.lon - fromCoordinate.lon) * projection.metersPerDegreeLon),
    roundCoordinate((toCoordinate.lat - fromCoordinate.lat) * projection.metersPerDegreeLat)
  );
}

function buildProjectedBounds(projectedPoints: readonly OsmProjectedPoint[]): OsmProjectedBounds {
  return {
    minX: Math.min(...projectedPoints.map((point) => point.x)),
    maxX: Math.max(...projectedPoints.map((point) => point.x)),
    minY: Math.min(...projectedPoints.map((point) => point.y)),
    maxY: Math.max(...projectedPoints.map((point) => point.y))
  };
}

export function createOsmLocalProjection(
  coordinates: readonly ImportedOsmRoadCoordinate[]
): OsmLocalProjection | null {
  const bounds = calculateOsmLatLonBounds(coordinates);

  if (!bounds) {
    return null;
  }

  const originLat = (bounds.minLat + bounds.maxLat) / 2;
  const originLon = (bounds.minLon + bounds.maxLon) / 2;
  const metersPerDegreeLon = METERS_PER_DEGREE_LATITUDE * Math.cos((originLat * Math.PI) / 180);
  const baseProjection = {
    method: "local-web-mercator" as const,
    originLat,
    originLon,
    originMercatorX: lonToWebMercatorX(originLon),
    originMercatorY: latToWebMercatorY(originLat),
    metersPerDegreeLat: METERS_PER_DEGREE_LATITUDE,
    metersPerDegreeLon
  };
  const projectedPoints = finiteCoordinates(coordinates).map((coordinate) =>
    projectOsmCoordinateToLocalMeters(coordinate, baseProjection)
  );

  return {
    ...baseProjection,
    latLonBounds: bounds,
    projectedBounds: buildProjectedBounds(projectedPoints)
  };
}
