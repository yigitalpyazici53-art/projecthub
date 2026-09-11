"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import SkeletonLoader from "@/components/SkeletonLoader";
import ProjectCard from "@/components/cards/ProjectCard";
import { Reveal } from "@/components/motion/Reveal";
import type { Project, Profile } from "@/types";

export const dynamic = "force-dynamic";

// ── Sub-components ────────────────────────────────────────────────────────────

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
      <div className="empty-state-panel" style={{ maxWidth: 460, width: "100%" }}>
        <div aria-hidden="true" style={{ fontSize: 48, lineHeight: 1, marginBottom: 20 }}>🚀</div>
        <h3 className="font-serif" style={{
          fontSize: 22, fontWeight: 500,
          color: "var(--text-primary)", marginBottom: 10, lineHeight: 1.35,
        }}>
          {filtered
            ? "No projects match those filters."
            : "No projects documented yet."}
        </h3>

        <p style={{
          fontSize: 14, color: "var(--text-secondary)",
          maxWidth: 340, margin: "0 auto 30px", lineHeight: 1.65,
        }}>
          {filtered
            ? "Try adjusting the search or filters — or document your own project and put it on the record."
            : "Be the first to document what you're building. Every project you ship adds to your proof-of-work profile."}
        </p>

        {filtered ? (
          <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {onClearFilters && (
              <button type="button" onClick={onClearFilters} className="btn-secondary">
                Clear filters
              </button>
            )}
            <Link href={authed ? "/projects/new" : "/login?next=/projects/new"} className="btn-primary">
              Add a project
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Link
              href={authed ? "/projects/new" : "/login?next=/projects/new"}
              className="btn-primary"
              style={{ padding: "11px 32px", fontSize: 15 }}
            >
              Add your first project →
            </Link>
            <Link href="/builders" className="u-link" style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Browse builders instead
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const STAGES = ["All", "idea", "mvp", "building", "launched"];

function stageLabel(s: string): string {
  if (s === "All") return "All stages";
  if (s === "mvp") return "MVP";
  if (s === "launched") return "Shipped";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [latestUpdatesMap, setLatestUpdatesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
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

  const categories = [
    "All",
    ...Array.from(new Set(
      projects
        .flatMap((p) => (p.category ?? "").split(",").map((c) => c.trim()))
        .filter(Boolean)
    )).sort(),
  ];

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (p.title ?? "").toLowerCase().includes(q) ||
      (p.tagline ?? "").toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q) ||
      (p.tech_stack ?? "").toLowerCase().includes(q);
    const matchesStage = stageFilter === "All" || p.stage === stageFilter;
    const matchesCategory =
      categoryFilter === "All" ||
      (p.category ?? "").split(",").map((c) => c.trim()).includes(categoryFilter);
    return matchesSearch && matchesStage && matchesCategory;
  });

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1080, margin: "0 auto", paddingTop: 80 }}>

        <Reveal>
          <div style={headerRowStyle}>
            <div>
              <h1 className="font-serif" style={titleStyle}>Projects</h1>
              <p style={mutedStyle}>What student builders are shipping right now.</p>
            </div>
            <Link
              href={authed ? "/projects/new" : "/login?next=/projects/new"}
              className="btn-primary"
              style={{ fontSize: 14, padding: "11px 20px" }}
            >
              + Add a project
            </Link>
          </div>
        </Reveal>

        {!loading && (
          <Reveal delay={0.08}>
            <div style={searchRowStyle}>
              <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  aria-hidden="true"
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.45 }}
                >
                  <circle cx="7" cy="7" r="4.5" stroke="#1A1A18" strokeWidth="1.5" />
                  <path d="M10.5 10.5L13.5 13.5" stroke="#1A1A18" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects…"
                  style={searchInputStyle}
                />
              </div>
              <div style={{ position: "relative", minWidth: 150 }} className="filter-select-wrap">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={selectStyle}
                  aria-label="Filter by category"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === "All" ? "All categories" : c}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ position: "relative", minWidth: 140 }} className="filter-select-wrap">
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  style={selectStyle}
                  aria-label="Filter by stage"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{stageLabel(s)}</option>
                  ))}
                </select>
              </div>
            </div>
          </Reveal>
        )}

        {loading && <SkeletonLoader count={8} columns="repeat(auto-fill, minmax(320px, 1fr))" />}
        {error && <p style={errorStyle}>{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            filtered={projects.length > 0}
            onClearFilters={() => { setSearch(""); setStageFilter("All"); setCategoryFilter("All"); }}
            authed={authed}
          />
        )}

        {!loading && filtered.length > 0 && (
          <Reveal delay={0.16}>
            <div className="project-grid-index">
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
          </Reveal>
        )}
      </div>
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--background)",
  color: "var(--text-primary)",
  padding: "40px 24px",
  position: "relative",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 32,
  flexWrap: "wrap",
};

const titleStyle: React.CSSProperties = {
  fontSize: "clamp(30px, 4vw, 42px)",
  fontWeight: 500,
  color: "var(--text-primary)",
  letterSpacing: "-0.015em",
  marginBottom: 8,
};

const mutedStyle: React.CSSProperties = {
  color: "#6B6B66",
  fontSize: 18,
};

const errorStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  marginBottom: 16,
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#B91C1C",
  fontSize: 13,
};

const searchRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  marginBottom: 32,
  flexWrap: "wrap",
  alignItems: "stretch",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 16px 11px 42px",
  borderRadius: 8,
  background: "#FFFFFF",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "var(--font-sans)",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 8,
  background: "#FFFFFF",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 14,
  fontWeight: 400,
  outline: "none",
  cursor: "pointer",
  boxSizing: "border-box",
  fontFamily: "var(--font-sans)",
};
