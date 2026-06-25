import { AppShell } from "@/components/layout/AppShell";
import { signOutAction } from "@/app/auth/actions";
import { ensureProfileForUser, requireUser } from "@/lib/auth/session";
import { listMockAttempts } from "@/lib/db/mockAttemptRepository";
import { listPracticeAttempts } from "@/lib/db/practiceAttemptRepository";
import { getUserProgressSummary } from "@/lib/db/progressRepository";
import { logger } from "@/lib/logging/logger";
import {
  getCurrentLearnerPlan,
  getPlanEntitlements
} from "@/lib/plans/entitlements";
import { getPlanDefinition } from "@/lib/plans/plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountProgressSummary } from "@/src/components/account/AccountProgressSummary";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium"
  }).format(new Date(value));
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
  const currentPlanId = getCurrentLearnerPlan();
  const currentPlan = getPlanDefinition(currentPlanId);
  const planEntitlements = getPlanEntitlements(currentPlanId);

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

        <section className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-800">
                Current plan
              </p>
              <h3 className="mt-2 text-xl font-bold text-blue-950">
                {currentPlan.label}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-950">
                You are currently on the Free plan. Paid upgrades are not live
                yet, so no payment details are needed. Upgrade options are
                coming soon after beta access rules and support policies are
                settled.
              </p>
            </div>
            <TrackedLink
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              eventName="account_upgrade_cta_clicked"
              eventProperties={{ plan: currentPlan.id, cta: "view-pricing" }}
              href="/pricing"
            >
              View pricing
            </TrackedLink>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-blue-100 bg-white p-4">
              <h4 className="text-sm font-bold text-ink">Included now</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {currentPlan.included.map((item) => (
                  <li className="flex gap-2" key={item}>
                    <span
                      aria-hidden="true"
                      className="mt-1 size-2 shrink-0 rounded-full bg-road"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-blue-100 bg-white p-4">
              <h4 className="text-sm font-bold text-ink">
                Upgrade coming soon
              </h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {planEntitlements
                  .filter((feature) => feature.access === "coming-soon")
                  .slice(0, 4)
                  .map((feature) => (
                    <li className="flex gap-2" key={feature.key}>
                      <span
                        aria-hidden="true"
                        className="mt-1 size-2 shrink-0 rounded-full bg-amber-400"
                      />
                      <span>
                        {feature.label}: {feature.upgradeCta}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </section>

        <AccountProgressSummary
          accountMockAttempts={mockResult.attempts}
          accountPracticeAttempts={practiceResult.attempts}
          accountProgress={progressSummary.progress}
          hasAccountError={Boolean(
            ("error" in progressSummary && progressSummary.error) ||
              practiceResult.error ||
              mockResult.error
          )}
        />
      </section>
    </AppShell>
  );
}
