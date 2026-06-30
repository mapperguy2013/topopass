export { buildDirectedEdges } from "./edges.ts";
export { canSubmitDraftRoute, validateDraftRouteSelection } from "./draftRouteValidation.ts";
export {
  appendDrawnRoutePoint,
  appendRouteDraftPoint,
  clearRouteDraft,
  clearDrawnRouteTrace,
  createEmptyRouteDraft,
  createDrawnRouteTrace,
  drawnRouteTraceDistance,
  finishRouteStroke,
  getFlattenedRouteDraftPoints,
  hasUndoableRouteStroke,
  isMeaningfulDrawnGesture,
  mapToScreenPoint,
  routeDraftToDrawnRouteTrace,
  screenToMapPoint,
  simplifyDrawnRouteTrace,
  startRouteStroke,
  undoLastRouteStroke,
  validateDrawnRouteGesture
} from "./drawingTrace.ts";
export { createInsufficientDrawnGesturePipelineResult, runDrawnRoutePipeline } from "./drawnRoutePipeline.ts";
export { runRouteExercise } from "./exerciseRunner.ts";
export { marloweDistrictFixture, marloweDistrictMap, marloweDistrictRouteExercises, tinyMap } from "./fixtures/index.ts";
export {
  boundingBoxForPoints,
  boundingBoxesIntersect,
  buildRoadSpatialIndex,
  calculateHeadingDegrees,
  distanceBetweenPoints,
  distanceFromPointToRoadCentreline,
  expandBoundingBox,
  findCandidateRoadsForPoint,
  polylineLength,
  projectPointToPolyline,
  projectPointToSegment,
  roadGeometryFromMapRoad,
  roadPolylineFromMapRoad,
  simplifyRouteTrace
} from "./geometry.ts";
export { buildMapGraph } from "./graph.ts";
export { buildIllegalDrawnMovementHighlights } from "./illegalMovementHighlighting.ts";
export { checkRouteLegality, ILLEGAL_MOVEMENT_TYPES } from "./legalityEngine.ts";
export {
  buildLegalMovementGraph,
  getLegalMovementsFromPosition,
  getLegalNextMovements,
  getLegalOutgoingMovements
} from "./legalMovementGraph.ts";
export {
  addDraftSelectedNode,
  addDraftSelectedRoad,
  clearDraftRouteSelection,
  clearDraftSelectedExercise,
  clearDraftSelectedNodes,
  clearDraftSelectedRoads,
  createDraftRouteSelectionState,
  removeLastDraftSelectedNode,
  removeLastDraftSelectedRoad,
  setDraftSelectedExercise,
  toRunRouteExerciseDraftInput,
  toUserRouteSelectionInput
} from "./routeSelectionState.ts";
export { matchSnappedRouteToSelection } from "./routeMatching.ts";
export {
  classifyTurnRestrictionMovement,
  turnRestrictionIconRotationRadians,
  getTurnRestrictionVisuals,
  turnRestrictionSignedAngleDegrees
} from "./restrictionVisuals.ts";
export { snapDrawnRouteToRoads } from "./routeSnapping.ts";
export { scoreRouteAttempt } from "./scoringEngine.ts";
export { findShortestLegalRoute, findShortestLegalRouteThroughStops } from "./shortestRoute.ts";
export { validateMapDefinition, validateRouteExercise, validateRouteExerciseLegalReachability } from "./validation.ts";
export type {
  NormalisedRouteAttempt,
  RunRouteExerciseInput,
  RunRouteExerciseResult,
  UserRouteSelectionInput
} from "./exerciseRunner.ts";
export type {
  DraftRouteProgressPreview,
  DraftRouteValidationIssue,
  DraftRouteValidationIssueCode,
  DraftRouteValidationIssueSeverity,
  DraftRouteValidationResult,
  ValidateDraftRouteSelectionInput
} from "./draftRouteValidation.ts";
export type {
  DrawnRouteGestureFailureReason,
  DrawnRouteGestureValidation,
  DrawnRouteGestureValidationOptions,
  DrawnRouteDraft,
  DrawnRouteStroke,
  DrawnRouteTrace,
  ScreenMapViewport
} from "./drawingTrace.ts";
export type {
  DrawnRoutePipelineResult,
  DrawnRoutePipelineStatus,
  DrawnRoutePipelineWarning,
  DrawnRoutePipelineWarningSeverity,
  DrawnRoutePipelineWarningSource,
  RunDrawnRoutePipelineInput,
  RunDrawnRoutePipelineOptions
} from "./drawnRoutePipeline.ts";
export type {
  AttemptedRouteMovement,
  IllegalMovement,
  IllegalMovementType,
  LegalityCheckInput,
  LegalityCheckResult
} from "./legalityEngine.ts";
export type {
  BuildIllegalDrawnMovementHighlightsInput,
  IllegalDrawnMovement,
  IllegalDrawnMovementKind
} from "./illegalMovementHighlighting.ts";
export type { LegalMovementGraph, LegalMovementPosition, LegalTransition } from "./legalMovementGraph.ts";
export type {
  BoundingBox,
  FindCandidateRoadsInput,
  PolylineProjection,
  RoadCandidate,
  RoadGeometry,
  RoadSpatialIndex,
  SegmentProjection,
  Vec2
} from "./geometry.ts";
export type { DraftRouteSelectionState, RunRouteExerciseDraftInput } from "./routeSelectionState.ts";
export type {
  MatchedRouteMovement,
  MatchSnappedRouteToSelectionInput,
  RouteMatchingDiagnostic,
  RouteMatchingDiagnosticCode,
  RouteMatchingDiagnosticSeverity,
  RouteMatchingOptions,
  RouteMatchingResult,
  RouteMatchingStatus
} from "./routeMatching.ts";
export type {
  TurnRestrictionMovementClass,
  TurnRestrictionVisual,
  TurnRestrictionVisualKind,
  TurnRestrictionVisualReason
} from "./restrictionVisuals.ts";
export type {
  CandidateRoadMatch,
  RouteSnappingCandidateDiagnostic,
  RouteSnappingConnectivity,
  RouteSnappingConnectivityDiagnostics,
  RouteSnappingDiagnostic,
  RouteSnappingDiagnosticCode,
  RouteSnappingDisconnectedTransition,
  SnapDrawnRouteToRoadsInput,
  SnappedRoutePoint,
  SnappedRouteTraceResult
} from "./routeSnapping.ts";
export type {
  RoutePassStatus,
  RouteScoringFailureReason,
  RouteScoringInput,
  RouteScoringResult,
  RouteScoreFailureReason,
  RouteScoreResult,
  ScoreRouteAttemptInput
} from "./scoringEngine.ts";
export type {
  FindShortestLegalRouteInput,
  FindShortestLegalRouteThroughStopsInput,
  ShortestLegalRouteResult,
  ShortestLegalRouteThroughStopsResult
} from "./shortestRoute.ts";
export type {
  DirectedEdge,
  DirectedEdgeDirection,
  Landmark,
  LandmarkType,
  MapDefinition,
  MapGraph,
  MapNode,
  MapRestriction,
  MapRoad,
  RouteAttempt,
  RouteExercise,
  RouteExerciseDifficulty,
  RouteScore,
  RouteStop,
  ValidationResult
} from "./types.ts";
export type { RouteExerciseLegalReachabilityValidationResult } from "./validation.ts";
