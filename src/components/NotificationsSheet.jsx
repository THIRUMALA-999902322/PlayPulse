import Sheet from "./Sheet";
import { useAppData } from "../hooks/useAppData";
import { useAuth } from "../hooks/useAuth";
import { buildNotifications } from "../lib/notifications";
import { relativeTime } from "../lib/format";
import { tappable } from "../lib/a11y";
import { theme } from "../styles/theme";

const NotificationsSheet = ({ onClose, onOpenMatch }) => {
  const { matches, joinedIds } = useAppData();
  const { user } = useAuth();
  const items = buildNotifications(matches, joinedIds, user?.id);

  return (
    <Sheet title="Notifications" onClose={onClose}>
      {items.map((n) => (
        <div
          key={n.id}
          className="notif-row"
          {...(n.matchId
            ? tappable(() => { onOpenMatch(n.matchId); onClose(); }, `${n.title}: ${n.body}`)
            : {})}
          style={{ cursor: n.matchId ? "pointer" : "default" }}
        >
          <div
            className="achieve-icon"
            style={{ width: 34, height: 34, fontSize: 16, background: `${n.color}18`, border: `1px solid ${n.color}30` }}
          >
            {n.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{n.title}</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2, lineHeight: 1.5 }}>{n.body}</div>
          </div>
          <div style={{ fontSize: 10, color: theme.textDim, flexShrink: 0 }}>{relativeTime(n.time)}</div>
        </div>
      ))}
    </Sheet>
  );
};

export default NotificationsSheet;
