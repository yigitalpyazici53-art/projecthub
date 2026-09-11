/**
 * Maps a project stage (DB values: idea | mvp | building | launched | paused)
 * to the badge palette. "launched" reads as "shipped".
 *
 * Colors are CSS variables, so a badge renders dark on public pages and light
 * inside .theme-light (signed-in surfaces) without a second code path.
 */
export type StageBadge = { label: string; color: string; bg: string };

export function stageBadge(stage: string | null | undefined): StageBadge {
  switch ((stage ?? "").toLowerCase()) {
    case "launched":
      return { label: "shipped", color: "var(--badge-shipped-text)", bg: "var(--badge-shipped-bg)" };
    case "building":
      return { label: "building", color: "var(--badge-building-text)", bg: "var(--badge-building-bg)" };
    case "mvp":
      return { label: "mvp", color: "var(--badge-building-text)", bg: "var(--badge-building-bg)" };
    case "idea":
      return { label: "idea", color: "var(--badge-idea-text)", bg: "var(--badge-idea-bg)" };
    default:
      return { label: (stage ?? "—").toLowerCase(), color: "var(--badge-idea-text)", bg: "var(--badge-idea-bg)" };
  }
}
