import { AppShell } from "@/components/layout/AppShell";
import { signOutAction } from "@/app/auth/actions";
import { ensureProfileForUser, requireUser } from "@/lib/auth/session";
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
  const progressSummary = await getUserProgressSummary(user.id, {
    client: supabase
  });
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
  const displayName = profile?.display_name || "Not set";
  const email = profile?.email || user.email || "Not available";

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
          {"error" in progressSummary && progressSummary.error && (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              Account progress is temporarily unavailable. Browser-local
              progress remains available from the Progress area.
            </p>
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
