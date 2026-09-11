import type { MetadataRoute } from "next";
import { SITE_URL } from "@/utils/seo";
import { createPublicClient } from "@/utils/supabase/public";

export const revalidate = 3600;

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: ChangeFrequency }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/projects", priority: 0.9, changeFrequency: "daily" },
  { path: "/builders", priority: 0.9, changeFrequency: "daily" },
  { path: "/leaderboard", priority: 0.7, changeFrequency: "weekly" },
  { path: "/apply", priority: 0.8, changeFrequency: "monthly" },
  { path: "/signup", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  try {
    const supabase = createPublicClient();
    const [projectsRes, buildersRes] = await Promise.all([
      supabase.from("projects").select("id, created_at").order("created_at", { ascending: false }).limit(5000),
      supabase
        .from("profiles")
        .select("username, created_at")
        .not("username", "is", null)
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

    for (const project of projectsRes.data ?? []) {
      entries.push({
        url: `${SITE_URL}/projects/${project.id}`,
        lastModified: new Date(project.created_at),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const builder of buildersRes.data ?? []) {
      if (!builder.username) continue;
      entries.push({
        url: `${SITE_URL}/builders/${encodeURIComponent(builder.username)}`,
        lastModified: new Date(builder.created_at),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    // Supabase unreachable — still serve the static routes.
  }

  return entries;
}
