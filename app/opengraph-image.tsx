import { ImageResponse } from "next/og";

export const alt = "ProjectHub — Where student builders prove what they've built";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HEADLINE = "Where student builders prove what they've built.";

// Satori can't read woff2; without a browser UA Google Fonts serves TTF.
async function loadFraunces(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Fraunces:wght@500&text=${encodeURIComponent(text)}`)
    ).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!src) return null;
    const res = await fetch(src[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const fraunces = await loadFraunces(HEADLINE);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#FAFAF8",
          color: "#1A1A18",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#0F6E56" }} />
          <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#6B6B66" }}>
            ProjectHub
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 78,
            lineHeight: 1.08,
            letterSpacing: -1.5,
            maxWidth: 980,
            fontFamily: fraunces ? "Fraunces" : undefined,
          }}
        >
          {HEADLINE}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #E8E8E4",
            paddingTop: 28,
            fontSize: 26,
            color: "#6B6B66",
          }}
        >
          <div style={{ display: "flex" }}>Proof-of-work portfolios · First 100 Builders</div>
          <div style={{ display: "flex", color: "#1A1A18" }}>projecthubstudents.com</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fraunces ? [{ name: "Fraunces", data: fraunces, weight: 500, style: "normal" }] : undefined,
    },
  );
}
