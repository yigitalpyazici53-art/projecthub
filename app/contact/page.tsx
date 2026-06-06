import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | ProjectHub",
  description:
    "Get in touch with ProjectHub — feedback, support, and collaboration inquiries welcome.",
};

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  paddingTop: 32,
  position: "relative",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "80px 24px 96px",
};

const h1Style: React.CSSProperties = {
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  fontSize: "clamp(34px, 5vw, 48px)",
  letterSpacing: "-0.02em",
  color: "var(--text-primary)",
  marginBottom: 14,
};

const leadStyle: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: 16,
  color: "var(--text-secondary)",
  lineHeight: 1.7,
  marginBottom: 36,
};

const cardStyle: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: "32px 32px",
  marginBottom: 20,
};

const labelStyle: React.CSSProperties = {
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: 10,
};

const primaryLineStyle: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: 20,
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: 6,
};

const mutedStyle: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: 14,
  color: "var(--text-secondary)",
  lineHeight: 1.7,
};

const linkStyle: React.CSSProperties = {
  color: "var(--accent-bright)",
  textDecoration: "none",
  fontWeight: 600,
};

const pillRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 18,
};

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.03)",
  fontFamily: "DM Sans, sans-serif",
  fontSize: 12.5,
  fontWeight: 500,
  color: "var(--text-secondary)",
  letterSpacing: "0.01em",
};

export default function ContactPage() {
  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />
      <div className="page-z animate-fade-up" style={wrapStyle}>
        <h1 style={h1Style}>Contact</h1>
        <p style={leadStyle}>
          ProjectHub is a community platform for student founders and builders &mdash; post your
          startup idea, meet talented collaborators at university, and build real projects
          together. We&apos;re pre-launch and actively shaping the product, so your feedback
          genuinely matters.
        </p>

        <div style={cardStyle}>
          <div style={labelStyle}>Email us</div>
          <div style={primaryLineStyle}>
            <a href="mailto:yigitalpyazici53@gmail.com" style={linkStyle}>
              yigitalpyazici53@gmail.com
            </a>
          </div>
          <div style={mutedStyle}>
            The fastest way to reach us. We read every message.
          </div>

          <div style={pillRowStyle}>
            <span style={pillStyle}>Feedback welcome</span>
            <span style={pillStyle}>Bug reports</span>
            <span style={pillStyle}>Partnerships</span>
            <span style={pillStyle}>Press &amp; student clubs</span>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Live website</div>
          <div style={primaryLineStyle}>
            <a
              href="https://projecthubstudents.com"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              projecthubstudents.com
            </a>
          </div>
          <div style={mutedStyle}>
            Browse projects and builders, or sign up to post your own idea.
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>What to write about</div>
          <div style={{ ...mutedStyle, marginBottom: 8 }}>
            A few things we&apos;re especially happy to hear from you about:
          </div>
          <ul style={{ ...mutedStyle, paddingLeft: 22, lineHeight: 1.85 }}>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Product feedback</strong> &mdash; what&apos;s
              missing, what&apos;s confusing, what would make ProjectHub 10x better for you.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Support</strong> &mdash; trouble with your
              account, a broken feature, or a question about how something works.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Collaboration</strong> &mdash; student
              clubs, university orgs, accelerators, or anyone who wants to bring ProjectHub to their
              community.
            </li>
          </ul>
        </div>

        <div style={{ marginTop: 24, fontSize: 13, color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}>
          See also:{" "}
          <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>
          {"  ·  "}
          <Link href="/terms" style={linkStyle}>Terms of Service</Link>
        </div>
      </div>
    </main>
  );
}
