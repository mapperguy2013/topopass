import type { RealLondonBetaAccessEnv } from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";

export const DEFAULT_BETA_FEEDBACK_REQUEST_BODY_MAX_BYTES = 16 * 1024;
export const DEFAULT_BETA_FEEDBACK_COMMENTS_MAX_LENGTH = 2000;
export const DEFAULT_BETA_FEEDBACK_RATE_LIMIT_WINDOW_MS = 60_000;
export const DEFAULT_BETA_FEEDBACK_RATE_LIMIT_MAX = 5;

export type BetaFeedbackSafetyEnv = RealLondonBetaAccessEnv & {
  NODE_ENV?: string;
  BETA_FEEDBACK_REQUEST_BODY_MAX_BYTES?: string;
  BETA_FEEDBACK_COMMENTS_MAX_LENGTH?: string;
  BETA_FEEDBACK_RATE_LIMIT_ENABLED?: string;
  BETA_FEEDBACK_RATE_LIMIT_WINDOW_MS?: string;
  BETA_FEEDBACK_RATE_LIMIT_MAX?: string;
};

export type BetaFeedbackRateLimitDecision =
  | {
      allowed: true;
      remaining: number;
    }
  | {
      allowed: false;
      retryAfterMs: number;
    };

export type BetaFeedbackRateLimiter = {
  check(input: {
    key: string;
    nowMs: number;
    windowMs: number;
    maxRequests: number;
  }): BetaFeedbackRateLimitDecision;
};

type RateLimitBucket = {
  windowStartMs: number;
  count: number;
};

export function createInMemoryBetaFeedbackRateLimiter(): BetaFeedbackRateLimiter {
  const buckets = new Map<string, RateLimitBucket>();

  return {
    check(input) {
      const existing = buckets.get(input.key);

      if (!existing || input.nowMs - existing.windowStartMs >= input.windowMs) {
        buckets.set(input.key, {
          windowStartMs: input.nowMs,
          count: 1
        });

        return {
          allowed: true,
          remaining: Math.max(input.maxRequests - 1, 0)
        };
      }

      if (existing.count >= input.maxRequests) {
        return {
          allowed: false,
          retryAfterMs: Math.max(input.windowMs - (input.nowMs - existing.windowStartMs), 0)
        };
      }

      existing.count += 1;

      return {
        allowed: true,
        remaining: Math.max(input.maxRequests - existing.count, 0)
      };
    }
  };
}

export function isBetaFeedbackRateLimitEnabled(env: BetaFeedbackSafetyEnv | undefined): boolean {
  const configured = env?.BETA_FEEDBACK_RATE_LIMIT_ENABLED?.trim().toLowerCase();

  if (configured === "true") {
    return true;
  }

  if (configured === "false") {
    return false;
  }

  return env?.NODE_ENV === "production";
}

export function getBetaFeedbackRequestBodyMaxBytes(env: BetaFeedbackSafetyEnv | undefined): number {
  return parsePositiveInteger(
    env?.BETA_FEEDBACK_REQUEST_BODY_MAX_BYTES,
    DEFAULT_BETA_FEEDBACK_REQUEST_BODY_MAX_BYTES
  );
}

export function getBetaFeedbackCommentsMaxLength(env: BetaFeedbackSafetyEnv | undefined): number {
  return parsePositiveInteger(
    env?.BETA_FEEDBACK_COMMENTS_MAX_LENGTH,
    DEFAULT_BETA_FEEDBACK_COMMENTS_MAX_LENGTH
  );
}

export function getBetaFeedbackRateLimitWindowMs(env: BetaFeedbackSafetyEnv | undefined): number {
  return parsePositiveInteger(
    env?.BETA_FEEDBACK_RATE_LIMIT_WINDOW_MS,
    DEFAULT_BETA_FEEDBACK_RATE_LIMIT_WINDOW_MS
  );
}

export function getBetaFeedbackRateLimitMax(env: BetaFeedbackSafetyEnv | undefined): number {
  return parsePositiveInteger(env?.BETA_FEEDBACK_RATE_LIMIT_MAX, DEFAULT_BETA_FEEDBACK_RATE_LIMIT_MAX);
}

export function getBetaFeedbackRequestIdentity(headers: Headers): string {
  return (
    firstHeaderValue(headers.get("x-forwarded-for")) ??
    firstHeaderValue(headers.get("x-real-ip")) ??
    firstHeaderValue(headers.get("cf-connecting-ip")) ??
    "anonymous"
  );
}

export function hasJsonContentType(headers: Headers): boolean {
  return headers.get("content-type")?.toLowerCase().includes("application/json") === true;
}

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function firstHeaderValue(value: string | null): string | null {
  const first = value?.split(",")[0]?.trim() ?? "";

  return first.length > 0 ? first : null;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
