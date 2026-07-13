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
  shape: "pin" | "circle";
  fillColor: string;
  strokeColor: string;
  haloColor: string;
  haloStrokeColor: string;
  haloRadiusPadding: number;
  strokeWidth: number;
  radius: number;
  font: string;
  textColor: string;
  pinTipLength?: number;
  innerFillColor?: string;
  innerTextColor?: string;
  innerRadiusRatio?: number;
  asset?: TopopassMarkerAssetStyle;
};

export type TopopassAtlasSymbolKind =
  | "station"
  | "hospital"
  | "religious"
  | "education"
  | "civic"
  | "museum"
  | "market"
  | "parking"
  | "pier"
  | "landmark"
  | "open-space"
  | "generic";

export type TopopassAtlasSymbolStyle = {
  size: number;
  fillColor: string;
  strokeColor: string;
  detailColor: string;
  haloColor: string;
  haloWidth: number;
  strokeWidth: number;
  priority: number;
  minViewportScale: number;
  collisionPadding: number;
  minSpacingPixels: number;
  maxPerViewport: number;
};

export type TopopassAreaPolygonStyle = {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  minViewportScale: number;
  lowZoomAlpha: number;
  mediumZoomAlpha: number;
  highZoomAlpha: number;
  minRenderedAreaPixels: number;
  simplifyBelowViewportScale: number;
  simplifyTolerancePixels: number;
  maxStrokeWidth: number;
};

export type TopopassMarkerAssetStyle = {
  src: string;
  sourceWidth: number;
  sourceHeight: number;
  displayWidth: number;
  displayHeight: number;
  anchorX: number;
  anchorY: number;
};

export type TopopassMarkerAssetZoomScaleStyle = {
  lowZoom: number;
  midZoom: number;
  baseZoom: number;
  highZoom: number;
  veryHighZoom: number;
  maxZoom: number;
  lowScale: number;
  midScale: number;
  baseScale: number;
  highScale: number;
  veryHighScale: number;
  maxScale: number;
};

export type TopopassMarkerLabelBubbleStyle = {
  fillColor: string;
  strokeWidth: number;
  paddingX: number;
  paddingY: number;
  borderRadius: number;
  minWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetY: number;
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
  baselineZoomFactor: number;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  stepRatio: number;
  wheelSensitivity: number;
  panMargin: number;
};

export type TopopassZoomDeclutteringStyle = {
  osmRoadLabelsRequireQaOverlay: boolean;
  oneWayArrowMinSpacingMeters: number;
  longRoadArrowThresholdMeters: number;
  mediumOneWayArrowSpacingMultiplier: number;
  highOneWayArrowSpacingMultiplier: number;
  oneWayArrowAlphaMultiplier: number;
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

export type TopopassCartographicZoomScaleStyle = {
  referenceViewportScale: number;
  roadMinMultiplier: number;
  roadGain: Record<"major" | "secondary" | "local" | "service" | "restricted", number>;
  roadMaxMultiplier: Record<"major" | "secondary" | "local" | "service" | "restricted", number>;
  routeOverlayGain: number;
  routeOverlayMaxMultiplier: number;
  drawnAttemptGain: number;
  drawnAttemptMaxMultiplier: number;
  correctRouteGain: number;
  correctRouteMaxMultiplier: number;
  mistakeOverlayGain: number;
  mistakeOverlayMaxMultiplier: number;
  reviewTextGain: number;
  reviewTextMaxMultiplier: number;
  learnerMarkerGain: number;
  learnerMarkerMaxMultiplier: number;
  labelGain: Record<"major" | "secondary" | "minor" | "service" | "restricted" | "context" | "stop", number>;
  labelMaxMultiplier: Record<"major" | "secondary" | "minor" | "service" | "restricted" | "context" | "stop", number>;
  labelHaloMaxMultiplier: number;
  labelCollisionMaxMultiplier: number;
  highZoomViewportScale: number;
  veryHighZoomViewportScale: number;
  highZoomMinRoadLengthMultiplier: number;
  veryHighZoomMinRoadLengthMultiplier: number;
  markerGain: number;
  markerMaxMultiplier: number;
  restrictionGain: number;
  restrictionMaxMultiplier: number;
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
      | "road_reference"
      | "district"
      | "institution"
      | "land_use"
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
      viewportEdgePadding: number;
      roadReferenceRepeatDistance: number;
      roadReferenceMinimumVisibleSegmentLength: number;
      roadReferenceRepeatMinimumVisibleSegmentLength: number;
      roadReferenceMaxTextToSegmentRatio: number;
      roadReferenceMaxPerText: number;
      roadReferenceMaxPerViewport: number;
      roadReferenceMaxPerClass: Record<"a-road" | "b-road", number>;
      roadReferenceZoomBudgets: {
        low: number;
        principal: number;
        high: number;
        veryHigh: number;
      };
    };
    priorities: {
      roadReference: number;
      district: number;
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
      institution: number;
      contextualLandUse: number;
      exerciseStop: number;
    };
  };
  background: {
    land: { fillColor: string };
    water: {
      canal: TopopassAreaPolygonStyle;
      basin: TopopassAreaPolygonStyle;
      river: TopopassAreaPolygonStyle;
      linear: TopopassContextLineStyle;
    };
    park: {
      garden: TopopassAreaPolygonStyle;
      square: TopopassAreaPolygonStyle;
    };
    openSpace: TopopassAreaPolygonStyle;
    landUse: Record<"residential" | "commercial" | "retail" | "industrial", TopopassAreaPolygonStyle>;
    institution: Record<"education" | "healthcare" | "civic" | "religious", TopopassAreaPolygonStyle>;
    building: Record<
      "residential" | "commercial" | "retail" | "industrial" | "education" | "healthcare" | "civic" | "religious" | "other",
      TopopassAreaPolygonStyle
    >;
    pedestrianArea: { fillColor: string; strokeColor: string };
    landBlock: {
      stationQuarter: { fillColor: string; strokeColor: string };
      goodsYard: { fillColor: string; strokeColor: string };
      marketQuarter: { fillColor: string; strokeColor: string };
      civicQuarter: { fillColor: string; strokeColor: string };
    };
    layerOrder: readonly ["land-use", "parks-water", "institution", "building", "pedestrian-area"];
    geometry: {
      minimumSourceAreaSquareMeters: number;
      viewportPaddingPixels: number;
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
  atlasSymbols: {
    styles: Record<TopopassAtlasSymbolKind, TopopassAtlasSymbolStyle>;
    viewportEdgePadding: number;
    maxPerViewport: number;
    mobileMaxPerViewport: number;
    semanticScale: {
      low: number;
      principal: number;
      high: number;
      veryHigh: number;
    };
  };
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
    labelBubble: TopopassMarkerLabelBubbleStyle;
    assetZoomScale: TopopassMarkerAssetZoomScaleStyle;
    start: { fillColor: string; radius: number; text: string; compactText: string; font: string; shape: "pin"; pinTipLength: number };
    checkpoint: { fillColor: string; radius: number; textPrefix: string; font: string; shape: "circle" };
    requiredVia: { fillColor: string; radius: number; textPrefix: string; font: string; shape: "circle" };
    destination: {
      fillColor: string;
      radius: number;
      text: string;
      compactText: string;
      font: string;
      shape: "pin";
      pinTipLength: number;
    };
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
      iconOnlyDefault: boolean;
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
    showBaseMapNodes: boolean;
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
    cartographicScale: TopopassCartographicZoomScaleStyle;
  };
};

export const TOPOPASS_STREET_ATLAS_STYLE = {
  canvas: {
    backgroundColor: "#f3eddf"
  },
  roads: {
    syntheticThresholds: {
      majorMinDistanceMeters: 155,
      secondaryMinDistanceMeters: 135,
      serviceMaxDistanceMeters: 126
    },
    synthetic: {
      major: {
        casingColor: "#474239",
        strokeColor: "#f2ca3d",
        casingWidth: 19.4,
        strokeWidth: 14.2
      },
      secondary: {
        casingColor: "#6c6457",
        strokeColor: "#f5dda0",
        casingWidth: 15,
        strokeWidth: 10.2
      },
      oneWay: {
        casingColor: "#dcebf2",
        strokeColor: "#7fa9c6",
        casingWidth: 12.4,
        strokeWidth: 6.4
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
        casingColor: "#c8c0b4",
        strokeColor: "#eee8dc",
        casingWidth: 5.4,
        strokeWidth: 2.2,
        alpha: 0.64
      },
      local: {
        casingColor: "#aaa195",
        strokeColor: "#fffefa",
        casingWidth: 9.2,
        strokeWidth: 5.8
      }
    },
    osm: {
      primary: {
        casingColor: "#474239",
        strokeColor: "#f2ca3d",
        casingWidth: 18,
        strokeWidth: 13.2
      },
      secondary: {
        casingColor: "#6c6457",
        strokeColor: "#f5dda0",
        casingWidth: 14.2,
        strokeWidth: 9.8
      },
      tertiary: {
        casingColor: "#8a8173",
        strokeColor: "#fff8e7",
        casingWidth: 11.4,
        strokeWidth: 7.2
      },
      residential: {
        casingColor: "#aaa195",
        strokeColor: "#fffefa",
        casingWidth: 9.2,
        strokeWidth: 5.8
      },
      service: {
        casingColor: "#c8c0b4",
        strokeColor: "#f2eadc",
        casingWidth: 5.4,
        strokeWidth: 2.2,
        alpha: 0.66
      },
      pedestrian: {
        casingColor: "#d6cec0",
        strokeColor: "#e8e0d2",
        casingWidth: 4.1,
        strokeWidth: 1.45,
        dash: [3, 5],
        alpha: 0.46
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
        casingColor: "#d3cbc0",
        strokeColor: "#ebe4da",
        casingWidth: 4.7,
        strokeWidth: 1.65,
        alpha: 0.42
      },
      unknown: {
        casingColor: "#d2cabd",
        strokeColor: "#f2ebe0",
        casingWidth: 6.2,
        strokeWidth: 2.9,
        alpha: 0.62
      }
    },
    roadCasings: {
      activeColor: "#bfb8ad",
      quietColor: "#d8d0c3",
      restrictedColor: "#e2caa6"
    },
    geometry: {
      lineCap: "butt",
      lineJoin: "round",
      miterLimit: 2,
      lowZoomViewportScale: 0.5,
      minorLowZoomWidthMultiplier: 0.9,
      minorLowZoomAlphaMultiplier: 0.9,
      serviceLowZoomWidthMultiplier: 0.68,
      serviceLowZoomAlphaMultiplier: 0.58,
      restrictedLowZoomAlphaMultiplier: 0.72
    },
    junctions: {
      majorRadiusMultiplier: 0.5,
      secondaryRadiusMultiplier: 0.5,
      minorRadiusMultiplier: 0.5,
      quietRadiusMultiplier: 0.5
    },
    interaction: {
      selected: {
        haloColor: "rgba(14,165,233,0.2)",
        haloWidth: 20,
        strokeColor: "rgba(2,132,199,0.58)",
        strokeWidth: 7,
        alpha: 1
      },
      hovered: {
        haloColor: "rgba(56,189,248,0.16)",
        haloWidth: 16,
        strokeColor: "rgba(14,165,233,0.4)",
        strokeWidth: 5,
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
      color: "rgba(35,45,60,0.84)",
      haloColor: "rgba(255,252,244,0.98)",
      haloWidth: 3.5,
      shadowColor: "rgba(255,255,255,0.55)",
      shadowBlur: 2,
      shadowOffsetY: 0
    },
    roadHierarchy: {
      major: {
        font: "700 12px 'Arial Narrow', Arial, sans-serif",
        fontSize: 12,
        approximateCharacterWidth: 6.1,
        color: "rgba(23,30,39,0.94)",
        haloColor: "rgba(255,222,42,0.88)",
        haloWidth: 3.6,
        shadowColor: "transparent",
        shadowBlur: 0,
        shadowOffsetY: 0,
        minViewportScale: 0.14,
        minRoadScreenLength: 52,
        maxTextToRoadRatio: 0.98,
        repeatDistance: 230,
        collisionPadding: 4
      },
      secondary: {
        font: "700 10.5px 'Arial Narrow', Arial, sans-serif",
        fontSize: 10.5,
        approximateCharacterWidth: 5.45,
        color: "rgba(41,51,66,0.86)",
        haloColor: "rgba(255,252,244,0.97)",
        haloWidth: 4.4,
        shadowColor: "rgba(255,255,255,0.55)",
        shadowBlur: 2,
        shadowOffsetY: 0,
        minViewportScale: 0.24,
        minRoadScreenLength: 44,
        maxTextToRoadRatio: 0.96,
        repeatDistance: 190,
        collisionPadding: 3.5
      },
      minor: {
        font: "600 9.5px 'Arial Narrow', Arial, sans-serif",
        fontSize: 9.5,
        approximateCharacterWidth: 4.8,
        color: "rgba(42,54,72,0.84)",
        haloColor: "rgba(255,252,244,0.95)",
        haloWidth: 3.45,
        shadowColor: "rgba(255,255,255,0.44)",
        shadowBlur: 1.5,
        shadowOffsetY: 0,
        minViewportScale: 0.14,
        minRoadScreenLength: 30,
        maxTextToRoadRatio: 0.97,
        repeatDistance: 135,
        collisionPadding: 2.5
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
        minViewportScale: 0.96,
        minRoadScreenLength: 70,
        maxTextToRoadRatio: 0.78,
        repeatDistance: 190,
        collisionPadding: 5
      },
      service: {
        font: "600 8.5px 'Arial Narrow', Arial, sans-serif",
        fontSize: 8.5,
        approximateCharacterWidth: 4.3,
        color: "rgba(71,85,105,0.5)",
        haloColor: "rgba(255,252,244,0.88)",
        haloWidth: 2.5,
        shadowColor: "rgba(255,255,255,0.3)",
        shadowBlur: 1,
        shadowOffsetY: 0,
        minViewportScale: 0.72,
        minRoadScreenLength: 52,
        maxTextToRoadRatio: 0.88,
        repeatDistance: 170,
        collisionPadding: 2.5
      }
    },
    area: {
      font: "600 13px Arial, sans-serif",
      color: "rgba(64,78,94,0.5)",
      haloColor: "rgba(255,252,244,0.76)",
      haloWidth: 3
    },
    landmark: {
      font: "700 11px Arial, sans-serif",
      color: "rgba(15,23,42,0.78)",
      haloColor: "rgba(255,255,255,0.94)",
      haloWidth: 3
    },
    context: {
      road_reference: {
        font: "900 19px 'Arial Narrow', Arial, sans-serif",
        fontSize: 19,
        approximateCharacterWidth: 9.1,
        color: "#c8102e",
        haloColor: "rgba(255,252,244,0.96)",
        haloWidth: 4.2,
        minViewportScale: 0.14,
        collisionPadding: 5
      },
      district: {
        font: "700 18px 'Arial Narrow', Arial, sans-serif",
        fontSize: 18,
        approximateCharacterWidth: 8.2,
        color: "rgba(18,25,34,0.88)",
        haloColor: "rgba(255,252,244,0.82)",
        haloWidth: 3.2,
        minViewportScale: 0.12,
        collisionPadding: 9
      },
      institution: {
        font: "650 9.5px 'Arial Narrow', Arial, sans-serif",
        fontSize: 9.5,
        approximateCharacterWidth: 4.9,
        color: "rgba(91,49,57,0.78)",
        haloColor: "rgba(255,245,240,0.88)",
        haloWidth: 2.5,
        minViewportScale: 0.42,
        collisionPadding: 3
      },
      land_use: {
        font: "600 9.5px 'Arial Narrow', Arial, sans-serif",
        fontSize: 9.5,
        approximateCharacterWidth: 4.9,
        color: "rgba(76,68,57,0.62)",
        haloColor: "rgba(255,252,244,0.78)",
        haloWidth: 2.2,
        minViewportScale: 0.58,
        collisionPadding: 3
      },
      station: {
        font: "700 12px Arial, sans-serif",
        fontSize: 12,
        approximateCharacterWidth: 6.7,
        color: "rgba(21,31,45,0.88)",
        haloColor: "rgba(255,252,244,0.96)",
        haloWidth: 4,
        shadowColor: "rgba(255,255,255,0.48)",
        shadowBlur: 2,
        shadowOffsetY: 0,
        minViewportScale: 0.24,
        collisionPadding: 6
      },
      landmark: {
        font: "650 10.5px Arial, sans-serif",
        fontSize: 10.5,
        approximateCharacterWidth: 5.9,
        color: "rgba(32,43,58,0.68)",
        haloColor: "rgba(255,252,244,0.9)",
        haloWidth: 3,
        shadowColor: "rgba(255,255,255,0.35)",
        shadowBlur: 1.5,
        shadowOffsetY: 0,
        minViewportScale: 0.78,
        collisionPadding: 5
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
        minViewportScale: 0.3,
        collisionPadding: 4
      },
      open_space: {
        font: "600 11px Arial, sans-serif",
        fontSize: 11,
        approximateCharacterWidth: 5.8,
        color: "rgba(52,88,62,0.58)",
        haloColor: "rgba(255,252,244,0.76)",
        haloWidth: 3,
        minViewportScale: 0.18,
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
        minViewportScale: 0.78,
        collisionPadding: 4
      },
      park: {
        font: "600 11px Arial, sans-serif",
        fontSize: 11,
        approximateCharacterWidth: 6,
        color: "rgba(52,88,62,0.62)",
        haloColor: "rgba(255,252,244,0.76)",
        haloWidth: 3,
        minViewportScale: 0.2,
        collisionPadding: 5
      },
      water: {
        font: "600 11px Arial, sans-serif",
        fontSize: 11,
        approximateCharacterWidth: 6,
        color: "rgba(24,78,108,0.76)",
        haloColor: "rgba(255,252,244,0.82)",
        haloWidth: 3.4,
        minViewportScale: 0.18,
        collisionPadding: 7
      },
      bridge: {
        font: "650 10.5px Arial, sans-serif",
        fontSize: 10.5,
        approximateCharacterWidth: 5.8,
        color: "rgba(86,67,45,0.64)",
        haloColor: "rgba(255,252,244,0.82)",
        haloWidth: 3.5,
        shadowColor: "rgba(255,255,255,0.34)",
        shadowBlur: 1,
        shadowOffsetY: 0,
        minViewportScale: 0.24,
        collisionPadding: 7
      },
      area: {
        font: "650 12px Arial, sans-serif",
        fontSize: 12,
        approximateCharacterWidth: 7.2,
        color: "rgba(66,79,96,0.46)",
        haloColor: "rgba(255,252,244,0.72)",
        haloWidth: 3,
        minViewportScale: 0.24,
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
      defaultPadding: 5,
      routePadding: 10,
      markerPadding: 14,
      viewportEdgePadding: 6,
      roadReferenceRepeatDistance: 360,
      roadReferenceMinimumVisibleSegmentLength: 58,
      roadReferenceRepeatMinimumVisibleSegmentLength: 190,
      roadReferenceMaxTextToSegmentRatio: 0.78,
      roadReferenceMaxPerText: 2,
      roadReferenceMaxPerViewport: 6,
      roadReferenceMaxPerClass: { "a-road": 5, "b-road": 3 },
      roadReferenceZoomBudgets: { low: 3, principal: 6, high: 7, veryHigh: 8 }
    },
    priorities: {
      roadReference: 1,
      district: 2,
      majorRoad: 3,
      secondaryRoad: 3,
      restrictedRoad: 5,
      localRoad: 5,
      station: 4,
      landmark: 4,
      publicBuilding: 4,
      openSpace: 6,
      learnerReference: 7,
      park: 6,
      water: 4,
      bridge: 5,
      area: 2,
      institution: 4,
      contextualLandUse: 7,
      exerciseStop: 0
    }
  },
  background: {
    land: { fillColor: "#f3eddf" },
    water: {
      canal: { fillColor: "#b9dce7", strokeColor: "#6faec0", strokeWidth: 1.1, minViewportScale: 0.08, lowZoomAlpha: 0.78, mediumZoomAlpha: 0.9, highZoomAlpha: 1, minRenderedAreaPixels: 1, simplifyBelowViewportScale: 0.42, simplifyTolerancePixels: 0.8, maxStrokeWidth: 1.25 },
      basin: { fillColor: "#add5e2", strokeColor: "#62a7bc", strokeWidth: 1.15, minViewportScale: 0.08, lowZoomAlpha: 0.8, mediumZoomAlpha: 0.92, highZoomAlpha: 1, minRenderedAreaPixels: 1, simplifyBelowViewportScale: 0.42, simplifyTolerancePixels: 0.8, maxStrokeWidth: 1.3 },
      river: { fillColor: "#a2cfdf", strokeColor: "#559db5", strokeWidth: 1.25, minViewportScale: 0.06, lowZoomAlpha: 0.84, mediumZoomAlpha: 0.94, highZoomAlpha: 1, minRenderedAreaPixels: 1, simplifyBelowViewportScale: 0.38, simplifyTolerancePixels: 0.75, maxStrokeWidth: 1.4 },
      linear: {
        casingColor: "rgba(255,252,244,0.62)",
        strokeColor: "#78b7ca",
        casingWidth: 14,
        strokeWidth: 8,
        minViewportScale: 0.18,
        lowZoomAlpha: 0.36,
        mediumZoomAlpha: 0.5,
        highZoomAlpha: 0.62
      }
    },
    park: {
      garden: { fillColor: "#d4e4b9", strokeColor: "#9eb77c", strokeWidth: 1, minViewportScale: 0.08, lowZoomAlpha: 0.72, mediumZoomAlpha: 0.86, highZoomAlpha: 0.94, minRenderedAreaPixels: 2, simplifyBelowViewportScale: 0.48, simplifyTolerancePixels: 0.9, maxStrokeWidth: 1.2 },
      square: { fillColor: "#c9ddab", strokeColor: "#8faa70", strokeWidth: 1.05, minViewportScale: 0.08, lowZoomAlpha: 0.74, mediumZoomAlpha: 0.88, highZoomAlpha: 0.96, minRenderedAreaPixels: 2, simplifyBelowViewportScale: 0.48, simplifyTolerancePixels: 0.9, maxStrokeWidth: 1.25 }
    },
    openSpace: { fillColor: "#dce7c8", strokeColor: "#adbd91", strokeWidth: 0.9, minViewportScale: 0.08, lowZoomAlpha: 0.62, mediumZoomAlpha: 0.78, highZoomAlpha: 0.88, minRenderedAreaPixels: 2, simplifyBelowViewportScale: 0.48, simplifyTolerancePixels: 0.9, maxStrokeWidth: 1.1 },
    landUse: {
      residential: { fillColor: "#eee4d3", strokeColor: "#d8cbb8", strokeWidth: 0.65, minViewportScale: 0.12, lowZoomAlpha: 0.5, mediumZoomAlpha: 0.68, highZoomAlpha: 0.78, minRenderedAreaPixels: 5, simplifyBelowViewportScale: 0.62, simplifyTolerancePixels: 1.1, maxStrokeWidth: 0.9 },
      commercial: { fillColor: "#eadccc", strokeColor: "#cfbeab", strokeWidth: 0.7, minViewportScale: 0.12, lowZoomAlpha: 0.52, mediumZoomAlpha: 0.7, highZoomAlpha: 0.8, minRenderedAreaPixels: 5, simplifyBelowViewportScale: 0.62, simplifyTolerancePixels: 1.1, maxStrokeWidth: 0.95 },
      retail: { fillColor: "#efddcb", strokeColor: "#d2bda8", strokeWidth: 0.7, minViewportScale: 0.12, lowZoomAlpha: 0.54, mediumZoomAlpha: 0.72, highZoomAlpha: 0.82, minRenderedAreaPixels: 5, simplifyBelowViewportScale: 0.62, simplifyTolerancePixels: 1.1, maxStrokeWidth: 0.95 },
      industrial: { fillColor: "#e2ddd2", strokeColor: "#c4bcad", strokeWidth: 0.75, minViewportScale: 0.12, lowZoomAlpha: 0.56, mediumZoomAlpha: 0.72, highZoomAlpha: 0.82, minRenderedAreaPixels: 5, simplifyBelowViewportScale: 0.62, simplifyTolerancePixels: 1.1, maxStrokeWidth: 1 }
    },
    institution: {
      education: { fillColor: "#e7c8c0", strokeColor: "#bd928b", strokeWidth: 0.9, minViewportScale: 0.2, lowZoomAlpha: 0.58, mediumZoomAlpha: 0.76, highZoomAlpha: 0.88, minRenderedAreaPixels: 3, simplifyBelowViewportScale: 0.58, simplifyTolerancePixels: 0.9, maxStrokeWidth: 1.15 },
      healthcare: { fillColor: "#e3beb9", strokeColor: "#b9827f", strokeWidth: 0.95, minViewportScale: 0.2, lowZoomAlpha: 0.6, mediumZoomAlpha: 0.78, highZoomAlpha: 0.9, minRenderedAreaPixels: 3, simplifyBelowViewportScale: 0.58, simplifyTolerancePixels: 0.9, maxStrokeWidth: 1.2 },
      civic: { fillColor: "#dfc4bd", strokeColor: "#b48d84", strokeWidth: 0.9, minViewportScale: 0.2, lowZoomAlpha: 0.58, mediumZoomAlpha: 0.76, highZoomAlpha: 0.88, minRenderedAreaPixels: 3, simplifyBelowViewportScale: 0.58, simplifyTolerancePixels: 0.9, maxStrokeWidth: 1.15 },
      religious: { fillColor: "#e8cbc2", strokeColor: "#bd9388", strokeWidth: 0.9, minViewportScale: 0.2, lowZoomAlpha: 0.58, mediumZoomAlpha: 0.76, highZoomAlpha: 0.88, minRenderedAreaPixels: 3, simplifyBelowViewportScale: 0.58, simplifyTolerancePixels: 0.9, maxStrokeWidth: 1.15 }
    },
    building: {
      residential: { fillColor: "#ead8bc", strokeColor: "#a89a84", strokeWidth: 0.72, minViewportScale: 0.68, lowZoomAlpha: 0.48, mediumZoomAlpha: 0.72, highZoomAlpha: 0.9, minRenderedAreaPixels: 2.6, simplifyBelowViewportScale: 0.9, simplifyTolerancePixels: 0.65, maxStrokeWidth: 1.05 },
      commercial: { fillColor: "#e3ceb2", strokeColor: "#a2927d", strokeWidth: 0.76, minViewportScale: 0.68, lowZoomAlpha: 0.5, mediumZoomAlpha: 0.74, highZoomAlpha: 0.92, minRenderedAreaPixels: 2.6, simplifyBelowViewportScale: 0.9, simplifyTolerancePixels: 0.65, maxStrokeWidth: 1.1 },
      retail: { fillColor: "#e7cdb0", strokeColor: "#a89179", strokeWidth: 0.76, minViewportScale: 0.68, lowZoomAlpha: 0.5, mediumZoomAlpha: 0.74, highZoomAlpha: 0.92, minRenderedAreaPixels: 2.6, simplifyBelowViewportScale: 0.9, simplifyTolerancePixels: 0.65, maxStrokeWidth: 1.1 },
      industrial: { fillColor: "#dcd1bf", strokeColor: "#9f9688", strokeWidth: 0.78, minViewportScale: 0.68, lowZoomAlpha: 0.5, mediumZoomAlpha: 0.74, highZoomAlpha: 0.92, minRenderedAreaPixels: 3, simplifyBelowViewportScale: 0.9, simplifyTolerancePixels: 0.65, maxStrokeWidth: 1.1 },
      education: { fillColor: "#dfc0b4", strokeColor: "#a77f77", strokeWidth: 0.8, minViewportScale: 0.64, lowZoomAlpha: 0.52, mediumZoomAlpha: 0.76, highZoomAlpha: 0.94, minRenderedAreaPixels: 2.6, simplifyBelowViewportScale: 0.9, simplifyTolerancePixels: 0.65, maxStrokeWidth: 1.15 },
      healthcare: { fillColor: "#ddb8b1", strokeColor: "#a47673", strokeWidth: 0.82, minViewportScale: 0.64, lowZoomAlpha: 0.54, mediumZoomAlpha: 0.78, highZoomAlpha: 0.95, minRenderedAreaPixels: 2.6, simplifyBelowViewportScale: 0.9, simplifyTolerancePixels: 0.65, maxStrokeWidth: 1.15 },
      civic: { fillColor: "#dec0b7", strokeColor: "#a27e77", strokeWidth: 0.8, minViewportScale: 0.64, lowZoomAlpha: 0.52, mediumZoomAlpha: 0.76, highZoomAlpha: 0.94, minRenderedAreaPixels: 2.6, simplifyBelowViewportScale: 0.9, simplifyTolerancePixels: 0.65, maxStrokeWidth: 1.15 },
      religious: { fillColor: "#e5c7bb", strokeColor: "#aa857c", strokeWidth: 0.8, minViewportScale: 0.64, lowZoomAlpha: 0.52, mediumZoomAlpha: 0.76, highZoomAlpha: 0.94, minRenderedAreaPixels: 2.6, simplifyBelowViewportScale: 0.9, simplifyTolerancePixels: 0.65, maxStrokeWidth: 1.15 },
      other: { fillColor: "#eadbc3", strokeColor: "#aa9c87", strokeWidth: 0.72, minViewportScale: 0.68, lowZoomAlpha: 0.48, mediumZoomAlpha: 0.72, highZoomAlpha: 0.9, minRenderedAreaPixels: 2.6, simplifyBelowViewportScale: 0.9, simplifyTolerancePixels: 0.65, maxStrokeWidth: 1.05 }
    },
    pedestrianArea: { fillColor: "#ece4d6", strokeColor: "#d4c8b8" },
    landBlock: {
      stationQuarter: { fillColor: "#e3dcce", strokeColor: "#cec2b1" },
      goodsYard: { fillColor: "#eae4d8", strokeColor: "#d2c7b6" },
      marketQuarter: { fillColor: "#efe6d5", strokeColor: "#d8cbb8" },
      civicQuarter: { fillColor: "#e5ddcf", strokeColor: "#cdbfae" }
    },
    layerOrder: ["land-use", "parks-water", "institution", "building", "pedestrian-area"],
    geometry: {
      minimumSourceAreaSquareMeters: 0.5,
      viewportPaddingPixels: 2
    },
    polygonStrokeWidth: 1.5
  },
  rail: {
    casingColor: "rgba(255,252,244,0.82)",
    strokeColor: "#647184",
    casingWidth: 7,
    strokeWidth: 2.6,
    dash: [7, 7]
  },
  contextFeatures: {
    rail: {
      casingColor: "rgba(255,252,244,0.82)",
      strokeColor: "#647184",
      casingWidth: 7,
      strokeWidth: 2.6,
      dash: [7, 7],
      minViewportScale: 0.24,
      lowZoomAlpha: 0.16,
      mediumZoomAlpha: 0.3,
      highZoomAlpha: 0.48
    },
    bridge: {
      casingColor: "rgba(255,252,244,0.88)",
      strokeColor: "#866a46",
      casingWidth: 12.2,
      strokeWidth: 4.6,
      dash: [11, 6],
      minViewportScale: 0.44,
      lowZoomAlpha: 0.38,
      mediumZoomAlpha: 0.66,
      highZoomAlpha: 0.84
    },
    stationMarker: {
      minViewportScale: 0.5,
      lowZoomAlpha: 0.52,
      mediumZoomAlpha: 0.8,
      highZoomAlpha: 1,
      collisionPadding: 7
    },
    landmarkMarker: {
      minViewportScale: 0.7,
      lowZoomAlpha: 0.56,
      mediumZoomAlpha: 0.78,
      highZoomAlpha: 0.92,
      collisionPadding: 6
    },
    importantLandmarkMarker: {
      minViewportScale: 0.54,
      lowZoomAlpha: 0.68,
      mediumZoomAlpha: 0.86,
      highZoomAlpha: 1,
      collisionPadding: 7
    },
    publicBuildingMarker: {
      minViewportScale: 0.62,
      lowZoomAlpha: 0.58,
      mediumZoomAlpha: 0.78,
      highZoomAlpha: 0.92,
      collisionPadding: 6
    },
    openSpaceMarker: {
      minViewportScale: 0.66,
      lowZoomAlpha: 0.5,
      mediumZoomAlpha: 0.72,
      highZoomAlpha: 0.86,
      collisionPadding: 6
    },
    learnerReferenceMarker: {
      minViewportScale: 0.78,
      lowZoomAlpha: 0.48,
      mediumZoomAlpha: 0.72,
      highZoomAlpha: 0.88,
      collisionPadding: 6
    }
  },
  station: {
    radius: 10.8,
    fillColor: "#ffffff",
    strokeColor: "#26384c",
    haloColor: "rgba(15,23,42,0.14)",
    priority: 2,
    innerLineColor: "#0f766e",
    markerStrokeWidth: 3.25,
    innerLineWidth: 4.8
  },
  landmarks: {
    hospital: {
      radius: 9,
      fillColor: "#eff6ff",
      strokeColor: "#25608f",
      haloColor: "rgba(37,96,143,0.12)",
      priority: 3
    },
    park: {
      radius: 8,
      fillColor: "#eff8e8",
      strokeColor: "#4f8f46",
      haloColor: "rgba(79,143,70,0.12)",
      priority: 4
    },
    market: {
      radius: 8,
      fillColor: "#fff7ed",
      strokeColor: "#b8641f",
      haloColor: "rgba(184,100,31,0.12)",
      priority: 5
    },
    dock: {
      radius: 8,
      fillColor: "#edf8fb",
      strokeColor: "#2f7c95",
      haloColor: "rgba(47,124,149,0.12)",
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
      fillColor: "#eff8e8",
      strokeColor: "#4f8f46",
      haloColor: "rgba(79,143,70,0.1)",
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
  atlasSymbols: {
    styles: {
      station: { size: 8.8, fillColor: "#ffffff", strokeColor: "#172f43", detailColor: "#075f73", haloColor: "rgba(255,252,244,0.96)", haloWidth: 2.2, strokeWidth: 1.9, priority: 1, minViewportScale: 0.2, collisionPadding: 3, minSpacingPixels: 32, maxPerViewport: 8 },
      hospital: { size: 8.3, fillColor: "#fffdf8", strokeColor: "#9f1727", detailColor: "#b20f28", haloColor: "rgba(255,252,244,0.96)", haloWidth: 2.2, strokeWidth: 1.85, priority: 2, minViewportScale: 0.34, collisionPadding: 3, minSpacingPixels: 36, maxPerViewport: 4 },
      pier: { size: 7.9, fillColor: "#eef8fa", strokeColor: "#145b73", detailColor: "#145b73", haloColor: "rgba(255,252,244,0.94)", haloWidth: 2, strokeWidth: 1.65, priority: 3, minViewportScale: 0.38, collisionPadding: 3, minSpacingPixels: 34, maxPerViewport: 2 },
      civic: { size: 7.8, fillColor: "#fffdf8", strokeColor: "#283b4d", detailColor: "#283b4d", haloColor: "rgba(255,252,244,0.94)", haloWidth: 2, strokeWidth: 1.6, priority: 4, minViewportScale: 0.46, collisionPadding: 3, minSpacingPixels: 38, maxPerViewport: 4 },
      education: { size: 7.6, fillColor: "#fffdf8", strokeColor: "#33485d", detailColor: "#33485d", haloColor: "rgba(255,252,244,0.94)", haloWidth: 2, strokeWidth: 1.6, priority: 5, minViewportScale: 0.5, collisionPadding: 3, minSpacingPixels: 38, maxPerViewport: 4 },
      religious: { size: 7.6, fillColor: "#fffdf8", strokeColor: "#4e3b59", detailColor: "#4e3b59", haloColor: "rgba(255,252,244,0.94)", haloWidth: 2, strokeWidth: 1.6, priority: 5, minViewportScale: 0.52, collisionPadding: 3, minSpacingPixels: 38, maxPerViewport: 5 },
      museum: { size: 7.6, fillColor: "#fffdf8", strokeColor: "#304354", detailColor: "#304354", haloColor: "rgba(255,252,244,0.94)", haloWidth: 2, strokeWidth: 1.6, priority: 5, minViewportScale: 0.54, collisionPadding: 3, minSpacingPixels: 38, maxPerViewport: 3 },
      market: { size: 7.5, fillColor: "#fff7e8", strokeColor: "#75420f", detailColor: "#75420f", haloColor: "rgba(255,252,244,0.94)", haloWidth: 2, strokeWidth: 1.6, priority: 6, minViewportScale: 0.58, collisionPadding: 3, minSpacingPixels: 40, maxPerViewport: 3 },
      parking: { size: 7.4, fillColor: "#eef5fa", strokeColor: "#174f72", detailColor: "#174f72", haloColor: "rgba(255,252,244,0.94)", haloWidth: 2, strokeWidth: 1.6, priority: 7, minViewportScale: 0.68, collisionPadding: 3, minSpacingPixels: 44, maxPerViewport: 2 },
      landmark: { size: 7.6, fillColor: "#fffdf8", strokeColor: "#383a32", detailColor: "#383a32", haloColor: "rgba(255,252,244,0.94)", haloWidth: 2, strokeWidth: 1.6, priority: 5, minViewportScale: 0.52, collisionPadding: 3, minSpacingPixels: 40, maxPerViewport: 3 },
      "open-space": { size: 7.1, fillColor: "#eef6e7", strokeColor: "#356b35", detailColor: "#356b35", haloColor: "rgba(255,252,244,0.92)", haloWidth: 1.8, strokeWidth: 1.5, priority: 8, minViewportScale: 0.7, collisionPadding: 3, minSpacingPixels: 46, maxPerViewport: 2 },
      generic: { size: 7.1, fillColor: "#fffdf8", strokeColor: "#415568", detailColor: "#415568", haloColor: "rgba(255,252,244,0.92)", haloWidth: 1.8, strokeWidth: 1.5, priority: 8, minViewportScale: 0.7, collisionPadding: 3, minSpacingPixels: 46, maxPerViewport: 2 }
    },
    viewportEdgePadding: 8,
    maxPerViewport: 20,
    mobileMaxPerViewport: 10,
    semanticScale: { low: 0.94, principal: 1.08, high: 1.14, veryHigh: 1.18 }
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
    labelBubble: {
      fillColor: "rgba(255,255,255,0.97)",
      strokeWidth: 1.8,
      paddingX: 9,
      paddingY: 5,
      borderRadius: 8,
      minWidth: 54,
      shadowColor: "rgba(15,23,42,0.24)",
      shadowBlur: 7,
      shadowOffsetY: 1.5
    },
    assetZoomScale: {
      lowZoom: 1,
      midZoom: 2.5,
      baseZoom: 5,
      highZoom: 10,
      veryHighZoom: 25,
      maxZoom: 50,
      lowScale: 0.5,
      midScale: 0.75,
      baseScale: 1,
      highScale: 1.1,
      veryHighScale: 1.2,
      maxScale: 1.3
    },
    start: {
      fillColor: "#059669",
      radius: 17,
      text: "START",
      compactText: "S",
      font: "800 10px Arial, sans-serif",
      shape: "pin",
      pinTipLength: 25
    },
    checkpoint: { fillColor: "#2563eb", radius: 15, textPrefix: "CP", font: "800 9px Arial, sans-serif", shape: "circle" },
    requiredVia: { fillColor: "#1d4ed8", radius: 16, textPrefix: "VIA", font: "800 8px Arial, sans-serif", shape: "circle" },
    destination: {
      fillColor: "#dc2626",
      radius: 17,
      text: "DESTINATION",
      compactText: "D",
      font: "800 10px Arial, sans-serif",
      shape: "pin",
      pinTipLength: 25
    }
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
        font: "800 13px Arial, sans-serif",
        color: "#047857",
        haloColor: "rgba(255,255,255,0.96)",
        haloWidth: 0,
        yOffset: -58
      },
      destination: {
        font: "800 13px Arial, sans-serif",
        color: "#b91c1c",
        haloColor: "rgba(255,255,255,0.96)",
        haloWidth: 0,
        yOffset: -58
      },
      checkpoint: {
        font: "800 12px Arial, sans-serif",
        color: "#1d4ed8",
        haloColor: "rgba(255,255,255,0.94)",
        haloWidth: 0,
        yOffset: -46
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
        shape: "pin",
        fillColor: "#059669",
        strokeColor: "#ffffff",
        haloColor: "rgba(255,255,255,0.72)",
        haloStrokeColor: "rgba(6,95,70,0.24)",
        haloRadiusPadding: 6,
        strokeWidth: 3.2,
        radius: 17,
        font: "800 10px Arial, sans-serif",
        textColor: "#ffffff",
        pinTipLength: 25,
        innerFillColor: "#ffffff",
        innerTextColor: "#047857",
        innerRadiusRatio: 0.36,
        asset: {
          src: "/map-icons/start-marker.svg",
          sourceWidth: 120,
          sourceHeight: 180,
          displayWidth: 48,
          displayHeight: 72,
          anchorX: 60,
          anchorY: 174
        }
      },
      destination: {
        shape: "pin",
        fillColor: "#dc2626",
        strokeColor: "#ffffff",
        haloColor: "rgba(255,255,255,0.72)",
        haloStrokeColor: "rgba(153,27,27,0.24)",
        haloRadiusPadding: 5,
        strokeWidth: 3.1,
        radius: 17,
        font: "800 10px Arial, sans-serif",
        textColor: "#ffffff",
        pinTipLength: 25,
        innerFillColor: "#ffffff",
        innerTextColor: "#b91c1c",
        innerRadiusRatio: 0.36,
        asset: {
          src: "/map-icons/destination-marker.svg",
          sourceWidth: 120,
          sourceHeight: 180,
          displayWidth: 48,
          displayHeight: 72,
          anchorX: 60,
          anchorY: 174
        }
      },
      checkpointBase: {
        shape: "circle",
        fillColor: "#2563eb",
        strokeColor: "#ffffff",
        haloColor: "rgba(37,99,235,0.13)",
        haloStrokeColor: "rgba(29,78,216,0.28)",
        haloRadiusPadding: 7,
        strokeWidth: 3,
        radius: 15,
        font: "800 9px Arial, sans-serif",
        textColor: "#ffffff",
        asset: {
          src: "/map-icons/checkpoint-marker.svg",
          sourceWidth: 110,
          sourceHeight: 160,
          displayWidth: 42,
          displayHeight: 61.0909090909,
          anchorX: 55,
          anchorY: 154
        }
      },
      requiredCheckpoint: {
        shape: "circle",
        fillColor: "#1d4ed8",
        strokeColor: "#ffffff",
        haloColor: "rgba(29,78,216,0.16)",
        haloStrokeColor: "rgba(30,64,175,0.32)",
        haloRadiusPadding: 8,
        strokeWidth: 3.25,
        radius: 16,
        font: "800 8px Arial, sans-serif",
        textColor: "#ffffff",
        asset: {
          src: "/map-icons/checkpoint-marker.svg",
          sourceWidth: 110,
          sourceHeight: 160,
          displayWidth: 42,
          displayHeight: 61.0909090909,
          anchorX: 55,
          anchorY: 154
        }
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
        strokeWidth: 5.6,
        alpha: 0.34
      },
      restricted: {
        strokeColor: "#f59e0b",
        strokeWidth: 6.4,
        alpha: 0.34,
        dash: [10, 7]
      },
      oneWay: {
        strokeColor: "#2f74c0",
        strokeWidth: 2.8,
        alpha: 0.28
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
      color: "#245da8",
      haloColor: "rgba(255,255,255,0.82)",
      haloLineWidth: 6.5,
      lineWidth: 3.2,
      tipDistance: 13.5,
      tailDistance: 11.5,
      longRoadArrowThresholdMeters: 180,
      minSpacingMeters: 76,
      mediumSpacingMultiplier: 1.55,
      highSpacingMultiplier: 1.2,
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
      strokeColor: "#a83b4f",
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
      reservationPadding: 12,
      iconOnlyDefault: true
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
    showBaseMapNodes: false,
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
      baselineZoomFactor: 2.7,
      defaultZoom: 1,
      minZoom: 0.75,
      maxZoom: 50,
      stepRatio: 1.25,
      wheelSensitivity: 0.002231435513142097,
      panMargin: 80
    },
    decluttering: {
      osmRoadLabelsRequireQaOverlay: false,
      oneWayArrowMinSpacingMeters: 76,
      longRoadArrowThresholdMeters: 180,
      mediumOneWayArrowSpacingMultiplier: 1.55,
      highOneWayArrowSpacingMultiplier: 1.2,
      oneWayArrowAlphaMultiplier: 0.72,
      lowDetailViewportScale: 0.24,
      highDetailViewportScale: 0.95,
      mediumOneWayMinRoadLengthMeters: 180,
      restrictionSymbolCollisionPadding: 8,
      reviewRestrictionProximityMeters: 72,
      lowRestrictionSymbolAlpha: 0.42,
      mediumRestrictionSymbolAlpha: 0.7,
      highRestrictionSymbolAlpha: 0.9,
      lowRestrictionSymbolScale: 0.82,
      mediumRestrictionSymbolScale: 0.92,
      highRestrictionSymbolScale: 1,
      lowRestrictionOverlayAlphaMultiplier: 0.32,
      mediumRestrictionOverlayAlphaMultiplier: 0.68,
      highRestrictionOverlayAlphaMultiplier: 1
    },
    cartographicScale: {
      referenceViewportScale: 1,
      roadMinMultiplier: 1,
      roadGain: {
        major: 0.48,
        secondary: 0.44,
        local: 0.39,
        service: 0.3,
        restricted: 0.3
      },
      roadMaxMultiplier: {
        major: 6.5,
        secondary: 5.5,
        local: 4.5,
        service: 3.2,
        restricted: 3.2
      },
      routeOverlayGain: 0.2,
      routeOverlayMaxMultiplier: 2.25,
      drawnAttemptGain: 0.16,
      drawnAttemptMaxMultiplier: 1.85,
      correctRouteGain: 0.2,
      correctRouteMaxMultiplier: 2.25,
      mistakeOverlayGain: 0.28,
      mistakeOverlayMaxMultiplier: 3.25,
      reviewTextGain: 0.25,
      reviewTextMaxMultiplier: 3,
      learnerMarkerGain: 0.14,
      learnerMarkerMaxMultiplier: 1.75,
      labelGain: {
        major: 0.58,
        secondary: 0.58,
        minor: 0.58,
        service: 0.54,
        restricted: 0.5,
        context: 0.44,
        stop: 0
      },
      labelMaxMultiplier: {
        major: 9,
        secondary: 9,
        minor: 9,
        service: 8,
        restricted: 7,
        context: 5.5,
        stop: 1
      },
      labelHaloMaxMultiplier: 6,
      labelCollisionMaxMultiplier: 5,
      highZoomViewportScale: 5,
      veryHighZoomViewportScale: 10,
      highZoomMinRoadLengthMultiplier: 0.82,
      veryHighZoomMinRoadLengthMultiplier: 0.68,
      markerGain: 0.24,
      markerMaxMultiplier: 2.5,
      restrictionGain: 0.42,
      restrictionMaxMultiplier: 4
    }
  }
} as const satisfies TopopassStreetAtlasStyle;
