import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof createSupabaseServerClient>>
>;

export type AuthUser = Awaited<
  ReturnType<SupabaseServerClient["auth"]["getUser"]>
>["data"]["user"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type ProfileResult = {
  profile: Profile | null;
  error: string | null;
};

function buildProfileInsert(
  user: NonNullable<AuthUser>,
  displayName?: string | null
): Database["public"]["Tables"]["profiles"]["Insert"] {
  const metadataDisplayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : null;
  const resolvedDisplayName = displayName?.trim() || metadataDisplayName || null;
  const profileInsert: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: user.id,
    email: user.email ?? null
  };

  if (resolvedDisplayName) {
    profileInsert.display_name = resolvedDisplayName;
  }

  return profileInsert;
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentProfile(userId?: string): Promise<Profile | null> {
  const user = userId ? null : await getCurrentUser();
  const profileUserId = userId ?? user?.id;
  if (!profileUserId) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileUserId)
    .maybeSingle();

  return data as Profile | null;
}

export async function ensureProfileForUser(
  user: NonNullable<AuthUser>,
  displayName?: string | null
): Promise<ProfileResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      profile: null,
      error: "Supabase is not configured for this environment."
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(buildProfileInsert(user, displayName), { onConflict: "id" })
    .select("*")
    .single();

  return {
    profile: data as Profile | null,
    error: error?.message ?? null
  };
}

export async function getOrCreateProfileForUser(
  user: NonNullable<AuthUser>,
  displayName?: string | null
): Promise<ProfileResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      profile: null,
      error: "Supabase is not configured for this environment."
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (data) {
    return {
      profile: data as Profile,
      error: null
    };
  }

  const ensuredProfile = await ensureProfileForUser(user, displayName);

  return {
    profile: ensuredProfile.profile,
    error: ensuredProfile.error ?? error?.message ?? null
  };
}

export async function getCurrentAuthState() {
  const user = await getCurrentUser();
  const profileResult = user ? await getOrCreateProfileForUser(user) : null;

  return {
    user,
    profile: profileResult?.profile ?? null
  };
}

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/auth/log-in?next=${encodeURIComponent(next)}`);
  }

  return user;
}
