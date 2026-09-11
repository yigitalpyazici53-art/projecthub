import { Metadata } from "next";
import { privateMetadata, publicMetadata, truncate } from "@/utils/seo";
import { createPublicClient } from "@/utils/supabase/public";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const path = `/builders/${encodeURIComponent(username)}`;

  const { data: builder } = await createPublicClient()
    .from("profiles")
    .select("full_name, username, university, role, bio")
    .eq("username", username)
    .maybeSingle();

  if (!builder) {
    return privateMetadata("Builder not found");
  }

  const name = builder.full_name?.trim() || `@${builder.username}`;
  const headline = [builder.role, builder.university].filter(Boolean).join(" · ");
  const description = builder.bio?.trim()
    ? truncate(builder.bio)
    : truncate(
        `${name}${headline ? ` — ${headline}` : ""}. See their shipped projects, progress updates, and endorsed skills on ProjectHub.`,
      );

  return publicMetadata({
    title: builder.full_name?.trim() ? `${name} (@${builder.username})` : name,
    description,
    path,
  });
}

export default function BuilderProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
