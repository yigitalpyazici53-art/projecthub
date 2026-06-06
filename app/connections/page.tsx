"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SkeletonLoader from "@/components/SkeletonLoader";
import { getInitials } from "@/utils/getInitials";
import type { Profile } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConnectionRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
}

interface ConnectedProfile extends Profile {
  connectionId: string;
}

interface PendingProfile extends Profile {
  connectionId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAvatarColor(id: string): string {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#06b6d4"];
  return colors[id.charCodeAt(0) % colors.length] ?? "#6366f1";
}

function uniqueById<T extends { id: string }>(arr: T[]): T[] {
  return Array.from(new Map(arr.map((x) => [x.id, x])).values());
}

function matchesSearch(profile: Profile, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    (profile.full_name ?? "").toLowerCase().includes(lower) ||
    (profile.username ?? "").toLowerCase().includes(lower) ||
    (profile.university ?? "").toLowerCase().includes(lower) ||
    (profile.skills ?? "").toLowerCase().includes(lower) ||
    (profile.role ?? "").toLowerCase().includes(lower)
  );
}

type Tab = "connected" | "pending" | "sent";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("connected");
  const [search, setSearch] = useState("");

  const [connected, setConnected] = useState<ConnectedProfile[]>([]);
  const [pending, setPending] = useState<PendingProfile[]>([]);
  const [sent, setSent] = useState<PendingProfile[]>([]);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?next=/connections");
      return;
    }
    const load = async () => {
      try {
        const supabase = createClient();
        const uid = user.id;

        // Fetch all three connection types in parallel
        const [acceptedRes, incomingRes, outgoingRes] = await Promise.all([
          supabase
            .from("connections")
            .select("id, sender_id, receiver_id, status, created_at")
            .eq("status", "accepted")
            .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`),

          supabase
            .from("connections")
            .select("id, sender_id, receiver_id, status, created_at")
            .eq("status", "pending")
            .eq("receiver_id", uid)
            .order("created_at", { ascending: false }),

          supabase
            .from("connections")
            .select("id, sender_id, receiver_id, status, created_at")
            .eq("status", "pending")
            .eq("sender_id", uid)
            .order("created_at", { ascending: false }),
        ]);

        if (acceptedRes.error) { setError(acceptedRes.error.message); return; }
        if (incomingRes.error) { setError(incomingRes.error.message); return; }
        if (outgoingRes.error) { setError(outgoingRes.error.message); return; }

        const acceptedRows = (acceptedRes.data ?? []) as ConnectionRow[];
        const incomingRows = (incomingRes.data ?? []) as ConnectionRow[];
        const outgoingRows = (outgoingRes.data ?? []) as ConnectionRow[];

        // Collect all profile IDs needed
        const connectedIds = acceptedRows.map((c) => c.sender_id === uid ? c.receiver_id : c.sender_id);
        const pendingIds = incomingRows.map((c) => c.sender_id);
        const sentIds = outgoingRows.map((c) => c.receiver_id);
        const allIds = [...new Set([...connectedIds, ...pendingIds, ...sentIds])];

        if (allIds.length === 0) {
          setConnected([]);
          setPending([]);
          setSent([]);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, username, university, role, bio, skills, interests, github_url")
          .in("id", allIds);

        if (profileError) { setError(profileError.message); return; }

        const profileMap: Record<string, Profile> = {};
        (profileData ?? []).forEach((p: Profile) => { profileMap[p.id] = p; });

        setConnected(
          uniqueById(
            acceptedRows
              .map((c) => {
                const pid = c.sender_id === uid ? c.receiver_id : c.sender_id;
                const p = profileMap[pid];
                return p ? { ...p, connectionId: c.id } : null;
              })
              .filter((x): x is ConnectedProfile => x !== null)
          )
        );

        setPending(
          uniqueById(
            incomingRows
              .map((c) => {
                const p = profileMap[c.sender_id];
                return p ? { ...p, connectionId: c.id } : null;
              })
              .filter((x): x is PendingProfile => x !== null)
          )
        );

        setSent(
          uniqueById(
            outgoingRows
              .map((c) => {
                const p = profileMap[c.receiver_id];
                return p ? { ...p, connectionId: c.id } : null;
              })
              .filter((x): x is PendingProfile => x !== null)
          )
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unexpected error.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, user, router]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const handleAccept = async (connectionId: string) => {
    setActionLoading(connectionId);
    setActionError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connectionId);
    if (error) { setActionError(error.message); }
    else {
      const accepted = pending.find((p) => p.connectionId === connectionId);
      if (accepted) {
        setConnected((prev) => [...prev, accepted]);
        setPending((prev) => prev.filter((p) => p.connectionId !== connectionId));
        // Notify sender that their request was accepted
        if (user) {
          await supabase.from("notifications").insert({
            user_id: accepted.id,
            type: "connection_accepted" as const,
            from_user_id: user.id,
            entity_id: connectionId,
          });
        }
      }
    }
    setActionLoading(null);
  };

  const handleDecline = async (connectionId: string) => {
    setActionLoading(connectionId);
    setActionError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("connections")
      .update({ status: "rejected" })
      .eq("id", connectionId);
    if (error) { setActionError(error.message); }
    else { setPending((prev) => prev.filter((p) => p.connectionId !== connectionId)); }
    setActionLoading(null);
  };

  const handleCancel = async (connectionId: string) => {
    setActionLoading(connectionId);
    setActionError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId);
    if (error) { setActionError(error.message); }
    else { setSent((prev) => prev.filter((p) => p.connectionId !== connectionId)); }
    setActionLoading(null);
  };

  // Filtered lists
  const filteredConnected = connected.filter((p) => matchesSearch(p, search));
  const filteredPending = pending.filter((p) => matchesSearch(p, search));
  const filteredSent = sent.filter((p) => matchesSearch(p, search));

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "connected", label: "Connected", count: connected.length },
    { id: "pending",   label: "Pending",   count: pending.length   },
    { id: "sent",      label: "Sent",      count: sent.length      },
  ];

  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />
      <div className="page-z" style={{ maxWidth: 1200, margin: "0 auto", paddingTop: "80px" }}>

        {/* Header */}
        <div className="animate-fade-up" style={{ marginBottom: 28 }}>
          <h1 style={titleStyle}>Connections</h1>
          <p style={subtitleStyle}>Manage your network of student builders</p>
        </div>

        {/* Tabs */}
        <div className="animate-fade-up animate-delay-1 connections-tabs-bar" style={tabsContainerStyle}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...tabBtnBase,
                ...(activeTab === tab.id ? tabBtnActive : tabBtnInactive),
              }}
            >
              {tab.label}
              <span style={{
                ...tabCountBase,
                ...(activeTab === tab.id ? tabCountActive : tabCountInactive),
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        {!loading && (
          <div className="animate-fade-up animate-delay-2" style={{ marginBottom: 24 }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connections by name, skill or university..."
              className="connections-search"
              style={searchInputStyle}
            />
          </div>
        )}

        {loading && <SkeletonLoader count={6} columns="repeat(auto-fill, minmax(260px, 1fr))" />}

        {error && <p style={errorStyle}>{error}</p>}
        {actionError && <p style={errorStyle}>{actionError}</p>}

        {/* ── Connected tab ── */}
        {!loading && activeTab === "connected" && (
          <>
            {filteredConnected.length === 0 ? (
              <EmptyState
                svgType={!search ? "network" : undefined}
                title={search ? "No results" : "No connections yet"}
                body={search ? "Try a different search." : "Discover builders and send connection requests to grow your network."}
                cta={!search ? { label: "Find builders", href: "/builders" } : undefined}
              />
            ) : (
              <div style={gridStyle}>
                {filteredConnected.map((profile) => (
                  <ConnectedCard key={profile.id} profile={profile} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Pending tab ── */}
        {!loading && activeTab === "pending" && (
          <>
            {filteredPending.length === 0 ? (
              <EmptyState
                svgType={!search ? "pending" : undefined}
                title={search ? "No results" : "No incoming requests"}
                body={search ? "Try a different search." : "When someone sends you a connection request it will appear here."}
              />
            ) : (
              <div style={gridStyle}>
                {filteredPending.map((profile) => (
                  <PendingCard
                    key={profile.id}
                    profile={profile}
                    busy={actionLoading === profile.connectionId}
                    onAccept={() => handleAccept(profile.connectionId)}
                    onDecline={() => handleDecline(profile.connectionId)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Sent tab ── */}
        {!loading && activeTab === "sent" && (
          <>
            {filteredSent.length === 0 ? (
              <EmptyState
                svgType={!search ? "sent" : undefined}
                title={search ? "No results" : "No sent requests"}
                body={search ? "Try a different search." : "Requests you've sent will appear here until accepted or declined."}
                cta={!search ? { label: "Find builders", href: "/builders" } : undefined}
              />
            ) : (
              <div style={gridStyle}>
                {filteredSent.map((profile) => (
                  <SentCard
                    key={profile.id}
                    profile={profile}
                    busy={actionLoading === profile.connectionId}
                    onCancel={() => handleCancel(profile.connectionId)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ── Card sub-components ───────────────────────────────────────────────────────

function AvatarCircle({ profile }: { profile: Profile }) {
  return (
    <div style={{ ...avatarStyle, background: getAvatarColor(profile.id) }}>
      {getInitials(profile.full_name, profile.username)}
    </div>
  );
}

function SkillPills({ skills }: { skills: string | null }) {
  if (!skills) return null;
  const list = skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
      {list.map((s) => (
        <span key={s} style={skillPillStyle}>{s}</span>
      ))}
    </div>
  );
}

function ConnectedCard({ profile }: { profile: ConnectedProfile }) {
  return (
    <article style={cardStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "color-mix(in srgb, var(--accent) 35%, transparent)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(0,0,0,0.45)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Connected badge */}
      <div style={connectedBadgeStyle}>
        <span style={connectedDotStyle} />
        Connected
      </div>

      {/* Avatar + name row */}
      <div style={cardHeaderStyle}>
        <AvatarCircle profile={profile} />
        <div style={{ minWidth: 0 }}>
          <div style={cardNameStyle}>{profile.full_name || profile.username || "Builder"}</div>
          <div style={cardHandleStyle}>@{profile.username || "no-handle"}</div>
          {profile.university && <div style={cardUniStyle}>{profile.university}</div>}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p style={bioStyle}>
          {profile.bio.length > 100 ? profile.bio.slice(0, 100) + "…" : profile.bio}
        </p>
      )}

      {/* Skills */}
      <SkillPills skills={profile.skills} />

      {/* Actions */}
      <div style={cardFooterStyle}>
        <Link
          href={`/builders/${profile.username || profile.id}`}
          style={outlinedBtnStyle}
        >
          View profile
        </Link>
        <Link href={`/messages?with=${profile.id}`} style={accentBtnStyle}>
          Message
        </Link>
      </div>
    </article>
  );
}

function PendingCard({
  profile,
  busy,
  onAccept,
  onDecline,
}: {
  profile: PendingProfile;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <article style={cardStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "color-mix(in srgb, var(--warning) 30%, transparent)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(0,0,0,0.45)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Pending badge */}
      <div style={pendingBadgeStyle}>
        <span style={pendingDotStyle} />
        Wants to connect
      </div>

      <div style={cardHeaderStyle}>
        <AvatarCircle profile={profile} />
        <div style={{ minWidth: 0 }}>
          <div style={cardNameStyle}>{profile.full_name || profile.username || "Builder"}</div>
          <div style={cardHandleStyle}>@{profile.username || "no-handle"}</div>
          {profile.university && <div style={cardUniStyle}>{profile.university}</div>}
        </div>
      </div>

      {profile.bio && (
        <p style={bioStyle}>
          {profile.bio.length > 100 ? profile.bio.slice(0, 100) + "…" : profile.bio}
        </p>
      )}

      <SkillPills skills={profile.skills} />

      <div style={cardFooterStyle}>
        <button
          type="button"
          onClick={onAccept}
          disabled={busy}
          style={{ ...acceptBtnStyle, opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "…" : "Accept"}
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={busy}
          style={{ ...declineBtnStyle, opacity: busy ? 0.6 : 1 }}
        >
          Decline
        </button>
        <Link href={`/builders/${profile.username || profile.id}`} style={ghostBtnStyle}>
          View
        </Link>
      </div>
    </article>
  );
}

function SentCard({
  profile,
  busy,
  onCancel,
}: {
  profile: PendingProfile;
  busy: boolean;
  onCancel: () => void;
}) {
  return (
    <article style={cardStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "color-mix(in srgb, var(--accent) 25%, transparent)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(0,0,0,0.45)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Sent badge */}
      <div style={sentBadgeStyle}>
        <span style={sentDotStyle} />
        Request sent
      </div>

      <div style={cardHeaderStyle}>
        <AvatarCircle profile={profile} />
        <div style={{ minWidth: 0 }}>
          <div style={cardNameStyle}>{profile.full_name || profile.username || "Builder"}</div>
          <div style={cardHandleStyle}>@{profile.username || "no-handle"}</div>
          {profile.university && <div style={cardUniStyle}>{profile.university}</div>}
        </div>
      </div>

      {profile.bio && (
        <p style={bioStyle}>
          {profile.bio.length > 100 ? profile.bio.slice(0, 100) + "…" : profile.bio}
        </p>
      )}

      <SkillPills skills={profile.skills} />

      <div style={cardFooterStyle}>
        <Link href={`/builders/${profile.username || profile.id}`} style={outlinedBtnStyle}>
          View profile
        </Link>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          style={{ ...cancelBtnStyle, opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "…" : "Cancel"}
        </button>
      </div>
    </article>
  );
}

function EmptyState({
  svgType,
  title,
  body,
  cta,
}: {
  svgType?: "network" | "pending" | "sent";
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      {svgType === "network" && (
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 20 }}>
          <circle cx="50" cy="50" r="47" stroke="rgba(99,102,241,0.18)" strokeWidth="1.5" strokeDasharray="7 4" />
          <circle cx="50" cy="50" r="10" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" />
          <circle cx="20" cy="35" r="7" fill="rgba(76,142,255,0.1)" stroke="rgba(76,142,255,0.4)" strokeWidth="1.5" />
          <circle cx="80" cy="35" r="7" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />
          <circle cx="20" cy="65" r="7" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" />
          <circle cx="80" cy="65" r="7" fill="rgba(236,72,153,0.1)" stroke="rgba(236,72,153,0.35)" strokeWidth="1.5" />
          <circle cx="50" cy="18" r="6" fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" />
          <line x1="27" y1="38" x2="42" y2="46" stroke="rgba(99,102,241,0.3)" strokeWidth="1.2" />
          <line x1="73" y1="38" x2="58" y2="46" stroke="rgba(99,102,241,0.3)" strokeWidth="1.2" />
          <line x1="27" y1="62" x2="42" y2="54" stroke="rgba(99,102,241,0.3)" strokeWidth="1.2" />
          <line x1="73" y1="62" x2="58" y2="54" stroke="rgba(99,102,241,0.3)" strokeWidth="1.2" />
          <line x1="50" y1="24" x2="50" y2="40" stroke="rgba(99,102,241,0.3)" strokeWidth="1.2" />
        </svg>
      )}
      {svgType === "pending" && (
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 20 }}>
          <circle cx="50" cy="50" r="47" stroke="rgba(251,191,36,0.18)" strokeWidth="1.5" strokeDasharray="7 4" />
          <rect x="22" y="28" width="56" height="44" rx="10" fill="rgba(251,191,36,0.07)" stroke="rgba(251,191,36,0.35)" strokeWidth="1.5" />
          <path d="M22 42l28 16 28-16" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="72" cy="30" r="10" fill="rgba(251,146,60,0.2)" stroke="rgba(251,146,60,0.5)" strokeWidth="1.5" />
          <path d="M72 26v5l3 2.5" stroke="rgba(251,146,60,0.8)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {svgType === "sent" && (
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 20 }}>
          <circle cx="50" cy="50" r="47" stroke="rgba(99,102,241,0.18)" strokeWidth="1.5" strokeDasharray="7 4" />
          <path d="M18 50L82 50M60 34l22 16-22 16" fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="34" cy="50" r="8" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.35)" strokeWidth="1.5" />
        </svg>
      )}
      {!svgType && <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>}
      <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 320, margin: "0 auto 20px" }}>{body}</p>
      {cta && (
        <Link href={cta.href} className="btn-primary">{cta.label}</Link>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--background)",
  color: "var(--text-primary)",
  padding: "40px 24px",
  position: "relative",
};

const titleStyle: React.CSSProperties = {
  fontSize: "clamp(26px, 4vw, 38px)",
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  color: "var(--text-primary)",
  letterSpacing: "-0.03em",
  marginBottom: 6,
};

const subtitleStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: 15,
};

const errorStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  marginBottom: 16,
  background: "color-mix(in srgb, var(--danger) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
  color: "color-mix(in srgb, var(--danger) 65%, white)",
  fontSize: 13,
};

// Tabs
const tabsContainerStyle: React.CSSProperties = {
  display: "inline-flex",
  gap: 4,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 4,
  marginBottom: 20,
};

const tabBtnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 18px",
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const tabBtnActive: React.CSSProperties = {
  background: "var(--accent)",
  color: "white",
};

const tabBtnInactive: React.CSSProperties = {
  background: "transparent",
  color: "var(--text-secondary)",
};

const tabCountBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 20,
  height: 20,
  borderRadius: 10,
  fontSize: 11,
  fontWeight: 700,
  padding: "0 5px",
};

const tabCountActive: React.CSSProperties = {
  background: "rgba(255,255,255,0.25)",
  color: "white",
};

const tabCountInactive: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  color: "var(--text-muted)",
};

// Search
const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

// Grid
const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 16,
};

// Card
const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 20,
  transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
  position: "relative",
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 14,
};

const avatarStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  fontWeight: 700,
  color: "white",
  flexShrink: 0,
};

const cardNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  color: "var(--text-primary)",
  marginBottom: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const cardHandleStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--accent)",
  marginBottom: 2,
};

const cardUniStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
};

const bioStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  marginBottom: 12,
};

const skillPillStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-secondary)",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "3px 9px",
};

const cardFooterStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: "auto",
  paddingTop: 14,
  borderTop: "1px solid var(--border-subtle)",
  flexWrap: "wrap",
};

// Status badges (top-right corner)
const connectedBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11,
  fontWeight: 600,
  color: "var(--accent-green)",
  background: "var(--accent-green-glow)",
  border: "1px solid color-mix(in srgb, var(--accent-green) 25%, transparent)",
  borderRadius: 20,
  padding: "3px 9px",
};

const connectedDotStyle: React.CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: "var(--accent-green)",
  flexShrink: 0,
};

const pendingBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11,
  fontWeight: 600,
  color: "var(--warning)",
  background: "color-mix(in srgb, var(--warning) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)",
  borderRadius: 20,
  padding: "3px 9px",
};

const pendingDotStyle: React.CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: "var(--warning)",
  flexShrink: 0,
};

const sentBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11,
  fontWeight: 600,
  color: "var(--accent-bright)",
  background: "color-mix(in srgb, var(--accent) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
  borderRadius: 20,
  padding: "3px 9px",
};

const sentDotStyle: React.CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: "var(--accent-bright)",
  flexShrink: 0,
};

// Action buttons
const outlinedBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-secondary)",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  flex: 1,
  textAlign: "center",
};

const accentBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
  background: "color-mix(in srgb, var(--accent) 15%, transparent)",
  color: "var(--accent-bright)",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  flex: 1,
};

const acceptBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
  background: "color-mix(in srgb, var(--success) 12%, transparent)",
  color: "var(--success)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  flex: 1,
};

const declineBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
  background: "color-mix(in srgb, var(--danger) 8%, transparent)",
  color: "var(--danger)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  flex: 1,
};

const cancelBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
  background: "color-mix(in srgb, var(--danger) 7%, transparent)",
  color: "var(--danger)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const ghostBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "7px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-muted)",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};
