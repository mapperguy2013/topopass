import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { hasSupabasePublicConfig } from "../supabase/config.ts";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "../..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("Stage 28 learner auth route files exist", () => {
  const requiredFiles = [
    "app/auth/sign-up/page.tsx",
    "app/auth/log-in/page.tsx",
    "app/login/page.tsx",
    "app/register/page.tsx",
    "app/create-account/page.tsx",
    "app/auth/callback/route.ts",
    "app/account/page.tsx",
    "app/auth/actions.ts",
    "lib/auth/session.ts"
  ];

  for (const requiredFile of requiredFiles) {
    assert.equal(
      existsSync(path.join(projectRoot, requiredFile)),
      true,
      `${requiredFile} is missing`
    );
  }
});

test("configured Supabase env enables production auth route forms", () => {
  const loginPage = readProjectFile("app/auth/log-in/page.tsx");
  const signUpPage = readProjectFile("app/auth/sign-up/page.tsx");
  const loginAlias = readProjectFile("app/login/page.tsx");
  const registerAlias = readProjectFile("app/register/page.tsx");
  const createAccountAlias = readProjectFile("app/create-account/page.tsx");

  assert.equal(
    hasSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key"
    }),
    true
  );

  assert.match(loginPage, /hasSupabasePublicConfig/);
  assert.match(loginPage, /name="email"/);
  assert.match(loginPage, /name="password"/);
  assert.match(loginPage, /logInAction/);
  assert.match(loginPage, /Continue without signing in/);
  assert.match(loginPage, /flex flex-col items-start gap-3/);

  assert.match(signUpPage, /hasSupabasePublicConfig/);
  assert.match(signUpPage, /name="email"/);
  assert.match(signUpPage, /name="password"/);
  assert.match(signUpPage, /name="displayName"/);
  assert.match(signUpPage, /signUpAction/);
  assert.match(signUpPage, /Continue without signing in/);
  assert.match(signUpPage, /flex flex-col items-start gap-3/);

  assert.match(loginAlias, /AuthLogInPage/);
  assert.match(registerAlias, /AuthSignUpPage/);
  assert.match(createAccountAlias, /AuthSignUpPage/);

  for (const source of [loginPage, signUpPage, loginAlias, registerAlias, createAccountAlias]) {
    assert.doesNotMatch(
      source,
      /User accounts are not connected in the Phase 1 local MVP/
    );
    assert.doesNotMatch(
      source,
      /Account registration is intentionally not connected in the Phase 1/
    );
  }
});

test("Supabase browser config uses build-time constants by default", () => {
  const publicConfig = readProjectFile("lib/supabase/config.ts");
  const browserClient = readProjectFile("lib/supabase/browser.ts");
  const sharedClient = readProjectFile("lib/supabaseClient.ts");

  assert.match(publicConfig, /publicSupabaseConfig/);
  assert.match(publicConfig, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(publicConfig, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(
    publicConfig,
    /env:\s*SupabasePublicEnv\s*=\s*process\.env/
  );
  assert.doesNotMatch(publicConfig, /getSupabasePublicConfig\(env =/);

  assert.match(browserClient, /createBrowserClient/);
  assert.match(browserClient, /cachedBrowserClient/);
  assert.doesNotMatch(browserClient, /process\.env/);

  assert.match(sharedClient, /getSupabasePublicConfig\(\)/);
  assert.doesNotMatch(
    sharedClient,
    /if\s*\(!hasSupabaseConfig\(\)\)\s*return null/
  );
});

test("navbar exposes signed-out and signed-in account actions", () => {
  const navbar = readProjectFile("components/layout/Navbar.tsx");

  assert.match(navbar, /href="\/auth\/log-in"/);
  assert.match(navbar, /Start practising/);
  assert.match(navbar, /publicNavItems/);
  assert.match(navbar, /learnerNavItems/);
  assert.match(navbar, /href="\/account"/);
  assert.match(navbar, /signOutAction/);
  assert.match(navbar, /getCurrentAuthState/);
});

test("signed-out learner pages remain public and do not require auth guards", () => {
  const publicLearnerFiles = [
    "app/page.tsx",
    "app/course/page.tsx",
    "app/demo/page.tsx",
    "app/demo/topographical/page.tsx",
    "app/demo/seru/page.tsx",
    "app/about/page.tsx",
    "app/contact/page.tsx",
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "app/disclaimer/page.tsx",
    "app/topographical/page.tsx",
    "app/seru/page.tsx",
    "app/learn/page.tsx",
    "app/practice/page.tsx",
    "app/practice/topographical/page.tsx",
    "app/practice/knowledge/page.tsx",
    "app/practice/map-click/page.tsx",
    "app/practice/routes/page.tsx",
    "app/practice/seru/page.tsx",
    "app/practice/seru/phv-handbook/page.tsx",
    "app/practice/seru/phv-handbook/all/page.tsx",
    "app/practice/seru/phv-handbook/[sectionId]/page.tsx",
    "app/practice/seru/mock-test/page.tsx",
    "app/practice/seru/english-complete-sentence/page.tsx",
    "app/practice/seru/english-advanced/page.tsx",
    "app/practice/seru/reading-understanding/page.tsx",
    "app/mock-test/page.tsx",
    "app/progress/page.tsx",
    "app/progress/mistakes/page.tsx"
  ];

  for (const learnerFile of publicLearnerFiles) {
    const source = readProjectFile(learnerFile);
    assert.doesNotMatch(source, /requireUser\(/, learnerFile);
    assert.doesNotMatch(source, /requireAdmin|getAdminAccessState/, learnerFile);
  }

  const dashboardPage = readProjectFile("app/dashboard/page.tsx");
  assert.doesNotMatch(dashboardPage, /requireUser\(/);
  assert.match(dashboardPage, /View progress/);
});

test("account page is protected by the reusable user requirement", () => {
  const accountPage = readProjectFile("app/account/page.tsx");

  assert.match(accountPage, /requireUser\("\/account"\)/);
  assert.match(accountPage, /getOrCreateProfileForUser/);
  assert.match(accountPage, /signOutAction/);
  assert.match(accountPage, /AccountProgressSummary/);
  assert.doesNotMatch(
    accountPage,
    /These figures come from Supabase account records/
  );
});

test("account page uses quiet profile fallbacks when profile metadata is unavailable", () => {
  const accountPage = readProjectFile("app/account/page.tsx");

  assert.match(accountPage, /user\.email \|\| profile\?\.email/);
  assert.match(accountPage, /profile\?\.display_name \|\| "Not set"/);
  assert.match(accountPage, /user\.created_at \|\| profile\?\.created_at/);
  assert.match(accountPage, /Some profile details are still syncing/);
  assert.match(accountPage, /Free plan/);
  assert.doesNotMatch(
    accountPage,
    /Profile details could not be fully loaded yet/
  );
  assert.doesNotMatch(accountPage, /border-amber-200 bg-amber-50/);
});

test("account progress summary supports local browser fallback copy", () => {
  const accountProgress = readProjectFile(
    "src/components/account/AccountProgressSummary.tsx"
  );
  const accountProgressHelper = readProjectFile("lib/account/accountProgress.ts");

  assert.match(accountProgress, /local progress has not yet been synced/i);
  assert.match(accountProgress, /familyBreakdown/);
  assert.match(accountProgress, /listLocalPracticeAttempts/);
  assert.match(accountProgress, /listLocalMockAttempts/);
  assert.match(accountProgressHelper, /Local browser progress/);
  assert.match(accountProgressHelper, /Account sync is still being finalised/);
  assert.match(accountProgressHelper, /chooseAccountProgressDisplay/);
  assert.match(accountProgressHelper, /hasVisibleProgress/);
});

test("account page shows current free plan without active billing", () => {
  const accountPage = readProjectFile("app/account/page.tsx");

  assert.match(accountPage, /getCurrentLearnerPlan/);
  assert.match(accountPage, /getPlanDefinition/);
  assert.match(accountPage, /Current plan/);
  assert.match(accountPage, /Free plan/);
  assert.match(accountPage, /Upgrade coming soon/);
  assert.match(accountPage, /account_upgrade_cta_clicked/);
  assert.doesNotMatch(accountPage, /checkout|subscription|stripe/i);
});

test("sign-out action exists and signs out through Supabase auth", () => {
  const actions = readProjectFile("app/auth/actions.ts");

  assert.match(actions, /export async function signOutAction/);
  assert.match(actions, /supabase\.auth\.signOut\(\)/);
  assert.match(actions, /redirect\("\/"\)/);
});

test("auth callback uses Supabase code exchange and local redirect safety", () => {
  const callbackRoute = readProjectFile("app/auth/callback/route.ts");

  assert.match(callbackRoute, /exchangeCodeForSession/);
  assert.match(callbackRoute, /safeNextPath/);
  assert.match(callbackRoute, /ensureProfileForUser/);
});

test("profile helper creates profiles only for the authenticated user id", () => {
  const sessionHelper = readProjectFile("lib/auth/session.ts");

  assert.match(sessionHelper, /\.from\("profiles"\)/);
  assert.match(sessionHelper, /upsert\(/);
  assert.match(sessionHelper, /id: user\.id/);
  assert.match(sessionHelper, /email: user\.email/);
  assert.match(sessionHelper, /getOrCreateProfileForUser/);
  assert.match(sessionHelper, /\.maybeSingle\(\)/);
  assert.match(sessionHelper, /ensureProfileForUser\(user, displayName\)/);
  assert.match(sessionHelper, /profileResult\?\.profile/);
  assert.match(sessionHelper, /redirect\(`\/auth\/log-in\?next=/);
});

test("Stage 28 auth files do not reference private Supabase keys", () => {
  const authFiles = [
    "app/auth/actions.ts",
    "app/auth/callback/route.ts",
    "app/auth/log-in/page.tsx",
    "app/auth/sign-up/page.tsx",
    "app/account/page.tsx",
    "components/layout/Navbar.tsx",
    "lib/auth/session.ts",
    "lib/db/mockAttemptRepository.ts",
    "lib/db/practiceAttemptRepository.ts",
    "lib/db/progressRepository.ts",
    "app/newsletter/actions.ts",
    "middleware.ts"
  ];

  for (const authFile of authFiles) {
    const source = readProjectFile(authFile);
    assert.doesNotMatch(source, /SERVICE_ROLE|service_role/i, authFile);
    assert.doesNotMatch(source, /SUPABASE_SERVICE/i, authFile);
  }
});
