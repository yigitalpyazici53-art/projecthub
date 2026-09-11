import type { MetadataRoute } from "next";
import { SITE_URL } from "@/utils/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/login",
          "/admin/",
          "/dashboard",
          "/messages",
          "/connections",
          "/onboarding",
          "/profile/",
          "/forgot-password",
          "/reset-password",
          "/projects/new",
          "/projects/*/edit",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
