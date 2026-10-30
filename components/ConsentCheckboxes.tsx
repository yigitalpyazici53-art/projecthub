"use client";

import Link from "next/link";

export type ConsentState = { age: boolean; policies: boolean };

export const consentComplete = (c: ConsentState) => c.age && c.policies;

/**
 * The two required confirmations used on signup, /apply and /consent:
 * 18+ and having read the Privacy Policy, Terms and KVKK notice.
 * Links open in a new tab so a half-filled form isn't lost.
 */
export default function ConsentCheckboxes({
  value,
  onChange,
  tone = "light",
}: {
  value: ConsentState;
  onChange: (next: ConsentState) => void;
  tone?: "light" | "dark";
}) {
  const text = tone === "dark" ? "#CBD5E1" : "var(--text-secondary)";
  const link: React.CSSProperties = { color: tone === "dark" ? "#C4B5FD" : "var(--accent-bright)", fontWeight: 500 };
  const row: React.CSSProperties = {
    display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, lineHeight: 1.55, color: text, cursor: "pointer",
  };
  const box: React.CSSProperties = { marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: "var(--accent)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label style={row}>
        <input
          type="checkbox"
          required
          checked={value.age}
          onChange={(e) => onChange({ ...value, age: e.target.checked })}
          style={box}
        />
        <span>I am 18 years of age or older.</span>
      </label>
      <label style={row}>
        <input
          type="checkbox"
          required
          checked={value.policies}
          onChange={(e) => onChange({ ...value, policies: e.target.checked })}
          style={box}
        />
        <span>
          I have read and accept the{" "}
          <Link href="/privacy" target="_blank" style={link}>Privacy Policy</Link> and{" "}
          <Link href="/terms" target="_blank" style={link}>Terms of Service</Link>, and I have read the{" "}
          <Link href="/kvkk" target="_blank" style={link}>KVKK Information Notice (Aydınlatma Metni)</Link>.
        </span>
      </label>
    </div>
  );
}
