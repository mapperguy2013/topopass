import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabasePublicConfig,
  hasSupabasePublicConfig,
  type SupabasePublicEnv
} from "./supabase/config.ts";
import type { Database } from "./supabase/types.ts";

let cachedClient: SupabaseClient<Database> | null = null;

export function hasSupabaseConfig(env?: SupabasePublicEnv) {
  return hasSupabasePublicConfig(env);
}

export function getSupabaseClient() {
  const config = getSupabasePublicConfig();

  if (!config) return null;
  if (cachedClient) return cachedClient;

  cachedClient = createClient<Database>(config.url, config.anonKey);

  return cachedClient;
}

export const supabase = getSupabaseClient();
