"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Counts = { projects: number; messages: number; applications: number; connections: number };

/**
 * Two-step account deletion: the first click lists exactly what will be
 * deleted, the second requires typing DELETE. The deletion itself runs on the
 * server (/api/account/delete) for the signed-in user only.
 */
export default function DeleteAccount({ userId, startOpen = false }: { userId: string; startOpen?: boolean }) {
  const [step, setStep] = useState<"idle" | "confirm">(startOpen ? "confirm" : "idle");
  const [counts, setCounts] = useState<Counts | null>(null);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Load the counts once the confirmation step opens.
  useEffect(() => {
    if (step !== "confirm" || counts) return;
    const supabase = createClient();
    const head = { count: "exact" as const, head: true };
    Promise.all([
      supabase.from("projects").select("id", head).eq("owner_id", userId),
      supabase.from("messages").select("id", head).or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
      supabase.from("applications").select("id", head).eq("applicant_id", userId),
      supabase.from("connections").select("id", head).or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
    ]).then(([p, m, a, c]) => {
      setCounts({ projects: p.count ?? 0, messages: m.count ?? 0, applications: a.count ?? 0, connections: c.count ?? 0 });
    });
  }, [step, counts, userId]);

  const handleDelete = async () => {
    if (typed !== "DELETE" || deleting) return;
    setDeleting(true);
    setError("");
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(`Could not delete your account${body.error ? ` (${body.error})` : ""}. Please try again or email us.`);
      setDeleting(false);
      return;
    }
    await createClient().auth.signOut().catch(() => {});
    window.location.assign("/?account=deleted");
  };

  if (step === "idle") {
    return (
      <button type="button" onClick={() => setStep("confirm")} style={dangerOutlineBtn}>
        Delete my account…
      </button>
    );
  }

  const n = (v: number | undefined, one: string, many: string) =>
    v === undefined ? many : `${v} ${v === 1 ? one : many}`;

  return (
    <div style={panelStyle}>
      <p style={{ ...textStyle, fontWeight: 600, color: "var(--text-primary)" }}>
        This permanently deletes your account. It can&apos;t be undone.
      </p>
      <ul style={{ ...textStyle, paddingLeft: 20, margin: "8px 0 12px" }}>
        <li>Your profile, photo and username</li>
        <li>Your projects ({n(counts?.projects, "project", "projects")}), their updates and the applications people sent to them</li>
        <li>Your messages ({n(counts?.messages, "message", "messages")}), sent and received, for both sides of the conversation</li>
        <li>Your applications to other projects ({n(counts?.applications, "application", "applications")})</li>
        <li>Your connections ({n(counts?.connections, "connection", "connections")}), endorsements, notifications and blocks</li>
        <li>Any /apply form you submitted with this email address</li>
      </ul>
      <p style={textStyle}>
        Reports you filed are kept without your name so we can finish reviewing them.
        Type <strong>DELETE</strong> to confirm.
      </p>
      <input
        type="text"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        aria-label="Type DELETE to confirm"
        placeholder="DELETE"
        autoComplete="off"
        style={inputStyle}
      />
      {error && <p style={{ ...textStyle, color: "var(--danger)", marginTop: 8 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={() => { setStep("idle"); setTyped(""); setError(""); }} disabled={deleting} style={cancelBtn}>
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={typed !== "DELETE" || deleting}
          style={{ ...dangerBtn, opacity: typed !== "DELETE" || deleting ? 0.5 : 1 }}
        >
          {deleting ? "Deleting…" : "Permanently delete my account"}
        </button>
      </div>
    </div>
  );
}

const textStyle: React.CSSProperties = { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 };
const panelStyle: React.CSSProperties = {
  border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
  borderRadius: 10,
  padding: 16,
  background: "color-mix(in srgb, var(--danger) 6%, transparent)",
};
const inputStyle: React.CSSProperties = {
  width: "100%", maxWidth: 240, marginTop: 10, padding: "10px 12px", borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)",
  fontSize: 14, boxSizing: "border-box",
};
const dangerOutlineBtn: React.CSSProperties = {
  padding: "10px 16px", borderRadius: 8, border: "1px solid var(--danger)", background: "transparent",
  color: "var(--danger)", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const dangerBtn: React.CSSProperties = {
  padding: "10px 16px", borderRadius: 8, border: "none", background: "var(--danger)",
  color: "#FFFFFF", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const cancelBtn: React.CSSProperties = {
  padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)",
  color: "var(--text-primary)", fontSize: 13, fontWeight: 500, cursor: "pointer",
};
