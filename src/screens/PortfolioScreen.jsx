import { useEffect, useState } from "react";
import Sheet from "../components/Sheet";
import { useAppData } from "../hooks/useAppData";
import { useAuth } from "../hooks/useAuth";
import { sportEmoji } from "../lib/constants";
import { formatMatchTime, initials } from "../lib/format";
import { theme } from "../styles/theme";

/**
 * Milestones are derived from the record rather than stored, so nothing can
 * claim an achievement the numbers do not support.
 */
const milestonesFor = (record, reliability) => {
  const total = record.reduce((n, r) => n + r.official + r.practice, 0);
  const attended = record.reduce((n, r) => n + r.attended, 0);
  const organised = record.reduce((n, r) => n + r.organised, 0);
  const out = [];

  if (total >= 1)  out.push({ icon: "🎉", title: "First match", subtitle: "You joined your first game on PlayPulse" });
  if (total >= 10) out.push({ icon: "🔟", title: "Ten matches", subtitle: `${total} matches joined so far` });
  if (total >= 50) out.push({ icon: "🏆", title: "Fifty matches", subtitle: `${total} matches joined so far` });
  if (organised >= 1)  out.push({ icon: "📣", title: "Organiser", subtitle: `You've posted ${organised} match${organised === 1 ? "" : "es"}` });
  if (organised >= 10) out.push({ icon: "🧭", title: "Regular organiser", subtitle: `${organised} matches posted` });
  if (attended >= 5 && reliability === 100) {
    out.push({ icon: "⭐", title: "Perfect attendance", subtitle: `Checked in to all ${attended} of your finished matches` });
  }
  if (record.length >= 3) out.push({ icon: "🤹", title: "Multi-sport", subtitle: `${record.length} sports played` });

  return out;
};

const PortfolioScreen = () => {
  const { profile, loadPlayerRecord, notify } = useAppData();
  const { user } = useAuth();

  const [record, setRecord] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState(null);
  const [mode, setMode] = useState("official");
  const [showResume, setShowResume] = useState(false);

  const name = profile?.username || user?.email?.split("@")[0] || "Guest player";
  const reliability = profile?.reliability_score ?? 100;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = user ? await loadPlayerRecord(user.id) : [];
      if (cancelled) return;
      setRecord(rows);
      setSport((prev) => prev ?? rows[0]?.sport ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, loadPlayerRecord]);

  const totalMatches = record.reduce((n, r) => n + r.official + r.practice, 0);
  const totalAttended = record.reduce((n, r) => n + r.attended, 0);
  const selected = record.find((r) => r.sport === sport) || null;
  const milestones = milestonesFor(record, reliability);

  const downloadResume = () => {
    const lines = [
      `${name.toUpperCase()} — PlayPulse record`,
      `Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
      "",
      `Matches joined: ${totalMatches}`,
      `Turned up to:   ${totalAttended}`,
      `Reliability:    ${reliability}%`,
      "",
      "BY SPORT",
      ...record.map((r) =>
        `  ${r.sport} — ${r.official} competitive, ${r.practice} practice, ${r.attended} attended` +
        (r.organised ? `, ${r.organised} organised` : "")),
      "",
      "MILESTONES",
      ...(milestones.length ? milestones.map((m) => `  ${m.title} — ${m.subtitle}`) : ["  None yet"]),
      "",
      "Every figure above is counted from matches recorded on PlayPulse.",
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^\w-]/g, "-").toLowerCase()}-playpulse-record.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowResume(false);
    notify("📄 Record downloaded");
  };

  if (!user) {
    return (
      <div className="screen">
        <div className="header"><div className="screen-title">PORTFOLIO</div></div>
        <div className="empty-state" style={{ paddingTop: 60 }}>
          <div className="empty-icon">📊</div>
          <div className="empty-text" style={{ marginBottom: 8 }}>Your playing record lives here</div>
          <div style={{ fontSize: 12, color: theme.textDim, lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
            Sign in and join a match — every game you play is counted here automatically.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="header">
        <div className="screen-title">PORTFOLIO</div>
        {totalMatches > 0 && <button className="see-all" onClick={() => setShowResume(true)}>📄 My record</button>}
      </div>

      <div className="portfolio-hero">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div className="profile-avatar" style={{ width: 62, height: 62, fontSize: 22, position: "static" }}>
            {initials(name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{name}</div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>
              {totalMatches} match{totalMatches === 1 ? "" : "es"} · {record.length} sport{record.length === 1 ? "" : "s"}
            </div>
            <span className="rely-badge reliable" style={{ marginTop: 6 }}>✓ {reliability}% reliability</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <div style={{ fontSize: 13 }}>Loading your record…</div>
        </div>
      ) : record.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 50 }}>
          <div className="empty-icon">🏟️</div>
          <div className="empty-text" style={{ marginBottom: 8 }}>No matches yet</div>
          <div style={{ fontSize: 12, color: theme.textDim, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
            Join a game from the map and your record starts building here — matches played,
            sports covered, and whether you turned up.
          </div>
        </div>
      ) : (
        <>
          <div className="segmented" style={{ paddingTop: 16 }}>
            {record.map((r) => (
              <button key={r.sport} className={`seg-btn ${sport === r.sport ? "on" : ""}`} onClick={() => setSport(r.sport)}>
                {sportEmoji[r.sport] || "🏅"} {r.sport}
              </button>
            ))}
          </div>

          <div className="section">
            {selected && (
              <div className="sport-portfolio">
                <div className="sport-portfolio-header" style={{ justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                    <div className="sport-icon-sm">{sportEmoji[selected.sport] || "🏅"}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="sport-portfolio-title">{selected.sport}</div>
                      <div className="sport-portfolio-sub">Last played {formatMatchTime(selected.lastPlayed)}</div>
                    </div>
                  </div>
                  <div className="toggle-group">
                    <button className={`toggle-btn ${mode === "official" ? "on" : ""}`} style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => setMode("official")}>Competitive</button>
                    <button className={`toggle-btn ${mode === "practice" ? "on" : ""}`} style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => setMode("practice")}>Practice</button>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-box-val">{mode === "official" ? selected.official : selected.practice}</div>
                    <div className="stat-box-label">{mode === "official" ? "Competitive" : "Practice"}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-box-val">{selected.attended}</div>
                    <div className="stat-box-label">Turned up</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-box-val">{selected.organised}</div>
                    <div className="stat-box-label">Organised</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 10, color: theme.textDim, lineHeight: 1.6 }}>
                  Practice sessions are counted separately and never mixed into your competitive record.
                </div>
              </div>
            )}

            <div className="sport-portfolio">
              <div className="section-title" style={{ fontSize: 14, marginBottom: 6 }}>🏅 Milestones</div>
              {milestones.length === 0 ? (
                <div style={{ fontSize: 12, color: theme.textMuted, padding: "8px 0", lineHeight: 1.6 }}>
                  Nothing yet. Milestones unlock as you play, organise and turn up.
                </div>
              ) : milestones.map((m) => (
                <div key={m.title} className="achieve-row">
                  <div className="achieve-icon">{m.icon}</div>
                  <div>
                    <div className="achieve-title">{m.title}</div>
                    <div className="achieve-sub">{m.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showResume && (
        <Sheet title="My record" onClose={() => setShowResume(false)}>
          <div className="resume-card">
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 1 }}>{name.toUpperCase()}</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 14 }}>
              Counted from matches recorded on PlayPulse
            </div>
            {record.map((r) => (
              <div key={r.sport} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: 18 }}>{sportEmoji[r.sport] || "🏅"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.sport}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>
                    {r.official} competitive · {r.practice} practice
                  </div>
                </div>
                <div style={{ fontSize: 12, color: theme.accent, fontWeight: 800, flexShrink: 0 }}>
                  {r.attended} attended
                </div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: theme.textMuted, paddingTop: 10 }}>
              🏅 {milestones.length} milestone{milestones.length === 1 ? "" : "s"} · ✓ {reliability}% reliability
            </div>
          </div>

          <button className="submit-btn" style={{ marginTop: 14, padding: 12 }} onClick={downloadResume}>
            Download
          </button>
        </Sheet>
      )}
    </div>
  );
};

export default PortfolioScreen;
