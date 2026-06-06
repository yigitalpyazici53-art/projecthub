"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getInitials } from "@/utils/getInitials";
import SkeletonLoader from "@/components/SkeletonLoader";
import type { Project, ProjectUpdate } from "@/types";

interface OwnerProfile {
  username: string | null;
  full_name: string | null;
  university: string | null;
  role: string | null;
}

type ApplicationStatus = "none" | "pending" | "accepted" | "rejected" | "owner" | "unauthenticated";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getStageColor(stage: string | null): string {
  switch (stage) {
    case "idea": return "#fbbf24";
    case "mvp": return "#60a5fa";
    case "building": return "#a78bfa";
    case "launched": return "#4ade80";
    default: return "#8b9ab0";
  }
}

function getAvatarColor(id: string | null): string {
  if (!id) return "#6366f1";
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  return colors[id.charCodeAt(0) % colors.length] ?? "#6366f1";
}

// ── Apply Modal ───────────────────────────────────────────────────────────────

function ApplyModal({
  project,
  onClose,
  onSuccess,
}: {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const MAX = 500;

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("Please share why you want to join.");
      return;
    }
    setError("");
    setSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/login?next=/projects/${project.id}`); return; }

    const { error: insertErr } = await supabase.from("applications").insert({
      project_id: project.id,
      applicant_id: user.id,
      role: null,
      message: message.trim(),
    });

    if (insertErr) {
      setError(
        insertErr.message.includes("unique")
          ? "You've already expressed interest in this project."
          : insertErr.message
      );
      setSubmitting(false);
      return;
    }

    if (project.owner_id) {
      await supabase.from("notifications").insert({
        user_id: project.owner_id,
        type: "application_received" as const,
        from_user_id: user.id,
        entity_id: project.id,
      });
    }

    setSubmitting(false);
    onSuccess();
  };

  const remaining = MAX - message.length;

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 20, color: "var(--text-primary)", marginBottom: 4, letterSpacing: "-0.02em" }}>
              I want to help build this
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{project.title}</p>
          </div>
          <button type="button" onClick={onClose} style={modalCloseBtnStyle}>✕</button>
        </div>

        {/* Message field */}
        <div style={{ marginBottom: 6 }}>
          <label style={fieldLabelStyle}>Why do you want to join?</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
            placeholder="Tell the team what excites you about this project and what you bring to the table…"
            rows={5}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            style={{ ...inputStyle, resize: "none", marginTop: 10 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, minHeight: 18 }}>
            <span style={{ fontSize: 12, color: "#f87171" }}>{error}</span>
            <span style={{
              fontSize: 11,
              color: remaining <= 20 ? (remaining <= 0 ? "#f87171" : "#fbbf24") : "var(--text-muted)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {remaining} left
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || message.trim().length === 0}
            style={{
              ...submitBtnStyle,
              opacity: submitting || message.trim().length === 0 ? 0.55 : 1,
              cursor: submitting || message.trim().length === 0 ? "default" : "pointer",
            }}
          >
            {submitting ? "Sending…" : "Send →"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  projectTitle,
  deleting,
  error,
  onClose,
  onConfirm,
}: {
  projectTitle: string | null;
  deleting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [confirm, setConfirm] = useState("");
  const canDelete = confirm === "delete" && !deleting;

  return (
    <div
      style={overlayStyle}
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) onClose(); }}
    >
      <div style={modalStyle}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Delete Project
            </h2>
          </div>
          {!deleting && (
            <button type="button" onClick={onClose} style={modalCloseBtnStyle}>✕</button>
          )}
        </div>

        {/* Warning */}
        <div style={{
          padding: "14px 16px",
          borderRadius: 10,
          background: "rgba(239,68,68,0.07)",
          border: "1px solid rgba(239,68,68,0.2)",
          marginBottom: 24,
        }}>
          <p style={{ fontSize: 14, color: "#fca5a5", lineHeight: 1.65, margin: 0 }}>
            This will permanently delete{" "}
            <strong style={{ color: "#f87171" }}>{projectTitle || "this project"}</strong>,
            its updates, applications, and related data. This action cannot be undone.
          </p>
        </div>

        {/* Confirm input */}
        <div style={{ marginBottom: error ? 12 : 22 }}>
          <label style={fieldLabelStyle}>
            Type{" "}
            <span style={{ color: "#f87171", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.04em" }}>
              delete
            </span>{" "}
            to confirm
          </label>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="delete"
            disabled={deleting}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            style={{
              ...inputStyle,
              borderColor: confirm === "delete" ? "rgba(239,68,68,0.45)" : undefined,
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 13, color: "#f87171", marginBottom: 16, lineHeight: 1.5 }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            style={{ ...cancelBtnStyle, opacity: deleting ? 0.5 : 1, cursor: deleting ? "default" : "pointer" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canDelete}
            style={{
              flex: 2,
              padding: "12px 20px",
              borderRadius: 10,
              background: canDelete ? "linear-gradient(135deg, #dc2626, #b91c1c)" : "rgba(239,68,68,0.18)",
              border: "none",
              color: canDelete ? "white" : "rgba(248,113,113,0.45)",
              fontWeight: 700,
              fontSize: 14,
              cursor: canDelete ? "pointer" : "default",
              fontFamily: "Syne, sans-serif",
              boxShadow: canDelete ? "0 4px 14px rgba(220,38,38,0.3)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {deleting ? "Deleting…" : "Delete Project"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [similarProjects, setSimilarProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [appStatus, setAppStatus] = useState<ApplicationStatus>("unauthenticated");
  const [showModal, setShowModal] = useState(false);

  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [newUpdateContent, setNewUpdateContent] = useState("");
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      try {
        const [projResult, sessionResult] = await Promise.all([
          supabase
            .from("projects")
            .select("id, owner_id, title, tagline, description, stage, looking_for, tech_stack, category, created_at")
            .eq("id", id)
            .single(),
          supabase.auth.getSession(),
        ]);

        const { data: proj, error } = projResult;
        if (error || !proj) { setNotFound(true); return; }
        setProject(proj as Project);

        const userId = sessionResult.data.session?.user?.id ?? null;

        const [profileResult, similarResult, appResult, updatesResult] = await Promise.all([
          proj.owner_id
            ? supabase.from("profiles").select("username, full_name, university, role").eq("id", proj.owner_id).maybeSingle()
            : Promise.resolve({ data: null }),
          proj.category
            ? supabase.from("projects").select("id, owner_id, title, tagline, stage, category, created_at, description, looking_for, tech_stack").eq("category", proj.category).neq("id", id).limit(3)
            : Promise.resolve({ data: [] }),
          userId && userId !== proj.owner_id
            ? supabase.from("applications").select("id, status").eq("project_id", id).eq("applicant_id", userId).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase
            .from("project_updates")
            .select("id, project_id, author_id, content, created_at")
            .eq("project_id", id)
            .order("created_at", { ascending: false }),
        ]);

        setOwnerProfile((profileResult.data ?? null) as OwnerProfile | null);
        setSimilarProjects(((similarResult.data ?? []) as Project[]));
        setUpdates((updatesResult.data ?? []) as ProjectUpdate[]);
        setUpdatesLoading(false);

        if (!userId) {
          setAppStatus("unauthenticated");
        } else if (userId === proj.owner_id) {
          setAppStatus("owner");
        } else {
          const existing = appResult.data;
          if (existing) {
            setAppStatus(existing.status as ApplicationStatus);
          } else {
            setAppStatus("none");
          }
        }
      } catch (err: unknown) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePostUpdate = async () => {
    const trimmed = newUpdateContent.trim();
    if (!trimmed || postingUpdate) return;
    setUpdateError("");
    setPostingUpdate(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUpdateError("Not authenticated."); setPostingUpdate(false); return; }
    const { data, error } = await supabase
      .from("project_updates")
      .insert({ project_id: id, author_id: user.id, content: trimmed })
      .select("id, project_id, author_id, content, created_at")
      .single();
    if (error) { setUpdateError(error.message); } else if (data) {
      setUpdates((prev) => [data as ProjectUpdate, ...prev]);
      setNewUpdateContent("");
    }
    setPostingUpdate(false);
  };

  const handleDeleteUpdate = async (updateId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("project_updates").delete().eq("id", updateId);
    if (!error) setUpdates((prev) => prev.filter((u) => u.id !== updateId));
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError("");
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setDeleteError("You must be signed in to delete this project."); return; }

      // Re-verify ownership — RLS enforces this too, but defense in depth.
      const { data: check } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", id)
        .single();
      if (check?.owner_id !== user.id) { setDeleteError("You do not own this project."); return; }

      // Delete applications first (requires "applications: project owner delete" policy).
      // project_updates cascade automatically via ON DELETE CASCADE.
      const { error: appErr } = await supabase
        .from("applications")
        .delete()
        .eq("project_id", id);
      if (appErr) { setDeleteError(`Could not remove applications: ${appErr.message}`); return; }

      // Delete the project row — cascades project_updates.
      const { error: projErr } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);
      if (projErr) { setDeleteError(`Could not delete project: ${projErr.message}`); return; }

      router.push("/projects");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div className="page-grid-bg" />
        <div className="page-radial-glow" />
        <div className="page-z" style={bodyContainerStyle}>
          <SkeletonLoader count={3} columns="1fr" />
        </div>
      </main>
    );
  }

  if (notFound || !project) {
    return (
      <main style={pageStyle}>
        <div className="page-grid-bg" />
        <div className="page-radial-glow" />
        <div className="page-z" style={bodyContainerStyle}>
          <Link href="/projects" style={backLinkStyle}>← Back to projects</Link>
          <div style={notFoundStyle}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>🔍</div>
            <h1 style={{ fontSize: 26, fontFamily: "Syne, sans-serif", fontWeight: 800, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "-0.02em" }}>
              Project not found
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6, maxWidth: 360, margin: "0 auto 28px" }}>
              This project doesn&apos;t exist or has been removed.
            </p>
            <Link href="/projects" style={browseAllBtnStyle}>Browse all projects</Link>
          </div>
        </div>
      </main>
    );
  }

  const builderHref = ownerProfile?.username ? `/builders/${ownerProfile.username}` : null;
  const techList = project.tech_stack ? project.tech_stack.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const lookingForList = project.looking_for ? project.looking_for.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const stageColor = getStageColor(project.stage);
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? "")}/projects/${id}`;

  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />

      {showModal && project && (
        <ApplyModal
          project={project}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setAppStatus("pending"); }}
        />
      )}

      {showDeleteModal && project && (
        <DeleteConfirmModal
          projectTitle={project.title}
          deleting={deleting}
          error={deleteError}
          onClose={() => { setShowDeleteModal(false); setDeleteError(""); }}
          onConfirm={handleDelete}
        />
      )}

      {/* ── Hero ── */}
      <div style={heroSectionStyle}>
        <div style={heroContentStyle}>
          {/* Top nav row */}
          <div style={heroNavRowStyle}>
            <Link href="/projects" style={backLinkStyle}>← Projects</Link>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {project.category && <span style={categoryBadgeStyle}>{project.category}</span>}
              {project.stage && (
                <span style={{ ...stageBadgeBase, color: stageColor, border: `1px solid ${stageColor}44`, background: `${stageColor}12` }}>
                  {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
                </span>
              )}
              <span style={metaDateStyle}>Posted {formatDate(project.created_at)}</span>
            </div>
          </div>

          {/* Title block */}
          <h1 style={heroTitleStyle}>{project.title || "Untitled Project"}</h1>
          {project.tagline && <p style={heroTaglineStyle}>{project.tagline}</p>}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="page-z" style={bodyContainerStyle}>
        <div className="responsive-with-sidebar-sm" style={{ gap: 40, alignItems: "start" }}>

          {/* ── Left: content sections ── */}
          <div style={leftColStyle}>

            {/* Overview */}
            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Overview</h2>
              <p style={descStyle}>{project.description || project.tagline || "No description provided yet."}</p>
            </div>

            {/* Project Updates */}
            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Updates</h2>

              {/* Owner composer */}
              {appStatus === "owner" && (
                <div style={{ marginBottom: updates.length > 0 ? 24 : 0 }}>
                  <textarea
                    value={newUpdateContent}
                    onChange={(e) => setNewUpdateContent(e.target.value.slice(0, 280))}
                    placeholder="What's new with your project?"
                    rows={3}
                    style={{
                      ...updateInputStyle,
                      borderColor: newUpdateContent.length > 0 ? "color-mix(in srgb, var(--accent) 40%, transparent)" : undefined,
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{
                      fontSize: 11,
                      color: (280 - newUpdateContent.length) <= 20
                        ? (280 - newUpdateContent.length) <= 0 ? "#f87171" : "#fbbf24"
                        : "var(--text-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {280 - newUpdateContent.length} left
                    </span>
                    <button
                      type="button"
                      onClick={handlePostUpdate}
                      disabled={postingUpdate || newUpdateContent.trim().length === 0}
                      style={{
                        ...postUpdateBtnStyle,
                        opacity: postingUpdate || newUpdateContent.trim().length === 0 ? 0.5 : 1,
                        cursor: postingUpdate || newUpdateContent.trim().length === 0 ? "default" : "pointer",
                      }}
                    >
                      {postingUpdate ? "Posting…" : "Post Update"}
                    </button>
                  </div>
                  {updateError && (
                    <p style={{ fontSize: 12, color: "#f87171", marginTop: 6, margin: "6px 0 0" }}>{updateError}</p>
                  )}
                </div>
              )}

              {/* Updates list */}
              {updatesLoading ? (
                <div style={{ height: 40 }} />
              ) : updates.length === 0 ? (
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, margin: appStatus === "owner" ? "0" : "0" }}>
                  No updates yet.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {updates.map((update) => (
                    <div key={update.id} style={updateRowStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                          {timeAgoUpdate(update.created_at)}
                        </span>
                        {appStatus === "owner" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUpdate(update.id)}
                            style={deleteUpdateBtnStyle}
                            title="Delete update"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>
                        {update.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Needed Roles */}
            {lookingForList.length > 0 && (
              <div style={sectionCardStyle}>
                <h2 style={sectionTitleStyle}>Needed Roles</h2>
                <p style={sectionSubStyle}>This project is actively looking for contributors to join the team.</p>
                <div style={rolesGridStyle}>
                  {lookingForList.map((role) => (
                    <div key={role} style={roleCardStyle}>
                      <span style={roleIconStyle}>✦</span>
                      <span style={roleLabelStyle}>{role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack */}
            {techList.length > 0 && (
              <div style={sectionCardStyle}>
                <h2 style={sectionTitleStyle}>Tech Stack</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {techList.map((tech) => <span key={tech} style={techPillStyle}>{tech}</span>)}
                </div>
              </div>
            )}

            {/* Similar Projects */}
            {similarProjects.length > 0 && (
              <div style={sectionCardStyle}>
                <h2 style={sectionTitleStyle}>More in {project.category}</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {similarProjects.map((sp) => (
                    <Link key={sp.id} href={`/projects/${sp.id}`} style={similarRowStyle}>
                      <div style={similarIconStyle}>{sp.category ? sp.category.charAt(0).toUpperCase() : "P"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={similarTitleStyle}>{sp.title || "Untitled"}</div>
                        {sp.tagline && <div style={similarTaglineStyle}>{sp.tagline}</div>}
                      </div>
                      <span style={{ fontSize: 14, color: "var(--text-muted)", flexShrink: 0 }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: sticky sidebar ── */}
          <div style={rightColStyle}>

            {/* ── Action panel ── */}
            <div style={actionPanelStyle}>
              <div style={actionPanelAccentStyle} />
              <div style={actionPanelInnerStyle}>

                {/* Owner control panel */}
                {appStatus === "owner" && (
                  <div>
                    {/* Badge + title */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={ownerControlBadgeStyle}>⚡ Owner</span>
                    </div>
                    <div style={{ fontSize: 19, fontFamily: "Syne, sans-serif", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em", marginBottom: 6 }}>
                      Project Controls
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 0 }}>
                      Manage this project, update details, and review applicants.
                    </p>

                    {/* Stats strip */}
                    <div style={ownerStatsRowStyle}>
                      <div style={ownerStatCellStyle}>
                        <span style={ownerStatNumStyle}>{lookingForList.length}</span>
                        <span style={ownerStatLblStyle}>Open roles</span>
                      </div>
                      <div style={ownerStatDivStyle} />
                      <div style={ownerStatCellStyle}>
                        <span style={{ ...ownerStatNumStyle, color: stageColor, fontSize: 14 }}>
                          {project.stage ? project.stage.charAt(0).toUpperCase() + project.stage.slice(1) : "—"}
                        </span>
                        <span style={ownerStatLblStyle}>Stage</span>
                      </div>
                      {techList.length > 0 && (
                        <>
                          <div style={ownerStatDivStyle} />
                          <div style={ownerStatCellStyle}>
                            <span style={ownerStatNumStyle}>{techList.length}</span>
                            <span style={ownerStatLblStyle}>Tech</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Primary actions */}
                    <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                      <Link href={`/projects/${id}/edit`} style={ownerActionPrimaryStyle}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit Project
                      </Link>
                      <Link href="/dashboard" style={ownerActionSecondaryStyle}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        View Applicants
                      </Link>
                    </div>

                    {/* Delete project */}
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(239,68,68,0.1)" }}>
                      <button
                        type="button"
                        onClick={() => { setDeleteError(""); setShowDeleteModal(true); }}
                        style={deleteProjectBtnStyle}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                        Delete Project
                      </button>
                    </div>

                    {/* Share strip */}
                    <div style={ownerShareStripStyle}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 5 }}>
                        Share project
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {shareUrl}
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary CTA states: none / unauthenticated */}
                {(appStatus === "none" || appStatus === "unauthenticated") && (
                  <>
                    <div style={actionPanelHeaderStyle}>
                      <div style={actionPanelTitleStyle}>Join this project</div>
                      {lookingForList.length > 0 && (
                        <p style={actionPanelSubStyle}>
                          Looking for {lookingForList.length} role{lookingForList.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    {lookingForList.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                        {lookingForList.map((r) => (
                          <span key={r} style={actionRolePillStyle}>{r}</span>
                        ))}
                      </div>
                    )}
                    {appStatus === "unauthenticated" ? (
                      <Link href={`/login?next=/projects/${id}`} style={bigApplyBtnStyle}>
                        Sign in to apply
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        style={bigApplyBtnStyle}
                      >
                        I want to help build this
                      </button>
                    )}
                  </>
                )}

                {/* Status states: pending / accepted / rejected */}
                {(appStatus === "pending" || appStatus === "accepted" || appStatus === "rejected") && (
                  <div style={{
                    padding: "24px 20px",
                    borderRadius: 12,
                    background: appStatus === "accepted" ? "rgba(74,222,128,0.08)" : appStatus === "pending" ? "rgba(251,191,36,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${appStatus === "accepted" ? "rgba(74,222,128,0.22)" : appStatus === "pending" ? "rgba(251,191,36,0.22)" : "rgba(239,68,68,0.22)"}`,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>
                      {appStatus === "accepted" ? "✅" : appStatus === "pending" ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                      ) : "✗"}
                    </div>
                    <div style={{
                      fontSize: 15, fontWeight: 800, fontFamily: "Syne, sans-serif", marginBottom: 8, letterSpacing: "-0.01em",
                      color: appStatus === "accepted" ? "#4ade80" : appStatus === "pending" ? "#fbbf24" : "#f87171",
                    }}>
                      {appStatus === "accepted" ? "You're in!" : appStatus === "pending" ? "Application pending" : "Not selected"}
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, margin: 0 }}>
                      {appStatus === "accepted"
                        ? "Congratulations — you've been accepted to this project."
                        : appStatus === "pending"
                        ? "The team has been notified and will reach out if there's a good fit."
                        : "Your application wasn't accepted this time. Keep building!"}
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* ── Builder card ── */}
            <div style={sideCardStyle}>
              <h3 style={sideCardTitleStyle}>Builder</h3>
              {ownerProfile ? (
                <>
                  <div style={ownerRowStyle}>
                    <div style={{ ...ownerAvatarStyle, background: getAvatarColor(project.owner_id) }}>
                      {getInitials(ownerProfile.full_name, ownerProfile.username)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={ownerNameStyle}>{ownerProfile.full_name || ownerProfile.username || "Unknown"}</div>
                      {ownerProfile.university && <div style={ownerMetaStyle}>{ownerProfile.university}</div>}
                      {ownerProfile.role && <div style={ownerRoleStyle}>{ownerProfile.role}</div>}
                    </div>
                  </div>
                  {builderHref && (
                    <Link href={builderHref} style={viewProfileBtnStyle}>View full profile →</Link>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Builder profile unavailable</p>
                </div>
              )}
            </div>

            {/* ── Project Details card ── */}
            <div style={sideCardStyle}>
              <h3 style={sideCardTitleStyle}>Project Details</h3>
              <div style={{ display: "grid", gap: 14 }}>
                <div style={metaRowStyle}>
                  <span style={metaLabelStyle}>Posted</span>
                  <span style={metaValueStyle}>{formatDate(project.created_at)}</span>
                </div>
                <div style={metaRowStyle}>
                  <span style={metaLabelStyle}>Stage</span>
                  <span style={{ ...metaValueStyle, color: stageColor, fontWeight: 700 }}>
                    {project.stage ? project.stage.charAt(0).toUpperCase() + project.stage.slice(1) : "Not set"}
                  </span>
                </div>
                {project.category && (
                  <div style={metaRowStyle}>
                    <span style={metaLabelStyle}>Category</span>
                    <span style={metaValueStyle}>{project.category}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

// ── Page shell

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--background)",
  color: "var(--text-primary)",
  position: "relative",
};

// ── Hero section (full-width atmospheric header)

const heroSectionStyle: React.CSSProperties = {
  padding: "90px 24px 64px",
  background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 9%, var(--background)) 0%, var(--background) 100%)",
  borderBottom: "1px solid var(--border-subtle)",
  position: "relative",
  zIndex: 1,
};

const heroContentStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
};

const heroNavRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 36,
  flexWrap: "wrap",
};

const backLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "var(--text-muted)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
  flexShrink: 0,
  transition: "color 0.15s ease",
};

const categoryBadgeStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--accent-bright)",
  background: "color-mix(in srgb, var(--accent) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
  borderRadius: 20,
  padding: "5px 13px",
  letterSpacing: "0.02em",
};

const stageBadgeBase: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  borderRadius: 20,
  padding: "5px 13px",
  letterSpacing: "0.02em",
};

const metaDateStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-muted)",
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: "clamp(36px, 5vw, 62px)",
  fontWeight: 800,
  fontFamily: "Syne, sans-serif",
  color: "var(--text-primary)",
  lineHeight: 1.1,
  letterSpacing: "-0.035em",
  marginBottom: 20,
  maxWidth: 900,
};

const heroTaglineStyle: React.CSSProperties = {
  fontSize: "clamp(16px, 1.8vw, 20px)",
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  maxWidth: 680,
};

// ── Body container

const bodyContainerStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: "52px 24px 100px",
};

// ── Two-column layout

const leftColStyle: React.CSSProperties = {
  display: "grid",
  gap: 24,
  alignContent: "start",
};

const rightColStyle: React.CSSProperties = {
  display: "grid",
  gap: 20,
  alignContent: "start",
  position: "sticky",
  top: 96,
};

// ── Left column section cards

const sectionCardStyle: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: "32px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.16)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  fontFamily: "Syne, sans-serif",
  color: "var(--text-primary)",
  letterSpacing: "-0.01em",
  marginBottom: 16,
};

const sectionSubStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--text-muted)",
  lineHeight: 1.55,
  marginTop: -8,
  marginBottom: 20,
};

const descStyle: React.CSSProperties = {
  fontSize: 15,
  color: "var(--text-secondary)",
  lineHeight: 1.9,
  whiteSpace: "pre-wrap",
  margin: 0,
};

// ── Roles grid

const rolesGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: 10,
};

const roleCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "14px 16px",
  borderRadius: 12,
  background: "rgba(74,222,128,0.06)",
  border: "1px solid rgba(74,222,128,0.18)",
};

const roleIconStyle: React.CSSProperties = {
  fontSize: 9,
  color: "#4ade80",
  flexShrink: 0,
};

const roleLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#4ade80",
  lineHeight: 1.2,
};

// ── Tech pills

const techPillStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "8px 16px",
};

// ── Similar projects

const similarRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "13px 14px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  textDecoration: "none",
};

const similarIconStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 9,
  background: "color-mix(in srgb, var(--accent) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 700,
  color: "var(--accent-bright)",
  flexShrink: 0,
};

const similarTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--text-primary)",
  marginBottom: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const similarTaglineStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

// ── Action panel (right sidebar — primary card)

const actionPanelStyle: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  overflow: "hidden",
  boxShadow: "0 12px 40px rgba(0,0,0,0.28), 0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent) inset",
};

const actionPanelAccentStyle: React.CSSProperties = {
  height: 4,
  background: "linear-gradient(90deg, var(--accent), var(--accent-hover), color-mix(in srgb, var(--accent) 35%, transparent))",
};

const actionPanelInnerStyle: React.CSSProperties = {
  padding: "24px",
};

const actionPanelHeaderStyle: React.CSSProperties = {
  marginBottom: 16,
};

const actionPanelTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  fontFamily: "Syne, sans-serif",
  color: "var(--text-primary)",
  letterSpacing: "-0.02em",
  marginBottom: 5,
};

const actionPanelSubStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
  lineHeight: 1.4,
};

const actionRolePillStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--accent-bright)",
  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
  borderRadius: 20,
  padding: "4px 12px",
};

const bigApplyBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "16px 24px",
  borderRadius: 12,
  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
  color: "white",
  fontWeight: 800,
  fontSize: 15,
  fontFamily: "Syne, sans-serif",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  boxShadow: "0 6px 24px var(--accent-glow)",
  letterSpacing: "0.01em",
  boxSizing: "border-box",
};

const ownerBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 22px",
  borderRadius: 12,
  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 28%, transparent)",
  color: "var(--accent-bright)",
  fontWeight: 700,
  fontSize: 14,
  fontFamily: "Syne, sans-serif",
};

// ── Sidebar cards (builder + details)

const sideCardStyle: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "22px 24px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
};

const sideCardTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 18,
};

// ── Builder card internals

const ownerRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 16,
};

const ownerAvatarStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 17,
  fontWeight: 700,
  color: "white",
  flexShrink: 0,
  boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
};

const ownerNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  fontFamily: "Syne, sans-serif",
  color: "var(--text-primary)",
  marginBottom: 3,
};

const ownerMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  marginBottom: 4,
};

const ownerRoleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--accent-bright)",
  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 24%, transparent)",
  borderRadius: 20,
  padding: "2px 9px",
  display: "inline-block",
};

const viewProfileBtnStyle: React.CSSProperties = {
  display: "block",
  textAlign: "center",
  padding: "10px 14px",
  borderRadius: 10,
  background: "color-mix(in srgb, var(--accent) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
  color: "var(--accent-bright)",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 13,
};

// ── Project details card internals

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
};

const metaLabelStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  fontWeight: 500,
};

const metaValueStyle: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontWeight: 600,
};

// ── Not found

const notFoundStyle: React.CSSProperties = {
  marginTop: 60,
  textAlign: "center",
  padding: "60px 40px",
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 20,
};

const browseAllBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "12px 28px",
  borderRadius: 12,
  background: "color-mix(in srgb, var(--accent) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 28%, transparent)",
  color: "var(--accent-bright)",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 14,
};

// ── Modal

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  backdropFilter: "blur(4px)",
  zIndex: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const modalStyle: React.CSSProperties = {
  background: "var(--gradient-card)",
  border: "1px solid var(--border)",
  borderRadius: 20,
  padding: "32px",
  width: "100%",
  maxWidth: 500,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
};

const modalCloseBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--border)",
  color: "var(--text-muted)",
  width: 32,
  height: 32,
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-secondary)",
  display: "block",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  background: "var(--background)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "DM Sans, sans-serif",
  marginTop: 10,
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "12px 16px",
  borderRadius: 10,
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text-muted)",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
};

const submitBtnStyle: React.CSSProperties = {
  flex: 2,
  padding: "12px 20px",
  borderRadius: 10,
  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
  border: "none",
  color: "white",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "Syne, sans-serif",
  boxShadow: "0 4px 14px var(--accent-glow)",
};

// ── Owner control panel

const ownerControlBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "4px 12px",
  borderRadius: 20,
  background: "color-mix(in srgb, var(--accent) 15%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 32%, transparent)",
  color: "var(--accent-bright)",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const ownerStatsRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "14px 0",
  marginTop: 20,
};

const ownerStatCellStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 5,
};

const ownerStatNumStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  fontFamily: "Syne, sans-serif",
  color: "var(--text-primary)",
  lineHeight: 1,
  letterSpacing: "-0.02em",
};

const ownerStatLblStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "var(--text-muted)",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const ownerStatDivStyle: React.CSSProperties = {
  width: 1,
  height: 30,
  background: "rgba(255,255,255,0.08)",
  flexShrink: 0,
};

const ownerActionPrimaryStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  padding: "14px 20px",
  borderRadius: 12,
  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
  color: "white",
  fontWeight: 700,
  fontSize: 14,
  fontFamily: "Syne, sans-serif",
  textDecoration: "none",
  boxShadow: "0 4px 20px var(--accent-glow)",
  letterSpacing: "0.01em",
  boxSizing: "border-box",
};

const ownerActionSecondaryStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  padding: "13px 20px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "var(--text-secondary)",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
  letterSpacing: "0.01em",
  boxSizing: "border-box",
};

const ownerShareStripStyle: React.CSSProperties = {
  marginTop: 18,
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 10,
  padding: "10px 14px",
};

const deleteProjectBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  background: "rgba(239,68,68,0.07)",
  border: "1px solid rgba(239,68,68,0.18)",
  color: "#f87171",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};

// ── Updates section

function timeAgoUpdate(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 2592000)}mo ago`;
}

const updateInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "DM Sans, sans-serif",
  resize: "none",
  lineHeight: 1.6,
  transition: "border-color 0.15s ease",
};

const postUpdateBtnStyle: React.CSSProperties = {
  padding: "8px 18px",
  borderRadius: 8,
  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
  border: "none",
  color: "white",
  fontWeight: 700,
  fontSize: 13,
  fontFamily: "Syne, sans-serif",
  boxShadow: "0 3px 12px var(--accent-glow)",
  letterSpacing: "0.01em",
};

const updateRowStyle: React.CSSProperties = {
  padding: "16px 18px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.025)",
  border: "1px solid var(--border-subtle)",
};

const deleteUpdateBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text-muted)",
  fontSize: 11,
  cursor: "pointer",
  padding: "2px 6px",
  borderRadius: 4,
  lineHeight: 1,
};
