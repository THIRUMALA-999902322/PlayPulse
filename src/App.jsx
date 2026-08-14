import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useAppData } from "./hooks/useAppData";
import { globalStyles, theme } from "./styles/theme";

import AuthScreen from "./screens/AuthScreen";
import MapScreen from "./screens/MapScreen";
import MatchesScreen from "./screens/MatchesScreen";
import LeagueDetailScreen from "./screens/LeagueDetailScreen";
import MatchDetailScreen from "./screens/MatchDetailScreen";
import CreateScreen from "./screens/CreateScreen";
import PortfolioScreen from "./screens/PortfolioScreen";
import ProfileScreen from "./screens/ProfileScreen";
import Toast from "./components/Toast";

const icons = {
  map:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  matches:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/></svg>,
  portfolio: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  profile:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  plus:      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

const NAV = [
  { id: "map", label: "Map", icon: icons.map },
  { id: "matches", label: "Matches", icon: icons.matches },
  { id: "create" },
  { id: "portfolio", label: "Portfolio", icon: icons.portfolio },
  { id: "profile", label: "Me", icon: icons.profile },
];

export default function App() {
  const { loading: authLoading } = useAuth();
  const { matches, loading: dataLoading, authPrompt, setAuthPrompt } = useAppData();

  const [tab, setTab] = useState("map");
  const [view, setView] = useState({ name: "tab" });   // tab | match | league | create
  const [manualAuth, setManualAuth] = useState(false);
  // A shared link (?match=<id>) opens straight into that match once data lands.
  const [deepLinkId, setDeepLinkId] = useState(
    () => new URLSearchParams(window.location.search).get("match")
  );

  const openMatch = (match, matchTab = "overview") => {
    setDeepLinkId(null);
    setView({ name: "match", match, matchTab });
  };
  const openLeague = (league) => setView({ name: "league", league });
  const closeOverlay = () => { setDeepLinkId(null); setView({ name: "tab" }); };

  useEffect(() => {
    if (deepLinkId) window.history.replaceState({}, "", window.location.pathname);
  }, [deepLinkId]);

  // A blocked write (a guest tapping Join) raises the sign-in screen.
  const showAuth = manualAuth || !!authPrompt;
  const dismissAuth = () => { setManualAuth(false); setAuthPrompt(null); };

  const deepLinked = deepLinkId && matches.find((m) => String(m.id) === deepLinkId);
  const current = deepLinked && view.name === "tab"
    ? { name: "match", match: deepLinked, matchTab: "overview" }
    : view;

  if (authLoading || dataLoading) {
    return (
      <>
        <style>{globalStyles}</style>
        <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3, marginBottom: 8 }}>
              PLAY<span style={{ color: theme.accent }}>PULSE</span>
            </div>
            <div style={{ color: theme.textMuted, fontSize: 13 }}>Finding games near you…</div>
          </div>
        </div>
      </>
    );
  }

  if (showAuth) {
    return (
      <>
        <style>{globalStyles}</style>
        <div className="app-shell">
          <AuthScreen reason={authPrompt} onClose={dismissAuth} />
        </div>
      </>
    );
  }

  const renderTab = () => {
    switch (tab) {
      case "map":       return <MapScreen onOpenMatch={openMatch} />;
      case "matches":   return <MatchesScreen onOpenMatch={openMatch} onOpenLeague={openLeague} />;
      case "portfolio": return <PortfolioScreen />;
      case "profile":   return <ProfileScreen onSignIn={() => setManualAuth(true)} />;
      default:          return <MapScreen onOpenMatch={openMatch} />;
    }
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div className="app-shell">
        {current.name === "match" && (
          <MatchDetailScreen
            key={`${current.match.id}-${current.matchTab}`}
            match={current.match}
            initialTab={current.matchTab}
            onBack={closeOverlay}
          />
        )}
        {current.name === "league" && (
          <LeagueDetailScreen league={current.league} onBack={closeOverlay} onOpenMatch={openMatch} />
        )}
        {current.name === "create" && (
          <CreateScreen onDone={closeOverlay} onOpenMatch={(m) => openMatch(m)} />
        )}
        {current.name === "tab" && renderTab()}

        {current.name === "tab" && (
          <nav className="bottom-nav">
            {NAV.map((item) =>
              item.id === "create" ? (
                <div key="fab" className="nav-fab" onClick={() => setView({ name: "create" })}>
                  <button className="fab-btn" aria-label="Post a match">{icons.plus}</button>
                </div>
              ) : (
                <button
                  key={item.id}
                  className={`nav-item ${tab === item.id ? "active" : ""}`}
                  onClick={() => setTab(item.id)}
                  aria-current={tab === item.id ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )
            )}
          </nav>
        )}

        <Toast />
      </div>
    </>
  );
}
