"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import SkeletonLoader from "@/components/SkeletonLoader";
import { getInitials } from "@/utils/getInitials";
import { stageBadge } from "@/utils/stage";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
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

// Local row type — extends Project so it can be passed straight through
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
          .select("id, full_name, username, university, role, bio, skills, interests, github_url, linkedin_url, portfolio_url, avatar_url")
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
        <div className="page-pad-x" style={{ maxWidth: 760, margin: "0 auto", paddingTop: 110 }}>
          <SkeletonLoader count={3} columns="1fr" />
        </div>
      </main>
    );
  }

  if (notFound || !builder) {
    return (
      <main style={page}>
        <div className="page-pad-x" style={{ maxWidth: 760, margin: "0 auto", paddingTop: 110 }}>
          <div style={card}>
            <h1 className="font-serif" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 8 }}>
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
  const canConnect = connectStatus === "idle" || connectStatus === "error";
  const connectLabels: Record<ConnectStatus, string> = {
    idle: "Connect",
    sending: "Sending…",
    sent: "Request sent ✓",
    incoming: "Respond to request",
    already_connected: "Connected ✓",
    own_profile: "Edit profile",
    error: "Try again",
  };
  const builderFirstName = (builder.full_name || builder.username || "them").split(" ")[0];

  const shippedCount = projects.filter((p) => (p.stage ?? "").toLowerCase() === "launched").length;
  const endorsementsCount = Object.values(endorsements).reduce((acc, list) => acc + list.length, 0);

  // Skills with endorsement counts — endorsed skills first, then the rest.
  const skillsWithCounts = [
    ...skills,
    ...Object.keys(endorsements).filter((s) => !skills.includes(s)),
  ].map((skill) => ({ skill, count: endorsements[skill]?.length ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <main style={page}>
      <div className="page-pad-x" style={{ maxWidth: 760, margin: "0 auto", paddingTop: 110, paddingBottom: 96 }}>

        {/* Back */}
        <Link href="/builders" className="u-link" style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 40 }}>
          ← All builders
        </Link>

        {/* ── Header ── */}
        <Reveal>
          <header style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, minWidth: 0 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
                  background: "#F5F5F3", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 600, color: "var(--text-secondary)",
                  overflow: "hidden",
                }}>
                  {builder.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={builder.avatar_url} alt={builder.full_name || "avatar"} loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  ) : getInitials(builder.full_name, builder.username)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h1 className="font-serif" style={{
                    fontSize: "clamp(30px, 5vw, 42px)", fontWeight: 500,
                    color: "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.015em",
                    marginBottom: 6,
                  }}>
                    {builder.full_name || builder.username || "Unnamed Builder"}
                  </h1>
                  {builder.bio && (
                    <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8, maxWidth: 520 }}>
                      {builder.bio}
                    </p>
                  )}
                  <div className="label-caps">
                    {[builder.university, builder.role].filter(Boolean).join(" · ") || `@${builder.username}`}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {connectStatus === "own_profile" ? (
                  <Link href="/profile/edit" className="btn-secondary" style={{ fontSize: 13 }}>Edit profile</Link>
                ) : connectStatus === "incoming" ? (
                  <Link href="/connections" className="btn-secondary" style={{ fontSize: 13 }}>
                    Respond to request →
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={!canConnect}
                      aria-label={connectLabels[connectStatus]}
                      className="btn-secondary"
                      style={{
                        fontSize: 13,
                        opacity: connectStatus === "sending" ? 0.7 : 1,
                        cursor: canConnect ? "pointer" : "default",
                        color: connectStatus === "sent" || connectStatus === "already_connected"
                          ? "#0F6E56"
                          : connectStatus === "error" ? "#B91C1C" : "var(--text-primary)",
                      }}
                    >
                      {connectLabels[connectStatus]}
                    </button>
                    {connectStatus === "already_connected" && (
                      <Link href={`/messages?with=${builder.id}`} className="btn-secondary" style={{ fontSize: 13 }}>
                        Message
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Links */}
            {(builder.github_url || builder.linkedin_url || builder.portfolio_url) && (
              <div style={{ display: "flex", gap: 18, marginTop: 20, flexWrap: "wrap" }}>
                {builder.github_url && (
                  <a href={builder.github_url} target="_blank" rel="noreferrer" className="u-link" style={iconLink}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
                    GitHub
                  </a>
                )}
                {builder.linkedin_url && (
                  <a href={builder.linkedin_url} target="_blank" rel="noreferrer" className="u-link" style={iconLink}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.554V9h3.565v11.452z"/></svg>
                    LinkedIn
                  </a>
                )}
                {builder.portfolio_url && (
                  <a href={builder.portfolio_url} target="_blank" rel="noreferrer" className="u-link" style={iconLink}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    Portfolio
                  </a>
                )}
              </div>
            )}

            {/* Connection state notes */}
            {connectError && <p style={{ color: "#B91C1C", fontSize: 12, marginTop: 14 }}>{connectError}</p>}
            {showSentToast && connectStatus === "sent" && (
              <div
                role="status"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#ECFDF5",
                  border: "1px solid #D1FAE5",
                  borderRadius: 8, padding: "10px 14px",
                  marginTop: 16,
                }}
              >
                <span style={{ fontSize: 13, color: "#0F6E56", flex: 1, lineHeight: 1.5 }}>
                  Connection request sent to <strong>{builderFirstName}</strong>. You&apos;ll get notified if they accept.
                </span>
                <button
                  type="button"
                  onClick={() => setShowSentToast(false)}
                  aria-label="Dismiss"
                  style={{
                    background: "transparent", border: "none", color: "#0F6E56",
                    fontSize: 13, cursor: "pointer", padding: "2px 6px", fontWeight: 600,
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            {connectStatus === "incoming" && (
              <div
                style={{
                  background: "#F7F7F5",
                  border: "1px solid var(--border)",
                  borderRadius: 8, padding: "10px 14px",
                  marginTop: 16,
                }}
              >
                <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--text-primary)" }}>{builderFirstName}</strong> sent you a connection request. Respond in <Link href="/connections" className="u-link" style={{ color: "var(--text-primary)", fontWeight: 500 }}>your connections</Link>.
                </span>
              </div>
            )}
            {isOpenToCollaborate && availability && (
              <div className="label-caps" style={{ marginTop: 16, color: "#0F6E56" }}>
                {availability}
              </div>
            )}
          </header>
        </Reveal>

        {/* ── Stats row ── */}
        <Reveal delay={0.08}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 64 }}>
            {[
              { label: "Projects shipped", value: shippedCount },
              { label: "Endorsements received", value: endorsementsCount },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "#F7F7F5",
                borderRadius: 12,
                padding: "24px 24px",
              }}>
                <div className="font-serif" style={{ fontSize: 32, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
                <div className="label-caps" style={{ marginTop: 8 }}>{label}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── Selected work ── */}
        <section style={{ marginBottom: 64 }}>
          <Reveal>
            <div className="label-caps" style={{ marginBottom: 8 }}>Selected work</div>
          </Reveal>
          {projects.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)", padding: "20px 0", borderTop: "1px solid var(--border)" }}>
              Nothing shipped yet — {connectStatus === "own_profile" ? "add your first project to start your track record." : "this builder hasn't documented a project yet."}
            </p>
          ) : (
            <RevealGroup>
              {projects.map((proj, i) => {
                const stage = stageBadge(proj.stage);
                const year = proj.created_at ? new Date(proj.created_at).getFullYear() : "";
                return (
                  <RevealItem key={proj.id}>
                    <Link
                      href={`/projects/${proj.id}`}
                      className="work-row"
                      style={{
                        display: "flex", alignItems: "center", gap: 16,
                        padding: "20px 0",
                        borderTop: i === 0 ? "1px solid var(--border)" : "none",
                        borderBottom: "1px solid var(--border)",
                        textDecoration: "none",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span className="font-serif u-link work-row-title" style={{
                          fontSize: 19, fontWeight: 500, color: "var(--text-primary)",
                        }}>
                          {proj.title || "Untitled Project"}
                        </span>
                        {proj.tagline && (
                          <div style={{
                            fontSize: 13, color: "var(--text-secondary)", marginTop: 4,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {proj.tagline}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999,
                        color: stage.color, background: stage.bg, flexShrink: 0,
                      }}>
                        {stage.label}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>{year}</span>
                    </Link>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          )}
          {projectsCount > projects.length && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
              Showing {projects.length} of {projectsCount} projects
            </p>
          )}
        </section>

        {/* ── Endorsed skills ── */}
        {skillsWithCounts.length > 0 && (
          <section style={{ marginBottom: 64 }}>
            <Reveal>
              <div className="label-caps" style={{ marginBottom: 16 }}>Endorsed skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skillsWithCounts.map(({ skill, count }) => {
                  const hasEndorsed = myId ? (endorsements[skill] ?? []).some(e => e.endorser_id === myId) : false;
                  const canEndorse = connectStatus === "already_connected" && myId && myId !== builder.id;
                  return (
                    <span key={skill} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span style={{
                        fontSize: 13, fontWeight: 400, borderRadius: 999, padding: "5px 14px",
                        background: "#F5F5F3",
                        color: "var(--text-secondary)",
                      }}>
                        {skill}{count > 0 ? ` (${count})` : ""}
                      </span>
                      {canEndorse && (
                        <button
                          type="button"
                          onClick={() => handleEndorse(skill)}
                          disabled={endorsing === skill}
                          className="endorse-btn"
                          title={hasEndorsed ? "Remove endorsement" : `Endorse ${skill}`}
                          style={{
                            padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 500, cursor: "pointer",
                            background: hasEndorsed ? "#ECFDF5" : "transparent",
                            border: `1px solid ${hasEndorsed ? "#D1FAE5" : "var(--border)"}`,
                            color: hasEndorsed ? "#0F6E56" : "var(--text-muted)",
                            opacity: endorsing === skill ? 0.5 : 1,
                          }}
                        >
                          {hasEndorsed ? "✓" : "+1"}
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              {connectStatus !== "own_profile" && connectStatus !== "already_connected" && myId && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
                  Connect with {builderFirstName} to endorse their skills.
                </p>
              )}
            </Reveal>
          </section>
        )}

        {/* ── Share profile ── */}
        <Reveal>
          <button
            type="button"
            onClick={handleShare}
            className="btn-secondary"
            style={{ width: "100%", justifyContent: "center", padding: "14px 20px", fontSize: 14 }}
          >
            {copied ? "Link copied ✓" : "Share profile"}
          </button>
        </Reveal>

      </div>

      {/* Copied toast */}
      {copied && (
        <div
          role="status"
          style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: "#1A1A18", color: "#FFFFFF",
            fontSize: 13, fontWeight: 500,
            padding: "10px 18px", borderRadius: 8,
            zIndex: 300,
            animation: "slide-down 0.18s ease forwards",
          }}
        >
          Profile link copied to clipboard
        </div>
      )}

      <style>{`
        .work-row:hover .work-row-title { background-size: 100% 1px; }
      `}</style>
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
  background: "#FFFFFF",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 28,
  marginBottom: 16,
};

const iconLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: "var(--text-secondary)",
  fontWeight: 400,
};
