import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { previewQuestionImport } from "../lib/db/questionImportExport.ts";
import type { Database } from "../lib/supabase/types.ts";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");
const seedPath = path.join(projectRoot, "supabase/seed/question_bank_items.json");

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const source = readFileSync(filePath, "utf8");
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;

    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required to seed question_bank_items.`);
  }

  return value;
}

function formatValidationErrors(errors: ReturnType<typeof previewQuestionImport>["errors"]) {
  return errors
    .map((error) => {
      const record = error.index >= 0 ? `record ${error.index + 1}` : "root";
      const id = error.id ? ` (${error.id})` : "";
      return `- ${record}${id} ${error.field}: ${error.message}`;
    })
    .join("\n");
}

async function main() {
  loadEnvFile(path.join(projectRoot, ".env.local"));
  loadEnvFile(path.join(projectRoot, ".env"));

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const adminEmail = requiredEnv("SUPABASE_SEED_ADMIN_EMAIL");
  const adminPassword = requiredEnv("SUPABASE_SEED_ADMIN_PASSWORD");

  const rawSeed = readFileSync(seedPath, "utf8");
  const preview = previewQuestionImport(rawSeed);
  if (preview.errors.length > 0 || preview.validRecords.length === 0) {
    throw new Error(
      `Seed validation failed:\n${formatValidationErrors(preview.errors)}`
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });
  if (authError) {
    throw new Error(`Admin sign-in failed: ${authError.message}`);
  }

  const { error } = await supabase
    .from("question_bank_items")
    .upsert(preview.validRecords, { onConflict: "id" });

  if (error) {
    throw new Error(`Question seed import failed: ${error.message}`);
  }

  console.log(
    `Seeded ${preview.validRecords.length} question_bank_items records from ${path.relative(
      projectRoot,
      seedPath
    )}.`
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
