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
  deriveRoadLabelPosition,
  deriveSyntheticRoadClass,
  roadStyleForSyntheticClass
} from "./syntheticStreetMapRenderer.ts";
import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  type MapDefinition
} from "../../../lib/map-engine/index.ts";

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
  assert.deepEqual(roadStyleForSyntheticClass("restricted").dash, [10, 6]);
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
  assert.equal(oneWayStyle.strokeColor, "#bfdbfe");
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
