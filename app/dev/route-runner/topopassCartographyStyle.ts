export type TopopassLineStyle = {
  strokeColor: string;
  strokeWidth: number;
  casingColor?: string;
  casingWidth?: number;
  dash?: readonly number[];
  alpha?: number;
};

export type TopopassContextLineStyle = TopopassLineStyle & {
  minViewportScale: number;
  lowZoomAlpha: number;
  mediumZoomAlpha: number;
  highZoomAlpha: number;
};

export type TopopassContextMarkerStyle = {
  minViewportScale: number;
  lowZoomAlpha: number;
  mediumZoomAlpha: number;
  highZoomAlpha: number;
  collisionPadding: number;
};

export type TopopassContextMarkerVisualStyle = {
  radius: number;
  fillColor: string;
  strokeColor: string;
  haloColor: string;
  priority: number;
};

export type TopopassLearnerMarkerStyle = {
  fillColor: string;
  strokeColor: string;
  haloColor: string;
  haloStrokeColor: string;
  haloRadiusPadding: number;
  strokeWidth: number;
  radius: number;
  font: string;
  textColor: string;
};

export type TopopassCheckpointStateStyle = {
  haloColor: string;
  strokeColor: string;
  strokeWidth: number;
  outerRadiusPadding: number;
  symbolColor: string;
  symbolLineWidth: number;
  dash?: readonly number[];
};

export type TopopassCalloutStyle = {
  fillColor: string;
  strokeColor: string;
  textColor: string;
  connectorColor: string;
  shadowColor: string;
  font: string;
  strokeWidth: number;
  connectorWidth: number;
  paddingX: number;
  paddingY: number;
  borderRadius: number;
  maxWidth: number;
  offsetX: number;
  offsetY: number;
  alpha: number;
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

export type TopopassContextLabelStyle = TopopassLabelStyle & {
  fontSize: number;
  approximateCharacterWidth: number;
  minViewportScale: number;
  collisionPadding: number;
};

export type TopopassZoomThresholds = {
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  step: number;
  panMargin: number;
};

export type TopopassZoomDeclutteringStyle = {
  osmRoadLabelsRequireQaOverlay: boolean;
  oneWayArrowMinSpacingMeters: number;
  longRoadArrowThresholdMeters: number;
  mediumOneWayArrowSpacingMultiplier: number;
  highOneWayArrowSpacingMultiplier: number;
  lowDetailViewportScale: number;
  highDetailViewportScale: number;
  mediumOneWayMinRoadLengthMeters: number;
  restrictionSymbolCollisionPadding: number;
  reviewRestrictionProximityMeters: number;
  lowRestrictionSymbolAlpha: number;
  mediumRestrictionSymbolAlpha: number;
  highRestrictionSymbolAlpha: number;
  lowRestrictionSymbolScale: number;
  mediumRestrictionSymbolScale: number;
  highRestrictionSymbolScale: number;
  lowRestrictionOverlayAlphaMultiplier: number;
  mediumRestrictionOverlayAlphaMultiplier: number;
  highRestrictionOverlayAlphaMultiplier: number;
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
    context: Record<
      | "station"
      | "landmark"
      | "public_building"
      | "open_space"
      | "learner_reference"
      | "park"
      | "water"
      | "area"
      | "bridge",
      TopopassContextLabelStyle
    >;
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
      station: number;
      landmark: number;
      publicBuilding: number;
      openSpace: number;
      learnerReference: number;
      park: number;
      water: number;
      bridge: number;
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
  contextFeatures: {
    rail: TopopassContextLineStyle;
    bridge: TopopassContextLineStyle;
    stationMarker: TopopassContextMarkerStyle;
    landmarkMarker: TopopassContextMarkerStyle;
    importantLandmarkMarker: TopopassContextMarkerStyle;
    publicBuildingMarker: TopopassContextMarkerStyle;
    openSpaceMarker: TopopassContextMarkerStyle;
    learnerReferenceMarker: TopopassContextMarkerStyle;
  };
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
    | "hospital"
    | "park"
    | "market"
    | "dock"
    | "civic"
    | "church"
    | "museum"
    | "generic"
    | "important"
    | "publicBuilding"
    | "openSpace"
    | "learnerReference",
    TopopassContextMarkerVisualStyle
  >;
  routeOverlays: Record<
    | "rawRoute"
    | "snappedRoute"
    | "matchedRoute"
    | "shortestLegalRoute"
    | "acceptedAlternativeRoute"
    | "illegalMovement"
    | "inefficientSection"
    | "backtrackSection",
    TopopassLineStyle
  >;
  exerciseMarkers: {
    haloFillColor: string;
    textColor: string;
    haloRadiusPadding: number;
    reservationPadding: number;
    minSeparation: number;
    strokeWidth: number;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetY: number;
    start: { fillColor: string; radius: number; text: string; font: string };
    checkpoint: { fillColor: string; radius: number; textPrefix: string; font: string };
    requiredVia: { fillColor: string; radius: number; textPrefix: string; font: string };
    destination: { fillColor: string; radius: number; text: string; font: string };
  };
  hints: {
    snapPreview: TopopassLineStyle;
    snappedPointMatchedColor: string;
    snappedPointUnmatchedColor: string;
    snappedPointHaloColor: string;
    snappedPointStrokeColor: string;
    snappedPointStrokeWidth: number;
    snappedPointRadius: number;
  };
  learnerOverlays: {
    drawOrder: readonly [
      "base-context",
      "roads",
      "base-labels",
      "correct-route",
      "accepted-alternative-route",
      "attempted-route",
      "route-warnings",
      "checkpoint-markers",
      "start-destination-markers",
      "hints-next-road",
      "review-callouts",
      "selected-focus"
    ];
    markerLabels: {
      start: TopopassLabelStyle;
      destination: TopopassLabelStyle;
      checkpoint: TopopassLabelStyle;
      hint: TopopassLabelStyle;
      review: TopopassLabelStyle;
    };
    markers: {
      start: TopopassLearnerMarkerStyle;
      destination: TopopassLearnerMarkerStyle;
      checkpointBase: TopopassLearnerMarkerStyle;
      requiredCheckpoint: TopopassLearnerMarkerStyle;
    };
    checkpointStates: {
      upcoming: TopopassCheckpointStateStyle;
      active: TopopassCheckpointStateStyle;
      completed: TopopassCheckpointStateStyle;
      missed: TopopassCheckpointStateStyle;
      focused: TopopassCheckpointStateStyle;
      reached: TopopassCheckpointStateStyle;
    };
    hints: {
      available: TopopassLineStyle;
      revealed: TopopassLineStyle;
      marker: {
        radius: number;
        fillColor: string;
        strokeColor: string;
        haloColor: string;
        strokeWidth: number;
      };
      callout: TopopassCalloutStyle;
      connector: TopopassLineStyle;
      nextRoadSuggestion: TopopassLineStyle;
    };
    reviewCallouts: {
      hint: TopopassCalloutStyle;
      acceptedAlternative: TopopassCalloutStyle;
      checkpointReached: TopopassCalloutStyle;
      routeCompleted: TopopassCalloutStyle;
      inefficient: TopopassCalloutStyle;
      backtrack: TopopassCalloutStyle;
      wrongTurn: TopopassCalloutStyle;
      restrictedManoeuvre: TopopassCalloutStyle;
      illegal: TopopassCalloutStyle;
      missedCheckpoint: TopopassCalloutStyle;
      focused: TopopassCalloutStyle;
    };
    warnings: {
      wrongTurn: TopopassLineStyle;
      restrictedManoeuvre: TopopassLineStyle;
      illegalSegment: TopopassLineStyle;
      inefficientSection: TopopassLineStyle;
      backtrack: TopopassLineStyle;
      missedCheckpoint: TopopassLineStyle;
    };
    selectedFocus: {
      haloColor: string;
      strokeColor: string;
      strokeWidth: number;
      routeLineWidth: number;
      routeAlpha: number;
      innerRadius: number;
      outerRadius: number;
      markerRadiusPadding: number;
    };
    touchTargets: {
      minTapTargetPx: number;
      markerHitRadius: number;
      checkpointHitRadius: number;
      hintHitRadius: number;
      reviewIssueHitRadius: number;
      restrictionHitRadius: number;
      calloutMinHeight: number;
    };
    mobileReadability: {
      labelDeclutterViewportWidthPx: number;
      compactControlGapPx: number;
      compactControlMinHeightPx: number;
      legendMaxHeightPx: number;
      mapMinHeightPx: number;
      tabletMapMinHeightPx: number;
      calloutViewportPaddingPx: number;
    };
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
      haloColor: string;
      haloLineWidth: number;
      lineWidth: number;
      tipDistance: number;
      tailDistance: number;
      longRoadArrowThresholdMeters: number;
      minSpacingMeters: number;
      mediumSpacingMultiplier: number;
      highSpacingMultiplier: number;
      shortRoadRatio: number;
      longRoadRatios: readonly number[];
      collisionPadding: number;
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
      markerRadius: number;
      markerStrokeWidth: number;
      markerHaloColor: string;
      markerHaloPadding: number;
      reservationPadding: number;
    };
    fastestRoute: {
      halo: TopopassLineStyle;
      route: TopopassLineStyle;
    };
    checkpoints: {
      completed: {
        haloColor: string;
        strokeColor: string;
        strokeWidth: number;
        outerRadiusPadding: number;
        checkColor: string;
        checkLineWidth: number;
      };
      missed: {
        haloColor: string;
        strokeColor: string;
        strokeWidth: number;
        outerRadiusPadding: number;
        crossColor: string;
        crossLineWidth: number;
        dash: readonly number[];
      };
      focused: {
        strokeColor: string;
        strokeWidth: number;
        outerRadiusPadding: number;
      };
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
    matchedNodeStrokeColor: string;
    matchedNodeStrokeWidth: number;
    matchedNodeHaloColor: string;
    matchedNodeHaloRadiusPadding: number;
  };
  zoom: {
    thresholds: TopopassZoomThresholds;
    decluttering: TopopassZoomDeclutteringStyle;
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
    context: {
      station: {
        font: "700 12px Arial, sans-serif",
        fontSize: 12,
        approximateCharacterWidth: 6.7,
        color: "rgba(15,23,42,0.84)",
        haloColor: "rgba(255,255,255,0.96)",
        haloWidth: 3.5,
        shadowColor: "rgba(255,255,255,0.48)",
        shadowBlur: 2,
        shadowOffsetY: 0,
        minViewportScale: 0.42,
        collisionPadding: 5
      },
      landmark: {
        font: "650 10.5px Arial, sans-serif",
        fontSize: 10.5,
        approximateCharacterWidth: 5.9,
        color: "rgba(15,23,42,0.72)",
        haloColor: "rgba(255,255,255,0.92)",
        haloWidth: 3,
        shadowColor: "rgba(255,255,255,0.35)",
        shadowBlur: 1.5,
        shadowOffsetY: 0,
        minViewportScale: 0.78,
        collisionPadding: 4
      },
      public_building: {
        font: "650 10px Arial, sans-serif",
        fontSize: 10,
        approximateCharacterWidth: 5.7,
        color: "rgba(51,65,85,0.68)",
        haloColor: "rgba(255,255,255,0.9)",
        haloWidth: 3,
        shadowColor: "rgba(255,255,255,0.32)",
        shadowBlur: 1,
        shadowOffsetY: 0,
        minViewportScale: 0.72,
        collisionPadding: 4
      },
      open_space: {
        font: "600 11px Arial, sans-serif",
        fontSize: 11,
        approximateCharacterWidth: 5.8,
        color: "rgba(58,94,58,0.56)",
        haloColor: "rgba(255,255,255,0.78)",
        haloWidth: 3,
        minViewportScale: 0.58,
        collisionPadding: 5
      },
      learner_reference: {
        font: "650 10px Arial, sans-serif",
        fontSize: 10,
        approximateCharacterWidth: 5.6,
        color: "rgba(88,64,44,0.62)",
        haloColor: "rgba(255,255,255,0.86)",
        haloWidth: 3,
        shadowColor: "rgba(255,255,255,0.3)",
        shadowBlur: 1,
        shadowOffsetY: 0,
        minViewportScale: 0.82,
        collisionPadding: 4
      },
      park: {
        font: "600 11px Arial, sans-serif",
        fontSize: 11,
        approximateCharacterWidth: 6,
        color: "rgba(58,94,58,0.62)",
        haloColor: "rgba(255,255,255,0.78)",
        haloWidth: 3,
        minViewportScale: 0.68,
        collisionPadding: 5
      },
      water: {
        font: "600 11px Arial, sans-serif",
        fontSize: 11,
        approximateCharacterWidth: 6,
        color: "rgba(37,99,135,0.62)",
        haloColor: "rgba(255,255,255,0.78)",
        haloWidth: 3,
        minViewportScale: 0.58,
        collisionPadding: 5
      },
      bridge: {
        font: "650 10.5px Arial, sans-serif",
        fontSize: 10.5,
        approximateCharacterWidth: 5.8,
        color: "rgba(88,64,44,0.66)",
        haloColor: "rgba(255,255,255,0.82)",
        haloWidth: 3,
        shadowColor: "rgba(255,255,255,0.34)",
        shadowBlur: 1,
        shadowOffsetY: 0,
        minViewportScale: 0.72,
        collisionPadding: 5
      },
      area: {
        font: "650 12px Arial, sans-serif",
        fontSize: 12,
        approximateCharacterWidth: 7.2,
        color: "rgba(71,85,105,0.46)",
        haloColor: "rgba(255,255,255,0.72)",
        haloWidth: 3,
        minViewportScale: 0.5,
        collisionPadding: 7
      }
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
      station: 4,
      landmark: 6,
      publicBuilding: 6,
      openSpace: 7,
      learnerReference: 7,
      park: 7,
      water: 7,
      bridge: 6,
      area: 8,
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
  contextFeatures: {
    rail: {
      casingColor: "rgba(255,255,255,0.8)",
      strokeColor: "#6b7280",
      casingWidth: 9,
      strokeWidth: 4,
      dash: [8, 7],
      minViewportScale: 0.16,
      lowZoomAlpha: 0.32,
      mediumZoomAlpha: 0.56,
      highZoomAlpha: 0.78
    },
    bridge: {
      casingColor: "rgba(255,255,255,0.82)",
      strokeColor: "#8b6f47",
      casingWidth: 11,
      strokeWidth: 4,
      dash: [10, 6],
      minViewportScale: 0.52,
      lowZoomAlpha: 0.36,
      mediumZoomAlpha: 0.62,
      highZoomAlpha: 0.76
    },
    stationMarker: {
      minViewportScale: 0.42,
      lowZoomAlpha: 0.7,
      mediumZoomAlpha: 0.88,
      highZoomAlpha: 1,
      collisionPadding: 7
    },
    landmarkMarker: {
      minViewportScale: 0.74,
      lowZoomAlpha: 0.56,
      mediumZoomAlpha: 0.78,
      highZoomAlpha: 0.92,
      collisionPadding: 6
    },
    importantLandmarkMarker: {
      minViewportScale: 0.58,
      lowZoomAlpha: 0.68,
      mediumZoomAlpha: 0.86,
      highZoomAlpha: 1,
      collisionPadding: 7
    },
    publicBuildingMarker: {
      minViewportScale: 0.68,
      lowZoomAlpha: 0.58,
      mediumZoomAlpha: 0.78,
      highZoomAlpha: 0.92,
      collisionPadding: 6
    },
    openSpaceMarker: {
      minViewportScale: 0.72,
      lowZoomAlpha: 0.5,
      mediumZoomAlpha: 0.72,
      highZoomAlpha: 0.86,
      collisionPadding: 6
    },
    learnerReferenceMarker: {
      minViewportScale: 0.84,
      lowZoomAlpha: 0.48,
      mediumZoomAlpha: 0.72,
      highZoomAlpha: 0.88,
      collisionPadding: 6
    }
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
    },
    important: {
      radius: 8,
      fillColor: "#ffffff",
      strokeColor: "#334155",
      haloColor: "rgba(51,65,85,0.13)",
      priority: 4
    },
    publicBuilding: {
      radius: 7,
      fillColor: "#f8fafc",
      strokeColor: "#475569",
      haloColor: "rgba(71,85,105,0.11)",
      priority: 5
    },
    openSpace: {
      radius: 7,
      fillColor: "#ecfdf5",
      strokeColor: "#16a34a",
      haloColor: "rgba(22,163,74,0.11)",
      priority: 6
    },
    learnerReference: {
      radius: 6,
      fillColor: "#fff7ed",
      strokeColor: "#a16207",
      haloColor: "rgba(161,98,7,0.1)",
      priority: 6
    }
  },
  routeOverlays: {
    rawRoute: {
      casingColor: "rgba(255,255,255,0.92)",
      casingWidth: 9,
      strokeColor: "#f97316",
      strokeWidth: 5
    },
    snappedRoute: {
      strokeColor: "#22c55e",
      strokeWidth: 3,
      dash: [6, 5]
    },
    matchedRoute: {
      casingColor: "rgba(255,255,255,0.88)",
      casingWidth: 11,
      strokeColor: "#7c3aed",
      strokeWidth: 7,
      alpha: 0.9
    },
    shortestLegalRoute: {
      casingColor: "rgba(255,255,255,0.9)",
      casingWidth: 9,
      strokeColor: "#0284c7",
      strokeWidth: 4.5,
      dash: [14, 8],
      alpha: 0.9
    },
    acceptedAlternativeRoute: {
      casingColor: "rgba(255,255,255,0.84)",
      casingWidth: 7,
      strokeColor: "#0f766e",
      strokeWidth: 3.5,
      dash: [3, 7],
      alpha: 0.78
    },
    illegalMovement: {
      casingColor: "rgba(255,255,255,0.9)",
      casingWidth: 12,
      strokeColor: "#dc2626",
      strokeWidth: 8.5,
      alpha: 0.9
    },
    inefficientSection: {
      casingColor: "rgba(255,255,255,0.82)",
      casingWidth: 8,
      strokeColor: "#d97706",
      strokeWidth: 4,
      dash: [9, 7],
      alpha: 0.78
    },
    backtrackSection: {
      casingColor: "rgba(255,255,255,0.82)",
      casingWidth: 8,
      strokeColor: "#9333ea",
      strokeWidth: 4,
      dash: [4, 5],
      alpha: 0.72
    }
  },
  exerciseMarkers: {
    haloFillColor: "rgba(255,255,255,0.96)",
    textColor: "#ffffff",
    haloRadiusPadding: 6,
    reservationPadding: 16,
    minSeparation: 34,
    strokeWidth: 3.5,
    shadowColor: "rgba(15,23,42,0.28)",
    shadowBlur: 12,
    shadowOffsetY: 2,
    start: { fillColor: "#047857", radius: 18, text: "START", font: "800 9px Arial, sans-serif" },
    checkpoint: { fillColor: "#f97316", radius: 15, textPrefix: "CP", font: "800 9px Arial, sans-serif" },
    requiredVia: { fillColor: "#d97706", radius: 16, textPrefix: "VIA", font: "800 8px Arial, sans-serif" },
    destination: { fillColor: "#be123c", radius: 18, text: "END", font: "800 10px Arial, sans-serif" }
  },
  hints: {
    snapPreview: {
      strokeColor: "#0d9488",
      strokeWidth: 2.4,
      alpha: 0.82,
      dash: [5, 5]
    },
    snappedPointMatchedColor: "#16a34a",
    snappedPointUnmatchedColor: "#dc2626",
    snappedPointHaloColor: "rgba(255,255,255,0.9)",
    snappedPointStrokeColor: "rgba(15,23,42,0.42)",
    snappedPointStrokeWidth: 1.5,
    snappedPointRadius: 4
  },
  learnerOverlays: {
    drawOrder: [
      "base-context",
      "roads",
      "base-labels",
      "correct-route",
      "accepted-alternative-route",
      "attempted-route",
      "route-warnings",
      "checkpoint-markers",
      "start-destination-markers",
      "hints-next-road",
      "review-callouts",
      "selected-focus"
    ],
    markerLabels: {
      start: {
        font: "800 10px Arial, sans-serif",
        color: "#065f46",
        haloColor: "rgba(255,255,255,0.96)",
        haloWidth: 4,
        yOffset: -33
      },
      destination: {
        font: "800 10px Arial, sans-serif",
        color: "#9f1239",
        haloColor: "rgba(255,255,255,0.96)",
        haloWidth: 4,
        yOffset: -33
      },
      checkpoint: {
        font: "800 9px Arial, sans-serif",
        color: "#92400e",
        haloColor: "rgba(255,255,255,0.94)",
        haloWidth: 3,
        yOffset: -28
      },
      hint: {
        font: "700 10px Arial, sans-serif",
        color: "#0f766e",
        haloColor: "rgba(255,255,255,0.92)",
        haloWidth: 3
      },
      review: {
        font: "800 10px Arial, sans-serif",
        color: "#7f1d1d",
        haloColor: "rgba(255,255,255,0.96)",
        haloWidth: 4
      }
    },
    markers: {
      start: {
        fillColor: "#047857",
        strokeColor: "#ffffff",
        haloColor: "rgba(4,120,87,0.16)",
        haloStrokeColor: "rgba(6,95,70,0.34)",
        haloRadiusPadding: 9,
        strokeWidth: 3.5,
        radius: 18,
        font: "800 9px Arial, sans-serif",
        textColor: "#ffffff"
      },
      destination: {
        fillColor: "#be123c",
        strokeColor: "#ffffff",
        haloColor: "rgba(190,18,60,0.16)",
        haloStrokeColor: "rgba(159,18,57,0.36)",
        haloRadiusPadding: 9,
        strokeWidth: 3.5,
        radius: 18,
        font: "800 10px Arial, sans-serif",
        textColor: "#ffffff"
      },
      checkpointBase: {
        fillColor: "#f97316",
        strokeColor: "#ffffff",
        haloColor: "rgba(249,115,22,0.14)",
        haloStrokeColor: "rgba(194,65,12,0.28)",
        haloRadiusPadding: 7,
        strokeWidth: 3,
        radius: 15,
        font: "800 9px Arial, sans-serif",
        textColor: "#ffffff"
      },
      requiredCheckpoint: {
        fillColor: "#d97706",
        strokeColor: "#ffffff",
        haloColor: "rgba(217,119,6,0.16)",
        haloStrokeColor: "rgba(146,64,14,0.32)",
        haloRadiusPadding: 8,
        strokeWidth: 3.25,
        radius: 16,
        font: "800 8px Arial, sans-serif",
        textColor: "#ffffff"
      }
    },
    checkpointStates: {
      upcoming: {
        haloColor: "rgba(251,146,60,0.1)",
        strokeColor: "#fb923c",
        strokeWidth: 2.5,
        outerRadiusPadding: 6,
        symbolColor: "#ffffff",
        symbolLineWidth: 2,
        dash: [4, 4]
      },
      active: {
        haloColor: "rgba(14,165,233,0.16)",
        strokeColor: "#0284c7",
        strokeWidth: 3,
        outerRadiusPadding: 9,
        symbolColor: "#ffffff",
        symbolLineWidth: 2.2
      },
      completed: {
        haloColor: "rgba(22,163,74,0.14)",
        strokeColor: "#16a34a",
        strokeWidth: 3,
        outerRadiusPadding: 8,
        symbolColor: "#ffffff",
        symbolLineWidth: 2.4
      },
      missed: {
        haloColor: "rgba(220,38,38,0.16)",
        strokeColor: "#dc2626",
        strokeWidth: 3.5,
        outerRadiusPadding: 10,
        symbolColor: "#ffffff",
        symbolLineWidth: 3,
        dash: [5, 4]
      },
      focused: {
        haloColor: "rgba(14,165,233,0.18)",
        strokeColor: "#0284c7",
        strokeWidth: 4,
        outerRadiusPadding: 13,
        symbolColor: "#ffffff",
        symbolLineWidth: 2.5
      },
      reached: {
        haloColor: "rgba(22,163,74,0.16)",
        strokeColor: "#059669",
        strokeWidth: 3.25,
        outerRadiusPadding: 9,
        symbolColor: "#ffffff",
        symbolLineWidth: 2.4
      }
    },
    hints: {
      available: {
        strokeColor: "#14b8a6",
        strokeWidth: 2,
        alpha: 0.54,
        dash: [3, 6]
      },
      revealed: {
        strokeColor: "#0d9488",
        strokeWidth: 2.4,
        alpha: 0.82,
        dash: [5, 5]
      },
      marker: {
        radius: 5,
        fillColor: "#ccfbf1",
        strokeColor: "#0f766e",
        haloColor: "rgba(255,255,255,0.88)",
        strokeWidth: 1.75
      },
      callout: {
        fillColor: "rgba(240,253,250,0.96)",
        strokeColor: "#0f766e",
        textColor: "#134e4a",
        connectorColor: "rgba(15,118,110,0.72)",
        shadowColor: "rgba(15,23,42,0.14)",
        font: "700 10px Arial, sans-serif",
        strokeWidth: 1.5,
        connectorWidth: 1.5,
        paddingX: 8,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 128,
        offsetX: 16,
        offsetY: -34,
        alpha: 0.94
      },
      connector: {
        strokeColor: "#0f766e",
        strokeWidth: 1.5,
        alpha: 0.72,
        dash: [3, 4]
      },
      nextRoadSuggestion: {
        casingColor: "rgba(255,255,255,0.82)",
        casingWidth: 6,
        strokeColor: "#0f766e",
        strokeWidth: 3,
        alpha: 0.64,
        dash: [7, 6]
      }
    },
    reviewCallouts: {
      hint: {
        fillColor: "rgba(240,253,250,0.96)",
        strokeColor: "#0f766e",
        textColor: "#134e4a",
        connectorColor: "rgba(15,118,110,0.72)",
        shadowColor: "rgba(15,23,42,0.14)",
        font: "700 10px Arial, sans-serif",
        strokeWidth: 1.5,
        connectorWidth: 1.5,
        paddingX: 8,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 128,
        offsetX: 16,
        offsetY: -34,
        alpha: 0.94
      },
      acceptedAlternative: {
        fillColor: "rgba(240,253,250,0.96)",
        strokeColor: "#0f766e",
        textColor: "#134e4a",
        connectorColor: "rgba(15,118,110,0.74)",
        shadowColor: "rgba(15,23,42,0.14)",
        font: "800 10px Arial, sans-serif",
        strokeWidth: 1.75,
        connectorWidth: 1.5,
        paddingX: 8,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 134,
        offsetX: 16,
        offsetY: -36,
        alpha: 0.95
      },
      checkpointReached: {
        fillColor: "rgba(240,253,244,0.96)",
        strokeColor: "#16a34a",
        textColor: "#14532d",
        connectorColor: "rgba(22,163,74,0.72)",
        shadowColor: "rgba(15,23,42,0.14)",
        font: "800 10px Arial, sans-serif",
        strokeWidth: 1.75,
        connectorWidth: 1.5,
        paddingX: 8,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 132,
        offsetX: 16,
        offsetY: -36,
        alpha: 0.95
      },
      routeCompleted: {
        fillColor: "rgba(236,253,245,0.97)",
        strokeColor: "#047857",
        textColor: "#064e3b",
        connectorColor: "rgba(4,120,87,0.76)",
        shadowColor: "rgba(15,23,42,0.16)",
        font: "800 10px Arial, sans-serif",
        strokeWidth: 2,
        connectorWidth: 1.75,
        paddingX: 9,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 140,
        offsetX: 16,
        offsetY: -38,
        alpha: 0.96
      },
      inefficient: {
        fillColor: "rgba(255,251,235,0.96)",
        strokeColor: "#d97706",
        textColor: "#78350f",
        connectorColor: "rgba(217,119,6,0.74)",
        shadowColor: "rgba(15,23,42,0.15)",
        font: "800 10px Arial, sans-serif",
        strokeWidth: 1.8,
        connectorWidth: 1.5,
        paddingX: 8,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 138,
        offsetX: 18,
        offsetY: -38,
        alpha: 0.96
      },
      backtrack: {
        fillColor: "rgba(250,245,255,0.96)",
        strokeColor: "#9333ea",
        textColor: "#581c87",
        connectorColor: "rgba(147,51,234,0.72)",
        shadowColor: "rgba(15,23,42,0.15)",
        font: "800 10px Arial, sans-serif",
        strokeWidth: 1.8,
        connectorWidth: 1.5,
        paddingX: 8,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 138,
        offsetX: 18,
        offsetY: -38,
        alpha: 0.95
      },
      wrongTurn: {
        fillColor: "rgba(255,247,237,0.96)",
        strokeColor: "#ea580c",
        textColor: "#7c2d12",
        connectorColor: "rgba(234,88,12,0.76)",
        shadowColor: "rgba(15,23,42,0.16)",
        font: "800 10px Arial, sans-serif",
        strokeWidth: 2,
        connectorWidth: 1.75,
        paddingX: 8,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 136,
        offsetX: 18,
        offsetY: -40,
        alpha: 0.96
      },
      restrictedManoeuvre: {
        fillColor: "rgba(255,247,237,0.97)",
        strokeColor: "#be123c",
        textColor: "#7f1d1d",
        connectorColor: "rgba(190,18,60,0.78)",
        shadowColor: "rgba(15,23,42,0.18)",
        font: "800 10px Arial, sans-serif",
        strokeWidth: 2.25,
        connectorWidth: 1.85,
        paddingX: 8,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 142,
        offsetX: 18,
        offsetY: -42,
        alpha: 0.97
      },
      illegal: {
        fillColor: "rgba(254,242,242,0.97)",
        strokeColor: "#dc2626",
        textColor: "#7f1d1d",
        connectorColor: "rgba(220,38,38,0.82)",
        shadowColor: "rgba(15,23,42,0.2)",
        font: "800 10px Arial, sans-serif",
        strokeWidth: 2.5,
        connectorWidth: 2,
        paddingX: 8,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 144,
        offsetX: 18,
        offsetY: -44,
        alpha: 0.98
      },
      missedCheckpoint: {
        fillColor: "rgba(254,242,242,0.97)",
        strokeColor: "#dc2626",
        textColor: "#7f1d1d",
        connectorColor: "rgba(220,38,38,0.8)",
        shadowColor: "rgba(15,23,42,0.2)",
        font: "800 10px Arial, sans-serif",
        strokeWidth: 2.4,
        connectorWidth: 1.9,
        paddingX: 8,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 146,
        offsetX: 18,
        offsetY: -44,
        alpha: 0.98
      },
      focused: {
        fillColor: "rgba(239,246,255,0.97)",
        strokeColor: "#0284c7",
        textColor: "#075985",
        connectorColor: "rgba(2,132,199,0.82)",
        shadowColor: "rgba(15,23,42,0.2)",
        font: "800 10px Arial, sans-serif",
        strokeWidth: 2.25,
        connectorWidth: 1.85,
        paddingX: 8,
        paddingY: 5,
        borderRadius: 7,
        maxWidth: 144,
        offsetX: 18,
        offsetY: -42,
        alpha: 0.98
      }
    },
    warnings: {
      wrongTurn: {
        casingColor: "rgba(255,255,255,0.84)",
        casingWidth: 9,
        strokeColor: "#ea580c",
        strokeWidth: 4.5,
        alpha: 0.84,
        dash: [6, 5]
      },
      restrictedManoeuvre: {
        casingColor: "rgba(255,255,255,0.88)",
        casingWidth: 10,
        strokeColor: "#be123c",
        strokeWidth: 5.5,
        alpha: 0.88
      },
      illegalSegment: {
        casingColor: "rgba(255,255,255,0.9)",
        casingWidth: 12,
        strokeColor: "#dc2626",
        strokeWidth: 8.5,
        alpha: 0.9
      },
      inefficientSection: {
        casingColor: "rgba(255,255,255,0.82)",
        casingWidth: 8,
        strokeColor: "#d97706",
        strokeWidth: 4,
        dash: [9, 7],
        alpha: 0.78
      },
      backtrack: {
        casingColor: "rgba(255,255,255,0.82)",
        casingWidth: 8,
        strokeColor: "#9333ea",
        strokeWidth: 4,
        dash: [4, 5],
        alpha: 0.72
      },
      missedCheckpoint: {
        casingColor: "rgba(255,255,255,0.86)",
        casingWidth: 8,
        strokeColor: "#dc2626",
        strokeWidth: 4.5,
        dash: [5, 4],
        alpha: 0.84
      }
    },
    selectedFocus: {
      haloColor: "rgba(14,165,233,0.16)",
      strokeColor: "#0284c7",
      strokeWidth: 4,
      routeLineWidth: 9,
      routeAlpha: 0.86,
      innerRadius: 24,
      outerRadius: 31,
      markerRadiusPadding: 13
    },
    touchTargets: {
      minTapTargetPx: 44,
      markerHitRadius: 24,
      checkpointHitRadius: 24,
      hintHitRadius: 22,
      reviewIssueHitRadius: 26,
      restrictionHitRadius: 22,
      calloutMinHeight: 34
    },
    mobileReadability: {
      labelDeclutterViewportWidthPx: 480,
      compactControlGapPx: 6,
      compactControlMinHeightPx: 44,
      legendMaxHeightPx: 192,
      mapMinHeightPx: 420,
      tabletMapMinHeightPx: 560,
      calloutViewportPaddingPx: 8
    }
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
      haloColor: "rgba(255,255,255,0.82)",
      haloLineWidth: 7,
      lineWidth: 3.5,
      tipDistance: 14,
      tailDistance: 12,
      longRoadArrowThresholdMeters: 180,
      minSpacingMeters: 56,
      mediumSpacingMultiplier: 1.35,
      highSpacingMultiplier: 1,
      shortRoadRatio: 0.62,
      longRoadRatios: [0.24, 0.76],
      collisionPadding: 8
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
      illegalSymbolStrokeColor: "#dc2626",
      markerRadius: 16,
      markerStrokeWidth: 3,
      markerHaloColor: "rgba(255,255,255,0.96)",
      markerHaloPadding: 5,
      reservationPadding: 12
    },
    fastestRoute: {
      halo: {
        strokeColor: "rgba(255,255,255,0.9)",
        strokeWidth: 9
      },
      route: {
        strokeColor: "#0284c7",
        strokeWidth: 4.5,
        dash: [14, 8]
      }
    },
    checkpoints: {
      completed: {
        haloColor: "rgba(22,163,74,0.14)",
        strokeColor: "#16a34a",
        strokeWidth: 3,
        outerRadiusPadding: 8,
        checkColor: "#ffffff",
        checkLineWidth: 2.4
      },
      missed: {
        haloColor: "rgba(220,38,38,0.16)",
        strokeColor: "#dc2626",
        strokeWidth: 3.5,
        outerRadiusPadding: 10,
        crossColor: "#ffffff",
        crossLineWidth: 3,
        dash: [5, 4]
      },
      focused: {
        strokeColor: "#0284c7",
        strokeWidth: 4,
        outerRadiusPadding: 13
      }
    },
    matchedMovement: {
      haloColor: "rgba(255,255,255,0.9)",
      haloWidth: 12,
      haloAlpha: 0.84,
      matchedColor: "#7c3aed",
      unmatchedColor: "#ef4444",
      lineWidth: 6.5,
      alpha: 0.74,
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
    matchedNodeRadius: 7,
    matchedNodeStrokeColor: "#ffffff",
    matchedNodeStrokeWidth: 2,
    matchedNodeHaloColor: "rgba(124,58,237,0.22)",
    matchedNodeHaloRadiusPadding: 5
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
      oneWayArrowMinSpacingMeters: 56,
      longRoadArrowThresholdMeters: 180,
      mediumOneWayArrowSpacingMultiplier: 1.35,
      highOneWayArrowSpacingMultiplier: 1,
      lowDetailViewportScale: 0.5,
      highDetailViewportScale: 0.95,
      mediumOneWayMinRoadLengthMeters: 180,
      restrictionSymbolCollisionPadding: 8,
      reviewRestrictionProximityMeters: 72,
      lowRestrictionSymbolAlpha: 0.42,
      mediumRestrictionSymbolAlpha: 0.78,
      highRestrictionSymbolAlpha: 1,
      lowRestrictionSymbolScale: 0.82,
      mediumRestrictionSymbolScale: 0.92,
      highRestrictionSymbolScale: 1,
      lowRestrictionOverlayAlphaMultiplier: 0.32,
      mediumRestrictionOverlayAlphaMultiplier: 0.68,
      highRestrictionOverlayAlphaMultiplier: 1
    }
  }
} as const satisfies TopopassStreetAtlasStyle;
