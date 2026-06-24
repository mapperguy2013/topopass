import Link from "next/link";
import {
  getQuestionCategory,
  getQuestionPrompt,
  isQuestionActive
} from "@/lib/admin/questionAdminHelpers";
import { validateAllQuestionBanks } from "@/lib/admin/questionValidation";
import {
  batchSetQuestionStatusAction,
  publishQuestionAction,
  saveQuestionDraftAction,
  setQuestionStatusAction
} from "@/app/admin/questions/actions";
import {
  readAdminQuestionItems,
  type QuestionBankItemSummary
} from "@/lib/db/questionRepository";
import type { QuestionDifficulty, QuestionStatus } from "@/lib/db/types";
import { logger } from "@/lib/logging/logger";
import {
  QUESTION_DIFFICULTIES,
  QUESTION_TOPICS
} from "@/lib/questions/topics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InventoryStatusFilter = QuestionStatus | "all" | "not-saved";

type InventoryFilters = {
  status?: string;
  topic?: string;
  difficulty?: string;
};

type InventoryRow = {
  id: string;
  prompt: string;
  type: string;
  category: string;
  difficulty: QuestionDifficulty | "unknown";
  source: "source-bank" | "question_bank_items";
  sourceState: string;
  status: QuestionStatus | "not-saved";
  publishedAt: string | null;
  validationLabel: string;
  validationClass: string;
  reviewLabel: string;
  canInspect: boolean;
};

function statusClass(status?: InventoryRow["status"]) {
  if (status === "published") return "bg-green-100 text-green-800";
  if (status === "archived") return "bg-slate-200 text-slate-700";
  if (status === "draft") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-600";
}

function normalizeStatusFilter(value: unknown): InventoryStatusFilter {
  return value === "draft" ||
    value === "published" ||
    value === "archived" ||
    value === "not-saved"
    ? value
    : "all";
}

function normalizeTopicFilter(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "all";
}

function normalizeDifficultyFilter(value: unknown): QuestionDifficulty | "all" {
  return QUESTION_DIFFICULTIES.includes(value as QuestionDifficulty)
    ? (value as QuestionDifficulty)
    : "all";
}

function countBy<T extends string>(rows: InventoryRow[], select: (row: InventoryRow) => T) {
  return rows.reduce<Record<T, number>>(
    (counts, row) => {
      const key = select(row);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    },
    {} as Record<T, number>
  );
}

function optionHref(filters: Required<InventoryFilters>, patch: InventoryFilters) {
  const params = new URLSearchParams();
  const next = { ...filters, ...patch };
  if (next.status && next.status !== "all") params.set("status", next.status);
  if (next.topic && next.topic !== "all") params.set("topic", next.topic);
  if (next.difficulty && next.difficulty !== "all") {
    params.set("difficulty", next.difficulty);
  }
  const query = params.toString();
  return query ? `/admin/questions?${query}` : "/admin/questions";
}

function databaseOnlyRows(
  items: QuestionBankItemSummary[],
  sourceBankIds: Set<string>
): InventoryRow[] {
  return items
    .filter((item) => !sourceBankIds.has(item.id))
    .map((item) => ({
      id: item.id,
      prompt: item.prompt,
      type: item.question_type,
      category: item.category ?? "Uncategorised",
      difficulty: item.difficulty ?? "unknown",
      source: "question_bank_items" as const,
      sourceState: "Database only",
      status: item.status,
      publishedAt: item.published_at,
      validationLabel: "Imported",
      validationClass: "bg-blue-100 text-blue-800",
      reviewLabel:
        item.status === "draft"
          ? "Needs admin review"
          : item.status === "published"
            ? "Live for learners"
            : "Hidden from learners",
      canInspect: true
    }));
}

export async function AdminQuestionInventory({
  filters = {}
}: {
  filters?: InventoryFilters;
}) {
  const validation = validateAllQuestionBanks();
  const supabase = await createSupabaseServerClient();
  const publishing = await readAdminQuestionItems({ client: supabase });
  if (publishing.error) {
    logger.warn("Admin question inventory publishing status unavailable", {
      feature: "admin-question-inventory",
      action: "read-publishing-status",
      route: "/admin/questions",
      error: publishing.error
    });
  }
  const statusById = new Map(
    publishing.items.map((item) => [item.id, item] as const)
  );
  const sourceBankIds = new Set(
    validation.results.map(({ question }) => question.id)
  );
  const sourceRows: InventoryRow[] = validation.results.map(
    ({ question, valid, issues }) => {
      const publishedItem = statusById.get(question.id);
      const status = publishedItem?.status ?? "not-saved";
      return {
        id: question.id,
        prompt: getQuestionPrompt(question),
        type: question.type === "route" ? "route-drawing" : question.type,
        category: getQuestionCategory(question),
        difficulty: question.difficulty,
        source: "source-bank",
        sourceState: isQuestionActive(question) ? "Active" : "Inactive",
        status,
        publishedAt: publishedItem?.published_at ?? null,
        validationLabel: valid
          ? `${issues.length} warnings`
          : `${issues.filter((entry) => entry.severity === "error").length} errors`,
        validationClass: valid
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800",
        reviewLabel:
          status === "draft" || status === "not-saved"
            ? "Needs admin review"
            : status === "published"
              ? "Live for learners"
              : "Hidden from learners",
        canInspect: true
      };
    }
  );
  const rows = [
    ...sourceRows,
    ...databaseOnlyRows(publishing.items, sourceBankIds)
  ];

  const activeFilters = {
    status: normalizeStatusFilter(filters.status),
    topic: normalizeTopicFilter(filters.topic),
    difficulty: normalizeDifficultyFilter(filters.difficulty)
  };
  const topicOptions = [
    ...new Set([
      ...QUESTION_TOPICS,
      ...rows.map((row) => row.category).filter(Boolean)
    ])
  ].sort();
  const statusCounts = countBy(rows, (row) => row.status);
  const topicCounts = countBy(rows, (row) => row.category);
  const difficultyCounts = countBy(rows, (row) => row.difficulty);
  const filteredRows = rows.filter((row) => {
    if (activeFilters.status !== "all" && row.status !== activeFilters.status) {
      return false;
    }
    if (activeFilters.topic !== "all" && row.category !== activeFilters.topic) {
      return false;
    }
    if (
      activeFilters.difficulty !== "all" &&
      row.difficulty !== activeFilters.difficulty
    ) {
      return false;
    }
    return true;
  });

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">All questions</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Source-bank and Supabase question_bank_items inventory with topic,
            difficulty, and publishing controls.
          </p>
          {publishing.error && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              Publishing status is temporarily unavailable. Existing admin
              validation is still shown.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road" href="/admin/questions/import-export">Import / export</Link>
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white" href="/admin/questions/new">Create question</Link>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Total records
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">{rows.length}</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Draft
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {statusCounts.draft ?? 0}
          </p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Published
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {statusCounts.published ?? 0}
          </p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Database-only
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {rows.filter((row) => row.source === "question_bank_items").length}
          </p>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-3">
        <div>
          <p className="text-sm font-bold text-slate-700">Status</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["all", "draft", "published", "archived", "not-saved"] as const).map(
              (status) => (
                <Link
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                    activeFilters.status === status
                      ? "border-road bg-blue-50 text-road"
                      : "border-slate-300 text-slate-700 hover:border-road hover:text-road"
                  }`}
                  href={optionHref(activeFilters, { status })}
                  key={status}
                >
                  {status === "all"
                    ? "All"
                    : `${status} (${statusCounts[status] ?? 0})`}
                </Link>
              )
            )}
          </div>
        </div>
        <form action="/admin/questions">
          {activeFilters.status !== "all" && (
            <input name="status" type="hidden" value={activeFilters.status} />
          )}
          {activeFilters.difficulty !== "all" && (
            <input
              name="difficulty"
              type="hidden"
              value={activeFilters.difficulty}
            />
          )}
          <label className="text-sm font-bold text-slate-700">
            Topic
            <select
              className="mt-2 block min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              defaultValue={activeFilters.topic}
              name="topic"
            >
              <option value="all">All topics</option>
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>
                  {topic} ({topicCounts[topic] ?? 0})
                </option>
              ))}
            </select>
          </label>
          <button
            className="mt-2 inline-flex min-h-10 items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
            type="submit"
          >
            Apply topic
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              className="text-xs font-semibold text-road"
              href={optionHref(activeFilters, { topic: "all" })}
            >
              Clear topic
            </Link>
            {topicOptions.slice(0, 10).map((topic) => (
              <Link
                className="text-xs font-semibold text-slate-600 hover:text-road"
                href={optionHref(activeFilters, { topic })}
                key={topic}
              >
                {topic}
              </Link>
            ))}
          </div>
        </form>
        <div>
          <p className="text-sm font-bold text-slate-700">Difficulty</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["all", ...QUESTION_DIFFICULTIES] as const).map((difficulty) => (
              <Link
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  activeFilters.difficulty === difficulty
                    ? "border-road bg-blue-50 text-road"
                    : "border-slate-300 text-slate-700 hover:border-road hover:text-road"
                }`}
                href={optionHref(activeFilters, { difficulty })}
                key={difficulty}
              >
                {difficulty === "all"
                  ? "All"
                  : `${difficulty} (${difficultyCounts[difficulty] ?? 0})`}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <form
        action={batchSetQuestionStatusAction}
        className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between"
        id="batch-question-status-form"
      >
        <div>
          <p className="text-sm font-bold text-ink">Batch review actions</p>
          <p className="mt-1 text-sm text-slate-600">
            Select questions below, then publish, archive, or return them to
            draft. These actions are protected by the server-side admin check.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-green-300 bg-white px-3 py-2 text-xs font-bold text-green-800 hover:border-green-500"
            name="status"
            type="submit"
            value="published"
          >
            Publish selected
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-500"
            name="status"
            type="submit"
            value="archived"
          >
            Archive selected
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:border-amber-500"
            name="status"
            type="submit"
            value="draft"
          >
            Move to draft
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Select</th>
              <th className="px-4 py-3">ID / prompt</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Validation</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRows.map((row) => (
              <tr key={`${row.source}-${row.id}`}>
                <td className="px-4 py-4 align-top">
                  <input
                    aria-label={`Select ${row.id} for batch status change`}
                    className="size-5 rounded border-slate-300 text-road focus:ring-road"
                    form="batch-question-status-form"
                    name="questionId"
                    type="checkbox"
                    value={row.id}
                  />
                </td>
                <td className="px-4 py-4">
                  <p className="font-mono text-xs text-slate-500">{row.id}</p>
                  <p className="mt-1 max-w-md font-semibold text-ink">
                    {row.prompt}
                  </p>
                </td>
                <td className="px-4 py-4 font-semibold">{row.type}</td>
                <td className="px-4 py-4 text-slate-600">{row.category}</td>
                <td className="px-4 py-4 text-slate-600">{row.difficulty}</td>
                <td className="px-4 py-4 text-slate-600">
                  <p className="font-semibold">
                    {row.source === "source-bank" ? "Source bank" : "Supabase"}
                  </p>
                  <p className="text-xs">{row.sourceState}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded px-2 py-1 text-xs font-bold ${statusClass(row.status)}`}>
                    {row.status}
                  </span>
                  {row.publishedAt && (
                    <p className="mt-2 text-xs text-slate-500">
                      Published {new Date(row.publishedAt).toLocaleDateString("en-GB")}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded px-2 py-1 text-xs font-bold ${row.validationClass}`}>
                    {row.validationLabel}
                  </span>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {row.reviewLabel}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {row.canInspect && (
                      <Link className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:border-road hover:text-road" href={`/admin/questions/${encodeURIComponent(row.id)}`}>Review / preview</Link>
                    )}
                    <form action={saveQuestionDraftAction}>
                      <input name="questionId" type="hidden" value={row.id} />
                      <button className="inline-flex min-h-10 items-center rounded-md border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900 hover:border-amber-500" type="submit">Save draft</button>
                    </form>
                    <form action={publishQuestionAction}>
                      <input name="questionId" type="hidden" value={row.id} />
                      <button className="inline-flex min-h-10 items-center rounded-md border border-green-300 px-3 py-2 text-xs font-bold text-green-800 hover:border-green-500" type="submit">Publish</button>
                    </form>
                    <form action={setQuestionStatusAction}>
                      <input name="questionId" type="hidden" value={row.id} />
                      <input name="status" type="hidden" value="archived" />
                      <button className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-500" type="submit">Archive</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRows.length === 0 && (
          <p className="p-5 text-sm font-semibold text-slate-600">
            No questions match the selected topic, status, and difficulty.
          </p>
        )}
      </div>
    </section>
  );
}
