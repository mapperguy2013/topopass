"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logging/logger";
import { StatusPage } from "@/src/components/status/StatusPage";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Unhandled app error boundary", {
      feature: "app",
      route: "root",
      digest: error.digest,
      error
    });
  }, [error]);

  return (
    <StatusPage
      actionLabel="Try again"
      message="Something went wrong while loading this page. No account, payment, or answer data has been exposed."
      onAction={reset}
      primaryHref="/practice"
      primaryLabel="Go to practice"
      secondaryHref="/"
      secondaryLabel="Go home"
      title="We could not load that page"
    />
  );
}
