import { displayStatus, formatMatchTime, startsIn } from "./format";
import { theme } from "../styles/theme";

/** Notifications are derived from the board itself — no separate feed to fall stale. */
export const buildNotifications = (matches, joinedIds, userId) => {
  const list = [];

  for (const m of matches) {
    const status = displayStatus(m);
    if (status === "cancelled" || status === "ended") continue;
    const soon = startsIn(m.matchTime);
    const mine = !!m.createdBy && m.createdBy === userId;
    const joined = joinedIds.includes(m.id);
    const spotsLeft = m.max - m.joined;

    if (status === "live") {
      list.push({
        id: `live-${m.id}`, icon: m.emoji, color: theme.danger, matchId: m.id, time: m.matchTime,
        title: "Live now", body: `${m.title} is underway at ${m.location}`,
      });
    }
    if (soon && (mine || joined)) {
      list.push({
        id: `soon-${m.id}`, icon: "⏰", color: theme.warning, matchId: m.id, time: m.matchTime,
        title: mine ? "Your match is coming up" : "Match reminder",
        body: `${m.title} — starts in ${soon} · ${m.joined}/${m.max} players`,
      });
    }
    if (mine && m.joined > 0) {
      list.push({
        id: `roster-${m.id}`, icon: "👤", color: theme.accent, matchId: m.id, time: m.matchTime,
        title: "Players joined your match",
        body: `${m.joined} of ${m.max} spots filled on “${m.title}”`,
      });
    }
    if (!joined && !mine && (status === "open" || status === "soon") && spotsLeft > 0 && spotsLeft <= 2) {
      list.push({
        id: `fill-${m.id}`, icon: "⚡", color: theme.accent, matchId: m.id, time: m.matchTime,
        title: `Needs ${spotsLeft} more`,
        body: `${m.title} · ${formatMatchTime(m.matchTime)}`,
      });
    }
  }

  if (!list.length) {
    list.push(
      { id: "w1", icon: "🎉", color: theme.accent, title: "Welcome to PlayPulse", body: "Post your first match — nearby players get notified straight away.", time: new Date().toISOString() },
      { id: "w2", icon: "📍", color: theme.textMuted, title: "Turn on location", body: "Allow GPS so the map can show games happening around you.", time: new Date(Date.now() - 3600000).toISOString() }
    );
  }

  return list.sort((a, b) => new Date(a.time) - new Date(b.time)).slice(0, 12);
};
