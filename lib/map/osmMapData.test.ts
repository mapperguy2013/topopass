import assert from "node:assert/strict";
import test from "node:test";

import {
  boundsIntersect,
  expandBounds,
  featureBounds,
  filterFeaturesByBounds
} from "./osmMapData.ts";

test("featureBounds calculates a coordinate bounding box", () => {
  const bounds = featureBounds({
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [
        [-0.15, 51.52],
        [-0.12, 51.53],
        [-0.13, 51.51]
      ]
    }
  });

  assert.deepEqual(bounds, {
    west: -0.15,
    south: 51.51,
    east: -0.12,
    north: 51.53
  });
});

test("boundsIntersect detects overlapping and non-overlapping bounds", () => {
  const target = { west: -0.15, south: 51.51, east: -0.1, north: 51.54 };

  assert.equal(
    boundsIntersect(target, {
      west: -0.14,
      south: 51.52,
      east: -0.12,
      north: 51.53
    }),
    true
  );
  assert.equal(
    boundsIntersect(target, {
      west: -0.5,
      south: 51.2,
      east: -0.4,
      north: 51.3
    }),
    false
  );
});

test("filterFeaturesByBounds keeps only features in or near the active area", () => {
  const activeBounds = expandBounds(
    { west: -0.15, south: 51.51, east: -0.1, north: 51.54 },
    0.002
  );
  const features = [
    {
      geometry: {
        type: "LineString",
        coordinates: [
          [-0.149, 51.52],
          [-0.13, 51.52]
        ]
      }
    },
    {
      geometry: {
        type: "LineString",
        coordinates: [
          [-0.3, 51.4],
          [-0.29, 51.41]
        ]
      }
    }
  ];

  assert.equal(filterFeaturesByBounds(features, activeBounds).length, 1);
});
