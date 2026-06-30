import {
  buildMapGraph,
  createDrawnRouteTrace,
  type MapDefinition,
  type MapGraph,
  type MapRoad,
  type RouteExercise,
  type Vec2
} from "../../../lib/map-engine/index.ts";
import {
  getRouteRunnerMapFitBounds,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  type RouteRunnerMapBounds,
  type RouteRunnerMapOption
} from "./routeRunnerMaps.ts";
import {
  buildOsmRouteExerciseQaAcceptanceSuiteReport,
  validateOsmRouteExerciseQaSuite,
  type OsmExerciseQaAcceptanceReport,
  type OsmExerciseQaFailureReason,
  type OsmExerciseQaResult
} from "./routeRunnerOsmExerciseQa.ts";
import {
  validateOsmManualAttemptQa,
  type OSMManualAttemptQaReason,
  type OsmManualAttemptQaReport
} from "./routeRunnerOsmManualAttemptQa.ts";
import {
  buildOsmDrawnRouteQaReport,
  buildOsmDrawnRouteQaSuiteReport,
  type OsmDrawnRouteQaFailureReason,
  type OsmDrawnRouteQaReport
} from "./routeRunnerOsmDrawnRouteQa.ts";

export type OsmPilotReadinessStatus = "pass" | "fail";
export type OsmPilotReadinessOverallStatus = "ready" | "not-ready";

export type OsmPilotReadinessSectionId =
  | "fixture-source"
  | "exercise-count"
  | "acceptance-qa"
  | "manual-attempt-qa"
  | "drawn-route-qa"
  | "render-bounds-sanity"
  | "fastest-legal-route-availability"
  | "illegal-movement-detection-coverage";

export type OsmPilotManualAttemptReadinessFailureReason =
  | Exclude<OSMManualAttemptQaReason, "manual-attempt-valid">
  | "fastest-route-unavailable";

export type OsmPilotIllegalMovementCoverageReason =
  | "no-one-way-road"
  | "no-exercise"
  | "manual-blocked-edge-not-detected"
  | "drawn-blocked-edge-not-detected";

export type OsmPilotReadinessFailureReason =
  | `fixture-source:${"missing" | "unexpected-fixture"}`
  | "exercise-count:empty"
  | `acceptance:${OsmExerciseQaFailureReason}`
  | `manual:${OsmPilotManualAttemptReadinessFailureReason}`
  | `drawn:${OsmDrawnRouteQaFailureReason}`
  | "render-bounds:outside-render-bounds"
  | "fastest-route:missing"
  | `illegal-movement:${OsmPilotIllegalMovementCoverageReason}`;

export type OsmPilotFixtureSourceReadiness = {
  id: "fixture-source";
  status: OsmPilotReadinessStatus;
  source: "committed-local-overpass-fixture" | "unknown";
  fixtureName: string | null;
  path: string | null;
  generator: string | null;
  osmBaseTimestamp: string | null;
  failureReasonCodes: Array<"missing" | "unexpected-fixture">;
  failureMessages: string[];
};

export type OsmPilotExerciseCountReadiness = {
  id: "exercise-count";
  status: OsmPilotReadinessStatus;
  count: number;
  failureReasonCodes: Array<"empty">;
  failureMessages: string[];
};

export type OsmPilotAcceptanceQaReadiness = {
  id: "acceptance-qa";
  status: OsmPilotReadinessStatus;
  exerciseCount: number;
  passedExerciseCount: number;
  failedExerciseCount: number;
  failureReasonCodes: OsmExerciseQaFailureReason[];
  failureMessages: string[];
  reports: OsmExerciseQaAcceptanceReport[];
};

export type OsmPilotManualAttemptQaReadinessReport = {
  exerciseId: string;
  isAccepted: boolean;
  reasonCodes: Array<OSMManualAttemptQaReason | "fastest-route-unavailable">;
  feedbackStatus: OsmManualAttemptQaReport["feedbackStatus"] | "not-run";
  selectedDirectedEdgeCount: number;
  selectedDirectedEdgeIds: string[];
  scorePassed: boolean | null;
  illegalMovementTypes: string[];
  messages: string[];
};

export type OsmPilotManualAttemptQaReadiness = {
  id: "manual-attempt-qa";
  status: OsmPilotReadinessStatus;
  exerciseCount: number;
  acceptedAttemptCount: number;
  rejectedAttemptCount: number;
  failureReasonCodes: OsmPilotManualAttemptReadinessFailureReason[];
  failureMessages: string[];
  reports: OsmPilotManualAttemptQaReadinessReport[];
};

export type OsmPilotDrawnRouteQaReadinessReport = Pick<
  OsmDrawnRouteQaReport,
  | "exerciseId"
  | "isValid"
  | "failureReasonCodes"
  | "drawnPointCount"
  | "pipelineStatus"
  | "matchingStatus"
  | "reviewStatus"
  | "scorePassed"
  | "matchedDirectedEdgeIds"
  | "illegalMovementTypes"
  | "illegalHighlightKinds"
  | "warningCodes"
>;

export type OsmPilotDrawnRouteQaReadiness = {
  id: "drawn-route-qa";
  status: OsmPilotReadinessStatus;
  exerciseCount: number;
  passedDrawnRouteCount: number;
  failedDrawnRouteCount: number;
  failureReasonCodes: OsmDrawnRouteQaFailureReason[];
  failureMessages: string[];
  reports: OsmPilotDrawnRouteQaReadinessReport[];
};

export type OsmPilotRenderBoundsSanity = {
  id: "render-bounds-sanity";
  status: OsmPilotReadinessStatus;
  bounds: RouteRunnerMapBounds;
  checkedExerciseCount: number;
  checkedRouteEdgeCount: number;
  failureReasonCodes: Array<"outside-render-bounds">;
  failureMessages: string[];
};

export type OsmPilotFastestLegalRouteAvailabilityReport = {
  exerciseId: string;
  hasLegalRoute: boolean;
  fastestRouteEdgeCount: number;
  fastestRouteDistanceMeters: number | null;
};

export type OsmPilotFastestLegalRouteAvailability = {
  id: "fastest-legal-route-availability";
  status: OsmPilotReadinessStatus;
  exerciseCount: number;
  availableExerciseCount: number;
  missingExerciseIds: string[];
  totalFastestRouteEdgeCount: number;
  reports: OsmPilotFastestLegalRouteAvailabilityReport[];
  failureReasonCodes: Array<"missing">;
  failureMessages: string[];
};

export type OsmPilotIllegalMovementCoverageCheck = {
  id: "manual-blocked-directed-edge" | "drawn-reversed-one-way";
  status: OsmPilotReadinessStatus;
  exerciseId: string | null;
  roadId: string | null;
  reasonCodes: OsmPilotIllegalMovementCoverageReason[];
  illegalMovementTypes: string[];
  illegalHighlightKinds: string[];
  messages: string[];
};

export type OsmPilotIllegalMovementDetectionCoverage = {
  id: "illegal-movement-detection-coverage";
  status: OsmPilotReadinessStatus;
  checkedRoadId: string | null;
  failureReasonCodes: OsmPilotIllegalMovementCoverageReason[];
  failureMessages: string[];
  checks: OsmPilotIllegalMovementCoverageCheck[];
};

export type OsmPilotReadinessSectionSummary = {
  id: OsmPilotReadinessSectionId;
  status: OsmPilotReadinessStatus;
  failureReasonCodes: string[];
};

export type OsmPilotReadinessPassFailSummary = {
  status: OsmPilotReadinessStatus;
  passedSections: OsmPilotReadinessSectionId[];
  failedSections: OsmPilotReadinessSectionId[];
  sections: OsmPilotReadinessSectionSummary[];
};

export type OsmPilotReadinessReport = {
  mapId: string;
  fixtureSource: OsmPilotFixtureSourceReadiness;
  exerciseCount: number;
  acceptanceQa: OsmPilotAcceptanceQaReadiness;
  manualAttemptQa: OsmPilotManualAttemptQaReadiness;
  drawnRouteQa: OsmPilotDrawnRouteQaReadiness;
  renderBoundsSanity: OsmPilotRenderBoundsSanity;
  fastestLegalRouteAvailability: OsmPilotFastestLegalRouteAvailability;
  illegalMovementDetectionCoverage: OsmPilotIllegalMovementDetectionCoverage;
  passFailSummary: OsmPilotReadinessPassFailSummary;
  failureReasonCodes: OsmPilotReadinessFailureReason[];
  failureMessages: string[];
  overallReadinessStatus: OsmPilotReadinessOverallStatus;
  isReady: boolean;
};

export type BuildOsmPilotReadinessReportInput = {
  mapOption: RouteRunnerMapOption;
  exercises?: readonly RouteExercise[];
  graph?: MapGraph;
  renderBounds?: RouteRunnerMapBounds;
  expectedFixtureName?: string;
  fixturePath?: string;
};

const REAL_LONDON_PILOT_FIXTURE_NAME = "realLondonPilotOverpass.json";
const REAL_LONDON_PILOT_FIXTURE_PATH = "lib/map-engine/osm/fixtures/realLondonPilotOverpass.json";

const MANUAL_READINESS_FAILURE_REASON_ORDER: OsmPilotManualAttemptReadinessFailureReason[] = [
  "fastest-route-unavailable",
  "manual-attempt-unknown-edge",
  "manual-attempt-outside-bounds",
  "manual-attempt-blocked-directed-edge",
  "manual-attempt-missing-start",
  "manual-attempt-checkpoint-order",
  "manual-attempt-skipped-checkpoint",
  "manual-attempt-incomplete"
];

const ILLEGAL_MOVEMENT_COVERAGE_REASON_ORDER: OsmPilotIllegalMovementCoverageReason[] = [
  "no-one-way-road",
  "no-exercise",
  "manual-blocked-edge-not-detected",
  "drawn-blocked-edge-not-detected"
];

export function buildRealLondonPilotReadinessReport(): OsmPilotReadinessReport {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  if (!option) {
    throw new Error(`Missing route-runner map option for ${realLondonOsmPilotRouteMap.id}.`);
  }

  return buildOsmPilotReadinessReport({
    mapOption: option,
    exercises: realLondonOsmPilotRouteExercises,
    expectedFixtureName: REAL_LONDON_PILOT_FIXTURE_NAME,
    fixturePath: REAL_LONDON_PILOT_FIXTURE_PATH
  });
}

export function buildOsmPilotReadinessReport(input: BuildOsmPilotReadinessReportInput): OsmPilotReadinessReport {
  const map = input.mapOption.map;
  const exercises = [...(input.exercises ?? input.mapOption.exercises)];
  const graph = input.graph ?? buildMapGraph(map);
  const renderBounds = input.renderBounds ?? getRouteRunnerMapFitBounds(map);
  const qaSuite = validateOsmRouteExerciseQaSuite({
    map,
    exercises,
    graph,
    renderBounds
  });
  const acceptanceSuite = buildOsmRouteExerciseQaAcceptanceSuiteReport({
    map,
    exercises,
    graph,
    renderBounds
  });
  const fixtureSource = buildFixtureSourceReadiness(input);
  const exerciseCount = buildExerciseCountReadiness(exercises.length, map.id);
  const acceptanceQa = buildAcceptanceQaReadiness(acceptanceSuite);
  const manualAttemptQa = buildManualAttemptQaReadiness({
    map,
    exercises,
    graph,
    renderBounds,
    qaResults: qaSuite.results
  });
  const drawnRouteQa = buildDrawnRouteQaReadiness({
    map,
    exercises,
    graph
  });
  const renderBoundsSanity = buildRenderBoundsSanity({
    renderBounds,
    qaResults: qaSuite.results
  });
  const fastestLegalRouteAvailability = buildFastestLegalRouteAvailability(acceptanceQa.reports);
  const illegalMovementDetectionCoverage = buildIllegalMovementDetectionCoverage({
    map,
    exercises,
    graph
  });
  const passFailSummary = buildPassFailSummary([
    sectionSummary(fixtureSource.id, fixtureSource.status, fixtureSource.failureReasonCodes),
    sectionSummary(exerciseCount.id, exerciseCount.status, exerciseCount.failureReasonCodes),
    sectionSummary(acceptanceQa.id, acceptanceQa.status, acceptanceQa.failureReasonCodes),
    sectionSummary(manualAttemptQa.id, manualAttemptQa.status, manualAttemptQa.failureReasonCodes),
    sectionSummary(drawnRouteQa.id, drawnRouteQa.status, drawnRouteQa.failureReasonCodes),
    sectionSummary(renderBoundsSanity.id, renderBoundsSanity.status, renderBoundsSanity.failureReasonCodes),
    sectionSummary(
      fastestLegalRouteAvailability.id,
      fastestLegalRouteAvailability.status,
      fastestLegalRouteAvailability.failureReasonCodes
    ),
    sectionSummary(
      illegalMovementDetectionCoverage.id,
      illegalMovementDetectionCoverage.status,
      illegalMovementDetectionCoverage.failureReasonCodes
    )
  ]);
  const failureReasonCodes = buildReadinessFailureReasonCodes({
    fixtureSource,
    exerciseCount,
    acceptanceQa,
    manualAttemptQa,
    drawnRouteQa,
    renderBoundsSanity,
    fastestLegalRouteAvailability,
    illegalMovementDetectionCoverage
  });
  const failureMessages = [
    ...fixtureSource.failureMessages,
    ...exerciseCount.failureMessages,
    ...acceptanceQa.failureMessages,
    ...manualAttemptQa.failureMessages,
    ...drawnRouteQa.failureMessages,
    ...renderBoundsSanity.failureMessages,
    ...fastestLegalRouteAvailability.failureMessages,
    ...illegalMovementDetectionCoverage.failureMessages
  ];
  const isReady = passFailSummary.status === "pass" && failureReasonCodes.length === 0;

  return {
    mapId: map.id,
    fixtureSource,
    exerciseCount: exercises.length,
    acceptanceQa,
    manualAttemptQa,
    drawnRouteQa,
    renderBoundsSanity,
    fastestLegalRouteAvailability,
    illegalMovementDetectionCoverage,
    passFailSummary,
    failureReasonCodes,
    failureMessages,
    overallReadinessStatus: isReady ? "ready" : "not-ready",
    isReady
  };
}

export function stableOsmPilotReadinessReportSummary(report: OsmPilotReadinessReport): object {
  return {
    mapId: report.mapId,
    fixtureSource: {
      status: report.fixtureSource.status,
      source: report.fixtureSource.source,
      fixtureName: report.fixtureSource.fixtureName,
      path: report.fixtureSource.path,
      generator: report.fixtureSource.generator,
      osmBaseTimestamp: report.fixtureSource.osmBaseTimestamp,
      failureReasonCodes: report.fixtureSource.failureReasonCodes
    },
    exerciseCount: report.exerciseCount,
    acceptanceQa: {
      status: report.acceptanceQa.status,
      exerciseCount: report.acceptanceQa.exerciseCount,
      passedExerciseCount: report.acceptanceQa.passedExerciseCount,
      failedExerciseCount: report.acceptanceQa.failedExerciseCount,
      failureReasonCodes: report.acceptanceQa.failureReasonCodes
    },
    manualAttemptQa: {
      status: report.manualAttemptQa.status,
      exerciseCount: report.manualAttemptQa.exerciseCount,
      acceptedAttemptCount: report.manualAttemptQa.acceptedAttemptCount,
      rejectedAttemptCount: report.manualAttemptQa.rejectedAttemptCount,
      failureReasonCodes: report.manualAttemptQa.failureReasonCodes
    },
    drawnRouteQa: {
      status: report.drawnRouteQa.status,
      exerciseCount: report.drawnRouteQa.exerciseCount,
      passedDrawnRouteCount: report.drawnRouteQa.passedDrawnRouteCount,
      failedDrawnRouteCount: report.drawnRouteQa.failedDrawnRouteCount,
      failureReasonCodes: report.drawnRouteQa.failureReasonCodes
    },
    renderBoundsSanity: {
      status: report.renderBoundsSanity.status,
      checkedExerciseCount: report.renderBoundsSanity.checkedExerciseCount,
      checkedRouteEdgeCount: report.renderBoundsSanity.checkedRouteEdgeCount,
      failureReasonCodes: report.renderBoundsSanity.failureReasonCodes
    },
    fastestLegalRouteAvailability: {
      status: report.fastestLegalRouteAvailability.status,
      exerciseCount: report.fastestLegalRouteAvailability.exerciseCount,
      availableExerciseCount: report.fastestLegalRouteAvailability.availableExerciseCount,
      missingExerciseIds: report.fastestLegalRouteAvailability.missingExerciseIds,
      totalFastestRouteEdgeCount: report.fastestLegalRouteAvailability.totalFastestRouteEdgeCount,
      failureReasonCodes: report.fastestLegalRouteAvailability.failureReasonCodes
    },
    illegalMovementDetectionCoverage: {
      status: report.illegalMovementDetectionCoverage.status,
      checkedRoadId: report.illegalMovementDetectionCoverage.checkedRoadId,
      failureReasonCodes: report.illegalMovementDetectionCoverage.failureReasonCodes,
      checks: report.illegalMovementDetectionCoverage.checks.map((check) => ({
        id: check.id,
        status: check.status,
        exerciseId: check.exerciseId,
        roadId: check.roadId,
        reasonCodes: check.reasonCodes,
        illegalMovementTypes: check.illegalMovementTypes,
        illegalHighlightKinds: check.illegalHighlightKinds
      }))
    },
    passFailSummary: report.passFailSummary,
    failureReasonCodes: report.failureReasonCodes,
    overallReadinessStatus: report.overallReadinessStatus
  };
}

function buildFixtureSourceReadiness(input: BuildOsmPilotReadinessReportInput): OsmPilotFixtureSourceReadiness {
  const fixtureName = input.mapOption.fixtureName ?? null;
  const path = input.fixturePath ?? (fixtureName ? `lib/map-engine/osm/fixtures/${fixtureName}` : null);
  const failureReasonCodes: Array<"missing" | "unexpected-fixture"> = [];
  const failureMessages: string[] = [];

  if (!fixtureName) {
    failureReasonCodes.push("missing");
    failureMessages.push(`fixture-source:missing | map=${input.mapOption.map.id} | no committed fixture is registered.`);
  }

  if (input.expectedFixtureName && fixtureName !== input.expectedFixtureName) {
    failureReasonCodes.push("unexpected-fixture");
    failureMessages.push(
      [
        "fixture-source:unexpected-fixture",
        `map=${input.mapOption.map.id}`,
        `expected=${input.expectedFixtureName}`,
        `actual=${fixtureName ?? "none"}`
      ].join(" | ")
    );
  }

  return {
    id: "fixture-source",
    status: failureReasonCodes.length === 0 ? "pass" : "fail",
    source: fixtureName ? "committed-local-overpass-fixture" : "unknown",
    fixtureName,
    path,
    generator: fixtureMetadataString(input.mapOption.sourceOverpassFixture, "generator"),
    osmBaseTimestamp: fixtureOsmBaseTimestamp(input.mapOption.sourceOverpassFixture),
    failureReasonCodes,
    failureMessages
  };
}

function buildExerciseCountReadiness(count: number, mapId: string): OsmPilotExerciseCountReadiness {
  const failureReasonCodes: Array<"empty"> = count > 0 ? [] : ["empty"];

  return {
    id: "exercise-count",
    status: count > 0 ? "pass" : "fail",
    count,
    failureReasonCodes,
    failureMessages:
      count > 0 ? [] : [`exercise-count:empty | map=${mapId} | no route exercises are registered for readiness QA.`]
  };
}

function buildAcceptanceQaReadiness(
  suite: ReturnType<typeof buildOsmRouteExerciseQaAcceptanceSuiteReport>
): OsmPilotAcceptanceQaReadiness {
  const passedExerciseCount = suite.reports.filter((report) => report.isValid).length;

  return {
    id: "acceptance-qa",
    status: suite.isValid ? "pass" : "fail",
    exerciseCount: suite.exerciseCount,
    passedExerciseCount,
    failedExerciseCount: suite.exerciseCount - passedExerciseCount,
    failureReasonCodes: suite.failureReasonCodes,
    failureMessages: suite.failureMessages,
    reports: suite.reports
  };
}

function buildManualAttemptQaReadiness(input: {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  graph: MapGraph;
  renderBounds: RouteRunnerMapBounds;
  qaResults: readonly OsmExerciseQaResult[];
}): OsmPilotManualAttemptQaReadiness {
  const reports = input.exercises.map((exercise) => {
    const qaResult = input.qaResults.find((result) => result.exerciseId === exercise.id);

    if (!qaResult?.isValid || qaResult.routeEdgeIds.length === 0) {
      return missingFastestRouteManualAttemptReport(input.map.id, exercise.id);
    }

    return manualAttemptReportSummary(
      validateOsmManualAttemptQa({
        map: input.map,
        exercises: input.exercises,
        exerciseId: exercise.id,
        attempt: {
          edgeIds: qaResult.routeEdgeIds
        },
        graph: input.graph,
        renderBounds: input.renderBounds
      })
    );
  });
  const failureReasonCodes = orderedManualReadinessFailureReasonCodes(
    new Set(
      reports
        .filter((report) => !report.isAccepted)
        .flatMap((report) =>
          report.reasonCodes.filter(
            (reason): reason is OsmPilotManualAttemptReadinessFailureReason => reason !== "manual-attempt-valid"
          )
        )
    )
  );
  const failureMessages = reports.filter((report) => !report.isAccepted).flatMap((report) => report.messages);
  const acceptedAttemptCount = reports.filter((report) => report.isAccepted).length;

  return {
    id: "manual-attempt-qa",
    status: failureReasonCodes.length === 0 ? "pass" : "fail",
    exerciseCount: input.exercises.length,
    acceptedAttemptCount,
    rejectedAttemptCount: reports.length - acceptedAttemptCount,
    failureReasonCodes,
    failureMessages,
    reports
  };
}

function buildDrawnRouteQaReadiness(input: {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  graph: MapGraph;
}): OsmPilotDrawnRouteQaReadiness {
  const suite = buildOsmDrawnRouteQaSuiteReport({
    map: input.map,
    exercises: input.exercises,
    graph: input.graph
  });
  const passedDrawnRouteCount = suite.reports.filter((report) => report.isValid).length;

  return {
    id: "drawn-route-qa",
    status: suite.isValid ? "pass" : "fail",
    exerciseCount: suite.exerciseCount,
    passedDrawnRouteCount,
    failedDrawnRouteCount: suite.exerciseCount - passedDrawnRouteCount,
    failureReasonCodes: suite.failureReasonCodes,
    failureMessages: suite.failureMessages,
    reports: suite.reports.map(drawnRouteReportSummary)
  };
}

function buildRenderBoundsSanity(input: {
  renderBounds: RouteRunnerMapBounds;
  qaResults: readonly OsmExerciseQaResult[];
}): OsmPilotRenderBoundsSanity {
  const failureMessages = input.qaResults.flatMap((result) =>
    result.failures
      .filter((failure) => failure.reason === "outside-render-bounds")
      .map((failure) => failure.message)
  );
  const checkedRouteEdgeCount = input.qaResults.reduce((total, result) => total + result.routeEdgeIds.length, 0);

  return {
    id: "render-bounds-sanity",
    status: failureMessages.length === 0 ? "pass" : "fail",
    bounds: input.renderBounds,
    checkedExerciseCount: input.qaResults.length,
    checkedRouteEdgeCount,
    failureReasonCodes: failureMessages.length === 0 ? [] : ["outside-render-bounds"],
    failureMessages
  };
}

function buildFastestLegalRouteAvailability(
  reports: readonly OsmExerciseQaAcceptanceReport[]
): OsmPilotFastestLegalRouteAvailability {
  const routeReports = reports.map((report) => ({
    exerciseId: report.exerciseId,
    hasLegalRoute: report.hasLegalRoute,
    fastestRouteEdgeCount: report.fastestRouteEdgeCount,
    fastestRouteDistanceMeters: report.fastestRouteDistanceMeters
  }));
  const missingExerciseIds = routeReports
    .filter((report) => !report.hasLegalRoute)
    .map((report) => report.exerciseId);

  return {
    id: "fastest-legal-route-availability",
    status: missingExerciseIds.length === 0 ? "pass" : "fail",
    exerciseCount: reports.length,
    availableExerciseCount: routeReports.length - missingExerciseIds.length,
    missingExerciseIds,
    totalFastestRouteEdgeCount: routeReports.reduce((total, report) => total + report.fastestRouteEdgeCount, 0),
    reports: routeReports,
    failureReasonCodes: missingExerciseIds.length === 0 ? [] : ["missing"],
    failureMessages: missingExerciseIds.map(
      (exerciseId) =>
        `fastest-route:missing | map=${reports[0]?.mapId ?? "unknown"} | exercise=${exerciseId} | no QA-approved legal fastest route is available.`
    )
  };
}

function buildIllegalMovementDetectionCoverage(input: {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  graph: MapGraph;
}): OsmPilotIllegalMovementDetectionCoverage {
  const road = findIllegalCoverageOneWayRoad(input.map, input.graph);
  const exercise = input.exercises[0] ?? null;

  if (!road || !exercise) {
    const reasonCodes = orderedIllegalMovementCoverageReasonCodes(
      new Set<OsmPilotIllegalMovementCoverageReason>([
        road ? null : "no-one-way-road",
        exercise ? null : "no-exercise"
      ].filter((reason): reason is OsmPilotIllegalMovementCoverageReason => Boolean(reason)))
    );
    const failureMessages = reasonCodes.map((reason) =>
      formatIllegalMovementCoverageFailure(reason, input.map.id, exercise?.id ?? null, road?.id ?? null)
    );

    return {
      id: "illegal-movement-detection-coverage",
      status: "fail",
      checkedRoadId: road?.id ?? null,
      failureReasonCodes: reasonCodes,
      failureMessages,
      checks: [
        {
          id: "manual-blocked-directed-edge",
          status: "fail",
          exerciseId: exercise?.id ?? null,
          roadId: road?.id ?? null,
          reasonCodes,
          illegalMovementTypes: [],
          illegalHighlightKinds: [],
          messages: failureMessages
        },
        {
          id: "drawn-reversed-one-way",
          status: "fail",
          exerciseId: exercise?.id ?? null,
          roadId: road?.id ?? null,
          reasonCodes,
          illegalMovementTypes: [],
          illegalHighlightKinds: [],
          messages: failureMessages
        }
      ]
    };
  }

  const manualCheck = buildManualIllegalMovementCoverageCheck({
    map: input.map,
    exercises: input.exercises,
    exercise,
    graph: input.graph,
    road
  });
  const drawnCheck = buildDrawnIllegalMovementCoverageCheck({
    map: input.map,
    exercises: input.exercises,
    exercise,
    graph: input.graph,
    road
  });
  const failureReasonCodes = orderedIllegalMovementCoverageReasonCodes(
    new Set([...manualCheck.reasonCodes, ...drawnCheck.reasonCodes])
  );

  return {
    id: "illegal-movement-detection-coverage",
    status: failureReasonCodes.length === 0 ? "pass" : "fail",
    checkedRoadId: road.id,
    failureReasonCodes,
    failureMessages: [...manualCheck.messages, ...drawnCheck.messages],
    checks: [manualCheck, drawnCheck]
  };
}

function buildManualIllegalMovementCoverageCheck(input: {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  exercise: RouteExercise;
  graph: MapGraph;
  road: MapRoad;
}): OsmPilotIllegalMovementCoverageCheck {
  const report = validateOsmManualAttemptQa({
    map: input.map,
    exercises: input.exercises,
    exerciseId: input.exercise.id,
    attempt: {
      nodeIds: [input.road.toNodeId, input.road.fromNodeId],
      roadIds: [input.road.id]
    },
    graph: input.graph
  });
  const detected =
    report.reasonCodes.includes("manual-attempt-blocked-directed-edge") &&
    report.illegalMovementTypes.includes("wrong_way_one_way");
  const reasonCodes: OsmPilotIllegalMovementCoverageReason[] = detected
    ? []
    : ["manual-blocked-edge-not-detected"];

  return {
    id: "manual-blocked-directed-edge",
    status: detected ? "pass" : "fail",
    exerciseId: input.exercise.id,
    roadId: input.road.id,
    reasonCodes,
    illegalMovementTypes: report.illegalMovementTypes,
    illegalHighlightKinds: report.feedbackItemIds,
    messages: reasonCodes.map((reason) =>
      formatIllegalMovementCoverageFailure(reason, input.map.id, input.exercise.id, input.road.id)
    )
  };
}

function buildDrawnIllegalMovementCoverageCheck(input: {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  exercise: RouteExercise;
  graph: MapGraph;
  road: MapRoad;
}): OsmPilotIllegalMovementCoverageCheck {
  const report = buildOsmDrawnRouteQaReport({
    map: input.map,
    exercises: input.exercises,
    exerciseId: input.exercise.id,
    graph: input.graph,
    drawnTrace: buildReverseRoadTrace(input.graph, input.road),
    expectAccepted: false
  });
  const detected =
    report.failureReasonCodes.includes("illegal-directed-edge") &&
    report.illegalMovementTypes.includes("wrong_way_one_way") &&
    report.illegalHighlightKinds.includes("one-way-wrong-direction");
  const reasonCodes: OsmPilotIllegalMovementCoverageReason[] = detected
    ? []
    : ["drawn-blocked-edge-not-detected"];

  return {
    id: "drawn-reversed-one-way",
    status: detected ? "pass" : "fail",
    exerciseId: input.exercise.id,
    roadId: input.road.id,
    reasonCodes,
    illegalMovementTypes: report.illegalMovementTypes,
    illegalHighlightKinds: report.illegalHighlightKinds,
    messages: reasonCodes.map((reason) =>
      formatIllegalMovementCoverageFailure(reason, input.map.id, input.exercise.id, input.road.id)
    )
  };
}

function buildReadinessFailureReasonCodes(input: {
  fixtureSource: OsmPilotFixtureSourceReadiness;
  exerciseCount: OsmPilotExerciseCountReadiness;
  acceptanceQa: OsmPilotAcceptanceQaReadiness;
  manualAttemptQa: OsmPilotManualAttemptQaReadiness;
  drawnRouteQa: OsmPilotDrawnRouteQaReadiness;
  renderBoundsSanity: OsmPilotRenderBoundsSanity;
  fastestLegalRouteAvailability: OsmPilotFastestLegalRouteAvailability;
  illegalMovementDetectionCoverage: OsmPilotIllegalMovementDetectionCoverage;
}): OsmPilotReadinessFailureReason[] {
  return uniqueReadinessFailureReasonCodes([
    ...input.fixtureSource.failureReasonCodes.map((reason) => `fixture-source:${reason}` as const),
    ...input.exerciseCount.failureReasonCodes.map((reason) => `exercise-count:${reason}` as const),
    ...input.acceptanceQa.failureReasonCodes.map((reason) => `acceptance:${reason}` as const),
    ...input.manualAttemptQa.failureReasonCodes.map((reason) => `manual:${reason}` as const),
    ...input.drawnRouteQa.failureReasonCodes.map((reason) => `drawn:${reason}` as const),
    ...input.renderBoundsSanity.failureReasonCodes.map((reason) => `render-bounds:${reason}` as const),
    ...input.fastestLegalRouteAvailability.failureReasonCodes.map((reason) =>
      reason === "missing" ? ("fastest-route:missing" as const) : null
    ),
    ...input.illegalMovementDetectionCoverage.failureReasonCodes.map((reason) => `illegal-movement:${reason}` as const)
  ]);
}

function sectionSummary(
  id: OsmPilotReadinessSectionId,
  status: OsmPilotReadinessStatus,
  failureReasonCodes: readonly string[]
): OsmPilotReadinessSectionSummary {
  return {
    id,
    status,
    failureReasonCodes: [...failureReasonCodes]
  };
}

function buildPassFailSummary(sections: readonly OsmPilotReadinessSectionSummary[]): OsmPilotReadinessPassFailSummary {
  return {
    status: sections.every((section) => section.status === "pass") ? "pass" : "fail",
    passedSections: sections.filter((section) => section.status === "pass").map((section) => section.id),
    failedSections: sections.filter((section) => section.status === "fail").map((section) => section.id),
    sections: [...sections]
  };
}

function missingFastestRouteManualAttemptReport(
  mapId: string,
  exerciseId: string
): OsmPilotManualAttemptQaReadinessReport {
  return {
    exerciseId,
    isAccepted: false,
    reasonCodes: ["fastest-route-unavailable"],
    feedbackStatus: "not-run",
    selectedDirectedEdgeCount: 0,
    selectedDirectedEdgeIds: [],
    scorePassed: null,
    illegalMovementTypes: [],
    messages: [
      [
        "manual:fastest-route-unavailable",
        `map=${mapId}`,
        `exercise=${exerciseId}`,
        "no QA-approved fastest route is available for the manual attempt readiness probe."
      ].join(" | ")
    ]
  };
}

function manualAttemptReportSummary(report: OsmManualAttemptQaReport): OsmPilotManualAttemptQaReadinessReport {
  return {
    exerciseId: report.exerciseId,
    isAccepted: report.isAccepted,
    reasonCodes: report.reasonCodes,
    feedbackStatus: report.feedbackStatus,
    selectedDirectedEdgeCount: report.selectedDirectedEdgeIds.length,
    selectedDirectedEdgeIds: report.selectedDirectedEdgeIds,
    scorePassed: report.scorePassed,
    illegalMovementTypes: report.illegalMovementTypes,
    messages: report.isAccepted ? [] : report.messages
  };
}

function drawnRouteReportSummary(report: OsmDrawnRouteQaReport): OsmPilotDrawnRouteQaReadinessReport {
  return {
    exerciseId: report.exerciseId,
    isValid: report.isValid,
    failureReasonCodes: report.failureReasonCodes,
    drawnPointCount: report.drawnPointCount,
    pipelineStatus: report.pipelineStatus,
    matchingStatus: report.matchingStatus,
    reviewStatus: report.reviewStatus,
    scorePassed: report.scorePassed,
    matchedDirectedEdgeIds: report.matchedDirectedEdgeIds,
    illegalMovementTypes: report.illegalMovementTypes,
    illegalHighlightKinds: report.illegalHighlightKinds,
    warningCodes: report.warningCodes
  };
}

function orderedManualReadinessFailureReasonCodes(
  reasonCodes: ReadonlySet<OsmPilotManualAttemptReadinessFailureReason>
): OsmPilotManualAttemptReadinessFailureReason[] {
  return MANUAL_READINESS_FAILURE_REASON_ORDER.filter((reason) => reasonCodes.has(reason));
}

function orderedIllegalMovementCoverageReasonCodes(
  reasonCodes: ReadonlySet<OsmPilotIllegalMovementCoverageReason>
): OsmPilotIllegalMovementCoverageReason[] {
  return ILLEGAL_MOVEMENT_COVERAGE_REASON_ORDER.filter((reason) => reasonCodes.has(reason));
}

function uniqueReadinessFailureReasonCodes(
  reasonCodes: readonly (OsmPilotReadinessFailureReason | null)[]
): OsmPilotReadinessFailureReason[] {
  const uniqueCodes: OsmPilotReadinessFailureReason[] = [];

  for (const reasonCode of reasonCodes) {
    if (reasonCode && !uniqueCodes.includes(reasonCode)) {
      uniqueCodes.push(reasonCode);
    }
  }

  return uniqueCodes;
}

function findIllegalCoverageOneWayRoad(map: MapDefinition, graph: MapGraph): MapRoad | null {
  return (
    [...map.roads]
      .filter((road) => road.isOneWay && graph.nodesById[road.fromNodeId] && graph.nodesById[road.toNodeId])
      .sort((left, right) => right.distanceMeters - left.distanceMeters || left.id.localeCompare(right.id))[0] ?? null
  );
}

function buildReverseRoadTrace(graph: MapGraph, road: MapRoad) {
  const fromNode = graph.nodesById[road.fromNodeId];
  const toNode = graph.nodesById[road.toNodeId];
  const points: Vec2[] =
    fromNode && toNode
      ? [0.88, 0.5, 0.12].map((ratio) => ({
          x: fromNode.x + (toNode.x - fromNode.x) * ratio,
          y: fromNode.y + (toNode.y - fromNode.y) * ratio
        }))
      : [];

  return createDrawnRouteTrace(points);
}

function formatIllegalMovementCoverageFailure(
  reason: OsmPilotIllegalMovementCoverageReason,
  mapId: string,
  exerciseId: string | null,
  roadId: string | null
): string {
  return [
    `illegal-movement:${reason}`,
    `map=${mapId}`,
    exerciseId ? `exercise=${exerciseId}` : null,
    roadId ? `road=${roadId}` : null
  ]
    .filter((part): part is string => Boolean(part))
    .join(" | ");
}

function fixtureMetadataString(fixture: unknown, key: "generator"): string | null {
  if (!fixture || typeof fixture !== "object" || !(key in fixture)) {
    return null;
  }

  const value = (fixture as Record<string, unknown>)[key];

  return typeof value === "string" ? value : null;
}

function fixtureOsmBaseTimestamp(fixture: unknown): string | null {
  if (!fixture || typeof fixture !== "object" || !("osm3s" in fixture)) {
    return null;
  }

  const osm3s = (fixture as { osm3s?: unknown }).osm3s;

  if (!osm3s || typeof osm3s !== "object" || !("timestamp_osm_base" in osm3s)) {
    return null;
  }

  const value = (osm3s as { timestamp_osm_base?: unknown }).timestamp_osm_base;

  return typeof value === "string" ? value : null;
}
