"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

interface Props {
  params: Promise<{ id: string }>;
}

const CATEGORIES = [
  "EdTech", "HealthTech", "FinTech", "SaaS", "Social",
  "Gaming", "AI/ML", "Climate", "E-commerce", "DevTools", "Other",
];

const STAGES = [
  { value: "idea",     label: "Idea",     desc: "Just an idea, exploring" },
  { value: "mvp",      label: "MVP",      desc: "First working version" },
  { value: "building", label: "Building", desc: "Actively developing" },
  { value: "launched", label: "Launched", desc: "Live and getting users" },
];

export default function EditProjectPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "forbidden" | "ready" | "notfound">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState("idea");
  const [lookingFor, setLookingFor] = useState("");
  const [techStack, setTechStack] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [{ data: { user } }, { data: project, error: projErr }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("projects")
          .select("id, owner_id, title, tagline, description, category, stage, looking_for, tech_stack")
          .eq("id", id)
          .single(),
      ]);

      if (!user) { router.replace(`/login?next=/projects/${id}/edit`); return; }
      if (projErr || !project) { setStatus("notfound"); return; }
      if (project.owner_id !== user.id) { setStatus("forbidden"); return; }

      setTitle(project.title ?? "");
      setTagline(project.tagline ?? "");
      setDescription(project.description ?? "");
      setCategory(project.category ?? "");
      setStage(project.stage ?? "idea");
      setLookingFor(project.looking_for ?? "");
      setTechStack(project.tech_stack ?? "");
      setStatus("ready");
    })();
  }, [id, router]);

  const handleSave = async () => {
    setError("");
    if (!title.trim()) { setError("Project title is required."); return; }
    if (title.trim().length > 80) { setError("Title must be 80 characters or fewer."); return; }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateErr } = await supabase
      .from("projects")
      .update({
        title: title.trim(),
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        category: category || null,
        stage: stage || null,
        looking_for: lookingFor.trim() || null,
        tech_stack: techStack.trim() || null,
      })
      .eq("id", id);

    setSubmitting(false);
    if (updateErr) { setError(updateErr.message); return; }

    setSaved(true);
    setTimeout(() => router.push(`/projects/${id}`), 800);
  };

  // ── Loading ──
  if (status === "loading") {
    return (
      <main style={pageStyle}>
        <div className="page-grid-bg" />
        <div className="page-radial-glow" />
        <p style={{ color: "var(--text-secondary)", textAlign: "center", paddingTop: 100 }}>
          Loading…
        </p>
      </main>
    );
  }

  // ── Not found ──
  if (status === "notfound") {
    return (
      <main style={pageStyle}>
        <div className="page-grid-bg" />
        <div className="page-radial-glow" />
        <div className="page-z page-pad-x" style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h1 style={headingStyle}>Project not found</h1>
          <p style={mutedStyle}>This project doesn&apos;t exist or has been removed.</p>
          <Link href="/projects" style={cancelBtnStyle}>Browse all projects</Link>
        </div>
      </main>
    );
  }

  // ── Forbidden ──
  if (status === "forbidden") {
    return (
      <main style={pageStyle}>
        <div className="page-grid-bg" />
        <div className="page-radial-glow" />
        <div className="page-z page-pad-x" style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={headingStyle}>Permission denied</h1>
          <p style={mutedStyle}>You don&apos;t have permission to edit this project.</p>
          <Link href={`/projects/${id}`} style={cancelBtnStyle}>Back to project</Link>
        </div>
      </main>
    );
  }

  // ── Edit form ──
  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />
      <div className="page-z page-pad-x" style={{ maxWidth: 780, margin: "0 auto" }}>

        <Link href={`/projects/${id}`} style={backLinkStyle}>← Back to project</Link>

        <div style={{ marginBottom: 40 }}>
          <div style={badgeStyle}>Edit Project</div>
          <h1 style={pageTitleStyle}>Update your project</h1>
          <p style={pageSubStyle}>Changes are saved immediately and visible to everyone.</p>
        </div>

        <div style={cardStyle}>

          {/* Basics section */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Basics</div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Title <span style={reqStyle}>*</span></label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                placeholder="Project title"
                style={inputStyle}
                autoFocus
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span style={hintStyle}>{title.length}/80</span>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Tagline</label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value.slice(0, 120))}
                placeholder="One sentence that captures what you're building"
                style={inputStyle}
              />
              <span style={hintStyle}>{tagline.length}/120</span>
            </div>
          </div>

          {/* Details section */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Details</div>

            <div className="responsive-2col">
              <div style={fieldStyle}>
                <label style={labelStyle}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Stage</label>
                <select value={stage} onChange={(e) => setStage(e.target.value)} style={selectStyle}>
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                placeholder="What are you building, for whom, and why now?"
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
              />
            </div>
          </div>

          {/* Team section */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Team</div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Looking for</label>
              <input
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                placeholder="e.g. Frontend Dev, UX Designer, Marketing"
                style={inputStyle}
              />
              <span style={hintStyle}>Comma-separated roles — shown on your project card.</span>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Tech stack</label>
              <input
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g. Next.js, Supabase, Tailwind"
                style={inputStyle}
              />
              <span style={hintStyle}>Comma-separated technologies.</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={errorStyle}>{error}</div>
          )}

          {/* Actions */}
          <div style={actionsStyle}>
            <Link href={`/projects/${id}`} style={cancelBtnStyle}>Cancel</Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting || saved}
              style={{
                ...saveBtnStyle,
                opacity: submitting || saved ? 0.8 : 1,
                cursor: submitting || saved ? "default" : "pointer",
              }}
            >
              {saved ? "Saved ✓" : submitting ? "Saving…" : "Save changes"}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--background)",
  color: "var(--text-primary)",
  padding: "80px 0 100px",
  position: "relative",
};

const backLinkStyle: React.CSSProperties = {
  display: "inline-block",
  marginBottom: 32,
  color: "var(--text-muted)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  marginBottom: 14,
  padding: "5px 14px",
  borderRadius: 20,
  background: "color-mix(in srgb, var(--accent) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
  color: "var(--accent-bright)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const pageTitleStyle: React.CSSProperties = {
  fontSize: "clamp(28px, 4vw, 40px)",
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  color: "var(--text-primary)",
  letterSpacing: "-0.03em",
  marginBottom: 10,
  lineHeight: 1.1,
};

const pageSubStyle: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontSize: 15,
  lineHeight: 1.6,
};

const headingStyle: React.CSSProperties = {
  fontSize: 28,
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  color: "var(--text-primary)",
  letterSpacing: "-0.02em",
  marginBottom: 12,
};

const mutedStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: 15,
  lineHeight: 1.6,
  marginBottom: 28,
};

const cardStyle: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 22,
  padding: "40px",
  boxShadow: "0 28px 72px rgba(0,0,0,0.4), 0 0 0 1px color-mix(in srgb, var(--accent) 5%, transparent) inset",
  display: "flex",
  flexDirection: "column",
  gap: 28,
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: "22px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-secondary)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const reqStyle: React.CSSProperties = {
  color: "#f87171",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.03)",
  color: "var(--text-primary)",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
};

const errorStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  background: "rgba(239,68,68,0.1)",
  border: "1px solid rgba(239,68,68,0.3)",
  color: "#fca5a5",
  fontSize: 13,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  paddingTop: 8,
  borderTop: "1px solid var(--border-subtle)",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-muted)",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  fontFamily: "inherit",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "12px 32px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
  color: "white",
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "Syne, sans-serif",
  boxShadow: "0 4px 16px var(--accent-glow)",
  letterSpacing: "0.01em",
};
