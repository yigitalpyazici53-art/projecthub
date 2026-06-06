import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | ProjectHub",
  description:
    "The rules for using ProjectHub during our pre-launch period. Be respectful, don't spam or impersonate others, and build cool things.",
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

export default function TermsPage() {
  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />
      <div className="page-z animate-fade-up" style={wrapStyle}>
        <h1 style={h1Style}>Terms of Service</h1>
        <p style={leadStyle}>
          These are the ground rules for using ProjectHub. By creating an account or using the
          service you agree to them. They&apos;re short on purpose &mdash; we want this to be a
          place student founders actually enjoy.
        </p>
        <div style={updatedStyle}>Last updated · {LAST_UPDATED}</div>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Who can use ProjectHub</h2>
          <p style={pStyle}>
            ProjectHub is intended for students and early-career builders who want to meet
            collaborators and post projects. You must provide accurate information about yourself
            and keep your account credentials secure.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Acceptable use</h2>
          <p style={pStyle}>When using ProjectHub, you agree to <strong>not</strong>:</p>
          <ul style={ulStyle}>
            <li>Spam other users, send unsolicited bulk messages, or mass-send connection requests.</li>
            <li>Harass, bully, threaten, or discriminate against anyone on the platform.</li>
            <li>Impersonate another person, organization, or university.</li>
            <li>Post illegal, abusive, hateful, sexual, or deliberately misleading content.</li>
            <li>Scrape, crawl, or abuse the platform with automated tools.</li>
            <li>Attempt to break security, bypass access controls, or disrupt the service.</li>
          </ul>
          <p style={pStyle}>
            We may suspend or remove accounts that violate these rules, at our discretion, to
            keep ProjectHub safe for everyone.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Your content</h2>
          <p style={pStyle}>
            You&apos;re responsible for what you post &mdash; your profile, projects, applications,
            and messages. You retain ownership of your content, and you grant ProjectHub a limited
            license to host and display it on the platform as needed to run the service.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Early-stage service &mdash; provided as-is</h2>
          <p style={pStyle}>
            ProjectHub is a pre-launch, early-stage product. Features may change, break, or be
            removed as we iterate. The service is provided <strong>as-is</strong> and{" "}
            <strong>as-available</strong>, without warranties of any kind, either express or
            implied, including fitness for a particular purpose, reliability, accuracy, or
            non-infringement.
          </p>
          <p style={pStyle}>
            To the maximum extent permitted by law, ProjectHub and its maintainers are not liable
            for indirect, incidental, or consequential damages arising from your use of the
            service.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Account termination</h2>
          <p style={pStyle}>
            You can stop using ProjectHub at any time and request account deletion by emailing us.
            We may also suspend or terminate accounts that break these terms or put other users at
            risk.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Governing law</h2>
          <p style={pStyle}>
            These terms are governed by the laws of the Republic of Türkiye (Turkey). Any disputes
            shall be subject to the jurisdiction of the competent courts in Turkey.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Contact</h2>
          <p style={pStyle}>
            Questions, concerns, or reports of abuse? Email{" "}
            <a href="mailto:yigitalpyazici53@gmail.com" style={linkStyle}>
              yigitalpyazici53@gmail.com
            </a>{" "}
            and we&apos;ll get back to you.
          </p>
        </section>

        <div style={{ marginTop: 32, fontSize: 13, color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}>
          See also:{" "}
          <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>
          {"  ·  "}
          <Link href="/contact" style={linkStyle}>Contact</Link>
        </div>
      </div>
    </main>
  );
}
