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

export async function handleBetaFeedbackSubmission(input: {
  body: unknown;
  env?: RealLondonBetaAccessEnv & { NODE_ENV?: string };
  store?: BetaFeedbackStore;
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

  const store = input.store ?? createDefaultBetaFeedbackStore({ env: input.env });
  const storeResult = await store.storeBetaFeedback(validation.payload);

  if (storeResult.status === "stored") {
    return {
      status: 200,
      body: {
        status: "success",
        message: storeResult.message,
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
        message: storeResult.message,
        reasonCode: storeResult.reasonCode
      }
    };
  }

  return {
    status: 503,
    body: {
      status: "failed",
      message: storeResult.message,
      reasonCode: storeResult.reasonCode
    }
  };
}
