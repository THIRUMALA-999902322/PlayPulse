import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { sportEmoji } from "../lib/constants";
import { AppDataContext } from "./contexts";

const normalizeMatch = (row) => ({
  id: row.id,
  kind: row.kind || "pickup",
  sport: row.sport,
  emoji: sportEmoji[row.sport] || "🏅",
  title: row.title,
  location: row.location,
  lat: row.lat ?? null,
  lng: row.lng ?? null,
  matchTime: row.match_time,
  status: row.status || "open",
  skill: row.skill || "All levels",
  joined: row.players_joined ?? 0,
  max: row.players_max ?? 10,
  streamUrl: row.stream_url || null,
  approvalMode: !!row.approval_mode,
  gear: row.gear_needed || [],
  rules: row.rules || "",
  privacy: row.privacy || "Public",
  recurrence: row.recurrence || "Once",
  leagueId: row.league_id || null,
  createdBy: row.created_by || null,
  organiser: row.profiles?.username || null,
});

const normalizeLeague = (row, teams, fixtures) => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji || "🏆",
  sport: row.sport,
  season: row.season || "",
  members: row.members ?? 0,
  createdBy: row.created_by || null,
  standings: teams
    .filter((t) => t.league_id === row.id)
    .map((t) => ({ team: t.team_name, played: t.played, won: t.won, lost: t.lost, points: t.points }))
    .sort((a, b) => b.points - a.points || b.won - a.won),
  fixtures: fixtures
    .filter((f) => f.league_id === row.id)
    .map((f) => ({ home: f.home_team, away: f.away_team, time: f.fixture_time, venue: f.venue })),
});

/** Turns any Supabase/network failure into one short sentence a player can act on. */
const readableError = (error, fallback) => {
  const msg = (error?.message || "").toLowerCase();
  if (!msg) return fallback;
  if (msg.includes("failed to fetch") || msg.includes("network")) return "You appear to be offline. Saved on this device only.";
  if (msg.includes("sign in")) return "Sign in first — takes a few seconds.";
  if (msg.includes("already full")) return "That match just filled up.";
  if (msg.includes("cancelled")) return "That match was cancelled.";
  if (msg.includes("row-level security") || msg.includes("policy")) return "You don't have permission for that.";
  if (msg.includes("duplicate") || msg.includes("unique")) return "That's already been done.";
  return error.message;
};

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();

  const [matches, setMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [roster, setRoster] = useState({});          // matchId -> [{ userId, username, status, checkinStep }]
  const [leaderboard, setLeaderboard] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!isSupabaseConfigured);

  const [userPos, setUserPos] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("loading"); // loading | ok | denied

  const [toast, setToast] = useState(null);              // { message, type }
  const [authPrompt, setAuthPrompt] = useState(null);    // e.g. "join this match"
  const toastTimer = useRef(null);

  const notify = useCallback((message, type = "info") => {
    setToast({ message, type, key: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /** Every write funnels through here: guests get a sign-in prompt, not a dead click. */
  const requireAuth = useCallback((intent) => {
    if (user) return true;
    setAuthPrompt(intent);
    return false;
  }, [user]);

  // ── Location ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserPos([51.5074, -0.1278]);
      setGpsStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setUserPos([coords.latitude, coords.longitude]); setGpsStatus("ok"); },
      () => { setUserPos([51.5074, -0.1278]); setGpsStatus("denied"); },
      { timeout: 8000 }
    );
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!isSupabaseConfigured) { setOffline(true); setLoading(false); return; }
    try {
      const [matchRes, leagueRes, teamRes, fixtureRes, rosterRes] = await Promise.all([
        supabase.from("matches").select("*, profiles(username)").order("match_time", { ascending: true }),
        supabase.from("leagues").select("*").order("created_at", { ascending: true }),
        supabase.from("league_teams").select("*"),
        supabase.from("league_fixtures").select("*"),
        supabase.from("match_players").select("match_id, user_id, status, checkin_step, profiles(username)"),
      ]);

      // A partial failure here silently empties the roster, which would make
      // "you joined this" vanish on refresh — so treat any of them as fatal.
      const failure = [matchRes, leagueRes, teamRes, fixtureRes, rosterRes].find((r) => r.error);
      if (failure) throw failure.error;

      setMatches((matchRes.data || []).map(normalizeMatch));

      const teams = teamRes.data || [];
      const fixtures = fixtureRes.data || [];
      setLeagues((leagueRes.data || []).map((l) => normalizeLeague(l, teams, fixtures)));

      const grouped = {};
      for (const r of rosterRes.data || []) {
        (grouped[r.match_id] ||= []).push({
          userId: r.user_id,
          username: r.profiles?.username || "Player",
          status: r.status,
          checkinStep: r.checkin_step ?? 1,
        });
      }
      setRoster(grouped);
      setOffline(false);
    } catch {
      // Surfaced as a banner so a player can tell "no games yet" apart from
      // "we couldn't reach the server".
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Coming back to a backgrounded tab (or a phone waking up) should show the
  // current board, not whatever was on screen when it was put down. Realtime
  // only covers changes that arrive while the socket is alive.
  useEffect(() => {
    const onWake = () => { if (document.visibilityState === "visible") loadAll(); };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("online", onWake);
    return () => {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("online", onWake);
    };
  }, [loadAll]);

  // ── My profile ────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!user || !isSupabaseConfigured) { setProfile(null); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

    if (data) { setProfile(data); return; }

    // A valid token with no profile row means the account was removed server
    // side. Left alone the app shows a half-signed-in shell that can't write,
    // so end the stale session and fall back to guest browsing.
    setProfile(null);
    await supabase.auth.signOut().catch(() => {});
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  /** A player's real per-sport record, computed in the database from matches joined. */
  const loadPlayerRecord = useCallback(async (userId) => {
    if (!isSupabaseConfigured || !userId) return [];
    const { data, error } = await supabase.rpc("player_record", { p_user_id: userId });
    if (error) return [];
    return (data || []).map((r) => ({
      sport: r.sport,
      official: r.official_matches,
      practice: r.practice_matches,
      attended: r.attended,
      organised: r.organised,
      lastPlayed: r.last_played,
    }));
  }, []);

  const loadLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured) return [];
    const { data } = await supabase
      .from("profiles")
      .select("id, username, bio, matches_played, reliability_score")
      .order("matches_played", { ascending: false })
      .limit(20);
    setLeaderboard(data || []);
    return data || [];
  }, []);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || offline) return;
    const channel = supabase
      .channel("playpulse-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, (payload) => {
        setMatches((prev) => {
          if (payload.eventType === "DELETE") return prev.filter((m) => m.id !== payload.old.id);
          // Realtime payloads carry columns only, so keep the joined organiser
          // name we already resolved rather than blanking it on every update.
          const next = normalizeMatch(payload.new);
          return prev.some((m) => m.id === next.id)
            ? prev.map((m) => (m.id === next.id ? { ...m, ...next, organiser: next.organiser ?? m.organiser } : m))
            : [...prev, next];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [offline]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const joinedIds = useMemo(() => {
    if (!user) return [];
    return Object.entries(roster)
      .filter(([, players]) => players.some((p) => p.userId === user.id))
      .map(([matchId]) => matchId);
  }, [roster, user]);

  const myCheckinStep = useCallback(
    (matchId) => roster[matchId]?.find((p) => p.userId === user?.id)?.checkinStep ?? 0,
    [roster, user]
  );

  const patchMatch = useCallback((id, patch) => {
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const joinMatch = useCallback(async (matchId) => {
    if (!requireAuth("join this match")) return;
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    if (joinedIds.includes(matchId)) { notify("You're already in this match"); return; }
    if (match.joined >= match.max) { notify("That match is full", "warning"); return; }

    // Optimistic: the roster and counter move before the round-trip.
    const me = { userId: user.id, username: profile?.username || "You", status: match.approvalMode ? "pending" : "approved", checkinStep: 1 };
    setRoster((prev) => ({ ...prev, [matchId]: [...(prev[matchId] || []), me] }));
    patchMatch(matchId, { joined: match.joined + 1 });
    setProfile((prev) => (prev ? { ...prev, matches_played: (prev.matches_played ?? 0) + 1 } : prev));

    if (offline) { notify("You're in! (saved on this device)"); return; }

    const { data, error } = await supabase.rpc("join_match", { p_match_id: matchId });
    if (error) {
      setRoster((prev) => ({ ...prev, [matchId]: (prev[matchId] || []).filter((p) => p.userId !== user.id) }));
      patchMatch(matchId, { joined: match.joined });
      setProfile((prev) => (prev ? { ...prev, matches_played: Math.max((prev.matches_played ?? 1) - 1, 0) } : prev));
      notify(readableError(error, "Couldn't join — try again"), "error");
      return;
    }
    patchMatch(matchId, { joined: data.players, status: data.status });
    notify(match.approvalMode ? "Requested — the organiser will approve you" : "You're in! Match chat unlocked 💬");
  }, [matches, joinedIds, user, profile, offline, requireAuth, notify, patchMatch]);

  const leaveMatch = useCallback(async (matchId) => {
    if (!requireAuth("manage your matches")) return;
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const previous = roster[matchId] || [];
    setRoster((prev) => ({ ...prev, [matchId]: previous.filter((p) => p.userId !== user.id) }));
    patchMatch(matchId, { joined: Math.max(match.joined - 1, 0) });
    setProfile((prev) => (prev ? { ...prev, matches_played: Math.max((prev.matches_played ?? 1) - 1, 0) } : prev));

    if (offline) { notify("You left the match"); return; }

    const { data, error } = await supabase.rpc("leave_match", { p_match_id: matchId });
    if (error) {
      setRoster((prev) => ({ ...prev, [matchId]: previous }));
      patchMatch(matchId, { joined: match.joined });
      setProfile((prev) => (prev ? { ...prev, matches_played: (prev.matches_played ?? 0) + 1 } : prev));
      notify(readableError(error, "Couldn't leave — try again"), "error");
      return;
    }
    patchMatch(matchId, { joined: data.players, status: data.status });
    notify("You left the match");
  }, [matches, roster, user, offline, requireAuth, notify, patchMatch]);

  const createMatch = useCallback(async (form) => {
    if (!requireAuth("post a match")) return { ok: false };

    const payload = {
      kind: form.matchType === "Practice" ? "practice" : form.matchType === "League" ? "league" : "pickup",
      sport: form.sport,
      title: form.title.trim(),
      location: form.location.trim(),
      match_time: form.matchTime,
      players_max: Number(form.playersMax),
      players_joined: 0,
      status: "open",
      skill: form.skill,
      match_type: form.matchType,
      rules: form.rules.trim() || null,
      gear_needed: form.gear,
      approval_mode: form.approvalMode,
      privacy: form.privacy,
      recurrence: form.recurrence,
      stream_url: form.streamUrl?.trim() || null,
      lat: form.lat,
      lng: form.lng,
      created_by: user.id,
    };

    if (offline) {
      const local = normalizeMatch({ ...payload, id: `local-${Date.now()}` });
      setMatches((prev) => [...prev, local]);
      notify("Match posted (saved on this device)");
      return { ok: true, match: local };
    }

    const { data, error } = await supabase.from("matches").insert(payload).select("*, profiles(username)").single();
    if (error) { notify(readableError(error, "Couldn't post the match"), "error"); return { ok: false }; }

    const created = { ...normalizeMatch(data), organiser: data.profiles?.username || profile?.username || null };
    setMatches((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
    notify("⚡ Match posted — nearby players notified");
    return { ok: true, match: created };
  }, [user, profile, offline, requireAuth, notify]);

  const updateMatch = useCallback(async (matchId, patch, successMessage) => {
    if (!requireAuth("manage this match")) return false;
    const before = matches.find((m) => m.id === matchId);
    patchMatch(matchId, patch);

    if (offline) { notify(successMessage); return true; }

    const dbPatch = {};
    if ("status" in patch) dbPatch.status = patch.status;
    if ("matchTime" in patch) dbPatch.match_time = patch.matchTime;
    if ("streamUrl" in patch) dbPatch.stream_url = patch.streamUrl;

    const { error } = await supabase.from("matches").update(dbPatch).eq("id", matchId);
    if (error) {
      if (before) patchMatch(matchId, before);
      notify(readableError(error, "Couldn't save the change"), "error");
      return false;
    }
    notify(successMessage);
    return true;
  }, [matches, offline, requireAuth, notify, patchMatch]);

  const setCheckinStep = useCallback(async (matchId, step) => {
    if (!requireAuth("check in")) return;
    setRoster((prev) => {
      const players = prev[matchId] || [];
      const mine = players.find((p) => p.userId === user.id);
      const next = mine
        ? players.map((p) => (p.userId === user.id ? { ...p, checkinStep: step } : p))
        : [...players, { userId: user.id, username: profile?.username || "You", status: "approved", checkinStep: step }];
      return { ...prev, [matchId]: next };
    });

    if (offline) return;
    const { error } = await supabase.rpc("set_checkin_step", { p_match_id: matchId, p_step: step });
    if (error) notify(readableError(error, "Couldn't update check-in"), "error");
  }, [user, profile, offline, requireAuth, notify]);

  const approvePlayer = useCallback(async (matchId, playerId, playerName) => {
    if (!requireAuth("approve players")) return;
    setRoster((prev) => ({
      ...prev,
      [matchId]: (prev[matchId] || []).map((p) => (p.userId === playerId ? { ...p, status: "approved" } : p)),
    }));

    if (offline) { notify(`${playerName} approved ✓`); return; }
    const { error } = await supabase.rpc("approve_player", { p_match_id: matchId, p_user_id: playerId });
    notify(error ? readableError(error, "Couldn't approve") : `${playerName} approved ✓`, error ? "error" : "info");
  }, [offline, requireAuth, notify]);

  const updateProfile = useCallback(async (patch) => {
    if (!requireAuth("edit your profile")) return false;
    setProfile((prev) => ({ ...prev, ...patch }));
    if (offline) { notify("Saved on this device"); return true; }

    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) { notify(readableError(error, "Couldn't save your profile"), "error"); return false; }
    if (patch.username) await supabase.auth.updateUser({ data: { username: patch.username } });
    notify("✓ Profile updated");
    return true;
  }, [user, offline, requireAuth, notify]);

  const value = {
    matches, leagues, roster, leaderboard, profile, loading, offline,
    userPos, gpsStatus, joinedIds, myCheckinStep,
    toast, notify, dismissToast,
    authPrompt, setAuthPrompt, requireAuth,
    joinMatch, leaveMatch, createMatch, updateMatch,
    setCheckinStep, approvePlayer, updateProfile,
    loadAll, loadProfile, loadLeaderboard, loadPlayerRecord, readableError,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};
