import { AVATAR_COLORS } from "./constants";

/** Stable per-name colour so the same player always gets the same avatar tint. */
export const colorFor = (seed = "") => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const initials = (name = "") =>
  (name.trim().slice(0, 2) || "PP").toUpperCase();

/** "Today 5:30 PM" / "Tomorrow 9:00 AM" / "Sat 10:00 AM" */
export const formatMatchTime = (iso) => {
  if (!iso) return "Time TBC";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Time TBC";

  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
  const midnight = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((midnight(d) - midnight(new Date())) / 86400000);

  if (days === 0) return `Today ${time}`;
  if (days === 1) return `Tomorrow ${time}`;
  if (days === -1) return `Yesterday ${time}`;
  if (days > 1 && days < 7) return `${d.toLocaleDateString("en-GB", { weekday: "short" })} ${time}`;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${time}`;
};

/**
 * "45 min" / "1h 45m" / "1d 18h" — null once the match has started.
 * Always rounds down so it never disagrees with the "Tomorrow" style date label.
 */
export const startsIn = (iso) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  const rem = hrs % 24;
  return rem ? `${days}d ${rem}h` : `${days}d`;
};

/** A match is treated as finished three hours after its start time. */
export const hasEnded = (iso) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && Date.now() - t > 3 * 3600000;
};

/**
 * What the badge should say right now. A stored status can go stale — a match
 * marked "soon" is not soon once its start time has passed.
 */
export const displayStatus = (match) => {
  if (match.status === "cancelled") return "cancelled";
  if (hasEnded(match.matchTime)) return "ended";
  if (match.status === "live" || match.status === "practice") return match.status;
  if (match.joined >= match.max) return "full";
  return match.status;
};

/** "Just now" / "12m ago" / "3h ago" / "in 2h" / "14 Feb" — works both directions. */
export const relativeTime = (iso) => {
  if (!iso) return "";
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(secs)) return "";

  if (secs < 0) {
    const ahead = -secs;
    if (ahead < 60) return "Now";
    if (ahead < 3600) return `in ${Math.floor(ahead / 60)}m`;
    if (ahead < 86400) return `in ${Math.floor(ahead / 3600)}h`;
    if (ahead < 604800) return `in ${Math.floor(ahead / 86400)}d`;
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export const clockTime = (iso = new Date().toISOString()) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });

/** Straight-line distance, rendered the way a player would say it. */
export const distanceLabel = (from, lat, lng) => {
  if (!from || lat == null || lng == null) return "Nearby";
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat - from[0]);
  const dLng = toRad(lng - from[1]);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(from[0])) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(a));
  const miles = km * 0.621371;
  if (miles < 0.1) return "Here";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/** Accepts watch/live/youtu.be links and returns an embeddable URL. */
export const youtubeEmbed = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
};
