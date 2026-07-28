import StatusBadge from "./StatusBadge";
import Avatar from "./Avatar";
import { useAppData } from "../hooks/useAppData";
import { displayStatus, distanceLabel, formatMatchTime, startsIn } from "../lib/format";
import { theme } from "../styles/theme";

const MatchCard = ({ match, onOpen }) => {
  const { joinedIds, joinMatch, roster, userPos } = useAppData();

  const isJoined = joinedIds.includes(match.id);
  const players = roster[match.id] || [];
  const isFull = match.joined >= match.max;
  const soon = startsIn(match.matchTime);
  const status = displayStatus(match);

  const kindSuffix = match.kind === "league" ? " · League" : match.kind === "practice" ? " · Practice" : "";

  const action = () => {
    if (status === "live") return <button className="join-btn watching" onClick={(e) => { e.stopPropagation(); onOpen(match, match.streamUrl ? "stream" : "overview"); }}>Watch Live</button>;
    if (status === "cancelled") return <button className="join-btn full" disabled>Cancelled</button>;
    if (status === "ended") return <button className="join-btn full" onClick={(e) => { e.stopPropagation(); onOpen(match, "score"); }}>Result</button>;
    if (isJoined) return <button className="join-btn joined" onClick={(e) => { e.stopPropagation(); onOpen(match, "checkin"); }}>✓ Joined</button>;
    if (isFull) return <button className="join-btn full" disabled>Full</button>;
    return <button className="join-btn" onClick={(e) => { e.stopPropagation(); joinMatch(match.id); }}>Join →</button>;
  };

  return (
    <div className="match-card" onClick={() => onOpen(match)}>
      <div className="match-card-header">
        <div className="match-sport-badge">{match.emoji} {match.sport}{kindSuffix}</div>
        <StatusBadge status={status} />
      </div>

      <div className="match-title">{match.title}</div>

      <div className="match-meta">
        <div className="meta-item">📍 {distanceLabel(userPos, match.lat, match.lng)}</div>
        <div className="meta-item">🕐 {formatMatchTime(match.matchTime)}</div>
        <div className="meta-item">👥 {match.joined}/{match.max}</div>
        <div className="meta-item">🎯 {match.skill}</div>
        {soon && status !== "cancelled" && (
          <div className="meta-item" style={{ color: theme.warning, fontWeight: 700 }}>⚡ Starts in {soon}</div>
        )}
      </div>

      <div className="match-card-footer">
        <div className="players-row">
          {players.slice(0, 4).map((p) => (
            <Avatar key={p.userId} name={p.username} className="player-avatar" size={24} />
          ))}
          <span className="players-count">{match.joined} joined</span>
        </div>
        {action()}
      </div>
    </div>
  );
};

export default MatchCard;
