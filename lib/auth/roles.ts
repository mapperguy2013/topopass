import type { Profile } from "@/lib/auth/session";

export function isAdminProfile(
  profile: Pick<Profile, "role"> | null | undefined
) {
  return profile?.role === "admin";
}
