import { useEffect } from "react";
import { theme } from "../styles/theme";

/** Bottom sheet used for notifications, confirmations and short forms. */
const Sheet = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-handle" />
        {title && (
          <div className="sheet-title">
            <div className="section-title">{title}</div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: 20, lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default Sheet;
