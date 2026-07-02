export type RouteRunnerPracticeMode = "dev" | "student-beta";

export const ROUTE_RUNNER_DEV_ONLY_PANEL_LABELS = [
  "Manual route input",
  "Restriction overlays",
  "Restriction overlay details",
  "Pipeline debug result",
  "Drawn route score result",
  "OSM debug",
  "Converted OSM QA",
  "Real London Pilot QA",
  "raw debug"
] as const;

export const ROUTE_RUNNER_BETA_CORE_PANEL_LABELS = [
  "Real London Practice - Beta",
  "Practice Exercises",
  "Route instructions",
  "Route map workspace",
  "Attempt review",
  "Submit Attempt",
  "Score",
  "Distance",
  "OpenStreetMap contributors"
] as const;

export type RouteRunnerPracticeModePanelVisibility = {
  mode: RouteRunnerPracticeMode;
  showDeveloperPanels: boolean;
  visibleDevOnlyPanelLabels: string[];
  hiddenDevOnlyPanelLabels: string[];
  visibleCorePanelLabels: string[];
};

export function buildRouteRunnerPracticeModePanelVisibility(input: {
  mode: RouteRunnerPracticeMode;
}): RouteRunnerPracticeModePanelVisibility {
  const showDeveloperPanels = input.mode === "dev";

  return {
    mode: input.mode,
    showDeveloperPanels,
    visibleDevOnlyPanelLabels: showDeveloperPanels ? [...ROUTE_RUNNER_DEV_ONLY_PANEL_LABELS] : [],
    hiddenDevOnlyPanelLabels: showDeveloperPanels ? [] : [...ROUTE_RUNNER_DEV_ONLY_PANEL_LABELS],
    visibleCorePanelLabels: [...ROUTE_RUNNER_BETA_CORE_PANEL_LABELS]
  };
}
