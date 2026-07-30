import { useEffect, useMemo, useRef, useState } from "react";
import MatchCard from "../components/MatchCard";
import { useAppData } from "../hooks/useAppData";
import { useAuth } from "../hooks/useAuth";
import { tappable } from "../lib/a11y";
import { theme } from "../styles/theme";

const SEGMENTS = ["All", "Pickup", "Leagues", "Practice", "Mine"];
const SEG_KIND = { Pickup: "pickup", Leagues: "league", Practice: "practice" };

const MatchesScreen = ({ onOpenMatch, onOpenLeague }) => {
  const { matches, leagues, joinedIds, loadLeaderboard, leaderboard } = useAppData();
  const { user } = useAuth();

  const [seg, setSeg] = useState("All");
  const [tab, setTab] = useState("matches"); // matches | leaderboard
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [lbLoading, setLbLoading] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => { if (showSearch) setTimeout(() => searchRef.current?.focus(), 80); }, [showSearch]);

  const refreshLeaderboard = async () => {
    setLbLoading(true);
    await loadLeaderboard();
    setLbLoading(false);
  };

  useEffect(() => {
    if (tab === "leaderboard" && leaderboard.length === 0) refreshLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return matches.filter((m) => {
      const bySeg =
        seg === "All" ? true :
        // "Mine" covers both sides of involvement: joined and organised.
        seg === "Mine" ? joinedIds.includes(m.id) || (!!user && m.createdBy === user.id) :
        m.kind === SEG_KIND[seg];
      const bySearch = !q || m.title.toLowerCase().includes(q) || m.location.toLowerCase().includes(q) || m.sport.toLowerCase().includes(q);
      return bySeg && bySearch;
    });
  }, [matches, seg, search, joinedIds, user]);

  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`);

  return (
    <div className="screen">
      <div className="header">
        <div className="screen-title">MATCHES</div>
        <div className="header-actions">
          {tab === "matches" && (
            <button
              className="icon-btn"
              onClick={() => setShowSearch((v) => !v)}
              aria-label={showSearch ? "Close search" : "Search matches"}
              style={showSearch ? { borderColor: theme.accent, color: theme.accent } : undefined}
            >
              {showSearch
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
            </button>
          )}
        </div>
      </div>

      <div className="segmented" style={{ paddingTop: 14 }}>
        <button className={`seg-btn ${tab === "matches" ? "on" : ""}`} onClick={() => setTab("matches")}>📅 Matches</button>
        <button className={`seg-btn ${tab === "leaderboard" ? "on" : ""}`} onClick={() => setTab("leaderboard")}>🏆 Leaderboard</button>
      </div>

      {tab === "matches" ? (
        <>
          {showSearch && (
            <div style={{ padding: "12px 20px 0", animation: "fadeIn .2s ease" }}>
              <input
                ref={searchRef}
                className="form-input"
                placeholder="🔍  Search matches, sports or locations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          <div className="segmented" style={{ paddingTop: 12 }}>
            {SEGMENTS.map((s) => (
              <button key={s} className={`seg-btn ${seg === s ? "on" : ""}`} onClick={() => setSeg(s)}>{s}</button>
            ))}
          </div>

          {(seg === "All" || seg === "Leagues") && leagues.length > 0 && (
            <div className="section" style={{ paddingBottom: 0 }}>
              <div className="section-header">
                <div className="section-title">🏆 Active Leagues</div>
              </div>
              {leagues.map((l) => (
                <div key={l.id} className="league-card" {...tappable(() => onOpenLeague(l), `${l.name} league`)}>
                  <div className="league-icon">{l.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="league-name">{l.name}</div>
                    <div className="league-meta">{l.members} players · {l.season || l.sport}</div>
                  </div>
                  <div style={{ color: theme.textMuted, fontSize: 20 }}>›</div>
                </div>
              ))}
            </div>
          )}

          <div className="section">
            <div className="section-header">
              <div className="section-title">
                {search ? `Results for “${search}”` : seg === "All" ? "📅 All Activity" : seg === "Mine" ? "📅 My Matches" : `📅 ${seg}`}
              </div>
              {(search || seg !== "All") && (
                <button className="see-all" onClick={() => { setSearch(""); setShowSearch(false); setSeg("All"); }}>Clear</button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏟️</div>
                <div className="empty-text">
                  {seg === "Mine" ? "Nothing yet — join a match or post one with the + button." : "Nothing here yet."}
                </div>
              </div>
            ) : (
              filtered.map((m) => <MatchCard key={m.id} match={m} onOpen={onOpenMatch} />)
            )}
          </div>
        </>
      ) : (
        <div className="section">
          <div className="section-header">
            <div className="section-title">🏅 Top Players</div>
            <button className="see-all" onClick={refreshLeaderboard} disabled={lbLoading}>
              {lbLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {lbLoading ? (
            <div className="empty-state"><div style={{ fontSize: 13 }}>Loading…</div></div>
          ) : leaderboard.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏅</div>
              <div className="empty-text" style={{ marginBottom: 6 }}>No players ranked yet</div>
              <div style={{ fontSize: 12, color: theme.textDim }}>Join matches to climb the table.</div>
            </div>
          ) : (
            <>
              <div className="sport-portfolio">
                {leaderboard.map((p, i) => (
                  <div key={p.id} className="lb-row">
                    <div className="lb-rank">{medal(i)}</div>
                    <div className="lb-avatar">{(p.username || "PP").slice(0, 2).toUpperCase()}</div>
                    <div className="lb-info">
                      <div className="lb-name">@{p.username || "player"}</div>
                      <div className="lb-sub">
                        {p.bio ? p.bio.slice(0, 34) + (p.bio.length > 34 ? "…" : "") : `Reliability ${p.reliability_score ?? 100}%`}
                      </div>
                    </div>
                    <div className="lb-score">
                      <div className="lb-score-val">{p.matches_played ?? 0}</div>
                      <div className="lb-score-label">MATCHES</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: theme.textDim, textAlign: "center", padding: "4px 0 12px", lineHeight: 1.6 }}>
                Reliability rises each time you check in to a match you joined.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchesScreen;
