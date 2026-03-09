import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../lib/supabase";
import MatchCard from "../components/MatchCard";
import { theme } from "../styles/theme";

// Fix leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const sportColor = {
  Cricket: theme.accent,
  Football: "#FF6B6B",
  Basketball: "#FFB800",
  Badminton: "#A29BFE",
  Tennis: "#55EFC4",
  default: "#74B9FF",
};

const createMatchIcon = (emoji, color, isLive) =>
  L.divIcon({
    html: `<div style="
      background:${isLive ? color + "22" : "#0F1320"};
      border:2px solid ${isLive ? color : "#2A3560"};
      border-radius:50%;
      width:42px;height:42px;
      display:flex;align-items:center;justify-content:center;
      font-size:22px;
      box-shadow:0 2px 12px rgba(0,0,0,0.6)${isLive ? `,0 0 16px ${color}60` : ""};
      cursor:pointer;
      transition:all 0.2s;
    ">${emoji}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -24],
    className: "",
  });

const userLocationIcon = L.divIcon({
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center">
    <div style="width:20px;height:20px;background:#4A9EFF;border:3px solid white;border-radius:50%;box-shadow:0 0 16px #4A9EFF80;z-index:2"></div>
    <div style="position:absolute;width:40px;height:40px;background:#4A9EFF20;border-radius:50%;animation:pulse 2s infinite"></div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  className: "",
});

// Component that keeps map centred on user when GPS updates
const RecenterMap = ({ pos }) => {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, map.getZoom(), { animate: true, duration: 1.2 });
  }, [pos, map]);
  return null;
};

// Small random offset so clustered matches don't overlap exactly
const jitter = (i) => {
  const offsets = [
    [0.0018, 0.0032], [-0.0024, 0.0018], [0.0031, -0.0027],
    [-0.0014, -0.0035], [0.0025, 0.0014], [-0.0036, 0.0024],
  ];
  return offsets[i % offsets.length];
};

const HomeScreen = ({ onMatchClick, showToast, onNavigate }) => {
  const [activeSport, setActiveSport] = useState("All");
  const [matches, setMatches]         = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [userPos, setUserPos]         = useState(null);
  const [gpsStatus, setGpsStatus]     = useState("loading"); // loading | ok | denied
  const [showSearch, setShowSearch]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);

  const sports     = ["All", "Cricket", "Football", "Basketball", "Badminton", "Tennis"];
  const sportEmoji = { All: "🌐", Cricket: "🏏", Football: "⚽", Basketball: "🏀", Badminton: "🏸", Tennis: "🎾" };

  // Get user GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserPos([51.5074, -0.1278]); // default: London
      setGpsStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserPos([coords.latitude, coords.longitude]);
        setGpsStatus("ok");
      },
      () => {
        setUserPos([51.5074, -0.1278]);
        setGpsStatus("denied");
      },
      { timeout: 8000 }
    );
  }, []);

  // Focus search input when it opens
  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 100);
  }, [showSearch]);

  useEffect(() => { fetchMatches(); }, []);

  // Realtime: live-update player counts + status without a page refresh
  useEffect(() => {
    const channel = supabase
      .channel("home-matches-rt")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          setMatches(prev =>
            prev.map(m =>
              m.id === payload.new.id
                ? {
                    ...m,
                    joined:   payload.new.players_joined,
                    max:      payload.new.players_max,
                    status:   payload.new.status,
                    need:     payload.new.players_max - payload.new.players_joined,
                    needFill: (payload.new.players_max - payload.new.players_joined) >= 2,
                  }
                : m
            )
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false });

    setLoadingMatches(false);
    if (!error && data && data.length > 0) {
      const formatted = data.map(m => ({
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
        needFill: (m.players_max - m.players_joined) >= 2,
        need:     m.players_max - m.players_joined,
        lat:        m.lat || null,
        lng:        m.lng || null,
        stream_url: m.stream_url || null,
        created_by: m.created_by || null,
      }));
      setMatches(formatted);
    }
  };

  // Build map markers — use real lat/lng if present, else spread around user
  const mapMatches = userPos
    ? matches.slice(0, 8).map((m, i) => {
        const [dlat, dlng] = jitter(i);
        return {
          ...m,
          lat: m.lat || userPos[0] + dlat,
          lng: m.lng || userPos[1] + dlng,
        };
      })
    : [];

  const filtered = matches.filter(m => {
    const sportMatch = activeSport === "All" || m.sport === activeSport;
    const searchMatch = !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.location.toLowerCase().includes(searchQuery.toLowerCase());
    return sportMatch && searchMatch;
  });

  return (
    <div className="screen scroll-area">
      <div className="header">
        <div className="logo">PLAY<span>PULSE</span></div>
        <div className="header-actions">

          {/* Search toggle */}
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

          {/* Notification bell → navigates to Notifications screen */}
          <div className="icon-btn" style={{ position: "relative" }} onClick={() => onNavigate?.("notifications")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="notif-dot" />
          </div>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{ padding: "0 16px 12px", animation: "fadeIn 0.2s ease" }}>
          <input
            ref={searchRef}
            className="form-input"
            placeholder="🔍  Search matches or locations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>
      )}

      {/* ── LIVE MAP ── */}
      <div className="map-container" style={{ position: "relative" }}>
        {userPos ? (
          <MapContainer
            key={`map-${userPos[0].toFixed(4)}-${userPos[1].toFixed(4)}`}
            center={userPos}
            zoom={15}
            style={{ height: "100%", width: "100%", background: "#080B14" }}
            zoomControl={false}
            attributionControl={false}
          >
            {/* Dark CartoCD tiles — matches our dark theme */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />

            <RecenterMap pos={userPos} />

            {/* User position */}
            <Marker position={userPos} icon={userLocationIcon}>
              <Popup>
                <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 12, minWidth: 110 }}>
                  <strong>📍 You are here</strong>
                </div>
              </Popup>
            </Marker>

            {/* Match markers */}
            {mapMatches.map(m => (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={createMatchIcon(m.emoji, sportColor[m.sport] || sportColor.default, m.status === "live")}
                eventHandlers={{ click: () => onMatchClick(m) }}
              >
                <Popup>
                  <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 12, minWidth: 140, lineHeight: 1.6 }}>
                    <strong style={{ fontSize: 13 }}>{m.title}</strong><br />
                    <span style={{ color: "#888" }}>📍 {m.location}</span><br />
                    <span style={{ color: "#888" }}>👥 {m.joined}/{m.max} players</span><br />
                    <span style={{ color: m.status === "live" ? "#00F5A0" : m.status === "full" ? "#FF4757" : "#FFB800" }}>
                      ● {m.status.toUpperCase()}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 24 }}>📍</div>
            <div style={{ color: theme.textMuted, fontSize: 13 }}>Getting your location...</div>
          </div>
        )}

        {/* Overlay pill */}
        <div className="map-overlay-pill">
          {gpsStatus === "ok" ? "📍 Live map · Tap a pin to view match" : gpsStatus === "denied" ? "📍 Location access denied · Showing London" : "📍 Getting location..."}
        </div>
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
          <div className="section-title">
            {searchQuery ? `Search: "${searchQuery}"` : "Nearby Matches"}
          </div>
          {searchQuery && (
            <button className="see-all" onClick={() => { setSearchQuery(""); setShowSearch(false); }}>
              Clear
            </button>
          )}
        </div>
        {loadingMatches ? (
          <div className="empty-state">
            <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading matches...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏟️</div>
            <div className="empty-text">
              {searchQuery ? `No matches found for "${searchQuery}"` : activeSport !== "All" ? `No ${activeSport} matches nearby` : "No matches yet — create one!"}
            </div>
          </div>
        ) : (
          filtered.map(m => <MatchCard key={m.id} match={m} onClick={onMatchClick} />)
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
