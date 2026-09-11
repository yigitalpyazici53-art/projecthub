import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata(
  "Edit Profile",
  "Update your ProjectHub builder profile — skills, bio, university, and more.",
);

export default function EditProfileLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-light">{children}</div>;
}
