import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import type { RealLondonBetaFeedbackPayload } from "./realLondonBetaFeedback.ts";
import { buildStableBetaFeedbackSubmissionId } from "./realLondonBetaFeedback.ts";

export const LOCAL_BETA_FEEDBACK_DIR = ".local";
export const LOCAL_BETA_FEEDBACK_FILE = "beta-feedback.jsonl";
export const DEFAULT_BETA_FEEDBACK_TABLE = "beta_feedback";

export type BetaFeedbackStoreResult =
  | {
      status: "stored";
      storage: "local-jsonl" | "supabase-rest";
      submissionId: string;
      message: string;
    }
  | {
      status: "unavailable";
      storage: "none";
      reasonCode:
        | "feedback-storage-not-configured"
        | "production-store-not-configured"
        | "unsupported-production-feedback-storage";
      message: string;
    }
  | {
      status: "failed";
      storage: "local-jsonl" | "supabase-rest";
      reasonCode: "feedback-storage-write-failed" | "feedback-supabase-write-failed";
      message: string;
    };

export type BetaFeedbackStore = {
  storeBetaFeedback(payload: RealLondonBetaFeedbackPayload): Promise<BetaFeedbackStoreResult>;
};

export type BetaFeedbackStoreEnv = {
  NODE_ENV?: string;
  BETA_FEEDBACK_LOCAL_STORE?: string;
  BETA_FEEDBACK_STORAGE?: string;
  BETA_FEEDBACK_TABLE?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

export type BetaFeedbackFetch = (
  input: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

export type SupabaseBetaFeedbackConfig =
  | {
      status: "configured";
      storage: "supabase";
      url: string;
      serviceRoleKey: string;
      table: string;
    }
  | {
      status: "missing";
      storage: "supabase" | "none";
      reasonCode: "production-store-not-configured";
      missingKeys: string[];
    }
  | {
      status: "unsupported";
      storage: string;
      reasonCode: "unsupported-production-feedback-storage";
    };

export function createDefaultBetaFeedbackStore(input: {
  env?: BetaFeedbackStoreEnv;
  cwd?: string;
  fetcher?: BetaFeedbackFetch;
} = {}): BetaFeedbackStore {
  const env = input.env ?? process.env;

  if (env.NODE_ENV === "production") {
    const config = getSupabaseBetaFeedbackConfig(env);

    if (config.status === "configured") {
      return createSupabaseRestBetaFeedbackStore({
        config,
        fetcher: input.fetcher
      });
    }

    return createUnavailableBetaFeedbackStore({
      reasonCode: config.reasonCode,
      message:
        config.status === "unsupported"
          ? "Beta feedback storage is configured with an unsupported production backend."
          : "Beta feedback storage is not configured for this production environment yet. Please try again later."
    });
  }

  const cwd = input.cwd ?? process.cwd();
  const filePath = path.join(cwd, LOCAL_BETA_FEEDBACK_DIR, LOCAL_BETA_FEEDBACK_FILE);

  return createLocalJsonlBetaFeedbackStore({ filePath });
}

export function getSupabaseBetaFeedbackConfig(env: BetaFeedbackStoreEnv): SupabaseBetaFeedbackConfig {
  const storage = env.BETA_FEEDBACK_STORAGE?.trim().toLowerCase() ?? "";

  if (!storage) {
    return {
      status: "missing",
      storage: "none",
      reasonCode: "production-store-not-configured",
      missingKeys: ["BETA_FEEDBACK_STORAGE"]
    };
  }

  if (storage !== "supabase") {
    return {
      status: "unsupported",
      storage,
      reasonCode: "unsupported-production-feedback-storage"
    };
  }

  const url = env.SUPABASE_URL?.trim() ?? "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const table = normalizeSupabaseTableName(env.BETA_FEEDBACK_TABLE) ?? DEFAULT_BETA_FEEDBACK_TABLE;
  const missingKeys = [
    ["SUPABASE_URL", url],
    ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    return {
      status: "missing",
      storage: "supabase",
      reasonCode: "production-store-not-configured",
      missingKeys
    };
  }

  return {
    status: "configured",
    storage: "supabase",
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
    table
  };
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

export function createSupabaseRestBetaFeedbackStore(input: {
  config: Extract<SupabaseBetaFeedbackConfig, { status: "configured" }>;
  fetcher?: BetaFeedbackFetch;
}): BetaFeedbackStore {
  return {
    async storeBetaFeedback(payload) {
      const submissionId = buildStableBetaFeedbackSubmissionId(payload);
      const endpoint = `${input.config.url}/rest/v1/${input.config.table}`;
      const fetcher: BetaFeedbackFetch =
        input.fetcher ??
        ((url, init) =>
          fetch(url, {
            method: init.method,
            headers: init.headers,
            body: init.body
          }));

      try {
        const response = await fetcher(endpoint, {
          method: "POST",
          headers: {
            apikey: input.config.serviceRoleKey,
            Authorization: `Bearer ${input.config.serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            payload,
            map_id: payload.metadata.mapId,
            exercise_id: payload.metadata.exerciseId,
            rating: payload.rating,
            feedback_type: payload.issueType
          })
        });

        if (!response.ok) {
          await response.text().catch(() => "");

          return {
            status: "failed",
            storage: "supabase-rest",
            reasonCode: "feedback-supabase-write-failed",
            message: "Feedback could not be saved because production feedback storage failed."
          };
        }

        return {
          status: "stored",
          storage: "supabase-rest",
          submissionId,
          message: "Thanks. Your beta feedback was saved."
        };
      } catch {
        return {
          status: "failed",
          storage: "supabase-rest",
          reasonCode: "feedback-supabase-write-failed",
          message: "Feedback could not be saved because production feedback storage failed."
        };
      }
    }
  };
}

export function createUnavailableBetaFeedbackStore(input: {
  reasonCode:
    | "feedback-storage-not-configured"
    | "production-store-not-configured"
    | "unsupported-production-feedback-storage";
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

function normalizeSupabaseTableName(value: string | undefined): string | null {
  const table = value?.trim() ?? "";

  if (!table) {
    return null;
  }

  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table) ? table : DEFAULT_BETA_FEEDBACK_TABLE;
}
