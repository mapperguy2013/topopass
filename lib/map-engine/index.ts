export { buildDirectedEdges } from "./edges.ts";
export { runRouteExercise } from "./exerciseRunner.ts";
export { marloweDistrictFixture, marloweDistrictMap, marloweDistrictRouteExercises, tinyMap } from "./fixtures/index.ts";
export { buildMapGraph } from "./graph.ts";
export { checkRouteLegality, ILLEGAL_MOVEMENT_TYPES } from "./legalityEngine.ts";
export {
  buildLegalMovementGraph,
  getLegalMovementsFromPosition,
  getLegalNextMovements,
  getLegalOutgoingMovements
} from "./legalMovementGraph.ts";
export { scoreRouteAttempt } from "./scoringEngine.ts";
export { findShortestLegalRoute } from "./shortestRoute.ts";
export { validateMapDefinition, validateRouteExercise } from "./validation.ts";
export type {
  NormalisedRouteAttempt,
  RunRouteExerciseInput,
  RunRouteExerciseResult,
  UserRouteSelectionInput
} from "./exerciseRunner.ts";
export type {
  AttemptedRouteMovement,
  IllegalMovement,
  IllegalMovementType,
  LegalityCheckInput,
  LegalityCheckResult
} from "./legalityEngine.ts";
export type { LegalMovementGraph, LegalMovementPosition, LegalTransition } from "./legalMovementGraph.ts";
export type {
  RoutePassStatus,
  RouteScoringFailureReason,
  RouteScoringInput,
  RouteScoringResult,
  RouteScoreFailureReason,
  RouteScoreResult,
  ScoreRouteAttemptInput
} from "./scoringEngine.ts";
export type { FindShortestLegalRouteInput, ShortestLegalRouteResult } from "./shortestRoute.ts";
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
