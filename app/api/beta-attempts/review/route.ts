import { NextResponse } from "next/server";
import { handleBetaAttemptReviewRequest } from "./betaAttemptReviewApi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await handleBetaAttemptReviewRequest({
    url: request.url,
    method: request.method,
    env: process.env
  });

  return NextResponse.json(JSON.parse(result.body), { status: result.status });
}

function methodNotAllowed() {
  return NextResponse.json(
    {
      status: "rejected",
      message: "Unsupported method. Use GET.",
      reasonCode: "unsupported-method"
    },
    {
      status: 405,
      headers: {
        Allow: "GET"
      }
    }
  );
}

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
