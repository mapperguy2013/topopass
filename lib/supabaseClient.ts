import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/types.ts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type SupabaseEnv = Record<string, string | undefined>;

let cachedClient: SupabaseClient<Database> | null = null;

export function hasSupabaseConfig(env: SupabaseEnv = process.env) {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

export function getSupabaseClient() {
  if (!hasSupabaseConfig()) return null;
  if (cachedClient) return cachedClient;

  cachedClient = createClient<Database>(
    supabaseUrl as string,
    supabaseAnonKey as string
  );

  return cachedClient;
}

export const supabase = getSupabaseClient();
