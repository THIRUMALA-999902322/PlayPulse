import { useState } from "react";
import MatchCard from "../components/MatchCard";
import { useAppData } from "../hooks/useAppData";
import { formatMatchTime } from "../lib/format";
import { theme } from "../styles/theme";

const TABS = [["standings", "📊 Standings"], ["fixtures", "📅 Fixtures"], ["matches", "🏟️ Matches"]];

const LeagueDetailScreen = ({ league, onBack, onOpenMatch }) => {
  const { matches } = useAppData();
  const [tab, setTab] = useState("standings");

  if (!league) return null;
  const leagueMatches = matches.filter((m) => m.leagueId === league.id || (m.kind === "league" && m.sport === league.sport));

  return (
    <div className="screen">
      <div className="match-hero">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="match-hero-sport">{league.emoji} {league.sport} League · {league.members} players</div>
        <div className="match-hero-title">{league.name}</div>
        <div style={{ fontSize: 12, color: theme.textMuted, paddingBottom: 16 }}>{league.season}</div>
      </div>

      <div className="ctx-tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={`ctx-tab ${tab === key ? "on" : ""}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div className="section">
        {tab === "standings" && (
          league.standings?.length ? (
            <div className="sport-portfolio">
              <table className="standings-table">
                <thead>
                  <tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>Pts</th></tr>
                </thead>
                <tbody>
                  {league.standings.map((t, i) => (
                    <tr key={t.team}>
                      <td><span className={`pos-badge ${i === 0 ? "top" : ""}`}>{i + 1}</span></td>
                      <td style={{ fontWeight: 700 }}>{t.team}</td>
                      <td>{t.played}</td>
                      <td style={{ color: theme.accent }}>{t.won}</td>
                      <td style={{ color: theme.danger }}>{t.lost}</td>
                      <td style={{ fontWeight: 800 }}>{t.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-text">Standings appear once results are recorded.</div></div>
          )
        )}

        {tab === "fixtures" && (
          league.fixtures?.length ? league.fixtures.map((f, i) => (
            <div key={i} className="fund-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {f.home} <span style={{ color: theme.textMuted, fontWeight: 400 }}>vs</span> {f.away}
                </div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>📍 {f.venue}</div>
              </div>
              <div style={{ fontSize: 12, color: theme.accent, fontWeight: 700, textAlign: "right", flexShrink: 0 }}>
                {formatMatchTime(f.time)}
              </div>
            </div>
          )) : (
            <div className="empty-state"><div className="empty-icon">📅</div><div className="empty-text">No fixtures scheduled yet.</div></div>
          )
        )}

        {tab === "matches" && (
          leagueMatches.length ? leagueMatches.map((m) => <MatchCard key={m.id} match={m} onOpen={onOpenMatch} />) : (
            <div className="empty-state"><div className="empty-icon">🏟️</div><div className="empty-text">No matches posted for this league yet.</div></div>
          )
        )}
      </div>
    </div>
  );
};

export default LeagueDetailScreen;
