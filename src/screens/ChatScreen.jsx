import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { theme } from "../styles/theme";

const avatarColors = ["#00F5A0", "#FFB800", "#A29BFE", "#FD79A8", "#74B9FF", "#FF6B6B"];
const getColor = (userId) => avatarColors[(userId?.charCodeAt(0) ?? 0) % avatarColors.length];
const getInitials = (username) => (username || "?").slice(0, 2).toUpperCase();

const ChatScreen = ({ showToast }) => {
  const { user } = useAuth();
  const [chatType, setChatType]           = useState("match");
  const [inputVal, setInputVal]           = useState("");
  const [messages, setMessages]           = useState([]);
  const [myMatches, setMyMatches]         = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const bottomRef = useRef(null);

  // ── Fetch matches the user created or joined ──────────────────────────────
  useEffect(() => {
    if (!user) { setLoadingMatches(false); return; }

    const fetchMyMatches = async () => {
      const [{ data: joined }, { data: created }] = await Promise.all([
        supabase
          .from("match_players")
          .select("match_id, matches(id, title, status, match_time, location)")
          .eq("user_id", user.id)
          .order("joined_at", { ascending: false })
          .limit(20),
        supabase
          .from("matches")
          .select("id, title, status, match_time, location")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const joinedMatches = (joined || []).map(j => j.matches).filter(Boolean);
      const createdMatches = created || [];
      // Combine & deduplicate
      const all = [
        ...createdMatches,
        ...joinedMatches.filter(j => !createdMatches.some(c => c.id === j.id)),
      ];
      setMyMatches(all);
      if (all.length > 0) setSelectedMatch(all[0]);
      setLoadingMatches(false);
    };

    fetchMyMatches();
  }, [user]);

  // ── Fetch messages for selected match / chat type ─────────────────────────
  useEffect(() => {
    if (!selectedMatch) { setMessages([]); return; }
    setLoadingMsgs(true);

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, content, created_at, user_id, chat_type, profiles(username)")
        .eq("match_id", selectedMatch.id)
        .eq("chat_type", chatType)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      setLoadingMsgs(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 50);
    };

    fetchMessages();
  }, [selectedMatch, chatType]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedMatch) return;

    const channel = supabase
      .channel(`chat-${selectedMatch.id}-${chatType}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `match_id=eq.${selectedMatch.id}`,
      }, async (payload) => {
        if (payload.new.chat_type !== chatType) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", payload.new.user_id)
          .single();
        setMessages(prev => [...prev, { ...payload.new, profiles: profile }]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedMatch, chatType]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!inputVal.trim()) return;
    if (!user) { showToast?.("Sign in to send messages", "warning"); return; }
    if (!selectedMatch) { showToast?.("Select a match to chat in", "warning"); return; }

    const text = inputVal.trim();
    setInputVal("");

    const { error } = await supabase.from("messages").insert({
      match_id: selectedMatch.id,
      user_id: user.id,
      chat_type: chatType,
      content: text,
    });

    if (error) showToast?.("Couldn't send message", "error");
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") sendMessage(); };

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="screen">
        <div className="chat-header">
          <div style={{ flex: 1 }}>
            <div className="chat-title">Match Chat</div>
            <div className="chat-sub">Sign in to join conversations</div>
          </div>
        </div>
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon">💬</div>
          <div className="empty-text">Sign in to chat with players</div>
        </div>
      </div>
    );
  }

  // ── Still loading ─────────────────────────────────────────────────────────
  if (loadingMatches) {
    return (
      <div className="screen" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading chats...</div>
      </div>
    );
  }

  // ── No matches joined yet ─────────────────────────────────────────────────
  if (myMatches.length === 0) {
    return (
      <div className="screen">
        <div className="chat-header">
          <div style={{ flex: 1 }}>
            <div className="chat-title">Match Chat</div>
            <div className="chat-sub">No matches joined yet</div>
          </div>
        </div>
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon">💬</div>
          <div className="empty-text">Join or create a match to start chatting</div>
        </div>
      </div>
    );
  }

  const matchTitle = selectedMatch?.title || "Match Chat";
  const matchSub = selectedMatch
    ? new Date(selectedMatch.match_time).toLocaleString("en-GB", {
        weekday: "short", day: "numeric", month: "short",
        hour: "2-digit", minute: "2-digit",
      })
    : "";

  return (
    <div className="screen">
      {/* Header */}
      <div className="chat-header">
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div className="chat-title" style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {matchTitle}
          </div>
          <div className="chat-sub">{matchSub}</div>
        </div>
      </div>

      {/* Match selector pill row (when user has multiple matches) */}
      {myMatches.length > 1 && (
        <div style={{ padding: "4px 16px 8px", display: "flex", gap: 8, overflowX: "auto" }}>
          {myMatches.slice(0, 6).map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMatch(m)}
              style={{
                whiteSpace: "nowrap",
                padding: "5px 12px",
                borderRadius: 20,
                border: `1px solid ${selectedMatch?.id === m.id ? theme.accent : theme.border}`,
                background: selectedMatch?.id === m.id ? theme.accentDim : theme.bgCard,
                color: selectedMatch?.id === m.id ? theme.accent : theme.textMuted,
                fontSize: 11,
                fontFamily: "Outfit, sans-serif",
                cursor: "pointer",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {m.title.length > 20 ? m.title.slice(0, 20) + "…" : m.title}
            </button>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="tabs" style={{ position: "sticky", top: 64, zIndex: 40, background: theme.bg }}>
        {[["match", "🌐 Match Chat"], ["team", "🔒 Team Chat"]].map(([k, l]) => (
          <button key={k} className={`tab ${chatType === k ? "active" : ""}`} onClick={() => setChatType(k)}>{l}</button>
        ))}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {loadingMsgs ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24, color: theme.textMuted, fontSize: 13 }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px", gap: 10 }}>
            <div style={{ fontSize: 32 }}>💬</div>
            <div style={{ color: theme.textMuted, fontSize: 13, textAlign: "center" }}>
              No messages yet.<br />Start the conversation!
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.user_id === user.id;
            const uname = m.profiles?.username || "Player";
            const color = getColor(m.user_id);
            const time = new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={m.id} className={`msg-row ${isMe ? "me" : ""}`}>
                {!isMe && (
                  <div className="msg-av" style={{ background: color + "20", color }}>{getInitials(uname)}</div>
                )}
                <div className="msg-bubble">
                  {!isMe && <div className="msg-name">@{uname}</div>}
                  <div className="msg-text">{m.content}</div>
                  <div className="msg-time">{time}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Type a message..."
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="send-btn" onClick={sendMessage}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;
