import type { LearnerTrainingRouteOverlay } from "./learnerTrainingModeUi";

export type RouteRunnerOverlayMode = "normal" | "training";

export type RouteRunnerOverlayOwnership = {
  activeOverlayMode: RouteRunnerOverlayMode;
  renderNormalRouteEndpoints: boolean;
  renderNormalRouteEndpointLabels: boolean;
  renderTrainingRouteEndpoints: boolean;
};

type OverlayVisibility = Pick<LearnerTrainingRouteOverlay, "visible"> | null | undefined;

export function learnerTrainingOverlayOwnsRouteEndpoints(trainingOverlay: OverlayVisibility): boolean {
  return trainingOverlay?.visible === true;
}

export function buildRouteRunnerOverlayOwnership(input: {
  trainingOverlay?: OverlayVisibility;
}): RouteRunnerOverlayOwnership {
  const trainingOwnsRouteEndpoints = learnerTrainingOverlayOwnsRouteEndpoints(input.trainingOverlay);

  return {
    activeOverlayMode: trainingOwnsRouteEndpoints ? "training" : "normal",
    renderNormalRouteEndpoints: !trainingOwnsRouteEndpoints,
    renderNormalRouteEndpointLabels: !trainingOwnsRouteEndpoints,
    renderTrainingRouteEndpoints: trainingOwnsRouteEndpoints
  };
}
