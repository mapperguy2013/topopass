"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NewsletterSignupState = {
  status: "idle" | "success" | "error";
  message: string;
};

const consentText =
  "By signing up, you agree to receive TopoPass updates. You can ask to be removed by contacting support@topopass.co.uk.";

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function newsletterSignupAction(
  _previousState: NewsletterSignupState,
  formData: FormData
): Promise<NewsletterSignupState> {
  const email = normalizeEmail(formData.get("email"));
  const source =
    typeof formData.get("source") === "string"
      ? String(formData.get("source")).slice(0, 80)
      : "footer";

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Enter a valid email address."
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message:
        "Newsletter signup is not available in this local environment yet."
    };
  }

  const { error } = await supabase.from("newsletter_signups").insert({
    email,
    source,
    consent_text: consentText,
    consent_version: "2026-beta"
  });

  if (error) {
    if (error.code === "23505") {
      return {
        status: "success",
        message: "You are already on the TopoPass update list."
      };
    }

    return {
      status: "error",
      message: "Signup could not be saved. Please try again later."
    };
  }

  return {
    status: "success",
    message: "Thanks - you're on the TopoPass update list."
  };
}

export { consentText as newsletterConsentText, isValidEmail };
