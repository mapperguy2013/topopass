"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  importQuestionBankItemsForAdmin
} from "@/lib/db/questionRepository";
import {
  previewQuestionImport,
  type QuestionImportMode
} from "@/lib/db/questionImportExport";
import {
  initialQuestionImportState,
  type QuestionImportActionState
} from "@/lib/db/questionImportActionState";
import { logger, safeUserErrorMessage } from "@/lib/logging/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isTextFileLike(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "size" in value &&
      "text" in value &&
      typeof value.text === "function" &&
      typeof value.size === "number"
  );
}

function importModeFromForm(formData: FormData): QuestionImportMode {
  return formData.get("mode") === "upsert" ? "upsert" : "create";
}

async function rawJsonFromForm(formData: FormData) {
  const pastedJson = String(formData.get("json") ?? "").trim();
  const file = formData.get("file");

  if (isTextFileLike(file) && file.size > 0) {
    return (await file.text()).trim();
  }

  return pastedJson;
}

async function requireQuestionImportAdmin() {
  const access = await requireAdmin("/admin/questions/import-export");
  if (access.status !== "admin") {
    return null;
  }

  return access;
}

export async function previewQuestionImportAction(
  _previousState: QuestionImportActionState,
  formData: FormData
): Promise<QuestionImportActionState> {
  const access = await requireQuestionImportAdmin();
  const rawJson = await rawJsonFromForm(formData);
  const mode = importModeFromForm(formData);

  if (!access) {
    logger.warn("Question import preview blocked without admin access", {
      feature: "question-import-export",
      action: "preview",
      route: "/admin/questions/import-export",
      hasAdmin: false
    });
    return {
      ...initialQuestionImportState,
      status: "error",
      rawJson,
      mode,
      message: "Admin access is required to preview question imports."
    };
  }

  const preview = previewQuestionImport(rawJson);
  if (preview.errors.length > 0) {
    logger.warn("Question import preview validation failed", {
      feature: "question-import-export",
      action: "preview",
      route: "/admin/questions/import-export",
      validCount: preview.validRecords.length,
      invalidCount: preview.errors.length,
      mode
    });
  } else {
    logger.info("Question import preview validated", {
      feature: "question-import-export",
      action: "preview",
      route: "/admin/questions/import-export",
      validCount: preview.validRecords.length,
      mode
    });
  }

  return {
    status: preview.errors.length > 0 ? "error" : "preview",
    rawJson,
    mode,
    validCount: preview.validRecords.length,
    invalidCount: preview.errors.length,
    previewItems: preview.previewItems,
    errors: preview.errors,
    message:
      preview.errors.length > 0
        ? "Fix the validation errors before importing."
        : "Preview ready. Review the valid records before committing."
  };
}

export async function commitQuestionImportAction(
  _previousState: QuestionImportActionState,
  formData: FormData
): Promise<QuestionImportActionState> {
  const access = await requireQuestionImportAdmin();
  const rawJson = await rawJsonFromForm(formData);
  const mode = importModeFromForm(formData);

  if (!access) {
    logger.warn("Question import commit blocked without admin access", {
      feature: "question-import-export",
      action: "commit",
      route: "/admin/questions/import-export",
      hasAdmin: false
    });
    return {
      ...initialQuestionImportState,
      status: "error",
      rawJson,
      mode,
      message: "Admin access is required to import questions."
    };
  }

  const preview = previewQuestionImport(rawJson);
  if (preview.errors.length > 0 || preview.validRecords.length === 0) {
    logger.warn("Question import commit rejected before write", {
      feature: "question-import-export",
      action: "commit",
      route: "/admin/questions/import-export",
      validCount: preview.validRecords.length,
      invalidCount: preview.errors.length,
      mode
    });
    return {
      status: "error",
      rawJson,
      mode,
      validCount: preview.validRecords.length,
      invalidCount: preview.errors.length,
      previewItems: preview.previewItems,
      errors: preview.errors,
      message: "Import was not committed because the preview is invalid."
    };
  }

  const client = await createSupabaseServerClient();
  const result = await importQuestionBankItemsForAdmin(preview.validRecords, {
    adminUserId: access.user.id,
    client,
    mode
  });

  if (!result.persisted) {
    logger.error("Question import database write failed", {
      feature: "question-import-export",
      action: "commit",
      route: "/admin/questions/import-export",
      validCount: preview.validRecords.length,
      mode,
      error: result.error ?? result.reason
    });
    return {
      status: "error",
      rawJson,
      mode,
      validCount: preview.validRecords.length,
      invalidCount: preview.errors.length,
      previewItems: preview.previewItems,
      errors: preview.errors,
      message: safeUserErrorMessage(
        result.error ?? result.reason,
        "Question import could not be saved. Check Supabase configuration and admin access."
      )
    };
  }

  logger.info("Question import committed", {
    feature: "question-import-export",
    action: "commit",
    route: "/admin/questions/import-export",
    importedCount: result.importedCount,
    mode
  });

  revalidatePath("/admin/questions");
  revalidatePath("/admin/questions/import-export");

  return {
    status: "committed",
    rawJson,
    mode,
    validCount: preview.validRecords.length,
    invalidCount: 0,
    previewItems: preview.previewItems,
    errors: [],
    importedCount: result.importedCount,
    message: `${result.importedCount} question records imported.`
  };
}
