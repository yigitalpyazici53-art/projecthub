import { Metadata } from "next";
import { publicMetadata } from "@/utils/seo";

export const metadata: Metadata = publicMetadata({
  title: "Create Account",
  description: "Create your proof-of-work profile on ProjectHub — ship projects, collect endorsements, prove what you build.",
  path: "/signup",
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
