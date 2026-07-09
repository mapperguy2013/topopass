import routeAdvancedFollowSouthCrescentRidgmount from "../../data/training-routes/complete/real-london-advanced-follow-south-crescent-ridgmount.json" with { type: "json" };
import routeAdvancedJunctionMortimerGoodge from "../../data/training-routes/complete/real-london-advanced-junction-mortimer-goodge.json" with { type: "json" };
import routeAdvancedLegalTorringtonReverse from "../../data/training-routes/complete/real-london-advanced-legal-torrington-reverse.json" with { type: "json" };
import routeAdvancedLegalTottenhamGower from "../../data/training-routes/complete/real-london-advanced-legal-tottenham-gower.json" with { type: "json" };
import routeAdvancedReviewGoodgeByng from "../../data/training-routes/complete/real-london-advanced-review-goodge-byng.json" with { type: "json" };
import routeBeginnerFollowGoodgeTottenham from "../../data/training-routes/complete/real-london-beginner-follow-goodge-tottenham.json" with { type: "json" };
import routeBeginnerFollowStoreStreet from "../../data/training-routes/complete/real-london-beginner-follow-store-street.json" with { type: "json" };
import routeBeginnerFollowTorringtonByng from "../../data/training-routes/complete/real-london-beginner-follow-torrington-byng.json" with { type: "json" };
import routeIntermediateCheckpointGoodgeChenies from "../../data/training-routes/complete/real-london-intermediate-checkpoint-goodge-chenies.json" with { type: "json" };
import routeIntermediateFollowGowerTorrington from "../../data/training-routes/complete/real-london-intermediate-follow-gower-torrington.json" with { type: "json" };
import routeIntermediateFollowHuntleyChenies from "../../data/training-routes/complete/real-london-intermediate-follow-huntley-chenies.json" with { type: "json" };
import routeIntermediateJunctionWhitfieldGoodge from "../../data/training-routes/complete/real-london-intermediate-junction-whitfield-goodge.json" with { type: "json" };
import routeIntermediateLegalTorringtonOneWay from "../../data/training-routes/complete/real-london-intermediate-legal-torrington-one-way.json" with { type: "json" };
import type { MapDefinition } from "../map-engine/index.ts";
import type { ExerciseDifficulty, ExerciseType } from "./learnerDriverTraining.ts";
import { validateLearnerRoute } from "./learnerRouteValidation.ts";
import type { CuratedTrainingRouteExport } from "./curatedTrainingRoutes.ts";

export const CURATED_LEARNER_ROUTE_PACK_ID = "real-london-pilot-route-pack-1";
export const CURATED_LEARNER_ROUTE_PACK_VERSION = "2026.07";
export const NO_CURATED_ROUTE_AVAILABLE_MESSAGE = "No approved curated route is available for this selection yet.";
export const EXPERIMENTAL_GENERATED_ROUTE_LABEL = "Try experimental generated route";

export const CURATED_LEARNER_ROUTE_PACK: CuratedTrainingRouteExport[] = [
  routeBeginnerFollowGoodgeTottenham,
  routeBeginnerFollowStoreStreet,
  routeBeginnerFollowTorringtonByng,
  routeIntermediateFollowHuntleyChenies,
  routeIntermediateJunctionWhitfieldGoodge,
  routeIntermediateLegalTorringtonOneWay,
  routeIntermediateFollowGowerTorrington,
  routeIntermediateCheckpointGoodgeChenies,
  routeAdvancedReviewGoodgeByng,
  routeAdvancedFollowSouthCrescentRidgmount,
  routeAdvancedLegalTottenhamGower,
  routeAdvancedLegalTorringtonReverse,
  routeAdvancedJunctionMortimerGoodge
] as CuratedTrainingRouteExport[];

export type CuratedTrainingRouteCardModel = {
  routeId: string;
  title: string;
  difficulty: Exclude<ExerciseDifficulty, "easy">;
  exerciseType: ExerciseType;
  area: string;
  description: string;
  skillsPractised: string[];
  approximateLengthLabel: string;
  segmentCount: number;
  turnCount: number;
  decisionPointCount: number;
  checkpointCount: number;
  statusLabel: "Beta" | "Approved";
  selected: boolean;
};

export type CuratedTrainingRoutePackSummary = {
  packId: typeof CURATED_LEARNER_ROUTE_PACK_ID;
  packVersion: typeof CURATED_LEARNER_ROUTE_PACK_VERSION;
  totalLearnerFacingRoutes: number;
  countsByDifficulty: Record<Exclude<ExerciseDifficulty, "easy">, number>;
  countsByExerciseType: Partial<Record<ExerciseType, number>>;
  checkpointRouteCount: number;
  averageComplexityByDifficulty: Record<Exclude<ExerciseDifficulty, "easy">, number>;
  knownLimitations: string[];
};

export type CuratedTrainingRoutePackAuditIssue = {
  routeId: string;
  severity: "error" | "warning";
  code:
    | "not-learner-facing"
    | "missing-required-metadata"
    | "missing-route-data"
    | "unknown-map"
    | "validation-blocking-error"
    | "checkpoint-requirement-invalid"
    | "shortest-comparison-missing"
    | "advanced-route-too-simple"
    | "difficulty-balance-warning";
  message: string;
};

export type CuratedTrainingRoutePackAudit = {
  summary: CuratedTrainingRoutePackSummary;
  issues: CuratedTrainingRoutePackAuditIssue[];
  validLearnerFacingRouteIds: string[];
  draftOrReviewRouteIds: string[];
};

export function isLearnerFacingCuratedTrainingRoute(route: CuratedTrainingRouteExport): boolean {
  return (
    route.lifecycleStage === "complete" &&
    (route.status === "beta" || route.status === "approved") &&
    (route.metadata.status === "beta" || route.metadata.status === "approved")
  );
}

export function learnerFacingCuratedTrainingRoutes(
  routes: readonly CuratedTrainingRouteExport[] = CURATED_LEARNER_ROUTE_PACK
): CuratedTrainingRouteExport[] {
  return routes.filter(isLearnerFacingCuratedTrainingRoute);
}

export function buildCuratedTrainingRouteCards(input: {
  routes?: readonly CuratedTrainingRouteExport[];
  mapId: string;
  difficulty: ExerciseDifficulty;
  exerciseType: ExerciseType;
  activeRouteId?: string | null;
}): CuratedTrainingRouteCardModel[] {
  return learnerFacingCuratedTrainingRoutes(input.routes)
    .filter(
      (route) =>
        route.mapId === input.mapId &&
        route.difficulty === input.difficulty &&
        route.exerciseType === input.exerciseType
    )
    .map((route) => curatedRouteCard(route, route.routeId === input.activeRouteId));
}

export function selectCuratedTrainingRoute(input: {
  routes?: readonly CuratedTrainingRouteExport[];
  mapId: string;
  difficulty: ExerciseDifficulty;
  exerciseType: ExerciseType;
  recentRouteIds?: readonly string[];
  seed?: string | number;
}): {
  route: CuratedTrainingRouteExport | null;
  availableRoutes: CuratedTrainingRouteExport[];
  message: string | null;
  repeatedRecentRoute: boolean;
} {
  const availableRoutes = learnerFacingCuratedTrainingRoutes(input.routes).filter(
    (route) =>
      route.mapId === input.mapId &&
      route.difficulty === input.difficulty &&
      route.exerciseType === input.exerciseType
  );

  if (availableRoutes.length === 0) {
    return {
      route: null,
      availableRoutes: [],
      message: NO_CURATED_ROUTE_AVAILABLE_MESSAGE,
      repeatedRecentRoute: false
    };
  }

  const recentRouteIds = new Set((input.recentRouteIds ?? []).slice(0, 3));
  const nonRecentRoutes = availableRoutes.filter((route) => !recentRouteIds.has(route.routeId));
  const candidateRoutes = nonRecentRoutes.length > 0 ? nonRecentRoutes : availableRoutes;
  const index = seededIndex(input.seed ?? `${input.mapId}:${input.difficulty}:${input.exerciseType}`, candidateRoutes.length);
  const route = candidateRoutes[index] ?? candidateRoutes[0];

  return {
    route,
    availableRoutes,
    message: null,
    repeatedRecentRoute: recentRouteIds.has(route.routeId)
  };
}

export function buildCuratedTrainingRoutePackSummary(
  routes: readonly CuratedTrainingRouteExport[] = CURATED_LEARNER_ROUTE_PACK
): CuratedTrainingRoutePackSummary {
  const learnerRoutes = learnerFacingCuratedTrainingRoutes(routes);
  const difficulties: Array<Exclude<ExerciseDifficulty, "easy">> = ["beginner", "intermediate", "advanced"];
  const countsByDifficulty = Object.fromEntries(
    difficulties.map((difficulty) => [difficulty, learnerRoutes.filter((route) => route.difficulty === difficulty).length])
  ) as Record<Exclude<ExerciseDifficulty, "easy">, number>;
  const averageComplexityByDifficulty = Object.fromEntries(
    difficulties.map((difficulty) => {
      const matching = learnerRoutes.filter((route) => route.difficulty === difficulty);
      const total = matching.reduce((sum, route) => sum + routeComplexityScore(route), 0);

      return [difficulty, matching.length === 0 ? 0 : Math.round((total / matching.length) * 10) / 10];
    })
  ) as Record<Exclude<ExerciseDifficulty, "easy">, number>;
  const countsByExerciseType = learnerRoutes.reduce<Partial<Record<ExerciseType, number>>>((counts, route) => {
    counts[route.exerciseType] = (counts[route.exerciseType] ?? 0) + 1;
    return counts;
  }, {});
  const knownLimitations = [
    "Curated routes only enforce legal restrictions that are present in the committed map metadata.",
    "OSM-derived roads can be split into many graph segments, so segment count can overstate learner-facing turns.",
    "The first route pack focuses on the Real London pilot map; more areas should be added after instructor QA."
  ];

  return {
    packId: CURATED_LEARNER_ROUTE_PACK_ID,
    packVersion: CURATED_LEARNER_ROUTE_PACK_VERSION,
    totalLearnerFacingRoutes: learnerRoutes.length,
    countsByDifficulty,
    countsByExerciseType,
    checkpointRouteCount: learnerRoutes.filter((route) => route.checkpoints.length > 0).length,
    averageComplexityByDifficulty,
    knownLimitations
  };
}

export function auditCuratedTrainingRoutePack(input: {
  routes?: readonly CuratedTrainingRouteExport[];
  mapById: Readonly<Record<string, MapDefinition | undefined>>;
}): CuratedTrainingRoutePackAudit {
  const routes = input.routes ?? CURATED_LEARNER_ROUTE_PACK;
  const issues: CuratedTrainingRoutePackAuditIssue[] = [];
  const validLearnerFacingRouteIds: string[] = [];
  const draftOrReviewRouteIds: string[] = [];

  for (const route of routes) {
    if (!isLearnerFacingCuratedTrainingRoute(route)) {
      draftOrReviewRouteIds.push(route.routeId);
      continue;
    }

    validLearnerFacingRouteIds.push(route.routeId);
    issues.push(...auditRouteMetadata(route));

    const map = input.mapById[route.mapId];

    if (!map) {
      issues.push({
        routeId: route.routeId,
        severity: "error",
        code: "unknown-map",
        message: `Route references unknown map ${route.mapId}.`
      });
      continue;
    }

    if (!route.start.nodeId || !route.destination.nodeId || route.validationSegments.length === 0) {
      issues.push({
        routeId: route.routeId,
        severity: "error",
        code: "missing-route-data",
        message: "Route must include start, destination, and matched validation segments."
      });
    }

    const validation = validateLearnerRoute({
      map,
      routeSegments: route.validationSegments,
      difficulty: route.difficulty
    });

    if (!validation.valid || validation.blockingErrors.length > 0) {
      issues.push({
        routeId: route.routeId,
        severity: "error",
        code: "validation-blocking-error",
        message: `Route has ${validation.blockingErrors.length} blocking validation error(s).`
      });
    }

    if (
      route.checkpointRequirements.required &&
      (route.checkpoints.length === 0 ||
        route.checkpointRequirements.requiredNodeIds.length !== route.checkpoints.length ||
        !route.checkpoints.every((checkpoint, index) => checkpoint.order === index + 1 && checkpoint.required === true))
    ) {
      issues.push({
        routeId: route.routeId,
        severity: "error",
        code: "checkpoint-requirement-invalid",
        message: "Checkpoint-required route must export ordered required checkpoints."
      });
    }

    if (route.shortestRouteComparison.directComparison.comparisonStatus === "unknown") {
      issues.push({
        routeId: route.routeId,
        severity: "error",
        code: "shortest-comparison-missing",
        message: "Learner-facing routes must include a direct shortest-route comparison or explicit non-applicable status."
      });
    }

    if (route.difficulty === "advanced" && routeComplexityScore(route) < 24) {
      issues.push({
        routeId: route.routeId,
        severity: "warning",
        code: "advanced-route-too-simple",
        message: "Advanced route is below the first-pack complexity floor."
      });
    }
  }

  const summary = buildCuratedTrainingRoutePackSummary(routes);

  if (
    summary.averageComplexityByDifficulty.beginner >= summary.averageComplexityByDifficulty.intermediate ||
    summary.averageComplexityByDifficulty.intermediate >= summary.averageComplexityByDifficulty.advanced
  ) {
    issues.push({
      routeId: CURATED_LEARNER_ROUTE_PACK_ID,
      severity: "warning",
      code: "difficulty-balance-warning",
      message: "Average route complexity should increase from beginner to intermediate to advanced."
    });
  }

  return {
    summary,
    issues,
    validLearnerFacingRouteIds,
    draftOrReviewRouteIds
  };
}

function curatedRouteCard(route: CuratedTrainingRouteExport, selected: boolean): CuratedTrainingRouteCardModel {
  return {
    routeId: route.routeId,
    title: route.title,
    difficulty: route.difficulty,
    exerciseType: route.exerciseType,
    area: route.areaName,
    description: route.metadata.description,
    skillsPractised: [...route.metadata.skillsPractised],
    approximateLengthLabel: formatDistance(route.complexitySummary.approximateRouteLengthMeters),
    segmentCount: route.complexitySummary.segmentCount,
    turnCount: route.complexitySummary.turnCount,
    decisionPointCount: route.complexitySummary.decisionPointCount,
    checkpointCount: route.checkpoints.length,
    statusLabel: route.status === "approved" ? "Approved" : "Beta",
    selected
  };
}

function routeComplexityScore(route: CuratedTrainingRouteExport): number {
  return (
    route.complexitySummary.segmentCount +
    route.complexitySummary.turnCount +
    route.complexitySummary.decisionPointCount * 2 +
    route.checkpoints.length * 4 +
    Math.round(route.complexitySummary.approximateRouteLengthMeters / 100)
  );
}

function auditRouteMetadata(route: CuratedTrainingRouteExport): CuratedTrainingRoutePackAuditIssue[] {
  const requiredStrings = [
    route.schemaVersion === 1 ? "schemaVersion" : "",
    route.routeId,
    route.title,
    route.areaName,
    route.areaId,
    route.mapId,
    route.sourceFixture ?? "",
    route.difficulty,
    route.exerciseType,
    route.metadata.description,
    route.metadata.objective,
    route.validationSummary.explanation,
    route.instructorQaNote ?? "",
    route.metadata.routeChoiceJustification
  ];
  const requiredArrays = [
    route.metadata.skillsPractised,
    route.metadata.expectedLearnerMistakes,
    route.metadata.hintSequence,
    route.metadata.scoringEmphasis,
    route.routeSegmentIds,
    route.roadIds,
    route.nodeIds,
    route.routeGeometry
  ];
  const hasRequiredMetadata =
    requiredStrings.every((value) => String(value).trim().length > 0) &&
    requiredArrays.every((value) => Array.isArray(value) && value.length > 0) &&
    Boolean(route.start.nodeId && route.destination.nodeId && Array.isArray(route.checkpoints));

  return hasRequiredMetadata
    ? []
    : [
        {
          routeId: route.routeId,
          severity: "error",
          code: "missing-required-metadata",
          message: "Route is missing required learner-facing metadata."
        }
      ];
}

function formatDistance(distanceMeters: number): string {
  return distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${Math.round(distanceMeters)} m`;
}

function seededIndex(seed: string | number, length: number): number {
  if (length <= 1) {
    return 0;
  }

  const text = String(seed);
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash) % length;
}
