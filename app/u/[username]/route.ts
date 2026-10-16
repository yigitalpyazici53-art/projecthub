import { NextResponse } from "next/server";
import { decodeUsernameParam, profilePath } from "@/utils/profileUrl";

// Short profile link for CVs and bios: /u/<username> → /builders/<username>.
export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return NextResponse.redirect(new URL(profilePath(decodeUsernameParam(username)), request.url), 308);
}
