import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata(
  "My Connections",
  "View and manage your builder connections on ProjectHub.",
);

export default function ConnectionsLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-light">{children}</div>;
}
