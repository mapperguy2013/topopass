import routeAdvancedFollowSouthCrescentRidgmount from "../../data/training-routes/complete/real-london-advanced-follow-south-crescent-ridgmount.json" with { type: "json" };
import routeAdvancedJunctionMortimerGoodge from "../../data/training-routes/complete/real-london-advanced-junction-mortimer-goodge.json" with { type: "json" };
import routeAdvancedLegalTorringtonReverse from "../../data/training-routes/complete/real-london-advanced-legal-torrington-reverse.json" with { type: "json" };
import routeAdvancedLegalTottenhamGower from "../../data/training-routes/complete/real-london-advanced-legal-tottenham-gower.json" with { type: "json" };
import routeAdvancedReviewGoodgeByng from "../../data/training-routes/complete/real-london-advanced-review-goodge-byng.json" with { type: "json" };
import routeBeginnerFollowCheniesStreet from "../../data/training-routes/complete/real-london-beginner-follow-chenies-street.json" with { type: "json" };
import routeBeginnerFollowGoodgeTottenham from "../../data/training-routes/complete/real-london-beginner-follow-goodge-tottenham.json" with { type: "json" };
import routeBeginnerFollowStoreStreet from "../../data/training-routes/complete/real-london-beginner-follow-store-street.json" with { type: "json" };
import routeBeginnerFollowTorringtonByng from "../../data/training-routes/complete/real-london-beginner-follow-torrington-byng.json" with { type: "json" };
import routeBeginnerIdentifyNextSafeTurnStoreStreet from "../../data/training-routes/complete/real-london-beginner-identify-next-safe-turn-store-street.json" with { type: "json" };
import routeIntermediateCheckpointGoodgeChenies from "../../data/training-routes/complete/real-london-intermediate-checkpoint-goodge-chenies.json" with { type: "json" };
import routeIntermediateFollowGowerTorrington from "../../data/training-routes/complete/real-london-intermediate-follow-gower-torrington.json" with { type: "json" };
import routeIntermediateFollowHuntleyChenies from "../../data/training-routes/complete/real-london-intermediate-follow-huntley-chenies.json" with { type: "json" };
import routeIntermediateJunctionWhitfieldGoodge from "../../data/training-routes/complete/real-london-intermediate-junction-whitfield-goodge.json" with { type: "json" };
import routeIntermediateLegalTorringtonOneWay from "../../data/training-routes/complete/real-london-intermediate-legal-torrington-one-way.json" with { type: "json" };
import type { MapDefinition } from "../map-engine/index.ts";
import type { ExerciseDifficulty, ExerciseType } from "./learnerDriverTraining.ts";
import { validateLearnerRoute } from "./learnerRouteValidation.ts";
import type {
  CuratedShortestRouteComparisonDetail,
  CuratedTrainingRouteComplexitySummary,
  CuratedTrainingRouteExport,
  CuratedTrainingRouteMetadata,
  CuratedTrainingRouteStatus,
  CuratedTrainingRouteStop
} from "./curatedTrainingRoutes.ts";
import type { CuratedTrainingRouteLifecycleStage } from "./curatedTrainingRouteSaveNaming.ts";

export const CURATED_LEARNER_ROUTE_PACK_ID = "real-london-pilot-route-pack-1";
export const CURATED_LEARNER_ROUTE_PACK_VERSION = "2026.07";
export const NO_CURATED_ROUTE_AVAILABLE_MESSAGE = "No approved curated route is available for this selection yet.";
export const EXPERIMENTAL_GENERATED_ROUTE_LABEL = "Try experimental generated route";

export const CURATED_LEARNER_ROUTE_PACK_TARGET_COUNTS_BY_DIFFICULTY: Record<
  Exclude<ExerciseDifficulty, "easy">,
  number
> = {
  beginner: 5,
  intermediate: 5,
  advanced: 5
};

export const LEARNER_TRAINING_SUPPORTED_CURATED_MAP_IDS = new Set([
  "osm-real-london-pilot",
  "osm-real-london-pilot-2",
  "osm-curated-piccadilly-circus",
  "osm-curated-waterloo-bridge",
  "osm-curated-one-way-system-area",
  "osm-curated-quiet-residential-roads",
  "osm-curated-kings-cross-euston"
]);

export type CuratedTrainingRoutePackManifestEntry = {
  filename: string;
  route: unknown;
};

export const CURATED_LEARNER_ROUTE_PACK_FILES: CuratedTrainingRoutePackManifestEntry[] = [
  {
    filename: "real-london-beginner-follow-chenies-street.json",
    route: routeBeginnerFollowCheniesStreet
  },
  {
    filename: "real-london-beginner-follow-goodge-tottenham.json",
    route: routeBeginnerFollowGoodgeTottenham
  },
  {
    filename: "real-london-beginner-follow-store-street.json",
    route: routeBeginnerFollowStoreStreet
  },
  {
    filename: "real-london-beginner-follow-torrington-byng.json",
    route: routeBeginnerFollowTorringtonByng
  },
  {
    filename: "real-london-beginner-identify-next-safe-turn-store-street.json",
    route: routeBeginnerIdentifyNextSafeTurnStoreStreet
  },
  {
    filename: "real-london-intermediate-follow-huntley-chenies.json",
    route: routeIntermediateFollowHuntleyChenies
  },
  {
    filename: "real-london-intermediate-junction-whitfield-goodge.json",
    route: routeIntermediateJunctionWhitfieldGoodge
  },
  {
    filename: "real-london-intermediate-legal-torrington-one-way.json",
    route: routeIntermediateLegalTorringtonOneWay
  },
  {
    filename: "real-london-intermediate-follow-gower-torrington.json",
    route: routeIntermediateFollowGowerTorrington
  },
  {
    filename: "real-london-intermediate-checkpoint-goodge-chenies.json",
    route: routeIntermediateCheckpointGoodgeChenies
  },
  {
    filename: "real-london-advanced-review-goodge-byng.json",
    route: routeAdvancedReviewGoodgeByng
  },
  {
    filename: "real-london-advanced-follow-south-crescent-ridgmount.json",
    route: routeAdvancedFollowSouthCrescentRidgmount
  },
  {
    filename: "real-london-advanced-legal-tottenham-gower.json",
    route: routeAdvancedLegalTottenhamGower
  },
  {
    filename: "real-london-advanced-legal-torrington-reverse.json",
    route: routeAdvancedLegalTorringtonReverse
  },
  {
    filename: "real-london-advanced-junction-mortimer-goodge.json",
    route: routeAdvancedJunctionMortimerGoodge
  }
];

export const CURATED_LEARNER_ROUTE_PACK: CuratedTrainingRouteExport[] = CURATED_LEARNER_ROUTE_PACK_FILES.map((entry) =>
  normaliseCuratedTrainingRouteExport(entry.route)
);

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
  targetLearnerFacingRoutes: number;
  countsByDifficulty: Record<Exclude<ExerciseDifficulty, "easy">, number>;
  targetCountsByDifficulty: Record<Exclude<ExerciseDifficulty, "easy">, number>;
  missingTargetCountsByDifficulty: Record<Exclude<ExerciseDifficulty, "easy">, number>;
  countsByExerciseType: Partial<Record<ExerciseType, number>>;
  checkpointRouteCount: number;
  averageComplexityByDifficulty: Record<Exclude<ExerciseDifficulty, "easy">, number>;
  routePackStatus: "initial-beta" | "target-met";
  knownLimitations: string[];
};

export type CuratedTrainingRoutePackReadiness = {
  status: CuratedTrainingRoutePackSummary["routePackStatus"];
  currentTotal: number;
  targetTotal: number;
  countsByDifficulty: Record<Exclude<ExerciseDifficulty, "easy">, number>;
  targetCountsByDifficulty: Record<Exclude<ExerciseDifficulty, "easy">, number>;
  missingTargetCountsByDifficulty: Record<Exclude<ExerciseDifficulty, "easy">, number>;
  missingTotal: number;
  expansionTodo: string[];
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

export type CuratedTrainingRouteVisibilityExclusionCode =
  | "not-complete"
  | "not-beta-or-approved"
  | "unsupported-learner-map"
  | "missing-required-metadata"
  | "missing-route-data"
  | "checkpoint-requirement-invalid"
  | "validation-blocking-error"
  | "filter-mismatch";

export type CuratedTrainingRouteVisibilityExcludedRoute = {
  routeId: string;
  reasons: CuratedTrainingRouteVisibilityExclusionCode[];
  message: string;
};

export type CuratedTrainingRouteVisibilityDiagnostics = {
  completeRouteCount: number;
  learnerFacingRouteCount: number;
  excludedDraftOrReviewCount: number;
  excludedMissingMetadataCount: number;
  excludedValidationBlockingCount: number;
  excludedRoutes: CuratedTrainingRouteVisibilityExcludedRoute[];
  filter?: {
    mapId: string;
    difficulty: ExerciseDifficulty;
    exerciseType: ExerciseType;
    matchingRouteCount: number;
    hiddenByFilterCount: number;
  };
  availableFilterCombinations: Array<{
    mapId: string;
    areaName: string;
    difficulty: Exclude<ExerciseDifficulty, "easy">;
    exerciseType: ExerciseType;
    routeCount: number;
  }>;
};

export type CuratedTrainingRouteFileAuditRecord = {
  filename: string;
  routeId: string;
  title: string;
  areaName: string;
  mapId: string;
  difficulty: Exclude<ExerciseDifficulty, "easy">;
  exerciseType: ExerciseType;
  status: CuratedTrainingRouteStatus;
  lifecycleStage: CuratedTrainingRouteLifecycleStage;
  startExists: boolean;
  destinationExists: boolean;
  routeGeometryExists: boolean;
  routeSegmentsExist: boolean;
  checkpointCount: number;
  checkpointRequirement: "Optional" | "Required";
  validationStatus: CuratedTrainingRouteExport["validationSummary"]["status"];
  validationBlockingErrorCount: number;
  validationAdvisoryWarningCount: number;
  shortestRouteComparisonStatus: CuratedTrainingRouteExport["shortestRouteComparison"]["directComparison"]["comparisonStatus"];
  learnerFacing: boolean;
  excludedReasons: CuratedTrainingRouteVisibilityExclusionCode[];
};

export function isLearnerFacingCuratedTrainingRoute(route: CuratedTrainingRouteExport): boolean {
  return learnerVisibilityExclusionReasons(normaliseCuratedTrainingRouteExport(route)).length === 0;
}

export function learnerFacingCuratedTrainingRoutes(
  routes: readonly CuratedTrainingRouteExport[] = CURATED_LEARNER_ROUTE_PACK
): CuratedTrainingRouteExport[] {
  return routes
    .map(normaliseCuratedTrainingRouteExport)
    .filter(isLearnerFacingCuratedTrainingRoute);
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
      message: curatedTrainingRouteUnavailableMessage(input),
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

export function buildCuratedTrainingRouteVisibilityDiagnostics(input: {
  routes?: readonly CuratedTrainingRouteExport[];
  mapId?: string;
  difficulty?: ExerciseDifficulty;
  exerciseType?: ExerciseType;
} = {}): CuratedTrainingRouteVisibilityDiagnostics {
  const routes = (input.routes ?? CURATED_LEARNER_ROUTE_PACK).map(normaliseCuratedTrainingRouteExport);
  const learnerRoutes = routes.filter((route) => learnerVisibilityExclusionReasons(route).length === 0);
  const excludedRoutes: CuratedTrainingRouteVisibilityExcludedRoute[] = [];
  let completeRouteCount = 0;
  let learnerFacingRouteCount = 0;

  for (const route of routes) {
    if (route.lifecycleStage === "complete") {
      completeRouteCount += 1;
    }

    const reasons = learnerVisibilityExclusionReasons(route);

    if (reasons.length === 0) {
      learnerFacingRouteCount += 1;
    } else {
      excludedRoutes.push({
        routeId: visibilityRouteId(route),
        reasons,
        message: visibilityExclusionMessage(reasons)
      });
    }
  }

  const diagnostics: CuratedTrainingRouteVisibilityDiagnostics = {
    completeRouteCount,
    learnerFacingRouteCount,
    excludedDraftOrReviewCount: excludedRoutes.filter((route) =>
      route.reasons.some((reason) => reason === "not-complete" || reason === "not-beta-or-approved")
    ).length,
    excludedMissingMetadataCount: excludedRoutes.filter((route) => route.reasons.includes("missing-required-metadata")).length,
    excludedValidationBlockingCount: excludedRoutes.filter((route) => route.reasons.includes("validation-blocking-error")).length,
    excludedRoutes,
    availableFilterCombinations: availableFilterCombinations(learnerRoutes)
  };

  if (input.mapId && input.difficulty && input.exerciseType) {
    const matchingRouteCount = learnerRoutes.filter(
      (route) =>
        route.mapId === input.mapId &&
        route.difficulty === input.difficulty &&
        route.exerciseType === input.exerciseType
    ).length;

    diagnostics.filter = {
      mapId: input.mapId,
      difficulty: input.difficulty,
      exerciseType: input.exerciseType,
      matchingRouteCount,
      hiddenByFilterCount: Math.max(0, learnerRoutes.length - matchingRouteCount)
    };
  }

  return diagnostics;
}

export function curatedTrainingRouteUnavailableMessage(input: {
  routes?: readonly CuratedTrainingRouteExport[];
  mapId?: string;
  difficulty?: ExerciseDifficulty;
  exerciseType?: ExerciseType;
}): string {
  const diagnostics = buildCuratedTrainingRouteVisibilityDiagnostics(input);

  if (diagnostics.filter && diagnostics.learnerFacingRouteCount > 0 && diagnostics.filter.matchingRouteCount === 0) {
    const combinations = formatAvailableFilterCombinations(diagnostics.availableFilterCombinations);

    return [
      NO_CURATED_ROUTE_AVAILABLE_MESSAGE,
      `${diagnostics.filter.hiddenByFilterCount} learner-facing curated route(s) exist but are hidden by the selected map, difficulty, or exercise type.`,
      combinations ? `Available selections: ${combinations}.` : ""
    ].join(" ");
  }

  if (diagnostics.excludedRoutes.length > 0) {
    return [
      NO_CURATED_ROUTE_AVAILABLE_MESSAGE,
      `${diagnostics.excludedRoutes.length} curated route file(s) were excluded by visibility checks.`
    ].join(" ");
  }

  return NO_CURATED_ROUTE_AVAILABLE_MESSAGE;
}

export function auditCuratedTrainingRouteFiles(
  entries: readonly CuratedTrainingRoutePackManifestEntry[] = CURATED_LEARNER_ROUTE_PACK_FILES
): CuratedTrainingRouteFileAuditRecord[] {
  return entries.map((entry) => {
    const route = normaliseCuratedTrainingRouteExport(entry.route);
    const excludedReasons = learnerVisibilityExclusionReasons(route);

    return {
      filename: entry.filename,
      routeId: visibilityRouteId(route),
      title: route.title,
      areaName: route.areaName,
      mapId: route.mapId,
      difficulty: route.difficulty,
      exerciseType: route.exerciseType,
      status: route.status,
      lifecycleStage: route.lifecycleStage,
      startExists: route.start.nodeId.trim().length > 0,
      destinationExists: route.destination.nodeId.trim().length > 0,
      routeGeometryExists: route.routeGeometry.length > 0,
      routeSegmentsExist: route.routeSegmentIds.length > 0 && route.validationSegments.length > 0,
      checkpointCount: route.checkpoints.length,
      checkpointRequirement: route.checkpointRequirements.required ? "Required" : "Optional",
      validationStatus: route.validationSummary.status,
      validationBlockingErrorCount: route.validationSummary.blockingErrors.length,
      validationAdvisoryWarningCount: route.validationSummary.advisoryWarnings.length,
      shortestRouteComparisonStatus: route.shortestRouteComparison.directComparison.comparisonStatus,
      learnerFacing: excludedReasons.length === 0,
      excludedReasons
    };
  });
}

export function buildCuratedTrainingRoutePackReadiness(
  routes: readonly CuratedTrainingRouteExport[] = CURATED_LEARNER_ROUTE_PACK
): CuratedTrainingRoutePackReadiness {
  const summary = buildCuratedTrainingRoutePackSummary(routes);
  const missingTotal = Object.values(summary.missingTargetCountsByDifficulty).reduce((total, count) => total + count, 0);
  const expansionTodo = (Object.entries(summary.missingTargetCountsByDifficulty) as Array<
    [Exclude<ExerciseDifficulty, "easy">, number]
  >)
    .filter(([, missingCount]) => missingCount > 0)
    .map(([difficulty, missingCount]) => `Add ${missingCount} more ${difficulty} curated route${missingCount === 1 ? "" : "s"}.`);

  return {
    status: summary.routePackStatus,
    currentTotal: summary.totalLearnerFacingRoutes,
    targetTotal: summary.targetLearnerFacingRoutes,
    countsByDifficulty: summary.countsByDifficulty,
    targetCountsByDifficulty: summary.targetCountsByDifficulty,
    missingTargetCountsByDifficulty: summary.missingTargetCountsByDifficulty,
    missingTotal,
    expansionTodo
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
  const missingTargetCountsByDifficulty = Object.fromEntries(
    difficulties.map((difficulty) => [
      difficulty,
      Math.max(0, CURATED_LEARNER_ROUTE_PACK_TARGET_COUNTS_BY_DIFFICULTY[difficulty] - countsByDifficulty[difficulty])
    ])
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
  const targetLearnerFacingRoutes = Object.values(CURATED_LEARNER_ROUTE_PACK_TARGET_COUNTS_BY_DIFFICULTY).reduce(
    (sum, count) => sum + count,
    0
  );
  const missingTotal = Object.values(missingTargetCountsByDifficulty).reduce((sum, count) => sum + count, 0);

  return {
    packId: CURATED_LEARNER_ROUTE_PACK_ID,
    packVersion: CURATED_LEARNER_ROUTE_PACK_VERSION,
    totalLearnerFacingRoutes: learnerRoutes.length,
    targetLearnerFacingRoutes,
    countsByDifficulty,
    targetCountsByDifficulty: { ...CURATED_LEARNER_ROUTE_PACK_TARGET_COUNTS_BY_DIFFICULTY },
    missingTargetCountsByDifficulty,
    countsByExerciseType,
    checkpointRouteCount: learnerRoutes.filter((route) => route.checkpoints.length > 0).length,
    averageComplexityByDifficulty,
    routePackStatus: missingTotal === 0 ? "target-met" : "initial-beta",
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
      draftOrReviewRouteIds.push(visibilityRouteId(route));
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

    if (hasInvalidRequiredCheckpointData(route)) {
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

export function normaliseCuratedTrainingRouteExport(route: unknown): CuratedTrainingRouteExport {
  const raw = recordValue(route);
  const metadataRaw = recordValue(raw.metadata);
  const validationSegments = validationSegmentsValue(raw.validationSegments);
  const routeSegmentIds = stringArrayValue(raw.routeSegmentIds, validationSegments.map((segment) => segment.id));
  const roadIds = stringArrayValue(raw.roadIds, [...new Set(validationSegments.map((segment) => segment.roadId))]);
  const routeGeometry = pointArrayValue(raw.routeGeometry);
  const checkpoints = stopArrayValue(raw.checkpoints, "checkpoint");
  const status = statusValue(raw.status, statusValue(metadataRaw.status, "draft"));
  const difficulty = difficultyValue(raw.difficulty, difficultyValue(metadataRaw.difficulty, "beginner"));
  const exerciseType = exerciseTypeValue(raw.exerciseType, exerciseTypeValue(metadataRaw.exerciseType, "follow-planned-route"));
  const mapId = stringValue(raw.mapId, stringValue(raw.practiceMapId, stringValue(metadataRaw.practiceMapId, "")));
  const routeId = stringValue(raw.routeId, stringValue(metadataRaw.routeId, ""));
  const title = stringValue(raw.title, stringValue(metadataRaw.title, ""));
  const area = stringValue(raw.area, stringValue(metadataRaw.area, ""));
  const areaId = stringValue(raw.areaId, stringValue(metadataRaw.areaId, mapId));
  const areaName = stringValue(raw.areaName, stringValue(metadataRaw.areaName, area));
  const sourceFixture = optionalStringValue(raw.sourceFixture, optionalStringValue(metadataRaw.sourceFixture));
  const metadata = normaliseMetadata({
    raw: metadataRaw,
    routeId,
    title,
    area,
    mapId,
    areaId,
    areaName,
    sourceFixture,
    difficulty,
    exerciseType,
    status
  });
  const start = stopValue(raw.start, "start", 0);
  const destination = stopValue(raw.destination, "destination", checkpoints.length + 1);
  const nodeIds = stringArrayValue(raw.nodeIds, [
    start.nodeId,
    ...validationSegments.map((segment) => segment.toNodeId),
    ...checkpoints.map((checkpoint) => checkpoint.nodeId),
    destination.nodeId
  ].filter(Boolean));
  const validationSummary = validationSummaryValue(raw.validationSummary);
  const complexitySummary = complexitySummaryValue({
    raw: raw.complexitySummary,
    routeSegmentIds,
    checkpoints,
    routeGeometry,
    validationSummary
  });
  const checkpointRequirements = checkpointRequirementsValue({
    raw: raw.checkpointRequirements,
    checkpoints,
    required: metadata.checkpointRequirement === "required"
  });

  return {
    ...(raw as Partial<CuratedTrainingRouteExport>),
    schemaVersion: 1,
    routeId,
    title,
    area,
    practiceMapId: stringValue(raw.practiceMapId, metadata.practiceMapId),
    areaId,
    areaName,
    ...(sourceFixture ? { sourceFixture } : {}),
    difficulty,
    exerciseType,
    status,
    lifecycleStage: lifecycleStageValue(raw.lifecycleStage),
    metadata,
    mapId,
    start,
    destination,
    checkpoints,
    checkpointRequirements,
    routeSegmentIds,
    roadIds,
    nodeIds,
    routeGeometry,
    validationSummary,
    complexitySummary,
    shortestRouteComparison: shortestRouteComparisonValue(raw.shortestRouteComparison),
    validationSegments
  };
}

function learnerVisibilityExclusionReasons(
  route: CuratedTrainingRouteExport
): CuratedTrainingRouteVisibilityExclusionCode[] {
  const reasons: CuratedTrainingRouteVisibilityExclusionCode[] = [];

  if (route.lifecycleStage !== "complete") {
    reasons.push("not-complete");
  }

  if (
    (route.status !== "beta" && route.status !== "approved") ||
    (route.metadata.status !== "beta" && route.metadata.status !== "approved")
  ) {
    reasons.push("not-beta-or-approved");
  }

  if (!hasRequiredLearnerVisibilityMetadata(route)) {
    reasons.push("missing-required-metadata");
  }

  if (route.mapId.trim().length > 0 && !LEARNER_TRAINING_SUPPORTED_CURATED_MAP_IDS.has(route.mapId)) {
    reasons.push("unsupported-learner-map");
  }

  if (!hasRequiredLearnerRouteData(route)) {
    reasons.push("missing-route-data");
  }

  if (hasInvalidRequiredCheckpointData(route)) {
    reasons.push("checkpoint-requirement-invalid");
  }

  if (!route.validationSummary.valid || route.validationSummary.blockingErrors.length > 0) {
    reasons.push("validation-blocking-error");
  }

  return reasons;
}

function hasRequiredLearnerVisibilityMetadata(route: CuratedTrainingRouteExport): boolean {
  return (
    route.schemaVersion === 1 &&
    route.routeId.trim().length > 0 &&
    route.title.trim().length > 0 &&
    route.mapId.trim().length > 0 &&
    route.areaId.trim().length > 0 &&
    route.areaName.trim().length > 0 &&
    route.metadata.description.trim().length > 0 &&
    route.metadata.objective.trim().length > 0 &&
    route.metadata.skillsPractised.length > 0 &&
    route.metadata.hintSequence.length > 0 &&
    route.metadata.scoringEmphasis.length > 0
  );
}

function hasRequiredLearnerRouteData(route: CuratedTrainingRouteExport): boolean {
  return (
    route.start.nodeId.trim().length > 0 &&
    route.destination.nodeId.trim().length > 0 &&
    route.routeGeometry.length > 0 &&
    route.validationSegments.length > 0 &&
    route.routeSegmentIds.length > 0
  );
}

function hasInvalidRequiredCheckpointData(route: CuratedTrainingRouteExport): boolean {
  return (
    route.checkpointRequirements.required &&
    (route.checkpoints.length === 0 ||
      route.checkpointRequirements.requiredNodeIds.length !== route.checkpoints.length ||
      !route.checkpoints.every((checkpoint, index) => checkpoint.order === index + 1 && checkpoint.required === true))
  );
}

function visibilityRouteId(route: CuratedTrainingRouteExport): string {
  return route.routeId.trim() || route.metadata.routeId.trim() || "(missing route id)";
}

function visibilityExclusionMessage(reasons: readonly CuratedTrainingRouteVisibilityExclusionCode[]): string {
  if (reasons.includes("not-complete") || reasons.includes("not-beta-or-approved")) {
    return "Route is not complete beta/approved learner-facing content.";
  }

  if (reasons.includes("missing-required-metadata")) {
    return "Route is missing learner-facing metadata required for Training Mode cards.";
  }

  if (reasons.includes("unsupported-learner-map")) {
    return "Route belongs to a map that learner Training Mode cannot load yet.";
  }

  if (reasons.includes("missing-route-data")) {
    return "Route is missing start, destination, route geometry, or matched route segments.";
  }

  if (reasons.includes("checkpoint-requirement-invalid")) {
    return "Route requires checkpoints but does not include ordered required checkpoint data.";
  }

  if (reasons.includes("validation-blocking-error")) {
    return "Route validation has blocking errors.";
  }

  return "Route is hidden from learner Training Mode.";
}

function availableFilterCombinations(
  learnerRoutes: readonly CuratedTrainingRouteExport[]
): CuratedTrainingRouteVisibilityDiagnostics["availableFilterCombinations"] {
  const countsByKey = new Map<string, CuratedTrainingRouteVisibilityDiagnostics["availableFilterCombinations"][number]>();

  for (const route of learnerRoutes) {
    const key = [route.mapId, route.areaName, route.difficulty, route.exerciseType].join("|");
    const existing = countsByKey.get(key);

    if (existing) {
      existing.routeCount += 1;
    } else {
      countsByKey.set(key, {
        mapId: route.mapId,
        areaName: route.areaName,
        difficulty: route.difficulty,
        exerciseType: route.exerciseType,
        routeCount: 1
      });
    }
  }

  return [...countsByKey.values()].sort((left, right) =>
    `${left.areaName}:${left.difficulty}:${left.exerciseType}`.localeCompare(
      `${right.areaName}:${right.difficulty}:${right.exerciseType}`
    )
  );
}

function formatAvailableFilterCombinations(
  combinations: readonly CuratedTrainingRouteVisibilityDiagnostics["availableFilterCombinations"][number][]
): string {
  return combinations
    .slice(0, 6)
    .map(
      (combination) =>
        `${combination.areaName} / ${combination.difficulty} / ${combination.exerciseType} (${combination.routeCount})`
    )
    .join("; ");
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
    route.validationSummary.explanation
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

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function optionalStringValue(value: unknown, fallback?: string): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function stringArrayValue(value: unknown, fallback: readonly string[] = []): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function statusValue(value: unknown, fallback: CuratedTrainingRouteStatus): CuratedTrainingRouteStatus {
  return value === "draft" || value === "beta" || value === "approved" ? value : fallback;
}

function lifecycleStageValue(value: unknown): CuratedTrainingRouteLifecycleStage {
  return value === "authoring" || value === "draft" || value === "review" || value === "complete" ? value : "draft";
}

function difficultyValue(
  value: unknown,
  fallback: Exclude<ExerciseDifficulty, "easy">
): Exclude<ExerciseDifficulty, "easy"> {
  return value === "beginner" || value === "intermediate" || value === "advanced" ? value : fallback;
}

function exerciseTypeValue(value: unknown, fallback: ExerciseType): ExerciseType {
  return value === "follow-planned-route" ||
    value === "choose-legal-route" ||
    value === "identify-next-safe-turn" ||
    value === "practise-roundabouts" ||
    value === "practise-junction-decision-making" ||
    value === "route-review-mistake-correction"
    ? value
    : fallback;
}

function pointValue(value: unknown): { x: number; y: number } | undefined {
  const raw = recordValue(value);
  const x = numberValue(raw.x, Number.NaN);
  const y = numberValue(raw.y, Number.NaN);

  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
}

function pointArrayValue(value: unknown): { x: number; y: number }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(pointValue).filter((point): point is { x: number; y: number } => Boolean(point));
}

function stopValue(value: unknown, kind: "start" | "checkpoint" | "destination", order: number): CuratedTrainingRouteStop {
  const raw = recordValue(value);
  const point = pointValue(raw.point);
  const displayRaw = recordValue(raw.display);

  return {
    id: stringValue(raw.id, kind),
    kind,
    order,
    nodeId: stringValue(raw.nodeId, ""),
    label: stringValue(raw.label, kind === "destination" ? "Destination" : kind === "start" ? "Start" : `Checkpoint ${order}`),
    ...(point ? { point } : {}),
    ...(optionalStringValue(raw.roadId) ? { roadId: optionalStringValue(raw.roadId) } : {}),
    ...(optionalStringValue(raw.routeSegmentId) ? { routeSegmentId: optionalStringValue(raw.routeSegmentId) } : {}),
    required: booleanValue(raw.required, kind !== "checkpoint"),
    display: {
      markerLabel: stringValue(displayRaw.markerLabel, kind === "destination" ? "DESTINATION" : kind === "start" ? "START" : `CP ${order}`),
      markerRole: kind,
      description: stringValue(displayRaw.description, kind === "checkpoint" ? "Route checkpoint" : `Required route ${kind}`)
    }
  };
}

function stopArrayValue(value: unknown, kind: "checkpoint"): CuratedTrainingRouteStop[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => stopValue(item, kind, index + 1));
}

function validationSegmentsValue(value: unknown): CuratedTrainingRouteExport["validationSegments"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const raw = recordValue(item);
      const id = stringValue(raw.id, "");
      const roadId = stringValue(raw.roadId, "");
      const fromNodeId = stringValue(raw.fromNodeId, "");
      const toNodeId = stringValue(raw.toNodeId, "");

      return id && roadId && fromNodeId && toNodeId ? { id, roadId, fromNodeId, toNodeId } : null;
    })
    .filter((segment): segment is CuratedTrainingRouteExport["validationSegments"][number] => Boolean(segment));
}

function normaliseMetadata(input: {
  raw: Record<string, unknown>;
  routeId: string;
  title: string;
  area: string;
  mapId: string;
  areaId: string;
  areaName: string;
  sourceFixture?: string;
  difficulty: Exclude<ExerciseDifficulty, "easy">;
  exerciseType: ExerciseType;
  status: CuratedTrainingRouteStatus;
}): CuratedTrainingRouteMetadata {
  return {
    routeId: input.routeId,
    title: input.title,
    area: input.area,
    practiceMapId: stringValue(input.raw.practiceMapId, input.mapId),
    areaId: input.areaId,
    areaName: input.areaName,
    ...(input.sourceFixture ? { sourceFixture: input.sourceFixture } : {}),
    difficulty: input.difficulty,
    exerciseType: input.exerciseType,
    description: stringValue(input.raw.description, "Curated learner-driver route."),
    objective: stringValue(input.raw.objective, "Complete the curated learner route legally and accurately."),
    skillsPractised: stringArrayValue(input.raw.skillsPractised, ["route planning"]),
    expectedLearnerMistakes: stringArrayValue(input.raw.expectedLearnerMistakes),
    hintSequence: stringArrayValue(input.raw.hintSequence, ["Check the next junction before committing."]),
    scoringEmphasis: stringArrayValue(input.raw.scoringEmphasis, ["route adherence"]),
    instructorFeedbackNotes: stringValue(input.raw.instructorFeedbackNotes, "Give one clear improvement suggestion for the main route issue."),
    routeChoiceJustification: stringValue(input.raw.routeChoiceJustification, ""),
    checkpointRequirement:
      input.raw.checkpointRequirement === "required" || input.raw.checkpointRequirement === "optional"
        ? input.raw.checkpointRequirement
        : "optional",
    status: statusValue(input.raw.status, input.status)
  };
}

function validationSummaryValue(value: unknown): CuratedTrainingRouteExport["validationSummary"] {
  const raw = recordValue(value);
  const blockingErrors = Array.isArray(raw.blockingErrors)
    ? (raw.blockingErrors as CuratedTrainingRouteExport["validationSummary"]["blockingErrors"])
    : [];
  const advisoryWarnings = Array.isArray(raw.advisoryWarnings)
    ? (raw.advisoryWarnings as CuratedTrainingRouteExport["validationSummary"]["advisoryWarnings"])
    : [];
  const status =
    raw.status === "valid" || raw.status === "invalid" || raw.status === "warning"
      ? raw.status
      : blockingErrors.length > 0
        ? "invalid"
        : advisoryWarnings.length > 0
          ? "warning"
          : "valid";

  return {
    status,
    valid: booleanValue(raw.valid, blockingErrors.length === 0),
    blockingErrors,
    advisoryWarnings,
    affectedRouteSegmentIds: stringArrayValue(raw.affectedRouteSegmentIds),
    ruleCodes: stringArrayValue(raw.ruleCodes) as CuratedTrainingRouteExport["validationSummary"]["ruleCodes"],
    explanation: stringValue(raw.explanation, "Route visibility has not been validated yet.")
  };
}

function complexitySummaryValue(input: {
  raw: unknown;
  routeSegmentIds: readonly string[];
  checkpoints: readonly CuratedTrainingRouteStop[];
  routeGeometry: readonly { x: number; y: number }[];
  validationSummary: CuratedTrainingRouteExport["validationSummary"];
}): CuratedTrainingRouteComplexitySummary {
  const raw = recordValue(input.raw);
  const fallbackDistance = Math.max(0, input.routeGeometry.length - 1) * 40;

  return {
    approximateRouteLengthMeters: numberValue(raw.approximateRouteLengthMeters, fallbackDistance),
    segmentCount: numberValue(raw.segmentCount, input.routeSegmentIds.length),
    turnCount: numberValue(raw.turnCount, Math.max(0, input.routeSegmentIds.length - 1)),
    decisionPointCount: numberValue(raw.decisionPointCount, 0),
    checkpointCount: numberValue(raw.checkpointCount, input.checkpoints.length),
    estimatedDifficulty: difficultyValue(raw.estimatedDifficulty, "beginner"),
    warnings: stringArrayValue(raw.warnings, input.validationSummary.advisoryWarnings.map((warning) => warning.explanation))
  };
}

function checkpointRequirementsValue(input: {
  raw: unknown;
  checkpoints: readonly CuratedTrainingRouteStop[];
  required: boolean;
}): CuratedTrainingRouteExport["checkpointRequirements"] {
  const raw = recordValue(input.raw);
  const required = booleanValue(raw.required, input.required);

  return {
    required,
    ordered: true,
    checkpointCount: numberValue(raw.checkpointCount, input.checkpoints.length),
    requiredNodeIds: required ? stringArrayValue(raw.requiredNodeIds, input.checkpoints.map((checkpoint) => checkpoint.nodeId)) : stringArrayValue(raw.requiredNodeIds),
    instruction: stringValue(
      raw.instruction,
      required
        ? "Visit each checkpoint in order before reaching the destination."
        : "No intermediate checkpoint is required unless the route author adds one."
    )
  };
}

function shortestRouteComparisonDetailValue(
  value: unknown,
  fallbackExplanation: string
): CuratedShortestRouteComparisonDetail {
  const raw = recordValue(value);

  return {
    comparisonStatus:
      raw.comparisonStatus === "available" || raw.comparisonStatus === "unknown" || raw.comparisonStatus === "not-applicable"
        ? raw.comparisonStatus
        : "unknown",
    verdict:
      raw.verdict === "shortest-or-near-shortest" ||
      raw.verdict === "acceptable-training-variation" ||
      raw.verdict === "detour-warning" ||
      raw.verdict === "major-detour-warning" ||
      raw.verdict === "unknown"
        ? raw.verdict
        : "unknown",
    explanation: stringValue(raw.explanation, fallbackExplanation),
    authoredLengthMeters: nullableNumberValue(raw.authoredLengthMeters),
    shortestLengthMeters: nullableNumberValue(raw.shortestLengthMeters),
    lengthDeltaMeters: nullableNumberValue(raw.lengthDeltaMeters),
    percentageLonger: nullableNumberValue(raw.percentageLonger),
    authoredSegmentCount: nullableNumberValue(raw.authoredSegmentCount),
    shortestSegmentCount: nullableNumberValue(raw.shortestSegmentCount),
    segmentCountDelta: nullableNumberValue(raw.segmentCountDelta),
    authoredTurnCount: nullableNumberValue(raw.authoredTurnCount),
    shortestTurnCount: nullableNumberValue(raw.shortestTurnCount),
    turnCountDelta: nullableNumberValue(raw.turnCountDelta),
    authoredDecisionPointCount: nullableNumberValue(raw.authoredDecisionPointCount),
    shortestDecisionPointCount: nullableNumberValue(raw.shortestDecisionPointCount),
    decisionPointDelta: nullableNumberValue(raw.decisionPointDelta),
    shortestRouteSegmentIds: stringArrayValue(raw.shortestRouteSegmentIds)
  };
}

function shortestRouteComparisonValue(value: unknown): CuratedTrainingRouteExport["shortestRouteComparison"] {
  const raw = recordValue(value);

  return {
    directComparison: shortestRouteComparisonDetailValue(
      raw.directComparison,
      "Shortest-route comparison has not been run for this route."
    ),
    checkpointConstrainedComparison: shortestRouteComparisonDetailValue(
      raw.checkpointConstrainedComparison,
      "Checkpoint-constrained comparison is not applicable or has not been run."
    ),
    routeChoiceJustification: stringValue(raw.routeChoiceJustification, ""),
    requiresRouteChoiceJustification: booleanValue(raw.requiresRouteChoiceJustification, false),
    guidance: stringArrayValue(raw.guidance)
  };
}

function nullableNumberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
