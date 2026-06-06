import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects | ProjectHub",
  description: "Discover what builders on ProjectHub are creating. Browse student startup projects across all stages.",
  openGraph: {
    title: "Projects | ProjectHub",
    description: "From idea to launched — explore what's being built by university founders.",
  },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
