import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata("Admin");

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
