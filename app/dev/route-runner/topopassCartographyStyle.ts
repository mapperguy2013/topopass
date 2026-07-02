export type TopopassLineStyle = {
  strokeColor: string;
  strokeWidth: number;
  casingColor?: string;
  casingWidth?: number;
  dash?: readonly number[];
  alpha?: number;
};

export type TopopassRoadClassStyle = {
  casingColor: string;
  strokeColor: string;
  casingWidth: number;
  strokeWidth: number;
  dash?: readonly number[];
  alpha?: number;
};

export type TopopassRoadGeometryStyle = {
  lineCap: "butt" | "round" | "square";
  lineJoin: "round" | "bevel" | "miter";
  miterLimit: number;
  lowZoomViewportScale: number;
  minorLowZoomWidthMultiplier: number;
  minorLowZoomAlphaMultiplier: number;
  serviceLowZoomWidthMultiplier: number;
  serviceLowZoomAlphaMultiplier: number;
  restrictedLowZoomAlphaMultiplier: number;
};

export type TopopassRoadJunctionStyle = {
  majorRadiusMultiplier: number;
  secondaryRadiusMultiplier: number;
  minorRadiusMultiplier: number;
  quietRadiusMultiplier: number;
};

export type TopopassRoadInteractionStyle = {
  haloColor: string;
  haloWidth: number;
  strokeColor: string;
  strokeWidth: number;
  alpha: number;
};

export type TopopassLabelStyle = {
  font: string;
  color: string;
  haloColor: string;
  haloWidth: number;
  yOffset?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetY?: number;
};

export type TopopassRoadLabelStyle = TopopassLabelStyle & {
  fontSize: number;
  approximateCharacterWidth: number;
  minViewportScale: number;
  minRoadScreenLength: number;
  maxTextToRoadRatio: number;
  repeatDistance: number;
  collisionPadding: number;
};

export type TopopassZoomThresholds = {
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  step: number;
  panMargin: number;
};

export type TopopassStreetAtlasStyle = {
  canvas: {
    backgroundColor: string;
  };
  roads: {
    syntheticThresholds: {
      majorMinDistanceMeters: number;
      secondaryMinDistanceMeters: number;
      serviceMaxDistanceMeters: number;
    };
    synthetic: Record<
      "major" | "secondary" | "oneWay" | "noEntry" | "restricted" | "service" | "local",
      TopopassRoadClassStyle
    >;
    osm: Record<
      "primary" | "secondary" | "tertiary" | "residential" | "service" | "pedestrian" | "restricted" | "inactive" | "unknown",
      TopopassRoadClassStyle
    >;
    roadCasings: {
      activeColor: string;
      quietColor: string;
      restrictedColor: string;
    };
    geometry: TopopassRoadGeometryStyle;
    junctions: TopopassRoadJunctionStyle;
    interaction: {
      selected: TopopassRoadInteractionStyle;
      hovered: TopopassRoadInteractionStyle;
    };
    zoomScaledWidths: {
      referenceZoom: number;
      minMultiplier: number;
      maxMultiplier: number;
    };
  };
  labels: {
    road: TopopassLabelStyle;
    roadHierarchy: Record<"major" | "secondary" | "minor" | "restricted" | "service", TopopassRoadLabelStyle>;
    area: TopopassLabelStyle;
    landmark: TopopassLabelStyle;
    stop: TopopassLabelStyle;
    collision: {
      defaultPadding: number;
      routePadding: number;
      markerPadding: number;
    };
    priorities: {
      majorRoad: number;
      secondaryRoad: number;
      restrictedRoad: number;
      localRoad: number;
      area: number;
      exerciseStop: number;
    };
  };
  background: {
    water: {
      canal: { fillColor: string; strokeColor: string };
      basin: { fillColor: string; strokeColor: string };
      linear: TopopassLineStyle;
    };
    park: {
      garden: { fillColor: string; strokeColor: string };
      square: { fillColor: string; strokeColor: string };
    };
    openSpace: { fillColor: string; strokeColor: string };
    pedestrianArea: { fillColor: string; strokeColor: string };
    landBlock: {
      stationQuarter: { fillColor: string; strokeColor: string };
      goodsYard: { fillColor: string; strokeColor: string };
      marketQuarter: { fillColor: string; strokeColor: string };
      civicQuarter: { fillColor: string; strokeColor: string };
    };
    polygonStrokeWidth: number;
  };
  rail: TopopassLineStyle;
  station: {
    radius: number;
    fillColor: string;
    strokeColor: string;
    haloColor: string;
    priority: number;
    innerLineColor: string;
    markerStrokeWidth: number;
    innerLineWidth: number;
  };
  landmarks: Record<
    "hospital" | "park" | "market" | "dock" | "civic" | "church" | "museum" | "generic",
    {
      radius: number;
      fillColor: string;
      strokeColor: string;
      haloColor: string;
      priority: number;
    }
  >;
  routeOverlays: Record<
    "rawRoute" | "snappedRoute" | "matchedRoute" | "shortestLegalRoute" | "illegalMovement",
    TopopassLineStyle
  >;
  exerciseMarkers: {
    haloFillColor: string;
    textColor: string;
    haloRadiusPadding: number;
    strokeWidth: number;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetY: number;
    start: { fillColor: string; radius: number; text: string; font: string };
    checkpoint: { fillColor: string; radius: number; textPrefix: string; font: string };
    destination: { fillColor: string; radius: number; text: string; font: string };
  };
  hints: {
    snapPreview: TopopassLineStyle;
    snappedPointMatchedColor: string;
    snappedPointUnmatchedColor: string;
    snappedPointRadius: number;
  };
  restrictions: {
    overlay: {
      noEntry: TopopassLineStyle;
      restricted: TopopassLineStyle;
      oneWay: TopopassLineStyle;
    };
    noEntryMarker: {
      radius: number;
      fillColor: string;
      strokeColor: string;
      strokeWidth: number;
      barWidth: number;
      barRadiusRatio: number;
    };
    oneWay: {
      color: string;
      lineWidth: number;
      tipDistance: number;
      tailDistance: number;
      longRoadArrowThresholdMeters: number;
      minSpacingMeters: number;
    };
    restrictedMarker: {
      fillColor: string;
      strokeColor: string;
      strokeWidth: number;
      symbolColor: string;
      symbolLineWidth: number;
      radius: number;
      dotRadius: number;
    };
    turnBanMarker: {
      fillColor: string;
      strokeColor: string;
      strokeWidth: number;
      radius: number;
      arrowColor: string;
      arrowLineWidth: number;
    };
    selectedFocus: {
      strokeColor: string;
      fillColor: string;
      strokeWidth: number;
      routeLineWidth: number;
      routeAlpha: number;
      innerRadius: number;
      outerRadius: number;
    };
  };
  review: {
    routeIssue: {
      defaultColor: string;
      turnColor: string;
      disconnectedLineWidth: number;
      illegalLineWidth: number;
      disconnectedDetailLineWidth: number;
      illegalDetailLineWidth: number;
      alpha: number;
      dashedIssueDash: readonly number[];
      noEntrySymbolFillColor: string;
      noEntrySymbolStrokeColor: string;
      illegalSymbolFillColor: string;
      illegalSymbolStrokeColor: string;
    };
    fastestRoute: {
      halo: TopopassLineStyle;
      route: TopopassLineStyle;
    };
    matchedMovement: {
      haloColor: string;
      haloWidth: number;
      haloAlpha: number;
      matchedColor: string;
      unmatchedColor: string;
      lineWidth: number;
      alpha: number;
      matchedNodeStrokeColor: string;
      unmatchedNodeStrokeColor: string;
      nodeFillColor: string;
      nodeRadius: number;
      nodeStrokeWidth: number;
    };
  };
  routeReplay: {
    userColor: string;
    shortestColor: string;
    haloFillColor: string;
    outerStrokeColor: string;
    outerRadius: number;
    innerRadius: number;
    haloRadius: number;
    strokeWidth: number;
  };
  nodes: {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    radius: number;
    matchedStartColor: string;
    matchedNodeColor: string;
    matchedNodeRadius: number;
  };
  zoom: {
    thresholds: TopopassZoomThresholds;
    decluttering: {
      osmRoadLabelsRequireQaOverlay: boolean;
      oneWayArrowMinSpacingMeters: number;
      longRoadArrowThresholdMeters: number;
    };
  };
};

export const TOPOPASS_STREET_ATLAS_STYLE = {
  canvas: {
    backgroundColor: "#f5f0e5"
  },
  roads: {
    syntheticThresholds: {
      majorMinDistanceMeters: 155,
      secondaryMinDistanceMeters: 135,
      serviceMaxDistanceMeters: 126
    },
    synthetic: {
      major: {
        casingColor: "#fff2c7",
        strokeColor: "#d99a22",
        casingWidth: 18,
        strokeWidth: 10
      },
      secondary: {
        casingColor: "#fff8d6",
        strokeColor: "#efc95b",
        casingWidth: 15,
        strokeWidth: 8
      },
      oneWay: {
        casingColor: "#e4f1fb",
        strokeColor: "#8bbcdf",
        casingWidth: 12,
        strokeWidth: 6.5
      },
      noEntry: {
        casingColor: "#ead6cc",
        strokeColor: "#f3c0b1",
        casingWidth: 10,
        strokeWidth: 4.5,
        alpha: 0.74
      },
      restricted: {
        casingColor: "#e2caa6",
        strokeColor: "#e9bd73",
        casingWidth: 9,
        strokeWidth: 4,
        dash: [9, 7],
        alpha: 0.72
      },
      service: {
        casingColor: "#d8d1c7",
        strokeColor: "#eee9dd",
        casingWidth: 6,
        strokeWidth: 2.5,
        alpha: 0.8
      },
      local: {
        casingColor: "#d8d0c2",
        strokeColor: "#fffdf8",
        casingWidth: 8.5,
        strokeWidth: 4.8
      }
    },
    osm: {
      primary: {
        casingColor: "#fff2c7",
        strokeColor: "#d99a22",
        casingWidth: 19,
        strokeWidth: 10.5
      },
      secondary: {
        casingColor: "#fff8d6",
        strokeColor: "#efc95b",
        casingWidth: 15.5,
        strokeWidth: 8.2
      },
      tertiary: {
        casingColor: "#fffbe6",
        strokeColor: "#f2df96",
        casingWidth: 12.5,
        strokeWidth: 6.2
      },
      residential: {
        casingColor: "#d8d0c2",
        strokeColor: "#fffdf8",
        casingWidth: 8.5,
        strokeWidth: 4.8
      },
      service: {
        casingColor: "#d8d1c7",
        strokeColor: "#eee9dd",
        casingWidth: 5.8,
        strokeWidth: 2.4,
        alpha: 0.78
      },
      pedestrian: {
        casingColor: "#d5cfc5",
        strokeColor: "#eee7d8",
        casingWidth: 4.8,
        strokeWidth: 1.9,
        dash: [3, 5],
        alpha: 0.62
      },
      restricted: {
        casingColor: "#e2caa6",
        strokeColor: "#e9bd73",
        casingWidth: 8.8,
        strokeWidth: 3.8,
        dash: [9, 7],
        alpha: 0.72
      },
      inactive: {
        casingColor: "#d6d0c8",
        strokeColor: "#ece7df",
        casingWidth: 5.2,
        strokeWidth: 2.1,
        alpha: 0.56
      },
      unknown: {
        casingColor: "#d7d0c5",
        strokeColor: "#f4efe7",
        casingWidth: 6.8,
        strokeWidth: 3.4,
        alpha: 0.74
      }
    },
    roadCasings: {
      activeColor: "#d8d0c2",
      quietColor: "#d8d1c7",
      restrictedColor: "#e2caa6"
    },
    geometry: {
      lineCap: "round",
      lineJoin: "round",
      miterLimit: 2,
      lowZoomViewportScale: 0.5,
      minorLowZoomWidthMultiplier: 0.82,
      minorLowZoomAlphaMultiplier: 0.82,
      serviceLowZoomWidthMultiplier: 0.72,
      serviceLowZoomAlphaMultiplier: 0.68,
      restrictedLowZoomAlphaMultiplier: 0.78
    },
    junctions: {
      majorRadiusMultiplier: 0.54,
      secondaryRadiusMultiplier: 0.52,
      minorRadiusMultiplier: 0.48,
      quietRadiusMultiplier: 0.43
    },
    interaction: {
      selected: {
        haloColor: "rgba(14,165,233,0.2)",
        haloWidth: 13,
        strokeColor: "rgba(2,132,199,0.58)",
        strokeWidth: 5.6,
        alpha: 1
      },
      hovered: {
        haloColor: "rgba(56,189,248,0.16)",
        haloWidth: 9,
        strokeColor: "rgba(14,165,233,0.4)",
        strokeWidth: 4,
        alpha: 1
      }
    },
    zoomScaledWidths: {
      referenceZoom: 1,
      minMultiplier: 0.9,
      maxMultiplier: 1.18
    }
  },
  labels: {
    road: {
      font: "600 11px Arial, sans-serif",
      color: "rgba(38,50,66,0.82)",
      haloColor: "rgba(255,255,255,0.96)",
      haloWidth: 3,
      shadowColor: "rgba(255,255,255,0.5)",
      shadowBlur: 2,
      shadowOffsetY: 0
    },
    roadHierarchy: {
      major: {
        font: "700 13px Arial, sans-serif",
        fontSize: 13,
        approximateCharacterWidth: 7.2,
        color: "rgba(30,41,59,0.9)",
        haloColor: "rgba(255,255,255,0.98)",
        haloWidth: 4,
        shadowColor: "rgba(255,255,255,0.62)",
        shadowBlur: 3,
        shadowOffsetY: 0,
        minViewportScale: 0.14,
        minRoadScreenLength: 74,
        maxTextToRoadRatio: 0.96,
        repeatDistance: 210,
        collisionPadding: 5
      },
      secondary: {
        font: "650 12px Arial, sans-serif",
        fontSize: 12,
        approximateCharacterWidth: 6.6,
        color: "rgba(45,55,72,0.84)",
        haloColor: "rgba(255,255,255,0.96)",
        haloWidth: 3.5,
        shadowColor: "rgba(255,255,255,0.55)",
        shadowBlur: 2,
        shadowOffsetY: 0,
        minViewportScale: 0.28,
        minRoadScreenLength: 66,
        maxTextToRoadRatio: 0.92,
        repeatDistance: 180,
        collisionPadding: 5
      },
      minor: {
        font: "600 10.5px Arial, sans-serif",
        fontSize: 10.5,
        approximateCharacterWidth: 5.7,
        color: "rgba(51,65,85,0.74)",
        haloColor: "rgba(255,255,255,0.94)",
        haloWidth: 3,
        shadowColor: "rgba(255,255,255,0.44)",
        shadowBlur: 1.5,
        shadowOffsetY: 0,
        minViewportScale: 0.72,
        minRoadScreenLength: 58,
        maxTextToRoadRatio: 0.88,
        repeatDistance: 150,
        collisionPadding: 4
      },
      restricted: {
        font: "600 10px Arial, sans-serif",
        fontSize: 10,
        approximateCharacterWidth: 5.4,
        color: "rgba(120,80,34,0.66)",
        haloColor: "rgba(255,255,255,0.9)",
        haloWidth: 3,
        shadowColor: "rgba(255,255,255,0.35)",
        shadowBlur: 1,
        shadowOffsetY: 0,
        minViewportScale: 1,
        minRoadScreenLength: 70,
        maxTextToRoadRatio: 0.82,
        repeatDistance: 170,
        collisionPadding: 4
      },
      service: {
        font: "500 9.5px Arial, sans-serif",
        fontSize: 9.5,
        approximateCharacterWidth: 5.1,
        color: "rgba(71,85,105,0.58)",
        haloColor: "rgba(255,255,255,0.86)",
        haloWidth: 2.5,
        shadowColor: "rgba(255,255,255,0.3)",
        shadowBlur: 1,
        shadowOffsetY: 0,
        minViewportScale: 1.45,
        minRoadScreenLength: 82,
        maxTextToRoadRatio: 0.78,
        repeatDistance: 190,
        collisionPadding: 4
      }
    },
    area: {
      font: "600 13px Arial, sans-serif",
      color: "rgba(71,85,105,0.56)",
      haloColor: "rgba(255,255,255,0.75)",
      haloWidth: 3
    },
    landmark: {
      font: "700 11px Arial, sans-serif",
      color: "rgba(15,23,42,0.78)",
      haloColor: "rgba(255,255,255,0.94)",
      haloWidth: 3
    },
    stop: {
      font: "700 11px Arial, sans-serif",
      color: "#0f172a",
      haloColor: "rgba(255,255,255,0.94)",
      haloWidth: 4,
      yOffset: -18
    },
    collision: {
      defaultPadding: 4,
      routePadding: 8,
      markerPadding: 10
    },
    priorities: {
      majorRoad: 2,
      secondaryRoad: 3,
      restrictedRoad: 5,
      localRoad: 6,
      area: 7,
      exerciseStop: 10
    }
  },
  background: {
    water: {
      canal: { fillColor: "#cfe8f3", strokeColor: "#a8d3e4" },
      basin: { fillColor: "#bddfed", strokeColor: "#8ac3d9" },
      linear: {
        casingColor: "rgba(255,255,255,0.74)",
        strokeColor: "#9dccdd",
        casingWidth: 8,
        strokeWidth: 4
      }
    },
    park: {
      garden: { fillColor: "#dbe9cd", strokeColor: "#bfd3ad" },
      square: { fillColor: "#cfe0bf", strokeColor: "#abc593" }
    },
    openSpace: { fillColor: "#e5ead4", strokeColor: "#c8d3ad" },
    pedestrianArea: { fillColor: "#eee7d8", strokeColor: "#d9cfbe" },
    landBlock: {
      stationQuarter: { fillColor: "#e6dfd0", strokeColor: "#d4c9b9" },
      goodsYard: { fillColor: "#eee8dc", strokeColor: "#d8cebd" },
      marketQuarter: { fillColor: "#f2ead9", strokeColor: "#ded2bf" },
      civicQuarter: { fillColor: "#e8e1d2", strokeColor: "#d4c9b6" }
    },
    polygonStrokeWidth: 1.5
  },
  rail: {
    casingColor: "rgba(255,255,255,0.8)",
    strokeColor: "#6b7280",
    casingWidth: 9,
    strokeWidth: 4,
    dash: [8, 7]
  },
  station: {
    radius: 10,
    fillColor: "#ffffff",
    strokeColor: "#dc2626",
    haloColor: "rgba(220,38,38,0.14)",
    priority: 2,
    innerLineColor: "#1d4ed8",
    markerStrokeWidth: 3.5,
    innerLineWidth: 5
  },
  landmarks: {
    hospital: {
      radius: 9,
      fillColor: "#eff6ff",
      strokeColor: "#2563eb",
      haloColor: "rgba(37,99,235,0.13)",
      priority: 3
    },
    park: {
      radius: 8,
      fillColor: "#ecfdf5",
      strokeColor: "#16a34a",
      haloColor: "rgba(22,163,74,0.13)",
      priority: 4
    },
    market: {
      radius: 8,
      fillColor: "#fff7ed",
      strokeColor: "#ea580c",
      haloColor: "rgba(234,88,12,0.13)",
      priority: 5
    },
    dock: {
      radius: 8,
      fillColor: "#fff7ed",
      strokeColor: "#ea580c",
      haloColor: "rgba(234,88,12,0.13)",
      priority: 5
    },
    civic: {
      radius: 8,
      fillColor: "#f8fafc",
      strokeColor: "#475569",
      haloColor: "rgba(71,85,105,0.12)",
      priority: 5
    },
    church: {
      radius: 8,
      fillColor: "#f8fafc",
      strokeColor: "#475569",
      haloColor: "rgba(71,85,105,0.12)",
      priority: 5
    },
    museum: {
      radius: 8,
      fillColor: "#f8fafc",
      strokeColor: "#475569",
      haloColor: "rgba(71,85,105,0.12)",
      priority: 5
    },
    generic: {
      radius: 6,
      fillColor: "#ffffff",
      strokeColor: "#64748b",
      haloColor: "rgba(100,116,139,0.1)",
      priority: 7
    }
  },
  routeOverlays: {
    rawRoute: {
      strokeColor: "#f97316",
      strokeWidth: 4
    },
    snappedRoute: {
      strokeColor: "#22c55e",
      strokeWidth: 3,
      dash: [6, 5]
    },
    matchedRoute: {
      strokeColor: "#7c3aed",
      strokeWidth: 8
    },
    shortestLegalRoute: {
      strokeColor: "#0ea5e9",
      strokeWidth: 4,
      dash: [10, 6]
    },
    illegalMovement: {
      strokeColor: "#dc2626",
      strokeWidth: 9
    }
  },
  exerciseMarkers: {
    haloFillColor: "rgba(255,255,255,0.96)",
    textColor: "#ffffff",
    haloRadiusPadding: 5,
    strokeWidth: 3,
    shadowColor: "rgba(15,23,42,0.24)",
    shadowBlur: 10,
    shadowOffsetY: 2,
    start: { fillColor: "#15803d", radius: 14, text: "S", font: "800 12px Arial, sans-serif" },
    checkpoint: { fillColor: "#f97316", radius: 12, textPrefix: "CP", font: "800 9px Arial, sans-serif" },
    destination: { fillColor: "#6d28d9", radius: 14, text: "F", font: "800 12px Arial, sans-serif" }
  },
  hints: {
    snapPreview: {
      strokeColor: "#22c55e",
      strokeWidth: 2,
      dash: [5, 5]
    },
    snappedPointMatchedColor: "#16a34a",
    snappedPointUnmatchedColor: "#dc2626",
    snappedPointRadius: 3
  },
  restrictions: {
    overlay: {
      noEntry: {
        strokeColor: "#ef4444",
        strokeWidth: 6,
        alpha: 0.38
      },
      restricted: {
        strokeColor: "#f59e0b",
        strokeWidth: 7,
        alpha: 0.38,
        dash: [10, 7]
      },
      oneWay: {
        strokeColor: "#3b82f6",
        strokeWidth: 3,
        alpha: 0.32
      }
    },
    noEntryMarker: {
      radius: 14,
      fillColor: "rgba(255,255,255,0.96)",
      strokeColor: "#dc2626",
      strokeWidth: 3,
      barWidth: 5,
      barRadiusRatio: 0.58
    },
    oneWay: {
      color: "#1d4ed8",
      lineWidth: 4,
      tipDistance: 13,
      tailDistance: 11,
      longRoadArrowThresholdMeters: 180,
      minSpacingMeters: 50
    },
    restrictedMarker: {
      fillColor: "#fffbeb",
      strokeColor: "#d97706",
      strokeWidth: 3,
      symbolColor: "#92400e",
      symbolLineWidth: 3,
      radius: 14,
      dotRadius: 2
    },
    turnBanMarker: {
      fillColor: "#ffffff",
      strokeColor: "#be123c",
      strokeWidth: 3,
      radius: 14,
      arrowColor: "#111827",
      arrowLineWidth: 2.5
    },
    selectedFocus: {
      strokeColor: "#0284c7",
      fillColor: "rgba(14,165,233,0.12)",
      strokeWidth: 4,
      routeLineWidth: 9,
      routeAlpha: 0.86,
      innerRadius: 24,
      outerRadius: 31
    }
  },
  review: {
    routeIssue: {
      defaultColor: "#dc2626",
      turnColor: "#be123c",
      disconnectedLineWidth: 4,
      illegalLineWidth: 8,
      disconnectedDetailLineWidth: 3,
      illegalDetailLineWidth: 5,
      alpha: 0.82,
      dashedIssueDash: [8, 6],
      noEntrySymbolFillColor: "#fee2e2",
      noEntrySymbolStrokeColor: "#b91c1c",
      illegalSymbolFillColor: "#ffffff",
      illegalSymbolStrokeColor: "#dc2626"
    },
    fastestRoute: {
      halo: {
        strokeColor: "rgba(255,255,255,0.94)",
        strokeWidth: 10
      },
      route: {
        strokeColor: "#0284c7",
        strokeWidth: 5,
        dash: [14, 8]
      }
    },
    matchedMovement: {
      haloColor: "rgba(255,255,255,0.88)",
      haloWidth: 11,
      haloAlpha: 0.84,
      matchedColor: "#7c3aed",
      unmatchedColor: "#ef4444",
      lineWidth: 6,
      alpha: 0.7,
      matchedNodeStrokeColor: "#6d28d9",
      unmatchedNodeStrokeColor: "#dc2626",
      nodeFillColor: "#ffffff",
      nodeRadius: 9,
      nodeStrokeWidth: 1
    }
  },
  routeReplay: {
    userColor: "#ea580c",
    shortestColor: "#0284c7",
    haloFillColor: "rgba(255,255,255,0.96)",
    outerStrokeColor: "rgba(15,23,42,0.28)",
    outerRadius: 21,
    innerRadius: 8,
    haloRadius: 15,
    strokeWidth: 4
  },
  nodes: {
    fillColor: "rgba(255,255,255,0.72)",
    strokeColor: "rgba(100,116,139,0.28)",
    strokeWidth: 1,
    radius: 2.25,
    matchedStartColor: "#2563eb",
    matchedNodeColor: "#7c3aed",
    matchedNodeRadius: 7
  },
  zoom: {
    thresholds: {
      defaultZoom: 1,
      minZoom: 0.75,
      maxZoom: 10,
      step: 0.25,
      panMargin: 80
    },
    decluttering: {
      osmRoadLabelsRequireQaOverlay: false,
      oneWayArrowMinSpacingMeters: 50,
      longRoadArrowThresholdMeters: 180
    }
  }
} as const satisfies TopopassStreetAtlasStyle;
