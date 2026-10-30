"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { GA_MEASUREMENT_ID } from "@/utils/legal";

/**
 * Cookie banner + Google Analytics loader.
 *
 * Consent Mode v2 defaults to "denied" (inline script in the root layout), and
 * gtag.js itself is only requested after the visitor clicks Accept, so a
 * rejected or undecided visitor never talks to Google. The choice is kept in
 * localStorage; "Cookie settings" in the footer reopens the banner.
 */

const STORAGE_KEY = "ph_cookie_consent";
export const OPEN_EVENT = "ph:cookie-settings";
const CHANGE_EVENT = "ph:cookie-consent-changed";

type Choice = "granted" | "denied";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function readChoice(): Choice | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function saveChoice(choice: Choice) {
  try { localStorage.setItem(STORAGE_KEY, choice); } catch { /* storage blocked: ask again next visit */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// window.gtag is defined by the inline Consent Mode script in app/layout.tsx.
const gtag = (...args: unknown[]) => window.gtag?.(...args);

let gaLoaded = false;
function loadAnalytics() {
  if (gaLoaded) return;
  gaLoaded = true;
  gtag("consent", "update", { analytics_storage: "granted" });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
}

/** Removes the _ga cookies Google Analytics set on this site. */
function clearAnalyticsCookies() {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (!name.startsWith("_ga")) return;
    domains.forEach((d) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ""}`;
    });
  });
}

export default function CookieConsent() {
  // "unset" on the server and before hydration, so no banner is server-rendered.
  const choice = useSyncExternalStore<Choice | null | "unset">(subscribe, readChoice, () => "unset");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (choice === "granted") loadAnalytics();
  }, [choice]);

  useEffect(() => {
    const reopen = () => setSettingsOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  const decide = (next: Choice) => {
    const previous = readChoice();
    saveChoice(next);
    setSettingsOpen(false);
    if (next === "granted") { loadAnalytics(); return; }
    gtag("consent", "update", { analytics_storage: "denied" });
    clearAnalyticsCookies();
    // gtag.js can't be unloaded; a reload drops it after a withdrawal.
    if (previous === "granted" && gaLoaded) window.location.reload();
  };

  if (choice === "unset" || (choice !== null && !settingsOpen)) return null;

  return (
    <div role="dialog" aria-live="polite" aria-label="Cookie consent" style={wrapStyle}>
      <p style={textStyle}>
        We use optional analytics cookies (Google Analytics) to understand how ProjectHub is used.
        They&apos;re only set if you accept. Analytics data is processed by Google in the USA.{" "}
        <Link href="/cookies" style={linkStyle}>Cookie Policy</Link>
      </p>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        {/* Equal weight on purpose: same size, same style. */}
        <button type="button" onClick={() => decide("denied")} style={btnStyle}>Reject</button>
        <button type="button" onClick={() => decide("granted")} style={btnStyle}>Accept</button>
      </div>
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 1000,
  maxWidth: 760, margin: "0 auto",
  display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
  padding: "16px 18px", borderRadius: 12,
  background: "#FFFFFF", color: "#1A1A1F",
  border: "1px solid #E4E4E7", boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
  fontFamily: "var(--font-sans)",
};
const textStyle: React.CSSProperties = { flex: "1 1 320px", margin: 0, fontSize: 13, lineHeight: 1.6, color: "#3F3F46" };
const linkStyle: React.CSSProperties = { color: "#6D28D9", fontWeight: 500 };
const btnStyle: React.CSSProperties = {
  minWidth: 104, padding: "10px 18px", borderRadius: 8, cursor: "pointer",
  border: "1px solid #1A1A1F", background: "#FFFFFF", color: "#1A1A1F",
  fontSize: 14, fontWeight: 600, fontFamily: "inherit",
};
