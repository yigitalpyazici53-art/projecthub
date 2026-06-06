"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import SkeletonLoader from "@/components/SkeletonLoader";
import ProjectCard from "@/components/cards/ProjectCard";
import type { Project, Profile } from "@/types";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCategoryColor(category?: string | null) {
  const cat = (category ?? "").toLowerCase();
  if (cat.includes("design") || cat.includes("ui") || cat.includes("ux") || cat.includes("creative")) {
    return { accent: "#ec4899", badgeBg: "rgba(236,72,153,0.12)", badgeText: "#f9a8d4", badgeBorder: "rgba(236,72,153,0.28)" };
  }
  if (cat.includes("health") || cat.includes("medical") || cat.includes("bio") || cat.includes("wellness")) {
    return { accent: "#10b981", badgeBg: "rgba(16,185,129,0.12)", badgeText: "#6ee7b7", badgeBorder: "rgba(16,185,129,0.28)" };
  }
  if (cat.includes("finance") || cat.includes("fintech") || cat.includes("crypto")) {
    return { accent: "#f59e0b", badgeBg: "rgba(245,158,11,0.12)", badgeText: "#fcd34d", badgeBorder: "rgba(245,158,11,0.28)" };
  }
  return { accent: "#6366f1", badgeBg: "rgba(99,102,241,0.12)", badgeText: "#a5b4fc", badgeBorder: "rgba(99,102,241,0.28)" };
}

function getStageBadge(stage?: string | null): { color: string; bg: string; border: string; label: string } {
  switch (stage) {
    case "idea":
      return { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)", label: "Idea" };
    case "mvp":
      return { color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.3)", label: "MVP" };
    case "building":
      return { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", label: "Building" };
    case "launched":
      return { color: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.3)", label: "Launched" };
    default:
      return { color: "#8b9ab0", bg: "rgba(139,154,176,0.1)", border: "rgba(139,154,176,0.2)", label: stage ?? "" };
  }
}

function timeAgo(dateString?: string | null) {
  if (!dateString) return "";
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
function isNew(dateString?: string | null) {
  if (!dateString) return false;
  return Date.now() - new Date(dateString).getTime() < SEVEN_DAYS;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatPill({ label, value, live, accent }: { label: string; value: number; live?: boolean; accent?: "green" | "amber" | null }) {
  const palette =
    accent === "green"
      ? { color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.22)" }
      : accent === "amber"
      ? { color: "#fcd34d", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.22)" }
      : { color: "#a5b4fc", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.22)" };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "8px 14px", borderRadius: 999,
      background: palette.bg, border: `1px solid ${palette.border}`,
      fontSize: 13, color: "#e2e8f0", fontWeight: 500,
    }}>
      {live && (
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#4ade80", boxShadow: "0 0 0 3px rgba(74,222,128,0.18)",
          flexShrink: 0,
        }} />
      )}
      <span style={{ color: palette.color, fontWeight: 700, fontFamily: "Syne, sans-serif" }}>{value}</span>
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
          background: "radial-gradient(ellipse at top, rgba(99,102,241,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(99,102,241,0.1)",
          border: "1px solid rgba(99,102,241,0.22)",
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
              <path d="M9 21h6" stroke="rgba(165,180,252,0.55)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 3a6 6 0 0 1 6 6c0 2.6-1.6 4.8-3.5 5.7V17a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-2.3C7.6 13.8 6 11.6 6 9a6 6 0 0 1 6-6z"
                stroke="rgba(165,180,252,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <h3 style={{
          fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700,
          color: "#eef2ff", marginBottom: 10, lineHeight: 1.35,
        }}>
          {filtered
            ? "No projects match those filters."
            : "No projects yet. Be the first to post an idea."}
        </h3>

        <p style={{
          fontSize: 14, color: "#6b7280",
          maxWidth: 340, margin: "0 auto 30px", lineHeight: 1.65,
        }}>
          {filtered
            ? "Try adjusting the search or stage filter — or share your own idea so the right team finds it."
            : "Even a one-line pitch pulls in the right collaborators. Post the idea and the team finds you."}
        </p>

        {filtered ? (
          <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {onClearFilters && (
              <button type="button" onClick={onClearFilters} className="btn-secondary">
                Clear filters
              </button>
            )}
            <Link href={authed ? "/projects/new" : "/login?next=/projects/new"} className="btn-primary">
              Create Project
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Link
              href={authed ? "/projects/new" : "/login?next=/projects/new"}
              className="btn-primary"
              style={{ padding: "11px 32px", fontSize: 15 }}
            >
              Create Project →
            </Link>
            <Link href="/builders" style={{ fontSize: 13, color: "#4b5563", textDecoration: "none" }}>
              Browse builders instead
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const STAGES = ["All", "idea", "mvp", "building", "launched"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [latestUpdatesMap, setLatestUpdatesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
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
          .from("projects")
          .select("id, owner_id, title, tagline, description, category, stage, looking_for, tech_stack, created_at, is_ai_generated")
          .order("created_at", { ascending: false });

        if (dbError) { setError(`Could not load projects: ${dbError.message}`); return; }

        const loaded = (data ?? []) as Project[];
        setProjects(loaded);

        const ownerIds = [
          ...new Set(loaded.map((p) => p.owner_id).filter((oid): oid is string => Boolean(oid))),
        ];
        const projectIds = loaded.map((p) => p.id);

        const fetchOwners = ownerIds.length > 0
          ? supabase.from("profiles").select("id, full_name, username, university, avatar_url").in("id", ownerIds)
          : Promise.resolve({ data: [] });

        const fetchUpdates = projectIds.length > 0
          ? supabase.from("project_updates").select("project_id, created_at").in("project_id", projectIds).order("created_at", { ascending: false })
          : Promise.resolve({ data: [] });

        const [profileResult, updatesResult] = await Promise.all([fetchOwners, fetchUpdates]);

        if (profileResult.data) {
          const map: Record<string, Profile> = {};
          (profileResult.data as Profile[]).forEach((p) => { map[p.id] = p; });
          setProfilesMap(map);
        }

        if (updatesResult.data) {
          const latestMap: Record<string, string> = {};
          (updatesResult.data as { project_id: string; created_at: string }[]).forEach((u) => {
            if (!latestMap[u.project_id]) latestMap[u.project_id] = u.created_at;
          });
          setLatestUpdatesMap(latestMap);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unexpected error loading projects.");
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

  const totalProjects = projects.length;
  const openRoles = projects.reduce(
    (acc, p) => acc + (p.looking_for ?? "").split(",").map((s) => s.trim()).filter(Boolean).length,
    0
  );
  const launchedCount = projects.filter((p) => p.stage === "launched").length;
  const newThisWeek = projects.filter((p) => isNew(p.created_at)).length;

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (p.title ?? "").toLowerCase().includes(q) ||
      (p.tagline ?? "").toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q) ||
      (p.tech_stack ?? "").toLowerCase().includes(q);
    const matchesStage = stageFilter === "All" || p.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />
      <div className="page-z" style={{ maxWidth: 1200, margin: "0 auto", paddingTop: "80px" }}>

        <div className="animate-fade-up" style={headerRowStyle}>
          <div>
            <h1 style={titleStyle}>Projects</h1>
            <p style={mutedStyle}>Discover what builders on ProjectHub are creating.</p>
          </div>
          <Link
            href={authed ? "/projects/new" : "/login?next=/projects/new"}
            className="btn-primary"
            style={{ fontSize: 15, padding: "12px 22px", boxShadow: "0 6px 20px color-mix(in srgb, var(--accent) 30%, transparent)" }}
          >
            + Start a project
          </Link>
        </div>

        {!loading && totalProjects > 0 && (
          <div className="animate-fade-up animate-delay-1" style={statsRowStyle}>
            <StatPill label={totalProjects === 1 ? "Project" : "Projects"} value={totalProjects} live />
            {openRoles > 0 && <StatPill label={openRoles === 1 ? "Open role" : "Open roles"} value={openRoles} accent="green" />}
            {launchedCount > 0 && <StatPill label="Launched" value={launchedCount} />}
            {newThisWeek > 0 && <StatPill label="New this week" value={newThisWeek} accent="amber" />}
          </div>
        )}

        {!loading && (
          <div className="animate-fade-up animate-delay-1" style={searchRowStyle}>
            <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                aria-hidden="true"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.4 }}
              >
                <circle cx="7" cy="7" r="4.5" stroke="var(--text-primary, #e2e8f0)" strokeWidth="1.5" />
                <path d="M10.5 10.5L13.5 13.5" stroke="var(--text-primary, #e2e8f0)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects…"
                style={searchInputStyle}
              />
            </div>
            <div style={{ position: "relative", minWidth: 150 }}>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                style={selectStyle}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s} style={optionStyle}>
                    {s === "All" ? "All Stages" : s === "mvp" ? "MVP" : s === "building" ? "Building" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                aria-hidden="true"
                style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.45 }}
              >
                <path d="M2 4L6 8L10 4" stroke="var(--text-primary, #e2e8f0)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        )}

        {loading && <SkeletonLoader count={8} columns="repeat(auto-fill, minmax(320px, 1fr))" />}
        {error && <p className="animate-fade-up animate-delay-1" style={errorStyle}>{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            filtered={projects.length > 0}
            onClearFilters={() => { setSearch(""); setStageFilter("All"); }}
            authed={authed}
          />
        )}

        {!loading && filtered.length > 0 && (
          <div className="animate-fade-up animate-delay-2 project-grid-index">
            {filtered.map((project) => {
              const owner = project.owner_id ? profilesMap[project.owner_id] : null;
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  variant="index"
                  ownerProfile={owner}
                  currentUserId={currentUserId}
                  latestUpdateAt={latestUpdatesMap[project.id] ?? null}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--background)",
  color: "white",
  padding: "40px 24px",
  position: "relative",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 28,
  flexWrap: "wrap",
};

const titleStyle: React.CSSProperties = {
  fontSize: "clamp(28px, 4vw, 42px)",
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  color: "var(--text-primary)",
  letterSpacing: "-0.03em",
  marginBottom: 8,
};

const mutedStyle: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontSize: 15,
};

const errorStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  marginBottom: 16,
  background: "rgba(239,68,68,0.1)",
  border: "1px solid rgba(239,68,68,0.3)",
  color: "#fca5a5",
  fontSize: 13,
};

const statsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginBottom: 18,
  flexWrap: "wrap",
};

const searchRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  marginBottom: 28,
  flexWrap: "wrap",
  alignItems: "stretch",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 16px 11px 42px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.13)",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 36px 11px 14px",
  borderRadius: 10,
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.13)",
  color: "var(--text-primary)",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  boxSizing: "border-box",
};

const optionStyle: React.CSSProperties = {
  background: "#111827",
  color: "#e2e8f0",
};

// `min(260px, 100%)` collapses to 100% on narrow viewports, preventing
// overflow while still keeping 3+ columns on desktop.
const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
  gap: 20,
};

const cardBase: React.CSSProperties = {
  background: "#161b27",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12,
  overflow: "hidden",
  transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
};
