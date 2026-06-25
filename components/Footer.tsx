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
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "40px 24px",
        marginTop: "auto",
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
        <Logo size="sm" />
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} ProjectHub · yigitalpyazici53@gmail.com
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          {[
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
            { label: "Contact", href: "mailto:yigitalpyazici53@gmail.com" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color 0.15s",
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
