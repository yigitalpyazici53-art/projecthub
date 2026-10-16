"use client";

import Link from "next/link";
import { cleanList, cleanText } from "@/utils/display";
import type { Profile } from "@/types";

type CompletionProfile = Pick<Profile, "full_name" | "bio" | "skills" | "avatar_url">;

interface Step {
  key: string;
  done: boolean;
  /** Imperative, lower-case: reads after the em dash in the headline. */
  action: string;
  short: string;
  href: string;
}

export function completionSteps(profile: CompletionProfile, projectCount: number): Step[] {
  return [
    // The project comes first: it is what makes a profile worth visiting.
    { key: "project", done: projectCount > 0, action: "add your first project", short: "First project", href: "/projects/new" },
    { key: "name", done: Boolean(cleanText(profile.full_name)), action: "add your name", short: "Name", href: "/profile/edit" },
    { key: "bio", done: Boolean(cleanText(profile.bio)), action: "write a short bio", short: "Bio", href: "/profile/edit" },
    { key: "skills", done: cleanList(profile.skills).length > 0, action: "add your skills", short: "Skills", href: "/profile/edit" },
    { key: "avatar", done: Boolean(cleanText(profile.avatar_url)), action: "add a photo", short: "Photo", href: "/profile/edit" },
  ];
}

/**
 * "Profile 40% complete — add your first project", with links to each
 * missing step. Renders nothing once everything is done.
 */
export default function ProfileCompletion({
  profile,
  projectCount,
  style,
}: {
  profile: CompletionProfile;
  projectCount: number;
  style?: React.CSSProperties;
}) {
  const steps = completionSteps(profile, projectCount);
  const missing = steps.filter((s) => !s.done);
  if (missing.length === 0) return null;

  const pct = Math.round(((steps.length - missing.length) / steps.length) * 100);
  const next = missing[0];

  return (
    <section aria-label="Profile completion" style={{ ...wrapStyle, ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <p style={headlineStyle}>
          Profile {pct}% complete —{" "}
          <Link href={next.href} className="u-link" style={{ color: "var(--accent-purple)" }}>
            {next.action}
          </Link>
        </p>
        <Link href={next.href} className="btn-accent" style={ctaStyle}>
          {next.key === "project" ? "Add project" : "Finish profile"}
        </Link>
      </div>

      <div style={barBgStyle} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ ...barFillStyle, width: `${pct}%` }} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {steps.map((s) =>
          s.done ? (
            <span key={s.key} style={{ ...chipStyle, ...chipDoneStyle }}>✓ {s.short}</span>
          ) : (
            <Link key={s.key} href={s.href} style={chipStyle}>+ {s.short}</Link>
          ),
        )}
      </div>
    </section>
  );
}

const wrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: "16px 18px",
  borderRadius: 12,
  background: "linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(168,85,247,0.06) 100%)",
  border: "1px solid var(--border-highlight)",
};

const headlineStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  color: "var(--text-primary)",
};

const ctaStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "8px 16px",
  borderRadius: 10,
  textDecoration: "none",
};

const barBgStyle: React.CSSProperties = {
  height: 6,
  borderRadius: 999,
  background: "var(--surface-raised)",
  overflow: "hidden",
};

const barFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "var(--gradient-brand)",
  transition: "width 0.3s ease",
};

const chipStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  color: "var(--text-secondary)",
  textDecoration: "none",
};

const chipDoneStyle: React.CSSProperties = {
  color: "var(--accent-green)",
  borderColor: "var(--accent-green-glow)",
  background: "var(--accent-green-glow)",
};
