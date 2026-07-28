import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { theme } from "../styles/theme";

/** Turns Supabase auth errors into something a player can act on. */
const explain = (message = "") => {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid_credentials")) return "Wrong email or password. Try again.";
  if (m.includes("email not confirmed") || m.includes("not confirmed")) return "confirm";
  if (m.includes("rate limit") || m.includes("over_email_send")) return "Too many attempts just now. Wait a couple of minutes and try again.";
  if (m.includes("already registered") || m.includes("already exists")) return "That email already has an account — sign in instead.";
  if (m.includes("password") && m.includes("6")) return "Password needs to be at least 6 characters.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Can't reach the server. Check your connection.";
  return message || "Something went wrong. Try again.";
};

const AuthScreen = ({ reason, onClose }) => {
  const { signIn, signUp, resendConfirmation } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const switchMode = (next) => {
    setMode(next); setError(""); setSuccess(""); setNeedsConfirm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setNeedsConfirm(false);

    if (mode === "signup" && !username.trim()) { setError("Pick a username."); return; }
    if (password.length < 6) { setError("Password needs to be at least 6 characters."); return; }

    setLoading(true);

    if (mode === "login") {
      const { error: err } = await signIn(email.trim(), password);
      setLoading(false);
      if (err) {
        const readable = explain(err.message);
        if (readable === "confirm") {
          setNeedsConfirm(true);
          setError("Your email isn't confirmed yet. Check your inbox and spam folder for the link.");
        } else setError(readable);
        return;
      }
      onClose();   // session lands via onAuthStateChange
      return;
    }

    const { error: err, needsConfirmation } = await signUp(email.trim(), password, username.trim());
    setLoading(false);

    if (err) {
      const readable = explain(err.message);
      setError(readable === "confirm" ? "Check your inbox to confirm your email." : readable);
      if (readable.includes("sign in instead")) setMode("login");
      return;
    }

    if (needsConfirmation) {
      setNeedsConfirm(true);
      setMode("login");
      setSuccess("Account created. Confirm your email, then sign in.");
      return;
    }

    onClose();     // confirmation off — straight into the app
  };

  const handleResend = async () => {
    if (!email.trim()) { setError("Type your email above first, then tap resend."); return; }
    setResending(true);
    const { error: err } = await resendConfirmation(email.trim());
    setResending(false);
    if (err) setError(explain(err.message));
    else { setSuccess("Confirmation email sent. Check your inbox."); setNeedsConfirm(false); }
  };

  return (
    <div className="auth-screen">
      <div className="auth-logo">PLAY<span style={{ color: theme.accent }}>PULSE</span></div>
      <div className="auth-sub">{reason ? `Sign in to ${reason}` : "Find a game. Join in. Play now."}</div>

      <div className="auth-card">
        <div className="auth-toggle">
          <button type="button" className={`auth-toggle-btn ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>Sign in</button>
          <button type="button" className={`auth-toggle-btn ${mode === "signup" ? "active" : ""}`} onClick={() => switchMode("signup")}>Create account</button>
        </div>

        {error && (
          <div className="auth-error">
            ⚠ {error}
            {needsConfirm && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="submit-btn"
                style={{ marginTop: 10, padding: 10, fontSize: 12, boxShadow: "none" }}
              >
                {resending ? "Sending…" : "📧 Resend confirmation email"}
              </button>
            )}
          </div>
        )}

        {success && <div className="auth-success">✓ {success}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="form-group">
              <label className="form-label" htmlFor="au">Username</label>
              <input id="au" className="form-input" placeholder="e.g. arjun_s" value={username}
                autoComplete="username" onChange={(e) => setUsername(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="ae">Email</label>
            <input id="ae" className="form-input" type="email" placeholder="you@email.com" value={email}
              autoComplete="email" onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ap">Password</label>
            <input id="ap" className="form-input" type="password" placeholder="At least 6 characters" value={password}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button className="submit-btn" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><span className="spinner" /> Please wait…</> : mode === "login" ? "Sign in →" : "Create account →"}
          </button>
        </form>
      </div>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          type="button"
          onClick={onClose}
          style={{ background: "none", border: "none", color: theme.textMuted, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
        >
          Keep browsing as a guest →
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: theme.textDim, lineHeight: 1.6 }}>
        By continuing you agree to PlayPulse's Terms &amp; Privacy Policy
      </div>
    </div>
  );
};

export default AuthScreen;
