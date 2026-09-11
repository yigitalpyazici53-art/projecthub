"use client";

import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  gradient?: boolean; // kept for compatibility — ignored in the flat system
  href?: string;
  style?: React.CSSProperties;
}

const SIZES = {
  sm: { icon: 20, text: 14, gap: 8, weight: 600 },
  md: { icon: 24, text: 16, gap: 9, weight: 600 },
  lg: { icon: 30, text: 20, gap: 11, weight: 600 },
};

function LogoIcon({ px }: { px: number }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <rect width="28" height="28" rx="7" fill="#1A1A18" />
      <line x1="9" y1="10" x2="19" y2="10" stroke="#FAFAF8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="10" x2="14" y2="20" stroke="#FAFAF8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="10" x2="14" y2="20" stroke="#FAFAF8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="10" r="2.5" fill="#FAFAF8" />
      <circle cx="19" cy="10" r="2.5" fill="#FAFAF8" />
      <circle cx="14" cy="20" r="2.5" fill="#FAFAF8" />
    </svg>
  );
}

export default function Logo({
  size = "md",
  href = "/",
  style,
}: LogoProps) {
  const { icon, text, gap, weight } = SIZES[size];

  return (
    <Link
      href={href}
      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap, ...style }}
    >
      <LogoIcon px={icon} />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: weight,
          fontSize: text,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        ProjectHub
      </span>
    </Link>
  );
}
