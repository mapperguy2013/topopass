import type { LearnerTrainingRouteOverlay } from "./learnerTrainingModeUi";

export type RouteRunnerOverlayMode = "normal" | "training";

export type RouteRunnerOverlayOwnership = {
  activeOverlayMode: RouteRunnerOverlayMode;
  renderNormalCorrectRoute: boolean;
  renderNormalAttemptRoute: boolean;
  renderNormalReviewIssues: boolean;
  renderSnapPreview: boolean;
  renderNormalRouteEndpoints: boolean;
  renderNormalRouteEndpointLabels: boolean;
  renderTrainingRouteEndpoints: boolean;
  renderPipelineMatchDiagnostics: boolean;
};

type OverlayVisibility = Pick<LearnerTrainingRouteOverlay, "visible"> | null | undefined;

export function learnerTrainingOverlayOwnsRouteEndpoints(trainingOverlay: OverlayVisibility): boolean {
  return trainingOverlay?.visible === true;
}

export function buildRouteRunnerOverlayOwnership(input: {
  trainingOverlay?: OverlayVisibility;
  trainingReviewVisible?: boolean;
  learnerFacing?: boolean;
  submittedReview?: boolean;
}): RouteRunnerOverlayOwnership {
  const trainingOwnsRouteEndpoints = learnerTrainingOverlayOwnsRouteEndpoints(input.trainingOverlay);
  const trainingOwnsAttemptReview = trainingOwnsRouteEndpoints && input.trainingReviewVisible === true;

  return {
    activeOverlayMode: trainingOwnsRouteEndpoints ? "training" : "normal",
    renderNormalCorrectRoute: !trainingOwnsRouteEndpoints,
    renderNormalAttemptRoute: !trainingOwnsAttemptReview,
    renderNormalReviewIssues: !trainingOwnsAttemptReview,
    renderSnapPreview: !trainingOwnsAttemptReview && input.learnerFacing !== true,
    renderNormalRouteEndpoints: !trainingOwnsRouteEndpoints,
    renderNormalRouteEndpointLabels: !trainingOwnsRouteEndpoints,
    renderTrainingRouteEndpoints: trainingOwnsRouteEndpoints,
    renderPipelineMatchDiagnostics: !trainingOwnsRouteEndpoints && input.learnerFacing !== true
  };
}
