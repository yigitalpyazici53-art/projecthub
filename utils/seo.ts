import type { Metadata } from "next";

export const SITE_URL = "https://projecthubstudents.com";
export const SITE_NAME = "ProjectHub";

// Served by app/opengraph-image.tsx. Child openGraph objects replace the
// parent's wholesale, so every page has to reference the image explicitly.
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "ProjectHub — Where student builders prove what they've built",
};

type PublicPageMeta = {
  /** Page title without the brand; " | ProjectHub" is appended once. */
  title: string;
  description: string;
  /** Path relative to SITE_URL, used for the canonical and og:url. */
  path: string;
  ogDescription?: string;
};

// Absolute titles: a nested layout with a string title resets the root
// template, so relying on it leaves dynamic pages unbranded.
export function brandedTitle(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

export function publicMetadata({ title, description, path, ogDescription }: PublicPageMeta): Metadata {
  const fullTitle = brandedTitle(title);
  const shareDescription = ogDescription ?? description;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description: shareDescription,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: shareDescription,
      images: [OG_IMAGE.url],
    },
  };
}

/** Signed-in, utility, or missing pages: titled, but kept out of search results. */
export function privateMetadata(title: string, description?: string): Metadata {
  return {
    title: { absolute: brandedTitle(title) },
    description,
    robots: { index: false, follow: false },
    // Don't inherit a parent's canonical (e.g. /projects/new → /projects).
    alternates: { canonical: null },
  };
}

export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}
