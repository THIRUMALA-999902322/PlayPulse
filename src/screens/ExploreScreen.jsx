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
        joined:   m.players_joined || 0,
        max:      m.players_max || 10,
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

  const filteredMatches = matches.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.title.toLowerCase().includes(q) || m.location.toLowerCase().includes(q) || m.sport.toLowerCase().includes(q);
  });

  const displayMatches = selectedLeague
    ? filteredMatches.filter(m => m.sport === selectedLeague.sport)
    : filteredMatches;

  return (
    <div className="screen scroll-area">
      <div className="header">
        <div className="logo" style={{ fontSize: 20 }}>EXPLORE</div>
        <div className="header-actions">
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
        </div>
      </div>

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
    </div>
  );
};

export default ExploreScreen;
