import { useState } from "react";
import { useAppData } from "../hooks/useAppData";
import {
  GEAR_OPTIONS, MATCH_TYPES, PRIVACY_OPTIONS, RECURRENCE_OPTIONS, SKILL_LEVELS, SPORTS,
} from "../lib/constants";
import { youtubeEmbed } from "../lib/format";
import { theme } from "../styles/theme";

const todayISO = () => new Date().toISOString().split("T")[0];

/** Resolves once with coordinates or nulls — never blocks posting. */
const getGPS = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 5000 }
    );
  });

const CreateScreen = ({ onDone, onOpenMatch }) => {
  const { createMatch, notify, userPos } = useAppData();

  const [sport, setSport] = useState("Cricket");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [playersMax, setPlayersMax] = useState(10);
  const [matchType, setMatchType] = useState("Friendly");
  const [skill, setSkill] = useState("All levels");
  const [rules, setRules] = useState("");
  const [gear, setGear] = useState(["Ball"]);
  const [privacy, setPrivacy] = useState("Public");
  const [recurrence, setRecurrence] = useState("Once");
  const [approvalMode, setApprovalMode] = useState(false);
  const [streamOn, setStreamOn] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const toggleGear = (g) => setGear((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const validate = () => {
    const next = {};
    if (!title.trim()) next.title = "Give the match a name players will recognise.";
    if (!date) next.date = "Pick a date.";
    if (!time) next.time = "Pick a start time.";
    if (!location.trim()) next.location = "Where is it being played?";
    if (date && time) {
      const when = new Date(`${date}T${time}`);
      if (Number.isNaN(when.getTime())) next.date = "That date and time isn't valid.";
      else if (when.getTime() < Date.now() - 60000) next.date = "That's in the past — pick a future slot.";
    }
    if (streamOn && streamUrl.trim() && !youtubeEmbed(streamUrl.trim())) {
      next.stream = "That doesn't look like a YouTube link.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { notify("Check the highlighted fields", "warning"); return; }
    setSaving(true);
    const gps = await getGPS();
    const result = await createMatch({
      sport, title, location,
      matchTime: new Date(`${date}T${time}`).toISOString(),
      playersMax, matchType, skill, rules, gear, privacy, recurrence, approvalMode,
      streamUrl: streamOn ? streamUrl : "",
      lat: gps.lat ?? userPos?.[0] ?? null,
      lng: gps.lng ?? userPos?.[1] ?? null,
    });
    setSaving(false);
    if (result?.ok) setCreated(result.match);
  };

  const reset = () => {
    setCreated(null);
    setTitle(""); setDate(""); setTime(""); setLocation(""); setRules("");
    setSport("Cricket"); setMatchType("Friendly"); setSkill("All levels");
    setGear(["Ball"]); setPrivacy("Public"); setRecurrence("Once");
    setPlayersMax(10); setApprovalMode(false); setStreamOn(false); setStreamUrl("");
    setErrors({});
  };

  if (created) {
    return (
      <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div className="match-hero-title" style={{ marginBottom: 8 }}>Match Posted!</div>
        <div style={{ color: theme.textMuted, fontSize: 14, marginBottom: 24 }}>
          It's live on the map. Nearby players are being notified.
        </div>

        <div style={{ background: theme.accentDim, border: `1px solid ${theme.accent}30`, borderRadius: 14, padding: "14px 20px", marginBottom: 16, width: "100%", textAlign: "left" }}>
          <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700, marginBottom: 6 }}>MATCH CREATED</div>
          <div style={{ fontWeight: 700 }}>{created.title}</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>📍 {created.location}</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
            {created.sport} · {created.max} players · {skill} · {privacy}
          </div>
          {recurrence !== "Once" && (
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>♻️ Repeats {recurrence.toLowerCase()}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <button className="submit-btn" style={{ flex: 1 }} onClick={() => onOpenMatch(created)}>Open match</button>
          <button className="ghost-btn" onClick={reset}>Post another</button>
        </div>
        <button className="see-all" style={{ marginTop: 16 }} onClick={onDone}>Back to map</button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="header">
        <div className="screen-title">NEW MATCH</div>
        <button className="see-all" onClick={onDone}>Cancel</button>
      </div>

      <div style={{ padding: "16px 20px" }}>
        <div className="form-group">
          <label className="form-label">Sport</label>
          <div className="sport-picker">
            {SPORTS.map(([emoji, name]) => (
              <button key={name} className={`sport-pick-btn ${sport === name ? "selected" : ""}`} onClick={() => setSport(name)}>
                <span>{emoji}</span><span>{name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="title">Match title *</label>
          <input
            id="title"
            className={`form-input ${errors.title ? "invalid" : ""}`}
            placeholder={`e.g. Sunday ${sport} at the Park`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && <div className="field-error">{errors.title}</div>}
        </div>

        <div className="form-group row-2">
          <div>
            <label className="form-label" htmlFor="date">Date *</label>
            <input id="date" className={`form-input ${errors.date ? "invalid" : ""}`} type="date"
              value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label" htmlFor="time">Time *</label>
            <input id="time" className={`form-input ${errors.time ? "invalid" : ""}`} type="time"
              value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        {(errors.date || errors.time) && <div className="field-error" style={{ marginTop: -10, marginBottom: 14 }}>{errors.date || errors.time}</div>}

        <div className="form-group">
          <label className="form-label" htmlFor="loc">Location / ground *</label>
          <input
            id="loc"
            className={`form-input ${errors.location ? "invalid" : ""}`}
            placeholder="📍 Ground or venue name"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          {errors.location
            ? <div className="field-error">{errors.location}</div>
            : <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 6 }}>📡 Your GPS position is saved with the match so it lands on the map.</div>}
        </div>

        <div className="form-group row-2">
          <div>
            <label className="form-label" htmlFor="players">Players needed</label>
            <select id="players" className="form-select" value={playersMax} onChange={(e) => setPlayersMax(Number(e.target.value))}>
              {[2, 4, 6, 8, 10, 11, 14, 22].map((n) => <option key={n} value={n}>{n} players</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="type">Match type</label>
            <select id="type" className="form-select" value={matchType} onChange={(e) => setMatchType(e.target.value)}>
              {MATCH_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Skill level</label>
          <div className="toggle-group">
            {SKILL_LEVELS.map((s) => (
              <button key={s} className={`toggle-btn ${skill === s ? "on" : ""}`} onClick={() => setSkill(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="rules">Rules &amp; safety</label>
          <textarea id="rules" className="form-input" rows={3} value={rules}
            placeholder="Fair play rules, safety notes, what to bring…"
            style={{ resize: "none", lineHeight: 1.5 }}
            onChange={(e) => setRules(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Gear needed</label>
          <div className="toggle-group">
            {GEAR_OPTIONS.map((g) => (
              <button key={g} className={`toggle-btn ${gear.includes(g) ? "on" : ""}`} onClick={() => toggleGear(g)}>{g}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Recurrence</label>
          <div className="toggle-group">
            {RECURRENCE_OPTIONS.map((r) => (
              <button key={r} className={`toggle-btn ${recurrence === r ? "on" : ""}`} onClick={() => setRecurrence(r)}>{r}</button>
            ))}
          </div>
          {recurrence !== "Once" && (
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 6 }}>
              ♻️ Repeats {recurrence.toLowerCase()} at the same time and place.
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Privacy</label>
          <div className="toggle-group">
            {PRIVACY_OPTIONS.map((p) => (
              <button key={p} className={`toggle-btn ${privacy === p ? "on" : ""}`} onClick={() => setPrivacy(p)}>{p}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Check-in mode</label>
          <div className="toggle-group">
            <button className={`toggle-btn ${!approvalMode ? "on" : ""}`} onClick={() => setApprovalMode(false)}>Self check-in</button>
            <button className={`toggle-btn ${approvalMode ? "on" : ""}`} onClick={() => setApprovalMode(true)}>Organiser approves</button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Live stream (optional)</label>
          <div className="toggle-group">
            <button className={`toggle-btn ${streamOn ? "on" : ""}`} onClick={() => { setStreamOn((v) => !v); if (streamOn) { setStreamUrl(""); setErrors((e) => ({ ...e, stream: undefined })); } }}>
              ▶ YouTube {streamOn ? "✓" : ""}
            </button>
          </div>

          {streamOn && (
            <div style={{ marginTop: 12, padding: 14, background: "#FF000010", border: "1px solid #FF444430", borderRadius: 12, animation: "fadeIn .2s ease" }}>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10, lineHeight: 1.6 }}>
                Start your broadcast in YouTube Studio, then paste the watch link here so viewers can watch inside the match.
              </div>
              <input
                className={`form-input ${errors.stream ? "invalid" : ""}`}
                placeholder="https://youtube.com/watch?v=…"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
              />
              {errors.stream && <div className="field-error">{errors.stream}</div>}
              <button
                className="ghost-btn"
                style={{ marginTop: 10, padding: "7px 14px", fontSize: 12 }}
                onClick={() => window.open("https://studio.youtube.com/", "_blank", "noopener")}
              >
                Open YouTube Studio ↗
              </button>
            </div>
          )}
        </div>

        <button className="submit-btn" onClick={handleSubmit} disabled={saving}>
          {saving ? <><span className="spinner" /> Posting…</> : "⚡ Post Match Now"}
        </button>
      </div>
    </div>
  );
};

export default CreateScreen;
