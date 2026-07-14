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
  sharedSubmissionReview?: boolean;
}): RouteRunnerOverlayOwnership {
  const trainingOwnsRouteEndpoints = learnerTrainingOverlayOwnsRouteEndpoints(input.trainingOverlay);
  const trainingOwnsAttemptReview = trainingOwnsRouteEndpoints && input.trainingReviewVisible === true;
  const sharedSubmissionReview = input.sharedSubmissionReview === true;

  return {
    activeOverlayMode: trainingOwnsRouteEndpoints ? "training" : "normal",
    renderNormalCorrectRoute: sharedSubmissionReview || !trainingOwnsRouteEndpoints,
    renderNormalAttemptRoute: sharedSubmissionReview || !trainingOwnsAttemptReview,
    renderNormalReviewIssues: sharedSubmissionReview || !trainingOwnsAttemptReview,
    renderSnapPreview: !trainingOwnsAttemptReview && input.learnerFacing !== true,
    renderNormalRouteEndpoints: !trainingOwnsRouteEndpoints,
    renderNormalRouteEndpointLabels: !trainingOwnsRouteEndpoints,
    renderTrainingRouteEndpoints: trainingOwnsRouteEndpoints,
    renderPipelineMatchDiagnostics: !trainingOwnsRouteEndpoints && input.learnerFacing !== true
  };
}
