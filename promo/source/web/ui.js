// Canvas renditions of the real PlayPulse screens, drawn with the app's own
// tokens (src/styles/theme.js) at 2x a 390x844 phone. Each draw function takes
// a plain state object so scenes can animate any element from time alone.

import { clamp, lerp, ease } from "./util.js";

export const T = {
  bg: "#080B14", bgCard: "#0F1320", bgElevated: "#161C2E",
  accent: "#00F5A0", accentDim: "#00F5A020", accentSecondary: "#7B5EA7",
  danger: "#FF4757", warning: "#FFB800", text: "#F0F4FF",
  textMuted: "#6B7A99", textDim: "#3A4460", border: "#1E2640", borderBright: "#2A3560",
  blue: "#4A9EFF", purpleText: "#A47BDD",
};
export const SPORT_COLOR = {
  Cricket: T.accent, Football: "#FF6B6B", Basketball: "#FFB800", Badminton: "#A29BFE",
  Tennis: "#55EFC4", Volleyball: "#FD79A8",
};
const AV_COLORS = ["#00F5A0", "#FF6B6B", "#4ECDC4", "#FFB800", "#A29BFE", "#FD79A8", "#55EFC4", "#74B9FF"];

export const W = 390, H = 844, S = 2;
const EMOJI = '"Noto Color Emoji"';
export const F = (weight, size, family = "Outfit") =>
  family === "Bebas" ? `${size}px "Bebas Neue", ${EMOJI}` : `${weight} ${size}px Outfit, ${EMOJI}`;

// Demo board shown in the film. Names, venues and times are illustrative.
export const MATCHES = [
  { id: 1, sport: "Cricket", emoji: "🏏", title: "Sunday Cricket at the Park", location: "Riverside Ground",
    dist: "1.2 km", time: "Sun · 7:00 AM", joined: 9, max: 12, skill: "Intermediate", status: "open", kind: "pickup" },
  { id: 2, sport: "Football", emoji: "⚽", title: "Floodlit 5-a-side", location: "Central Turf",
    dist: "0.8 km", time: "Today · 6:30 PM", joined: 8, max: 10, skill: "All levels", status: "live", kind: "pickup" },
  { id: 3, sport: "Basketball", emoji: "🏀", title: "Campus Courts 3v3", location: "North Campus",
    dist: "2.1 km", time: "Today · 7:15 PM", joined: 5, max: 6, skill: "Advanced", status: "soon", kind: "pickup" },
  { id: 4, sport: "Cricket", emoji: "🏏", title: "Box Cricket League", location: "Eastside Box",
    dist: "1.9 km", time: "Live now", joined: 12, max: 12, skill: "Intermediate", status: "live", kind: "league" },
  { id: 5, sport: "Badminton", emoji: "🏸", title: "Doubles Night", location: "Sports Hall B",
    dist: "1.6 km", time: "Today · 8:00 PM", joined: 3, max: 4, skill: "Beginner", status: "open", kind: "pickup" },
  { id: 6, sport: "Football", emoji: "⚽", title: "Sunday League Fixture", location: "Lakeside Park",
    dist: "3.4 km", time: "Sun · 10:00 AM", joined: 14, max: 22, skill: "Intermediate", status: "open", kind: "league" },
];

// ───────────────────────────── primitives ─────────────────────────────

export function makeCanvas(w = W, h = H, scale = S) {
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const g = c.getContext("2d");
  g.scale(scale, scale);
  return { c, g, w, h };
}

export function rr(g, x, y, w, h, r, fill, stroke, lw = 1) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}

export function txt(g, s, x, y, font, color, align = "left", ls = 0, base = "alphabetic") {
  g.font = font; g.fillStyle = color; g.textAlign = align; g.textBaseline = base;
  g.letterSpacing = `${ls}px`;
  g.fillText(s, x, y);
  g.letterSpacing = "0px";
  return g.measureText(s).width;
}

export function tw(g, s, font, ls = 0) {
  g.font = font; g.letterSpacing = `${ls}px`;
  const w = g.measureText(s).width; g.letterSpacing = "0px"; return w;
}

function wrap(g, s, x, y, maxW, lh, font, color) {
  g.font = font;
  const words = s.split(" "); let line = ""; let yy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (g.measureText(test).width > maxW && line) { txt(g, line, x, yy, font, color); line = w; yy += lh; }
    else line = test;
  }
  if (line) txt(g, line, x, yy, font, color);
  return yy;
}

export function avatar(g, name, x, y, size, radius = size / 2, ring = T.bgCard) {
  const col = AV_COLORS[(name.charCodeAt(0) + name.length) % AV_COLORS.length];
  rr(g, x, y, size, size, radius, col, ring, 2);
  txt(g, name[0].toUpperCase(), x + size / 2, y + size / 2 + 1, F(800, size * 0.42), T.bg, "center", 0, "middle");
}

function statusPill(g, status, x, y, alignRight = true) {
  const cfg = {
    live: [T.danger, "#FF475726", "LIVE"], open: [T.accent, "#00F5A026", "OPEN"],
    soon: [T.warning, "#FFB80026", "SOON"], full: [T.textMuted, "#6B7A9933", "FULL"],
    practice: [T.purpleText, "#7B5EA733", "PRACTICE"],
  }[status];
  const font = F(700, 10);
  const w = tw(g, cfg[2], font, 0.3) + (status === "live" ? 30 : 18);
  const px = alignRight ? x - w : x;
  rr(g, px, y, w, 20, 10, cfg[1]);
  let tx = px + 9;
  if (status === "live") { g.beginPath(); g.arc(px + 12, y + 10, 3, 0, Math.PI * 2); g.fillStyle = cfg[0]; g.fill(); tx = px + 20; }
  txt(g, cfg[2], tx, y + 14, font, cfg[0], "left", 0.3);
  return w;
}

// Minimal stroke icons matching the app's inline SVGs.
const icon = {
  map(g, x, y, c) {
    g.strokeStyle = c; g.lineWidth = 2; g.lineJoin = "round"; g.beginPath();
    g.moveTo(x + 1, y + 6); g.lineTo(x + 1, y + 22); g.lineTo(x + 8, y + 18); g.lineTo(x + 16, y + 22);
    g.lineTo(x + 23, y + 18); g.lineTo(x + 23, y + 2); g.lineTo(x + 16, y + 6); g.lineTo(x + 8, y + 2); g.closePath();
    g.moveTo(x + 8, y + 2); g.lineTo(x + 8, y + 18); g.moveTo(x + 16, y + 6); g.lineTo(x + 16, y + 22); g.stroke();
  },
  compass(g, x, y, c) {
    g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(x + 12, y + 12, 10, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(x + 16.2, y + 7.8); g.lineTo(x + 14.1, y + 14.1); g.lineTo(x + 7.8, y + 16.2); g.lineTo(x + 9.9, y + 9.9); g.closePath(); g.stroke();
  },
  bars(g, x, y, c) {
    g.strokeStyle = c; g.lineWidth = 2; g.lineCap = "round"; g.beginPath();
    g.moveTo(x + 18, y + 20); g.lineTo(x + 18, y + 10); g.moveTo(x + 12, y + 20); g.lineTo(x + 12, y + 4);
    g.moveTo(x + 6, y + 20); g.lineTo(x + 6, y + 14); g.stroke();
  },
  person(g, x, y, c) {
    g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(x + 12, y + 7, 4, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(x + 4, y + 21); g.lineTo(x + 4, y + 19); g.quadraticCurveTo(x + 4, y + 15, x + 8, y + 15);
    g.lineTo(x + 16, y + 15); g.quadraticCurveTo(x + 20, y + 15, x + 20, y + 19); g.lineTo(x + 20, y + 21); g.stroke();
  },
  search(g, x, y, c) {
    g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(x + 7, y + 7, 5.5, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(x + 11, y + 11); g.lineTo(x + 15, y + 15); g.stroke();
  },
  bell(g, x, y, c) {
    g.strokeStyle = c; g.lineWidth = 2; g.lineJoin = "round"; g.beginPath();
    g.moveTo(x + 2, y + 13); g.quadraticCurveTo(x + 4, y + 11, x + 4, y + 7); g.quadraticCurveTo(x + 4, y + 1, x + 9, y + 1);
    g.quadraticCurveTo(x + 14, y + 1, x + 14, y + 7); g.quadraticCurveTo(x + 14, y + 11, x + 16, y + 13); g.closePath(); g.stroke();
    g.beginPath(); g.arc(x + 9, y + 15.5, 2, 0, Math.PI); g.stroke();
  },
  back(g, x, y, c) {
    g.strokeStyle = c; g.lineWidth = 2.5; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath();
    g.moveTo(x + 14, y + 8); g.lineTo(x + 2, y + 8); g.moveTo(x + 7, y + 14); g.lineTo(x + 1, y + 8); g.lineTo(x + 7, y + 2); g.stroke();
  },
  share(g, x, y, c) {
    g.strokeStyle = c; g.lineWidth = 1.8;
    for (const [cx, cy] of [[11, 3], [3, 7.5], [11, 12]]) { g.beginPath(); g.arc(x + cx, y + cy, 2.2, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.moveTo(x + 5, y + 8.6); g.lineTo(x + 9, y + 10.9); g.moveTo(x + 9, y + 4.1); g.lineTo(x + 5, y + 6.4); g.stroke();
  },
  send(g, x, y, c) {
    g.fillStyle = c; g.beginPath(); g.moveTo(x, y + 1); g.lineTo(x + 16, y + 8); g.lineTo(x, y + 15); g.lineTo(x + 3, y + 8); g.closePath(); g.fill();
  },
};

// ───────────────────────────── shared chrome ─────────────────────────────

function statusBar(g) {
  txt(g, "9:41", 34, 31, F(700, 15), T.text);
  rr(g, W / 2 - 60, 11, 120, 34, 17, "#000");
  // signal, wifi, battery
  for (let i = 0; i < 4; i++) rr(g, 290 + i * 5, 26 - i * 3, 3, 5 + i * 3, 1, T.text);
  g.strokeStyle = T.text; g.lineWidth = 2;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(323, 32, 3 + i * 4, -Math.PI * 0.75, -Math.PI * 0.25); g.stroke(); }
  rr(g, 335, 19, 25, 13, 4, null, T.text, 1.2); rr(g, 337.5, 21.5, 17, 8, 2, T.text); rr(g, 361, 23, 2, 5, 1, T.text);
}

function header(g, title) {
  g.fillStyle = T.bg; g.fillRect(0, 44, W, 62);
  if (title) txt(g, title, 20, 85, F(400, 22, "Bebas"), T.text, "left", 2);
  else {
    const w = txt(g, "PLAY", 20, 87, F(400, 26, "Bebas"), T.text, "left", 2);
    txt(g, "PULSE", 20 + w, 87, F(400, 26, "Bebas"), T.accent, "left", 2);
  }
  rr(g, 286, 56, 38, 38, 10, T.bgCard, T.border);
  icon.search(g, 297, 67, T.textMuted);
  rr(g, 332, 56, 38, 38, 10, T.bgCard, T.border);
  icon.bell(g, 342, 66, T.textMuted);
  rr(g, 352, 58, 16, 16, 8, T.danger, T.bg, 2);
  txt(g, "3", 360, 70, F(800, 8), "#fff", "center");
  g.fillStyle = T.border; g.fillRect(0, 105, W, 1);
}

export function bottomNav(g, active = "map", fabGlow = 0) {
  const y = 762;
  g.fillStyle = T.bgCard; g.fillRect(0, y, W, H - y);
  g.fillStyle = T.border; g.fillRect(0, y, W, 1);
  const items = [["map", "Map"], ["matches", "Matches"], ["fab"], ["portfolio", "Portfolio"], ["profile", "Me"]];
  items.forEach(([id, label], i) => {
    const cx = 39 + i * 78;
    if (id === "fab") {
      g.save(); g.shadowColor = T.accent; g.shadowBlur = 24 + fabGlow * 30;
      g.beginPath(); g.arc(cx, y + 2, 27 * (1 + fabGlow * 0.08), 0, Math.PI * 2); g.fillStyle = T.accent; g.fill(); g.restore();
      g.strokeStyle = T.bg; g.lineWidth = 3; g.lineCap = "round"; g.beginPath();
      g.moveTo(cx, y - 7); g.lineTo(cx, y + 11); g.moveTo(cx - 9, y + 2); g.lineTo(cx + 9, y + 2); g.stroke();
      return;
    }
    const c = id === active ? T.accent : T.textMuted;
    const draw = { map: icon.map, matches: icon.compass, portfolio: icon.bars, profile: icon.person }[id];
    draw(g, cx - 11, y + 14, c);
    txt(g, label, cx, y + 52, F(600, 10), c, "center");
  });
  rr(g, W / 2 - 67, H - 10, 134, 5, 3, T.text + "CC");
}

// ───────────────────────────── map screen ─────────────────────────────

// Mini map pins in map-container space (0..350, 0..200).
const MINI_PINS = [
  [0, 108, 120], [1, 190, 70], [2, 270, 132], [3, 52, 52], [4, 300, 58], [5, 214, 160],
];

function miniMap(g, x, y, w, h, st) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = "#0B1020"; g.fillRect(x, y, w, h);
  // parks + river
  g.fillStyle = "#0E2A22"; g.beginPath(); g.ellipse(x + 80, y + 150, 60, 30, 0.3, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(x + 290, y + 40, 40, 22, -0.2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#10213F"; g.lineWidth = 16; g.beginPath(); g.moveTo(x - 10, y + 30);
  g.bezierCurveTo(x + 120, y + 60, x + 200, y + 10, x + w + 10, y + 100); g.stroke();
  // streets
  g.strokeStyle = "#1A2340"; g.lineWidth = 2;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(x + i * 44 - 10, y); g.lineTo(x + i * 44 + 20, y + h); g.stroke(); }
  for (let j = 0; j < 6; j++) { g.beginPath(); g.moveTo(x, y + j * 38 + 8); g.lineTo(x + w, y + j * 38 - 6); g.stroke(); }
  g.strokeStyle = "#24305A"; g.lineWidth = 4;
  g.beginPath(); g.moveTo(x, y + 96); g.lineTo(x + w, y + 84); g.stroke();
  g.beginPath(); g.moveTo(x + 168, y); g.lineTo(x + 182, y + h); g.stroke();
  // you
  const ux = x + 175, uy = y + 104;
  g.beginPath(); g.arc(ux, uy, 18 + 8 * ((st.t || 0) % 1), 0, Math.PI * 2); g.fillStyle = "#4A9EFF22"; g.fill();
  g.beginPath(); g.arc(ux, uy, 8, 0, Math.PI * 2); g.fillStyle = T.blue; g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 2.5; g.stroke();
  // pins
  for (const [mi, px, py] of MINI_PINS) {
    const m = MATCHES[mi];
    const on = st.sport === "All" || !st.sport || st.sport === m.sport;
    const isLive = m.status === "live";
    const a = on ? 1 : 0.25;
    g.globalAlpha = a;
    const col = SPORT_COLOR[m.sport];
    if (isLive && on) {
      const p = ((st.t || 0) * 1.2) % 1;
      g.beginPath(); g.arc(x + px, y + py, 18 + p * 16, 0, Math.PI * 2);
      g.strokeStyle = col; g.globalAlpha = (1 - p) * 0.8; g.lineWidth = 2; g.stroke(); g.globalAlpha = a;
    }
    g.save(); g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 10;
    g.beginPath(); g.arc(x + px, y + py, 17, 0, Math.PI * 2);
    g.fillStyle = isLive ? col + "33" : T.bgCard; g.fill(); g.restore();
    g.beginPath(); g.arc(x + px, y + py, 17, 0, Math.PI * 2);
    g.strokeStyle = isLive ? col : T.borderBright; g.lineWidth = 2; g.stroke();
    txt(g, m.emoji, x + px, y + py + 1, `17px ${EMOJI}`, "#fff", "center", 0, "middle");
    g.globalAlpha = 1;
  }
  g.restore();
  // overlay pill + recenter
  const label = st.sport && st.sport !== "All" ? `${MATCHES.filter((m) => m.sport === st.sport).length} ${st.sport.toLowerCase()} games within 5 km` : "6 games within 5 km";
  const pw = tw(g, label, F(500, 11)) + 32;
  rr(g, x + w / 2 - pw / 2, y + h - 34, pw, 24, 12, T.bgCard + "EE", T.border);
  txt(g, label, x + w / 2, y + h - 18, F(500, 11), T.textMuted, "center");
  rr(g, x + w - 48, y + 12, 36, 36, 10, T.bgCard + "EE", T.border);
  g.strokeStyle = T.text; g.lineWidth = 2; g.beginPath(); g.arc(x + w - 30, y + 30, 6, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(x + w - 30, y + 19); g.lineTo(x + w - 30, y + 23); g.moveTo(x + w - 30, y + 37); g.lineTo(x + w - 30, y + 41);
  g.moveTo(x + w - 41, y + 30); g.lineTo(x + w - 37, y + 30); g.moveTo(x + w - 23, y + 30); g.lineTo(x + w - 19, y + 30); g.stroke();
}

function chipRow(g, items, y, active, pulse = 0) {
  let x = 20;
  for (const label of items) {
    const font = F(700, 12);
    const w = tw(g, label, font) + 28;
    const on = label.endsWith(active) || label === active;
    if (on && pulse > 0) { g.save(); g.shadowColor = T.accent; g.shadowBlur = 22 * pulse; rr(g, x, y, w, 34, 10, T.accentDim, T.accent, 1.5); g.restore(); }
    rr(g, x, y, w, 34, 10, on ? T.accentDim : T.bgCard, on ? T.accent : T.border, 1.5);
    txt(g, label, x + w / 2, y + 22, font, on ? T.accent : T.textMuted, "center");
    x += w + 6;
  }
}

export function matchCard(g, m, x, y, w, opts = {}) {
  const h = 152;
  rr(g, x, y, w, h, 16, T.bgCard, opts.highlight ? T.accent + "90" : T.border, opts.highlight ? 1.5 : 1);
  const badge = `${m.emoji} ${m.sport}${m.kind === "league" ? " · League" : ""}`;
  const bw = tw(g, badge, F(600, 11)) + 20;
  rr(g, x + 16, y + 14, bw, 24, 8, T.bgElevated);
  txt(g, badge, x + 26, y + 30, F(600, 11), T.textMuted);
  statusPill(g, m.status, x + w - 16, y + 16);
  txt(g, m.title, x + 16, y + 62, F(700, 15), T.text);
  let mx = x + 16;
  for (const item of [`📍 ${m.dist}`, `🕐 ${m.time}`, `👥 ${opts.joined ?? m.joined}/${m.max}`, `🎯 ${m.skill}`]) {
    const iw = txt(g, item, mx, y + 86, F(400, 11), T.textMuted);
    mx += iw + 14;
    if (mx > x + w - 40) break;
  }
  g.fillStyle = T.border; g.fillRect(x, y + 104, w, 1);
  const names = ["Arjun", "Priya", "Sam", "Meera"];
  names.forEach((n, i) => avatar(g, n, x + 16 + i * 18, y + 116, 24));
  txt(g, `${opts.joined ?? m.joined} joined`, x + 16 + 4 * 18 + 14, y + 132, F(400, 11), T.textMuted);
  const label = m.status === "live" ? "Watch Live" : opts.joinedMe ? "✓ Joined" : "Join →";
  const bwid = tw(g, label, F(800, 12)) + 32;
  const bx = x + w - 16 - bwid;
  rr(g, bx, y + 114, bwid, 28, 12, m.status === "live" ? T.accentSecondary : opts.joinedMe ? T.bgElevated : T.accent,
     opts.joinedMe ? T.accent + "66" : null);
  txt(g, label, bx + bwid / 2, y + 133, F(800, 12), m.status === "live" ? "#fff" : opts.joinedMe ? T.accent : T.bg, "center");
  return h;
}

export function drawMapScreen(ctx, st = {}) {
  const { g } = ctx;
  g.fillStyle = T.bg; g.fillRect(0, 0, W, H);
  statusBar(g);
  header(g);
  txt(g, "Good evening 👋", 20, 136, F(400, 13), T.textMuted);
  const lw = txt(g, "2 LIVE", 20, 164, F(400, 24, "Bebas"), T.accent, "left", 1);
  txt(g, " · 4 FILLING NEAR YOU", 20 + lw, 164, F(400, 24, "Bebas"), T.text, "left", 1);
  // live rail
  [MATCHES[1], MATCHES[3]].forEach((m, i) => {
    const x = 20 + i * 242;
    g.save(); g.shadowColor = "#FF475730"; g.shadowBlur = 18;
    rr(g, x, 184, 232, 82, 16, T.bgCard, T.danger + "66", 1.5); g.restore();
    statusPill(g, "live", x + 14, 196, false);
    txt(g, `${m.joined}/${m.max} playing`, x + 218, 210, F(400, 10), T.textMuted, "right");
    txt(g, `${m.emoji} ${m.title}`, x + 14, 238, F(700, 13), T.text);
    txt(g, `📍 ${m.location}`, x + 14, 256, F(400, 11), T.textMuted);
  });
  miniMap(g, 0, 280, W, 196, st);
  g.fillStyle = T.border; g.fillRect(0, 476, W, 1);
  chipRow(g, ["All", "Matches", "Leagues", "Practice"], 490, "All");
  chipRow(g, ["🌐 All", "🏏 Cricket", "⚽ Football", "🏀 Basketball", "🏸 Badminton"], 532, st.sport || "All", st.chipPulse || 0);
  txt(g, "Near you now", 20, 600, F(700, 16), T.text);
  txt(g, "See all", 370, 600, F(600, 12), T.accent, "right");
  const list = MATCHES.filter((m) => !st.sport || st.sport === "All" || m.sport === st.sport);
  let y = 614 - (st.scroll || 0);
  for (const m of list) { y += matchCard(g, m, 20, y, 350, { highlight: st.highlight === m.id }) + 12; if (y > H) break; }
  bottomNav(g, "map");
}

// ───────────────────────────── match detail ─────────────────────────────

export const HERO_MATCH = MATCHES[0];

function ctxTabs(g, y, active) {
  g.fillStyle = T.bg + "EE"; g.fillRect(0, y, W, 56);
  let x = 20;
  for (const [key, label] of [["overview", "ℹ️ Overview"], ["chat", "💬 Chat"], ["score", "📊 Score"], ["stream", "▶ Stream"], ["checkin", "✅ Check-in"]]) {
    const w = tw(g, label, F(700, 12)) + 26;
    const on = key === active;
    rr(g, x, y + 12, w, 34, 10, on ? T.accentDim : T.bgCard, on ? T.accent : T.border, 1.5);
    txt(g, label, x + w / 2, y + 34, F(700, 12), on ? T.accent : T.textMuted, "center");
    x += w + 6;
  }
  g.fillStyle = T.border; g.fillRect(0, y + 55, W, 1);
}

function hero(g, st) {
  const m = HERO_MATCH;
  const grd = g.createLinearGradient(0, 44, 0, 270);
  grd.addColorStop(0, T.bgElevated); grd.addColorStop(1, T.bg);
  g.fillStyle = grd; g.fillRect(0, 44, W, 226);
  rr(g, 20, 58, 36, 36, 10, T.bgCard, T.border);
  icon.back(g, 30, 68, T.text);
  txt(g, `${m.emoji} ${m.sport.toUpperCase()} · ${m.dist.toUpperCase()}`, 20, 120, F(600, 11), T.accent, "left", 1);
  txt(g, m.title.toUpperCase(), 20, 154, F(400, 30, "Bebas"), T.text, "left", 1);
  const pw = statusPill(g, st.live ? "live" : "open", 20, 168, false);
  txt(g, `📍 ${m.location}`, 20 + pw + 10, 182, F(400, 11), T.textMuted);
  txt(g, `🕐 ${m.time}`, 20 + pw + 130, 182, F(400, 11), T.textMuted);
  txt(g, "🧑‍💼 Organised by Priya", 20, 206, F(400, 11), T.textMuted);
  g.beginPath(); g.arc(23.5, 232, 3.5, 0, Math.PI * 2); g.fillStyle = T.accent; g.fill();
  txt(g, `${st.count ?? m.joined}/${m.max} players joined · starts in 2h`, 34, 236, F(600, 11), T.accent);
}

function overviewBody(g, y, st) {
  rr(g, 20, y, 350, 62, 14, "#00F5A010", "#00F5A030");
  txt(g, "☀️", 36, y + 40, `28px ${EMOJI}`, "#fff");
  txt(g, "24°C · Clear", 80, y + 26, F(700, 13), T.text);
  txt(g, "💨 8 km/h · Good conditions for play", 80, y + 44, F(400, 11), T.textMuted);
  y += 84;
  y = wrap(g, "Open pickup cricket at Riverside Ground. Skill level: Intermediate. Fair play rules apply.", 20, y, 350, 22, F(400, 13), T.textMuted);
  txt(g, "🎒 Bring/provided: Ball, Cones", 20, y + 22, F(400, 13), T.textMuted);
  y += 46;
  // join + share
  const joined = st.joined;
  const press = st.press || 0;
  g.save();
  const bx = 20, bw = 248, bh = 50;
  g.translate(bx + bw / 2, y + bh / 2); g.scale(1 - press * 0.05, 1 - press * 0.05); g.translate(-(bx + bw / 2), -(y + bh / 2));
  if (!joined) { g.shadowColor = T.accent; g.shadowBlur = 24 + 20 * (st.glow || 0); }
  rr(g, bx, y, bw, bh, 12, joined ? T.bgElevated : T.accent, joined ? T.accent + "66" : null);
  g.restore();
  txt(g, joined ? "✓ You're in · tap to leave" : "✓ Join Match", bx + bw / 2, y + 31, F(800, 15), joined ? T.accent : T.bg, "center");
  rr(g, 278, y, 92, bh, 12, st.shareGlow ? T.accentDim : T.bgCard, st.shareGlow ? T.accent : T.borderBright);
  icon.share(g, 296, y + 18, st.shareGlow ? T.accent : T.text);
  txt(g, "Share", 334, y + 30, F(600, 13), st.shareGlow ? T.accent : T.text, "center");
  if (st.ripple != null && st.ripple >= 0 && st.ripple < 1) {
    const p = ease.outCubic(st.ripple);
    g.beginPath(); g.arc(st.rippleX ?? 144, y + 25, 10 + p * 90, 0, Math.PI * 2);
    g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - p)})`; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.arc(st.rippleX ?? 144, y + 25, 22 * (1 - p * 0.4), 0, Math.PI * 2);
    g.fillStyle = `rgba(255,255,255,${0.35 * (1 - p)})`; g.fill();
  }
  y += 64;
  rr(g, 20, y, 350, 46, 12, st.calGlow ? T.accentDim : T.bgCard, st.calGlow ? T.accent : T.borderBright);
  txt(g, st.calDone ? "📅 Added to your calendar" : "📅 Add to calendar", 195, y + 29, F(600, 13), st.calGlow ? T.accent : T.text, "center");
  y += 70;
  txt(g, "Players", 20, y, F(700, 14), T.text);
  txt(g, `${st.count ?? 9} of 12`, 370, y, F(600, 12), T.textMuted, "right");
  y += 16;
  const names = ["Priya", "Arjun", "Sam", "Meera", "Kabir", "Aisha", "Dev", "Rahul", "Zoe"];
  if (joined) names.push("You");
  names.forEach((n, i) => {
    const pop = n === "You" ? ease.outBack(clamp(st.youPop ?? 1)) : 1;
    const cx = 20 + (i % 9) * 38, cy = y + Math.floor(i / 9) * 42;
    g.save(); g.translate(cx + 16, cy + 16); g.scale(pop, pop); g.translate(-(cx + 16), -(cy + 16));
    avatar(g, n, cx, cy, 32, 10, n === "You" ? T.accent : T.border);
    g.restore();
  });
}

export const CHAT = {
  match: [
    ["Priya", "Pitch is booked 7–9 🏏", "6:02 PM"],
    ["Arjun", "Bringing the stumps + 2 balls", "6:04 PM"],
    ["me", "I'm in! See you there 🙌", "6:05 PM"],
    ["Sam", "Who's got the toss coin? 😄", "6:07 PM"],
  ],
  team: [
    ["Meera", "Tigers — we bat first if we win the toss", "6:10 PM"],
    ["me", "I'll open with Kabir", "6:11 PM"],
    ["Kabir", "Let's go 💪", "6:11 PM"],
  ],
};

export function chatBody(g, x, y, w, st) {
  const ch = st.channel || "match";
  rr(g, x, y, 136, 32, 10, ch === "match" ? T.accentDim : T.bgCard, ch === "match" ? T.accent : T.border, 1.5);
  txt(g, "🌐 Match Chat", x + 68, y + 21, F(700, 12), ch === "match" ? T.accent : T.textMuted, "center");
  rr(g, x + 144, y, 130, 32, 10, ch === "team" ? T.accentDim : T.bgCard, ch === "team" ? T.accent : T.border, 1.5);
  txt(g, "🔒 Team Chat", x + 209, y + 21, F(700, 12), ch === "team" ? T.accent : T.textMuted, "center");
  y += 50;
  const msgs = CHAT[ch];
  const shown = st.shown ?? msgs.length;
  msgs.forEach(([who, text, time], i) => {
    if (i >= Math.ceil(shown)) return;
    const pop = clamp(shown - i);
    const me = who === "me";
    g.save(); g.globalAlpha = pop;
    const font = F(400, 13);
    const bw = Math.min(tw(g, text, font) + 28, w * 0.75);
    const bh = me ? 52 : 66;
    const bx = me ? x + w - 42 - bw : x + 42;
    g.translate(0, (1 - ease.outBack(pop)) * 16);
    if (!me) avatar(g, who, x, y, 32, 8, T.bgElevated);
    rr(g, bx, y, bw, bh, me ? [16, 16, 4, 16] : [16, 16, 16, 4], me ? T.accentDim : T.bgCard, me ? T.accent + "4D" : T.border);
    let ty = y + 22;
    if (!me) { txt(g, who, bx + 14, y + 17, F(700, 10), T.accent); ty = y + 36; }
    txt(g, text, bx + 14, ty, font, T.text);
    txt(g, time, bx + bw - 12, ty + 16, F(400, 9), T.textMuted, "right");
    g.restore();
    y += bh + 14;
  });
  return y;
}

export const COMMENTARY = [
  ["14.2", "six", "SIX! Launched over long-on", "Kabir"],
  ["14.1", "four", "FOUR! Driven through the covers", "Kabir"],
  ["13.6", "normal", "Dot ball, solid defence", "Arjun"],
  ["13.5", "wicket", "WICKET! Caught at mid-wicket", "Sam"],
];

export function scoreBody(g, x, y, w, st) {
  rr(g, x, y, w, 40, 12, T.bgCard, T.danger + "40");
  txt(g, "🔴 This match is in progress.", x + 14, y + 25, F(400, 11), T.text);
  y += 54;
  rr(g, x, y, w, 104, 16, T.bgCard, T.border);
  const runs = Math.round(st.runs ?? 112);
  txt(g, "TIGERS", x + w * 0.22, y + 26, F(600, 11), T.textMuted, "center");
  txt(g, `${runs}/3`, x + w * 0.22, y + 70, F(400, 46, "Bebas"), st.flash ? T.accent : T.text, "center");
  txt(g, "14.2 overs", x + w * 0.22, y + 90, F(400, 10), T.textMuted, "center");
  txt(g, "VS", x + w / 2, y + 52, F(700, 11), T.textMuted, "center");
  g.beginPath(); g.arc(x + w / 2, y + 66, 3, 0, Math.PI * 2); g.fillStyle = T.danger; g.fill();
  txt(g, "STRIKERS", x + w * 0.78, y + 26, F(600, 11), T.textMuted, "center");
  txt(g, "98/5", x + w * 0.78, y + 70, F(400, 46, "Bebas"), T.text, "center");
  txt(g, "15 overs", x + w * 0.78, y + 90, F(400, 10), T.textMuted, "center");
  y += 122;
  txt(g, "Ball by ball", x, y + 4, F(700, 14), T.text);
  y += 14;
  const shown = st.shown ?? COMMENTARY.length;
  // newest first: items enter at the top and push the rest down
  const start = COMMENTARY.length - Math.ceil(shown);
  for (let i = Math.max(start, 0), row = 0; i < COMMENTARY.length; i++, row++) {
    const [over, kind, text, who] = COMMENTARY[i];
    const pop = i === start ? clamp(shown - Math.floor(shown) || 1) : 1;
    g.save(); g.globalAlpha = pop;
    const cy = y + row * 58;
    const bg = { six: "#00F5A020", four: "#7B5EA720", wicket: "#FF475720", normal: T.bgElevated }[kind];
    const fg = { six: T.accent, four: T.purpleText, wicket: T.danger, normal: T.textMuted }[kind];
    rr(g, x, cy + 12, 38, 36, 8, bg);
    txt(g, over, x + 19, cy + 34, F(700, 11), fg, "center");
    const [head, ...rest] = text.split("!");
    if (rest.length) {
      const hw = txt(g, head + "!", x + 50, cy + 28, F(700, 13), T.text);
      txt(g, rest.join("!"), x + 50 + hw, cy + 28, F(400, 13), T.textMuted);
    } else txt(g, text, x + 50, cy + 28, F(400, 13), T.textMuted);
    txt(g, `${who} · just now`, x + 50, cy + 44, F(400, 10), T.textDim);
    g.fillStyle = T.border; g.fillRect(x, cy + 57, w, 1);
    g.restore();
  }
}

/** Broadcast-style frame for the stream panel. */
export function streamFrame(g, x, y, w, h, t) {
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 14); g.clip();
  const sky = g.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, "#0E3B24"); sky.addColorStop(1, "#0A5A33"); g.fillStyle = sky; g.fillRect(x, y, w, h);
  // mown stripes
  for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? "#0D5530" : "#0F6237"; g.beginPath(); g.moveTo(x + w * (i / 10) - 40, y + h); g.lineTo(x + w * ((i + 1) / 10) - 40, y + h); g.lineTo(x + w * 0.5 + (i - 4.5) * 18, y + h * 0.18); g.lineTo(x + w * 0.5 + (i - 5.5) * 18, y + h * 0.18); g.fill(); }
  // pitch strip
  g.fillStyle = "#C9B27A"; g.beginPath(); g.moveTo(x + w * 0.44, y + h); g.lineTo(x + w * 0.56, y + h); g.lineTo(x + w * 0.515, y + h * 0.25); g.lineTo(x + w * 0.485, y + h * 0.25); g.fill();
  // stumps + players
  g.fillStyle = "#fff";
  for (const sx of [-3, 0, 3]) g.fillRect(x + w * 0.5 + sx, y + h * 0.24, 1.6, 9);
  const bowl = (t * 0.7) % 1;
  const ballY = y + h * (0.32 + bowl * 0.55), ballX = x + w * 0.5 + Math.sin(bowl * 3) * 4;
  g.beginPath(); g.arc(ballX, ballY, 2.5 + bowl * 2, 0, Math.PI * 2); g.fillStyle = "#FF4040"; g.fill();
  for (const [px, py, c] of [[0.5, 0.86, "#E8F0FF"], [0.5, 0.3, "#9EC5FF"], [0.2, 0.5, "#9EC5FF"], [0.8, 0.45, "#9EC5FF"], [0.32, 0.72, "#9EC5FF"], [0.7, 0.7, "#9EC5FF"]]) {
    const jx = Math.sin(t * 2 + px * 10) * 2;
    g.fillStyle = c; g.beginPath(); g.arc(x + w * px + jx, y + h * py, 4 + py * 4, 0, Math.PI * 2); g.fill();
  }
  // vignette + score bug
  const v = g.createRadialGradient(x + w / 2, y + h / 2, h * 0.2, x + w / 2, y + h / 2, w * 0.7);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.55)"); g.fillStyle = v; g.fillRect(x, y, w, h);
  rr(g, x + 12, y + h - 40, 172, 28, 6, "rgba(8,11,20,.85)");
  txt(g, "TIG 112/3", x + 22, y + h - 21, F(800, 12), T.text);
  txt(g, "14.2 ov · STR 98/5", x + 92, y + h - 21, F(500, 10), T.textMuted);
  rr(g, x + 12, y + 12, 52, 20, 5, "#E62117");
  txt(g, "● LIVE", x + 38, y + 26, F(800, 10), "#fff", "center");
  rr(g, x + w - 92, y + 12, 80, 20, 5, "rgba(8,11,20,.75)");
  txt(g, "👁 128 watching", x + w - 52, y + 26, F(600, 9), T.text, "center");
  g.restore();
}

function streamBody(g, x, y, w, st) {
  streamFrame(g, x, y, w, w * 9 / 16, st.t || 0);
  y += w * 9 / 16 + 16;
  rr(g, x, y, 92, 22, 6, "#FF000030", "#FF444440");
  txt(g, "▶ WATCH LIVE", x + 46, y + 15, F(700, 10), "#FF4444", "center");
  txt(g, "Streamed on YouTube by the organiser", x + 104, y + 15, F(400, 11), T.textMuted);
  y += 40;
  rr(g, x, y, w, 52, 12, T.bgCard, T.borderBright, 1);
  wrap(g, "Streaming is organiser-controlled. Only approved broadcasters can go live for this match.", x + 14, y + 21, w - 28, 16, F(400, 11), T.textMuted);
}

export const STEPS = ["Registered", "Confirmed", "On The Way", "Arrived", "Checked In"];
export const ROSTER = [
  ["Priya", 4, "approved"], ["Arjun", 3, "approved"], ["Sam", 2, "approved"], ["Meera", 3, "approved"],
  ["Rahul", 0, "pending"],
];

export function checkinBody(g, x, y, w, st) {
  txt(g, "Your status", x, y + 10, F(700, 14), T.text);
  y += 30;
  const step = st.step ?? 0; // fractional: integer part = completed steps
  STEPS.forEach((label, i) => {
    const done = i < Math.floor(step), now = i === Math.floor(step);
    const cy = y + i * 44;
    if (i < STEPS.length - 1) {
      g.fillStyle = T.border; g.fillRect(x + 10, cy + 22, 2, 22);
      const fill = clamp(step - i - 0.5) ;
      if (i < Math.floor(step)) { g.fillStyle = T.accent; g.fillRect(x + 10, cy + 22, 2, 22 * clamp((step - i - 1) * 3 + 1)); }
      void fill;
    }
    if (done) { g.save(); g.shadowColor = T.accent; g.shadowBlur = 10; }
    g.beginPath(); g.arc(x + 11, cy + 11, 11, 0, Math.PI * 2);
    g.fillStyle = done ? T.accent : T.bgCard; g.fill();
    g.strokeStyle = done || now ? T.accent : T.border; g.lineWidth = 2; g.stroke();
    if (done) g.restore();
    txt(g, done ? "✓" : String(i + 1), x + 11, cy + 15, F(800, 11), done ? T.bg : now ? T.accent : T.textMuted, "center");
    txt(g, label, x + 34, cy + 16, F(600, 13), done || now ? T.text : T.textMuted);
  });
  y += STEPS.length * 44 + 4;
  const complete = step >= STEPS.length;
  if (complete) {
    rr(g, x, y, w, 46, 12, T.bgCard, T.accent);
    txt(g, "✓ You're checked in. Have a good game!", x + w / 2, y + 28, F(600, 12), T.accent, "center");
  } else {
    g.save(); g.shadowColor = T.accent; g.shadowBlur = 20;
    rr(g, x, y, w, 46, 12, T.accent); g.restore();
    txt(g, `Mark as “${STEPS[Math.floor(step)]}” →`, x + w / 2, y + 29, F(800, 14), T.bg, "center");
  }
  y += 66;
  txt(g, "Roster", x, y, F(700, 14), T.text);
  y += 14;
  const confirmed = st.confirmed ?? 8;
  rr(g, x, y, w, 52, 12, T.bgCard, T.border);
  txt(g, `${Math.round(confirmed)} of 10 confirmed`, x + 14, y + 20, F(700, 12), T.text);
  txt(g, "Organiser approval on", x + w - 14, y + 20, F(400, 12), T.textMuted, "right");
  rr(g, x + 14, y + 32, w - 28, 6, 3, T.bgElevated);
  const grd = g.createLinearGradient(x, 0, x + w, 0); grd.addColorStop(0, T.accent); grd.addColorStop(1, "#00C97E");
  rr(g, x + 14, y + 32, (w - 28) * clamp(confirmed / 10), 6, 3, grd);
  y += 66;
  ROSTER.forEach(([name, s, status], i) => {
    const cy = y + i * 56;
    const approved = status === "approved" || (st.approved && name === "Rahul");
    avatar(g, name, x, cy, 36, 10, T.border);
    txt(g, name, x + 46, cy + 16, F(600, 13), T.text);
    txt(g, approved ? `✓ ${STEPS[name === "Rahul" ? 1 : s]}` : "⏳ Awaiting approval", x + 46, cy + 31, F(400, 10), approved ? T.accent : T.textMuted);
    if (!approved) { rr(g, x + w - 76, cy + 6, 76, 26, 8, "#00F5A020"); txt(g, "Approve", x + w - 38, cy + 23, F(700, 11), T.accent, "center"); }
    g.fillStyle = T.border; g.fillRect(x, cy + 47, w, 1);
  });
}

export function drawMatchDetail(ctx, st = {}) {
  const { g } = ctx;
  g.fillStyle = T.bg; g.fillRect(0, 0, W, H);
  g.save(); g.translate(0, -(st.scroll || 0));
  const tab = st.tab || "overview";
  const y0 = 340;
  if (tab === "overview") overviewBody(g, y0, st);
  if (tab === "chat") chatBody(g, 20, y0, 350, st);
  if (tab === "score") scoreBody(g, 20, y0, 350, st);
  if (tab === "stream") streamBody(g, 20, y0, 350, st);
  if (tab === "checkin") checkinBody(g, 20, y0, 350, st);
  g.restore();
  hero(g, st);
  ctxTabs(g, 270, tab);
  statusBar(g);
  if (tab === "chat") {
    g.fillStyle = T.bg; g.fillRect(0, H - 76, W, 76); g.fillStyle = T.border; g.fillRect(0, H - 76, W, 1);
    rr(g, 20, H - 64, 290, 42, 21, T.bgCard, T.border, 1.5);
    txt(g, st.channel === "team" ? "Message your team…" : "Message everyone…", 38, H - 38, F(400, 13), T.textDim);
    g.beginPath(); g.arc(349, H - 43, 21, 0, Math.PI * 2); g.fillStyle = T.accent; g.fill();
    icon.send(g, 342, H - 51, T.bg);
  }
  if (st.toast > 0) toast(g, st.toastText || "✓ You're in", st.toast);
  rr(g, W / 2 - 67, H - 10, 134, 5, 3, T.text + "CC");
}

function toast(g, text, a) {
  g.save(); g.globalAlpha = clamp(a);
  const y = lerp(-60, 58, ease.outBack(clamp(a)));
  const w = tw(g, text, F(600, 13)) + 40;
  g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 30;
  rr(g, W / 2 - w / 2, y, w, 44, 14, T.bgElevated, T.accent + "88", 1.5);
  g.shadowBlur = 0;
  txt(g, text, W / 2, y + 27, F(600, 13), T.text, "center");
  g.restore();
}

// ───────────────────────────── create screen ─────────────────────────────

function field(g, label, x, y, w, value, opts = {}) {
  txt(g, label.toUpperCase(), x, y, F(600, 12), T.textMuted, "left", 0.5);
  const focus = opts.focus;
  if (focus) { g.save(); g.shadowColor = T.accent; g.shadowBlur = 14; }
  rr(g, x, y + 10, w, 46, 12, T.bgCard, focus ? T.accent : T.border, 1.5);
  if (focus) g.restore();
  const shown = value ?? "";
  txt(g, shown || opts.placeholder || "", x + 16, y + 39, F(400, 14), shown ? T.text : T.textDim);
  if (focus && opts.caret) { const cw = tw(g, shown, F(400, 14)); g.fillStyle = T.accent; g.fillRect(x + 17 + cw, y + 24, 2, 20); }
  return y + 74;
}

function toggles(g, label, x, y, items, active, pulse = 0) {
  txt(g, label.toUpperCase(), x, y, F(600, 12), T.textMuted, "left", 0.5);
  let cx = x; y += 10;
  for (const it of items) {
    const w = tw(g, it, F(600, 12)) + 26;
    const on = it === active;
    if (on && pulse) { g.save(); g.shadowColor = T.accent; g.shadowBlur = 20 * pulse; }
    rr(g, cx, y, w, 34, 10, on ? T.accentDim : T.bgCard, on ? T.accent : T.border, 1.5);
    if (on && pulse) g.restore();
    txt(g, it, cx + w / 2, y + 22, F(600, 12), on ? T.accent : T.textMuted, "center");
    cx += w + 6;
  }
  return y + 58;
}

export function drawCreate(ctx, st = {}) {
  const { g } = ctx;
  g.fillStyle = T.bg; g.fillRect(0, 0, W, H);
  g.save(); g.translate(0, -(st.scroll || 0));
  let y = 128;
  txt(g, "SPORT", 20, y, F(600, 12), T.textMuted, "left", 0.5);
  const sports = [["🏏", "Cricket"], ["⚽", "Football"], ["🏀", "Basketball"], ["🏸", "Badminton"], ["🎾", "Tennis"], ["🏐", "Volleyball"], ["🏑", "Hockey"], ["🏓", "Table Tennis"]];
  sports.forEach(([e, n], i) => {
    const cx = 20 + (i % 4) * 89, cy = y + 10 + Math.floor(i / 4) * 70;
    const on = st.sport === n;
    if (on) { g.save(); g.shadowColor = T.accent; g.shadowBlur = 18 * (st.sportPulse ?? 1); }
    rr(g, cx, cy, 81, 62, 12, on ? T.accentDim : T.bgCard, on ? T.accent : T.border, 1.5);
    if (on) g.restore();
    txt(g, e, cx + 40.5, cy + 30, `22px ${EMOJI}`, "#fff", "center");
    txt(g, n, cx + 40.5, cy + 51, F(600, 10), on ? T.accent : T.textMuted, "center");
  });
  y += 160;
  y = field(g, "Match title *", 20, y, 350, st.title, { placeholder: "e.g. Sunday Football at the Park", focus: st.focus === "title", caret: st.caret });
  txt(g, "DATE *", 20, y, F(600, 12), T.textMuted, "left", 0.5);
  txt(g, "TIME *", 200, y, F(600, 12), T.textMuted, "left", 0.5);
  for (const [fx, val, key] of [[20, st.date, "date"], [200, st.time, "time"]]) {
    const focus = st.focus === key;
    if (focus) { g.save(); g.shadowColor = T.accent; g.shadowBlur = 14; }
    rr(g, fx, y + 10, 170, 46, 12, T.bgCard, focus ? T.accent : T.border, 1.5);
    if (focus) g.restore();
    txt(g, val || (key === "date" ? "dd/mm/yyyy" : "--:--"), fx + 16, y + 39, F(400, 14), val ? T.text : T.textDim);
  }
  y += 74;
  y = field(g, "Location / ground *", 20, y, 350, st.location, { placeholder: "📍 Ground or venue name", focus: st.focus === "location", caret: st.caret });
  rr(g, 20, y - 8, 350, 50, 12, T.bgCard, T.border);
  txt(g, "Pin at my current location", 36, y + 22, F(600, 13), T.text);
  const on = !!st.pin;
  rr(g, 318, y + 5, 40, 24, 12, on ? T.accent : T.bgElevated);
  g.beginPath(); g.arc(on ? 346 : 330, y + 17, 9, 0, Math.PI * 2); g.fillStyle = on ? T.bg : T.textMuted; g.fill();
  y += 66;
  txt(g, "PLAYERS NEEDED", 20, y, F(600, 12), T.textMuted, "left", 0.5);
  txt(g, "MATCH TYPE", 200, y, F(600, 12), T.textMuted, "left", 0.5);
  rr(g, 20, y + 10, 170, 46, 12, T.bgCard, T.border, 1.5); txt(g, st.players || "10", 36, y + 39, F(400, 14), T.text);
  rr(g, 200, y + 10, 170, 46, 12, T.bgCard, T.border, 1.5); txt(g, "Friendly ▾", 216, y + 39, F(400, 14), T.text);
  y += 84;
  y = toggles(g, "Skill level", 20, y, ["All levels", "Beginner", "Intermediate", "Advanced"], "All levels");
  y = toggles(g, "Recurrence", 20, y, ["Once", "Weekly", "Biweekly", "Monthly"], st.recurrence || "Once", st.recPulse);
  y = toggles(g, "Privacy", 20, y, ["Public", "Invite Only"], st.privacy || "Public", st.privPulse);
  y += 6;
  g.save(); g.shadowColor = T.accent; g.shadowBlur = 24 + 30 * (st.postGlow || 0);
  const pp = st.postPress || 0;
  g.translate(195, y + 26); g.scale(1 - pp * 0.05, 1 - pp * 0.05); g.translate(-195, -(y + 26));
  rr(g, 20, y, 350, 52, 12, T.accent); g.restore();
  txt(g, "Post Match →", 195, y + 33, F(800, 15), T.bg, "center");
  g.restore();
  // fixed header
  g.fillStyle = T.bg; g.fillRect(0, 0, W, 106);
  statusBar(g);
  rr(g, 20, 56, 38, 38, 10, T.bgCard, T.border); icon.back(g, 31, 67, T.text);
  txt(g, "NEW MATCH", 72, 85, F(400, 22, "Bebas"), T.text, "left", 2);
  g.fillStyle = T.border; g.fillRect(0, 105, W, 1);
  if (st.posted > 0) posted(g, st);
  rr(g, W / 2 - 67, H - 10, 134, 5, 3, T.text + "CC");
}

function posted(g, st) {
  const a = clamp(st.posted);
  g.save(); g.globalAlpha = a;
  g.fillStyle = T.bg; g.fillRect(0, 106, W, H - 106);
  const s = ease.outBack(a);
  g.translate(W / 2, 330); g.scale(s, s);
  g.shadowColor = T.accent; g.shadowBlur = 40;
  g.beginPath(); g.arc(0, 0, 54, 0, Math.PI * 2); g.fillStyle = T.accentDim; g.fill();
  g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); g.shadowBlur = 0;
  g.strokeStyle = T.accent; g.lineWidth = 7; g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); g.moveTo(-22, 2); g.lineTo(-6, 18); g.lineTo(24, -16); g.stroke();
  g.setTransform(S, 0, 0, S, 0, 0); g.globalAlpha = a;
  txt(g, "MATCH POSTED!", W / 2, 440, F(400, 30, "Bebas"), T.text, "center", 1);
  txt(g, "It's live on the map for players nearby", W / 2, 466, F(400, 13), T.textMuted, "center");
  rr(g, 40, 496, 310, 84, 16, T.bgCard, T.accent + "50");
  txt(g, "⚽ Football · 🔁 Weekly · 🔒 Invite Only", 60, 526, F(600, 11), T.accent);
  txt(g, st.title || "Friday Night Football", 60, 552, F(700, 15), T.text);
  txt(g, `📍 ${st.location || "Central Turf"} · 🕐 Fri · 7:30 PM`, 60, 570, F(400, 11), T.textMuted);
  g.restore();
}

// ───────────────────────────── portfolio ─────────────────────────────

export const RECORD = [
  ["🏏", "Cricket", 14, 6], ["⚽", "Football", 9, 4], ["🏸", "Badminton", 4, 5], ["🏀", "Basketball", 3, 1],
];

export function drawPortfolio(ctx, st = {}) {
  const { g } = ctx;
  const mode = st.mode || "official";
  g.fillStyle = T.bg; g.fillRect(0, 0, W, H);
  statusBar(g);
  g.fillStyle = T.bg; g.fillRect(0, 44, W, 62);
  txt(g, "PORTFOLIO", 20, 85, F(400, 22, "Bebas"), T.text, "left", 2);
  rr(g, 284, 58, 86, 34, 10, T.bgCard, T.borderBright); txt(g, "My record", 327, 80, F(600, 12), T.text, "center");
  g.fillStyle = T.border; g.fillRect(0, 105, W, 1);
  const grd = g.createLinearGradient(0, 106, W, 300); grd.addColorStop(0, T.bgElevated); grd.addColorStop(1, T.bgCard);
  g.fillStyle = grd; g.fillRect(0, 106, W, 136);
  g.fillStyle = T.border; g.fillRect(0, 242, W, 1);
  const k = clamp(st.count ?? 1);
  const stats = [[Math.round(46 * k), "Matches"], [Math.round(6 * k), "Organised"], [`${Math.round(96 * (st.rel ?? k))}%`, "Reliable"]];
  stats.forEach(([v, l], i) => {
    const cx = 65 + i * 130;
    txt(g, String(v), cx, 172, F(400, 44, "Bebas"), i === 2 ? T.accent : T.text, "center", 1);
    txt(g, l, cx, 196, F(500, 11), T.textMuted, "center");
  });
  txt(g, "Counted from matches you joined — nothing self-reported", W / 2, 226, F(400, 10), T.textDim, "center");
  // sport tabs
  let x = 20;
  RECORD.forEach(([e, n], i) => {
    const label = `${e} ${n}`; const w = tw(g, label, F(700, 12)) + 26; const on = i === 0;
    rr(g, x, 258, w, 34, 10, on ? T.accentDim : T.bgCard, on ? T.accent : T.border, 1.5);
    txt(g, label, x + w / 2, 280, F(700, 12), on ? T.accent : T.textMuted, "center");
    x += w + 6;
  });
  // sport card
  rr(g, 20, 306, 350, 190, 16, T.bgCard, T.border);
  rr(g, 36, 322, 40, 40, 12, T.bgElevated); txt(g, "🏏", 56, 349, `20px ${EMOJI}`, "#fff", "center");
  txt(g, "Cricket", 88, 338, F(700, 14), T.text); txt(g, "20 matches · since March", 88, 355, F(400, 11), T.textMuted);
  rr(g, 238, 324, 116, 30, 8, T.bgElevated);
  rr(g, 241, 327, 60, 24, 6, mode === "official" ? T.accentDim : null, mode === "official" ? T.accent : null);
  txt(g, "Competitive", 271, 343, F(700, 9.5), mode === "official" ? T.accent : T.textMuted, "center");
  rr(g, 303, 327, 48, 24, 6, mode === "practice" ? "#7B5EA733" : null, mode === "practice" ? T.purpleText : null);
  txt(g, "Practice", 327, 343, F(700, 9.5), mode === "practice" ? T.purpleText : T.textMuted, "center");
  const vals = mode === "official" ? [14, 13, 2] : [6, 6, 1];
  [[vals[0], mode === "official" ? "Competitive" : "Practice"], [vals[1], "Turned up"], [vals[2], "Organised"]].forEach(([v, l], i) => {
    const bx = 36 + i * 108;
    rr(g, bx, 376, 100, 58, 10, T.bgElevated);
    txt(g, String(Math.round(v * k)), bx + 50, 405, F(800, 18), mode === "practice" && i === 0 ? T.purpleText : T.text, "center");
    txt(g, l, bx + 50, 422, F(500, 9), T.textMuted, "center");
  });
  wrap(g, "Practice sessions are counted separately and never mixed into your competitive record.", 36, 456, 318, 15, F(400, 10.5), T.textMuted);
  txt(g, "🏅 Milestones", 20, 528, F(700, 14), T.text);
  const ms = [["🎉", "First match", "You joined your first game on PlayPulse"], ["🔟", "Ten matches", "46 matches joined so far"],
    ["📣", "Organiser", "You've posted 6 matches"], ["⭐", "Perfect attendance", "Checked in to all 12 of your finished matches"]];
  ms.forEach(([e, ti, sub], i) => {
    const cy = 542 + i * 56;
    const a = clamp((st.milestones ?? 4) - i);
    g.save(); g.globalAlpha = a; g.translate((1 - ease.outCubic(a)) * 30, 0);
    rr(g, 20, cy + 6, 38, 38, 10, T.bgElevated); txt(g, e, 39, cy + 31, `18px ${EMOJI}`, "#fff", "center");
    txt(g, ti, 70, cy + 22, F(700, 13), T.text); txt(g, sub, 70, cy + 38, F(400, 11), T.textMuted);
    g.restore();
  });
  bottomNav(g, "portfolio");
}

// ───────────────────────────── small textures ─────────────────────────────

/** Group-chat bubble for the cold open. */
export function drawBubble(text, who, color, w = 300) {
  const ctx = makeCanvas(w, 84, 2);
  const { g } = ctx;
  g.save(); g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 12;
  rr(g, 46, 8, w - 54, 68, [18, 18, 18, 4], "#141A2B", "#2A3560", 1.5); g.restore();
  avatar(g, who, 4, 40, 34, 17, "#141A2B");
  txt(g, who, 62, 30, F(700, 11), color);
  txt(g, text, 62, 56, F(500, 15), T.text);
  return ctx;
}

/** Floating info chip used around the phone in the Join scene. */
export function drawInfoChip(iconEmoji, label, value, accent = T.accent, w = 330) {
  const ctx = makeCanvas(w, 92, 2);
  const { g } = ctx;
  rr(g, 2, 2, w - 4, 88, 18, "rgba(15,19,32,0.92)", accent + "AA", 2);
  rr(g, 16, 18, 56, 56, 14, accent + "22");
  txt(g, iconEmoji, 44, 47, `28px ${EMOJI}`, "#fff", "center", 0, "middle");
  txt(g, label.toUpperCase(), 88, 38, F(700, 12), accent, "left", 1.5);
  txt(g, value, 88, 66, F(700, 21), T.text);
  return ctx;
}

/** Label plate for 3D markers (check-in nodes, chart bars, badges). */
export function drawLabel(text, opts = {}) {
  const font = opts.font || F(700, 28);
  const pad = opts.pad ?? 24;
  const meas = makeCanvas(10, 10, 1).g; const w = Math.ceil(tw(meas, text, font, opts.ls || 0) + pad * 2);
  const h = opts.h || 64;
  const ctx = makeCanvas(w, h, 2);
  const { g } = ctx;
  if (opts.bg) rr(g, 1, 1, w - 2, h - 2, opts.r ?? h / 2, opts.bg, opts.border || null, 2);
  txt(g, text, w / 2, h / 2 + 1, font, opts.color || T.text, "center", opts.ls || 0, "middle");
  return ctx;
}

/** Circular emoji badge used for 3D map pins and milestones. */
export function drawEmojiDisc(emoji, ring, fill = T.bgCard, size = 128) {
  const ctx = makeCanvas(size, size, 2);
  const { g } = ctx;
  const r = size / 2 - 6;
  g.beginPath(); g.arc(size / 2, size / 2, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
  g.lineWidth = 6; g.strokeStyle = ring; g.stroke();
  txt(g, emoji, size / 2, size / 2 + 3, `${Math.round(size * 0.5)}px ${EMOJI}`, "#fff", "center", 0, "middle");
  return ctx;
}
