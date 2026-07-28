import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import MatchCard from "../components/MatchCard";
import StatusBadge from "../components/StatusBadge";
import NotificationsSheet from "../components/NotificationsSheet";
import { buildNotifications } from "../lib/notifications";
import { useAppData } from "../hooks/useAppData";
import { useAuth } from "../hooks/useAuth";
import { sportColor, sportEmoji } from "../lib/constants";
import { displayStatus, distanceLabel, greeting, startsIn } from "../lib/format";
import { theme } from "../styles/theme";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const matchIcon = (emoji, color, isLive) =>
  L.divIcon({
    html: `<div style="
      background:${isLive ? color + "22" : "#0F1320"};
      border:2px solid ${isLive ? color : "#2A3560"};
      border-radius:50%;width:42px;height:42px;
      display:flex;align-items:center;justify-content:center;font-size:22px;
      box-shadow:0 2px 12px rgba(0,0,0,.6)${isLive ? `,0 0 16px ${color}60` : ""};
    ">${emoji}</div>`,
    iconSize: [42, 42], iconAnchor: [21, 21], popupAnchor: [0, -24], className: "",
  });

const meIcon = L.divIcon({
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center">
    <div style="width:20px;height:20px;background:#4A9EFF;border:3px solid #fff;border-radius:50%;box-shadow:0 0 16px #4A9EFF80;z-index:2"></div>
    <div style="position:absolute;width:40px;height:40px;background:#4A9EFF20;border-radius:50%"></div>
  </div>`,
  iconSize: [40, 40], iconAnchor: [20, 20], className: "",
});

/** Exposes the map instance so the recentre button can drive it. */
const MapBridge = ({ onReady }) => {
  const map = useMap();
  useEffect(() => { onReady(map); }, [map, onReady]);
  return null;
};

const KIND_FILTERS = ["All", "Matches", "Leagues", "Practice"];
const KIND_MAP = { Matches: "pickup", Leagues: "league", Practice: "practice" };
const SPORT_CHIPS = ["All", "Cricket", "Football", "Basketball", "Badminton", "Tennis"];

/** Matches without their own coordinates get a stable offset near the viewer. */
const spreadOffsets = [
  [0.0018, 0.0032], [-0.0024, 0.0018], [0.0031, -0.0027],
  [-0.0014, -0.0035], [0.0025, 0.0014], [-0.0036, 0.0024],
  [0.0012, -0.0018], [-0.0029, -0.0012],
];

const MapScreen = ({ onOpenMatch }) => {
  const { matches, userPos, gpsStatus, joinedIds, offline } = useAppData();
  const { user } = useAuth();

  const [kindFilter, setKindFilter] = useState("All");
  const [sportFilter, setSportFilter] = useState("All");
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const mapRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => { if (showSearch) setTimeout(() => searchRef.current?.focus(), 80); }, [showSearch]);

  // Finished games sink to the bottom rather than cluttering "near you now".
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return matches
      .filter((m) =>
        (kindFilter === "All" || m.kind === KIND_MAP[kindFilter]) &&
        (sportFilter === "All" || m.sport === sportFilter) &&
        (!q || m.title.toLowerCase().includes(q) || m.location.toLowerCase().includes(q) || m.sport.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const rank = (m) => (displayStatus(m) === "ended" ? 1 : 0);
        return rank(a) - rank(b) || new Date(a.matchTime) - new Date(b.matchTime);
      });
  }, [matches, kindFilter, sportFilter, search]);

  const needsFilling = (m) => {
    const s = displayStatus(m);
    return (s === "open" || s === "soon") && m.max - m.joined > 0 && m.max - m.joined <= 2;
  };

  const liveMatches = matches.filter((m) => displayStatus(m) === "live");
  const fillCount = matches.filter(needsFilling).length;
  const unread = buildNotifications(matches, joinedIds, user?.id).length;

  const pinned = useMemo(() => {
    if (!userPos) return [];
    return visible
      .filter((m) => displayStatus(m) !== "ended")
      .slice(0, 8)
      .map((m, i) => {
        const [dLat, dLng] = spreadOffsets[i % spreadOffsets.length];
        return { ...m, pinLat: m.lat ?? userPos[0] + dLat, pinLng: m.lng ?? userPos[1] + dLng };
      });
  }, [visible, userPos]);

  const needsPlayers = visible.filter(needsFilling);
  const rest = visible.filter((m) => !needsPlayers.includes(m));

  return (
    <div className="screen">
      <div className="header">
        <div className="logo">PLAY<span>PULSE</span></div>
        <div className="header-actions">
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
          <button className="icon-btn" onClick={() => setShowNotifs(true)} aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && <span className="notif-count">{unread > 9 ? "9+" : unread}</span>}
          </button>
        </div>
      </div>

      {showSearch && (
        <div style={{ padding: "0 20px 12px", animation: "fadeIn .2s ease" }}>
          <input
            ref={searchRef}
            className="form-input"
            placeholder="🔍  Search matches, sports or locations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="greeting">
        <div className="greeting-hi">
          {greeting()}{user ? "" : " 👋"}
          {offline && <span style={{ color: theme.warning }}> · offline mode</span>}
        </div>
        <div className="greeting-line">
          <span>{liveMatches.length} LIVE</span> · {fillCount} FILLING NEAR YOU
        </div>
      </div>

      {liveMatches.length > 0 && (
        <div style={{ padding: "10px 0 14px" }}>
          <div className="live-rail">
            {liveMatches.map((m) => (
              <div key={m.id} className="live-card" onClick={() => onOpenMatch(m, m.streamUrl ? "stream" : "overview")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <StatusBadge status="live" />
                  <span style={{ fontSize: 10, color: theme.textMuted }}>{m.joined}/{m.max} playing</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{m.emoji} {m.title}</div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>📍 {m.location}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="map-container">
        {userPos ? (
          <>
            <MapContainer
              center={userPos}
              zoom={15}
              style={{ height: "100%", width: "100%", background: theme.bg }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={19}
              />
              <MapBridge onReady={(m) => { mapRef.current = m; }} />

              <Marker position={userPos} icon={meIcon}>
                <Popup><strong style={{ fontSize: 12 }}>📍 You are here</strong></Popup>
              </Marker>

              {pinned.map((m) => (
                <Marker
                  key={m.id}
                  position={[m.pinLat, m.pinLng]}
                  icon={matchIcon(m.emoji, sportColor[m.sport] || sportColor.default, m.status === "live")}
                  eventHandlers={{ click: () => onOpenMatch(m) }}
                >
                  <Popup>
                    <div style={{ fontSize: 12, minWidth: 150, lineHeight: 1.6 }}>
                      <strong style={{ fontSize: 13 }}>{m.title}</strong><br />
                      <span style={{ color: theme.textMuted }}>📍 {m.location}</span><br />
                      <span style={{ color: theme.textMuted }}>👥 {m.joined}/{m.max} players</span><br />
                      <button
                        className="join-btn"
                        style={{ marginTop: 6 }}
                        onClick={() => onOpenMatch(m)}
                      >
                        View match →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <button
              className="map-recenter"
              aria-label="Centre map on me"
              onClick={() => mapRef.current?.flyTo(userPos, 15, { duration: 0.8 })}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              </svg>
            </button>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", justifyContent: "center", height: "100%" }}>
            <div style={{ fontSize: 24 }}>📍</div>
            <div style={{ color: theme.textMuted, fontSize: 13 }}>Getting your location…</div>
          </div>
        )}

        <div className="map-overlay-pill">
          {gpsStatus === "ok" ? "📍 Tap a pin to open the match"
            : gpsStatus === "denied" ? "📍 Location off · showing central London"
            : "📍 Getting location…"}
        </div>
      </div>

      <div style={{ paddingTop: 14 }}>
        <div className="segmented">
          {KIND_FILTERS.map((k) => (
            <button key={k} className={`seg-btn ${kindFilter === k ? "on" : ""}`} onClick={() => setKindFilter(k)}>{k}</button>
          ))}
        </div>
        <div className="segmented" style={{ paddingTop: 8 }}>
          {SPORT_CHIPS.map((s) => (
            <button key={s} className={`seg-btn ${sportFilter === s ? "on" : ""}`} onClick={() => setSportFilter(s)}>
              {sportEmoji[s]} {s}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">{search ? `Results for “${search}”` : "Near you now"}</div>
          {(search || kindFilter !== "All" || sportFilter !== "All") ? (
            <button className="see-all" onClick={() => { setSearch(""); setShowSearch(false); setKindFilter("All"); setSportFilter("All"); }}>
              Clear filters
            </button>
          ) : (
            <span style={{ fontSize: 12, color: theme.textMuted }}>{visible.length} found</span>
          )}
        </div>

        {needsPlayers.map((m) => {
          const soon = startsIn(m.matchTime);
          return (
            <div key={m.id} className="quick-fill" onClick={() => onOpenMatch(m)}>
              <div className="quick-fill-icon">{m.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="quick-fill-title">{m.title}</div>
                <div className="quick-fill-sub">📍 {m.location} · {distanceLabel(userPos, m.lat, m.lng)}</div>
                {soon && <div className="expiry-chip">⏳ Starts in {soon}</div>}
              </div>
              <div className="need-badge">Need {m.max - m.joined}</div>
            </div>
          );
        })}

        {rest.map((m) => <MatchCard key={m.id} match={m} onOpen={onOpenMatch} />)}

        {visible.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <div className="empty-text">No games match these filters. Post one and get it filled.</div>
          </div>
        )}
      </div>

      {showNotifs && (
        <NotificationsSheet
          onClose={() => setShowNotifs(false)}
          onOpenMatch={(id) => {
            const m = matches.find((x) => x.id === id);
            if (m) onOpenMatch(m);
          }}
        />
      )}
    </div>
  );
};

export default MapScreen;
