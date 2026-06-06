"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import SkeletonLoader from "@/components/SkeletonLoader";
import ProjectCard from "@/components/cards/ProjectCard";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile, Project, Connection, Notification, Application } from "@/types";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgoShort(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / (86400 * 30))}mo ago`;
}

function getDayGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function getStageEmoji(stage: string | null): string {
  switch (stage) {
    case "idea": return "💡";
    case "mvp": return "🚀";
    case "building": return "🔨";
    case "launched": return "✅";
    default: return "🔧";
  }
}

function getStageLabel(stage: string | null): string {
  switch (stage) {
    case "idea": return "Idea";
    case "mvp": return "MVP";
    case "building": return "Building";
    case "launched": return "Launched";
    default: return "Unknown";
  }
}

function getStageBadgeStyle(stage: string | null): React.CSSProperties {
  switch (stage) {
    case "idea":
      return { background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" };
    case "mvp":
      return { background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)" };
    case "building":
      return { background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" };
    case "launched":
      return { background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" };
    default:
      return { background: "rgba(139,154,176,0.1)", color: "#8b9ab0", border: "1px solid rgba(139,154,176,0.2)" };
  }
}

function getInitials(profile: Profile | undefined): string {
  if (profile?.full_name) return profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  if (profile?.username) return profile.username.slice(0, 2).toUpperCase();
  return "??";
}

function getAvatarColor(id: string): string {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  return colors[id.charCodeAt(0) % colors.length];
}

function calcProfileCompletion(profile: Profile | null): number {
  if (!profile) return 0;
  const fields = [profile.full_name, profile.university, profile.role, profile.bio, profile.skills, profile.github_url];
  return Math.round((fields.filter(f => f && f.trim() !== "").length / fields.length) * 100);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<Connection[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Connection[]>([]);
  const [requestProfiles, setRequestProfiles] = useState<Record<string, Profile>>({});
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [latestUpdatesMap, setLatestUpdatesMap] = useState<Record<string, string>>({});
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [notifications, setNotifications] = useState<(Notification & { fromProfile?: Profile })[]>([]);

  interface ApplicationWithProfile extends Application {
    applicantProfile?: Profile;
    projectTitle?: string;
  }
  interface MatchedProject extends Project {
    matchPct: number;
    matchReason: string;
  }
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([]);
  const [matchedProjects, setMatchedProjects] = useState<MatchedProject[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?next=/dashboard");
      return;
    }

    let mounted = true;
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && mounted) router.replace("/login");
    });

    const loadDashboard = async () => {
      if (!mounted) return;
      setLoading(true);
      setError("");
      try {
        const [profileResult, incomingResult, outgoingResult, projectsResult, connCountResult] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("id, full_name, username, university, role, bio, skills, interests, github_url")
              .eq("id", user.id)
              .maybeSingle(),

            supabase
              .from("connections")
              .select("id, sender_id, receiver_id, status, created_at")
              .eq("receiver_id", user.id)
              .eq("status", "pending")
              .order("created_at", { ascending: false }),

            supabase
              .from("connections")
              .select("id, sender_id, receiver_id, status, created_at")
              .eq("sender_id", user.id)
              .eq("status", "pending")
              .order("created_at", { ascending: false }),

            supabase
              .from("projects")
              .select("id, owner_id, title, tagline, looking_for, stage, description, category, tech_stack, created_at")
              .eq("owner_id", user.id)
              .order("created_at", { ascending: false }),

            supabase
              .from("connections")
              .select("id", { count: "exact", head: true })
              .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
              .eq("status", "accepted"),
          ]);

        if (profileResult.error) {
          setError(`Profile error: ${profileResult.error.message}`);
        } else if (!profileResult.data) {
          const baseUsername = (user.email?.split("@")[0] ?? "user")
            .toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);
          await supabase.from("profiles").insert({
            id: user.id,
            full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
            username: baseUsername,
          });
          const { data: created } = await supabase
            .from("profiles")
            .select("id, full_name, username, university, role, bio, skills, interests, github_url")
            .eq("id", user.id)
            .maybeSingle();
          setProfile(created as Profile | null);
          // New user — show onboarding unless already seen
          if (typeof window !== "undefined" && !localStorage.getItem("onboarding_seen")) {
            if (mounted) router.replace("/onboarding");
            return;
          }
        } else {
          const pd = profileResult.data as Profile;
          // Existing user with no university — show onboarding once
          if (!pd.university && typeof window !== "undefined" && !localStorage.getItem("onboarding_seen")) {
            if (mounted) router.replace("/onboarding");
            return;
          }
          setProfile(pd);
        }

        const incoming = (incomingResult.data ?? []) as Connection[];
        const outgoing = (outgoingResult.data ?? []) as Connection[];
        setIncomingRequests(incoming);
        setOutgoingRequests(outgoing);
        setConnectionsCount(connCountResult.count ?? 0);

        if (projectsResult.error) {
          setError(`Projects error: ${projectsResult.error.message}`);
        } else {
          const loadedProjects = (projectsResult.data ?? []) as Project[];
          setMyProjects(loadedProjects);
          if (loadedProjects.length > 0) {
            const pids = loadedProjects.map((p) => p.id);
            supabase
              .from("project_updates")
              .select("project_id, created_at")
              .in("project_id", pids)
              .order("created_at", { ascending: false })
              .then(({ data }) => {
                if (data) {
                  const m: Record<string, string> = {};
                  (data as { project_id: string; created_at: string }[]).forEach((u) => {
                    if (!m[u.project_id]) m[u.project_id] = u.created_at;
                  });
                  setLatestUpdatesMap(m);
                }
              });
          }
        }

        const profileIds = [...new Set([
          ...incoming.map((r) => r.sender_id),
          ...outgoing.map((r) => r.receiver_id),
        ])];

        if (profileIds.length > 0) {
          const { data: relatedProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, username, university, role, bio, skills, interests, github_url")
            .in("id", profileIds);

          if (relatedProfiles) {
            const mapped: Record<string, Profile> = {};
            relatedProfiles.forEach((p: Profile) => { if (p.id) mapped[p.id] = p; });
            setRequestProfiles(mapped);
          }
        }

        // Load notifications
        const { data: notifData } = await supabase
          .from("notifications")
          .select("id, user_id, type, from_user_id, entity_id, read, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (notifData && notifData.length > 0) {
          const fromIds = [...new Set(
            (notifData as Notification[])
              .map((n) => n.from_user_id)
              .filter(Boolean) as string[]
          )];
          let fromProfileMap: Record<string, Profile> = {};
          if (fromIds.length > 0) {
            const { data: fromProfiles } = await supabase
              .from("profiles")
              .select("id, full_name, username, university, role, bio, skills, interests, github_url, avatar_url")
              .in("id", fromIds);
            (fromProfiles ?? []).forEach((p: Profile) => { fromProfileMap[p.id] = p; });
          }
          setNotifications(
            (notifData as Notification[]).map((n) => ({
              ...n,
              fromProfile: n.from_user_id ? fromProfileMap[n.from_user_id] : undefined,
            }))
          );
        }
        // Load applications to user's projects
        const projects = (projectsResult.data ?? []) as Project[];
        if (projects.length > 0) {
          const projectIds = projects.map((p) => p.id);
          const { data: appData } = await supabase
            .from("applications")
            .select("id, project_id, applicant_id, role, message, status, created_at")
            .in("project_id", projectIds)
            .order("created_at", { ascending: false });

          if (appData && appData.length > 0) {
            const appList = appData as Application[];
            const applicantIds = [...new Set(appList.map((a) => a.applicant_id))];
            const { data: applicantProfiles } = await supabase
              .from("profiles")
              .select("id, full_name, username, university, role, bio, skills, interests, github_url, avatar_url")
              .in("id", applicantIds);
            const profMap: Record<string, Profile> = {};
            (applicantProfiles ?? []).forEach((p: Profile) => { profMap[p.id] = p; });
            const projectTitleMap: Record<string, string> = {};
            projects.forEach((p) => { projectTitleMap[p.id] = p.title ?? "Untitled Project"; });

            setApplications(appList.map((a) => ({
              ...a,
              applicantProfile: profMap[a.applicant_id],
              projectTitle: projectTitleMap[a.project_id],
            })));
          }
        }

        // AI-powered project matching
        const userProfile = profileResult.data as Profile | null;
        if (userProfile) {
          const userSkills = (userProfile.skills ?? "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
          const userInterests = (userProfile.interests ?? "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
          const userKeywords = [...new Set([...userSkills, ...userInterests])];

          if (userKeywords.length > 0) {
            const { data: allProjects } = await supabase
              .from("projects")
              .select("id, owner_id, title, tagline, description, category, stage, looking_for, tech_stack, created_at")
              .neq("owner_id", user.id)
              .order("created_at", { ascending: false })
              .limit(50);

            if (allProjects && allProjects.length > 0) {
              const scored = (allProjects as Project[]).map((proj) => {
                const projText = [
                  proj.looking_for ?? "",
                  proj.category ?? "",
                  proj.tech_stack ?? "",
                  proj.tagline ?? "",
                ].join(" ").toLowerCase();

                const projKeywords = projText.split(/[\s,]+/).map((s) => s.trim()).filter((s) => s.length > 2);
                const matchedSkills: string[] = [];

                userKeywords.forEach((kw) => {
                  if (projText.includes(kw) || projKeywords.some((pk) => pk.includes(kw) || kw.includes(pk))) {
                    matchedSkills.push(kw);
                  }
                });

                const matchPct = Math.min(100, Math.round((matchedSkills.length / Math.max(userKeywords.length, 1)) * 100));
                const reason = matchedSkills.length > 0
                  ? `Your ${matchedSkills.slice(0, 2).join(" & ")} skills match this project`
                  : "";

                return { ...proj, matchPct, matchReason: reason };
              });

              const topMatches = scored
                .filter((p) => p.matchPct >= 20)
                .sort((a, b) => b.matchPct - a.matchPct)
                .slice(0, 3);

              setMatchedProjects(topMatches as MatchedProject[]);
            }
          }
        }

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unexpected error loading dashboard.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleAccept = async (connectionId: string) => {
    if (actionLoadingId) return;
    setActionError("");
    setActionLoadingId(connectionId);
    const supabase = createClient();
    try {
      const req = incomingRequests.find((r) => r.id === connectionId);
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);

      if (error) {
        setActionError(`Could not accept request: ${error.message}`);
        return;
      }
      setIncomingRequests((prev) => prev.filter((r) => r.id !== connectionId));
      setConnectionsCount((prev) => prev + 1);

      if (req && profile) {
        await supabase.from("notifications").insert({
          user_id: req.sender_id,
          type: "connection_accepted",
          from_user_id: profile.id,
          entity_id: connectionId,
        });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (connectionId: string) => {
    if (actionLoadingId) return;
    setActionError("");
    setActionLoadingId(connectionId + "_reject");
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: "rejected" })
        .eq("id", connectionId);

      if (error) {
        setActionError(`Could not reject request: ${error.message}`);
        return;
      }
      setIncomingRequests((prev) => prev.filter((r) => r.id !== connectionId));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptApp = async (appId: string) => {
    if (actionLoadingId) return;
    setActionError("");
    setActionLoadingId(appId);
    const supabase = createClient();
    try {
      const app = applications.find((a) => a.id === appId);
      const { error } = await supabase
        .from("applications")
        .update({ status: "accepted" })
        .eq("id", appId);
      if (error) { setActionError(error.message); return; }
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: "accepted" } : a));
      if (app) {
        await supabase.from("notifications").insert({
          user_id: app.applicant_id,
          type: "application_accepted" as const,
          from_user_id: profile?.id ?? null,
          entity_id: app.project_id,
        });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectApp = async (appId: string) => {
    if (actionLoadingId) return;
    setActionError("");
    setActionLoadingId(appId + "_reject");
    const supabase = createClient();
    try {
      const app = applications.find((a) => a.id === appId);
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", appId);
      if (error) { setActionError(error.message); return; }
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: "rejected" } : a));
      if (app) {
        await supabase.from("notifications").insert({
          user_id: app.applicant_id,
          type: "application_rejected" as const,
          from_user_id: profile?.id ?? null,
          entity_id: app.project_id,
        });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <main style={pageStyle}>
        <div className="page-grid-bg" />
        <div className="page-radial-glow" />
        <div className="page-z" style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 80 }}>
          <SkeletonLoader count={4} columns="repeat(auto-fit, minmax(280px, 1fr))" />
        </div>
      </main>
    );
  }

  const firstName = profile?.full_name?.split(" ")?.[0] ?? profile?.username ?? "there";
  const profileCompletion = calcProfileCompletion(profile);

  // "Get started" checklist state — all inputs derived from data already fetched.
  const checklistItems = [
    {
      label: "Complete your profile",
      hint: "Add your bio, skills, and links so builders can find you.",
      done: profileCompletion >= 60,
      href: "/profile/edit",
    },
    {
      label: "Post a project or browse builders",
      hint: "Share an idea to find collaborators, or explore who's around.",
      done: myProjects.length > 0 || outgoingRequests.length > 0,
      href: myProjects.length > 0 ? "/builders" : "/projects/new",
    },
    {
      label: "Send your first connection request",
      hint: "Find a builder whose skills match and say hi.",
      done: outgoingRequests.length > 0 || connectionsCount > 0,
      href: "/builders",
    },
  ];
  const showChecklist = profile !== null && checklistItems.some(i => !i.done);

  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />
      <div className="page-z page-pad-x" style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 80 }}>

        {/* ── Header — smart CTA reflects the user's most likely next action ── */}
        {(() => {
          // Priority: pending requests → no projects → default to discover.
          // Returning a tuple so the header reads cleanly below.
          const smartCta = incomingRequests.length > 0
            ? { href: "/connections", label: `Review ${incomingRequests.length} ${incomingRequests.length === 1 ? "request" : "requests"} →` }
            : myProjects.length === 0
              ? { href: "/projects/new", label: "Post your first project →" }
              : { href: "/builders", label: "Browse builders →" };
          return (
            <div className="animate-fade-up" style={headerStyle}>
              <div>
                <h1 style={headingStyle}>{getDayGreeting()}, {firstName}</h1>
                <p style={subtitleStyle}>Here&apos;s what&apos;s happening with your projects today.</p>
              </div>
              <Link href={smartCta.href} className="btn-primary">{smartCta.label}</Link>
            </div>
          );
        })()}

        {error && <p style={errorBannerStyle}>{error}</p>}
        {actionError && <p style={errorBannerStyle}>{actionError}</p>}

        {/* ── Stats row — 3 numbers; "Profile views" removed (always 0) ── */}
        <div className="animate-fade-up animate-delay-1 responsive-stats-row-3" style={statsRowStyle}>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Projects</div>
            <div style={statNumStyle}>{myProjects.length}</div>
            <div style={statSubStyle}>total created</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Connections</div>
            <div style={{ ...statNumStyle, color: "#4ade80" }}>{connectionsCount}</div>
            <div style={statSubStyle}>active connections</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Pending requests</div>
            <div style={{ ...statNumStyle, color: incomingRequests.length > 0 ? "#fbbf24" : "white" }}>
              {incomingRequests.length}
            </div>
            <div style={statSubStyle}>awaiting response</div>
          </div>
        </div>

        {/* ── Get started checklist (new users only) ── */}
        {showChecklist && (
          <div className="animate-fade-up animate-delay-2" style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={cardHeaderStyle}>
              <h2 style={cardTitleStyle}>Get started</h2>
              <span style={{ fontSize: 12, color: "#4a5568" }}>
                {checklistItems.filter(i => i.done).length} of {checklistItems.length} complete
              </span>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {checklistItems.map((item) => (
                <div key={item.label} style={checklistRowStyle}>
                  <div style={{ ...checklistIconStyle, ...(item.done ? checklistIconDoneStyle : checklistIconPendingStyle) }}>
                    {item.done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: item.done ? "#4a5568" : "#f0f4f8",
                      textDecoration: item.done ? "line-through" : "none",
                    }}>
                      {item.label}
                    </div>
                    {!item.done && (
                      <div style={{ fontSize: 12, color: "#4a5568", marginTop: 2 }}>{item.hint}</div>
                    )}
                  </div>
                  {!item.done && (
                    <Link href={item.href} style={cardLinkStyle}>Go →</Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Main 2-column layout ── */}
        <div className="animate-fade-up animate-delay-3 responsive-with-sidebar" style={mainLayoutStyle}>

          {/* Left column */}
          <div style={leftColStyle}>

            {/* Your projects */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h2 style={sectionLabelStyle}>YOUR PROJECTS</h2>
                <Link href="/projects" style={cardLinkStyle}>View all</Link>
              </div>

              {myProjects.length === 0 ? (
                <div style={emptyStateStyle}>
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 16, opacity: 0.85 }}>
                    <circle cx="40" cy="40" r="38" fill="rgba(234,179,8,0.06)" stroke="rgba(234,179,8,0.18)" strokeWidth="1.5" strokeDasharray="6 3" />
                    <path d="M40 18C32.3 18 26 24.3 26 32c0 5.2 2.8 9.7 7 12.2V48c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3.8c4.2-2.5 7-7 7-12.2 0-7.7-6.3-14-14-14z" fill="rgba(234,179,8,0.15)" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M33 54h14M35 58h10" stroke="rgba(234,179,8,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M37 32l2 2 4-4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 6 }}>Share your first idea</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>Post a project and find collaborators.</p>
                  <Link href="/projects/new" className="btn-primary">+ Create project</Link>
                </div>
              ) : (
                <div className="project-grid-dashboard">
                  {myProjects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      variant="dashboard"
                      ownerProfile={profile}
                      isOwner
                      latestUpdateAt={latestUpdatesMap[p.id] ?? null}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* AI-Powered Project Matching */}
            {matchedProjects.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <h2 style={sectionLabelStyle}>MATCHED FOR YOU</h2>
                  <Link href="/projects" style={cardLinkStyle}>Browse all</Link>
                </div>
                <div className="project-grid-dashboard">
                  {matchedProjects.map((proj) => (
                    <ProjectCard
                      key={proj.id}
                      project={proj}
                      variant="dashboard"
                      currentUserId={user?.id ?? null}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Applications to your projects */}
            {applications.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <h2 style={sectionLabelStyle}>APPLICATIONS</h2>
                  <span style={badgeCountStyle}>{applications.filter((a) => a.status === "pending").length || applications.length}</span>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {applications.map((app) => {
                    const p = app.applicantProfile;
                    return (
                      <div key={app.id} style={{ ...requestRowStyle, flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ ...avatarStyle, background: p ? getAvatarColor(p.id) : "#6366f1" }}>
                            {getInitials(p)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={requestNameStyle}>{p?.full_name || p?.username || "Unknown"}</div>
                            <div style={requestUniStyle}>
                              {app.role && <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{app.role}</span>}
                              {app.role && (p?.university || p?.role) && " · "}
                              {p?.university || p?.role}
                            </div>
                          </div>
                          {/* Status badge */}
                          {app.status === "accepted" && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 20, padding: "3px 9px" }}>Accepted</span>
                          )}
                          {app.status === "rejected" && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 20, padding: "3px 9px" }}>Rejected</span>
                          )}
                        </div>

                        {app.message && (
                          <p style={{ fontSize: 13, color: "#8b9ab0", lineHeight: 1.6, margin: "0 0 0 54px", fontStyle: "italic" }}>
                            &ldquo;{app.message.length > 120 ? app.message.slice(0, 120) + "…" : app.message}&rdquo;
                          </p>
                        )}

                        {app.projectTitle && (
                          <div style={{ fontSize: 11, color: "#4a5568", marginLeft: 54 }}>
                            Project: <span style={{ color: "#6b7280" }}>{app.projectTitle}</span>
                          </div>
                        )}

                        {app.status === "pending" && (
                          <div style={{ display: "flex", gap: 8, marginLeft: 54 }}>
                            <button type="button" disabled={!!actionLoadingId} style={{ ...acceptBtnStyle, opacity: actionLoadingId === app.id ? 0.6 : 1 }} onClick={() => handleAcceptApp(app.id)}>{actionLoadingId === app.id ? "…" : "Accept"}</button>
                            <button type="button" disabled={!!actionLoadingId} style={{ ...declineBtnStyle, opacity: actionLoadingId === app.id + "_reject" ? 0.6 : 1 }} onClick={() => handleRejectApp(app.id)}>{actionLoadingId === app.id + "_reject" ? "…" : "Reject"}</button>
                            {p?.username && (
                              <Link href={`/builders/${p.username}`} style={{ ...declineBtnStyle, background: "transparent", color: "#6b7280", border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none" }}>
                                View profile
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Right column */}
          <div style={rightColStyle}>

            {/* Profile completion */}
            <div style={cardStyle}>
              <h2 style={{ ...cardTitleStyle, marginBottom: 16 }}>Profile completion</h2>
              <div style={completionBarBgStyle}>
                <div style={{ ...completionBarFillStyle, width: `${profileCompletion}%` }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 14 }}>
                <span style={{ color: "#4ade80", fontWeight: 600 }}>{profileCompletion}%</span>
                <span style={{ color: "#4a5568" }}> complete</span>
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                {([
                  ["Full name", profile?.full_name],
                  ["University", profile?.university],
                  ["Role", profile?.role],
                  ["Bio", profile?.bio],
                  ["Skills", profile?.skills],
                  ["GitHub URL", profile?.github_url],
                ] as [string, string | null | undefined][]).map(([label, val]) => (
                  <div key={label} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: val ? "#4ade80" : "#4a5568" }}>{val ? "✓" : "○"}</span>
                    <span style={{ color: val ? "#d7deea" : "#4a5568", fontSize: 13 }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <Link href="/profile/edit" className="btn-primary" style={{ display: "block", textAlign: "center" }}>
                  Complete Profile
                </Link>
              </div>
            </div>

            {/* Quick actions */}
            <div style={cardStyle}>
              <h2 style={{ ...cardTitleStyle, marginBottom: 16 }}>Quick actions</h2>
              <div style={quickActionsGridStyle}>
                <Link href="/builders" style={quickActionStyle}>
                  <span style={{ fontSize: 20 }}>🔍</span>
                  <span style={quickActionLabelStyle}>Find builders</span>
                </Link>
                <Link href="/projects" style={quickActionStyle}>
                  <span style={{ fontSize: 20 }}>💡</span>
                  <span style={quickActionLabelStyle}>Browse ideas</span>
                </Link>
                <Link href="/profile/edit" style={quickActionStyle}>
                  <span style={{ fontSize: 20 }}>✏️</span>
                  <span style={quickActionLabelStyle}>Edit profile</span>
                </Link>
                <Link href="/connections" style={quickActionStyle}>
                  <span style={{ fontSize: 20 }}>🤝</span>
                  <span style={quickActionLabelStyle}>Connections</span>
                </Link>
              </div>
            </div>

            {/* Activity — merges pending connection requests (with inline
                Accept/Decline) at the top, then a divider, then chronological
                notifications below. */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={sectionLabelStyle}>ACTIVITY</h2>
                {incomingRequests.length > 0 && (
                  <span style={badgeCountStyle}>{incomingRequests.length}</span>
                )}
              </div>

              {/* Pending connection requests */}
              {incomingRequests.length > 0 && (
                <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                  {incomingRequests.map((request) => {
                    const sender = requestProfiles[request.sender_id];
                    return (
                      <div key={request.id} style={{ ...requestRowStyle, flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ ...avatarStyle, background: getAvatarColor(request.sender_id) }}>
                            {getInitials(sender)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={requestNameStyle}>
                              {sender?.full_name || sender?.username || "Unknown Builder"}
                            </div>
                            <div style={requestUniStyle}>
                              {sender?.university || sender?.role || "Builder"}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            style={{ ...acceptBtnStyle, flex: 1, opacity: actionLoadingId === request.id ? 0.6 : 1 }}
                            disabled={!!actionLoadingId}
                            onClick={() => handleAccept(request.id)}
                          >
                            {actionLoadingId === request.id ? "…" : "Accept"}
                          </button>
                          <button
                            type="button"
                            style={{ ...declineBtnStyle, flex: 1, opacity: actionLoadingId === request.id + "_reject" ? 0.6 : 1 }}
                            disabled={!!actionLoadingId}
                            onClick={() => handleReject(request.id)}
                          >
                            {actionLoadingId === request.id + "_reject" ? "…" : "Decline"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Divider — only when both requests AND notifications exist */}
              {incomingRequests.length > 0 && notifications.length > 0 && (
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0 8px" }} />
              )}

              {/* Notifications */}
              {incomingRequests.length === 0 && notifications.length === 0 ? (
                <p style={{ color: "#4a5568", fontSize: 14 }}>No activity yet. Connect with builders to get started.</p>
              ) : notifications.length === 0 ? null : (
                <div style={{ display: "grid", gap: 0 }}>
                  {notifications.map((n, idx) => {
                    const fromName = n.fromProfile?.full_name || n.fromProfile?.username || "Someone";
                    const isLast = idx === notifications.length - 1;
                    let icon = "🔔";
                    let text: React.ReactNode = null;
                    let actionBtn: React.ReactNode = null;
                    let dotColor = "#6366f1";

                    if (n.type === "connection_request") {
                      icon = "🤝";
                      dotColor = "#fbbf24";
                      text = <><strong style={{ color: "#f0f4f8" }}>{fromName}</strong> sent you a connection request</>;
                      actionBtn = <Link href="/connections" style={notifActionStyle}>Review</Link>;
                    } else if (n.type === "connection_accepted") {
                      icon = "✅";
                      dotColor = "#4ade80";
                      text = <><strong style={{ color: "#f0f4f8" }}>{fromName}</strong> accepted your connection request</>;
                      actionBtn = n.fromProfile?.username
                        ? <Link href={`/builders/${n.fromProfile.username}`} style={notifActionStyle}>View</Link>
                        : null;
                    } else if (n.type === "project_liked") {
                      icon = "❤️";
                      dotColor = "#ec4899";
                      text = <><strong style={{ color: "#f0f4f8" }}>{fromName}</strong> liked your project</>;
                    } else if (n.type === "profile_viewed") {
                      icon = "👁️";
                      dotColor = "#3b82f6";
                      text = <><strong style={{ color: "#f0f4f8" }}>{fromName}</strong> viewed your profile</>;
                    } else if (n.type === "application_received") {
                      icon = "📋";
                      dotColor = "#8b5cf6";
                      text = <><strong style={{ color: "#f0f4f8" }}>{fromName}</strong> applied to join your project</>;
                      actionBtn = <Link href="/dashboard" style={notifActionStyle}>Review</Link>;
                    } else if (n.type === "application_accepted") {
                      icon = "🎉";
                      dotColor = "#4ade80";
                      text = <>Your application was <strong style={{ color: "#4ade80" }}>accepted</strong> by {fromName}</>;
                    } else if (n.type === "application_rejected") {
                      icon = "😞";
                      dotColor = "#f87171";
                      text = <>Your application was not accepted by <strong style={{ color: "#f0f4f8" }}>{fromName}</strong></>;
                    }

                    return (
                      <div key={n.id} style={{
                        display: "flex",
                        gap: 12,
                        padding: "12px 0",
                        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
                        alignItems: "flex-start",
                      }}>
                        {/* Icon + timeline line */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flexShrink: 0 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: `${dotColor}20`,
                            border: `1px solid ${dotColor}40`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                          }}>
                            {icon}
                          </div>
                          {!isLast && (
                            <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.05)", minHeight: 8, marginTop: 4 }} />
                          )}
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                          <p style={{ fontSize: 13, color: "#8b9ab0", lineHeight: 1.5, marginBottom: 4 }}>{text}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 11, color: "#4a5568" }}>{timeAgoShort(n.created_at)}</span>
                            {!n.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />}
                            {actionBtn}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--background)",
  color: "var(--text-primary)",
  paddingBottom: 60,
  position: "relative",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: 32,
  flexWrap: "wrap",
  gap: 16,
};

const headingStyle: React.CSSProperties = {
  fontSize: "clamp(24px, 3.5vw, 36px)",
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  color: "var(--text-primary)",
  letterSpacing: "-0.02em",
  marginBottom: 6,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 15,
  color: "var(--text-secondary)",
};

const errorBannerStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  marginBottom: 16,
  background: "rgba(239,68,68,0.1)",
  border: "1px solid rgba(239,68,68,0.3)",
  color: "#fca5a5",
  fontSize: 13,
};

// Grid columns are driven by the `.responsive-stats-row` class (4→2→1
// across breakpoints). Keep spacing/margin here.
const statsRowStyle: React.CSSProperties = {
  marginBottom: 28,
};

const statCardStyle: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "20px 24px",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-secondary)",
  marginBottom: 8,
  fontWeight: 500,
};

const statNumStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "var(--text-primary)",
  lineHeight: 1,
  marginBottom: 4,
};

const statSubStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
};

// Grid columns are driven by the `.responsive-with-sidebar` class
// (1fr 320px on desktop, stack below 960px). Keep spacing here.
const mainLayoutStyle: React.CSSProperties = {};

const leftColStyle: React.CSSProperties = {
  display: "grid",
  // Wider gap between main sections — section labels do the rest.
  gap: 32,
};

const rightColStyle: React.CSSProperties = {
  display: "grid",
  gap: 20,
};

// Small uppercase label used as the section heading inside dashboard cards
// (YOUR PROJECTS / MATCHED FOR YOU / APPLICATIONS / ACTIVITY).
const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: "DM Sans, sans-serif",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  margin: 0,
};

const cardStyle: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 24,
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 18,
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 17,
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  color: "var(--text-primary)",
};

const cardLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--accent-bright)",
  textDecoration: "none",
  fontWeight: 500,
};

const badgeCountStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "#fbbf24",
  color: "#0d1117",
  fontSize: 12,
  fontWeight: 700,
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "24px 0",
};

const checklistRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.05)",
  background: "rgba(255,255,255,0.02)",
};

const checklistIconStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const checklistIconPendingStyle: React.CSSProperties = {
  border: "1.5px solid rgba(255,255,255,0.15)",
  background: "transparent",
};

const checklistIconDoneStyle: React.CSSProperties = {
  background: "rgba(74,222,128,0.15)",
  border: "1.5px solid rgba(74,222,128,0.45)",
  color: "#4ade80",
};

const projectRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "13px 14px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.05)",
  textDecoration: "none",
  cursor: "pointer",
};

const projectEmojiStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  borderRadius: 10,
  background: "rgba(255,255,255,0.04)",
  flexShrink: 0,
};

const projectNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  color: "var(--text-primary)",
  marginBottom: 3,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const projectLookingStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-secondary)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const stageBadgeBase: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  flexShrink: 0,
};

const requestRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "13px 14px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.05)",
  flexWrap: "wrap",
};

const avatarStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 700,
  color: "white",
  flexShrink: 0,
};

const requestNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  color: "var(--text-primary)",
  marginBottom: 2,
};

const requestUniStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-secondary)",
};

const requestActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginLeft: "auto",
};

const acceptBtnStyle: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid rgba(34,197,94,0.3)",
  background: "rgba(34,197,94,0.15)",
  color: "#4ade80",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const declineBtnStyle: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid rgba(239,68,68,0.25)",
  background: "rgba(239,68,68,0.1)",
  color: "#f87171",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const completionBarBgStyle: React.CSSProperties = {
  width: "100%",
  height: 8,
  borderRadius: 4,
  background: "rgba(255,255,255,0.07)",
  overflow: "hidden",
};

const completionBarFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 4,
  background: "linear-gradient(90deg, #3b82f6, #4ade80)",
  transition: "width 0.5s ease",
};

const quickActionsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const quickActionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "16px 12px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
  textDecoration: "none",
  cursor: "pointer",
};

const quickActionLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-secondary)",
  textAlign: "center",
};


const notifActionStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--accent-bright)",
  textDecoration: "none",
  padding: "2px 8px",
  borderRadius: 6,
  background: "color-mix(in srgb, var(--accent) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
};
