import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata("Reset Password");

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
