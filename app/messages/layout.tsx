import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata("Messages");

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-light">{children}</div>;
}
