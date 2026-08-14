import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useAppData } from "../hooks/useAppData";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const weatherFor = (code) => {
  if (code === 0)  return { icon: "☀️",  label: "Clear sky",     good: true };
  if (code <= 3)   return { icon: "⛅",  label: "Partly cloudy", good: true };
  if (code <= 48)  return { icon: "🌫️", label: "Foggy",         good: false };
  if (code <= 67)  return { icon: "🌧️", label: "Rainy",         good: false };
  if (code <= 77)  return { icon: "❄️",  label: "Snowy",         good: false };
  if (code <= 82)  return { icon: "🌦️", label: "Rain showers",  good: false };
  return             { icon: "⛈️", label: "Thunderstorm",  good: false };
};

/**
 * Per-match content: chat, commentary, scoreboard and weather.
 * A match with no database row yet (non-uuid id) stays in memory so every
 * control still responds.
 */
export const useMatchDetail = (match) => {
  const { user } = useAuth();
  const { notify, requireAuth, offline, profile, readableError } = useAppData();

  const matchId = match?.id;
  const live = isSupabaseConfigured && !offline && UUID.test(String(matchId || ""));

  const [messages, setMessages] = useState({ match: [], team: [] });
  const [commentary, setCommentary] = useState([]);
  const [teams, setTeams] = useState([]);
  const [weather, setWeather] = useState(null);
  const [sending, setSending] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;

    if (!live) {
      setMessages({ match: [], team: [] });
      setCommentary([]);
      setTeams([]);
      return;
    }

    (async () => {
      const [msgRes, comRes, teamRes] = await Promise.all([
        supabase.from("messages").select("id, channel, body, created_at, user_id, profiles(username)").eq("match_id", matchId).order("created_at"),
        supabase.from("commentary").select("*").eq("match_id", matchId).order("created_at", { ascending: false }),
        supabase.from("match_teams").select("*").eq("match_id", matchId).order("position"),
      ]);
      if (cancelled) return;

      setTeams((teamRes.data || []).map((t) => ({
        position: t.position, name: t.name, score: t.score, detail: t.detail,
      })));

      const grouped = { match: [], team: [] };
      for (const m of msgRes.data || []) {
        (grouped[m.channel] ||= []).push({
          id: m.id,
          name: m.profiles?.username || "Player",
          body: m.body,
          at: m.created_at,
          mine: m.user_id === user?.id,
        });
      }
      setMessages(grouped);

      setCommentary((comRes.data || []).map((c) => ({
        id: c.id, over: c.over_label, kind: c.kind, headline: c.headline, body: c.body,
      })));

    })();

    return () => { cancelled = true; };
  }, [matchId, live, match?.status, user?.id]);

  // ── Chat realtime ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!live || !matchId) return;
    const channel = supabase
      .channel(`match-chat-${matchId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        async (payload) => {
          const row = payload.new;
          if (row.user_id === user?.id) return; // already added optimistically
          const { data } = await supabase.from("profiles").select("username").eq("id", row.user_id).maybeSingle();
          setMessages((prev) => ({
            ...prev,
            [row.channel]: [...(prev[row.channel] || []), {
              id: row.id, name: data?.username || "Player", body: row.body, at: row.created_at, mine: false,
            }],
          }));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [live, matchId, user?.id]);

  // ── Scoreboard realtime ───────────────────────────────────────────────────
  // Viewers watching a live match see the organiser's edits without refreshing.
  useEffect(() => {
    if (!live || !matchId) return;
    const channel = supabase
      .channel(`match-score-${matchId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "match_teams", filter: `match_id=eq.${matchId}` },
        async () => {
          const { data } = await supabase.from("match_teams").select("*").eq("match_id", matchId).order("position");
          setTeams((data || []).map((t) => ({
            position: t.position, name: t.name, score: t.score, detail: t.detail,
          })));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [live, matchId]);

  // ── Weather ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (match?.lat == null || match?.lng == null) { setWeather(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${match.lat}&longitude=${match.lng}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto`
        );
        const data = await res.json();
        if (!cancelled && data.current) {
          setWeather({ ...data.current, ...weatherFor(data.current.weathercode) });
        }
      } catch { /* weather is a nicety — never block the screen on it */ }
    })();
    return () => { cancelled = true; };
  }, [match?.lat, match?.lng]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (channel, body) => {
    const text = body.trim();
    if (!text) return false;
    if (!requireAuth("send a message")) return false;

    const optimistic = {
      id: `tmp-${Date.now()}`,
      name: profile?.username || "You",
      body: text,
      at: new Date().toISOString(),
      mine: true,
    };
    setMessages((prev) => ({ ...prev, [channel]: [...(prev[channel] || []), optimistic] }));

    if (!live) return true;

    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, user_id: user.id, channel, body: text })
      .select("id, created_at")
      .single();
    setSending(false);

    if (error) {
      setMessages((prev) => ({ ...prev, [channel]: (prev[channel] || []).filter((m) => m.id !== optimistic.id) }));
      notify(readableError(error, "Message didn't send"), "error");
      return false;
    }
    setMessages((prev) => ({
      ...prev,
      [channel]: (prev[channel] || []).map((m) => (m.id === optimistic.id ? { ...m, id: data.id, at: data.created_at } : m)),
    }));
    return true;
  }, [live, matchId, user, profile, requireAuth, notify, readableError]);

  /** Organiser-only. Writes both sides together so the board is never half-saved. */
  const saveScoreboard = useCallback(async (rows) => {
    if (!requireAuth("edit the scoreboard")) return false;

    const cleaned = rows.map((t, i) => ({
      position: i + 1,
      name: t.name.trim() || `Team ${i + 1}`,
      score: t.score.trim(),
      detail: t.detail?.trim() || null,
    }));

    const before = teams;
    setTeams(cleaned);

    if (!live) { notify("Scoreboard saved"); return true; }

    const { error } = await supabase
      .from("match_teams")
      .upsert(cleaned.map((t) => ({ ...t, match_id: matchId, updated_at: new Date().toISOString() })),
              { onConflict: "match_id,position" });

    if (error) {
      setTeams(before);
      notify(readableError(error, "Couldn't save the scoreboard"), "error");
      return false;
    }
    notify("Scoreboard saved");
    return true;
  }, [live, matchId, teams, requireAuth, notify, readableError]);

  /** Organiser-only. The headline is derived so the badge and text always agree. */
  const postCommentary = useCallback(async ({ over, kind, body }) => {
    if (!requireAuth("post a score update")) return false;
    const overLabel = over.trim();
    const text = body.trim();
    if (!overLabel || !text) return false;

    const headline = { six: "SIX!", four: "FOUR!", wicket: "WICKET!" }[kind] || null;
    const entry = {
      id: `tmp-${Date.now()}`,
      over: overLabel,
      kind,
      headline,
      body: headline ? ` ${text}` : text,
    };
    setCommentary((prev) => [entry, ...prev]);

    if (!live) { notify("Update posted"); return true; }

    const { data, error } = await supabase
      .from("commentary")
      .insert({ match_id: matchId, over_label: overLabel, kind, headline, body: entry.body })
      .select("id")
      .single();

    if (error) {
      setCommentary((prev) => prev.filter((c) => c.id !== entry.id));
      notify(readableError(error, "Couldn't post that update"), "error");
      return false;
    }
    setCommentary((prev) => prev.map((c) => (c.id === entry.id ? { ...c, id: data.id } : c)));
    notify("Update posted");
    return true;
  }, [live, matchId, requireAuth, notify, readableError]);

  return {
    messages, commentary, teams, weather, sending,
    sendMessage, postCommentary, saveScoreboard, isLiveData: live,
  };
};
