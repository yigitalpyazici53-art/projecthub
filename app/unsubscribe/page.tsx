"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Landing page for the "Unsubscribe" link in notification emails. One click
// on the button turns email notifications off; no sign-in needed. The
// change happens on POST, not on page load, so link scanners that prefetch
// the URL can't unsubscribe anyone by accident.

function UnsubscribeForm() {
  const params = useSearchParams();
  const u = params.get("u") ?? "";
  const t = params.get("t") ?? "";
  const [state, setState] = useState<"idle" | "working" | "done" | "error">(u && t ? "idle" : "error");

  const unsubscribe = async () => {
    setState("working");
    try {
      const res = await fetch(`/api/unsubscribe?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}`, { method: "POST" });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div style={cardStyle}>
      {state === "done" ? (
        <>
          <h1 style={titleStyle}>You&apos;re unsubscribed</h1>
          <p style={textStyle}>ProjectHub won&apos;t email you about connections, applications or messages. You&apos;ll still see them on the site.</p>
          <Link href="/profile/edit#notifications" className="u-link" style={linkStyle}>Turn emails back on in settings →</Link>
        </>
      ) : state === "error" ? (
        <>
          <h1 style={titleStyle}>This link doesn&apos;t work</h1>
          <p style={textStyle}>It may be incomplete or out of date. You can turn email notifications off in your settings instead.</p>
          <Link href="/profile/edit#notifications" className="u-link" style={linkStyle}>Go to notification settings →</Link>
        </>
      ) : (
        <>
          <h1 style={titleStyle}>Turn off email notifications?</h1>
          <p style={textStyle}>You&apos;ll stop getting emails about connection requests, applications and new messages.</p>
          <button type="button" onClick={unsubscribe} disabled={state === "working"} className="btn-accent" style={buttonStyle}>
            {state === "working" ? "Turning off…" : "Turn off email notifications"}
          </button>
        </>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main style={pageStyle}>
      <Suspense fallback={null}>
        <UnsubscribeForm />
      </Suspense>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "96px 16px 48px",
  background: "var(--background)",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 440,
  padding: "32px 28px",
  borderRadius: 16,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-serif)",
  fontWeight: 500,
  fontSize: 26,
  color: "var(--text-primary)",
};

const textStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.6,
  color: "var(--text-secondary)",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 6,
  border: "none",
  cursor: "pointer",
  fontSize: 15,
  padding: "12px 20px",
};

const linkStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--accent-purple)",
};
