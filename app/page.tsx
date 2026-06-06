import LandingPageClient, { type PublicStats } from "./LandingPageClient";
import { createClient } from "@/utils/supabase/server";

export const revalidate = 60;

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
