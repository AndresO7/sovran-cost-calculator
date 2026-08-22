import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "#f8f6f3",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-bodoni)",
          fontSize: "clamp(30px, 5vw, 44px)",
          fontWeight: 400,
          letterSpacing: "0.01em",
          color: "#1a1916",
          marginBottom: 10,
        }}
      >
        SOVRAN
      </h1>
      <p
        style={{
          fontFamily: "var(--font-outfit)",
          fontWeight: 300,
          fontSize: 14,
          color: "rgba(26,25,22,0.55)",
          marginBottom: 42,
          textAlign: "center",
          maxWidth: 340,
        }}
      >
        Sign in to design your extension and keep every version you create.
      </p>

      {error === "google" && (
        <p style={{ color: "#8a3a3a", fontSize: 13, marginBottom: 18 }}>
          Google sign-in didn&apos;t complete. Please try again.
        </p>
      )}
      {error === "confirm" && (
        <p style={{ color: "#8a3a3a", fontSize: 13, marginBottom: 18 }}>
          That confirmation link has expired. Sign in to get a new one.
        </p>
      )}

      <LoginForm next={next ?? "/"} />
    </main>
  );
}
