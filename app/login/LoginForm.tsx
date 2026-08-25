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

/** La "G" oficial de Google, en sus cuatro colores de marca. */
function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // el letter-spacing del texto añade un hueco fantasma a la derecha;
            // el margen izquierdo del icono lo compensa para centrar el grupo
            gap: 10,
            paddingLeft: 2,
          }}
        >
          <GoogleMark />
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
