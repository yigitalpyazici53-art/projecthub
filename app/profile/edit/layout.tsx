import { Metadata } from "next";
import { privateMetadata } from "@/utils/seo";

export const metadata: Metadata = privateMetadata(
  "Edit Profile",
  "Update your ProjectHub builder profile — skills, bio, school, and more.",
);

export default function EditProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
