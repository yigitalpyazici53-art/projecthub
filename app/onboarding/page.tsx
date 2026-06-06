"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SKILL_OPTIONS = [
  "React", "Next.js", "TypeScript", "JavaScript", "Python", "Node.js",
  "UI/UX Design", "Figma", "Product Management", "Machine Learning",
  "iOS Development", "Android", "Backend", "DevOps", "Data Science",
  "Marketing", "Business Dev", "Finance", "Blockchain", "AI/ML",
  "Go", "Rust", "Java", "C++", "Content Writing", "Graphic Design",
  "Video Editing", "Photography", "Research", "Operations",
];

// Purpose options drive three things:
//   - the label shown on the summary card
//   - what we persist to profiles.role (so the rest of the app can see it)
//   - the primary "next step" CTA on the final step
const PURPOSE_OPTIONS = [
  { id: "idea",       label: "I have an idea",    icon: "💡", desc: "I want to find builders for my project",   role: "Founder",                  ctaLabel: "Post your first project", ctaHref: "/projects/new" },
  { id: "build",      label: "I want to build",   icon: "🔨", desc: "I want to join a project and contribute",   role: "Builder",                  ctaLabel: "Browse builders",         ctaHref: "/builders"     },
  { id: "explore",    label: "Just exploring",    icon: "🔭", desc: "I'm here to see what's being built",        role: "Explorer",                 ctaLabel: "Go to dashboard",         ctaHref: "/dashboard"    },
  { id: "cofounders", label: "Find co-founders",  icon: "🤝", desc: "I'm looking for the right founding team",   role: "Looking for cofounders",   ctaLabel: "Browse builders",         ctaHref: "/builders"     },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    const name =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ?? "";
    if (name) setFullName(name);
  }, [authLoading, user, router]);

  const markSeen = () => {
    if (typeof window !== "undefined") localStorage.setItem("onboarding_seen", "1");
  };

  const handleSkip = () => { markSeen(); router.replace("/dashboard"); };

  const purposeOption = PURPOSE_OPTIONS.find(o => o.id === purpose);

  const handleComplete = async (nextHref: string) => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const updates: { full_name?: string; university?: string; skills?: string; role?: string } = {};
    if (fullName.trim())           updates.full_name  = fullName.trim();
    if (university.trim())         updates.university = university.trim();
    if (selectedSkills.length > 0) updates.skills     = selectedSkills.join(", ");
    if (purposeOption)             updates.role       = purposeOption.role;
    if (Object.keys(updates).length > 0) {
      await supabase.from("profiles").update(updates).eq("id", user.id);
    }
    markSeen();
    setSaving(false);
    router.replace(nextHref);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const canProceedStep1 = fullName.trim().length > 0;
  const canProceedStep2 = purpose !== "";

  return (
    <main style={pageStyle}>
      {/* Background */}
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />

      <div className="page-z" style={containerStyle}>
        {/* Progress dots */}
        <div style={dotsRowStyle}>
          {[1, 2, 3, 4].map(n => (
            <div
              key={n}
              style={{
                ...dotBase,
                ...(n === step ? dotActive : n < step ? dotDone : dotIdle),
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div style={cardStyle}>
          {/* Skip button */}
          {step < 4 && (
            <button type="button" onClick={handleSkip} style={skipBtnStyle}>
              Skip for now
            </button>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div style={stepStyle}>
              <div style={iconCircleStyle}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 3L25 8.5V14C25 19.8 20.5 25.2 14 27C7.5 25.2 3 19.8 3 14V8.5L14 3Z"
                    fill="color-mix(in srgb, var(--accent) 20%, transparent)" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 14l3 3 5-5" stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 style={titleStyle}>Welcome to ProjectHub</h1>
              <p style={subtitleStyle}>Tell us a bit about yourself to get the most out of the platform.</p>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>University <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  placeholder="e.g. MIT, Stanford, UC Berkeley…"
                  style={inputStyle}
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="btn-primary"
                style={{ width: "100%", marginTop: 8, opacity: canProceedStep1 ? 1 : 0.45 }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div style={stepStyle}>
              <div style={iconCircleStyle}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="10" fill="rgba(139,92,246,0.15)" stroke="#8b5cf6" strokeWidth="1.5" />
                  <path d="M14 9v5l3 3" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h1 style={titleStyle}>What are you here for?</h1>
              <p style={subtitleStyle}>Choose the option that best describes your goal.</p>

              <div className="responsive-2col" style={optionsGridStyle}>
                {PURPOSE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPurpose(opt.id)}
                    style={{
                      ...optionCardBase,
                      ...(purpose === opt.id ? optionCardActive : optionCardIdle),
                    }}
                  >
                    <span style={{ fontSize: 28, marginBottom: 8 }}>{opt.icon}</span>
                    <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 4 }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.4 }}>
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setStep(1)} style={backBtnStyle}>← Back</button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="btn-primary"
                  style={{ flex: 1, opacity: canProceedStep2 ? 1 : 0.45 }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div style={stepStyle}>
              <div style={iconCircleStyle}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="4" y="10" width="7" height="7" rx="2" fill="rgba(76,142,255,0.2)" stroke="#4c8eff" strokeWidth="1.5" />
                  <rect x="14" y="6" width="7" height="7" rx="2" fill="rgba(139,92,246,0.2)" stroke="#8b5cf6" strokeWidth="1.5" />
                  <rect x="9" y="17" width="7" height="7" rx="2" fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="1.5" />
                </svg>
              </div>
              <h1 style={titleStyle}>What are your skills?</h1>
              <p style={subtitleStyle}>Pick all that apply — you can always update these later.</p>

              <div style={skillsGridStyle}>
                {SKILL_OPTIONS.map(skill => {
                  const active = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 20,
                        border: active ? "1px solid color-mix(in srgb, var(--accent) 60%, transparent)" : "1px solid var(--border)",
                        background: active ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "rgba(255,255,255,0.03)",
                        color: active ? "var(--accent-bright)" : "var(--text-secondary)",
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        fontFamily: "DM Sans, sans-serif",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {active && <span style={{ marginRight: 5, fontSize: 11 }}>✓</span>}
                      {skill}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button type="button" onClick={() => setStep(2)} style={backBtnStyle}>← Back</button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {selectedSkills.length === 0 ? "Skip skills →" : `Continue with ${selectedSkills.length} skill${selectedSkills.length !== 1 ? "s" : ""} →`}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4 ── */}
          {step === 4 && (
            <div style={stepStyle}>
              <div style={{ ...iconCircleStyle, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)" }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="10" fill="rgba(74,222,128,0.15)" stroke="#4ade80" strokeWidth="1.5" />
                  <path d="M9 14l4 4 6-6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 style={titleStyle}>You&apos;re all set!</h1>
              <p style={subtitleStyle}>Here&apos;s a summary of your profile — welcome to the community.</p>

              <div style={summaryCardStyle}>
                {fullName && (
                  <SummaryRow icon="👤" label="Name" value={fullName} />
                )}
                {university && (
                  <SummaryRow icon="🎓" label="University" value={university} />
                )}
                {PURPOSE_OPTIONS.find(o => o.id === purpose) && (
                  <SummaryRow
                    icon={PURPOSE_OPTIONS.find(o => o.id === purpose)!.icon}
                    label="Here to"
                    value={PURPOSE_OPTIONS.find(o => o.id === purpose)!.label}
                  />
                )}
                {selectedSkills.length > 0 && (
                  <div style={summaryRowStyle}>
                    <span style={{ fontSize: 16 }}>🛠</span>
                    <div style={{ flex: 1 }}>
                      <span style={summaryLabelStyle}>Skills</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                        {selectedSkills.slice(0, 6).map(s => (
                          <span key={s} style={summarySkillPillStyle}>{s}</span>
                        ))}
                        {selectedSkills.length > 6 && (
                          <span style={summarySkillPillStyle}>+{selectedSkills.length - 6} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleComplete(purposeOption?.ctaHref ?? "/dashboard")}
                disabled={saving}
                className="btn-primary"
                style={{ width: "100%", marginTop: 8, opacity: saving ? 0.7 : 1 }}
              >
                {saving
                  ? "Saving…"
                  : `${purposeOption?.ctaLabel ?? "Go to dashboard"} →`}
              </button>
              {purposeOption && purposeOption.ctaHref !== "/dashboard" && (
                <button
                  type="button"
                  onClick={() => handleComplete("/dashboard")}
                  disabled={saving}
                  style={secondarySkipStyle}
                >
                  Skip to dashboard
                </button>
              )}
            </div>
          )}
        </div>

        {/* Step indicator text */}
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 16 }}>
          Step {step} of 4
        </p>
      </div>
    </main>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={summaryRowStyle}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <span style={summaryLabelStyle}>{label}</span>
        <p style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 500, margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--background)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  position: "relative",
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
};

const dotsRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 8,
  marginBottom: 24,
};

const dotBase: React.CSSProperties = {
  height: 8,
  borderRadius: 4,
  transition: "all 0.25s ease",
};

const dotActive: React.CSSProperties = {
  width: 28,
  background: "var(--accent)",
};

const dotDone: React.CSSProperties = {
  width: 8,
  background: "color-mix(in srgb, var(--accent) 50%, transparent)",
};

const dotIdle: React.CSSProperties = {
  width: 8,
  background: "rgba(255,255,255,0.1)",
};

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 20,
  padding: "36px 36px 32px",
  position: "relative",
  boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
};

const stepStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const skipBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: 20,
  right: 20,
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "DM Sans, sans-serif",
  padding: "4px 8px",
  borderRadius: 6,
  transition: "color 0.15s",
};

const iconCircleStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 16,
  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 20,
};

const titleStyle: React.CSSProperties = {
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  fontSize: 26,
  color: "var(--text-primary)",
  letterSpacing: "-0.02em",
  marginBottom: 8,
};

const subtitleStyle: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontSize: 15,
  lineHeight: 1.5,
  marginBottom: 28,
};

const fieldGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
  fontFamily: "DM Sans, sans-serif",
};

const inputStyle: React.CSSProperties = {
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.03)",
  color: "var(--text-primary)",
  fontSize: 15,
  fontFamily: "DM Sans, sans-serif",
  outline: "none",
  transition: "border-color 0.15s",
};

// Columns handled by `.responsive-2col` (1fr 1fr desktop → 1fr mobile).
const optionsGridStyle: React.CSSProperties = {
  gap: 12,
  marginBottom: 8,
};

const optionCardBase: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px 12px",
  borderRadius: 14,
  cursor: "pointer",
  transition: "all 0.15s ease",
  fontFamily: "DM Sans, sans-serif",
};

const optionCardIdle: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border)",
};

const optionCardActive: React.CSSProperties = {
  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
};

const skillsGridStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 4,
  maxHeight: 240,
  overflowY: "auto",
  padding: "4px 0",
};

const backBtnStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.03)",
  color: "var(--text-secondary)",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "DM Sans, sans-serif",
  whiteSpace: "nowrap",
};

const summaryCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  marginBottom: 8,
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  display: "block",
  marginBottom: 2,
};

const summarySkillPillStyle: React.CSSProperties = {
  padding: "3px 10px",
  borderRadius: 20,
  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
  color: "var(--accent-bright)",
  fontSize: 12,
  fontWeight: 500,
};

const secondarySkipStyle: React.CSSProperties = {
  marginTop: 10,
  width: "100%",
  padding: "8px 12px",
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "DM Sans, sans-serif",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};
