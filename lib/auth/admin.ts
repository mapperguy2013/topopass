import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getOrCreateProfileForUser,
  type AuthUser,
  type Profile
} from "@/lib/auth/session";
import { isAdminProfile } from "@/lib/auth/roles";

export type AdminAccessState =
  | {
      status: "signed-out";
      user: null;
      profile: null;
    }
  | {
      status: "missing-profile" | "forbidden" | "admin";
      user: NonNullable<AuthUser>;
      profile: Profile | null;
    };

export async function getAdminAccessState(): Promise<AdminAccessState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      status: "signed-out",
      user: null,
      profile: null
    };
  }

  const { profile } = await getOrCreateProfileForUser(user);

  if (!profile) {
    return {
      status: "missing-profile",
      user,
      profile: null
    };
  }

  if (!isAdminProfile(profile)) {
    return {
      status: "forbidden",
      user,
      profile
    };
  }

  return {
    status: "admin",
    user,
    profile
  };
}

export async function requireAdmin(next = "/admin") {
  const state = await getAdminAccessState();

  if (state.status === "signed-out") {
    redirect(`/auth/log-in?next=${encodeURIComponent(next)}`);
  }

  return state;
}
