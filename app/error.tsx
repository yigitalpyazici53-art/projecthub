"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f1117",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        background: "#161b27",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 16,
        padding: 36,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{
          fontFamily: "Syne, sans-serif",
          fontSize: 22,
          fontWeight: 700,
          color: "#f0f4f8",
          marginBottom: 10,
        }}>
          Something went wrong
        </h2>
        <p style={{ color: "#8b9ab0", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          An unexpected error occurred. Try again or go back to the dashboard.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "#6366f1",
              border: "none",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/dashboard"
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#d1d5db",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
