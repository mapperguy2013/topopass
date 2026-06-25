export type SupabasePublicEnv = Record<string, string | undefined>;

export const publicSupabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ""
};

function normalizeSupabasePublicConfig(
  url: string | undefined,
  anonKey: string | undefined
) {
  const normalizedUrl = url?.trim() ?? "";
  const normalizedAnonKey = anonKey?.trim() ?? "";

  if (!normalizedUrl || !normalizedAnonKey) {
    return null;
  }

  return {
    url: normalizedUrl,
    anonKey: normalizedAnonKey
  };
}

export function getSupabasePublicConfig(env?: SupabasePublicEnv) {
  if (env) {
    return normalizeSupabasePublicConfig(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return normalizeSupabasePublicConfig(
    publicSupabaseConfig.url,
    publicSupabaseConfig.anonKey
  );
}

export function hasSupabasePublicConfig(env?: SupabasePublicEnv) {
  return Boolean(getSupabasePublicConfig(env));
}
