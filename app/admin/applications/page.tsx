// ACCESS CONTROL NOTE:
// This page is protected by checking that the authenticated user's email
// matches the admin email (yigitalpyazici53@gmail.com).
// The Supabase RLS policy on builder_applications mirrors this check —
// only a session with that email can SELECT rows.
// If you need to change the admin account, update both this file and
// the "builder_applications: admin read" RLS policy in the migration.

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type Application =
  Database["public"]["Tables"]["builder_applications"]["Row"];

const ADMIN_EMAIL = "yigitalpyazici53@gmail.com";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    new: {
      background: "var(--surface-raised)",
      color: "var(--tint-blue-text)",
      border: "1px solid var(--border)",
    },
    reviewed: {
      background: "var(--tint-amber-bg)",
      color: "var(--tint-amber-text)",
      border: "1px solid var(--tint-amber-bg)",
    },
    accepted: {
      background: "var(--accent-green-glow)",
      color: "var(--accent-green)",
      border: "1px solid var(--accent-green-glow)",
    },
    rejected: {
      background: "var(--danger-bg)",
      color: "var(--danger)",
      border: "1px solid var(--danger-border)",
    },
  };

  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: 999,
        fontFamily: "var(--font-sans)",
        ...(styles[status] ?? styles.new),
      }}
    >
      {status}
    </span>
  );
}

function LinkChip({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-block",
        fontSize: 12,
        padding: "2px 10px",
        borderRadius: 6,
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        color: "var(--accent)",
        textDecoration: "none",
        fontFamily: "var(--font-sans)",
      }}
    >
      {label} ↗
    </a>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/login");
  }

  const { data: applications, error } = await supabase
    .from("builder_applications")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (applications ?? []) as Application[];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        padding: "48px 24px 80px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: "3px 12px",
              marginBottom: 16,
            }}
          >
            Admin · First 100 Builders
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 28,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: 6,
              letterSpacing: "-0.02em",
            }}
          >
            Applications
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {rows.length} application{rows.length !== 1 ? "s" : ""} submitted
            {error && (
              <span style={{ color: "var(--danger)", marginLeft: 8 }}>
                · fetch error: {error.message}
              </span>
            )}
          </p>
        </div>

        {/* Empty state */}
        {rows.length === 0 && !error && (
          <div
            style={{
              textAlign: "center",
              padding: "80px 24px",
              background: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 16,
              color: "var(--text-muted)",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
            }}
          >
            No applications yet. Share the /apply link to get started.
          </div>
        )}

        {/* Application cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {rows.map((app) => (
            <div
              key={app.id}
              style={{
                background:
                  "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "28px 32px",
                boxShadow: "0 4px 24px rgba(26,26,24,0.08)",
              }}
            >
              {/* Row 1 — name / email / status / date */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: 17,
                      color: "var(--text-primary)",
                      marginRight: 10,
                    }}
                  >
                    {app.full_name}
                  </span>
                  <StatusBadge status={app.status} />
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {app.email}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-sans)",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {formatDate(app.created_at)}
                </div>
              </div>

              {/* Row 2 — chips */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {app.university && (
                  <Chip label={app.university} icon="🎓" />
                )}
                {app.role && <Chip label={app.role} icon="🧑‍💻" />}
                {app.project_name && (
                  <Chip label={app.project_name} icon="🚀" />
                )}
                {app.looking_for_teammates && (
                  <Chip label="Looking for teammates" icon="👥" accent />
                )}
              </div>

              {/* Skills */}
              {app.skills && (
                <Detail label="Skills" value={app.skills} />
              )}

              {/* What building */}
              {app.what_building && (
                <Detail label="What they're building" value={app.what_building} />
              )}

              {/* Looking for roles */}
              {app.looking_for_roles && (
                <Detail label="Looking for roles" value={app.looking_for_roles} />
              )}

              {/* Why join */}
              {app.why_join && (
                <Detail label="Why join ProjectHub" value={app.why_join} />
              )}

              {/* Links */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <LinkChip href={app.github_url} label="GitHub" />
                <LinkChip href={app.linkedin_url} label="LinkedIn" />
                <LinkChip href={app.demo_url} label="Demo" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Chip({
  label,
  icon,
  accent,
}: {
  label: string;
  icon?: string;
  accent?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        fontWeight: 500,
        padding: "4px 10px",
        borderRadius: 999,
        fontFamily: "var(--font-sans)",
        background: accent
          ? "var(--surface-raised)"
          : "var(--surface-raised)",
        border: accent
          ? "1px solid var(--border)"
          : "1px solid var(--border)",
        color: accent ? "var(--accent)" : "var(--text-secondary)",
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: 4,
          fontFamily: "var(--font-sans)",
        }}
      >
        {label}
      </div>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          fontFamily: "var(--font-sans)",
          lineHeight: 1.6,
          margin: 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {value}
      </p>
    </div>
  );
}
