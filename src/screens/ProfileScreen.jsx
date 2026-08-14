import { useState } from "react";
import Sheet from "../components/Sheet";
import { useAppData } from "../hooks/useAppData";
import { useAuth } from "../hooks/useAuth";
import { initials } from "../lib/format";
import { tappable } from "../lib/a11y";
import { theme } from "../styles/theme";

const PRIVACY_ROWS = [
  { key: "public_portfolio", label: "Public portfolio", sub: "Anyone can view your stats and sports resume" },
  { key: "public_posts",     label: "Public posts",     sub: "Photos and match summaries visible to everyone" },
  { key: "show_location",    label: "Show on map",      sub: "Appear in nearby player searches" },
];

const ProfileScreen = ({ onSignIn }) => {
  const { profile, updateProfile, notify, matches, joinedIds, leagues } = useAppData();
  const { user, signOut } = useAuth();

  const [showEdit, setShowEdit] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);

  const name = profile?.username || user?.email?.split("@")[0] || "Guest";
  const bio = profile?.bio || "";
  const played = profile?.matches_played ?? joinedIds.length;
  const hosted = user ? matches.filter((m) => m.createdBy === user.id).length : 0;

  const openEdit = () => {
    setEditName(profile?.username || "");
    setEditBio(profile?.bio || "");
    setShowEdit(true);
  };

  const save = async () => {
    if (!editName.trim()) { notify("Username can't be empty", "warning"); return; }
    setSaving(true);
    const ok = await updateProfile({ username: editName.trim(), bio: editBio.trim() });
    setSaving(false);
    if (ok) setShowEdit(false);
  };

  const togglePrivacy = (key) => {
    if (!profile) { notify("Sign in to change privacy settings", "warning"); onSignIn(); return; }
    updateProfile({ [key]: !profile[key] });
  };

  const handleSignOut = async () => {
    await signOut();
    notify("Signed out");
  };

  return (
    <div className="screen">
      <div className="profile-cover">
        <div className="profile-cover-bg" />
        <div className="profile-avatar-wrap"><div className="profile-avatar">{initials(name)}</div></div>
      </div>

      <div className="profile-info">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div className="profile-name">{name}</div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>
              {user ? `@${name.toLowerCase().replace(/\s+/g, "_")}` : "Browsing as a guest"}
            </div>
            {bio && <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6, lineHeight: 1.5 }}>{bio}</div>}
          </div>
          {user ? (
            <button className="ghost-btn" style={{ padding: "8px 16px", fontSize: 12 }} onClick={openEdit}>Edit</button>
          ) : (
            <button className="submit-btn" style={{ width: "auto", padding: "10px 18px", fontSize: 13 }} onClick={onSignIn}>Sign in</button>
          )}
        </div>

        <div className="profile-stats">
          <div className="pstat"><div className="pstat-num">{played}</div><div className="pstat-label">Matches</div></div>
          <div className="pstat"><div className="pstat-num">{hosted}</div><div className="pstat-label">Hosted</div></div>
          <div className="pstat"><div className="pstat-num">{leagues.length}</div><div className="pstat-label">Leagues</div></div>
          <div className="pstat"><div className="pstat-num">{profile?.reliability_score ?? 100}%</div><div className="pstat-label">Reliable</div></div>
        </div>

        {!user && (
          <div style={{ background: theme.accentDim, border: `1px solid ${theme.accent}30`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>You're browsing as a guest</div>
            <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6 }}>
              Everything is visible. Sign in to join matches, chat and post your own games.
            </div>
          </div>
        )}

        <div className="sport-portfolio">
          <div className="section-title" style={{ fontSize: 14, marginBottom: 4 }}>🔒 Privacy</div>
          {PRIVACY_ROWS.map((row) => (
            <div
              key={row.key}
              className="settings-row"
              {...tappable(() => togglePrivacy(row.key), `${row.label}: ${profile?.[row.key] ? "on" : "off"}`)}
              aria-pressed={!!profile?.[row.key]}
            >
              <div style={{ minWidth: 0 }}>
                <div className="settings-label">{row.label}</div>
                <div className="settings-sub">{row.sub}</div>
              </div>
              <div className={`switch ${profile?.[row.key] ? "on" : ""}`}><div className="switch-knob" /></div>
            </div>
          ))}
        </div>

        <div className="sport-portfolio">
          <div className="section-title" style={{ fontSize: 14, marginBottom: 4 }}>⚙️ Account</div>

          {user && (
            <div className="settings-row" {...tappable(openEdit, "Edit profile")}>
              <div><div className="settings-label">Edit profile</div><div className="settings-sub">Name and bio</div></div>
              <div style={{ color: theme.textMuted }}>›</div>
            </div>
          )}

          <div className="settings-row" {...tappable(() => setShowAbout(true), "About PlayPulse")}>
            <div><div className="settings-label">About PlayPulse</div><div className="settings-sub">What this app does</div></div>
            <div style={{ color: theme.textMuted }}>›</div>
          </div>

          <div
            className="settings-row"
            {...tappable(() => window.open("mailto:hello@playpulse.app?subject=PlayPulse%20feedback", "_blank", "noopener"), "Help and feedback")}
          >
            <div><div className="settings-label">Help &amp; feedback</div><div className="settings-sub">Tell us what's broken or missing</div></div>
            <div style={{ color: theme.textMuted }}>›</div>
          </div>

          <div className="settings-row" {...tappable(user ? handleSignOut : onSignIn, user ? "Sign out" : "Sign in")}>
            <div>
              <div className="settings-label" style={{ color: user ? theme.danger : theme.accent }}>
                {user ? "Sign out" : "Sign in or create account"}
              </div>
              <div className="settings-sub">{user ? user.email : "Takes about 20 seconds"}</div>
            </div>
            <div style={{ color: theme.textMuted }}>›</div>
          </div>
        </div>
      </div>

      {showEdit && (
        <Sheet title="Edit profile" onClose={() => setShowEdit(false)}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div className="profile-avatar" style={{ position: "static", width: 72, height: 72, fontSize: 24 }}>
              {initials(editName || name)}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="uname">Username</label>
            <input id="uname" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your username" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ubio">Bio</label>
            <textarea id="ubio" className="form-input" rows={2} value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell players about yourself…"
              style={{ resize: "none", lineHeight: 1.5 }} />
          </div>
          <button className="submit-btn" onClick={save} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : "Save changes"}
          </button>
        </Sheet>
      )}

      {showAbout && (
        <Sheet title="About PlayPulse" onClose={() => setShowAbout(false)}>
          <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.75 }}>
            <p style={{ marginBottom: 12 }}>
              PlayPulse is where amateur sport gets organised: find a game near you, join in, and play.
            </p>
            <p style={{ marginBottom: 12 }}>
              The <strong style={{ color: theme.text }}>Map</strong> shows live and filling games around you.
              <strong style={{ color: theme.text }}> Matches</strong> lists everything including leagues and the player leaderboard.
              The <strong style={{ color: theme.text }}>+</strong> button posts a new game in about fifteen seconds.
            </p>
            <p style={{ marginBottom: 12 }}>
              Open any match to chat with players, follow the score, watch a stream, chip in for kit, and check in on the day —
              all inside that match rather than scattered across the app.
            </p>
            <p>
              Your <strong style={{ color: theme.text }}>Portfolio</strong> keeps official and practice stats apart, so your record
              means something when you share it.
            </p>
          </div>
        </Sheet>
      )}
    </div>
  );
};

export default ProfileScreen;
