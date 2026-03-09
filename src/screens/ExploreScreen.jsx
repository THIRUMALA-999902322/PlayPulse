import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { mockMatches, mockLeagues } from "../data/mockData";
import MatchCard from "../components/MatchCard";
import { theme } from "../styles/theme";

const ExploreScreen = ({ onMatchClick, showToast }) => {
  const [matches, setMatches]         = useState(mockMatches);
  const [leagues, setLeagues]         = useState(mockLeagues);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch]   = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [activeTab, setActiveTab]     = useState("matches"); // "matches" | "leaderboard"
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbLoading, setLbLoading]     = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: matchData }  = await supabase.from("matches").select("*").order("match_time", { ascending: true });
    const { data: leagueData } = await supabase.from("leagues").select("*").order("created_at", { ascending: false });
    const sportEmoji = { Cricket: "🏏", Football: "⚽", Basketball: "🏀", Badminton: "🏸", Tennis: "🎾" };

    if (matchData && matchData.length > 0) {
      setMatches(matchData.map(m => ({
        id:       m.id,
        sport:    m.sport,
        emoji:    sportEmoji[m.sport] || "🏅",
        title:    m.title,
        location: m.location,
        distance: "Nearby",
        time:     new Date(m.match_time).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" }),
        status:   m.status,
        teams:    [],
        players:  [],
        joined:     m.players_joined || 0,
        max:        m.players_max || 10,
        stream_url: m.stream_url || null,
        created_by: m.created_by || null,
      })));
    }

    if (leagueData && leagueData.length > 0) {
      setLeagues(leagueData.map(l => ({
        id:      l.id,
        name:    l.name,
        emoji:   l.emoji || "🏆",
        members: l.members || 0,
        matches: l.total_matches || 0,
        sport:   l.sport,
      })));
    }
  };

  const fetchLeaderboard = async () => {
    setLbLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, matches_played, reliability_score, bio")
      .order("matches_played", { ascending: false })
      .limit(20);
    setLeaderboard(data || []);
    setLbLoading(false);
  };

  // Load leaderboard when tab is first selected
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "leaderboard" && leaderboard.length === 0) fetchLeaderboard();
  };

  const filteredMatches = matches.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.title.toLowerCase().includes(q) || m.location.toLowerCase().includes(q) || m.sport.toLowerCase().includes(q);
  });

  const displayMatches = selectedLeague
    ? filteredMatches.filter(m => m.sport === selectedLeague.sport)
    : filteredMatches;

  const rankMedal = (i) => {
    if (i === 0) return { label: "🥇", cls: "gold" };
    if (i === 1) return { label: "🥈", cls: "silver" };
    if (i === 2) return { label: "🥉", cls: "bronze" };
    return { label: `${i + 1}`, cls: "" };
  };

  return (
    <div className="screen scroll-area">
      <div className="header">
        <div className="logo" style={{ fontSize: 20 }}>EXPLORE</div>
        <div className="header-actions">
          {activeTab === "matches" && (
            <div
              className="icon-btn"
              onClick={() => setShowSearch(v => !v)}
              style={{ borderColor: showSearch ? theme.accent : undefined, color: showSearch ? theme.accent : undefined }}
            >
              {showSearch ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="explore-tabs">
        <button className={`tab ${activeTab === "matches" ? "active" : ""}`} onClick={() => handleTabChange("matches")}>
          📅 Matches
        </button>
        <button className={`tab ${activeTab === "leaderboard" ? "active" : ""}`} onClick={() => handleTabChange("leaderboard")}>
          🏆 Leaderboard
        </button>
      </div>

      {/* ── MATCHES TAB ── */}
      {activeTab === "matches" && (
        <>
          {/* Search bar */}
          {showSearch && (
            <div style={{ padding: "0 16px 12px", animation: "fadeIn 0.2s ease" }}>
              <input
                className="form-input"
                placeholder="🔍  Search matches, sports, locations..."
                value={searchQuery}
                autoFocus
                onChange={e => setSearchQuery(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
          )}

          {/* Active League selected banner */}
          {selectedLeague && (
            <div style={{ margin: "0 16px 8px", background: theme.accentDim, border: `1px solid ${theme.accent}30`, borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {selectedLeague.emoji} {selectedLeague.name}
              </div>
              <button
                onClick={() => setSelectedLeague(null)}
                style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: 18, fontFamily: "Outfit, sans-serif", lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Leagues */}
          <div className="section">
            <div className="section-header">
              <div className="section-title">🏆 Active Leagues</div>
              <button className="see-all" onClick={() => showToast?.("🏆 League creation coming soon!", "info")}>
                Start League
              </button>
            </div>
            {leagues.map((l, i) => (
              <div
                key={i}
                className="league-card"
                onClick={() => {
                  setSelectedLeague(l.id === selectedLeague?.id ? null : l);
                  showToast?.(`${l.emoji} Showing ${l.sport} matches for ${l.name}`, "info");
                }}
                style={{
                  cursor: "pointer",
                  borderColor: selectedLeague?.id === l.id ? theme.accent : undefined,
                  background: selectedLeague?.id === l.id ? theme.accentDim : undefined,
                  transition: "all 0.2s",
                }}
              >
                <div className="league-icon">{l.emoji}</div>
                <div className="league-info">
                  <div className="league-name">{l.name}</div>
                  <div className="league-meta">{l.members} players · {l.matches} matches · {l.sport}</div>
                </div>
                <div className="league-arrow" style={{ color: selectedLeague?.id === l.id ? theme.accent : undefined }}>›</div>
              </div>
            ))}
          </div>

          {/* All Matches */}
          <div className="section" style={{ paddingTop: 0 }}>
            <div className="section-header">
              <div className="section-title">
                {selectedLeague ? `${selectedLeague.emoji} ${selectedLeague.name} Matches` : searchQuery ? `Results for "${searchQuery}"` : "📅 All Matches"}
              </div>
              {(searchQuery || selectedLeague) && (
                <button className="see-all" onClick={() => { setSearchQuery(""); setSelectedLeague(null); setShowSearch(false); }}>
                  Clear
                </button>
              )}
            </div>
            {displayMatches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏟️</div>
                <div className="empty-text">
                  {searchQuery ? `No matches found for "${searchQuery}"` : "No matches in this league yet"}
                </div>
              </div>
            ) : (
              displayMatches.map(m => <MatchCard key={m.id} match={m} onClick={onMatchClick} />)
            )}
          </div>
        </>
      )}

      {/* ── LEADERBOARD TAB ── */}
      {activeTab === "leaderboard" && (
        <div className="section">
          <div className="section-header">
            <div className="section-title">🏅 Top Players</div>
            <button className="see-all" onClick={() => { setLeaderboard([]); fetchLeaderboard(); }}>
              Refresh
            </button>
          </div>

          {lbLoading ? (
            <div className="empty-state">
              <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading...</div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏅</div>
              <div className="empty-text" style={{ marginBottom: 8 }}>No players ranked yet</div>
              <div style={{ fontSize: 12, color: theme.textDim }}>Play matches to climb the leaderboard!</div>
            </div>
          ) : (
            <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "0 16px", marginBottom: 16 }}>
              {leaderboard.map((p, i) => {
                const { label, cls } = rankMedal(i);
                const initials = (p.username || "?").slice(0, 2).toUpperCase();
                return (
                  <div key={p.id} className="lb-row" style={{ borderBottom: i === leaderboard.length - 1 ? "none" : undefined }}>
                    <div className={`lb-rank ${cls}`}>{label}</div>
                    <div className="lb-avatar">{initials}</div>
                    <div className="lb-info">
                      <div className="lb-name">@{p.username || "player"}</div>
                      <div className="lb-sub">
                        {p.bio
                          ? p.bio.slice(0, 30) + (p.bio.length > 30 ? "…" : "")
                          : `Reliability ${p.reliability_score ?? 100}%`}
                      </div>
                    </div>
                    <div className="lb-score">
                      <div className="lb-score-val">{p.matches_played ?? 0}</div>
                      <div className="lb-score-label">MATCHES</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reliability sub-leaderboard teaser */}
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.accent, marginBottom: 6 }}>⭐ MOST RELIABLE</div>
            {leaderboard.length === 0 ? (
              <div style={{ fontSize: 12, color: theme.textMuted }}>Play matches to earn a reliability score.</div>
            ) : (
              [...leaderboard]
                .sort((a, b) => (b.reliability_score ?? 100) - (a.reliability_score ?? 100))
                .slice(0, 3)
                .map((p, i) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 2 ? `1px solid ${theme.border}` : "none" }}>
                    <div style={{ fontSize: 14 }}>{["🥇","🥈","🥉"][i]}</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>@{p.username || "player"}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: theme.accent }}>{p.reliability_score ?? 100}%</div>
                  </div>
                ))
            )}
          </div>

          <div style={{ fontSize: 11, color: theme.textDim, textAlign: "center", padding: "4px 0 12px" }}>
            Reliability score improves each time you show up to a match you joined.
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreScreen;
