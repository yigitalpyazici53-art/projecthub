/**
 * Display-side cleanup for user-entered profile fields.
 *
 * People type "nil", "N/A", "-" and similar into optional fields to mean
 * "nothing here". These helpers treat those as empty so the UI hides the
 * field instead of rendering the placeholder. The database is never touched;
 * apply them where profiles are loaded for display, not in edit forms.
 */

const EMPTY_TOKENS = new Set(["nil", "null", "none", "n/a", "na", "-"]);

// Comma-separated fields, where a placeholder can hide inside a list.
const LIST_FIELDS = new Set(["skills", "interests"]);

export function isEmptyValue(value: string | null | undefined): boolean {
  if (value == null) return true;
  const v = value.trim().toLowerCase();
  return v === "" || EMPTY_TOKENS.has(v);
}

/** Returns the trimmed value, or null when it is blank or a placeholder. */
export function cleanText(value: string | null | undefined): string | null {
  return isEmptyValue(value) ? null : value!.trim();
}

/** Splits a comma list, drops blank/placeholder entries and case-insensitive repeats ("design, Design"). */
export function cleanList(value: string | null | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => {
      const key = s.toLowerCase();
      if (isEmptyValue(s) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Returns a copy of a profile row with every placeholder string field set to
 * null and placeholder entries removed from comma lists. Non-string fields
 * (ids, booleans, timestamps) pass through unchanged.
 */
export function cleanProfile<T extends object>(profile: T): T;
export function cleanProfile<T extends object>(profile: T | null | undefined): T | null;
export function cleanProfile<T extends object>(profile: T | null | undefined): T | null {
  if (!profile) return null;
  const out = { ...profile } as Record<string, unknown>;
  for (const [key, value] of Object.entries(out)) {
    if (typeof value !== "string" || key === "id") continue;
    if (LIST_FIELDS.has(key)) {
      const list = cleanList(value);
      out[key] = list.length > 0 ? list.join(", ") : null;
    } else {
      out[key] = cleanText(value);
    }
  }
  return out as T;
}

export function cleanProfiles<T extends object>(profiles: T[] | null | undefined): T[] {
  return (profiles ?? []).map((p) => cleanProfile(p));
}
