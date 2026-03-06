import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { mockMatches } from "../data/mockData";
import MatchCard from "../components/MatchCard";
import { theme } from "../styles/theme";

const SportIcon = ({ s }) => {
  const map = { Cricket: "🏏", Football: "⚽", Basketball: "🏀", Badminton: "🏸", Tennis: "🎾", Volleyball: "🏐" };
  return map[s] || "🏅";
};

const sportColor = {
  Cricket: theme.accent,
  Football: "#FF6B6B",
  Basketball: "#FFB800",
  Badminton: "#A29BFE",
};

const HomeScreen = ({ onMatchClick }) => {
  const [activeSport, setActiveSport] = useState("All");
  const [matches, setMatches] = useState(mockMatches);
  const sports = ["All", "Cricket", "Football", "Basketball", "Badminton", "Tennis"];
  const sportEmoji = { All: "🌐", Cricket: "🏏", Football: "⚽", Basketball: "🏀", Badminton: "🏸", Tennis: "🎾" };

  const pins = [
    { x: "22%", y: "35%", sport: "Cricket", label: "T10 Match", players: 12, active: true, delay: "0s" },
    { x: "55%", y: "50%", sport: "Football", label: "5-a-side", players: 8, delay: "0.1s" },
    { x: "70%", y: "25%", sport: "Basketball", label: "3v3 Pickup", players: 4, delay: "0.2s" },
    { x: "40%", y: "70%", sport: "Badminton", label: "Doubles", players: 4, delay: "0.15s" },
  ];

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      // Map DB rows to app format
      const formatted = data.map(m => ({
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
        needFill: (m.players_max - m.players_joined) >= 2,
        need: m.players_max - m.players_joined,
      }));
      setMatches(formatted);
    }
    // If error or no data, keep using mockMatches
  };

  const filtered = activeSport === "All" ? matches : matches.filter(m => m.sport === activeSport);

  return (
    <div className="screen scroll-area">
      <div className="header">
        <div className="logo">PLAY<span>PULSE</span></div>
        <div className="header-actions">
          <div className="icon-btn" style={{ position: "relative" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="notif-dot" />
          </div>
          <div className="icon-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="map-container">
        <div className="map-bg" />
        <div className="map-road-h" style={{ top: "40%" }} />
        <div className="map-road-h" style={{ top: "65%" }} />
        <div className="map-road-v" style={{ left: "35%" }} />
        <div className="map-road-v" style={{ left: "65%" }} />
        <div className="my-location" style={{ left: "50%", top: "55%", transform: "translate(-50%,-50%)" }} />

        {pins.map((pin, i) => (
          <div key={i} className="map-pin" style={{ left: pin.x, top: pin.y, animationDelay: pin.delay }}>
            <div className={`map-pin-bubble ${pin.active ? "active" : ""}`}>
              <span className="map-pin-dot" style={{ background: sportColor[pin.sport] || theme.accent }} />
              <span className="map-pin-emoji"><SportIcon s={pin.sport} /></span>
              <div>
                <div className="map-pin-label" style={{ color: pin.active ? theme.accent : theme.text }}>{pin.label}</div>
                <div className="map-pin-count">{pin.players} players</div>
              </div>
            </div>
            <div className="pin-tail" />
          </div>
        ))}
        <div className="map-overlay-pill">📍 Showing games within 2 miles</div>
      </div>

      {/* Sport filter */}
      <div style={{ padding: "16px 0 0" }}>
        <div className="hscroll">
          {sports.map(s => (
            <button key={s} className={`sport-chip ${activeSport === s ? "active" : ""}`} onClick={() => setActiveSport(s)}>
              <div className="sport-chip-icon">{sportEmoji[s]}</div>
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick fill */}
      {filtered.filter(m => m.needFill).length > 0 && (
        <div className="section" style={{ paddingBottom: 0 }}>
          <div className="section-header">
            <div className="section-title">⚡ Quick Fill Needed</div>
          </div>
          {filtered.filter(m => m.needFill).map(m => (
            <div key={m.id} className="quick-fill" onClick={() => onMatchClick(m)}>
              <div className="quick-fill-icon">{m.emoji}</div>
              <div className="quick-fill-info">
                <div className="quick-fill-title">{m.title}</div>
                <div className="quick-fill-sub">📍 {m.location} · {m.distance}</div>
              </div>
              <div className="need-badge">Need {m.need}</div>
            </div>
          ))}
        </div>
      )}

      {/* Nearby matches */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Nearby Matches</div>
          <button className="see-all">See all</button>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏟️</div>
            <div className="empty-text">No {activeSport} matches nearby</div>
          </div>
        ) : (
          filtered.map(m => <MatchCard key={m.id} match={m} onClick={onMatchClick} />)
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
