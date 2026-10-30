"use client";

import { OPEN_EVENT } from "@/components/CookieConsent";

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className="btn-secondary"
      style={{ fontSize: 13 }}
    >
      Open cookie settings
    </button>
  );
}
