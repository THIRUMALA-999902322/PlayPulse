const CONFIG = {
  live:      { cls: "status-live",      label: "LIVE", dot: true },
  open:      { cls: "status-open",      label: "OPEN" },
  soon:      { cls: "status-soon",      label: "SOON" },
  full:      { cls: "status-full",      label: "FULL" },
  practice:  { cls: "status-practice",  label: "PRACTICE" },
  cancelled: { cls: "status-cancelled", label: "CANCELLED" },
  ended:     { cls: "status-full",      label: "ENDED" },
};

const StatusBadge = ({ status }) => {
  const cfg = CONFIG[status] || { cls: "status-open", label: String(status || "open").toUpperCase() };
  return (
    <span className={`match-status ${cfg.cls}`}>
      {cfg.dot && <span className="live-dot" />}
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
