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
import { ROUTE_RUNNER_MAP_ZOOM_LIMITS } from "./mapViewport.ts";
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

const veryHighZoomViewport = {
  width: 10000,
  height: 10000,
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
      ["one-way:r-one-way:0", "one-way-arrow", { x: 52.8, y: 0 }],
      ["one-way:r-one-way:1", "one-way-arrow", { x: 167.2, y: 0 }]
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

test("Stage 157 restriction visual generation can be keyed by zoom tier instead of full viewport", () => {
  const viewportItems = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays,
    viewport: mediumZoomViewport
  });
  const tierItems = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays,
    zoomTier: restrictionZoomTierForViewport(mediumZoomViewport)
  });

  assert.deepEqual(tierItems, viewportItems);
  assert.deepEqual(
    tierItems.map((item) => item.kind),
    ["one-way", "one-way", "no-entry", "restricted-road", "prohibited-turn", "missed-restriction", "illegal-movement"]
  );
});

test("Stage 147 zoom tier helper classifies restriction detail deterministically", () => {
  assert.equal(restrictionZoomTierForViewport(lowZoomViewport), "low");
  assert.equal(restrictionZoomTierForViewport(mediumZoomViewport), "medium");
  assert.equal(restrictionZoomTierForViewport(highZoomViewport), "high");
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering), [
    "osmRoadLabelsRequireQaOverlay",
    "oneWayArrowMinSpacingMeters",
    "longRoadArrowThresholdMeters",
    "mediumOneWayArrowSpacingMultiplier",
    "highOneWayArrowSpacingMultiplier",
    "lowDetailViewportScale",
    "highDetailViewportScale",
    "mediumOneWayMinRoadLengthMeters",
    "restrictionSymbolCollisionPadding",
    "reviewRestrictionProximityMeters",
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

test("Stage 150 one-way arrows prefer deterministic decision-point placement and zoom spacing", () => {
  const highItems = buildOneWayVisualItems(
    [
      {
        roadId: "long-decision-road",
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
      }
    ],
    { viewport: highZoomViewport }
  );
  const mediumItems = buildOneWayVisualItems(
    [
      {
        roadId: "long-decision-road",
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
      }
    ],
    { viewport: mediumZoomViewport }
  );

  assert.deepEqual(
    highItems.map((item) => item.point.x),
    [52.8, 167.2]
  );
  assert.ok(highItems[0].point.x < 220 * 0.3);
  assert.ok(highItems[1].point.x > 220 * 0.7);
  assert.deepEqual(
    mediumItems.map((item) => item.id),
    ["one-way:long-decision-road:0", "one-way:long-decision-road:1"]
  );
  assert.equal(
    TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay.mediumSpacingMultiplier,
    TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.mediumOneWayArrowSpacingMultiplier
  );
});

test("Stage 150 medium zoom spacing suppresses repeated one-way arrows on dense road groups", () => {
  const overlays: RoadRestrictionOverlay[] = [
    {
      roadId: "osm-way-1-segment-0",
      renderGroupId: "osm-way:1",
      kind: "one-way",
      label: "One-way",
      points: [
        { x: 0, y: 0 },
        { x: 80, y: 0 }
      ],
      midpoint: { x: 40, y: 0 },
      direction: {
        from: { x: 0, y: 0 },
        to: { x: 80, y: 0 }
      }
    },
    {
      roadId: "osm-way-1-segment-1",
      renderGroupId: "osm-way:1",
      kind: "one-way",
      label: "One-way",
      points: [
        { x: 70, y: 0 },
        { x: 150, y: 0 }
      ],
      midpoint: { x: 110, y: 0 },
      direction: {
        from: { x: 70, y: 0 },
        to: { x: 150, y: 0 }
      }
    }
  ];

  assert.deepEqual(
    buildOneWayVisualItems(overlays, { viewport: highZoomViewport }).map((item) => item.id),
    ["one-way:osm-way-1-segment-0:0", "one-way:osm-way-1-segment-1:0"]
  );
  assert.deepEqual(
    buildOneWayVisualItems(overlays, { viewport: mediumZoomViewport }).map((item) => item.id),
    ["one-way:osm-way-1-segment-0:0"]
  );
});

test("Stage 150 restriction symbols avoid learner reservations and preserve review issues", () => {
  const items = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays
  });
  const filtered = filterRestrictionMapVisualItemsForViewport(items, highZoomViewport, {
    reservedBoxes: [
      {
        id: "learner-route",
        minX: 48,
        minY: -18,
        maxX: 90,
        maxY: 18
      }
    ]
  });

  assert.equal(filtered.some((item) => item.id === "one-way:r-one-way:0"), false);
  assert.equal(filtered.some((item) => item.id === "one-way:r-one-way:1"), true);
  assert.deepEqual(
    filtered.filter((item) => item.kind === "missed-restriction" || item.kind === "illegal-movement").map((item) => item.kind),
    ["missed-restriction", "illegal-movement"]
  );
});

test("Stage 150 restriction markers are collision-filtered with stable priority", () => {
  const overlappingItems = buildRestrictionMapVisualItems({
    roadRestrictionOverlays: [
      {
        roadId: "r-no-entry-a",
        kind: "no-entry",
        label: "No entry A",
        points: [
          { x: 100, y: 100 },
          { x: 140, y: 100 }
        ],
        midpoint: { x: 120, y: 100 },
        direction: {
          from: { x: 100, y: 100 },
          to: { x: 140, y: 100 }
        }
      },
      {
        roadId: "r-restricted-b",
        kind: "restricted",
        label: "Restricted road B",
        points: [
          { x: 112, y: 100 },
          { x: 152, y: 100 }
        ],
        midpoint: { x: 132, y: 100 }
      }
    ],
    turnRestrictionVisuals: [],
    routeIssueOverlays: []
  });

  assert.deepEqual(
    filterRestrictionMapVisualItemsForViewport(overlappingItems, highZoomViewport).map((item) => item.id),
    ["restricted-road:r-restricted-b:0"]
  );
});

test("Stage 150 empty restriction data does not invent map symbols", () => {
  assert.deepEqual(
    buildRestrictionMapVisualItems({
      roadRestrictionOverlays: [],
      turnRestrictionVisuals: [],
      routeIssueOverlays: []
    }),
    []
  );
});

test("Stage 149 route review symbols stay top-priority and use review marker tokens", () => {
  const items = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays
  });
  const reviewItems = filterRestrictionMapVisualItemsForViewport(items, lowZoomViewport).filter(
    (item) => item.kind === "missed-restriction" || item.kind === "illegal-movement"
  );

  assert.deepEqual(reviewItems.map((item) => item.kind), ["missed-restriction", "illegal-movement"]);
  assert.deepEqual(
    reviewItems.map((item) => restrictionMapVisualStyleForViewport(item, lowZoomViewport)),
    [
      { alpha: 1, scale: 1 },
      { alpha: 1, scale: 1 }
    ]
  );
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.review.routeIssue.markerRadius > TOPOPASS_STREET_ATLAS_STYLE.nodes.radius);
  assert.ok(TOPOPASS_STREET_ATLAS_STYLE.review.routeIssue.reservationPadding > TOPOPASS_STREET_ATLAS_STYLE.labels.collision.defaultPadding);
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
      "missed-restriction",
      "illegal-movement"
    ]
  );
});

test("Stage 147 medium zoom shows useful restriction symbols and reduces their style", () => {
  const items = buildRestrictionMapVisualItems({
    roadRestrictionOverlays: [
      roadRestrictionOverlays[0],
      {
        ...roadRestrictionOverlays[1],
        points: [
          { x: 500, y: 0 },
          { x: 500, y: 100 }
        ],
        midpoint: { x: 500, y: 50 },
        direction: {
          from: { x: 500, y: 0 },
          to: { x: 500, y: 100 }
        }
      }
    ],
    turnRestrictionVisuals: [],
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

test("Stage 161.6.9 restriction and one-way symbols scale at very high zoom without changing review markers", () => {
  const items = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays
  });
  const oneWayItem = items.find((item) => item.kind === "one-way");
  const noEntryItem = items.find((item) => item.kind === "no-entry");
  const reviewItem = items.find((item) => item.kind === "illegal-movement");

  assert.ok(oneWayItem);
  assert.ok(noEntryItem);
  assert.ok(reviewItem);
  assert.ok(
    restrictionMapVisualStyleForViewport(oneWayItem, veryHighZoomViewport).scale >
      restrictionMapVisualStyleForViewport(oneWayItem, highZoomViewport).scale
  );
  assert.ok(
    restrictionMapVisualStyleForViewport(noEntryItem, veryHighZoomViewport).scale <=
      TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.highRestrictionSymbolScale *
        TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale.restrictionMaxMultiplier
  );
  assert.deepEqual(restrictionMapVisualStyleForViewport(reviewItem, veryHighZoomViewport), {
    alpha: 1,
    scale: 1
  });
});

test("Stage 161.6.8 explicit semantic zoom scales base restriction symbols at fixed viewport size", () => {
  const items = buildRestrictionMapVisualItems({
    roadRestrictionOverlays,
    turnRestrictionVisuals: [turnVisual()],
    routeIssueOverlays
  });
  const oneWayItem = items.find((item) => item.kind === "one-way");
  const reviewItem = items.find((item) => item.kind === "illegal-movement");

  assert.ok(oneWayItem);
  assert.ok(reviewItem);
  assert.ok(
    restrictionMapVisualStyleForViewport(oneWayItem, highZoomViewport, ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom).scale >
      restrictionMapVisualStyleForViewport(oneWayItem, highZoomViewport, 1).scale
  );
  assert.deepEqual(restrictionMapVisualStyleForViewport(reviewItem, highZoomViewport, ROUTE_RUNNER_MAP_ZOOM_LIMITS.maxZoom), {
    alpha: 1,
    scale: 1
  });
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
      "major-road",
      "secondary-road",
      "local-side-streets",
      "highlighted-routable-roads",
      "context-roads",
      "your-route",
      "shortest-legal-route",
      "accepted-alternative-route",
      "illegal-movement",
      "missed-checkpoint",
      "no-entry",
      "one-way",
      "no-left-turn",
      "no-right-turn",
      "no-u-turn",
      "restricted-road",
      "selected-focus",
      "start",
      "checkpoint",
      "finish",
      "park",
      "water",
      "rail",
      "station"
    ]
  );
  assert.equal(legend.find((item) => item.id === "your-route")?.label, "Attempted route");
  assert.equal(legend.find((item) => item.id === "no-left-turn")?.label, "No left turn");
  assert.equal(legend.find((item) => item.id === "no-right-turn")?.label, "No right turn");
  assert.equal(legend.find((item) => item.id === "no-u-turn")?.label, "No U-turn");
  assert.ok(
    legend.every((item) => !/\b(osm|relation|way id|node id|road id|graph id)\b/i.test(`${item.label} ${item.description}`))
  );
});
