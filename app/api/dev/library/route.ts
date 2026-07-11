import { NextResponse } from "next/server";
import { handleDevContentLibraryActionRequest } from "../../../dev/library/devContentLibrary.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = await handleDevContentLibraryActionRequest({
    request,
    nodeEnv: process.env.NODE_ENV
  });

  return NextResponse.json(result, { status: result.status });
}

function methodNotAllowed() {
  return NextResponse.json(
    {
      ok: false,
      status: 405,
      message: "Unsupported method. Use POST.",
      reasonCode: "unsupported-method"
    },
    {
      status: 405,
      headers: {
        Allow: "POST"
      }
    }
  );
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
