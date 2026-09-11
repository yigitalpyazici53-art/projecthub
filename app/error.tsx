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
      background: "#FAFAF8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        background: "#FFFFFF",
        border: "1px solid #FECACA",
        borderRadius: 16,
        padding: 36,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 22,
          fontWeight: 700,
          color: "#1A1A18",
          marginBottom: 10,
        }}>
          Something went wrong
        </h2>
        <p style={{ color: "#6B6B66", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          An unexpected error occurred. Try again or go back to the dashboard.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "#1A1A18",
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
              background: "#EFEFEC",
              border: "1px solid #E8E8E4",
              color: "#9B9B94",
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
