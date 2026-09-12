import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata("Edit Project");

export default function EditProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
