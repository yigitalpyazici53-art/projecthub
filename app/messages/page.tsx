"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/utils/getInitials";
import type { Profile, Message } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAvatarColor(id: string): string {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  return colors[id.charCodeAt(0) % colors.length];
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / (86400 * 30))}mo ago`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface Conversation {
  partner: Profile;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b9ab0", fontSize: 14 }}>Loading…</div>}>
      <MessagesInner />
    </Suspense>
  );
}

function MessagesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const myId = user?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const activeConv = conversations.find((c) => c.partner.id === activePartnerId) ?? null;

  // ── Load conversations (connected users + any existing messages) ───────────
  const loadConversations = useCallback(async (uid: string) => {
    const supabase = createClient();
    // Get all accepted connections
    const { data: conns } = await supabase
      .from("connections")
      .select("sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`);

    if (!conns || conns.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const partnerIds = [...new Set(
      conns.map((c: { sender_id: string; receiver_id: string }) =>
        c.sender_id === uid ? c.receiver_id : c.sender_id
      )
    )];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, university, role, bio, skills, interests, github_url, avatar_url")
      .in("id", partnerIds);

    if (!profiles) { setLoading(false); return; }

    // Get last message and unread count per conversation
    const convList: Conversation[] = await Promise.all(
      (profiles as Profile[]).map(async (partner) => {
        const { data: msgs } = await supabase
          .from("messages")
          .select("content, created_at, read, sender_id")
          .or(
            `and(sender_id.eq.${uid},receiver_id.eq.${partner.id}),` +
            `and(sender_id.eq.${partner.id},receiver_id.eq.${uid})`
          )
          .order("created_at", { ascending: false })
          .limit(1);

        const last = msgs?.[0];

        const { count: unread } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("sender_id", partner.id)
          .eq("receiver_id", uid)
          .eq("read", false);

        return {
          partner,
          lastMessage: last?.content ?? "",
          lastTime: last?.created_at ?? "",
          unreadCount: unread ?? 0,
        };
      })
    );

    // Sort by last message time (most recent first), unstarted at bottom
    convList.sort((a, b) => {
      if (!a.lastTime && !b.lastTime) return 0;
      if (!a.lastTime) return 1;
      if (!b.lastTime) return -1;
      return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime();
    });

    setConversations(convList);
    setLoading(false);
  }, []);

  // ── Auth + initial load ────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?next=/messages");
      return;
    }
    loadConversations(user.id);
  }, [authLoading, user, router, loadConversations]);

  // ── Open conversation from ?with= query param ──────────────────────────────
  useEffect(() => {
    const withId = searchParams.get("with");
    if (withId && conversations.length > 0) {
      // Ensure this partner exists in our conversations
      const found = conversations.find((c) => c.partner.id === withId);
      if (found) setActivePartnerId(withId);
    } else if (withId) {
      setActivePartnerId(withId);
    }
  }, [searchParams, conversations]);

  // ── Load messages for active conversation ─────────────────────────────────
  useEffect(() => {
    if (!activePartnerId || !myId) return;
    const supabase = createClient();

    const loadMessages = async () => {
      setMsgLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at, read")
        .or(
          `and(sender_id.eq.${myId},receiver_id.eq.${activePartnerId}),` +
          `and(sender_id.eq.${activePartnerId},receiver_id.eq.${myId})`
        )
        .order("created_at", { ascending: true });

      setMessages((data ?? []) as Message[]);
      setMsgLoading(false);

      // Mark received messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", activePartnerId)
        .eq("receiver_id", myId)
        .eq("read", false);

      // Update unread count in conversations list
      setConversations((prev) =>
        prev.map((c) =>
          c.partner.id === activePartnerId ? { ...c, unreadCount: 0 } : c
        )
      );
    };

    loadMessages();

    // Realtime subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${[myId, activePartnerId].sort().join("_")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${myId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id !== activePartnerId) return;
          setMessages((prev) => [...prev, msg]);
          // Mark as read immediately
          supabase
            .from("messages")
            .update({ read: true })
            .eq("id", msg.id)
            .then(() => {});
          // Update conversation list
          setConversations((prev) =>
            prev.map((c) =>
              c.partner.id === activePartnerId
                ? { ...c, lastMessage: msg.content, lastTime: msg.created_at, unreadCount: 0 }
                : c
            )
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePartnerId, myId]);

  // ── Scroll to bottom when messages change ─────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputText.trim() || !myId || !activePartnerId || sending) return;
    setSending(true);
    setSendError("");
    const supabase = createClient();
    const content = inputText.trim();
    setInputText("");

    const optimistic: Message = {
      id: crypto.randomUUID(),
      sender_id: myId,
      receiver_id: activePartnerId,
      content,
      created_at: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    const { error } = await supabase.from("messages").insert({
      sender_id: myId,
      receiver_id: activePartnerId,
      content,
    });

    if (error) {
      setSendError("Failed to send message.");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.partner.id === activePartnerId
            ? { ...c, lastMessage: content, lastTime: optimistic.created_at }
            : c
        )
      );
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div style={{ color: "#8b9ab0", fontSize: 14 }}>Loading conversations…</div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div className="messages-layout" style={layoutStyle}>
        {/* ── Left: conversation list ── */}
        <div className="messages-sidebar" style={sidebarStyle}>
          <div style={sidebarHeaderStyle}>
            <h1 style={sidebarTitleStyle}>Messages</h1>
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
              <span style={unreadBadgeStyle}>
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
              </span>
            )}
          </div>

          {conversations.length === 0 ? (
            <div style={emptyConvStyle}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ marginBottom: 18 }}>
                <rect x="6" y="12" width="32" height="24" rx="6" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
                <rect x="18" y="22" width="32" height="24" rx="6" fill="rgba(99,102,241,0.06)" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5"/>
                <circle cx="16" cy="24" r="2" fill="rgba(165,180,252,0.55)"/>
                <circle cx="23" cy="24" r="2" fill="rgba(165,180,252,0.55)"/>
                <circle cx="30" cy="24" r="2" fill="rgba(165,180,252,0.55)"/>
              </svg>
              <p style={{ color: "var(--text-primary, #e2e8f0)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>No conversations yet</p>
              <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: 12, lineHeight: 1.6, marginBottom: 18 }}>
                Connect with builders to start messaging.
              </p>
              <a href="/connections" style={{ fontSize: 13, color: "var(--accent-bright)", textDecoration: "none", fontWeight: 600 }}>
                Browse Connections →
              </a>
            </div>
          ) : (
            <div style={{ overflowY: "auto", flex: 1 }}>
              {conversations.map((conv) => (
                <button
                  key={conv.partner.id}
                  type="button"
                  onClick={() => setActivePartnerId(conv.partner.id)}
                  style={{
                    ...convItemStyle,
                    background: activePartnerId === conv.partner.id
                      ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                      : "transparent",
                    borderLeft: activePartnerId === conv.partner.id
                      ? "3px solid var(--accent)"
                      : "3px solid transparent",
                  }}
                >
                  {/* Avatar */}
                  <div style={{ ...avatarSmallStyle, background: conv.partner.avatar_url ? "transparent" : getAvatarColor(conv.partner.id), flexShrink: 0 }}>
                    {conv.partner.avatar_url ? (
                      <img src={conv.partner.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    ) : (
                      getInitials(conv.partner.full_name, conv.partner.username)
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {conv.partner.full_name || conv.partner.username || "Builder"}
                      </span>
                      {conv.lastTime && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}>
                          {timeAgo(conv.lastTime)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {conv.lastMessage || "Start a conversation…"}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span style={convUnreadBadgeStyle}>{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: chat window ── */}
        <div className="messages-chat" style={chatAreaStyle}>
          {!activePartnerId ? (
            <div style={noChatStyle}>
              <svg width="88" height="88" viewBox="0 0 88 88" fill="none" style={{ marginBottom: 24 }}>
                <circle cx="44" cy="44" r="42" stroke="rgba(99,102,241,0.12)" strokeWidth="1.5" strokeDasharray="6 3"/>
                <rect x="18" y="28" width="34" height="26" rx="7" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5"/>
                <rect x="36" y="38" width="34" height="26" rx="7" fill="rgba(99,102,241,0.06)" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5"/>
                <circle cx="28" cy="41" r="2" fill="rgba(165,180,252,0.6)"/>
                <circle cx="35" cy="41" r="2" fill="rgba(165,180,252,0.6)"/>
                <circle cx="42" cy="41" r="2" fill="rgba(165,180,252,0.6)"/>
              </svg>
              <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, color: "var(--text-primary, #e2e8f0)", marginBottom: 8 }}>
                Your messages
              </h2>
              <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: 14, maxWidth: 260, lineHeight: 1.65 }}>
                Select a conversation on the left to read and send messages.
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              {activeConv && (
                <div style={chatHeaderStyle}>
                  <div style={{ ...avatarSmallStyle, background: activeConv.partner.avatar_url ? "transparent" : getAvatarColor(activeConv.partner.id) }}>
                    {activeConv.partner.avatar_url ? (
                      <img src={activeConv.partner.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    ) : (
                      getInitials(activeConv.partner.full_name, activeConv.partner.username)
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Syne, sans-serif" }}>
                      {activeConv.partner.full_name || activeConv.partner.username}
                    </div>
                    {activeConv.partner.role && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{activeConv.partner.role}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div style={messagesAreaStyle}>
                {msgLoading ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, paddingTop: 40 }}>
                    Loading messages…
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", paddingTop: 64 }}>
                    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ marginBottom: 14, opacity: 0.65 }}>
                      <path d="M26 6C15.507 6 7 13.611 7 23c0 4.587 1.935 8.756 5.088 11.79L9 43l9.26-2.94A20.01 20.01 0 0026 41c10.493 0 19-7.611 19-18S36.493 6 26 6z"
                        fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" strokeLinejoin="round"/>
                      <circle cx="19" cy="23" r="2" fill="rgba(165,180,252,0.6)"/>
                      <circle cx="26" cy="23" r="2" fill="rgba(165,180,252,0.6)"/>
                      <circle cx="33" cy="23" r="2" fill="rgba(165,180,252,0.6)"/>
                    </svg>
                    <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: 13 }}>No messages yet — say hello!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => {
                      const isMe = msg.sender_id === myId;
                      const showDate =
                        i === 0 ||
                        new Date(msg.created_at).toDateString() !==
                          new Date(messages[i - 1].created_at).toDateString();
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div style={dateDividerStyle}>
                              <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                              <span style={{ padding: "0 12px", fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                {new Date(msg.created_at).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                              </span>
                              <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 6 }}>
                            <div
                              style={{
                                maxWidth: "70%",
                                padding: "10px 14px",
                                borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                background: isMe
                                  ? "linear-gradient(135deg, var(--accent), var(--accent-hover))"
                                  : "var(--surface-raised)",
                                color: isMe ? "white" : "var(--text-primary)",
                                fontSize: 14,
                                lineHeight: 1.55,
                                border: isMe ? "none" : "1px solid rgba(255,255,255,0.1)",
                                boxShadow: isMe ? "0 2px 12px var(--accent-glow)" : "0 1px 4px rgba(0,0,0,0.3)",
                              }}
                            >
                              <div>{msg.content}</div>
                              <div style={{ fontSize: 10, color: isMe ? "rgba(255,255,255,0.6)" : "var(--text-muted)", marginTop: 4, textAlign: "right" }}>
                                {formatTime(msg.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Input bar */}
              <div style={inputBarStyle}>
                {sendError && (
                  <p style={{ color: "#f87171", fontSize: 12, marginBottom: 6, paddingLeft: 4 }}>{sendError}</p>
                )}
                <div style={inputContainerStyle}>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message… (Enter to send)"
                    rows={1}
                    style={textareaStyle}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() || sending}
                    style={{
                      ...sendBtnStyle,
                      opacity: !inputText.trim() || sending ? 0.5 : 1,
                      cursor: !inputText.trim() || sending ? "default" : "pointer",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
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
  paddingTop: 68,
};

const layoutStyle: React.CSSProperties = {
  display: "flex",
  height: "calc(100vh - 68px)",
  overflow: "hidden",
};

const sidebarStyle: React.CSSProperties = {
  width: 300,
  minWidth: 240,
  borderRight: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column",
  background: "var(--surface)",
};

const sidebarHeaderStyle: React.CSSProperties = {
  padding: "22px 18px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const sidebarTitleStyle: React.CSSProperties = {
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  fontSize: 18,
  color: "var(--text-primary, #f0f4f8)",
  letterSpacing: "-0.02em",
};

const unreadBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 20,
  height: 20,
  borderRadius: 10,
  background: "var(--accent)",
  color: "white",
  fontSize: 11,
  fontWeight: 700,
  padding: "0 5px",
  boxShadow: "0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent)",
};

const emptyConvStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 24px",
  textAlign: "center",
};

const convItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px",
  width: "100%",
  border: "none",
  cursor: "pointer",
  transition: "background 0.15s ease",
  outline: "none",
};

const avatarSmallStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 700,
  color: "white",
  overflow: "hidden",
  flexShrink: 0,
};

const convUnreadBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  background: "var(--accent)",
  color: "white",
  fontSize: 10,
  fontWeight: 700,
  padding: "0 4px",
  marginLeft: 8,
  flexShrink: 0,
};

const chatAreaStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "var(--background, #080c14)",
};

const noChatStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 40,
  textAlign: "center",
};

const chatHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 24px",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  background: "var(--surface)",
  flexShrink: 0,
  boxShadow: "0 1px 0 rgba(255,255,255,0.04)",
};

const messagesAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "24px 28px",
  display: "flex",
  flexDirection: "column",
};

const dateDividerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  margin: "16px 0 12px",
};

const inputBarStyle: React.CSSProperties = {
  padding: "12px 20px 18px",
  borderTop: "1px solid rgba(255,255,255,0.07)",
  background: "var(--surface)",
  flexShrink: 0,
};

const inputContainerStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "flex-end",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 14,
  padding: "6px 6px 6px 16px",
};

const textareaStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 0",
  background: "transparent",
  border: "none",
  color: "var(--text-primary, #f0f4f8)",
  fontSize: 14,
  outline: "none",
  resize: "none",
  lineHeight: 1.5,
  fontFamily: "DM Sans, sans-serif",
  minHeight: 36,
  maxHeight: 120,
};

const sendBtnStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
  border: "none",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  transition: "opacity 0.15s ease",
  boxShadow: "0 2px 10px var(--accent-glow)",
};
