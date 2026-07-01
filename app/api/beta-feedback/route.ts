import { NextResponse } from "next/server";
import { buildBetaFeedbackMethodNotAllowedResponse, handleBetaFeedbackRequest } from "./betaFeedbackApi";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const result = await handleBetaFeedbackRequest({
    request,
    env: process.env
  });

  return NextResponse.json(result.body, { status: result.status });
}

function methodNotAllowed() {
  const result = buildBetaFeedbackMethodNotAllowedResponse("POST");

  return NextResponse.json(result.body, {
    status: result.status,
    headers: {
      Allow: "POST"
    }
  });
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
