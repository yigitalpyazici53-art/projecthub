/**
 * Category-specific accent tints for project category badges, plus the
 * deterministic letter-based avatar tints used on builder cards.
 *
 * Both return CSS variables (defined in app/globals.css), so badges follow the
 * theme instead of hardcoding hex values at every call site.
 */
export type CategoryBadge = { bg: string; color: string };

const CATEGORY_COLORS: Record<string, CategoryBadge> = {
  "saas":              { bg: "var(--tint-blue-bg)",   color: "var(--tint-blue-text)" },
  "edtech":            { bg: "var(--tint-violet-bg)", color: "var(--tint-violet-text)" },
  "ai tools":          { bg: "var(--tint-green-bg)",  color: "var(--tint-green-text)" },
  "health & wellness": { bg: "var(--tint-rose-bg)",   color: "var(--tint-rose-text)" },
  "fintech":           { bg: "var(--tint-amber-bg)",  color: "var(--tint-amber-text)" },
  "social":            { bg: "var(--tint-sky-bg)",    color: "var(--tint-sky-text)" },
  "developer tools":   { bg: "var(--tint-slate-bg)",  color: "var(--tint-slate-text)" },
};

const CATEGORY_DEFAULT: CategoryBadge = { bg: "var(--tint-slate-bg)", color: "var(--tint-slate-text)" };

export function categoryBadge(category: string | null | undefined): CategoryBadge {
  const key = (category ?? "").trim().toLowerCase();
  return CATEGORY_COLORS[key] ?? CATEGORY_DEFAULT;
}

/** Soft avatar background keyed to the first letter of the builder's name. */
export function avatarTint(name: string | null | undefined): string {
  const first = (name ?? "").trim().charAt(0).toUpperCase();
  if (first >= "A" && first <= "E") return "var(--avatar-1)";
  if (first >= "F" && first <= "J") return "var(--avatar-2)";
  if (first >= "K" && first <= "O") return "var(--avatar-3)";
  if (first >= "P" && first <= "T") return "var(--avatar-4)";
  if (first >= "U" && first <= "Z") return "var(--avatar-5)";
  return "var(--avatar-0)";
}
