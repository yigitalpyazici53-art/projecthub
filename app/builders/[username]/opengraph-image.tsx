import { ImageResponse } from "next/og";
import { createPublicClient } from "@/utils/supabase/public";
import { cleanList, cleanProfile } from "@/utils/display";
import { decodeUsernameParam, shortProfileUrl } from "@/utils/profileUrl";
import { OG_BACKGROUND, OG_SIZE, OgLogoMark, loadOgFonts } from "@/utils/og";

// Per-profile share card for LinkedIn, X and WhatsApp (1200×630 is the size
// all three crop cleanly). Regenerated at most every 10 minutes.
export const revalidate = 600;
export const alt = "Builder profile on ProjectHub";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function ProfileOgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username: raw } = await params;
  const username = decodeUsernameParam(raw);
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, username, university, role, skills, is_seed")
    .eq("username", username)
    .maybeSingle();
  const profile = cleanProfile(data);

  let shipped = 0;
  let total = 0;
  if (profile) {
    const { data: projects } = await supabase.from("projects").select("stage").eq("owner_id", profile.id);
    total = projects?.length ?? 0;
    shipped = (projects ?? []).filter((p) => (p.stage ?? "").toLowerCase() === "launched").length;
  }

  const name = profile?.full_name || (profile ? `@${profile.username}` : "ProjectHub builder");
  const subtitle = profile ? [profile.role, profile.university].filter(Boolean).join(" · ") : "";
  const skills = cleanList(profile?.skills).slice(0, 5);
  const link = profile?.username ? shortProfileUrl(profile.username) : "projecthubstudents.com";
  const isExample = Boolean(profile?.is_seed);

  const stats = [
    { value: String(shipped), label: shipped === 1 ? "project shipped" : "projects shipped" },
    { value: String(total), label: total === 1 ? "project" : "projects" },
  ];

  const allText = [name, subtitle, link, "ProjectHub", "Example profile", "Proof-of-work portfolio", ...skills, ...stats.flatMap((s) => [s.value, s.label])].join(" ");
  const fonts = await loadOgFonts(allText);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "#FAFAFA",
          fontFamily: fonts.length ? "Inter" : undefined,
          background: OG_BACKGROUND,
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <OgLogoMark px={56} />
            <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>ProjectHub</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#94A3B8" }}>
            {isExample ? "Example profile" : "Proof-of-work portfolio"}
          </div>
        </div>

        {/* Identity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: name.length > 22 ? 64 : 80,
              fontWeight: 600,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 1050,
            }}
          >
            {name}
          </div>
          {subtitle && (
            <div style={{ display: "flex", fontSize: 32, color: "#CBD5E1", maxWidth: 1050 }}>{subtitle}</div>
          )}
          {skills.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
              {skills.map((s) => (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    fontSize: 24,
                    padding: "8px 18px",
                    borderRadius: 999,
                    color: "#E9D5FF",
                    background: "rgba(139,92,246,0.16)",
                    border: "1px solid rgba(196,181,253,0.35)",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats + link */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", gap: 48 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <div style={{ display: "flex", fontSize: 52, fontWeight: 600, color: s === stats[0] ? "#6EE7B7" : "#FAFAFA" }}>{s.value}</div>
                <div style={{ display: "flex", fontSize: 24, color: "#94A3B8" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#C4B5FD" }}>{link}</div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
