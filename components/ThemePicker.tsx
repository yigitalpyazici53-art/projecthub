"use client";

import { useEffect, useRef, useState } from "react";

// Theme IDs are preserved (`midnight`/`aurora`/`slate`/`sunset`) so saved
// values in localStorage keep working. Labels and palettes are refreshed
// to be more distinct, and a new `electric` option has been added.
const THEMES = [
  {
    id: "midnight",
    label: "Midnight Indigo",
    dot: "linear-gradient(135deg, #6b8bff, #a78bfa)",
    accent: "#6b8bff",
  },
  {
    id: "electric",
    label: "Electric Blue",
    dot: "linear-gradient(135deg, #38bdf8, #6366f1)",
    accent: "#38bdf8",
  },
  {
    id: "aurora",
    label: "Emerald",
    dot: "linear-gradient(135deg, #10b981, #22d3ee)",
    accent: "#10b981",
  },
  {
    id: "slate",
    label: "Violet",
    dot: "linear-gradient(135deg, #a855f7, #d946ef)",
    accent: "#a855f7",
  },
  {
    id: "sunset",
    label: "Sunset",
    dot: "linear-gradient(135deg, #fb923c, #ec4899)",
    accent: "#fb923c",
  },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

function PaletteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

export default function ThemePicker() {
  const [current, setCurrent] = useState<ThemeId>("slate");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ph-theme") as ThemeId | null;
    if (saved && THEMES.find((t) => t.id === saved)) {
      setCurrent(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      setCurrent("slate");
    }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function setTheme(id: ThemeId) {
    setCurrent(id);
    setOpen(false);
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem("ph-theme", id);
  }

  const active = THEMES.find((t) => t.id === current)!;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="theme-picker-btn"
        onClick={() => setOpen((o) => !o)}
        title="Switch theme"
      >
        <span
          className="theme-dot"
          style={{ background: active.dot }}
        />
        <PaletteIcon />
      </button>

      {open && (
        <div className="theme-dropdown">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-option${t.id === current ? " active" : ""}`}
              onClick={() => setTheme(t.id)}
            >
              <span
                className="theme-dot"
                style={{ background: t.dot }}
              />
              {t.label}
              {t.id === current && (
                <svg style={{ marginLeft: "auto" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
