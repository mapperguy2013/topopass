"use client";

import { useActionState, useEffect } from "react";
import {
  newsletterSignupAction,
  type NewsletterSignupState
} from "@/app/newsletter/actions";
import { trackEvent } from "@/lib/analytics/events";

const initialState: NewsletterSignupState = {
  status: "idle",
  message: ""
};

let hasTrackedStarted = false;

export function NewsletterSignupForm() {
  const [state, formAction, isPending] = useActionState(
    newsletterSignupAction,
    initialState
  );
  useEffect(() => {
    if (state.status === "success") {
      trackEvent("newsletter_signup_success", { source: "footer" });
    }
    if (state.status === "error") {
      trackEvent("newsletter_signup_error", { source: "footer" });
    }
  }, [state.status]);

  function handleFocus() {
    if (!hasTrackedStarted) {
      hasTrackedStarted = true;
      trackEvent("newsletter_signup_started", { source: "footer" });
    }
  }

  function handleSubmit() {
    trackEvent("newsletter_signup_submitted", { source: "footer" });
  }

  return (
    <form action={formAction} className="mt-4" onSubmit={handleSubmit}>
      <input name="source" type="hidden" value="footer" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          className="min-h-11 min-w-0 flex-1 rounded-md border border-slate-600 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
          id="newsletter-email"
          name="email"
          onFocus={handleFocus}
          placeholder="Email address"
          required
          type="email"
        />
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Signing up..." : "Get updates"}
        </button>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-300">
        By signing up, you agree to receive TopoPass updates. You can ask to be
        removed by contacting{" "}
        <a
          className="font-semibold text-white underline-offset-4 hover:underline"
          href="mailto:support@topopass.co.uk"
        >
          support@topopass.co.uk
        </a>
        .
      </p>
      {state.message && (
        <p
          className={`mt-3 rounded-md border p-3 text-sm font-semibold ${
            state.status === "success"
              ? "border-green-400/50 bg-green-900/40 text-green-100"
              : "border-amber-300/60 bg-amber-900/30 text-amber-100"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
