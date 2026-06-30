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
  originLat: number;
  originLon: number;
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

export function projectOsmCoordinateToLocalMeters(
  coordinate: Pick<ImportedOsmRoadCoordinate, "lat" | "lon">,
  projection: Pick<OsmLocalProjection, "originLat" | "originLon" | "metersPerDegreeLat" | "metersPerDegreeLon">
): OsmProjectedPoint {
  return {
    x: roundCoordinate((coordinate.lon - projection.originLon) * projection.metersPerDegreeLon),
    y: roundCoordinate((projection.originLat - coordinate.lat) * projection.metersPerDegreeLat)
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
    originLat,
    originLon,
    metersPerDegreeLat: METERS_PER_DEGREE_LATITUDE,
    metersPerDegreeLon
  };
  const projectedPoints = finiteCoordinates(coordinates).map((coordinate) =>
    projectOsmCoordinateToLocalMeters(coordinate, baseProjection)
  );

  return {
    ...baseProjection,
    latLonBounds: bounds,
    projectedBounds: {
      minX: Math.min(...projectedPoints.map((point) => point.x)),
      maxX: Math.max(...projectedPoints.map((point) => point.x)),
      minY: Math.min(...projectedPoints.map((point) => point.y)),
      maxY: Math.max(...projectedPoints.map((point) => point.y))
    }
  };
}
