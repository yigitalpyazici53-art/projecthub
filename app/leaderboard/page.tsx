"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { getInitials } from "@/utils/getInitials";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BuilderScore {
  id: string;
  full_name: string | null;
  username: string | null;
  university: string | null;
  role: string | null;
  avatar_url: string | null;
  points: number;
  projectCount: number;
  connectionCount: number;
  endorsementCount: number;
  weeklyPoints: number;
}

interface UniversityStat {
  name: string;
  count: number;
  flag: string;
}

// ── Points constants ──────────────────────────────────────────────────────────
const PTS_PROJECT = 10;
const PTS_CONNECTION = 5;
const PTS_ENDORSEMENT = 2;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAvatarColor(id: string): string {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  return colors[id.charCodeAt(0) % colors.length];
}

const COUNTRY_FLAGS: Record<string, string> = {
  uk: "🇬🇧", "united kingdom": "🇬🇧", england: "🇬🇧",
  us: "🇺🇸", usa: "🇺🇸", "united states": "🇺🇸", america: "🇺🇸",
  turkey: "🇹🇷", türkiye: "🇹🇷",
  germany: "🇩🇪", deutschland: "🇩🇪",
  france: "🇫🇷",
  india: "🇮🇳",
  canada: "🇨🇦",
  australia: "🇦🇺",
  netherlands: "🇳🇱",
  spain: "🇪🇸",
  italy: "🇮🇹",
  sweden: "🇸🇪",
  norway: "🇳🇴",
  denmark: "🇩🇰",
  finland: "🇫🇮",
  switzerland: "🇨🇭",
  austria: "🇦🇹",
  poland: "🇵🇱",
  portugal: "🇵🇹",
  brazil: "🇧🇷",
  japan: "🇯🇵",
  china: "🇨🇳",
  korea: "🇰🇷",
  singapore: "🇸🇬",
  ireland: "🇮🇪",
  "new zealand": "🇳🇿",
  mexico: "🇲🇽",
  argentina: "🇦🇷",
  "south africa": "🇿🇦",
  nigeria: "🇳🇬",
  kenya: "🇰🇪",
  egypt: "🇪🇬",
  russia: "🇷🇺",
  ukraine: "🇺🇦",
  "czech republic": "🇨🇿",
  hungary: "🇭🇺",
  romania: "🇷🇴",
  greece: "🇬🇷",
  israel: "🇮🇱",
  pakistan: "🇵🇰",
  bangladesh: "🇧🇩",
  indonesia: "🇮🇩",
  malaysia: "🇲🇾",
  vietnam: "🇻🇳",
  thailand: "🇹🇭",
  philippines: "🇵🇭",
};

function getFlagForUniversity(uni: string): string {
  const lower = uni.toLowerCase();
  for (const [keyword, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (lower.includes(keyword)) return flag;
  }
  if (lower.includes("london") || lower.includes("oxford") || lower.includes("cambridge") || lower.includes("imperial") || lower.includes("ucl") || lower.includes("manchester") || lower.includes("edinburgh")) return "🇬🇧";
  if (lower.includes("istanbul") || lower.includes("ankara") || lower.includes("izmir") || lower.includes("bogazici") || lower.includes("bilkent") || lower.includes("metu") || lower.includes("sabanci") || lower.includes("koc") || lower.includes("hacettepe")) return "🇹🇷";
  if (lower.includes("mit") || lower.includes("stanford") || lower.includes("harvard") || lower.includes("berkeley") || lower.includes("nyu") || lower.includes("columbia") || lower.includes("yale") || lower.includes("cornell") || lower.includes("princeton")) return "🇺🇸";
  if (lower.includes("toronto") || lower.includes("waterloo") || lower.includes("mcgill") || lower.includes("ubc")) return "🇨🇦";
  if (lower.includes("melbourne") || lower.includes("sydney") || lower.includes("queensland") || lower.includes("anu") || lower.includes("monash")) return "🇦🇺";
  if (lower.includes("iit") || lower.includes("bits") || lower.includes("nit") || lower.includes("delhi") || lower.includes("mumbai") || lower.includes("bangalore")) return "🇮🇳";
  if (lower.includes("tum") || lower.includes("berlin") || lower.includes("munich") || lower.includes("heidelberg") || lower.includes("hamburg")) return "🇩🇪";
  if (lower.includes("paris") || lower.includes("sorbonne") || lower.includes("ecole") || lower.includes("polytechnique")) return "🇫🇷";
  return "🎓";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [builders, setBuilders] = useState<BuilderScore[]>([]);
  const [universities, setUniversities] = useState<UniversityStat[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      try {
        // Fetch all profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username, university, role, avatar_url");

        if (!profiles || profiles.length === 0) { setLoading(false); return; }

        const allIds = profiles.map((p: { id: string }) => p.id);

        // Fetch aggregate data in parallel
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [projectsRes, connectionsRes, endorsementsRes, weeklyProjectsRes, weeklyConnectionsRes, weeklyEndorsementsRes] = await Promise.all([
          // Total projects per user
          supabase.from("projects").select("owner_id").in("owner_id", allIds),
          // Total connections per user
          supabase.from("connections").select("sender_id, receiver_id").eq("status", "accepted")
            .or(allIds.map((id: string) => `sender_id.eq.${id}`).join(",") + "," + allIds.map((id: string) => `receiver_id.eq.${id}`).join(",")),
          // Total endorsements received per user
          supabase.from("endorsements").select("profile_id").in("profile_id", allIds),
          // Weekly projects
          supabase.from("projects").select("owner_id").in("owner_id", allIds).gte("created_at", oneWeekAgo),
          // Weekly connections
          supabase.from("connections").select("sender_id, receiver_id").eq("status", "accepted").gte("created_at", oneWeekAgo)
            .or(allIds.map((id: string) => `sender_id.eq.${id}`).join(",") + "," + allIds.map((id: string) => `receiver_id.eq.${id}`).join(",")),
          // Weekly endorsements
          supabase.from("endorsements").select("profile_id").in("profile_id", allIds).gte("created_at", oneWeekAgo),
        ]);

        // Build count maps
        const projectCount: Record<string, number> = {};
        (projectsRes.data ?? []).forEach((r: { owner_id: string | null }) => {
          if (r.owner_id) projectCount[r.owner_id] = (projectCount[r.owner_id] ?? 0) + 1;
        });

        const connectionCount: Record<string, number> = {};
        (connectionsRes.data ?? []).forEach((r: { sender_id: string; receiver_id: string }) => {
          connectionCount[r.sender_id] = (connectionCount[r.sender_id] ?? 0) + 1;
          connectionCount[r.receiver_id] = (connectionCount[r.receiver_id] ?? 0) + 1;
        });

        const endorsementCount: Record<string, number> = {};
        (endorsementsRes.data ?? []).forEach((r: { profile_id: string }) => {
          endorsementCount[r.profile_id] = (endorsementCount[r.profile_id] ?? 0) + 1;
        });

        // Weekly counts
        const wProjects: Record<string, number> = {};
        (weeklyProjectsRes.data ?? []).forEach((r: { owner_id: string | null }) => {
          if (r.owner_id) wProjects[r.owner_id] = (wProjects[r.owner_id] ?? 0) + 1;
        });

        const wConnections: Record<string, number> = {};
        (weeklyConnectionsRes.data ?? []).forEach((r: { sender_id: string; receiver_id: string }) => {
          wConnections[r.sender_id] = (wConnections[r.sender_id] ?? 0) + 1;
          wConnections[r.receiver_id] = (wConnections[r.receiver_id] ?? 0) + 1;
        });

        const wEndorsements: Record<string, number> = {};
        (weeklyEndorsementsRes.data ?? []).forEach((r: { profile_id: string }) => {
          wEndorsements[r.profile_id] = (wEndorsements[r.profile_id] ?? 0) + 1;
        });

        // Calculate scores
        const scored: BuilderScore[] = (profiles as { id: string; full_name: string | null; username: string | null; university: string | null; role: string | null; avatar_url: string | null }[]).map((p) => {
          const pc = projectCount[p.id] ?? 0;
          const cc = connectionCount[p.id] ?? 0;
          const ec = endorsementCount[p.id] ?? 0;
          const points = pc * PTS_PROJECT + cc * PTS_CONNECTION + ec * PTS_ENDORSEMENT;
          const weeklyPoints = (wProjects[p.id] ?? 0) * PTS_PROJECT + (wConnections[p.id] ?? 0) * PTS_CONNECTION + (wEndorsements[p.id] ?? 0) * PTS_ENDORSEMENT;
          return { ...p, points, projectCount: pc, connectionCount: cc, endorsementCount: ec, weeklyPoints };
        });

        // Sort by points desc, take top 10
        scored.sort((a, b) => b.points - a.points);
        const top10 = scored.slice(0, 10);
        setBuilders(top10);

        // University stats — count all profiles (not just top 10)
        const uniCount: Record<string, number> = {};
        (profiles as { university: string | null }[]).forEach((p) => {
          if (p.university?.trim()) {
            const key = p.university.trim();
            uniCount[key] = (uniCount[key] ?? 0) + 1;
          }
        });

        const uniList: UniversityStat[] = Object.entries(uniCount)
          .map(([name, count]) => ({ name, count, flag: getFlagForUniversity(name) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setUniversities(uniList);
      } catch (err) {
        console.error("Leaderboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Find the builder with the highest weekly gain (for "Rising" badge)
  const risingId = builders.length > 0
    ? builders.reduce((best, b) => b.weeklyPoints > best.weeklyPoints ? b : best, builders[0]).id
    : null;
  // Only show rising badge if they actually gained points this week
  const risingBuilder = builders.find((b) => b.id === risingId && b.weeklyPoints > 0);

  const rankMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const maxPoints = builders[0]?.points ?? 1;

  return (
    <main style={pageStyle}>
      <div className="page-grid-bg" />
      <div className="page-radial-glow" />
      <div className="page-z" style={{ maxWidth: 900, margin: "0 auto", paddingTop: 80, paddingBottom: 80 }}>

        {/* Header */}
        <div className="animate-fade-up" style={{ marginBottom: 36, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>
          <h1 style={pageTitleStyle}>Top Builders Leaderboard</h1>
          <p style={pageSubtitleStyle}>
            Ranked by points earned from projects, connections, and endorsements
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { pts: `${PTS_PROJECT}pts`, label: "per project" },
              { pts: `${PTS_CONNECTION}pts`, label: "per connection" },
              { pts: `${PTS_ENDORSEMENT}pts`, label: "per endorsement" },
            ].map(({ pts, label }) => (
              <div key={label} style={pointPillStyle}>
                <span style={{ color: "#f0f4f8", fontWeight: 700 }}>{pts}</span>
                <span style={{ color: "#4a5568" }}> {label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Builders Leaderboard */}
        <div className="animate-fade-up animate-delay-1" style={cardStyle}>
          <h2 style={sectionTitleStyle}>Builders</h2>

          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#4a5568", fontSize: 14 }}>Loading leaderboard…</div>
          ) : builders.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#4a5568", fontSize: 14 }}>
              No builders yet. Be the first to build something!
            </div>
          ) : (
            <div style={{ display: "grid", gap: 0 }}>
              {builders.map((builder, idx) => {
                const rank = idx + 1;
                const medal = rankMedal(rank);
                const isTop3 = rank <= 3;
                const isRising = risingBuilder?.id === builder.id;
                const barPct = Math.max(4, Math.round((builder.points / maxPoints) * 100));

                return (
                  <div
                    key={builder.id}
                    className="leaderboard-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 0",
                      borderBottom: idx < builders.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    {/* Rank */}
                    <div style={{
                      width: 36,
                      textAlign: "center",
                      flexShrink: 0,
                      fontSize: isTop3 ? 22 : 15,
                      fontWeight: 700,
                      color: isTop3 ? "white" : "#4a5568",
                      fontFamily: "Syne, sans-serif",
                    }}>
                      {medal ?? `#${rank}`}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: builder.avatar_url ? "transparent" : getAvatarColor(builder.id),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 700, color: "white",
                      overflow: "hidden",
                      border: isTop3 ? `2px solid ${rank === 1 ? "#fbbf24" : rank === 2 ? "#9ca3af" : "#cd7c2d"}` : "2px solid transparent",
                    }}>
                      {builder.avatar_url
                        ? <img src={builder.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                        : getInitials(builder.full_name, builder.username)
                      }
                    </div>

                    {/* Name + university + bar */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        <Link
                          href={builder.username ? `/builders/${builder.username}` : "#"}
                          style={{ fontSize: 15, fontWeight: 700, color: "#f0f4f8", fontFamily: "Syne, sans-serif", textDecoration: "none" }}
                        >
                          {builder.full_name || builder.username || "Builder"}
                        </Link>
                        {isRising && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 10, padding: "2px 7px" }}>
                            ↑ Rising
                          </span>
                        )}
                      </div>
                      {builder.university && (
                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{builder.university}</div>
                      )}
                      {/* Points bar */}
                      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden", maxWidth: 300 }}>
                        <div style={{
                          height: "100%",
                          width: `${barPct}%`,
                          borderRadius: 2,
                          background: rank === 1 ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                            : rank === 2 ? "linear-gradient(90deg, #9ca3af, #d1d5db)"
                            : rank === 3 ? "linear-gradient(90deg, #cd7c2d, #f0a060)"
                            : "linear-gradient(90deg, #6366f1, #818cf8)",
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 16, flexShrink: 0, alignItems: "center" }}>
                      <div className="leaderboard-stat-col" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 11, color: "#4a5568" }}>Projects</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#8b9ab0" }}>{builder.projectCount}</span>
                      </div>
                      <div className="leaderboard-stat-col" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 11, color: "#4a5568" }}>Connects</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#8b9ab0" }}>{builder.connectionCount}</span>
                      </div>
                      <div className="leaderboard-stat-col" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 11, color: "#4a5568" }}>Endorsements</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#8b9ab0" }}>{builder.endorsementCount}</span>
                      </div>
                      {/* Points badge */}
                      <div style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        background: isTop3 ? (rank === 1 ? "rgba(251,191,36,0.12)" : rank === 2 ? "rgba(156,163,175,0.1)" : "rgba(205,124,45,0.1)") : "rgba(99,102,241,0.1)",
                        border: `1px solid ${isTop3 ? (rank === 1 ? "rgba(251,191,36,0.3)" : rank === 2 ? "rgba(156,163,175,0.25)" : "rgba(205,124,45,0.25)") : "rgba(99,102,241,0.25)"}`,
                        minWidth: 64,
                        textAlign: "center",
                      }}>
                        <div style={{
                          fontSize: 16,
                          fontWeight: 800,
                          fontFamily: "Syne, sans-serif",
                          color: isTop3 ? (rank === 1 ? "#fbbf24" : rank === 2 ? "#d1d5db" : "#f0a060") : "#a5b4fc",
                        }}>
                          {builder.points}
                        </div>
                        <div style={{ fontSize: 9, color: "#4a5568", fontWeight: 600 }}>PTS</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Universities */}
        <div className="animate-fade-up animate-delay-2" style={{ ...cardStyle, marginTop: 20 }}>
          <h2 style={sectionTitleStyle}>Top Universities</h2>

          {loading ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "#4a5568", fontSize: 14 }}>Loading…</div>
          ) : universities.length === 0 ? (
            <p style={{ color: "#4a5568", fontSize: 14 }}>No university data yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {universities.map((uni, idx) => {
                const maxCount = universities[0].count;
                const barPct = Math.max(6, Math.round((uni.count / maxCount) * 100));
                return (
                  <div key={uni.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Rank + flag */}
                    <div style={{ width: 28, textAlign: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: "#4a5568" }}>
                      {idx + 1}
                    </div>
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{uni.flag}</div>

                    {/* Name + bar */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#f0f4f8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {uni.name}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", flexShrink: 0, marginLeft: 12 }}>
                          {uni.count} {uni.count === 1 ? "builder" : "builders"}
                        </span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${barPct}%`,
                          borderRadius: 3,
                          background: "linear-gradient(90deg, #6366f1, #818cf8)",
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="animate-fade-up animate-delay-3" style={{ textAlign: "center", marginTop: 32 }}>
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 16 }}>
            Earn points by building projects, growing your network, and getting skill endorsements.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/projects/new" className="btn-primary">+ Create a project</Link>
            <Link href="/builders" className="btn-secondary">Find builders</Link>
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
  color: "white",
  padding: "0 24px",
  position: "relative",
};

const pageTitleStyle: React.CSSProperties = {
  fontSize: "clamp(28px, 4vw, 42px)",
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  color: "#f0f4f8",
  letterSpacing: "-0.03em",
  marginBottom: 8,
};

const pageSubtitleStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: 15,
};

const pointPillStyle: React.CSSProperties = {
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: "5px 14px",
};

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(145deg, #0d1117 0%, #111820 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: "24px 28px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 17,
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  color: "#f0f4f8",
  marginBottom: 20,
};
