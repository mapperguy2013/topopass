export const REAL_LONDON_PILOT_PLAYTHROUGH_PANEL_MAP_ID = "osm-real-london-pilot";

export type RealLondonPilotPlaythroughAttemptStatus = "empty" | "in-progress" | "accepted" | "rejected";
export type RealLondonPilotPlaythroughRevealRouteStatus = "available" | "visible" | "unavailable";
export type RealLondonPilotPlaythroughIllegalHighlightStatus = "none" | "present";
export type RealLondonPilotPlaythroughTone = "neutral" | "active" | "pass" | "warning" | "fail";

export type RealLondonPilotPlaythroughReviewStatus = "pending" | "pass" | "fail" | "blocked";
export type RealLondonPilotPlaythroughManualStatus = "accepted" | "rejected" | null;

export type RealLondonPilotPlaythroughPanelRow = {
  id: string;
  label: string;
  value: string;
  tone: RealLondonPilotPlaythroughTone;
};

export type RealLondonPilotPlaythroughPanelModel = {
  shouldShowPanel: boolean;
  title: "Real London Pilot Playthrough";
  selectedExerciseId: string;
  startLabel: string;
  destinationLabel: string;
  checkpointLabels: string[];
  checkpointSummary: string;
  revealRouteStatus: RealLondonPilotPlaythroughRevealRouteStatus;
  revealRouteText: string;
  attemptStatus: RealLondonPilotPlaythroughAttemptStatus;
  attemptStatusText: string;
  illegalHighlightStatus: RealLondonPilotPlaythroughIllegalHighlightStatus;
  illegalHighlightText: string;
  nextAction: string;
  warnings: string[];
  rows: RealLondonPilotPlaythroughPanelRow[];
};

export type BuildRealLondonPilotPlaythroughPanelInput = {
  mapId: string;
  selectedExerciseId: string | null;
  startLabel: string | null;
  destinationLabel: string | null;
  checkpointLabels: readonly string[];
  hasLegalRevealRoute: boolean;
  isRevealRouteVisible: boolean;
  isDrawing: boolean;
  drawnPointCount: number;
  drawnReviewStatus: RealLondonPilotPlaythroughReviewStatus;
  manualRunStatus?: RealLondonPilotPlaythroughManualStatus;
  illegalHighlightCount: number;
};

export function shouldShowRealLondonPilotPlaythroughPanel(mapId: string): boolean {
  return mapId === REAL_LONDON_PILOT_PLAYTHROUGH_PANEL_MAP_ID;
}

export function buildRealLondonPilotPlaythroughPanelModel(
  input: BuildRealLondonPilotPlaythroughPanelInput
): RealLondonPilotPlaythroughPanelModel {
  const shouldShowPanel = shouldShowRealLondonPilotPlaythroughPanel(input.mapId);
  const selectedExerciseId = input.selectedExerciseId ?? "none";
  const checkpointLabels = [...input.checkpointLabels];
  const checkpointSummary = checkpointLabels.length > 0 ? checkpointLabels.join(" -> ") : "none";
  const revealRoute = formatRevealRouteStatus(input);
  const attempt = formatAttemptStatus(input);
  const illegalHighlight = formatIllegalHighlightStatus(input.illegalHighlightCount);
  const nextAction = formatNextAction({
    selectedExerciseId: input.selectedExerciseId,
    checkpointCount: checkpointLabels.length,
    revealRouteStatus: revealRoute.status,
    attemptStatus: attempt.status,
    illegalHighlightStatus: illegalHighlight.status
  });
  const warnings = buildWarnings({
    selectedExerciseId: input.selectedExerciseId,
    revealRouteStatus: revealRoute.status,
    attemptStatus: attempt.status,
    illegalHighlightStatus: illegalHighlight.status
  });

  return {
    shouldShowPanel,
    title: "Real London Pilot Playthrough",
    selectedExerciseId,
    startLabel: input.startLabel ?? "not selected",
    destinationLabel: input.destinationLabel ?? "not selected",
    checkpointLabels,
    checkpointSummary,
    revealRouteStatus: revealRoute.status,
    revealRouteText: revealRoute.text,
    attemptStatus: attempt.status,
    attemptStatusText: attempt.text,
    illegalHighlightStatus: illegalHighlight.status,
    illegalHighlightText: illegalHighlight.text,
    nextAction,
    warnings,
    rows: [
      { id: "exercise-id", label: "Exercise ID", value: selectedExerciseId, tone: input.selectedExerciseId ? "neutral" : "warning" },
      { id: "start", label: "Start", value: input.startLabel ?? "not selected", tone: input.startLabel ? "neutral" : "warning" },
      {
        id: "destination",
        label: "Destination",
        value: input.destinationLabel ?? "not selected",
        tone: input.destinationLabel ? "neutral" : "warning"
      },
      { id: "checkpoints", label: "Checkpoints", value: checkpointSummary, tone: "neutral" },
      { id: "reveal-route", label: "Reveal route", value: revealRoute.text, tone: revealRoute.tone },
      { id: "attempt", label: "Current attempt", value: attempt.text, tone: attempt.tone },
      { id: "illegal-highlights", label: "Illegal highlights", value: illegalHighlight.text, tone: illegalHighlight.tone },
      { id: "next-action", label: "Next action", value: nextAction, tone: "active" }
    ]
  };
}

function formatRevealRouteStatus(input: BuildRealLondonPilotPlaythroughPanelInput): {
  status: RealLondonPilotPlaythroughRevealRouteStatus;
  text: string;
  tone: RealLondonPilotPlaythroughTone;
} {
  if (!input.selectedExerciseId || !input.hasLegalRevealRoute) {
    return {
      status: "unavailable",
      text: "Reveal route is unavailable for this exercise.",
      tone: "warning"
    };
  }

  if (input.isRevealRouteVisible) {
    return {
      status: "visible",
      text: "Reveal route is visible for comparison.",
      tone: "active"
    };
  }

  return {
    status: "available",
    text: "Reveal route is available for comparison.",
    tone: "pass"
  };
}

function formatAttemptStatus(input: BuildRealLondonPilotPlaythroughPanelInput): {
  status: RealLondonPilotPlaythroughAttemptStatus;
  text: string;
  tone: RealLondonPilotPlaythroughTone;
} {
  if (input.isDrawing) {
    return {
      status: "in-progress",
      text: "Current attempt is in progress.",
      tone: "active"
    };
  }

  if (input.drawnPointCount > 0) {
    if (input.drawnReviewStatus === "pass") {
      return {
        status: "accepted",
        text: "Current attempt is legal.",
        tone: "pass"
      };
    }

    if (input.drawnReviewStatus === "fail" || input.drawnReviewStatus === "blocked") {
      return {
        status: "rejected",
        text: "Current attempt is rejected.",
        tone: "fail"
      };
    }

    return {
      status: "in-progress",
      text: "Current attempt is in progress.",
      tone: "active"
    };
  }

  if (input.manualRunStatus === "accepted") {
    return {
      status: "accepted",
      text: "Current attempt is legal.",
      tone: "pass"
    };
  }

  if (input.manualRunStatus === "rejected") {
    return {
      status: "rejected",
      text: "Current attempt is rejected.",
      tone: "fail"
    };
  }

  return {
    status: "empty",
    text: "Current attempt has no route yet.",
    tone: "neutral"
  };
}

function formatIllegalHighlightStatus(illegalHighlightCount: number): {
  status: RealLondonPilotPlaythroughIllegalHighlightStatus;
  text: string;
  tone: RealLondonPilotPlaythroughTone;
} {
  if (illegalHighlightCount > 0) {
    return {
      status: "present",
      text: "Current attempt has illegal movements highlighted.",
      tone: "fail"
    };
  }

  return {
    status: "none",
    text: "No illegal movement highlights are present.",
    tone: "pass"
  };
}

function formatNextAction(input: {
  selectedExerciseId: string | null;
  checkpointCount: number;
  revealRouteStatus: RealLondonPilotPlaythroughRevealRouteStatus;
  attemptStatus: RealLondonPilotPlaythroughAttemptStatus;
  illegalHighlightStatus: RealLondonPilotPlaythroughIllegalHighlightStatus;
}): string {
  if (!input.selectedExerciseId) {
    return "Select a real London exercise to begin.";
  }

  if (input.illegalHighlightStatus === "present") {
    return "Review the highlighted illegal movements, then redraw or adjust the route.";
  }

  if (input.attemptStatus === "rejected") {
    return "Use the feedback and redraw or edit the manual route before testing again.";
  }

  if (input.attemptStatus === "accepted") {
    return input.revealRouteStatus === "unavailable"
      ? "Try another real London exercise."
      : "Compare against the reveal route or try another real London exercise.";
  }

  if (input.attemptStatus === "in-progress") {
    return "Finish drawing from the start marker to the destination marker.";
  }

  return input.checkpointCount > 0
    ? "Draw from the start marker, visit checkpoints in order, then finish at the destination marker."
    : "Draw from the start marker to the destination marker.";
}

function buildWarnings(input: {
  selectedExerciseId: string | null;
  revealRouteStatus: RealLondonPilotPlaythroughRevealRouteStatus;
  attemptStatus: RealLondonPilotPlaythroughAttemptStatus;
  illegalHighlightStatus: RealLondonPilotPlaythroughIllegalHighlightStatus;
}): string[] {
  const warnings: string[] = [];

  if (!input.selectedExerciseId) {
    warnings.push("Select a real London exercise to begin.");
  }

  if (input.revealRouteStatus === "unavailable") {
    warnings.push("Reveal route is unavailable for this exercise.");
  }

  if (input.illegalHighlightStatus === "present") {
    warnings.push("Current attempt has illegal movements highlighted.");
  } else if (input.attemptStatus === "rejected") {
    warnings.push("Current attempt is rejected; review feedback before retesting.");
  }

  return warnings;
}
