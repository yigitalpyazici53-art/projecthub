import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Builder Profile | ProjectHub",
  description: "View this builder's profile, projects, and skills on ProjectHub.",
};

export default function BuilderProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
