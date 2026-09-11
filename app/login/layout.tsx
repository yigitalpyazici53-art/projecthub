import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata(
  "Sign In",
  "Sign in to your ProjectHub account and continue building.",
);

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
