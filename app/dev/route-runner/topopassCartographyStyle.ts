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
};

export type TopopassLabelStyle = {
  font: string;
  color: string;
  haloColor: string;
  haloWidth: number;
  yOffset?: number;
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
    osm: Record<"primary" | "secondary" | "tertiary" | "residential" | "service" | "unknown", TopopassRoadClassStyle>;
  };
  labels: {
    road: TopopassLabelStyle;
    area: TopopassLabelStyle;
    landmark: TopopassLabelStyle;
    stop: TopopassLabelStyle;
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
    };
    park: {
      garden: { fillColor: string; strokeColor: string };
      square: { fillColor: string; strokeColor: string };
    };
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
    backgroundColor: "#eef3f8"
  },
  roads: {
    syntheticThresholds: {
      majorMinDistanceMeters: 155,
      secondaryMinDistanceMeters: 135,
      serviceMaxDistanceMeters: 126
    },
    synthetic: {
      major: {
        casingColor: "#fff7ed",
        strokeColor: "#f3c44f",
        casingWidth: 15,
        strokeWidth: 9
      },
      secondary: {
        casingColor: "#ffffff",
        strokeColor: "#f6d58a",
        casingWidth: 12,
        strokeWidth: 7
      },
      oneWay: {
        casingColor: "#ffffff",
        strokeColor: "#bfdbfe",
        casingWidth: 11,
        strokeWidth: 6
      },
      noEntry: {
        casingColor: "#fee2e2",
        strokeColor: "#fecaca",
        casingWidth: 11,
        strokeWidth: 6
      },
      restricted: {
        casingColor: "#fed7aa",
        strokeColor: "#fdba74",
        casingWidth: 11,
        strokeWidth: 5,
        dash: [10, 6]
      },
      service: {
        casingColor: "#ffffff",
        strokeColor: "#dbe2ea",
        casingWidth: 8,
        strokeWidth: 3
      },
      local: {
        casingColor: "#ffffff",
        strokeColor: "#cbd5e1",
        casingWidth: 9,
        strokeWidth: 4.5
      }
    },
    osm: {
      primary: {
        casingColor: "#fff7ed",
        strokeColor: "#f5c84c",
        casingWidth: 14,
        strokeWidth: 8
      },
      secondary: {
        casingColor: "#ffffff",
        strokeColor: "#f4d27c",
        casingWidth: 11,
        strokeWidth: 6
      },
      tertiary: {
        casingColor: "#ffffff",
        strokeColor: "#f4d27c",
        casingWidth: 11,
        strokeWidth: 6
      },
      residential: {
        casingColor: "#ffffff",
        strokeColor: "#cbd5e1",
        casingWidth: 8,
        strokeWidth: 4
      },
      service: {
        casingColor: "#ffffff",
        strokeColor: "#d8e0ea",
        casingWidth: 6,
        strokeWidth: 2.5
      },
      unknown: {
        casingColor: "#ffffff",
        strokeColor: "#cbd5e1",
        casingWidth: 7,
        strokeWidth: 3.5
      }
    }
  },
  labels: {
    road: {
      font: "600 11px Arial, sans-serif",
      color: "rgba(51,65,85,0.78)",
      haloColor: "rgba(255,255,255,0.94)",
      haloWidth: 3
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
    priorities: {
      majorRoad: 3,
      secondaryRoad: 4,
      restrictedRoad: 5,
      localRoad: 6,
      area: 2,
      exerciseStop: 10
    }
  },
  background: {
    water: {
      canal: { fillColor: "#dbeafe", strokeColor: "#bfdbfe" },
      basin: { fillColor: "#c7ddf8", strokeColor: "#93c5fd" }
    },
    park: {
      garden: { fillColor: "#dcfce7", strokeColor: "#bbf7d0" },
      square: { fillColor: "#bbf7d0", strokeColor: "#86efac" }
    },
    landBlock: {
      stationQuarter: { fillColor: "#e0e7ff", strokeColor: "#c7d2fe" },
      goodsYard: { fillColor: "#f1f5f9", strokeColor: "#cbd5e1" },
      marketQuarter: { fillColor: "#f8fafc", strokeColor: "#e2e8f0" },
      civicQuarter: { fillColor: "#e0f2fe", strokeColor: "#bae6fd" }
    },
    polygonStrokeWidth: 1.5
  },
  rail: {
    casingColor: "rgba(255,255,255,0.86)",
    strokeColor: "#64748b",
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
      osmRoadLabelsRequireQaOverlay: true,
      oneWayArrowMinSpacingMeters: 50,
      longRoadArrowThresholdMeters: 180
    }
  }
} as const satisfies TopopassStreetAtlasStyle;
