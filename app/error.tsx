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
      background: "var(--background)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        background: "var(--surface)",
        border: "1px solid var(--danger-border)",
        borderRadius: 16,
        padding: 36,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 10,
        }}>
          Something went wrong
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          An unexpected error occurred. Try again or go back to the dashboard.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "var(--accent)",
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
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
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
