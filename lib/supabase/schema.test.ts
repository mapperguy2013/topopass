import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "../..");
const migrationPath = path.join(
  projectRoot,
  "supabase/migrations/001_initial_schema.sql"
);
const migrationSql = readFileSync(migrationPath, "utf8");
const publishingMigrationPath = path.join(
  projectRoot,
  "supabase/migrations/002_question_publishing_workflow.sql"
);
const publishingMigrationSql = readFileSync(publishingMigrationPath, "utf8");
const newsletterMigrationPath = path.join(
  projectRoot,
  "supabase/migrations/003_newsletter_signups.sql"
);
const newsletterMigrationSql = readFileSync(newsletterMigrationPath, "utf8");
const routeAttemptsMigrationPath = path.join(
  projectRoot,
  "supabase/migrations/004_route_attempts.sql"
);
const routeAttemptsMigrationSql = readFileSync(routeAttemptsMigrationPath, "utf8");
const betaFeedbackMigrationPath = path.join(
  projectRoot,
  "supabase/migrations/005_beta_feedback.sql"
);
const betaFeedbackMigrationSql = readFileSync(betaFeedbackMigrationPath, "utf8");

const requiredTables = [
  "profiles",
  "practice_attempts",
  "question_attempts",
  "mock_attempts",
  "mock_question_attempts",
  "saved_progress",
  "question_bank_items"
];

const userOwnedTables = [
  "profiles",
  "practice_attempts",
  "question_attempts",
  "mock_attempts",
  "mock_question_attempts",
  "saved_progress"
];

test("initial Supabase migration declares required Phase 3 tables", () => {
  for (const table of requiredTables) {
    assert.match(
      migrationSql,
      new RegExp(`create table if not exists public\\.${table}\\b`, "i"),
      `${table} table is missing from migration`
    );
  }
});

test("initial Supabase migration enables RLS on required tables", () => {
  for (const table of requiredTables) {
    assert.match(
      migrationSql,
      new RegExp(`alter table public\\.${table} enable row level security`, "i"),
      `${table} does not enable row level security`
    );
  }
});

test("user-owned Supabase tables scope policies to auth.uid", () => {
  for (const table of userOwnedTables) {
    assert.match(
      migrationSql,
      new RegExp(`on public\\.${table}[\\s\\S]+?auth\\.uid\\(\\)`, "i"),
      `${table} policies do not reference auth.uid()`
    );
  }
});

test("private learner attempt policies isolate parent and child progress rows", () => {
  const privateTables = [
    "practice_attempts",
    "question_attempts",
    "mock_attempts",
    "mock_question_attempts"
  ];

  for (const table of privateTables) {
    assert.match(
      migrationSql,
      new RegExp(
        `create policy "${table}_own_access"[\\s\\S]+?on public\\.${table} for all[\\s\\S]+?using \\(user_id = auth\\.uid\\(\\)\\)[\\s\\S]+?with check \\(user_id = auth\\.uid\\(\\)\\)`,
        "i"
      ),
      `${table} does not isolate rows by auth.uid()`
    );
  }
});

test("question publishing migration aligns question_bank_items statuses", () => {
  assert.match(
    publishingMigrationSql,
    /status\s*=\s*'published'[\s\S]+?where status\s*=\s*'active'/i
  );
  assert.match(
    publishingMigrationSql,
    /check \(status in \('draft', 'published', 'archived'\)\)/i
  );
  assert.match(
    publishingMigrationSql,
    /alter column status set default 'draft'/i
  );
});

test("question bank RLS exposes published reads and admin-only management", () => {
  assert.match(
    publishingMigrationSql,
    /create policy "question_bank_items_published_read"[\s\S]+?using \(status = 'published' or public\.has_admin_role\(\)\)/i
  );
  assert.match(
    publishingMigrationSql,
    /create policy "question_bank_items_admin_manage"[\s\S]+?on public\.question_bank_items for all[\s\S]+?with check \(public\.has_admin_role\(\)\)/i
  );
});

test("question bank admin role helper uses the current profiles.role model", () => {
  assert.match(publishingMigrationSql, /create or replace function public\.has_admin_role\(\)/i);
  assert.match(publishingMigrationSql, /from public\.profiles/i);
  assert.match(publishingMigrationSql, /role = 'admin'/i);
  assert.match(publishingMigrationSql, /auth\.uid\(\)/i);
});

test("newsletter signup migration is narrow public insert only", () => {
  assert.match(
    newsletterMigrationSql,
    /create table if not exists public\.newsletter_signups/i
  );
  assert.match(newsletterMigrationSql, /email text not null/i);
  assert.match(newsletterMigrationSql, /consent_text text not null/i);
  assert.match(newsletterMigrationSql, /consent_version text not null/i);
  assert.match(
    newsletterMigrationSql,
    /alter table public\.newsletter_signups enable row level security/i
  );
  assert.match(
    newsletterMigrationSql,
    /create policy "newsletter_signups_public_insert"[\s\S]+?for insert[\s\S]+?to anon, authenticated/i
  );
  assert.doesNotMatch(newsletterMigrationSql, /for select/i);
});

test("route attempts migration stores dev route runner reviews safely", () => {
  assert.match(
    routeAttemptsMigrationSql,
    /create table if not exists public\.route_attempts/i
  );
  assert.match(routeAttemptsMigrationSql, /user_id uuid references auth\.users\(id\) on delete set null/i);
  assert.match(routeAttemptsMigrationSql, /map_id text/i);
  assert.match(routeAttemptsMigrationSql, /map_version text/i);
  assert.match(routeAttemptsMigrationSql, /exercise_version text/i);
  assert.match(routeAttemptsMigrationSql, /is_legal boolean/i);
  assert.match(routeAttemptsMigrationSql, /violations jsonb/i);
  assert.match(routeAttemptsMigrationSql, /missed_restrictions jsonb/i);
  assert.match(routeAttemptsMigrationSql, /correction_hints jsonb/i);
  assert.match(routeAttemptsMigrationSql, /practice_recommendations jsonb/i);
  assert.match(routeAttemptsMigrationSql, /per_leg_breakdown jsonb not null default '\[\]'::jsonb/i);
  assert.match(routeAttemptsMigrationSql, /review_payload jsonb not null/i);
  assert.match(routeAttemptsMigrationSql, /review_schema_version integer not null default 1/i);
  assert.match(
    routeAttemptsMigrationSql,
    /alter table public\.route_attempts enable row level security/i
  );
});

test("route attempts policies allow dev route-runner read/write access without exposing user-owned rows", () => {
  const selectPolicy = routeAttemptsMigrationSql.match(
    /create policy "route_attempts_select_own_or_admin"[\s\S]+?;/i
  )?.[0] ?? "";

  assert.match(
    routeAttemptsMigrationSql,
    /create policy "route_attempts_insert_dev_or_own"[\s\S]+?to anon, authenticated[\s\S]+?user_id is null[\s\S]+?user_id = auth\.uid\(\)/i
  );
  assert.match(
    selectPolicy,
    /create policy "route_attempts_select_own_or_admin"[\s\S]+?to anon, authenticated[\s\S]+?user_id is null[\s\S]+?user_id = auth\.uid\(\)[\s\S]+?public\.has_admin_role\(\)/i
  );
  assert.match(routeAttemptsMigrationSql, /grant select, insert on public\.route_attempts to anon/i);
});

test("beta feedback migration stores public beta submissions server-side only", () => {
  assert.match(
    betaFeedbackMigrationSql,
    /create table if not exists public\.beta_feedback/i
  );
  assert.match(betaFeedbackMigrationSql, /id uuid primary key default gen_random_uuid\(\)/i);
  assert.match(betaFeedbackMigrationSql, /created_at timestamptz not null default now\(\)/i);
  assert.match(betaFeedbackMigrationSql, /payload jsonb not null/i);
  assert.match(betaFeedbackMigrationSql, /map_id text not null/i);
  assert.match(betaFeedbackMigrationSql, /exercise_id text not null/i);
  assert.match(betaFeedbackMigrationSql, /rating integer not null/i);
  assert.match(betaFeedbackMigrationSql, /feedback_type text not null/i);
  assert.match(betaFeedbackMigrationSql, /check \(rating between 1 and 5\)/i);
  assert.match(
    betaFeedbackMigrationSql,
    /alter table public\.beta_feedback enable row level security/i
  );
  assert.match(betaFeedbackMigrationSql, /revoke all on public\.beta_feedback from anon/i);
  assert.match(betaFeedbackMigrationSql, /revoke all on public\.beta_feedback from authenticated/i);
  assert.doesNotMatch(betaFeedbackMigrationSql, /create policy/i);
  assert.doesNotMatch(betaFeedbackMigrationSql, /grant .*beta_feedback to anon/i);
});

test("Supabase env docs expose only public browser-safe values", () => {
  const envExample = readFileSync(path.join(projectRoot, ".env.example"), "utf8");
  const readme = readFileSync(path.join(projectRoot, "README.md"), "utf8");

  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_ANON_KEY=/);
  assert.doesNotMatch(envExample, /SERVICE_ROLE|service_role/i);
  assert.match(readme, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(readme, /server-only/i);
  assert.match(readme, /Do not use `NEXT_PUBLIC_` for service-role secrets/i);
});

test("frontend Supabase helpers do not reference private server keys", () => {
  const helperFiles = [
    "lib/supabase/browser.ts",
    "lib/supabase/server.ts",
    "lib/supabase/config.ts",
    "lib/supabase/types.ts",
    "lib/supabaseClient.ts"
  ];

  for (const helperFile of helperFiles) {
    const source = readFileSync(path.join(projectRoot, helperFile), "utf8");
    assert.doesNotMatch(source, /SERVICE_ROLE|service_role/i, helperFile);
  }
});

test("seed and app database code do not use service role keys or legacy tables", () => {
  const files = [
    "scripts/seed-question-bank.ts",
    "lib/db/questionRepository.ts",
    "lib/db/questionImportExport.ts",
    "lib/db/practiceAttemptRepository.ts",
    "lib/db/mockAttemptRepository.ts",
    "app/dev/route-runner/routeAttemptStorage.ts",
    "lib/db/progressRepository.ts",
    "app/admin/questions/actions.ts",
    "app/admin/questions/import-export/actions.ts",
    "app/admin/questions/import-export/export/route.ts"
  ];

  for (const file of files) {
    const source = readFileSync(path.join(projectRoot, file), "utf8");
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/i, file);
    assert.doesNotMatch(
      source,
      /\.from\(["'](?:questions|mock_test_attempts|mock_test_answers)["']\)/,
      file
    );
  }

  const seedScript = readFileSync(
    path.join(projectRoot, "scripts/seed-question-bank.ts"),
    "utf8"
  );
  assert.match(seedScript, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(seedScript, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(seedScript, /SUPABASE_SEED_ADMIN_EMAIL/);
  assert.match(seedScript, /SUPABASE_SEED_ADMIN_PASSWORD/);
  assert.doesNotMatch(
    seedScript,
    /\.from\(["'](?:practice_attempts|question_attempts|mock_attempts|mock_question_attempts|saved_progress)["']\)/
  );
});

test("beta feedback service-role usage stays server-only", () => {
  const allowedServerFiles = [
    "app/practice/real-london/betaFeedbackStore.ts",
    "app/practice/real-london/betaFeedbackStore.test.ts"
  ];
  const forbiddenClientFiles = [
    "app/practice/real-london/RealLondonBetaFeedbackForm.tsx",
    "app/practice/real-london/realLondonBetaFeedback.ts",
    "app/practice/real-london/page.tsx",
    "app/beta/page.tsx",
    "app/beta/betaTesterEntry.ts"
  ];

  for (const file of allowedServerFiles) {
    const source = readFileSync(path.join(projectRoot, file), "utf8");
    assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/, file);
  }

  for (const file of forbiddenClientFiles) {
    const source = readFileSync(path.join(projectRoot, file), "utf8");
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/i, file);
  }
});
