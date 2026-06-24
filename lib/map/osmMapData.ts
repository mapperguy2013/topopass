export type GeoBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type GeoJsonGeometry = {
  type?: string;
  coordinates?: unknown;
};

export type GeoJsonFeature = {
  type?: "Feature";
  geometry?: GeoJsonGeometry | null;
  properties?: Record<string, unknown> | null;
};

export function expandBounds(bounds: GeoBounds, bufferDegrees: number): GeoBounds {
  return {
    west: bounds.west - bufferDegrees,
    south: bounds.south - bufferDegrees,
    east: bounds.east + bufferDegrees,
    north: bounds.north + bufferDegrees
  };
}

function collectCoordinates(value: unknown, output: [number, number][]) {
  if (!Array.isArray(value)) return;

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    output.push([value[0], value[1]]);
    return;
  }

  value.forEach((child) => collectCoordinates(child, output));
}

export function featureBounds(feature: GeoJsonFeature): GeoBounds | null {
  const coordinates: [number, number][] = [];
  collectCoordinates(feature.geometry?.coordinates, coordinates);

  if (coordinates.length === 0) return null;

  return coordinates.reduce<GeoBounds>(
    (bounds, [lng, lat]) => ({
      west: Math.min(bounds.west, lng),
      south: Math.min(bounds.south, lat),
      east: Math.max(bounds.east, lng),
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

export function boundsIntersect(a: GeoBounds, b: GeoBounds) {
  return !(
    a.east < b.west ||
    a.west > b.east ||
    a.north < b.south ||
    a.south > b.north
  );
}

export function filterFeaturesByBounds<T extends GeoJsonFeature>(
  features: T[],
  bounds: GeoBounds
) {
  return features.filter((feature) => {
    const boundsForFeature = featureBounds(feature);
    return boundsForFeature ? boundsIntersect(boundsForFeature, bounds) : false;
  });
}
