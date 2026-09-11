"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import Logo from "@/components/Logo";
import FeaturedProjectCard from "@/components/landing/FeaturedProjectCard";
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

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Motion primitives (all transform/opacity, so they stay on the GPU) ───────

function FadeIn({
  children,
  delay = 0,
  y = 24,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

function StaggerGroup({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={style}
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const reduced = useReducedMotion();
  if (reduced) return <div style={style}>{children}</div>;
  return <motion.div variants={staggerChild} style={style}>{children}</motion.div>;
}

/**
 * Counts up to `value` when scrolled into view. Unlike the shared CountUp, the
 * initial state is the final number, so server HTML (and a no-JS visitor)
 * carries the real count instead of a zero.
 */
function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || reduced) return;
    const duration = 1100;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduced]);

  return <span ref={ref}>{reduced ? value : display}</span>;
}

// ─── Hero headline: per-character stagger, kept readable to screen readers ────

function AnimatedHeadline({ text }: { text: string }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <h1 className="font-serif lp-hero-title">{text}</h1>;
  }

  const words = text.split(" ");
  // Characters are numbered across the whole line without mutating anything
  // during render, so every letter keeps its place in the stagger.
  const wordStart = (wi: number) => words.slice(0, wi).reduce((n, w) => n + w.length, 0);

  return (
    <h1 className="font-serif lp-hero-title" aria-label={text}>
      <span aria-hidden="true">
        {words.map((word, wi) => (
          // Words never break mid-animation — each keeps its characters together.
          <span key={`${word}-${wi}`} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {word.split("").map((char, ci) => (
              <motion.span
                key={`${char}-${ci}`}
                style={{ display: "inline-block", willChange: "transform, opacity" }}
                initial={{ opacity: 0, y: "0.4em" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.16 + (wordStart(wi) + ci) * 0.03 }}
              >
                {char}
              </motion.span>
            ))}
            {wi < words.length - 1 && " "}
          </span>
        ))}
      </span>
    </h1>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`lp-nav${scrolled ? " lp-nav-scrolled" : ""}`}>
      <div className="lp-nav-inner">
        <Logo size="md" tone="dark" />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="lp-nav-links">
            <Link href="/projects" className="lp-nav-link">Projects</Link>
            <Link href="/builders" className="lp-nav-link">Builders</Link>
            <Link href="/login" className="lp-nav-link">Sign in</Link>
          </div>
          <div className="lp-nav-links-mobile">
            <Link href="/projects" className="lp-nav-link-sm">Projects</Link>
            <span className="lp-nav-dot">·</span>
            <Link href="/builders" className="lp-nav-link-sm">Builders</Link>
            <span className="lp-nav-dot">·</span>
            <Link href="/login" className="lp-nav-link-sm">Sign in</Link>
          </div>
          <Link href="/signup" className="lp-btn lp-btn-primary lp-nav-cta">
            Create your profile
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Profile preview (hardcoded realistic example) ────────────────────────────

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
    <div className="lp-preview lp-shine">
      <div className="lp-preview-head">
        <span className="lp-preview-avatar">ED</span>
        <div>
          <div className="font-serif lp-preview-name">Elif Demir</div>
          <div className="lp-caps" style={{ marginTop: 4 }}>Boğaziçi University · Full-stack Developer</div>
        </div>
        <span className="lp-pill lp-pill-shipped" style={{ marginLeft: "auto" }}>2 shipped</span>
      </div>

      <div className="lp-caps" style={{ marginBottom: 10 }}>Selected work</div>
      <div style={{ marginBottom: 20 }}>
        {PREVIEW_PROJECTS.map((p, i) => (
          <div key={p.title} className="lp-preview-row" style={{ borderTop: i === 0 ? "none" : undefined }}>
            <div style={{ minWidth: 0 }}>
              <span className="font-serif lp-preview-project">{p.title}</span>
              <span className="lp-preview-desc"> — {p.desc}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span className="lp-pill lp-pill-shipped">{p.stage}</span>
              <span className="lp-preview-year">{p.year}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="lp-caps" style={{ marginBottom: 10 }}>Endorsed skills</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {PREVIEW_SKILLS.map((s) => (
          <span key={s.skill} className="lp-pill lp-pill-tech">{s.skill} ({s.count})</span>
        ))}
      </div>
    </div>
  );
}

// ─── Social proof ─────────────────────────────────────────────────────────────

function ProofLine({ stats }: { stats: PublicStats }) {
  // Zero counts read as anti-proof, so they're left out rather than shown.
  const items = [
    { value: stats.builders, label: "builders" },
    { value: stats.projects, label: "projects" },
    { value: stats.shipped, label: "shipped" },
  ].filter((item) => item.value > 0);
  if (items.length === 0) return null;

  return (
    <p className="lp-proof">
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && <span aria-hidden="true" className="lp-proof-sep">·</span>}
          <strong className="lp-proof-value"><Counter value={item.value} /></strong> {item.label}
        </span>
      ))}
    </p>
  );
}

// ─── Featured projects ────────────────────────────────────────────────────────

function FeaturedProjects({ items }: { items: FeaturedProject[] }) {
  if (items.length === 0) return null;

  return (
    <section className="lp-section">
      <div className="lp-wrap-wide">
        <FadeIn>
          <div className="lp-section-head">
            <div>
              <div className="lp-caps" style={{ marginBottom: 12 }}>Featured projects</div>
              <h2 className="font-serif lp-h2">What students are building now.</h2>
            </div>
            <Link href="/projects" className="lp-link">View all projects →</Link>
          </div>
        </FadeIn>

        <StaggerGroup className="lp-featured-grid">
          {items.map(({ project, owner }) => (
            <StaggerItem key={project.id} style={{ display: "grid" }}>
              <FeaturedProjectCard project={project} owner={owner} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const reduced = useReducedMotion();

  return (
    <>
      <Navbar />

      <main className="lp-main">
        {/* Ambient orbs — three blurred radials, transform-only drift. */}
        <div className="lp-orbs" aria-hidden="true">
          <span className="lp-orb lp-orb-1" />
          <span className="lp-orb lp-orb-2" />
          <span className="lp-orb lp-orb-3" />
        </div>

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-wrap">
            <AnimatedHeadline text="Prove what you build." />

            <motion.p
              className="lp-hero-sub"
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.75 }}
            >
              The portfolio platform for student builders. Ship projects, collect
              endorsements, share your proof-of-work profile.
            </motion.p>

            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.94 }}
              animate={reduced ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.95 }}
            >
              <div className="lp-hero-actions">
                <Link href="/signup" className="lp-btn lp-btn-primary lp-btn-lg">
                  Create your profile
                </Link>
                <Link href="/projects" className="lp-btn lp-btn-ghost lp-btn-lg">
                  Browse projects →
                </Link>
              </div>
              {stats && <ProofLine stats={stats} />}
            </motion.div>
          </div>

          <FadeIn delay={0.1} style={{ marginTop: 96 }}>
            <div className="lp-caps" style={{ marginBottom: 20 }}>What a profile looks like</div>
            <ProfilePreview />
          </FadeIn>
        </section>

        {/* ── FEATURED PROJECTS ─────────────────────────────────────── */}
        <FeaturedProjects items={featured} />

        {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
        <section className="lp-section">
          <div className="lp-wrap-mid">
            <FadeIn>
              <div className="lp-caps" style={{ marginBottom: 12 }}>How it works</div>
              <h2 className="font-serif lp-h2" style={{ marginBottom: 56 }}>
                Three steps to a verified track record.
              </h2>
            </FadeIn>

            <StaggerGroup style={{ display: "grid", gap: 0 }}>
              {HOW_IT_WORKS.map((step, i) => (
                <StaggerItem key={step.num}>
                  <div className="lp-step" style={{ borderTop: i === 0 ? "1px solid rgba(255,255,255,0.10)" : "none" }}>
                    <div className="font-serif lp-step-num">{step.num}</div>
                    <div>
                      <h3 className="lp-step-title">{step.title}</h3>
                      <p className="lp-step-desc">{step.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>

        {/* ── CLOSING CTA ───────────────────────────────────────────── */}
        <section className="lp-section" style={{ textAlign: "center" }}>
          <FadeIn>
            <div className="lp-wrap-narrow">
              <h2 className="font-serif lp-h2" style={{ marginBottom: 16 }}>Your work speaks. Let it.</h2>
              <p className="lp-closing-sub">
                Start your proof-of-work profile today — it takes three minutes.
              </p>
              <Link href="/signup" className="lp-btn lp-btn-primary lp-btn-lg">
                Create your profile →
              </Link>
            </div>
          </FadeIn>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Logo size="sm" tone="dark" />
              <span className="lp-footer-muted">© {new Date().getFullYear()}</span>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <Link href="/terms" className="lp-link-sm">Terms</Link>
              <Link href="/privacy" className="lp-link-sm">Privacy</Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="lp-link-sm">GitHub</a>
            </div>
          </div>
        </footer>
      </main>

      <style>{`
        /* Dark theme is scoped to the landing: these body rules unmount with
           the page, so the rest of the app keeps the light Editorial theme. */
        body {
          background: #0A0A0F;
          color: #FAFAFA;
          color-scheme: dark;
        }
        body ::-webkit-scrollbar-track { background: #0A0A0F; }
        body ::-webkit-scrollbar-thumb { background: #2A2440; }
        body ::-webkit-scrollbar-thumb:hover { background: #3B3358; }
        .lp-main a:focus-visible,
        .lp-nav a:focus-visible { outline: 2px solid #A855F7; outline-offset: 3px; }

        .lp-main {
          position: relative;
          isolation: isolate;
          overflow-x: hidden;
          background:
            radial-gradient(1200px 700px at 50% -10%, rgba(139,92,246,0.18), transparent 70%),
            linear-gradient(180deg, #0A0A0F 0%, #120B1E 45%, #1A1025 100%);
          color: #FAFAFA;
          min-height: 100vh;
        }

        /* ── Ambient orbs ─────────────────────────────────────────── */
        .lp-orbs { position: absolute; inset: 0; overflow: hidden; z-index: -1; pointer-events: none; }
        .lp-orb {
          position: absolute;
          display: block;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.5;
          will-change: transform;
        }
        .lp-orb-1 {
          width: 520px; height: 520px; top: -120px; left: -80px;
          background: radial-gradient(circle, rgba(139,92,246,0.55), transparent 70%);
          animation: lp-drift-1 26s ease-in-out infinite;
        }
        .lp-orb-2 {
          width: 460px; height: 460px; top: 180px; right: -120px;
          background: radial-gradient(circle, rgba(56,89,222,0.45), transparent 70%);
          animation: lp-drift-2 32s ease-in-out infinite;
        }
        .lp-orb-3 {
          width: 400px; height: 400px; top: 760px; left: 30%;
          background: radial-gradient(circle, rgba(168,85,247,0.35), transparent 70%);
          animation: lp-drift-3 38s ease-in-out infinite;
        }
        @keyframes lp-drift-1 {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50%      { transform: translate3d(60px,50px,0) scale(1.08); }
        }
        @keyframes lp-drift-2 {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50%      { transform: translate3d(-70px,40px,0) scale(1.06); }
        }
        @keyframes lp-drift-3 {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50%      { transform: translate3d(40px,-60px,0) scale(1.1); }
        }

        /* ── Nav ──────────────────────────────────────────────────── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 24px;
          background: transparent;
          border-bottom: 1px solid transparent;
          transition: background 0.25s ease, border-color 0.25s ease, backdrop-filter 0.25s ease;
        }
        .lp-nav-scrolled {
          background: rgba(10,10,15,0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom-color: rgba(255,255,255,0.10);
        }
        .lp-nav-inner {
          max-width: 1080px; margin: 0 auto; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-nav-links { display: flex; align-items: center; gap: 4px; }
        .lp-nav-link {
          font-size: 14px; color: #94A3B8; padding: 6px 10px;
          text-decoration: none; transition: color 0.15s ease;
        }
        .lp-nav-link:hover { color: #FAFAFA; }
        .lp-nav-links-mobile { display: none; align-items: center; }
        .lp-nav-link-sm { font-size: 12px; color: #94A3B8; text-decoration: none; padding: 6px 5px; }
        .lp-nav-dot { color: #64748B; font-size: 10px; opacity: 0.6; padding: 0 1px; }
        .lp-nav-cta { margin-left: 10px; font-size: 13px; padding: 9px 18px; }

        /* ── Buttons ──────────────────────────────────────────────── */
        .lp-btn {
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 10px; font-weight: 500; text-decoration: none;
          font-family: var(--font-sans);
          transition: transform 0.18s ease, box-shadow 0.25s ease, background 0.2s ease, border-color 0.2s ease;
          will-change: transform;
        }
        .lp-btn-lg { font-size: 15px; padding: 13px 26px; }
        .lp-btn-primary {
          color: #FFFFFF;
          background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
          border: 1px solid rgba(196,181,253,0.45);
          box-shadow: 0 6px 22px rgba(139,92,246,0.32);
        }
        .lp-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 10px 30px rgba(139,92,246,0.48); }
        .lp-btn-ghost {
          color: #E2E8F0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .lp-btn-ghost:hover { background: rgba(255,255,255,0.09); border-color: rgba(196,181,253,0.4); }

        /* ── Layout ───────────────────────────────────────────────── */
        .lp-hero { padding: 184px 24px 120px; text-align: center; position: relative; }
        .lp-wrap { max-width: 760px; margin: 0 auto; }
        .lp-wrap-mid { max-width: 860px; margin: 0 auto; }
        .lp-wrap-wide { max-width: 1080px; margin: 0 auto; }
        .lp-wrap-narrow { max-width: 560px; margin: 0 auto; }
        .lp-section { padding: 0 24px 120px; position: relative; }

        .lp-hero-title {
          font-size: clamp(44px, 7vw, 80px);
          font-weight: 500;
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: #FAFAFA;
          margin-bottom: 28px;
        }
        .lp-hero-sub {
          font-size: 18px; line-height: 1.65; color: #94A3B8;
          max-width: 560px; margin: 0 auto 40px;
        }
        .lp-hero-actions {
          display: flex; align-items: center; justify-content: center;
          gap: 16px; flex-wrap: wrap;
        }

        .lp-proof { margin-top: 26px; font-size: 14px; color: #94A3B8; }
        .lp-proof-value { font-weight: 600; color: #FAFAFA; }
        .lp-proof-sep { margin: 0 10px; color: #64748B; }

        .lp-caps {
          font-size: 12px; font-weight: 500; letter-spacing: 0.06em;
          text-transform: uppercase; color: #8B7FA8; font-family: var(--font-sans);
        }
        .lp-h2 {
          font-size: clamp(28px, 4vw, 40px); font-weight: 500;
          letter-spacing: -0.015em; color: #FAFAFA; margin: 0;
        }
        .lp-section-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 32px;
        }
        .lp-link { font-size: 14px; color: #C4B5FD; text-decoration: none; transition: color 0.15s ease; }
        .lp-link:hover { color: #FAFAFA; }
        .lp-link-sm { font-size: 13px; color: #94A3B8; text-decoration: none; }
        .lp-link-sm:hover { color: #E2E8F0; }

        /* ── Glass cards ──────────────────────────────────────────── */
        .lp-card, .lp-preview {
          position: relative;
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.35);
        }
        .lp-card {
          padding: 22px;
          display: flex; flex-direction: column; gap: 13px;
          transition: transform 0.25s ease, box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease;
          will-change: transform;
        }
        .lp-card-hit { position: absolute; inset: 0; z-index: 1; border-radius: 16px; }
        .lp-card-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .lp-card-title {
          font-size: 20px; font-weight: 500; color: #FAFAFA; line-height: 1.25; margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .lp-card-tagline {
          font-size: 14px; color: #94A3B8; line-height: 1.55; margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .lp-card-foot {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);
        }
        .lp-card-owner { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .lp-card-owner-name {
          font-size: 12px; color: #94A3B8;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .lp-card-cta { font-size: 12px; font-weight: 500; color: #C4B5FD; white-space: nowrap; flex-shrink: 0; }
        .lp-avatar {
          width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
          color: #CBD5E1; font-size: 10px; font-weight: 600;
          display: flex; align-items: center; justify-content: center;
        }
        .lp-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

        @media (hover: hover) {
          .lp-card:hover {
            transform: scale(1.02);
            background: rgba(255,255,255,0.07);
            border-color: rgba(168,85,247,0.45);
            box-shadow: 0 14px 44px rgba(139,92,246,0.30), 0 0 0 1px rgba(168,85,247,0.18);
          }
          .lp-card:hover .lp-card-cta { color: #FAFAFA; }
        }

        /* ── Pills ────────────────────────────────────────────────── */
        .lp-pill {
          font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 999px;
          white-space: nowrap;
        }
        .lp-pill-category {
          color: #C4B5FD; background: rgba(139,92,246,0.12);
          border: 1px solid rgba(196,181,253,0.22);
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .lp-pill-role {
          color: #DDD6FE; background: rgba(139,92,246,0.18);
          border: 1px solid rgba(168,85,247,0.38);
          box-shadow: 0 0 14px rgba(139,92,246,0.22);
        }
        .lp-pill-shipped {
          color: #6EE7B7; background: rgba(16,185,129,0.12);
          border: 1px solid rgba(110,231,183,0.30);
          box-shadow: 0 0 14px rgba(16,185,129,0.16);
        }
        .lp-pill-tech {
          color: #CBD5E1; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10); border-radius: 6px; font-weight: 400;
        }
        .lp-pill-demo { color: #94A3B8; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); }
        .lp-pill-more { font-size: 11px; color: #64748B; padding: 3px 2px; }

        /* ── Profile preview ──────────────────────────────────────── */
        .lp-preview {
          padding: 28px; max-width: 520px; margin: 0 auto; text-align: left;
          overflow: hidden;
        }
        .lp-shine::after {
          content: ""; position: absolute; inset: 0; border-radius: 16px; pointer-events: none;
          background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.10) 48%, transparent 60%);
          transform: translateX(-120%);
          transition: transform 0.9s ease;
        }
        @media (hover: hover) {
          .lp-shine:hover::after { transform: translateX(120%); }
          .lp-shine:hover { border-color: rgba(168,85,247,0.4); box-shadow: 0 14px 44px rgba(139,92,246,0.26); }
        }
        .lp-preview-head { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .lp-preview-avatar {
          width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
          background: rgba(139,92,246,0.16); border: 1px solid rgba(196,181,253,0.28);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; font-weight: 600; color: #DDD6FE;
        }
        .lp-preview-name { font-size: 20px; color: #FAFAFA; line-height: 1.2; }
        .lp-preview-row {
          display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
          padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.08);
        }
        .lp-preview-project { font-size: 15px; color: #FAFAFA; }
        .lp-preview-desc { font-size: 13px; color: #94A3B8; }
        .lp-preview-year { font-size: 12px; color: #64748B; }

        /* ── Featured grid ────────────────────────────────────────── */
        .lp-featured-grid {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;
        }

        /* ── How it works ─────────────────────────────────────────── */
        .lp-step {
          display: flex; gap: 28px; align-items: flex-start; padding: 32px 0;
          border-bottom: 1px solid rgba(255,255,255,0.10);
        }
        .lp-step-num { font-size: 28px; color: #8B7FA8; line-height: 1; min-width: 36px; padding-top: 2px; }
        .lp-step-title { font-size: 17px; font-weight: 600; color: #FAFAFA; margin-bottom: 8px; }
        .lp-step-desc { font-size: 15px; color: #94A3B8; line-height: 1.65; max-width: 560px; margin: 0; }
        .lp-closing-sub { font-size: 15px; color: #94A3B8; line-height: 1.65; margin-bottom: 32px; }

        /* ── Footer ───────────────────────────────────────────────── */
        .lp-footer { padding: 40px 24px 48px; border-top: 1px solid rgba(255,255,255,0.10); }
        .lp-footer-inner {
          max-width: 1080px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 20px;
        }
        .lp-footer-muted { font-size: 12px; color: #64748B; }

        /* ── Responsive ───────────────────────────────────────────── */
        @media (max-width: 900px) {
          .lp-featured-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 768px) {
          .lp-hero { padding: 140px 20px 80px; }
        }
        @media (max-width: 640px) {
          .lp-nav-links, .lp-nav-cta { display: none; }
          .lp-nav-links-mobile { display: flex; }
          .lp-hero { padding: 120px 18px 64px; }
          .lp-featured-grid { grid-template-columns: 1fr; }
          .lp-section { padding: 0 18px 88px; }
          /* Lighter ambient work on phones: fewer orbs, cheaper blur. */
          .lp-orb-3 { display: none; }
          .lp-orb { filter: blur(60px); opacity: 0.4; animation: none; }
          .lp-card, .lp-preview { backdrop-filter: none; -webkit-backdrop-filter: none; background: rgba(255,255,255,0.06); }
        }

        @media (prefers-reduced-motion: reduce) {
          .lp-orb { animation: none; }
          .lp-card, .lp-btn { transition: none; }
          .lp-card:hover { transform: none; }
          .lp-shine::after { display: none; }
        }
      `}</style>
    </>
  );
}
