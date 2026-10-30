"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";
import { getMySettings, needsConsent } from "@/utils/onboarding";
import { POLICY_VERSION } from "@/utils/legal";

// Pages a signed-in user can open before confirming (the policies themselves,
// the confirmation screen, and the auth flows).
const EXEMPT = ["/consent", "/privacy", "/terms", "/kvkk", "/cookies", "/contact", "/login", "/signup", "/auth", "/reset-password"];

const cacheKey = (uid: string) => `ph_consent_ok:${uid}:${POLICY_VERSION}`;

/**
 * Sends signed-in accounts that haven't confirmed 18+ and the current policy
 * version to /consent once. Covers sessions that were already open when the
 * policies changed; fresh sign-ins are routed there by postAuthPath().
 */
export default function ConsentGate() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user || !pathname) return;
    if (EXEMPT.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    try {
      if (sessionStorage.getItem(cacheKey(user.id))) return;
    } catch { /* storage blocked: just check */ }

    let cancelled = false;
    getMySettings(createClient()).then((settings) => {
      if (cancelled || !settings) return;
      if (needsConsent(settings)) {
        router.replace(`/consent?next=${encodeURIComponent(pathname)}`);
        return;
      }
      try { sessionStorage.setItem(cacheKey(user.id), "1"); } catch { /* ignore */ }
    });
    return () => { cancelled = true; };
  }, [user, pathname, router]);

  return null;
}

export function markConsentOk(uid: string) {
  try { sessionStorage.setItem(cacheKey(uid), "1"); } catch { /* ignore */ }
}
