import { Metadata } from "next";
import { publicMetadata } from "@/utils/seo";

export const metadata: Metadata = publicMetadata({
  title: "Projects",
  description: "Browse what student builders are shipping — real projects with documented progress, from idea to shipped.",
  path: "/projects",
  ogDescription: "From idea to shipped — explore what student builders are making.",
});

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
