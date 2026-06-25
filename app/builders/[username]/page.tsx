"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import SkeletonLoader from "@/components/SkeletonLoader";
import ProjectCard from "@/components/cards/ProjectCard";
import { getInitials } from "@/utils/getInitials";
import type { Profile, Project } from "@/types";

type PageProps = { params: Promise<{ username: string }> };
type ConnectStatus =
  | "idle"
  | "sending"
  | "sent"
  | "incoming"
  | "already_connected"
  | "own_profile"
  | "error";

// Local row type — extends Project so it can be passed straight to ProjectCard
// without re-shaping. We select only the fields we need below.
type ProjectRow = Project;

interface EndorsementRow {
  id: string;
  endorser_id: string;
  skill: string;
  created_at: string;
  endorserProfile?: { full_name: string | null; username: string | null; avatar_url: string | null };
}
type SkillEndorsements = Record<string, EndorsementRow[]>;

function getAvatarColor(id: string) {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  return colors[id.charCodeAt(0) % colors.length];
}

function stageBadge(stage: string | null): { label: string; color: string; bg: string } {
  switch (stage) {
    case "idea":     return { label: "In Progress", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" };
    case "mvp":      return { label: "Active",      color: "#4ade80", bg: "rgba(74,222,128,0.12)" };
    case "launched": return { label: "Done",        color: "#60a5fa", bg: "rgba(96,165,250,0.12)" };
    default:         return { label: "Active",      color: "#4ade80", bg: "rgba(74,222,128,0.12)" };
  }
}

const OPEN_AVAILABILITY = ["Open to cofound", "Open to join"];

export default function BuilderProfilePage({ params }: PageProps) {
  const { username } = use(params);
  const router = useRouter();

  const [builder, setBuilder] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [projectsCount, setProjectsCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>("idle");
  const [connectError, setConnectError] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [endorsements, setEndorsements] = useState<SkillEndorsements>({});
  const [endorsing, setEndorsing] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [latestUpdatesMap, setLatestUpdatesMap] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showSentToast, setShowSentToast] = useState(false);

  const loadEndorsements = useCallback(async (profileId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("endorsements")
      .select("id, endorser_id, skill, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) { setEndorsements({}); return; }
    const endorserIds = [...new Set((data as { endorser_id: string }[]).map(e => e.endorser_id))];
    const { data: eps } = await supabase
      .from("profiles").select("id, full_name, username, avatar_url").in("id", endorserIds);
    const pm: Record<string, { full_name: string | null; username: string | null; avatar_url: string | null }> = {};
    (eps ?? []).forEach((p: { id: string; full_name: string | null; username: string | null; avatar_url: string | null }) => { pm[p.id] = p; });
    const grouped: SkillEndorsements = {};
    (data as { id: string; endorser_id: string; skill: string; created_at: string }[]).forEach(e => {
      if (!grouped[e.skill]) grouped[e.skill] = [];
      grouped[e.skill].push({ ...e, endorserProfile: pm[e.endorser_id] });
    });
    setEndorsements(grouped);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      try {
        const { data, error: dbError } = await supabase
          .from("profiles")
          .select("id, full_name, username, university, role, bio, skills, interests, github_url, avatar_url")
          .eq("username", username)
          .maybeSingle();

        if (dbError || !data) { setNotFound(true); return; }
        const profile = data as Profile;
        setBuilder(profile);

        const [pRes, cRes, , userRes] = await Promise.all([
          supabase.from("projects").select("id", { count: "exact", head: true }).eq("owner_id", profile.id),
          supabase.from("connections").select("id", { count: "exact", head: true })
            .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`).eq("status", "accepted"),
          loadEndorsements(profile.id),
          supabase.auth.getUser(),
        ]);
        setProjectsCount(pRes.count ?? 0);
        setConnectionsCount(cRes.count ?? 0);

        const { data: projData } = await supabase
          .from("projects")
          .select("id, owner_id, title, tagline, description, category, stage, looking_for, tech_stack, created_at")
          .eq("owner_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(5);
        const loadedProjects = (projData ?? []) as ProjectRow[];
        setProjects(loadedProjects);

        if (loadedProjects.length > 0) {
          const pids = loadedProjects.map((p) => p.id);
          supabase
            .from("project_updates")
            .select("project_id, created_at")
            .in("project_id", pids)
            .order("created_at", { ascending: false })
            .then(({ data: ud }) => {
              if (ud) {
                const m: Record<string, string> = {};
                (ud as { project_id: string; created_at: string }[]).forEach((u) => {
                  if (!m[u.project_id]) m[u.project_id] = u.created_at;
                });
                setLatestUpdatesMap(m);
              }
            });
        }

        const user = userRes.data.user;
        if (user) {
          setMyId(user.id);
          if (user.id === profile.id) {
            setConnectStatus("own_profile");
          } else {
            const { data: existing } = await supabase
              .from("connections").select("id, status, sender_id")
              .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`)
              .maybeSingle();
            const conn = existing as { id: string; status: string; sender_id: string } | null;
            if (conn) {
              if (conn.status === "accepted") {
                setConnectStatus("already_connected");
              } else if (conn.sender_id === user.id) {
                setConnectStatus("sent");
              } else {
                setConnectStatus("incoming");
              }
            }
          }
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username, loadEndorsements]);

  const handleEndorse = async (skill: string) => {
    if (!myId || !builder || myId === builder.id || connectStatus !== "already_connected") return;
    setEndorsing(skill);
    const supabase = createClient();
    const myEndorsement = endorsements[skill]?.find(e => e.endorser_id === myId);
    if (myEndorsement) {
      await supabase.from("endorsements").delete().eq("id", myEndorsement.id);
    } else {
      await supabase.from("endorsements").insert({ endorser_id: myId, profile_id: builder.id, skill });
    }
    await loadEndorsements(builder.id);
    setEndorsing(null);
  };

  const handleConnect = async () => {
    if (connectStatus === "sending" || connectStatus === "sent" || connectStatus === "already_connected") return;
    setConnectError("");
    setConnectStatus("sending");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/login?next=/builders/${username}`); return; }
    if (!builder) return;

    // Defensive pre-check: if a row already exists (either direction), don't insert
    // a duplicate. Catches the case where the page state is stale or the user
    // double-clicked across tabs.
    const { data: existing } = await supabase
      .from("connections").select("id, status, sender_id")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${builder.id}),and(sender_id.eq.${builder.id},receiver_id.eq.${user.id})`)
      .maybeSingle();
    const existingConn = existing as { id: string; status: string; sender_id: string } | null;
    if (existingConn) {
      if (existingConn.status === "accepted") setConnectStatus("already_connected");
      else if (existingConn.sender_id === user.id) setConnectStatus("sent");
      else setConnectStatus("incoming");
      return;
    }

    const { data: connData, error: insertError } = await supabase
      .from("connections").insert({ sender_id: user.id, receiver_id: builder.id }).select("id").maybeSingle();
    if (insertError) {
      // Race / unique-constraint safety net: if the insert races with another
      // tab, Postgres will reject it — refetch and show the correct state
      // rather than a generic error.
      const { data: raced } = await supabase
        .from("connections").select("id, status, sender_id")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${builder.id}),and(sender_id.eq.${builder.id},receiver_id.eq.${user.id})`)
        .maybeSingle();
      const racedConn = raced as { id: string; status: string; sender_id: string } | null;
      if (racedConn) {
        if (racedConn.status === "accepted") setConnectStatus("already_connected");
        else if (racedConn.sender_id === user.id) setConnectStatus("sent");
        else setConnectStatus("incoming");
        return;
      }
      setConnectError(`Could not send request: ${insertError.message}`);
      setConnectStatus("error");
    } else {
      setConnectStatus("sent");
      setShowSentToast(true);
      setConnectionsCount(n => n + 1);
      await supabase.from("notifications").insert({
        user_id: builder.id, type: "connection_request", from_user_id: user.id, entity_id: connData?.id ?? null,
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main style={page}>
        <div className="page-pad-x" style={{ maxWidth: 1280, margin: "0 auto", paddingTop: 80 }}>
          <SkeletonLoader count={3} columns="1fr" />
        </div>
      </main>
    );
  }

  if (notFound || !builder) {
    return (
      <main style={page}>
        <div className="page-pad-x" style={{ maxWidth: 1280, margin: "0 auto", paddingTop: 80 }}>
          <div style={card}>
            <h1 style={{ fontSize: 20, fontFamily: "Syne, sans-serif", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Builder not found
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No builder with username &ldquo;{username}&rdquo; exists.</p>
            <Link href="/builders" className="btn-secondary" style={{ marginTop: 20, display: "inline-flex" }}>← Back to builders</Link>
          </div>
        </div>
      </main>
    );
  }

  const skills = (builder.skills ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const availability = (builder.interests ?? "").trim();
  const isOpenToCollaborate = OPEN_AVAILABILITY.includes(availability);
  const avatarColor = getAvatarColor(builder.id);
  const canConnect = connectStatus === "idle" || connectStatus === "error";
  const connectLabels: Record<ConnectStatus, string> = {
    idle: "Send connection request",
    sending: "Sending…",
    sent: "Request sent ✓",
    incoming: "They want to connect",
    already_connected: "Connected ✓",
    own_profile: "Edit Profile",
    error: "Try again",
  };
  const connectLabelsMobile: Record<ConnectStatus, string> = {
    idle: "Connect →",
    sending: "Sending…",
    sent: "Sent ✓",
    incoming: "Respond →",
    already_connected: "Connected ✓",
    own_profile: "Edit Profile",
    error: "Try again",
  };
  const builderFirstName = (builder.full_name || builder.username || "them").split(" ")[0];

  return (
    <main style={page}>
      <div className="page-pad-x" style={{ maxWidth: 1280, margin: "0 auto", paddingTop: 80, paddingBottom: 80 }}>

        {/* Back */}
        <Link href="/builders" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
          ← Back to builders
        </Link>

        {/* ── Profile Card (full-width hero) ── */}
        {/* overflow:visible so the avatar ring isn't clipped when it overlaps the banner edge */}
        <div style={{ ...card, padding: 0, overflow: "visible", marginBottom: 20 }}>

          {/* Banner — themed: uses surface vars for the base + accent-mix for the dot pattern/orb so it tracks the active theme */}
          <div style={{
            height: 140,
            background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 55%, var(--surface-overlay) 100%)",
            position: "relative", overflow: "hidden",
            borderTopLeftRadius: 16, borderTopRightRadius: 16,
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(color-mix(in srgb, var(--accent) 22%, transparent) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }} />
            <div style={{
              position: "absolute", top: -60, right: -40, width: 280, height: 280,
              background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
              background: "linear-gradient(180deg, transparent 0%, var(--surface) 100%)",
              pointerEvents: "none",
            }} />
          </div>

          {/* Avatar + action row — avatar has a clean surface-colored ring so the overlap looks intentional, not cropped */}
          <div className="builder-profile-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0 28px", gap: 16, flexWrap: "wrap" }}>
            {/* Avatar — half-overlaps banner. Ring is two box-shadows (outer = surface color match, inner = accent glow) */}
            <div style={{
              width: 112, height: 112, borderRadius: "50%",
              background: avatarColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 34, fontFamily: "Syne, sans-serif", fontWeight: 700, color: "white",
              marginTop: -56, flexShrink: 0, overflow: "hidden",
              boxShadow: "0 0 0 5px var(--surface), 0 0 0 6px color-mix(in srgb, var(--accent) 30%, transparent), 0 12px 28px rgba(0,0,0,0.45)",
              position: "relative",
              zIndex: 2,
            }}>
              {builder.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={builder.avatar_url} alt={builder.full_name || "avatar"} loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : getInitials(builder.full_name, builder.username)}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, paddingTop: 16, flexWrap: "wrap" }}>
              {connectStatus === "own_profile" ? (
                <Link href="/profile/edit" style={actionBtn}>Edit Profile</Link>
              ) : connectStatus === "incoming" ? (
                <Link
                  href="/connections"
                  style={{
                    ...actionBtnBase,
                    background: "color-mix(in srgb, var(--accent) 22%, transparent)",
                    borderColor: "color-mix(in srgb, var(--accent) 50%, transparent)",
                    color: "var(--accent-bright)",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px var(--accent-glow)",
                  }}
                >
                  Respond to request →
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={!canConnect}
                    aria-label={connectLabels[connectStatus]}
                    style={{
                      ...actionBtnBase,
                      padding: "9px 18px",
                      fontWeight: 700,
                      background:
                        connectStatus === "sent" || connectStatus === "already_connected"
                          ? "rgba(74,222,128,0.12)"
                          : connectStatus === "error"
                          ? "rgba(239,68,68,0.12)"
                          : "var(--gradient-brand)",
                      borderColor:
                        connectStatus === "sent" || connectStatus === "already_connected"
                          ? "rgba(74,222,128,0.35)"
                          : connectStatus === "error"
                          ? "rgba(239,68,68,0.35)"
                          : "color-mix(in srgb, var(--accent) 50%, transparent)",
                      color:
                        connectStatus === "sent" || connectStatus === "already_connected"
                          ? "var(--accent-green)"
                          : connectStatus === "error"
                          ? "#fca5a5"
                          : "#ffffff",
                      opacity: connectStatus === "sending" ? 0.75 : 1,
                      cursor: canConnect ? "pointer" : "default",
                      boxShadow: canConnect ? "0 4px 16px var(--accent-glow)" : "none",
                    }}
                  >
                    <span className="connect-label-desktop">{connectLabels[connectStatus]}</span>
                    <span className="connect-label-mobile">{connectLabelsMobile[connectStatus]}</span>
                  </button>
                  {connectStatus === "already_connected" && (
                    <Link href={`/messages?with=${builder.id}`} style={{ ...actionBtn, color: "var(--accent-bright)" }}>
                      💬 Message
                    </Link>
                  )}
                </>
              )}
              <button type="button" onClick={handleShare} style={{ ...actionBtnBase, background: "rgba(255,255,255,0.04)", borderColor: "var(--border)", color: "var(--text-muted)", cursor: "pointer" }}>
                {copied ? "Copied ✓" : "Share ↗"}
              </button>
            </div>
          </div>

          {/* Profile info */}
          <div className="builder-profile-info" style={{ padding: "18px 28px 28px" }}>
            <h1 style={{ fontSize: 22, fontFamily: "Syne, sans-serif", fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              {builder.full_name || builder.username || "Unnamed Builder"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: builder.bio ? 12 : 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
                @{builder.username || "no-username"}
              </span>
              {builder.university && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 13 }}>·</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{builder.university}</span>
                </>
              )}
            </div>

            {builder.bio && (
              <p style={{ fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 16, maxWidth: 720 }}>
                {builder.bio}
              </p>
            )}

            {connectError && <p style={{ color: "#fca5a5", fontSize: 12, marginBottom: 10 }}>{connectError}</p>}

            {/* Connection state banners */}
            {showSentToast && connectStatus === "sent" && (
              <div
                role="status"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(74,222,128,0.08)",
                  border: "1px solid rgba(74,222,128,0.28)",
                  borderRadius: 10, padding: "10px 14px",
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>✅</span>
                <span style={{ fontSize: 13, color: "#bbf7d0", flex: 1, lineHeight: 1.5 }}>
                  Connection request sent to <strong>{builderFirstName}</strong>. You&apos;ll get notified if they accept.
                </span>
                <button
                  type="button"
                  onClick={() => setShowSentToast(false)}
                  aria-label="Dismiss"
                  style={{
                    background: "transparent", border: "none", color: "#6ee7b7",
                    fontSize: 14, cursor: "pointer", padding: "2px 6px", fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            {connectStatus === "incoming" && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                  borderRadius: 10, padding: "10px 14px",
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>👋</span>
                <span style={{ fontSize: 13, color: "var(--accent-bright)", lineHeight: 1.5 }}>
                  <strong>{builderFirstName}</strong> sent you a connection request. Respond in <Link href="/connections" style={{ color: "var(--accent-bright)", fontWeight: 700 }}>your connections</Link>.
                </span>
              </div>
            )}
            {connectStatus === "idle" && myId && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />
                Not connected yet — send a request to unlock messaging and endorsements.
              </p>
            )}

            {/* Meta row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {builder.university && (
                <span style={metaItem}>🎓 {builder.university}</span>
              )}
              {builder.role && (
                <span style={metaItem}>💼 {builder.role}</span>
              )}
              {builder.github_url && (
                <a href={builder.github_url} target="_blank" rel="noreferrer" style={{ ...metaItem, color: "var(--accent-bright)", textDecoration: "none" }}>
                  ⌥ GitHub ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Two-column: main content + sidebar ── */}
        <div className="responsive-with-sidebar">
          {/* LEFT / MAIN COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Skills & Endorsements ── */}
        {skills.length > 0 && (
          <div style={{ ...card, marginBottom: 0 }}>
            <h2 style={sectionTitle}>Skills & Endorsements</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
              {skills.map((skill, idx) => {
                const skillEndorsers = endorsements[skill] ?? [];
                const count = skillEndorsers.length;
                const isFeatured = idx < 3;
                const hasEndorsed = myId ? skillEndorsers.some(e => e.endorser_id === myId) : false;
                const canEndorse = connectStatus === "already_connected" && myId && myId !== builder.id;

                return (
                  <div key={skill} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600, borderRadius: 8, padding: "5px 12px",
                      background: isFeatured ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${isFeatured ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "var(--border)"}`,
                      color: isFeatured ? "var(--accent-bright)" : "var(--text-muted)",
                    }}>
                      {skill}
                    </span>
                    {count > 0 && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>+{count}</span>
                    )}
                    {canEndorse && (
                      <button type="button" onClick={() => handleEndorse(skill)} disabled={endorsing === skill} className="endorse-btn" style={{
                        padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        background: hasEndorsed ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${hasEndorsed ? "color-mix(in srgb, var(--accent) 40%, transparent)" : "var(--border)"}`,
                        color: hasEndorsed ? "var(--accent-bright)" : "var(--text-muted)",
                        opacity: endorsing === skill ? 0.5 : 1,
                      }}>
                        {hasEndorsed ? "✓" : "+1"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {connectStatus !== "own_profile" && connectStatus !== "already_connected" && myId && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -4 }}>Connect with this builder to endorse their skills.</p>
            )}
          </div>
        )}

        {/* ── Projects (main column) ── */}
        {projects.length > 0 && (
          <div style={{ ...card, marginBottom: 0 }}>
            <h2 style={{ ...sectionTitle, marginBottom: 16 }}>Projects</h2>
            <div className="project-grid-profile">
              {projects.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  variant="profile"
                  ownerProfile={builder}
                  isOwner={myId === builder.id}
                  currentUserId={myId}
                  latestUpdateAt={latestUpdatesMap[proj.id] ?? null}
                />
              ))}
            </div>
          </div>
        )}

          </div>{/* /left column */}

          {/* RIGHT / SIDEBAR COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Stats — compact 2x2 for sidebar */}
            <div style={{ ...card, marginBottom: 0, padding: "18px 20px" }}>
              <h2 style={{ ...sectionTitle, marginBottom: 14, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>Stats</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Projects", value: projectsCount },
                  { label: "Connections", value: connectionsCount },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", flexDirection: "column",
                    padding: "10px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <span style={{ fontSize: 22, fontFamily: "Syne, sans-serif", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{value}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginTop: 4 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Open to Collaborate */}
            {isOpenToCollaborate && availability && (
              <div style={{
                background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>🟢</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#6ee7b7", marginBottom: 4, letterSpacing: "0.02em" }}>Open to collaborate</p>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>{availability}</p>
                </div>
              </div>
            )}

            {/* Share / secondary actions */}
            <div style={{ ...card, marginBottom: 0, padding: "16px 20px" }}>
              <h2 style={{ ...sectionTitle, marginBottom: 10, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>Quick actions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {builder.github_url && (
                  <a href={builder.github_url} target="_blank" rel="noreferrer" style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: 10, background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)", color: "var(--text-secondary)",
                    textDecoration: "none", fontSize: 13, fontWeight: 500,
                  }}>
                    <span>⌥</span> View GitHub ↗
                  </a>
                )}
                <button type="button" onClick={handleShare} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 10, background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)", color: "var(--text-secondary)",
                  cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "DM Sans, sans-serif",
                  textAlign: "left",
                }}>
                  <span>{copied ? "✓" : "↗"}</span> {copied ? "Link copied" : "Share profile"}
                </button>
              </div>
            </div>

          </div>{/* /right column */}
        </div>{/* /responsive-with-sidebar */}

      </div>
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--background)",
  color: "var(--text-primary)",
};

const card: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 24,
  marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 15, fontFamily: "Syne, sans-serif", fontWeight: 700,
  color: "var(--text-primary)", marginBottom: 16,
};

const metaItem: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  fontSize: 13, color: "var(--text-muted)", fontWeight: 500,
};

const actionBtnBase: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 9, border: "1px solid",
  fontSize: 13, fontWeight: 600, fontFamily: "DM Sans, sans-serif",
  transition: "all 0.15s ease", textDecoration: "none",
  display: "inline-flex", alignItems: "center",
};

const actionBtn: React.CSSProperties = {
  ...actionBtnBase,
  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
  borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
  color: "var(--accent-bright)",
  cursor: "pointer",
};
