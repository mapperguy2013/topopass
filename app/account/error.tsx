"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logging/logger";
import { StatusPage } from "@/src/components/status/StatusPage";

export default function AccountError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Account route error boundary", {
      feature: "account",
      route: "/account",
      digest: error.digest,
      error
    });
  }, [error]);

  return (
    <StatusPage
      actionLabel="Try again"
      message="Your account page could not be loaded right now. Local practice and progress remain available."
      onAction={reset}
      primaryHref="/practice"
      primaryLabel="Continue practice"
      secondaryHref="/auth/log-in"
      secondaryLabel="Log in again"
      title="Account unavailable"
    />
  );
}
