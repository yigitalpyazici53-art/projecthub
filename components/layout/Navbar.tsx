"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
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

const HIDDEN_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/apply"];

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
          borderRadius: 8,
          fontFamily: "var(--font-sans)",
          fontSize: 15,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
          background: isActive ? "var(--surface-raised)" : "transparent",
          textDecoration: "none",
          transition: "background 0.15s ease, color 0.15s ease",
        }}
      >
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="u-link"
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        padding: "6px 10px",
        transition: "color 0.15s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
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

  // Fetch unread count on mount. The parent keys this component by userId, so
  // a different user always starts from a fresh count of 0.
  useEffect(() => {
    if (!userId) return;
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
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: open ? "var(--surface-raised)" : "transparent",
          cursor: "pointer",
          color: open ? "var(--text-primary)" : "var(--text-secondary)",
          transition: "background 0.15s ease, color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-raised)";
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        <BellSVG />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "var(--accent)", color: "var(--accent-contrast)",
            fontSize: 9, fontWeight: 600,
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
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ fontSize: 10, fontWeight: 600, background: "var(--accent)", color: "var(--accent-contrast)", borderRadius: 10, padding: "1px 7px" }}>
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{ background: "none", border: "none", padding: 0, color: "var(--text-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
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
              <div style={{ width: 44, height: 44, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "var(--text-muted)" }}>
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
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", borderBottom: "1px solid var(--border-subtle)", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--surface-raised)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "var(--surface-raised)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
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
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-subtle)" }}>
            <Link href="/connections" onClick={() => setOpen(false)} className="u-link" style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [university, setUniversity] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close mobile menu on route change (adjusted during render, not in an effect).
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    setMenuOpen(false);
  }

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
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          background: "rgba(250,250,248,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Logo */}
        <Logo size="md" tone="dark" style={{ flexShrink: 0 }} />

        {/* Desktop nav items */}
        <div className="nav-desktop-items" style={{ alignItems: "center", gap: 4 }}>
          {(userId ? navItems : publicNavItems).map(item => <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />)}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <NotificationBell key={userId ?? "anon"} userId={userId} />

          <div className="nav-desktop-items" style={{ alignItems: "center", gap: 8 }}>
            {userId ? (
              <>
                <Link href="/projects/new" className="btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
                  + Add project
                </Link>
                {username && (
                  <Link href={`/builders/${username}`} className="btn-ghost" style={{ fontSize: 13 }}>
                    My Profile
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="btn-ghost"
                  style={{ fontSize: 13, opacity: loggingOut ? 0.6 : 1, cursor: loggingOut ? "default" : "pointer" }}
                >
                  {loggingOut ? "Signing out…" : "Log out"}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost" style={{ fontSize: 13 }}>
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
                  Create your profile
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
            background: "rgba(26,26,24,0.28)",
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
            background: "transparent",
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
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 600, color: "var(--accent-contrast)",
            }}>
              {(fullName ?? username ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                + Add project
              </Link>
              {username && (
                <Link href={`/builders/${username}`} style={{
                  display: "block", padding: "12px 16px", borderRadius: 8,
                  fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 400,
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
                  padding: "12px 16px", borderRadius: 8, border: "none",
                  background: "transparent", fontFamily: "var(--font-sans)",
                  fontSize: 15, fontWeight: 400, color: "var(--danger)", cursor: loggingOut ? "default" : "pointer",
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
                Create profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
