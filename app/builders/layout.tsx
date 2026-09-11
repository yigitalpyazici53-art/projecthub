import { Metadata } from "next";
import { publicMetadata } from "@/utils/seo";

export const metadata: Metadata = publicMetadata({
  title: "Builders",
  description: "Browse student builders with verified proof-of-work profiles — shipped projects, endorsed skills, documented progress.",
  path: "/builders",
  ogDescription: "Student builders with a track record you can verify.",
});

export default function BuildersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
