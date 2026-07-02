import type {
  MapDefinition,
  MapRestriction,
  RouteExercise
} from "../../../lib/map-engine/index.ts";
import {
  convertOverpassJsonToRouteMap,
  type OsmRouteGraphMapDefinition,
  type OverpassJsonResponse
} from "../../../lib/map-engine/osm/index.ts";

export const PHASE_6_VISUAL_QA_MAP_ID = "osm-phase-6-real-london-visual-qa";
export const PHASE_6_VISUAL_QA_FIXTURE_NAME = "syntheticPhase6VisualQaOverpassFixture";

export const phase6RealLondonVisualQaOverpassFixture: OverpassJsonResponse = {
  elements: [
    { type: "node", id: 1001, lat: 51.5228, lon: -0.1324 },
    { type: "node", id: 1002, lat: 51.5228, lon: -0.1312 },
    { type: "node", id: 1003, lat: 51.5228, lon: -0.13 },
    { type: "node", id: 1004, lat: 51.5228, lon: -0.1288 },
    { type: "node", id: 1005, lat: 51.5228, lon: -0.1276 },
    { type: "node", id: 1011, lat: 51.522, lon: -0.1324 },
    { type: "node", id: 1012, lat: 51.522, lon: -0.1312 },
    { type: "node", id: 1013, lat: 51.522, lon: -0.13 },
    { type: "node", id: 1014, lat: 51.522, lon: -0.1288 },
    { type: "node", id: 1015, lat: 51.522, lon: -0.1276 },
    { type: "node", id: 1021, lat: 51.5212, lon: -0.1324 },
    { type: "node", id: 1022, lat: 51.5212, lon: -0.1312 },
    { type: "node", id: 1023, lat: 51.5212, lon: -0.13 },
    { type: "node", id: 1024, lat: 51.5212, lon: -0.1288 },
    { type: "node", id: 1025, lat: 51.5212, lon: -0.1276 },
    { type: "node", id: 1031, lat: 51.5204, lon: -0.1324 },
    { type: "node", id: 1032, lat: 51.5204, lon: -0.1312 },
    { type: "node", id: 1033, lat: 51.5204, lon: -0.13 },
    { type: "node", id: 1034, lat: 51.5204, lon: -0.1288 },
    { type: "node", id: 1035, lat: 51.5204, lon: -0.1276 },
    { type: "node", id: 1041, lat: 51.5196, lon: -0.1324 },
    { type: "node", id: 1042, lat: 51.5196, lon: -0.1312 },
    { type: "node", id: 1043, lat: 51.5196, lon: -0.13 },
    { type: "node", id: 1044, lat: 51.5196, lon: -0.1288 },
    { type: "node", id: 1045, lat: 51.5196, lon: -0.1276 },
    { type: "node", id: 1101, lat: 51.52095, lon: -0.1319 },
    { type: "node", id: 1102, lat: 51.52095, lon: -0.13145 },
    { type: "node", id: 1103, lat: 51.52062, lon: -0.13145 },
    { type: "node", id: 1104, lat: 51.52062, lon: -0.1319 },
    { type: "node", id: 1201, lat: 51.52195, lon: -0.12855 },
    { type: "node", id: 1202, lat: 51.52195, lon: -0.12795 },
    { type: "node", id: 1203, lat: 51.52145, lon: -0.12795 },
    { type: "node", id: 1204, lat: 51.52145, lon: -0.12855 },
    { type: "node", id: 1301, lat: 51.52095, lon: -0.12855 },
    { type: "node", id: 1302, lat: 51.52095, lon: -0.12795 },
    { type: "node", id: 1303, lat: 51.52055, lon: -0.12795 },
    { type: "node", id: 1304, lat: 51.52055, lon: -0.12855 },
    { type: "node", id: 1311, lat: 51.521, lon: -0.1321 },
    { type: "node", id: 1312, lat: 51.52065, lon: -0.1279 },
    { type: "node", id: 1401, lat: 51.52335, lon: -0.1326 },
    { type: "node", id: 1402, lat: 51.52315, lon: -0.1274 },
    { type: "node", id: 1410, lat: 51.52215, lon: -0.13105, tags: { railway: "station", name: "QA Central Station" } },
    { type: "node", id: 1420, lat: 51.5219, lon: -0.12935, tags: { amenity: "library", name: "QA Library" } },
    { type: "node", id: 1421, lat: 51.5207, lon: -0.12905, tags: { amenity: "hospital", name: "QA Hospital" } },
    { type: "node", id: 1430, lat: 51.5217, lon: -0.1297, tags: { place: "neighbourhood", name: "QA Fitzrovia" } },
    { type: "way", id: 9001, nodes: [1001, 1002, 1003, 1004, 1005], tags: { highway: "primary", name: "QA Euston Avenue" } },
    { type: "way", id: 9002, nodes: [1003, 1013, 1023, 1033, 1043], tags: { highway: "secondary", name: "QA Gower Street", oneway: "yes" } },
    { type: "way", id: 9003, nodes: [1005, 1015, 1025, 1035, 1045], tags: { highway: "tertiary", name: "QA Tottenham Court Road" } },
    { type: "way", id: 9004, nodes: [1011, 1012, 1013, 1014, 1015], tags: { highway: "residential", name: "QA Torrington Place", oneway: "yes" } },
    { type: "way", id: 9005, nodes: [1021, 1022, 1023, 1024, 1025], tags: { highway: "residential", name: "QA Chenies Street" } },
    { type: "way", id: 9006, nodes: [1031, 1032, 1033, 1034, 1035], tags: { highway: "secondary", bridge: "yes", name: "QA Bridge Street" } },
    { type: "way", id: 9007, nodes: [1002, 1012, 1022, 1032, 1042], tags: { highway: "residential", name: "QA Museum Street" } },
    { type: "way", id: 9008, nodes: [1041, 1042, 1043, 1044, 1045], tags: { highway: "service", name: "QA Market Lane", vehicle: "no" } },
    { type: "way", id: 9009, nodes: [1011, 1022, 1033, 1044], tags: { highway: "residential", name: "QA Court Link" } },
    { type: "way", id: 9010, nodes: [1015, 1024, 1033], tags: { highway: "residential", name: "QA Crescent" } },
    { type: "way", id: 9011, nodes: [1101, 1102, 1103, 1104, 1101], tags: { highway: "pedestrian", area: "yes", name: "QA Pedestrian Square" } },
    { type: "way", id: 9101, nodes: [1401, 1402], tags: { railway: "rail", name: "QA North Line" } },
    { type: "way", id: 9201, nodes: [1201, 1202, 1203, 1204, 1201], tags: { leisure: "park", name: "QA Garden" } },
    { type: "way", id: 9202, nodes: [1301, 1302, 1303, 1304, 1301], tags: { natural: "water", name: "QA Basin" } },
    { type: "way", id: 9203, nodes: [1311, 1312], tags: { waterway: "canal", name: "QA Cut" } }
  ]
};

const prohibitedTurnRestriction: Extract<MapRestriction, { type: "prohibited_turn" }> = {
  id: "qa-no-right-chenies-to-gower",
  type: "prohibited_turn",
  fromRoadId: "osm-way-9005-segment-1",
  viaNodeId: "osm-node-1023",
  toRoadId: "osm-way-9002-segment-2",
  reason: "Synthetic QA no right turn from QA Chenies Street into QA Gower Street"
};

function buildPhase6RealLondonVisualQaMap(): OsmRouteGraphMapDefinition {
  const result = convertOverpassJsonToRouteMap(phase6RealLondonVisualQaOverpassFixture, {
    mapId: PHASE_6_VISUAL_QA_MAP_ID,
    name: "Phase 6 Real London visual QA scenario",
    description: "Dev-only synthetic OSM-style fixture for combined Phase 6 map readability QA.",
    version: 1
  });

  if (!result.ok) {
    throw new Error(`Unable to build Phase 6 visual QA fixture map: ${result.errors.join("; ")}`);
  }

  return {
    ...result.map,
    restrictions: [...result.map.restrictions, prohibitedTurnRestriction]
  };
}

export const phase6RealLondonVisualQaRouteMap = buildPhase6RealLondonVisualQaMap();

export const phase6RealLondonVisualQaRouteExercises: RouteExercise[] = [
  {
    id: "osm-phase-6-visual-qa-checkpoint-route",
    title: "Phase 6 visual QA: objective overlay route",
    mapId: phase6RealLondonVisualQaRouteMap.id,
    description:
      "Synthetic QA route for checking dense-road styling, objective markers, optional hints, context labels, one-way arrows, and restriction warnings together.",
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-1011",
        label: "QA start"
      },
      {
        type: "node",
        nodeId: "osm-node-1023",
        label: "QA required via point"
      },
      {
        type: "node",
        nodeId: "osm-node-1034",
        label: "QA checkpoint"
      },
      {
        type: "node",
        nodeId: "osm-node-1045",
        label: "QA destination"
      }
    ]
  }
];

export function buildPhase6VisualQaScenarioSummary(map: MapDefinition = phase6RealLondonVisualQaRouteMap) {
  return {
    mapId: map.id,
    roadCount: map.roads.length,
    nodeCount: map.nodes.length,
    restrictionCount: map.restrictions.length,
    exerciseCount: phase6RealLondonVisualQaRouteExercises.length,
    fixtureName: PHASE_6_VISUAL_QA_FIXTURE_NAME,
    synthetic: true
  };
}
