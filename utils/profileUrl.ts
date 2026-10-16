import { SITE_URL } from "@/utils/seo";

/**
 * Profile links. Usernames are percent-encoded so legacy ones with spaces
 * (e.g. "kadir polatcan") still resolve; the page decodes the param again.
 */
export function profilePath(username: string): string {
  return `/builders/${encodeURIComponent(username)}`;
}

export function profileUrl(username: string): string {
  return `${SITE_URL}${profilePath(username)}`;
}

/** Short, CV-friendly form: projecthubstudents.com/u/<username> (redirects to the profile). */
export function shortProfileUrl(username: string): string {
  return `${SITE_URL.replace(/^https?:\/\//, "")}/u/${encodeURIComponent(username)}`;
}

/** Route params arrive percent-encoded; decode defensively. */
export function decodeUsernameParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
