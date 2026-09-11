import type { Metadata } from "next";
import LandingPageClient, { type PublicStats } from "./LandingPageClient";
import { createClient } from "@/utils/supabase/server";
import { SITE_NAME } from "@/utils/seo";

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

async function getPublicStats(): Promise<PublicStats | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_stats");
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      builders: Number(row.builders) || 0,
      projects: Number(row.projects) || 0,
      connections: Number(row.connections) || 0,
    };
  } catch {
    return null;
  }
}

export default async function Page() {
  const stats = await getPublicStats();
  return <LandingPageClient stats={stats} />;
}
