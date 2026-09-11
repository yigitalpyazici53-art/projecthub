import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata(
  "Add a Project",
  "Document a project on ProjectHub — add it to your proof-of-work profile and post progress as you build.",
);

export default function NewProjectLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-light">{children}</div>;
}
