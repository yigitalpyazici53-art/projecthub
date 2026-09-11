import { Metadata } from "next";
import { publicMetadata } from "@/utils/seo";

export const metadata: Metadata = publicMetadata({
  title: "Apply — First 100 Builders",
  description: "Apply to join ProjectHub's First 100 Builders — a curated cohort of student builders proving what they've shipped.",
  path: "/apply",
});

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
