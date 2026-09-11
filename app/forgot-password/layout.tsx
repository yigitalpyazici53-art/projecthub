import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata("Forgot Password");

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
