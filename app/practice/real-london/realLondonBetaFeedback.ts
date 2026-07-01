import type { RealLondonBetaAccessEnv } from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";
import {
  REAL_LONDON_BETA_ENV_FLAG,
  isRealLondonBetaAccessEnabled
} from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";
import type { RealLondonBetaPracticeScreenModel } from "./realLondonBetaPracticeScreen.ts";

export const REAL_LONDON_BETA_FEEDBACK_STAGE = 134;
export const REAL_LONDON_BETA_FEEDBACK_SOURCE_STAGE = 133;
export const REAL_LONDON_BETA_FEEDBACK_API_PATH = "/api/beta-feedback";

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
  sourceStage: typeof REAL_LONDON_BETA_FEEDBACK_SOURCE_STAGE;
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
          | "invalid-timestamp"
          | "invalid-metadata";
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
      submissionMode: "api";
      message: string;
      submissionId: string;
      payload: RealLondonBetaFeedbackPayload;
    }
  | {
      status: "rejected";
      submissionMode: "client-validation" | "api";
      message: string;
      reasonCodes: string[];
    }
  | {
      status: "unavailable";
      submissionMode: "api";
      message: string;
      reasonCode: string;
    }
  | {
      status: "failed";
      submissionMode: "api" | "network";
      message: string;
      reasonCode: string;
    };

export type RealLondonBetaFeedbackFetch = (
  input: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

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
    sourceStage: REAL_LONDON_BETA_FEEDBACK_SOURCE_STAGE,
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

  if (!isValidFeedbackMetadata(input.metadata)) {
    errors.push({
      code: "invalid-metadata",
      message: "Feedback metadata is missing required beta context."
    });
  } else if (!Number.isFinite(Date.parse(input.metadata.timestamp))) {
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

export function validateRealLondonBetaFeedbackSubmissionPayload(
  value: unknown
): RealLondonBetaFeedbackValidationResult {
  if (!isFeedbackPayloadShape(value)) {
    return {
      isValid: false,
      payload: null,
      errors: [
        {
          code: "invalid-metadata",
          message: "Feedback payload must include metadata, rating, issue type, and comments."
        }
      ]
    };
  }

  return validateRealLondonBetaFeedbackPayload({
    metadata: value.metadata,
    draft: {
      rating: value.rating,
      issueType: value.issueType,
      comments: value.comments
    }
  });
}

export async function submitRealLondonBetaFeedbackToApi(input: {
  metadata: RealLondonBetaFeedbackMetadata;
  draft: RealLondonBetaFeedbackDraft;
  fetcher?: RealLondonBetaFeedbackFetch;
}): Promise<RealLondonBetaFeedbackSubmissionResult> {
  const validation = validateRealLondonBetaFeedbackPayload(input);

  if (!validation.isValid) {
    return {
      status: "rejected",
      submissionMode: "client-validation",
      message: "Beta feedback was not submitted because required fields are missing or invalid.",
      reasonCodes: validation.errors.map((error) => error.code)
    };
  }

  const fetcher: RealLondonBetaFeedbackFetch =
    input.fetcher ??
    ((url, init) =>
      fetch(url, {
        method: init.method,
        headers: init.headers,
        body: init.body
      }));

  try {
    const response = await fetcher(REAL_LONDON_BETA_FEEDBACK_API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(validation.payload)
    });
    const body = await response.json();

    return normaliseBetaFeedbackApiResponse(body, response.status);
  } catch {
    return {
      status: "failed",
      submissionMode: "network",
      message: "Feedback could not be saved because the feedback service could not be reached.",
      reasonCode: "feedback-network-error"
    };
  }
}

function isRealLondonBetaFeedbackIssueType(value: string): value is RealLondonBetaFeedbackIssueType {
  return REAL_LONDON_BETA_FEEDBACK_ISSUE_TYPES.includes(value as RealLondonBetaFeedbackIssueType);
}

export function buildStableBetaFeedbackSubmissionId(payload: RealLondonBetaFeedbackPayload): string {
  return [
    "beta-feedback",
    `stage-${payload.metadata.stage}`,
    payload.metadata.mapId,
    payload.metadata.exerciseId,
    payload.metadata.timestamp
  ]
    .join(":")
    .replace(/[^a-zA-Z0-9:._-]+/g, "-");
}

function isValidFeedbackMetadata(metadata: RealLondonBetaFeedbackMetadata): boolean {
  return (
    metadata.stage === REAL_LONDON_BETA_FEEDBACK_STAGE &&
    metadata.sourceStage === REAL_LONDON_BETA_FEEDBACK_SOURCE_STAGE &&
    metadata.betaFlagName === REAL_LONDON_BETA_ENV_FLAG &&
    (metadata.betaAccessState === "enabled" || metadata.betaAccessState === "disabled") &&
    hasNonEmptyString(metadata.mapId) &&
    hasNonEmptyString(metadata.mapVersion) &&
    hasNonEmptyString(metadata.exerciseId) &&
    hasNonEmptyString(metadata.exerciseVersion) &&
    hasNonEmptyString(metadata.exerciseTitle) &&
    hasNonEmptyString(metadata.timestamp)
  );
}

function isFeedbackPayloadShape(value: unknown): value is RealLondonBetaFeedbackPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RealLondonBetaFeedbackPayload>;

  return (
    !!candidate.metadata &&
    typeof candidate.metadata === "object" &&
    typeof candidate.rating === "number" &&
    typeof candidate.issueType === "string" &&
    typeof candidate.comments === "string"
  );
}

function hasNonEmptyString(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function normaliseBetaFeedbackApiResponse(
  body: unknown,
  responseStatus: number
): RealLondonBetaFeedbackSubmissionResult {
  if (!body || typeof body !== "object") {
    return {
      status: "failed",
      submissionMode: "api",
      message: "Feedback could not be saved because the feedback service returned an invalid response.",
      reasonCode: "feedback-api-invalid-response"
    };
  }

  const result = body as {
    status?: string;
    message?: string;
    submissionId?: string;
    reasonCode?: string;
    reasonCodes?: string[];
  };

  if (responseStatus >= 200 && responseStatus < 300 && result.status === "success" && result.submissionId) {
    return {
      status: "success",
      submissionMode: "api",
      message: result.message ?? "Thanks. Your beta feedback was saved.",
      submissionId: result.submissionId,
      payload: (body as { payload?: RealLondonBetaFeedbackPayload }).payload as RealLondonBetaFeedbackPayload
    };
  }

  if (responseStatus === 400 || result.status === "rejected") {
    return {
      status: "rejected",
      submissionMode: "api",
      message: result.message ?? "Feedback was not saved because the submission is invalid.",
      reasonCodes: result.reasonCodes ?? [result.reasonCode ?? "feedback-invalid"]
    };
  }

  if (responseStatus === 403 || responseStatus === 503 || result.status === "unavailable") {
    return {
      status: "unavailable",
      submissionMode: "api",
      message: result.message ?? "Feedback storage is unavailable.",
      reasonCode: result.reasonCode ?? "feedback-storage-unavailable"
    };
  }

  return {
    status: "failed",
    submissionMode: "api",
    message: result.message ?? "Feedback could not be saved.",
    reasonCode: result.reasonCode ?? "feedback-api-error"
  };
}
