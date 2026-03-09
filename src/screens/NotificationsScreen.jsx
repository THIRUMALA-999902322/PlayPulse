import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { theme } from "../styles/theme";

const NotificationsScreen = ({ showToast }) => {
  const { user } = useAuth();
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const list = [];

    if (user) {
      // 1 — Matches I created: who joined them recently
      const { data: myMatches } = await supabase
        .from("matches")
        .select("id, title, match_time, status, players_joined, players_max")
        .eq("created_by", user.id)
        .order("match_time", { ascending: false })
        .limit(10);

      if (myMatches?.length) {
        const { data: joins } = await supabase
          .from("match_players")
          .select("match_id, joined_at, matches(title)")
          .in("match_id", myMatches.map(m => m.id))
          .neq("user_id", user.id)
          .order("joined_at", { ascending: false })
          .limit(15);

        (joins || []).forEach(j => list.push({
          id:   `join-${j.match_id}-${j.joined_at}`,
          icon: "👤",
          title: "New player joined",
          body:  `Someone joined your match "${j.matches?.title || "—"}"`,
          time:  j.joined_at,
          color: theme.accent,
        }));

        // Upcoming matches I created (next 48 h)
        const now   = new Date();
        const in48h = new Date(now.getTime() + 48 * 3600 * 1000);
        myMatches
          .filter(m => new Date(m.match_time) > now && new Date(m.match_time) < in48h)
          .forEach(m => {
            const hrs = Math.round((new Date(m.match_time) - now) / 3600000);
            list.push({
              id:    `mine-${m.id}`,
              icon:  "⏰",
              title: hrs <= 2 ? "⚡ Starting very soon!" : "Your match is soon",
              body:  `"${m.title}" — ${hrs < 1 ? "less than 1 hr" : `${hrs}h`} away · ${m.players_joined}/${m.players_max} players`,
              time:  m.match_time,
              color: hrs <= 2 ? theme.danger : theme.warning,
            });
          });
      }

      // 2 — Matches I joined: upcoming reminders
      const { data: joined } = await supabase
        .from("match_players")
        .select("match_id, matches(title, match_time, status)")
        .eq("user_id", user.id)
        .limit(10);

      (joined || [])
        .filter(j => j.matches && new Date(j.matches.match_time) > new Date())
        .forEach(j => {
          const hrs = Math.round((new Date(j.matches.match_time) - new Date()) / 3600000);
          if (hrs <= 24) {
            list.push({
              id:    `joined-${j.match_id}`,
              icon:  "🏟️",
              title: "Match reminder",
              body:  `"${j.matches.title}" — in ${hrs < 1 ? "< 1h" : `${hrs}h`}`,
              time:  j.matches.match_time,
              color: theme.accent,
            });
          }
        });
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Default welcome card if nothing real
    if (!list.length) {
      list.push(
        { id: "w1", icon: "🎉", title: "Welcome to PlayPulse!", body: "Post your first match — nearby players will be notified in real time.", time: new Date().toISOString(), color: theme.accent },
        { id: "w2", icon: "📍", title: "Allow location",        body: "Turn on GPS for the map to show matches near you.",                    time: new Date(Date.now() - 3600000).toISOString(), color: theme.textMuted },
        { id: "w3", icon: "▶",  title: "Try YouTube Streaming", body: "When creating a match, tap ▶ YouTube to go live and let viewers watch.", time: new Date(Date.now() - 7200000).toISOString(), color: "#FF4444" }
      );
    }

    setNotifs(list);
    setLoading(false);
  };

  const relativeTime = (t) => {
    const diff = Math.floor((Date.now() - new Date(t)) / 1000);
    if (diff < 60)   return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="screen scroll-area">
      <div className="header">
        <div className="logo" style={{ fontSize: 20 }}>NOTIFICATIONS</div>
        {notifs.length > 0 && (
          <button className="see-all" onClick={() => { setNotifs([]); showToast?.("Cleared", "info"); }}>
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><div style={{ color: theme.textMuted, fontSize: 13 }}>Loading…</div></div>
      ) : notifs.map(n => (
        <div key={n.id} style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${theme.border}`,
          display: "flex", gap: 14, alignItems: "flex-start",
          animation: "fadeIn 0.25s ease",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: n.color + "18",
            border: `1px solid ${n.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>
            {n.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3, color: theme.text }}>{n.title}</div>
            <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.55 }}>{n.body}</div>
          </div>
          <div style={{ fontSize: 10, color: theme.textDim, flexShrink: 0, marginTop: 2 }}>{relativeTime(n.time)}</div>
        </div>
      ))}
    </div>
  );
};

export default NotificationsScreen;
