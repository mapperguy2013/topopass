import {
  buildBetaAttemptReviewReport,
  exportBetaAttemptReviewJson,
  normaliseBetaAttemptReviewFilters,
  type BetaAttemptReviewEnv,
  type BetaAttemptReviewFilters
} from "../../../practice/real-london/betaAttemptReview.ts";

export type BetaAttemptReviewApiResult = {
  status: number;
  contentType: "application/json";
  body: string;
};

export async function handleBetaAttemptReviewRequest(input: {
  url: string;
  method?: string;
  env?: BetaAttemptReviewEnv;
  cwd?: string;
}): Promise<BetaAttemptReviewApiResult> {
  if (input.method && input.method !== "GET") {
    return {
      status: 405,
      contentType: "application/json",
      body: JSON.stringify({
        status: "rejected",
        message: "Unsupported method. Use GET.",
        reasonCode: "unsupported-method"
      })
    };
  }

  const requestUrl = new URL(input.url, "http://localhost");
  const format = requestUrl.searchParams.get("format")?.trim().toLowerCase() ?? "";
  const filters = readAttemptReviewFiltersFromSearchParams(requestUrl.searchParams);
  const report = await buildAttemptReviewReportSafely({
    env: input.env,
    cwd: input.cwd,
    filters
  });

  if (report.status !== "available") {
    return {
      status:
        report.status === "unavailable"
          ? report.reasonCode === "beta-attempt-review-disabled"
            ? 403
            : 503
          : 500,
      contentType: "application/json",
      body: JSON.stringify({
        status: report.status,
        message: report.message,
        reasonCode: report.reasonCode,
        storageSource: report.storageSource,
        storageStatus: report.storageStatus
      })
    };
  }

  if (format === "json") {
    return {
      status: 200,
      contentType: "application/json",
      body: exportBetaAttemptReviewJson(report.records)
    };
  }

  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(report)
  };
}

export function readAttemptReviewFiltersFromSearchParams(searchParams: URLSearchParams): BetaAttemptReviewFilters {
  return {
    mapId: searchParams.get("mapId") ?? undefined,
    exerciseId: searchParams.get("exerciseId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    legality: searchParams.get("legality") ?? undefined
  };
}

async function buildAttemptReviewReportSafely(input: {
  env?: BetaAttemptReviewEnv;
  cwd?: string;
  filters: BetaAttemptReviewFilters;
}): ReturnType<typeof buildBetaAttemptReviewReport> {
  try {
    return await buildBetaAttemptReviewReport(input);
  } catch {
    return {
      status: "failed",
      storageSource: "local-jsonl",
      storageStatus: "failed",
      reasonCode: "beta-attempt-review-read-failed",
      message: "Beta attempt review records could not be loaded.",
      filters: normaliseBetaAttemptReviewFilters(input.filters),
      totalRecordsConsidered: 0,
      acceptedRecordCount: 0,
      rejectedRecordCount: 0,
      records: [],
      rejectedRecords: [],
      hasReviewableAttempts: false
    };
  }
}
