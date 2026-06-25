"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";
import type { Database } from "./types";

let cachedBrowserClient: SupabaseClient<Database> | null = null;

export function createSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  cachedBrowserClient ??= createBrowserClient<Database>(
    config.url,
    config.anonKey
  );

  return cachedBrowserClient;
}
