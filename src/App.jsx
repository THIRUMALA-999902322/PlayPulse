import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { globalStyles, theme } from "./styles/theme";

import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import ExploreScreen from "./screens/ExploreScreen";
import CreateScreen from "./screens/CreateScreen";
import ChatScreen from "./screens/ChatScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MatchDetailScreen from "./screens/MatchDetailScreen";

const icons = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  explore: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

const navItems = [
  { id: "home", label: "Home" },
  { id: "explore", label: "Explore" },
  { id: null, label: "Post" },
  { id: "chat", label: "Chat" },
  { id: "profile", label: "Me" },
];

export default function App() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState("home");
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleMatchClick = (m) => {
    setSelectedMatch(m);
    setScreen("matchDetail");
  };

  const handleBack = () => {
    setSelectedMatch(null);
    setScreen("home");
  };

  const renderScreen = () => {
    switch (screen) {
      case "home":        return <HomeScreen onMatchClick={handleMatchClick} />;
      case "explore":     return <ExploreScreen onMatchClick={handleMatchClick} />;
      case "create":      return <CreateScreen />;
      case "chat":        return <ChatScreen />;
      case "profile":     return <ProfileScreen />;
      case "matchDetail": return <MatchDetailScreen match={selectedMatch} onBack={handleBack} />;
      default:            return <HomeScreen onMatchClick={handleMatchClick} />;
    }
  };

  if (loading) {
    return (
      <>
        <style>{globalStyles}</style>
        <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3, marginBottom: 8 }}>
              PLAY<span style={{ color: theme.accent }}>PULSE</span>
            </div>
            <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{globalStyles}</style>
        <div className="app-shell">
          <AuthScreen />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div className="app-shell">
        {renderScreen()}

        {screen !== "matchDetail" && (
          <nav className="bottom-nav">
            {navItems.map((item) => {
              if (!item.id) {
                return (
                  <div key="fab" className="nav-fab" onClick={() => setScreen("create")}>
                    <button className="fab-btn" style={{ color: theme.bg }}>
                      {icons.plus}
                    </button>
                  </div>
                );
              }
              const iconMap = { home: icons.home, explore: icons.explore, chat: icons.chat, profile: icons.profile };
              return (
                <button key={item.id} className={`nav-item ${screen === item.id ? "active" : ""}`} onClick={() => setScreen(item.id)}>
                  {iconMap[item.id]}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </>
  );
}
