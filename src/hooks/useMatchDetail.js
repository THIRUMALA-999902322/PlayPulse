import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useAppData } from "../hooks/useAppData";
import { demoCommentary } from "../data/demo";

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
 * Per-match content: chat, commentary, fundraisers and weather.
 * Demo/local matches (non-uuid ids) stay entirely in memory so every control
 * still responds when there is no row behind it.
 */
export const useMatchDetail = (match) => {
  const { user } = useAuth();
  const { notify, requireAuth, offline, profile, readableError } = useAppData();

  const matchId = match?.id;
  const live = isSupabaseConfigured && !offline && UUID.test(String(matchId || ""));

  const [messages, setMessages] = useState({ match: [], team: [] });
  const [commentary, setCommentary] = useState([]);
  const [fundraisers, setFundraisers] = useState([]);
  const [weather, setWeather] = useState(null);
  const [sending, setSending] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;

    if (!live) {
      setMessages({ match: [], team: [] });
      setCommentary(match.status === "live" ? demoCommentary : []);
      setFundraisers([]);
      return;
    }

    (async () => {
      const [msgRes, comRes, fundRes] = await Promise.all([
        supabase.from("messages").select("id, channel, body, created_at, user_id, profiles(username)").eq("match_id", matchId).order("created_at"),
        supabase.from("commentary").select("*").eq("match_id", matchId).order("created_at", { ascending: false }),
        supabase.from("fundraisers").select("*").eq("match_id", matchId).order("created_at"),
      ]);
      if (cancelled) return;

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

      setFundraisers((fundRes.data || []).map((f) => ({
        id: f.id, title: f.title, cause: f.cause,
        goal: Number(f.goal), raised: Number(f.raised), donors: f.donors, endsAt: f.ends_at,
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

  const donate = useCallback(async (fundraiserId, amount) => {
    if (!requireAuth("donate")) return false;

    const before = fundraisers;
    setFundraisers((prev) => prev.map((f) =>
      f.id === fundraiserId ? { ...f, raised: f.raised + amount, donors: f.donors + 1 } : f));

    if (!live) { notify(`Thanks! £${amount} pledged 💚`); return true; }

    const { data, error } = await supabase.rpc("donate_to_fundraiser", {
      p_fundraiser_id: fundraiserId, p_amount: amount,
    });
    if (error) {
      setFundraisers(before);
      notify(readableError(error, "Donation didn't go through"), "error");
      return false;
    }
    setFundraisers((prev) => prev.map((f) =>
      f.id === fundraiserId ? { ...f, raised: Number(data.raised), donors: data.donors } : f));
    notify(`Donated £${amount} — you're on the donor wall 💚`);
    return true;
  }, [live, fundraisers, requireAuth, notify, readableError]);

  return { messages, commentary, fundraisers, weather, sending, sendMessage, donate, isLiveData: live };
};
