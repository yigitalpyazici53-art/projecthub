import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { POLICY_VERSION } from "@/utils/legal";

/**
 * A same-origin path for `next`, or "/dashboard". Rejects "//host" and
 * "/\host" (both protocol-relative in browsers) and anything that resolves
 * to another origin, e.g. after tabs or newlines are stripped.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/dashboard";
  const base = "http://same-origin.invalid";
  try {
    const url = new URL(next, base);
    if (url.origin !== base) return "/dashboard";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/dashboard";
  }
}

/**
 * Where a user should land after signing in.
 *
 * Accounts that haven't confirmed 18+ and the current policies go to
 * /consent first (once per policy version).
 * Anyone whose profile has no onboarding_completed_at is sent to /onboarding
 * once; finishing or skipping it stamps the column. Seed accounts and builders
 * who already had a project were stamped by the migration, so they never see it.
 */
export async function postAuthPath(
  supabase: SupabaseClient<Database>,
  next: string = "/dashboard",
): Promise<string> {
  const safeNext = safeNextPath(next);
  const data = await getMySettings(supabase);
  if (needsConsent(data)) return `/consent?next=${encodeURIComponent(safeNext)}`;
  if (data && !data.is_seed && !data.onboarding_completed_at) return "/onboarding";
  // No profile row yet (trigger lag): onboarding creates nothing, so let the
  // dashboard's own fallback handle it.
  return safeNext;
}

export type MySettings = Database["public"]["Functions"]["my_profile_settings"]["Returns"][number];

/**
 * The signed-in user's owner-only profile fields. These columns aren't
 * readable through the profiles table (other members and visitors can't see
 * them), so they come from a security-definer RPC scoped to auth.uid().
 */
export async function getMySettings(supabase: SupabaseClient<Database>): Promise<MySettings | null> {
  const { data } = await supabase.rpc("my_profile_settings");
  return (Array.isArray(data) ? data[0] : data) ?? null;
}

/** True when a real account hasn't confirmed 18+ and the current policy version. */
export function needsConsent(settings: { is_seed?: boolean; policy_version?: string | null } | null): boolean {
  return Boolean(settings && !settings.is_seed && settings.policy_version !== POLICY_VERSION);
}

/** True when this profile still owes its one-time onboarding visit. */
export function needsOnboarding(profile: { onboarding_completed_at?: string | null; is_seed?: boolean } | null): boolean {
  return Boolean(profile && !profile.is_seed && !profile.onboarding_completed_at);
}

/** Placeholder usernames given to new accounts ("builder-" + 6 random characters). */
export const GENERATED_USERNAME = /^builder-[a-z0-9]{6}$/;

export function generateUsername(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `builder-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}
