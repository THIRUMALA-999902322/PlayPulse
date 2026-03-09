import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { mockCommentary } from "../data/mockData";
import StatusBadge from "../components/StatusBadge";
import { theme } from "../styles/theme";

// ── Weather helper ───────────────────────────────────────────────────────────
const weatherInfo = (code) => {
  if (code === 0)         return { e: "☀️", d: "Clear sky",      good: true };
  if (code <= 3)          return { e: "⛅", d: "Partly cloudy",  good: true };
  if (code <= 48)         return { e: "🌫️", d: "Foggy",         good: false };
  if (code <= 67)         return { e: "🌧️", d: "Rainy",         good: false };
  if (code <= 77)         return { e: "❄️", d: "Snowy",          good: false };
  if (code <= 82)         return { e: "🌦️", d: "Rain showers",  good: false };
  return                         { e: "⛈️", d: "Thunderstorm",   good: false };
};

const MatchDetailScreen = ({ match, onBack, showToast }) => {
  const { user } = useAuth();
  const [tab, setTab]       = useState("info");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined]   = useState(false);

  // Live player count from Supabase Realtime
  const [liveJoined, setLiveJoined] = useState(match?.joined || 0);
  const [liveStatus, setLiveStatus] = useState(match?.status || "open");

  // Weather
  const [weather, setWeather]     = useState(null);

  // Cancel / Reschedule
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling]           = useState(false);
  const [showReschedule, setShowReschedule]   = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Check-in state
  const [checkIns, setCheckIns] = useState([
    { name: "Arjun S.",  status: "approved", av: "A", color: "#00F5A0" },
    { name: "Rahul M.",  status: "pending",  av: "R", color: "#FFB800" },
    { name: "Kiran D.",  status: "approved", av: "K", color: "#A29BFE" },
    { name: "Priya L.",  status: "pending",  av: "P", color: "#FD79A8" },
  ]);

  const isCreator = user && match?.created_by === user.id;

  // ── Supabase Realtime — live player count ───────────────────────────────
  useEffect(() => {
    if (!match?.id) return;
    const channel = supabase
      .channel(`match-detail-${match.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "matches",
        filter: `id=eq.${match.id}`,
      }, (payload) => {
        setLiveJoined(payload.new.players_joined ?? liveJoined);
        setLiveStatus(payload.new.status ?? liveStatus);
        if (payload.new.status === "cancelled") {
          showToast?.("This match has been cancelled.", "error");
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [match?.id]);

  // ── Weather fetch using Open-Meteo (free, no API key) ──────────────────
  useEffect(() => {
    const fetchWeather = async () => {
      let lat = match?.lat;
      let lng = match?.lng;

      // Fallback: use device GPS
      if (!lat || !lng) {
        try {
          const pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch { return; }
      }

      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto`
        );
        const data = await res.json();
        if (data.current) setWeather(data.current);
      } catch { /* weather unavailable — silently skip */ }
    };

    fetchWeather();
  }, [match?.id]);

  if (!match) return null;

  // ── Join Match ──────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!user) { showToast?.("Sign in to join matches", "warning"); return; }
    setJoining(true);
    await supabase.from("match_players").insert({ match_id: match.id, user_id: user.id, status: "joined" });
    await supabase.from("matches").update({ players_joined: liveJoined + 1 }).eq("id", match.id);
    setJoined(true);
    setJoining(false);
    showToast?.("✓ You joined the match!", "success");
  };

  // ── Share ──────────────────────────────────────────────────────────────
  const handleShare = async () => {
    const shareData = { title: match.title, text: `Join: ${match.title} @ ${match.location}`, url: window.location.href };
    if (navigator.share) { try { await navigator.share(shareData); } catch {} }
    else { await navigator.clipboard.writeText(window.location.href).catch(() => {}); showToast?.("🔗 Link copied!", "success"); }
  };

  // ── Cancel Match ───────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true);
    await supabase.from("matches").update({ status: "cancelled" }).eq("id", match.id);
    setCancelling(false);
    setShowCancelModal(false);
    showToast?.("Match cancelled", "error");
    setTimeout(onBack, 1000);
  };

  // ── Reschedule ─────────────────────────────────────────────────────────
  const handleReschedule = async () => {
    if (!newDate || !newTime) { showToast?.("Choose a new date and time", "warning"); return; }
    setRescheduling(true);
    const newMatchTime = new Date(`${newDate}T${newTime}`).toISOString();
    await supabase.from("matches").update({ match_time: newMatchTime, status: "open" }).eq("id", match.id);
    setRescheduling(false);
    setShowReschedule(false);
    showToast?.("✓ Match rescheduled!", "success");
  };

  // ── Approve Check-in ───────────────────────────────────────────────────
  const handleApprove = (i) => {
    setCheckIns(prev => prev.map((c, idx) => idx === i ? { ...c, status: "approved" } : c));
    showToast?.(`✓ ${checkIns[i].name} approved`, "success");
  };

  const wInfo = weather ? weatherInfo(weather.weathercode) : null;

  return (
    <div className="screen scroll-area">

      {/* ── Cancel Confirmation Modal ── */}
      {showCancelModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => e.target === e.currentTarget && setShowCancelModal(false)}>
          <div style={{ background: theme.bgCard, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 420, border: `1px solid ${theme.border}`, animation: "slideUp 0.3s ease" }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 17, textAlign: "center", marginBottom: 8 }}>Cancel this match?</div>
            <div style={{ color: theme.textMuted, fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
              All {liveJoined} joined players will be notified. This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowCancelModal(false)} style={{ flex: 1, padding: 14, background: theme.bgElevated, border: `1px solid ${theme.border}`, borderRadius: 14, color: theme.text, fontFamily: "Outfit, sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Keep it</button>
              <button onClick={handleCancel} disabled={cancelling} style={{ flex: 1, padding: 14, background: theme.danger, border: "none", borderRadius: 14, color: "white", fontFamily: "Outfit, sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {cancelling ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Modal ── */}
      {showReschedule && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => e.target === e.currentTarget && setShowReschedule(false)}>
          <div style={{ background: theme.bgCard, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 420, border: `1px solid ${theme.border}`, animation: "slideUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>Reschedule Match</div>
              <button onClick={() => setShowReschedule(false)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <div className="form-group row-2" style={{ marginBottom: 16 }}>
              <div>
                <label className="form-label">New Date</label>
                <input className="form-input" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <label className="form-label">New Time</label>
                <input className="form-input" type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
              </div>
            </div>
            <button className="submit-btn" onClick={handleReschedule} disabled={rescheduling}>
              {rescheduling ? "Saving…" : "Confirm Reschedule"}
            </button>
          </div>
        </div>
      )}

      {/* ── Match Hero ── */}
      <div className="match-hero">
        <div className="back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </div>
        <div className="match-hero-sport">{match.emoji} {match.sport} · {match.distance === "Nearby" ? "Nearby" : `${match.distance} away`}</div>
        <div className="match-hero-title">{match.title}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <StatusBadge status={liveStatus} />
          {liveStatus === "live" && (
            <span className={`stream-badge${match.stream_url ? " clickable" : ""}`}
              onClick={() => match.stream_url && window.open(match.stream_url, "_blank")}
              title={match.stream_url ? "Watch live on YouTube" : "Live match"}>
              ▶ {match.stream_url ? "WATCH LIVE" : "STREAMING"}
            </span>
          )}
          <span style={{ fontSize: 11, color: theme.textMuted }}>📍 {match.location}</span>
          <span style={{ fontSize: 11, color: theme.textMuted }}>🕐 {match.time}</span>
        </div>

        {/* Realtime live player counter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: theme.accent, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, color: theme.accent, fontWeight: 600 }}>LIVE · {liveJoined}/{match.max} players joined</span>
        </div>

        {liveStatus === "live" && match.teams?.length > 0 && (
          <div className="score-board">
            <div className="team-score">
              <div className="team-name-sm">{match.teams[0].name}</div>
              <div className="score-big">{match.teams[0].score}</div>
              <div className="score-sub">{match.teams[0].overs} overs</div>
            </div>
            <div className="score-vs"><div className="vs-text">VS</div><div className="overs-text">Batting</div></div>
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
        {[["info","Info"],["commentary","Commentary"],["checkin","Check-in"],["fundraise","Fundraise"]].map(([k,l]) => (
          <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="section">

        {/* ── INFO TAB ── */}
        {tab === "info" && (
          <>
            {/* Weather widget */}
            {wInfo && (
              <div style={{
                background: wInfo.good ? `${theme.accent}10` : `${theme.warning}10`,
                border: `1px solid ${wInfo.good ? theme.accent + "30" : theme.warning + "30"}`,
                borderRadius: 14, padding: "12px 16px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ fontSize: 28 }}>{wInfo.e}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {Math.round(weather.temperature_2m)}°C · {wInfo.d}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                    💨 {Math.round(weather.windspeed_10m)} km/h wind ·{" "}
                    {wInfo.good ? "✓ Good conditions for play" : "⚠ May affect outdoor play"}
                  </div>
                </div>
              </div>
            )}

            <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.7, marginBottom: 16 }}>
              Open pickup match at {match.location}. Everyone welcome — bring your A-game. Fair play rules apply. Ball provided.
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {joined ? (
                <button className="submit-btn" style={{ flex: 1, marginTop: 0, background: theme.bgElevated, color: theme.accent, boxShadow: "none" }}>✓ Joined!</button>
              ) : (
                <button className="submit-btn" style={{ flex: 1, marginTop: 0 }} onClick={handleJoin}
                  disabled={joining || liveStatus === "full" || liveStatus === "cancelled"}>
                  {joining ? "Joining…" : liveStatus === "full" ? "Match Full" : liveStatus === "cancelled" ? "Cancelled" : "✓ Join Match"}
                </button>
              )}
              <button onClick={handleShare} style={{ padding: "12px 18px", background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, color: theme.text, cursor: "pointer", fontFamily: "Outfit, sans-serif", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>
            </div>

            {/* Creator controls */}
            {isCreator && (
              <div style={{ marginBottom: 20, padding: "14px", background: theme.bgElevated, borderRadius: 14, border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Match Controls (You created this)</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setShowReschedule(true)}
                    style={{ flex: 1, padding: "9px 12px", background: theme.bgCard, border: `1px solid ${theme.accent}40`, borderRadius: 10, color: theme.accent, fontFamily: "Outfit, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    📅 Reschedule
                  </button>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    style={{ flex: 1, padding: "9px 12px", background: theme.bgCard, border: `1px solid ${theme.danger}40`, borderRadius: 10, color: theme.danger, fontFamily: "Outfit, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    ✕ Cancel Match
                  </button>
                </div>
              </div>
            )}

            <div className="section-header" style={{ marginTop: 4 }}>
              <div className="section-title" style={{ fontSize: 14 }}>Players ({liveJoined}/{match.max})</div>
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
          </>
        )}

        {/* ── COMMENTARY TAB ── */}
        {tab === "commentary" && mockCommentary.map((c, i) => (
          <div key={i} className="commentary-item">
            <div className={`over-badge ${c.type}`}>{c.over}</div>
            <div className="commentary-text" dangerouslySetInnerHTML={{ __html: c.text }} />
          </div>
        ))}

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
                    <div className="checkin-status">{c.status === "approved" ? "✓ Checked in" : "⏳ Awaiting approval"}</div>
                  </div>
                </div>
                <button className={`checkin-btn ${c.status === "pending" ? "approve" : "checked"}`}
                  onClick={() => c.status === "pending" && handleApprove(i)} disabled={c.status === "approved"}>
                  {c.status === "pending" ? "Approve" : "Approved ✓"}
                </button>
              </div>
            ))}
          </>
        )}

        {/* ── FUNDRAISE TAB ── */}
        {tab === "fundraise" && (
          <>
            {[
              { title: "🏏 New Cricket Kit",  cause: "Equipment · Arjun S.", goal: 120, raised: 88, donors: 12, daysLeft: 3, color: theme.accent },
              { title: "👨‍⚖️ Hire Umpire",      cause: "Officials · Weekend league", goal: 50, raised: 20, donors: 5, daysLeft: null, color: theme.accentSecondary },
            ].map((f, fi) => (
              <div key={fi} className="fund-card">
                <div className="fund-header">
                  <div><div className="fund-title">{f.title}</div><div className="fund-cause">{f.cause}</div></div>
                  <div className="fund-goal-tag">£{f.goal} goal</div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.round(f.raised / f.goal * 100)}%` }} />
                </div>
                <div className="fund-stats">
                  <span className="fund-raised">£{f.raised} raised</span>
                  <span>{f.donors} donors{f.daysLeft ? ` · ${f.daysLeft} days left` : ""}</span>
                </div>
                <button className="submit-btn"
                  style={{ marginTop: 14, padding: "12px", background: f.color, boxShadow: `0 0 20px ${f.color}40` }}
                  onClick={() => showToast?.("💛 Donations coming soon! We're setting up payments.", "info")}>
                  {fi === 0 ? "💛 Donate" : "💜 Contribute"}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default MatchDetailScreen;
