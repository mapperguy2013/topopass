import type { RouteMapPoint } from "@/src/data/maps/routeTypes";

export type AtlasGeographicBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type AtlasProjectedBounds = {
  crs: "EPSG:27700" | string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type AtlasLatLng = {
  lat: number;
  lng: number;
};

export type AtlasProjectedPoint = {
  x: number;
  y: number;
};

export type AtlasCoordinatePage = {
  pixelWidth: number;
  pixelHeight: number;
  bounds: AtlasGeographicBounds;
  projectedBounds?: AtlasProjectedBounds | null;
};

const EARTH_RADIUS_METRES = 6371008.8;

function assertUsablePage(page: AtlasCoordinatePage) {
  if (page.pixelWidth <= 0 || page.pixelHeight <= 0) {
    throw new Error("Atlas page pixel dimensions must be positive.");
  }

  if (page.bounds.east <= page.bounds.west || page.bounds.north <= page.bounds.south) {
    throw new Error("Atlas page geographic bounds must be ordered west/south to east/north.");
  }
}

function assertUsableProjectedBounds(bounds: AtlasProjectedBounds) {
  if (bounds.maxX <= bounds.minX || bounds.maxY <= bounds.minY) {
    throw new Error("Atlas page projected bounds must be ordered min to max.");
  }
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceMetres(a: AtlasLatLng, b: AtlasLatLng) {
  const deltaLat = degreesToRadians(b.lat - a.lat);
  const deltaLng = degreesToRadians(b.lng - a.lng);
  const lat1 = degreesToRadians(a.lat);
  const lat2 = degreesToRadians(b.lat);
  const chord =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return EARTH_RADIUS_METRES * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

export function atlasPagePixelBounds(page: AtlasCoordinatePage) {
  assertUsablePage(page);

  return {
    minX: 0,
    minY: 0,
    maxX: page.pixelWidth,
    maxY: page.pixelHeight
  };
}

export function geographicToAtlasPixel(
  page: AtlasCoordinatePage,
  coordinate: AtlasLatLng
): RouteMapPoint {
  assertUsablePage(page);

  return {
    x:
      ((coordinate.lng - page.bounds.west) /
        (page.bounds.east - page.bounds.west)) *
      page.pixelWidth,
    y:
      ((page.bounds.north - coordinate.lat) /
        (page.bounds.north - page.bounds.south)) *
      page.pixelHeight
  };
}

export function atlasPixelToGeographic(
  page: AtlasCoordinatePage,
  point: RouteMapPoint
): AtlasLatLng {
  assertUsablePage(page);

  return {
    lat:
      page.bounds.north -
      (point.y / page.pixelHeight) * (page.bounds.north - page.bounds.south),
    lng:
      page.bounds.west +
      (point.x / page.pixelWidth) * (page.bounds.east - page.bounds.west)
  };
}

export function projectedToAtlasPixel(
  page: AtlasCoordinatePage,
  coordinate: AtlasProjectedPoint
): RouteMapPoint {
  assertUsablePage(page);

  if (!page.projectedBounds) {
    throw new Error("Atlas page projected bounds are not available.");
  }

  assertUsableProjectedBounds(page.projectedBounds);

  return {
    x:
      ((coordinate.x - page.projectedBounds.minX) /
        (page.projectedBounds.maxX - page.projectedBounds.minX)) *
      page.pixelWidth,
    y:
      ((page.projectedBounds.maxY - coordinate.y) /
        (page.projectedBounds.maxY - page.projectedBounds.minY)) *
      page.pixelHeight
  };
}

export function atlasPixelToProjected(
  page: AtlasCoordinatePage,
  point: RouteMapPoint
): AtlasProjectedPoint {
  assertUsablePage(page);

  if (!page.projectedBounds) {
    throw new Error("Atlas page projected bounds are not available.");
  }

  assertUsableProjectedBounds(page.projectedBounds);

  return {
    x:
      page.projectedBounds.minX +
      (point.x / page.pixelWidth) *
        (page.projectedBounds.maxX - page.projectedBounds.minX),
    y:
      page.projectedBounds.maxY -
      (point.y / page.pixelHeight) *
        (page.projectedBounds.maxY - page.projectedBounds.minY)
  };
}

export function estimateAtlasMapUnitsToMeters(page: AtlasCoordinatePage) {
  assertUsablePage(page);

  if (page.projectedBounds) {
    assertUsableProjectedBounds(page.projectedBounds);

    return (
      (page.projectedBounds.maxX - page.projectedBounds.minX) / page.pixelWidth +
      (page.projectedBounds.maxY - page.projectedBounds.minY) / page.pixelHeight
    ) / 2;
  }

  const middleLat = (page.bounds.south + page.bounds.north) / 2;
  const middleLng = (page.bounds.west + page.bounds.east) / 2;
  const metresPerPixelX =
    haversineDistanceMetres(
      { lat: middleLat, lng: page.bounds.west },
      { lat: middleLat, lng: page.bounds.east }
    ) / page.pixelWidth;
  const metresPerPixelY =
    haversineDistanceMetres(
      { lat: page.bounds.south, lng: middleLng },
      { lat: page.bounds.north, lng: middleLng }
    ) / page.pixelHeight;

  return (metresPerPixelX + metresPerPixelY) / 2;
}
