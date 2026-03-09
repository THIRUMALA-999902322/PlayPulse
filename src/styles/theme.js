export const theme = {
  bg: "#080B14",
  bgCard: "#0F1320",
  bgElevated: "#161C2E",
  accent: "#00F5A0",
  accentDim: "#00F5A020",
  accentSecondary: "#7B5EA7",
  danger: "#FF4757",
  warning: "#FFB800",
  text: "#F0F4FF",
  textMuted: "#6B7A99",
  textDim: "#3A4460",
  border: "#1E2640",
  borderBright: "#2A3560",
};

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: ${theme.bg};
    color: ${theme.text};
    font-family: 'Outfit', sans-serif;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .app-shell {
    width: 100%;
    max-width: 420px;
    min-height: 100vh;
    background: ${theme.bg};
    position: relative;
    overflow: hidden;
  }

  .screen {
    min-height: 100vh;
    padding-bottom: 90px;
    animation: fadeIn 0.25s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.97); }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* Bottom Nav */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 420px;
    background: ${theme.bgCard};
    border-top: 1px solid ${theme.border};
    display: flex;
    padding: 12px 0 20px;
    z-index: 100;
    backdrop-filter: blur(20px);
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s;
    background: none;
    border: none;
    color: ${theme.textMuted};
  }

  .nav-item.active { color: ${theme.accent}; }
  .nav-item svg { width: 22px; height: 22px; }
  .nav-item span { font-size: 10px; font-weight: 500; }

  .nav-fab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    margin-top: -28px;
  }

  .fab-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${theme.accent};
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 24px ${theme.accent}60;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .fab-btn:hover { transform: scale(1.08); box-shadow: 0 0 32px ${theme.accent}80; }
  .fab-btn span { font-size: 10px; color: ${theme.textMuted}; margin-top: 4px; }

  /* Header */
  .header {
    padding: 16px 20px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
    background: ${theme.bg}EE;
    backdrop-filter: blur(12px);
    border-bottom: 1px solid ${theme.border};
  }

  .logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px;
    letter-spacing: 2px;
    color: ${theme.text};
  }

  .logo span { color: ${theme.accent}; }
  .header-actions { display: flex; gap: 8px; align-items: center; }

  .icon-btn {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: ${theme.bgCard};
    border: 1px solid ${theme.border};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: ${theme.textMuted};
    transition: all 0.2s;
  }

  .icon-btn:hover { border-color: ${theme.accent}; color: ${theme.accent}; }

  /* Map */
  .map-container {
    height: 280px;
    background: ${theme.bgCard};
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid ${theme.border};
  }

  .map-bg {
    width: 100%; height: 100%;
    background:
      linear-gradient(rgba(0,245,160,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,245,160,0.03) 1px, transparent 1px),
      radial-gradient(ellipse at 30% 60%, #00F5A008 0%, transparent 50%),
      radial-gradient(ellipse at 70% 30%, #7B5EA708 0%, transparent 50%),
      ${theme.bgCard};
    background-size: 32px 32px, 32px 32px, 100% 100%, 100% 100%;
  }

  .map-road-h { position: absolute; height: 2px; background: ${theme.border}; left: 0; right: 0; }
  .map-road-v { position: absolute; width: 2px; background: ${theme.border}; top: 0; bottom: 0; }

  .map-pin {
    position: absolute;
    display: flex; flex-direction: column; align-items: center;
    cursor: pointer;
    animation: slideUp 0.5s ease both;
  }

  .map-pin-bubble {
    background: ${theme.bgElevated};
    border: 1.5px solid ${theme.border};
    border-radius: 12px;
    padding: 6px 10px;
    display: flex; align-items: center; gap: 6px;
    box-shadow: 0 4px 16px #00000060;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .map-pin-bubble.active {
    border-color: ${theme.accent};
    background: ${theme.bg};
    box-shadow: 0 0 20px ${theme.accent}30;
  }

  .map-pin-bubble:hover { border-color: ${theme.accent}; transform: translateY(-2px); }

  .map-pin-dot { width: 8px; height: 8px; border-radius: 50%; animation: pulse 2s infinite; }
  .pin-tail { width: 2px; height: 8px; background: ${theme.borderBright}; }
  .map-pin-emoji { font-size: 13px; }
  .map-pin-label { font-size: 11px; font-weight: 600; }
  .map-pin-count { font-size: 10px; color: ${theme.textMuted}; }

  .my-location {
    position: absolute;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #4A9EFF;
    border: 3px solid white;
    box-shadow: 0 0 20px #4A9EFF80;
  }

  .map-overlay-pill {
    position: absolute;
    bottom: 12px; left: 50%; transform: translateX(-50%);
    background: ${theme.bgCard}EE;
    border: 1px solid ${theme.border};
    border-radius: 50px;
    padding: 6px 16px;
    font-size: 11px;
    color: ${theme.textMuted};
    backdrop-filter: blur(8px);
    white-space: nowrap;
  }

  /* Section */
  .section { padding: 20px; }
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .section-title { font-size: 16px; font-weight: 700; }
  .see-all { font-size: 12px; color: ${theme.accent}; cursor: pointer; background: none; border: none; font-family: 'Outfit', sans-serif; font-weight: 500; }

  /* Match card */
  .match-card {
    background: ${theme.bgCard};
    border: 1px solid ${theme.border};
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .match-card:hover { border-color: ${theme.borderBright}; transform: translateY(-2px); box-shadow: 0 8px 24px #00000040; }

  .match-card-header { padding: 14px 16px 10px; display: flex; align-items: flex-start; justify-content: space-between; }

  .match-sport-badge {
    display: flex; align-items: center; gap: 6px;
    background: ${theme.bgElevated};
    border-radius: 8px; padding: 4px 10px;
    font-size: 11px; font-weight: 600; color: ${theme.textMuted};
  }

  .match-status { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600; border-radius: 20px; padding: 3px 9px; }
  .status-live { background: #FF475715; color: ${theme.danger}; }
  .status-open { background: #00F5A015; color: ${theme.accent}; }
  .status-soon { background: #FFB80015; color: ${theme.warning}; }
  .status-full { background: #6B7A9920; color: ${theme.textMuted}; }

  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: blink 1s infinite; }

  .match-title { padding: 0 16px 8px; font-size: 15px; font-weight: 700; }
  .match-meta { padding: 0 16px 14px; display: flex; gap: 14px; flex-wrap: wrap; }
  .meta-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: ${theme.textMuted}; }

  .match-card-footer { padding: 10px 16px; border-top: 1px solid ${theme.border}; display: flex; align-items: center; justify-content: space-between; }

  .players-row { display: flex; align-items: center; }

  .player-avatar {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2px solid ${theme.bgCard};
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
    margin-left: -6px; overflow: hidden;
  }
  .player-avatar:first-child { margin-left: 0; }
  .players-count { font-size: 11px; color: ${theme.textMuted}; margin-left: 8px; }

  .join-btn {
    background: ${theme.accent};
    color: ${theme.bg};
    border: none; border-radius: 8px;
    padding: 7px 16px;
    font-size: 12px; font-weight: 700;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
    transition: all 0.2s;
  }

  .join-btn:hover { transform: scale(1.04); box-shadow: 0 0 16px ${theme.accent}50; }
  .join-btn.full { background: ${theme.bgElevated}; color: ${theme.textMuted}; }
  .join-btn.watching { background: ${theme.accentSecondary}; color: white; }

  /* Quick fill */
  .quick-fill {
    background: linear-gradient(135deg, ${theme.bgCard}, ${theme.bgElevated});
    border: 1.5px solid ${theme.accent}30;
    border-radius: 16px; padding: 14px 16px; margin-bottom: 12px;
    cursor: pointer; display: flex; align-items: center; gap: 14px;
    transition: all 0.2s; position: relative; overflow: hidden;
  }

  .quick-fill::before {
    content: ''; position: absolute; top: 0; left: 0;
    width: 4px; height: 100%;
    background: ${theme.accent};
    border-radius: 16px 0 0 16px;
  }

  .quick-fill:hover { border-color: ${theme.accent}60; transform: translateX(2px); }
  .quick-fill-icon { width: 46px; height: 46px; border-radius: 12px; background: ${theme.accentDim}; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .quick-fill-info { flex: 1; }
  .quick-fill-title { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
  .quick-fill-sub { font-size: 11px; color: ${theme.textMuted}; }
  .need-badge { background: ${theme.accent}; color: ${theme.bg}; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 800; white-space: nowrap; }

  /* Horizontal scroll */
  .hscroll { display: flex; gap: 10px; overflow-x: auto; padding: 0 20px 4px; scrollbar-width: none; }
  .hscroll::-webkit-scrollbar { display: none; }

  .sport-chip { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 64px; cursor: pointer; background: none; border: none; color: ${theme.textMuted}; font-family: 'Outfit', sans-serif; transition: all 0.2s; }
  .sport-chip.active { color: ${theme.accent}; }
  .sport-chip-icon { width: 52px; height: 52px; border-radius: 14px; background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: all 0.2s; }
  .sport-chip.active .sport-chip-icon { border-color: ${theme.accent}; background: ${theme.accentDim}; box-shadow: 0 0 12px ${theme.accent}30; }
  .sport-chip span { font-size: 10px; font-weight: 600; }

  /* Match detail */
  .match-hero { background: linear-gradient(180deg, ${theme.bgElevated} 0%, ${theme.bg} 100%); padding: 20px 20px 0; position: relative; }
  .back-btn { width: 36px; height: 36px; border-radius: 10px; background: ${theme.bgCard}; border: 1px solid ${theme.border}; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-bottom: 16px; color: ${theme.text}; }
  .match-hero-sport { font-size: 11px; font-weight: 600; color: ${theme.accent}; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
  .match-hero-title { font-family: 'Bebas Neue', sans-serif; font-size: 30px; letter-spacing: 1px; line-height: 1.1; margin-bottom: 12px; }

  .score-board { background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px; padding: 16px; margin: 16px 0; display: flex; align-items: center; justify-content: space-between; }
  .team-score { flex: 1; text-align: center; }
  .team-name-sm { font-size: 11px; color: ${theme.textMuted}; margin-bottom: 4px; font-weight: 600; }
  .score-big { font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: ${theme.text}; line-height: 1; }
  .score-sub { font-size: 10px; color: ${theme.textMuted}; margin-top: 2px; }
  .score-vs { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0 16px; }
  .vs-text { font-size: 11px; color: ${theme.textMuted}; font-weight: 700; }
  .overs-text { font-size: 10px; color: ${theme.textMuted}; }

  /* Tabs */
  .tabs { display: flex; border-bottom: 1px solid ${theme.border}; padding: 0 20px; }
  .tab { padding: 12px 16px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: none; color: ${theme.textMuted}; font-family: 'Outfit', sans-serif; border-bottom: 2px solid transparent; transition: all 0.2s; }
  .tab.active { color: ${theme.accent}; border-bottom-color: ${theme.accent}; }

  /* Commentary */
  .commentary-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid ${theme.border}; }
  .over-badge { min-width: 36px; height: 36px; border-radius: 8px; background: ${theme.bgElevated}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: ${theme.textMuted}; flex-shrink: 0; }
  .over-badge.six { background: #00F5A020; color: ${theme.accent}; }
  .over-badge.four { background: #7B5EA720; color: #A47BDD; }
  .over-badge.wicket { background: #FF475720; color: ${theme.danger}; }
  .commentary-text { font-size: 13px; line-height: 1.5; color: ${theme.textMuted}; }
  .commentary-text strong { color: ${theme.text}; }

  /* Profile */
  .profile-cover { height: 160px; background: linear-gradient(135deg, #0F1320, #161C2E, #0F1320); position: relative; overflow: hidden; }
  .profile-cover-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 20% 50%, ${theme.accent}15 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, ${theme.accentSecondary}15 0%, transparent 60%); }
  .profile-avatar-wrap { position: absolute; bottom: -40px; left: 20px; }
  .profile-avatar { width: 80px; height: 80px; border-radius: 20px; background: linear-gradient(135deg, ${theme.accent}, ${theme.accentSecondary}); border: 3px solid ${theme.bg}; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: ${theme.bg}; font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
  .profile-edit-btn { position: absolute; bottom: 12px; right: 20px; background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 8px; padding: 6px 14px; font-size: 11px; font-weight: 600; color: ${theme.text}; cursor: pointer; font-family: 'Outfit', sans-serif; }
  .profile-info { padding: 52px 20px 20px; }
  .profile-name { font-size: 22px; font-weight: 800; margin-bottom: 2px; }
  .profile-handle { font-size: 13px; color: ${theme.textMuted}; margin-bottom: 12px; }
  .profile-stats { display: flex; gap: 20px; margin-bottom: 16px; }
  .pstat { text-align: center; }
  .pstat-num { font-size: 20px; font-weight: 800; color: ${theme.text}; }
  .pstat-label { font-size: 10px; color: ${theme.textMuted}; font-weight: 500; }

  .sport-portfolio { background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px; padding: 16px; margin-bottom: 12px; }
  .sport-portfolio-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .sport-icon-sm { width: 36px; height: 36px; border-radius: 10px; background: ${theme.bgElevated}; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .sport-portfolio-title { font-size: 14px; font-weight: 700; }
  .sport-portfolio-sub { font-size: 11px; color: ${theme.textMuted}; }

  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stat-box { background: ${theme.bgElevated}; border-radius: 10px; padding: 10px 8px; text-align: center; }
  .stat-box-val { font-size: 18px; font-weight: 800; color: ${theme.text}; }
  .stat-box-label { font-size: 9px; color: ${theme.textMuted}; font-weight: 500; margin-top: 1px; }

  /* Create form */
  .create-screen { padding: 0 20px 20px; }
  .form-group { margin-bottom: 16px; }
  .form-label { font-size: 12px; font-weight: 600; color: ${theme.textMuted}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
  .form-input { width: 100%; background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; border-radius: 12px; padding: 12px 16px; font-size: 14px; color: ${theme.text}; font-family: 'Outfit', sans-serif; transition: border-color 0.2s; outline: none; }
  .form-input:focus { border-color: ${theme.accent}; }
  .form-input::placeholder { color: ${theme.textDim}; }

  /* ── Date/Time input fix ──
     Without color-scheme:dark, Chrome renders the day/month/year segments
     in light mode on a dark background — they become invisible and keyboard
     entry appears broken (PgUp/PgDn work but number keys don't visibly register).
     This one property fixes keyboard typing, segment visibility, and the icon. */
  input[type="date"],
  input[type="time"],
  input[type="datetime-local"] {
    color-scheme: dark;
  }
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator {
    filter: invert(0.7) sepia(1) saturate(3) hue-rotate(100deg);
    cursor: pointer;
    opacity: 0.85;
  }
  .form-select { width: 100%; background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; border-radius: 12px; padding: 12px 16px; font-size: 14px; color: ${theme.text}; font-family: 'Outfit', sans-serif; outline: none; appearance: none; cursor: pointer; transition: border-color 0.2s; }
  .form-select:focus { border-color: ${theme.accent}; }

  .sport-picker { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .sport-pick-btn { background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; border-radius: 12px; padding: 10px 4px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s; font-family: 'Outfit', sans-serif; color: ${theme.textMuted}; }
  .sport-pick-btn.selected { border-color: ${theme.accent}; background: ${theme.accentDim}; color: ${theme.accent}; }
  .sport-pick-btn span:first-child { font-size: 22px; }
  .sport-pick-btn span:last-child { font-size: 10px; font-weight: 600; }

  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .toggle-group { display: flex; gap: 6px; flex-wrap: wrap; }
  .toggle-btn { background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Outfit', sans-serif; color: ${theme.textMuted}; }
  .toggle-btn.on { border-color: ${theme.accent}; background: ${theme.accentDim}; color: ${theme.accent}; }

  .submit-btn { width: 100%; padding: 16px; background: ${theme.accent}; color: ${theme.bg}; border: none; border-radius: 14px; font-size: 15px; font-weight: 800; cursor: pointer; margin-top: 8px; font-family: 'Outfit', sans-serif; transition: all 0.2s; box-shadow: 0 0 24px ${theme.accent}40; }
  .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 32px ${theme.accent}60; }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  /* Chat */
  .chat-header { padding: 14px 20px; background: ${theme.bgCard}; border-bottom: 1px solid ${theme.border}; display: flex; align-items: center; gap: 12px; }
  .chat-avatar { width: 38px; height: 38px; border-radius: 10px; background: ${theme.accentDim}; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .chat-title { font-size: 14px; font-weight: 700; }
  .chat-sub { font-size: 11px; color: ${theme.textMuted}; }
  .chat-messages { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
  .msg-row { display: flex; gap: 10px; }
  .msg-row.me { flex-direction: row-reverse; }
  .msg-av { width: 32px; height: 32px; border-radius: 8px; background: ${theme.bgElevated}; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .msg-bubble { background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px 16px 16px 4px; padding: 10px 14px; max-width: 70%; }
  .msg-row.me .msg-bubble { background: ${theme.accentDim}; border-color: ${theme.accent}30; border-radius: 16px 16px 4px 16px; }
  .msg-name { font-size: 10px; color: ${theme.accent}; font-weight: 700; margin-bottom: 3px; }
  .msg-text { font-size: 13px; line-height: 1.5; }
  .msg-time { font-size: 9px; color: ${theme.textMuted}; margin-top: 3px; text-align: right; }
  .chat-input-row { position: sticky; bottom: 90px; background: ${theme.bg}; padding: 10px 20px; display: flex; gap: 8px; border-top: 1px solid ${theme.border}; }
  .chat-input { flex: 1; background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; border-radius: 24px; padding: 10px 16px; font-size: 13px; color: ${theme.text}; font-family: 'Outfit', sans-serif; outline: none; transition: border-color 0.2s; }
  .chat-input:focus { border-color: ${theme.accent}; }
  .send-btn { width: 42px; height: 42px; border-radius: 50%; background: ${theme.accent}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: ${theme.bg}; flex-shrink: 0; }

  /* Badges */
  .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: ${theme.danger}; position: absolute; top: 6px; right: 6px; border: 2px solid ${theme.bg}; }
  .rely-badge { display: inline-flex; align-items: center; gap: 4px; border-radius: 6px; padding: 3px 8px; font-size: 10px; font-weight: 700; }
  .rely-badge.reliable { background: #00F5A015; color: ${theme.accent}; }
  .rely-badge.average { background: #FFB80015; color: ${theme.warning}; }
  .stream-badge { display: inline-flex; align-items: center; gap: 5px; background: #FF000020; color: #FF4444; border-radius: 6px; padding: 3px 9px; font-size: 10px; font-weight: 700; }
  .stream-badge.clickable { cursor: pointer; transition: all 0.2s; border: 1px solid #FF444440; }
  .stream-badge.clickable:hover { background: #FF000035; transform: scale(1.04); }

  /* League card */
  .league-card { background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s; display: flex; gap: 14px; align-items: center; }
  .league-card:hover { border-color: ${theme.borderBright}; }
  .league-icon { width: 52px; height: 52px; border-radius: 14px; background: ${theme.bgElevated}; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }
  .league-info { flex: 1; }
  .league-name { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
  .league-meta { font-size: 11px; color: ${theme.textMuted}; }
  .league-arrow { color: ${theme.textMuted}; }

  /* Check-in */
  .checkin-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid ${theme.border}; }
  .checkin-player { display: flex; align-items: center; gap: 10px; }
  .checkin-av { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; border: 2px solid ${theme.border}; }
  .checkin-name { font-size: 13px; font-weight: 600; }
  .checkin-status { font-size: 10px; color: ${theme.textMuted}; }
  .checkin-btn { padding: 5px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; font-family: 'Outfit', sans-serif; }
  .checkin-btn.approve { background: #00F5A020; color: ${theme.accent}; }
  .checkin-btn.checked { background: ${theme.bgElevated}; color: ${theme.textMuted}; }

  /* Fundraise */
  .fund-card { background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px; padding: 16px; margin-bottom: 12px; }
  .fund-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .fund-title { font-size: 14px; font-weight: 700; }
  .fund-cause { font-size: 11px; color: ${theme.textMuted}; margin-top: 2px; }
  .fund-goal-tag { background: ${theme.accentDim}; color: ${theme.accent}; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 700; }
  .progress-bar { background: ${theme.bgElevated}; border-radius: 100px; height: 6px; margin-bottom: 8px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, ${theme.accent}, #00C97E); transition: width 0.5s ease; }
  .fund-stats { display: flex; justify-content: space-between; font-size: 11px; color: ${theme.textMuted}; }
  .fund-raised { color: ${theme.accent}; font-weight: 700; }
  .donors-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
  .donor-chip { background: ${theme.bgElevated}; border-radius: 20px; padding: 4px 10px 4px 6px; display: flex; align-items: center; gap: 5px; font-size: 11px; color: ${theme.textMuted}; }
  .donor-av { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; }

  /* Misc */
  .divider { height: 1px; background: ${theme.border}; margin: 4px 0; }
  .empty-state { text-align: center; padding: 40px 20px; color: ${theme.textMuted}; }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-text { font-size: 14px; }
  .scroll-area { overflow-y: auto; }

  /* Auth screen */
  .auth-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 24px;
  }

  .auth-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 42px;
    letter-spacing: 3px;
    text-align: center;
    margin-bottom: 8px;
  }

  .auth-sub {
    text-align: center;
    color: ${theme.textMuted};
    font-size: 13px;
    margin-bottom: 40px;
  }

  .auth-card {
    background: ${theme.bgCard};
    border: 1px solid ${theme.border};
    border-radius: 20px;
    padding: 24px;
  }

  .auth-title {
    font-size: 18px;
    font-weight: 800;
    margin-bottom: 20px;
    text-align: center;
  }

  .auth-toggle {
    display: flex;
    gap: 0;
    background: ${theme.bgElevated};
    border-radius: 10px;
    padding: 3px;
    margin-bottom: 24px;
  }

  .auth-toggle-btn {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
    background: transparent;
    color: ${theme.textMuted};
    transition: all 0.2s;
  }

  .auth-toggle-btn.active {
    background: ${theme.bgCard};
    color: ${theme.text};
  }

  .auth-error {
    background: #FF475715;
    border: 1px solid ${theme.danger}30;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 12px;
    color: ${theme.danger};
    margin-bottom: 16px;
  }

  /* ── Leaflet dark theme overrides ── */
  .leaflet-popup-content-wrapper {
    background: ${theme.bgElevated};
    color: ${theme.text};
    border: 1px solid ${theme.border};
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }
  .leaflet-popup-tip { background: ${theme.bgElevated}; }
  .leaflet-popup-content { margin: 10px 14px; font-family: 'Outfit', sans-serif; }
  .leaflet-popup-close-button { color: ${theme.textMuted} !important; }
  .leaflet-popup-close-button:hover { color: ${theme.text} !important; }
  .leaflet-container { font-family: 'Outfit', sans-serif; }
  .leaflet-control-attribution { display: none; }
`;
