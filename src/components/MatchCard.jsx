import StatusBadge from "./StatusBadge";

const MatchCard = ({ match, onClick }) => {
  const { emoji, sport, status, title, distance, time, joined, max, players } = match;

  return (
    <div className="match-card" onClick={() => onClick(match)}>
      <div className="match-card-header">
        <div className="match-sport-badge">{emoji} {sport}</div>
        <StatusBadge status={status} />
      </div>
      <div className="match-title">{title}</div>
      <div className="match-meta">
        <div className="meta-item">📍 {distance}</div>
        <div className="meta-item">🕐 {time}</div>
        <div className="meta-item">👥 {joined}/{max}</div>
      </div>
      <div className="match-card-footer">
        <div className="players-row">
          {(players || []).slice(0, 4).map((p, i) => (
            <div key={i} className="player-avatar" style={{ background: p.color + "30", color: p.color }}>
              {p.letter}
            </div>
          ))}
          <span className="players-count">{joined} joined</span>
        </div>
        {status === "live"
          ? <button className="join-btn watching">Watch Live</button>
          : status === "full"
          ? <button className="join-btn full">Full</button>
          : <button className="join-btn">Join →</button>}
      </div>
    </div>
  );
};

export default MatchCard;
