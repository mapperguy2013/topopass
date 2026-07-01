import {
  buildBetaFeedbackReviewReport,
  exportBetaFeedbackReviewCsv,
  exportBetaFeedbackReviewJson,
  normaliseBetaFeedbackReviewFilters,
  type BetaFeedbackReviewEnv,
  type BetaFeedbackReviewFetch,
  type BetaFeedbackReviewFilters
} from "../../../practice/real-london/betaFeedbackReview.ts";

export type BetaFeedbackReviewApiResult = {
  status: number;
  contentType: "application/json" | "text/csv";
  body: string;
};

export async function handleBetaFeedbackReviewRequest(input: {
  url: string;
  method?: string;
  env?: BetaFeedbackReviewEnv;
  cwd?: string;
  fetcher?: BetaFeedbackReviewFetch;
}): Promise<BetaFeedbackReviewApiResult> {
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
  const filters = readReviewFiltersFromSearchParams(requestUrl.searchParams);
  const report = await buildReviewReportSafely({
    env: input.env,
    cwd: input.cwd,
    fetcher: input.fetcher,
    filters
  });

  if (report.status !== "available") {
    return {
      status:
        report.status === "unavailable"
          ? report.reasonCode === "beta-feedback-review-disabled"
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

  if (format === "csv") {
    return {
      status: 200,
      contentType: "text/csv",
      body: exportBetaFeedbackReviewCsv(report.records)
    };
  }

  if (format === "json") {
    return {
      status: 200,
      contentType: "application/json",
      body: exportBetaFeedbackReviewJson(report.records)
    };
  }

  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(report)
  };
}

export function readReviewFiltersFromSearchParams(searchParams: URLSearchParams): BetaFeedbackReviewFilters {
  const rating = Number(searchParams.get("rating") ?? 0);

  return {
    mapId: searchParams.get("mapId") ?? undefined,
    exerciseId: searchParams.get("exerciseId") ?? undefined,
    rating: Number.isInteger(rating) ? rating : undefined,
    feedbackType: searchParams.get("feedbackType") ?? undefined
  };
}

async function buildReviewReportSafely(input: {
  env?: BetaFeedbackReviewEnv;
  cwd?: string;
  fetcher?: BetaFeedbackReviewFetch;
  filters: BetaFeedbackReviewFilters;
}): ReturnType<typeof buildBetaFeedbackReviewReport> {
  try {
    return await buildBetaFeedbackReviewReport(input);
  } catch {
    return {
      status: "failed",
      message: "Beta feedback review could not be loaded.",
      reasonCode: "feedback-review-read-failed",
      storageSource: "local-jsonl",
      storageStatus: "failed",
      totalRecordsConsidered: 0,
      acceptedRecordCount: 0,
      rejectedRecordCount: 0,
      records: [],
      rejectedRecords: [],
      filters: normaliseBetaFeedbackReviewFilters(input.filters),
      hasReviewableFeedback: false
    };
  }
}
