"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logging/logger";
import { StatusPage } from "@/src/components/status/StatusPage";

export default function QuestionImportExportError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Question import export route error boundary", {
      feature: "question-import-export",
      route: "/admin/questions/import-export",
      digest: error.digest,
      error
    });
  }, [error]);

  return (
    <StatusPage
      actionLabel="Try again"
      message="The import/export tools could not be loaded. The question bank was not changed."
      onAction={reset}
      primaryHref="/admin/questions"
      primaryLabel="Back to questions"
      secondaryHref="/admin"
      secondaryLabel="Admin overview"
      title="Import/export unavailable"
    />
  );
}
