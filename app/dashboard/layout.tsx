import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata(
  "Dashboard",
  "Your ProjectHub builder home base — manage projects, connections, and your profile.",
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
