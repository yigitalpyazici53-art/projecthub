import { Metadata } from "next";
import { privateMetadata, publicMetadata, truncate } from "@/utils/seo";
import { createPublicClient } from "@/utils/supabase/public";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const { data: project } = await createPublicClient()
    .from("projects")
    .select("title, tagline, description")
    .eq("id", id)
    .maybeSingle();

  if (!project?.title) {
    return privateMetadata("Project not found");
  }

  const summary = project.tagline?.trim() || project.description?.trim();
  return publicMetadata({
    title: project.title,
    description: summary
      ? truncate(summary)
      : `${project.title} — a student-built project documented on ProjectHub.`,
    path: `/projects/${id}`,
  });
}

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
