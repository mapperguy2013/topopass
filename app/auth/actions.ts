"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureProfileForUser } from "@/lib/auth/session";
import { logger, safeUserErrorMessage } from "@/lib/logging/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function encodeStatus(value: string) {
  return encodeURIComponent(value);
}

function safeNextPath(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return "/account";
  }

  if (value.startsWith("//") || value.startsWith("/auth/log-out")) {
    return "/account";
  }

  return value;
}

async function getOrigin() {
  const headerStore = await headers();
  return headerStore.get("origin") ?? "http://localhost:3000";
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(
      `/auth/sign-up?error=${encodeStatus("Supabase authentication is not configured yet.")}`
    );
  }

  if (!email || !password) {
    redirect(
      `/auth/sign-up?error=${encodeStatus("Email and password are required.")}`
    );
  }

  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || null
      },
      emailRedirectTo: `${origin}/auth/callback?next=/account`
    }
  });

  if (error) {
    logger.warn("Sign-up failed", {
      feature: "auth",
      action: "sign-up",
      route: "/auth/sign-up",
      hasEmail: Boolean(email),
      error
    });
    redirect(
      `/auth/sign-up?error=${encodeStatus(safeUserErrorMessage(error, "Could not create the account. Check the details and try again."))}`
    );
  }

  if (data.session && data.user) {
    const profileResult = await ensureProfileForUser(data.user, displayName);
    if (profileResult.error) {
      logger.warn("Profile creation after sign-up failed", {
        feature: "auth",
        action: "ensure-profile",
        route: "/auth/sign-up",
        hasUser: true,
        error: profileResult.error
      });
    }
    redirect("/account?message=Account%20created.");
  }

  redirect(
    `/auth/log-in?message=${encodeStatus("Check your email to confirm your account before logging in.")}`
  );
}

export async function logInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(
      `/auth/log-in?error=${encodeStatus("Supabase authentication is not configured yet.")}`
    );
  }

  if (!email || !password) {
    redirect(
      `/auth/log-in?error=${encodeStatus("Email and password are required.")}`
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    logger.warn("Log-in failed", {
      feature: "auth",
      action: "log-in",
      route: "/auth/log-in",
      hasEmail: Boolean(email),
      error
    });
    redirect(
      `/auth/log-in?error=${encodeStatus(safeUserErrorMessage(error, "Could not log in with those details."))}`
    );
  }

  if (data.user) {
    const profileResult = await ensureProfileForUser(data.user);
    if (profileResult.error) {
      logger.warn("Profile creation after log-in failed", {
        feature: "auth",
        action: "ensure-profile",
        route: "/auth/log-in",
        hasUser: true,
        error: profileResult.error
      });
    }
  }

  redirect(next);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
