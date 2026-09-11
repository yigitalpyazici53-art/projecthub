import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata("Welcome");

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-light">{children}</div>;
}
