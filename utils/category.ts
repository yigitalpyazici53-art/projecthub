/**
 * Category-specific accent tints for project category badges, plus the
 * deterministic letter-based avatar tints used on builder cards.
 * Same quiet-tint language as utils/stage.ts — background carries the hue,
 * text stays dark enough to read.
 */
export type CategoryBadge = { bg: string; color: string };

const CATEGORY_COLORS: Record<string, CategoryBadge> = {
  "saas":              { bg: "#EFF6FF", color: "#1D4ED8" },
  "edtech":            { bg: "#F5F3FF", color: "#6D28D9" },
  "ai tools":          { bg: "#ECFDF5", color: "#047857" },
  "health & wellness": { bg: "#FFF1F2", color: "#BE123C" },
  "fintech":           { bg: "#FFFBEB", color: "#B45309" },
  "social":            { bg: "#F0F9FF", color: "#0369A1" },
  "developer tools":   { bg: "#F1F5F9", color: "#334155" },
};

const CATEGORY_DEFAULT: CategoryBadge = { bg: "#F5F5F4", color: "#57534E" };

export function categoryBadge(category: string | null | undefined): CategoryBadge {
  const key = (category ?? "").trim().toLowerCase();
  return CATEGORY_COLORS[key] ?? CATEGORY_DEFAULT;
}

/** Soft avatar background keyed to the first letter of the builder's name. */
export function avatarTint(name: string | null | undefined): string {
  const first = (name ?? "").trim().charAt(0).toUpperCase();
  if (first >= "A" && first <= "E") return "#DBEAFE";
  if (first >= "F" && first <= "J") return "#FCE7F3";
  if (first >= "K" && first <= "O") return "#D1FAE5";
  if (first >= "P" && first <= "T") return "#FEF3C7";
  if (first >= "U" && first <= "Z") return "#E0E7FF";
  return "#F5F5F3";
}
