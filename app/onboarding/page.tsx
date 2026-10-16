"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cleanList, cleanText } from "@/utils/display";
import { normalizeUrl } from "@/utils/url";

// Three steps, each skippable: (1) who you are, (2) skills, (3) first project.
// Finishing or skipping the last step stamps profiles.onboarding_completed_at,
// which is what stops the one-time redirect here (see utils/onboarding.ts).

const MAX_SKILLS = 8;

const SKILL_OPTIONS = [
  "React", "Next.js", "TypeScript", "JavaScript", "Python", "Node.js",
  "UI/UX Design", "Figma", "Product Management", "Machine Learning",
  "iOS Development", "Android", "Backend", "DevOps", "Data Science",
  "Marketing", "Business Dev", "Finance", "Blockchain", "AI/ML",
  "Go", "Rust", "Java", "C++", "Content Writing", "Graphic Design",
  "Video Editing", "Photography", "Research", "Operations",
];

// Same values as /projects/new.
const STAGES = [
  { value: "idea", label: "💡 Idea", desc: "Just an idea, exploring" },
  { value: "mvp", label: "🚀 MVP", desc: "Building a first version" },
  { value: "building", label: "🔨 Building", desc: "Actively in development" },
  { value: "launched", label: "✅ Launched", desc: "Live and getting users" },
];

const STEP_COUNT = 3;


export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [university, setUniversity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

  // Step 3
  const [title, setTitle] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [link, setLink] = useState("");
  const [stage, setStage] = useState("idea");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login?next=/onboarding"); return; }
    // Prefill from the profile (and the auth name for brand-new accounts).
    createClient()
      .from("profiles")
      .select("full_name, bio, university, avatar_url, skills")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const metaName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "") as string;
        setFullName(cleanText(data?.full_name) ?? metaName);
        setBio(cleanText(data?.bio) ?? "");
        setUniversity(cleanText(data?.university) ?? "");
        setAvatarUrl(cleanText(data?.avatar_url));
        setSkills(cleanList(data?.skills).slice(0, MAX_SKILLS));
      });
  }, [authLoading, user, router]);

  const goTo = (n: number) => { setError(""); setStep(n); };

  const finish = async (nextHref: string) => {
    if (!user) return;
    await createClient()
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);
    router.replace(nextHref);
    router.refresh();
  };

  // ── Step 1 ──
  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Images must be under 5 MB."); return; }
    setError("");
    setAvatarUploading(true);
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setError(`Avatar upload failed: ${upErr.message}`); setAvatarUploading(false); return; }
    const publicUrl = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setAvatarUrl(publicUrl);
    setAvatarUploading(false);
  };

  const saveStep1 = async () => {
    if (!user) return;
    if (!fullName.trim()) { setError("Add your name, or skip this step for now."); return; }
    setSaving(true);
    const { error: err } = await createClient()
      .from("profiles")
      .update({ full_name: fullName.trim(), bio: bio.trim() || null, university: university.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    goTo(2);
  };

  // ── Step 2 ──
  const toggleSkill = (skill: string) => {
    setError("");
    setSkills((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill);
      if (prev.length >= MAX_SKILLS) { setError(`Pick up to ${MAX_SKILLS} skills.`); return prev; }
      return [...prev, skill];
    });
  };

  const addCustomSkill = () => {
    const v = customSkill.trim().replace(/,/g, "");
    if (!v) return;
    if (!skills.some((s) => s.toLowerCase() === v.toLowerCase())) toggleSkill(v);
    setCustomSkill("");
  };

  const saveStep2 = async () => {
    if (!user) return;
    if (skills.length === 0) { goTo(3); return; }
    setSaving(true);
    const { error: err } = await createClient().from("profiles").update({ skills: skills.join(", ") }).eq("id", user.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    goTo(3);
  };

  // ── Step 3 ──
  const saveProject = async () => {
    if (!user) return;
    if (!title.trim()) { setError("Give your project a title, or skip for now."); return; }
    if (!oneLiner.trim()) { setError("Add one sentence about what it does."); return; }
    const url = link.trim() ? normalizeUrl(link) : null;
    if (link.trim() && !url) { setError("That link doesn't look like a web address."); return; }
    setSaving(true);
    const { data, error: err } = await createClient()
      .from("projects")
      .insert({
        owner_id: user.id,
        title: title.trim(),
        tagline: oneLiner.trim(),
        description: oneLiner.trim(),
        stage,
        link_url: url,
      })
      .select("id")
      .single();
    if (err || !data) { setSaving(false); setError(err?.message ?? "Could not create the project."); return; }
    await finish(`/projects/${data.id}`);
  };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "7px 14px",
    borderRadius: 20,
    border: active ? "1px solid color-mix(in srgb, var(--accent) 60%, transparent)" : "1px solid var(--border)",
    background: active ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "var(--surface-raised)",
    color: active ? "var(--accent-bright)" : "var(--text-secondary)",
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    whiteSpace: "nowrap",
  });

  // Skipping a middle step moves on; skipping the last one finishes onboarding.
  const onSkip = () => (step < STEP_COUNT ? goTo(step + 1) : finish("/dashboard"));

  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />

      <div className="page-z" style={containerStyle}>
        <div style={dotsRowStyle}>
          {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((n) => (
            <div key={n} style={{ ...dotBase, ...(n === step ? dotActive : n < step ? dotDone : dotIdle) }} />
          ))}
        </div>

        <div style={cardStyle}>
          <button type="button" onClick={onSkip} disabled={saving} style={skipBtnStyle}>
            Skip for now
          </button>

          {/* ── Step 1: about you ── */}
          {step === 1 && (
            <div style={stepStyle}>
              <h1 style={titleStyle}>Welcome to ProjectHub</h1>
              <p style={subtitleStyle}>Your profile is your proof-of-work portfolio. Start with the basics.</p>

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Upload a profile photo"
                  style={avatarBtnStyle}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 22, color: "var(--text-muted)" }}>+</span>
                  )}
                </button>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {avatarUploading ? "Uploading…" : avatarUrl ? "Looking good" : "Add a photo"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Optional · JPG or PNG, up to 5 MB</div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="onb-name">Full name</label>
                <input id="onb-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Johnson" style={inputStyle} autoComplete="name" />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="onb-bio">Short bio</label>
                <textarea id="onb-bio" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} rows={2}
                  placeholder="CS student building tools for study groups" style={{ ...inputStyle, resize: "vertical" }} />
                <span style={hintStyle}>{bio.length}/160</span>
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="onb-uni">School <span style={optionalStyle}>optional</span></label>
                <input id="onb-uni" type="text" value={university} onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Boğaziçi University" style={inputStyle} />
              </div>

              {error && <p style={errorStyle}>{error}</p>}
              <button type="button" onClick={saveStep1} disabled={saving || avatarUploading} className="btn-accent" style={primaryBtnStyle}>
                {saving ? "Saving…" : "Continue →"}
              </button>
            </div>
          )}

          {/* ── Step 2: skills ── */}
          {step === 2 && (
            <div style={stepStyle}>
              <h1 style={titleStyle}>What can you build with?</h1>
              <p style={subtitleStyle}>Pick up to {MAX_SKILLS}. These show on your profile and help teams find you.</p>

              <div style={skillsGridStyle}>
                {[...SKILL_OPTIONS, ...skills.filter((s) => !SKILL_OPTIONS.includes(s))].map((skill) => {
                  const active = skills.includes(skill);
                  return (
                    <button key={skill} type="button" onClick={() => toggleSkill(skill)} style={chip(active)} aria-pressed={active}>
                      {active && <span style={{ marginRight: 5, fontSize: 11 }}>✓</span>}
                      {skill}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input type="text" value={customSkill} onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSkill(); } }}
                  placeholder="Add another skill" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
                <button type="button" onClick={addCustomSkill} style={backBtnStyle}>Add</button>
              </div>
              <span style={{ ...hintStyle, marginTop: 6 }}>{skills.length}/{MAX_SKILLS} selected</span>

              {error && <p style={errorStyle}>{error}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button type="button" onClick={() => goTo(1)} style={backBtnStyle}>← Back</button>
                <button type="button" onClick={saveStep2} disabled={saving} className="btn-accent" style={{ ...primaryBtnStyle, flex: 1, marginTop: 0 }}>
                  {saving ? "Saving…" : "Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: first project ── */}
          {step === 3 && (
            <div style={stepStyle}>
              <h1 style={titleStyle}>Add your first project</h1>
              <p style={subtitleStyle}>Anything you&apos;ve built or are building counts — a class project, a side project, a startup.</p>

              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="onb-title">Title</label>
                <input id="onb-title" type="text" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  placeholder="e.g. StudySync" style={inputStyle} />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="onb-oneliner">What it does, in one sentence</label>
                <input id="onb-oneliner" type="text" value={oneLiner} onChange={(e) => setOneLiner(e.target.value.slice(0, 140))}
                  placeholder="Matches students into study groups by course and schedule." style={inputStyle} />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="onb-link">Link <span style={optionalStyle}>optional</span></label>
                <input id="onb-link" type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)}
                  placeholder="github.com/you/project or your demo" style={inputStyle} />
              </div>
              <div style={fieldGroupStyle}>
                <span style={labelStyle}>Stage</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {STAGES.map((s) => (
                    <button key={s.value} type="button" onClick={() => setStage(s.value)} style={chip(stage === s.value)}
                      aria-pressed={stage === s.value} title={s.desc}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <span style={hintStyle}>{STAGES.find((s) => s.value === stage)?.desc}</span>
              </div>

              {error && <p style={errorStyle}>{error}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => goTo(2)} style={backBtnStyle}>← Back</button>
                <button type="button" onClick={saveProject} disabled={saving} className="btn-accent" style={{ ...primaryBtnStyle, flex: 1, marginTop: 0 }}>
                  {saving ? "Creating…" : "Add project & finish"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 16 }}>
          Step {step} of {STEP_COUNT}
        </p>
      </div>
    </main>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  fontSize: 15,
  padding: "12px 20px",
  border: "none",
  cursor: "pointer",
};

const avatarBtnStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  flexShrink: 0,
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--surface-raised)",
  border: "1px dashed var(--border-highlight)",
  cursor: "pointer",
  padding: 0,
};

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
};

const optionalStyle: React.CSSProperties = {
  fontWeight: 400,
  color: "var(--text-muted)",
  marginLeft: 4,
};

const errorStyle: React.CSSProperties = {
  margin: "4px 0 8px",
  padding: "10px 12px",
  borderRadius: 8,
  fontSize: 13,
  color: "var(--danger)",
  background: "var(--danger-bg)",
  border: "1px solid var(--danger-border)",
};

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
  background: "var(--surface-raised)",
};

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 20,
  padding: "36px 36px 32px",
  position: "relative",
  boxShadow: "0 32px 80px rgba(26,26,24,0.4)",
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
  fontFamily: "var(--font-sans)",
  padding: "4px 8px",
  borderRadius: 6,
  transition: "color 0.15s",
};

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontWeight: 500,
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
  fontFamily: "var(--font-sans)",
};

const inputStyle: React.CSSProperties = {
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-raised)",
  color: "var(--text-primary)",
  fontSize: 15,
  fontFamily: "var(--font-sans)",
  outline: "none",
  transition: "border-color 0.15s",
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
  background: "var(--surface-raised)",
  color: "var(--text-secondary)",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  whiteSpace: "nowrap",
};

