// send-notification-email
//
// Called by pg_net from public.enqueue_notification_email() with
// { email_log_id }. All eligibility and rate-limit rules already ran in SQL;
// this function claims the queued row, renders one short email, sends it
// through Resend, and records the outcome on the row.
//
// No JWT is required (pg_net calls it directly). That is safe because the
// only input is an email_log id: rows are created solely by database
// triggers, clients cannot read the table, and a row is claimed exactly once
// (queued → sending), so a guessed or replayed id does nothing.
//
// Secrets: RESEND_API_KEY (set in the Supabase dashboard). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided by the runtime.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_URL = "https://projecthubstudents.com";
const FROM = "ProjectHub <notifications@projecthubstudents.com>";
const EMPTY = new Set(["", "nil", "null", "none", "n/a", "na", "-"]);

type Kind =
  | "connection_request"
  | "connection_accepted"
  | "application_received"
  | "application_accepted"
  | "application_rejected"
  | "new_message"
  | "test"
  | "report";

interface LogRow {
  id: string;
  user_id: string;
  kind: Kind;
  from_user_id: string | null;
  entity_id: string | null;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function clean(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return EMPTY.has(t.toLowerCase()) ? null : t;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function profileUrl(username: string): string {
  return `${SITE_URL}/builders/${encodeURIComponent(username)}`;
}

function compose(
  kind: Kind,
  name: string,
  project: string,
  ctx: { fromId: string | null; fromUsername: string | null; projectId: string | null; reportedUsername?: string | null },
): { sentence: string; button: string; href: string } {
  const projectHref = ctx.projectId ? `${SITE_URL}/projects/${ctx.projectId}` : `${SITE_URL}/projects`;
  switch (kind) {
    case "connection_request":
      return { sentence: `${name} wants to connect with you on ProjectHub`, button: "View request", href: `${SITE_URL}/connections` };
    case "connection_accepted":
      return {
        sentence: `${name} accepted your connection request on ProjectHub`,
        button: "View profile",
        href: ctx.fromUsername ? profileUrl(ctx.fromUsername) : `${SITE_URL}/connections`,
      };
    case "application_received":
      return { sentence: `${name} applied to join ${project} on ProjectHub`, button: "Review application", href: `${projectHref}#applications` };
    case "application_accepted":
      return { sentence: `Your application to ${project} was accepted`, button: "Open project", href: projectHref };
    case "application_rejected":
      return { sentence: `Your application to ${project} wasn't accepted this time`, button: "Browse projects", href: `${SITE_URL}/projects` };
    case "new_message":
      return {
        sentence: `${name} sent you a message on ProjectHub`,
        button: "Read message",
        href: ctx.fromId ? `${SITE_URL}/messages?with=${ctx.fromId}` : `${SITE_URL}/messages`,
      };
    case "test":
      return { sentence: "This is a test notification from ProjectHub", button: "Open dashboard", href: `${SITE_URL}/dashboard` };
    case "report":
      return {
        sentence: `New report on ProjectHub${ctx.reportedUsername ? ` about @${ctx.reportedUsername}` : ""}`,
        button: "View reported profile",
        href: ctx.reportedUsername ? profileUrl(ctx.reportedUsername) : SITE_URL,
      };
  }
}

function renderHtml(sentence: string, button: string, href: string, footer: string, body = ""): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(sentence)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif;color:#1a1a1f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e6e6ec;">
        <tr><td style="padding:28px 28px 0;font-size:15px;font-weight:600;color:#6d28d9;">ProjectHub</td></tr>
        <tr><td style="padding:16px 28px 8px;font-size:18px;line-height:1.5;font-weight:600;color:#1a1a1f;">${esc(sentence)}</td></tr>
        ${body ? `<tr><td style="padding:0 28px 8px;font-size:14px;line-height:1.6;color:#3f3f46;white-space:pre-wrap;">${esc(body)}</td></tr>` : ""}
        <tr><td style="padding:16px 28px 28px;">
          <a href="${esc(href)}" style="display:inline-block;background:#8B5CF6;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:8px;">${esc(button)}</a>
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="padding:16px 8px;font-size:12px;line-height:1.6;color:#6b6b76;text-align:center;">
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let id: string | undefined;
  try {
    id = (await req.json())?.email_log_id;
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "bad_id" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Claim the row exactly once.
  const { data: row } = await supabase
    .from("email_log")
    .update({ status: "sending" })
    .eq("id", id)
    .eq("status", "queued")
    .select("id, user_id, kind, from_user_id, entity_id")
    .maybeSingle<LogRow>();
  if (!row) return json({ status: "ignored" });

  const fail = async (error: string, status = 500) => {
    await supabase.from("email_log").update({ status: "failed", error: error.slice(0, 500) }).eq("id", row.id);
    return json({ status: "failed", error }, status);
  };

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return fail("RESEND_API_KEY is not set");

  // Recipient: re-check the opt-out and seed flag at send time.
  const { data: recipient } = await supabase
    .from("profiles")
    .select("is_seed, email_notifications")
    .eq("id", row.user_id)
    .maybeSingle();
  // Reports reach the admin even with notifications off.
  const optedIn = recipient?.email_notifications || row.kind === "report";
  if (!recipient || recipient.is_seed || !optedIn) return fail("recipient not eligible", 200);

  const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(row.user_id);
  const to = authUser?.user?.email;
  if (authErr || !to) return fail(`no email for user: ${authErr?.message ?? "missing"}`);

  // Context for the sentence.
  let name = "Someone";
  let fromUsername: string | null = null;
  if (row.from_user_id) {
    const { data: from } = await supabase.from("profiles").select("full_name, username").eq("id", row.from_user_id).maybeSingle();
    fromUsername = from?.username ?? null;
    name = clean(from?.full_name) ?? (fromUsername ? `@${fromUsername}` : "Someone");
  }
  let project = "a project";
  if (row.entity_id && row.kind.startsWith("application_")) {
    const { data: p } = await supabase.from("projects").select("title").eq("id", row.entity_id).maybeSingle();
    project = clean(p?.title) ?? project;
  }

  // Report details for the admin email.
  let reportedUsername: string | null = null;
  let reportBody = "";
  if (row.kind === "report" && row.entity_id) {
    const { data: r } = await supabase
      .from("reports")
      .select("reason, details, reported_id, message_id")
      .eq("id", row.entity_id)
      .maybeSingle();
    if (r) {
      if (r.reported_id) {
        const { data: rp } = await supabase.from("profiles").select("username").eq("id", r.reported_id).maybeSingle();
        reportedUsername = rp?.username ?? null;
      }
      reportBody = [
        `Reason: ${r.reason}`,
        r.details ? `Details: ${r.details}` : "",
        r.message_id ? "A message is attached (see the reports table)." : "",
        `Reported by: ${fromUsername ? `@${fromUsername}` : "a member"}`,
        `Report id: ${row.entity_id}`,
      ].filter(Boolean).join("\n");
    }
  }

  const { data: token, error: tokenErr } = await supabase.rpc("email_unsubscribe_token", { p_user: row.user_id });
  if (tokenErr || !token) return fail(`token: ${tokenErr?.message ?? "missing"}`);
  const q = `u=${row.user_id}&t=${token}`;
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?${q}`;
  const oneClickUrl = `${SITE_URL}/api/unsubscribe?${q}`;
  const settingsUrl = `${SITE_URL}/profile/edit#notifications`;

  const { sentence, button, href } = compose(row.kind, name, project, {
    fromId: row.from_user_id,
    fromUsername,
    projectId: row.entity_id,
    reportedUsername,
  });

  const footerHtml = row.kind === "report"
    ? "You're getting this because you're the ProjectHub admin."
    : `You're getting this because email notifications are on for your ProjectHub account.<br>
          <a href="${esc(settingsUrl)}" style="color:#6b6b76;">Notification settings</a> &middot;
          <a href="${esc(unsubscribeUrl)}" style="color:#6b6b76;">Unsubscribe</a>`;
  const footerText = row.kind === "report"
    ? "You're getting this because you're the ProjectHub admin.\n"
    : `Notification settings: ${settingsUrl}\nUnsubscribe: ${unsubscribeUrl}\n`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Resend de-duplicates on this, so a retried call can't double-send.
      "Idempotency-Key": row.id,
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject: sentence,
      html: renderHtml(sentence, button, href, footerHtml, reportBody),
      text: `${sentence}\n\n${reportBody ? `${reportBody}\n\n` : ""}${button}: ${href}\n\n—\n${footerText}`,
      headers: {
        "List-Unsubscribe": `<${oneClickUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) return fail(`resend ${res.status}: ${JSON.stringify(body)}`, 502);

  await supabase
    .from("email_log")
    .update({ status: "sent", resend_id: body.id ?? null, sent_at: new Date().toISOString(), error: null })
    .eq("id", row.id);
  return json({ status: "sent", resend_id: body.id ?? null });
});
