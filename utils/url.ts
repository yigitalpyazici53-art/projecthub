/**
 * Normalises a user-typed link to an absolute http(s) URL, or null when it
 * isn't one. "github.com/me/app" → "https://github.com/me/app".
 * Matches the projects_link_url_http check in the database.
 */
export function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** "https://www.github.com/me/app/" → "github.com/me/app" for display. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}
