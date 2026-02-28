import { useMemo, useState } from "react";

export default function Auth({ supabase }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !busy;
  }, [email, password, busy]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const trimmed = email.trim();

      // First, attempt to sign up. If the user already exists, Supabase will
      // return an error we can safely ignore and fall back to sign-in.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmed,
        password,
      });

      if (!signUpError && signUpData?.session) {
        setMsg("Account created. You're in.");
        return;
      }

      // If the user is already registered or sign-up didn't produce a session,
      // try signing in with the same credentials.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (signInError) {
        const lower = signInError.message?.toLowerCase() || "";

        // Handle unconfirmed emails explicitly and resend the confirmation link.
        if (lower.includes("email not confirmed")) {
          const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email: trimmed,
          });

          if (resendError) {
            throw new Error(
              "Your email is not confirmed yet. Please use the confirmation link we already sent you."
            );
          }

          throw new Error(
            "Your email is not confirmed yet. We've sent you a new confirmation link."
          );
        }

        // Normalise common invalid-credentials message
        const message = lower.includes("invalid login credentials")
          ? "Wrong email or password."
          : signInError.message;
        throw new Error(message || "Auth error");
      }

      setMsg("Signed in.");
    } catch (e2) {
      setErr(e2?.message || "Auth error");
    } finally {
      setBusy(false);
    }
  }

  const C = {
    bg: "#080808",
    bg2: "#0d0d0d",
    border: "#1a1a1a",
    border2: "#222",
    text: "#C8C5BE",
    textHi: "#E8E4DC",
    textDim: "#555",
    accent: "#5B9CF6",
  };

  const card = {
    background: C.bg2,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: 20,
    width: 420,
    maxWidth: "100%",
  };

  const input = {
    width: "100%",
    background: "#0a0a0a",
    border: `1px solid ${C.border2}`,
    borderRadius: 6,
    color: C.textHi,
    padding: "10px 12px",
    fontSize: 13,
    outline: "none",
    lineHeight: 1.6,
    fontFamily: "inherit",
  };

  const btn = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 11,
    letterSpacing: 2,
    borderRadius: 6,
    border: `1px solid ${C.accent}`,
    background: canSubmit ? C.accent : "transparent",
    color: canSubmit ? "#080808" : "#444",
    textTransform: "uppercase",
    cursor: canSubmit ? "pointer" : "not-allowed",
    transition: "all .15s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.bg,
        color: C.text,
        padding: 22,
        fontFamily: "'IBM Plex Mono','Fira Code','Courier New',monospace",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        * { box-sizing:border-box; }
        button { font-family: inherit; }
      `}</style>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.textHi, letterSpacing: -0.5 }}>
            Continue
          </div>
        </div>

        <div style={{ fontSize: 11, color: "#666", lineHeight: 1.7, marginBottom: 16 }}>
          Sessions are persisted and refreshed automatically, so previously signed-up users remain valid over time.
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: C.textDim, marginBottom: 6, textTransform: "uppercase" }}>Email</div>
            <input value={email} onChange={e => setEmail(e.target.value)} style={input} autoComplete="email" />
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: C.textDim, marginBottom: 6, textTransform: "uppercase" }}>Password</div>
            <input value={password} onChange={e => setPassword(e.target.value)} style={input} type="password" autoComplete="current-password" />
          </div>

          {err && (
            <div style={{ padding: "10px 12px", background: "#1a0c0a", border: "1px solid #F0644944", borderRadius: 6, color: "#F06449", fontSize: 11, lineHeight: 1.6 }}>
              {err}
            </div>
          )}
          {msg && (
            <div style={{ padding: "10px 12px", background: "#081a0f", border: "1px solid #52D68A44", borderRadius: 6, color: "#52D68A", fontSize: 11, lineHeight: 1.6 }}>
              {msg}
            </div>
          )}

          <button type="submit" disabled={!canSubmit} style={btn}>
            {busy ? "Please wait…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
