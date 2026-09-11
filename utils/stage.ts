/**
 * Maps a project stage (DB values: idea | mvp | building | launched | paused)
 * to the Editorial Premium badge palette. "launched" reads as "shipped" —
 * the only place the accent green appears outside the landing CTA.
 */
export type StageBadge = { label: string; color: string; bg: string };

export function stageBadge(stage: string | null | undefined): StageBadge {
  switch ((stage ?? "").toLowerCase()) {
    case "launched":
      return { label: "shipped", color: "#0F6E56", bg: "#ECFDF5" };
    case "building":
      return { label: "building", color: "#B45309", bg: "#FFFBEB" };
    case "mvp":
      return { label: "mvp", color: "#B45309", bg: "#FFFBEB" };
    case "idea":
      return { label: "idea", color: "#6B6B66", bg: "#F5F5F3" };
    default:
      return { label: (stage ?? "—").toLowerCase(), color: "#6B6B66", bg: "#F5F5F3" };
  }
}
