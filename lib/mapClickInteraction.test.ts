import assert from "node:assert/strict";
import test from "node:test";

import {
  canSubmitMapClickAnswer,
  mapClickSelectionMessage,
  scoreMapClickAnswer
} from "./mapClickInteraction.ts";
import {
  getMapboxPublicConfig,
  hasMapboxPublicConfig
} from "./mapbox/config.ts";

test("canSubmitMapClickAnswer requires a finite selected coordinate", () => {
  assert.equal(canSubmitMapClickAnswer(null), false);
  assert.equal(
    canSubmitMapClickAnswer({ latitude: Number.NaN, longitude: -0.12 }),
    false
  );
  assert.equal(
    canSubmitMapClickAnswer({ latitude: 51.52, longitude: -0.12 }),
    true
  );
});

test("scoreMapClickAnswer returns null without a selected point", () => {
  assert.equal(
    scoreMapClickAnswer({
      selectedCoordinates: null,
      target: { lat: 51.52, lng: -0.12 },
      passRadiusMetres: 100
    }),
    null
  );
});

test("scoreMapClickAnswer scores selected points against the target radius", () => {
  const correct = scoreMapClickAnswer({
    selectedCoordinates: { latitude: 51.52, longitude: -0.12 },
    target: { lat: 51.5201, lng: -0.1201 },
    passRadiusMetres: 100
  });
  const incorrect = scoreMapClickAnswer({
    selectedCoordinates: { latitude: 51.52, longitude: -0.12 },
    target: { lat: 51.53, lng: -0.13 },
    passRadiusMetres: 100
  });

  assert.equal(correct?.isCorrect, true);
  assert.equal(incorrect?.isCorrect, false);
});

test("mapClickSelectionMessage explains unselected, selected, and submitted states", () => {
  assert.equal(
    mapClickSelectionMessage({
      selectedCoordinates: null,
      hasSubmittedResult: false
    }),
    "Click or tap the map to choose your answer."
  );
  assert.equal(
    mapClickSelectionMessage({
      selectedCoordinates: { latitude: 51.52, longitude: -0.12 },
      hasSubmittedResult: false
    }),
    "Point selected. You can change it before submitting."
  );
  assert.equal(
    mapClickSelectionMessage({
      selectedCoordinates: { latitude: 51.52, longitude: -0.12 },
      hasSubmittedResult: true
    }),
    "Answer submitted. Click or tap the map again to change it."
  );
});

test("Mapbox public config normalizes configured and missing tokens", () => {
  assert.equal(
    hasMapboxPublicConfig({ NEXT_PUBLIC_MAPBOX_TOKEN: "pk.public-token" }),
    true
  );
  assert.deepEqual(
    getMapboxPublicConfig({ NEXT_PUBLIC_MAPBOX_TOKEN: "  pk.public-token  " }),
    { accessToken: "pk.public-token" }
  );
  assert.equal(hasMapboxPublicConfig({ NEXT_PUBLIC_MAPBOX_TOKEN: "" }), false);
  assert.equal(getMapboxPublicConfig({}), null);
});
