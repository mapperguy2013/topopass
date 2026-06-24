import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  getQuestionById,
  getQuestionCategory,
  getQuestionPrompt,
  isQuestionActive,
  type AdminQuestion
} from "@/lib/admin/questionAdminHelpers";
import { validateAllQuestionBanks } from "@/lib/admin/questionValidation";
import { readAdminQuestionById } from "@/lib/db/questionRepository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";

function statusLabel(question: AdminQuestion) {
  return isQuestionActive(question) ? "Active source item" : "Inactive source item";
}

function managerHref(question: AdminQuestion) {
  return question.type === "route"
    ? "/admin/questions/route"
    : `/admin/questions/${question.type}`;
}

function LearnerPreview({ question }: { question: AdminQuestion }) {
  if (question.type === "knowledge") {
    return (
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-road">
          Learner preview
        </p>
        <h3 className="mt-2 text-xl font-bold text-ink">{question.prompt}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => (
            <div
              className={`rounded-md border px-4 py-3 text-sm font-semibold ${
                option === question.correctAnswer
                  ? "border-green-300 bg-green-50 text-green-800"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              key={option}
            >
              {option}
              {option === question.correctAnswer ? " (correct)" : ""}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <QuestionExplanation
            explanation={question.explanation}
            tip={question.tip}
            title="Feedback preview"
          />
        </div>
      </section>
    );
  }

  if (question.type === "map-click") {
    return (
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-road">
          Learner preview
        </p>
        <h3 className="mt-2 text-xl font-bold text-ink">{question.prompt}</h3>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-md bg-white p-3">
            <dt className="font-semibold text-slate-500">Target</dt>
            <dd className="mt-1 text-slate-800">{question.targetName}</dd>
          </div>
          <div className="rounded-md bg-white p-3">
            <dt className="font-semibold text-slate-500">Accepted radius</dt>
            <dd className="mt-1 text-slate-800">
              {question.toleranceMeters}m
            </dd>
          </div>
          <div className="rounded-md bg-white p-3">
            <dt className="font-semibold text-slate-500">Coordinates</dt>
            <dd className="mt-1 text-slate-800">
              {question.answer.lat.toFixed(5)}, {question.answer.lng.toFixed(5)}
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <QuestionExplanation
            acceptedAreaDescription={question.acceptedAreaDescription}
            explanation={question.explanation}
            tip={question.tip}
            title="Feedback preview"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-road">
        Learner preview
      </p>
      <h3 className="mt-2 text-xl font-bold text-ink">{question.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{question.prompt}</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-md bg-white p-3">
          <dt className="font-semibold text-slate-500">Start</dt>
          <dd className="mt-1 text-slate-800">{question.fromLabel}</dd>
        </div>
        <div className="rounded-md bg-white p-3">
          <dt className="font-semibold text-slate-500">Destination</dt>
          <dd className="mt-1 text-slate-800">{question.toLabel}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <QuestionExplanation
          explanation={question.explanation}
          idealRouteDescription={question.idealRouteDescription}
          tip={question.tip}
          title="Feedback preview"
        />
      </div>
    </section>
  );
}

export default async function AdminQuestionDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const sourceQuestion = getQuestionById(decodedId);
  const supabase = await createSupabaseServerClient();
  const databaseQuestion = sourceQuestion
    ? null
    : await readAdminQuestionById(decodedId, { client: supabase });
  const question = sourceQuestion ?? databaseQuestion?.question;

  if (!question) notFound();

  const validation = sourceQuestion
    ? validateAllQuestionBanks().results.find(
        (entry) =>
          entry.question.id === question.id && entry.question.type === question.type
      )
    : null;

  return (
    <AppShell title="Question Detail">
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-xs text-slate-500">{question.id}</p>
              <h2 className="mt-2 text-xl font-bold text-ink">
                {getQuestionPrompt(question)}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Preview is admin-only and does not publish the question.
              </p>
            </div>
            <span className="w-fit rounded bg-slate-100 px-3 py-1 text-xs font-bold uppercase">
              {question.type === "route" ? "route-drawing" : question.type}
            </span>
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="font-semibold text-slate-500">Topic</dt>
              <dd className="mt-1">{getQuestionCategory(question)}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="font-semibold text-slate-500">Difficulty</dt>
              <dd className="mt-1">{question.difficulty}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="font-semibold text-slate-500">Review status</dt>
              <dd className="mt-1">
                {sourceQuestion ? statusLabel(question) : "Supabase import"}
              </dd>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="font-semibold text-slate-500">Source</dt>
              <dd className="mt-1">
                {sourceQuestion ? "Source bank" : "question_bank_items"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <h3 className="font-bold text-ink">Validation</h3>
            {validation?.issues.length ? (
              <ul className="mt-2 space-y-2 text-sm">
                {validation.issues.map((entry, index) => (
                  <li
                    className={
                      entry.severity === "error"
                        ? "text-red-700"
                        : "text-amber-800"
                    }
                    key={`${entry.field}-${index}`}
                  >
                    <span className="font-semibold">{entry.field}:</span>{" "}
                    {entry.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-green-700">
                {sourceQuestion
                  ? "No validation issues."
                  : "Imported row loaded from Supabase. Use import preview validation before publishing imported content."}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {sourceQuestion && (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white"
                href={managerHref(question)}
              >
                Open editor
              </Link>
            )}
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              href="/admin/questions"
            >
              Back to inventory
            </Link>
          </div>
        </section>

        <LearnerPreview question={question} />
      </div>
    </AppShell>
  );
}
