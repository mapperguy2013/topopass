import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "../..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("Stage 28 learner auth route files exist", () => {
  const requiredFiles = [
    "app/auth/sign-up/page.tsx",
    "app/auth/log-in/page.tsx",
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
    "app/topographical/page.tsx",
    "app/seru/page.tsx",
    "app/learn/page.tsx",
    "app/practice/page.tsx",
    "app/practice/topographical/page.tsx",
    "app/practice/knowledge/page.tsx",
    "app/practice/map-click/page.tsx",
    "app/practice/routes/page.tsx",
    "app/practice/seru/page.tsx",
    "app/mock-test/page.tsx",
    "app/progress/page.tsx",
    "app/progress/mistakes/page.tsx"
  ];

  for (const learnerFile of publicLearnerFiles) {
    const source = readProjectFile(learnerFile);
    assert.doesNotMatch(source, /requireUser\(/, learnerFile);
    assert.doesNotMatch(source, /requireAdmin|getAdminAccessState/, learnerFile);
  }
});

test("account page is protected by the reusable user requirement", () => {
  const accountPage = readProjectFile("app/account/page.tsx");

  assert.match(accountPage, /requireUser\("\/account"\)/);
  assert.match(accountPage, /ensureProfileForUser/);
  assert.match(accountPage, /signOutAction/);
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
    "middleware.ts"
  ];

  for (const authFile of authFiles) {
    const source = readProjectFile(authFile);
    assert.doesNotMatch(source, /SERVICE_ROLE|service_role/i, authFile);
    assert.doesNotMatch(source, /SUPABASE_SERVICE/i, authFile);
  }
});
