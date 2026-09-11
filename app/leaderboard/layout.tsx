import { Metadata } from "next";
import { publicMetadata } from "@/utils/seo";

export const metadata: Metadata = publicMetadata({
  title: "Leaderboard",
  description: "The most active student builders on ProjectHub — ranked by shipped projects, progress updates, endorsements, and connections.",
  path: "/leaderboard",
});

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
