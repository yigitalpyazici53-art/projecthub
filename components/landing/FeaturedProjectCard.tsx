"use client";

import Link from "next/link";
import type { Profile, Project } from "@/types";
import { stageBadge } from "@/utils/stage";

// Landing-only dark counterpart to components/cards/ProjectCard. The light card
// is shared by /projects, /dashboard and profile pages, so it is left alone.
// The .lp-* classes used here are defined in app/LandingPageClient.tsx.

const STAGE_TINT: Record<string, { color: string; bg: string; border: string }> = {
  launched: { color: "#6EE7B7", bg: "rgba(16,185,129,0.12)", border: "rgba(110,231,183,0.28)" },
  mvp: { color: "#FCD34D", bg: "rgba(245,158,11,0.12)", border: "rgba(252,211,77,0.26)" },
  building: { color: "#FCD34D", bg: "rgba(245,158,11,0.12)", border: "rgba(252,211,77,0.26)" },
  idea: { color: "#C4B5FD", bg: "rgba(139,92,246,0.14)", border: "rgba(196,181,253,0.26)" },
};

const STAGE_FALLBACK = { color: "#CBD5E1", bg: "rgba(148,163,184,0.12)", border: "rgba(203,213,225,0.22)" };

function initials(name: string | null | undefined, fallback: string): string {
  const n = (name ?? "").trim();
  if (!n) return fallback.slice(0, 2).toUpperCase();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

export default function FeaturedProjectCard({
  project,
  owner,
}: {
  project: Project;
  owner: Profile | null;
}) {
  const categories = (project.category ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const lookingFor = (project.looking_for ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const techStack = (project.tech_stack ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  const stage = stageBadge(project.stage);
  const tint = STAGE_TINT[(project.stage ?? "").toLowerCase()] ?? STAGE_FALLBACK;

  const ownerName = owner?.full_name ?? owner?.username ?? "";
  const displayName = ownerName || "—";

  return (
    <article className="lp-card">
      {/* Stretched link — whole card is clickable, CTA sits above it. */}
      <Link href={`/projects/${project.id}`} aria-label={`Open ${project.title || "project"}`} className="lp-card-hit" />

      <div className="lp-card-row">
        {categories.slice(0, 1).map((cat) => (
          <span key={cat} className="lp-pill lp-pill-category">{cat}</span>
        ))}
        <span
          className="lp-pill"
          style={{ color: tint.color, background: tint.bg, border: `1px solid ${tint.border}` }}
        >
          {stage.label}
        </span>
        {project.is_ai_generated && <span className="lp-pill lp-pill-demo">demo</span>}
      </div>

      <h3 className="font-serif lp-card-title">{project.title || "Untitled Project"}</h3>

      {project.tagline && <p className="lp-card-tagline">{project.tagline}</p>}

      {lookingFor.length > 0 && (
        <div className="lp-card-row">
          {lookingFor.slice(0, 2).map((role) => (
            <span key={role} className="lp-pill lp-pill-role">{role}</span>
          ))}
          {lookingFor.length > 2 && <span className="lp-pill-more">+{lookingFor.length - 2}</span>}
        </div>
      )}

      {techStack.length > 0 && (
        <div className="lp-card-row">
          {techStack.slice(0, 3).map((tech) => (
            <span key={tech} className="lp-pill lp-pill-tech">{tech}</span>
          ))}
          {techStack.length > 3 && <span className="lp-pill-more">+{techStack.length - 3}</span>}
        </div>
      )}

      <div className="lp-card-foot">
        <div className="lp-card-owner">
          <span className="lp-avatar">
            {owner?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={owner.avatar_url} alt="" loading="lazy" />
            ) : (
              initials(owner?.full_name ?? owner?.username, displayName)
            )}
          </span>
          <span className="lp-card-owner-name">{displayName}</span>
        </div>
        <span className="lp-card-cta">View project →</span>
      </div>
    </article>
  );
}
