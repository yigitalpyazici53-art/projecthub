"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import ProjectCard from "@/components/cards/ProjectCard";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import type { Profile, Project } from "@/types";

export type PublicStats = {
  builders: number;
  projects: number;
  shipped: number;
};

export type FeaturedProject = {
  project: Project;
  owner: Profile | null;
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
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 24px",
        background: scrolled ? "rgba(250,250,248,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}
    >
      <div style={{
        maxWidth: 1080, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
      }}>
        <Logo size="md" />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link href="/projects" className="u-link" style={navLinkStyle}>Projects</Link>
            <Link href="/builders" className="u-link" style={navLinkStyle}>Builders</Link>
            <Link href="/login" className="u-link" style={navLinkStyle}>Sign in</Link>
          </div>
          {/* Mobile-only nav links (≤640px) */}
          <div className="mobile-nav-signin" style={{ alignItems: "center", gap: 0 }}>
            <Link href="/projects" style={mobileNavLinkStyle}>Projects</Link>
            <span style={{ color: "var(--text-muted)", fontSize: 10, opacity: 0.5, padding: "0 1px" }}>·</span>
            <Link href="/builders" style={mobileNavLinkStyle}>Builders</Link>
            <span style={{ color: "var(--text-muted)", fontSize: 10, opacity: 0.5, padding: "0 1px" }}>·</span>
            <Link href="/login" style={mobileNavLinkStyle}>Sign in</Link>
          </div>
          <Link href="/signup" className="btn-primary landing-nav-cta" style={{ fontSize: 13, padding: "9px 18px", marginLeft: 10 }}>
            Create your profile
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Profile Preview (hardcoded realistic example) ─────────────────────────────

const PREVIEW_PROJECTS = [
  { title: "StudySync", desc: "AI-powered study group matcher", year: "2026", stage: "shipped" },
  { title: "CampusEats", desc: "Food delivery for dorms", year: "2025", stage: "shipped" },
];

const PREVIEW_SKILLS = [
  { skill: "React", count: 3 },
  { skill: "TypeScript", count: 2 },
  { skill: "PostgreSQL", count: 1 },
];

function ProfilePreview() {
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1.5px solid var(--border)",
      borderRadius: 12,
      padding: "28px",
      maxWidth: 520,
      margin: "0 auto",
      textAlign: "left",
      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: "#F5F5F3", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17, fontWeight: 600, color: "var(--text-secondary)",
        }}>
          ED
        </div>
        <div>
          <div className="font-serif" style={{ fontSize: 20, color: "var(--text-primary)", lineHeight: 1.2 }}>
            Elif Demir
          </div>
          <div className="label-caps" style={{ marginTop: 4 }}>
            Boğaziçi University · Full-stack Developer
          </div>
        </div>
        <span style={{
          marginLeft: "auto",
          fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999,
          color: "#0F6E56", background: "#ECFDF5", whiteSpace: "nowrap",
        }}>
          2 shipped
        </span>
      </div>

      {/* Selected work */}
      <div className="label-caps" style={{ marginBottom: 10 }}>Selected work</div>
      <div style={{ marginBottom: 20 }}>
        {PREVIEW_PROJECTS.map((p, i) => (
          <div key={p.title} style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12,
            padding: "10px 0",
            borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
          }}>
            <div style={{ minWidth: 0 }}>
              <span className="font-serif" style={{ fontSize: 15, color: "var(--text-primary)" }}>{p.title}</span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}> — {p.desc}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{
                fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 999,
                color: "#0F6E56", background: "#ECFDF5",
              }}>
                {p.stage}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.year}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Endorsed skills */}
      <div className="label-caps" style={{ marginBottom: 10 }}>Endorsed skills</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {PREVIEW_SKILLS.map((s) => (
          <span key={s.skill} style={{
            fontSize: 12, fontWeight: 400, padding: "4px 12px", borderRadius: 999,
            color: "var(--text-secondary)", background: "#F5F5F3",
          }}>
            {s.skill} ({s.count})
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Social proof (server-rendered counts, visible in the first viewport) ─────

function ProofLine({ stats }: { stats: PublicStats }) {
  // Zero counts read as anti-proof, so they're left out rather than shown.
  const items = [
    { value: stats.builders, label: "builders" },
    { value: stats.projects, label: "projects" },
    { value: stats.shipped, label: "shipped" },
  ].filter((item) => item.value > 0);
  if (items.length === 0) return null;

  return (
    <p style={{ marginTop: 24, fontSize: 14, color: "var(--text-muted)" }}>
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && <span aria-hidden style={{ margin: "0 10px", opacity: 0.6 }}>·</span>}
          <strong style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.value}</strong> {item.label}
        </span>
      ))}
    </p>
  );
}

// ─── Featured projects ─────────────────────────────────────────────────────────

function FeaturedProjects({ items }: { items: FeaturedProject[] }) {
  if (items.length === 0) return null;

  return (
    <section style={{ padding: "0 24px 120px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <div style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            gap: 16, flexWrap: "wrap", marginBottom: 32,
          }}>
            <div>
              <div className="label-caps" style={{ marginBottom: 12 }}>Featured projects</div>
              <h2 className="font-serif" style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 500,
                letterSpacing: "-0.015em",
                color: "var(--text-primary)",
                margin: 0,
              }}>
                What students are building now.
              </h2>
            </div>
            <Link href="/projects" className="u-link" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              View all projects →
            </Link>
          </div>
        </Reveal>

        <RevealGroup className="landing-featured-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
        }}>
          {items.map(({ project, owner }) => (
            <RevealItem key={project.id} style={{ display: "grid" }}>
              <ProjectCard project={project} ownerProfile={owner} variant="index" />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    num: "1",
    title: "Create your builder profile",
    desc: "Add your skills, university, and links. Your profile is the single page that shows what you can actually do.",
  },
  {
    num: "2",
    title: "Ship and document projects",
    desc: "Post updates as you build. Mark projects as shipped when they're live — your track record grows with every release.",
  },
  {
    num: "3",
    title: "Collect endorsements",
    desc: "Teammates and collaborators verify your skills. Endorsements turn claims into proof.",
  },
];

export default function LandingPage({
  stats,
  featured,
}: {
  stats: PublicStats | null;
  featured: FeaturedProject[];
}) {
  return (
    <>
      <Navbar />

      <main style={{ background: "var(--background)", overflowX: "hidden" }}>

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="hero-section" style={{
          padding: "184px 24px 120px",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <Reveal>
              <h1 className="font-serif" style={{
                fontSize: "clamp(44px, 7vw, 76px)",
                fontWeight: 500,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                marginBottom: 28,
              }}>
                Prove what you build.
              </h1>
            </Reveal>

            <Reveal delay={0.08}>
              <p style={{
                fontSize: 18, color: "var(--text-secondary)",
                lineHeight: 1.65, marginBottom: 40,
                maxWidth: 560, marginLeft: "auto", marginRight: "auto",
              }}>
                The portfolio platform for student builders. Ship projects, collect
                endorsements, share your proof-of-work profile.
              </p>
            </Reveal>

            <Reveal delay={0.16}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
                <Link href="/signup" className="btn-accent">
                  Create your profile
                </Link>
                <Link href="/projects" className="u-link" style={{ fontSize: 15, color: "var(--text-secondary)" }}>
                  Browse projects →
                </Link>
              </div>
              {stats && <ProofLine stats={stats} />}
            </Reveal>
          </div>

          {/* Profile preview */}
          <Reveal delay={0.24} style={{ marginTop: 96, padding: "0 0" }}>
            <div className="label-caps" style={{ marginBottom: 20 }}>What a profile looks like</div>
            <ProfilePreview />
          </Reveal>
        </section>

        {/* ── FEATURED PROJECTS ─────────────────────────────────────── */}
        <FeaturedProjects items={featured} />

        {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
        <section style={{ padding: "0 24px 140px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <Reveal>
              <div className="label-caps" style={{ marginBottom: 12 }}>How it works</div>
              <h2 className="font-serif" style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 500,
                letterSpacing: "-0.015em",
                color: "var(--text-primary)",
                marginBottom: 56,
              }}>
                Three steps to a verified track record.
              </h2>
            </Reveal>

            <RevealGroup style={{ display: "grid", gap: 0 }}>
              {HOW_IT_WORKS.map((step, i) => (
                <RevealItem key={step.num}>
                  <div style={{
                    display: "flex", gap: 28, alignItems: "flex-start",
                    padding: "32px 0",
                    borderTop: i === 0 ? "1px solid var(--border)" : "none",
                    borderBottom: "1px solid var(--border)",
                  }}>
                    <div className="font-serif" style={{
                      fontSize: 28, color: "var(--text-muted)", lineHeight: 1,
                      minWidth: 36, paddingTop: 2,
                    }}>
                      {step.num}
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: 17, fontWeight: 600, color: "var(--text-primary)",
                        marginBottom: 8,
                      }}>
                        {step.title}
                      </h3>
                      <p style={{
                        fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.65,
                        maxWidth: 560, margin: 0,
                      }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* ── CLOSING CTA ───────────────────────────────────────────── */}
        <section style={{ padding: "0 24px 140px", textAlign: "center" }}>
          <Reveal>
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <h2 className="font-serif" style={{
                fontSize: "clamp(26px, 3.5vw, 36px)",
                fontWeight: 500,
                letterSpacing: "-0.015em",
                color: "var(--text-primary)",
                marginBottom: 16,
              }}>
                Your work speaks. Let it.
              </h2>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 32 }}>
                Start your proof-of-work profile today — it takes three minutes.
              </p>
              <Link href="/signup" className="btn-primary" style={{ fontSize: 15, padding: "12px 26px" }}>
                Create your profile →
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <footer style={{
          padding: "40px 24px 48px",
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{
            maxWidth: 1080, margin: "0 auto",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Logo size="sm" />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                © {new Date().getFullYear()}
              </span>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <Link href="/terms" className="u-link" style={footerLinkStyle}>Terms</Link>
              <Link href="/privacy" className="u-link" style={footerLinkStyle}>Privacy</Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="u-link" style={footerLinkStyle}>GitHub</a>
            </div>
          </div>
        </footer>

      </main>

      {/* Responsive styles */}
      <style>{`
        .mobile-nav-signin { display: none !important; }

        @media (max-width: 900px) {
          .landing-featured-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }

        @media (max-width: 640px) {
          .landing-featured-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 768px) {
          .hero-section {
            padding: 140px 20px 80px !important;
          }
        }

        @media (max-width: 640px) {
          .landing-nav-links { display: none !important; }
          .landing-nav-cta   { display: none !important; }
          .mobile-nav-signin { display: flex !important; align-items: center !important; }

          .hero-section {
            padding: 120px 18px 64px !important;
          }
        }
      `}</style>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const navLinkStyle: React.CSSProperties = {
  fontSize: 14, color: "var(--text-secondary)",
  padding: "6px 10px",
  fontFamily: "var(--font-sans)",
  fontWeight: 400,
};

const mobileNavLinkStyle: React.CSSProperties = {
  fontSize: 12, color: "var(--text-secondary)",
  textDecoration: "none", padding: "6px 5px",
  fontFamily: "var(--font-sans)", fontWeight: 400,
};

const footerLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
};
