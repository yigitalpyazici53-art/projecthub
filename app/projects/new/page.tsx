"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "EdTech", "HealthTech", "FinTech", "SaaS", "Social",
  "Gaming", "AI/ML", "Climate", "E-commerce", "DevTools", "Other",
];

const STAGES = [
  { value: "idea",     label: "💡 Idea",     desc: "Just an idea, exploring" },
  { value: "mvp",      label: "🚀 MVP",      desc: "Building a first version" },
  { value: "building", label: "🔨 Building", desc: "Actively in development" },
  { value: "launched", label: "✅ Launched", desc: "Live and getting users" },
];

const SKILL_OPTIONS = [
  "Frontend Dev", "Backend Dev", "Mobile Dev", "UI/UX Design",
  "Data Science", "ML/AI", "Marketing", "Business Dev", "Legal", "Finance",
];

const SKILL_ICONS: Record<string, string> = {
  "Frontend Dev":  "🎨",
  "Backend Dev":   "⚙️",
  "Mobile Dev":    "📱",
  "UI/UX Design":  "✏️",
  "Data Science":  "📊",
  "ML/AI":         "🤖",
  "Marketing":     "📢",
  "Business Dev":  "💼",
  "Legal":         "⚖️",
  "Finance":       "💰",
};

const STEP_LABELS = ["Project basics", "Tech stack", "Looking for"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewProjectPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState("idea");

  // Step 2 fields
  const [description, setDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());

  // Step 3 fields
  const [lookingForText, setLookingForText] = useState("");
  const [techStack, setTechStack] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.replace("/login?next=/projects/new");
      else setAuthChecked(true);
    })();
  }, [router]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  };

  const validateStep = (): boolean => {
    setError("");
    if (step === 1) {
      if (!title.trim()) { setError("Project title is required."); return false; }
      if (title.trim().length > 80) { setError("Title must be 80 characters or fewer."); return false; }
      if (!description.trim()) { setError("Description is required."); return false; }
    }
    // Steps 2 (Tech stack) and 3 (Looking for) are entirely optional.
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    const supabase = createClient();
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Session expired. Please sign in again.");
        router.push("/login?next=/projects/new");
        return;
      }

      const skillsList = [...selectedSkills].join(", ");
      const lookingFor = [skillsList, lookingForText.trim()].filter(Boolean).join(", ") || null;
      const techFinal = [techStack.trim(), githubUrl.trim() ? `GitHub: ${githubUrl.trim()}` : ""].filter(Boolean).join(" | ") || null;

      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({
          owner_id: user.id,
          title: title.trim(),
          tagline: tagline.trim() || null,
          description: description.trim(),
          category: category || null,
          stage,
          looking_for: lookingFor,
          tech_stack: techFinal,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      router.push(`/projects/${data.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <main style={pageStyle}>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", paddingTop: 80 }}>Checking session…</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />
      <div className="page-z page-pad-x" style={{ maxWidth: 780, margin: "0 auto" }}>

        {/* Back link */}
        <Link href="/dashboard" style={backLinkStyle}>← Back to dashboard</Link>

        {/* ── Page header ── */}
        <div style={headerSectionStyle}>
          <div style={headerBadgeStyle}>New Project</div>
          <h1 style={titleStyle}>Launch your idea into the world</h1>
          <p style={subtitleStyle}>
            Tell the ProjectHub community what you&apos;re building. Find the co-founders,
            contributors, and early users who believe in your vision.
          </p>
        </div>

        {/* ── Progress stepper ── */}
        <div style={progressContainerStyle}>
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const done = num < step;
            const active = num === step;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800,
                    background: done || active ? "var(--accent)" : "rgba(255,255,255,0.04)",
                    border: done || active ? "none" : "1px solid var(--border)",
                    color: done || active ? "white" : "var(--text-muted)",
                    boxShadow: active ? "0 0 0 6px color-mix(in srgb, var(--accent) 18%, transparent)" : "none",
                    transition: "all 0.2s ease",
                  }}>
                    {done ? "✓" : num}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                    color: active ? "var(--accent-bright)" : done ? "var(--accent)" : "var(--text-muted)",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, marginBottom: 22, marginLeft: 12, marginRight: 12,
                    background: done ? "var(--accent)" : "var(--border-subtle)",
                    transition: "background 0.3s ease",
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Form card ── */}
        <div style={cardStyle}>

          {/* ── Step 1: Project basics ── */}
          {step === 1 && (
            <div style={stepStyle}>
              <div style={stepHeaderStyle}>
                <div style={stepNumStyle}>1</div>
                <div>
                  <div style={stepTitleStyle}>Project basics</div>
                  <div style={stepDescStyle}>The essentials — what it is, who it&apos;s for, where you are.</div>
                </div>
              </div>

              <div style={sectionBlockStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Project title <span style={reqStyle}>*</span></label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. FlowDesk"
                    maxLength={80}
                    style={inputStyle}
                    autoFocus
                  />
                  <div style={hintRowStyle}>
                    <span style={fieldHintStyle}>A short, memorable name. You can refine this later.</span>
                    <span style={hintStyle}>{title.length}/80</span>
                  </div>
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Tagline</label>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="One sentence that captures what you're building"
                    maxLength={120}
                    style={inputStyle}
                  />
                  <p style={fieldHintStyle}>Pitch it in a single line — this shows on cards across the site.</p>
                </div>
              </div>

              <div style={sectionBlockStyle}>
                <div style={sectionBlockLabelStyle}>Project details</div>
                <div className="responsive-2col" style={twoColStyle}>
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
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={stageInfoStyle}>
                  {STAGES.find((s) => s.value === stage)?.desc}
                </div>
              </div>

              <div style={sectionBlockStyle}>
                <div style={sectionBlockLabelStyle}>Description</div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>About your project <span style={reqStyle}>*</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={7}
                    placeholder="What are you building, for whom, and why now? What problem does it solve?"
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
                  />
                  <p style={fieldHintStyle}>2–4 short paragraphs work best. Markdown isn&apos;t supported yet.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Tech stack ── */}
          {step === 2 && (
            <div style={stepStyle}>
              <div style={stepHeaderStyle}>
                <div style={stepNumStyle}>2</div>
                <div>
                  <div style={stepTitleStyle}>Tech stack</div>
                  <div style={stepDescStyle}>What you&apos;re building with — helps the right builders find you.</div>
                </div>
              </div>

              <div style={sectionBlockStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Tech stack</label>
                  <input
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    placeholder="e.g. Next.js, Supabase, Tailwind, Python"
                    style={inputStyle}
                  />
                  <p style={fieldHintStyle}>Comma-separated. The first two appear on your project card.</p>
                </div>
              </div>

              <div style={sectionBlockStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>GitHub / Website</label>
                  <input
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/you/project"
                    style={inputStyle}
                    type="url"
                  />
                  <p style={fieldHintStyle}>Optional — a public repo or live link gives credibility.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Looking for ── */}
          {step === 3 && (
            <div style={stepStyle}>
              <div style={stepHeaderStyle}>
                <div style={stepNumStyle}>3</div>
                <div>
                  <div style={stepTitleStyle}>Looking for</div>
                  <div style={stepDescStyle}>Who do you want to build with? Pick roles, add detail.</div>
                </div>
              </div>

              <div style={sectionBlockStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Roles you need</label>
                  <p style={{ ...fieldHintStyle, marginBottom: 4 }}>Select all that apply — you can pick more than one.</p>
                  <div style={chipsGridStyle}>
                    {SKILL_OPTIONS.map((skill) => {
                      const selected = selectedSkills.has(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          style={{
                            ...chipBtnBase,
                            ...(selected ? chipBtnActive : chipBtnInactive),
                          }}
                        >
                          <span style={{ fontSize: 24, display: "block", marginBottom: 8, lineHeight: 1 }}>
                            {SKILL_ICONS[skill]}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{skill}</span>
                          {selected && (
                            <span style={chipCheckStyle}>✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedSkills.size > 0 && (
                  <div style={selectedSkillsPreviewStyle}>
                    <span style={{ color: "var(--text-secondary)", fontSize: 12, marginRight: 4, fontWeight: 600 }}>
                      Selected ({selectedSkills.size}):
                    </span>
                    {[...selectedSkills].map((s) => (
                      <span key={s} style={previewPillStyle}>{s}</span>
                    ))}
                  </div>
                )}
              </div>

              <div style={sectionBlockStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>
                    Anything else{" "}
                    <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: "0" }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    value={lookingForText}
                    onChange={(e) => setLookingForText(e.target.value)}
                    placeholder="e.g. Co-founder with sales experience, part-time designer"
                    style={inputStyle}
                  />
                  <p style={fieldHintStyle}>Specifics help — commitment level, time zone, paid vs. equity, etc.</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div style={errorStyle}>{error}</div>}

          {/* ── Navigation ── */}
          <div style={navRowStyle}>
            {step > 1 ? (
              <button type="button" onClick={handleBack} style={backBtnStyle}>
                ← Back
              </button>
            ) : (
              <Link href="/dashboard" style={cancelBtnStyle}>Cancel</Link>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                style={continueBtnStyle}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = "0 14px 32px var(--accent-glow)";
                  el.style.filter = "brightness(1.08)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "0 8px 22px var(--accent-glow)";
                  el.style.filter = "brightness(1)";
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  ...submitBtnStyle,
                  opacity: submitting ? 0.85 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (submitting) return;
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = "0 14px 32px var(--accent-glow)";
                  el.style.filter = "brightness(1.08)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "0 8px 24px var(--accent-glow)";
                  el.style.filter = "brightness(1)";
                }}
              >
                {submitting && (
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "white",
                    animation: "spin-slow 0.7s linear infinite",
                    display: "inline-block",
                    marginRight: 10,
                    flexShrink: 0,
                  }} />
                )}
                {submitting ? "Creating your project…" : "Create project 🚀"}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--text-muted)" }}>
          You can edit any of this later.
        </p>
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
  letterSpacing: "0.02em",
};

// ── Page header

const headerSectionStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: 52,
};

const headerBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  marginBottom: 18,
  padding: "6px 16px",
  borderRadius: 20,
  background: "color-mix(in srgb, var(--accent) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
  color: "var(--accent-bright)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  fontSize: "clamp(32px, 5vw, 52px)",
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  color: "var(--text-primary)",
  letterSpacing: "-0.03em",
  marginBottom: 16,
  lineHeight: 1.1,
};

const subtitleStyle: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontSize: 16,
  lineHeight: 1.65,
  maxWidth: 560,
  margin: "0 auto",
};

// ── Progress stepper

const progressContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: 40,
  padding: "0 8px",
};

// ── Main card

const cardStyle: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 22,
  padding: "44px 44px",
  boxShadow: "0 28px 72px rgba(0,0,0,0.4), 0 0 0 1px color-mix(in srgb, var(--accent) 5%, transparent) inset",
};

const stepStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 28,
};

const stepHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  paddingBottom: 24,
  borderBottom: "1px solid var(--border-subtle)",
};

const stepNumStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  background: "color-mix(in srgb, var(--accent) 15%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  fontWeight: 800,
  color: "var(--accent-bright)",
  flexShrink: 0,
};

const stepTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  color: "var(--text-primary)",
  letterSpacing: "-0.01em",
  marginBottom: 3,
};

const stepDescStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--text-muted)",
  lineHeight: 1.5,
};

// ── Section blocks (visual grouping within a step)

const sectionBlockStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: "24px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
};

const sectionBlockLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: -4,
};

// ── Fields

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
  fontWeight: 700,
  marginLeft: 2,
};

const fieldHintStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  marginTop: -2,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.03)",
  color: "var(--text-primary)",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-muted)",
  textAlign: "right",
};

const hintRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginTop: -2,
};

const twoColStyle: React.CSSProperties = {
  gap: 16,
};

const stageInfoStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  background: "color-mix(in srgb, var(--accent) 8%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)",
  fontSize: 13,
  color: "var(--accent-bright)",
};

// ── Skill chips (large, card-style)

const chipsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
  gap: 12,
};

const chipBtnBase: React.CSSProperties = {
  padding: "18px 14px",
  borderRadius: 14,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.18s ease",
  border: "1.5px solid",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  fontFamily: "inherit",
  position: "relative",
  minHeight: 90,
  justifyContent: "center",
};

const chipBtnActive: React.CSSProperties = {
  background: "color-mix(in srgb, var(--accent) 18%, transparent)",
  borderColor: "color-mix(in srgb, var(--accent) 60%, transparent)",
  color: "var(--accent-bright)",
  boxShadow: "0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent)",
};

const chipBtnInactive: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  borderColor: "var(--border)",
  color: "var(--text-secondary)",
};

const chipCheckStyle: React.CSSProperties = {
  position: "absolute",
  top: 8,
  right: 10,
  fontSize: 11,
  fontWeight: 800,
  color: "var(--accent-bright)",
};

const selectedSkillsPreviewStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  padding: "14px 16px",
  borderRadius: 12,
  background: "color-mix(in srgb, var(--accent) 8%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)",
  alignItems: "center",
};

const previewPillStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--accent-bright)",
  background: "color-mix(in srgb, var(--accent) 15%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 28%, transparent)",
  borderRadius: 20,
  padding: "4px 12px",
};

// ── Nav row

const navRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 36,
  paddingTop: 28,
  borderTop: "1px solid var(--border-subtle)",
  gap: 12,
};

const backBtnStyle: React.CSSProperties = {
  padding: "13px 26px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-secondary)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "13px 26px",
  borderRadius: 12,
  border: "1px solid var(--border-subtle)",
  background: "transparent",
  color: "var(--text-muted)",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
  fontFamily: "inherit",
};

const continueBtnStyle: React.CSSProperties = {
  padding: "14px 36px",
  borderRadius: 12,
  border: "1px solid color-mix(in srgb, var(--accent) 50%, transparent)",
  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
  color: "white",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "Syne, sans-serif",
  letterSpacing: "0.01em",
  boxShadow: "0 8px 22px var(--accent-glow)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
};

const submitBtnStyle: React.CSSProperties = {
  flex: 1,
  maxWidth: 420,
  padding: "18px 40px",
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--accent) 50%, transparent)",
  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
  color: "white",
  fontSize: 17,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "Syne, sans-serif",
  letterSpacing: "0.01em",
  boxShadow: "0 8px 24px var(--accent-glow)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const errorStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  background: "rgba(239,68,68,0.1)",
  border: "1px solid rgba(239,68,68,0.3)",
  color: "#fca5a5",
  fontSize: 13,
  marginTop: 8,
};
