import { useMemo, useState } from "react";
import Sheet from "../components/Sheet";
import { useAppData } from "../hooks/useAppData";
import { useAuth } from "../hooks/useAuth";
import { sampleAchievements, samplePortfolio, sampleTeamHistory } from "../data/demo";
import { sportEmoji } from "../lib/constants";
import { initials } from "../lib/format";
import { theme } from "../styles/theme";

const PortfolioScreen = () => {
  const { profile, matches, joinedIds, notify } = useAppData();
  const { user } = useAuth();

  const [sport, setSport] = useState("Cricket");
  const [mode, setMode] = useState("official");
  const [showResume, setShowResume] = useState(false);

  const name = profile?.username || user?.email?.split("@")[0] || "Guest player";
  const played = profile?.matches_played ?? joinedIds.length;
  const reliability = profile?.reliability_score ?? 100;

  /** Real counts from the matches this player joined, per sport. */
  const myBreakdown = useMemo(() => {
    const mine = matches.filter((m) => joinedIds.includes(m.id));
    const bySport = {};
    for (const m of mine) {
      bySport[m.sport] ||= { total: 0, practice: 0, official: 0 };
      bySport[m.sport].total += 1;
      if (m.kind === "practice") bySport[m.sport].practice += 1;
      else bySport[m.sport].official += 1;
    }
    return bySport;
  }, [matches, joinedIds]);

  const sports = Object.keys(samplePortfolio);
  const sportCount = Object.keys(myBreakdown).length || sports.length;
  const card = samplePortfolio[sport];
  const stats = card[mode];
  const realCount = myBreakdown[sport]?.[mode] ?? 0;

  const downloadResume = () => {
    const lines = [
      `${name.toUpperCase()} — PlayPulse Sports Resume`,
      `Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
      "",
      `Matches played: ${played}`,
      `Reliability: ${reliability}%`,
      "",
      "SPORTS",
      ...sports.map((s) => `  ${s} — ${samplePortfolio[s].summary} (${myBreakdown[s]?.total ?? 0} recorded on PlayPulse)`),
      "",
      "ACHIEVEMENTS",
      ...sampleAchievements.map((a) => `  ${a.title} — ${a.subtitle}`),
      "",
      "TEAMS",
      ...sampleTeamHistory.map((t) => `  ${t.team} — ${t.role} (${t.span})`),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "-").toLowerCase()}-playpulse-resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowResume(false);
    notify("📄 Resume downloaded");
  };

  const copyResumeLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?player=${profile?.username || "me"}`;
    try {
      await navigator.clipboard.writeText(url);
      notify("🔗 Portfolio link copied");
    } catch {
      notify(`🔗 ${url}`);
    }
    setShowResume(false);
  };

  return (
    <div className="screen">
      <div className="header">
        <div className="screen-title">PORTFOLIO</div>
        <button className="see-all" onClick={() => setShowResume(true)}>📄 Sports Resume</button>
      </div>

      <div className="portfolio-hero">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div className="profile-avatar" style={{ width: 62, height: 62, fontSize: 22, position: "static" }}>
            {initials(name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{name}</div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>
              {played} match{played === 1 ? "" : "es"} · {sportCount} sport{sportCount === 1 ? "" : "s"}
            </div>
            <span className="rely-badge reliable" style={{ marginTop: 6 }}>✓ {reliability}% reliability</span>
          </div>
        </div>
      </div>

      <div className="segmented" style={{ paddingTop: 16 }}>
        {sports.map((s) => (
          <button key={s} className={`seg-btn ${sport === s ? "on" : ""}`} onClick={() => setSport(s)}>
            {sportEmoji[s]} {s}
          </button>
        ))}
      </div>

      <div className="section">
        <div className="sport-portfolio">
          <div className="sport-portfolio-header" style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
              <div className="sport-icon-sm">{sportEmoji[sport]}</div>
              <div style={{ minWidth: 0 }}>
                <div className="sport-portfolio-title">{sport} Portfolio</div>
                <div className="sport-portfolio-sub">{card.summary}</div>
              </div>
            </div>
            <div className="toggle-group">
              <button className={`toggle-btn ${mode === "official" ? "on" : ""}`} style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => setMode("official")}>Official</button>
              <button className={`toggle-btn ${mode === "practice" ? "on" : ""}`} style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => setMode("practice")}>Practice</button>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map(([value, label]) => (
              <div key={label} className="stat-box">
                <div className="stat-box-val">{value}</div>
                <div className="stat-box-label">{label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, fontSize: 10, color: theme.textDim, lineHeight: 1.6 }}>
            {realCount > 0
              ? `${realCount} ${mode} ${sport.toLowerCase()} ${realCount === 1 ? "match" : "matches"} recorded on PlayPulse so far.`
              : mode === "practice"
                ? "Practice stats stay separate and never mix with official records."
                : "Official records only — verified league and match data."}
          </div>
        </div>

        <div className="sport-portfolio">
          <div className="section-title" style={{ fontSize: 14, marginBottom: 6 }}>🏅 Achievements</div>
          {sampleAchievements.map((a) => (
            <div key={a.id} className="achieve-row">
              <div className="achieve-icon">{a.icon}</div>
              <div>
                <div className="achieve-title">{a.title}</div>
                <div className="achieve-sub">{a.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="sport-portfolio">
          <div className="section-title" style={{ fontSize: 14, marginBottom: 6 }}>👥 Team History</div>
          {sampleTeamHistory.map((t) => (
            <div key={t.id} className="achieve-row">
              <div className="achieve-icon">{t.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="achieve-title">{t.team}</div>
                <div className="achieve-sub">{t.role}</div>
              </div>
              <div style={{ fontSize: 11, color: theme.textMuted, flexShrink: 0 }}>{t.span}</div>
            </div>
          ))}
        </div>
      </div>

      {showResume && (
        <Sheet title="Sports Resume" onClose={() => setShowResume(false)}>
          <div className="resume-card">
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 1 }}>{name.toUpperCase()}</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 14 }}>PlayPulse verified record</div>
            {sports.map((s) => (
              <div key={s} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: 18 }}>{sportEmoji[s]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>{samplePortfolio[s].summary}</div>
                </div>
                <div style={{ fontSize: 12, color: theme.accent, fontWeight: 800, flexShrink: 0 }}>
                  {myBreakdown[s]?.total ?? 0} on PlayPulse
                </div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: theme.textMuted, paddingTop: 10 }}>
              🏅 {sampleAchievements.length} achievements · ✓ {reliability}% reliability · {sampleTeamHistory.length} teams
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="submit-btn" style={{ padding: 12 }} onClick={downloadResume}>Download</button>
            <button className="ghost-btn" onClick={copyResumeLink}>Copy link</button>
          </div>
        </Sheet>
      )}
    </div>
  );
};

export default PortfolioScreen;
