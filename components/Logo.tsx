"use client";

import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  gradient?: boolean;
  href?: string;
  style?: React.CSSProperties;
}

const SIZES = {
  sm: { icon: 22, text: 14, gap: 8, weight: 700, letterSpacing: "-0.02em" },
  md: { icon: 28, text: 16, gap: 10, weight: 800, letterSpacing: "-0.03em" },
  lg: { icon: 34, text: 22, gap: 12, weight: 800, letterSpacing: "-0.03em" },
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
    >
      <rect width="28" height="28" rx="7" fill="#0d1117" />
      {/* Edges rendered first so nodes sit on top */}
      <line x1="9" y1="10" x2="19" y2="10" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="10" x2="14" y2="20" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="10" x2="14" y2="20" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      {/* Nodes */}
      <circle cx="9" cy="10" r="2.5" fill="white" />
      <circle cx="19" cy="10" r="2.5" fill="white" />
      <circle cx="14" cy="20" r="2.5" fill="#3b82f6" />
    </svg>
  );
}

export default function Logo({
  size = "md",
  gradient = false,
  href = "/",
  style,
}: LogoProps) {
  const { icon, text, gap, weight, letterSpacing } = SIZES[size];

  const wordmarkStyle: React.CSSProperties = gradient
    ? {
        fontFamily: "Syne, sans-serif",
        fontWeight: weight,
        fontSize: text,
        background: "var(--gradient-brand)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        letterSpacing,
      }
    : {
        fontFamily: "Syne, sans-serif",
        fontWeight: weight,
        fontSize: text,
        color: "var(--text-primary)",
        letterSpacing,
      };

  return (
    <Link
      href={href}
      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap, ...style }}
    >
      <LogoIcon px={icon} />
      <span style={wordmarkStyle}>ProjectHub</span>
    </Link>
  );
}
