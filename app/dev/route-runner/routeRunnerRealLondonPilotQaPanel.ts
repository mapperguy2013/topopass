import type {
  OsmPilotReadinessReport,
  OsmPilotReadinessStatus
} from "./routeRunnerOsmRealPilotReadinessReport.ts";

export const REAL_LONDON_PILOT_QA_PANEL_MAP_ID = "osm-real-london-pilot";

export type RealLondonPilotQaPanelSummaryId = "acceptance-qa" | "manual-attempt-qa" | "drawn-route-qa";

export type RealLondonPilotQaPanelStatus = "ready" | "not-ready";

export type RealLondonPilotQaPanelMetricRow = {
  id: string;
  label: string;
  value: string;
};

export type RealLondonPilotQaPanelSummaryRow = {
  id: RealLondonPilotQaPanelSummaryId;
  label: string;
  value: "passing" | "failing";
  detail: string;
  status: OsmPilotReadinessStatus;
};

export type RealLondonPilotQaPanelModel = {
  title: "Real London Pilot QA";
  mapId: string;
  fixtureName: string;
  exerciseCount: number;
  passedExerciseCount: number;
  failedExerciseCount: number;
  exerciseProgressText: string;
  status: RealLondonPilotQaPanelStatus;
  statusLabel: "Ready" | "Not ready";
  statusTone: OsmPilotReadinessStatus;
  exerciseIds: string[];
  metricRows: RealLondonPilotQaPanelMetricRow[];
  summaryRows: RealLondonPilotQaPanelSummaryRow[];
  failureReasons: string[];
  failureReasonText: string;
};

export function shouldShowRealLondonPilotQaPanel(mapId: string): boolean {
  return mapId === REAL_LONDON_PILOT_QA_PANEL_MAP_ID;
}

export function buildRealLondonPilotQaPanelModelForMap(input: {
  mapId: string;
  report: OsmPilotReadinessReport;
}): RealLondonPilotQaPanelModel | null {
  if (!shouldShowRealLondonPilotQaPanel(input.mapId)) {
    return null;
  }

  return buildRealLondonPilotQaPanelModel(input.report);
}

export function buildRealLondonPilotQaPanelModel(report: OsmPilotReadinessReport): RealLondonPilotQaPanelModel {
  const fixtureName = report.fixtureSource.fixtureName ?? "none";
  const passedExerciseCount = report.acceptanceQa.passedExerciseCount;
  const failedExerciseCount = report.acceptanceQa.failedExerciseCount;
  const exerciseIds = report.acceptanceQa.reports.map((exerciseReport) => exerciseReport.exerciseId);
  const statusLabel = report.isReady ? "Ready" : "Not ready";
  const statusTone: OsmPilotReadinessStatus = report.isReady ? "pass" : "fail";
  const failureReasons = formatFailureReasons(report.failureReasonCodes);
  const exerciseProgressText = `${passedExerciseCount}/${report.exerciseCount} passing`;

  return {
    title: "Real London Pilot QA",
    mapId: report.mapId,
    fixtureName,
    exerciseCount: report.exerciseCount,
    passedExerciseCount,
    failedExerciseCount,
    exerciseProgressText,
    status: report.overallReadinessStatus,
    statusLabel,
    statusTone,
    exerciseIds,
    metricRows: [
      { id: "map-id", label: "Map ID", value: report.mapId },
      { id: "fixture-name", label: "Fixture", value: fixtureName },
      { id: "readiness-state", label: "Readiness", value: statusLabel },
      { id: "exercise-count", label: "Exercises", value: String(report.exerciseCount) },
      { id: "passed-exercise-count", label: "Passing", value: String(passedExerciseCount) },
      { id: "failed-exercise-count", label: "Failing", value: String(failedExerciseCount) }
    ],
    summaryRows: [
      {
        id: "acceptance-qa",
        label: "Acceptance QA",
        value: statusValue(report.acceptanceQa.status),
        detail: `${report.acceptanceQa.passedExerciseCount}/${report.acceptanceQa.exerciseCount} exercises passing`,
        status: report.acceptanceQa.status
      },
      {
        id: "manual-attempt-qa",
        label: "Manual Attempt QA",
        value: statusValue(report.manualAttemptQa.status),
        detail: `${report.manualAttemptQa.acceptedAttemptCount}/${report.manualAttemptQa.exerciseCount} attempts accepted`,
        status: report.manualAttemptQa.status
      },
      {
        id: "drawn-route-qa",
        label: "Drawn Route QA",
        value: statusValue(report.drawnRouteQa.status),
        detail: `${report.drawnRouteQa.passedDrawnRouteCount}/${report.drawnRouteQa.exerciseCount} drawn routes passing`,
        status: report.drawnRouteQa.status
      }
    ],
    failureReasons,
    failureReasonText: failureReasons.join(", ")
  };
}

function statusValue(status: OsmPilotReadinessStatus): "passing" | "failing" {
  return status === "pass" ? "passing" : "failing";
}

function formatFailureReasons(reasonCodes: readonly string[]): string[] {
  if (reasonCodes.length === 0) {
    return ["none"];
  }

  return [...new Set(reasonCodes)];
}
