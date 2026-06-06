import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | ProjectHub",
  description: "Join ProjectHub — the network for ambitious university builders, indie hackers, and student founders.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
