import { NextResponse, type NextRequest } from "next/server";
import { getAdminAccessState } from "@/lib/auth/admin";
import {
  exportQuestionBankItemsForAdmin
} from "@/lib/db/questionRepository";
import {
  createQuestionBankExport,
  type QuestionExportStatusFilter
} from "@/lib/db/questionImportExport";
import { logger, safeUserErrorMessage } from "@/lib/logging/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EXPORT_STATUSES = ["all", "published", "draft", "archived"] as const;

function exportStatus(value: string | null): QuestionExportStatusFilter | null {
  if (!value) return "all";
  return EXPORT_STATUSES.includes(value as QuestionExportStatusFilter)
    ? (value as QuestionExportStatusFilter)
    : null;
}

export async function GET(request: NextRequest) {
  const access = await getAdminAccessState();

  if (access.status === "signed-out") {
    logger.warn("Question export requested while signed out", {
      feature: "question-import-export",
      action: "export",
      route: "/admin/questions/import-export/export",
      hasUser: false
    });
    const loginUrl = new URL("/auth/log-in", request.url);
    loginUrl.searchParams.set("next", "/admin/questions/import-export");
    return NextResponse.redirect(loginUrl);
  }

  if (access.status !== "admin") {
    logger.warn("Question export blocked for non-admin user", {
      feature: "question-import-export",
      action: "export",
      route: "/admin/questions/import-export/export",
      hasUser: true,
      hasAdmin: false
    });
    return NextResponse.json(
      { error: "Admin access is required to export questions." },
      { status: 403 }
    );
  }

  const statusFilter = exportStatus(request.nextUrl.searchParams.get("status"));
  if (!statusFilter) {
    return NextResponse.json(
      { error: "Export status must be all, published, draft, or archived." },
      { status: 400 }
    );
  }

  const client = await createSupabaseServerClient();
  const result = await exportQuestionBankItemsForAdmin(statusFilter, { client });
  if (result.error) {
    logger.error("Question export failed", {
      feature: "question-import-export",
      action: "export",
      route: "/admin/questions/import-export/export",
      statusFilter,
      error: result.error
    });
    return NextResponse.json(
      {
        error: safeUserErrorMessage(
          result.error,
          "Question export is temporarily unavailable."
        )
      },
      { status: 503 }
    );
  }

  const payload = createQuestionBankExport(result.items, statusFilter);
  logger.info("Question export completed", {
    feature: "question-import-export",
    action: "export",
    route: "/admin/questions/import-export/export",
    statusFilter,
    recordCount: result.items.length
  });
  const datePart = payload.exportedAt.slice(0, 10);
  const fileName = `topopass-question-bank-${statusFilter}-${datePart}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
