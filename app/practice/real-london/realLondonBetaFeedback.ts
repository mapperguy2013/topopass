import type { RealLondonBetaAccessEnv } from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";
import {
  REAL_LONDON_BETA_ENV_FLAG,
  isRealLondonBetaAccessEnabled
} from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";
import type { RealLondonBetaPracticeScreenModel } from "./realLondonBetaPracticeScreen.ts";

export const REAL_LONDON_BETA_FEEDBACK_STAGE = 133;

export const REAL_LONDON_BETA_FEEDBACK_ISSUE_TYPES = [
  "route-unclear",
  "map-display-issue",
  "control-touch-issue",
  "exercise-difficulty-issue",
  "wrong-restriction-legality-concern",
  "bug",
  "other"
] as const;

export type RealLondonBetaFeedbackIssueType = (typeof REAL_LONDON_BETA_FEEDBACK_ISSUE_TYPES)[number];
export type RealLondonBetaFeedbackRating = 1 | 2 | 3 | 4 | 5;
export type RealLondonBetaFeedbackAccessState = "enabled" | "disabled";

export type RealLondonBetaFeedbackMetadata = {
  stage: typeof REAL_LONDON_BETA_FEEDBACK_STAGE;
  mapId: string;
  mapVersion: string;
  exerciseId: string;
  exerciseVersion: string;
  exerciseTitle: string;
  timestamp: string;
  betaFlagName: typeof REAL_LONDON_BETA_ENV_FLAG;
  betaAccessState: RealLondonBetaFeedbackAccessState;
};

export type RealLondonBetaFeedbackDraft = {
  rating: number;
  issueType: string;
  comments: string;
};

export type RealLondonBetaFeedbackPayload = {
  metadata: RealLondonBetaFeedbackMetadata;
  rating: RealLondonBetaFeedbackRating;
  issueType: RealLondonBetaFeedbackIssueType;
  comments: string;
};

export type RealLondonBetaFeedbackValidationResult =
  | {
      isValid: true;
      payload: RealLondonBetaFeedbackPayload;
      errors: [];
    }
  | {
      isValid: false;
      payload: null;
      errors: Array<{
        code:
          | "invalid-rating"
          | "invalid-issue-type"
          | "empty-comments"
          | "invalid-timestamp";
        message: string;
      }>;
    };

type RealLondonBetaFeedbackValidationError = Extract<
  RealLondonBetaFeedbackValidationResult,
  { isValid: false }
>["errors"][number];

export type RealLondonBetaFeedbackSubmissionResult =
  | {
      status: "success";
      submissionMode: "local-noop";
      message: string;
      submissionId: string;
      payload: RealLondonBetaFeedbackPayload;
    }
  | {
      status: "rejected";
      submissionMode: "local-noop";
      message: string;
      reasonCodes: string[];
    };

export function buildRealLondonBetaFeedbackMetadata(input: {
  mapId: string;
  mapVersion: string;
  exerciseId: string;
  exerciseVersion: string;
  exerciseTitle: string;
  timestamp?: string;
  betaEnabled?: boolean;
  env?: RealLondonBetaAccessEnv;
}): RealLondonBetaFeedbackMetadata {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const betaEnabled = input.betaEnabled ?? isRealLondonBetaAccessEnabled(input.env);

  return {
    stage: REAL_LONDON_BETA_FEEDBACK_STAGE,
    mapId: input.mapId,
    mapVersion: input.mapVersion,
    exerciseId: input.exerciseId,
    exerciseVersion: input.exerciseVersion,
    exerciseTitle: input.exerciseTitle,
    timestamp,
    betaFlagName: REAL_LONDON_BETA_ENV_FLAG,
    betaAccessState: betaEnabled ? "enabled" : "disabled"
  };
}

export function buildRealLondonBetaFeedbackMetadataFromModel(input: {
  model: RealLondonBetaPracticeScreenModel;
  timestamp?: string;
  betaEnabled?: boolean;
  env?: RealLondonBetaAccessEnv;
}): RealLondonBetaFeedbackMetadata | null {
  if (input.model.state !== "available") {
    return null;
  }

  return buildRealLondonBetaFeedbackMetadata({
    mapId: input.model.mapId,
    mapVersion: input.model.mapVersion,
    exerciseId: input.model.selectedExercise.id,
    exerciseVersion: input.model.selectedExercise.exerciseVersion,
    exerciseTitle: input.model.selectedExercise.title,
    timestamp: input.timestamp,
    betaEnabled: input.betaEnabled,
    env: input.env
  });
}

export function validateRealLondonBetaFeedbackPayload(input: {
  metadata: RealLondonBetaFeedbackMetadata;
  draft: RealLondonBetaFeedbackDraft;
}): RealLondonBetaFeedbackValidationResult {
  const errors: RealLondonBetaFeedbackValidationError[] = [];
  const rating = Number(input.draft.rating);
  const comments = input.draft.comments.trim();

  if (![1, 2, 3, 4, 5].includes(rating)) {
    errors.push({
      code: "invalid-rating",
      message: "Choose a rating from 1 to 5."
    });
  }

  if (!isRealLondonBetaFeedbackIssueType(input.draft.issueType)) {
    errors.push({
      code: "invalid-issue-type",
      message: "Choose a feedback issue type."
    });
  }

  if (comments.length === 0) {
    errors.push({
      code: "empty-comments",
      message: "Add a short comment before submitting beta feedback."
    });
  }

  if (!Number.isFinite(Date.parse(input.metadata.timestamp))) {
    errors.push({
      code: "invalid-timestamp",
      message: "Feedback metadata must include a valid timestamp."
    });
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      payload: null,
      errors
    };
  }

  return {
    isValid: true,
    payload: {
      metadata: input.metadata,
      rating: rating as RealLondonBetaFeedbackRating,
      issueType: input.draft.issueType as RealLondonBetaFeedbackIssueType,
      comments
    },
    errors: []
  };
}

export function submitRealLondonBetaFeedbackLocally(input: {
  metadata: RealLondonBetaFeedbackMetadata;
  draft: RealLondonBetaFeedbackDraft;
}): RealLondonBetaFeedbackSubmissionResult {
  const validation = validateRealLondonBetaFeedbackPayload(input);

  if (!validation.isValid) {
    return {
      status: "rejected",
      submissionMode: "local-noop",
      message: "Beta feedback was not submitted because required fields are missing or invalid.",
      reasonCodes: validation.errors.map((error) => error.code)
    };
  }

  return {
    status: "success",
    submissionMode: "local-noop",
    message: "Thanks. Your beta feedback was captured locally for this session.",
    submissionId: buildStableLocalFeedbackSubmissionId(validation.payload),
    payload: validation.payload
  };
}

function isRealLondonBetaFeedbackIssueType(value: string): value is RealLondonBetaFeedbackIssueType {
  return REAL_LONDON_BETA_FEEDBACK_ISSUE_TYPES.includes(value as RealLondonBetaFeedbackIssueType);
}

function buildStableLocalFeedbackSubmissionId(payload: RealLondonBetaFeedbackPayload): string {
  return [
    "local-feedback",
    `stage-${payload.metadata.stage}`,
    payload.metadata.mapId,
    payload.metadata.exerciseId,
    payload.metadata.timestamp
  ]
    .join(":")
    .replace(/[^a-zA-Z0-9:._-]+/g, "-");
}
