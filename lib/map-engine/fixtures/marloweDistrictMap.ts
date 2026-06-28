import type { MapDefinition, RouteExercise } from "../types.ts";

const MARLOWE_DISTRICT_MAP_ID = "marlowe-district-dev-map";

export const marloweDistrictMap: MapDefinition = {
  id: MARLOWE_DISTRICT_MAP_ID,
  name: "Marlowe District",
  version: 1,
  description: "Fictional London-feel development map for route-engine testing.",
  nodes: [
    { id: "n01", x: 0, y: 220, label: "West Gate" },
    { id: "n02", x: 120, y: 190, label: "Westbourne Library" },
    { id: "n03", x: 260, y: 170, label: "Albion Square NW" },
    { id: "n04", x: 380, y: 170, label: "Albion Square NE" },
    { id: "n05", x: 520, y: 160, label: "Eastgate" },
    { id: "n06", x: 70, y: 60, label: "North Quay" },
    { id: "n07", x: 210, y: 55, label: "Canal Bridge West" },
    { id: "n08", x: 360, y: 70, label: "Canal Bridge East" },
    { id: "n09", x: 510, y: 55, label: "Northgate Hospital" },
    { id: "n10", x: 40, y: 340, label: "Royal Oak Gardens W" },
    { id: "n11", x: 190, y: 330, label: "Royal Oak Gardens E" },
    { id: "n12", x: 320, y: 315, label: "Market Cross" },
    { id: "n13", x: 460, y: 300, label: "Clocktower" },
    { id: "n14", x: 600, y: 295, label: "Station Approach" },
    { id: "n15", x: 90, y: 470, label: "St Anselm Church" },
    { id: "n16", x: 240, y: 455, label: "Crown Court" },
    { id: "n17", x: 385, y: 445, label: "Civic Museum" },
    { id: "n18", x: 545, y: 430, label: "Theatre Arcade" },
    { id: "n19", x: 670, y: 430, label: "South Gate" },
    { id: "n20", x: 160, y: 610, label: "Queen's Yard" },
    { id: "n21", x: 315, y: 590, label: "Brewery Lane" },
    { id: "n22", x: 485, y: 575, label: "Exchange House" },
    { id: "n23", x: 630, y: 575, label: "Dock Steps" },
    { id: "n24", x: 755, y: 560, label: "East Dock" }
  ],
  roads: [
    {
      id: "r01",
      fromNodeId: "n01",
      toNodeId: "n02",
      distanceMeters: 124,
      isOneWay: false,
      name: "Westbourne Road"
    },
    {
      id: "r02",
      fromNodeId: "n02",
      toNodeId: "n03",
      distanceMeters: 141,
      isOneWay: false,
      name: "Albion Street West"
    },
    {
      id: "r03",
      fromNodeId: "n03",
      toNodeId: "n04",
      distanceMeters: 120,
      isOneWay: false,
      name: "Albion Street East"
    },
    {
      id: "r04",
      fromNodeId: "n04",
      toNodeId: "n05",
      distanceMeters: 140,
      isOneWay: true,
      name: "Eastgate Street"
    },
    {
      id: "r05",
      fromNodeId: "n06",
      toNodeId: "n07",
      distanceMeters: 140,
      isOneWay: false,
      name: "Canal Road West"
    },
    {
      id: "r06",
      fromNodeId: "n07",
      toNodeId: "n08",
      distanceMeters: 151,
      isOneWay: true,
      name: "Canal Road East"
    },
    {
      id: "r07",
      fromNodeId: "n08",
      toNodeId: "n09",
      distanceMeters: 151,
      isOneWay: false,
      name: "Hospital Lane"
    },
    {
      id: "r08",
      fromNodeId: "n02",
      toNodeId: "n06",
      distanceMeters: 139,
      isOneWay: false,
      name: "North Gate Lane"
    },
    {
      id: "r09",
      fromNodeId: "n02",
      toNodeId: "n11",
      distanceMeters: 157,
      isOneWay: true,
      name: "Library Mews"
    },
    {
      id: "r10",
      fromNodeId: "n01",
      toNodeId: "n10",
      distanceMeters: 126,
      isOneWay: false,
      name: "Garden Crescent West"
    },
    {
      id: "r11",
      fromNodeId: "n10",
      toNodeId: "n11",
      distanceMeters: 150,
      isOneWay: false,
      name: "Garden Crescent East"
    },
    {
      id: "r12",
      fromNodeId: "n11",
      toNodeId: "n12",
      distanceMeters: 131,
      isOneWay: false,
      name: "Market Lane West"
    },
    {
      id: "r13",
      fromNodeId: "n12",
      toNodeId: "n13",
      distanceMeters: 141,
      isOneWay: true,
      name: "Market Lane East"
    },
    {
      id: "r14",
      fromNodeId: "n13",
      toNodeId: "n14",
      distanceMeters: 140,
      isOneWay: false,
      name: "Station Row"
    },
    {
      id: "r15",
      fromNodeId: "n05",
      toNodeId: "n09",
      distanceMeters: 105,
      isOneWay: false,
      name: "Hospital Road"
    },
    {
      id: "r16",
      fromNodeId: "n04",
      toNodeId: "n12",
      distanceMeters: 157,
      isOneWay: false,
      name: "Baker Court"
    },
    {
      id: "r17",
      fromNodeId: "n08",
      toNodeId: "n13",
      distanceMeters: 251,
      isOneWay: true,
      name: "Clocktower Avenue"
    },
    {
      id: "r18",
      fromNodeId: "n07",
      toNodeId: "n03",
      distanceMeters: 125,
      isOneWay: false,
      name: "Quay Street"
    },
    {
      id: "r19",
      fromNodeId: "n10",
      toNodeId: "n15",
      distanceMeters: 139,
      isOneWay: false,
      name: "Church Street"
    },
    {
      id: "r20",
      fromNodeId: "n15",
      toNodeId: "n16",
      distanceMeters: 151,
      isOneWay: false,
      name: "Crown Road West"
    },
    {
      id: "r21",
      fromNodeId: "n16",
      toNodeId: "n17",
      distanceMeters: 145,
      isOneWay: false,
      name: "Crown Road East"
    },
    {
      id: "r22",
      fromNodeId: "n17",
      toNodeId: "n18",
      distanceMeters: 161,
      isOneWay: false,
      name: "Theatre Street"
    },
    {
      id: "r23",
      fromNodeId: "n18",
      toNodeId: "n19",
      distanceMeters: 125,
      isOneWay: false,
      name: "South Gate Road"
    },
    {
      id: "r24",
      fromNodeId: "n12",
      toNodeId: "n17",
      distanceMeters: 145,
      isOneWay: false,
      name: "Museum Cut"
    },
    {
      id: "r25",
      fromNodeId: "n11",
      toNodeId: "n16",
      distanceMeters: 135,
      isOneWay: true,
      name: "Court Lane"
    },
    {
      id: "r26",
      fromNodeId: "n14",
      toNodeId: "n18",
      distanceMeters: 146,
      isOneWay: true,
      name: "Station Cut"
    },
    {
      id: "r27",
      fromNodeId: "n15",
      toNodeId: "n20",
      distanceMeters: 157,
      isOneWay: false,
      name: "Queen Street West"
    },
    {
      id: "r28",
      fromNodeId: "n20",
      toNodeId: "n21",
      distanceMeters: 156,
      isOneWay: false,
      name: "Queen Street East"
    },
    {
      id: "r29",
      fromNodeId: "n21",
      toNodeId: "n22",
      distanceMeters: 171,
      isOneWay: true,
      name: "Brewery Lane"
    },
    {
      id: "r30",
      fromNodeId: "n22",
      toNodeId: "n23",
      distanceMeters: 145,
      isOneWay: false,
      name: "Dock Road West"
    },
    {
      id: "r31",
      fromNodeId: "n23",
      toNodeId: "n24",
      distanceMeters: 126,
      isOneWay: false,
      name: "Dock Road East"
    },
    {
      id: "r32",
      fromNodeId: "n16",
      toNodeId: "n21",
      distanceMeters: 154,
      isOneWay: false,
      name: "Palace Walk"
    },
    {
      id: "r33",
      fromNodeId: "n17",
      toNodeId: "n22",
      distanceMeters: 164,
      isOneWay: false,
      name: "Museum Lane"
    },
    {
      id: "r34",
      fromNodeId: "n18",
      toNodeId: "n22",
      distanceMeters: 157,
      isOneWay: true,
      name: "Arcade Passage"
    },
    {
      id: "r35",
      fromNodeId: "n19",
      toNodeId: "n23",
      distanceMeters: 150,
      isOneWay: true,
      name: "Dock Cut"
    },
    {
      id: "r36",
      fromNodeId: "n14",
      toNodeId: "n19",
      distanceMeters: 152,
      isOneWay: false,
      name: "East Dock Spur"
    },
    {
      id: "r37",
      fromNodeId: "n03",
      toNodeId: "n12",
      distanceMeters: 157,
      isOneWay: true,
      name: "Bishop Yard"
    },
    {
      id: "r38",
      fromNodeId: "n20",
      toNodeId: "n16",
      distanceMeters: 174,
      isOneWay: true,
      name: "School Lane"
    }
  ],
  restrictions: [
    {
      id: "ne-market-lane-westbound",
      type: "no_entry",
      roadId: "r12",
      fromNodeId: "n12",
      toNodeId: "n11",
      reason: "No entry westbound into Market Lane West from Market Cross"
    },
    {
      id: "ne-museum-lane-northbound",
      type: "no_entry",
      roadId: "r33",
      fromNodeId: "n22",
      toNodeId: "n17",
      reason: "No entry northbound into Museum Lane from Exchange House"
    },
    {
      id: "ne-station-row-westbound",
      type: "no_entry",
      roadId: "r14",
      fromNodeId: "n14",
      toNodeId: "n13",
      reason: "No entry westbound into Station Row from Station Approach"
    },
    {
      id: "ne-east-dock-westbound",
      type: "no_entry",
      roadId: "r31",
      fromNodeId: "n24",
      toNodeId: "n23",
      reason: "No entry westbound from East Dock"
    },
    {
      id: "pt-baker-court-to-market-lane-east",
      type: "prohibited_turn",
      fromRoadId: "r16",
      viaNodeId: "n12",
      toRoadId: "r13",
      reason: "No right turn from Baker Court into Market Lane East"
    },
    {
      id: "pt-station-row-to-station-cut",
      type: "prohibited_turn",
      fromRoadId: "r14",
      viaNodeId: "n14",
      toRoadId: "r26",
      reason: "No left turn from Station Row into Station Cut"
    },
    {
      id: "pt-museum-cut-to-theatre-street",
      type: "prohibited_turn",
      fromRoadId: "r24",
      viaNodeId: "n17",
      toRoadId: "r22",
      reason: "No right turn from Museum Cut into Theatre Street"
    },
    {
      id: "pt-crown-road-west-to-palace-walk",
      type: "prohibited_turn",
      fromRoadId: "r20",
      viaNodeId: "n16",
      toRoadId: "r32",
      reason: "No right turn from Crown Road West into Palace Walk"
    },
    {
      id: "pt-queen-street-east-to-brewery-lane",
      type: "prohibited_turn",
      fromRoadId: "r28",
      viaNodeId: "n21",
      toRoadId: "r29",
      reason: "No turn from Queen Street East into Brewery Lane"
    }
  ],
  landmarks: [
    {
      id: "lm-westbourne-library",
      name: "Westbourne Library",
      type: "library",
      x: 120,
      y: 190,
      nearestNodeId: "n02"
    },
    {
      id: "lm-northgate-hospital",
      name: "Northgate Hospital",
      type: "hospital",
      x: 510,
      y: 55,
      nearestNodeId: "n09"
    },
    {
      id: "lm-royal-oak-gardens",
      name: "Royal Oak Gardens",
      type: "park",
      x: 40,
      y: 340,
      nearestNodeId: "n10"
    },
    {
      id: "lm-market-hall",
      name: "Marlowe Market Hall",
      type: "market",
      x: 320,
      y: 315,
      nearestNodeId: "n12"
    },
    {
      id: "lm-clocktower",
      name: "Marlowe Clocktower",
      type: "landmark",
      x: 460,
      y: 300,
      nearestNodeId: "n13"
    },
    {
      id: "lm-fox-lane-station",
      name: "Fox Lane Station",
      type: "station",
      x: 600,
      y: 295,
      nearestNodeId: "n14"
    },
    {
      id: "lm-st-anselm-church",
      name: "St Anselm Church",
      type: "place_of_worship",
      x: 90,
      y: 470,
      nearestNodeId: "n15"
    },
    {
      id: "lm-crown-court",
      name: "Crown Court",
      type: "civic",
      x: 240,
      y: 455,
      nearestNodeId: "n16"
    },
    {
      id: "lm-civic-museum",
      name: "Civic Museum",
      type: "museum",
      x: 385,
      y: 445,
      nearestNodeId: "n17"
    },
    {
      id: "lm-theatre-arcade",
      name: "Theatre Arcade",
      type: "entertainment",
      x: 545,
      y: 430,
      nearestNodeId: "n18"
    },
    {
      id: "lm-exchange-house",
      name: "Exchange House",
      type: "office",
      x: 485,
      y: 575,
      nearestNodeId: "n22"
    },
    {
      id: "lm-east-dock",
      name: "East Dock",
      type: "dock",
      x: 755,
      y: 560,
      nearestNodeId: "n24"
    },
    {
      id: "lm-queens-yard",
      name: "Queen's Yard",
      type: "custom",
      x: 160,
      y: 610,
      nearestNodeId: "n20"
    },
    {
      id: "lm-canal-bridge-west",
      name: "Canal Bridge West",
      type: "custom",
      x: 210,
      y: 55,
      nearestNodeId: "n07"
    }
  ]
};

export const marloweDistrictRouteExercises: RouteExercise[] = [
  {
    id: "ex-station-to-hospital",
    title: "Fox Lane Station to Northgate Hospital",
    mapId: MARLOWE_DISTRICT_MAP_ID,
    stops: [
      { type: "landmark", landmarkId: "lm-fox-lane-station" },
      { type: "landmark", landmarkId: "lm-northgate-hospital" }
    ],
    difficulty: "easy"
  },
  {
    id: "ex-library-market-museum",
    title: "Westbourne Library to Civic Museum via Marlowe Market Hall",
    mapId: MARLOWE_DISTRICT_MAP_ID,
    stops: [
      { type: "landmark", landmarkId: "lm-westbourne-library" },
      { type: "landmark", landmarkId: "lm-market-hall" },
      { type: "landmark", landmarkId: "lm-civic-museum" }
    ],
    difficulty: "medium"
  },
  {
    id: "ex-gardens-yard-exchange",
    title: "Royal Oak Gardens to Exchange House via Queen's Yard",
    mapId: MARLOWE_DISTRICT_MAP_ID,
    stops: [
      { type: "landmark", landmarkId: "lm-royal-oak-gardens" },
      { type: "landmark", landmarkId: "lm-queens-yard" },
      { type: "landmark", landmarkId: "lm-exchange-house" }
    ],
    difficulty: "medium"
  },
  {
    id: "ex-church-to-east-dock",
    title: "St Anselm Church to East Dock",
    mapId: MARLOWE_DISTRICT_MAP_ID,
    stops: [
      { type: "landmark", landmarkId: "lm-st-anselm-church" },
      { type: "landmark", landmarkId: "lm-east-dock" }
    ],
    difficulty: "hard"
  },
  {
    id: "ex-canal-to-theatre",
    title: "Canal Bridge West to Theatre Arcade",
    mapId: MARLOWE_DISTRICT_MAP_ID,
    stops: [
      { type: "landmark", landmarkId: "lm-canal-bridge-west" },
      { type: "landmark", landmarkId: "lm-theatre-arcade" }
    ],
    difficulty: "medium"
  },
  {
    id: "ex-crown-market-gardens",
    title: "Crown Court to Royal Oak Gardens via Marlowe Market Hall",
    mapId: MARLOWE_DISTRICT_MAP_ID,
    stops: [
      { type: "landmark", landmarkId: "lm-crown-court" },
      { type: "landmark", landmarkId: "lm-market-hall" },
      { type: "landmark", landmarkId: "lm-royal-oak-gardens" }
    ],
    difficulty: "hard"
  }
];

export const marloweDistrictFixture = {
  map: marloweDistrictMap,
  routeExercises: marloweDistrictRouteExercises
};
