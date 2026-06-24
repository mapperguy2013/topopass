import { AppShell } from "@/components/layout/AppShell";
import { signOutAction } from "@/app/auth/actions";
import { buildLearnerDashboardSummary } from "@/lib/analytics/learnerDashboard";
import { ensureProfileForUser, requireUser } from "@/lib/auth/session";
import { listMockAttempts } from "@/lib/db/mockAttemptRepository";
import { listPracticeAttempts } from "@/lib/db/practiceAttemptRepository";
import { getUserProgressSummary } from "@/lib/db/progressRepository";
import { logger } from "@/lib/logging/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatLatestMockScore(
  score: Awaited<ReturnType<typeof getUserProgressSummary>>["progress"]["latestMockScore"]
) {
  if (!score) return "No mock attempts yet";
  if (score.percentage !== null) return `${score.percentage}%`;
  if (score.score !== null && score.maxScore !== null) {
    return `${score.score}/${score.maxScore}`;
  }

  return "Saved";
}

export default async function AccountPage() {
  const user = await requireUser("/account");
  const { profile, error } = await ensureProfileForUser(user);
  const supabase = await createSupabaseServerClient();
  const [progressSummary, practiceResult, mockResult] = await Promise.all([
    getUserProgressSummary(user.id, {
      client: supabase
    }),
    listPracticeAttempts(user.id, { client: supabase }),
    listMockAttempts(user.id, { client: supabase })
  ]);
  if (error) {
    logger.warn("Account profile unavailable", {
      feature: "account",
      action: "load-profile",
      route: "/account",
      hasUser: true,
      error
    });
  }
  if ("error" in progressSummary && progressSummary.error) {
    logger.warn("Account progress summary unavailable", {
      feature: "account",
      action: "load-progress-summary",
      route: "/account",
      source: progressSummary.source,
      hasUser: true,
      error: progressSummary.error
    });
  }
  if (practiceResult.error || mockResult.error) {
    logger.warn("Account detailed progress unavailable", {
      feature: "account",
      action: "load-detailed-progress",
      route: "/account",
      hasUser: true,
      practiceError: practiceResult.error,
      mockError: mockResult.error
    });
  }
  const displayName = profile?.display_name || "Not set";
  const email = profile?.email || user.email || "Not available";
  const dashboardSummary = buildLearnerDashboardSummary({
    practiceAttempts: practiceResult.attempts,
    mockAttempts: mockResult.attempts,
    minTopicAttempts: 2,
    recentLimit: 5
  });

  return (
    <AppShell title="Account">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-road">
              Learner profile
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink">
              Your TopoPass account
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Signed-in practice and mock exam completions now save to your
              account as well as local browser progress. Signed-out practice
              remains fully local.
            </p>
          </div>
          <form action={signOutAction}>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>

        {error && (
          <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Profile details could not be fully loaded yet. You can still use
            local practice and mock tests.
          </p>
        )}

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </dt>
            <dd className="mt-2 break-words text-sm font-semibold text-ink">
              {email}
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Display name
            </dt>
            <dd className="mt-2 break-words text-sm font-semibold text-ink">
              {displayName}
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account created
            </dt>
            <dd className="mt-2 text-sm font-semibold text-ink">
              {formatDate(profile?.created_at || user.created_at)}
            </dd>
          </div>
        </dl>

        <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink">
                Account progress summary
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                These figures come from Supabase account records. The main
                progress dashboard still uses local browser history for this
                stage.
              </p>
            </div>
            <span className="w-fit rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-950">
              {progressSummary.source === "supabase" ? "Account" : "Local"}
            </span>
          </div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Practice attempts
              </dt>
              <dd className="mt-2 text-2xl font-bold text-ink">
                {progressSummary.progress.practiceAttempts}
              </dd>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mock attempts
              </dt>
              <dd className="mt-2 text-2xl font-bold text-ink">
                {progressSummary.progress.mockAttempts}
              </dd>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Latest mock score
              </dt>
              <dd className="mt-2 text-lg font-bold text-ink">
                {formatLatestMockScore(progressSummary.progress.latestMockScore)}
              </dd>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Latest activity
              </dt>
              <dd className="mt-2 text-sm font-bold text-ink">
                {formatDate(progressSummary.progress.latestAttemptAt)}
              </dd>
            </div>
          </dl>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-road">
                Account accuracy
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold text-slate-500">
                    Questions attempted
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-ink">
                    {dashboardSummary.totalQuestionsAttempted}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">
                    Correct answers
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-ink">
                    {dashboardSummary.correctAnswers}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">
                    Accuracy
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-ink">
                    {dashboardSummary.accuracy === null
                      ? "--"
                      : `${dashboardSummary.accuracy}%`}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {dashboardSummary.guidance}
              </p>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-road">
                Topic snapshot
              </p>
              {dashboardSummary.topicPerformance.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  No account-backed topic data yet. Complete practice or a mock
                  exam while signed in.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {dashboardSummary.topicPerformance.slice(0, 4).map((topic) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3 text-sm"
                      key={topic.topic}
                    >
                      <div>
                        <p className="font-semibold text-ink">{topic.topic}</p>
                        <p className="text-xs text-slate-500">
                          {topic.correct}/{topic.attempts} correct
                        </p>
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-xs font-bold uppercase ${
                          topic.status === "strong"
                            ? "bg-green-100 text-green-800"
                            : topic.status === "weak"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {topic.enoughData
                          ? `${topic.accuracy}%`
                          : "building"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
          {"error" in progressSummary && progressSummary.error && (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              Account progress is temporarily unavailable. Browser-local
              progress remains available from the Progress area.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-bold text-ink">Recent account activity</h3>
          {dashboardSummary.recentActivity.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No account-backed activity yet. Complete a practice question or
              mock exam while signed in.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-slate-200">
              {dashboardSummary.recentActivity.map((activity) => (
                <article
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto]"
                  key={activity.id}
                >
                  <div>
                    <p className="font-semibold text-ink">{activity.title}</p>
                    <p className="mt-1 text-slate-600">
                      {activity.sourceLabel}
                      {activity.topic ? ` - ${activity.topic}` : ""} -{" "}
                      {formatDate(activity.date)}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
                      activity.passed
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {activity.scoreLabel}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-bold text-blue-950">
            Local progress stays in place
          </h3>
          <p className="mt-2 text-sm leading-6 text-blue-950">
            This stage does not migrate or delete existing browser-local
            progress. A guided local-to-account sync can be added later once the
            production sync rules are settled.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
