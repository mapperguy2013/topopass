"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logging/logger";
import { StatusPage } from "@/src/components/status/StatusPage";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Admin route error boundary", {
      feature: "admin",
      route: "/admin",
      digest: error.digest,
      error
    });
  }, [error]);

  return (
    <StatusPage
      actionLabel="Try again"
      message="The admin area could not be loaded. Admin access remains protected, and no internal system details are shown here."
      onAction={reset}
      primaryHref="/admin"
      primaryLabel="Back to admin"
      secondaryHref="/practice"
      secondaryLabel="Go to practice"
      title="Admin area unavailable"
    />
  );
}
