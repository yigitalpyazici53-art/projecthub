"use client";

import Link from "next/link";
import { OPEN_EVENT } from "@/components/CookieConsent";

const LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "KVKK", href: "/kvkk" },
  { label: "Cookies", href: "/cookies" },
];

/** Policy links plus "Cookie settings", shared by the app footer and the landing footer. */
export default function LegalLinks({ linkClassName, linkStyle }: { linkClassName?: string; linkStyle?: React.CSSProperties }) {
  return (
    <nav aria-label="Legal" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      {LINKS.map((item) => (
        <Link key={item.href} href={item.href} className={linkClassName} style={linkStyle}>
          {item.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
        className={linkClassName}
        style={{ ...linkStyle, background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
      >
        Cookie settings
      </button>
    </nav>
  );
}
