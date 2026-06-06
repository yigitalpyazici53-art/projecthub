"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import SkeletonLoader from "@/components/SkeletonLoader";
import { getInitials } from "@/utils/getInitials";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRoleColor(role?: string | null) {
  const r = (role ?? "").toLowerCase();
  if (r.includes("design") || r.includes("ui") || r.includes("ux")) {
    return { accent: "#ec4899", badgeBg: "rgba(236,72,153,0.1)", badgeText: "#f9a8d4", badgeBorder: "rgba(236,72,153,0.25)", avatarBg: "rgba(236,72,153,0.12)", avatarText: "#f9a8d4" };
  }
  if (r.includes("health") || r.includes("medical") || r.includes("bio")) {
    return { accent: "#10b981", badgeBg: "rgba(16,185,129,0.1)", badgeText: "#6ee7b7", badgeBorder: "rgba(16,185,129,0.25)", avatarBg: "rgba(16,185,129,0.12)", avatarText: "#6ee7b7" };
  }
  if (r.includes("market") || r.includes("growth") || r.includes("sales")) {
    return { accent: "#f59e0b", badgeBg: "rgba(245,158,11,0.1)", badgeText: "#fcd34d", badgeBorder: "rgba(245,158,11,0.25)", avatarBg: "rgba(245,158,11,0.12)", avatarText: "#fcd34d" };
  }
  return { accent: "#a855f7", badgeBg: "rgba(168,85,247,0.1)", badgeText: "#d8b4fe", badgeBorder: "rgba(168,85,247,0.25)", avatarBg: "rgba(168,85,247,0.12)", avatarText: "#d8b4fe" };
}

function timeAgo(dateString?: string) {
  if (!dateString) return "";
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
function isNew(dateString?: string) {
  if (!dateString) return false;
  return Date.now() - new Date(dateString).getTime() < SEVEN_DAYS;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatPill({ label, value, live, accent }: { label: string; value: number; live?: boolean; accent?: boolean }) {
  const color = accent ? "#4ade80" : "var(--accent-bright)";
  const bg = accent ? "rgba(74,222,128,0.08)" : "color-mix(in srgb, var(--accent) 8%, transparent)";
  const border = accent ? "rgba(74,222,128,0.22)" : "color-mix(in srgb, var(--accent) 22%, transparent)";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "8px 14px", borderRadius: 999,
      background: bg, border: `1px solid ${border}`,
      fontSize: 13, color: "#e2e8f0", fontWeight: 500,
    }}>
      {live && (
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#4ade80", boxShadow: "0 0 0 3px rgba(74,222,128,0.18)",
          flexShrink: 0,
        }} />
      )}
      <span style={{ color, fontWeight: 700, fontFamily: "Syne, sans-serif" }}>{value}</span>
      <span style={{ color: "#8b9ab0" }}>{label}</span>
    </div>
  );
}

function EmptyState({
  filtered,
  onClearFilters,
  authed,
}: {
  filtered: boolean;
  onClearFilters?: () => void;
  authed: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "52px 24px" }}>
      <div style={{
        maxWidth: 460,
        width: "100%",
        textAlign: "center",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "52px 40px 44px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: "50%",
          transform: "translateX(-50%)",
          width: 320, height: 180,
          background: "radial-gradient(ellipse at top, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "color-mix(in srgb, var(--accent) 10%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px",
        }}>
          {filtered ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="rgba(165,180,252,0.85)" strokeWidth="1.5" />
              <path d="M16.5 16.5L21 21" stroke="rgba(165,180,252,0.85)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 11h6M11 8v6" stroke="rgba(165,180,252,0.55)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="rgba(165,180,252,0.85)" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                stroke="rgba(165,180,252,0.85)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>

        <h3 style={{
          fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700,
          color: "#eef2ff", marginBottom: 10, lineHeight: 1.35,
        }}>
          {filtered
            ? "No builders match those filters."
            : "No builders yet. Complete your profile to be listed."}
        </h3>

        <p style={{
          fontSize: 14, color: "#6b7280",
          maxWidth: 340, margin: "0 auto 30px", lineHeight: 1.65,
        }}>
          {filtered
            ? "Try adjusting the search or role filter — or complete your own profile to show up here."
            : "Founders are actively looking for collaborators. Add your skills and you'll appear in their searches."}
        </p>

        {filtered ? (
          <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {onClearFilters && (
              <button type="button" onClick={onClearFilters} className="btn-secondary">
                Clear filters
              </button>
            )}
            <Link href={authed ? "/profile/edit" : "/login?next=/profile/edit"} className="btn-primary">
              Complete Profile
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Link
              href={authed ? "/profile/edit" : "/login?next=/profile/edit"}
              className="btn-primary"
              style={{ padding: "11px 32px", fontSize: 15 }}
            >
              Complete Profile →
            </Link>
            <Link href="/projects" style={{ fontSize: 13, color: "#4b5563", textDecoration: "none" }}>
              Browse projects instead
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BuildersPage() {
  const [builders, setBuilders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [authed, setAuthed] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session?.user);
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error: dbError } = await supabase
          .from("profiles")
          .select("id, full_name, username, university, role, bio, skills, interests, github_url, avatar_url, created_at, is_ai_generated")
          .order("created_at", { ascending: false });

        if (dbError) {
          setError(`Could not load builders: ${dbError.message}`);
        } else {
          setBuilders((data ?? []) as Profile[]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unexpected error loading builders.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

  const roles = ["All", ...Array.from(new Set(builders.map((b) => b.role).filter(Boolean) as string[]))];

  const totalBuilders = builders.length;
  const universities = new Set(
    builders.map((b) => (b.university ?? "").trim()).filter(Boolean)
  ).size;
  const skillSet = new Set<string>();
  builders.forEach((b) => {
    (b.skills ?? "").split(",").forEach((s) => {
      const t = s.trim();
      if (t) skillSet.add(t.toLowerCase());
    });
  });
  const joinedThisWeek = builders.filter((b) => isNew(b.created_at)).length;

  const filtered = builders.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (b.full_name ?? "").toLowerCase().includes(q) ||
      (b.username ?? "").toLowerCase().includes(q) ||
      (b.role ?? "").toLowerCase().includes(q) ||
      (b.university ?? "").toLowerCase().includes(q) ||
      (b.bio ?? "").toLowerCase().includes(q);
    const matchesRole = roleFilter === "All" || b.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />
      <div className="page-z" style={{ maxWidth: 1200, margin: "0 auto", paddingTop: "80px" }}>

        <div className="animate-fade-up" style={{ marginBottom: 20 }}>
          <h1 style={titleStyle}>Discover Builders</h1>
          <p style={mutedStyle}>Explore student builders and serious collaborators on ProjectHub.</p>
        </div>

        {!loading && totalBuilders > 0 && (
          <div className="animate-fade-up animate-delay-1" style={statsRowStyle}>
            <StatPill label="Builders" value={totalBuilders} live />
            {universities > 0 && <StatPill label={universities === 1 ? "University" : "Universities"} value={universities} />}
            {skillSet.size > 0 && <StatPill label={skillSet.size === 1 ? "Skill" : "Skills"} value={skillSet.size} />}
            {joinedThisWeek > 0 && <StatPill label="Joined this week" value={joinedThisWeek} accent />}
          </div>
        )}

        {!loading && (
          <div className="animate-fade-up animate-delay-1" style={searchRowStyle}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, university…"
              style={searchInputStyle}
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={selectStyle}>
              {roles.map((r) => (
                <option key={r} value={r}>{r === "All" ? "All Roles" : r}</option>
              ))}
            </select>
          </div>
        )}

        {loading && <SkeletonLoader count={6} />}
        {error && <p className="animate-fade-up animate-delay-1" style={errorStyle}>{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            filtered={builders.length > 0}
            onClearFilters={() => { setSearch(""); setRoleFilter("All"); }}
            authed={authed}
          />
        )}

        {!loading && filtered.length > 0 && (
          <div className="animate-fade-up animate-delay-2" style={gridStyle}>
            {filtered.map((builder) => {
              const color = getRoleColor(builder.role);
              const skills = (builder.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);
              const featuredSkills = skills.slice(0, 2);
              const extraSkills = skills.slice(2, 4);

              return (
                <article
                  key={builder.id}
                  style={cardBase}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.setProperty("border-color", "var(--border-highlight)");
                    el.style.transform = "translateY(-2px)";
                    el.style.boxShadow = "0 12px 32px rgba(0,0,0,0.45)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.setProperty("border-color", "var(--border)");
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "none";
                  }}
                >
                  {/* Colored top accent line */}
                  <div style={{ height: 2, background: color.accent, borderRadius: "14px 14px 0 0" }} />

                  <div style={{ padding: "18px 20px 20px" }}>
                    {/* Header: avatar + name + handle */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                        background: color.avatarBg, border: `1px solid ${color.badgeBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontFamily: "Syne, sans-serif", fontWeight: 700, color: color.avatarText,
                        letterSpacing: "0.04em", overflow: "hidden",
                      }}>
                        {builder.avatar_url ? (
                          <img
                            src={builder.avatar_url}
                            alt={builder.full_name || builder.username || "builder"}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                          />
                        ) : (
                          getInitials(builder.full_name, builder.username)
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <h2 style={{ fontSize: 16, fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#f0f4f8", marginBottom: 2, lineHeight: 1.2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            {builder.full_name || builder.username || "Unnamed Builder"}
                            {isNew(builder.created_at) && (
                              <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                                color: "#4ade80", background: "rgba(74,222,128,0.12)",
                                border: "1px solid rgba(74,222,128,0.28)",
                                borderRadius: 4, padding: "2px 6px", textTransform: "uppercase",
                              }}>
                                New
                              </span>
                            )}
                          </h2>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                            {builder.role && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, color: color.badgeText,
                                background: color.badgeBg, border: `1px solid ${color.badgeBorder}`,
                                borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap",
                              }}>
                                {builder.role}
                              </span>
                            )}
                          </div>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>
                          @{builder.username || "no-username"}
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    {builder.bio && (
                      <p style={{ fontSize: 13, color: "#8b9ab0", lineHeight: 1.55, marginBottom: 14 }}>
                        {builder.bio.length > 110 ? builder.bio.slice(0, 110) + "…" : builder.bio}
                      </p>
                    )}

                    {/* Skills pills */}
                    {skills.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                        {featuredSkills.map((s) => (
                          <span key={s} style={{
                            fontSize: 11, fontWeight: 600, color: "var(--accent-bright)",
                            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
                            borderRadius: 6, padding: "3px 9px",
                          }}>
                            {s}
                          </span>
                        ))}
                        {extraSkills.map((s) => (
                          <span key={s} style={{
                            fontSize: 11, fontWeight: 500, color: "#6b7280",
                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 6, padding: "3px 9px",
                          }}>
                            {s}
                          </span>
                        ))}
                        {skills.length > 4 && (
                          <span style={{ fontSize: 11, color: "#4b5563", padding: "3px 4px" }}>+{skills.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Footer: university + action buttons */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                      paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {builder.university && (
                          <div style={{ fontSize: 11, color: "#4a5568", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            🎓 {builder.university}
                          </div>
                        )}
                        {builder.created_at && (
                          <div style={{ fontSize: 11, color: "#374151", marginTop: builder.university ? 2 : 0 }}>
                            Joined {timeAgo(builder.created_at)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <Link
                          href={`/builders/${builder.username || builder.id}`}
                          style={{
                            fontSize: 12, fontWeight: 600, color: "var(--accent-bright)",
                            background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                            borderRadius: 8, padding: "6px 11px", textDecoration: "none",
                            transition: "all 0.15s ease", whiteSpace: "nowrap",
                          }}
                        >
                          View
                        </Link>
                        {currentUserId !== builder.id && (
                          <Link
                            href={
                              authed
                                ? `/builders/${builder.username || builder.id}#connect`
                                : `/login?next=${encodeURIComponent(`/builders/${builder.username || builder.id}`)}`
                            }
                            style={{
                              fontSize: 12, fontWeight: 700, color: "#fff",
                              background: "var(--gradient-brand)",
                              border: "1px solid color-mix(in srgb, var(--accent) 50%, transparent)",
                              borderRadius: 8, padding: "6px 12px", textDecoration: "none",
                              transition: "all 0.15s ease", whiteSpace: "nowrap",
                              boxShadow: "0 2px 10px var(--accent-glow)",
                            }}
                          >
                            Connect →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "var(--background)", color: "white", padding: "40px 24px", position: "relative" };
const titleStyle: React.CSSProperties = { fontSize: "clamp(28px, 4vw, 42px)", fontFamily: "Syne, sans-serif", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8 };
const mutedStyle: React.CSSProperties = { color: "var(--text-secondary)", fontSize: 15, marginBottom: 8 };
const errorStyle: React.CSSProperties = { padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 13 };
const statsRowStyle: React.CSSProperties = { display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" };
const searchRowStyle: React.CSSProperties = { display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" };
const searchInputStyle: React.CSSProperties = { flex: 1, minWidth: 200, padding: "11px 16px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#f0f4f8", fontSize: 14, outline: "none" };
const selectStyle: React.CSSProperties = { padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#f0f4f8", fontSize: 14, outline: "none", cursor: "pointer" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 20 };
const cardBase: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  overflow: "hidden",
  transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
};
