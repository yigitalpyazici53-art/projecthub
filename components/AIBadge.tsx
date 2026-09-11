"use client";

type AIBadgeProps = {
  label?: string;
  tooltip?: string;
  size?: "sm" | "md";
};

const DEFAULT_TOOLTIP =
  "This is a sample created to showcase the platform. Not a real user or project.";

export default function AIBadge({
  label = "Example",
  tooltip = DEFAULT_TOOLTIP,
  size = "sm",
}: AIBadgeProps) {
  const fontSize = size === "sm" ? 10 : 11;
  const padX = size === "sm" ? 7 : 9;
  const padY = size === "sm" ? 3 : 4;

  return (
    <span
      role="note"
      aria-label={tooltip}
      title={tooltip}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize,
        fontWeight: 500,
        letterSpacing: "0.04em",
        color: "var(--text-muted)",
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: `${padY}px ${padX}px`,
        whiteSpace: "nowrap",
        cursor: "help",
        userSelect: "none",
      }}
    >
      {label}
    </span>
  );
}
