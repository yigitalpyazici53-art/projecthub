import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | ProjectHub",
  description: "Your ProjectHub builder home base — manage projects, connections, and your profile.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
