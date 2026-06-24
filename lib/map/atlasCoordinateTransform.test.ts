import assert from "node:assert/strict";
import test from "node:test";
import {
  atlasPagePixelBounds,
  atlasPixelToGeographic,
  atlasPixelToProjected,
  estimateAtlasMapUnitsToMeters,
  geographicToAtlasPixel,
  projectedToAtlasPixel,
  type AtlasCoordinatePage
} from "./atlasCoordinateTransform.ts";

const testPage: AtlasCoordinatePage = {
  pixelWidth: 1000,
  pixelHeight: 500,
  bounds: {
    south: 51.51,
    west: -0.15,
    north: 51.56,
    east: -0.1
  },
  projectedBounds: {
    crs: "EPSG:27700",
    minX: 530000,
    minY: 180000,
    maxX: 532000,
    maxY: 181000
  }
};

test("converts geographic bounds to atlas pixels", () => {
  assert.deepEqual(geographicToAtlasPixel(testPage, { lat: 51.56, lng: -0.15 }), {
    x: 0,
    y: 0
  });
  assert.deepEqual(geographicToAtlasPixel(testPage, { lat: 51.51, lng: -0.1 }), {
    x: 1000,
    y: 500
  });
});

test("round-trips atlas pixels and geographic coordinates", () => {
  const point = { x: 325, y: 175 };
  const coordinate = atlasPixelToGeographic(testPage, point);
  const roundTripped = geographicToAtlasPixel(testPage, coordinate);

  assert.equal(Math.round(roundTripped.x), point.x);
  assert.equal(Math.round(roundTripped.y), point.y);
});

test("converts projected OS grid bounds to atlas pixels", () => {
  assert.deepEqual(projectedToAtlasPixel(testPage, { x: 530000, y: 181000 }), {
    x: 0,
    y: 0
  });
  assert.deepEqual(projectedToAtlasPixel(testPage, { x: 532000, y: 180000 }), {
    x: 1000,
    y: 500
  });
});

test("round-trips atlas pixels and projected coordinates", () => {
  const point = { x: 250, y: 400 };
  const coordinate = atlasPixelToProjected(testPage, point);
  const roundTripped = projectedToAtlasPixel(testPage, coordinate);

  assert.equal(roundTripped.x, point.x);
  assert.equal(roundTripped.y, point.y);
});

test("returns pixel bounds for route scoring", () => {
  assert.deepEqual(atlasPagePixelBounds(testPage), {
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 500
  });
});

test("estimates route scoring metres per pixel from projected bounds", () => {
  assert.equal(estimateAtlasMapUnitsToMeters(testPage), 2);
});
