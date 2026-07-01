import { NextResponse } from "next/server";
import { handleBetaFeedbackSubmission } from "./betaFeedbackApi";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        status: "rejected",
        message: "Feedback request body must be valid JSON.",
        reasonCodes: ["invalid-json"]
      },
      { status: 400 }
    );
  }

  const result = await handleBetaFeedbackSubmission({
    body,
    env: process.env
  });

  return NextResponse.json(result.body, { status: result.status });
}
