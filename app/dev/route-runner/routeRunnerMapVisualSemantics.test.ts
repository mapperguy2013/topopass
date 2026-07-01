import assert from "node:assert/strict";
import test from "node:test";
import type { RoadRestrictionOverlay } from "./routeRunnerDisplay.ts";
import { buildRoadRestrictionOverlays } from "./routeRunnerDisplay.ts";
import {
  buildOneWayVisualItems,
  buildRestrictionLegendItems,
  ONE_WAY_ARROW_MIN_SPACING_METERS
} from "./restrictionMapVisuals.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap,
  realLondonOsmPilotTwoRouteMap
} from "./routeRunnerMaps.ts";

function oneWayOverlay(input: {
  roadId: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  renderGroupId?: string;
}): RoadRestrictionOverlay {
  return {
    roadId: input.roadId,
    ...(input.renderGroupId ? { renderGroupId: input.renderGroupId } : {}),
    kind: "one-way",
    label: "One-way",
    points: [input.from, input.to],
    midpoint: {
      x: (input.from.x + input.to.x) / 2,
      y: (input.from.y + input.to.y) / 2
    },
    direction: {
      from: input.from,
      to: input.to
    }
  };
}

function legendText(id: string): string {
  const item = buildRestrictionLegendItems().find((candidate) => candidate.id === id);

  if (!item) {
    throw new Error(`Expected legend item ${id}`);
  }

  return `${item.label} ${item.description}`;
}

test("Stage 131 reduces repeated one-way arrows on the same road under 50m", () => {
  const items = buildOneWayVisualItems([
    oneWayOverlay({ roadId: "same-road", from: { x: 0, y: 0 }, to: { x: 40, y: 0 } }),
    oneWayOverlay({ roadId: "same-road", from: { x: 30, y: 0 }, to: { x: 70, y: 0 } })
  ]);

  assert.equal(ONE_WAY_ARROW_MIN_SPACING_METERS, 50);
  assert.deepEqual(
    items.map((item) => item.id),
    ["one-way:same-road:0"]
  );
});

test("Stage 131 preserves one-way arrows on the same road at least 50m apart", () => {
  const items = buildOneWayVisualItems([
    oneWayOverlay({ roadId: "long-one-way", from: { x: 0, y: 0 }, to: { x: 220, y: 0 } })
  ]);

  assert.deepEqual(
    items.map((item) => item.id),
    ["one-way:long-one-way:0", "one-way:long-one-way:1"]
  );
  assert.ok(items[1].point.x - items[0].point.x >= ONE_WAY_ARROW_MIN_SPACING_METERS);
});

test("Stage 131 applies one-way arrow spacing to the same rendered road group", () => {
  const items = buildOneWayVisualItems([
    oneWayOverlay({
      roadId: "osm-way-1-segment-0",
      renderGroupId: "osm-way:1",
      from: { x: 0, y: 0 },
      to: { x: 40, y: 0 }
    }),
    oneWayOverlay({
      roadId: "osm-way-1-segment-1",
      renderGroupId: "osm-way:1",
      from: { x: 30, y: 0 },
      to: { x: 70, y: 0 }
    }),
    oneWayOverlay({
      roadId: "osm-way-1-segment-2",
      renderGroupId: "osm-way:1",
      from: { x: 90, y: 0 },
      to: { x: 130, y: 0 }
    })
  ]);

  assert.deepEqual(
    items.map((item) => item.id),
    ["one-way:osm-way-1-segment-0:0", "one-way:osm-way-1-segment-2:0"]
  );
});

test("Stage 131 keeps nearby one-way arrows on different roads", () => {
  const items = buildOneWayVisualItems([
    oneWayOverlay({ roadId: "parallel-a", from: { x: 0, y: 0 }, to: { x: 40, y: 0 } }),
    oneWayOverlay({ roadId: "parallel-b", from: { x: 5, y: 8 }, to: { x: 45, y: 8 } })
  ]);

  assert.deepEqual(
    items.map((item) => item.id),
    ["one-way:parallel-a:0", "one-way:parallel-b:0"]
  );
});

test("Stage 131 OSM restriction overlays carry stable rendered way groups", () => {
  const overlays = buildRoadRestrictionOverlays(realLondonOsmPilotRouteMap);
  const groupedOneWayOverlay = overlays.find((overlay) => overlay.kind === "one-way" && overlay.renderGroupId);

  assert.ok(groupedOneWayOverlay);
  assert.match(groupedOneWayOverlay.renderGroupId ?? "", /^osm-way:\d+$/);
});

test("Stage 131 preserves one-way direction metadata and deterministic output", () => {
  const overlays = [
    oneWayOverlay({ roadId: "westbound", from: { x: 120, y: 25 }, to: { x: 20, y: 25 } }),
    oneWayOverlay({ roadId: "northbound", from: { x: 20, y: 20 }, to: { x: 20, y: -80 } })
  ];
  const first = buildOneWayVisualItems(overlays);
  const second = buildOneWayVisualItems(overlays);

  assert.deepEqual(first, second);
  assert.deepEqual(first[0].direction, {
    from: { x: 120, y: 25 },
    to: { x: 20, y: 25 }
  });
  assert.deepEqual(first[1].direction, {
    from: { x: 20, y: 20 },
    to: { x: 20, y: -80 }
  });
});

test("Stage 131 route-runner legend explains one-way arrows", () => {
  const text = legendText("one-way").toLowerCase();

  assert.match(text, /blue/);
  assert.match(text, /one-way/);
  assert.match(text, /permitted/);
  assert.match(text, /travel direction/);
});

test("Stage 131 route-runner legend explains orange and yellow roads as highlighted geometry", () => {
  const text = legendText("highlighted-routable-roads").toLowerCase();

  assert.match(text, /orange/);
  assert.match(text, /yellow/);
  assert.match(text, /routable|important/);
  assert.match(text, /road geometry/);
});

test("Stage 131 route-runner legend explains grey roads as context instead of unavailable roads", () => {
  const text = legendText("context-roads").toLowerCase();

  assert.match(text, /grey/);
  assert.match(text, /context/);
  assert.match(text, /de-emphasised/);
  assert.doesNotMatch(text, /\b(blocked|inactive|unavailable|unusable|closed)\b/);
});

test("Stage 131 keeps Marlowe as the default map with one-way visuals available", () => {
  const defaultOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.equal(defaultOption?.source, "synthetic-dev");
  assert.equal(defaultOption?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);

  if (!defaultOption) {
    throw new Error("Expected the default route-runner map option.");
  }

  const items = buildOneWayVisualItems(buildRoadRestrictionOverlays(defaultOption.map));

  assert.ok(items.length > 0);
});

test("Stage 131 real London pilot maps keep deterministic one-way visuals", () => {
  for (const map of [realLondonOsmPilotRouteMap, realLondonOsmPilotTwoRouteMap]) {
    const overlays = buildRoadRestrictionOverlays(map);
    const first = buildOneWayVisualItems(overlays);
    const second = buildOneWayVisualItems(overlays);

    assert.ok(first.length > 0, `Expected one-way visuals for ${map.id}`);
    assert.deepEqual(first, second);
    assert.ok(first.every((item) => item.direction));
  }
});
