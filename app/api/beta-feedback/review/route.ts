import { NextResponse } from "next/server";
import { handleBetaFeedbackReviewRequest } from "./betaFeedbackReviewApi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await handleBetaFeedbackReviewRequest({
    url: request.url,
    method: request.method,
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

function methodNotAllowed() {
  const result = {
    status: 405,
    body: {
      status: "rejected",
      message: "Unsupported method. Use GET.",
      reasonCode: "unsupported-method"
    }
  };

  return NextResponse.json(result.body, {
    status: result.status,
    headers: {
      Allow: "GET"
    }
  });
}

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
