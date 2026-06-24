import { NextResponse, type NextRequest } from "next/server";
import { ensureProfileForUser } from "@/lib/auth/session";
import { logger, safeUserErrorMessage } from "@/lib/logging/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }

  return value;
}

function redirectWithStatus(request: NextRequest, path: string, message: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = `?error=${encodeURIComponent(message)}`;
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return redirectWithStatus(
      request,
      "/auth/log-in",
      "Supabase authentication is not configured yet."
    );
  }

  if (!code) {
    return redirectWithStatus(
      request,
      "/auth/log-in",
      "Authentication confirmation code is missing."
    );
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logger.warn("Auth callback session exchange failed", {
      feature: "auth",
      action: "exchange-code",
      route: "/auth/callback",
      error
    });
    return redirectWithStatus(
      request,
      "/auth/log-in",
      safeUserErrorMessage(error, "Could not confirm the sign-in link. Please try logging in again.")
    );
  }

  if (data.user) {
    const profileResult = await ensureProfileForUser(data.user);
    if (profileResult.error) {
      logger.warn("Profile creation after auth callback failed", {
        feature: "auth",
        action: "ensure-profile",
        route: "/auth/callback",
        hasUser: true,
        error: profileResult.error
      });
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
