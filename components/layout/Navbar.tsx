"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import ThemePicker from "@/components/ThemePicker";
import Logo from "@/components/Logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/builders", label: "Builders" },
  { href: "/connections", label: "Connections" },
  { href: "/messages", label: "Messages" },
  { href: "/leaderboard", label: "Leaderboard" },
];

// Subset shown to signed-out visitors. Login/Signup live in the right-side
// button group, so the public nav carries Home + the two discovery pages that
// work without auth.
const publicNavItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/builders", label: "Builders" },
];

const HIDDEN_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

// Defined outside Navbar so React sees a stable component type across re-renders.
// If defined inside, React would treat it as a new type on every Navbar render,
// unmounting and remounting the Link elements and dropping click events.
function NavLink({ href, label, pathname, mobile = false }: { href: string; label: string; pathname: string | null; mobile?: boolean }) {
  const isActive = pathname === href || (href !== "/dashboard" && (pathname?.startsWith(href) ?? false));
  if (mobile) {
    return (
      <Link
        href={href}
        style={{
          display: "block",
          padding: "12px 16px",
          borderRadius: 12,
          fontFamily: "DM Sans, sans-serif",
          fontSize: 15,
          fontWeight: isActive ? 700 : 500,
          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
          background: isActive ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
          textDecoration: "none",
          transition: "all 0.15s ease",
          borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
        }}
      >
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      style={{
        fontFamily: "DM Sans, sans-serif",
        fontSize: "14px",
        fontWeight: isActive ? 700 : 500,
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        background: isActive
          ? "color-mix(in srgb, var(--accent) 15%, transparent)"
          : "rgba(255,255,255,0.03)",
        border: isActive
          ? "1px solid color-mix(in srgb, var(--accent) 28%, transparent)"
          : "1px solid var(--border)",
        textDecoration: "none",
        padding: "9px 14px",
        borderRadius: "10px",
        transition: "all 0.15s ease",
        boxShadow: isActive ? "0 4px 16px color-mix(in srgb, var(--accent) 12%, transparent)" : "none",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => {
        if (!isActive) {
          const el = e.currentTarget;
          el.style.color = "var(--text-primary)";
          el.style.background = "color-mix(in srgb, var(--accent) 7%, transparent)";
          el.style.borderColor = "color-mix(in srgb, var(--accent) 20%, transparent)";
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          const el = e.currentTarget;
          el.style.color = "var(--text-secondary)";
          el.style.background = "rgba(255,255,255,0.03)";
          el.style.borderColor = "var(--border)";
        }
      }}
    >
      {label}
    </Link>
  );
}

interface NotifItem {
  id: string;
  sender_id: string;
  created_at: string;
  senderName: string | null;
  senderUsername: string | null;
}

function timeAgoShort(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function BellSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function NotificationBell({ userId }: { userId: string | null }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch unread count on mount / when userId is available
  useEffect(() => {
    if (!userId) { setUnreadCount(0); return; }
    const fetchCount = async () => {
      const lastRead = localStorage.getItem(`notif_read_${userId}`) ?? "1970-01-01T00:00:00Z";
      const supabase = createClient();
      const { count } = await supabase
        .from("connections")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("status", "pending")
        .gt("created_at", lastRead);
      setUnreadCount(count ?? 0);
    };
    fetchCount();
  }, [userId]);

  // Fetch notification list when dropdown opens
  useEffect(() => {
    if (!open || !userId) return;
    const fetchNotifs = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: rows } = await supabase
        .from("connections")
        .select("id, sender_id, created_at")
        .eq("receiver_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      if (rows && rows.length > 0) {
        const ids = (rows as { sender_id: string }[]).map((r) => r.sender_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", ids);
        const pMap: Record<string, { full_name: string | null; username: string | null }> = {};
        ((profiles ?? []) as { id: string; full_name: string | null; username: string | null }[])
          .forEach((p) => { pMap[p.id] = p; });
        setNotifs(
          (rows as { id: string; sender_id: string; created_at: string }[]).map((r) => ({
            id: r.id,
            sender_id: r.sender_id,
            created_at: r.created_at,
            senderName: pMap[r.sender_id]?.full_name ?? null,
            senderUsername: pMap[r.sender_id]?.username ?? null,
          }))
        );
      } else {
        setNotifs([]);
      }
      setLoading(false);
    };
    fetchNotifs();
  }, [open, userId]);

  const markAllRead = () => {
    if (!userId) return;
    localStorage.setItem(`notif_read_${userId}`, new Date().toISOString());
    setUnreadCount(0);
  };

  if (!userId) return null;

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        title="Notifications"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 10,
          border: open
            ? "1px solid color-mix(in srgb, var(--accent) 30%, transparent)"
            : "1px solid var(--border)",
          background: open
            ? "color-mix(in srgb, var(--accent) 10%, transparent)"
            : "rgba(255,255,255,0.03)",
          cursor: "pointer",
          color: open ? "var(--accent-bright)" : "var(--text-secondary)",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
            (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--accent) 8%, transparent)";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
          }
        }}
      >
        <BellSVG />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "var(--accent)", color: "white",
            fontSize: 9, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px", border: "1.5px solid var(--background)",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          {/* Header */}
          <div style={{
            padding: "12px 14px 10px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, background: "var(--accent)", color: "white", borderRadius: 10, padding: "1px 7px" }}>
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{ background: "none", border: "none", padding: 0, color: "var(--accent-bright)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          {loading ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
          ) : notifs.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#6366f1" }}>
                <BellSVG />
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, margin: 0 }}>No notifications yet</p>
              <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>Connection requests will appear here.</p>
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {notifs.map((n) => (
                <Link
                  key={n.id}
                  href="/connections"
                  onClick={() => setOpen(false)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#a5b4fc" }}>
                    {(n.senderName ?? n.senderUsername ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }}>
                      <strong>{n.senderName ?? n.senderUsername ?? "Someone"}</strong>{" "}sent you a connection request
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "3px 0 0" }}>{timeAgoShort(n.created_at)}</p>
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: 5 }} />
                </Link>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Link href="/connections" onClick={() => setOpen(false)} style={{ fontSize: 12, color: "var(--accent-bright)", textDecoration: "none", fontWeight: 600 }}>
              View all connection requests →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [university, setUniversity] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const supabase = createClient();

    const loadProfile = async (uid: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name, university")
        .eq("id", uid)
        .maybeSingle();
      setUsername(profile?.username ?? null);
      setFullName(profile?.full_name ?? null);
      setUniversity(profile?.university ?? null);
    };

    // Immediately read session so the nav renders on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      setUserId(session.user.id);
      await loadProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!session?.user) {
        setUserId(null);
        setUsername(null);
        setFullName(null);
        setUniversity(null);
        return;
      }
      setUserId(session.user.id);
      // Defer DB work so we don't deadlock GoTrue's _notifyAllSubscribers lock.
      setTimeout(() => { loadProfile(session.user.id); }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await createClient().auth.signOut();
    window.location.href = "/";
  };

  if (pathname && HIDDEN_ROUTES.includes(pathname)) return null;

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          padding: "0 24px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.2s ease",
          borderBottom: scrolled
            ? "1px solid var(--border)"
            : "1px solid transparent",
          background: scrolled
            ? "color-mix(in srgb, var(--background) 95%, transparent)"
            : "color-mix(in srgb, var(--background) 75%, transparent)",
          backdropFilter: scrolled ? "blur(24px)" : "none",
        }}
      >
        {/* Logo */}
        <Logo size="md" style={{ flexShrink: 0 }} />

        {/* Desktop nav items */}
        <div className="nav-desktop-items" style={{ alignItems: "center", gap: "8px" }}>
          {(userId ? navItems : publicNavItems).map(item => <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />)}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <NotificationBell userId={userId} />
          <ThemePicker />

          <div className="nav-desktop-items" style={{ alignItems: "center", gap: "8px" }}>
            {userId ? (
              <>
                <Link href="/projects/new" className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                  + Start Building
                </Link>
                {username && (
                  <Link href={`/builders/${username}`} className="btn-ghost" style={{ fontSize: "13px" }}>
                    My Profile
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.03)",
                    color: "var(--text-secondary)",
                    cursor: loggingOut ? "default" : "pointer",
                    fontWeight: 500,
                    transition: "all 0.15s ease",
                    fontFamily: "DM Sans, sans-serif",
                    whiteSpace: "nowrap",
                    opacity: loggingOut ? 0.6 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!loggingOut) {
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-highlight)";
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  }}
                >
                  {loggingOut ? "Signing out…" : "Log out"}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost" style={{ fontSize: "13px" }}>
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary" style={{ padding: "8px 18px", fontSize: "13px" }}>
                  Start Building
                </Link>
              </>
            )}
          </div>

          {/* Hamburger — only visible on mobile via CSS */}
          <button
            type="button"
            className={`hamburger-btn${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Overlay — dims content behind the mobile menu */}
      {menuOpen && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 98,
            animation: "fade-in 0.2s ease",
          }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile slide-in menu from left */}
      <div className={`nav-menu-mobile${menuOpen ? " open" : ""}`}>
        {/* Close button */}
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
          style={{
            position: "absolute", top: 16, right: 16,
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}
        >
          ✕
        </button>

        {/* User identity at top */}
        {userId && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "16px 16px 16px 4px",
            borderBottom: "1px solid var(--border)",
            marginBottom: 8,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 700, color: "white",
            }}>
              {(fullName ?? username ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {fullName ?? username ?? "Builder"}
              </div>
              {university && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {university}
                </div>
              )}
            </div>
          </div>
        )}

        {(userId ? navItems : publicNavItems).map(item => <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} mobile />)}

        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 8,
          alignItems: "stretch",
        }}>
          {userId ? (
            <>
              <Link href="/projects/new" className="btn-primary" style={{ justifyContent: "center" }}>
                + Start Building
              </Link>
              {username && (
                <Link href={`/builders/${username}`} style={{
                  display: "block", padding: "12px 16px", borderRadius: 12,
                  fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 500,
                  color: "var(--text-secondary)", textDecoration: "none",
                }}>
                  My Profile
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 16px", borderRadius: 12, border: "none",
                  background: "transparent", fontFamily: "DM Sans, sans-serif",
                  fontSize: 15, fontWeight: 500, color: "#f87171", cursor: loggingOut ? "default" : "pointer",
                  opacity: loggingOut ? 0.6 : 1,
                }}
              >
                {loggingOut ? "Signing out…" : "Log out"}
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/login" className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                Start Building
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
