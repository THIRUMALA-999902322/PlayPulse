import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { theme } from "../styles/theme";

const ProfileScreen = ({ onSignOut, showToast }) => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("cricket");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername]   = useState("");
  const [editBio, setEditBio]             = useState("");
  const [saving, setSaving]               = useState(false);

  const tabs = [["cricket", "🏏"], ["football", "⚽"], ["matches", "📋"]];

  const handleSignOut = async () => {
    if (!user && onSignOut) {
      onSignOut();
    } else {
      await signOut();
    }
  };

  const openEditModal = () => {
    setEditUsername(username);
    setEditBio("Campus Player · Cricket & Football enthusiast");
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    if (!editUsername.trim()) { showToast?.("Username can't be empty", "error"); return; }
    setSaving(true);
    if (user) {
      const { error } = await supabase.auth.updateUser({
        data: { username: editUsername.trim(), bio: editBio.trim() },
      });
      setSaving(false);
      if (error) {
        showToast?.("Couldn't save: " + error.message, "error");
      } else {
        setShowEditModal(false);
        showToast?.("✓ Profile updated!", "success");
      }
    } else {
      // Guest mode — just close
      setSaving(false);
      setShowEditModal(false);
      showToast?.("Sign in to save your profile", "warning");
    }
  };

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "Player";
  const initials = username.slice(0, 2).toUpperCase();

  const cricketStats = [
    { val: "34",   label: "Matches" }, { val: "1,248", label: "Runs" },
    { val: "36.7", label: "Average" }, { val: "124",   label: "Strike Rate" },
    { val: "98",   label: "4s"      }, { val: "42",    label: "6s" },
  ];

  const footballStats = [
    { val: "18",  label: "Matches"  }, { val: "CF",  label: "Position" },
    { val: "11",  label: "Goals"    }, { val: "7",   label: "Assists"  },
    { val: "82%", label: "Win Rate" }, { val: "4.2", label: "Rating"   },
  ];

  const pastMatches = [
    { title: "T10 vs Bolts",     date: "Feb 20", result: "Won",  score: "32 (18)", type: "Batting" },
    { title: "Campus League R4", date: "Feb 14", result: "Won",  score: "45 (28)", type: "Batting" },
    { title: "Pickup vs Eagles", date: "Feb 8",  result: "Lost", score: "12 (10)", type: "Batting" },
  ];

  const stats = activeTab === "cricket" ? cricketStats : activeTab === "football" ? footballStats : [];

  return (
    <div className="screen scroll-area">

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
          <div style={{
            background: theme.bgCard, borderRadius: "20px 20px 0 0",
            padding: "24px 20px 40px", width: "100%", maxWidth: 420,
            border: `1px solid ${theme.border}`, animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>Edit Profile</div>
              <button onClick={() => setShowEditModal(false)}
                style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            {/* Avatar preview */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: `linear-gradient(135deg, ${theme.accent}40, ${theme.accentSecondary}40)`,
                border: `3px solid ${theme.accent}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 700,
              }}>
                {editUsername.slice(0, 2).toUpperCase() || initials}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                placeholder="Your username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                className="form-input"
                rows={2}
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="Tell players about yourself..."
                style={{ resize: "none", lineHeight: 1.5 }}
              />
            </div>
            <button className="submit-btn" onClick={saveProfile} disabled={saving} style={{ marginTop: 8 }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Profile cover */}
      <div className="profile-cover">
        <div className="profile-cover-bg" />
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{initials}</div>
        </div>
        <div style={{ position: "absolute", bottom: 12, right: 20, display: "flex", gap: 8 }}>
          <button className="profile-edit-btn" onClick={openEditModal}>Edit Profile</button>
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
              <div
                style={{ marginTop: 12, padding: "10px 0", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.textMuted, cursor: "pointer" }}
                onClick={() => showToast?.("📊 Full match records coming soon!", "info")}
              >
                <span>Competitive matches</span>
                <span style={{ color: theme.accent, fontWeight: 700 }}>View all records →</span>
              </div>
            </div>
          ) : (
            pastMatches.map((m, i) => (
              <div
                key={i}
                style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => showToast?.(`📋 Full match stats for "${m.title}" coming soon!`, "info")}
              >
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
