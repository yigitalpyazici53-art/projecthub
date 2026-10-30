import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Permanently deletes the signed-in user's account. The user comes from the
// session cookie, never from the request body. Order matters: the avatar
// files go first through the Storage API (storage rows can't be removed in
// SQL), then delete_my_account() removes the /apply submission with the same
// email and the auth user, which cascades to the profile and everything that
// references it (projects, connections, messages, applications, …).
export async function POST(request: Request) {
  // Same-origin only: a cross-site form can't trigger a deletion.
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const { data: files } = await supabase.storage.from("avatars").list(user.id);
  if (files && files.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("avatars")
      .remove(files.map((f) => `${user.id}/${f.name}`));
    if (storageError) return NextResponse.json({ ok: false, error: "avatar_delete_failed" }, { status: 500 });
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // The user no longer exists; clear the session cookies.
  await supabase.auth.signOut().catch(() => {});
  return NextResponse.json({ ok: true });
}
