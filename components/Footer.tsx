"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

const HIDDEN_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/apply"];

export default function Footer() {
  const pathname = usePathname();
  if (pathname && HIDDEN_ROUTES.includes(pathname)) return null;

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "40px 24px",
        marginTop: "auto",
        background: "var(--background)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <Logo size="sm" tone="dark" />
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} ProjectHub
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
            { label: "GitHub", href: "https://github.com" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="u-link"
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
