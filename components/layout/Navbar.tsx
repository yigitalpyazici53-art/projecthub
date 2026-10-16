"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import Logo from "@/components/Logo";
import { cleanText } from "@/utils/display";
import { profilePath } from "@/utils/profileUrl";

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
// `exclude` keeps a section link quiet on a sub-route that has its own entry
// (Builders stays unlit on your own profile, which "My Profile" covers).
function NavLink({ href, label, pathname, mobile = false, exclude }: { href: string; label: string; pathname: string | null; mobile?: boolean; exclude?: string }) {
  const isActive = pathname !== exclude && (pathname === href || (href !== "/dashboard" && href !== "/" && (pathname?.startsWith(href) ?? false)));
  return (
    <Link
      href={href}
      className={`${mobile ? "app-nav-mlink" : "app-nav-link"}${isActive ? " active" : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

// The bell merges two sources: pending connection requests (connections
// table) and application events (notifications table).
const APP_NOTIF_TYPES = ["application_received", "application_accepted", "application_rejected"] as const;
type AppNotifType = (typeof APP_NOTIF_TYPES)[number];

interface NotifItem {
  id: string;
  kind: "connection_request" | AppNotifType;
  created_at: string;
  senderName: string | null;
  senderUsername: string | null;
  projectId: string | null;
  projectTitle: string | null;
}

function notifHref(n: NotifItem): string {
  if (n.kind === "connection_request") return "/connections";
  if (!n.projectId) return "/dashboard";
  return n.kind === "application_received" ? `/projects/${n.projectId}#applications` : `/projects/${n.projectId}`;
}

function NotifText({ n }: { n: NotifItem }) {
  const who = <strong>{n.senderName ?? n.senderUsername ?? "Someone"}</strong>;
  const project = n.projectTitle ? <strong>{n.projectTitle}</strong> : "your project";
  switch (n.kind) {
    case "connection_request":
      return <>{who} sent you a connection request</>;
    case "application_received":
      return <>{who} applied to join {project}</>;
    case "application_accepted":
      return <>Your application to {n.projectTitle ? <strong>{n.projectTitle}</strong> : "a project"} was <strong style={{ color: "var(--success)" }}>accepted</strong></>;
    case "application_rejected":
      return <>Your application to {n.projectTitle ? <strong>{n.projectTitle}</strong> : "a project"} was declined</>;
  }
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
      const [connRes, appRes] = await Promise.all([
        supabase
          .from("connections")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", userId)
          .eq("status", "pending")
          .gt("created_at", lastRead),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("read", false)
          .in("type", APP_NOTIF_TYPES)
          .gt("created_at", lastRead),
      ]);
      setUnreadCount((connRes.count ?? 0) + (appRes.count ?? 0));
    };
    fetchCount();
  }, [userId]);

  // Fetch notification list when dropdown opens
  useEffect(() => {
    if (!open || !userId) return;
    const fetchNotifs = async () => {
      setLoading(true);
      const supabase = createClient();
      const [connRes, appRes] = await Promise.all([
        supabase
          .from("connections")
          .select("id, sender_id, created_at")
          .eq("receiver_id", userId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("notifications")
          .select("id, type, from_user_id, entity_id, created_at")
          .eq("user_id", userId)
          .in("type", APP_NOTIF_TYPES)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      const conns = (connRes.data ?? []) as { id: string; sender_id: string; created_at: string }[];
      const apps = (appRes.data ?? []) as { id: string; type: AppNotifType; from_user_id: string | null; entity_id: string | null; created_at: string }[];

      const profileIds = [...new Set([
        ...conns.map((c) => c.sender_id),
        ...apps.map((a) => a.from_user_id).filter((x): x is string => Boolean(x)),
      ])];
      const projectIds = [...new Set(apps.map((a) => a.entity_id).filter((x): x is string => Boolean(x)))];
      const [profRes, projRes] = await Promise.all([
        profileIds.length > 0
          ? supabase.from("profiles").select("id, full_name, username").in("id", profileIds)
          : Promise.resolve({ data: [] }),
        projectIds.length > 0
          ? supabase.from("projects").select("id, title").in("id", projectIds)
          : Promise.resolve({ data: [] }),
      ]);
      const pMap: Record<string, { full_name: string | null; username: string | null }> = {};
      ((profRes.data ?? []) as { id: string; full_name: string | null; username: string | null }[])
        .forEach((p) => { pMap[p.id] = { full_name: cleanText(p.full_name), username: p.username }; });
      const projMap: Record<string, string | null> = {};
      ((projRes.data ?? []) as { id: string; title: string | null }[]).forEach((p) => { projMap[p.id] = p.title; });

      const items: NotifItem[] = [
        ...conns.map((c) => ({
          id: `c_${c.id}`,
          kind: "connection_request" as const,
          created_at: c.created_at,
          senderName: pMap[c.sender_id]?.full_name ?? null,
          senderUsername: pMap[c.sender_id]?.username ?? null,
          projectId: null,
          projectTitle: null,
        })),
        ...apps.map((a) => ({
          id: `n_${a.id}`,
          kind: a.type,
          created_at: a.created_at,
          senderName: a.from_user_id ? pMap[a.from_user_id]?.full_name ?? null : null,
          senderUsername: a.from_user_id ? pMap[a.from_user_id]?.username ?? null : null,
          projectId: a.entity_id,
          projectTitle: a.entity_id ? projMap[a.entity_id] ?? null : null,
        })),
      ];
      items.sort((x, y) => y.created_at.localeCompare(x.created_at));
      setNotifs(items.slice(0, 8));
      setLoading(false);
    };
    fetchNotifs();
  }, [open, userId]);

  const markAllRead = async () => {
    if (!userId) return;
    localStorage.setItem(`notif_read_${userId}`, new Date().toISOString());
    setUnreadCount(0);
    await createClient()
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false)
      .in("type", APP_NOTIF_TYPES);
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
              <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>Connection requests and application updates will appear here.</p>
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {notifs.map((n) => (
                <Link
                  key={n.id}
                  href={notifHref(n)}
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
                      <NotifText n={n} />
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
            <Link href="/dashboard" onClick={() => setOpen(false)} className="u-link" style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
              View all notifications →
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
      setFullName(cleanText(profile?.full_name));
      setUniversity(cleanText(profile?.university));
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

  const myProfilePath = username ? profilePath(username) : undefined;

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
        }}
        className="app-nav"
      >
        {/* Logo */}
        <Logo size="md" tone="dark" style={{ flexShrink: 0 }} />

        {/* Desktop nav items */}
        <div className="nav-desktop-items" style={{ alignItems: "center", gap: 4 }}>
          {(userId ? navItems : publicNavItems).map(item => <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} exclude={item.href === "/builders" ? myProfilePath : undefined} />)}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <NotificationBell key={userId ?? "anon"} userId={userId} />

          <div className="nav-desktop-items" style={{ alignItems: "center", gap: 8 }}>
            {userId ? (
              <>
                <Link href="/projects/new" className="app-nav-cta">
                  + Add project
                </Link>
                {myProfilePath && <NavLink href={myProfilePath} label="My Profile" pathname={pathname} />}
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
                <Link href="/signup" className="app-nav-cta">
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
        <div className="app-nav-overlay" onClick={() => setMenuOpen(false)} />
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

        {(userId ? navItems : publicNavItems).map(item => <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} mobile exclude={item.href === "/builders" ? myProfilePath : undefined} />)}

        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 8,
          alignItems: "stretch",
        }}>
          {userId ? (
            <>
              <Link href="/projects/new" className="app-nav-cta" style={{ padding: "12px 16px", fontSize: 14 }}>
                + Add project
              </Link>
              {myProfilePath && <NavLink href={myProfilePath} label="My Profile" pathname={pathname} mobile />}
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
              <Link href="/signup" className="app-nav-cta" style={{ flex: 1, padding: "10px 12px" }}>
                Create profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
