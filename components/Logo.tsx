"use client";

import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  gradient?: boolean; // kept for compatibility — ignored in the flat system
  href?: string;
  style?: React.CSSProperties;
  /** "dark" inverts the mark for dark backgrounds (the landing page). */
  tone?: "light" | "dark";
}

const SIZES = {
  sm: { icon: 20, text: 14, gap: 8, weight: 600 },
  md: { icon: 24, text: 16, gap: 9, weight: 600 },
  lg: { icon: 30, text: 20, gap: 11, weight: 600 },
};

function LogoIcon({ px, tone }: { px: number; tone: "light" | "dark" }) {
  // Same geometry as public/logo-mark.svg. The "P" is light on dark
  // backgrounds; on the (currently unused) light tone it switches to ink.
  const ink = tone === "dark" ? "#FAFAFA" : "#1A1A18";
  return (
    <svg
      width={px}
      height={px}
      viewBox="-24 -24 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="none" stroke="#8B5CF6" strokeWidth="1.8" />
      <polygon points="0,-14 12,-7 12,7 0,14 -12,7 -12,-7" fill="#8B5CF6" opacity="0.15" />
      <text
        x="0"
        y="5"
        textAnchor="middle"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="17"
        fill={ink}
        fontWeight="600"
      >
        P
      </text>
    </svg>
  );
}

export default function Logo({
  size = "md",
  href = "/",
  style,
  tone = "light",
}: LogoProps) {
  const { icon, text, gap, weight } = SIZES[size];

  return (
    <Link
      href={href}
      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap, ...style }}
    >
      <LogoIcon px={icon} tone={tone} />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: weight,
          fontSize: text,
          color: tone === "dark" ? "#FAFAFA" : "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        ProjectHub
      </span>
    </Link>
  );
}
