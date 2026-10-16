import { Metadata } from "next";
import { privateMetadata, publicMetadata, truncate } from "@/utils/seo";
import { createPublicClient } from "@/utils/supabase/public";
import { cleanList, cleanProfile } from "@/utils/display";
import { decodeUsernameParam, profilePath } from "@/utils/profileUrl";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Params arrive percent-encoded ("kadir%20polatcan"); decode before the lookup.
  const username = decodeUsernameParam((await params).username);
  const path = profilePath(username);
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, username, university, role, bio, skills, is_seed")
    .eq("username", username)
    .maybeSingle();
  const builder = cleanProfile(data);

  if (!builder) {
    return privateMetadata("Builder not found");
  }

  const { data: projects } = await supabase.from("projects").select("stage").eq("owner_id", builder.id);
  const shipped = (projects ?? []).filter((p) => (p.stage ?? "").toLowerCase() === "launched").length;

  const name = builder.full_name?.trim() || `@${builder.username}`;
  const headline = [builder.role, builder.university].filter(Boolean).join(" · ");
  const skills = cleanList(builder.skills).slice(0, 4).join(", ");
  const proof = [
    shipped > 0 ? `${shipped} shipped project${shipped === 1 ? "" : "s"}` : "",
    skills ? `Skills: ${skills}` : "",
  ].filter(Boolean).join(". ");

  const description = builder.bio?.trim()
    ? truncate(builder.bio)
    : truncate(`${name}${headline ? ` — ${headline}` : ""}. ${proof ? `${proof}. ` : ""}Proof-of-work portfolio on ProjectHub.`);
  const ogDescription = truncate([headline, proof].filter(Boolean).join(" · ") || description);

  const meta = publicMetadata({
    title: builder.full_name?.trim() ? `${name} (@${builder.username})` : name,
    description,
    ogDescription,
    path,
    ownImage: true,
  });
  // Example accounts stay visible but out of search results.
  return builder.is_seed ? { ...meta, robots: { index: false, follow: true } } : { ...meta, openGraph: { ...meta.openGraph, type: "profile" } };
}

export default function BuilderProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
