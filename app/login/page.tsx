"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Logo from "@/components/Logo";

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

function Spinner() {
  return (
    <svg
      width="16" height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: "spin 0.75s linear infinite", display: "inline-block", verticalAlign: "middle" }}
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    searchParams.get("error") === "oauth_failed"
      ? "Google sign-in failed. Please try again or use email below."
      : searchParams.get("error") === "link_invalid"
      ? "That link has expired or is invalid. Please request a new one."
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    const supabase = createClient();
    const next = searchParams.get("next") ?? "/dashboard";
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError(signInError.message || "Invalid email or password");
      setLoading(false);
      return;
    }

    const next = searchParams.get("next") ?? "/dashboard";
    router.replace(next);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        style={{ ...googleButtonStyle, opacity: googleLoading ? 0.7 : 1, cursor: googleLoading ? "not-allowed" : "pointer" }}
      >
        {googleLoading ? <Spinner /> : GOOGLE_SVG}
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div style={dividerStyle}>
        <span style={dividerLineStyle} />
        <span style={dividerTextStyle}>or continue with email</span>
        <span style={dividerLineStyle} />
      </div>

      <form onSubmit={handleLogin} autoComplete="on" style={formStyle}>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={loading}
            style={{ ...inputStyle, opacity: loading ? 0.6 : 1 }}
          />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <Link href="/forgot-password" style={forgotStyle}>Forgot password?</Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Your password"
            autoComplete="current-password"
            disabled={loading}
            style={{ ...inputStyle, opacity: loading ? 0.6 : 1 }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          style={{
            ...buttonStyle,
            opacity: loading ? 0.85 : 1,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading ? <><Spinner /> Signing in…</> : "Sign in"}
        </button>

        {error && <p style={errorStyle}>{error}</p>}
      </form>
    </>
  );
}

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main style={pageStyle}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(var(--grid-line, rgba(80,120,220,0.04)) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line, rgba(80,120,220,0.04)) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 30%, transparent 100%)",
        }} />
        <div style={{ position: "absolute", top: "10%", left: "20%", width: 500, height: 500, background: "radial-gradient(circle, var(--orb1, rgba(76,142,255,0.09)) 0%, transparent 65%)", animation: "drift 18s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 400, height: 400, background: "radial-gradient(circle, var(--orb2, rgba(139,92,246,0.08)) 0%, transparent 65%)", animation: "drift2 22s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        <Link href="/" style={backLinkStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to home
        </Link>

        <div style={cardStyle} className="auth-card">
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <Logo size="lg" gradient />
            </div>
            <h1 style={titleStyle}>Welcome back</h1>
            <p style={subtitleStyle}>Sign in to your ProjectHub account</p>
          </div>

          <Suspense fallback={
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton-row" style={{ height: 48, borderRadius: 10 }} />)}
            </div>
          }>
            <LoginForm />
          </Suspense>

          <p style={footerStyle}>
            No account?{" "}
            <Link href="/signup" style={linkStyle}>Create one</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "var(--background)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" };
const backLinkStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", marginBottom: 20, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)", transition: "all 0.15s ease", fontFamily: "DM Sans, sans-serif" };
const cardStyle: React.CSSProperties = { width: "100%", background: "var(--gradient-card)", border: "1px solid var(--border-highlight)", borderRadius: 20, padding: 36, boxShadow: "0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 60px rgba(0,0,0,0.55), 0 0 40px color-mix(in srgb, var(--accent) 8%, transparent) inset" };
const titleStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, fontFamily: "Syne, sans-serif" };
const subtitleStyle: React.CSSProperties = { color: "var(--text-secondary)", fontSize: 14 };
const googleButtonStyle: React.CSSProperties = { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 16px", borderRadius: 10, border: "1px solid #e0e0e0", background: "#ffffff", color: "#3c4043", fontWeight: 600, fontSize: 14, fontFamily: "DM Sans, sans-serif", marginBottom: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.12)", transition: "box-shadow 0.18s ease" };
const dividerStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, margin: "20px 0" };
const dividerLineStyle: React.CSSProperties = { flex: 1, height: 1, background: "var(--border)" };
const dividerTextStyle: React.CSSProperties = { fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" };
const formStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" };
const forgotStyle: React.CSSProperties = { fontSize: 12, color: "var(--accent-bright, #7aa8ff)", textDecoration: "none", fontWeight: 500 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(9,14,26,0.9)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease, box-shadow 0.2s ease" };
const buttonStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)", background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "white", fontWeight: 700, fontSize: 14, fontFamily: "Syne, sans-serif", transition: "all 0.18s ease", boxShadow: "0 4px 16px var(--accent-glow)" };
const errorStyle: React.CSSProperties = { padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 13 };
const footerStyle: React.CSSProperties = { marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--text-muted)" };
const linkStyle: React.CSSProperties = { color: "var(--accent-bright, #7aa8ff)", textDecoration: "none", fontWeight: 600 };
