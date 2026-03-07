import { useEffect } from "react";
import { theme } from "../styles/theme";

const Toast = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: { bg: theme.accent, color: theme.bg },
    error:   { bg: theme.danger, color: "#fff" },
    info:    { bg: theme.bgElevated, color: theme.text, border: `1px solid ${theme.borderBright}` },
    warning: { bg: theme.warning, color: theme.bg },
  };

  const s = styles[type] || styles.info;

  return (
    <div style={{
      position: "fixed",
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      background: s.bg,
      color: s.color,
      border: s.border || "none",
      padding: "12px 22px",
      borderRadius: 14,
      fontSize: 13,
      fontWeight: 600,
      zIndex: 9999,
      boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
      fontFamily: "Outfit, sans-serif",
      display: "flex",
      gap: 8,
      alignItems: "center",
      maxWidth: "calc(100vw - 40px)",
      textAlign: "center",
      whiteSpace: "pre-line",
      animation: "toastIn 0.25s ease",
      cursor: "pointer",
    }} onClick={onClose}>
      {message}
    </div>
  );
};

export default Toast;
