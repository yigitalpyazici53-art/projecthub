"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SkeletonLoader from "@/components/SkeletonLoader";
import { getInitials } from "@/utils/getInitials";
import type { Profile } from "@/types";

const SKILL_OPTIONS = [
  "Python", "React", "ML", "Figma", "Node.js", "Swift",
  "iOS", "Android", "Marketing", "Finance", "Design", "Business",
];

const AVAILABILITY_OPTIONS = [
  { value: "Open to cofound", icon: "🚀", desc: "Looking for a co-founder to build with" },
  { value: "Open to join",    icon: "🤝", desc: "Happy to join an existing project" },
  { value: "Just browsing",   icon: "👀", desc: "Exploring what's out there" },
  { value: "Not available",   icon: "🔒", desc: "Not looking for anything right now" },
];

function getAvatarColor(id: string) {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  return colors[id.charCodeAt(0) % colors.length];
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?next=/profile/edit");
      return;
    }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          if (data.avatar_url) setAvatarPreview(data.avatar_url);
        }
        setLoading(false);
      });
  }, [authLoading, user, router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    const supabase = createClient();

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setSaveMsg("Avatar upload failed: " + uploadError.message);
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    setAvatarPreview(publicUrl);
    setAvatarUploading(false);
    setSaveMsg("Avatar updated!");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveMsg("");
    const supabase = createClient();

    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      username: profile.username,
      university: profile.university,
      role: profile.role,
      bio: profile.bio,
      skills: profile.skills,
      interests: profile.interests,
      github_url: profile.github_url,
    }).eq("id", user.id);

    setSaving(false);
    if (error) {
      setSaveMsg("Error: " + error.message);
    } else {
      setSaveMsg("Profile saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const selectedSkills = (profile.skills ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const availability = (profile.interests ?? "").trim();

  const toggleSkill = (skill: string) => {
    const updated = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    setProfile(prev => ({ ...prev, skills: updated.join(", ") }));
  };

  const setAvailability = (value: string) => {
    setProfile(prev => ({ ...prev, interests: value }));
  };

  // ── Completion % ──────────────────────────────────────────────────────────

  const completionFields = [
    avatarPreview,
    profile.full_name,
    profile.username,
    profile.university,
    profile.role,
    profile.bio,
    profile.github_url,
    profile.skills,
    profile.interests,
  ];
  const completionPercent = Math.round(
    (completionFields.filter(f => f && String(f).trim()).length / completionFields.length) * 100
  );

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main style={pageStyle}>
        <div className="page-pad-x" style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 80 }}>
          <SkeletonLoader count={4} columns="1fr" />
        </div>
      </main>
    );
  }

  const initials = getInitials(profile.full_name, profile.username);
  const avatarBg = user ? getAvatarColor(user.id) : "var(--accent)";

  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />
      <div className="page-z page-pad-x" style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 80, paddingBottom: 80 }}>

        {/* Header */}
        <h1 style={pageTitleStyle}>Edit Profile</h1>

        {/* ── Completion bar (full width) ── */}
        <div style={{ ...cardStyle, padding: "18px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Profile completion</span>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: completionPercent >= 80 ? "var(--accent-green)" : "var(--accent-bright)",
            }}>
              {completionPercent}%
            </span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${completionPercent}%`,
              background: completionPercent >= 80
                ? "linear-gradient(90deg, var(--accent-green), color-mix(in srgb, var(--accent-green) 70%, white))"
                : "var(--gradient-brand)",
              borderRadius: 99,
              transition: "width 0.4s ease",
            }} />
          </div>
          {completionPercent < 100 && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              Fill in all fields to reach 100% and get more visibility.
            </p>
          )}
        </div>

        {/* ── Two-column: main form + sidebar ── */}
        <div className="responsive-with-sidebar" style={{ marginBottom: 20 }}>

          {/* ── Main column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Basic Info */}
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>👤 Basic Info</h2>

              <div className="responsive-2col" style={{ marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={profile.full_name || ""}
                    onChange={e => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Username</label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                      color: "var(--accent)", fontSize: 14, fontWeight: 600, pointerEvents: "none",
                    }}>@</span>
                    <input
                      type="text"
                      placeholder="yourhandle"
                      value={profile.username || ""}
                      onChange={e => setProfile(prev => ({ ...prev, username: e.target.value }))}
                      style={{ ...inputStyle, paddingLeft: 28 }}
                    />
                  </div>
                </div>
              </div>

              <div className="responsive-2col">
                <div>
                  <label style={labelStyle}>University</label>
                  <input
                    type="text"
                    placeholder="Your university"
                    value={profile.university || ""}
                    onChange={e => setProfile(prev => ({ ...prev, university: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  <input
                    type="text"
                    placeholder="Founder, Developer…"
                    value={profile.role || ""}
                    onChange={e => setProfile(prev => ({ ...prev, role: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* About */}
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>✍️ About</h2>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Bio</label>
                <textarea
                  placeholder="Tell other builders about yourself…"
                  value={profile.bio || ""}
                  onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, minHeight: 110 }}
                  rows={5}
                />
              </div>
              <div>
                <label style={labelStyle}>GitHub URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/yourhandle"
                  value={profile.github_url || ""}
                  onChange={e => setProfile(prev => ({ ...prev, github_url: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Skills */}
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>⚡ Skills</h2>
              <p style={helpTextStyle}>Click to add or remove skills from your profile.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SKILL_OPTIONS.map(skill => {
                  const active = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "DM Sans, sans-serif",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        background: active
                          ? "color-mix(in srgb, var(--accent) 18%, transparent)"
                          : "rgba(255,255,255,0.04)",
                        border: active
                          ? "1px solid color-mix(in srgb, var(--accent) 50%, transparent)"
                          : "1px solid var(--border)",
                        color: active ? "var(--accent-bright)" : "var(--text-secondary)",
                      }}
                    >
                      {active && <span style={{ marginRight: 5, fontSize: 11 }}>✓</span>}
                      {skill}
                    </button>
                  );
                })}
              </div>
              {selectedSkills.length > 0 && (
                <p style={{ fontSize: 12, color: "var(--accent-bright)", marginTop: 14, fontWeight: 500 }}>
                  {selectedSkills.length} skill{selectedSkills.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </div>

          {/* ── Sidebar column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Photo */}
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>🖼 Photo</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{
                  width: 84, height: 84, borderRadius: "50%",
                  background: avatarBg,
                  border: "3px solid var(--surface)",
                  boxShadow: "0 0 0 1px var(--border-highlight), 0 8px 24px color-mix(in srgb, var(--accent) 20%, transparent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, overflow: "hidden",
                  fontSize: 26, fontFamily: "Syne, sans-serif", fontWeight: 700, color: "white",
                }}>
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                    />
                  ) : initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    style={uploadBtnStyle}
                  >
                    {avatarUploading ? "Uploading…" : "Upload Photo"}
                  </button>
                  <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>JPG, PNG or WebP · Max 2MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>
            </div>

            {/* Availability */}
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>🟢 Availability</h2>
              <p style={helpTextStyle}>Let others know if you&apos;re open to collaborate.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {AVAILABILITY_OPTIONS.map(opt => {
                  const active = availability === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAvailability(opt.value)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        background: active
                          ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                          : "rgba(255,255,255,0.02)",
                        border: active
                          ? "1px solid color-mix(in srgb, var(--accent) 45%, transparent)"
                          : "1px solid var(--border)",
                        outline: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 18 }}>{opt.icon}</span>
                        <div style={{
                          fontSize: 13, fontWeight: 700,
                          color: active ? "var(--accent-bright)" : "var(--text-secondary)",
                          fontFamily: "Syne, sans-serif",
                        }}>
                          {opt.value}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                        {opt.desc}
                      </div>
                      {active && (
                        <div style={{
                          marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 600, color: "var(--accent)",
                        }}>
                          ✓ Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Save / Cancel ── */}
        <div className="responsive-flex-row" style={{ marginBottom: 60 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ opacity: saving ? 0.7 : 1, padding: "13px 28px" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          {saveMsg && (
            <p style={{
              color: saveMsg.startsWith("Error") ? "#fca5a5" : "var(--accent-green)",
              fontSize: 14, fontWeight: 600, marginLeft: 4,
            }}>
              {saveMsg}
            </p>
          )}
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
  position: "relative",
};

const pageTitleStyle: React.CSSProperties = {
  fontSize: "clamp(26px, 4vw, 34px)",
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  color: "var(--text-primary)",
  letterSpacing: "-0.03em",
  marginBottom: 28,
};

const cardStyle: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 24,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  color: "var(--text-primary)",
  marginBottom: 18,
};

const uploadBtnStyle: React.CSSProperties = {
  padding: "9px 18px",
  borderRadius: 10,
  border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
  color: "var(--accent-bright)",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "DM Sans, sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "var(--text-muted)",
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 14,
  fontFamily: "DM Sans, sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const helpTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
  marginBottom: 16,
};
