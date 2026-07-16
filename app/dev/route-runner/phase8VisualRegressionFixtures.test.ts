import assert from "node:assert/strict";
import test from "node:test";
import {
  PHASE8_VISUAL_REGRESSION_BROWSER,
  PHASE8_VISUAL_REGRESSION_FIXTURES,
  getPhase8VisualRegressionFixture,
  phase8VisualRegressionHintText
} from "./phase8VisualRegressionFixtures.ts";

test("Stage 8.11 fixtures have stable unique identities and fixed capture inputs", () => {
  const ids = PHASE8_VISUAL_REGRESSION_FIXTURES.map((fixture) => fixture.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)));
  assert.ok(PHASE8_VISUAL_REGRESSION_FIXTURES.every((fixture) => fixture.viewport.devicePixelRatio === 1));
  assert.deepEqual(PHASE8_VISUAL_REGRESSION_BROWSER, {
    engine: "chromium",
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-GB",
    timezone: "Europe/London"
  });
});

test("Stage 8.11 uses the smallest representative desktop, tablet and mobile state matrix", () => {
  const states = new Set(PHASE8_VISUAL_REGRESSION_FIXTURES.map((fixture) => fixture.state));
  const viewportSizes = new Set(
    PHASE8_VISUAL_REGRESSION_FIXTURES.map((fixture) => `${fixture.viewport.width}x${fixture.viewport.height}`)
  );
  const protectedSystems = new Set(PHASE8_VISUAL_REGRESSION_FIXTURES.flatMap((fixture) => fixture.protects));

  assert.deepEqual(states, new Set(["neutral", "active-route", "hint", "correct-review", "incorrect-review"]));
  assert.ok(viewportSizes.has("1440x900"));
  assert.ok(viewportSizes.has("768x1024"));
  assert.ok(viewportSizes.has("390x844"));
  assert.equal(getPhase8VisualRegressionFixture("quiet-residential-mobile")?.scrollTarget, "map");
  assert.ok(protectedSystems.has("major-road hierarchy"));
  assert.ok(protectedSystems.has("A/B references"));
  assert.ok(protectedSystems.has("water"));
  assert.ok(protectedSystems.has("rail context"));
  assert.ok(protectedSystems.has("building context"));
  assert.ok(protectedSystems.has("coordinate alignment"));
  assert.ok(protectedSystems.has("one-way restrictions"));
  assert.equal(
    getPhase8VisualRegressionFixture("one-way-restrictions-desktop")?.mapId,
    "osm-curated-one-way-system-area"
  );
});

test("Stage 8.11 review fixtures use deterministic source-backed route seeds", () => {
  const correct = getPhase8VisualRegressionFixture("kings-cross-correct-review-desktop");
  const incorrect = getPhase8VisualRegressionFixture("waterloo-incorrect-review-mobile");

  assert.equal(correct?.routeSeed, "shortest");
  assert.equal(correct?.openFeedback, true);
  assert.equal(incorrect?.routeSeed, "incomplete-shortest");
  assert.equal(incorrect?.openFeedback, true);
  assert.equal(incorrect?.scrollTarget, "feedback");
  assert.equal(getPhase8VisualRegressionFixture("missing-fixture"), null);
});

test("Stage 8.11 hint evidence never exposes generated identifiers or turn-by-turn directions", () => {
  const hint = phase8VisualRegressionHintText();

  assert.equal(hint, "Use the map's road names and junction shape to plan the next legal movement.");
  assert.doesNotMatch(hint, /OSM|\b(?:node|road|segment|way)\s+\d/i);
  assert.doesNotMatch(hint, /\b(?:turn left|turn right|continue onto)\b/i);
});
