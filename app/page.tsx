import type { Metadata } from "next";
import LandingPageClient, { type FeaturedProject, type PublicStats } from "./LandingPageClient";
import { SITE_NAME } from "@/utils/seo";
import { createPublicClient } from "@/utils/supabase/public";
import type { Profile, Project } from "@/types";

export const revalidate = 60;

const HOME_TITLE = "ProjectHub | Where student builders prove what they've built";
const HOME_DESCRIPTION =
  "The proof-of-work portfolio platform for student builders. Ship projects, collect endorsements, and share a verified record of what you've built.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_TITLE,
    description: "Ship projects, collect endorsements, and share your proof-of-work profile.",
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
};

const STAGE_RANK: Record<string, number> = { launched: 0, mvp: 1, building: 2, idea: 3 };
const FEATURED_COUNT = 6;

// Public reads only — the cookie-less client keeps this page ISR-cacheable.
async function getPublicStats(): Promise<PublicStats | null> {
  try {
    const supabase = createPublicClient();
    const [statsRes, shippedRes] = await Promise.all([
      supabase.rpc("get_public_stats"),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("stage", "launched"),
    ]);
    if (statsRes.error || !statsRes.data) return null;
    const row = Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data;
    if (!row) return null;
    return {
      builders: Number(row.builders) || 0,
      projects: Number(row.projects) || 0,
      shipped: shippedRes.count ?? 0,
    };
  } catch {
    return null;
  }
}

// Real projects first, then the furthest stage, then newest (sort is stable).
async function getFeaturedProjects(): Promise<FeaturedProject[]> {
  try {
    const supabase = createPublicClient();
    const { data: projects } = await supabase
      .from("projects")
      .select("id, owner_id, title, tagline, description, category, stage, looking_for, tech_stack, created_at, is_ai_generated")
      .not("title", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!projects?.length) return [];

    const picked = [...projects]
      .sort((a, b) =>
        Number(a.is_ai_generated) - Number(b.is_ai_generated) ||
        (STAGE_RANK[a.stage ?? ""] ?? 9) - (STAGE_RANK[b.stage ?? ""] ?? 9),
      )
      .slice(0, FEATURED_COUNT);

    const ownerIds = [...new Set(picked.map((p) => p.owner_id).filter(Boolean) as string[])];
    const { data: owners } = await supabase
      .from("profiles")
      .select("id, full_name, username, university, avatar_url")
      .in("id", ownerIds);
    const ownerMap = new Map((owners ?? []).map((o) => [o.id, o as Profile]));

    return picked.map((p) => ({
      project: p as Project,
      owner: p.owner_id ? ownerMap.get(p.owner_id) ?? null : null,
    }));
  } catch {
    return [];
  }
}

export default async function Page() {
  const [stats, featured] = await Promise.all([getPublicStats(), getFeaturedProjects()]);
  return <LandingPageClient stats={stats} featured={featured} />;
}
