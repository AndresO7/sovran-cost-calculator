"use client";

import { useActionState, useState } from "react";
import {
  AuthResult,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "./actions";

const field: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(26,25,22,0.15)",
  padding: "10px 2px",
  fontFamily: "var(--font-outfit)",
  fontWeight: 300,
  fontSize: 14,
  color: "#1a1916",
  outline: "none",
};

const primaryButton: React.CSSProperties = {
  width: "100%",
  marginTop: 28,
  padding: "13px 0",
  background: "#1a1916",
  color: "#f8f6f3",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-outfit)",
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
};

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signInWithPassword : signUpWithPassword;
  const [result, formAction, pending] = useActionState<AuthResult, FormData>(
    action,
    undefined
  );

  // el alta devuelve su aviso de confirmación por el mismo canal que los
  // errores, así que se distingue por el texto para no pintarlo en rojo
  const isNotice = result?.error.startsWith("Check");

  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          style={{
            ...primaryButton,
            marginTop: 0,
            background: "transparent",
            color: "#1a1916",
            border: "1px solid rgba(26,25,22,0.2)",
          }}
        >
          Continue with Google
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "26px 0 22px",
          color: "rgba(26,25,22,0.4)",
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ flex: 1, height: 1, background: "rgba(26,25,22,0.12)" }} />
        or
        <span style={{ flex: 1, height: 1, background: "rgba(26,25,22,0.12)" }} />
      </div>

      <form action={formAction}>
        <input type="hidden" name="next" value={next} />
        {mode === "signup" && (
          <input name="fullName" placeholder="Full name" style={field} autoComplete="name" />
        )}
        <input
          name="email"
          type="email"
          placeholder="Email"
          style={{ ...field, marginTop: mode === "signup" ? 18 : 0 }}
          autoComplete="email"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          style={{ ...field, marginTop: 18 }}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />

        {result?.error && (
          <p
            style={{
              marginTop: 16,
              fontSize: 13,
              fontFamily: "var(--font-outfit)",
              color: isNotice ? "rgba(26,25,22,0.6)" : "#8a3a3a",
            }}
          >
            {result.error}
          </p>
        )}

        <button type="submit" disabled={pending} style={primaryButton}>
          {pending ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        style={{
          marginTop: 22,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-outfit)",
          fontSize: 13,
          color: "rgba(26,25,22,0.55)",
          textDecoration: "underline",
          textUnderlineOffset: 4,
        }}
      >
        {mode === "signin"
          ? "No account yet? Create one"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
