import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { theme } from "../styles/theme";

const sportEmoji = { Cricket: "🏏", Football: "⚽", Basketball: "🏀", Badminton: "🏸", Tennis: "🎾" };

const ProfileScreen = ({ onSignOut, showToast }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile]         = useState(null);
  const [pastMatches, setPastMatches] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState("matches");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername]   = useState("");
  const [editBio, setEditBio]             = useState("");
  const [saving, setSaving]               = useState(false);

  const username = profile?.username || user?.user_metadata?.username || user?.email?.split("@")[0] || "Player";
  const initials = username.slice(0, 2).toUpperCase();

  // ── Fetch profile + match history ─────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchData = async () => {
      const [{ data: prof }, { data: matchData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("match_players")
          .select("match_id, status, joined_at, matches(id, title, sport, location, match_time, status)")
          .eq("user_id", user.id)
          .order("joined_at", { ascending: false })
          .limit(30),
      ]);

      setProfile(prof || null);
      setPastMatches((matchData || []).map(mp => mp.matches).filter(Boolean));
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    if (!user && onSignOut) {
      onSignOut();
    } else {
      await signOut();
    }
  };

  const openEditModal = () => {
    setEditUsername(username);
    setEditBio(profile?.bio || "");
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    if (!editUsername.trim()) { showToast?.("Username can't be empty", "error"); return; }
    setSaving(true);
    if (user) {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        username: editUsername.trim(),
        bio: editBio.trim(),
        email: user.email,
      });
      setSaving(false);
      if (error) {
        showToast?.("Couldn't save: " + error.message, "error");
      } else {
        setProfile(prev => ({ ...prev, username: editUsername.trim(), bio: editBio.trim() }));
        setShowEditModal(false);
        showToast?.("✓ Profile updated!", "success");
      }
    } else {
      setSaving(false);
      setShowEditModal(false);
      showToast?.("Sign in to save your profile", "warning");
    }
  };

  // Derived stats
  const matchesPlayed = profile?.matches_played ?? pastMatches.length;
  const reliabilityScore = profile?.reliability_score ?? 100;
  const uniqueSports = [...new Set(pastMatches.map(m => m.sport).filter(Boolean))];

  return (
    <div className="screen scroll-area">

      {/* ── Edit Profile Modal ── */}
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

      {/* ── Profile cover ── */}
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
          <span style={{ fontSize: 12, color: theme.textMuted }}>@{username.toLowerCase().replace(/\s+/g, "_")}</span>
          {profile?.bio && <span style={{ fontSize: 12, color: theme.textMuted }}>· {profile.bio}</span>}
          {reliabilityScore >= 80 && <span className="rely-badge reliable">✓ Reliable</span>}
        </div>

        {/* Real stats */}
        <div className="profile-stats">
          <div className="pstat">
            <div className="pstat-num">{loading ? "–" : matchesPlayed}</div>
            <div className="pstat-label">Matches</div>
          </div>
          <div className="pstat">
            <div className="pstat-num">{loading ? "–" : reliabilityScore}%</div>
            <div className="pstat-label">Reliability</div>
          </div>
          <div className="pstat">
            <div className="pstat-num">{loading ? "–" : uniqueSports.length}</div>
            <div className="pstat-label">Sports</div>
          </div>
          <div className="pstat">
            <div className="pstat-num">
              {loading ? "–" : uniqueSports.slice(0, 2).map(s => sportEmoji[s] || "🏅").join(" ") || "–"}
            </div>
            <div className="pstat-label">Played</div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="tabs" style={{ margin: "0 -20px 0", padding: "0 4px" }}>
          <button className={`tab ${activeTab === "matches" ? "active" : ""}`} onClick={() => setActiveTab("matches")}>📋 Matches</button>
          <button className={`tab ${activeTab === "stats" ? "active" : ""}`} onClick={() => setActiveTab("stats")}>📊 Stats</button>
        </div>

        <div style={{ marginTop: 16 }}>

          {/* ── Matches tab ── */}
          {activeTab === "matches" && (
            loading ? (
              <div style={{ color: theme.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>Loading...</div>
            ) : pastMatches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏟️</div>
                <div className="empty-text">No matches joined yet</div>
                <div style={{ fontSize: 12, color: theme.textDim, marginTop: 6 }}>Join or create a match to get started!</div>
              </div>
            ) : (
              pastMatches.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: theme.bgCard, border: `1px solid ${theme.border}`,
                    borderRadius: 12, padding: "12px 14px", marginBottom: 10,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {sportEmoji[m.sport] || "🏅"} {m.title}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                      📍 {m.location} ·{" "}
                      {new Date(m.match_time).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                      color: m.status === "completed" ? theme.accent
                           : m.status === "cancelled" ? theme.danger
                           : m.status === "live" ? theme.accent
                           : theme.textMuted,
                    }}>
                      {m.status}
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {/* ── Stats tab ── */}
          {activeTab === "stats" && (
            loading ? (
              <div style={{ color: theme.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>Loading...</div>
            ) : (
              <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>
                  Your Stats
                </div>

                {[
                  { label: "Matches Played", val: matchesPlayed },
                  { label: "Reliability Score", val: `${reliabilityScore}%` },
                  { label: "Sports Played", val: uniqueSports.length > 0 ? uniqueSports.join(", ") : "—" },
                  { label: "Member Since", val: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "—" },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < 3 ? `1px solid ${theme.border}` : "none",
                  }}>
                    <div style={{ fontSize: 13, color: theme.textMuted }}>{row.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{row.val}</div>
                  </div>
                ))}

                <div style={{ marginTop: 14, fontSize: 11, color: theme.textDim, lineHeight: 1.6 }}>
                  Reliability score improves each time you show up to a match you joined.
                </div>
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
