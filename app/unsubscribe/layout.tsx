import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata("Email notifications");

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
