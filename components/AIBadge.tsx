"use client";

type AIBadgeProps = {
  label?: string;
  tooltip?: string;
  size?: "sm" | "md";
};

const DEFAULT_TOOLTIP =
  "This is a sample created to showcase the platform. Not a real user or project.";

export default function AIBadge({
  label = "AI Generated",
  tooltip = DEFAULT_TOOLTIP,
  size = "sm",
}: AIBadgeProps) {
  const fontSize = size === "sm" ? 10 : 11;
  const padX = size === "sm" ? 7 : 9;
  const padY = size === "sm" ? 3 : 4;
  const iconSize = size === "sm" ? 10 : 12;

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
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: "#c4b5fd",
        background: "rgba(139,92,246,0.10)",
        border: "1px solid rgba(139,92,246,0.28)",
        borderRadius: 6,
        padding: `${padY}px ${padX}px`,
        whiteSpace: "nowrap",
        cursor: "help",
        userSelect: "none",
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M6 1L7.2 4.8L11 6L7.2 7.2L6 11L4.8 7.2L1 6L4.8 4.8L6 1Z"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>
      {label}
    </span>
  );
}
