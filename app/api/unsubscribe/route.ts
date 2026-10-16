import { NextResponse } from "next/server";
import { createPublicClient } from "@/utils/supabase/public";

// One-click unsubscribe (RFC 8058). Mail clients POST here from the
// List-Unsubscribe header; the /unsubscribe page posts here from its button.
// The token is an HMAC of the user id, checked in the database by
// unsubscribe_email(), so no sign-in and no server secret are needed here.
// GET does nothing on purpose: link scanners prefetch URLs.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const user = url.searchParams.get("u") ?? "";
  const token = url.searchParams.get("t") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(user) || !/^[0-9a-f]{64}$/i.test(token)) {
    return NextResponse.json({ ok: false, error: "invalid_link" }, { status: 400 });
  }

  const { data, error } = await createPublicClient().rpc("unsubscribe_email", { p_user: user, p_token: token });
  if (error) return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "invalid_link" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
