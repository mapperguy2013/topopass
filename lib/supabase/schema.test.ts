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

test("Supabase env docs expose only public browser-safe values", () => {
  const envExample = readFileSync(path.join(projectRoot, ".env.example"), "utf8");
  const readme = readFileSync(path.join(projectRoot, "README.md"), "utf8");

  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_ANON_KEY=/);
  assert.doesNotMatch(envExample, /SERVICE_ROLE|service_role/i);
  assert.doesNotMatch(readme, /SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/i);
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
