import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { isAdminProfile } from "./roles.ts";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "../..");

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("admin role check uses the current profiles.role model", () => {
  assert.equal(isAdminProfile({ role: "admin" }), true);
  assert.equal(isAdminProfile({ role: "learner" }), false);
  assert.equal(isAdminProfile(null), false);
  assert.equal(isAdminProfile(undefined), false);
});

test("admin layout protects all nested admin routes", () => {
  const layoutPath = path.join(projectRoot, "app/admin/layout.tsx");
  const layout = readProjectFile("app/admin/layout.tsx");

  assert.equal(existsSync(layoutPath), true);
  assert.match(layout, /requireAdmin\("\/admin"\)/);
  assert.match(layout, /accessState\.status !== "admin"/);
  assert.match(layout, /Not authorised/);
  assert.doesNotMatch(layout, /useEffect|useRouter|window\.location/);
});

test("signed-out admin access redirects to learner login", () => {
  const helper = readProjectFile("lib/auth/admin.ts");

  assert.match(helper, /getCurrentUser/);
  assert.match(helper, /status: "signed-out"/);
  assert.match(helper, /redirect\(`\/auth\/log-in\?next=/);
});

test("signed-in non-admin users are blocked by profile role", () => {
  const helper = readProjectFile("lib/auth/admin.ts");

  assert.match(helper, /getCurrentProfile\(user\.id\)/);
  assert.match(helper, /isAdminProfile\(profile\)/);
  assert.match(helper, /status: "forbidden"/);
});

test("learner routes do not import admin route guard", () => {
  const learnerFiles = [
    "app/account/page.tsx",
    "app/practice/page.tsx",
    "app/practice/knowledge/page.tsx",
    "app/practice/map-click/page.tsx",
    "app/practice/routes/page.tsx",
    "app/mock-test/page.tsx",
    "app/progress/page.tsx",
    "app/progress/mistakes/page.tsx"
  ];

  for (const learnerFile of learnerFiles) {
    const source = readProjectFile(learnerFile);
    assert.doesNotMatch(source, /requireAdmin|getAdminAccessState/);
  }
});

test("Stage 30 admin auth files do not expose service-role keys or old tables", () => {
  const files = [
    "app/admin/layout.tsx",
    "lib/auth/admin.ts",
    "lib/auth/roles.ts"
  ];

  for (const file of files) {
    const source = readProjectFile(file);
    assert.doesNotMatch(source, /SERVICE_ROLE|service_role|SUPABASE_SERVICE/i);
    assert.doesNotMatch(source, /mock_test_attempts|mock_test_answers/);
    assert.doesNotMatch(source, /\.from\("questions"\)/);
  }
});

test("question publishing server actions keep status management behind admin access", () => {
  const source = readProjectFile("app/admin/questions/actions.ts");

  assert.match(source, /requireAdmin\("\/admin\/questions"\)/);
  assert.match(source, /access\.status !== "admin"/);
  assert.match(source, /upsertQuestionForAdmin/);
  assert.match(source, /setQuestionStatusForAdmin/);
  assert.doesNotMatch(source, /mock_test_attempts|mock_test_answers/);
  assert.doesNotMatch(source, /\.from\("questions"\)/);
  assert.doesNotMatch(source, /SERVICE_ROLE|service_role|SUPABASE_SERVICE/i);
});

test("question import export routes keep database management behind admin access", () => {
  const actionSource = readProjectFile(
    "app/admin/questions/import-export/actions.ts"
  );
  const exportRouteSource = readProjectFile(
    "app/admin/questions/import-export/export/route.ts"
  );

  assert.match(actionSource, /requireAdmin\("\/admin\/questions\/import-export"\)/);
  assert.match(actionSource, /access\.status !== "admin"/);
  assert.match(actionSource, /importQuestionBankItemsForAdmin/);
  assert.match(exportRouteSource, /getAdminAccessState/);
  assert.match(exportRouteSource, /access\.status !== "admin"/);
  assert.match(exportRouteSource, /exportQuestionBankItemsForAdmin/);
  assert.doesNotMatch(actionSource, /mock_test_attempts|mock_test_answers/);
  assert.doesNotMatch(exportRouteSource, /mock_test_attempts|mock_test_answers/);
  assert.doesNotMatch(actionSource, /\.from\(["']questions["']\)/);
  assert.doesNotMatch(exportRouteSource, /\.from\(["']questions["']\)/);
  assert.doesNotMatch(actionSource, /SERVICE_ROLE|service_role|SUPABASE_SERVICE/i);
  assert.doesNotMatch(exportRouteSource, /SERVICE_ROLE|service_role|SUPABASE_SERVICE/i);
});

test("admin protection is server-side and shared across admin surfaces", () => {
  const adminHelper = readProjectFile("lib/auth/admin.ts");
  const adminLayout = readProjectFile("app/admin/layout.tsx");
  const questionActions = readProjectFile("app/admin/questions/actions.ts");
  const importActions = readProjectFile(
    "app/admin/questions/import-export/actions.ts"
  );

  assert.match(adminHelper, /export async function requireAdmin/);
  assert.match(adminHelper, /export async function getAdminAccessState/);
  assert.match(adminHelper, /redirect\(`\/auth\/log-in\?next=/);
  assert.match(adminLayout, /export default async function AdminLayout/);
  assert.match(questionActions, /"use server"/);
  assert.match(importActions, /"use server"/);
  assert.match(questionActions, /requireAdmin\(/);
  assert.match(importActions, /requireAdmin\(/);
});

test("Stage 34 loading and error boundaries exist for async account and admin routes", () => {
  const expectedFiles = [
    "app/error.tsx",
    "app/not-found.tsx",
    "app/admin/error.tsx",
    "app/admin/loading.tsx",
    "app/account/error.tsx",
    "app/account/loading.tsx",
    "app/admin/questions/import-export/error.tsx",
    "app/admin/questions/import-export/loading.tsx"
  ];

  for (const file of expectedFiles) {
    assert.equal(existsSync(path.join(projectRoot, file)), true, file);
  }

  const rootError = readProjectFile("app/error.tsx");
  const notFound = readProjectFile("app/not-found.tsx");
  const adminLoading = readProjectFile("app/admin/loading.tsx");

  assert.match(rootError, /reset/);
  assert.match(rootError, /logger\.error/);
  assert.match(rootError, /Something went wrong/);
  assert.doesNotMatch(rootError, /\{error\.message\}|error\.message/);
  assert.match(notFound, /Page not found/);
  assert.match(notFound, /does not exist or is not available/);
  assert.match(adminLoading, /Checking admin access/);
});

test("admin import export errors are safe and do not expose raw internals", () => {
  const actionSource = readProjectFile(
    "app/admin/questions/import-export/actions.ts"
  );
  const exportRouteSource = readProjectFile(
    "app/admin/questions/import-export/export/route.ts"
  );

  assert.match(actionSource, /Fix the validation errors before importing/);
  assert.match(actionSource, /Import was not committed because the preview is invalid/);
  assert.match(actionSource, /Question import could not be saved/);
  assert.match(actionSource, /safeUserErrorMessage/);
  assert.match(actionSource, /validCount/);
  assert.match(actionSource, /invalidCount/);
  assert.doesNotMatch(actionSource, /rawJson[^;]+logger/);
  assert.match(exportRouteSource, /Question export is temporarily unavailable/);
  assert.match(exportRouteSource, /safeUserErrorMessage/);
  assert.doesNotMatch(exportRouteSource, /\{ error: result\.error \}/);
});
