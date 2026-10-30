import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata("Confirm to continue");

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
