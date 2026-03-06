import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { theme } from "../styles/theme";

const AuthScreen = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      if (!username.trim()) {
        setError("Username is required");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username);
      if (error) setError(error.message);
      else setSuccess("Account created! Check your email to confirm.");
    }

    setLoading(false);
  };

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        PLAY<span style={{ color: theme.accent }}>PULSE</span>
      </div>
      <div className="auth-sub">Find pickup games near you</div>

      <div className="auth-card">
        {/* Toggle */}
        <div className="auth-toggle">
          <button
            className={`auth-toggle-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
          >
            Sign In
          </button>
          <button
            className={`auth-toggle-btn ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
          >
            Create Account
          </button>
        </div>

        {error && <div className="auth-error">⚠ {error}</div>}
        {success && (
          <div style={{ background: "#00F5A015", border: `1px solid ${theme.accent}30`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: theme.accent, marginBottom: 16 }}>
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                placeholder="e.g. arjun_s"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button className="submit-btn" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>
      </div>

      <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: theme.textMuted }}>
        By continuing you agree to PlayPulse's Terms & Privacy Policy
      </div>
    </div>
  );
};

export default AuthScreen;
