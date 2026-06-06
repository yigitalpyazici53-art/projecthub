import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Builders | ProjectHub",
  description: "Browse ambitious student builders, indie hackers, and young founders on ProjectHub. Find your cofounder or collaborator.",
  openGraph: {
    title: "Discover Builders | ProjectHub",
    description: "Find the right teammate for your startup or side project.",
  },
};

export default function BuildersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
