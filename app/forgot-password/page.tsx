"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <main style={pageStyle}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(var(--grid-line, rgba(80,120,220,0.04)) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line, rgba(80,120,220,0.04)) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 30%, transparent 100%)",
        }} />
        <div style={{ position: "absolute", top: "10%", left: "20%", width: 500, height: 500, background: "radial-gradient(circle, var(--orb1, rgba(76,142,255,0.09)) 0%, transparent 65%)", animation: "drift 18s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        <Link href="/login" style={backLinkStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to sign in
        </Link>

        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <Logo size="lg" gradient />
            </div>
            <h1 style={titleStyle}>Reset your password</h1>
            <p style={subtitleStyle}>Enter your email and we&apos;ll send you a reset link</p>
          </div>

          {sent ? (
            <div style={successBoxStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p style={{ color: "#86efac", fontSize: 14, lineHeight: 1.6 }}>
                Check your inbox — we sent a password reset link to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@university.edu"
                  autoComplete="email"
                  style={inputStyle}
                />
              </div>

              {error && <p style={errorStyle}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{ ...buttonStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
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
const backLinkStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
  color: "var(--text-secondary)", textDecoration: "none", marginBottom: 20,
  padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.03)", transition: "all 0.15s ease", fontFamily: "DM Sans, sans-serif",
};
const cardStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--gradient-card)",
  border: "1px solid var(--border-highlight)", borderRadius: 20, padding: 36,
  boxShadow: "0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 60px rgba(0,0,0,0.55), 0 0 40px color-mix(in srgb, var(--accent) 8%, transparent) inset",
};
const titleStyle: React.CSSProperties = {
  fontSize: 24, fontWeight: 700, color: "var(--text-primary)",
  fontFamily: "Syne, sans-serif", marginBottom: 6,
};
const subtitleStyle: React.CSSProperties = { color: "var(--text-secondary)", fontSize: 14 };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px", borderRadius: 10,
  border: "1px solid var(--border)", background: "rgba(9,14,26,0.9)",
  color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box",
};
const errorStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 8,
  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
  color: "#fca5a5", fontSize: 13,
};
const buttonStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px", borderRadius: 10,
  border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
  color: "white", fontWeight: 700, fontSize: 14, fontFamily: "Syne, sans-serif",
  transition: "all 0.18s ease", boxShadow: "0 4px 16px var(--accent-glow)",
};
const successBoxStyle: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: 12,
  padding: "14px 16px", borderRadius: 10,
  background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)",
};
