import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { theme } from "../styles/theme";

const CreateScreen = ({ showToast }) => {
  const { user } = useAuth();
  const [selectedSport, setSelectedSport] = useState("Cricket");
  const [matchType, setMatchType]         = useState("Friendly");
  const [gearNeeded, setGearNeeded]       = useState(["Ball"]);
  const [approvalMode, setApprovalMode]   = useState(false);
  const [privacy, setPrivacy]             = useState("Public");
  const [submitted, setSubmitted]         = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");

  // Form fields
  const [title, setTitle]               = useState("");
  const [date, setDate]                 = useState("");
  const [time, setTime]                 = useState("");
  const [location, setLocation]         = useState("");
  const [playersNeeded, setPlayersNeeded] = useState(10);
  const [rules, setRules]               = useState("");

  // Streaming
  const [youtubeEnabled, setYoutubeEnabled] = useState(false);
  const [youtubeUrl, setYoutubeUrl]         = useState("");
  const [inAppStream, setInAppStream]       = useState(false);

  const sports = [["🏏","Cricket"],["⚽","Football"],["🏀","Basketball"],["🏸","Badminton"],["🎾","Tennis"],["🏐","Volleyball"],["🏑","Hockey"],["🏓","Table Tennis"]];
  const types  = ["Friendly", "League", "Practice", "Tournament"];
  const gear   = ["Ball", "Cones", "Net", "Bibs"];

  const toggleGear = (g) => setGearNeeded(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  // Non-blocking GPS grab
  const getGPS = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
        ()          => resolve({ lat: null, lng: null }),
        { timeout: 5000 }
      );
    });

  // Toggle YouTube — opens YouTube Studio immediately on first click
  const handleYouTubeToggle = () => {
    if (!youtubeEnabled) {
      setYoutubeEnabled(true);
      window.open("https://studio.youtube.com/", "_blank");
      showToast?.("▶ YouTube Studio opened — start your stream there, then paste the URL below", "info");
    } else {
      setYoutubeEnabled(false);
      setYoutubeUrl("");
    }
  };

  const handleSubmit = async () => {
    if (!title || !date || !time || !location) {
      setError("Please fill in all required fields (Title, Date, Time, Location).");
      return;
    }

    setLoading(true);
    setError("");

    const gpsPromise = getGPS();
    const matchTime  = new Date(`${date}T${time}`).toISOString();
    const { lat, lng } = await gpsPromise;

    const { error: dbError } = await supabase.from("matches").insert({
      sport:          selectedSport,
      title,
      location,
      match_time:     matchTime,
      players_max:    parseInt(playersNeeded),
      players_joined: 0,
      match_type:     matchType,
      rules,
      gear_needed:    gearNeeded,
      approval_mode:  approvalMode,
      privacy,
      status:         "open",
      created_by:     user?.id || null,
      lat,
      lng,
      stream_url:     youtubeUrl || null,
    });

    setLoading(false);
    if (dbError) console.error("DB Error:", dbError.message);

    setSubmitted(true);
    showToast?.("⚡ Match posted! Nearby players will be notified.", "success");
  };

  const resetForm = () => {
    setSubmitted(false);
    setTitle(""); setDate(""); setTime(""); setLocation(""); setRules("");
    setSelectedSport("Cricket"); setMatchType("Friendly");
    setGearNeeded(["Ball"]); setApprovalMode(false);
    setPrivacy("Public"); setPlayersNeeded(10);
    setYoutubeEnabled(false); setYoutubeUrl(""); setInAppStream(false);
  };

  if (submitted) {
    return (
      <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div className="match-hero-title" style={{ marginBottom: 8 }}>Match Posted!</div>
        <div style={{ color: theme.textMuted, fontSize: 14, marginBottom: 24 }}>
          Your match is now live on the map. Nearby players will be notified.
        </div>
        <div style={{ background: theme.accentDim, border: `1px solid ${theme.accent}30`, borderRadius: 14, padding: "14px 20px", marginBottom: youtubeUrl ? 12 : 24, width: "100%", textAlign: "left" }}>
          <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700, marginBottom: 6 }}>MATCH CREATED</div>
          <div style={{ fontWeight: 700 }}>{title || selectedSport} · {matchType}</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>📍 {location || "Location set"}</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Auto-expires in 3 hours if not filled</div>
        </div>
        {youtubeUrl && (
          <div style={{ background: "#FF000012", border: "1px solid #FF444430", borderRadius: 14, padding: "12px 16px", marginBottom: 24, width: "100%", textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "#FF4444", fontWeight: 700, marginBottom: 6 }}>🔴 LIVE STREAM</div>
            <button
              onClick={() => window.open(youtubeUrl, "_blank")}
              style={{ background: "#FF0000", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}
            >
              ▶ Open YouTube Stream
            </button>
          </div>
        )}
        <button className="submit-btn" style={{ width: "100%" }} onClick={resetForm}>Post Another</button>
      </div>
    );
  }

  return (
    <div className="screen scroll-area">
      <div className="header">
        <div className="logo" style={{ fontSize: 20 }}>NEW MATCH</div>
      </div>
      <div className="create-screen">
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

        {/* Sport */}
        <div className="form-group">
          <label className="form-label">Sport</label>
          <div className="sport-picker">
            {sports.map(([e, s]) => (
              <button key={s} className={`sport-pick-btn ${selectedSport === s ? "selected" : ""}`} onClick={() => setSelectedSport(s)}>
                <span>{e}</span><span>{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label">Match Title *</label>
          <input className="form-input" placeholder={`e.g. Sunday ${selectedSport} at the Park`} value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Date & Time — keyboard entry now works thanks to color-scheme:dark CSS */}
        <div className="form-group row-2">
          <div>
            <label className="form-label">Date *</label>
            <input
              className="form-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div>
            <label className="form-label">Time *</label>
            <input
              className="form-input"
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* Location */}
        <div className="form-group">
          <label className="form-label">Location / Ground *</label>
          <input className="form-input" placeholder="📍 Enter location or ground name" value={location} onChange={e => setLocation(e.target.value)} />
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
            📡 GPS coordinates saved automatically so your match appears on the map.
          </div>
        </div>

        {/* Players & Type */}
        <div className="form-group row-2">
          <div>
            <label className="form-label">Players Needed</label>
            <select className="form-select" value={playersNeeded} onChange={e => setPlayersNeeded(e.target.value)}>
              {[2,4,6,8,10,11,14,22].map(n => <option key={n} value={n}>{n} players</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Match Type</label>
            <select className="form-select" value={matchType} onChange={e => setMatchType(e.target.value)}>
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Rules */}
        <div className="form-group">
          <label className="form-label">Rules & Safety</label>
          <textarea className="form-input" rows={3} placeholder="Fair play rules, safety instructions..." style={{ resize: "none", lineHeight: 1.5 }} value={rules} onChange={e => setRules(e.target.value)} />
        </div>

        {/* Gear */}
        <div className="form-group">
          <label className="form-label">Gear Needed</label>
          <div className="toggle-group">
            {gear.map(g => (
              <button key={g} className={`toggle-btn ${gearNeeded.includes(g) ? "on" : ""}`} onClick={() => toggleGear(g)}>{g}</button>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="form-group">
          <label className="form-label">Privacy</label>
          <div className="toggle-group">
            {["Public", "Friends", "Invite Only"].map(p => (
              <button key={p} className={`toggle-btn ${privacy === p ? "on" : ""}`} onClick={() => setPrivacy(p)}>{p}</button>
            ))}
          </div>
        </div>

        {/* Check-in mode */}
        <div className="form-group">
          <label className="form-label">Check-in Mode</label>
          <div className="toggle-group">
            <button className={`toggle-btn ${!approvalMode ? "on" : ""}`} onClick={() => setApprovalMode(false)}>Self Check-in</button>
            <button className={`toggle-btn ${approvalMode ? "on" : ""}`} onClick={() => setApprovalMode(true)}>Team Head Approves</button>
          </div>
        </div>

        {/* ── Streaming ── */}
        <div className="form-group">
          <label className="form-label">Streaming (optional)</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${inAppStream ? "on" : ""}`}
              onClick={() => {
                setInAppStream(v => !v);
                showToast?.("📱 In-app streaming coming soon!", "info");
              }}
            >
              📱 In-App Stream
            </button>
            <button
              className={`toggle-btn ${youtubeEnabled ? "on" : ""}`}
              onClick={handleYouTubeToggle}
            >
              {youtubeEnabled ? "▶ YouTube ✓" : "▶ YouTube"}
            </button>
          </div>

          {/* YouTube URL input — shown after toggling YouTube */}
          {youtubeEnabled && (
            <div style={{ marginTop: 12, padding: "14px", background: "#FF000010", border: "1px solid #FF444430", borderRadius: 12, animation: "fadeIn 0.2s ease" }}>
              <div style={{ fontSize: 12, color: "#FF7777", fontWeight: 600, marginBottom: 8 }}>
                🔴 YouTube Studio opened in a new tab
              </div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10 }}>
                1. In YouTube Studio → click <strong style={{ color: theme.text }}>Go Live</strong><br/>
                2. Once your stream is running, copy the YouTube URL<br/>
                3. Paste it here so match viewers can watch
              </div>
              <input
                className="form-input"
                placeholder="https://youtube.com/live/..."
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              {youtubeUrl && (
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={{ background: "#FF0000", color: "white", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}
                    onClick={() => window.open(youtubeUrl, "_blank")}
                  >
                    ▶ Test Link
                  </button>
                  <button
                    type="button"
                    style={{ background: theme.bgCard, color: theme.textMuted, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontFamily: "Outfit, sans-serif" }}
                    onClick={() => window.open("https://studio.youtube.com/", "_blank")}
                  >
                    Open Studio ↗
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "📡 Getting location & posting..." : "⚡ Post Match Now"}
        </button>
      </div>
    </div>
  );
};

export default CreateScreen;
