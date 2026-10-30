"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ConsentCheckboxes, { consentComplete, type ConsentState } from "@/components/ConsentCheckboxes";
import { markConsentOk } from "@/components/ConsentGate";
import DeleteAccount from "@/components/DeleteAccount";
import { postAuthPath } from "@/utils/onboarding";
import { POLICY_VERSION } from "@/utils/legal";

// One-time confirmation for accounts that haven't confirmed 18+ and the
// current policies (existing users, Google sign-ups, and every account again
// after a policy version bump).

export default function ConsentPage() {
  return (
    <Suspense fallback={null}>
      <ConsentInner />
    </Suspense>
  );
}

function ConsentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [consent, setConsent] = useState<ConsentState>({ age: false, policies: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [underage, setUnderage] = useState(false);

  const next = searchParams.get("next") ?? "/dashboard";

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent("/consent")}`);
  }, [loading, user, router]);

  const handleContinue = async () => {
    if (!user || !consentComplete(consent) || saving) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.rpc("record_consent", { p_version: POLICY_VERSION, p_source: "reconsent" });
    if (err) { setError(`Could not save: ${err.message}`); setSaving(false); return; }
    markConsentOk(user.id);
    router.replace(await postAuthPath(supabase, next));
  };

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    window.location.assign("/");
  };

  if (!user) return <main style={pageStyle} />;

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        {underage ? (
          <>
            <h1 style={titleStyle}>ProjectHub is for people aged 18 and over</h1>
            <p style={textStyle}>
              Thanks for telling us. Because you&apos;re under 18, you can&apos;t keep a ProjectHub account.
              Please delete your account below; it removes your profile, projects, messages and everything else
              linked to it. If you&apos;d rather we do it, email us and we&apos;ll delete it for you.
            </p>
            <div style={{ marginTop: 20 }}>
              <DeleteAccount userId={user.id} startOpen />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setUnderage(false)} style={secondaryBtn}>← I answered by mistake</button>
              <button type="button" onClick={handleSignOut} style={secondaryBtn}>Sign out</button>
            </div>
          </>
        ) : (
          <>
            <h1 style={titleStyle}>Before you continue</h1>
            <p style={textStyle}>
              ProjectHub is only for people aged 18 and over, and we&apos;ve updated our Privacy Policy, Terms of
              Service and KVKK Information Notice. Please confirm the following once to keep using your account.
            </p>
            <div style={{ margin: "20px 0" }}>
              <ConsentCheckboxes value={consent} onChange={setConsent} />
            </div>
            {error && <p style={{ ...textStyle, color: "var(--danger)" }}>{error}</p>}
            <button
              type="button"
              onClick={handleContinue}
              disabled={!consentComplete(consent) || saving}
              className="btn-accent"
              style={{ width: "100%", padding: "13px 20px", fontSize: 14, opacity: !consentComplete(consent) || saving ? 0.5 : 1 }}
            >
              {saving ? "Saving…" : "Continue"}
            </button>
            <button type="button" onClick={() => setUnderage(true)} style={{ ...linkBtn, marginTop: 16 }}>
              I&apos;m under 18
            </button>
          </>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center",
  padding: "110px 16px 48px", background: "var(--background)",
};
const cardStyle: React.CSSProperties = {
  width: "100%", maxWidth: 520, background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 16, padding: "32px 28px",
};
const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 26, color: "var(--text-primary)", marginBottom: 12,
};
const textStyle: React.CSSProperties = { fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 };
const secondaryBtn: React.CSSProperties = {
  padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)",
  color: "var(--text-primary)", fontSize: 13, fontWeight: 500, cursor: "pointer",
};
const linkBtn: React.CSSProperties = {
  display: "block", margin: "0 auto", background: "none", border: "none", color: "var(--text-muted)",
  fontSize: 13, textDecoration: "underline", cursor: "pointer",
};
