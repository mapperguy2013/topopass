import type { StyleSpecification } from "mapbox-gl";

const streetsSource = "mapbox-streets";

export const EXAM_MAP_ZOOM_LIMITS = {
  minZoom: 12.75,
  defaultZoom: 14.75,
  maxZoom: 16
} as const;

const atlasColours = {
  station: "#175d8f",
  stationHalo: "#f7f1df",
  stationMajor: "#0f4d7a",
  landmark: "#7b4b78",
  landmarkHalo: "#fff8e5"
} as const;

const majorStationNames = [
  "King's Cross",
  "St Pancras",
  "London Bridge",
  "Oxford Circus",
  "Waterloo",
  "Victoria",
  "Paddington",
  "Liverpool Street",
  "Euston",
  "Marylebone",
  "Charing Cross",
  "Farringdon",
  "Bank"
] as const;

const landmarkNames = [
  "Tower of London",
  "St Paul's Cathedral",
  "British Museum",
  "Buckingham Palace",
  "Trafalgar Square",
  "London Eye",
  "Westminster Abbey",
  "Houses of Parliament",
  "Royal Albert Hall"
] as const;

function roadFilter(classes: string[]) {
  return ["in", ["get", "class"], ["literal", classes]];
}

function nameContains(names: string[]) {
  return [
    "any",
    ...names.map((name) => [
      ">=",
      ["index-of", name, ["coalesce", ["get", "name"], ""]],
      0
    ])
  ];
}

function oneWayRoadFilter(classes: string[]) {
  return [
    "all",
    roadFilter(classes),
    [
      "any",
      ["==", ["get", "oneway"], true],
      ["==", ["get", "oneway"], "true"],
      ["==", ["get", "oneway"], 1],
      ["==", ["get", "oneway"], "1"],
      ["==", ["get", "oneway"], "yes"]
    ]
  ];
}

function railStationFilter() {
  return [
    "any",
    ["match", ["get", "maki"], ["rail", "rail-metro", "rail-light"], true, false],
    ["match", ["get", "class"], ["rail", "railway", "station"], true, false],
    ["match", ["get", "mode"], ["rail", "metro", "tube"], true, false],
    nameContains([...majorStationNames])
  ];
}

function majorStationFilter() {
  return nameContains([...majorStationNames]);
}

function landmarkFilter() {
  return [
    "any",
    ["match", ["get", "maki"], ["monument", "museum", "attraction"], true, false],
    ["match", ["get", "class"], ["landmark", "museum", "attraction"], true, false],
    nameContains([...landmarkNames])
  ];
}

function lineWidth(z12: number, z14: number, z16: number) {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    EXAM_MAP_ZOOM_LIMITS.minZoom,
    z12,
    14.25,
    z14,
    EXAM_MAP_ZOOM_LIMITS.maxZoom,
    z16
  ];
}

function textSize(z12: number, z14: number, z16: number) {
  return lineWidth(z12, z14, z16);
}

function symbolSpacing(z12: number, z14: number, z16: number) {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    EXAM_MAP_ZOOM_LIMITS.minZoom,
    z12,
    14.25,
    z14,
    EXAM_MAP_ZOOM_LIMITS.maxZoom,
    z16
  ];
}

export const topographicalAtlasStyle = {
  version: 8,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sources: {
    [streetsSource]: {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8"
    }
  },
  layers: [
    {
      id: "paper-background",
      type: "background",
      paint: {
        "background-color": "#f7f1df"
      }
    },
    {
      id: "landuse-park",
      type: "fill",
      source: streetsSource,
      "source-layer": "landuse",
      filter: [
        "in",
        ["get", "class"],
        ["literal", ["park", "cemetery", "wood", "grass", "golf_course"]]
      ],
      paint: {
        "fill-color": "#dcebc9",
        "fill-opacity": 0.88
      }
    },
    {
      id: "water-fill",
      type: "fill",
      source: streetsSource,
      "source-layer": "water",
      paint: {
        "fill-color": "#b9d9e8"
      }
    },
    {
      id: "waterway-line",
      type: "line",
      source: streetsSource,
      "source-layer": "waterway",
      paint: {
        "line-color": "#9cc9dd",
        "line-width": lineWidth(0.5, 1.1, 2.2)
      }
    },
    {
      id: "building-footprints",
      type: "fill",
      source: streetsSource,
      "source-layer": "building",
      minzoom: EXAM_MAP_ZOOM_LIMITS.minZoom,
      paint: {
        "fill-color": "#e8e1d0",
        "fill-outline-color": "#cfc6b5",
        "fill-opacity": 0.42
      }
    },

    {
      id: "rail-casing",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["major_rail", "minor_rail", "service_rail"]),
      paint: {
        "line-color": "#ffffff",
        "line-width": lineWidth(2.4, 2.8, 3.2)
      }
    },
    {
      id: "rail-fill",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["major_rail", "minor_rail", "service_rail"]),
      paint: {
        "line-color": "#4f4a45",
        "line-dasharray": [0.7, 0.55],
        "line-width": lineWidth(1, 1.15, 1.35)
      }
    },

    {
      id: "road-path-casing",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      minzoom: EXAM_MAP_ZOOM_LIMITS.minZoom,
      filter: roadFilter(["path", "pedestrian", "footway", "track"]),
      paint: {
        "line-color": "#d5cfbf",
        "line-opacity": 0.35,
        "line-width": lineWidth(0.28, 0.34, 0.42)
      }
    },
    {
      id: "road-path-fill",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      minzoom: EXAM_MAP_ZOOM_LIMITS.minZoom,
      filter: roadFilter(["path", "pedestrian", "footway", "track"]),
      paint: {
        "line-color": "#f8f3e4",
        "line-dasharray": [1.1, 1.4],
        "line-opacity": 0.25,
        "line-width": lineWidth(0.12, 0.16, 0.22)
      }
    },
    {
      id: "road-service-casing",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["service"]),
      paint: {
        "line-color": "#bcb4a6",
        "line-width": lineWidth(2.6, 3.1, 3.7)
      }
    },
    {
      id: "road-service-fill",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["service"]),
      paint: {
        "line-color": "#fffdf7",
        "line-width": lineWidth(1.55, 1.9, 2.35)
      }
    },
    {
      id: "road-unclassified-casing",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["street_limited", "unclassified"]),
      paint: {
        "line-color": "#948c7e",
        "line-width": lineWidth(5.2, 6, 6.9)
      }
    },
    {
      id: "road-unclassified-fill",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["street_limited", "unclassified"]),
      paint: {
        "line-color": "#fffdf7",
        "line-width": lineWidth(3.6, 4.25, 5)
      }
    },
    {
      id: "road-residential-casing",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["street", "residential", "living_street"]),
      paint: {
        "line-color": "#8c8375",
        "line-width": lineWidth(5.8, 6.7, 7.8)
      }
    },
    {
      id: "road-residential-fill",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["street", "residential", "living_street"]),
      paint: {
        "line-color": "#fffdf6",
        "line-width": lineWidth(4.1, 4.9, 5.8)
      }
    },
    {
      id: "road-tertiary-casing",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["tertiary", "tertiary_link"]),
      paint: {
        "line-color": "#7b643f",
        "line-width": lineWidth(8.1, 9.2, 10.6)
      }
    },
    {
      id: "road-tertiary-fill",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["tertiary", "tertiary_link"]),
      paint: {
        "line-color": "#f6dd92",
        "line-width": lineWidth(6.1, 7, 8.2)
      }
    },
    {
      id: "road-secondary-casing",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["secondary", "secondary_link"]),
      paint: {
        "line-color": "#73502f",
        "line-width": lineWidth(11.6, 13.2, 15.2)
      }
    },
    {
      id: "road-secondary-fill",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["secondary", "secondary_link"]),
      paint: {
        "line-color": "#f1bf5c",
        "line-width": lineWidth(8.7, 10.1, 11.8)
      }
    },
    {
      id: "road-primary-casing",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["primary", "primary_link"]),
      paint: {
        "line-color": "#6e3f24",
        "line-width": lineWidth(14.4, 16.5, 19.2)
      }
    },
    {
      id: "road-primary-fill",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["primary", "primary_link"]),
      paint: {
        "line-color": "#ea9a38",
        "line-width": lineWidth(11, 13, 15.4)
      }
    },
    {
      id: "road-trunk-casing",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["trunk", "trunk_link"]),
      paint: {
        "line-color": "#713322",
        "line-width": lineWidth(17.4, 20, 23.2)
      }
    },
    {
      id: "road-trunk-fill",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["trunk", "trunk_link"]),
      paint: {
        "line-color": "#e27028",
        "line-width": lineWidth(13.4, 15.8, 18.4)
      }
    },
    {
      id: "road-motorway-casing",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["motorway", "motorway_link"]),
      paint: {
        "line-color": "#623052",
        "line-width": lineWidth(20.2, 23.2, 26.4)
      }
    },
    {
      id: "road-motorway-fill",
      type: "line",
      source: streetsSource,
      "source-layer": "road",
      filter: roadFilter(["motorway", "motorway_link"]),
      paint: {
        "line-color": "#b04478",
        "line-width": lineWidth(15.8, 18.4, 20.8)
      }
    },

    {
      id: "oneway-major-arrows",
      type: "symbol",
      source: streetsSource,
      "source-layer": "road",
      minzoom: EXAM_MAP_ZOOM_LIMITS.minZoom,
      filter: oneWayRoadFilter([
        "motorway",
        "motorway_link",
        "trunk",
        "trunk_link",
        "primary",
        "primary_link",
        "secondary",
        "secondary_link",
        "tertiary",
        "tertiary_link"
      ]),
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": symbolSpacing(132, 112, 92),
        "text-field": "\u279c",
        "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
        "text-size": textSize(16, 17.5, 19),
        "text-keep-upright": false,
        "text-rotation-alignment": "map",
        "text-ignore-placement": false
      },
      paint: {
        "text-color": "#4c3024",
        "text-halo-color": "#fff7df",
        "text-halo-width": 1.4
      }
    },
    {
      id: "oneway-local-arrows",
      type: "symbol",
      source: streetsSource,
      "source-layer": "road",
      minzoom: 14.25,
      filter: oneWayRoadFilter([
        "street",
        "residential",
        "living_street",
        "street_limited",
        "unclassified",
        "service"
      ]),
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": symbolSpacing(180, 150, 120),
        "text-field": "\u279c",
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": textSize(12, 13.5, 15),
        "text-keep-upright": false,
        "text-rotation-alignment": "map",
        "text-ignore-placement": false
      },
      paint: {
        "text-color": "#514a40",
        "text-halo-color": "#fffdf6",
        "text-halo-width": 1.2,
        "text-opacity": 0.88
      }
    },
    {
      id: "place-labels",
      type: "symbol",
      source: streetsSource,
      "source-layer": "place_label",
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
        "text-size": textSize(13, 14.5, 15.5),
        "text-transform": "uppercase",
        "text-letter-spacing": 0.04
      },
      paint: {
        "text-color": "#221f1b",
        "text-halo-color": "#f7f1df",
        "text-halo-width": 1.6
      }
    },
    {
      id: "landmark-symbols",
      type: "circle",
      source: streetsSource,
      "source-layer": "poi_label",
      minzoom: EXAM_MAP_ZOOM_LIMITS.minZoom,
      filter: landmarkFilter(),
      paint: {
        "circle-color": atlasColours.landmark,
        "circle-opacity": 0.78,
        "circle-radius": lineWidth(3.2, 3.6, 4.2),
        "circle-stroke-color": atlasColours.landmarkHalo,
        "circle-stroke-width": 1.4
      }
    },
    {
      id: "landmark-labels",
      type: "symbol",
      source: streetsSource,
      "source-layer": "poi_label",
      minzoom: EXAM_MAP_ZOOM_LIMITS.minZoom,
      filter: landmarkFilter(),
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": textSize(11, 11.5, 12),
        "text-offset": [0, 1.05],
        "text-anchor": "top",
        "text-optional": true
      },
      paint: {
        "text-color": "#4c3150",
        "text-halo-color": atlasColours.landmarkHalo,
        "text-halo-width": 1.4,
        "text-opacity": 0.9
      }
    },
    {
      id: "station-symbols",
      type: "circle",
      source: streetsSource,
      "source-layer": "transit_stop_label",
      minzoom: EXAM_MAP_ZOOM_LIMITS.minZoom,
      filter: railStationFilter(),
      paint: {
        "circle-color": atlasColours.station,
        "circle-radius": lineWidth(4.4, 4.8, 5.4),
        "circle-stroke-color": atlasColours.stationHalo,
        "circle-stroke-width": 1.8
      }
    },
    {
      id: "major-station-symbols",
      type: "circle",
      source: streetsSource,
      "source-layer": "transit_stop_label",
      minzoom: EXAM_MAP_ZOOM_LIMITS.minZoom,
      filter: majorStationFilter(),
      paint: {
        "circle-color": atlasColours.stationMajor,
        "circle-radius": lineWidth(5.8, 6.4, 7),
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2.2
      }
    },
    {
      id: "transit-stop-labels",
      type: "symbol",
      source: streetsSource,
      "source-layer": "transit_stop_label",
      minzoom: EXAM_MAP_ZOOM_LIMITS.minZoom,
      filter: railStationFilter(),
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": textSize(12, 12.8, 13.4),
        "text-offset": [0, 0.8],
        "text-anchor": "top",
        "text-optional": true
      },
      paint: {
        "text-color": atlasColours.stationMajor,
        "text-halo-color": "#fff9e8",
        "text-halo-width": 1.6
      }
    },
    {
      id: "major-station-labels",
      type: "symbol",
      source: streetsSource,
      "source-layer": "transit_stop_label",
      minzoom: EXAM_MAP_ZOOM_LIMITS.minZoom,
      filter: majorStationFilter(),
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
        "text-size": textSize(13, 13.8, 14.6),
        "text-offset": [0, 1],
        "text-anchor": "top",
        "text-optional": true
      },
      paint: {
        "text-color": atlasColours.stationMajor,
        "text-halo-color": "#fff9e8",
        "text-halo-width": 1.9
      }
    }
  ]
} as unknown as StyleSpecification;
