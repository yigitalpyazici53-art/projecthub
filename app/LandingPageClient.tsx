"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Logo from "@/components/Logo";

export type PublicStats = {
  builders: number;
  projects: number;
  connections: number;
};

// ─── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={scrolled ? "nav-glass" : undefined}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 24px",
        background: scrolled ? undefined : "transparent",
        borderBottom: scrolled ? undefined : "1px solid transparent",
        transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
      }}>
        <Logo size="md" gradient />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link href="/projects" style={navLinkStyle}>Browse</Link>
            <Link href="/builders" style={navLinkStyle}>Builders</Link>
            <Link href="/login" style={navLinkStyle}>Sign in</Link>
          </div>
          {/* Mobile-only nav links (≤640px): Browse · Builders · Sign in */}
          <div className="mobile-nav-signin" style={{ alignItems: "center", gap: 0 }}>
            <Link href="/projects" style={mobileNavLinkStyle}>Browse</Link>
            <span style={{ color: "var(--text-muted)", fontSize: 10, opacity: 0.35, padding: "0 1px" }}>·</span>
            <Link href="/builders" style={mobileNavLinkStyle}>Builders</Link>
            <span style={{ color: "var(--text-muted)", fontSize: 10, opacity: 0.35, padding: "0 1px" }}>·</span>
            <Link href="/login" style={mobileNavLinkStyle}>Sign in</Link>
          </div>
          <Link href="/apply" className="btn-primary landing-nav-cta" style={{ fontSize: 13, padding: "9px 18px", marginLeft: 6 }}>
            Apply Now
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Background ────────────────────────────────────────────────────────────────

function Background() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(80,120,220,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(80,120,220,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 100% 80% at 50% 0%, black 20%, transparent 100%)",
      }} />
      <div className="hero-depth" />
      <div className="bg-orb-1" style={{
        position: "absolute", top: "-10%", left: "10%",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(76,142,255,0.08) 0%, transparent 60%)",
        animation: "drift 28s ease-in-out infinite",
      }} />
      <div className="bg-orb-2" style={{
        position: "absolute", top: "30%", right: "5%",
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)",
        animation: "drift2 32s ease-in-out infinite",
      }} />
    </div>
  );
}

// ─── Hero Mock UI ──────────────────────────────────────────────────────────────

type HeroProject = {
  id: string;
  title: string | null;
  stage: string | null;
  looking_for: string | null;
  is_ai_generated?: boolean;
};

function heroStage(stage: string | null): {
  label: string; color: string; bg: string; border: string;
} {
  switch (stage) {
    case "idea":     return { label: "Idea",     color: "#fbbf24", bg: "rgba(251,191,36,0.13)",  border: "rgba(251,191,36,0.3)"  };
    case "mvp":      return { label: "MVP",      color: "#60a5fa", bg: "rgba(96,165,250,0.13)",  border: "rgba(96,165,250,0.3)"  };
    case "building": return { label: "Building", color: "#a78bfa", bg: "rgba(167,139,250,0.13)", border: "rgba(167,139,250,0.3)" };
    case "launched": return { label: "Launched", color: "#4ade80", bg: "rgba(74,222,128,0.13)",  border: "rgba(74,222,128,0.3)"  };
    default:         return { label: stage ?? "—", color: "#8b9ab0", bg: "rgba(139,154,176,0.1)", border: "rgba(139,154,176,0.2)" };
  }
}

function heroAvatarPalette(stage: string | null): { bg: string; border: string; text: string } {
  switch (stage) {
    case "idea":     return { bg: "rgba(251,191,36,0.14)",  border: "rgba(251,191,36,0.32)",  text: "#fbbf24" };
    case "mvp":      return { bg: "rgba(96,165,250,0.14)",  border: "rgba(96,165,250,0.32)",  text: "#60a5fa" };
    case "building": return { bg: "rgba(167,139,250,0.14)", border: "rgba(167,139,250,0.32)", text: "#a78bfa" };
    case "launched": return { bg: "rgba(74,222,128,0.14)",  border: "rgba(74,222,128,0.32)",  text: "#4ade80" };
    default:         return { bg: "rgba(99,102,241,0.14)",  border: "rgba(99,102,241,0.32)",  text: "#a5b4fc" };
  }
}

// Static demo cards — shown immediately, replaced by real data when available
const DEMO_PROJECTS: HeroProject[] = [
  { id: "d1", title: "OfficeHours", stage: "idea", looking_for: "Full-stack Developer, UX Designer", is_ai_generated: true },
  { id: "d2", title: "Trckr", stage: "mvp", looking_for: "iOS Developer, ML Engineer", is_ai_generated: true },
  { id: "d3", title: "Lecture.fm", stage: "launched", looking_for: "ML Engineer", is_ai_generated: true },
];

// ─── Mobile Project Preview ────────────────────────────────────────────────

function MobileProjectPreview() {
  const [project, setProject] = useState<HeroProject>(DEMO_PROJECTS[0]);

  useEffect(() => {
    createClient()
      .from("projects")
      .select("id, title, stage, looking_for, is_ai_generated")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setProject(data[0] as HeroProject);
      });
  }, []);

  const stg = heroStage(project.stage);
  const avatar = heroAvatarPalette(project.stage);
  const initial = (project.title ?? "?")[0].toUpperCase();
  const firstRole = (project.looking_for ?? "")
    .split(",")[0].trim().split(" ").slice(0, 2).join(" ");

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <div className="mobile-preview-card" style={{
        position: "relative",
        background: "linear-gradient(145deg, rgba(9,14,26,0.86), rgba(14,22,40,0.80))",
        border: "1px solid rgba(99,102,241,0.13)",
        borderRadius: 14,
        padding: "14px 16px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.04) inset",
        overflow: "hidden",
      }}>
        {/* Ambient glow */}
        <div className="mobile-preview-glow" style={{
          position: "absolute", top: -32, right: -32,
          width: 120, height: 120,
          background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Single project card */}
        <Link href={`/projects/${project.id}`} style={{
          display: "flex", alignItems: "flex-start", gap: 11,
          textDecoration: "none", position: "relative",
        }}>
          {/* Avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: avatar.bg, border: `1px solid ${avatar.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: avatar.text,
            fontFamily: "Syne, sans-serif", marginTop: 1,
          }}>
            {initial}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title + stage badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: "var(--text-primary)",
                fontFamily: "DM Sans, sans-serif",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                flex: 1, minWidth: 0,
              }}>
                {project.title}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                background: stg.bg, border: `1px solid ${stg.border}`,
                color: stg.color, flexShrink: 0, letterSpacing: "0.03em",
              }}>
                {stg.label}
              </div>
            </div>

            {/* Role chip + recency */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {firstRole && (
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  padding: "2px 7px", borderRadius: 5,
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.15)",
                  color: "#a5b4fc", fontFamily: "DM Sans, sans-serif",
                  whiteSpace: "nowrap",
                }}>
                  {firstRole}
                </span>
              )}
              <span style={{
                fontSize: 10, color: "var(--text-muted)",
                fontFamily: "DM Sans, sans-serif", opacity: 0.7,
              }}>
                Recently posted
              </span>
            </div>
          </div>
        </Link>

        {/* View all — subtle, below card */}
        <Link href="/projects" style={{
          display: "block", fontSize: 10, color: "var(--text-muted)",
          textDecoration: "none", paddingTop: 11, paddingLeft: 45,
          opacity: 0.5, transition: "opacity 0.18s ease",
          fontFamily: "DM Sans, sans-serif", position: "relative",
        }} onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.85";
        }} onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.5";
        }}>
          View all projects →
        </Link>
      </div>
    </div>
  );
}

function HeroMockUI() {
  const [projects, setProjects] = useState<HeroProject[]>(DEMO_PROJECTS);

  useEffect(() => {
    createClient()
      .from("projects")
      .select("id, title, stage, looking_for, is_ai_generated")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data && data.length > 0) setProjects(data as HeroProject[]);
      });
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 540, margin: "0 auto" }}>
      {/* Glow behind mock */}
      <div style={{
        position: "absolute", inset: "-20px",
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(76,142,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Mock browser chrome */}
      <div style={{
        background: "linear-gradient(145deg, rgba(9,14,26,0.98), rgba(14,22,40,0.96))",
        border: "1px solid rgba(80,120,220,0.25)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(76,142,255,0.08)",
        animation: "float 6s ease-in-out infinite",
      }}>
        {/* Browser top bar */}
        <div style={{
          padding: "10px 16px",
          background: "rgba(255,255,255,0.02)",
          borderBottom: "1px solid rgba(80,120,220,0.12)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#ef4444", "#f59e0b", "#22c55e"].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
          </div>
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 6,
            padding: "3px 10px", fontSize: 11, color: "var(--text-muted)",
            fontFamily: "DM Sans, sans-serif",
          }}>
            projecthub.app/projects
          </div>
        </div>

        {/* Mock content */}
        <div style={{ padding: "18px 18px 14px" }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Syne, sans-serif" }}>
                Latest Projects
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {projects.length} active · looking for teammates
              </div>
            </div>
            <Link
              href="/projects/new"
              style={{
                fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8,
                background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                color: "white", textDecoration: "none",
              }}
            >
              Share Build
            </Link>
          </div>

          {/* Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {projects.map((p) => {
              const stg = heroStage(p.stage);
              const avatar = heroAvatarPalette(p.stage);
              const initial = (p.title ?? "?")[0].toUpperCase();
              const skills = (p.looking_for ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 2);

              return (
                <div key={p.id} style={{
                  background: "rgba(255,255,255,0.028)",
                  border: "1px solid rgba(80,120,220,0.13)",
                  borderRadius: 10, padding: "11px 13px",
                }}>
                  {/* Top row: avatar + title + stage badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: skills.length ? 8 : 0 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: avatar.bg, border: `1px solid ${avatar.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: avatar.text,
                      fontFamily: "Syne, sans-serif",
                    }}>
                      {initial}
                    </div>
                    <div style={{
                      flex: 1, minWidth: 0,
                      fontSize: 12, fontWeight: 600,
                      color: "#e2e8f0", fontFamily: "DM Sans, sans-serif",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {p.title}
                    </div>
                    <div style={{
                      fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                      background: stg.bg, border: `1px solid ${stg.border}`,
                      color: stg.color, flexShrink: 0, letterSpacing: "0.02em",
                    }}>
                      {stg.label}
                    </div>
                  </div>

                  {/* Skills row + demo badge */}
                  {(skills.length > 0 || p.is_ai_generated) && (
                    <div style={{ display: "flex", gap: 5, paddingLeft: 40, flexWrap: "wrap", alignItems: "center" }}>
                      {skills.map((skill) => (
                        <span key={skill} style={{
                          fontSize: 9, fontWeight: 500, padding: "2px 7px", borderRadius: 5,
                          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                          color: "#a5b4fc", whiteSpace: "nowrap",
                        }}>
                          {skill}
                        </span>
                      ))}
                      {p.is_ai_generated && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                          background: "rgba(139,154,176,0.07)", border: "1px solid rgba(139,154,176,0.18)",
                          color: "#64748b", whiteSpace: "nowrap", letterSpacing: "0.03em",
                        }}>
                          Demo
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Link
            href="/projects"
            style={{
              display: "block", fontSize: 10, color: "var(--text-muted)",
              textAlign: "center", paddingTop: 10, textDecoration: "none",
            }}
          >
            View all projects →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Active Projects Section ──────────────────────────────────────────────────

type ActiveProject = {
  id: string;
  title: string | null;
  stage: string | null;
  looking_for: string | null;
  category: string | null;
  created_at: string | null;
  is_ai_generated?: boolean;
};

const DEMO_ACTIVE: ActiveProject[] = [
  { id: "p1", title: "OfficeHours", stage: "mvp", looking_for: "Full-stack Developer, UX Designer", category: "EdTech", created_at: null, is_ai_generated: true },
  { id: "p2", title: "Trckr", stage: "building", looking_for: "iOS Developer, ML Engineer", category: "Productivity", created_at: null, is_ai_generated: true },
  { id: "p3", title: "Lecture.fm", stage: "launched", looking_for: "ML Engineer, Growth", category: "AI", created_at: null, is_ai_generated: true },
];

function ActiveProjectsSection() {
  const [projects, setProjects] = useState<ActiveProject[]>(DEMO_ACTIVE);

  useEffect(() => {
    createClient()
      .from("projects")
      .select("id, title, stage, looking_for, category, created_at, is_ai_generated")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const withRoles = (data as ActiveProject[]).filter(
            (p) => p.looking_for && p.looking_for.trim().length > 0
          );
          if (withRoles.length > 0) setProjects(withRoles.slice(0, 3));
        }
      });
  }, []);

  return (
    <section
      className="landing-content-section"
      style={{
        padding: "110px 24px",
        background: "linear-gradient(180deg, transparent 0%, rgba(76,142,255,0.03) 50%, transparent 100%)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 48,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={sectionLabelStyle}>This Week</div>
            <h2 style={{ ...sectionTitleStyle, marginBottom: 10 }}>
              Projects looking for serious teammates
            </h2>
            <p style={{ ...sectionSubStyle, margin: 0 }}>
              Active projects with open roles — updated as builders ship.
            </p>
          </div>
          <Link
            href="/projects"
            className="btn-secondary"
            style={{ fontSize: 14, padding: "10px 20px", whiteSpace: "nowrap" }}
          >
            View all projects →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
            gap: 20,
          }}
        >
          {projects.map((project) => {
            const stg = heroStage(project.stage);
            const avatar = heroAvatarPalette(project.stage);
            const roles = (project.looking_for ?? "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            const initial = (project.title ?? "?")[0].toUpperCase();
            const href = project.is_ai_generated
              ? "/projects"
              : `/projects/${project.id}`;

            return (
              <Link key={project.id} href={href} style={{ textDecoration: "none" }}>
                <div
                  className="polished-feature-card"
                  style={{
                    background: "linear-gradient(145deg, rgba(9,14,26,0.9), rgba(14,22,40,0.8))",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: "24px",
                    height: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: avatar.bg,
                        border: `1px solid ${avatar.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: avatar.text,
                        fontFamily: "Syne, sans-serif",
                      }}
                    >
                      {initial}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          fontFamily: "Syne, sans-serif",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {project.title}
                      </div>
                      {project.category && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {project.category}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: 999,
                        background: stg.bg,
                        border: `1px solid ${stg.border}`,
                        color: stg.color,
                        flexShrink: 0,
                      }}
                    >
                      {stg.label}
                    </div>
                  </div>

                  {/* Open roles */}
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Looking for
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {roles.slice(0, 3).map((role) => (
                        <span
                          key={role}
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            padding: "3px 9px",
                            borderRadius: 6,
                            background: "rgba(74,222,128,0.07)",
                            border: "1px solid rgba(74,222,128,0.18)",
                            color: "#4ade80",
                          }}
                        >
                          {role}
                        </span>
                      ))}
                      {roles.length > 3 && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "3px 4px" }}>
                          +{roles.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 12,
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      marginTop: "auto",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(74,222,128,0.08)",
                        border: "1px solid rgba(74,222,128,0.2)",
                        color: "#4ade80",
                      }}
                    >
                      Actively Looking
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--accent-bright)",
                        fontWeight: 600,
                        fontFamily: "DM Sans, sans-serif",
                      }}
                    >
                      View project →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage({ stats }: { stats: PublicStats | null }) {
  return (
    <>
      <Background />
      <Navbar />

      <main style={{ position: "relative", zIndex: 1, overflowX: "hidden" }}>

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          padding: "120px 24px 80px",
        }} className="hero-section">
          <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 80 }} className="hero-inner">

            {/* Left copy */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: "clamp(40px, 5.2vw, 64px)",
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: "-0.035em",
                color: "var(--text-primary)",
                marginBottom: 24,
              }}>
                Find your team.{" "}
                <span style={{
                  background: "var(--gradient-brand)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  Show what you're building.
                </span>
              </h1>

              <p style={{
                fontSize: 18, color: "var(--text-secondary)",
                lineHeight: 1.7, marginBottom: 22,
                maxWidth: 500,
                fontFamily: "DM Sans, sans-serif",
              }}>
                A curated network for serious student builders to showcase real projects, find teammates, and build proof-of-work through what they actually ship.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }} className="hero-cta-group">
                <Link href="/apply" className="btn-primary hero-cta-btn" style={{ fontSize: 15, padding: "13px 28px" }}>
                  Join the first 100 builders →
                </Link>
                <Link href="/projects" className="btn-secondary hero-browse-btn" style={{ fontSize: 15, padding: "12px 24px" }}>
                  Browse real projects
                </Link>
                {/* Mobile-only text link replaces the ghost button */}
                <Link href="/projects" className="hero-browse-link">
                  Browse real projects →
                </Link>
              </div>

              {stats && (stats.builders > 0 || stats.projects > 0) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                    background: "#4ade80",
                    boxShadow: "0 0 0 3px rgba(74,222,128,0.18)",
                    display: "inline-block",
                  }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "DM Sans, sans-serif" }}>
                    <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{stats.builders}</strong>
                    {" builders · "}
                    <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{stats.projects}</strong>
                    {" projects and counting"}
                  </span>
                </div>
              )}

              {/* Mobile project preview */}
              <div style={{ marginTop: 20 }} className="hero-mobile-preview">
                <MobileProjectPreview />
              </div>
            </div>

            {/* Right mock UI */}
            <div style={{ flex: "0 0 auto", width: "min(540px, 48%)" }} className="hero-mock">
              <HeroMockUI />
            </div>
          </div>
        </section>

        <div className="section-divider" />

        {/* ── PROBLEM ───────────────────────────────────────────────── */}
        <section className="landing-content-section" style={{ padding: "110px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <div style={sectionLabelStyle}>The Problem</div>
            <h2 style={sectionTitleStyle}>Great ideas die alone.</h2>
            <p style={sectionSubStyle}>
              Most student startups fail before they even start — not because the idea is bad, but because the founder couldn't find the right people to build with.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20, marginTop: 56, textAlign: "left",
            }}>
              {[
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  ),
                  color: "#ef4444",
                  bg: "rgba(239,68,68,0.08)",
                  border: "rgba(239,68,68,0.2)",
                  title: "No technical teammate",
                  desc: "You have the vision and market insight, but can't build the product. Finding a serious technical teammate who actually ships is nearly impossible.",
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  color: "#f59e0b",
                  bg: "rgba(245,158,11,0.08)",
                  border: "rgba(245,158,11,0.2)",
                  title: "Hard to find serious people",
                  desc: "Campus clubs are social. Reddit is chaotic. The motivated builders — the ones who actually show up — are scattered and hard to reach.",
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  ),
                  color: "#8b5cf6",
                  bg: "rgba(139,92,246,0.08)",
                  border: "rgba(139,92,246,0.2)",
                  title: "Wrong tools, wrong context",
                  desc: "LinkedIn is for jobs. Discord is for gaming communities. Neither is built for the moment when you want to turn an idea into a startup team.",
                },
              ].map((p, i) => (
                <div key={i} className="polished-feature-card" style={{
                  background: "linear-gradient(145deg, rgba(9,14,26,0.9), rgba(14,22,40,0.8))",
                  border: `1px solid ${p.border}`,
                  borderRadius: 16, padding: "28px",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: p.bg, border: `1px solid ${p.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: p.color, marginBottom: 18,
                  }}>
                    {p.icon}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Syne, sans-serif", marginBottom: 10 }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    {p.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider" />

        {/* ── SOLUTION ──────────────────────────────────────────────── */}
        <section className="landing-content-section" style={{
          padding: "110px 24px",
          background: "linear-gradient(180deg, transparent 0%, rgba(76,142,255,0.03) 50%, transparent 100%)",
        }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <div style={sectionLabelStyle}>The Fix</div>
            <h2 style={sectionTitleStyle}>Proof-of-work, not promises.</h2>
            <p style={sectionSubStyle}>
              ProjectHub is built for builders who ship. Every profile shows real projects. Every project shows weekly progress.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20, marginTop: 56,
            }}>
              {[
                {
                  icon: "⚡",
                  title: "Showcase what you ship",
                  desc: "Post your project with stage, stack, and weekly updates. Let the work speak for itself — not your resume.",
                  color: "#4c8eff",
                },
                {
                  icon: "🎯",
                  title: "Find serious teammates",
                  desc: "Profiles show what people actually build, not their LinkedIn headline. Filter by role, stack, and what they want to work on.",
                  color: "#8b5cf6",
                },
                {
                  icon: "🚀",
                  title: "Build credibility over time",
                  desc: "Weekly updates accumulate into a proof-of-work track record. Builders who ship consistently get noticed.",
                  color: "#22d3ee",
                },
              ].map((s, i) => (
                <div key={i} className="polished-feature-card" style={{
                  background: "linear-gradient(145deg, rgba(9,14,26,0.9), rgba(14,22,40,0.8))",
                  border: "1px solid var(--border)",
                  borderRadius: 16, padding: "32px 28px",
                  textAlign: "left",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 16 }}>{s.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Syne, sans-serif", marginBottom: 10 }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider" />

        {/* ── FIRST 100 BUILDERS ────────────────────────────────────── */}
        <section
          className="landing-content-section"
          style={{
            padding: "110px 24px",
            background: "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.04) 50%, transparent 100%)",
          }}
        >
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <div style={sectionLabelStyle}>Early Access</div>
            <h2 style={sectionTitleStyle}>
              Join the first 100 serious student builders
            </h2>
            <p style={sectionSubStyle}>
              We&apos;re curating the first batch of real student builders shipping AI,
              software, hackathon, and startup projects.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginTop: 52,
                textAlign: "left",
              }}
            >
              {[
                {
                  icon: "🏗️",
                  title: "Showcase real projects",
                  desc: "Post your project with stage, tech stack, and weekly shipping updates.",
                  color: "#4c8eff",
                },
                {
                  icon: "🎯",
                  title: "Find serious teammates",
                  desc: "Connect with builders who have a track record of shipping, not just intentions.",
                  color: "#8b5cf6",
                },
                {
                  icon: "📅",
                  title: "Post weekly shipping updates",
                  desc: "Build a proof-of-work timeline that shows consistent progress over time.",
                  color: "#22d3ee",
                },
                {
                  icon: "⭐",
                  title: "Get featured as an early builder",
                  desc: "Early members shape what ProjectHub becomes — and get featured in the network directory.",
                  color: "#4ade80",
                },
              ].map((b, i) => (
                <div
                  key={i}
                  className="polished-feature-card"
                  style={{
                    background: "linear-gradient(145deg, rgba(9,14,26,0.9), rgba(14,22,40,0.8))",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: "28px 24px",
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 14 }}>{b.icon}</div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      fontFamily: "Syne, sans-serif",
                      marginBottom: 8,
                    }}
                  >
                    {b.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                    }}
                  >
                    {b.desc}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 48,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <Link
                href="/apply"
                className="btn-primary"
                style={{ fontSize: 15, padding: "14px 32px" }}
              >
                Apply to join the first 100 →
              </Link>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  fontFamily: "DM Sans, sans-serif",
                  maxWidth: 440,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Every early application is reviewed manually so ProjectHub stays
                focused on real builders, not empty profiles.
              </p>
            </div>
          </div>
        </section>

        <div className="section-divider" />

        {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
        <section className="landing-content-section" style={{ padding: "110px 24px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={sectionLabelStyle}>How It Works</div>
              <h2 style={sectionTitleStyle}>From idea to team in days.</h2>
              <p style={sectionSubStyle}>Three steps. No fluff.</p>
            </div>

            <div style={{ display: "flex", gap: 0, alignItems: "stretch", flexWrap: "wrap" }}>
              {[
                {
                  num: "01",
                  title: "Create your profile",
                  desc: "Tell the community who you are, what you build, and what kind of startup you want to work on. Takes 3 minutes.",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  ),
                  color: "#4c8eff",
                  bg: "rgba(76,142,255,0.08)",
                  border: "rgba(76,142,255,0.18)",
                },
                {
                  num: "02",
                  title: "Post your real project",
                  desc: "Describe what you're building, your current stage, and the exact roles you're looking for. Ship weekly updates to build credibility.",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  ),
                  color: "#8b5cf6",
                  bg: "rgba(139,92,246,0.08)",
                  border: "rgba(139,92,246,0.18)",
                },
                {
                  num: "03",
                  title: "Apply and get building",
                  desc: "Browse real projects, apply with your proof of work, and connect with serious builders who actually ship.",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  color: "#22d3ee",
                  bg: "rgba(34,211,238,0.08)",
                  border: "rgba(34,211,238,0.18)",
                },
              ].map((step, i) => (
                <div key={i} style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "stretch" }}>
                  <div className="how-it-works-card" style={{
                    flex: 1,
                    background: "linear-gradient(145deg, rgba(9,14,26,0.9), rgba(14,22,40,0.8))",
                    border: "1px solid var(--border)",
                    borderRadius: 20, padding: "36px 28px",
                    position: "relative",
                    margin: "0 8px",
                  }}>
                    {/* Step number */}
                    <div style={{
                      fontSize: 11, fontWeight: 800, color: step.color,
                      fontFamily: "Syne, sans-serif", letterSpacing: "0.08em",
                      marginBottom: 20, opacity: 0.8,
                    }}>
                      STEP {step.num}
                    </div>

                    {/* Icon */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: step.bg, border: `1px solid ${step.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: step.color, marginBottom: 20,
                    }}>
                      {step.icon}
                    </div>

                    <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Syne, sans-serif", marginBottom: 12 }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                      {step.desc}
                    </div>

                    {/* Arrow connector (not last) */}
                    {i < 2 && (
                      <div className="how-it-works-arrow" style={{
                        position: "absolute", right: -24, top: "50%", transform: "translateY(-50%)",
                        zIndex: 2, color: "var(--text-muted)",
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider" />

        {/* ── FEATURES ──────────────────────────────────────────────── */}
        <section className="landing-content-section" style={{
          padding: "110px 24px",
          background: "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.03) 50%, transparent 100%)",
        }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={sectionLabelStyle}>Features</div>
              <h2 style={sectionTitleStyle}>Built for builders.</h2>
              <p style={sectionSubStyle}>Everything you need to go from idea to founding team.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
              {[
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ),
                  color: "#4c8eff",
                  title: "Skill-based matching",
                  desc: "Filter builders by tech stack, role, and startup interest — not job title.",
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.53 2 2 0 0 1 3.6 1.36h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1-1.06a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  ),
                  color: "#8b5cf6",
                  title: "Built for students and builders",
                  desc: "A focused space for student founders and early-stage builders — no recruiters, no spam, just people shipping things.",
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  ),
                  color: "#22d3ee",
                  title: "Public project pages",
                  desc: "Each idea gets its own page you can share. Attract builders, build credibility, show traction.",
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  ),
                  color: "#4ade80",
                  title: "Direct connections",
                  desc: "No middlemen. Reach out to any builder or post owner directly and start building.",
                },
              ].map((f, i) => (
                <div key={i} className="card-base" style={{ padding: "28px" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `color-mix(in srgb, ${f.color} 10%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${f.color} 20%, transparent)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: f.color, marginBottom: 18,
                  }}>
                    {f.icon}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Syne, sans-serif", marginBottom: 10 }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    {f.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider" />

        {/* ── ACTIVE PROJECTS ───────────────────────────────────────── */}
        <ActiveProjectsSection />

        <div className="section-divider" />

        {/* ── FINAL CTA ─────────────────────────────────────────────── */}
        <section className="landing-content-section landing-cta-section" style={{ padding: "110px 24px 128px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <div className="cta-card" style={{
              background: "linear-gradient(145deg, rgba(9,14,26,0.98), rgba(14,22,40,0.95))",
              padding: "72px 48px",
              position: "relative",
            }}>
              {/* Glow */}
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(76,142,255,0.08) 0%, transparent 70%)",
                pointerEvents: "none", borderRadius: 24,
              }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "var(--accent-bright)",
                  marginBottom: 20,
                }}>
                  Early access
                </div>

                <h2 style={{
                  fontSize: "clamp(28px, 4vw, 44px)",
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                  marginBottom: 16,
                }}>
                  Join the first 100 builders.
                </h2>

                <p style={{
                  fontSize: 16, color: "var(--text-secondary)",
                  lineHeight: 1.65, marginBottom: 36,
                  fontFamily: "DM Sans, sans-serif",
                }}>
                  ProjectHub is early and curated. The builders who join now shape what this becomes.
                  Show your work. Find your team. Ship something real.
                </p>

                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/apply" className="btn-primary" style={{ fontSize: 15, padding: "14px 32px" }}>
                    Apply to join the first 100 →
                  </Link>
                  <Link href="/projects" className="btn-secondary" style={{ fontSize: 15, padding: "13px 24px" }}>
                    Browse real projects
                  </Link>
                </div>

                <div style={{ marginTop: 28, fontSize: 12, color: "var(--text-muted)" }}>
                  Curated · Free for builders · No recruiters
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <footer style={{
          padding: "48px 24px 56px",
          borderTop: "1px solid var(--border-subtle)",
        }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            flexWrap: "wrap", gap: 32,
          }}>
            <div style={{ maxWidth: 320 }}>
              <div style={{ marginBottom: 8 }}>
                <Logo size="md" gradient />
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "DM Sans, sans-serif", lineHeight: 1.6, marginBottom: 10 }}>
                A curated network for serious student builders. Find your team. Ship real projects. Build proof-of-work.
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}>
                © {new Date().getFullYear()} ProjectHub
              </div>
            </div>

            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--text-muted)",
                  fontFamily: "Syne, sans-serif", marginBottom: 4,
                }}>
                  Product
                </div>
                <Link href="/projects" className="footer-link-real">Browse projects</Link>
                <Link href="/builders" className="footer-link-real">Browse builders</Link>
                <Link href="/signup" className="footer-link-real">Sign up</Link>
                <Link href="/login" className="footer-link-real">Sign in</Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--text-muted)",
                  fontFamily: "Syne, sans-serif", marginBottom: 4,
                }}>
                  Legal
                </div>
                <Link href="/privacy" className="footer-link-real">Privacy</Link>
                <Link href="/terms" className="footer-link-real">Terms</Link>
                <Link href="/contact" className="footer-link-real">Contact</Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--text-muted)",
                  fontFamily: "Syne, sans-serif", marginBottom: 4,
                }}>
                  Contact
                </div>
                <a href="mailto:yigitalpyazici53@gmail.com" className="footer-link-real">yigitalpyazici53@gmail.com</a>
              </div>
            </div>
          </div>
        </footer>

      </main>

      {/* Responsive styles */}
      <style>{`
        /* ── Preview card animations ─────────────────────────────── */
        .mobile-preview-card {
          animation: float 8s ease-in-out infinite;
        }

        .mobile-preview-glow {
          animation: drift2 16s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .mobile-preview-card,
          .mobile-preview-glow,
          .bg-orb-1,
          .bg-orb-2 { animation: none !important; }
        }

        /* ── Elements hidden on desktop, shown on mobile ─────────── */
        .mobile-nav-signin { display: none !important; }
        .hero-browse-link  { display: none !important; }

        /* ── Mobile hero (≤768px) ────────────────────────────────── */
        @media (max-width: 768px) {
          .hero-mock         { display: none !important; }
          .how-it-works-arrow { display: none !important; }

          .hero-section {
            min-height: auto !important;
            padding: 72px 22px 44px !important;
          }

          .hero-inner {
            flex-direction: column !important;
            gap: 0 !important;
          }

          .hero-section h1 {
            font-size: clamp(28px, 7vw, 42px) !important;
            line-height: 1.06 !important;
            letter-spacing: -0.038em !important;
            margin-bottom: 16px !important;
          }

          .hero-section p {
            font-size: 15px !important;
            line-height: 1.64 !important;
            margin-bottom: 20px !important;
          }

          /* Primary CTA: compact, centered, not full-width */
          .hero-cta-group {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
            margin-bottom: 18px !important;
          }

          .hero-cta-group .btn-primary {
            width: auto !important;
            min-width: 210px !important;
            max-width: 260px !important;
            font-size: 13px !important;
            padding: 10px 20px !important;
            box-shadow: 0 4px 16px rgba(76,142,255,0.2), 0 1px 0 rgba(255,255,255,0.1) inset !important;
          }

          /* Hide ghost button, show text link */
          .hero-browse-btn  { display: none !important; }
          .hero-browse-link {
            display: inline-block !important;
            font-size: 12px !important;
            color: var(--text-muted) !important;
            text-decoration: none !important;
            font-family: "DM Sans", sans-serif !important;
            opacity: 0.7 !important;
            transition: opacity 0.15s ease !important;
            padding: 8px 0 !important;
          }
          .hero-browse-link:hover { opacity: 1 !important; }

          .hero-mobile-preview {
            display: block !important;
            margin-top: 20px !important;
            max-width: 330px !important;
          }
        }

        @media (min-width: 769px) {
          .hero-mobile-preview { display: none !important; }
        }

        /* ── Small phones (≤640px) ───────────────────────────────── */
        @media (max-width: 640px) {
          /* Swap nav CTA → minimal text links on mobile */
          .landing-nav-links { display: none !important; }
          .landing-nav-cta   { display: none !important; }
          .mobile-nav-signin { display: flex !important; align-items: center !important; }

          .hero-section {
            padding: 60px 18px 36px !important;
          }

          .hero-section h1 {
            font-size: clamp(24px, 7.5vw, 36px) !important;
            line-height: 1.07 !important;
            letter-spacing: -0.04em !important;
            margin-bottom: 13px !important;
          }

          .hero-section p {
            font-size: 14px !important;
            margin-bottom: 18px !important;
            line-height: 1.62 !important;
          }

          .hero-cta-group {
            gap: 9px !important;
            margin-bottom: 16px !important;
          }

          .hero-cta-group .btn-primary {
            min-width: 190px !important;
            font-size: 12.5px !important;
            padding: 9px 18px !important;
          }

          .hero-mobile-preview {
            margin-top: 18px !important;
            max-width: 310px !important;
          }
        }

        @media (max-width: 480px) {
          .hero-section {
            padding: 54px 16px 30px !important;
          }

          .hero-section h1 {
            font-size: clamp(22px, 7vw, 32px) !important;
            margin-bottom: 11px !important;
          }

          .hero-section p {
            font-size: 13.5px !important;
            margin-bottom: 15px !important;
          }

          .hero-mobile-preview {
            max-width: 290px !important;
          }
        }

        /* Fix 2: Landing content sections — reduce vertical padding on mobile */
        @media (max-width: 768px) {
          .landing-content-section {
            padding-top: 60px !important;
            padding-bottom: 60px !important;
            padding-left: 22px !important;
            padding-right: 22px !important;
          }
          .landing-cta-section {
            padding-bottom: 80px !important;
          }
          /* Fix 3: CTA card inner padding */
          .cta-card {
            padding: 40px 28px !important;
          }
        }
        @media (max-width: 480px) {
          .landing-content-section {
            padding-top: 48px !important;
            padding-bottom: 48px !important;
          }
          .cta-card {
            padding: 32px 20px !important;
          }
        }
      `}</style>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const navLinkStyle: React.CSSProperties = {
  fontSize: 14, color: "var(--text-secondary)",
  textDecoration: "none", padding: "6px 10px",
  borderRadius: 8, fontFamily: "DM Sans, sans-serif",
  fontWeight: 500, transition: "color 0.15s ease",
};

const mobileNavLinkStyle: React.CSSProperties = {
  fontSize: 12, color: "var(--text-secondary)",
  textDecoration: "none", padding: "6px 5px",
  fontFamily: "DM Sans, sans-serif", fontWeight: 500,
};

const sectionLabelStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--accent)",
  background: "rgba(76,142,255,0.08)",
  border: "1px solid rgba(76,142,255,0.18)",
  borderRadius: 999, padding: "4px 14px",
  marginBottom: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "clamp(28px, 3.5vw, 44px)",
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
  color: "var(--text-primary)",
  marginBottom: 16,
};

const sectionSubStyle: React.CSSProperties = {
  fontSize: 16,
  color: "var(--text-secondary)",
  lineHeight: 1.65,
  maxWidth: 540,
  margin: "0 auto",
  fontFamily: "DM Sans, sans-serif",
};

