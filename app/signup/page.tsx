"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function SignupPage() {
  const router = useRouter();

  // Form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // OTP state
  const [step, setStep] = useState<"form" | "otp">("form");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  // Supabase email OTP codes are numeric. Default length is 6, but the
  // project admin can configure up to ~10 digits — accept a generous range
  // so we don't block valid codes.
  const MIN_CODE_LEN = 6;
  const MAX_CODE_LEN = 10;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => codeInputRef.current?.focus(), 50);
    }
  }, [step]);

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedName = fullName.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) { setError("Full name is required."); setLoading(false); return; }
    if (!trimmedUsername) { setError("Username is required."); setLoading(false); return; }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) { setError("Username can only contain lowercase letters, numbers, and underscores."); setLoading(false); return; }
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) { setError("Username must be 3–20 characters."); setLoading(false); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); setLoading(false); return; }

    try {
      const supabase = createClient();

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmedUsername)
        .maybeSingle();

      if (existingProfile) { setError("That username is already taken."); setLoading(false); return; }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { shouldCreateUser: true },
      });

      if (otpError) { setError(otpError.message); setLoading(false); return; }

      setStep("otp");
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (raw: string) => {
    // Strip non-digits (Supabase email codes are numeric) and cap length.
    // Handles both typing and paste in one path.
    setCode(raw.replace(/\D/g, "").slice(0, MAX_CODE_LEN));
  };

  const handleVerify = async () => {
    if (code.length < MIN_CODE_LEN) {
      setError(`Please enter your verification code (at least ${MIN_CODE_LEN} digits).`);
      return;
    }
    setError("");
    setVerifying(true);

    const supabase = createClient();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    const trimmedUsername = username.trim().toLowerCase();

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: code,
      type: "email",
    });

    if (verifyError) {
      setError("Invalid code. Please try again.");
      setVerifying(false);
      return;
    }

    // Set password and full_name on the newly created user
    await supabase.auth.updateUser({ password, data: { full_name: trimmedName } });

    // Create profile
    const userId = data.user?.id;
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: trimmedName,
        username: trimmedUsername,
      });
    }

    router.refresh();
    router.push("/dashboard");
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setCode("");
    setResendCooldown(60);
    setTimeout(() => codeInputRef.current?.focus(), 50);
  };

  // ── OTP screen ──────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <main style={pageStyle}>
        <div style={bgWrapStyle}>
          <div style={gridStyle} />
          <div style={orb1Style} />
          <div style={orb2Style} />
        </div>

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
          <button
            type="button"
            onClick={() => { setStep("form"); setCode(""); setError(""); }}
            style={backLinkStyle}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>

          <div style={cardStyle} className="auth-card">
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "color-mix(in srgb, var(--accent) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h1 style={titleStyle}>Check your email</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
                We sent a verification code to<br />
                <strong style={{ color: "var(--text-primary)" }}>{email.trim().toLowerCase()}</strong>
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <input
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={MAX_CODE_LEN}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.length >= MIN_CODE_LEN && !verifying) {
                    e.preventDefault();
                    handleVerify();
                  }
                }}
                placeholder="Enter code"
                aria-label="Verification code"
                style={{
                  width: "100%", height: 56, textAlign: "center",
                  fontSize: 22, fontWeight: 700, letterSpacing: "0.4em",
                  fontFamily: "'DM Sans', sans-serif",
                  borderRadius: 10,
                  border: `1.5px solid ${code ? "var(--accent, #4c8eff)" : "var(--border)"}`,
                  background: "rgba(9,14,26,0.9)", color: "var(--text-primary)",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
              />
            </div>

            {error && <p style={{ ...errorStyle, marginBottom: 16 }}>{error}</p>}

            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || code.length < MIN_CODE_LEN}
              style={{ ...buttonStyle, opacity: (verifying || code.length < MIN_CODE_LEN) ? 0.7 : 1, cursor: (verifying || code.length < MIN_CODE_LEN) ? "not-allowed" : "pointer", marginBottom: 16 }}
            >
              {verifying ? "Verifying…" : "Verify"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              Didn&apos;t get it?{" "}
              {resendCooldown > 0 ? (
                <span style={{ color: "var(--text-muted)" }}>Resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  style={{ background: "none", border: "none", padding: 0, color: "var(--accent-bright, #7aa8ff)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Resend code
                </button>
              )}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Signup form ──────────────────────────────────────────────────────────────
  return (
    <main style={pageStyle}>
      <div style={bgWrapStyle}>
        <div style={gridStyle} />
        <div style={orb1Style} />
        <div style={orb2Style} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        <Link href="/" style={backLinkStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to home
        </Link>

        <div style={cardStyle} className="auth-card">
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <Logo size="lg" gradient />
            </div>
            <h1 style={titleStyle}>Create your account</h1>
            <p style={subtitleStyle}>Connect with builders at your university</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            style={{ ...googleButtonStyle, opacity: googleLoading ? 0.7 : 1, cursor: googleLoading ? "not-allowed" : "pointer" }}
          >
            {GOOGLE_SVG}
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div style={dividerStyle}>
            <span style={dividerLineStyle} />
            <span style={dividerTextStyle}>or continue with email</span>
            <span style={dividerLineStyle} />
          </div>

          <form onSubmit={handleSignup} autoComplete="off" style={formStyle}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Ada Lovelace" autoComplete="off" autoCorrect="off" autoCapitalize="words" spellCheck={false} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="adalovelace" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} style={inputStyle} />
              <p style={hintStyle}>3–20 lowercase letters, numbers, or underscores.</p>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 8 characters" autoComplete="new-password" style={inputStyle} />
            </div>

            <button type="submit" disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Sending code…" : "Create account"}
            </button>

            {error && <p style={errorStyle}>{error}</p>}
          </form>

          <p style={footerStyle}>
            Already have an account?{" "}
            <Link href="/login" style={linkStyle}>Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "var(--background)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" };
const bgWrapStyle: React.CSSProperties = { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" };
const gridStyle: React.CSSProperties = { position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--grid-line, rgba(80,120,220,0.04)) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line, rgba(80,120,220,0.04)) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 30%, transparent 100%)" };
const orb1Style: React.CSSProperties = { position: "absolute", top: "10%", left: "20%", width: 500, height: 500, background: "radial-gradient(circle, var(--orb1, rgba(76,142,255,0.09)) 0%, transparent 65%)", animation: "drift 18s ease-in-out infinite" };
const orb2Style: React.CSSProperties = { position: "absolute", bottom: "10%", right: "15%", width: 400, height: 400, background: "radial-gradient(circle, var(--orb2, rgba(139,92,246,0.08)) 0%, transparent 65%)", animation: "drift2 22s ease-in-out infinite" };
const backLinkStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", marginBottom: 20, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)", transition: "all 0.15s ease", fontFamily: "DM Sans, sans-serif", cursor: "pointer" };
const cardStyle: React.CSSProperties = { width: "100%", background: "var(--gradient-card)", border: "1px solid var(--border-highlight)", borderRadius: 20, padding: 36, boxShadow: "0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 60px rgba(0,0,0,0.55), 0 0 40px color-mix(in srgb, var(--accent) 8%, transparent) inset" };
const titleStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Syne, sans-serif", marginBottom: 6 };
const subtitleStyle: React.CSSProperties = { color: "var(--text-secondary)", fontSize: 14 };
const googleButtonStyle: React.CSSProperties = { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 16px", borderRadius: 10, border: "1px solid #e0e0e0", background: "#ffffff", color: "#3c4043", fontWeight: 600, fontSize: 14, fontFamily: "DM Sans, sans-serif", marginBottom: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.12)", transition: "box-shadow 0.18s ease" };
const dividerStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, margin: "20px 0" };
const dividerLineStyle: React.CSSProperties = { flex: 1, height: 1, background: "var(--border)" };
const dividerTextStyle: React.CSSProperties = { fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" };
const formStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 16 };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(9,14,26,0.9)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease, box-shadow 0.2s ease" };
const hintStyle: React.CSSProperties = { marginTop: 6, fontSize: 12, color: "var(--text-muted)" };
const buttonStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)", background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "white", fontWeight: 700, fontSize: 14, fontFamily: "Syne, sans-serif", transition: "all 0.18s ease", boxShadow: "0 4px 16px var(--accent-glow)" };
const errorStyle: React.CSSProperties = { padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 13 };
const footerStyle: React.CSSProperties = { marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--text-muted)" };
const linkStyle: React.CSSProperties = { color: "var(--accent-bright, #7aa8ff)", textDecoration: "none", fontWeight: 600 };
