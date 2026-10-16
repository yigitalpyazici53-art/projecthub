"use client";

import { useState } from "react";
import { profileUrl, shortProfileUrl } from "@/utils/profileUrl";

/**
 * Owner-only "Share your profile" block: copy the link, post it on LinkedIn,
 * or paste a one-line portfolio entry into a CV.
 */
export default function ShareProfile({ username }: { username: string }) {
  const [copied, setCopied] = useState<"link" | "cv" | null>(null);

  const url = profileUrl(username);
  const cvLine = `Portfolio: ${shortProfileUrl(username)}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const copy = async (text: string, which: "link" | "cv") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 2000);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the text
      // stays visible and selectable either way.
    }
  };

  return (
    <section aria-labelledby="share-profile-title" style={wrapStyle}>
      <h2 id="share-profile-title" className="label-caps" style={{ margin: 0 }}>Share your profile</h2>
      <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
        Your profile is a live portfolio. Put the link anywhere people judge your work.
      </p>

      {/* Link + copy */}
      <div style={rowStyle}>
        <code style={fieldStyle} title={url}>{url.replace(/^https?:\/\//, "")}</code>
        <button type="button" onClick={() => copy(url, "link")} className="btn-secondary" style={btnStyle}>
          {copied === "link" ? "Copied ✓" : "Copy link"}
        </button>
      </div>

      {/* LinkedIn */}
      <a href={linkedInHref} target="_blank" rel="noopener noreferrer" style={linkedInStyle}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.554V9h3.565v11.452z" />
        </svg>
        Add to LinkedIn
      </a>

      {/* CV line */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Add to your CV / resume</span>
        <div style={rowStyle}>
          <code style={fieldStyle}>{cvLine}</code>
          <button type="button" onClick={() => copy(cvLine, "cv")} className="btn-secondary" style={btnStyle}>
            {copied === "cv" ? "Copied ✓" : "Copy"}
          </button>
        </div>
      </div>
    </section>
  );
}

const wrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: 24,
  borderRadius: 12,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  marginBottom: 16,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "stretch",
  flexWrap: "wrap",
};

const fieldStyle: React.CSSProperties = {
  flex: "1 1 220px",
  minWidth: 0,
  padding: "10px 12px",
  borderRadius: 8,
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  userSelect: "all",
};

const btnStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "8px 16px",
};

const linkedInStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  alignSelf: "flex-start",
  padding: "9px 16px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  color: "#FFFFFF",
  background: "#0A66C2",
  textDecoration: "none",
};
