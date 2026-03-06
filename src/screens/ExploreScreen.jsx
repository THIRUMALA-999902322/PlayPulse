import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { mockMatches, mockLeagues } from "../data/mockData";
import MatchCard from "../components/MatchCard";

const ExploreScreen = ({ onMatchClick }) => {
  const [matches, setMatches] = useState(mockMatches);
  const [leagues, setLeagues] = useState(mockLeagues);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .order("match_time", { ascending: true });

    const { data: leagueData } = await supabase
      .from("leagues")
      .select("*")
      .order("created_at", { ascending: false });

    if (matchData && matchData.length > 0) {
      const sportEmoji = { Cricket: "🏏", Football: "⚽", Basketball: "🏀", Badminton: "🏸", Tennis: "🎾" };
      setMatches(matchData.map(m => ({
        id: m.id,
        sport: m.sport,
        emoji: sportEmoji[m.sport] || "🏅",
        title: m.title,
        location: m.location,
        distance: "Nearby",
        time: new Date(m.match_time).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" }),
        status: m.status,
        teams: [],
        players: [],
        joined: m.players_joined || 0,
        max: m.players_max || 10,
      })));
    }

    if (leagueData && leagueData.length > 0) {
      setLeagues(leagueData.map(l => ({
        id: l.id,
        name: l.name,
        emoji: l.emoji || "🏆",
        members: l.members || 0,
        matches: l.total_matches || 0,
        sport: l.sport,
      })));
    }
  };

  return (
    <div className="screen scroll-area">
      <div className="header">
        <div className="logo" style={{ fontSize: 20 }}>EXPLORE</div>
        <div className="icon-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">🏆 Active Leagues</div>
          <button className="see-all">Start league</button>
        </div>
        {leagues.map((l, i) => (
          <div key={i} className="league-card">
            <div className="league-icon">{l.emoji}</div>
            <div className="league-info">
              <div className="league-name">{l.name}</div>
              <div className="league-meta">{l.members} players · {l.matches} matches · {l.sport}</div>
            </div>
            <div className="league-arrow">›</div>
          </div>
        ))}
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <div className="section-title">📅 All Matches</div>
        </div>
        {matches.map(m => (
          <MatchCard key={m.id} match={m} onClick={onMatchClick} />
        ))}
      </div>
    </div>
  );
};

export default ExploreScreen;
