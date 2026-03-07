import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { theme } from "../styles/theme";

const AuthScreen = ({ onGuest }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResend, setShowResend] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setShowResend(false);
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed") || error.message.toLowerCase().includes("not confirmed")) {
          setError("Your email isn't confirmed yet. Check your inbox (or spam folder) and click the confirmation link.");
          setShowResend(true);
        } else if (error.message.includes("Invalid login") || error.message.includes("invalid_credentials") || error.message.toLowerCase().includes("wrong")) {
          setError("Wrong email or password. Try again.");
        } else {
          setError(error.message);
        }
      }
    } else {
      if (!username.trim()) {
        setError("Username is required");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username);
      if (error) {
        if (error.message.includes("rate limit") || error.message.includes("over_email_send_rate_limit")) {
          setError("Too many attempts. Please wait a few minutes and try again.");
        } else if (error.message.includes("already registered") || error.message.includes("already exists")) {
          setError("This email is already registered. Try signing in instead.");
          setMode("login");
        } else {
          setError(error.message);
        }
      } else {
        setSuccess("Account created! Check your email for a confirmation link, then sign in.");
        setMode("login");
      }
    }

    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Enter your email address above, then click Resend.");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      setError("Couldn't resend email: " + error.message);
    } else {
      setSuccess("Confirmation email sent! Check your inbox.");
      setShowResend(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        PLAY<span style={{ color: theme.accent }}>PULSE</span>
      </div>
      <div className="auth-sub">Find pickup games near you</div>

      <div className="auth-card">
        <div className="auth-toggle">
          <button
            className={`auth-toggle-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); setSuccess(""); setShowResend(false); }}
          >
            Sign In
          </button>
          <button
            className={`auth-toggle-btn ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setError(""); setSuccess(""); setShowResend(false); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="auth-error">
            ⚠ {error}
            {showResend && (
              <button
                onClick={handleResendConfirmation}
                disabled={resending}
                style={{
                  display: "block", marginTop: 10,
                  background: theme.accent, color: theme.bg,
                  border: "none", borderRadius: 8, padding: "8px 16px",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "Outfit, sans-serif", width: "100%",
                }}
              >
                {resending ? "Sending..." : "📧 Resend Confirmation Email"}
              </button>
            )}
          </div>
        )}

        {success && (
          <div style={{
            background: "#00F5A015", border: `1px solid ${theme.accent}30`,
            borderRadius: 10, padding: "10px 14px", fontSize: 12,
            color: theme.accent, marginBottom: 16,
          }}>
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

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          onClick={onGuest}
          style={{ background: "none", border: "none", color: theme.textMuted, fontSize: 13, cursor: "pointer", textDecoration: "underline", fontFamily: "Outfit, sans-serif" }}
        >
          Browse as Guest →
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: theme.textDim }}>
        By continuing you agree to PlayPulse's Terms & Privacy Policy
      </div>
    </div>
  );
};

export default AuthScreen;
