import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import type { RealLondonBetaFeedbackPayload } from "./realLondonBetaFeedback.ts";
import { buildStableBetaFeedbackSubmissionId } from "./realLondonBetaFeedback.ts";

export const LOCAL_BETA_FEEDBACK_DIR = ".local";
export const LOCAL_BETA_FEEDBACK_FILE = "beta-feedback.jsonl";

export type BetaFeedbackStoreResult =
  | {
      status: "stored";
      storage: "local-jsonl";
      submissionId: string;
      message: string;
    }
  | {
      status: "unavailable";
      storage: "none";
      reasonCode: "feedback-storage-not-configured" | "production-store-not-configured";
      message: string;
    }
  | {
      status: "failed";
      storage: "local-jsonl";
      reasonCode: "feedback-storage-write-failed";
      message: string;
    };

export type BetaFeedbackStore = {
  storeBetaFeedback(payload: RealLondonBetaFeedbackPayload): Promise<BetaFeedbackStoreResult>;
};

export type BetaFeedbackStoreEnv = {
  NODE_ENV?: string;
  BETA_FEEDBACK_LOCAL_STORE?: string;
};

export function createDefaultBetaFeedbackStore(input: {
  env?: BetaFeedbackStoreEnv;
  cwd?: string;
} = {}): BetaFeedbackStore {
  const env = input.env ?? process.env;

  if (env.NODE_ENV === "production") {
    return createUnavailableBetaFeedbackStore({
      reasonCode: "production-store-not-configured",
      message:
        "Beta feedback storage is not configured for this production environment yet. Please try again later."
    });
  }

  const cwd = input.cwd ?? process.cwd();
  const filePath = path.join(cwd, LOCAL_BETA_FEEDBACK_DIR, LOCAL_BETA_FEEDBACK_FILE);

  return createLocalJsonlBetaFeedbackStore({ filePath });
}

export function createLocalJsonlBetaFeedbackStore(input: { filePath: string }): BetaFeedbackStore {
  return {
    async storeBetaFeedback(payload) {
      const submissionId = buildStableBetaFeedbackSubmissionId(payload);
      const record = {
        submissionId,
        storedAt: new Date().toISOString(),
        payload
      };

      try {
        await mkdir(path.dirname(input.filePath), { recursive: true });
        await appendFile(input.filePath, `${JSON.stringify(record)}\n`, "utf8");

        return {
          status: "stored",
          storage: "local-jsonl",
          submissionId,
          message: "Thanks. Your beta feedback was saved."
        };
      } catch {
        return {
          status: "failed",
          storage: "local-jsonl",
          reasonCode: "feedback-storage-write-failed",
          message: "Feedback could not be saved because local feedback storage failed."
        };
      }
    }
  };
}

export function createUnavailableBetaFeedbackStore(input: {
  reasonCode: "feedback-storage-not-configured" | "production-store-not-configured";
  message: string;
}): BetaFeedbackStore {
  return {
    async storeBetaFeedback() {
      return {
        status: "unavailable",
        storage: "none",
        reasonCode: input.reasonCode,
        message: input.message
      };
    }
  };
}
