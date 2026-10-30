"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { ReportReason } from "@/types/database";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam or scam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate or offensive content" },
  { value: "impersonation", label: "Pretending to be someone else" },
  { value: "underage", label: "Appears to be under 18" },
  { value: "other", label: "Something else" },
];

/**
 * "Report" and "Block" for another member. Reports go to the reports table
 * (the admin gets an email); blocking ends any connection and stops new
 * messages and connection requests in both directions (enforced by RLS).
 */
export default function SafetyActions({
  myId,
  targetId,
  targetName,
  messageId,
  onBlockedChange,
}: {
  myId: string;
  targetId: string;
  targetName: string;
  /** Latest message received from this person, attached to the report. */
  messageId?: string | null;
  onBlockedChange?: (blocked: boolean) => void;
}) {
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [attachMessage, setAttachMessage] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    createClient()
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", myId)
      .eq("blocked_id", targetId)
      .maybeSingle()
      .then(({ data }) => setBlocked(Boolean(data)));
  }, [myId, targetId]);

  const toggleBlock = async () => {
    if (busy) return;
    if (!blocked && !confirmBlock) { setConfirmBlock(true); return; }
    setBusy(true);
    setStatus("");
    const supabase = createClient();
    const { error } = blocked
      ? await supabase.from("blocks").delete().eq("blocker_id", myId).eq("blocked_id", targetId)
      : await supabase.from("blocks").insert({ blocker_id: myId, blocked_id: targetId });
    setBusy(false);
    setConfirmBlock(false);
    if (error) { setStatus(`Could not update: ${error.message}`); return; }
    setBlocked(!blocked);
    onBlockedChange?.(!blocked);
    setStatus(blocked ? `${targetName} is unblocked.` : `${targetName} is blocked.`);
  };

  const submitReport = async () => {
    if (!reason || busy) return;
    setBusy(true);
    setStatus("");
    const { error } = await createClient().from("reports").insert({
      reporter_id: myId,
      reported_id: targetId,
      reason,
      details: details.trim() || null,
      message_id: attachMessage && messageId ? messageId : null,
    });
    setBusy(false);
    if (error) { setStatus(`Could not send the report: ${error.message}`); return; }
    setReportOpen(false);
    setReason("");
    setDetails("");
    setStatus("Thanks, your report was sent. We review every report.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => { setReportOpen((o) => !o); setStatus(""); }} style={linkBtn}>
          Report
        </button>
        <button type="button" onClick={toggleBlock} disabled={busy} style={linkBtn}>
          {blocked ? "Unblock" : confirmBlock ? "Confirm block" : "Block"}
        </button>
        {confirmBlock && (
          <button type="button" onClick={() => setConfirmBlock(false)} style={linkBtn}>Cancel</button>
        )}
      </div>
      {confirmBlock && (
        <p style={noteStyle}>
          Blocking removes your connection with {targetName}. Neither of you can send messages or connection requests to the other.
        </p>
      )}
      {reportOpen && (
        <div style={panelStyle} role="dialog" aria-label={`Report ${targetName}`}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Report {targetName}</div>
          {REASONS.map((r) => (
            <label key={r.value} style={radioRow}>
              <input type="radio" name="report-reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
              {r.label}
            </label>
          ))}
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder="Anything that helps us review this (optional)"
            style={textareaStyle}
          />
          {messageId && (
            <label style={radioRow}>
              <input type="checkbox" checked={attachMessage} onChange={(e) => setAttachMessage(e.target.checked)} />
              Include their latest message
            </label>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={() => setReportOpen(false)} style={linkBtn}>Cancel</button>
            <button type="button" onClick={submitReport} disabled={!reason || busy} className="btn-accent"
              style={{ fontSize: 12, padding: "6px 12px", opacity: !reason || busy ? 0.5 : 1 }}>
              {busy ? "Sending…" : "Send report"}
            </button>
          </div>
        </div>
      )}
      {status && <p role="status" style={noteStyle}>{status}</p>}
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border)", borderRadius: 6,
  padding: "4px 10px", fontSize: 12, color: "var(--text-muted)", cursor: "pointer",
};
const noteStyle: React.CSSProperties = { fontSize: 12, color: "var(--text-muted)", margin: 0, maxWidth: 320, textAlign: "right" };
const panelStyle: React.CSSProperties = {
  width: "min(340px, 100%)", border: "1px solid var(--border)", borderRadius: 10,
  padding: 14, background: "var(--surface)", textAlign: "left",
};
const radioRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", padding: "3px 0", cursor: "pointer",
};
const textareaStyle: React.CSSProperties = {
  width: "100%", marginTop: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)",
  background: "var(--surface-raised)", color: "var(--text-primary)", fontSize: 13, resize: "vertical", boxSizing: "border-box",
};
