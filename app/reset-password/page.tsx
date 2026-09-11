"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Logo from "@/components/Logo";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.replace("/dashboard"), 2500);
  };

  return (
    <main style={pageStyle}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(var(--grid-line, #F5F5F3) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line, #F5F5F3) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 30%, transparent 100%)",
        }} />
        <div style={{ position: "absolute", top: "10%", left: "20%", width: 500, height: 500, background: "radial-gradient(circle, var(--orb1, #F5F5F3) 0%, transparent 65%)", animation: "drift 18s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <Logo size="lg" gradient />
            </div>
            <h1 style={titleStyle}>Set a new password</h1>
            <p style={subtitleStyle}>Choose a strong password for your account</p>
          </div>

          {done ? (
            <div style={successBoxStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p style={{ color: "#0F6E56", fontSize: 14, lineHeight: 1.6 }}>
                Password updated! Redirecting to your dashboard…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Confirm new password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </div>

              {error && <p style={errorStyle}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{ ...buttonStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}

          <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
            <Link href="/login" style={{ color: "var(--accent-bright, #6B6B66)", textDecoration: "none", fontWeight: 600 }}>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh", background: "var(--background)",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  padding: "24px",
};
const cardStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--gradient-card)",
  border: "1px solid var(--border-highlight)", borderRadius: 20, padding: 36,
  boxShadow: "0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 60px rgba(26,26,24,0.4), 0 0 40px color-mix(in srgb, var(--accent) 8%, transparent) inset",
};
const titleStyle: React.CSSProperties = {
  fontSize: 24, fontWeight: 500, color: "var(--text-primary)",
  fontFamily: "var(--font-serif)", marginBottom: 6,
};
const subtitleStyle: React.CSSProperties = { color: "var(--text-secondary)", fontSize: 14 };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px", borderRadius: 10,
  border: "1px solid var(--border)", background: "#FFFFFF",
  color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box",
};
const errorStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 8,
  background: "#FEF2F2", border: "1px solid #FECACA",
  color: "#B91C1C", fontSize: 13,
};
const buttonStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px", borderRadius: 10,
  border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
  background: "#1A1A18",
  color: "white", fontWeight: 700, fontSize: 14, fontFamily: "var(--font-sans)",
  transition: "all 0.18s ease", boxShadow: "0 4px 16px transparent",
};
const successBoxStyle: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: 12,
  padding: "14px 16px", borderRadius: 10,
  background: "#ECFDF5", border: "1px solid #D1FAE5",
};
