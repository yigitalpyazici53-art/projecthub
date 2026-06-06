import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Connections | ProjectHub",
  description: "View and manage your builder connections on ProjectHub.",
};

export default function ConnectionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
