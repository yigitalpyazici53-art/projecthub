import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Project | ProjectHub",
  description: "Publish your startup idea or project on ProjectHub and find the right team to build it with.",
};

export default function NewProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
