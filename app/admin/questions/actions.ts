"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { getQuestionById } from "@/lib/admin/questionAdminHelpers";
import {
  normalizeQuestionStatus,
  setQuestionStatusForAdmin,
  upsertQuestionForAdmin
} from "@/lib/db/questionRepository";
import { logger } from "@/lib/logging/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function questionIdFromForm(formData: FormData) {
  const questionId = String(formData.get("questionId") ?? "").trim();
  return questionId || null;
}

async function adminClient() {
  const access = await requireAdmin("/admin/questions");
  const client = await createSupabaseServerClient();

  return {
    access,
    client
  };
}

export async function saveQuestionDraftAction(formData: FormData) {
  const questionId = questionIdFromForm(formData);
  if (!questionId) return;

  const question = getQuestionById(questionId);
  if (!question) return;

  const { access, client } = await adminClient();
  if (access.status !== "admin") return;

  const result = await upsertQuestionForAdmin(question, {
    adminUserId: access.user.id,
    client,
    status: "draft"
  });
  if (!result.persisted) {
    logger.warn("Question draft save failed", {
      feature: "question-publishing",
      action: "save-draft",
      route: "/admin/questions",
      questionId,
      error: result.error ?? result.reason
    });
  }
  revalidatePath("/admin/questions");
}

export async function publishQuestionAction(formData: FormData) {
  const questionId = questionIdFromForm(formData);
  if (!questionId) return;

  const question = getQuestionById(questionId);
  if (!question) return;

  const { access, client } = await adminClient();
  if (access.status !== "admin") return;

  const result = await upsertQuestionForAdmin(question, {
    adminUserId: access.user.id,
    client,
    status: "published"
  });
  if (!result.persisted) {
    logger.warn("Question publish failed", {
      feature: "question-publishing",
      action: "publish",
      route: "/admin/questions",
      questionId,
      error: result.error ?? result.reason
    });
  }
  revalidatePath("/admin/questions");
}

export async function setQuestionStatusAction(formData: FormData) {
  const questionId = questionIdFromForm(formData);
  if (!questionId) return;

  const { access, client } = await adminClient();
  if (access.status !== "admin") return;

  const status = normalizeQuestionStatus(formData.get("status"));
  const question = getQuestionById(questionId);

  if (question) {
    const result = await upsertQuestionForAdmin(question, {
      adminUserId: access.user.id,
      client,
      status
    });
    if (!result.persisted) {
      logger.warn("Question status upsert failed", {
        feature: "question-publishing",
        action: "set-status",
        route: "/admin/questions",
        questionId,
        status,
        error: result.error ?? result.reason
      });
    }
  } else {
    const result = await setQuestionStatusForAdmin(questionId, status, {
      adminUserId: access.user.id,
      client
    });
    if (!result.persisted) {
      logger.warn("Question status update failed", {
        feature: "question-publishing",
        action: "set-status",
        route: "/admin/questions",
        questionId,
        status,
        error: result.error ?? result.reason
      });
    }
  }

  revalidatePath("/admin/questions");
}

export async function batchSetQuestionStatusAction(formData: FormData) {
  const questionIds = Array.from(
    new Set(
      formData
        .getAll("questionId")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
  if (questionIds.length === 0) return;

  const { access, client } = await adminClient();
  if (access.status !== "admin") return;

  const status = normalizeQuestionStatus(formData.get("status"));
  let failedCount = 0;

  for (const questionId of questionIds) {
    const question = getQuestionById(questionId);
    const result = question
      ? await upsertQuestionForAdmin(question, {
          adminUserId: access.user.id,
          client,
          status
        })
      : await setQuestionStatusForAdmin(questionId, status, {
          adminUserId: access.user.id,
          client
        });

    if (!result.persisted) failedCount += 1;
  }

  if (failedCount > 0) {
    logger.warn("Batch question status update partially failed", {
      feature: "question-publishing",
      action: "batch-set-status",
      route: "/admin/questions",
      status,
      requestedCount: questionIds.length,
      failedCount
    });
  } else {
    logger.info("Batch question status update completed", {
      feature: "question-publishing",
      action: "batch-set-status",
      route: "/admin/questions",
      status,
      requestedCount: questionIds.length
    });
  }

  revalidatePath("/admin/questions");
}
