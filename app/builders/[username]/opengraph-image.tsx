import { ImageResponse } from "next/og";
import { createPublicClient } from "@/utils/supabase/public";
import { cleanList, cleanProfile } from "@/utils/display";
import { decodeUsernameParam, shortProfileUrl } from "@/utils/profileUrl";

// Per-profile share card for LinkedIn, X and WhatsApp (1200×630 is the size
// all three crop cleanly). Regenerated at most every 10 minutes.
export const revalidate = 600;
export const alt = "Builder profile on ProjectHub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same "P" glyph as app/icon.svg (Inter SemiBold, outlined).
const P_PATH =
  "M-4.24 5V-7.37H0.39Q1.81 -7.37 2.78 -6.84Q3.75 -6.3 4.25 -5.38Q4.74 -4.45 4.74 -3.27Q4.74 -2.09 4.24 -1.17Q3.74 -0.24 2.76 0.29Q1.78 0.82 0.35 0.82H-2.71V-1.01H0.06Q0.9 -1.01 1.44 -1.3Q1.97 -1.59 2.22 -2.1Q2.48 -2.62 2.48 -3.27Q2.48 -3.93 2.22 -4.44Q1.97 -4.94 1.43 -5.23Q0.9 -5.51 0.05 -5.51H-2.02V5Z";

// Satori can't read woff2; without a browser UA Google Fonts serves TTF.
// `text=` subsets the font to exactly the glyphs on the card, which also
// covers Turkish and other Latin-extended names.
async function loadInter(weight: 400 | 600, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!src) return null;
    const res = await fetch(src[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

function LogoMark({ px }: { px: number }) {
  return (
    <svg width={px} height={px} viewBox="-24 -24 48 48">
      <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="none" stroke="#8B5CF6" strokeWidth="1.8" />
      <polygon points="0,-14 12,-7 12,7 0,14 -12,7 -12,-7" fill="#8B5CF6" fillOpacity="0.15" />
      <path d={P_PATH} fill="#FAFAFA" />
    </svg>
  );
}

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
  const [regular, semibold] = await Promise.all([loadInter(400, allText), loadInter(600, allText)]);
  const fonts = [
    ...(regular ? [{ name: "Inter", data: regular, weight: 400 as const, style: "normal" as const }] : []),
    ...(semibold ? [{ name: "Inter", data: semibold, weight: 600 as const, style: "normal" as const }] : []),
  ];

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
          background:
            "radial-gradient(900px 520px at 85% -10%, rgba(139,92,246,0.32), transparent 70%), linear-gradient(180deg, #0A0A0F 0%, #120B1E 60%, #1A1025 100%)",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <LogoMark px={56} />
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
