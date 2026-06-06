"use client";

import Link from "next/link";
import type { Project, Profile } from "@/types";

// Variants are mostly for the parent grid + intent (owner vs visitor); the
// card body is identical across all three call sites by design.
type Variant = "index" | "dashboard" | "profile";

interface Props {
  project: Project;
  variant?: Variant;
  ownerProfile?: Profile | null;
  /** When true, shows "Manage →" instead of "Join project →" (used in dashboard "Your projects"). */
  isOwner?: boolean;
  /** When provided, hides the join button if the viewer owns the project — defensive default. */
  currentUserId?: string | null;
  /** Latest project_update created_at — when present shows "Updated X ago" instead of "Posted X ago". */
  latestUpdateAt?: string | null;
}

// ── Category buckets — exact values from the design spec ───────────────────
const CAT_BUCKETS = {
  tech:    { bg: "rgba(99,102,241,0.15)",  color: "#818cf8" },
  design:  { bg: "rgba(236,72,153,0.12)",  color: "#f472b6" },
  health:  { bg: "rgba(34,197,94,0.10)",   color: "#4ade80" },
  finance: { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
  other:   { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
} as const;

type Bucket = keyof typeof CAT_BUCKETS;

function bucketFor(category: string): Bucket {
  const c = category.toLowerCase();
  if (/(tech|software|saas|ai|ml|data|dev|edtech|web|mobile|api|infra|platform|sec|cloud)/.test(c)) return "tech";
  if (/(design|ui|ux|creative|brand|art|content)/.test(c)) return "design";
  if (/(health|med|bio|wellness|fitness|mental)/.test(c)) return "health";
  if (/(finance|fintech|crypto|invest|bank|defi|payments?|commerce|retail|market)/.test(c)) return "finance";
  return "other";
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

function stagePalette(stage: string | null | undefined): { color: string; bg: string; border: string; label: string } {
  switch ((stage ?? "").toLowerCase()) {
    case "idea":     return { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.28)",  label: "Idea" };
    case "mvp":      return { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.28)",  label: "Building" };
    case "launched": return { color: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.28)", label: "Live" };
    default:         return { color: "#8b9ab0", bg: "rgba(139,154,176,0.10)", border: "rgba(139,154,176,0.20)", label: stage ? stage.charAt(0).toUpperCase() + stage.slice(1) : "—" };
  }
}

/**
 * "Boğaziçi University" → "BU", "Stanford University" → "SU", "MIT" → "MIT".
 * If the input is already short and uppercase (an acronym), keep it as-is up
 * to 4 chars; otherwise, take the first letter of each word.
 */
function uniInitials(uni: string | null | undefined): string {
  if (!uni) return "";
  const s = uni.trim();
  if (!s) return "";
  if (s.length <= 4 && s === s.toUpperCase()) return s.slice(0, 4);
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase();
  return parts.map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 4);
}

function personInitials(name: string | null | undefined, fallback: string): string {
  const n = (name ?? "").trim();
  if (!n) return fallback.slice(0, 2).toUpperCase();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

// Stable, deterministic avatar tint — non-themed by design (matches existing app).
const AVATAR_PALETTE = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
function avatarTint(seed: string | null | undefined): string {
  const s = seed ?? "x";
  return AVATAR_PALETTE[s.charCodeAt(0) % AVATAR_PALETTE.length];
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
  const catText = (categories.length ? categories : ["Other"]).map((c) => c.toUpperCase()).join(" · ");
  const bucket = CAT_BUCKETS[bucketFor(categories[0] ?? "")];

  const lookingFor = (project.looking_for ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const rolesOpen = lookingFor.length;
  const stage = stagePalette(project.stage);

  const ownerName = ownerProfile?.full_name ?? ownerProfile?.username ?? "";
  const firstName = ownerName.split(/\s+/)[0] || ownerProfile?.username || "—";
  const ownerInitials = personInitials(ownerProfile?.full_name ?? ownerProfile?.username, firstName);
  const uni = uniInitials(ownerProfile?.university);
  const avatarBg = avatarTint(ownerProfile?.id ?? project.owner_id);

  // Owner's own card → "Manage →" goes to detail page (where they can edit/manage).
  // Visitor's card → "Join project →" anchors to the apply modal on the detail page.
  // Defensive: if currentUserId matches owner_id, treat as owner even if prop wasn't set.
  const projectHref = `/projects/${project.id}`;
  const effectiveIsOwner = isOwner || (currentUserId != null && currentUserId === project.owner_id);
  const ctaHref = effectiveIsOwner ? projectHref : `${projectHref}#join`;
  const ctaLabel = effectiveIsOwner ? "Manage →" : "Join project →";

  return (
    <article
      data-variant={variant}
      style={{
        position: "relative",
        // Card background follows the active theme's card gradient.
        background: "var(--gradient-card)",
        // Default border is the subtle theme-aware border; on hover we ramp
        // up to ~40% of the active accent.
        border: "1px solid var(--border-subtle)",
        borderRadius: 16,
        padding: 22,
        cursor: "pointer",
        transition: "border-color 0.18s ease",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 40%, transparent)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
    >
      {/* Stretched-link overlay — makes the entire card clickable.
          Sits BENEATH the join button (z-index 2) but ABOVE static content. */}
      <Link
        href={projectHref}
        aria-label={`Open ${project.title || "project"}`}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          borderRadius: 16,
        }}
      />

      {/* Category badge */}
      <div>
        <span style={{
          display: "inline-block",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: bucket.color,
          background: bucket.bg,
          borderRadius: 6,
          padding: "4px 9px",
        }}>
          {catText}
        </span>
      </div>

      {/* Headline */}
      <h3 style={{
        fontSize: 20,
        fontWeight: 900,
        color: "var(--text-primary)",
        letterSpacing: "-0.6px",
        lineHeight: 1.15,
        margin: 0,
        // Allow up to 2 lines, then ellipsis
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {project.title || "Untitled Project"}
      </h3>

      {/* Sub-headline — italic muted tagline */}
      {project.tagline && (
        <p style={{
          fontSize: 13,
          fontStyle: "italic",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {project.tagline}
        </p>
      )}

      {/* Stage badge + open spots */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
          letterSpacing: "0.04em",
          color: stage.color, background: stage.bg, border: `1px solid ${stage.border}`,
        }}>
          {stage.label}
        </span>
        {rolesOpen > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
            color: "var(--accent-bright)",
            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
          }}>
            {rolesOpen} open {rolesOpen === 1 ? "spot" : "spots"}
          </span>
        )}
      </div>

      {/* Role pills */}
      {lookingFor.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {lookingFor.slice(0, 3).map((role) => (
            <span key={role} style={{
              fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 6,
              color: "#94a3b8",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
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

      {/* Bottom row — owner identity + CTA */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: avatarBg,
            color: "white",
            fontSize: 10,
            fontWeight: 700,
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
            fontSize: 11,
            color: "var(--text-secondary)",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}>
            {firstName}
            {uni && <span style={{ color: "var(--text-muted)" }}> · {uni}</span>}
            {latestUpdateAt
              ? <span style={{ color: "var(--text-muted)" }}> · Updated {timeAgo(latestUpdateAt)}</span>
              : project.created_at
                ? <span style={{ color: "var(--text-muted)" }}> · Posted {timeAgo(project.created_at)}</span>
                : null}
          </div>
        </div>

        <Link
            href={ctaHref}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              zIndex: 2,
              fontSize: 11,
              fontWeight: 700,
              color: "white",
              // Primary CTA: tracks the active theme accent.
              background: "var(--accent)",
              border: "none",
              padding: "7px 14px",
              borderRadius: 8,
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
              boxShadow: "0 2px 8px var(--accent-glow)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "scale(1.04)";
              el.style.boxShadow = "0 6px 18px color-mix(in srgb, var(--accent) 45%, transparent)";
              el.style.background = "var(--accent-bright)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "scale(1)";
              el.style.boxShadow = "0 2px 8px var(--accent-glow)";
              el.style.background = "var(--accent)";
            }}
          >
            {ctaLabel}
          </Link>
      </div>
    </article>
  );
}

