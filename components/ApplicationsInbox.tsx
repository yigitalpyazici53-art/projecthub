"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { getInitials } from "@/utils/getInitials";
import { cleanProfiles } from "@/utils/display";
import type { Application, Profile } from "@/types";

/**
 * Applications to one or more projects the signed-in user owns, with
 * Accept / Decline. Used on the project page (one project) and the dashboard
 * (all of the owner's projects).
 *
 * Status values follow the DB check constraint: pending | accepted | rejected.
 * The applicant is notified with application_accepted / application_rejected —
 * the notifications type constraint has no "declined" variant, so "Decline"
 * in the UI maps to "rejected" in the data.
 */

type ApplicantProfile = Pick<Profile, "id" | "full_name" | "username" | "university" | "role">;

interface Row extends Application {
  applicant: ApplicantProfile | undefined;
}

function getAvatarColor(id: string): string {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  return colors[id.charCodeAt(0) % colors.length];
}

export default function ApplicationsInbox({
  ownerId,
  projects,
  id,
  hideWhenEmpty = false,
}: {
  ownerId: string;
  projects: { id: string; title: string | null }[];
  /** DOM id, so notifications can deep-link with #applications. */
  id?: string;
  /** The dashboard hides the card entirely when nobody has applied. */
  hideWhenEmpty?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const projectKey = projects.map((p) => p.id).join(",");
  const showProjectTitle = projects.length > 1;

  useEffect(() => {
    const projectIds = projectKey ? projectKey.split(",") : [];
    if (projectIds.length === 0) { setRows([]); setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error: appErr } = await supabase
        .from("applications")
        .select("id, project_id, applicant_id, role, message, status, created_at")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (appErr) { setError(appErr.message); setLoading(false); return; }

      const apps = (data ?? []) as Application[];
      const applicantIds = [...new Set(apps.map((a) => a.applicant_id))];
      const profMap: Record<string, ApplicantProfile> = {};
      if (applicantIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, username, university, role")
          .in("id", applicantIds);
        cleanProfiles(profs as ApplicantProfile[] | null).forEach((p) => { profMap[p.id] = p; });
      }
      if (cancelled) return;
      // Pending first, then newest.
      const order = { pending: 0, accepted: 1, rejected: 2 } as Record<string, number>;
      setRows(
        apps
          .map((a) => ({ ...a, applicant: profMap[a.applicant_id] }))
          .sort((x, y) => (order[x.status] ?? 3) - (order[y.status] ?? 3) || y.created_at.localeCompare(x.created_at)),
      );
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [projectKey]);

  const decide = async (row: Row, status: "accepted" | "rejected") => {
    if (busyId) return;
    setBusyId(row.id);
    setError("");
    setNotice("");
    const supabase = createClient();
    try {
      const { data, error: updErr } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", row.id)
        .select("id");
      if (updErr) { setError(updErr.message); return; }
      // RLS turns an unauthorized update into "0 rows", not an error.
      if (!data || data.length === 0) { setError("You can only review applications to your own projects."); return; }

      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));

      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: row.applicant_id,
        type: status === "accepted" ? "application_accepted" : "application_rejected",
        from_user_id: ownerId,
        entity_id: row.project_id,
      });
      if (notifErr) setNotice(`Saved, but the applicant could not be notified: ${notifErr.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = rows.filter((r) => r.status === "pending").length;
  if (hideWhenEmpty && !loading && rows.length === 0 && !error) return null;

  const titleFor = (pid: string) => projects.find((p) => p.id === pid)?.title ?? "Untitled project";

  return (
    <section id={id} style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={labelStyle}>Applications</h2>
        {pendingCount > 0 && <span style={countStyle}>{pendingCount} pending</span>}
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {notice && <div style={noticeStyle}>{notice}</div>}

      {loading ? (
        <p style={emptyStyle}>Loading applications…</p>
      ) : rows.length === 0 ? (
        <p style={emptyStyle}>No applications yet. They&apos;ll show up here when builders apply.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((row) => {
            const p = row.applicant;
            const name = p?.full_name || p?.username || "Unknown builder";
            const sub = [row.role, p?.university || p?.role].filter(Boolean).join(" · ");
            const busy = busyId === row.id;
            return (
              <div key={row.id} style={rowStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{ ...avatarStyle, background: getAvatarColor(row.applicant_id) }}>
                    {getInitials(p?.full_name, p?.username)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {p?.username ? (
                      <Link href={`/builders/${p.username}`} className="u-link" style={nameStyle} title={name}>{name}</Link>
                    ) : (
                      <div style={nameStyle} title={name}>{name}</div>
                    )}
                    {sub && <div style={subStyle}>{sub}</div>}
                  </div>
                  <StatusBadge status={row.status} />
                </div>

                {row.message && <p style={messageStyle}>&ldquo;{row.message}&rdquo;</p>}

                {showProjectTitle && (
                  <div style={projectStyle}>
                    Project:{" "}
                    <Link href={`/projects/${row.project_id}`} className="u-link" style={{ color: "var(--text-secondary)" }}>
                      {titleFor(row.project_id)}
                    </Link>
                  </div>
                )}

                {row.status === "pending" && (
                  <div style={actionsStyle}>
                    <button type="button" disabled={!!busyId} onClick={() => decide(row, "accepted")} style={{ ...acceptBtnStyle, opacity: busy ? 0.6 : 1 }}>
                      {busy ? "…" : "Accept"}
                    </button>
                    <button type="button" disabled={!!busyId} onClick={() => decide(row, "rejected")} style={{ ...declineBtnStyle, opacity: busy ? 0.6 : 1 }}>
                      Decline
                    </button>
                    {p?.username && (
                      <Link href={`/builders/${p.username}`} style={ghostBtnStyle}>View profile</Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted") {
    return <span style={{ ...badgeStyle, color: "var(--accent-green)", background: "var(--accent-green-glow)" }}>Accepted</span>;
  }
  if (status === "rejected") {
    return <span style={{ ...badgeStyle, color: "var(--danger)", background: "var(--danger-bg)" }}>Declined</span>;
  }
  return <span style={{ ...badgeStyle, color: "var(--warning)", background: "color-mix(in srgb, var(--warning) 12%, transparent)" }}>Pending</span>;
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 24,
  scrollMarginTop: 88,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-sans)",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  margin: 0,
};

const countStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--accent-contrast)",
  background: "var(--accent)",
  borderRadius: 20,
  padding: "2px 9px",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "14px",
  borderRadius: 10,
  background: "var(--surface-raised)",
  border: "1px solid var(--border-subtle)",
};

const avatarStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 700,
  color: "white",
  flexShrink: 0,
};

const nameStyle: React.CSSProperties = {
  display: "block",
  fontSize: 15,
  fontWeight: 700,
  color: "var(--text-primary)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const subStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-secondary)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const badgeStyle: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 20,
  padding: "3px 9px",
};

const messageStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  margin: 0,
  fontStyle: "italic",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const projectStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const btnBase: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
  textDecoration: "none",
};

const acceptBtnStyle: React.CSSProperties = {
  ...btnBase,
  border: "1px solid var(--accent-green-glow)",
  background: "var(--accent-green-glow)",
  color: "var(--accent-green)",
};

const declineBtnStyle: React.CSSProperties = {
  ...btnBase,
  border: "1px solid var(--danger-border)",
  background: "var(--danger-bg)",
  color: "var(--danger)",
};

const ghostBtnStyle: React.CSSProperties = {
  ...btnBase,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-secondary)",
};

const emptyStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
  margin: 0,
};

const errorStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  marginBottom: 12,
  background: "var(--danger-bg)",
  border: "1px solid var(--danger-border)",
  color: "var(--danger)",
  fontSize: 13,
};

const noticeStyle: React.CSSProperties = {
  ...errorStyle,
  background: "color-mix(in srgb, var(--warning) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
  color: "var(--warning)",
};
