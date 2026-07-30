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
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: ${theme.bg};
    color: ${theme.text};
    font-family: 'Outfit', sans-serif;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    -webkit-tap-highlight-color: transparent;
  }

  button { font-family: 'Outfit', sans-serif; }
  button:disabled { opacity: .55; cursor: not-allowed; }

  .app-shell {
    width: 100%; max-width: 420px; min-height: 100vh;
    background: ${theme.bg}; position: relative;
  }

  /* Leave room for the fixed nav plus the home-indicator strip on notched phones. */
  .screen {
    min-height: 100vh;
    padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
    animation: fadeIn .25s ease;
  }

  @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px);}  to { opacity: 1; transform: translateY(0);} }
  @keyframes pulse   { 0%,100% { opacity: 1; transform: scale(1);}      50% { opacity: .7; transform: scale(.97);} }
  @keyframes blink   { 0%,100% { opacity: 1;}                            50% { opacity: .3;} }
  @keyframes slideUp { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: translateY(0);} }
  @keyframes spin    { to { transform: rotate(360deg); } }

  /* ── Header ── */
  .header {
    padding: 16px 20px 12px; display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 50; background: ${theme.bg}EE;
    backdrop-filter: blur(12px); border-bottom: 1px solid ${theme.border};
  }
  .logo { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 2px; }
  .logo span { color: ${theme.accent}; }
  .screen-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px; }
  .header-actions { display: flex; gap: 8px; align-items: center; }
  .icon-btn {
    width: 38px; height: 38px; border-radius: 10px; background: ${theme.bgCard};
    border: 1px solid ${theme.border}; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: ${theme.textMuted}; transition: all .2s; position: relative; flex-shrink: 0;
  }
  .icon-btn:hover { border-color: ${theme.accent}; color: ${theme.accent}; }
  .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: ${theme.danger}; position: absolute; top: 6px; right: 6px; border: 2px solid ${theme.bg}; }
  .notif-count {
    position: absolute; top: 3px; right: 3px; min-width: 16px; height: 16px;
    background: ${theme.danger}; border-radius: 8px; border: 2px solid ${theme.bg};
    display: flex; align-items: center; justify-content: center;
    font-size: 8px; font-weight: 800; color: white; padding: 0 3px; line-height: 1;
  }

  /* ── Sections ── */
  .section { padding: 18px 20px; }
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .section-title { font-size: 16px; font-weight: 700; }
  .see-all { font-size: 12px; color: ${theme.accent}; cursor: pointer; background: none; border: none; font-weight: 600; }

  /* ── Segmented control ── */
  .segmented { display: flex; gap: 6px; padding: 0 20px 4px; overflow-x: auto; scrollbar-width: none; }
  .segmented::-webkit-scrollbar { display: none; }
  .seg-btn {
    background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; border-radius: 10px;
    padding: 8px 14px; font-size: 12px; font-weight: 700; color: ${theme.textMuted};
    cursor: pointer; white-space: nowrap; transition: all .2s;
  }
  .seg-btn.on { border-color: ${theme.accent}; background: ${theme.accentDim}; color: ${theme.accent}; }

  /* ── Map ── */
  .map-container { height: 300px; background: ${theme.bgCard}; position: relative; overflow: hidden; border-bottom: 1px solid ${theme.border}; }
  .map-overlay-pill {
    position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
    background: ${theme.bgCard}EE; border: 1px solid ${theme.border}; border-radius: 50px;
    padding: 6px 16px; font-size: 11px; color: ${theme.textMuted};
    backdrop-filter: blur(8px); white-space: nowrap; z-index: 500; pointer-events: none;
  }
  .map-recenter {
    position: absolute; top: 12px; right: 12px; z-index: 500;
    width: 36px; height: 36px; border-radius: 10px;
    background: ${theme.bgCard}EE; border: 1px solid ${theme.border};
    color: ${theme.text}; display: flex; align-items: center; justify-content: center;
    cursor: pointer; backdrop-filter: blur(8px);
  }
  .map-recenter:hover { border-color: ${theme.accent}; color: ${theme.accent}; }

  /* ── Match cards ── */
  .match-card {
    background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px;
    overflow: hidden; margin-bottom: 12px; cursor: pointer; transition: all .2s;
  }
  .match-card:hover { border-color: ${theme.borderBright}; transform: translateY(-2px); box-shadow: 0 8px 24px #00000040; }
  .match-card-header { padding: 14px 16px 10px; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .match-sport-badge { display: flex; align-items: center; gap: 6px; background: ${theme.bgElevated}; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 600; color: ${theme.textMuted}; white-space: nowrap; }
  .match-status { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; border-radius: 20px; padding: 3px 9px; white-space: nowrap; }
  .status-live { background: #FF475715; color: ${theme.danger}; }
  .status-open { background: #00F5A015; color: ${theme.accent}; }
  .status-soon { background: #FFB80015; color: ${theme.warning}; }
  .status-full { background: #6B7A9920; color: ${theme.textMuted}; }
  .status-practice { background: #7B5EA720; color: #A47BDD; }
  .status-cancelled { background: #FF475720; color: ${theme.danger}; }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: blink 1s infinite; }

  .match-title { padding: 0 16px 8px; font-size: 15px; font-weight: 700; }
  .match-meta { padding: 0 16px 14px; display: flex; gap: 14px; flex-wrap: wrap; }
  .meta-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: ${theme.textMuted}; }
  .match-card-footer { padding: 10px 16px; border-top: 1px solid ${theme.border}; display: flex; align-items: center; justify-content: space-between; gap: 8px; }

  .players-row { display: flex; align-items: center; }
  .player-avatar {
    width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${theme.bgCard};
    display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; margin-left: -6px;
  }
  .player-avatar:first-child { margin-left: 0; }
  .players-count { font-size: 11px; color: ${theme.textMuted}; margin-left: 8px; }

  .join-btn {
    background: ${theme.accent}; color: ${theme.bg}; border: none; border-radius: 12px;
    padding: 7px 16px; font-size: 12px; font-weight: 800; cursor: pointer; transition: all .2s; white-space: nowrap;
  }
  .join-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 0 16px ${theme.accent}50; }
  .join-btn.full     { background: ${theme.bgElevated}; color: ${theme.textMuted}; }
  .join-btn.watching { background: ${theme.accentSecondary}; color: white; }
  .join-btn.joined   { background: ${theme.bgElevated}; color: ${theme.accent}; border: 1px solid ${theme.accent}40; }

  /* ── Quick fill ── */
  .quick-fill {
    background: linear-gradient(135deg, ${theme.bgCard}, ${theme.bgElevated});
    border: 1.5px solid ${theme.accent}30; border-radius: 16px; padding: 14px 16px;
    margin-bottom: 12px; cursor: pointer; display: flex; align-items: center; gap: 14px;
    transition: all .2s; position: relative; overflow: hidden;
  }
  .quick-fill::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${theme.accent}; }
  .quick-fill:hover { border-color: ${theme.accent}60; transform: translateX(2px); }
  .quick-fill-icon { width: 46px; height: 46px; border-radius: 12px; background: ${theme.accentDim}; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .quick-fill-title { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
  .quick-fill-sub { font-size: 11px; color: ${theme.textMuted}; }
  .need-badge { background: ${theme.accent}; color: ${theme.bg}; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 800; white-space: nowrap; }

  /* ── League cards ── */
  .league-card {
    background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px;
    padding: 16px; margin-bottom: 12px; cursor: pointer; transition: all .2s;
    display: flex; gap: 14px; align-items: center;
  }
  .league-card:hover { border-color: ${theme.borderBright}; }
  .league-icon { width: 52px; height: 52px; border-radius: 14px; background: ${theme.bgElevated}; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }
  .league-name { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
  .league-meta { font-size: 11px; color: ${theme.textMuted}; }

  /* ── Detail hero + contextual tabs ── */
  .match-hero { background: linear-gradient(180deg, ${theme.bgElevated} 0%, ${theme.bg} 100%); padding: 20px 20px 0; }
  .back-btn {
    width: 36px; height: 36px; border-radius: 10px; background: ${theme.bgCard};
    border: 1px solid ${theme.border}; display: flex; align-items: center; justify-content: center;
    cursor: pointer; margin-bottom: 16px; color: ${theme.text};
  }
  .back-btn:hover { border-color: ${theme.accent}; color: ${theme.accent}; }
  .match-hero-sport { font-size: 11px; font-weight: 600; color: ${theme.accent}; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
  .match-hero-title { font-family: 'Bebas Neue', sans-serif; font-size: 30px; letter-spacing: 1px; line-height: 1.1; margin-bottom: 12px; }

  .ctx-tabs {
    display: flex; gap: 6px; padding: 14px 20px 4px; overflow-x: auto; scrollbar-width: none;
    border-bottom: 1px solid ${theme.border}; position: sticky; top: 0; z-index: 40;
    background: ${theme.bg}EE; backdrop-filter: blur(12px);
  }
  .ctx-tabs::-webkit-scrollbar { display: none; }
  .ctx-tab {
    display: flex; align-items: center; gap: 6px; background: ${theme.bgCard};
    border: 1.5px solid ${theme.border}; border-radius: 10px; padding: 8px 13px;
    font-size: 12px; font-weight: 700; color: ${theme.textMuted}; cursor: pointer;
    white-space: nowrap; margin-bottom: 10px; transition: all .2s;
  }
  .ctx-tab.on { border-color: ${theme.accent}; background: ${theme.accentDim}; color: ${theme.accent}; }

  /* ── Scoreboard + commentary ── */
  .score-board { background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px; padding: 16px; margin: 16px 0; display: flex; align-items: center; justify-content: space-between; }
  .team-score { flex: 1; text-align: center; }
  .team-name-sm { font-size: 11px; color: ${theme.textMuted}; margin-bottom: 4px; font-weight: 600; }
  .score-big { font-family: 'Bebas Neue', sans-serif; font-size: 46px; line-height: 1; }
  .score-sub { font-size: 10px; color: ${theme.textMuted}; margin-top: 2px; }
  .score-vs { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0 16px; }
  .vs-text { font-size: 11px; color: ${theme.textMuted}; font-weight: 700; }

  .commentary-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid ${theme.border}; }
  .over-badge { min-width: 36px; height: 36px; border-radius: 8px; background: ${theme.bgElevated}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: ${theme.textMuted}; flex-shrink: 0; }
  .over-badge.six    { background: #00F5A020; color: ${theme.accent}; }
  .over-badge.four   { background: #7B5EA720; color: #A47BDD; }
  .over-badge.wicket { background: #FF475720; color: ${theme.danger}; }
  .commentary-text { font-size: 13px; line-height: 1.5; color: ${theme.textMuted}; }
  .commentary-text strong { color: ${theme.text}; }

  .role-note { background: ${theme.bgCard}; border: 1px dashed ${theme.borderBright}; border-radius: 12px; padding: 10px 14px; font-size: 11px; color: ${theme.textMuted}; margin-bottom: 14px; line-height: 1.5; }

  /* ── Check-in stepper ── */
  .stepper { margin: 4px 0 18px; }
  .step-row { display: flex; gap: 12px; align-items: flex-start; }
  .step-dot-col { display: flex; flex-direction: column; align-items: center; }
  .step-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid ${theme.border}; background: ${theme.bgCard}; display: flex; align-items: center; justify-content: center; font-size: 11px; color: ${theme.textMuted}; flex-shrink: 0; transition: all .2s; }
  .step-dot.done { background: ${theme.accent}; border-color: ${theme.accent}; color: ${theme.bg}; font-weight: 800; }
  .step-dot.now  { border-color: ${theme.accent}; color: ${theme.accent}; box-shadow: 0 0 12px ${theme.accent}40; }
  .step-line { width: 2px; height: 22px; background: ${theme.border}; }
  .step-line.done { background: ${theme.accent}; }
  .step-label { font-size: 13px; font-weight: 600; padding-top: 2px; color: ${theme.textMuted}; }
  .step-label.done, .step-label.now { color: ${theme.text}; }

  .checkin-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid ${theme.border}; gap: 10px; }
  .checkin-player { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .checkin-av { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; border: 2px solid ${theme.border}; flex-shrink: 0; }
  .checkin-name { font-size: 13px; font-weight: 600; }
  .checkin-status { font-size: 10px; color: ${theme.textMuted}; }
  .checkin-btn { padding: 5px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; }
  .checkin-btn.approve { background: #00F5A020; color: ${theme.accent}; }
  .checkin-btn.checked { background: ${theme.bgElevated}; color: ${theme.textMuted}; }
  .checkin-summary { background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 12px; padding: 12px 14px; margin-bottom: 16px; }

  .rely-badge { display: inline-flex; align-items: center; gap: 4px; border-radius: 6px; padding: 3px 8px; font-size: 10px; font-weight: 700; }
  .rely-badge.reliable { background: #00F5A015; color: ${theme.accent}; }
  .rely-badge.average  { background: #FFB80015; color: ${theme.warning}; }

  /* ── Chat ── */
  .chat-messages { display: flex; flex-direction: column; gap: 14px; padding-bottom: 8px; }
  .msg-row { display: flex; gap: 10px; }
  .msg-row.me { flex-direction: row-reverse; }
  .msg-av { width: 32px; height: 32px; border-radius: 8px; background: ${theme.bgElevated}; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .msg-bubble { background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px 16px 16px 4px; padding: 10px 14px; max-width: 75%; }
  .msg-row.me .msg-bubble { background: ${theme.accentDim}; border-color: ${theme.accent}30; border-radius: 16px 16px 4px 16px; }
  .msg-name { font-size: 10px; color: ${theme.accent}; font-weight: 700; margin-bottom: 3px; }
  .msg-text { font-size: 13px; line-height: 1.5; word-break: break-word; }
  .msg-time { font-size: 9px; color: ${theme.textMuted}; margin-top: 3px; text-align: right; }
  .chat-input-row { display: flex; gap: 8px; padding-top: 10px; border-top: 1px solid ${theme.border}; }
  .chat-input { flex: 1; background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; border-radius: 24px; padding: 10px 16px; font-size: 13px; color: ${theme.text}; font-family: 'Outfit', sans-serif; outline: none; }
  .chat-input:focus { border-color: ${theme.accent}; }
  .send-btn { width: 42px; height: 42px; border-radius: 50%; background: ${theme.accent}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: ${theme.bg}; flex-shrink: 0; }

  /* ── Stream ── */
  .stream-player { background: #000; border: 1px solid ${theme.border}; border-radius: 16px; aspect-ratio: 16/9; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; margin-bottom: 14px; position: relative; overflow: hidden; }
  .stream-player iframe { width: 100%; height: 100%; border: 0; }
  .stream-badge { display: inline-flex; align-items: center; gap: 5px; background: #FF000030; color: #FF4444; border-radius: 6px; padding: 3px 9px; font-size: 10px; font-weight: 700; }
  .stream-badge.clickable { cursor: pointer; border: 1px solid #FF444440; transition: all .2s; }
  .stream-badge.clickable:hover { background: #FF000050; }
  .play-circle { width: 60px; height: 60px; border-radius: 50%; background: ${theme.accent}; display: flex; align-items: center; justify-content: center; font-size: 22px; color: ${theme.bg}; cursor: pointer; box-shadow: 0 0 30px ${theme.accent}60; border: none; }

  /* ── Fundraising ── */
  .fund-card { background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px; padding: 16px; margin-bottom: 12px; }
  .fund-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 10px; }
  .fund-title { font-size: 14px; font-weight: 700; }
  .fund-cause { font-size: 11px; color: ${theme.textMuted}; margin-top: 2px; }
  .fund-goal-tag { background: ${theme.accentDim}; color: ${theme.accent}; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .progress-bar { background: ${theme.bgElevated}; border-radius: 100px; height: 6px; margin-bottom: 8px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, ${theme.accent}, #00C97E); transition: width .5s ease; }
  .fund-stats { display: flex; justify-content: space-between; font-size: 11px; color: ${theme.textMuted}; }
  .fund-raised { color: ${theme.accent}; font-weight: 700; }
  .donors-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
  .donor-chip { background: ${theme.bgElevated}; border-radius: 20px; padding: 4px 10px 4px 6px; display: flex; align-items: center; gap: 5px; font-size: 11px; color: ${theme.textMuted}; }
  .donor-av { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; }
  .amount-row { display: flex; gap: 8px; margin-top: 12px; }
  .amount-btn { flex: 1; background: ${theme.bgElevated}; border: 1.5px solid ${theme.border}; border-radius: 10px; padding: 9px 0; font-size: 13px; font-weight: 800; color: ${theme.textMuted}; cursor: pointer; transition: all .2s; }
  .amount-btn.on { border-color: ${theme.accent}; background: ${theme.accentDim}; color: ${theme.accent}; }

  /* ── Buttons & forms ── */
  .submit-btn {
    width: 100%; padding: 15px; background: ${theme.accent}; color: ${theme.bg};
    border: none; border-radius: 12px; font-size: 15px; font-weight: 800; cursor: pointer;
    transition: all .2s; box-shadow: 0 0 24px ${theme.accent}40;
  }
  .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 32px ${theme.accent}60; }
  .ghost-btn {
    background: ${theme.bgCard}; border: 1px solid ${theme.borderBright}; color: ${theme.text};
    border-radius: 12px; padding: 12px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap;
  }
  .ghost-btn:hover { border-color: ${theme.accent}; color: ${theme.accent}; }

  .form-group { margin-bottom: 16px; }
  .form-label { font-size: 12px; font-weight: 600; color: ${theme.textMuted}; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; display: block; }
  .form-input {
    width: 100%; background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; border-radius: 12px;
    padding: 12px 16px; font-size: 14px; color: ${theme.text}; font-family: 'Outfit', sans-serif;
    outline: none; transition: border-color .2s;
  }
  .form-input:focus { border-color: ${theme.accent}; }
  .form-input::placeholder { color: ${theme.textDim}; }
  .form-input.invalid { border-color: ${theme.danger}; }
  .field-error { font-size: 11px; color: ${theme.danger}; margin-top: 6px; }

  /* Without color-scheme:dark, Chrome paints the date/time segments in light
     mode on our dark field — they vanish and typing looks broken. */
  input[type="date"], input[type="time"], input[type="datetime-local"] { color-scheme: dark; }
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: .85; }

  .form-select {
    width: 100%; background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; border-radius: 12px;
    padding: 12px 16px; font-size: 14px; color: ${theme.text}; font-family: 'Outfit', sans-serif;
    outline: none; cursor: pointer; transition: border-color .2s;
  }
  .form-select:focus { border-color: ${theme.accent}; }

  .sport-picker { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .sport-pick-btn {
    background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; border-radius: 12px;
    padding: 10px 4px; display: flex; flex-direction: column; align-items: center; gap: 4px;
    cursor: pointer; transition: all .2s; color: ${theme.textMuted};
  }
  .sport-pick-btn.selected { border-color: ${theme.accent}; background: ${theme.accentDim}; color: ${theme.accent}; }
  .sport-pick-btn span:first-child { font-size: 22px; }
  .sport-pick-btn span:last-child { font-size: 10px; font-weight: 600; }

  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .toggle-group { display: flex; gap: 6px; flex-wrap: wrap; }
  .toggle-btn {
    background: ${theme.bgCard}; border: 1.5px solid ${theme.border}; border-radius: 8px;
    padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer;
    transition: all .2s; color: ${theme.textMuted};
  }
  .toggle-btn.on { border-color: ${theme.accent}; background: ${theme.accentDim}; color: ${theme.accent}; }

  /* ── Standings ── */
  .standings-table { width: 100%; border-collapse: collapse; }
  .standings-table th { font-size: 10px; color: ${theme.textMuted}; text-transform: uppercase; letter-spacing: .5px; text-align: left; padding: 8px 6px; border-bottom: 1px solid ${theme.border}; }
  .standings-table td { font-size: 13px; padding: 10px 6px; border-bottom: 1px solid ${theme.border}; }
  .standings-table tr:last-child td { border-bottom: none; }
  .pos-badge { width: 22px; height: 22px; border-radius: 6px; background: ${theme.bgElevated}; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: ${theme.textMuted}; }
  .pos-badge.top { background: ${theme.accentDim}; color: ${theme.accent}; }

  /* ── Portfolio ── */
  .portfolio-hero { padding: 20px; background: linear-gradient(135deg, ${theme.bgElevated}, ${theme.bgCard}); border-bottom: 1px solid ${theme.border}; }
  .sport-portfolio { background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 16px; padding: 16px; margin-bottom: 12px; }
  .sport-portfolio-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .sport-icon-sm { width: 36px; height: 36px; border-radius: 10px; background: ${theme.bgElevated}; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .sport-portfolio-title { font-size: 14px; font-weight: 700; }
  .sport-portfolio-sub { font-size: 11px; color: ${theme.textMuted}; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stat-box { background: ${theme.bgElevated}; border-radius: 10px; padding: 10px 8px; text-align: center; }
  .stat-box-val { font-size: 18px; font-weight: 800; }
  .stat-box-label { font-size: 9px; color: ${theme.textMuted}; font-weight: 500; margin-top: 1px; }
  .achieve-row { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid ${theme.border}; }
  .achieve-row:last-child { border-bottom: none; }
  .achieve-icon { width: 38px; height: 38px; border-radius: 10px; background: ${theme.bgElevated}; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .achieve-title { font-size: 13px; font-weight: 700; }
  .achieve-sub { font-size: 11px; color: ${theme.textMuted}; }
  .resume-card { background: linear-gradient(135deg, ${theme.bgElevated}, ${theme.bgCard}); border: 1.5px solid ${theme.accent}40; border-radius: 16px; padding: 18px; box-shadow: 0 0 30px ${theme.accent}15; }

  /* ── Profile ── */
  .profile-cover { height: 150px; background: linear-gradient(135deg, #0F1320, #161C2E, #0F1320); position: relative; overflow: hidden; }
  .profile-cover-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 20% 50%, ${theme.accent}15 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, ${theme.accentSecondary}15 0%, transparent 60%); }
  .profile-avatar-wrap { position: absolute; bottom: -40px; left: 20px; }
  .profile-avatar {
    width: 80px; height: 80px; border-radius: 20px;
    background: linear-gradient(135deg, ${theme.accent}, ${theme.accentSecondary});
    border: 3px solid ${theme.bg}; display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 800; color: ${theme.bg};
    font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px;
  }
  .profile-info { padding: 52px 20px 20px; }
  .profile-name { font-size: 22px; font-weight: 800; margin-bottom: 2px; }
  .profile-stats { display: flex; gap: 22px; margin: 14px 0 16px; }
  .pstat { text-align: center; }
  .pstat-num { font-size: 20px; font-weight: 800; }
  .pstat-label { font-size: 10px; color: ${theme.textMuted}; font-weight: 500; }
  .settings-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid ${theme.border}; cursor: pointer; gap: 12px; }
  .settings-row:last-child { border-bottom: none; }
  .settings-label { font-size: 13px; font-weight: 600; }
  .settings-sub { font-size: 11px; color: ${theme.textMuted}; margin-top: 2px; }
  .switch { width: 42px; height: 24px; border-radius: 24px; background: ${theme.bgElevated}; border: 1px solid ${theme.border}; position: relative; cursor: pointer; transition: all .2s; flex-shrink: 0; }
  .switch.on { background: ${theme.accentDim}; border-color: ${theme.accent}; }
  .switch-knob { width: 18px; height: 18px; border-radius: 50%; background: ${theme.textMuted}; position: absolute; top: 2px; left: 2px; transition: all .2s; }
  .switch.on .switch-knob { left: 20px; background: ${theme.accent}; }

  /* ── Leaderboard ── */
  .lb-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid ${theme.border}; }
  .lb-row:last-child { border-bottom: none; }
  .lb-rank { width: 28px; text-align: center; font-size: 14px; font-weight: 800; color: ${theme.textMuted}; flex-shrink: 0; }
  .lb-avatar { width: 40px; height: 40px; border-radius: 12px; background: ${theme.bgElevated}; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; color: ${theme.accent}; flex-shrink: 0; border: 1.5px solid ${theme.border}; font-family: 'Bebas Neue', sans-serif; }
  .lb-info { flex: 1; min-width: 0; }
  .lb-name { font-size: 13px; font-weight: 700; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lb-sub { font-size: 11px; color: ${theme.textMuted}; }
  .lb-score { text-align: right; flex-shrink: 0; }
  .lb-score-val { font-size: 17px; font-weight: 800; color: ${theme.accent}; line-height: 1; }
  .lb-score-label { font-size: 9px; color: ${theme.textMuted}; font-weight: 500; }

  /* ── Live rail ── */
  .greeting { padding: 16px 20px 4px; }
  .greeting-hi { font-size: 13px; color: ${theme.textMuted}; }
  .greeting-line { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 1px; margin-top: 2px; }
  .greeting-line span { color: ${theme.accent}; }
  .live-rail { display: flex; gap: 10px; overflow-x: auto; padding: 0 20px 4px; scrollbar-width: none; }
  .live-rail::-webkit-scrollbar { display: none; }
  .live-card {
    min-width: 232px; background: ${theme.bgCard}; border: 1.5px solid ${theme.danger}40;
    border-radius: 16px; padding: 12px 14px; cursor: pointer; transition: all .2s;
    box-shadow: 0 0 18px #FF475715;
  }
  .live-card:hover { border-color: ${theme.danger}; transform: translateY(-2px); }
  .expiry-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: ${theme.warning}; font-weight: 700; background: #FFB80012; border-radius: 6px; padding: 3px 8px; margin-top: 6px; }

  /* ── Bottom nav ── */
  .bottom-nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px; background: ${theme.bgCard};
    border-top: 1px solid ${theme.border}; display: flex;
    padding: 10px 0 calc(18px + env(safe-area-inset-bottom, 0px));
    z-index: 100; backdrop-filter: blur(20px);
  }
  .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; background: none; border: none; color: ${theme.textMuted}; transition: all .2s; }
  .nav-item.active { color: ${theme.accent}; }
  .nav-item svg { width: 22px; height: 22px; }
  .nav-item span { font-size: 10px; font-weight: 600; }
  .nav-fab { flex: 1; display: flex; flex-direction: column; align-items: center; cursor: pointer; margin-top: -26px; }
  .fab-btn { width: 54px; height: 54px; border-radius: 50%; background: ${theme.accent}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 24px ${theme.accent}60; border: none; cursor: pointer; transition: all .2s; color: ${theme.bg}; }
  .fab-btn:hover { transform: scale(1.08); }

  /* ── Sheets, toasts, states ── */
  .sheet-backdrop { position: fixed; inset: 0; background: #00000090; z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
  .sheet { width: 100%; max-width: 420px; background: ${theme.bgCard}; border: 1px solid ${theme.borderBright}; border-radius: 20px 20px 0 0; padding: 18px 20px 30px; animation: slideUp .25s ease; max-height: 82vh; overflow-y: auto; }
  .sheet-handle { width: 40px; height: 4px; border-radius: 4px; background: ${theme.borderBright}; margin: 0 auto 16px; }
  .sheet-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .notif-row { display: flex; gap: 12px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid ${theme.border}; }
  .notif-row:last-child { border-bottom: none; }

  /* Anything tappable gets a visible keyboard focus ring. */
  :focus-visible {
    outline: 2px solid ${theme.accent};
    outline-offset: 2px;
    border-radius: 8px;
  }

  .toast {
    position: fixed; bottom: calc(104px + env(safe-area-inset-bottom, 0px)); left: 50%; transform: translateX(-50%);
    background: ${theme.bgElevated}; border: 1px solid ${theme.accent}50;
    border-radius: 12px; padding: 11px 18px; font-size: 13px; font-weight: 600;
    color: ${theme.text}; z-index: 300; max-width: 92%; text-align: center;
    box-shadow: 0 8px 30px #00000080, 0 0 20px ${theme.accent}20;
    animation: slideUp .25s ease;
  }
  .toast.error   { border-color: ${theme.danger}60; box-shadow: 0 8px 30px #00000080, 0 0 20px ${theme.danger}20; }
  .toast.warning { border-color: ${theme.warning}60; box-shadow: 0 8px 30px #00000080, 0 0 20px ${theme.warning}20; }

  .empty-state { text-align: center; padding: 40px 20px; color: ${theme.textMuted}; }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-text { font-size: 14px; }
  .spinner { width: 16px; height: 16px; border: 2px solid ${theme.bg}40; border-top-color: ${theme.bg}; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; vertical-align: -3px; }

  /* ── Auth ── */
  .auth-screen { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 40px 24px; }
  .auth-logo { font-family: 'Bebas Neue', sans-serif; font-size: 42px; letter-spacing: 3px; text-align: center; margin-bottom: 8px; }
  .auth-sub { text-align: center; color: ${theme.textMuted}; font-size: 13px; margin-bottom: 36px; }
  .auth-card { background: ${theme.bgCard}; border: 1px solid ${theme.border}; border-radius: 20px; padding: 24px; }
  .auth-toggle { display: flex; background: ${theme.bgElevated}; border-radius: 10px; padding: 3px; margin-bottom: 24px; }
  .auth-toggle-btn { flex: 1; padding: 8px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; background: transparent; color: ${theme.textMuted}; transition: all .2s; }
  .auth-toggle-btn.active { background: ${theme.bgCard}; color: ${theme.text}; }
  .auth-error   { background: #FF475715; border: 1px solid ${theme.danger}30; border-radius: 10px; padding: 10px 14px; font-size: 12px; color: ${theme.danger}; margin-bottom: 16px; line-height: 1.5; }
  .auth-success { background: #00F5A015; border: 1px solid ${theme.accent}30; border-radius: 10px; padding: 10px 14px; font-size: 12px; color: ${theme.accent}; margin-bottom: 16px; line-height: 1.5; }

  /* ── Leaflet dark overrides ── */
  .leaflet-popup-content-wrapper { background: ${theme.bgElevated}; color: ${theme.text}; border: 1px solid ${theme.border}; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,.5); }
  .leaflet-popup-tip { background: ${theme.bgElevated}; }
  .leaflet-popup-content { margin: 10px 14px; font-family: 'Outfit', sans-serif; }
  .leaflet-popup-close-button { color: ${theme.textMuted} !important; }
  .leaflet-popup-close-button:hover { color: ${theme.text} !important; }
  .leaflet-container { font-family: 'Outfit', sans-serif; background: ${theme.bg}; }
  .leaflet-control-attribution { display: none; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
`;
