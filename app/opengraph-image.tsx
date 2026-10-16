import { ImageResponse } from "next/og";
import { OG_BACKGROUND, OG_SIZE, OgLogoMark, loadOgFonts } from "@/utils/og";

// Site-wide share card (home and every page without its own image). Same
// dark language as the per-profile cards in app/builders/[username].
export const alt = "ProjectHub — Prove what you build.";
export const size = OG_SIZE;
export const contentType = "image/png";

const HEADLINE = "Prove what you build.";
const SUBHEAD = "A proof-of-work portfolio for student builders: ship projects, show the receipts, share one link.";
const PILLS = ["Shipped projects", "Real teams", "One shareable profile"];
const FOOTER_LEFT = "For student builders";
const FOOTER_RIGHT = "projecthubstudents.com";

export default async function OpengraphImage() {
  const fonts = await loadOgFonts(["ProjectHub", HEADLINE, SUBHEAD, ...PILLS, FOOTER_LEFT, FOOTER_RIGHT].join(" "));

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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <OgLogoMark px={56} />
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>ProjectHub</div>
        </div>

        {/* Message */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 600, letterSpacing: -3, lineHeight: 1.02 }}>
            {HEADLINE}
          </div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.4, color: "#CBD5E1", maxWidth: 960 }}>
            {SUBHEAD}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            {PILLS.map((p) => (
              <div
                key={p}
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
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 28,
            fontSize: 24,
          }}
        >
          <div style={{ display: "flex", color: "#94A3B8" }}>{FOOTER_LEFT}</div>
          <div style={{ display: "flex", color: "#C4B5FD" }}>{FOOTER_RIGHT}</div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
