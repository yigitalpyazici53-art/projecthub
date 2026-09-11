"use client";

import Link from "next/link";
import type { Project, Profile } from "@/types";
import { stageBadge } from "@/utils/stage";
import { categoryBadge } from "@/utils/category";

// Variants are mostly for the parent grid + intent (owner vs visitor); the
// card body is identical across all three call sites by design.
type Variant = "index" | "dashboard" | "profile";

interface Props {
  project: Project;
  variant?: Variant;
  ownerProfile?: Profile | null;
  /** When true, shows "Manage →" instead of "View project →" (used in dashboard "Your projects"). */
  isOwner?: boolean;
  /** When provided, hides the join button if the viewer owns the project — defensive default. */
  currentUserId?: string | null;
  /** Latest project_update created_at — when present shows "Updated X ago" instead of "Posted X ago". */
  latestUpdateAt?: string | null;
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 2592000)}mo ago`;
}

function personInitials(name: string | null | undefined, fallback: string): string {
  const n = (name ?? "").trim();
  if (!n) return fallback.slice(0, 2).toUpperCase();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

export default function ProjectCard({
  project,
  variant = "index",
  ownerProfile,
  isOwner = false,
  currentUserId,
  latestUpdateAt,
}: Props) {
  const categories = (project.category ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const lookingFor = (project.looking_for ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const techStack = (project.tech_stack ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const stage = stageBadge(project.stage);

  const ownerName = ownerProfile?.full_name ?? ownerProfile?.username ?? "";
  const displayName = ownerName || "—";
  const ownerInitials = personInitials(ownerProfile?.full_name ?? ownerProfile?.username, displayName);

  const projectHref = `/projects/${project.id}`;
  const effectiveIsOwner = isOwner || (currentUserId != null && currentUserId === project.owner_id);
  const ctaHref = effectiveIsOwner ? projectHref : `${projectHref}#join`;
  const ctaLabel = effectiveIsOwner ? "Manage →" : "View project →";

  return (
    <article
      data-variant={variant}
      className="card-lift"
      style={{
        position: "relative",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 24,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Stretched-link overlay — makes the entire card clickable.
          Sits BENEATH the CTA link (z-index 2) but ABOVE static content. */}
      <Link
        href={projectHref}
        aria-label={`Open ${project.title || "project"}`}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          borderRadius: 12,
        }}
      />

      {/* Category + stage */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {categories.slice(0, 2).map((cat) => {
          const tint = categoryBadge(cat);
          return (
            <span key={cat} style={{
              fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999,
              color: tint.color, background: tint.bg,
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              {cat}
            </span>
          );
        })}
        <span style={{
          fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999,
          color: stage.color, background: stage.bg, letterSpacing: "0.02em",
        }}>
          {stage.label}
        </span>
        {project.is_ai_generated && (
          <span style={{
            fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999,
            color: "var(--text-muted)", background: "var(--surface-raised)",
          }}>
            demo
          </span>
        )}
      </div>

      {/* Headline — Fraunces */}
      <h3 className="font-serif" style={{
        fontSize: 20,
        fontWeight: 500,
        color: "var(--text-primary)",
        lineHeight: 1.25,
        margin: 0,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {project.title || "Untitled Project"}
      </h3>

      {/* Tagline */}
      {project.tagline && (
        <p style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          lineHeight: 1.55,
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {project.tagline}
        </p>
      )}

      {/* Looking-for pills — the quiet green family */}
      {lookingFor.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {lookingFor.slice(0, 3).map((role) => (
            <span key={role} style={{
              fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 999,
              color: "var(--accent-green)",
              background: "var(--accent-green-glow)",
            }}>
              {role}
            </span>
          ))}
          {lookingFor.length > 3 && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "3px 4px" }}>
              +{lookingFor.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Tech stack pills */}
      {techStack.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {techStack.slice(0, 4).map((tech) => (
            <span key={tech} style={{
              fontSize: 11, fontWeight: 400, padding: "3px 9px", borderRadius: 6,
              color: "var(--text-secondary)",
              background: "var(--surface-raised)",
            }}>
              {tech}
            </span>
          ))}
          {techStack.length > 4 && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "3px 4px" }}>
              +{techStack.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Bottom row — owner identity + CTA */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginTop: "auto",
        paddingTop: 12,
        borderTop: "1px solid var(--border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            fontSize: 10,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {ownerProfile?.avatar_url ? (
              <img
                src={ownerProfile.avatar_url}
                alt=""
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              ownerInitials
            )}
          </div>
          <div style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            fontWeight: 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}>
            {displayName}
            {latestUpdateAt
              ? <span style={{ color: "var(--text-muted)" }}> · Updated {timeAgo(latestUpdateAt)}</span>
              : project.created_at
                ? <span style={{ color: "var(--text-muted)" }}> · {timeAgo(project.created_at)}</span>
                : null}
          </div>
        </div>

        <Link
          href={ctaHref}
          onClick={(e) => e.stopPropagation()}
          className="u-link"
          style={{
            position: "relative",
            zIndex: 2,
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
