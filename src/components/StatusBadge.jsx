const StatusBadge = ({ status }) => {
  const cfg = {
    live: { cls: "status-live", label: "LIVE", dot: true },
    open: { cls: "status-open", label: "OPEN" },
    soon: { cls: "status-soon", label: "SOON" },
    full: { cls: "status-full", label: "FULL" },
  }[status] || { cls: "status-open", label: status?.toUpperCase() };

  return (
    <span className={`match-status ${cfg.cls}`}>
      {cfg.dot && <span className="live-dot" />}
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
