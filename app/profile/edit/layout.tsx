import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Profile | ProjectHub",
  description: "Update your ProjectHub builder profile — skills, bio, university, and more.",
};

export default function EditProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
