import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | ProjectHub",
  description:
    "How ProjectHub collects, uses, and protects your data. We don't sell your information.",
};

const LAST_UPDATED = "April 24, 2026";

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  paddingTop: 32,
  position: "relative",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  padding: "64px 24px 96px",
};

const h1Style: React.CSSProperties = {
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  fontSize: "clamp(32px, 5vw, 44px)",
  letterSpacing: "-0.02em",
  color: "var(--text-primary)",
  marginBottom: 12,
};

const leadStyle: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: 15,
  color: "var(--text-secondary)",
  lineHeight: 1.7,
  marginBottom: 8,
};

const updatedStyle: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: 12,
  color: "var(--text-muted)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: 40,
};

const sectionStyle: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "28px 28px",
  marginBottom: 20,
};

const h2Style: React.CSSProperties = {
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  fontSize: 20,
  color: "var(--text-primary)",
  marginBottom: 14,
  letterSpacing: "-0.01em",
};

const pStyle: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: 14.5,
  color: "var(--text-secondary)",
  lineHeight: 1.7,
  marginBottom: 10,
};

const ulStyle: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: 14.5,
  color: "var(--text-secondary)",
  lineHeight: 1.75,
  paddingLeft: 22,
  marginBottom: 4,
};

const linkStyle: React.CSSProperties = {
  color: "var(--accent-bright)",
  textDecoration: "none",
  fontWeight: 500,
};

export default function PrivacyPage() {
  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />
      <div className="page-z animate-fade-up" style={wrapStyle}>
        <h1 style={h1Style}>Privacy Policy</h1>
        <p style={leadStyle}>
          ProjectHub is a pre-launch community platform for student founders and builders. This
          policy explains what we collect, why we collect it, and what control you have over it.
        </p>
        <div style={updatedStyle}>Last updated · {LAST_UPDATED}</div>

        <section style={sectionStyle}>
          <h2 style={h2Style}>What we collect</h2>
          <p style={pStyle}>When you create an account and use ProjectHub, we store:</p>
          <ul style={ulStyle}>
            <li>Your email address (used for sign-in and essential account messages).</li>
            <li>
              Profile information you provide &mdash; full name, username, university, role,
              bio, skills, interests, and links (GitHub, LinkedIn, portfolio, avatar).
            </li>
            <li>Projects you post, including title, description, tech stack, and roles you&apos;re looking for.</li>
            <li>
              Connections and applications &mdash; the requests you send or accept, and the
              projects you apply to.
            </li>
            <li>
              Messages exchanged with other users, if you use the messaging feature.
            </li>
            <li>
              Basic technical data &mdash; session cookies used by our auth provider, and
              standard server logs.
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>How we use your data</h2>
          <ul style={ulStyle}>
            <li>To create and secure your account.</li>
            <li>To show your public profile and projects to other users so they can connect with you.</li>
            <li>To power collaboration features: applications, connections, endorsements, and direct messages.</li>
            <li>To match you with relevant projects, builders, and opportunities on the platform.</li>
            <li>To send essential service notifications (e.g., a connection request or accepted application).</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>We do not sell your data</h2>
          <p style={pStyle}>
            ProjectHub does not sell your personal information to third parties and does not share
            it for advertising purposes. We only share data with the infrastructure providers we
            rely on to operate the service (for example, database and authentication hosting), and
            only to the extent required to run ProjectHub.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Cookies and sessions</h2>
          <p style={pStyle}>
            We use cookies only for authentication and session management &mdash; the minimum needed
            to keep you signed in. We don&apos;t use third-party advertising or tracking cookies.
            Basic privacy-respecting analytics may be used to understand aggregate usage.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Your rights &amp; deletion requests</h2>
          <p style={pStyle}>
            You can edit your profile information at any time from your account settings. If you
            want your account deleted, or want a copy of the data we hold about you, email us and
            we&apos;ll handle your request within a reasonable time frame.
          </p>
          <p style={pStyle}>
            Contact:{" "}
            <a href="mailto:yigitalpyazici53@gmail.com" style={linkStyle}>
              yigitalpyazici53@gmail.com
            </a>
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Changes to this policy</h2>
          <p style={pStyle}>
            ProjectHub is early-stage, and this policy may evolve as the product matures. When we
            make material changes, we&apos;ll update the &ldquo;last updated&rdquo; date above and,
            where appropriate, notify you in-app or by email.
          </p>
        </section>

        <div style={{ marginTop: 32, fontSize: 13, color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}>
          See also:{" "}
          <Link href="/terms" style={linkStyle}>Terms of Service</Link>
          {"  ·  "}
          <Link href="/contact" style={linkStyle}>Contact</Link>
        </div>
      </div>
    </main>
  );
}
