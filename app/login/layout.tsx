import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | ProjectHub",
  description: "Sign in to your ProjectHub account and continue building.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
