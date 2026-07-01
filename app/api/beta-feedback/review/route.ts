import { NextResponse } from "next/server";
import { handleBetaFeedbackReviewRequest } from "./betaFeedbackReviewApi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await handleBetaFeedbackReviewRequest({
    url: request.url,
    env: process.env
  });

  if (result.contentType === "text/csv") {
    return new Response(result.body, {
      status: result.status,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="beta-feedback-review.csv"'
      }
    });
  }

  return NextResponse.json(JSON.parse(result.body), { status: result.status });
}
