import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createPublicClient } from "@/utils/supabase/public";

// Liveness: GET /api/health → "ok", with no outbound calls.
// Full report: send HEALTH_TOKEN as "Authorization: Bearer <token>" (or ?token=)
// to also query Supabase and count emails stuck 'queued' for over an hour.
// health_report() re-checks the token in the database, so the RPC is useless
// to anyone calling it directly without the token.
export const dynamic = "force-dynamic";

function tokenMatches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : new URL(request.url).searchParams.get("token") ?? "";
  if (!token) return new NextResponse("ok", { headers: { "Cache-Control": "no-store" } });

  const expected = process.env.HEALTH_TOKEN;
  if (!expected || !tokenMatches(token, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const { data, error } = await createPublicClient().rpc("health_report", { p_token: token });
  const latency_ms = Date.now() - started;
  const ok = !error && data !== null;
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      supabase: error ? { ok: false, error: error.message, latency_ms } : { ok: data !== null, latency_ms },
      stale_queued_emails: data?.stale_queued_emails ?? null,
      checked_at: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
