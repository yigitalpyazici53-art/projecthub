import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Where a user should land after signing in.
 *
 * Anyone whose profile has no onboarding_completed_at is sent to /onboarding
 * once; finishing or skipping it stamps the column. Seed accounts and builders
 * who already had a project were stamped by the migration, so they never see it.
 */
export async function postAuthPath(
  supabase: SupabaseClient<Database>,
  userId: string,
  next: string = "/dashboard",
): Promise<string> {
  // Only same-site paths; "//host" would be protocol-relative.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed_at, is_seed")
    .eq("id", userId)
    .maybeSingle();
  if (data && !data.is_seed && !data.onboarding_completed_at) return "/onboarding";
  // No profile row yet (trigger lag): onboarding creates nothing, so let the
  // dashboard's own fallback handle it.
  return safeNext;
}

/** True when this profile still owes its one-time onboarding visit. */
export function needsOnboarding(profile: { onboarding_completed_at?: string | null; is_seed?: boolean } | null): boolean {
  return Boolean(profile && !profile.is_seed && !profile.onboarding_completed_at);
}
