// Shared pieces for the next/og share cards (site-wide and per-profile), so
// every card a link unfurls into speaks the same dark visual language.

// Same "P" glyph as app/icon.svg (Inter SemiBold, outlined).
const P_PATH =
  "M-4.24 5V-7.37H0.39Q1.81 -7.37 2.78 -6.84Q3.75 -6.3 4.25 -5.38Q4.74 -4.45 4.74 -3.27Q4.74 -2.09 4.24 -1.17Q3.74 -0.24 2.76 0.29Q1.78 0.82 0.35 0.82H-2.71V-1.01H0.06Q0.9 -1.01 1.44 -1.3Q1.97 -1.59 2.22 -2.1Q2.48 -2.62 2.48 -3.27Q2.48 -3.93 2.22 -4.44Q1.97 -4.94 1.43 -5.23Q0.9 -5.51 0.05 -5.51H-2.02V5Z";

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_BACKGROUND =
  "radial-gradient(900px 520px at 85% -10%, rgba(139,92,246,0.32), transparent 70%), linear-gradient(180deg, #0A0A0F 0%, #120B1E 60%, #1A1025 100%)";

export function OgLogoMark({ px }: { px: number }) {
  return (
    <svg width={px} height={px} viewBox="-24 -24 48 48">
      <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="none" stroke="#8B5CF6" strokeWidth="1.8" />
      <polygon points="0,-14 12,-7 12,7 0,14 -12,7 -12,-7" fill="#8B5CF6" fillOpacity="0.15" />
      <path d={P_PATH} fill="#FAFAFA" />
    </svg>
  );
}

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

/** Inter 400 + 600 subset to `text`; empty when Google Fonts is unreachable (Satori then uses its default). */
export async function loadOgFonts(text: string) {
  const [regular, semibold] = await Promise.all([loadInter(400, text), loadInter(600, text)]);
  return [
    ...(regular ? [{ name: "Inter", data: regular, weight: 400 as const, style: "normal" as const }] : []),
    ...(semibold ? [{ name: "Inter", data: semibold, weight: 600 as const, style: "normal" as const }] : []),
  ];
}
