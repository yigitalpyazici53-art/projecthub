"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import SkeletonLoader from "@/components/SkeletonLoader";
import { getInitials } from "@/utils/getInitials";
import { avatarTint } from "@/utils/category";
import { Reveal } from "@/components/motion/Reveal";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({
  filtered,
  onClearFilters,
  authed,
}: {
  filtered: boolean;
  onClearFilters?: () => void;
  authed: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "52px 24px" }}>
      <div className="empty-state-panel" style={{ maxWidth: 460, width: "100%" }}>
        <div aria-hidden="true" style={{ fontSize: 48, lineHeight: 1, marginBottom: 20 }}>🧭</div>
        <h3 className="font-serif" style={{
          fontSize: 22, fontWeight: 500,
          color: "var(--text-primary)", marginBottom: 10, lineHeight: 1.35,
        }}>
          {filtered
            ? "No builders match those filters."
            : "No builders listed yet."}
        </h3>

        <p style={{
          fontSize: 14, color: "var(--text-secondary)",
          maxWidth: 340, margin: "0 auto 30px", lineHeight: 1.65,
        }}>
          {filtered
            ? "Try adjusting the search or role filter — or complete your own profile to show up here."
            : "Complete your profile and document what you've built to be listed in the directory."}
        </p>

        {filtered ? (
          <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {onClearFilters && (
              <button type="button" onClick={onClearFilters} className="btn-secondary">
                Clear filters
              </button>
            )}
            <Link href={authed ? "/profile/edit" : "/login?next=/profile/edit"} className="btn-primary">
              Complete profile
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Link
              href={authed ? "/profile/edit" : "/login?next=/profile/edit"}
              className="btn-primary"
              style={{ padding: "11px 32px", fontSize: 15 }}
            >
              Complete profile →
            </Link>
            <Link href="/projects" className="u-link" style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Browse projects instead
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BuildersPage() {
  const [builders, setBuilders] = useState<Profile[]>([]);
  const [shippedByOwner, setShippedByOwner] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [authed, setAuthed] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session?.user);
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error: dbError } = await supabase
          .from("profiles")
          .select("id, full_name, username, university, role, bio, skills, interests, github_url, avatar_url, created_at, is_ai_generated")
          .order("created_at", { ascending: false });

        if (dbError) {
          setError(`Could not load builders: ${dbError.message}`);
        } else {
          setBuilders((data ?? []) as Profile[]);
        }

        // Shipped-project counts per builder (client-side aggregation)
        const { data: shippedRows } = await supabase
          .from("projects")
          .select("owner_id, stage")
          .eq("stage", "launched");
        if (shippedRows) {
          const counts: Record<string, number> = {};
          (shippedRows as { owner_id: string | null }[]).forEach((r) => {
            if (r.owner_id) counts[r.owner_id] = (counts[r.owner_id] ?? 0) + 1;
          });
          setShippedByOwner(counts);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unexpected error loading builders.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

  const roles = ["All", ...Array.from(new Set(builders.map((b) => b.role).filter(Boolean) as string[]))];

  const filtered = builders
    .filter((b) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (b.full_name ?? "").toLowerCase().includes(q) ||
        (b.username ?? "").toLowerCase().includes(q) ||
        (b.role ?? "").toLowerCase().includes(q) ||
        (b.university ?? "").toLowerCase().includes(q) ||
        (b.bio ?? "").toLowerCase().includes(q);
      const matchesRole = roleFilter === "All" || b.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => (a.is_ai_generated ? 1 : 0) - (b.is_ai_generated ? 1 : 0));

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1080, margin: "0 auto", paddingTop: 80 }}>

        <Reveal>
          <div style={{ marginBottom: 32 }}>
            <h1 className="font-serif" style={titleStyle}>Builders</h1>
            <p style={mutedStyle}>Student builders with a track record you can verify.</p>
          </div>
        </Reveal>

        {!loading && (
          <Reveal delay={0.08}>
            <div style={searchRowStyle}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, role, university…"
                style={searchInputStyle}
              />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={selectStyle} className="role-filter-select" aria-label="Filter by role">
                {roles.map((r) => (
                  <option key={r} value={r}>{r === "All" ? "All roles" : r}</option>
                ))}
              </select>
            </div>
          </Reveal>
        )}

        {loading && <SkeletonLoader count={6} />}
        {error && <p style={errorStyle}>{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            filtered={builders.length > 0}
            onClearFilters={() => { setSearch(""); setRoleFilter("All"); }}
            authed={authed}
          />
        )}

        {!loading && filtered.length > 0 && (
          <Reveal delay={0.16}>
            <div style={gridStyle} className="builders-grid">
              {filtered.map((builder) => {
                const skills = (builder.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                const shipped = shippedByOwner[builder.id] ?? 0;
                const href = `/builders/${builder.username || builder.id}`;

                return (
                  <article
                    key={builder.id}
                    className="card-hover"
                    style={cardBase}
                  >
                    {/* Stretched link — whole card opens the profile */}
                    <Link
                      href={href}
                      aria-label={`Open ${builder.full_name || builder.username || "builder"}'s profile`}
                      style={{ position: "absolute", inset: 0, zIndex: 1, borderRadius: 12 }}
                    />

                    {/* Header: avatar + name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                        background: avatarTint(builder.full_name || builder.username),
                        border: "1px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 600, color: "var(--text-primary)",
                        overflow: "hidden",
                      }}>
                        {builder.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={builder.avatar_url}
                            alt={builder.full_name || builder.username || "builder"}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                          />
                        ) : (
                          getInitials(builder.full_name, builder.username)
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                          <h2 className="font-serif" style={{
                            fontSize: 18, fontWeight: 500, color: "var(--text-primary)",
                            lineHeight: 1.25, marginBottom: 2,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {builder.full_name || builder.username || "Unnamed Builder"}
                          </h2>
                          {shipped > 0 && (
                            <span style={{
                              fontSize: 11, fontWeight: 500, color: "var(--accent-green)",
                              whiteSpace: "nowrap", flexShrink: 0,
                            }}>
                              ✓ {shipped} shipped
                            </span>
                          )}
                        </div>
                        <div className="label-caps" style={{
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {[builder.university, builder.role].filter(Boolean).join(" · ") || `@${builder.username}`}
                        </div>
                      </div>
                      {builder.is_ai_generated && (
                        <span style={{
                          fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999,
                          color: "var(--text-muted)", background: "var(--surface-raised)",
                          whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                          example
                        </span>
                      )}
                    </div>

                    {/* Bio — first line only, truncated */}
                    {builder.bio && (() => {
                      const firstLine = builder.bio.split("\n")[0].trim();
                      if (!firstLine) return null;
                      return (
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 14 }}>
                          {firstLine.length > 80 ? firstLine.slice(0, 80) + "…" : firstLine}
                        </p>
                      );
                    })()}

                    {/* Skills pills */}
                    {skills.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 4 }}>
                        {skills.slice(0, 4).map((s) => (
                          <span key={s} style={{
                            fontSize: 11, fontWeight: 400, color: "var(--text-secondary)",
                            background: "var(--surface-raised)",
                            borderRadius: 999, padding: "3px 10px",
                          }}>
                            {s}
                          </span>
                        ))}
                        {skills.length > 4 && (
                          <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "3px 4px" }}>+{skills.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Footer: view link */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                      paddingTop: 14, marginTop: "auto", borderTop: "1px solid var(--border-subtle)",
                    }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {currentUserId === builder.id ? "This is you" : ""}
                      </span>
                      <span className="u-link" style={{
                        fontSize: 12, fontWeight: 500, color: "var(--text-primary)",
                        position: "relative", zIndex: 2,
                      }}>
                        View profile →
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </Reveal>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .builders-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "var(--background)", color: "var(--text-primary)", padding: "40px 24px", position: "relative" };
const titleStyle: React.CSSProperties = { fontSize: "clamp(30px, 4vw, 42px)", fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.015em", marginBottom: 8 };
const mutedStyle: React.CSSProperties = { color: "var(--text-secondary)", fontSize: 18, marginBottom: 0 };
const errorStyle: React.CSSProperties = { padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)", fontSize: 13 };
const searchRowStyle: React.CSSProperties = { display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" };
const searchInputStyle: React.CSSProperties = { flex: 1, minWidth: 200, padding: "11px 16px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 14, outline: "none", fontFamily: "var(--font-sans)" };
const selectStyle: React.CSSProperties = { padding: "11px 14px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 14, outline: "none", cursor: "pointer", fontFamily: "var(--font-sans)" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 };
const cardBase: React.CSSProperties = {
  position: "relative",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 24,
  transition: "border-color 0.18s ease",
  display: "flex",
  flexDirection: "column",
};
