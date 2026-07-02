import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSyntheticBackgroundFeatures,
  buildSyntheticLandmarkVisuals,
  buildSyntheticLinearFeatures,
  buildSyntheticMapLabels,
  buildSyntheticRoadVisuals,
  buildSyntheticRouteOverlayVisuals,
  buildSyntheticStreetMapLegendItems,
  deriveOsmRoadRenderMetadata,
  deriveOsmRoadVisualHierarchy,
  deriveRoadLabelPosition,
  deriveSyntheticRoadClass,
  roadRenderRank,
  roadStyleForOsmHierarchy,
  roadStyleForSyntheticClass,
  sortRoadVisualsForBaseRender
} from "./syntheticStreetMapRenderer.ts";
import { ROUTE_RUNNER_MAP_ZOOM_LIMITS } from "./mapViewport.ts";
import { ONE_WAY_ARROW_MIN_SPACING_METERS } from "./restrictionMapVisuals.ts";
import { TOPOPASS_STREET_ATLAS_STYLE } from "./topopassCartographyStyle.ts";
import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  type MapDefinition
} from "../../../lib/map-engine/index.ts";
import { convertOverpassJsonToRouteMap, type OverpassJsonResponse } from "../../../lib/map-engine/osm/index.ts";
import { mediumLondonOsmRouteExercises, mediumLondonOsmRouteMap } from "./routeRunnerMaps.ts";

function assertPrimitiveRenderValues(value: unknown, path = "style"): void {
  if (Array.isArray(value)) {
    assert.ok(value.length > 0, `${path} should not be an empty token array`);
    value.forEach((item, index) => assertPrimitiveRenderValues(item, `${path}[${index}]`));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => assertPrimitiveRenderValues(item, `${path}.${key}`));
    return;
  }

  assert.ok(
    typeof value === "string" || typeof value === "number" || typeof value === "boolean",
    `${path} should be a primitive render token`
  );

  if (typeof value === "number") {
    assert.ok(Number.isFinite(value), `${path} should be finite`);
  }
}

test("Stage 142 exposes a central TOPOPASS street-atlas style token object", () => {
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.roads.osm.primary.strokeColor, "#d99a22");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.roads.synthetic.major.strokeColor, "#d99a22");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.labels.road.font, "600 11px Arial, sans-serif");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.background.park.garden.fillColor, "#dbe9cd");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.rail.strokeColor, "#6b7280");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.station.strokeColor, "#dc2626");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.start.fillColor, "#15803d");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.destination.fillColor, "#6d28d9");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.checkpoint.fillColor, "#f97316");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.hints.snapPreview.strokeColor, "#22c55e");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay.color, "#1d4ed8");
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.review.fastestRoute.route.strokeColor, "#0284c7");
});

test("Stage 142 road hierarchy route restriction and one-way token groups are complete", () => {
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.roads.osm), [
    "primary",
    "secondary",
    "tertiary",
    "residential",
    "service",
    "pedestrian",
    "restricted",
    "inactive",
    "unknown"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.roads.synthetic), [
    "major",
    "secondary",
    "oneWay",
    "noEntry",
    "restricted",
    "service",
    "local"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.routeOverlays), [
    "rawRoute",
    "snappedRoute",
    "matchedRoute",
    "shortestLegalRoute",
    "illegalMovement"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.roads.roadCasings), [
    "activeColor",
    "quietColor",
    "restrictedColor"
  ]);
  assert.deepEqual(Object.keys(TOPOPASS_STREET_ATLAS_STYLE.roads.zoomScaledWidths), [
    "referenceZoom",
    "minMultiplier",
    "maxMultiplier"
  ]);
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay.minSpacingMeters, 50);
  assert.equal(TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay.longRoadArrowThresholdMeters, 180);
});

test("Stage 142 zoom and decluttering tokens are ordered finite and used by helpers", () => {
  const thresholds = TOPOPASS_STREET_ATLAS_STYLE.zoom.thresholds;

  assert.ok(thresholds.minZoom < thresholds.defaultZoom);
  assert.ok(thresholds.defaultZoom < thresholds.maxZoom);
  assert.ok(thresholds.step > 0);
  assert.ok(thresholds.panMargin >= 0);
  assert.deepEqual(ROUTE_RUNNER_MAP_ZOOM_LIMITS, thresholds);
  assert.equal(
    ONE_WAY_ARROW_MIN_SPACING_METERS,
    TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.oneWayArrowMinSpacingMeters
  );
});

test("Stage 142 style tokens are deterministic primitive render values", () => {
  assertPrimitiveRenderValues(TOPOPASS_STREET_ATLAS_STYLE);
  assert.deepEqual(TOPOPASS_STREET_ATLAS_STYLE, TOPOPASS_STREET_ATLAS_STYLE);
});

test("Stage 142 tokenized renderer helpers preserve existing style values", () => {
  assert.deepEqual(roadStyleForOsmHierarchy("primary"), {
    casingColor: "#fff2c7",
    strokeColor: "#d99a22",
    casingWidth: 19,
    strokeWidth: 10.5
  });
  assert.deepEqual(roadStyleForSyntheticClass("restricted"), {
    casingColor: "#e2caa6",
    strokeColor: "#e9bd73",
    casingWidth: 9,
    strokeWidth: 4,
    dash: [9, 7],
    alpha: 0.72
  });
  assert.deepEqual(
    buildSyntheticRouteOverlayVisuals({
      rawRoutePoints: [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ],
      shortestLegalRoutePoints: [
        { x: 0, y: 4 },
        { x: 10, y: 4 }
      ]
    }),
    [
      {
        id: "raw-route",
        kind: "raw-route",
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ],
        strokeColor: "#f97316",
        strokeWidth: 4
      },
      {
        id: "shortest-legal-route",
        kind: "shortest-legal-route",
        points: [
          { x: 0, y: 4 },
          { x: 10, y: 4 }
        ],
        strokeColor: "#0ea5e9",
        strokeWidth: 4,
        dash: [10, 6]
      }
    ]
  );
});

test("deriveSyntheticRoadClass applies hierarchy and restriction-safe classes", () => {
  const oneWayRoad = marloweDistrictMap.roads.find((road) => road.id === "r04");
  const noEntryRoad = marloweDistrictMap.roads.find((road) => road.id === "r12");
  const majorRoad = marloweDistrictMap.roads.find((road) => road.id === "r22");
  const serviceRoad = marloweDistrictMap.roads.find((road) => road.id === "r01");

  if (!oneWayRoad || !noEntryRoad || !majorRoad || !serviceRoad) {
    throw new Error("Expected Marlowe fixture roads.");
  }

  assert.equal(deriveSyntheticRoadClass(marloweDistrictMap, oneWayRoad), "one-way");
  assert.equal(deriveSyntheticRoadClass(marloweDistrictMap, noEntryRoad), "no-entry");
  assert.equal(deriveSyntheticRoadClass(marloweDistrictMap, majorRoad), "major");
  assert.equal(deriveSyntheticRoadClass(marloweDistrictMap, serviceRoad), "service");
});

test("deriveSyntheticRoadClass marks closed roads as renderer-only restricted roads", () => {
  const closedRoadMap: MapDefinition = {
    id: "closed-road-test",
    name: "Closed Road Test",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 10, y: 0 }
    ],
    roads: [
      {
        id: "closed-road",
        fromNodeId: "a",
        toNodeId: "b",
        distanceMeters: 10,
        isOneWay: false,
        name: "Closed Road"
      }
    ],
    restrictions: [{ id: "closed", type: "road_closed", roadId: "closed-road" }],
    landmarks: []
  };

  assert.equal(deriveSyntheticRoadClass(closedRoadMap, closedRoadMap.roads[0]), "restricted");
  assert.deepEqual(roadStyleForSyntheticClass("restricted").dash, [9, 7]);
});

test("buildSyntheticRoadVisuals creates deterministic road visual items", () => {
  const visuals = buildSyntheticRoadVisuals(marloweDistrictMap);
  const stationRow = visuals.find((visual) => visual.roadId === "r14");

  assert.equal(visuals.length, marloweDistrictMap.roads.length);
  assert.ok(stationRow);
  assert.equal(stationRow?.name, "Station Row");
  assert.equal(stationRow?.hasNoEntryRestriction, true);
  assert.equal(stationRow?.points.length, 2);
  assert.equal(typeof stationRow?.labelAngleRadians, "number");
});

test("deriveRoadLabelPosition returns road midpoint and angle", () => {
  const road = marloweDistrictMap.roads.find((candidate) => candidate.id === "r03");

  if (!road) {
    throw new Error("Expected road r03.");
  }

  const label = deriveRoadLabelPosition(marloweDistrictMap, road);

  assert.ok(label);
  assert.deepEqual(label?.point, { x: 320, y: 170 });
  assert.equal(label?.angleRadians, 0);
});

test("buildSyntheticMapLabels includes road area start checkpoint and finish labels", () => {
  const exercise = marloweDistrictRouteExercises.find((candidate) => candidate.id === "ex-library-market-museum");

  if (!exercise) {
    throw new Error("Expected checkpoint route exercise.");
  }

  const labels = buildSyntheticMapLabels(marloweDistrictMap, exercise);

  assert.ok(labels.some((label) => label.kind === "road" && label.text === "Station Row"));
  assert.ok(labels.some((label) => label.kind === "area" && label.text === "Market Quarter"));
  assert.ok(labels.some((label) => label.kind === "landmark" && label.text === "Fox Lane Station"));
  assert.ok(labels.some((label) => label.kind === "start" && label.text === "START"));
  assert.ok(labels.some((label) => label.kind === "checkpoint" && label.text === "CHECKPOINT 1"));
  assert.ok(labels.some((label) => label.kind === "finish" && label.text === "FINISH"));
});

test("synthetic background features are visual only and do not overlap routable ids", () => {
  const features = buildSyntheticBackgroundFeatures(marloweDistrictMap);
  const routableIds = new Set([
    ...marloweDistrictMap.nodes.map((node) => node.id),
    ...marloweDistrictMap.roads.map((road) => road.id)
  ]);
  const labels = features.map((feature) => feature.label);

  assert.ok(features.length >= 7);
  assert.ok(features.some((feature) => feature.kind === "water"));
  assert.ok(features.some((feature) => feature.kind === "park"));
  assert.ok(labels.includes("Station Quarter"));
  assert.ok(labels.includes("Canal Basin"));
  assert.ok(labels.includes("Goods Yard"));
  assert.ok(labels.includes("Civic Quarter"));
  assert.ok(features.every((feature) => feature.routable === false));
  assert.ok(features.every((feature) => !routableIds.has(feature.id)));
});

test("synthetic road styling keeps a clear London-inspired hierarchy", () => {
  const majorStyle = roadStyleForSyntheticClass("major");
  const localStyle = roadStyleForSyntheticClass("local");
  const serviceStyle = roadStyleForSyntheticClass("service");
  const oneWayStyle = roadStyleForSyntheticClass("one-way");

  assert.ok(majorStyle.casingWidth > localStyle.casingWidth);
  assert.ok(localStyle.strokeWidth > serviceStyle.strokeWidth);
  assert.equal(oneWayStyle.strokeColor, "#8bbcdf");
});

test("converted OSM road visuals expose deterministic hierarchy metadata", () => {
  const visuals = buildSyntheticRoadVisuals(mediumLondonOsmRouteMap);
  const eustonRoad = visuals.find((visual) => visual.name === "Euston Road");
  const storeStreet = visuals.find((visual) => visual.name === "Store Street");

  assert.ok(eustonRoad);
  assert.ok(storeStreet);
  assert.equal(eustonRoad.source, "osm");
  assert.equal(eustonRoad.osmHighway, "primary");
  assert.equal(eustonRoad.osmHierarchy, "primary");
  assert.equal(eustonRoad.roadClass, "major");
  assert.equal(storeStreet.osmHighway, "service");
  assert.equal(storeStreet.osmHierarchy, "service");
  assert.ok(eustonRoad.style.strokeWidth > storeStreet.style.strokeWidth);
});

test("converted OSM hierarchy maps to expected road style widths", () => {
  assert.ok(roadStyleForOsmHierarchy("primary").strokeWidth > roadStyleForOsmHierarchy("secondary").strokeWidth);
  assert.ok(roadStyleForOsmHierarchy("secondary").strokeWidth > roadStyleForOsmHierarchy("tertiary").strokeWidth);
  assert.ok(roadStyleForOsmHierarchy("tertiary").strokeWidth > roadStyleForOsmHierarchy("residential").strokeWidth);
  assert.ok(roadStyleForOsmHierarchy("residential").strokeWidth > roadStyleForOsmHierarchy("service").strokeWidth);
  assert.ok(roadStyleForOsmHierarchy("service").strokeWidth > roadStyleForOsmHierarchy("pedestrian").strokeWidth);
  assert.ok((roadStyleForOsmHierarchy("inactive").alpha ?? 1) < (roadStyleForOsmHierarchy("residential").alpha ?? 1));
});

test("Stage 144 road hierarchy ranks base roads below learner overlays", () => {
  assert.ok(roadRenderRank({ roadClass: "service", osmHierarchy: "service" }) < roadRenderRank({ roadClass: "local" }));
  assert.ok(roadRenderRank({ roadClass: "local", osmHierarchy: "residential" }) < roadRenderRank({ roadClass: "secondary", osmHierarchy: "tertiary" }));
  assert.ok(roadRenderRank({ roadClass: "secondary", osmHierarchy: "tertiary" }) < roadRenderRank({ roadClass: "secondary", osmHierarchy: "secondary" }));
  assert.ok(roadRenderRank({ roadClass: "secondary", osmHierarchy: "secondary" }) < roadRenderRank({ roadClass: "major", osmHierarchy: "primary" }));

  assert.deepEqual(
    buildSyntheticRouteOverlayVisuals({
      matchedRoutePoints: [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ]
    }).map((overlay) => overlay.kind),
    ["matched-route"]
  );
});

test("Stage 144 road visual sorting draws quieter roads before major roads", () => {
  const visuals = buildSyntheticRoadVisuals(mediumLondonOsmRouteMap);
  const ordered = sortRoadVisualsForBaseRender(visuals);
  const primaryIndex = ordered.findIndex((visual) => visual.osmHierarchy === "primary");
  const serviceIndex = ordered.findIndex((visual) => visual.osmHierarchy === "service");

  assert.ok(primaryIndex >= 0);
  assert.ok(serviceIndex >= 0);
  assert.ok(serviceIndex < primaryIndex);
});

test("Stage 143 OSM context rendering uses raw fixture tags without adding routable graph features", () => {
  const contextFixture: OverpassJsonResponse = {
    elements: [
      { type: "node", id: 1, lat: 51.52, lon: -0.14 },
      { type: "node", id: 2, lat: 51.52, lon: -0.139 },
      { type: "node", id: 3, lat: 51.52008, lon: -0.1399 },
      { type: "node", id: 4, lat: 51.52008, lon: -0.1397 },
      { type: "node", id: 5, lat: 51.51992, lon: -0.1397 },
      { type: "node", id: 6, lat: 51.51992, lon: -0.1399 },
      { type: "node", id: 7, lat: 51.52006, lon: -0.13945 },
      { type: "node", id: 8, lat: 51.52006, lon: -0.13925 },
      { type: "node", id: 9, lat: 51.51994, lon: -0.13925 },
      { type: "node", id: 10, lat: 51.51994, lon: -0.13945 },
      { type: "node", id: 11, lat: 51.5199, lon: -0.13995 },
      { type: "node", id: 12, lat: 51.5201, lon: -0.13925 },
      { type: "node", id: 13, lat: 51.51986, lon: -0.1398 },
      { type: "node", id: 14, lat: 51.52012, lon: -0.1396 },
      { type: "way", id: 100, nodes: [1, 2], tags: { highway: "residential", name: "Context Road" } },
      { type: "way", id: 200, nodes: [3, 4, 5, 6, 3], tags: { leisure: "park", name: "Fitzroy Garden" } },
      { type: "way", id: 201, nodes: [7, 8, 9, 10, 7], tags: { natural: "water", name: "Pilot Basin" } },
      { type: "way", id: 202, nodes: [11, 12], tags: { railway: "rail", name: "Main Line" } },
      { type: "way", id: 203, nodes: [13, 14], tags: { waterway: "canal", name: "Pilot Cut" } }
    ]
  };
  const converted = convertOverpassJsonToRouteMap(contextFixture, {
    mapId: "stage-143-context-map",
    name: "Stage 143 Context Map"
  });

  if (!converted.ok) {
    throw new Error(`Expected context fixture to convert: ${converted.errors.join("; ")}`);
  }

  const backgroundFeatures = buildSyntheticBackgroundFeatures(converted.map, {
    sourceOverpassFixture: contextFixture
  });
  const linearFeatures = buildSyntheticLinearFeatures(converted.map, {
    sourceOverpassFixture: contextFixture
  });
  const areaLabels = buildSyntheticMapLabels(converted.map, undefined, {
    backgroundFeatures
  }).filter((label) => label.kind === "area");

  assert.equal(converted.map.roads.length, 1);
  assert.deepEqual(
    backgroundFeatures.map((feature) => [feature.kind, feature.label]),
    [
      ["park", "Fitzroy Garden"],
      ["water", "Pilot Basin"]
    ]
  );
  assert.deepEqual(
    linearFeatures.map((feature) => [feature.kind, feature.label, feature.routable]),
    [
      ["rail", "Main Line", false],
      ["waterway", "Pilot Cut", false]
    ]
  );
  assert.ok(areaLabels.some((label) => label.text === "Fitzroy Garden"));
  assert.ok(backgroundFeatures.every((feature) => feature.routable === false));
});

test("converted OSM road labels are optional and deduplicated by road name", () => {
  const hiddenLabels = buildSyntheticMapLabels(mediumLondonOsmRouteMap, mediumLondonOsmRouteExercises[0]);
  const visibleLabels = buildSyntheticMapLabels(mediumLondonOsmRouteMap, mediumLondonOsmRouteExercises[0], {
    includeOsmRoadLabels: true
  });
  const eustonRoadLabels = visibleLabels.filter((label) => label.kind === "road" && label.text === "Euston Road");

  assert.equal(hiddenLabels.some((label) => label.kind === "road" && label.text === "Euston Road"), false);
  assert.equal(eustonRoadLabels.length, 1);
  assert.deepEqual(eustonRoadLabels[0], {
    id: "road-label-osm-euston-road",
    kind: "road",
    text: "Euston Road",
    point: { x: -267.166778, y: -322.105622 },
    angleRadians: 0,
    priority: 3
  });
});

test("unnamed converted OSM roads do not crash label generation", () => {
  const unnamedOsmMap: MapDefinition = {
    id: "unnamed-osm-map",
    name: "Unnamed OSM map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 20, y: 0 }
    ],
    roads: [
      {
        id: "osm-way-1-segment-0",
        fromNodeId: "a",
        toNodeId: "b",
        distanceMeters: 20,
        isOneWay: false,
        metadata: {
          source: "osm",
          osmWayId: 1,
          highway: "residential"
        }
      }
    ],
    restrictions: [],
    landmarks: []
  } as MapDefinition;

  assert.equal(deriveOsmRoadVisualHierarchy(unnamedOsmMap.roads[0]), "residential");
  assert.deepEqual(deriveOsmRoadRenderMetadata(unnamedOsmMap.roads[0]), {
    source: "osm",
    highway: "residential",
    hierarchy: "residential",
    osmWayId: "1"
  });
  assert.deepEqual(
    buildSyntheticMapLabels(unnamedOsmMap, undefined, { includeOsmRoadLabels: true }).filter(
      (label) => label.kind === "road"
    ),
    []
  );
});

test("synthetic rail/context features are visual only and deterministic", () => {
  const features = buildSyntheticLinearFeatures(marloweDistrictMap);

  assert.deepEqual(
    features.map((feature) => feature.id),
    ["marlowe-rail-approach"]
  );
  assert.equal(features[0].kind, "rail");
  assert.equal(features[0].routable, false);
  assert.ok(features[0].points.length >= 4);
  assert.ok(features[0].casingWidth > features[0].strokeWidth);
});

test("synthetic landmark visuals classify useful London-style context markers", () => {
  const exercise = marloweDistrictRouteExercises.find((candidate) => candidate.id === "ex-station-to-hospital");

  if (!exercise) {
    throw new Error("Expected station-to-hospital exercise.");
  }

  const visuals = buildSyntheticLandmarkVisuals(marloweDistrictMap, exercise);
  const station = visuals.find((visual) => visual.id === "lm-fox-lane-station");
  const hospital = visuals.find((visual) => visual.id === "lm-northgate-hospital");
  const church = visuals.find((visual) => visual.id === "lm-st-anselm-church");

  assert.equal(station?.kind, "station");
  assert.equal(station?.isExerciseStop, true);
  assert.equal(station?.routable, false);
  assert.equal(hospital?.kind, "hospital");
  assert.equal(hospital?.isExerciseStop, true);
  assert.equal(church?.kind, "church");
});

test("buildSyntheticRouteOverlayVisuals creates route overlay visual models", () => {
  const overlays = buildSyntheticRouteOverlayVisuals({
    rawRoutePoints: [
      { x: 0, y: 0 },
      { x: 10, y: 0 }
    ],
    matchedRoutePoints: [
      { x: 0, y: 2 },
      { x: 10, y: 2 }
    ],
    shortestLegalRoutePoints: [
      { x: 0, y: 4 },
      { x: 10, y: 4 }
    ]
  });

  assert.deepEqual(
    overlays.map((overlay) => overlay.kind),
    ["raw-route", "matched-route", "shortest-legal-route"]
  );
  assert.equal(overlays.find((overlay) => overlay.kind === "shortest-legal-route")?.dash?.length, 2);
});

test("synthetic street map legend covers route restrictions stops and background", () => {
  const legendItems = buildSyntheticStreetMapLegendItems();
  const ids = legendItems.map((item) => item.id);

  assert.ok(ids.includes("major-road"));
  assert.ok(ids.includes("context-road"));
  assert.ok(ids.includes("your-route"));
  assert.ok(ids.includes("shortest-legal-route"));
  assert.ok(ids.includes("illegal-movement"));
  assert.ok(ids.includes("no-entry"));
  assert.ok(ids.includes("one-way"));
  assert.ok(ids.includes("prohibited-turn"));
  assert.ok(ids.includes("restricted-road"));
  assert.ok(ids.includes("start"));
  assert.ok(ids.includes("checkpoint"));
  assert.ok(ids.includes("finish"));
  assert.ok(ids.includes("background"));
});
