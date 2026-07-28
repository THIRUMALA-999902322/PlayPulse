import { useAppData } from "../hooks/useAppData";

const Toast = () => {
  const { toast, dismissToast } = useAppData();
  if (!toast) return null;

  return (
    <div
      className={`toast ${toast.type}`}
      role="status"
      onClick={dismissToast}
      style={{ cursor: "pointer" }}
    >
      {toast.message}
    </div>
  );
};

export default Toast;
