export type SupabasePublicEnv = Record<string, string | undefined>;

export function getSupabasePublicConfig(env: SupabasePublicEnv = process.env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return {
    url,
    anonKey
  };
}

export function hasSupabasePublicConfig(
  env: SupabasePublicEnv = process.env
) {
  return Boolean(getSupabasePublicConfig(env));
}
