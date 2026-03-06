import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { theme } from "../styles/theme";

const defaultMessages = {
  match: [
    { name: "Arjun S.", av: "A", color: "#00F5A0", text: "Everyone at the ground by 5:20 please, warm-up starts at 5:30", time: "4:48 PM", me: false },
    { name: "Rahul M.", av: "R", color: "#FFB800", text: "On my way! 5 mins away", time: "4:52 PM", me: false },
    { name: "You", av: "Y", color: "#A29BFE", text: "Already here, marking the pitch 🏏", time: "4:53 PM", me: true },
    { name: "Kiran D.", av: "K", color: "#FD79A8", text: "Can someone bring the cones? I forgot mine", time: "4:55 PM", me: false },
    { name: "Arjun S.", av: "A", color: "#00F5A0", text: "I've got cones, no worries", time: "4:56 PM", me: false },
  ],
  team: [
    { name: "Arjun S.", av: "A", color: "#00F5A0", text: "Team — batting order today: Rahul, Me, Kiran, Dev, Sam", time: "4:30 PM", me: false },
    { name: "Kiran D.", av: "K", color: "#FD79A8", text: "Can I bat at 3? I'm in form 🔥", time: "4:32 PM", me: false },
    { name: "You", av: "Y", color: "#A29BFE", text: "Fine with me, swap me to 4", time: "4:33 PM", me: true },
  ],
};

const ChatScreen = () => {
  const { user } = useAuth();
  const [chatType, setChatType] = useState("match");
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState(defaultMessages);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on mount and whenever tab switches
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 50);
  }, [chatType]);

  const sendMessage = () => {
    if (!inputVal.trim()) return;

    const newMsg = {
      name: "You",
      av: user?.email?.[0]?.toUpperCase() || "Y",
      color: "#A29BFE",
      text: inputVal,
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      me: true,
    };

    setMessages(prev => ({
      ...prev,
      [chatType]: [...prev[chatType], newMsg],
    }));

    setInputVal("");

    // Scroll to bottom
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const current = messages[chatType];

  return (
    <div className="screen">
      <div className="chat-header">
        <div style={{ flex: 1 }}>
          <div className="chat-title">Evening T10 Match</div>
          <div className="chat-sub">12 players · Today 5:30 PM</div>
        </div>
      </div>

      <div className="tabs" style={{ position: "sticky", top: 64, zIndex: 40, background: theme.bg }}>
        {[["match", "🌐 Match Chat"], ["team", "🔒 Team Chat"]].map(([k, l]) => (
          <button key={k} className={`tab ${chatType === k ? "active" : ""}`} onClick={() => setChatType(k)}>{l}</button>
        ))}
      </div>

      <div className="chat-messages">
        {current.map((m, i) => (
          <div key={i} className={`msg-row ${m.me ? "me" : ""}`}>
            {!m.me && (
              <div className="msg-av" style={{ background: m.color + "20", color: m.color }}>{m.av}</div>
            )}
            <div className="msg-bubble">
              {!m.me && <div className="msg-name">{m.name}</div>}
              <div className="msg-text">{m.text}</div>
              <div className="msg-time">{m.time}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Type a message..."
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="send-btn" onClick={sendMessage}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;
