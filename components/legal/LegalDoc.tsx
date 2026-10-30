import Link from "next/link";

// Shared layout for /privacy, /terms, /kvkk and /cookies.

export function LegalDoc({
  title,
  lead,
  updated,
  updatedLabel = "Last updated",
  lang,
  children,
  seeAlso,
}: {
  title: string;
  lead: React.ReactNode;
  updated: string;
  updatedLabel?: string;
  lang?: string;
  children: React.ReactNode;
  seeAlso: { href: string; label: string }[];
}) {
  return (
    <main style={pageStyle} lang={lang}>
      <div className="page-z animate-fade-up" style={wrapStyle}>
        <h1 style={h1Style}>{title}</h1>
        <p style={leadStyle}>{lead}</p>
        <div style={updatedStyle}>{updatedLabel} · {updated}</div>
        {children}
        <div style={{ marginTop: 32, fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
          {seeAlso.map((l, i) => (
            <span key={l.href}>
              {i > 0 && "  ·  "}
              <Link href={l.href} style={linkStyle}>{l.label}</Link>
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

export function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} style={sectionStyle}>
      <h2 style={h2Style}>{title}</h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p style={pStyle}>{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul style={ulStyle}>{children}</ul>;
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  return href.startsWith("/") || href.startsWith("#")
    ? <Link href={href} style={linkStyle}>{children}</Link>
    : <a href={href} style={linkStyle}>{children}</a>;
}

/** Simple responsive table: scrolls sideways on narrow screens instead of the page. */
export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: 6 }}>
      <table style={tableStyle}>
        <thead>
          <tr>{head.map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} style={tdStyle}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const pageStyle: React.CSSProperties = { minHeight: "100vh", paddingTop: 32, position: "relative" };
const wrapStyle: React.CSSProperties = { maxWidth: 820, margin: "0 auto", padding: "64px 16px 96px" };
const h1Style: React.CSSProperties = {
  fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: "clamp(32px, 5vw, 44px)",
  letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 12,
};
const leadStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8,
};
const updatedStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)",
  letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 40,
};
const sectionStyle: React.CSSProperties = {
  background: "var(--gradient-card)", border: "1px solid var(--border)", borderRadius: 16,
  padding: "24px 22px", marginBottom: 20, scrollMarginTop: 96,
};
const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20, color: "var(--text-primary)",
  marginBottom: 14, letterSpacing: "-0.01em",
};
const pStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 10,
};
const ulStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.75,
  paddingLeft: 22, marginBottom: 10,
};
const linkStyle: React.CSSProperties = { color: "var(--accent-bright)", textDecoration: "none", fontWeight: 500 };
const tableStyle: React.CSSProperties = {
  width: "100%", minWidth: 560, borderCollapse: "collapse", fontFamily: "var(--font-sans)", fontSize: 13.5,
  color: "var(--text-secondary)", lineHeight: 1.55,
};
const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border)",
  color: "var(--text-primary)", fontWeight: 600, verticalAlign: "bottom",
};
const tdStyle: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", verticalAlign: "top" };
