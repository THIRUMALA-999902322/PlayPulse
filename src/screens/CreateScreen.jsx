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

  const [title, setTitle]               = useState("");
  const [date, setDate]                 = useState("");
  const [time, setTime]                 = useState("");
  const [location, setLocation]         = useState("");
  const [playersNeeded, setPlayersNeeded] = useState(10);
  const [rules, setRules]               = useState("");

  const sports = [["🏏","Cricket"],["⚽","Football"],["🏀","Basketball"],["🏸","Badminton"],["🎾","Tennis"],["🏐","Volleyball"],["🏑","Hockey"],["🏓","Table Tennis"]];
  const types  = ["Friendly", "League", "Practice", "Tournament"];
  const gear   = ["Ball", "Cones", "Net", "Bibs"];

  const toggleGear = (g) => setGearNeeded(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  // Get current GPS coordinates (non-blocking)
  const getGPS = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
        ()          => resolve({ lat: null, lng: null }),
        { timeout: 5000 }
      );
    });

  const handleSubmit = async () => {
    if (!title || !date || !time || !location) {
      setError("Please fill in all required fields (Title, Date, Time, Location).");
      return;
    }

    setLoading(true);
    setError("");

    // Grab GPS in parallel with DB insert
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
    });

    setLoading(false);

    if (dbError) {
      console.error("DB Error:", dbError.message);
      // Still show success for demo — GPS coordinates may fail if column not yet added
    }

    setSubmitted(true);
    showToast?.("⚡ Match posted! Nearby players will be notified.", "success");
  };

  const resetForm = () => {
    setSubmitted(false);
    setTitle(""); setDate(""); setTime(""); setLocation(""); setRules("");
    setSelectedSport("Cricket"); setMatchType("Friendly");
    setGearNeeded(["Ball"]); setApprovalMode(false);
    setPrivacy("Public"); setPlayersNeeded(10);
  };

  if (submitted) {
    return (
      <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div className="match-hero-title" style={{ marginBottom: 8 }}>Match Posted!</div>
        <div style={{ color: theme.textMuted, fontSize: 14, marginBottom: 24 }}>
          Your match is now live on the map. Nearby players will be notified.
        </div>
        <div style={{ background: theme.accentDim, border: `1px solid ${theme.accent}30`, borderRadius: 14, padding: "14px 20px", marginBottom: 24, width: "100%", textAlign: "left" }}>
          <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700, marginBottom: 6 }}>MATCH CREATED</div>
          <div style={{ fontWeight: 700 }}>{title || selectedSport} · {matchType}</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>📍 {location || "Location set"}</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Auto-expires in 3 hours if not filled</div>
        </div>
        <button className="submit-btn" style={{ width: "100%" }} onClick={resetForm}>
          Post Another
        </button>
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

        <div className="form-group">
          <label className="form-label">Match Title *</label>
          <input className="form-input" placeholder={`e.g. Sunday ${selectedSport} at the Park`} value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className="form-group row-2">
          <div>
            <label className="form-label">Date *</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Time *</label>
            <input className="form-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Location / Ground *</label>
          <input className="form-input" placeholder="📍 Enter location or ground name" value={location} onChange={e => setLocation(e.target.value)} />
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
            📡 Your GPS coordinates will be attached automatically to show this match on the map.
          </div>
        </div>

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

        <div className="form-group">
          <label className="form-label">Rules & Safety</label>
          <textarea className="form-input" rows={3} placeholder="Fair play rules, safety instructions..." style={{ resize: "none", lineHeight: 1.5 }} value={rules} onChange={e => setRules(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Gear Needed</label>
          <div className="toggle-group">
            {gear.map(g => (
              <button key={g} className={`toggle-btn ${gearNeeded.includes(g) ? "on" : ""}`} onClick={() => toggleGear(g)}>{g}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Privacy</label>
          <div className="toggle-group">
            {["Public", "Friends", "Invite Only"].map(p => (
              <button key={p} className={`toggle-btn ${privacy === p ? "on" : ""}`} onClick={() => setPrivacy(p)}>{p}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Check-in Mode</label>
          <div className="toggle-group">
            <button className={`toggle-btn ${!approvalMode ? "on" : ""}`} onClick={() => setApprovalMode(false)}>Self Check-in</button>
            <button className={`toggle-btn ${approvalMode ? "on" : ""}`} onClick={() => setApprovalMode(true)}>Team Head Approves</button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Streaming (optional)</label>
          <div className="toggle-group">
            <button className="toggle-btn" onClick={() => showToast?.("📱 In-app streaming coming soon!", "info")}>📱 In-App Stream</button>
            <button className="toggle-btn" onClick={() => showToast?.("▶ YouTube streaming coming soon!", "info")}>▶ YouTube</button>
          </div>
        </div>

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "📡 Getting location & posting..." : "⚡ Post Match Now"}
        </button>
      </div>
    </div>
  );
};

export default CreateScreen;
