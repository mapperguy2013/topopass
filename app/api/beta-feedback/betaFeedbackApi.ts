import {
  isRealLondonBetaAccessEnabled,
  type RealLondonBetaAccessEnv
} from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";
import {
  createDefaultBetaFeedbackStore,
  type BetaFeedbackStore
} from "../../practice/real-london/betaFeedbackStore.ts";
import {
  validateRealLondonBetaFeedbackSubmissionPayload,
  type RealLondonBetaFeedbackPayload
} from "../../practice/real-london/realLondonBetaFeedback.ts";
import {
  byteLength,
  createInMemoryBetaFeedbackRateLimiter,
  getBetaFeedbackCommentsMaxLength,
  getBetaFeedbackRateLimitMax,
  getBetaFeedbackRateLimitWindowMs,
  getBetaFeedbackRequestBodyMaxBytes,
  getBetaFeedbackRequestIdentity,
  hasJsonContentType,
  isBetaFeedbackRateLimitEnabled,
  type BetaFeedbackRateLimiter,
  type BetaFeedbackSafetyEnv
} from "./betaFeedbackApiSafety.ts";

export type BetaFeedbackApiJson = {
  status: "success" | "rejected" | "unavailable" | "failed";
  message: string;
  submissionId?: string;
  reasonCode?: string;
  reasonCodes?: string[];
  payload?: RealLondonBetaFeedbackPayload;
};

export type BetaFeedbackApiResult = {
  status: number;
  body: BetaFeedbackApiJson;
};

const sharedBetaFeedbackRateLimiter = createInMemoryBetaFeedbackRateLimiter();

export async function handleBetaFeedbackRequest(input: {
  request: Request;
  env?: BetaFeedbackSafetyEnv;
  store?: BetaFeedbackStore;
  rateLimiter?: BetaFeedbackRateLimiter;
  nowMs?: number;
}): Promise<BetaFeedbackApiResult> {
  if (input.request.method !== "POST") {
    return buildBetaFeedbackMethodNotAllowedResponse("POST");
  }

  if (!hasJsonContentType(input.request.headers)) {
    return {
      status: 415,
      body: {
        status: "rejected",
        message: "Feedback request content type must be application/json.",
        reasonCode: "unsupported-content-type"
      }
    };
  }

  let rawBody: string;

  try {
    rawBody = await input.request.text();
  } catch {
    return {
      status: 400,
      body: {
        status: "rejected",
        message: "Feedback request body could not be read.",
        reasonCode: "unreadable-body"
      }
    };
  }

  if (byteLength(rawBody) > getBetaFeedbackRequestBodyMaxBytes(input.env)) {
    return {
      status: 413,
      body: {
        status: "rejected",
        message: "Feedback request body is too large.",
        reasonCode: "request-body-too-large"
      }
    };
  }

  let body: unknown;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return {
      status: 400,
      body: {
        status: "rejected",
        message: "Feedback request body must be valid JSON.",
        reasonCode: "invalid-json"
      }
    };
  }

  return handleBetaFeedbackSubmission({
    body,
    env: input.env,
    store: input.store,
    rateLimitIdentity: getBetaFeedbackRequestIdentity(input.request.headers),
    rateLimiter: input.rateLimiter,
    nowMs: input.nowMs
  });
}

export async function handleBetaFeedbackSubmission(input: {
  body: unknown;
  env?: RealLondonBetaAccessEnv & BetaFeedbackSafetyEnv;
  store?: BetaFeedbackStore;
  rateLimitIdentity?: string;
  rateLimiter?: BetaFeedbackRateLimiter;
  nowMs?: number;
}): Promise<BetaFeedbackApiResult> {
  const betaEnabled = isRealLondonBetaAccessEnabled(input.env);

  if (!betaEnabled) {
    return {
      status: 403,
      body: {
        status: "unavailable",
        message: "Real London public beta feedback is disabled.",
        reasonCode: "real-london-beta-disabled"
      }
    };
  }

  const textLimit = validateBetaFeedbackTextLimits(input.body, input.env);

  if (textLimit) {
    return textLimit;
  }

  const validation = validateRealLondonBetaFeedbackSubmissionPayload(input.body);

  if (!validation.isValid) {
    return {
      status: 400,
      body: {
        status: "rejected",
        message: "Feedback was not saved because the submission is invalid.",
        reasonCodes: validation.errors.map((error) => error.code)
      }
    };
  }

  const rateLimit = checkBetaFeedbackRateLimit({
    env: input.env,
    identity: input.rateLimitIdentity,
    rateLimiter: input.rateLimiter,
    nowMs: input.nowMs
  });

  if (rateLimit) {
    return rateLimit;
  }

  const store = input.store ?? createDefaultBetaFeedbackStore({ env: input.env });
  const storeResult = await store.storeBetaFeedback(validation.payload);

  if (storeResult.status === "stored") {
    return {
      status: 200,
      body: {
        status: "success",
        message: "Thanks. Your beta feedback was saved.",
        submissionId: storeResult.submissionId,
        payload: validation.payload
      }
    };
  }

  if (storeResult.status === "unavailable") {
    return {
      status: 503,
      body: {
        status: "unavailable",
        message: safeUnavailableMessage(storeResult.reasonCode),
        reasonCode: storeResult.reasonCode
      }
    };
  }

  return {
    status: 503,
    body: {
      status: "failed",
      message: "Feedback could not be saved because feedback storage failed.",
      reasonCode: storeResult.reasonCode
    }
  };
}

export function buildBetaFeedbackMethodNotAllowedResponse(allowedMethod: "POST" | "GET"): BetaFeedbackApiResult {
  return {
    status: 405,
    body: {
      status: "rejected",
      message: `Unsupported method. Use ${allowedMethod}.`,
      reasonCode: "unsupported-method"
    }
  };
}

function validateBetaFeedbackTextLimits(
  body: unknown,
  env: BetaFeedbackSafetyEnv | undefined
): BetaFeedbackApiResult | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const comments = (body as { comments?: unknown }).comments;

  if (typeof comments === "string" && comments.length > getBetaFeedbackCommentsMaxLength(env)) {
    return {
      status: 413,
      body: {
        status: "rejected",
        message: "Feedback comments are too long.",
        reasonCode: "feedback-comments-too-long"
      }
    };
  }

  return null;
}

function checkBetaFeedbackRateLimit(input: {
  env: BetaFeedbackSafetyEnv | undefined;
  identity: string | undefined;
  rateLimiter: BetaFeedbackRateLimiter | undefined;
  nowMs: number | undefined;
}): BetaFeedbackApiResult | null {
  if (!isBetaFeedbackRateLimitEnabled(input.env)) {
    return null;
  }

  const limiter = input.rateLimiter ?? sharedBetaFeedbackRateLimiter;
  const decision = limiter.check({
    key: input.identity ?? "anonymous",
    nowMs: input.nowMs ?? Date.now(),
    windowMs: getBetaFeedbackRateLimitWindowMs(input.env),
    maxRequests: getBetaFeedbackRateLimitMax(input.env)
  });

  if (decision.allowed) {
    return null;
  }

  return {
    status: 429,
    body: {
      status: "rejected",
      message: "Too many beta feedback submissions. Please wait before trying again.",
      reasonCode: "beta-feedback-rate-limited"
    }
  };
}

function safeUnavailableMessage(reasonCode: string): string {
  if (reasonCode === "production-store-not-configured") {
    return "Beta feedback storage is not configured for this environment.";
  }

  if (reasonCode === "unsupported-production-feedback-storage") {
    return "Beta feedback storage is configured with an unsupported backend.";
  }

  return "Beta feedback storage is unavailable.";
}
