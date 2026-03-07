import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { mockCommentary } from "../data/mockData";
import StatusBadge from "../components/StatusBadge";
import { theme } from "../styles/theme";

const MatchDetailScreen = ({ match, onBack, showToast }) => {
  const { user } = useAuth();
  const [tab, setTab]       = useState("info");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined]   = useState(false);

  // Check-in state: track each player's approved status
  const [checkIns, setCheckIns] = useState([
    { name: "Arjun S.",  status: "approved", av: "A", color: "#00F5A0" },
    { name: "Rahul M.",  status: "pending",  av: "R", color: "#FFB800" },
    { name: "Kiran D.",  status: "approved", av: "K", color: "#A29BFE" },
    { name: "Priya L.",  status: "pending",  av: "P", color: "#FD79A8" },
  ]);

  if (!match) return null;

  // ── JOIN MATCH ──
  const handleJoin = async () => {
    if (!user) {
      showToast?.("Sign in to join matches", "warning");
      return;
    }
    setJoining(true);
    await supabase.from("match_players").insert({ match_id: match.id, user_id: user.id, status: "joined" });
    await supabase.from("matches").update({ players_joined: (match.joined || 0) + 1 }).eq("id", match.id);
    setJoined(true);
    setJoining(false);
    showToast?.("✓ You joined the match!", "success");
  };

  // ── SHARE MATCH ──
  const handleShare = async () => {
    const shareData = {
      title: match.title,
      text:  `Join my match: ${match.title} at ${match.location}`,
      url:   window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); }
      catch { /* user cancelled */ }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      showToast?.("🔗 Link copied to clipboard!", "success");
    }
  };

  // ── APPROVE CHECK-IN ──
  const handleApprove = (index) => {
    setCheckIns(prev => prev.map((c, i) => i === index ? { ...c, status: "approved" } : c));
    showToast?.(`✓ ${checkIns[index].name} approved`, "success");
  };

  return (
    <div className="screen scroll-area">
      <div className="match-hero">
        <div className="back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </div>
        <div className="match-hero-sport">{match.emoji} {match.sport} · {match.distance === "Nearby" ? "Nearby" : `${match.distance} away`}</div>
        <div className="match-hero-title">{match.title}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <StatusBadge status={match.status} />
          {match.status === "live" && <span className="stream-badge">▶ STREAMING</span>}
          <span style={{ fontSize: 11, color: theme.textMuted }}>📍 {match.location}</span>
          <span style={{ fontSize: 11, color: theme.textMuted }}>🕐 {match.time}</span>
        </div>

        {match.status === "live" && match.teams && match.teams.length > 0 && (
          <div className="score-board">
            <div className="team-score">
              <div className="team-name-sm">{match.teams[0].name}</div>
              <div className="score-big">{match.teams[0].score}</div>
              <div className="score-sub">{match.teams[0].overs} overs</div>
            </div>
            <div className="score-vs">
              <div className="vs-text">VS</div>
              <div className="overs-text">Batting</div>
            </div>
            <div className="team-score">
              <div className="team-name-sm">{match.teams[1].name}</div>
              <div className="score-big">{match.teams[1].score}</div>
              <div className="score-sub">{match.teams[1].overs} overs</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[["info", "Info"], ["commentary", "Commentary"], ["checkin", "Check-in"], ["fundraise", "Fundraise"]].map(([k, l]) => (
          <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="section">

        {/* ── INFO TAB ── */}
        {tab === "info" && (
          <>
            <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.7, marginBottom: 16 }}>
              Open pickup match at {match.location}. Everyone welcome — bring your A-game. Fair play rules apply. Ball provided.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {joined ? (
                <button className="submit-btn" style={{ flex: 1, marginTop: 0, background: theme.bgElevated, color: theme.accent, boxShadow: "none" }}>
                  ✓ Joined!
                </button>
              ) : (
                <button className="submit-btn" style={{ flex: 1, marginTop: 0 }} onClick={handleJoin} disabled={joining || match.status === "full"}>
                  {joining ? "Joining..." : match.status === "full" ? "Match Full" : "✓ Join Match"}
                </button>
              )}
              <button
                onClick={handleShare}
                style={{ padding: "12px 20px", background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, color: theme.text, cursor: "pointer", fontFamily: "Outfit, sans-serif", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>
            </div>

            <div className="section-header" style={{ marginTop: 4 }}>
              <div className="section-title" style={{ fontSize: 14 }}>Players ({match.joined}/{match.max})</div>
            </div>
            {(match.players || []).map((p, i) => (
              <div key={i} className="checkin-row">
                <div className="checkin-player">
                  <div className="checkin-av" style={{ background: p.color + "20", color: p.color }}>{p.letter}</div>
                  <div>
                    <div className="checkin-name">Player {p.letter}</div>
                    <span className="rely-badge reliable">✓ Reliable</span>
                  </div>
                </div>
                <button className="checkin-btn checked">✓ In</button>
              </div>
            ))}

            {/* Map preview for this match */}
            {(match.lat || match.lng) && (
              <div style={{ marginTop: 16, borderRadius: 12, overflow: "hidden", height: 120, background: theme.bgCard, border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: theme.textMuted, fontSize: 12 }}>📍 View on map ↑</span>
              </div>
            )}
          </>
        )}

        {/* ── COMMENTARY TAB ── */}
        {tab === "commentary" && (
          <>
            {mockCommentary.map((c, i) => (
              <div key={i} className="commentary-item">
                <div className={`over-badge ${c.type}`}>{c.over}</div>
                <div className="commentary-text" dangerouslySetInnerHTML={{ __html: c.text }} />
              </div>
            ))}
          </>
        )}

        {/* ── CHECK-IN TAB ── */}
        {tab === "checkin" && (
          <>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16 }}>
              Team head approval mode is on. Approve players before they join the roster.
            </div>
            {checkIns.map((c, i) => (
              <div key={i} className="checkin-row">
                <div className="checkin-player">
                  <div className="checkin-av" style={{ background: c.color + "20", color: c.color }}>{c.av}</div>
                  <div>
                    <div className="checkin-name">{c.name}</div>
                    <div className="checkin-status">
                      {c.status === "approved" ? "✓ Checked in" : "⏳ Awaiting approval"}
                    </div>
                  </div>
                </div>
                <button
                  className={`checkin-btn ${c.status === "pending" ? "approve" : "checked"}`}
                  onClick={() => c.status === "pending" && handleApprove(i)}
                  disabled={c.status === "approved"}
                >
                  {c.status === "pending" ? "Approve" : "Approved ✓"}
                </button>
              </div>
            ))}
          </>
        )}

        {/* ── FUNDRAISE TAB ── */}
        {tab === "fundraise" && (
          <>
            <div className="fund-card">
              <div className="fund-header">
                <div>
                  <div className="fund-title">🏏 New Cricket Kit</div>
                  <div className="fund-cause">Equipment · Started by Arjun S.</div>
                </div>
                <div className="fund-goal-tag">£120 goal</div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "73%" }} />
              </div>
              <div className="fund-stats">
                <span className="fund-raised">£88 raised</span>
                <span>12 donors · 3 days left</span>
              </div>
              <div className="donors-row">
                {[["A","#00F5A0"],["R","#FFB800"],["K","#A29BFE"],["M","#FD79A8"],["P","#FF6B6B"]].map(([l,c],i) => (
                  <div key={i} className="donor-chip">
                    <div className="donor-av" style={{ background: c+"30", color: c }}>{l}</div>
                    Donor {l}
                  </div>
                ))}
                <div className="donor-chip">+7 more</div>
              </div>
              <button className="submit-btn" style={{ marginTop: 14, padding: "12px" }}
                onClick={() => showToast?.("💛 Donations coming soon! We're setting up payment processing.", "info")}>
                💛 Donate
              </button>
            </div>

            <div className="fund-card">
              <div className="fund-header">
                <div>
                  <div className="fund-title">👨‍⚖️ Hire Umpire</div>
                  <div className="fund-cause">Officials · Weekend league</div>
                </div>
                <div className="fund-goal-tag">£50 goal</div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "40%" }} />
              </div>
              <div className="fund-stats">
                <span className="fund-raised">£20 raised</span>
                <span>5 donors</span>
              </div>
              <button className="submit-btn" style={{ marginTop: 14, padding: "12px", background: theme.accentSecondary, boxShadow: `0 0 20px ${theme.accentSecondary}40` }}
                onClick={() => showToast?.("💜 Donations coming soon! We're setting up payment processing.", "info")}>
                💜 Contribute
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MatchDetailScreen;
