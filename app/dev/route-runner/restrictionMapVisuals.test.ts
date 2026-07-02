import assert from "node:assert/strict";
import test from "node:test";
import type { TurnRestrictionVisual } from "../../../lib/map-engine/index.ts";
import type { RoadRestrictionOverlay, RouteIssueOverlay } from "./routeRunnerDisplay.ts";
import {
  buildIllegalMovementVisualItems,
  buildNoEntryVisualItems,
  buildOneWayVisualItems,
  buildProhibitedTurnVisualItems,
  buildRestrictedRoadVisualItems,
  buildRestrictionLegendItems,
  buildRestrictionMapVisualItems,
  buildSelectedRestrictionHighlight,
  buildTurnRestrictionVisualItemsOrEmpty,
  filterRestrictionMapVisualItemsForViewport,
  roadRestrictionOverlayAlphaForViewport,
  restrictionMapVisualStyleForViewport,
  restrictionZoomTierForViewport,
  resolveRestrictionFocusTarget
} from "./restrictionMapVisuals.ts";
import { TOPOPASS_STREET_ATLAS_STYLE } from "./topopassCartographyStyle.ts";

const roadRestrictionOverlays: RoadRestrictionOverlay[] = [
  {
    roadId: "r-one-way",
    kind: "one-way",
    label: "One-way",
    points: [
      { x: 0, y: 0 },
      { x: 220, y: 0 }
    ],
    midpoint: { x: 110, y: 0 },
    direction: {
      from: { x: 0, y: 0 },
      to: { x: 220, y: 0 }
    }
  },
  {
    roadId: "r-no-entry",
    kind: "no-entry",
    label: "No entry",
    points: [
      { x: 100, y: 0 },
      { x: 100, y: 100 }
    ],
    midpoint: { x: 100, y: 50 },
    direction: {
      from: { x: 100, y: 0 },
      to: { x: 100, y: 100 }
    }
  },
  {
    roadId: "r-closed",
    kind: "restricted",
    label: "Restricted road",
    points: [
      { x: 0, y: 100 },
      { x: 80, y: 100 }
    ],
    midpoint: { x: 40, y: 100 }
  }
];

function turnVisual(value: Partial<TurnRestrictionVisual> = {}): TurnRestrictionVisual {
  return {
    id: "turn-r1-r2",
    reason: "prohibited_turn",
    turnKind: "no-left-turn",
    turnClass: "left",
    fromRoadId: "r-from",
    toRoadId: "r-to",
    viaNodeId: "n-junction",
    label: "No left turn",
    message: "No left turn",
    junction: { x: 70, y: 0 },
    incomingRoadPoint: { x: 0, y: 0 },
    outgoingRoadPoint: { x: 70, y: 90 },
    signPosition: { x: 52, y: -12 },
    iconRotationRadians: 0,
    angleDegrees: -90,
    incomingAngleRadians: Math.PI,
    outgoingAngleRadians: Math.PI / 2,
    markerAngleRadians: (Math.PI * 3) / 4,
    ...value
  };
}

const routeIssueOverlays: RouteIssueOverlay[] = [
  {
    kind: "no-entry",
    label: "No entry",
    message: "Movement 2 uses no-entry road r-no-entry from a to b.",
    points: [
      { x: 100, y: 0 },
      { x: 100, y: 100 }
    ],
    midpoint: { x: 100, y: 50 },
    roadIds: ["r-no-entry"],
    movementIndex: 2,
    direction: {
      from: { x: 100, y: 0 },
      to: { x: 100, y: 100 }
    }
  },
  {
    kind: "disconnected",
    label: "Disconnected roads",
    message: "Disconnected between r-a and r-b.",
    points: [
      { x: 20, y: 20 },
      { x: 160, y: 160 }
    ],
    midpoint: { x: 90, y: 90 },
    roadIds: ["r-a", "r-b"]
  }
];

const lowZoomViewport = {
  width: 160,
  height: 160,
  mapBounds: {
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 1000
  }
};

const mediumZoomViewport = {
  width: 700,
  height: 700,
  mapBounds: {
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 1000
  }
};

const highZoomViewport = {
  width: 1200,
  height: 1200,
  mapBounds: {
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 1000
  }
};

test("buildNoEntryVisualItems creates clear no-entry symbols from existing overlays", () => {
  const items = buildNoEntryVisualItems(roadRestrictionOverlays);

  assert.deepEqual(items, [
    {
      id: "no-entry:r-no-entry:0",
      kind: "no-entry",
      symbol: "no-entry-sign",
      label: "No entry",
      point: { x: 100, y: 57.99999999999999 },
      points: [
        { x: 100, y: 0 },
        { x: 100, y: 100 }
      ],
      roadIds: ["r-no-entry"],
      priority: 30,
      sourceId: "r-no-entry",
      direction: {
        from: { x: 100, y: 0 },
        to: { x: 100, y: 100 }
      }
    }
  ]);
});

test("buildOneWayVisualItems adds repeated arrows only for long readable segments", () => {
  const items = buildOneWayVisualItems(roadRestrictionOverlays);

  assert.deepEqual(
    items.map((item) => [item.id, item.symbol, item.point]),
    [
      ["one-way:r-one-way:0", "one-way-arrow", { x: 74.80000000000001, y: 0 }],
      ["one-way:r-one-way:1", "one-way-arrow", { x: 145.20000000000002, y: 0 }]
    ]
  );
  assert.ok(items.every((item) => item.direction?.to.x === 220));
});

test("buildRestrictedRoadVisualItems creates distinct restricted-road symbols", () => {
  const items = buildRestrictedRoadVisualItems(roadRestrictionOverlays);

  assert.deepEqual(items, [
    {
      id: "restricted-road:r-closed:0",
      kind: "restricted-road",
      symbol: "restricted-road-sign",
      label: "Restricted road",
      point: { x: 40, y: 100 },
      points: [
        { x: 0, y: 100 },
        { x: 80, y: 100 }
      ],
      roadIds: ["r-closed"],
      priority: 35,
      sourceId: "r-closed"
    }
  ]);
});

test("buildProhibitedTurnVisualItems dedupes identical underlying turn restrictions", () => {
  const items = buildProhibitedTurnVisualItems([
    turnVisual({ id: "turn-a" }),
    turnVisual({ id: "turn-b", signPosition: { x: 58, y: -20 } })
  ]);

  assert.equal(items.length, 1);
  assert.deepEqual(
    {
      kind: items[0].kind,
      symbol: items[0].symbol,
      fromRoadId: items[0].fromRoadId,
      toRoadId: items[0].toRoadId,
      viaNodeId: items[0].viaNodeId,
      turnKind: items[0].turnKind
    },
    {
      kind: "prohibited-turn",
      symbol: "turn-ban-sign",
      fromRoadId: "r-from",
      toRoadId: "r-to",
      viaNodeId: "n-junction",
      turnKind: "no-left-turn"
    }
  );
});

test("buildIllegalMovementVisualItems separates illegal sections from disconnected gaps", () => {
  const items = buildIllegalMovementVisualItems(routeIssueOverlays);

  assert.deepEqual(
    items.map((item) => [item.kind, item.symbol, item.roadIds]),
    [
      ["illegal-movement", "illegal-route-section", ["r-no-entry"]],
      ["missed-restriction", "disconnected-gap", ["r-a", "r-b"]]
    ]
  );
});

test("buildRestrictionMapVisualItems returns deterministic priority ordering without mutating inputs", () => {
  const originalPoint = roadRestrictionOverlays[0].points[0];
  const items = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays
  });

  assert.deepEqual(
    items.map((item) => item.kind),
    [
      "one-way",
      "one-way",
      "no-entry",
      "restricted-road",
      "prohibited-turn",
      "missed-restriction",
      "illegal-movement"
    ]
  );

  items[0].points[0].x = 999;
  assert.equal(originalPoint.x, 0);
});

test("Stage 147 zoom tier helper classifies restriction detail deterministically", () => {
  assert.equal(restrictionZoomTierForViewport(lowZoomViewport), "low");
  assert.equal(restrictionZoomTierForViewport(mediumZoomViewport), "medium");
  assert.equal(restrictionZoomTierForViewport(highZoomViewport), "high");
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering), [
    "osmRoadLabelsRequireQaOverlay",
    "oneWayArrowMinSpacingMeters",
    "longRoadArrowThresholdMeters",
    "lowDetailViewportScale",
    "highDetailViewportScale",
    "mediumOneWayMinRoadLengthMeters",
    "lowRestrictionSymbolAlpha",
    "mediumRestrictionSymbolAlpha",
    "highRestrictionSymbolAlpha",
    "lowRestrictionSymbolScale",
    "mediumRestrictionSymbolScale",
    "highRestrictionSymbolScale",
    "lowRestrictionOverlayAlphaMultiplier",
    "mediumRestrictionOverlayAlphaMultiplier",
    "highRestrictionOverlayAlphaMultiplier"
  ]);
});

test("Stage 147 low zoom hides base restriction symbols while preserving route review symbols", () => {
  const items = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays
  });

  assert.deepEqual(
    filterRestrictionMapVisualItemsForViewport(items, lowZoomViewport).map((item) => item.kind),
    ["missed-restriction", "illegal-movement"]
  );
});

test("Stage 147 high zoom reveals one-way and restriction detail", () => {
  const items = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays
  });

  assert.deepEqual(
    filterRestrictionMapVisualItemsForViewport(items, highZoomViewport).map((item) => item.kind),
    [
      "one-way",
      "one-way",
      "no-entry",
      "restricted-road",
      "prohibited-turn",
      "missed-restriction",
      "illegal-movement"
    ]
  );
});

test("Stage 147 medium zoom shows useful restriction symbols and reduces their style", () => {
  const items = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays: []
  });
  const visibleItems = filterRestrictionMapVisualItemsForViewport(items, mediumZoomViewport);
  const oneWayItem = visibleItems.find((item) => item.kind === "one-way");
  const noEntryItem = visibleItems.find((item) => item.kind === "no-entry");

  assert.ok(oneWayItem);
  assert.ok(noEntryItem);
  assert.deepEqual(restrictionMapVisualStyleForViewport(noEntryItem, mediumZoomViewport), {
    alpha: TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.mediumRestrictionSymbolAlpha,
    scale: TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.mediumRestrictionSymbolScale
  });
  assert.ok(
    restrictionMapVisualStyleForViewport(noEntryItem, mediumZoomViewport).alpha <
      restrictionMapVisualStyleForViewport(noEntryItem, highZoomViewport).alpha
  );
});

test("Stage 147 road restriction overlay alpha declutters at low zoom", () => {
  assert.ok(
    roadRestrictionOverlayAlphaForViewport(roadRestrictionOverlays[0], lowZoomViewport) <
      roadRestrictionOverlayAlphaForViewport(roadRestrictionOverlays[0], highZoomViewport)
  );
  assert.ok(
    roadRestrictionOverlayAlphaForViewport(roadRestrictionOverlays[1], lowZoomViewport) >=
      roadRestrictionOverlayAlphaForViewport(roadRestrictionOverlays[0], lowZoomViewport)
  );
});

test("Stage 147 missing turn restriction render data is a safe no-op", () => {
  assert.deepEqual(buildTurnRestrictionVisualItemsOrEmpty(), []);
  assert.deepEqual(buildTurnRestrictionVisualItemsOrEmpty(null), []);
});

test("resolveRestrictionFocusTarget finds illegal movements by review movement index", () => {
  const visualItems = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays
  });
  const target = resolveRestrictionFocusTarget({
    reviewItem: {
      id: "2:no-entry-road:r-no-entry:b",
      label: "No-entry road used on r-no-entry",
      detail: "Movement 2 uses no-entry road r-no-entry."
    },
    visualItems
  });

  assert.equal(target?.kind, "illegal-movement");
  assert.equal(target?.visualItemId.startsWith("route-issue:no-entry:2"), true);
});

test("resolveRestrictionFocusTarget finds turn and road symbols from review text", () => {
  const visualItems = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays: []
  });

  assert.equal(
    resolveRestrictionFocusTarget({
      reviewItem: {
        id: "turn-review",
        label: "Prohibited turn: r-from -> r-to"
      },
      visualItems
    })?.kind,
    "prohibited-turn"
  );
  assert.equal(
    resolveRestrictionFocusTarget({
      reviewItem: {
        id: "road-review",
        label: "Restricted road used on r-closed"
      },
      visualItems
    })?.kind,
    "restricted-road"
  );
});

test("buildSelectedRestrictionHighlight returns a defensive focus model", () => {
  const visualItems = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [],
    routeIssueOverlays
  });
  const target = resolveRestrictionFocusTarget({
    reviewItem: {
      id: "2:no-entry-road:r-no-entry:b",
      label: "No-entry road used on r-no-entry"
    },
    visualItems
  });
  const highlight = buildSelectedRestrictionHighlight(target);

  assert.equal(highlight?.kind, "illegal-movement");
  assert.equal(highlight?.label, "No entry");

  if (highlight) {
    highlight.points[0].x = 999;
  }

  assert.equal(target?.points[0].x, 100);
});

test("buildRestrictionLegendItems covers the polished restriction layer", () => {
  const legend = buildRestrictionLegendItems();

  assert.deepEqual(
    legend.map((item) => item.id),
    [
      "highlighted-routable-roads",
      "context-roads",
      "your-route",
      "shortest-legal-route",
      "illegal-movement",
      "no-entry",
      "one-way",
      "prohibited-turn",
      "restricted-road",
      "selected-focus",
      "start",
      "checkpoint",
      "finish"
    ]
  );
});
