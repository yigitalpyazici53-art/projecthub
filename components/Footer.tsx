"use client";

import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import LegalLinks from "@/components/LegalLinks";

// The landing page renders its own footer (with the same legal links).
const HIDDEN_ROUTES = ["/"];

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
        <LegalLinks linkClassName="u-link" linkStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
      </div>
    </footer>
  );
}
