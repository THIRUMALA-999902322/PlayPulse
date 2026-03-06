import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { theme } from "../styles/theme";

const ProfileScreen = ({ onSignOut }) => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("cricket");
  const tabs = [["cricket", "🏏"], ["football", "⚽"], ["matches", "📋"]];

  const handleSignOut = async () => {
    if (!user && onSignOut) {
      onSignOut(); // guest mode: reset to auth screen
    } else {
      await signOut();
    }
  };

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "Player";
  const initials = username.slice(0, 2).toUpperCase();

  const cricketStats = [
    { val: "34", label: "Matches" }, { val: "1,248", label: "Runs" }, { val: "36.7", label: "Average" },
    { val: "124", label: "Strike Rate" }, { val: "98", label: "4s" }, { val: "42", label: "6s" },
  ];

  const footballStats = [
    { val: "18", label: "Matches" }, { val: "CF", label: "Position" }, { val: "11", label: "Goals" },
    { val: "7", label: "Assists" }, { val: "82%", label: "Win Rate" }, { val: "4.2", label: "Rating" },
  ];

  const pastMatches = [
    { title: "T10 vs Bolts", date: "Feb 20", result: "Won", score: "32 (18)", type: "Batting" },
    { title: "Campus League R4", date: "Feb 14", result: "Won", score: "45 (28)", type: "Batting" },
    { title: "Pickup vs Eagles", date: "Feb 8", result: "Lost", score: "12 (10)", type: "Batting" },
  ];

  const stats = activeTab === "cricket" ? cricketStats : activeTab === "football" ? footballStats : [];

  return (
    <div className="screen scroll-area">
      <div className="profile-cover">
        <div className="profile-cover-bg" />
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{initials}</div>
        </div>
        <div style={{ position: "absolute", bottom: 12, right: 20, display: "flex", gap: 8 }}>
          <button className="profile-edit-btn">Edit Profile</button>
          <button
            className="profile-edit-btn"
            style={{ color: user ? theme.danger : theme.accent, borderColor: user ? theme.danger + "40" : theme.accent + "40" }}
            onClick={handleSignOut}
          >
            {user ? "Sign Out" : "Sign In"}
          </button>
        </div>
      </div>

      <div className="profile-info">
        <div className="profile-name">{username}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: theme.textMuted }}>@{username.toLowerCase().replace(" ", "_")} · Campus Player</span>
          <span className="rely-badge reliable">✓ Reliable</span>
        </div>
        <div className="profile-stats">
          <div className="pstat"><div className="pstat-num">52</div><div className="pstat-label">Matches</div></div>
          <div className="pstat"><div className="pstat-num">5</div><div className="pstat-label">Leagues</div></div>
          <div className="pstat"><div className="pstat-num">124</div><div className="pstat-label">Followers</div></div>
          <div className="pstat"><div className="pstat-num">3</div><div className="pstat-label">Sports</div></div>
        </div>

        <div className="tabs" style={{ margin: "0 -20px 0", padding: "0 4px" }}>
          {tabs.map(([k, l]) => (
            <button key={k} className={`tab ${activeTab === k ? "active" : ""}`} onClick={() => setActiveTab(k)}>
              {l} {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {activeTab !== "matches" ? (
            <div className="sport-portfolio">
              <div className="sport-portfolio-header">
                <div className="sport-icon-sm">{activeTab === "cricket" ? "🏏" : "⚽"}</div>
                <div>
                  <div className="sport-portfolio-title">{activeTab === "cricket" ? "Cricket" : "Football"} Portfolio</div>
                  <div className="sport-portfolio-sub">{activeTab === "cricket" ? "Right-hand bat · Medium pace" : "Centre Forward · Campus Team"}</div>
                </div>
              </div>
              <div className="stats-grid">
                {stats.map((s, i) => (
                  <div key={i} className="stat-box">
                    <div className="stat-box-val">{s.val}</div>
                    <div className="stat-box-label">{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "10px 0", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.textMuted }}>
                <span>Competitive matches</span>
                <span style={{ color: theme.accent, fontWeight: 700 }}>View all records →</span>
              </div>
            </div>
          ) : (
            pastMatches.map((m, i) => (
              <div key={i} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{m.date} · {m.type}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.result === "Won" ? theme.accent : theme.danger }}>{m.score}</div>
                  <div style={{ fontSize: 10, color: m.result === "Won" ? theme.accent : theme.danger, fontWeight: 700 }}>{m.result}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
